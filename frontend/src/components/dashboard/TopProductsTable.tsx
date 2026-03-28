'use client';

import type { TopProductsData } from '@/lib/api';
import { SectionError, SkeletonRow } from './shared';

interface Props {
  data?: TopProductsData;
  isLoading: boolean;
  error?: Error;
  onRetry: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function TopProductsTable({ data, isLoading, error, onRetry }: Props) {
  if (error) return <SectionError message={error.message} onRetry={onRetry} />;

  return (
    <div className="rounded-xl border border-white/5 bg-[#12121a] p-6">
      <h2 className="mb-4 text-lg font-semibold text-zinc-200">
        Top Products
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500">
              <th className="pb-3 font-medium">#</th>
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 text-right font-medium">Revenue</th>
              <th className="pb-3 text-right font-medium">Orders</th>
            </tr>
          </thead>
          <tbody>
            {isLoading || !data
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3" colSpan={4}>
                      <SkeletonRow />
                    </td>
                  </tr>
                ))
              : data.products.map((product, index) => (
                  <tr
                    key={product.product_id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="py-3 text-zinc-500">{index + 1}</td>
                    <td className="py-3 font-mono text-sm text-zinc-300">
                      {product.product_id}
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-400">
                      {formatCurrency(product.total_revenue)}
                    </td>
                    <td className="py-3 text-right text-zinc-400">
                      {product.order_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
