import React from 'react';
import { CampaignStats } from '../types';
import { Target, Award, Clock, TrendingUp, Sparkles, Flag } from 'lucide-react';

interface HeroStatsProps {
  stats?: CampaignStats | null;
  isLoading?: boolean;
  onOpenSubmit: () => void;
}

export const formatUrduQuantity = (num: number): string => {
  if (!num || num === 0) return '0';
  if (num >= 1000000000) {
    const val = num / 1000000000;
    const formatted = Number.isInteger(val)
      ? val.toString()
      : parseFloat(val.toFixed(2)).toString();
    return `${formatted} ارب`;
  }
  if (num >= 10000000) {
    const val = num / 10000000;
    const formatted = Number.isInteger(val)
      ? val.toString()
      : parseFloat(val.toFixed(2)).toString();
    return `${formatted} کروڑ`;
  }
  if (num >= 100000) {
    const val = num / 100000;
    const formatted = Number.isInteger(val)
      ? val.toString()
      : parseFloat(val.toFixed(2)).toString();
    return `${formatted} لاکھ`;
  }
  if (num >= 1000) {
    const val = num / 1000;
    const formatted = Number.isInteger(val)
      ? val.toString()
      : parseFloat(val.toFixed(2)).toString();
    return `${formatted} ہزار`;
  }
  return new Intl.NumberFormat('ur-PK').format(num);
};

/**
 * Returns dynamic, strictly constrained responsive font classes based on formatted number length.
 * Guarantees numbers of ANY size ALWAYS remain comfortably inside their card container.
 */
export const getResponsiveNumberSizeClass = (num: number): string => {
  const formatted = (num || 0).toLocaleString();
  const len = formatted.length;
  if (len >= 13) {
    return 'text-xs sm:text-base lg:text-xl';
  }
  if (len >= 10) {
    return 'text-sm sm:text-xl lg:text-2xl';
  }
  if (len >= 8) {
    return 'text-base sm:text-xl lg:text-2xl';
  }
  if (len >= 6) {
    return 'text-base sm:text-2xl lg:text-3xl';
  }
  return 'text-lg sm:text-2xl lg:text-3xl';
};

export const HeroStats: React.FC<HeroStatsProps> = ({ stats, isLoading = false }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ur-PK').format(num || 0);
  };

  // Render skeleton loading state while active campaign is being fetched from Firestore
  if (isLoading || !stats) {
    return (
      <section className="relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xl shadow-emerald-900/5 border border-emerald-100/80 animate-pulse font-urdu">
        {/* Decorative top Islamic motif line */}
        <div className="absolute top-0 inset-x-0 h-1 sm:h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700" />

        {/* Top Banner Title Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3.5 sm:mb-6 pb-2.5 sm:pb-4 border-b border-slate-100">
          <div>
            <div className="h-5 sm:h-6 w-32 sm:w-36 bg-emerald-100/70 rounded-full mb-1.5 sm:mb-2" />
            <div className="h-6 sm:h-7 w-40 sm:w-48 bg-slate-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 sm:h-7 w-24 sm:w-28 bg-amber-100/60 rounded-xl" />
          </div>
        </div>

        {/* Four Statistic Cards Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-3.5 sm:mb-6">
          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900/90 text-white border border-emerald-900/40 flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-center">
              <div className="h-3.5 sm:h-4 w-10 sm:w-12 bg-emerald-700/50 rounded" />
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-800/60 rounded-lg sm:rounded-xl" />
            </div>
            <div className="h-6 sm:h-7 w-20 sm:w-24 bg-emerald-800/70 rounded my-1" />
            <div className="h-2.5 sm:h-3 w-14 sm:w-16 bg-emerald-700/40 rounded" />
          </div>

          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-850 text-white border border-emerald-600/30 flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-center">
              <div className="h-3.5 sm:h-4 w-16 sm:w-20 bg-emerald-600/50 rounded" />
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-600/60 rounded-lg sm:rounded-xl" />
            </div>
            <div className="h-6 sm:h-7 w-18 sm:w-20 bg-emerald-600/70 rounded my-1" />
            <div className="h-2.5 sm:h-3 w-12 sm:w-14 bg-emerald-600/40 rounded" />
          </div>

          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-center">
              <div className="h-3.5 sm:h-4 w-12 sm:w-14 bg-amber-200/60 rounded" />
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-200/80 rounded-lg sm:rounded-xl" />
            </div>
            <div className="h-6 sm:h-7 w-18 sm:w-20 bg-amber-200 rounded my-1" />
            <div className="h-2.5 sm:h-3 w-12 sm:w-14 bg-amber-200/60 rounded" />
          </div>

          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between min-w-0">
            <div className="flex justify-between items-center">
              <div className="h-3.5 sm:h-4 w-10 sm:w-12 bg-emerald-200/60 rounded" />
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-200/80 rounded-lg sm:rounded-xl" />
            </div>
            <div className="h-6 sm:h-7 w-14 sm:w-16 bg-emerald-200 rounded my-1" />
            <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-emerald-200/60 rounded" />
          </div>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="h-3.5 sm:h-4 w-28 sm:w-32 bg-slate-200 rounded" />
            <div className="h-4 sm:h-5 w-14 sm:w-16 bg-emerald-100 rounded-lg" />
          </div>
          <div className="w-full h-4 sm:h-6 bg-slate-200 rounded-full" />
          <div className="flex justify-between items-center mt-2 sm:mt-3">
            <div className="h-2.5 sm:h-3 w-8 sm:w-10 bg-slate-200 rounded" />
            <div className="h-2.5 sm:h-3 w-12 sm:w-14 bg-slate-200 rounded" />
            <div className="h-2.5 sm:h-3 w-12 sm:w-14 bg-slate-200 rounded" />
            <div className="h-2.5 sm:h-3 w-12 sm:w-14 bg-slate-200 rounded" />
            <div className="h-2.5 sm:h-3 w-14 sm:w-16 bg-amber-200 rounded" />
          </div>
        </div>
      </section>
    );
  }

  const target = stats.campaignTarget || 0;
  const isUpcoming = stats.scheduleStatus === 'upcoming';
  const isExpired = stats.scheduleStatus === 'expired';

  return (
    <section className="relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xl shadow-emerald-900/5 border border-emerald-100/80 font-urdu">
      {/* Decorative top Islamic motif line */}
      <div className="absolute top-0 inset-x-0 h-1 sm:h-1.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700 rounded-t-2xl sm:rounded-t-3xl" />

      {/* Top Banner Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3.5 sm:mb-6 pb-2.5 sm:pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-bold mb-1 border border-emerald-200/60 leading-normal">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 flex-shrink-0" />
            <span className="py-0.5">{stats.title || 'ربیع الاول مبارک مہم'}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 leading-normal sm:leading-relaxed py-0.5">
            درودِ پاک کی پیش رفت
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          {isUpcoming ? (
            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 leading-normal">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              <span className="py-0.5">آنے والی مہم</span>
            </div>
          ) : isExpired ? (
            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 leading-normal">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
              <span className="py-0.5">مہم کا وقت مکمل</span>
            </div>
          ) : (
            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 leading-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="py-0.5">مہم جاری ہے</span>
            </div>
          )}

          {/* Time Remaining Badge */}
          {stats.daysRemaining > 0 ? (
            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 leading-normal">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
              <span className="py-0.5">{stats.daysRemaining} دن باقی</span>
            </div>
          ) : stats.hoursRemaining !== undefined && stats.hoursRemaining > 0 && !isExpired && !isUpcoming ? (
            <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 leading-normal">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
              <span className="py-0.5">{stats.hoursRemaining} گھنٹے باقی</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Four Statistic Cards with Proper Line-Height and No Clipping */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-3.5 sm:mb-6">
        {/* Card 1: Campaign Target */}
        <div className="relative p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-md border border-emerald-900/40 flex flex-col justify-between min-w-0 w-full">
          <div className="absolute top-0 left-0 w-16 sm:w-20 h-16 sm:h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-bold text-emerald-200 font-urdu leading-normal py-0.5 whitespace-nowrap">
              دُرود کل ہدف
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-800/50 text-amber-400 border border-emerald-700/50 flex-shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div
            title={formatNumber(stats.campaignTarget)}
            className={`${getResponsiveNumberSizeClass(stats.campaignTarget)} font-extrabold text-white font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight py-0.5`}
          >
            {formatNumber(stats.campaignTarget)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-300/80 mt-0.5 sm:mt-1 font-urdu leading-normal py-0.5">
            {formatUrduQuantity(target)} درود کا ہدف
          </p>
        </div>

        {/* Card 2: Total Durood Recited */}
        <div className="relative p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 text-white shadow-md border border-emerald-600/30 flex flex-col justify-between min-w-0 w-full">
          <div className="absolute top-0 left-0 w-16 sm:w-20 h-16 sm:h-20 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-bold text-emerald-100 font-urdu leading-normal py-0.5 whitespace-nowrap">
              اب تک پڑھی ہوئی
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-600/50 text-amber-300 border border-emerald-500/40 flex-shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div
            title={formatNumber(stats.totalRecited)}
            className={`${getResponsiveNumberSizeClass(stats.totalRecited)} font-extrabold text-white font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight py-0.5`}
          >
            {formatNumber(stats.totalRecited)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-100/90 mt-0.5 sm:mt-1 flex items-center gap-1 font-medium font-urdu leading-normal py-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
            <span>{formatUrduQuantity(stats.totalRecited)} مکمل</span>
          </p>
        </div>

        {/* Card 3: Remaining Target */}
        <div className="relative p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/80 text-amber-950 shadow-md border border-amber-200/80 flex flex-col justify-between min-w-0 w-full">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-bold text-amber-800 font-urdu leading-normal py-0.5 whitespace-nowrap">
              باقی ہدف
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-200/60 text-amber-800 border border-amber-300 flex-shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div
            title={formatNumber(stats.remainingTarget)}
            className={`${getResponsiveNumberSizeClass(stats.remainingTarget)} font-extrabold text-amber-950 font-mono tracking-tight tabular-nums min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap leading-tight py-0.5`}
          >
            {formatNumber(stats.remainingTarget)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-amber-800 mt-0.5 sm:mt-1 font-medium font-urdu leading-normal py-0.5">
            {formatUrduQuantity(stats.remainingTarget)} باقی
          </p>
        </div>

        {/* Card 4: Progress Percentage */}
        <div className="relative p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 text-emerald-950 shadow-md border border-emerald-200 flex flex-col justify-between min-w-0 w-full">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-bold text-emerald-800 font-urdu leading-normal py-0.5 whitespace-nowrap">
              پیشرفت
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-200/60 text-emerald-800 border border-emerald-300 flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-900 tracking-tight font-sans truncate py-0.5 leading-tight">
            {stats.progressPercentage}%
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5 sm:mt-1 font-semibold font-urdu leading-normal py-0.5">
            منزل کی طرف گامزن
          </p>
        </div>
      </div>

      {/* Large Animated Progress Bar */}
      <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/80">
        <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="flex h-2 sm:h-2.5 w-2 sm:w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 sm:h-2.5 w-2 sm:w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-urdu leading-normal py-0.5">
              مہم کے ہدف کی تکمیل
            </span>
          </div>
          <span className="text-[11px] sm:text-sm font-extrabold text-emerald-800 font-urdu bg-emerald-100 px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg border border-emerald-200 leading-normal">
            {stats.progressPercentage}% مکمل
          </span>
        </div>

        {/* Outer Progress Track */}
        <div className="relative w-full h-4 sm:h-6 bg-slate-200/80 rounded-full overflow-hidden p-0.5 sm:p-1 shadow-inner border border-slate-300/50">
          {/* Fill Bar */}
          <div
            className="relative h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-md"
            style={{ width: `${Math.min(100, Math.max(0, stats.progressPercentage))}%` }}
          >
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Milestones */}
        <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-semibold text-slate-500 mt-1.5 sm:mt-2 px-0.5 sm:px-1 font-urdu leading-normal">
          <span className="flex items-center gap-1 text-emerald-800 font-bold py-0.5">
            0 درود
          </span>
          <span className="hidden sm:inline py-0.5">{formatUrduQuantity(target * 0.25)} (25%)</span>
          <span className="text-emerald-700 font-bold py-0.5">{formatUrduQuantity(target * 0.5)} (50%)</span>
          <span className="hidden sm:inline py-0.5">{formatUrduQuantity(target * 0.75)} (75%)</span>
          <span className="flex items-center gap-1 text-amber-700 font-extrabold py-0.5">
            <Flag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" /> {formatUrduQuantity(target)} ہدف
          </span>
        </div>
      </div>
    </section>
  );
};
