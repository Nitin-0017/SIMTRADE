export interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  currentPrice?: number | null;
  currentMarketData?: MarketData | null;
  sparkline?: number[];
}

export interface MarketData {
  id: number;
  stockId: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioHolding {
  id: number;
  stockId: number;
  symbol: string;
  companyName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  currentMarketData?: MarketData | null;
}

export interface AccountSummary {
  id: number;
  cashBalance: number;
  availableCash?: number;
  initialBalance: number;
  portfolioValue: number;
  totalAccountValue: number;
  holdingsValue?: number;
  investedEquity?: number;
  holdingsMarketValue?: number;
  totalInvestedValue: number;
  unrealizedPnL?: number;
  unrealizedProfitLoss?: number;
  realizedPnL?: number;
  realizedProfitLoss?: number;
  totalProfitLoss: number;
  totalReturn?: number;
  totalProfitLossPercentage: number;
  totalReturnPercentage?: number;
  totalReturnPercent?: number;
}

export interface Transaction {
  id: string;
  stockId: number;
  symbol: string;
  companyName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  realizedProfitLoss?: number;
  timestamp: string;
  createdAt: string;
}

export interface PortfolioTrajectoryPoint {
  timestamp: string;
  date: string;
  time: string;
  label: string;
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface TradeRequest {
  symbol: string;
  quantity: number;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  database: string;
}

