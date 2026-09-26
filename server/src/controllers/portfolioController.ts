import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolioService.js';
import { serializeData } from '../utils/serializer.js';

export class PortfolioController {
  static async getAccount(_req: Request, res: Response) {
    try {
      const account = await PortfolioService.getAccount();
      res.json(serializeData(account));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch account' });
    }
  }

  static async getPortfolio(req: Request, res: Response) {
    try {
      const timestamp = req.query.timestamp as string | undefined;
      const portfolio = await PortfolioService.getPortfolio(timestamp);
      res.json(serializeData(portfolio));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch portfolio' });
    }
  }

  static async getTransactions(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const transactions = await PortfolioService.getTransactions(limit);
      res.json(serializeData(transactions));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch transactions' });
    }
  }

  static async getPortfolioHistory(req: Request, res: Response) {
    try {
      const timestamp = req.query.timestamp as string | undefined;
      const history = await PortfolioService.getPortfolioHistory(timestamp);
      res.json(serializeData(history));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch portfolio trajectory history' });
    }
  }
}
