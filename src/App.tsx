import React, { useState, useEffect } from 'react';
import { ActiveTab, CampaignStats, JamiaClass, SubmissionItem } from './types';
import { INITIAL_CLASSES_DATA } from './mockData';
import {
  subscribeToCampaignStats,
  subscribeToSubmissionsAndClassTotals,
  mapDocToCampaignStats,
  normalizeDarjaName,
} from './lib/campaign';
import { Header } from './components/Header';
import { HeroStats, formatUrduQuantity } from './components/HeroStats';
import { DuroodCard } from './components/DuroodCard';
import { SubmitView } from './components/SubmitView';
import { RankingView } from './components/RankingView';
import { RecentActivity } from './components/RecentActivity';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNav } from './components/BottomNav';
import { PwaBanner } from './components/PwaBanner';
import { PwaInstallGuideModal } from './components/PwaInstallGuideModal';
import { Send, Sparkles, Moon, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState<boolean>(true);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [classes, setClasses] = useState<JamiaClass[]>(INITIAL_CLASSES_DATA);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [showPwaBanner, setShowPwaBanner] = useState(true);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Capture PWA installation events and standalone state
  useEffect(() => {
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      setPwaInstalled(true);
      setShowPwaBanner(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    const handleAppInstalled = () => {
      setPwaInstalled(true);
      setDeferredPrompt(null);
      setShowPwaBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Real-time Firestore active campaign statistics and class totals subscription
  useEffect(() => {
    let subUnsubscribe: (() => void) | null = null;
    setIsLoadingCampaign(true);

    const tAppStart = performance.now();

    const campaignUnsubscribe = subscribeToCampaignStats(
      (docData) => {
        // Render top campaign statistics IMMEDIATELY
        setStats((prevStats) => mapDocToCampaignStats(docData, prevStats));
        setIsLoadingCampaign(false);
        setCampaignError(null);

        const elapsed = (performance.now() - tAppStart).toFixed(1);
        console.log(`[Perf] Top campaign stats rendered in ${elapsed}ms`);

        const campaignId = docData.id || 'main';

        // Decouple secondary data fetch so it never blocks the top stats paint
        setTimeout(() => {
          if (subUnsubscribe) subUnsubscribe();
          subUnsubscribe = subscribeToSubmissionsAndClassTotals(
            campaignId,
            INITIAL_CLASSES_DATA,
            (campaignSubmissions, updatedClasses) => {
              setSubmissions(campaignSubmissions);
              setClasses(updatedClasses);
            }
          );
        }, 0);
      },
      (err) => {
        console.error('Failed to load active campaign:', err);
        setIsLoadingCampaign(false);
        setCampaignError('مہم کا ڈیٹا لوڈ نہیں ہو سکا۔ براہ کرم انٹرنیٹ کنکشن چیک کریں۔');
      }
    );

    return () => {
      campaignUnsubscribe();
      if (subUnsubscribe) subUnsubscribe();
    };
  }, []);

  // Handle new submission
  const handleNewSubmission = (newSub: SubmissionItem) => {
    // 1. Add to submissions list
    setSubmissions((prev) => [newSub, ...prev]);

    // 2. Update stats
    setStats((prevStats) => {
      if (!prevStats) return prevStats;
      const target = prevStats.campaignTarget;
      const newTotal = prevStats.totalRecited + newSub.count;
      const newRemaining = Math.max(0, target - newTotal);
      const newPercent =
        target > 0 ? Number(((newTotal / target) * 100).toFixed(1)) : 0;

      return {
        ...prevStats,
        totalRecited: newTotal,
        remainingTarget: newRemaining,
        progressPercentage: newPercent,
        totalSubmissionsCount: prevStats.totalSubmissionsCount + 1,
      };
    });

    // 3. Update Jamia Class total count
    setClasses((prevClasses) => {
      const normalized = normalizeDarjaName(newSub.className);
      const updated = prevClasses.map((cls) => {
        if (cls.name === normalized) {
          return {
            ...cls,
            totalDurood: cls.totalDurood + newSub.count,
          };
        }
        return cls;
      });
      updated.sort((a, b) => b.totalDurood - a.totalDurood);
      updated.forEach((cls, idx) => {
        cls.rank = idx + 1;
      });
      return updated;
    });
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setPwaInstalled(true);
          setShowPwaBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Error invoking native PWA prompt:', err);
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const safeAdminStats: CampaignStats = stats || {
    campaignTarget: 0,
    totalRecited: 0,
    remainingTarget: 0,
    progressPercentage: 0,
    totalSubmissionsCount: 0,
    activeClassesCount: 8,
    daysRemaining: 0,
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 pb-20 md:pb-10 font-urdu selection:bg-amber-200 selection:text-amber-900" dir="rtl">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pwaInstalled={pwaInstalled}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6">
        {/* PWA Prompt Banner */}
        {showPwaBanner && !pwaInstalled && (
          <PwaBanner
            onInstall={handleInstallPwa}
            onDismiss={() => setShowPwaBanner(false)}
          />
        )}

        {/* Campaign Error Banner if failed to load */}
        {campaignError && !stats && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-between text-xs sm:text-sm font-urdu shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{campaignError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors text-xs sm:text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>دوبارہ کوشش کریں</span>
            </button>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'home' && (
          <div className="space-y-3.5 sm:space-y-6 animate-fade-in">
            {/* Hero Section & Stats (Includes loading skeleton) */}
            <HeroStats
              stats={stats}
              isLoading={isLoadingCampaign}
              onOpenSubmit={() => setActiveTab('submit')}
            />

            {/* Durood Shareef Highlight Card */}
            <DuroodCard />

            {/* Big "Submit Durood" Action Button Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-emerald-950 shadow-xl border border-amber-300/80 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-right relative overflow-hidden font-urdu">
              <div className="space-y-1 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-emerald-950 text-amber-300 text-[11px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  آج کا حصہ ڈالیں
                </span>
                <h3 className="text-lg sm:text-3xl font-bold font-urdu">
                  کیا آپ نے آج درودِ پاک پڑھا؟
                </h3>
                <p className="text-xs sm:text-sm text-emerald-950/90 font-bold max-w-lg">
                  {stats && stats.campaignTarget > 0
                    ? `ابھی اپنے درودِ پاک کی تعداد جمع کریں اور اپنے جامعہ کے درجے کو آگے بڑھائیں تاکہ ${formatUrduQuantity(stats.campaignTarget)} کا مہم ہدف پورا ہو سکے!`
                    : 'ابھی اپنے درودِ پاک کی تعداد جمع کریں اور اپنے جامعہ کے درجے کو آگے بڑھائیں تاکہ مہم کا ہدف پورا ہو سکے!'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('submit')}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 group flex-shrink-0 border border-emerald-800 font-urdu"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
                <span>درود جمع کریں</span>
              </button>
            </div>

            {/* Class Ranking Preview (Top 3) */}
            <RankingView
              classes={classes}
              submissions={submissions}
              isCompact={true}
              onViewAll={() => setActiveTab('rankings')}
            />

            {/* Recent Submissions Feed */}
            <RecentActivity submissions={submissions} />
          </div>
        )}

        {/* View 2: Submit Page */}
        {activeTab === 'submit' && (
          <div className="animate-fade-in py-2">
            <SubmitView
              classes={classes}
              onSubmitDurood={handleNewSubmission}
              onBackToHome={() => setActiveTab('home')}
            />
          </div>
        )}

        {/* View 3: Rankings Page */}
        {activeTab === 'rankings' && (
          <div className="animate-fade-in py-2">
            <RankingView
              classes={classes}
              submissions={submissions}
              isCompact={false}
            />
          </div>
        )}

        {/* View 4: Admin Dashboard Page */}
        {activeTab === 'admin' && (
          <div className="animate-fade-in py-2">
            <AdminDashboard
              stats={safeAdminStats}
              classes={classes}
              submissions={submissions}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 mt-6 sm:mt-12 mb-16 sm:mb-0 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1.5 font-urdu">
        <div className="flex items-center justify-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
          <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500/20" />
          <span>ربیع الاول درودِ پاک مہم — جامعۃ المدینہ عطار منزل</span>
        </div>
        <p className="text-[11px] sm:text-xs">
          ربیع الاول المبارک • جامعۃ المدینہ عطار منزل
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* PWA Install Guide Modal */}
      <PwaInstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
