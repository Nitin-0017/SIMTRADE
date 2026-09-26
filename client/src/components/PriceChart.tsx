import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { MarketData } from '../types';

interface PriceChartProps {
  data: MarketData[];
  loading?: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, loading }) => {
  const lastDirectionRef = React.useRef<'up' | 'down' | 'neutral'>('neutral');

  // 1. Determine direction from actual simulation data (Task 1)
  const direction = React.useMemo(() => {
    if (!data || data.length < 2) {
      return 'neutral';
    }

    const currentPrice = Number(data[data.length - 1]?.close ?? 0);
    const previousPrice = Number(data[data.length - 2]?.close ?? 0);

    if (currentPrice > previousPrice) {
      lastDirectionRef.current = 'up';
      return 'up';
    } else if (currentPrice < previousPrice) {
      lastDirectionRef.current = 'down';
      return 'down';
    }

    // 4. No price change: preserve previous direction
    return lastDirectionRef.current;
  }, [data]);

  // Color mapping: up -> #35D49A (green), down -> #FF5D73 (red), neutral -> #4F7CFF (blue)
  const colorConfig = React.useMemo(() => {
    if (direction === 'up') {
      return {
        stroke: '#35D49A',
        fill: '#35D49A',
        label: '▲ Upward',
        badgeCls: 'text-[#35D49A] border-[#35D49A]/30 bg-[#35D49A]/10'
      };
    }
    if (direction === 'down') {
      return {
        stroke: '#FF5D73',
        fill: '#FF5D73',
        label: '▼ Downward',
        badgeCls: 'text-[#FF5D73] border-[#FF5D73]/30 bg-[#FF5D73]/10'
      };
    }
    return {
      stroke: '#4F7CFF',
      fill: '#4F7CFF',
      label: '● Initial',
      badgeCls: 'text-[#4F7CFF] border-[#4F7CFF]/30 bg-[#4F7CFF]/10'
    };
  }, [direction]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[340px] flex items-center justify-center text-xs font-sans text-typo-muted">
        Loading simulation data...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[340px] flex items-center justify-center text-xs font-sans text-typo-muted">
        No simulation records available for selected range.
      </div>
    );
  }

  const prices = data.map((d) => d.close);
  const minPrice = Math.floor(Math.min(...prices) * 0.995);
  const maxPrice = Math.ceil(Math.max(...prices) * 1.005);

  return (
    <div
      className="w-full h-[360px] rounded-lg p-3 relative border border-[rgba(255,255,255,0.06)] shadow-elevated transition-colors duration-300"
      style={{
        background:
          'linear-gradient(145deg, rgba(20,30,48,0.95), rgba(13,20,34,0.95))',
      }}
    >
      {/* Subtle simulation tick direction indicator badge */}
      <div className="absolute top-3 left-4 z-10">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-mono font-semibold border ${colorConfig.badgeCls} transition-colors duration-200`}>
          {colorConfig.label}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 22, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="priceGradientDynamic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorConfig.fill} stopOpacity={0.24} />
              <stop offset="90%" stopColor={colorConfig.fill} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            stroke="rgba(255,255,255,0.25)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' })} ${d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}`;
            }}
            minTickGap={45}
          />

          <YAxis
            stroke="rgba(255,255,255,0.25)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
            domain={[minPrice, maxPrice]}
            orientation="right"
            tickFormatter={(v) => `₹${v.toLocaleString()}`}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as MarketData;
                const d = new Date(item.timestamp);
                return (
                  <div className="bg-[#141E30] border border-[rgba(255,255,255,0.12)] p-3.5 rounded-md shadow-2xl text-xs space-y-1.5 z-30 font-sans">
                    <div className="text-[11px] text-typo-muted pb-1 border-b border-[rgba(255,255,255,0.06)]">
                      {d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' })} • {d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex justify-between space-x-5 font-mono">
                      <span className="text-typo-secondary font-sans">Execution Price</span>
                      <span className="font-semibold text-white tnum">₹{Number(item.close).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between space-x-5 text-[11px] font-mono">
                      <span className="text-typo-muted font-sans">Open / High / Low</span>
                      <span className="text-typo-secondary tnum">₹{item.open} / ₹{item.high} / ₹{item.low}</span>
                    </div>
                    <div className="flex justify-between space-x-5 text-[11px] font-mono">
                      <span className="text-typo-muted font-sans">Volume</span>
                      <span className="text-typo-secondary tnum">{Number(item.volume).toLocaleString()}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="close"
            stroke={colorConfig.stroke}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#priceGradientDynamic)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
