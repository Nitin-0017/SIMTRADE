import React from 'react';
import { Stock, MarketData } from '../types';

interface SelectedStockHeaderProps {
  stock: Stock | null;
  currentMarketData: MarketData | null;
  timeRange: '1D' | '5D' | 'ALL';
  setTimeRange: (range: '1D' | '5D' | 'ALL') => void;
  isReplaying: boolean;
  onOpenTrade: () => void;
}

export const SelectedStockHeader: React.FC<SelectedStockHeaderProps> = ({
  stock,
  currentMarketData,
  timeRange,
  setTimeRange,
  isReplaying,
  onOpenTrade
}) => {
  if (!stock) return null;

  const open = currentMarketData?.open ?? 0;
  const close = currentMarketData?.close ?? stock.currentPrice ?? 0;
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

  return (
    <div className="px-8 pt-6 pb-4 border-b border-[rgba(255,255,255,0.07)] flex flex-wrap items-end justify-between gap-4">
      {/* Left: Stock Identification & 36px Hero Price */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white">
            {stock.symbol}
          </h2>
          <span className="text-sm text-typo-muted">•</span>
          <span className="text-sm text-typo-secondary font-sans font-medium">
            {stock.companyName}
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline space-x-3.5">
          <span className="text-3xl sm:text-4xl font-semibold font-mono text-white tnum tracking-tight">
            {formatINR(close)}
          </span>
          <div className="flex items-center space-x-1.5 font-mono text-sm">
            <span className={`font-semibold tnum ${isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
              {isUp ? '+' : ''}{diff.toFixed(2)}
            </span>
            <span className={`font-semibold tnum ${isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
              ({isUp ? '+' : ''}{pct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Right: Signature Market Pulse, Range Selector, and Gradient Trade Button */}
      <div className="flex items-center space-x-4">
        {/* Market Pulse Signature Indicator (Section 26) */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-pill bg-[#101827] border border-[rgba(255,255,255,0.06)] font-sans text-xs shadow-sm">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            {isReplaying && (
              <span className="pulse-dot absolute w-2.5 h-2.5 rounded-full bg-[#4F7CFF]" />
            )}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isReplaying ? 'bg-[#4F7CFF]' : 'bg-typo-muted'
              }`}
            />
          </div>
          <span className="text-[11px] text-typo-muted font-medium">Market pulse</span>
          <span className="text-typo-muted">•</span>
          <span
            className={`text-xs font-mono font-semibold ${
              isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'
            }`}
          >
            {isUp ? '+' : ''}{pct.toFixed(2)}%
          </span>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-[#101827] border border-[rgba(255,255,255,0.06)] rounded-md p-0.5 text-xs font-sans">
          {(['1D', '5D', 'ALL'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                timeRange === r
                  ? 'bg-[#4F7CFF] text-white font-semibold shadow-sm'
                  : 'text-typo-muted hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Blue Gradient Primary Action (Section 41) */}
        <button
          onClick={onOpenTrade}
          className="h-9 px-5 bg-gradient-to-r from-[#4F7CFF] to-[#6C63FF] hover:brightness-110 text-white text-xs font-sans font-semibold rounded-md shadow-glow-sm transition-all duration-150 tracking-wide flex items-center space-x-2"
        >
          <span>Trade {stock.symbol}</span>
        </button>
      </div>
    </div>
  );
};
