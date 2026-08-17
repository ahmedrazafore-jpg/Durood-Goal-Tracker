import React, { useState, useEffect } from 'react';
import { SubmissionItem } from '../types';
import { Activity, Clock, CheckCircle2, Search, X, Layers } from 'lucide-react';

interface RecentActivityProps {
  submissions: SubmissionItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ submissions }) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Main section displays strictly the latest 5 entries
  const latestFiveSubmissions = submissions.slice(0, 5);

  // Filtered submissions for the "See All" modal
  const filteredModalSubmissions = submissions.filter(
    (sub) =>
      sub.className.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      (sub.studentName &&
        sub.studentName.toLowerCase().includes(modalSearchQuery.toLowerCase()))
  );

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAllModal(false);
      }
    };
    if (showAllModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showAllModal]);

  const renderParticipantText = (sub: SubmissionItem) => {
    if (sub.className === 'استاذ') {
      return (
        <>
          <span className="text-emerald-900 font-extrabold">استاذ</span>
          {sub.studentName ? (
            <span className="text-slate-700 font-bold"> ({sub.studentName})</span>
          ) : (
            <span className="text-slate-600 font-medium"> محترم</span>
          )}
        </>
      );
    }
    if (sub.className === 'عوام') {
      return (
        <>
          <span className="text-emerald-900 font-extrabold">عوام</span>
          {sub.studentName ? (
            <span className="text-slate-700 font-bold"> ({sub.studentName})</span>
          ) : (
            <span className="text-slate-600 font-medium"> الناس</span>
          )}
        </>
      );
    }
    return (
      <>
        <span className="text-emerald-900 font-extrabold">{sub.className}</span>
        {sub.studentName ? (
          <span className="text-slate-600 font-medium"> ({sub.studentName})</span>
        ) : (
          ' کے ایک طالب علم'
        )}
      </>
    );
  };

  return (
    <>
      <section className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xl shadow-emerald-900/5 border border-emerald-100/80 space-y-2.5 sm:space-y-4 font-urdu">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-800 flex-shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 leading-normal py-0.5">
                تازہ ترین سرگرمی (لائیو فیڈ)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-normal">
                تمام شرکاء کے تازہ ترین 5 اندراجات
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 leading-normal">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-ping" />
            لائیو فیڈ
          </span>
        </div>

        {/* Latest 5 entries */}
        <div className="space-y-2 sm:space-y-2.5">
          {latestFiveSubmissions.map((sub, idx) => (
            <div
              key={sub.id || `${sub.className}_${sub.count}_${idx}`}
              className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between gap-2 sm:gap-3"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 leading-normal py-0.5">
                    {renderParticipantText(sub)}{' '}
                    نے{' '}
                    <span className="font-mono font-extrabold text-emerald-700">
                      {sub.count.toLocaleString()}
                    </span>{' '}
                    درود جمع کیے۔
                  </p>
                </div>
              </div>

              <div className="text-left flex-shrink-0">
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {sub.timestamp}
                </span>
              </div>
            </div>
          ))}

          {latestFiveSubmissions.length === 0 && (
            <div className="text-center py-5 sm:py-6 text-slate-400 text-xs font-urdu leading-normal">
              ابھی تک کوئی درود جمع نہیں ہوا ہے۔ پہلا درود آپ جمع کریں!
            </div>
          )}
        </div>

        {/* See All Button */}
        {submissions.length > 0 && (
          <div className="pt-0.5 sm:pt-1">
            <button
              onClick={() => setShowAllModal(true)}
              className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 text-xs sm:text-sm font-bold transition-all border border-emerald-200/90 flex items-center justify-center gap-2 shadow-sm group font-urdu leading-normal"
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
              <span className="py-0.5">
                تمام لائیو فیڈ سرگرمیاں دیکھیں ({submissions.length.toLocaleString()} کل اندراجات)
              </span>
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
            </button>
          </div>
        )}
      </section>

      {/* "See All" Full Live Feed History Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in font-urdu" dir="rtl">
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-emerald-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-normal py-0.5">
                      مکمل لائیو فیڈ تاریخچہ
                    </h3>
                    <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                      {submissions.length.toLocaleString()} اندراجات
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 leading-normal">
                    تمام شرکاء کی جانب سے اب تک کے تمام جمع شدہ درودِ پاک کی مکمل فہرست
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="زمرہ یا شرکت کنندہ کے نام سے تلاش کریں..."
                  className="w-full pr-9 pl-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-urdu leading-normal"
                />
              </div>
            </div>

            {/* Scrollable Submissions List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
              {filteredModalSubmissions.map((sub, idx) => (
                <div
                  key={sub.id || `modal_${sub.className}_${sub.count}_${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-normal py-0.5">
                        {renderParticipantText(sub)}{' '}
                        نے{' '}
                        <span className="font-mono font-extrabold text-emerald-700">
                          {sub.count.toLocaleString()}
                        </span>{' '}
                        درود جمع کیے۔
                      </p>
                    </div>
                  </div>

                  <div className="text-left flex-shrink-0">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {sub.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {filteredModalSubmissions.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs font-urdu leading-normal">
                  کوئی اندراج نہیں ملا۔
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium font-urdu leading-normal">
                ظاہر کردہ: {filteredModalSubmissions.length.toLocaleString()} / {submissions.length.toLocaleString()}
              </span>
              <button
                onClick={() => setShowAllModal(false)}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-sm font-urdu leading-normal"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
