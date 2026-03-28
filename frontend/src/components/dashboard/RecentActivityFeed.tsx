'use client';

import { formatDistanceToNow } from 'date-fns';
import type { RecentActivityData } from '@/lib/api';
import { SectionError, SkeletonRow } from './shared';
import { Eye, ShoppingCart, X, CreditCard, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  data?: RecentActivityData;
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
}

interface EventConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
  Icon: LucideIcon;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  page_view: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Page View', Icon: Eye },
  add_to_cart: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Add to Cart', Icon: ShoppingCart },
  remove_from_cart: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Removed', Icon: X },
  checkout_started: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Checkout', Icon: CreditCard },
  purchase: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Purchase', Icon: Package },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function RecentActivityFeed({ data, isLoading, error, onRetry }: Props) {
  if (error) return <SectionError message={error.message} onRetry={onRetry} />;

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121a] p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-200">
        Recent Activity
      </h2>
      <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
        {isLoading || !data
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="py-2">
                <SkeletonRow />
              </div>
            ))
          : data.events.map((event) => {
              const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.page_view;
              const Icon = config.Icon;
              return (
                <div
                  key={event.event_id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg} border ${config.border}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                      {event.product_id && (
                        <span className="truncate font-mono text-xs text-zinc-500">
                          {event.product_id}
                        </span>
                      )}
                    </div>
                  </div>
                  {event.amount != null && (
                    <span className="shrink-0 font-medium text-emerald-400 text-sm">
                      {formatCurrency(event.amount)}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-zinc-600">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
      </div>
    </div>
  );
}
