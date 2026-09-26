import fs from 'fs';
import path from 'path';

export interface StockConfig {
  symbol: string;
  companyName: string;
  basePrice: number;
  volatility: number;
}

export const STOCKS: StockConfig[] = [
  { symbol: 'TCS', companyName: 'Tata Consultancy Services Ltd', basePrice: 3200, volatility: 0.008 },
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd', basePrice: 2850, volatility: 0.010 },
  { symbol: 'INFY', companyName: 'Infosys Limited', basePrice: 1540, volatility: 0.009 },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', basePrice: 1620, volatility: 0.007 },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank Limited', basePrice: 1120, volatility: 0.009 },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited', basePrice: 980, volatility: 0.014 },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Limited', basePrice: 1340, volatility: 0.008 },
  { symbol: 'ITC', companyName: 'ITC Limited', basePrice: 460, volatility: 0.006 },
  { symbol: 'SBIN', companyName: 'State Bank of India', basePrice: 790, volatility: 0.011 },
  { symbol: 'WIPRO', companyName: 'Wipro Limited', basePrice: 480, volatility: 0.010 }
];

export const TRADING_DAYS = [
  '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
  '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
  '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'
];

export const TIME_INTERVALS = [
  '09:30:00', '10:00:00', '10:30:00', '11:00:00',
  '11:30:00', '12:00:00', '12:30:00', '13:00:00',
  '13:30:00', '14:00:00', '14:30:00', '15:00:00', '15:30:00'
];

// Deterministic pseudo-random generator for consistent data
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateCsvData(outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalRecords = 0;

  for (let sIdx = 0; sIdx < STOCKS.length; sIdx++) {
    const stock = STOCKS[sIdx];
    const filePath = path.join(outputDir, `${stock.symbol}.csv`);
    const lines: string[] = ['timestamp,open,high,low,close,volume'];

    let currentPrice = stock.basePrice;
    let seed = (sIdx + 1) * 1000;

    for (let dIdx = 0; dIdx < TRADING_DAYS.length; dIdx++) {
      const date = TRADING_DAYS[dIdx];

      for (let tIdx = 0; tIdx < TIME_INTERVALS.length; tIdx++) {
        const time = TIME_INTERVALS[tIdx];
        const timestamp = `${date}T${time}`;

        // Specific calibration for TCS on 2026-08-12 to align with prompt example
        if (stock.symbol === 'TCS' && timestamp === '2026-08-12T09:30:00') {
          lines.push(`${timestamp},3210.20,3225.50,3205.10,3220.80,182340`);
          currentPrice = 3220.80;
          totalRecords++;
          continue;
        }

        const r1 = pseudoRandom(seed++);
        const r2 = pseudoRandom(seed++);
        const r3 = pseudoRandom(seed++);
        const r4 = pseudoRandom(seed++);

        const deltaPercent = (r1 - 0.48) * stock.volatility * 2;
        const open = parseFloat(currentPrice.toFixed(2));
        const close = parseFloat((open * (1 + deltaPercent)).toFixed(2));
        const high = parseFloat((Math.max(open, close) + Math.abs(r2 * stock.basePrice * stock.volatility)).toFixed(2));
        const low = parseFloat((Math.min(open, close) - Math.abs(r3 * stock.basePrice * stock.volatility)).toFixed(2));
        const volume = Math.floor(50000 + r4 * 200000);

        lines.push(`${timestamp},${open.toFixed(2)},${high.toFixed(2)},${low.toFixed(2)},${close.toFixed(2)},${volume}`);
        currentPrice = close;
        totalRecords++;
      }
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }

  return {
    stocksCount: STOCKS.length,
    daysCount: TRADING_DAYS.length,
    intervalsCount: TIME_INTERVALS.length,
    totalRecords
  };
}
