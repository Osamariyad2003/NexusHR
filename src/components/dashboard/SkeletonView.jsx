import React from 'react';

export const SkeletonView = ({ variant = 'v1' }) => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-32 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl w-full"></div>

      {/* KPI Cards Skeleton Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col justify-between shadow-card">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/3"></div>
              </div>
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 flex flex-col justify-between shadow-card">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/6"></div>
          </div>
          <div className="h-48 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl w-full flex items-end justify-between p-4 gap-2">
            {[40, 65, 30, 80, 55, 90, 75].map((h, idx) => (
              <div key={idx} className="bg-slate-200/80 dark:bg-slate-700/80 rounded-t-lg w-full" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 h-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 flex flex-col items-center justify-between shadow-card">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2 self-start"></div>
          <div className="w-40 h-40 rounded-full border-8 border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800"></div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>

      {/* Employee List Table Skeleton (Screens 14 & 16) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-card space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
