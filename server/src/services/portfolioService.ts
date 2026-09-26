import prisma from '../utils/prisma.js';
import { Decimal } from 'decimal.js';
import { parseMarketTimestamp } from '../utils/dateTime.js';

export class PortfolioService {
  static async getAccount() {
    const account = await prisma.account.findUnique({
      where: { id: 1 }
    });

    if (!account) {
      throw { status: 404, message: 'Account not found' };
    }

    return account;
  }

  static async getPortfolio(timestamp?: string) {
    const account = await prisma.account.findUnique({
      where: { id: 1 }
    });

    if (!account) {
      throw { status: 404, message: 'Account not found' };
    }

    const holdings = await prisma.portfolio.findMany({
      include: {
        stock: true
      },
      orderBy: { stock: { symbol: 'asc' } }
    });

    let totalInvestedValue = new Decimal(0);
    let totalPortfolioValue = new Decimal(0);

    const holdingValuations = await Promise.all(
      holdings.map(async (holding) => {
        const qty = new Decimal(holding.quantity);
        const avgPrice = new Decimal(holding.averageBuyPrice.toString());
        const investedVal = qty.mul(avgPrice);

        totalInvestedValue = totalInvestedValue.plus(investedVal);

        let currentPrice = avgPrice; // fallback if no timestamp provided
        let currentMarketData = null;

        if (timestamp) {
          const date = parseMarketTimestamp(timestamp);
          if (!isNaN(date.getTime())) {
            const mData = await prisma.marketData.findUnique({
              where: {
                stockId_timestamp: {
                  stockId: holding.stockId,
                  timestamp: date
                }
              }
            });
            if (mData) {
              currentPrice = new Decimal(mData.close.toString());
              currentMarketData = mData;
            }
          }
        }

        const currentVal = qty.mul(currentPrice);
        totalPortfolioValue = totalPortfolioValue.plus(currentVal);

        const profitLoss = currentVal.minus(investedVal);
        const profitLossPercentage = investedVal.isZero()
          ? new Decimal(0)
          : profitLoss.div(investedVal).mul(100);

        return {
          id: holding.id,
          stockId: holding.stockId,
          symbol: holding.stock.symbol,
          companyName: holding.stock.companyName,
          quantity: holding.quantity,
          averageBuyPrice: avgPrice.toNumber(),
          currentPrice: currentPrice.toNumber(),
          investedValue: investedVal.toNumber(),
          currentValue: currentVal.toNumber(),
          profitLoss: profitLoss.toNumber(),
          profitLossPercentage: profitLossPercentage.toNumber(),
          currentMarketData
        };
      })
    );

    // Aggregate realized P/L from all completed SELL transactions
    const realizedAgg = await prisma.transaction.aggregate({
      where: { type: 'SELL' },
      _sum: { realizedProfitLoss: true }
    });
    const totalRealizedProfitLoss = new Decimal(realizedAgg._sum.realizedProfitLoss?.toString() || '0');

    // Unrealized P/L from current holdings
    const totalUnrealizedProfitLoss = totalPortfolioValue.minus(totalInvestedValue);

    const cashBalance = new Decimal(account.cashBalance.toString());
    const initialBalance = new Decimal(account.initialBalance.toString());
    const totalAccountValue = cashBalance.plus(totalPortfolioValue);
    
    // Total P/L = Realized P/L + Unrealized P/L (reconciles with Total Account Value - Initial Balance)
    const totalProfitLoss = totalAccountValue.minus(initialBalance);
    const totalProfitLossPercentage = initialBalance.isZero()
      ? new Decimal(0)
      : totalProfitLoss.div(initialBalance).mul(100);

    const summary = {
      id: account.id,
      cashBalance: cashBalance.toNumber(),
      availableCash: cashBalance.toNumber(),
      initialBalance: initialBalance.toNumber(),
      // Portfolio Value = Available Cash + Current Market Value of All Holdings
      portfolioValue: totalAccountValue.toNumber(),
      totalAccountValue: totalAccountValue.toNumber(),
      // Holdings Value / Invested Equity = Current Market Value of all open holdings at active simulation timestamp
      holdingsValue: totalPortfolioValue.toNumber(),
      investedEquity: totalPortfolioValue.toNumber(),
      holdingsMarketValue: totalPortfolioValue.toNumber(),
      totalInvestedValue: totalInvestedValue.toNumber(),
      unrealizedPnL: totalUnrealizedProfitLoss.toNumber(),
      unrealizedProfitLoss: totalUnrealizedProfitLoss.toNumber(),
      realizedPnL: totalRealizedProfitLoss.toNumber(),
      realizedProfitLoss: totalRealizedProfitLoss.toNumber(),
      totalProfitLoss: totalProfitLoss.toNumber(),
      totalReturn: totalProfitLoss.toNumber(),
      totalProfitLossPercentage: totalProfitLossPercentage.toNumber(),
      totalReturnPercentage: totalProfitLossPercentage.toNumber(),
      totalReturnPercent: totalProfitLossPercentage.toNumber()
    };

    return {
      ...summary,
      account: summary,
      holdings: holdingValuations
    };
  }

  static async getPortfolioSummary(timestamp?: string) {
    return this.getPortfolio(timestamp);
  }

  static async getTransactions(limit = 100) {
    const transactions = await prisma.transaction.findMany({
      take: limit,
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      include: {
        stock: true
      }
    });

    return transactions.map((t) => ({
      id: t.id.toString(),
      stockId: t.stockId,
      symbol: t.stock.symbol,
      companyName: t.stock.companyName,
      type: t.type,
      quantity: t.quantity,
      price: new Decimal(t.price.toString()).toNumber(),
      totalAmount: new Decimal(t.totalAmount.toString()).toNumber(),
      realizedProfitLoss: new Decimal(t.realizedProfitLoss?.toString() || '0').toNumber(),
      timestamp: t.timestamp.toISOString(),
      createdAt: t.createdAt.toISOString()
    }));
  }

  /**
   * Calculates actual mathematical portfolio valuation points up to the specified timestamp.
   * Eliminates fake or interpolated points entirely.
   */
  static async getPortfolioHistory(timestamp?: string) {
    // 1. Get all chronological simulation timestamps up to target timestamp
    const referenceStock = await prisma.stock.findFirst();
    const refStockId = referenceStock?.id || 1;

    let targetDate: Date | null = null;
    if (timestamp) {
      targetDate = parseMarketTimestamp(timestamp);
    }

    const intervals = await prisma.marketData.findMany({
      where: {
        stockId: refStockId,
        ...(targetDate && !isNaN(targetDate.getTime()) ? { timestamp: { lte: targetDate } } : {})
      },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    });

    if (intervals.length === 0) {
      return [];
    }

    // 2. Fetch all transactions up to targetDate
    const allTransactions = await prisma.transaction.findMany({
      where: targetDate && !isNaN(targetDate.getTime()) ? { timestamp: { lte: targetDate } } : {},
      orderBy: [{ timestamp: 'asc' }, { id: 'asc' }]
    });

    // 3. If no transactions exist, return pure initial state trajectory
    if (allTransactions.length === 0) {
      return intervals.map((interval) => {
        const d = interval.timestamp;
        const dateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' });
        const timeStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        return {
          timestamp: d.toISOString(),
          date: dateStr,
          time: timeStr,
          label: `${dateStr} ${timeStr}`,
          totalValue: 1000000,
          cashBalance: 1000000,
          investedValue: 0,
          profitLoss: 0,
          profitLossPercentage: 0
        };
      });
    }

    // 4. If transactions exist, prefetch all market closing prices for stocks that were ever traded
    const tradedStockIds = Array.from(new Set(allTransactions.map((t) => t.stockId)));
    const targetTimestamps = intervals.map((i) => i.timestamp);

    const priceRecords = await prisma.marketData.findMany({
      where: {
        stockId: { in: tradedStockIds },
        timestamp: { in: targetTimestamps }
      },
      select: {
        stockId: true,
        timestamp: true,
        close: true
      }
    });

    // Lookup: `stockId_timestampIso` -> close price Decimal
    const priceMap = new Map<string, Decimal>();
    for (const p of priceRecords) {
      priceMap.set(`${p.stockId}_${p.timestamp.toISOString()}`, new Decimal(p.close.toString()));
    }

    // 5. Replay ledger chronologically across each timestamp
    let runningCash = new Decimal(1000000);
    // stockId -> { quantity: number, averageBuyPrice: Decimal }
    const runningHoldings = new Map<number, { quantity: number; averageBuyPrice: Decimal }>();

    let txIdx = 0;
    const historyPoints = [];

    for (const interval of intervals) {
      const intervalTime = interval.timestamp.getTime();

      // Process any transactions that occurred at or before this interval
      while (txIdx < allTransactions.length && allTransactions[txIdx].timestamp.getTime() <= intervalTime) {
        const tx = allTransactions[txIdx];
        const txAmount = new Decimal(tx.totalAmount.toString());
        const txPrice = new Decimal(tx.price.toString());

        if (tx.type === 'BUY') {
          runningCash = runningCash.minus(txAmount);
          const current = runningHoldings.get(tx.stockId);
          if (current) {
            const currentQty = current.quantity;
            const newQty = currentQty + tx.quantity;
            const newAvg = current.averageBuyPrice.mul(currentQty).plus(txAmount).div(newQty);
            runningHoldings.set(tx.stockId, { quantity: newQty, averageBuyPrice: newAvg });
          } else {
            runningHoldings.set(tx.stockId, { quantity: tx.quantity, averageBuyPrice: txPrice });
          }
        } else if (tx.type === 'SELL') {
          runningCash = runningCash.plus(txAmount);
          const current = runningHoldings.get(tx.stockId);
          if (current) {
            const remaining = current.quantity - tx.quantity;
            if (remaining <= 0) {
              runningHoldings.delete(tx.stockId);
            } else {
              runningHoldings.set(tx.stockId, { quantity: remaining, averageBuyPrice: current.averageBuyPrice });
            }
          }
        }
        txIdx++;
      }

      // Compute exact portfolio valuation at this interval
      let intervalInvested = new Decimal(0);
      let intervalHoldingsVal = new Decimal(0);

      for (const [stockId, h] of runningHoldings.entries()) {
        const qty = new Decimal(h.quantity);
        intervalInvested = intervalInvested.plus(qty.mul(h.averageBuyPrice));

        const marketPrice = priceMap.get(`${stockId}_${interval.timestamp.toISOString()}`) || h.averageBuyPrice;
        intervalHoldingsVal = intervalHoldingsVal.plus(qty.mul(marketPrice));
      }

      const totalVal = runningCash.plus(intervalHoldingsVal);
      const pl = totalVal.minus(1000000);
      const plPct = pl.div(1000000).mul(100);

      const d = interval.timestamp;
      const dateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' });
      const timeStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      historyPoints.push({
        timestamp: d.toISOString(),
        date: dateStr,
        time: timeStr,
        label: `${dateStr} ${timeStr}`,
        totalValue: totalVal.toNumber(),
        cashBalance: runningCash.toNumber(),
        investedValue: intervalInvested.toNumber(),
        profitLoss: pl.toNumber(),
        profitLossPercentage: plPct.toNumber()
      });
    }

    return historyPoints;
  }
}
