import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Stock, PortfolioHolding, AccountSummary } from '../types';
import { TradeApi, MarketApi } from '../services/api';

interface TradeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  currentTimestamp: string;
  account: AccountSummary | null;
  holdings: PortfolioHolding[];
  onTradeSuccess: () => void;
}

export const TradeDrawer: React.FC<TradeDrawerProps> = ({
  isOpen,
  onClose,
  stock,
  currentTimestamp,
  account,
  holdings,
  onTradeSuccess
}) => {
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(1);
  const [exactPrice, setExactPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !stock || !currentTimestamp) return;

    setLoadingPrice(true);
    setExactPrice(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    MarketApi.getExactPrice(stock.symbol, currentTimestamp)
      .then((data) => {
        setExactPrice(data.close);
        setLoadingPrice(false);
      })
      .catch((err) => {
        setLoadingPrice(false);
        setErrorMsg(err.response?.data?.error || 'Failed to fetch price from PostgreSQL');
      });
  }, [isOpen, stock, currentTimestamp]);

  if (!isOpen || !stock) return null;

  const currentHolding = holdings.find((h) => h.symbol === stock.symbol);
  const ownedQuantity = currentHolding ? currentHolding.quantity : 0;
  const cashBalance = account?.cashBalance ?? 0;

  const executionPrice = exactPrice ?? stock.currentPrice ?? 0;
  const totalAmount = quantity * executionPrice;

  const canAfford = cashBalance >= totalAmount;
  const hasEnoughShares = ownedQuantity >= quantity;
  const isValidTrade = mode === 'BUY' ? canAfford && quantity > 0 : hasEnoughShares && quantity > 0;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleSetMax = () => {
    if (mode === 'BUY') {
      if (executionPrice > 0) {
        const maxQty = Math.floor(cashBalance / executionPrice);
        setQuantity(Math.max(1, maxQty));
      }
    } else {
      setQuantity(Math.max(1, ownedQuantity));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTrade || executionPrice <= 0) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        symbol: stock.symbol,
        quantity: Math.floor(quantity),
        timestamp: currentTimestamp
      };

      if (mode === 'BUY') {
        const res = await TradeApi.buy(payload);
        setSuccessMsg(res.message);
      } else {
        const res = await TradeApi.sell(payload);
        setSuccessMsg(res.message);
      }

      // Immediately refresh authoritative backend account, holdings & transactions
      onTradeSuccess();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Order execution failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="w-full max-w-sm bg-[#101827] border-l border-[rgba(255,255,255,0.08)] h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
            <div>
              <div className="text-[11px] font-sans uppercase tracking-wider text-typo-muted">
                Order Placement
              </div>
              <h3 className="text-lg font-bold font-sans text-white mt-0.5">
                Trade {stock.symbol}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-typo-muted hover:text-white rounded-md hover:bg-[#141E30] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-[#0B1220] rounded-md border border-[rgba(255,255,255,0.06)] text-xs font-sans">
            <button
              type="button"
              onClick={() => { setMode('BUY'); setErrorMsg(null); }}
              className={`py-2 rounded-md font-semibold transition-all ${
                mode === 'BUY'
                  ? 'bg-[#141E30] text-[#35D49A] border border-[#35D49A]/40 shadow-sm'
                  : 'text-typo-muted hover:text-white'
              }`}
            >
              BUY ORDER
            </button>
            <button
              type="button"
              onClick={() => { setMode('SELL'); setErrorMsg(null); }}
              className={`py-2 rounded-md font-semibold transition-all ${
                mode === 'SELL'
                  ? 'bg-[#141E30] text-[#FF5D73] border border-[#FF5D73]/40 shadow-sm'
                  : 'text-typo-muted hover:text-white'
              }`}
            >
              SELL ORDER
            </button>
          </div>

          {/* Price & Balance Row */}
          <div className="mt-5 py-3.5 border-y border-[rgba(255,255,255,0.06)] flex items-baseline justify-between font-sans">
            <div>
              <span className="text-[10px] uppercase text-typo-muted block">Current Price</span>
              <span className="text-lg font-bold font-mono text-white tnum">
                {loadingPrice ? 'Querying...' : formatINR(executionPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-typo-muted block">
                {mode === 'BUY' ? 'Cash Available' : 'Shares Owned'}
              </span>
              <span className="text-xs font-medium font-mono text-typo-secondary tnum">
                {mode === 'BUY' ? formatINR(cashBalance) : `${ownedQuantity} shares`}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-sans">
                <label className="text-typo-secondary font-medium">Quantity</label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] text-[#4F7CFF] hover:underline font-medium"
                >
                  Set Max
                </button>
              </div>

              <input
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] focus:border-[#4F7CFF] rounded-md px-3.5 py-2 text-sm font-mono text-white focus:outline-none"
              />

              {/* Quick Steppers */}
              <div className="grid grid-cols-4 gap-1.5 mt-2 font-mono text-[11px]">
                {[1, 5, 10, 25].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev + step))}
                    className="py-1 bg-[#141E30] hover:bg-[#19243A] text-typo-secondary hover:text-white rounded border border-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    +{step}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Total */}
            <div className="py-3.5 border-t border-[rgba(255,255,255,0.06)] flex items-baseline justify-between font-sans text-xs">
              <span className="text-typo-secondary">
                Estimated {mode === 'BUY' ? 'Cost' : 'Proceeds'}
              </span>
              <span className="text-base font-bold font-mono text-white tnum">
                {formatINR(totalAmount)}
              </span>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="p-3 rounded-md bg-[#FF5D73]/10 border border-[#FF5D73]/25 text-[#FF5D73] text-xs flex items-start space-x-2 font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-md bg-[#35D49A]/10 border border-[#35D49A]/25 text-[#35D49A] text-xs flex items-start space-x-2 font-sans">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Restrained BUY / SELL Buttons (Section 24) */}
            <button
              type="submit"
              disabled={submitting || !isValidTrade || loadingPrice || executionPrice <= 0}
              className={`w-full py-3 rounded-md font-sans text-xs font-bold tracking-wider transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
                mode === 'BUY'
                  ? 'bg-[#101827] text-[#35D49A] border border-[#35D49A] hover:bg-[#35D49A]/10 shadow-sm'
                  : 'bg-[#101827] text-[#FF5D73] border border-[#FF5D73] hover:bg-[#FF5D73]/10 shadow-sm'
              }`}
            >
              {submitting ? 'EXECUTING TRANSACTION...' : `CONFIRM ${mode} ORDER (${quantity})`}
            </button>
          </form>
        </div>

        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] text-[11px] font-sans text-typo-muted text-center">
          Executed with PostgreSQL transaction safety
        </div>
      </div>
    </div>
  );
};
