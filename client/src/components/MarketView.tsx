import React, { useState, useEffect } from 'react';
import { Stock, MarketData } from '../types';
import { MarketWatchlist } from './MarketWatchlist';
import { SelectedStockHeader } from './SelectedStockHeader';
import { PriceChart } from './PriceChart';
import { MarketStats } from './MarketStats';
import { SimulationTimeline } from './SimulationTimeline';
import { MarketApi } from '../services/api';

interface MarketViewProps {
  stocks: Stock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  currentTimestamp: string;
  timestamps: string[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  replaySpeed: number;
  setReplaySpeed: (speed: number) => void;
  onOpenTrade: (stock: Stock) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock,
  currentTimestamp,
  timestamps,
  currentIndex,
  onSelectIndex,
  isPlaying,
  setIsPlaying,
  replaySpeed,
  setReplaySpeed,
  onOpenTrade
}) => {
  const [timeRange, setTimeRange] = useState<'1D' | '5D' | 'ALL'>('ALL');
  const [history, setHistory] = useState<MarketData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [exactPriceData, setExactPriceData] = useState<MarketData | null>(null);

  const selectedStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0] || null;

  // Load history when stock changes
  useEffect(() => {
    if (!selectedSymbol) return;

    let active = true;
    setLoadingHistory(true);

    MarketApi.getStockHistory(selectedSymbol)
      .then((res) => {
        if (active) {
          setHistory(res.history);
          setLoadingHistory(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSymbol]);

  // Load exact price at the active replay timestamp
  useEffect(() => {
    if (!selectedSymbol || !currentTimestamp) return;

    MarketApi.getExactPrice(selectedSymbol, currentTimestamp)
      .then((data) => {
        setExactPriceData(data);
      })
      .catch((err) => {
        console.warn('Exact price fetch warning:', err);
      });
  }, [selectedSymbol, currentTimestamp]);

  // Filter history based on time range and current simulation timestamp
  const simDate = currentTimestamp ? new Date(currentTimestamp) : new Date();

  const filteredHistory = history.filter((item) => {
    const itemDate = new Date(item.timestamp);
    // Never show future data beyond current simulation timestamp!
    if (itemDate > simDate) return false;

    if (timeRange === '1D') {
      return itemDate.toDateString() === simDate.toDateString();
    }
    if (timeRange === '5D') {
      const fiveDaysAgo = new Date(simDate);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 7);
      return itemDate >= fiveDaysAgo;
    }
    return true; // ALL
  });

  const chartData = filteredHistory.length > 0 ? filteredHistory : history.slice(0, 13);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Upper Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Secondary: Market Watchlist */}
        <MarketWatchlist
          stocks={stocks}
          selectedSymbol={selectedSymbol}
          onSelectStock={onSelectStock}
        />

        {/* Primary: Selected Market Visualization Cockpit */}
        <div className="flex-1 flex flex-col overflow-y-auto ambient-bg">
          {selectedStock && (
            <>
              {/* Selected Stock Header */}
              <SelectedStockHeader
                stock={selectedStock}
                currentMarketData={exactPriceData}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                isReplaying={isPlaying}
                onOpenTrade={() => onOpenTrade(selectedStock)}
              />

              {/* Price Chart (Visual Anchor) */}
              <div className="flex-1 p-4 sm:p-8 flex flex-col justify-center max-w-5xl mx-auto w-full">
                <PriceChart data={chartData} loading={loadingHistory} />
              </div>

              {/* Compact Market Stats Strip (No Cards) */}
              <div className="max-w-5xl mx-auto w-full">
                <MarketStats marketData={exactPriceData} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Utility: Simulation Timeline */}
      <SimulationTimeline
        timestamps={timestamps}
        currentIndex={currentIndex}
        onSelectIndex={onSelectIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        replaySpeed={replaySpeed}
        setReplaySpeed={setReplaySpeed}
      />
    </div>
  );
};
