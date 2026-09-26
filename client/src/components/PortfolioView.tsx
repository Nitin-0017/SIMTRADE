import React from 'react';
import { PortfolioHolding, AccountSummary, Stock } from '../types';
import { Wallet, PieChart, TrendingUp, ArrowRight } from 'lucide-react';

interface PortfolioViewProps {
  account: AccountSummary | null;
  holdings: PortfolioHolding[];
  onOpenTrade: (stock: Stock) => void;
  onSelectStock: (symbol: string) => void;
  onNavigateMarkets: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  account,
  holdings,
  onOpenTrade,
  onSelectStock,
  onNavigateMarkets
}) => {
  const formatINR = (val?: number | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isProfitable = (account?.totalProfitLoss ?? 0) >= 0;

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-[1536px] w-full mx-auto space-y-8 select-none">
      {/* Editorial Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white">
          Portfolio
        </h1>
        <p className="text-sm font-sans text-typo-secondary mt-1">
          Detailed asset breakdown and position performance
        </p>
      </div>

      {/* Summary Cards with Elevated Navy Surfaces & Clear Financial Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-4.5 lg:gap-5">
        {/* 1. PORTFOLIO VALUE (Cash + Holdings Market Value) */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated min-h-[148px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-typo-muted font-sans font-semibold block">
            Portfolio Value
          </span>
          <div className="my-auto py-1 text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-semibold font-mono text-white tnum tracking-tight">
            {formatINR(account?.portfolioValue ?? account?.totalAccountValue)}
          </div>
          <span className="text-xs font-sans text-typo-muted block">
            Cash + Holdings Equity
          </span>
        </div>

        {/* 2. AVAILABLE CASH (From PostgreSQL Account) */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated min-h-[148px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-typo-muted font-sans font-semibold block">
            Available Cash
          </span>
          <div className="my-auto py-1 text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-semibold font-mono text-[#35D49A] tnum tracking-tight">
            {formatINR(account?.availableCash ?? account?.cashBalance)}
          </div>
          <span className="text-xs font-sans text-typo-muted block">
            Virtual capital available
          </span>
        </div>

        {/* 3. INVESTED EQUITY (Current Market Value of All Open Positions at Active Timestamp) */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated min-h-[148px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-typo-muted font-sans font-semibold block">
            Invested Equity
          </span>
          <div className="my-auto py-1 text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-semibold font-mono text-white tnum tracking-tight">
            {formatINR(account?.investedEquity ?? account?.holdingsValue ?? account?.holdingsMarketValue ?? 0)}
          </div>
          <span className="text-xs font-sans text-typo-muted block">
            {holdings.length} open position{holdings.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* 4. UNREALIZED P/L (Open Positions: Current Price vs Avg Buy Price) */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated min-h-[148px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-typo-muted font-sans font-semibold block">
            Unrealized P/L
          </span>
          <div
            className={`my-auto py-1 text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-semibold font-mono tnum tracking-tight ${
              (account?.unrealizedPnL ?? account?.unrealizedProfitLoss ?? 0) > 0
                ? 'text-[#35D49A]'
                : (account?.unrealizedPnL ?? account?.unrealizedProfitLoss ?? 0) < 0
                ? 'text-[#FF5D73]'
                : 'text-white'
            }`}
          >
            {(account?.unrealizedPnL ?? account?.unrealizedProfitLoss ?? 0) > 0 ? '+' : ''}{formatINR(account?.unrealizedPnL ?? account?.unrealizedProfitLoss)}
          </div>
          <span className="text-xs font-sans text-typo-muted block">
            Open positions
          </span>
        </div>

        {/* 5. REALIZED P/L (From Completed SELL Transactions) */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated min-h-[148px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-typo-muted font-sans font-semibold block">
            Realized P/L
          </span>
          <div
            className={`my-auto py-1 text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-semibold font-mono tnum tracking-tight ${
              (account?.realizedPnL ?? account?.realizedProfitLoss ?? 0) > 0
                ? 'text-[#35D49A]'
                : (account?.realizedPnL ?? account?.realizedProfitLoss ?? 0) < 0
                ? 'text-[#FF5D73]'
                : 'text-white'
            }`}
          >
            {(account?.realizedPnL ?? account?.realizedProfitLoss ?? 0) > 0 ? '+' : ''}{formatINR(account?.realizedPnL ?? account?.realizedProfitLoss)}
          </div>
          <span className="text-xs font-sans text-typo-muted block">
            Completed sales
          </span>
        </div>

        {/* 6. TOTAL RETURN (Realized + Unrealized / ₹10,00,000) */}
        <div className="rounded-xl p-5 sm:p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated min-h-[148px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.12)] transition-colors">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider text-typo-muted font-sans font-semibold block">
            Total Return
          </span>
          <div
            className={`my-auto py-0.5 text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-semibold font-mono tnum tracking-tight ${
              (account?.totalReturn ?? account?.totalProfitLoss ?? 0) > 0
                ? 'text-[#35D49A]'
                : (account?.totalReturn ?? account?.totalProfitLoss ?? 0) < 0
                ? 'text-[#FF5D73]'
                : 'text-white'
            }`}
          >
            {(account?.totalReturn ?? account?.totalProfitLoss ?? 0) > 0 ? '+' : ''}{formatINR(account?.totalReturn ?? account?.totalProfitLoss)}
          </div>
          <span
            className={`text-xs font-mono font-medium block ${
              (account?.totalReturn ?? account?.totalProfitLoss ?? 0) > 0
                ? 'text-[#35D49A]'
                : (account?.totalReturn ?? account?.totalProfitLoss ?? 0) < 0
                ? 'text-[#FF5D73]'
                : 'text-typo-muted'
            }`}
          >
            {(account?.totalReturn ?? account?.totalProfitLoss ?? 0) > 0 ? '+' : ''}{(account?.totalReturnPercent ?? account?.totalReturnPercentage ?? account?.totalProfitLossPercentage ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Holdings Section */}
      <div className="rounded-lg p-6 bg-[#101827] border border-[rgba(255,255,255,0.08)] shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold font-sans text-white">
              Current Holdings
            </h2>
            <p className="text-xs font-sans text-typo-muted mt-0.5">
              Positions updated continuously against active simulation ticks
            </p>
          </div>
          <span className="text-xs font-mono text-typo-muted">
            {holdings.length} stocks held
          </span>
        </div>

        {holdings.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
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
          <div className="overflow-x-auto border-t border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-left text-xs font-sans">
              <thead className="text-[11px] uppercase tracking-wider text-typo-muted border-b border-[rgba(255,255,255,0.06)]">
                <tr>
                  <th className="py-3.5 px-3 font-medium">Asset</th>
                  <th className="py-3.5 px-3 text-right font-medium">Qty</th>
                  <th className="py-3.5 px-3 text-right font-medium">Avg Price</th>
                  <th className="py-3.5 px-3 text-right font-medium">Current Price</th>
                  <th className="py-3.5 px-3 text-right font-medium">Invested</th>
                  <th className="py-3.5 px-3 text-right font-medium">Current Value</th>
                  <th className="py-3.5 px-3 text-right font-medium">P/L (₹)</th>
                  <th className="py-3.5 px-3 text-right font-medium">P/L (%)</th>
                  <th className="py-3.5 px-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-typo-secondary">
                {holdings.map((h) => {
                  const isUp = h.profitLoss >= 0;
                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-[#141E30] transition-colors"
                    >
                      <td className="py-4 px-3">
                        <button
                          onClick={() => onSelectStock(h.symbol)}
                          className="hover:text-[#4F7CFF] transition-colors text-left"
                        >
                          <span className="font-bold text-white block font-sans">{h.symbol}</span>
                          <span className="text-[11px] text-typo-muted font-sans line-clamp-1">{h.companyName}</span>
                        </button>
                      </td>
                      <td className="py-4 px-3 text-right text-white font-mono tnum">{h.quantity}</td>
                      <td className="py-4 px-3 text-right font-mono tnum">{formatINR(h.averageBuyPrice)}</td>
                      <td className="py-4 px-3 text-right text-white font-mono font-semibold tnum">{formatINR(h.currentPrice)}</td>
                      <td className="py-4 px-3 text-right font-mono tnum">{formatINR(h.investedValue)}</td>
                      <td className="py-4 px-3 text-right text-white font-mono font-semibold tnum">{formatINR(h.currentValue)}</td>
                      <td className={`py-4 px-3 text-right font-mono font-semibold tnum ${isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
                        {isUp ? '+' : ''}{formatINR(h.profitLoss)}
                      </td>
                      <td className={`py-4 px-3 text-right font-mono font-semibold tnum ${isUp ? 'text-[#35D49A]' : 'text-[#FF5D73]'}`}>
                        {isUp ? '+' : ''}{h.profitLossPercentage.toFixed(2)}%
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() =>
                            onOpenTrade({
                              id: h.stockId,
                              symbol: h.symbol,
                              companyName: h.companyName
                            })
                          }
                          className="px-3 py-1 text-xs font-sans font-medium rounded bg-[#141E30] hover:bg-[#19243A] text-white border border-[rgba(255,255,255,0.08)] transition-colors"
                        >
                          Trade
                        </button>
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
