'use client';

/**
 * Skeleton loading components
 * Usage:
 *   <Skeleton className="h-6 w-48" />           — generic
 *   <SkeletonCard />                             — location/blog card
 *   <SkeletonTable rows={5} cols={4} />          — admin table
 *   <SkeletonDashboard />                        — full dashboard
 *   <SkeletonText lines={3} />                   — paragraph text
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-700/60 ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Card skeleton (location, blog, deal cards) ──────────────────────────────
export function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// ── Grid of cards ────────────────────────────────────────────────────────────
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Text paragraph ───────────────────────────────────────────────────────────
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3'];
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

// ── Admin table ──────────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-700 mb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-4 border-b border-gray-800">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 flex-1 ${c === 0 ? 'w-8 flex-none rounded-full' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Dashboard skeleton ───────────────────────────────────────────────────────
export function SkeletonDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-2 border border-gray-700">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700">
          <Skeleton className="h-5 w-32" />
          <SkeletonText lines={4} />
        </div>
        <div className="bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700">
          <Skeleton className="h-5 w-40" />
          <SkeletonCardGrid count={2} />
        </div>
      </div>
    </div>
  );
}

// ── Location detail skeleton ─────────────────────────────────────────────────
export function SkeletonLocationDetail() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <SkeletonText lines={5} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
