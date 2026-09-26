import React from 'react';
import { MarketData } from '../types';

interface MarketStatsProps {
  marketData: MarketData | null;
}

export const MarketStats: React.FC<MarketStatsProps> = ({ marketData }) => {
  const formatINR = (val?: number | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatVolume = (vol?: number | null) => {
    if (!vol) return '0';
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toLocaleString();
  };

  return (
    <div className="px-8 py-5 border-t border-[rgba(255,255,255,0.07)] grid grid-cols-2 sm:grid-cols-4 gap-8">
      <div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-typo-muted block font-sans">
          Open
        </span>
        <span className="text-base font-semibold font-mono text-white tnum mt-1 block">
          {formatINR(marketData?.open)}
        </span>
      </div>

      <div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-typo-muted block font-sans">
          Day High
        </span>
        <span className="text-base font-semibold font-mono text-[#35D49A] tnum mt-1 block">
          {formatINR(marketData?.high)}
        </span>
      </div>

      <div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-typo-muted block font-sans">
          Day Low
        </span>
        <span className="text-base font-semibold font-mono text-[#FF5D73] tnum mt-1 block">
          {formatINR(marketData?.low)}
        </span>
      </div>

      <div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-typo-muted block font-sans">
          Interval Volume
        </span>
        <span className="text-base font-semibold font-mono text-white tnum mt-1 block">
          {formatVolume(marketData?.volume)}
        </span>
      </div>
    </div>
  );
};
