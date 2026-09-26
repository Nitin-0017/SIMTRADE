# Virtual Stock Market (PostgreSQL + Prisma)

High-performance virtual stock market trading platform built with **PostgreSQL**, **Prisma ORM**, **Express (TypeScript)**, and **React + Vite + Tailwind CSS**.

> **Architecture Notice**: This project strictly uses **PostgreSQL**. SQLite is not used anywhere in the codebase.

---

## 🏛 Architecture Overview

```text
                    ┌───────────────────────────────┐
                    │    React + Vite (TypeScript)   │
                    │                               │
                    │ • Dashboard & Markets         │
                    │ • Stock Analysis (Recharts)   │
                    │ • Dynamic Portfolio Valuation │
                    │ • Transaction Audit Log       │
                    │ • Database Market Replay      │
                    └───────────────┬───────────────┘
                                    │
                                  Axios
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │    Express API (TypeScript)   │
                    │                               │
                    │ • Market Service              │
                    │ • Trading Service (ACID Tx)   │
                    │ • Portfolio Valuation Service │
                    │ • Health & Serialization      │
                    └───────────────┬───────────────┘
                                    │
                               Prisma ORM
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │          PostgreSQL           │
                    │                               │
                    │ • Stocks (10 Equities)        │
                    │ • MarketData (1,950 Records)  │
                    │ • Portfolio (Holdings)        │
                    │ • Transactions (Audit Log)    │
                    │ • Account (Predefined ₹10L)   │
                    └───────────────┬───────────────┘
                                    ▲
                                    │
                              Prisma Seed
                                    │
                    ┌───────────────────────────────┐
                    │     CSV Historical Feed       │
                    │                               │
                    │ • 10 Equities                 │
                    │ • 15 Trading Days             │
                    │ • 13 Intervals/Day (30-min)   │
                    │ • 1,950 Records Total         │
                    └───────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. PostgreSQL Database Setup

#### Option A: Docker (Recommended)
Launch PostgreSQL in a persistent Docker container:
```bash
docker compose up -d
```

#### Option B: Local PostgreSQL CLI
```bash
createdb virtual_stock_market
# Or connect with psql:
psql -c "CREATE DATABASE virtual_stock_market;"
```

### 2. Configure Environment Variables
In `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/virtual_stock_market?schema=public"
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Install & Seed Database
```bash
cd server
npm install
npm run db:push
npm run db:seed
```

**Seed Summary Output:**
```text
------------------------------------
Virtual Market Database Setup
------------------------------------

Stocks imported: 10
Trading days: 15
Intervals per day: 13
Market records: 1950

Initial virtual balance: ₹10,00,000

Database ready.
------------------------------------
```

### 4. Run Backend & Frontend

#### Backend:
```bash
cd server
npm run dev
```

#### Frontend:
```bash
cd client
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## 🔒 Database Transaction Safety (ACID)

BUY and SELL orders are strictly enclosed within PostgreSQL transactions using Prisma `$transaction`:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock/read account
  // 2. Find stock
  // 3. Find exact market price for requested timestamp
  // 4. Validate trade (balance / inventory)
  // 5. Update account balance
  // 6. Update portfolio (weighted average cost for buy, deduction for sell)
  // 7. Insert audit transaction
});
```

If any constraint fails, the entire transaction is automatically rolled back.

---

## 💰 Money Precision

Monetary quantities and stock prices are modeled using `Decimal(18,2)` in PostgreSQL and `Decimal.js` in Node.js to eliminate floating-point arithmetic errors.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Verifies PostgreSQL connectivity (`{ status: "ok", database: "connected" }`) |
| `GET` | `/api/stocks` | Lists all 10 stocks with live price at requested `?timestamp=` |
| `GET` | `/api/stocks/:symbol/price?timestamp=...` | Exact price lookup from PostgreSQL (404 if not found) |
| `GET` | `/api/stocks/:symbol/history` | Chronological OHLCV history for charts |
| `GET` | `/api/market/timestamps` | List of all 195 replay intervals |
| `POST` | `/api/trade/buy` | Executes atomic BUY order (`{ symbol, quantity, timestamp }`) |
| `POST` | `/api/trade/sell` | Executes atomic SELL order (`{ symbol, quantity, timestamp }`) |
| `GET` | `/api/portfolio?timestamp=...` | Dynamic portfolio valuation against timestamp market price |
| `GET` | `/api/account` | Predefined account cash balance and initial balance |
| `GET` | `/api/transactions` | Chronological execution audit log |

---

## 🧪 Verification & Commands

```bash
# Backend Prisma commands
npm run db:generate   # Generate Prisma Client
npm run db:push       # Push schema directly to PostgreSQL
npm run db:seed       # Idempotent CSV import (1,950 records)
npm run db:studio     # Open Prisma Studio GUI

# Verification test
curl http://localhost:5001/api/health
```
