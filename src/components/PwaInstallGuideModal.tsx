import React from 'react';
import { X, Share2, MoreVertical, PlusSquare, CheckCircle2 } from 'lucide-react';
import duroodIcon from '../assets/images/durood_master_icon.png';

interface PwaInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallGuideModal: React.FC<PwaInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-urdu" dir="rtl">
      <div className="bg-emerald-950 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-400/40 relative overflow-hidden bg-islamic-pattern">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 transition-colors"
          title="بند کریں"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={duroodIcon}
            alt="Durood App Icon"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-amber-400/40 flex-shrink-0"
          />
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-amber-300">
              ایپ ہوم اسکرین پر شامل کریں
            </h3>
            <p className="text-xs text-emerald-200">
              جامعۃ المدینہ عطار منزل درودِ پاک مہم
            </p>
          </div>
        </div>

        {/* Instructions based on platform */}
        <div className="space-y-3 my-5 text-xs sm:text-sm text-slate-100 bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/50">
          {isIOS ? (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۱
                </span>
                <p>
                  سفاری (Safari) براؤزر میں نیچے موجود <strong>شیئر بٹن</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-amber-300" /> Share) پر ٹیپ کریں۔
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۲
                </span>
                <p>
                  تھوڑا نیچے سکرول کر کے <strong>'Add to Home Screen'</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-amber-300" />) کا انتخاب کریں۔
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۳
                </span>
                <p>
                  اوپر دائیں جانب <strong>'Add'</strong> پر کلک کر کے مکمل کریں۔
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۱
                </span>
                <p>
                  براؤزر کے اوپر یا نیچے دائیں جانب موجود <strong>تین نقطوں</strong> (<MoreVertical className="w-3.5 h-3.5 inline mx-0.5 text-amber-300" /> Menu) پر کلک کریں۔
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۲
                </span>
                <p>
                  مینو میں سے <strong>'Install app'</strong> یا <strong>'Add to Home screen'</strong> منتخب کریں۔
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  ۳
                </span>
                <p>
                  <strong>Install</strong> پر کلک کریں، ایپ آپ کے فون کی ہوم اسکرین پر آ جائے گی۔
                </p>
              </div>
            </>
          )}
        </div>

        {/* Benefits reminder */}
        <div className="flex items-center gap-2 text-[11px] text-emerald-300 mb-5 px-1">
          <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>انسٹالیشن کے بعد ایپ انٹرنیٹ کے بغیر بھی تیز رفتاری سے کھلتی ہے۔</span>
        </div>

        {/* Actions */}
        <div>
          <button
            onClick={onClose}
            className="w-full py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg transition-all text-center"
          >
            سمجھ گیا
          </button>
        </div>
      </div>
    </div>
  );
};
