"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-8 md:p-10 lg:p-12 w-full h-full space-y-8 animate-pulse" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Top row label and right toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-8 w-28 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
        <div className="h-8 w-20 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
      </div>

      {/* Welcome Heading - Thick and bold */}
      <div className="space-y-4 mb-8">
        <div className="h-12 sm:h-16 w-3/4 max-w-4xl bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl" />
        <div className="h-6 sm:h-8 w-1/2 max-w-xl bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
      </div>

      {/* Big Filter / Actions Bar */}
      <div className="h-16 w-full bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl mb-6" />

      {/* Small filters / buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
        ))}
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={`stat-${i}`} className="h-28 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl" />
        ))}
      </div>

      {/* Section Title */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-8 w-10 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg" />
        <div className="h-8 w-64 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl" />
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={`card-${i}`} className="h-[300px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 flex flex-col shadow-sm">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-20 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-8 w-8 bg-slate-200/50 dark:bg-slate-800/50 rounded-full" />
            </div>
            {/* Card Body */}
            <div className="space-y-4 mb-8 flex-1">
              <div className="h-6 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
              <div className="h-6 w-5/6 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
              <div className="h-6 w-2/3 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
            </div>
            {/* Card Footer */}
            <div className="flex gap-3 mt-auto">
              <div className="h-10 w-24 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-10 w-24 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
