import prisma from '../utils/prisma.js';
import { parseMarketTimestamp } from '../utils/dateTime.js';

export class MarketService {
  static async getAllStocks(timestamp?: string) {
    const stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' }
    });

    if (!timestamp) {
      return stocks;
    }

    const date = parseMarketTimestamp(timestamp);

    // 1. Fetch current market data at the timestamp for all stocks
    const currentMarketData = await prisma.marketData.findMany({
      where: {
        timestamp: date
      }
    });

    const marketMap = new Map(currentMarketData.map((m) => [m.stockId, m]));

    // 2. Fetch the last 7 chronological timestamps up to this date for genuine historical sparklines
    const referenceStockId = stocks[0]?.id || 1;
    const recentIntervals = await prisma.marketData.findMany({
      where: {
        stockId: referenceStockId,
        timestamp: { lte: date }
      },
      orderBy: { timestamp: 'desc' },
      take: 7,
      select: { timestamp: true }
    });

    const targetTimestamps = recentIntervals.map((r) => r.timestamp).reverse();

    const historicalCloses = await prisma.marketData.findMany({
      where: {
        timestamp: { in: targetTimestamps }
      },
      orderBy: { timestamp: 'asc' },
      select: {
        stockId: true,
        close: true
      }
    });

    const sparklineMap = new Map<number, number[]>();
    for (const record of historicalCloses) {
      if (!sparklineMap.has(record.stockId)) {
        sparklineMap.set(record.stockId, []);
      }
      sparklineMap.get(record.stockId)!.push(Number(record.close));
    }

    return stocks.map((stock) => {
      const data = marketMap.get(stock.id);
      return {
        ...stock,
        currentMarketData: data || null,
        currentPrice: data ? data.close : null,
        sparkline: sparklineMap.get(stock.id) || []
      };
    });
  }

  static async getExactPrice(symbol: string, timestamp: string) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!stock) {
      throw { status: 404, message: `Stock with symbol '${symbol}' not found` };
    }

    const date = parseMarketTimestamp(timestamp);
    if (isNaN(date.getTime())) {
      throw { status: 400, message: `Invalid timestamp format: '${timestamp}'` };
    }

    const marketData = await prisma.marketData.findUnique({
      where: {
        stockId_timestamp: {
          stockId: stock.id,
          timestamp: date
        }
      }
    });

    if (!marketData) {
      throw {
        status: 404,
        message: `No exact market record found for ${symbol} at timestamp ${timestamp}. Exact timestamp match required.`
      };
    }

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      timestamp: marketData.timestamp,
      open: marketData.open,
      high: marketData.high,
      low: marketData.low,
      close: marketData.close,
      volume: marketData.volume
    };
  }

  static async getStockHistory(symbol: string) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!stock) {
      throw { status: 404, message: `Stock with symbol '${symbol}' not found` };
    }

    const records = await prisma.marketData.findMany({
      where: { stockId: stock.id },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        open: true,
        high: true,
        low: true,
        close: true,
        volume: true
      }
    });

    return {
      stock,
      history: records
    };
  }

  static async getAvailableTimestamps() {
    // Get distinct timestamps from MarketData
    const timestamps = await prisma.marketData.findMany({
      where: { stockId: 1 }, // All stocks share the same timestamps
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    });

    return timestamps.map((t) => t.timestamp.toISOString());
  }
}
