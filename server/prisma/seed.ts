import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { STOCKS, TRADING_DAYS, TIME_INTERVALS, generateCsvData } from '../src/utils/generateCsvData.js';

const prisma = new PrismaClient();

async function main() {
  const dataDir = path.resolve(__dirname, '../data/csv');

  // Ensure CSV files are generated if not present
  if (!fs.existsSync(dataDir) || fs.readdirSync(dataDir).length < STOCKS.length) {
    generateCsvData(dataDir);
  }

  // 1. Reset transactions and portfolio for a clean state
  await prisma.transaction.deleteMany();
  await prisma.portfolio.deleteMany();

  // 2. Predefined Account (₹10,00,000)
  await prisma.account.upsert({
    where: { id: 1 },
    update: {
      cashBalance: '1000000.00',
      initialBalance: '1000000.00'
    },
    create: {
      id: 1,
      cashBalance: '1000000.00',
      initialBalance: '1000000.00'
    }
  });

  let importedRecords = 0;

  // 2. Import Stocks and Market Data
  for (const stockConfig of STOCKS) {
    const stock = await prisma.stock.upsert({
      where: { symbol: stockConfig.symbol },
      update: { companyName: stockConfig.companyName },
      create: {
        symbol: stockConfig.symbol,
        companyName: stockConfig.companyName
      }
    });

    const csvFile = path.join(dataDir, `${stockConfig.symbol}.csv`);
    const fileContent = fs.readFileSync(csvFile, 'utf-8');

    const records: Array<{
      timestamp: string;
      open: string;
      high: string;
      low: string;
      close: string;
      volume: string;
    }> = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const marketDataItems = records.map((r) => {
      const istTimestamp = r.timestamp.includes('+') || r.timestamp.endsWith('Z')
        ? r.timestamp
        : `${r.timestamp}+05:30`;
      return {
        stockId: stock.id,
        timestamp: new Date(istTimestamp),
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: BigInt(r.volume)
      };
    });

    // Use createMany with skipDuplicates for idempotent, ultra-fast batch insertion
    const result = await prisma.marketData.createMany({
      data: marketDataItems,
      skipDuplicates: true
    });

    importedRecords += marketDataItems.length;
  }

  // Verification count
  const totalMarketRecords = await prisma.marketData.count();

  console.log('------------------------------------');
  console.log('Virtual Market Database Setup');
  console.log('------------------------------------');
  console.log('');
  console.log(`Stocks imported: ${STOCKS.length}`);
  console.log(`Trading days: ${TRADING_DAYS.length}`);
  console.log(`Intervals per day: ${TIME_INTERVALS.length}`);
  console.log(`Market records: ${totalMarketRecords}`);
  console.log('');
  console.log('Initial virtual balance: ₹10,00,000');
  console.log('');
  console.log('Database ready.');
  console.log('------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
