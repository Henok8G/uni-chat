import React from "react";
import { Search, Radio } from "lucide-react";

/**
 * Lightweight instant loading state for the Admin Cockpit route (/admin).
 * Renders the structural skeleton of the admin sidebar, utility header,
 * KPI metrics grid, and chart cards with zero database queries.
 */
export default function AdminLoading() {
  return (
    <div
      className="flex min-h-screen w-full bg-[#F8FAFC] text-slate-900 font-sf-pro antialiased selection:bg-[#4A7BB0]/20 tracking-tight"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading Uni-Chat Admin OS"
    >
      <span className="sr-only">Loading Uni-Chat Admin OS & Console...</span>

      {/* ── Fixed Left Sidebar Skeleton (~260px) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 w-[260px] bg-white border-r border-[#E2E8F0] hidden md:flex flex-col justify-between select-none">
        <div>
          {/* Header Branding */}
          <div className="p-5 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200/80 motion-safe:animate-pulse motion-reduce:animate-none shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-16 rounded bg-slate-200/80 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3.5 w-8 rounded bg-blue-100/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-2.5 w-24 rounded bg-slate-200/60 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>

            {/* System Status Pill Skeleton */}
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <div className="h-2.5 w-32 rounded bg-slate-200/70 motion-safe:animate-pulse motion-reduce:animate-none" />
            </div>
          </div>

          {/* Navigation Menu Skeletons */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
              <div
                key={item}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs ${
                  item === 1 ? "bg-[#EBF3FE]" : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded ${
                      item === 1 ? "bg-[#2563EB]/40" : "bg-slate-200"
                    } motion-safe:animate-pulse motion-reduce:animate-none shrink-0`}
                  />
                  <div
                    className={`h-3 rounded ${
                      item === 1 ? "w-20 bg-[#1E40AF]/40" : "w-24 bg-slate-200"
                    } motion-safe:animate-pulse motion-reduce:animate-none`}
                  />
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Admin Profile Chip Skeleton */}
        <div className="p-3 border-t border-[#F1F5F9]">
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none shrink-0" />
              <div className="min-w-0 space-y-1">
                <div className="h-3 w-20 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-2 w-16 rounded bg-slate-200/60 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Container (Left margin on Desktop) ── */}
      <div className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        {/* Top Utility Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Global Search Pill Input Skeleton */}
          <div className="relative flex-1 max-w-xl">
            <div className="w-full h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center px-3.5">
              <Search className="w-4 h-4 text-slate-300 mr-2 shrink-0" />
              <div className="h-2.5 w-48 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
            </div>
          </div>

          {/* Right Utility Controls Skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 rounded-full bg-slate-50 border border-slate-200 motion-safe:animate-pulse motion-reduce:animate-none hidden sm:block" />
            <div className="h-8 w-36 rounded-full bg-slate-900/10 motion-safe:animate-pulse motion-reduce:animate-none hidden md:block" />
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
            <div className="w-8 h-8 rounded-full bg-slate-800/20 motion-safe:animate-pulse motion-reduce:animate-none" />
          </div>
        </header>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1440px] mx-auto w-full space-y-6">
          {/* SECTION A: Welcome & Status Banner Skeleton */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="h-3 w-40 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-7 w-64 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="flex items-center gap-2 mt-1">
                <span className="p-1 rounded bg-slate-100 text-slate-400">
                  <Radio className="w-3 h-3" />
                </span>
                <div className="h-3 w-44 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="h-8 w-48 rounded-full bg-emerald-50 border border-emerald-200/80 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="h-8 w-36 rounded-full bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
            </div>
          </section>

          {/* SECTION B: 4 High-Level KPI Summary Cards Skeleton */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((kpi) => (
              <div
                key={kpi}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="w-8 h-8 rounded-xl bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-8 w-20 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-2.5 w-32 rounded bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </section>

          {/* SECTION C: Chart and Quick Actions Grid Skeleton */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-36 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-52 rounded bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-7 w-36 rounded-full bg-slate-100 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="h-56 rounded-xl bg-slate-50 border border-slate-100 motion-safe:animate-pulse motion-reduce:animate-none flex items-center justify-center">
                <div className="h-32 w-5/6 rounded-lg bg-slate-100/80 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
              <div className="h-4 w-32 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
              <div className="space-y-3">
                {[1, 2, 3].map((action) => (
                  <div
                    key={action}
                    className="h-14 rounded-xl bg-slate-50 border border-slate-100 motion-safe:animate-pulse motion-reduce:animate-none p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded bg-slate-200 motion-safe:animate-pulse motion-reduce:animate-none" />
                        <div className="h-2 w-16 rounded bg-slate-200/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
