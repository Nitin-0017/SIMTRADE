import { Request, Response } from 'express';
import { TradingService } from '../services/tradingService.js';
import { serializeData } from '../utils/serializer.js';

export class TradingController {
  static async buy(req: Request, res: Response) {
    try {
      const { symbol, quantity, timestamp } = req.body;

      if (!symbol || !quantity || !timestamp) {
        return res.status(400).json({
          error: "Missing required fields: 'symbol', 'quantity', 'timestamp'"
        });
      }

      const result = await TradingService.executeBuy({
        symbol,
        quantity: Number(quantity),
        timestamp
      });

      res.status(200).json(serializeData(result));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Trade failed' });
    }
  }

  static async sell(req: Request, res: Response) {
    try {
      const { symbol, quantity, timestamp } = req.body;

      if (!symbol || !quantity || !timestamp) {
        return res.status(400).json({
          error: "Missing required fields: 'symbol', 'quantity', 'timestamp'"
        });
      }

      const result = await TradingService.executeSell({
        symbol,
        quantity: Number(quantity),
        timestamp
      });

      res.status(200).json(serializeData(result));
    } catch (err: any) {
      res.status(err.status || 500).json({ error: err.message || 'Trade failed' });
    }
  }
}
