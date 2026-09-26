import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { MarketController } from '../controllers/marketController.js';
import { TradingController } from '../controllers/tradingController.js';
import { PortfolioController } from '../controllers/portfolioController.js';

const router = Router();

// 1. Health check - verifies PostgreSQL connection
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Execute a simple query to ensure PostgreSQL connection is live
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected'
    });
  } catch (error: any) {
    console.error('PostgreSQL health check failed:', error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message || 'Database unavailable'
    });
  }
});

// 2. Market Endpoints
router.get('/stocks', MarketController.getStocks);
router.get('/stocks/:symbol/price', MarketController.getExactPrice);
router.get('/stocks/:symbol/history', MarketController.getStockHistory);
router.get('/market/timestamps', MarketController.getTimestamps);

// 3. Trading Endpoints
router.post('/trade/buy', TradingController.buy);
router.post('/trade/sell', TradingController.sell);

// 4. Portfolio & Account Endpoints
router.get('/account', PortfolioController.getAccount);
router.get('/portfolio', PortfolioController.getPortfolio);
router.get('/portfolio/history', PortfolioController.getPortfolioHistory);
router.get('/transactions', PortfolioController.getTransactions);

export default router;
