import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { AccountSummary, PortfolioHolding, Stock, PortfolioTrajectoryPoint } from '../types';
import { Sparkline } from './Sparkline';
import { TrendingUp, ArrowUpRight, ArrowRight, Layers, Wallet, Sparkles } from 'lucide-react';
import { PortfolioApi } from '../services/api';

interface OverviewViewProps {
  account: AccountSummary | null;
  holdings: PortfolioHolding[];
  stocks: Stock[];
  currentTimestamp?: string;
  onSelectStock: (symbol: string) => void;
  onNavigateMarkets: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  account,
  holdings,
  stocks,
  currentTimestamp,
  onSelectStock,
  onNavigateMarkets
}) => {
  const [trajectoryPoints, setTrajectoryPoints] = useState<PortfolioTrajectoryPoint[]>([]);
  const [loadingTrajectory, setLoadingTrajectory] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoadingTrajectory(true);
    PortfolioApi.getPortfolioHistory(currentTimestamp)
      .then((data) => {
        if (active) {
          setTrajectoryPoints(data);
          setLoadingTrajectory(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load portfolio trajectory:', err);
        if (active) setLoadingTrajectory(false);
      });
    return () => {
      active = false;
    };
  }, [currentTimestamp]);

  const formatINR = (val?: number | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isProfitable = (account?.totalProfitLoss ?? 0) >= 0;

  // Top movers calculation with sparkline points from PostgreSQL
  const movers = [...stocks]
    .map((s) => {
      const open = s.currentMarketData?.open ?? 0;
      const close = s.currentMarketData?.close ?? s.currentPrice ?? 0;
      const high = s.currentMarketData?.high ?? close;
      const low = s.currentMarketData?.low ?? open;
      const pct = open > 0 ? ((close - open) / open) * 100 : 0;
      const sparkData = s.sparkline && s.sparkline.length > 0 ? s.sparkline : [open, low, (open + close) / 2, high, close];
      return { ...s, pct, close, sparkData };
    })
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 5);

  const hasTrades = holdings.length > 0 || (account?.cashBalance !== account?.initialBalance);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PortfolioTrajectoryPoint;
      const isPlPositive = data.profitLoss >= 0;
      return (
        <div className="bg-[#141E30] border border-[rgba(255,255,255,0.12)] rounded-lg p-3 shadow-xl font-sans text-xs">
          <div className="text-typo-muted text-[11px] mb-1">{data.date} · {data.time}</div>
          <div className="text-white font-mono font-semibold text-sm mb-1">
            {formatINR(data.totalValue)}
          </div>
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span className="text-typo-muted">P/L:</span>
            <span className={isPlPositive ? 'text-[#35D49A]' : 'text-[#FF5D73]'}>
              {isPlPositive ? '+' : ''}{formatINR(data.profitLoss)} ({isPlPositive ? '+' : ''}{data.profitLossPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-8 sm:p-10 overflow-y-auto max-w-[1400px] w-full mx-auto space-y-8 select-none">
      {/* 1. Welcome Header (Section 10) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-sm font-sans text-typo-secondary mt-1">
            Your simulated market portfolio at a glance
          </p>
        </div>

        <button
          onClick={onNavigateMarkets}
          className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-md bg-[#101827] hover:bg-[#141E30] border border-[rgba(255,255,255,0.08)] text-xs font-sans font-medium text-white transition-all duration-150"
        >
          <span>Explore Markets</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#4F7CFF]" />
        </button>
      </div>

      {/* 2. Hero Section: 12-column grid (Section 11, 12, 37) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card: Portfolio Value (8 columns) */}
        <div className="lg:col-span-8 relative rounded-lg p-6 sm:p-8 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated overflow-hidden group">
          {/* Subtle Ambient Blue Glow Behind (Section 11) */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#4F7CFF]/10 blur-3xl pointer-events-none" />

          {/* Decorative "Market Horizon" Ascending Graph Motif (Section 12 & 45) */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.07] overflow-hidden">
            <svg width="340" height="150" viewBox="0 0 340 150" fill="none">
              <path
                d="M10 140 Q 90 120, 150 90 T 260 40 T 330 10"
                stroke="#4F7CFF"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M10 145 Q 80 135, 140 115 T 240 70 T 330 35"
                stroke="#8B7CFF"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-semibold font-sans text-typo-secondary">
                  Portfolio Value
                </span>
                <span className="px-2 py-0.5 rounded-pill bg-[#4F7CFF]/10 text-[#6E96FF] text-[10px] font-sans font-medium border border-[#4F7CFF]/20">
                  Virtual capital
                </span>
              </div>
              <span className="text-xs font-sans text-typo-muted">
                Initial: {formatINR(account?.initialBalance)}
              </span>
            </div>

            <div>
              {/* 44px Hero Number (Section 39) */}
              <div className="text-3xl sm:text-5xl font-semibold font-mono text-white tracking-tight tnum">
                {formatINR(account?.totalAccountValue)}
              </div>

              <div className="mt-3 flex items-center space-x-2 font-mono text-sm">
                <span
                  className={`font-semibold tnum ${
                    isProfitable ? 'text-[#35D49A]' : 'text-[#FF5D73]'
                  }`}
                >
                  {isProfitable ? '+' : ''}{formatINR(account?.totalProfitLoss)}
                </span>
                <span
                  className={`font-semibold tnum ${
                    isProfitable ? 'text-[#35D49A]' : 'text-[#FF5D73]'
                  }`}
                >
                  ({isProfitable ? '+' : ''}
                  {(account?.totalProfitLossPercentage ?? 0).toFixed(2)}%)
                </span>
                <span className="text-typo-muted font-sans text-xs ml-1">total all-time P/L</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-typo-secondary">
              <div>
                <span className="text-typo-muted block text-[11px]">Unrealized P/L</span>
                <span className={`font-semibold font-mono mt-0.5 block ${(account?.unrealizedProfitLoss ?? 0) >= 0 ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
                  {(account?.unrealizedProfitLoss ?? 0) >= 0 ? '+' : ''}{formatINR(account?.unrealizedProfitLoss)}
                </span>
              </div>
              <div>
                <span className="text-typo-muted block text-[11px]">Realized P/L</span>
                <span className={`font-semibold font-mono mt-0.5 block ${(account?.realizedProfitLoss ?? 0) >= 0 ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
                  {(account?.realizedProfitLoss ?? 0) >= 0 ? '+' : ''}{formatINR(account?.realizedProfitLoss)}
                </span>
              </div>
              <div>
                <span className="text-typo-muted block text-[11px]">Invested Equity</span>
                <span className="font-semibold text-white font-mono mt-0.5 block">{formatINR(account?.investedEquity ?? account?.holdingsValue ?? 0)}</span>
              </div>
              <div>
                <span className="text-typo-muted block text-[11px]">Available Cash</span>
                <span className="font-semibold text-[#4F7CFF] font-mono mt-0.5 block">{formatINR(account?.availableCash ?? account?.cashBalance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Card (4 columns) */}
        <div className="lg:col-span-4 rounded-lg p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold font-sans text-typo-secondary mb-3">
              Portfolio Liquidity & Holdings
            </div>
            <div className="space-y-3 font-sans">
              <div className="p-3 rounded-md bg-[#0B1220] border border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Wallet className="w-4 h-4 text-[#4F7CFF]" />
                  <span className="text-xs text-typo-secondary">Available Cash</span>
                </div>
                <span className="text-sm font-semibold font-mono text-white tnum">
                  {formatINR(account?.availableCash ?? account?.cashBalance)}
                </span>
              </div>

              <div className="p-3 rounded-md bg-[#0B1220] border border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-[#8B7CFF]" />
                  <span className="text-xs text-typo-secondary">Holdings Value</span>
                </div>
                <span className="text-sm font-semibold font-mono text-white tnum">
                  {formatINR(account?.holdingsValue ?? account?.investedEquity ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-md bg-gradient-to-r from-[rgba(79,124,255,0.12)] to-[rgba(139,124,255,0.08)] border border-[rgba(79,124,255,0.2)] text-xs text-typo-secondary font-sans leading-relaxed">
            <div className="font-semibold text-white mb-0.5">Simulated Execution</div>
            All trades are backed by PostgreSQL atomic transactions at exact 30-min market ticks.
          </div>
        </div>
      </div>

      {/* 3. Performance Chart & Top Movers (Section 13, 14, 15, 16, 37) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Chart (8 columns) */}
        <div className="lg:col-span-8 rounded-lg p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold font-sans text-white">
                Portfolio performance
              </h2>
              <p className="text-xs font-sans text-typo-muted mt-0.5">
                Valuation trajectory across simulated timeline
              </p>
            </div>
            {!hasTrades && (
              <span className="text-xs font-sans text-[#4F7CFF] bg-[#4F7CFF]/10 px-2.5 py-1 rounded-md border border-[#4F7CFF]/20">
                Baseline Starting Capital
              </span>
            )}
          </div>

          {/* Chart Canvas */}
          <div className="h-64 chart-grid-bg rounded-md p-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="overviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F7CFF" stopOpacity={0.24} />
                    <stop offset="90%" stopColor="#4F7CFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} orientation="right" domain={['auto', 'auto']} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="totalValue" stroke="#5B8CFF" strokeWidth={2} fill="url(#overviewGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {!hasTrades && (
            <div className="mt-3 text-center text-xs font-sans text-typo-muted">
              Starting capital {formatINR(account?.initialBalance ?? 1000000)} • Your performance curve will dynamically shift as you execute buy & sell orders.
            </div>
          )}
        </div>

        {/* Top Movers with Mini Sparklines (4 columns) (Section 16 & 17) */}
        <div className="lg:col-span-4 rounded-lg p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold font-sans text-white">
                Top movers
              </h2>
              <span className="text-[11px] font-sans text-typo-muted">Today</span>
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.05)] border-y border-[rgba(255,255,255,0.05)]">
              {movers.map((s) => {
                const isUp = s.pct >= 0;
                return (
                  <button
                    key={s.symbol}
                    onClick={() => onSelectStock(s.symbol)}
                    className="w-full py-3 flex items-center justify-between hover:bg-[#141E30] px-2 rounded-md transition-colors text-left group"
                  >
                    <div>
                      <span className="font-bold text-white text-xs font-sans group-hover:text-[#4F7CFF] transition-colors block">
                        {s.symbol}
                      </span>
                      <span className="text-[11px] text-typo-muted font-sans line-clamp-1">
                        {s.companyName}
                      </span>
                    </div>

                    {/* Mini Sparkline (Section 17) */}
                    <div className="px-2">
                      <Sparkline data={s.sparkData} isPositive={isUp} width={44} height={18} />
                    </div>

                    <div className="text-right">
                      <span className="text-white text-xs font-mono font-medium block tnum">
                        {formatINR(s.close)}
                      </span>
                      <span className={`text-[11px] font-mono font-semibold tnum ${isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
                        {isUp ? '+' : ''}{s.pct.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onNavigateMarkets}
            className="mt-4 w-full py-2 rounded-md bg-[#0B1220] hover:bg-[#141E30] border border-[rgba(255,255,255,0.06)] text-xs font-sans text-typo-secondary hover:text-white transition-colors text-center"
          >
            View all 10 instruments →
          </button>
        </div>
      </div>

      {/* 4. Your Portfolio Section (12 columns) (Section 18) */}
      <div className="rounded-lg p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold font-sans text-white">
            Your portfolio holdings
          </h2>
          <span className="text-xs font-sans text-typo-muted">
            {holdings.length} active positions
          </span>
        </div>

        {holdings.length === 0 ? (
          /* Visually Designed Empty State (Section 18) */
          <div className="py-12 px-6 text-center space-y-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[rgba(79,124,255,0.15)] to-[rgba(139,124,255,0.1)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center mx-auto shadow-glow-sm">
              <span className="text-[#4F7CFF] text-lg font-bold">◇</span>
            </div>
            <h3 className="text-sm font-semibold font-sans text-white">
              Your portfolio is empty
            </h3>
            <p className="text-xs font-sans text-typo-muted leading-relaxed">
              You have {formatINR(account?.cashBalance)} in virtual capital. Start exploring the simulated market and place your first trade.
            </p>
            <button
              onClick={onNavigateMarkets}
              className="mt-2 px-5 py-2 rounded-md bg-gradient-to-r from-[#4F7CFF] to-[#6C63FF] hover:brightness-110 text-white text-xs font-sans font-semibold transition-all shadow-glow-sm"
            >
              Explore Markets →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="text-[11px] uppercase tracking-wider text-typo-muted border-b border-[rgba(255,255,255,0.06)]">
                <tr>
                  <th className="py-3 px-3 font-medium">Asset</th>
                  <th className="py-3 px-3 text-right font-medium">Qty</th>
                  <th className="py-3 px-3 text-right font-medium">Avg Price</th>
                  <th className="py-3 px-3 text-right font-medium">Current Price</th>
                  <th className="py-3 px-3 text-right font-medium">Value</th>
                  <th className="py-3 px-3 text-right font-medium">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-typo-secondary">
                {holdings.map((h) => {
                  const isUp = h.profitLoss >= 0;
                  return (
                    <tr
                      key={h.id}
                      onClick={() => onSelectStock(h.symbol)}
                      className="hover:bg-[#141E30] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white block">{h.symbol}</span>
                        <span className="text-[11px] text-typo-muted">{h.companyName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-white font-mono tnum">{h.quantity}</td>
                      <td className="py-3.5 px-3 text-right font-mono tnum">{formatINR(h.averageBuyPrice)}</td>
                      <td className="py-3.5 px-3 text-right text-white font-mono font-semibold tnum">{formatINR(h.currentPrice)}</td>
                      <td className="py-3.5 px-3 text-right text-white font-mono font-semibold tnum">{formatINR(h.currentValue)}</td>
                      <td className={`py-3.5 px-3 text-right font-mono font-semibold tnum ${isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
                        {isUp ? '+' : ''}{formatINR(h.profitLoss)} ({isUp ? '+' : ''}{h.profitLossPercentage.toFixed(2)}%)
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
