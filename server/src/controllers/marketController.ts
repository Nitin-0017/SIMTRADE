import { Request, Response } from 'express';
import { MarketService } from '../services/marketService.js';
import { serializeData } from '../utils/serializer.js';

export class MarketController {
  static async getStocks(req: Request, res: Response) {
    try {
      const timestamp = req.query.timestamp as string | undefined;
      const stocks = await MarketService.getAllStocks(timestamp);
      res.json(serializeData(stocks));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch stocks' });
    }
  }

  static async getExactPrice(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const timestamp = req.query.timestamp as string;

      if (!timestamp) {
        return res.status(400).json({ error: "Missing required query parameter 'timestamp'" });
      }

      const priceData = await MarketService.getExactPrice(symbol, timestamp);
      res.json(serializeData(priceData));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch price' });
    }
  }

  static async getStockHistory(req: Request, res: Response) {
    try {
      const { symbol } = req.params;
      const history = await MarketService.getStockHistory(symbol);
      res.json(serializeData(history));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch history' });
    }
  }

  static async getTimestamps(_req: Request, res: Response) {
    try {
      const timestamps = await MarketService.getAvailableTimestamps();
      res.json({ timestamps, total: timestamps.length });
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Failed to fetch timestamps' });
    }
  }
}
