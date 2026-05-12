/**
 * Data provider abstraction.
 *
 * The dashboard NEVER imports mock data directly — it goes through these
 * functions. To wire up your real backend, implement an `HttpProvider` that
 * matches the `DataProvider` interface and select it below.
 *
 * Switch providers via env: VITE_DATA_PROVIDER=http (default: mock)
 */

import {
  openPositions as mockPositions,
  recentTrades as mockTrades,
  initialScanner,
  makeScannerEntry,
  quickStats,
  winRateByTicker as mockWinRate,
  exitReasons as mockExits,
  type Position, type Trade, type ScannerEntry,
} from "./mockData";

export type Range = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

export type SeriesPoint = { t: string; ts: number; v: number };

export type PortfolioSummary = {
  value: number;
  dayChange: number;
  dayChangePct: number;
  buyingPower: number;
  cash: number;
};

export type WatchlistItem = {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  spark: number[];
};

export type Stats = {
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  maxDrawdown: number;
  sharpe: number;
};

export interface DataProvider {
  getPortfolioSummary(range?: Range): Promise<PortfolioSummary>;
  getPortfolioSeries(range: Range): Promise<SeriesPoint[]>;
  getPositions(range?: Range): Promise<Position[]>;
  getRecentTrades(range?: Range): Promise<Trade[]>;
  getStats(range?: Range): Promise<Stats>;
  getWinRateByTicker(range?: Range): Promise<{ ticker: string; winRate: number; trades: number }[]>;
  getExitReasons(range?: Range): Promise<{ name: string; value: number; color: string }[]>;
  getWatchlist(): Promise<WatchlistItem[]>;
  subscribeScanner(onEntry: (e: ScannerEntry) => void): { initial: ScannerEntry[]; unsubscribe: () => void };
}

/** Multiplier used by mock to simulate larger datasets over longer ranges. */
const RANGE_FACTOR: Record<Range, number> = { "1D": 1, "1W": 4, "1M": 14, "3M": 38, "6M": 70, "1Y": 130, "ALL": 220 };

/* ---------------------- Mock implementation ---------------------- */

function seedRand(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function buildSeries(range: Range): SeriesPoint[] {
  const now = Date.now();
  const rand = seedRand(range.length * 1234 + 7);
  const rangeConfig: Record<Range, { points: number; spanMs: number; vol: number; drift: number }> = {
    "1D":  { points: 78,  spanMs: 6.5 * 60 * 60 * 1000, vol: 80,   drift: 1.2 },
    "1W":  { points: 60,  spanMs: 7 * 24 * 60 * 60 * 1000, vol: 220,  drift: 8 },
    "1M":  { points: 90,  spanMs: 30 * 24 * 60 * 60 * 1000, vol: 600,  drift: 35 },
    "3M":  { points: 90,  spanMs: 90 * 24 * 60 * 60 * 1000, vol: 1100, drift: 110 },
    "6M":  { points: 120, spanMs: 180 * 24 * 60 * 60 * 1000, vol: 1800, drift: 280 },
    "1Y":  { points: 180, spanMs: 365 * 24 * 60 * 60 * 1000, vol: 3000, drift: 720 },
    "ALL": { points: 240, spanMs: 730 * 24 * 60 * 60 * 1000, vol: 4200, drift: 1500 },
  };
  const cfg = rangeConfig[range];
  const start = now - cfg.spanMs;
  let v = 0;
  return Array.from({ length: cfg.points }, (_, i) => {
    const ts = start + (cfg.spanMs * i) / (cfg.points - 1);
    const driftStep = cfg.drift / cfg.points;
    v += driftStep + (rand() - 0.45) * (cfg.vol / cfg.points) * 4;
    const d = new Date(ts);
    const t = range === "1D"
      ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { t, ts, v: Math.round(v * 100) / 100 };
  });
}

const watchlistSeed: WatchlistItem[] = [
  { ticker: "AAPL", name: "Apple Inc.",        price: 232.41, changePct: 0.54,  spark: [] },
  { ticker: "NVDA", name: "NVIDIA Corp.",      price: 884.20, changePct: 2.18,  spark: [] },
  { ticker: "TSLA", name: "Tesla Inc.",        price: 241.05, changePct: -1.32, spark: [] },
  { ticker: "SPY",  name: "S&P 500 ETF",       price: 478.12, changePct: 0.41,  spark: [] },
  { ticker: "AMD",  name: "Advanced Micro",    price: 152.88, changePct: 1.07,  spark: [] },
  { ticker: "META", name: "Meta Platforms",    price: 598.40, changePct: -0.62, spark: [] },
  { ticker: "MSFT", name: "Microsoft Corp.",   price: 442.30, changePct: 0.88,  spark: [] },
  { ticker: "QQQ",  name: "Invesco QQQ Trust", price: 408.70, changePct: 0.73,  spark: [] },
];

function makeSpark(seed: number, up: boolean): number[] {
  const r = seedRand(seed);
  let v = 50;
  return Array.from({ length: 24 }, () => {
    v += (r() - (up ? 0.4 : 0.6)) * 6;
    return Math.round(v);
  });
}

const wait = <T,>(v: T, ms = 80) => new Promise<T>(res => setTimeout(() => res(v), ms));

export const MockProvider: DataProvider = {
  async getPortfolioSummary() {
    const series = buildSeries("1D");
    const dayChange = series[series.length - 1].v;
    const baseValue = 124850.32;
    return wait({
      value: baseValue + dayChange,
      dayChange,
      dayChangePct: (dayChange / baseValue) * 100,
      buyingPower: 18420.55,
      cash: 5210.10,
    });
  },
  async getPortfolioSeries(range) { return wait(buildSeries(range)); },
  async getPositions() { return wait(mockPositions); },
  async getRecentTrades() { return wait(mockTrades); },
  async getStats() { return wait(quickStats); },
  async getWinRateByTicker() { return wait(mockWinRate); },
  async getExitReasons() { return wait(mockExits); },
  async getWatchlist() {
    return wait(watchlistSeed.map((w, i) => ({ ...w, spark: makeSpark(i + 3, w.changePct >= 0) })));
  },
  subscribeScanner(onEntry) {
    let id = initialScanner.length + 1;
    const handle = setInterval(() => onEntry(makeScannerEntry(id++)), 2200);
    return { initial: initialScanner, unsubscribe: () => clearInterval(handle) };
  },
};

/* ---------------------- HTTP placeholder ---------------------- */

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

/**
 * Stub HTTP provider — replace endpoint paths to match your backend.
 * Selected automatically when VITE_DATA_PROVIDER=http is set.
 */
export const HttpProvider: DataProvider = {
  async getPortfolioSummary() {
    const r = await fetch(`${API_BASE}/api/portfolio/summary`); return r.json();
  },
  async getPortfolioSeries(range) {
    const r = await fetch(`${API_BASE}/api/portfolio/series?range=${range}`); return r.json();
  },
  async getPositions()        { const r = await fetch(`${API_BASE}/api/positions`);     return r.json(); },
  async getRecentTrades()     { const r = await fetch(`${API_BASE}/api/trades/recent`); return r.json(); },
  async getStats()            { const r = await fetch(`${API_BASE}/api/stats`);         return r.json(); },
  async getWinRateByTicker()  { const r = await fetch(`${API_BASE}/api/stats/winrate`); return r.json(); },
  async getExitReasons()      { const r = await fetch(`${API_BASE}/api/stats/exits`);   return r.json(); },
  async getWatchlist()        { const r = await fetch(`${API_BASE}/api/watchlist`);     return r.json(); },
  subscribeScanner(onEntry) {
    const es = new EventSource(`${API_BASE}/api/scanner/stream`);
    es.onmessage = (m) => { try { onEntry(JSON.parse(m.data)); } catch {} };
    return { initial: [], unsubscribe: () => es.close() };
  },
};

const providerName = (import.meta.env.VITE_DATA_PROVIDER as string | undefined) ?? "mock";
export const provider: DataProvider = providerName === "http" ? HttpProvider : MockProvider;
