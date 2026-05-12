// Mock data for the GilbertTrader dashboard
export type Position = {
  contract: string;
  side: "CALL" | "PUT";
  entry: number;
  current: number;
  pnlPct: number;
  peakPct: number;
  size: number;
  expiry: string;
  status: "Monitoring" | "Near TP" | "Near SL" | "Scaling Out";
};

export const openPositions: Position[] = [
  { contract: "AAPL 200C", side: "CALL", entry: 2.45, current: 3.12, pnlPct: 27.3, peakPct: 31.2, size: 5, expiry: "12/20", status: "Near TP" },
  { contract: "MARA 15C", side: "CALL", entry: 0.88, current: 0.94, pnlPct: 6.8, peakPct: 14.2, size: 10, expiry: "12/13", status: "Monitoring" },
  { contract: "GME 25P", side: "PUT", entry: 1.20, current: 1.07, pnlPct: -10.8, peakPct: 8.5, size: 4, expiry: "12/27", status: "Near SL" },
];

export type Trade = {
  time: string;
  ticker: string;
  strike: string;
  expiry: string;
  side: "CALL" | "PUT";
  entry: number;
  exit: number;
  pnl: number;
  reason: string;
};

export const recentTrades: Trade[] = [
  { time: "10:41:22", ticker: "NVDA", strike: "880C", expiry: "12/13", side: "CALL", entry: 3.20, exit: 4.15, pnl: 95, reason: "Profit Target" },
  { time: "10:28:15", ticker: "TSLA", strike: "240P", expiry: "12/13", side: "PUT", entry: 2.10, exit: 1.68, pnl: -42, reason: "Stop Loss" },
  { time: "10:12:48", ticker: "AMD", strike: "150C", expiry: "12/20", side: "CALL", entry: 1.85, exit: 2.22, pnl: 37, reason: "Scale-Out 50%" },
  { time: "09:54:03", ticker: "SPY", strike: "475C", expiry: "12/13", side: "CALL", entry: 1.40, exit: 1.85, pnl: 45, reason: "Profit Target" },
  { time: "09:42:11", ticker: "META", strike: "600P", expiry: "12/20", side: "PUT", entry: 4.20, exit: 3.78, pnl: -42, reason: "Stop Loss" },
  { time: "09:35:58", ticker: "QQQ", strike: "405C", expiry: "12/13", side: "CALL", entry: 2.80, exit: 3.36, pnl: 56, reason: "Profit Target" },
  { time: "09:21:30", ticker: "AMZN", strike: "210C", expiry: "12/20", side: "CALL", entry: 1.95, exit: 2.34, pnl: 39, reason: "Scale-Out 50%" },
  { time: "09:15:12", ticker: "COIN", strike: "320C", expiry: "12/13", side: "CALL", entry: 5.40, exit: 4.59, pnl: -81, reason: "Stop Loss" },
  { time: "09:02:44", ticker: "PLTR", strike: "75C", expiry: "12/20", side: "CALL", entry: 0.95, exit: 1.18, pnl: 23, reason: "Profit Target" },
  { time: "08:58:01", ticker: "RIVN", strike: "12P", expiry: "12/13", side: "PUT", entry: 0.45, exit: 0.38, pnl: -7, reason: "Time Decay" },
  { time: "08:51:33", ticker: "MSFT", strike: "440C", expiry: "12/20", side: "CALL", entry: 3.15, exit: 3.85, pnl: 70, reason: "Profit Target" },
  { time: "08:44:19", ticker: "GOOGL", strike: "190C", expiry: "12/13", side: "CALL", entry: 2.25, exit: 2.70, pnl: 45, reason: "Profit Target" },
  { time: "08:32:50", ticker: "BABA", strike: "85P", expiry: "12/20", side: "PUT", entry: 1.10, exit: 0.88, pnl: -22, reason: "Stop Loss" },
  { time: "08:25:07", ticker: "DIS", strike: "115C", expiry: "12/13", side: "CALL", entry: 1.60, exit: 2.08, pnl: 48, reason: "Profit Target" },
  { time: "08:18:42", ticker: "F", strike: "11C", expiry: "12/20", side: "CALL", entry: 0.30, exit: 0.41, pnl: 11, reason: "Manual Close" },
];

// P&L curve over the day
export const pnlCurve = [
  { t: "09:30", v: 0 },
  { t: "09:45", v: 45 },
  { t: "10:00", v: 90 },
  { t: "10:15", v: 56 },
  { t: "10:30", v: 14 },
  { t: "10:45", v: -28 },
  { t: "11:00", v: -10 },
  { t: "11:15", v: 32 },
  { t: "11:30", v: 78 },
  { t: "11:45", v: 124 },
  { t: "12:00", v: 156 },
  { t: "12:15", v: 142 },
  { t: "12:30", v: 188 },
  { t: "12:45", v: 215 },
  { t: "13:00", v: 245 },
  { t: "13:15", v: 222 },
  { t: "13:30", v: 268 },
  { t: "13:45", v: 304 },
];

export type ScannerEntry = {
  id: number;
  time: string;
  ticker: string;
  detail: string;
  kind: "signal" | "skip" | "blocked";
};

export const initialScanner: ScannerEntry[] = [
  { id: 1, time: "10:42:31", ticker: "AMC",  detail: "RSI 27.4  Vol 2.3x  ✓ Signal", kind: "signal" },
  { id: 2, time: "10:42:31", ticker: "GME",  detail: "RSI 44.2  Skip", kind: "skip" },
  { id: 3, time: "10:42:31", ticker: "NVDA", detail: "RSI 18.1  Vol 1.1x  Skip (volume)", kind: "skip" },
  { id: 4, time: "10:42:30", ticker: "TSLA", detail: "RSI 38.0  Skip", kind: "skip" },
  { id: 5, time: "10:42:30", ticker: "SPY",  detail: "RSI 52.4  Skip", kind: "skip" },
  { id: 6, time: "10:42:29", ticker: "PLTR", detail: "Blocked: news event", kind: "blocked" },
  { id: 7, time: "10:42:29", ticker: "AAPL", detail: "RSI 68.2  Skip", kind: "skip" },
  { id: 8, time: "10:42:28", ticker: "META", detail: "RSI 22.1  Vol 3.1x  ✓ Signal", kind: "signal" },
  { id: 9, time: "10:42:28", ticker: "AMD",  detail: "RSI 41.5  Skip", kind: "skip" },
  { id: 10, time: "10:42:27", ticker: "COIN", detail: "RSI 33.8  Vol 0.9x  Skip (volume)", kind: "skip" },
];

const pool = ["SPY","QQQ","AAPL","NVDA","TSLA","AMD","META","AMZN","GOOGL","MSFT","COIN","PLTR","MARA","GME","AMC","RIVN","F","BABA","DIS","SHOP"];
export function makeScannerEntry(id: number): ScannerEntry {
  const ticker = pool[Math.floor(Math.random() * pool.length)];
  const rsi = (Math.random() * 60 + 15).toFixed(1);
  const vol = (Math.random() * 3 + 0.5).toFixed(1);
  const r = Math.random();
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  if (r < 0.15) return { id, time, ticker, detail: `RSI ${rsi}  Vol ${vol}x  ✓ Signal`, kind: "signal" };
  if (r < 0.22) return { id, time, ticker, detail: `Blocked: news event`, kind: "blocked" };
  return { id, time, ticker, detail: `RSI ${rsi}  Vol ${vol}x  Skip`, kind: "skip" };
}

export const signalQueue = [
  { ticker: "META", text: "PUT 600 12/20 — bearish breakdown", state: "Analyzing" as const },
  { ticker: "AMC",  text: "CALL 5 12/13 — RSI oversold + vol spike", state: "Approved" as const },
  { ticker: "RIVN", text: "PUT 12 12/13 — gap fill setup", state: "Rejected" as const },
];

export const quickStats = {
  totalTrades: 142,
  winRate: 64.1,
  avgWin: 52.3,
  avgLoss: -28.7,
  expectancy: 23.2,
  maxDrawdown: -184,
  sharpe: 1.84,
};

export const winRateByTicker = [
  { ticker: "NVDA", winRate: 78, trades: 22 },
  { ticker: "AAPL", winRate: 71, trades: 18 },
  { ticker: "SPY",  winRate: 68, trades: 31 },
  { ticker: "MSFT", winRate: 66, trades: 14 },
  { ticker: "TSLA", winRate: 58, trades: 19 },
  { ticker: "AMD",  winRate: 55, trades: 12 },
  { ticker: "META", winRate: 52, trades: 11 },
  { ticker: "COIN", winRate: 41, trades: 9 },
  { ticker: "GME",  winRate: 33, trades: 6 },
];

export const hourHeatmap = [
  { hour: "9a", v: 42 }, { hour: "10a", v: 88 }, { hour: "11a", v: 124 },
  { hour: "12p", v: 35 }, { hour: "1p", v: -22 }, { hour: "2p", v: 67 },
  { hour: "3p", v: 145 }, { hour: "4p", v: 18 },
];

export const drawdownSeries = Array.from({ length: 30 }, (_, i) => ({
  d: `D${i + 1}`,
  dd: -Math.abs(Math.sin(i / 3) * 80 + Math.random() * 60),
}));

export const exitReasons = [
  { name: "Profit Target", value: 58, color: "#00c087" },
  { name: "Stop Loss",     value: 28, color: "#ff5252" },
  { name: "Scale-Out",     value: 22, color: "#1677ff" },
  { name: "Time Decay",    value: 12, color: "#f0a500" },
  { name: "Manual",        value: 8,  color: "#8b90a8" },
];

export const tradeDistribution = [
  { bucket: "-200", n: 2 }, { bucket: "-150", n: 4 }, { bucket: "-100", n: 8 },
  { bucket: "-50",  n: 14 }, { bucket: "0",   n: 18 }, { bucket: "+50",  n: 28 },
  { bucket: "+100", n: 22 }, { bucket: "+150", n: 14 }, { bucket: "+200", n: 9 }, { bucket: "+250", n: 4 },
];

export const avgWinLossByTicker = [
  { ticker: "NVDA", win: 95, loss: -34 },
  { ticker: "AAPL", win: 68, loss: -28 },
  { ticker: "SPY",  win: 52, loss: -22 },
  { ticker: "TSLA", win: 88, loss: -41 },
  { ticker: "AMD",  win: 47, loss: -31 },
  { ticker: "META", win: 72, loss: -38 },
];

export const botLog = [
  { lvl: "INFO",  t: "10:42:31", msg: "Scanner cycle complete (20 tickers, 1 signal)" },
  { lvl: "TRADE", t: "10:41:22", msg: "CLOSED NVDA 880C @ 4.15 (+29.7%) — Profit Target" },
  { lvl: "INFO",  t: "10:41:10", msg: "Approaching TP on NVDA 880C (peak +31.4%)" },
  { lvl: "INFO",  t: "10:40:00", msg: "Scanner cycle started" },
  { lvl: "WARN",  t: "10:38:42", msg: "Tradier feed latency 412ms (>200ms threshold)" },
  { lvl: "TRADE", t: "10:28:15", msg: "CLOSED TSLA 240P @ 1.68 (-20.0%) — Stop Loss" },
  { lvl: "INFO",  t: "10:25:00", msg: "Discord command !status from @gilbert" },
  { lvl: "ERROR", t: "10:21:11", msg: "Webull session token refresh required" },
  { lvl: "INFO",  t: "10:20:58", msg: "Refreshed session OK" },
  { lvl: "TRADE", t: "10:12:48", msg: "SCALED OUT AMD 150C 50% @ 2.22 (+20%)" },
  { lvl: "INFO",  t: "10:10:00", msg: "Scanner cycle complete (20 tickers, 0 signals)" },
  { lvl: "INFO",  t: "10:00:00", msg: "Market regime: BULL (SPY +1.2% vs SMA20)" },
  { lvl: "INFO",  t: "09:55:00", msg: "Strategy loaded: NORMAL (TP 25% / SL 15%)" },
  { lvl: "INFO",  t: "09:30:00", msg: "Market open. Bot armed. Mode=PAPER Budget=$100,000" },
];
