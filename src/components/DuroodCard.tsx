import React from 'react';
import { Sparkles } from 'lucide-react';

export const DuroodCard: React.FC = () => {
  const arabicText = "صَلَّى اللَّهُ عَلَى مُحَمَّدٍ";
  const urduTranslation = "اللہ تعالیٰ درود و سلام نازل فرمائے حضرت محمد ﷺ پر۔";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-xl sm:shadow-2xl border border-amber-500/30 bg-islamic-pattern">
      {/* Decorative Gold Corner Borders */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

      {/* Top Header Label */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-bold border border-amber-500/30 font-urdu">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
          <span>درودِ پاک</span>
        </div>
      </div>

      {/* Main Arabic Calligraphy Display */}
      <div className="text-center my-2 sm:my-4 py-3 sm:py-6 px-3 sm:px-4 bg-emerald-900/40 rounded-xl sm:rounded-2xl border border-amber-400/20 backdrop-blur-sm">
        <p className="font-arabic text-2xl sm:text-4xl md:text-5xl leading-relaxed text-amber-300 font-bold drop-shadow-md">
          {arabicText}
        </p>
      </div>

      {/* Simple Urdu Translation Below */}
      <div className="text-center max-w-2xl mx-auto pt-1 sm:pt-2 pb-0.5 sm:pb-1 font-urdu">
        <p className="text-xs sm:text-base text-emerald-100 font-medium leading-relaxed">
          "{urduTranslation}"
        </p>
      </div>
    </section>
  );
};
