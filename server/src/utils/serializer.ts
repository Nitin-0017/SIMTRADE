import { Decimal } from 'decimal.js';

export function serializeData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj) as unknown as T;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  // Handle Prisma / Decimal.js objects
  if (typeof obj === 'object' && obj !== null && 'toNumber' in obj && typeof (obj as any).toNumber === 'function') {
    return (obj as any).toNumber() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeData(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = serializeData(value);
    }
    return res as T;
  }

  return obj;
}
