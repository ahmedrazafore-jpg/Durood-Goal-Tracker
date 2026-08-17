import React from 'react';
import { ActiveTab } from '../types';
import { Sparkles, Moon, Smartphone, Shield, BookOpen } from 'lucide-react';

const DUROOD_ICON_PATH = '/assets/images/durood_master_icon.png';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pwaInstalled: boolean;
  onInstallPwa: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pwaInstalled,
  onInstallPwa,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-white shadow-lg border-b border-emerald-800/60 bg-islamic-pattern">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Brand & Campaign Name */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 flex-shrink-0">
              <img
                src={DUROOD_ICON_PATH}
                alt="درود مہم آئیکن"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-[10px] sm:rounded-[14px] object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-2xl font-bold font-urdu text-white leading-normal sm:leading-relaxed py-0.5 whitespace-nowrap">
                  ربیع الاول درود پاک مہم
                </h1>
                <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-urdu leading-normal">
                  <Sparkles className="w-3 h-3 ml-1 text-amber-400" />
                  مبارک مہم
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-emerald-200/90 font-bold font-urdu leading-normal py-0.5">
                جامعۃ المدینہ عطار منزل
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-emerald-900/60 p-1.5 rounded-2xl border border-emerald-700/50 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/20'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              ہوم
            </button>
            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'rankings'
                  ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/20'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              🏆 درجہ بندی
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'submit'
                  ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/20'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              درود جمع کریں
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/20'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              ایڈمن
            </button>
          </nav>

          {/* Action Header Button / PWA Prompt */}
          <div className="flex items-center gap-2">
            {!pwaInstalled && (
              <button
                onClick={onInstallPwa}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-bold shadow-md transition-all"
              >
                <Smartphone className="w-3.5 h-3.5" />
                ایپ انسٹال کریں
              </button>
            )}
            <div className="text-right">
              <span className="block text-[10px] text-amber-300 font-semibold font-urdu leading-normal">
                مہم کی حالت
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                جاری
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
