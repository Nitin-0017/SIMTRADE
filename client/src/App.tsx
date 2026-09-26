import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MarketView } from './components/MarketView';
import { OverviewView } from './components/OverviewView';
import { PortfolioView } from './components/PortfolioView';
import { ActivityView } from './components/ActivityView';
import { TradeDrawer } from './components/TradeDrawer';
import { Stock, PortfolioHolding, AccountSummary, Transaction } from './types';
import { MarketApi, PortfolioApi } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Simulation Replay State with persistent timestamp index
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const saved = localStorage.getItem('simtrade_simulation_index');
    return saved !== null ? Math.max(0, Number(saved)) : 0;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  useEffect(() => {
    localStorage.setItem('simtrade_simulation_index', String(currentIndex));
  }, [currentIndex]);

  // Data State
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('TCS');
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Trade Drawer State
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState<boolean>(false);
  const [tradeStock, setTradeStock] = useState<Stock | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  const currentTimestamp = timestamps[currentIndex] || '';

  // 1. Initial Timestamps & Portfolio Load
  useEffect(() => {
    // Initial fetch of portfolio from PostgreSQL so cards show live data immediately
    PortfolioApi.getPortfolio()
      .then((data) => {
        setAccount(data.account);
        setHoldings(data.holdings);
      })
      .catch((err) => console.error('Initial portfolio load error:', err));

    MarketApi.getTimestamps()
      .then((data) => {
        if (data.timestamps && data.timestamps.length > 0) {
          setTimestamps(data.timestamps);
          const saved = localStorage.getItem('simtrade_simulation_index');
          if (saved !== null) {
            const idx = Number(saved);
            if (idx >= 0 && idx < data.timestamps.length) {
              setCurrentIndex(idx);
              return;
            }
          }
          setCurrentIndex(0);
        }
      })
      .catch((err) => console.error('Timestamps load error:', err));
  }, []);

  // 2. Fetch market data & portfolio whenever timestamp or active tab updates
  const refreshData = useCallback(() => {
    if (currentTimestamp) {
      MarketApi.getStocks(currentTimestamp)
        .then(setStocks)
        .catch((err) => console.error('Stocks fetch error:', err));
    }

    PortfolioApi.getPortfolio(currentTimestamp || undefined)
      .then((data) => {
        setAccount(data.account);
        setHoldings(data.holdings);
      })
      .catch((err) => console.error('Portfolio fetch error:', err));

    PortfolioApi.getTransactions(100)
      .then(setTransactions)
      .catch((err) => console.error('Transactions fetch error:', err));
  }, [currentTimestamp]);

  useEffect(() => {
    refreshData();
  }, [activeTab, refreshData]);

  const handleOpenTrade = (stock: Stock) => {
    setTradeStock(stock);
    setTradeDrawerOpen(true);
  };

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    if (activeTab !== 'markets') {
      setActiveTab('markets');
    }
  };

  const titles: Record<NavTab, string> = {
    overview: 'Overview',
    markets: 'Markets',
    portfolio: 'Portfolio',
    activity: 'Activity',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden ambient-bg text-typo-primary font-sans">
      {/* Clean Sidebar with Mobile Drawer support */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isReplaying={isPlaying}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Minimal Top Bar with Inline Metrics */}
        <TopBar
          title={titles[activeTab]}
          currentTimestamp={currentTimestamp}
          account={account}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />

        {/* Dynamic Main Views */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'markets' && (
            <MarketView
              stocks={stocks}
              selectedSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
              currentTimestamp={currentTimestamp}
              timestamps={timestamps}
              currentIndex={currentIndex}
              onSelectIndex={setCurrentIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              replaySpeed={replaySpeed}
              setReplaySpeed={setReplaySpeed}
              onOpenTrade={handleOpenTrade}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewView
              account={account}
              holdings={holdings}
              stocks={stocks}
              currentTimestamp={currentTimestamp}
              onSelectStock={handleSelectStock}
              onNavigateMarkets={() => setActiveTab('markets')}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioView
              account={account}
              holdings={holdings}
              onOpenTrade={handleOpenTrade}
              onSelectStock={handleSelectStock}
              onNavigateMarkets={() => setActiveTab('markets')}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityView
              transactions={transactions}
              onSelectStock={handleSelectStock}
            />
          )}
        </div>
      </div>

      {/* Contextual Trade Drawer */}
      <TradeDrawer
        isOpen={tradeDrawerOpen}
        onClose={() => setTradeDrawerOpen(false)}
        stock={tradeStock}
        currentTimestamp={currentTimestamp}
        account={account}
        holdings={holdings}
        onTradeSuccess={refreshData}
      />
    </div>
  );
}

export default App;
