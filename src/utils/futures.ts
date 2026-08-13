export const FUTURES_MULTIPLIERS: Record<string, number> = {
  NQ: 20,
  MNQ: 2,
  ES: 50,
  MES: 5,
  YM: 5,
  MYM: 0.5,
  RTY: 50,
  M2K: 5,
  CL: 1000,
  GC: 100,
};

export function getFuturesPointValue(symbol: string): number {
  const sym = symbol.toUpperCase().trim();
  if (FUTURES_MULTIPLIERS[sym]) {
    return FUTURES_MULTIPLIERS[sym];
  }
  // Default fallback if custom futures ticker
  return 1;
}
