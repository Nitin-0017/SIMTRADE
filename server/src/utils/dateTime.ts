/**
 * Market Date/Time Utilities
 * Standardizes timestamp parsing to guarantee deterministic mapping between
 * Indian Market Time (+05:30) and PostgreSQL UTC instants.
 */

export function parseMarketTimestamp(timestampStr: string): Date {
  if (!timestampStr) {
    return new Date(NaN);
  }

  const trimmed = timestampStr.trim();

  // If already an ISO string with UTC 'Z' or explicit timezone offset (+05:30, -04:00, etc.)
  if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // If without timezone offset (e.g. '2026-08-03T09:30:00'), interpret as IST (+05:30)
  return new Date(`${trimmed}+05:30`);
}
