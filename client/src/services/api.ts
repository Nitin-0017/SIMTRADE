import axios from 'axios';
import { Stock, MarketData, PortfolioHolding, AccountSummary, Transaction, TradeRequest, HealthStatus, PortfolioTrajectoryPoint } from '../types';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const MarketApi = {
  getHealth: async (): Promise<HealthStatus> => {
    const res = await api.get<HealthStatus>('/health');
    return res.data;
  },

  getStocks: async (timestamp?: string): Promise<Stock[]> => {
    const params = timestamp ? { timestamp } : {};
    const res = await api.get<Stock[]>('/stocks', { params });
    return res.data;
  },

  getExactPrice: async (symbol: string, timestamp: string): Promise<MarketData & { symbol: string; companyName: string }> => {
    const res = await api.get(`/stocks/${symbol}/price`, {
      params: { timestamp },
    });
    return res.data;
  },

  getStockHistory: async (symbol: string): Promise<{ stock: Stock; history: MarketData[] }> => {
    const res = await api.get(`/stocks/${symbol}/history`);
    return res.data;
  },

  getTimestamps: async (): Promise<{ timestamps: string[]; total: number }> => {
    const res = await api.get('/market/timestamps');
    return res.data;
  },
};

export const TradeApi = {
  buy: async (data: TradeRequest) => {
    const res = await api.post('/trade/buy', data);
    return res.data;
  },

  sell: async (data: TradeRequest) => {
    const res = await api.post('/trade/sell', data);
    return res.data;
  },
};

export const PortfolioApi = {
  getAccount: async (): Promise<AccountSummary> => {
    const res = await api.get<AccountSummary>('/account');
    return res.data;
  },

  getPortfolio: async (timestamp?: string): Promise<{ account: AccountSummary; holdings: PortfolioHolding[] }> => {
    const params = timestamp ? { timestamp } : {};
    const res = await api.get('/portfolio', { params });
    return res.data;
  },

  getPortfolioHistory: async (timestamp?: string): Promise<PortfolioTrajectoryPoint[]> => {
    const params = timestamp ? { timestamp } : {};
    const res = await api.get<PortfolioTrajectoryPoint[]>('/portfolio/history', { params });
    return res.data;
  },

  getTransactions: async (limit = 100): Promise<Transaction[]> => {
    const res = await api.get<Transaction[]>('/transactions', {
      params: { limit },
    });
    return res.data;
  },
};

export default api;
