import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  loginAdminUser,
  logoutAdminUser,
  verifyAdminStatus,
} from '../lib/adminAuth';
import { CampaignStats, JamiaClass, SubmissionItem, AdminUser, CampaignDocument } from '../types';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Trophy,
  School,
  Settings,
  Shield,
  Search,
  CheckCircle,
  Plus,
  Download,
  Target,
  Clock,
  Sparkles,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Mail,
  Lock,
  LogOut,
  Trash2,
  Users,
  GraduationCap,
  User,
  History,
  Archive,
  Calendar,
  Hourglass,
} from 'lucide-react';
import {
  createNewCampaign,
  resetCampaign,
  updateActiveCampaignTarget,
  deleteSubmissionAndUpdateCampaign,
  calculateStudentPerformance,
  getAllCampaigns,
  getAllHistoricalSubmissions,
  computeCampaignEndDateTime,
  calculateCampaignSchedule,
  CampaignScheduleParams,
} from '../lib/campaign';
import { formatUrduQuantity } from './HeroStats';

/**
 * Helper to compute responsive font size classes based on formatted number character length.
 * Guarantees numbers from 1,000 to 1,000,000,000+ remain completely within card boundaries
 * across 320px, 360px, 375px, 390px, 412px, tablets, and desktops.
 */
const getAdminMetricFontSize = (formattedNum: string): string => {
  const len = formattedNum.length;
  if (len >= 14) {
    // 10,000,000,000+
    return 'text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg';
  }
  if (len >= 11) {
    // 100,000,000 - 9,999,999,999 (e.g. 120,000,000 or 119,854,888 = 11 chars)
    return 'text-xs xs:text-[13px] sm:text-base md:text-lg lg:text-xl';
  }
  if (len >= 8) {
    // 1,000,000 - 99,999,999 (e.g. 12,000,000 = 10 chars, 1,200,000 = 9 chars)
    return 'text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl';
  }
  if (len >= 5) {
    // 10,000 - 999,999
    return 'text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl';
  }
  // 1 - 9,999
  return 'text-lg xs:text-xl sm:text-2xl md:text-3xl';
};

interface AdminDashboardProps {
  stats: CampaignStats;
  classes: JamiaClass[];
  submissions: SubmissionItem[];
  onStartNewCampaign?: (target: number, title?: string, scheduleParams?: CampaignScheduleParams) => void;
}

type AdminTab = 'dashboard' | 'submissions' | 'rankings' | 'classes' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  classes,
  submissions,
  onStartNewCampaign,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [searchSubQuery, setSearchSubQuery] = useState('');
  const [campaignTarget, setCampaignTarget] = useState(stats.campaignTarget);
  const [campaignTitle, setCampaignTitle] = useState(stats.title || 'ربیع الاول درودِ پاک مہم — جامعۃ المدینہ عطار منزل');
  const [campaignStartDate, setCampaignStartDate] = useState(
    stats.startDate || new Date().toISOString().split('T')[0]
  );
  const [campaignStartTime, setCampaignStartTime] = useState(
    stats.startTime || '08:00'
  );
  const [campaignDurationDays, setCampaignDurationDays] = useState(
    stats.durationDays || 12
  );
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminRankTab, setAdminRankTab] = useState<'classes' | 'students'>('classes');
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  const [campaignsHistory, setCampaignsHistory] = useState<CampaignDocument[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [subScope, setSubScope] = useState<'active' | 'all'>('active');
  const [allHistoricalSubs, setAllHistoricalSubs] = useState<SubmissionItem[]>([]);
  const [isLoadingHistoricalSubs, setIsLoadingHistoricalSubs] = useState(false);

  // Dynamic automatic calculation of end date & time
  const computedEndInfo = React.useMemo(() => {
    return computeCampaignEndDateTime(
      campaignStartDate,
      campaignStartTime,
      campaignDurationDays
    );
  }, [campaignStartDate, campaignStartTime, campaignDurationDays]);

  const schedulePreview = React.useMemo(() => {
    return calculateCampaignSchedule({
      startDate: campaignStartDate,
      startTime: campaignStartTime,
      durationDays: campaignDurationDays,
      endDate: computedEndInfo.endDate,
      endTime: computedEndInfo.endTime,
    });
  }, [campaignStartDate, campaignStartTime, campaignDurationDays, computedEndInfo]);

  const dailyTrendData = React.useMemo(() => {
    const result: { day: string; count: number }[] = [];
    const now = new Date();
    const dayLabels = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayLabels[d.getDay()];

      let dayCount = 0;
      submissions.forEach((sub) => {
        if (sub.submittedAt && sub.submittedAt.startsWith(dateStr)) {
          dayCount += sub.count || sub.duroodCount || 0;
        }
      });

      result.push({
        day: dayName,
        count: dayCount,
      });
    }

    return result;
  }, [submissions]);

  const maxTrendCount = Math.max(1, ...dailyTrendData.map((d) => d.count));

  const fetchCampaignsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const list = await getAllCampaigns();
      setCampaignsHistory(list);
    } catch (err) {
      console.warn('Error fetching campaigns history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchAllHistoricalSubmissions = async () => {
    setIsLoadingHistoricalSubs(true);
    try {
      const list = await getAllHistoricalSubmissions();
      setAllHistoricalSubs(list);
    } catch (err) {
      console.warn('Error fetching historical submissions:', err);
    } finally {
      setIsLoadingHistoricalSubs(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'settings') {
      fetchCampaignsHistory();
    } else if (activeAdminTab === 'submissions' && subScope === 'all') {
      fetchAllHistoricalSubmissions();
    }
  }, [activeAdminTab, subScope]);

  const [showResetModal, setShowResetModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState<SubmissionItem | null>(null);

  const handleDeleteSubmission = (sub: SubmissionItem) => {
    if (!sub.id) return;
    setSubToDelete(sub);
  };

  const confirmDeleteSubmission = async () => {
    if (!subToDelete?.id) return;
    setDeletingSubId(subToDelete.id);
    try {
      await deleteSubmissionAndUpdateCampaign(subToDelete.id);
      setSubToDelete(null);
      if (subScope === 'all') {
        fetchAllHistoricalSubmissions();
      }
    } catch (err: any) {
      console.error('Error deleting submission:', err);
      alert(`اندراج حذف نہیں ہو سکا: ${err?.message || err}`);
    } finally {
      setDeletingSubId(null);
    }
  };

  const studentPerformanceList = calculateStudentPerformance(submissions);

  useEffect(() => {
    if (stats.campaignTarget !== undefined) {
      setCampaignTarget(stats.campaignTarget);
    }
    if (stats.title) {
      setCampaignTitle(stats.title);
    }
    if (stats.startDate) {
      setCampaignStartDate(stats.startDate);
    }
    if (stats.startTime) {
      setCampaignStartTime(stats.startTime);
    }
    if (stats.durationDays) {
      setCampaignDurationDays(stats.durationDays);
    }
  }, [stats.campaignTarget, stats.title, stats.startDate, stats.startTime, stats.durationDays]);

  // Admin Auth States
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        const verification = await verifyAdminStatus(user);
        if (verification.isAdmin && verification.adminData) {
          setCurrentAdmin(verification.adminData);
        } else {
          setCurrentAdmin(null);
        }
      } else {
        setCurrentAdmin(null);
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const { adminData } = await loginAdminUser(email, password);
      setCurrentAdmin(adminData);
      setPassword('');
    } catch (err: any) {
      console.error('Admin login error:', err);
      const msg = err?.message || err?.code || String(err);
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await logoutAdminUser();
    setCurrentAdmin(null);
  };

  const handleSaveCampaignSettings = async () => {
    setIsSaving(true);
    try {
      const scheduleParams: CampaignScheduleParams = {
        startDate: campaignStartDate,
        startTime: campaignStartTime,
        durationDays: campaignDurationDays,
        endDate: computedEndInfo.endDate,
        endTime: computedEndInfo.endTime,
      };

      await updateActiveCampaignTarget(campaignTarget, campaignTitle, scheduleParams);
      if (onStartNewCampaign) {
        onStartNewCampaign(campaignTarget, campaignTitle, scheduleParams);
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      fetchCampaignsHistory();
    } catch (err) {
      console.error('Error updating campaign target and schedule in Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenResetModal = () => {
    setResetMessage(null);
    setShowResetModal(true);
  };

  const executeResetCampaign = async () => {
    setIsResetting(true);
    setResetMessage(null);

    try {
      const scheduleParams: CampaignScheduleParams = {
        startDate: campaignStartDate,
        startTime: campaignStartTime,
        durationDays: campaignDurationDays,
        endDate: computedEndInfo.endDate,
        endTime: computedEndInfo.endTime,
      };

      const newDoc = await resetCampaign(campaignTarget, campaignTitle, scheduleParams);
      if (onStartNewCampaign) {
        onStartNewCampaign(newDoc.target, newDoc.title, scheduleParams);
      }
      setResetMessage({
        type: 'success',
        text: 'نئی مہم کامیابی سے شروع کر دی گئی ہے۔ تمام درود کی گنتی، درجہ بندی اور کارکردگی صفر کر دی گئی ہے اور پچھلا ریکارڈ محفوظ کر دیا گیا ہے۔',
      });
      setShowResetModal(false);
      fetchCampaignsHistory();
    } catch (err: any) {
      console.error('Error resetting campaign:', err);
      const errorMessage = err?.message || err?.code || String(err);
      setResetMessage({
        type: 'error',
        text: errorMessage,
      });
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  const displayedSubmissions = subScope === 'active' ? submissions : allHistoricalSubs;
  const filteredSubmissions = displayedSubmissions.filter((s) => {
    const q = searchSubQuery.toLowerCase();
    return (
      s.className.toLowerCase().includes(q) ||
      (s.studentName && s.studentName.toLowerCase().includes(q))
    );
  });

  if (isCheckingAuth) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-12 text-center space-y-4 font-urdu max-w-md mx-auto my-8">
        <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">
          ایڈمن پورٹل کی تصدیق کی جا رہی ہے...
        </p>
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden p-6 sm:p-10 font-urdu max-w-md mx-auto my-8">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-amber-400 p-3 mx-auto flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">ایڈمن پورٹل لاگ ان</h3>
          <p className="text-xs text-slate-500 font-bold">
            صرف مجاز ایڈمن اکاؤنٹس پورٹل میں داخل ہو سکتے ہیں
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ای میل آدرس (Email Address)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jamia.edu.pk"
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              پاس ورڈ (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
                dir="ltr"
              />
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-100 border border-rose-200 text-rose-900 text-xs font-bold space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                <div className="break-words w-full font-mono text-[11px]">{loginError}</div>
              </div>
              {loginError.includes('operation-not-allowed') && (
                <div className="text-[11px] text-rose-800 font-normal pt-1.5 border-t border-rose-200 font-urdu leading-relaxed">
                  فائر بیس پروجیکٹ میں <strong>Email/Password</strong> سائن ان فعال نہیں ہے۔ برائے مہربانی Firebase Console &gt; Authentication &gt; Sign-in method میں جا کر Email/Password کو فعال (Enable) کریں۔
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-emerald-950 hover:bg-emerald-900 text-amber-300 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 font-urdu disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 text-amber-400" />
            )}
            <span>لاگ ان کریں (Sign In as Admin)</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400 font-bold">
          سیکیورٹی کی وجہ سے صرف رجسٹرڈ ایڈمن اکاؤنٹس پورٹل تک رسائی حاصل کر سکتے ہیں۔
        </div>
      </div>
    );
  }

  return (

    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col md:flex-row min-h-auto md:min-h-[650px] font-urdu">
      {/* Mobile Navigation Bar (Mobile only: sleek, compact, sticky-friendly) */}
      <div className="md:hidden bg-emerald-950 text-emerald-100 p-2.5 sm:p-3 border-b border-emerald-900/60 bg-islamic-pattern">
        {/* Top mini-bar with admin name & signout */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-900/60 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="p-1 rounded-lg bg-amber-400 text-emerald-950 font-bold flex-shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-xs truncate block">{currentAdmin.name || 'منتظمِ اعلیٰ'}</span>
              <span className="text-[9px] text-amber-300 block">{currentAdmin.role || 'Super Admin'}</span>
            </div>
          </div>
          <button
            onClick={handleAdminLogout}
            className="px-2.5 py-1 rounded-lg bg-rose-900/70 hover:bg-rose-900 text-rose-200 text-[10px] font-bold flex items-center gap-1 border border-rose-800/60 transition-all font-urdu shrink-0 cursor-pointer"
          >
            <LogOut className="w-3 h-3 text-rose-300" />
            <span>لاگ آؤٹ</span>
          </button>
        </div>

        {/* Compact horizontal scrollable navigation pills */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {[
            { id: 'dashboard', label: 'جائزہ', icon: LayoutDashboard },
            { id: 'submissions', label: 'اندراجات لاگ', icon: FileSpreadsheet },
            { id: 'rankings', label: 'درجہ بندی', icon: Trophy },
            { id: 'classes', label: 'تمام درجات', icon: School },
            { id: 'settings', label: 'مہم ترتیبات', icon: Settings },
          ].map((item) => {
            const IconComp = item.icon;
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveAdminTab(item.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-emerald-950 shadow-sm'
                    : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white bg-emerald-900/40'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Desktop Admin Sidebar Navigation */}
      <aside className="hidden md:flex md:w-64 bg-emerald-950 text-emerald-100 p-4 border-l border-emerald-900/60 flex-col justify-between bg-islamic-pattern shrink-0">
        <div>
          {/* Admin Header Badge */}
          <div className="flex items-center gap-2.5 px-3 py-3 rounded-2xl bg-emerald-900/60 border border-emerald-800/80 mb-6">
            <div className="p-2 rounded-xl bg-amber-400 text-emerald-950 font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ایڈمن پورٹل
              </h3>
              <p className="text-[10px] text-amber-300">جامعۃ المدینہ عطار منزل</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveAdminTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'dashboard'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>جائزہ</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('submissions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'submissions'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>اندراجات لاگ</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('rankings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'rankings'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>درجہ بندی</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('classes')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'classes'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <School className="w-4 h-4" />
              <span>تمام درجات</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === 'settings'
                  ? 'bg-amber-500 text-emerald-950 shadow-md'
                  : 'text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>مہم کی ترتیبات</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="mt-8 pt-4 border-t border-emerald-900/80 text-[11px] text-emerald-300 space-y-2">
          <div>
            <p className="font-bold text-white">{currentAdmin.name || 'منتظمِ اعلیٰ'}</p>
            <p className="text-[10px] text-emerald-400 font-sans truncate" dir="ltr">{currentAdmin.email}</p>
            <span className="inline-block px-2 py-0.5 mt-1 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
              {currentAdmin.role || 'Super Admin'}
            </span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 border border-rose-800/60 transition-all font-urdu cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-300" />
            <span>لاگ آؤٹ (Sign Out)</span>
          </button>
        </div>
      </aside>

      {/* Main Content View Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 bg-slate-50 overflow-y-auto min-w-0">
        {/* Four Key Admin Metric Cards - Fully Responsive & Overflow-Safe */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 md:gap-4 mb-3.5 sm:mb-6">
          {/* Card 1: Total Submissions */}
          <div className="bg-white p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 min-w-0 gap-1">
              <span className="truncate">کل اندراجات</span>
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            </div>
            <div
              className={`font-extrabold text-slate-900 font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight my-0.5 ${getAdminMetricFontSize(stats.totalSubmissionsCount.toLocaleString())}`}
              title={stats.totalSubmissionsCount.toLocaleString()}
            >
              {stats.totalSubmissionsCount.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-0.5 truncate font-urdu">
              آج کے اندراجات
            </p>
          </div>

          {/* Card 2: Active Classes */}
          <div className="bg-white p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 min-w-0 gap-1">
              <span className="truncate">کل درجات</span>
              <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            </div>
            <div
              className={`font-extrabold text-slate-900 font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight my-0.5 ${getAdminMetricFontSize(String(stats.activeClassesCount))}`}
              title={String(stats.activeClassesCount)}
            >
              {stats.activeClassesCount}
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5 truncate font-urdu">
              شامل درجات
            </p>
          </div>

          {/* Card 3: Campaign Target */}
          <div className="bg-white p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 min-w-0 gap-1">
              <span className="truncate">کل مہم کا ہدف</span>
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
            </div>
            <div
              className={`font-extrabold text-slate-900 font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight my-0.5 ${getAdminMetricFontSize(stats.campaignTarget.toLocaleString())}`}
              title={`${stats.campaignTarget.toLocaleString()} (${formatUrduQuantity(stats.campaignTarget)} درود)`}
            >
              {stats.campaignTarget.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-[10px] text-amber-700 font-bold mt-0.5 truncate font-urdu">
              {formatUrduQuantity(stats.campaignTarget)} ہدف
            </p>
          </div>

          {/* Card 4: Remaining Target */}
          <div className="bg-white p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between min-w-0 w-full overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 min-w-0 gap-1">
              <span className="truncate">باقی ہدف</span>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            </div>
            <div
              className={`font-extrabold text-slate-900 font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight my-0.5 ${getAdminMetricFontSize(stats.remainingTarget.toLocaleString())}`}
              title={stats.remainingTarget.toLocaleString()}
            >
              {stats.remainingTarget.toLocaleString()}
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5 truncate font-urdu">
              باقی درودِ پاک
            </p>
          </div>
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-3.5 sm:space-y-5 md:space-y-6">
            {/* Daily Recitation Trend Visualizer */}
            <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    روزانہ کی پیش رفت کا چارٹ
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                    مہم کے دنوں میں پڑھے گئے درودِ پاک کا مجموعی گراف
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs font-bold rounded-lg border border-emerald-200 shrink-0">
                  گزشتہ 7 دن
                </span>
              </div>

              {/* Bar Chart Representation */}
              <div className="pt-2 sm:pt-4 pb-1">
                <div className="h-28 sm:h-36 md:h-40 flex items-end justify-between gap-1.5 sm:gap-3 md:gap-4 px-1 sm:px-2">
                  {dailyTrendData.map((d) => {
                    const heightPercent = d.count > 0 ? Math.round((d.count / maxTrendCount) * 100) : 6;
                    return (
                      <div
                        key={d.day}
                        className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end group min-w-0"
                      >
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap truncate max-w-full">
                          {d.count > 0 ? formatUrduQuantity(d.count) : '0'}
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-emerald-800 to-emerald-500 rounded-t-lg sm:rounded-t-xl group-hover:from-amber-500 group-hover:to-amber-400 transition-all duration-300 shadow-xs"
                          style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 truncate">
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
              <div className="bg-emerald-900 text-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs border border-emerald-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h5 className="font-bold text-xs sm:text-sm truncate">ڈیٹا ڈاؤن لوڈ کریں</h5>
                  <p className="text-[10px] sm:text-xs text-emerald-200 mt-0.5 truncate">
                    درودِ پاک کے تمام اندراجات کی رپورٹس
                  </p>
                </div>
                <button
                  onClick={() => alert('رپورٹ ڈاؤن لوڈ کی جا رہی ہے...')}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-400 text-emerald-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> ڈاؤن لوڈ
                </button>
              </div>

              <div className="bg-amber-50 text-amber-950 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs border border-amber-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h5 className="font-bold text-xs sm:text-sm truncate">نیا درجہ شامل کریں</h5>
                  <p className="text-[10px] sm:text-xs text-amber-800 mt-0.5 truncate">
                    جامعہ کا نیا شعبہ یا درجہ شامل کریں۔
                  </p>
                </div>
                <button
                  onClick={() => setActiveAdminTab('classes')}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-amber-700 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> درجہ شامل کریں
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Submissions Table */}
        {activeAdminTab === 'submissions' && (
          <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  تمام جمع شدہ درودِ پاک لاگ ({displayedSubmissions.length})
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  طُلاّب کے اندراجات کا مکمل ریکارڈ اور انتظام
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSubScope('active')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      subScope === 'active'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    موجودہ مہم ({submissions.length})
                  </button>
                  <button
                    onClick={() => setSubScope('all')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      subScope === 'all'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    تمام ریکارڈ ({allHistoricalSubs.length})
                  </button>
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchSubQuery}
                    onChange={(e) => setSearchSubQuery(e.target.value)}
                    placeholder="طالب علم یا درجہ تلاش کریں..."
                    className="w-full sm:w-auto pr-8 pl-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-urdu"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs border-collapse font-urdu">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4">شرکت کنندہ / طالب علم</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4">زمرہ / درجہ</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4">تعداد</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4">وقت</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4">حالت</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 text-center">کارروائی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold text-slate-900">
                        {sub.studentName && sub.studentName.trim() && sub.studentName !== 'undefined' && sub.studentName !== 'null' ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {sub.studentName.trim().charAt(0)}
                            </span>
                            <span className="truncate max-w-[110px] sm:max-w-none">{sub.studentName.trim()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">عام اندراج</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-bold text-slate-800 whitespace-nowrap">
                        {sub.className}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-mono font-extrabold text-emerald-800 tabular-nums whitespace-nowrap">
                        +{(sub.count || sub.duroodCount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-slate-400 font-mono text-[10px] sm:text-[11px] whitespace-nowrap">
                        {sub.timestamp}
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          تصدیق شدہ
                        </span>
                      </td>
                      <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteSubmission(sub)}
                          disabled={deletingSubId === sub.id}
                          title="اندراج حذف کریں"
                          className="p-1 sm:p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                        >
                          {deletingSubId === sub.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-slate-400 text-xs">
                  کوئی اندراج نہیں ملا۔
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Rankings View */}
        {activeAdminTab === 'rankings' && (
          <div className="space-y-3.5 sm:space-y-4">
            <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
                    {adminRankTab === 'classes'
                      ? 'مکمل شرکاء کی درجہ بندی'
                      : 'شرکاء کی انفرادی کارکردگی'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    {adminRankTab === 'classes'
                      ? 'ہر زمرے و درجے کے کل پڑھے گئے درودِ پاک کا شمار'
                      : `موجودہ مہم میں شامل تمام ${studentPerformanceList.length} شرکاء کا ریکارڈ`}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    onClick={() => setAdminRankTab('classes')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminRankTab === 'classes'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>زمرہ جات ({classes.length})</span>
                  </button>
                  <button
                    onClick={() => setAdminRankTab('students')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminRankTab === 'students'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>انفرادی کارکردگی ({studentPerformanceList.length})</span>
                  </button>
                </div>
              </div>

              {/* Class Rankings Sub-view */}
              {adminRankTab === 'classes' && (
                <div className="space-y-2 sm:space-y-3">
                  {classes.map((cls, idx) => (
                    <div
                      key={cls.id}
                      className="p-2.5 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-900 text-amber-300 font-bold text-[10px] sm:text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm font-urdu truncate">
                            {cls.name}
                          </h5>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="font-mono font-extrabold text-emerald-800 text-xs sm:text-sm tabular-nums">
                          {cls.totalDurood.toLocaleString()}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-400 font-urdu">کل درود</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Students Leaderboard Sub-view */}
              {adminRankTab === 'students' && (
                <div className="space-y-2 sm:space-y-3">
                  {studentPerformanceList.map((st, idx) => (
                    <div
                      key={`${st.studentName}_${st.className}_${idx}`}
                      className="p-2.5 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 min-w-0"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-bold text-[10px] sm:text-xs flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-900'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <h5 className="font-bold text-slate-900 text-xs sm:text-sm font-urdu truncate">
                              {st.studentName}
                            </h5>
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              {st.className}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                            کل اندراجات: {st.submissionCount}
                          </p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="font-mono font-extrabold text-emerald-800 text-xs sm:text-sm tabular-nums">
                          {st.totalDurood.toLocaleString()}
                        </span>
                        <span className="block text-[9px] sm:text-[10px] text-slate-400 font-urdu">کل درود</span>
                      </div>
                    </div>
                  ))}

                  {studentPerformanceList.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs font-urdu">
                      موجودہ مہم میں ابھی تک طلبہ کے انفرادی اندراجات شامل نہیں ہوئے۔
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Classes Directory */}
        {activeAdminTab === 'classes' && (
          <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  درجات کا انتظام
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                  {classes.length} جامعہ کے درجات شامل ہیں
                </p>
              </div>
              <button
                onClick={() => alert('نیا درجہ شامل کرنے کی سہولت')}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> نیا درجہ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 min-w-0"
                >
                  <div className="flex justify-between items-center min-w-0 gap-2">
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm font-urdu truncate">
                      {cls.name}
                    </h5>
                  </div>
                  <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-500 pt-2 border-t border-slate-200">
                    <span>مقام #{cls.rank}</span>
                    <span className="font-mono font-bold text-emerald-800 tabular-nums">
                      {cls.totalDurood.toLocaleString()} درود
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Settings Form */}
        {activeAdminTab === 'settings' && (
          <div className="bg-white p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-4 sm:space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 font-urdu">
                  مہم کی ترتیبات (Campaign Settings)
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 font-urdu">
                  مہم کا عنوان، ہدف، تاریخِ آغاز، وقت اور دورانیہ تبدیل کریں
                </p>
              </div>

              {/* Status Badge Preview */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {schedulePreview.status === 'upcoming' ? (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] sm:text-xs font-bold font-urdu">
                    آنے والی مہم
                  </span>
                ) : schedulePreview.status === 'expired' ? (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 text-[11px] sm:text-xs font-bold font-urdu">
                    مہم کا وقت مکمل
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] sm:text-xs font-bold font-urdu flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    مہم فعال ہے
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              {/* Campaign Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 font-urdu">
                  مہم کا عنوان (Campaign Title)
                </label>
                <input
                  type="text"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-urdu"
                  placeholder="مثال: ربیع الاول درودِ پاک مہم"
                />
              </div>

              {/* Campaign Target */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 font-urdu">
                    کل مہم کا ہدف (درودِ پاک)
                  </label>
                  <span className="text-xs font-bold text-emerald-800 font-urdu">
                    {formatUrduQuantity(campaignTarget)} درود
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={campaignTarget}
                  onChange={(e) => setCampaignTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Schedule Configuration Grid: Start Date, Start Time & Duration */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs font-urdu">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>مہم کا شیڈول اور دورانیہ (Schedule & Duration)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 font-urdu">
                      تاریخِ آغاز (Start Date)
                    </label>
                    <input
                      type="date"
                      value={campaignStartDate}
                      onChange={(e) => setCampaignStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Start Time */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 font-urdu">
                      وقتِ آغاز (Start Time)
                    </label>
                    <input
                      type="time"
                      value={campaignStartTime}
                      onChange={(e) => setCampaignStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Duration in Days */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-slate-600 font-urdu">
                      مہم کا دورانیہ (Duration in Days)
                    </label>
                    <span className="text-xs font-bold text-emerald-800 font-urdu">
                      {campaignDurationDays} دن
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={campaignDurationDays}
                    onChange={(e) => setCampaignDurationDays(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />

                  {/* Preset Quick Duration Buttons */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-urdu ml-1">فوری انتخاب:</span>
                    {[1, 3, 7, 12, 15, 20, 25, 30, 40].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setCampaignDurationDays(days)}
                        className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer font-urdu ${
                          campaignDurationDays === days
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        {days} دن
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Calculated End Date & Time Display Banner */}
                <div className="p-2.5 sm:p-3 bg-emerald-50/90 rounded-xl border border-emerald-200/90 space-y-1 text-xs text-emerald-950 font-urdu">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-900 text-[11px] sm:text-xs">
                      <Hourglass className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      خودکار حسابی تاریخِ اختتام:
                    </span>
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                      {computedEndInfo.endDate}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-emerald-850 font-medium">
                    {computedEndInfo.formattedEndUrdu}
                  </p>
                  {schedulePreview.timeStatusTextUrdu && (
                    <p className="text-[9px] sm:text-[10px] text-emerald-700 font-bold pt-0.5">
                      • {schedulePreview.timeStatusTextUrdu}
                    </p>
                  )}
                </div>
              </div>

              {/* Save Settings Button */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveCampaignSettings}
                className="w-full py-2.5 sm:py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 font-urdu disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
                <span>مہم کی ترتیبات محفوظ کریں</span>
              </button>

              {settingsSaved && (
                <div className="p-2.5 sm:p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-200 font-urdu">
                  ✓ مہم کی ترتیبات، ہدف اور شیڈول کامیابی سے محفوظ ہو گئے ہیں!
                </div>
              )}

              {/* Reset Campaign Section */}
              <div className="pt-4 sm:pt-6 border-t border-slate-200 space-y-2.5 sm:space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 font-urdu">مہم ری سیٹ کریں (Reset Campaign)</h5>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-urdu">
                    موجودہ مہم کے تمام درود کے اندراجات اور درجہ بندی کو صفر کر کے نیا شیڈول لاگو کریں
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleOpenResetModal}
                  className="w-full py-2.5 sm:py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 font-urdu disabled:opacity-50 cursor-pointer"
                >
                  {isResetting ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-white" />
                  )}
                  <span>مہم ری سیٹ کریں (Reset Campaign)</span>
                </button>

                {resetMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold text-center border font-urdu ${
                      resetMessage.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        : 'bg-rose-100 text-rose-900 border-rose-200'
                    }`}
                  >
                    {resetMessage.text}
                  </div>
                )}
              </div>

              {/* Historical Campaigns Record List */}
              <div className="pt-4 sm:pt-6 border-t border-slate-200 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 font-urdu flex items-center gap-1.5 truncate">
                      <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800 shrink-0" />
                      <span>تمام مہمات کا محفوظ ریکارڈ</span>
                    </h5>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-urdu truncate">
                      گزشتہ تمام مہمات کا ڈیٹا فائر بیس میں محفوظ رہتا ہے
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCampaignsHistory}
                    disabled={isLoadingHistory}
                    className="text-[10px] sm:text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-urdu shrink-0"
                  >
                    {isLoadingHistory ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    تازہ کریں
                  </button>
                </div>

                <div className="space-y-2">
                  {campaignsHistory.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 text-xs min-w-0 ${
                        c.isActive
                          ? 'bg-emerald-50/80 border-emerald-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5 text-right min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <span className="font-bold text-slate-900 font-urdu truncate">{c.title || 'مہم'}</span>
                          <span
                            className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              c.isActive
                                ? 'bg-emerald-800 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {c.isActive ? 'موجودہ فعال' : 'محفوظ شدہ'}
                          </span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate">
                          ID: {c.id} {c.durationDays ? `• ${c.durationDays} دن` : ''} {c.createdAt ? `• ${new Date(c.createdAt).toLocaleDateString('ur-PK')}` : ''}
                        </p>
                      </div>

                      <div className="text-left font-mono shrink-0">
                        <span className="font-bold text-emerald-800 text-xs sm:text-sm tabular-nums">
                          {(c.totalRecited || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-[9px] sm:text-[10px]"> / {(c.target || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}

                  {campaignsHistory.length === 0 && !isLoadingHistory && (
                    <div className="text-center py-4 text-xs text-slate-400 font-urdu">
                      کوئی ریکارڈ نہیں ملا۔
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reset Campaign Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 font-urdu text-right">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  نئی مہم شروع / ری سیٹ کرنے کی تصدیق
                </h3>
                <p className="text-xs text-slate-500">Confirm Campaign Reset</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-100 space-y-2.5 text-xs text-rose-950">
              <p className="font-bold">کیا آپ واقعی نئی مہم شروع کرنا چاہتے ہیں؟</p>
              <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-700">
                <li>
                  مہم کا عنوان: <span className="font-bold text-slate-900">{campaignTitle}</span>
                </li>
                <li>
                  کل ہدف: <span className="font-bold text-slate-900 font-mono">{campaignTarget.toLocaleString()}</span> درود
                </li>
                <li>
                  تاریخ و وقتِ آغاز: <span className="font-bold text-slate-900">{campaignStartDate} بوقت {campaignStartTime}</span>
                </li>
                <li>
                  دورانیہ: <span className="font-bold text-slate-900">{campaignDurationDays} دن</span>
                </li>
                <li>
                  حسابی تاریخِ اختتام: <span className="font-bold text-emerald-800">{computedEndInfo.formattedEndUrdu}</span>
                </li>
                <li>تمام درود کی گنتی اور درجات کی درجہ بندی 0 سے شروع ہوگی۔</li>
                <li>سابقہ تمام مہمات اور طُلاّب کے اندراجات فائر بیس میں محفوظ رہیں گے۔</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                منسوخ کریں (Cancel)
              </button>
              <button
                type="button"
                onClick={executeResetCampaign}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isResetting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <RotateCcw className="w-4 h-4 text-white" />
                )}
                <span>ہاں، نئی مہم شروع کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Submission Confirmation Modal */}
      {subToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 font-urdu text-right">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  اندراج حذف کرنے کی تصدیق
                </h3>
                <p className="text-xs text-slate-500">Confirm Deletion</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-800">
              <p>
                <span className="font-bold text-slate-600">طالب علم:</span>{' '}
                {subToDelete.studentName || 'نامعلوم'}
              </p>
              <p>
                <span className="font-bold text-slate-600">درجہ:</span> {subToDelete.className}
              </p>
              <p>
                <span className="font-bold text-slate-600">تعداد:</span>{' '}
                <span className="font-mono font-bold">
                  {(subToDelete.count || subToDelete.duroodCount || 0).toLocaleString()}
                </span>{' '}
                درود
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                حذف کرنے سے طالب علم، درجہ اور مہم کا مجموعہ خودکار طور پر درست ہو جائے گا۔
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubToDelete(null)}
                disabled={deletingSubId !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                منسوخ کریں
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubmission}
                disabled={deletingSubId !== null}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {deletingSubId !== null ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Trash2 className="w-4 h-4 text-white" />
                )}
                <span>حذف کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
