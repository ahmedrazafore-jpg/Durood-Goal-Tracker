import React, { useState } from 'react';
import { JamiaClass, SubmissionItem } from '../types';
import { Sparkles, GraduationCap, Hash, CheckCircle, Send, ArrowRight, User, Loader2, BookOpen, Users, UserCheck } from 'lucide-react';
import { ensureAuth } from '../lib/firebase';
import { addSubmissionAndUpdateCampaign, DARJA_NAMES } from '../lib/campaign';

interface SubmitViewProps {
  classes: JamiaClass[];
  onSubmitDurood: (newSub: SubmissionItem) => void;
  onBackToHome?: () => void;
}

export type ParticipantCategory = 'student' | 'ustad' | 'awaam';

export const SubmitView: React.FC<SubmitViewProps> = ({
  classes,
  onSubmitDurood,
  onBackToHome,
}) => {
  const [participantCategory, setParticipantCategory] = useState<ParticipantCategory>('student');
  const [participantName, setParticipantName] = useState('');
  
  // Filter student darjas specifically from classes or DARJA_NAMES
  const studentDarjas = classes.filter(
    (cls) => (DARJA_NAMES as readonly string[]).includes(cls.name)
  );
  const [selectedStudentDarja, setSelectedStudentDarja] = useState(studentDarjas[0]?.name || 'اولیٰ');
  
  const [count, setCount] = useState<number | string>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<SubmissionItem | null>(null);

  const quickPills = [100, 500, 1000, 2500, 5000, 10000];

  // Resolve active category/class name
  const effectiveClassName =
    participantCategory === 'ustad'
      ? 'استاذ'
      : participantCategory === 'awaam'
      ? 'عوام'
      : selectedStudentDarja;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCount = Number(count);

    // Form Validation
    if (participantCategory === 'student' && !selectedStudentDarja.trim()) {
      setErrorMsg('جامعہ کے درجے کا انتخاب لازمی ہے۔');
      return;
    }
    if (!parsedCount || parsedCount <= 0) {
      setErrorMsg('پڑھے گئے درودِ پاک کی تعداد 0 سے زیادہ ہونی چاہیے۔');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setShowSuccessModal(false);

    try {
      await ensureAuth();

      const trimmedName = participantName.trim();
      const submissionData: Omit<SubmissionItem, 'id'> = {
        className: effectiveClassName,
        duroodCount: parsedCount,
        submittedAt: new Date().toISOString(),
        status: 'approved',
        count: parsedCount,
        timestamp: 'ابھی',
        verified: true,
      };

      if (trimmedName) {
        submissionData.studentName = trimmedName;
      }

      console.log('Saving submission and updating campaign in Firestore...', submissionData);

      // Save submission document and update campaign stats atomically
      const { docId } = await addSubmissionAndUpdateCampaign(submissionData);

      console.log('Submission saved with ID:', docId);

      const newSubmission: SubmissionItem = {
        id: docId,
        ...submissionData,
      };

      onSubmitDurood(newSubmission);
      setLastSubmitted(newSubmission);
      setShowSuccessModal(true);

      // Automatically clear the form after successful submission
      setParticipantName('');
      setCount(1000);
    } catch (err: any) {
      console.error('FIREBASE FIRESTORE WRITE ERROR:', err);
      setShowSuccessModal(false);
      setLastSubmitted(null);
      const code = err?.code || 'unknown-error';
      const message = err?.message || 'کوئی غیر متوقع خرابی پیش آئی';
      setErrorMsg(`اندراج محفوظ نہیں ہو سکا (Firebase Error [${code}]: ${message})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setLastSubmitted(null);
    if (onBackToHome) {
      onBackToHome();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 font-urdu">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden bg-islamic-pattern">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-bold mb-3 sm:mb-4 transition-all"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="leading-normal py-0.5">ڈیش بورڈ پر واپس جائیں</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex-shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-urdu leading-normal sm:leading-relaxed py-0.5 text-white">
              درودِ پاک کا اندراج کریں
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 mt-0.5 sm:mt-1 font-urdu leading-relaxed">
              طلبہ، استاذ یا عوام — اپنا زمرہ منتخب کریں اور پڑھے گئے درودِ پاک کا اندراج کریں۔
            </p>
          </div>
        </div>
      </div>

      {/* Main Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl shadow-emerald-900/5 border border-slate-200/80 space-y-5 sm:space-y-6"
      >
        {Boolean(errorMsg && errorMsg.trim()) && (
          <div className="p-3 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold font-urdu flex items-center justify-between gap-2 shadow-sm leading-normal">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold underline cursor-pointer shrink-0"
            >
              بند کریں
            </button>
          </div>
        )}

        {/* Section: Participant Category Selector */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 font-urdu leading-normal py-0.5">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>شرکت کنندہ کا زمرہ منتخب کریں <span className="text-rose-500">*</span></span>
            </label>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-urdu">
              استاذ | عوام
            </span>
          </div>

          {/* Category Selection Tabs / Buttons */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
            {/* 1. Student Option */}
            <button
              type="button"
              onClick={() => setParticipantCategory('student')}
              className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 font-urdu leading-normal ${
                participantCategory === 'student'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">طالب علم</span>
            </button>

            {/* 2. Ustad Option */}
            <button
              type="button"
              onClick={() => setParticipantCategory('ustad')}
              className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 font-urdu leading-normal ${
                participantCategory === 'ustad'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">استاذ</span>
            </button>

            {/* 3. Awaam Option */}
            <button
              type="button"
              onClick={() => setParticipantCategory('awaam')}
              className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 font-urdu leading-normal ${
                participantCategory === 'awaam'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">عوام</span>
            </button>
          </div>

          {/* Category Helper Info */}
          <div className="text-[11px] sm:text-xs text-slate-500 font-urdu leading-relaxed px-1">
            {participantCategory === 'student' && (
              <span className="text-emerald-800 font-semibold">
                جامعۃ المدینہ کے طالبعلم: اپنا مخصوص درجہ منتخب کریں۔
              </span>
            )}
            {participantCategory === 'ustad' && (
              <span className="text-emerald-800 font-semibold">
                محترم اساتذہ کرام: آپ کا درود براہ راست "استاذ" کے زمرے میں شامل ہوگا۔
              </span>
            )}
            {participantCategory === 'awaam' && (
              <span className="text-emerald-800 font-semibold">
                عوام الناس و عاشقانِ رسول: آپ کا درود براہ راست "عوام" کے زمرے میں شامل ہوگا۔
              </span>
            )}
          </div>
        </div>

        {/* Field 1: Name (Optional - adapts to category) */}
        <div className="space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 font-urdu leading-normal py-0.5">
            <User className="w-4 h-4 text-emerald-700" />
            <span>
              {participantCategory === 'student'
                ? 'طالب علم کا نام'
                : participantCategory === 'ustad'
                ? 'استاذ محترم کا نام'
                : 'شرکت کنندہ کا نام'}
            </span>
            <span className="text-slate-400 font-normal text-[11px]">(اختیاری)</span>
          </label>
          <input
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder={
              participantCategory === 'student'
                ? 'طالب علم کا نام درج کریں (اختیاری)'
                : participantCategory === 'ustad'
                ? 'استاذ محترم کا نام درج کریں (اختیاری)'
                : 'اپنا نام درج کریں (اختیاری)'
            }
            className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-urdu leading-normal"
          />
        </div>

        {/* Field 2: Jamia Class Selection (Shown ONLY for Students) */}
        {participantCategory === 'student' ? (
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 font-urdu leading-normal py-0.5">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              درجہ منتخب کریں <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStudentDarja}
              onChange={(e) => setSelectedStudentDarja(e.target.value)}
              className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all cursor-pointer font-urdu leading-normal"
            >
              {DARJA_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {participantCategory === 'ustad' ? (
                <BookOpen className="w-4 h-4 text-emerald-800" />
              ) : (
                <Users className="w-4 h-4 text-emerald-800" />
              )}
              <span className="text-xs sm:text-sm font-bold text-emerald-900 font-urdu leading-normal">
                مقررہ زمرہ:
              </span>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-800 text-white text-xs sm:text-sm font-extrabold font-urdu shadow-xs">
              {participantCategory === 'ustad' ? 'استاذ' : 'عوام'}
            </span>
          </div>
        )}

        {/* Field 3: Number of Durood Recited */}
        <div className="space-y-2.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between font-urdu leading-normal py-0.5">
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-emerald-700" />
              پڑھے گئے درود کی تعداد <span className="text-rose-500">*</span>
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              فوری انتخاب
            </span>
          </label>

          {/* Quick Select Preset Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setCount(pill)}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all border font-mono ${
                  Number(count) === pill
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md shadow-emerald-900/20 scale-105'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                +{pill.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <input
            type="number"
            min="1"
            required
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="تعداد درج کریں"
            className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
          />
        </div>

        {/* Large Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white text-sm sm:text-base font-bold shadow-lg shadow-emerald-900/30 hover:from-emerald-800 hover:to-emerald-950 transition-all flex items-center justify-center gap-2 group border border-emerald-600/40 font-urdu disabled:opacity-75 cursor-pointer leading-normal"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <span className="py-0.5">محفوظ ہو رہا ہے...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
              <span className="py-0.5">درود جمع کریں</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 font-medium font-urdu leading-relaxed py-0.5">
          اللہ تعالی آپ کی اس کاوش کو شرفِ قبولیت عطا فرمائے۔
        </p>
      </form>

      {/* Success Celebration Modal */}
      {showSuccessModal && lastSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in font-urdu">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-600 to-amber-500" />

            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800 ring-8 ring-emerald-50">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                ماشاء اللہ! درود جمع ہو گیا
              </span>
              <h3 className="text-xl font-bold text-slate-900 leading-normal py-0.5">
                جزاک اللہ خیراً!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                آپ کے درودِ پاک کا شمار کامیابی کے ساتھ{' '}
                <span className="font-bold text-emerald-900">{lastSubmitted.className}</span> کے زمرے میں شامل کر دیا گیا ہے۔
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-right space-y-2 text-xs sm:text-sm">
              {lastSubmitted.studentName && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">
                    {lastSubmitted.className === 'استاذ'
                      ? 'استاذ:'
                      : lastSubmitted.className === 'عوام'
                      ? 'شرکت کنندہ:'
                      : 'طالب علم:'}
                  </span>
                  <span className="font-extrabold text-slate-900">{lastSubmitted.studentName}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">
                  {lastSubmitted.className === 'استاذ' || lastSubmitted.className === 'عوام'
                    ? 'زمرہ:'
                    : 'درجہ:'}
                </span>
                <span className="font-extrabold text-emerald-900">{lastSubmitted.className}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-bold">جمع کردہ تعداد:</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-700">
                  +{(lastSubmitted.duroodCount || lastSubmitted.count).toLocaleString()} درود
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold shadow-md transition-all font-urdu cursor-pointer leading-normal"
            >
              بند کریں
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
