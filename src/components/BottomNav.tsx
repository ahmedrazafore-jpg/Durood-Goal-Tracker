import React from 'react';
import { ActiveTab } from '../types';
import { Home, Trophy, Plus, Shield } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800/80 px-4 py-2 md:hidden bg-islamic-pattern shadow-2xl font-urdu">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-emerald-200/80 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">ہوم</span>
        </button>

        {/* Rankings Tab */}
        <button
          onClick={() => setActiveTab('rankings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'rankings'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-emerald-200/80 hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px]">درجہ بندی</span>
        </button>

        {/* Middle Submit CTA + Button */}
        <button
          onClick={() => setActiveTab('submit')}
          className="-mt-5 p-3 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 text-emerald-950 shadow-xl shadow-amber-500/30 border-2 border-emerald-950 flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span className="text-[9px] font-extrabold">جمع کریں</span>
        </button>

        {/* Admin Tab */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'admin'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-emerald-200/80 hover:text-white'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px]">ایڈمن</span>
        </button>
      </div>
    </nav>
  );
};
