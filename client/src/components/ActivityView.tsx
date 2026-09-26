import React, { useState } from 'react';
import { Transaction } from '../types';

interface ActivityViewProps {
  transactions: Transaction[];
  onSelectStock: (symbol: string) => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  transactions,
  onSelectStock
}) => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const filtered = transactions.filter((t) => {
    if (filter === 'ALL') return true;
    return t.type === filter;
  });

  const formatINR = (val?: number | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="flex-1 p-8 sm:p-10 overflow-y-auto max-w-[1400px] w-full mx-auto space-y-6 select-none">
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white">
            Activity
          </h1>
          <p className="text-sm font-sans text-typo-secondary mt-1">
            Complete audit trail of executed virtual orders
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-[#101827] border border-[rgba(255,255,255,0.08)] rounded-md p-0.5 text-xs font-sans">
          {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-[#4F7CFF] text-white font-semibold shadow-sm'
                  : 'text-typo-muted hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All Orders' : f === 'BUY' ? 'Buys' : 'Sells'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs font-sans text-typo-muted">
            No transactions match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="text-[11px] uppercase tracking-wider text-typo-muted border-b border-[rgba(255,255,255,0.06)]">
                <tr>
                  <th className="py-3 px-3 font-medium">Timestamp (Market)</th>
                  <th className="py-3 px-3 font-medium">Asset</th>
                  <th className="py-3 px-3 font-medium">Action</th>
                  <th className="py-3 px-3 text-right font-medium">Qty</th>
                  <th className="py-3 px-3 text-right font-medium">Execution Price</th>
                  <th className="py-3 px-3 text-right font-medium">Total Value</th>
                  <th className="py-3 px-3 text-right font-medium">Realized P/L</th>
                  <th className="py-3 px-3 text-right font-medium">Audit ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-typo-secondary">
                {filtered.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const simDate = new Date(tx.timestamp);
                  const realized = tx.realizedProfitLoss ?? 0;
                  const isRealizedPositive = realized >= 0;

                  return (
                    <tr key={tx.id} className="hover:bg-[#141E30] transition-colors">
                      <td className="py-3.5 px-3 text-typo-muted text-[11px]">
                        {simDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' })}{' '}
                        {simDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => onSelectStock(tx.symbol)}
                          className="hover:text-[#4F7CFF] transition-colors text-left font-sans"
                        >
                          <span className="font-bold text-white">{tx.symbol}</span>
                        </button>
                      </td>

                      {/* Action with Small Colored Indicator (Section 23) */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center space-x-1.5 font-semibold text-xs">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isBuy ? 'bg-[#35D49A]' : 'bg-[#FF5D73]'
                            }`}
                          />
                          <span className={isBuy ? 'text-[#35D49A]' : 'text-[#FF5D73]'}>
                            {tx.type}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right text-white font-mono tnum font-medium">
                        {tx.quantity}
                      </td>

                      <td className="py-3.5 px-3 text-right text-white font-mono tnum">
                        {formatINR(tx.price)}
                      </td>

                      <td className="py-3.5 px-3 text-right text-white font-mono font-semibold tnum">
                        {formatINR(tx.totalAmount)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono tnum font-medium">
                        {isBuy ? (
                          <span className="text-typo-muted">—</span>
                        ) : (
                          <span className={isRealizedPositive ? 'text-[#35D49A]' : 'text-[#FF5D73]'}>
                            {isRealizedPositive ? '+' : ''}{formatINR(realized)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right text-typo-muted font-mono text-[11px]">
                        #{tx.id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
