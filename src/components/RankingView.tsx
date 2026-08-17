import React, { useState } from 'react';
import { JamiaClass, SubmissionItem } from '../types';
import { Trophy, Search, Users, User, Award } from 'lucide-react';
import { calculateStudentPerformance } from '../lib/campaign';

interface RankingViewProps {
  classes: JamiaClass[];
  submissions?: SubmissionItem[];
  isCompact?: boolean;
  onViewAll?: () => void;
}

export const RankingView: React.FC<RankingViewProps> = ({
  classes,
  submissions = [],
  isCompact = false,
  onViewAll,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'students'>('classes');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate participant performance for the active campaign submissions
  const studentList = calculateStudentPerformance(submissions);

  // Sort classes/categories by totalDurood descending
  const sortedClasses = [...classes].sort((a, b) => b.totalDurood - a.totalDurood);

  const filteredClasses = sortedClasses.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = studentList.filter(
    (st) =>
      st.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayList = isCompact ? sortedClasses.slice(0, 3) : filteredClasses;
  const maxDurood = sortedClasses[0]?.totalDurood || 1;
  const maxStudentDurood = studentList[0]?.totalDurood || 1;

  const getRankBadge = (rankIndex: number) => {
    const rank = rankIndex + 1;
    if (rank === 1) {
      return (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-md shadow-amber-500/30 ring-1.5 sm:ring-2 ring-amber-300 flex-shrink-0">
          🥇 ۱
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-sm ring-1.5 sm:ring-2 ring-slate-300 flex-shrink-0">
          🥈 ۲
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-700/20 text-amber-900 font-extrabold flex items-center justify-center text-xs sm:text-sm shadow-sm ring-1.5 sm:ring-2 ring-amber-700/30 flex-shrink-0">
          🥉 ۳
        </div>
      );
    }
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px] sm:text-xs flex-shrink-0 font-mono">
        #{rank}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xl shadow-emerald-900/5 border border-emerald-100/80 space-y-3 sm:space-y-5 font-urdu">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] sm:text-xs font-bold mb-1 border border-amber-200 leading-normal">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
            <span className="py-0.5">درجہ بندی و کارکردگی</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 leading-normal sm:leading-relaxed py-0.5">
            {isCompact
              ? 'سرفہرست 3 شرکاء'
              : activeSubTab === 'classes'
              ? 'مکمل شرکاء کی درجہ بندی'
              : 'انفرادی کارکردگی'}
          </h2>
        </div>

        {isCompact && onViewAll ? (
          <button
            onClick={onViewAll}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-bold transition-all border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5 leading-normal"
          >
            <span className="py-0.5">مکمل شرکاء کی درجہ بندی</span>
            <span>←</span>
          </button>
        ) : !isCompact ? (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('classes')}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 leading-normal ${
                activeSubTab === 'classes'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="py-0.5">مکمل شرکاء کی درجہ بندی</span>
            </button>
            <button
              onClick={() => setActiveSubTab('students')}
              className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 leading-normal ${
                activeSubTab === 'students'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="py-0.5">انفرادی کارکردگی ({studentList.length})</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Search Bar (Visible on full page) */}
      {!isCompact && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'classes'
                ? 'زمرہ یا درجہ تلاش کریں...'
                : 'شرکت کنندہ کا نام یا زمرہ تلاش کریں...'
            }
            className="w-full pr-9 pl-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-urdu leading-normal"
          />
        </div>
      )}

      {/* View Mode 1: Participant Categories Leaderboard */}
      {(isCompact || activeSubTab === 'classes') && (
        <div className="space-y-2 sm:space-y-3">
          {displayList.map((cls, idx) => {
            const percentageOfTop = Math.round((cls.totalDurood / maxDurood) * 100);
            const isSpecial = cls.name === 'استاذ' || cls.name === 'عوام';

            return (
              <div
                key={cls.id}
                className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-emerald-50/40 border-amber-300 shadow-sm'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                }`}
              >
                {/* Rank + Name */}
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  {getRankBadge(idx)}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-lg font-bold text-slate-900 font-urdu leading-normal py-0.5">
                        {cls.name}
                      </h3>
                      {isSpecial && (
                        <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 leading-normal">
                          {cls.name === 'استاذ' ? 'اساتذہ زمرہ' : 'عوام الناس'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Durood + Progress Bar */}
                <div className="sm:text-left min-w-[140px] sm:min-w-[160px] w-full sm:w-auto">
                  <div className="flex sm:block justify-between items-baseline">
                    <div className="text-sm sm:text-lg font-extrabold text-emerald-900 font-mono tracking-tight">
                      {cls.totalDurood.toLocaleString()}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block font-urdu leading-normal py-0.5">
                      کل پڑھے گئے درود
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 mt-1 sm:mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentageOfTop}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {displayList.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-slate-500 text-xs sm:text-sm font-urdu leading-normal">
              "{searchQuery}" کا کوئی ریکارڈ نہیں ملا۔
            </div>
          )}

          {isCompact && onViewAll && (
            <div className="pt-1">
              <button
                onClick={onViewAll}
                className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 text-xs sm:text-sm font-bold transition-all border border-emerald-200/90 flex items-center justify-center gap-2 shadow-sm group font-urdu leading-normal"
              >
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="py-0.5">مکمل شرکاء کی درجہ بندی دیکھیں</span>
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Individual Performance Leaderboard */}
      {!isCompact && activeSubTab === 'students' && (
        <div className="space-y-2 sm:space-y-3">
          {filteredStudents.map((st, idx) => {
            const percentageOfTop = Math.round(
              (st.totalDurood / maxStudentDurood) * 100
            );

            return (
              <div
                key={`${st.studentName}_${st.className}_${idx}`}
                className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                  idx === 0
                    ? 'bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-emerald-50/40 border-amber-300 shadow-sm'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80'
                }`}
              >
                {/* Rank + Participant Name & Category */}
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  {getRankBadge(idx)}

                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-sm sm:text-lg font-bold text-slate-900 font-urdu leading-normal py-0.5">
                        {st.studentName}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 leading-normal">
                        {st.className}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-urdu leading-normal">
                      کل اندراجات: {st.submissionCount}
                    </p>
                  </div>
                </div>

                {/* Total Durood Recited */}
                <div className="sm:text-left min-w-[140px] sm:min-w-[160px] w-full sm:w-auto">
                  <div className="flex sm:block justify-between items-baseline">
                    <div className="text-sm sm:text-lg font-extrabold text-emerald-900 font-mono tracking-tight">
                      {st.totalDurood.toLocaleString()}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block font-urdu leading-normal py-0.5">
                      کل پڑھے گئے درود
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 mt-1 sm:mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentageOfTop}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 sm:py-10 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-urdu">
              <User className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 mx-auto" />
              <p className="text-slate-600 font-bold text-xs sm:text-sm leading-normal">
                {searchQuery
                  ? `"${searchQuery}" کے نام سے کوئی اندراج نہیں ملا۔`
                  : 'موجودہ مہم میں ابھی تک نامزد اندراجات شامل نہیں ہوئے۔'}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                شرکاء کی جانب سے جمع کیا جانے والا درود یہاں خودکار طور پر ظاہر ہوگا۔
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
