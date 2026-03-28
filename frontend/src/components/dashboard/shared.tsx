'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

/** Skeleton card placeholder */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-white/5 bg-[#12121a] p-5 ${className}`}>
      <div className="mb-3 h-4 w-24 rounded bg-white/5" />
      <div className="h-8 w-32 rounded bg-white/5" />
    </div>
  );
}

/** Skeleton table row */
export function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-4 w-full rounded bg-white/5" />
    </div>
  );
}

/** Error state with retry button */
export function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <AlertCircle className="mb-2 h-6 w-6 text-red-400" />
      <p className="mb-3 text-sm text-red-300">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/10"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}
