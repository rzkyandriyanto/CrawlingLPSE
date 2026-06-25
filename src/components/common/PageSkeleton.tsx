"use client";

import React from "react";

export default function PageSkeleton() {
  return (
    <main
      className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <div className="-mt-4 sm:-mt-8 md:-mt-10 lg:-mt-12 -mx-4 sm:-mx-8 md:-mx-10 lg:-mx-12 px-4 sm:px-8 md:px-10 lg:px-12 pt-7 sm:pt-10 md:pt-12 lg:pt-14 pb-5 sm:pb-6 border-b relative z-30 mb-6 sm:mb-8 animate-pulse" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)" }}>
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-6 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded-full" />
            <div className="h-10 sm:h-12 w-3/4 max-w-lg bg-slate-200/90 dark:bg-slate-800/90 rounded-2xl" />
            <div className="h-5 sm:h-6 w-1/2 max-w-sm bg-slate-200/60 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </header>
      </div>

      <div className="max-w-6xl mx-auto w-full animate-pulse space-y-8">
        <div className="h-40 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 flex flex-col shadow-sm">
            <div className="h-10 w-1/3 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl mb-6" />
            <div className="space-y-4 flex-1">
              <div className="h-6 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
              <div className="h-6 w-5/6 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
              <div className="h-6 w-2/3 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
            </div>
          </div>
          <div className="h-64 bg-slate-100 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 flex flex-col shadow-sm">
            <div className="h-10 w-1/3 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl mb-6" />
            <div className="space-y-4 flex-1">
              <div className="h-6 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
              <div className="h-6 w-5/6 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
              <div className="h-6 w-2/3 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
