import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';

const DUROOD_ICON_PATH = '/assets/images/durood_master_icon.png';

interface PwaBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PwaBanner: React.FC<PwaBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-2xl p-4 shadow-lg border border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden bg-islamic-pattern font-urdu">
      <div className="flex items-center gap-3">
        <img
          src={DUROOD_ICON_PATH}
          alt="Durood App Icon"
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-xl object-cover shadow-md border border-amber-400/40 flex-shrink-0"
        />
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-amber-300">
              درودِ پاک مہم ایپ انسٹال کریں
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
              موبائل ایپ
            </span>
          </div>
          <p className="text-[11px] text-emerald-200 mt-0.5">
            فوری اور آسان رسائی کے لیے اپنے موبائل میں ہوم اسکرین پر شامل کریں۔
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onInstall}
          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" /> انسٹال کریں
        </button>
        <button
          onClick={onDismiss}
          className="p-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-emerald-200"
          title="بند کریں"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
