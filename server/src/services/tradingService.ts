import prisma from '../utils/prisma.js';
import { Decimal } from 'decimal.js';
import { parseMarketTimestamp } from '../utils/dateTime.js';

export interface TradeParams {
  symbol: string;
  quantity: number;
  timestamp: string;
}

export class TradingService {
  static async executeBuy({ symbol, quantity, timestamp }: TradeParams) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw { status: 400, message: 'Quantity must be a positive integer' };
    }

    const tradeDate = parseMarketTimestamp(timestamp);
    if (isNaN(tradeDate.getTime())) {
      throw { status: 400, message: `Invalid timestamp format: ${timestamp}` };
    }

    // MANDATORY: Everything inside ONE PostgreSQL transaction with row-level locking
    return await prisma.$transaction(async (tx) => {
      // 1. Lock Account row FOR UPDATE to prevent race conditions on cash
      const accounts = await tx.$queryRaw<Array<{ id: number; cashBalance: string; initialBalance: string }>>`
        SELECT id, "cashBalance", "initialBalance"
        FROM "Account"
        WHERE id = 1
        FOR UPDATE
      `;

      const account = accounts[0];
      if (!account) {
        throw { status: 404, message: 'Account not found' };
      }

      // 2. Find stock
      const stock = await tx.stock.findUnique({
        where: { symbol: symbol.toUpperCase() }
      });

      if (!stock) {
        throw { status: 404, message: `Stock '${symbol}' not found` };
      }

      // 3. Find exact market price from PostgreSQL
      const marketData = await tx.marketData.findUnique({
        where: {
          stockId_timestamp: {
            stockId: stock.id,
            timestamp: tradeDate
          }
        }
      });

      if (!marketData) {
        throw {
          status: 404,
          message: `Cannot execute trade: No exact market price found for ${symbol} at timestamp ${timestamp}`
        };
      }

      const executionPrice = new Decimal(marketData.close.toString());
      const totalAmount = executionPrice.mul(quantity);
      const cashBalance = new Decimal(account.cashBalance.toString());

      // 4. Validate cash balance (concurrency-safe)
      if (cashBalance.lessThan(totalAmount)) {
        throw {
          status: 400,
          message: `Insufficient cash balance. Required: ₹${totalAmount.toFixed(2)}, Available: ₹${cashBalance.toFixed(2)}`
        };
      }

      // 5. Update account balance
      const updatedCashBalance = cashBalance.minus(totalAmount);
      await tx.account.update({
        where: { id: 1 },
        data: {
          cashBalance: updatedCashBalance.toFixed(2)
        }
      });

      // 6. Update portfolio using weighted average cost (lock portfolio row if exists)
      const existingHoldings = await tx.$queryRaw<Array<{ id: number; stockId: number; quantity: number; averageBuyPrice: string }>>`
        SELECT id, "stockId", quantity, "averageBuyPrice"
        FROM "Portfolio"
        WHERE "stockId" = ${stock.id}
        FOR UPDATE
      `;

      const existingPortfolio = existingHoldings[0];
      let finalQuantity: number;
      let finalAvgPrice: Decimal;

      if (existingPortfolio) {
        const currentQty = existingPortfolio.quantity;
        const currentAvg = new Decimal(existingPortfolio.averageBuyPrice.toString());
        finalQuantity = currentQty + quantity;

        // Weighted Average Cost: (currentQty * currentAvg + newQty * executionPrice) / finalQuantity
        const currentCost = currentAvg.mul(currentQty);
        finalAvgPrice = currentCost.plus(totalAmount).div(finalQuantity);

        await tx.portfolio.update({
          where: { stockId: stock.id },
          data: {
            quantity: finalQuantity,
            averageBuyPrice: finalAvgPrice.toFixed(2)
          }
        });
      } else {
        finalQuantity = quantity;
        finalAvgPrice = executionPrice;

        await tx.portfolio.create({
          data: {
            stockId: stock.id,
            quantity: finalQuantity,
            averageBuyPrice: finalAvgPrice.toFixed(2)
          }
        });
      }

      // 7. Insert transaction (realized P/L is 0 on BUY)
      const transaction = await tx.transaction.create({
        data: {
          stockId: stock.id,
          type: 'BUY',
          quantity,
          price: executionPrice.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          realizedProfitLoss: '0.00',
          timestamp: tradeDate
        },
        include: { stock: true }
      });

      return {
        message: `Successfully bought ${quantity} shares of ${stock.symbol} at ₹${executionPrice.toFixed(2)}`,
        transaction: {
          ...transaction,
          id: transaction.id.toString(),
          price: Number(transaction.price),
          totalAmount: Number(transaction.totalAmount),
          realizedProfitLoss: Number(transaction.realizedProfitLoss ?? 0),
          timestamp: transaction.timestamp.toISOString()
        },
        account: {
          cashBalance: updatedCashBalance.toFixed(2)
        },
        portfolio: {
          symbol: stock.symbol,
          quantity: finalQuantity,
          averageBuyPrice: finalAvgPrice.toFixed(2)
        }
      };
    });
  }

  static async executeSell({ symbol, quantity, timestamp }: TradeParams) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw { status: 400, message: 'Quantity must be a positive integer' };
    }

    const tradeDate = parseMarketTimestamp(timestamp);
    if (isNaN(tradeDate.getTime())) {
      throw { status: 400, message: `Invalid timestamp format: ${timestamp}` };
    }

    // MANDATORY: Everything inside ONE PostgreSQL transaction with row-level locking
    return await prisma.$transaction(async (tx) => {
      // 1. Lock Account row FOR UPDATE
      const accounts = await tx.$queryRaw<Array<{ id: number; cashBalance: string; initialBalance: string }>>`
        SELECT id, "cashBalance", "initialBalance"
        FROM "Account"
        WHERE id = 1
        FOR UPDATE
      `;

      const account = accounts[0];
      if (!account) {
        throw { status: 404, message: 'Account not found' };
      }

      // 2. Find stock
      const stock = await tx.stock.findUnique({
        where: { symbol: symbol.toUpperCase() }
      });

      if (!stock) {
        throw { status: 404, message: `Stock '${symbol}' not found` };
      }

      // 3. Find exact market price
      const marketData = await tx.marketData.findUnique({
        where: {
          stockId_timestamp: {
            stockId: stock.id,
            timestamp: tradeDate
          }
        }
      });

      if (!marketData) {
        throw {
          status: 404,
          message: `Cannot execute trade: No exact market price found for ${symbol} at timestamp ${timestamp}`
        };
      }

      // 4. Lock and validate portfolio holdings FOR UPDATE
      const holdings = await tx.$queryRaw<Array<{ id: number; stockId: number; quantity: number; averageBuyPrice: string }>>`
        SELECT id, "stockId", quantity, "averageBuyPrice"
        FROM "Portfolio"
        WHERE "stockId" = ${stock.id}
        FOR UPDATE
      `;

      const portfolio = holdings[0];
      if (!portfolio || portfolio.quantity < quantity) {
        const owned = portfolio ? portfolio.quantity : 0;
        throw {
          status: 400,
          message: `Insufficient shares to sell. Owned: ${owned}, Requested: ${quantity}`
        };
      }

      const executionPrice = new Decimal(marketData.close.toString());
      const sellValue = executionPrice.mul(quantity);
      const avgBuyPrice = new Decimal(portfolio.averageBuyPrice.toString());
      const costBasis = avgBuyPrice.mul(quantity);

      // EXPLICIT REALIZED P/L = (Selling Price - Average Buy Price) * Quantity
      const realizedProfitLoss = sellValue.minus(costBasis);

      const cashBalance = new Decimal(account.cashBalance.toString());
      const updatedCashBalance = cashBalance.plus(sellValue);

      // 5. Update account balance (cashBalance += sellValue)
      await tx.account.update({
        where: { id: 1 },
        data: {
          cashBalance: updatedCashBalance.toFixed(2)
        }
      });

      // 6. Update portfolio
      const remainingQty = portfolio.quantity - quantity;
      if (remainingQty === 0) {
        await tx.portfolio.delete({
          where: { stockId: stock.id }
        });
      } else {
        await tx.portfolio.update({
          where: { stockId: stock.id },
          data: {
            quantity: remainingQty
          }
        });
      }

      // 7. Insert transaction with explicit realizedProfitLoss
      const transaction = await tx.transaction.create({
        data: {
          stockId: stock.id,
          type: 'SELL',
          quantity,
          price: executionPrice.toFixed(2),
          totalAmount: sellValue.toFixed(2),
          realizedProfitLoss: realizedProfitLoss.toFixed(2),
          timestamp: tradeDate
        },
        include: { stock: true }
      });

      return {
        message: `Successfully sold ${quantity} shares of ${stock.symbol} at ₹${executionPrice.toFixed(2)} (Realized P/L: ${realizedProfitLoss.isPositive() ? '+' : ''}₹${realizedProfitLoss.toFixed(2)})`,
        transaction: {
          ...transaction,
          id: transaction.id.toString(),
          price: Number(transaction.price),
          totalAmount: Number(transaction.totalAmount),
          realizedProfitLoss: Number(transaction.realizedProfitLoss ?? 0),
          timestamp: transaction.timestamp.toISOString()
        },
        account: {
          cashBalance: updatedCashBalance.toFixed(2)
        },
        portfolio: {
          symbol: stock.symbol,
          quantity: remainingQty,
          averageBuyPrice: portfolio.averageBuyPrice.toString()
        },
        realizedProfitLoss: realizedProfitLoss.toNumber()
      };
    });
  }
}
