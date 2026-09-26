import React from 'react';
import { Stock } from '../types';
import { Sparkline } from './Sparkline';

interface WatchlistRowProps {
  stock: Stock;
  isActive: boolean;
  onSelect: (symbol: string) => void;
}

export const WatchlistRow: React.FC<WatchlistRowProps> = ({
  stock,
  isActive,
  onSelect
}) => {
  const mData = stock.currentMarketData;
  const open = mData?.open ?? 0;
  const close = mData?.close ?? stock.currentPrice ?? 0;
  const diff = open > 0 ? close - open : 0;
  const pct = open > 0 ? (diff / open) * 100 : 0;
  const isUp = diff >= 0;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Genuine historical closing price series from PostgreSQL (Task 7)
  const high = mData?.high ?? close;
  const low = mData?.low ?? open;
  const sparklineData =
    stock.sparkline && stock.sparkline.length > 0
      ? stock.sparkline
      : [open, low, (open + close) / 2, high, close];

  return (
    <button
      onClick={() => onSelect(stock.symbol)}
      className={`w-full text-left h-[76px] px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] transition-all duration-150 relative group ${
        isActive
          ? 'bg-gradient-to-r from-[rgba(79,124,255,0.15)] to-[rgba(79,124,255,0.05)] text-white'
          : 'hover:bg-[#101827] text-typo-secondary hover:text-white'
      }`}
    >
      {/* Left Active Blue Accent Indicator */}
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#4F7CFF] rounded-r" />
      )}

      {/* Symbol & Company Name in Natural Typography */}
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <span className="text-xs font-bold text-white tracking-wide font-sans">
          {stock.symbol}
        </span>
        <span className="text-[11px] text-typo-muted truncate max-w-[110px] mt-0.5 font-sans">
          {stock.companyName}
        </span>
      </div>

      {/* Mini Sparkline (Section 17 & 20) */}
      <div className="hidden sm:block px-2">
        <Sparkline data={sparklineData} isPositive={isUp} width={46} height={18} />
      </div>

      {/* Price & Change in Tabular Monospace */}
      <div className="flex flex-col items-end justify-center shrink-0 text-xs">
        <span className="font-semibold text-white font-mono tnum">
          {formatINR(close)}
        </span>
        <span
          className={`text-[11px] font-medium font-mono mt-0.5 tnum ${
            isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'
          }`}
        >
          {isUp ? '+' : ''}
          {pct.toFixed(2)}%
        </span>
      </div>
    </button>
  );
};
