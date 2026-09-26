import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Stock } from '../types';
import { WatchlistRow } from './WatchlistRow';

interface MarketWatchlistProps {
  stocks: Stock[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
}

export const MarketWatchlist: React.FC<MarketWatchlistProps> = ({
  stocks,
  selectedSymbol,
  onSelectStock
}) => {
  const [search, setSearch] = useState('');

  const filteredStocks = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full md:w-[280px] lg:w-[300px] shrink-0 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.07)] bg-[#0B1220] flex flex-col md:h-full select-none max-h-48 md:max-h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-typo-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search instruments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#101827] border border-[rgba(255,255,255,0.08)] focus:border-[#4F7CFF] rounded-md text-white placeholder-typo-muted focus:outline-none font-sans"
          />
        </div>
        <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] font-sans text-typo-muted">
          <span>Watchlist</span>
          <span>{filteredStocks.length} instruments</span>
        </div>
      </div>

      {/* Rows Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.02)]">
        {filteredStocks.length === 0 ? (
          <div className="p-8 text-center text-xs text-typo-muted font-sans">
            No instruments found
          </div>
        ) : (
          filteredStocks.map((stock) => (
            <WatchlistRow
              key={stock.symbol}
              stock={stock}
              isActive={stock.symbol === selectedSymbol}
              onSelect={onSelectStock}
            />
          ))
        )}
      </div>
    </div>
  );
};
