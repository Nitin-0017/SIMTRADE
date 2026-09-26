import React from 'react';
import { AccountSummary } from '../types';
import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  currentTimestamp: string;
  account: AccountSummary | null;
  onToggleMobileNav?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  currentTimestamp,
  account,
  onToggleMobileNav
}) => {
  const formatINR = (val?: number | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const dateObj = currentTimestamp ? new Date(currentTimestamp) : new Date();

  const formattedDate = dateObj.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const isProfitable = (account?.totalProfitLoss ?? 0) >= 0;

  return (
    <header className="h-16 border-b border-[rgba(255,255,255,0.07)] bg-[#080D18]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu button + Breadcrumb in natural typography */}
      <div className="flex items-center space-x-3 text-sm font-sans">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 rounded-md hover:bg-[#141E30] text-typo-secondary hover:text-white transition-colors border border-[rgba(255,255,255,0.06)]"
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold capitalize">{title}</span>
          <span className="text-typo-muted">/</span>
          <span className="text-typo-secondary text-xs">Simulated Market</span>
        </div>
      </div>

      {/* Center: Simulation Date & Time */}
      <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-pill bg-[#101827] border border-[rgba(255,255,255,0.06)] text-xs font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4F7CFF]" />
        <span className="text-typo-secondary">Simulation</span>
        <span className="text-typo-muted">•</span>
        <span className="text-white font-medium">{formattedDate}</span>
        <span className="text-typo-muted">·</span>
        <span className="text-white font-mono">{formattedTime}</span>
      </div>

      {/* Right: Balanced Compact Financial Metrics */}
      <div className="flex items-center space-x-3 sm:space-x-5 text-xs font-sans">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-typo-muted">Cash</div>
          <div className="text-sm font-semibold font-mono text-white tnum">
            {formatINR(account?.availableCash ?? account?.cashBalance)}
          </div>
        </div>

        <div className="h-7 w-[1px] bg-[rgba(255,255,255,0.08)]" />

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-typo-muted">Portfolio</div>
          <div className="text-sm font-semibold font-mono text-white tnum">
            {formatINR(account?.portfolioValue ?? account?.totalAccountValue)}
          </div>
        </div>

        <div className="h-7 w-[1px] bg-[rgba(255,255,255,0.08)]" />

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-typo-muted">P/L</div>
          <div
            className={`text-sm font-semibold font-mono tnum ${
              isProfitable ? 'text-[#35D49A]' : 'text-[#FF5D73]'
            }`}
          >
            {isProfitable ? '+' : ''}{formatINR(account?.totalReturn ?? account?.totalProfitLoss)}
          </div>
        </div>
      </div>
    </header>
  );
};
