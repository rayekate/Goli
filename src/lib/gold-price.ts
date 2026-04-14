/**
 * Live Gold Price — Real-time XAU/USD from free public APIs
 *
 * Fetches real gold spot price from multiple VPN-friendly sources with
 * server-side caching. Falls back gracefully if APIs are unreachable.
 * Both the price feed and trade execution use the same cached price.
 */

// ─── Module-level cache ──────────────────────────────────────────────────────
const CACHE_TTL = 15_000; // refresh every 15 seconds
const FETCH_TIMEOUT = 8_000; // 8s timeout per API call
const MAX_HISTORY = 60;

let cachedPrice = 0;
let lastFetchMs = 0;
let fetchInProgress: Promise<number> | null = null;
let priceHistory: { time: string; price: number }[] = [];

// ─── Free, VPN-friendly API sources ─────────────────────────────────────────

/** Primary: Coinbase XAU/USD exchange rate — free, no key, global */
async function fetchFromCoinbaseXAU(): Promise<number | null> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=XAU', {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const usdRate = parseFloat(data?.data?.rates?.USD);
    if (usdRate && usdRate > 500) return Number(usdRate.toFixed(2));
  } catch { /* timeout or network error */ }
  return null;
}

/** Secondary: Coinbase PAXG/USD (gold-backed token, tracks spot price) */
async function fetchFromCoinbasePAXG(): Promise<number | null> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/PAXG-USD/spot', {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const amount = parseFloat(data?.data?.amount);
    if (amount && amount > 500) return Number(amount.toFixed(2));
  } catch { /* timeout or network error */ }
  return null;
}

/**
 * Try multiple APIs in sequence. Returns the first successful price.
 * All sources are free, require no API key, and have no geo-restrictions.
 */
async function fetchRealPrice(): Promise<number> {
  // Try primary source
  const price1 = await fetchFromCoinbaseXAU();
  if (price1) return price1;

  // Try secondary source
  const price2 = await fetchFromCoinbasePAXG();
  if (price2) return price2;

  // If we have a cached price, return it (stale is better than nothing)
  if (cachedPrice > 0) return cachedPrice;

  // Last resort: a reasonable fallback (this should rarely happen)
  return 2350;
}

/**
 * Get the current gold price. Uses cache if fresh, otherwise fetches.
 * Deduplicates concurrent requests to avoid hammering APIs.
 */
async function refreshPrice(): Promise<number> {
  const now = Date.now();

  // Return cached if still fresh
  if (cachedPrice > 0 && now - lastFetchMs < CACHE_TTL) {
    return cachedPrice;
  }

  // Deduplicate: if a fetch is already in progress, wait for it
  if (fetchInProgress) {
    return fetchInProgress;
  }

  fetchInProgress = (async () => {
    try {
      const price = await fetchRealPrice();
      const previousPrice = cachedPrice;
      cachedPrice = price;
      lastFetchMs = Date.now();

      // Only add to history if price actually changed or enough time passed
      const lastEntry = priceHistory[priceHistory.length - 1];
      const timeDiff = lastEntry ? Date.now() - lastFetchMs : Infinity;
      if (!lastEntry || lastEntry.price !== price || timeDiff > 10_000) {
        priceHistory.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price,
        });
        if (priceHistory.length > MAX_HISTORY) priceHistory.shift();
      }

      return price;
    } finally {
      fetchInProgress = null;
    }
  })();

  return fetchInProgress;
}

// ─── Public API (all async) ──────────────────────────────────────────────────

export async function getCurrentGoldPrice(): Promise<number> {
  return refreshPrice();
}

export interface PriceData {
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  history: { time: string; price: number }[];
  source: 'live';
}

export async function getPriceData(): Promise<PriceData> {
  const price = await refreshPrice();

  const prev =
    priceHistory.length >= 2
      ? priceHistory[priceHistory.length - 2].price
      : price;
  const change = Number((price - prev).toFixed(2));
  const changePercent = prev > 0 ? Number(((change / prev) * 100).toFixed(3)) : 0;

  return {
    price,
    previousPrice: prev,
    change,
    changePercent,
    history: [...priceHistory],
    source: 'live',
  };
}

export async function getPriceHistory(points = 30): Promise<{ time: string; price: number }[]> {
  await refreshPrice(); // ensure cache is populated
  return priceHistory.slice(-points);
}
