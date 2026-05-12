import { useEffect, useMemo, useState } from "react";
import {
  Bot, Sparkles, HelpCircle, Zap, PlayCircle, PauseCircle, Wallet,
  ArrowUpRight, ArrowDownRight, Search, Bell, User, Moon, Sun, Newspaper, ExternalLink,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import {
  usePortfolioSummary, usePortfolioSeries, usePositions, useRecentTrades,
  useStats, useWinRateByTicker, useExitReasons, useWatchlist, useScannerStream,
} from "@/hooks/useData";
import type { Range } from "@/lib/provider";

type Tab = "Today" | "Positions" | "History" | "Insights" | "Watchlist" | "News" | "Activity";

const tabs: { id: Tab; label: string }[] = [
  { id: "Today",     label: "Today" },
  { id: "Positions", label: "Positions" },
  { id: "History",   label: "History" },
  { id: "Insights",  label: "Insights" },
  { id: "Watchlist", label: "Watchlist" },
  { id: "News",      label: "News" },
  { id: "Activity",  label: "Activity" },
];

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];

function RangeTabs({ value, onChange, className = "" }: { value: Range; onChange: (r: Range) => void; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-0.5 bg-muted/60 rounded-full p-1 ${className}`}>
      {RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold transition ${value === r ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/70 cursor-help" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2 rounded-lg bg-foreground text-background text-[11px] leading-snug opacity-0 group-hover:opacity-100 transition shadow-lg z-50">
        {text}
      </span>
    </span>
  );
}

function Pill({ tone, children }: { tone: "gain" | "loss" | "warn" | "info" | "muted"; children: React.ReactNode }) {
  const map = {
    gain:  "bg-[var(--gain-soft)] text-[var(--gain)]",
    loss:  "bg-[var(--loss-soft)] text-[var(--loss)]",
    warn:  "bg-[var(--warn-soft)] text-[var(--warn)]",
    info:  "bg-[var(--info-soft)] text-[var(--primary)]",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={`chip ${map[tone]}`}>{children}</span>;
}

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function fmtPct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; }

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className}`} />;
}

export function GilbertDashboard() {
  const [tab, setTab] = useState<Tab>("Today");
  const [running, setRunning] = useState(true);
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("gilbert-theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    localStorage.setItem("gilbert-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Robinhood-style top nav */}
      <header className="sticky top-0 z-30 bg-panel border-b border-border">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex md:grid md:grid-cols-[auto_1fr_auto] items-center justify-between gap-3">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary),white_25%)] flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-[15px] hidden sm:inline">Gilbert</span>
          </div>

          {/* Center: nav links (desktop) */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {tabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition ${active ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Right: search + actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                className="w-full bg-muted/70 border-0 rounded-full pl-9 pr-3 py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => setRunning(r => !r)}
              title={running ? "Pause bot" : "Resume bot"}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${running ? "bg-[var(--gain-soft)] text-[var(--gain)]" : "bg-muted text-muted-foreground"}`}
            >
              {running ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
              {running ? "Running" : "Paused"}
            </button>
            {/* Mobile: tiny status dot */}
            <button
              onClick={() => setRunning(r => !r)}
              title={running ? "Running" : "Paused"}
              className="sm:hidden w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${running ? "bg-[var(--gain)] pulse-green" : "bg-muted-foreground"}`} />
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              title={dark ? "Switch to light" : "Switch to dark"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="hidden sm:flex w-9 h-9 rounded-full hover:bg-muted items-center justify-center text-muted-foreground" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-foreground" title="Account">
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav row — wraps so no horizontal scroll */}
        <div className="md:hidden max-w-[1400px] mx-auto px-2 pb-1 flex flex-wrap items-center justify-center gap-1 border-t border-border">
          {tabs.map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-2 text-[12px] font-medium rounded-full transition ${active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {tab === "Today"     && <TodayView running={running} />}
        {tab === "Positions" && <PositionsView />}
        {tab === "History"   && <HistoryView />}
        {tab === "Insights"  && <InsightsView />}
        {tab === "Watchlist" && <WatchlistView />}
        {tab === "News"      && <NewsView />}
        {tab === "Activity"  && <ActivityView />}
      </main>
    </div>
  );
}

/* ------------------------------- TODAY ------------------------------- */

function TodayView({ running }: { running: boolean }) {
  const [range, setRange] = useState<Range>("1D");
  const { data: summary, loading: sumLoading } = usePortfolioSummary();
  const { data: series } = usePortfolioSeries(range);
  const { data: positions } = usePositions();
  const { data: stats } = useStats();
  const [hover, setHover] = useState<{ ts: number; v: number } | null>(null);

  // Range-relative stats from series
  const rangeStats = useMemo(() => {
    if (!series || series.length === 0) return null;
    const start = series[0].v;
    const last = series[series.length - 1].v;
    const change = last - start;
    return { start, last, change, changePct: start === 0 ? 0 : ((last - start) / Math.max(Math.abs(start), 1)) * 100 };
  }, [series]);

  const displayValue = hover?.v ?? rangeStats?.last ?? 0;
  const displayChange = hover ? hover.v - (rangeStats?.start ?? 0) : (rangeStats?.change ?? 0);
  const positive = displayChange >= 0;
  const baseValue = (summary?.value ?? 0) - (summary?.dayChange ?? 0);
  const portfolioNow = baseValue + displayValue;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="soft-card p-5 sm:p-6 bg-gradient-to-br from-[var(--info-soft)] to-panel">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Good day! Here's what Gilbert is up to.</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {running ? "I'm scanning the market and managing your trades." : "I'm paused — press the button up top to start scanning again."}
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio chart card — Robinhood style */}
      <div className="soft-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              Portfolio value <Tip text="Total value of your account, updated live." />
            </div>
            {sumLoading || !rangeStats ? (
              <Skeleton className="h-9 w-48 mt-2" />
            ) : (
              <div className="text-3xl sm:text-4xl font-semibold font-num mt-1 tracking-tight">
                {fmtMoney(portfolioNow)}
              </div>
            )}
            {rangeStats && (
              <div className={`mt-1 flex items-center gap-2 text-[13px] font-medium ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span className="font-num">{positive ? "+" : ""}{fmtMoney(displayChange)}</span>
                <span className="font-num">({fmtPct(rangeStats.start === 0 ? 0 : (displayChange / Math.max(Math.abs(rangeStats.start), 1)) * 100)})</span>
                <span className="text-muted-foreground font-normal">{hover ? "at hover" : labelFor(range)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="muted"><Wallet className="w-3 h-3" /> Buying power {summary ? fmtMoney(summary.buyingPower) : "—"}</Pill>
          </div>
        </div>

        <div className="h-64 sm:h-72 mt-5 -mx-2" onMouseLeave={() => setHover(null)}>
          {!series ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                onMouseMove={(e) => {
                  if (e?.activePayload?.[0]) {
                    const p = e.activePayload[0].payload;
                    setHover({ ts: p.ts, v: p.v });
                  }
                }}
              >
                <defs>
                  <linearGradient id="pnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? "var(--gain)" : "var(--loss)"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={positive ? "var(--gain)" : "var(--loss)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis domain={["dataMin - 50", "dataMax + 50"]} hide />
                <ReferenceLine y={rangeStats?.start ?? 0} stroke="var(--border)" strokeDasharray="3 3" />
                <Tooltip
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <div className="rounded-md bg-foreground text-background px-2 py-1 text-[11px] font-num shadow-lg">
                        {payload[0].payload.t}
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={positive ? "var(--gain)" : "var(--loss)"}
                  strokeWidth={2.5}
                  fill="url(#pnl)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "var(--panel)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Range selector */}
        <div className="mt-3 flex items-center justify-center gap-1 flex-wrap">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => { setRange(r); setHover(null); }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${range === r ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Open trades" tip="Trades that are still active." value={positions ? `${positions.length}` : "—"} tone="info" sub="being monitored" />
        <StatCard label="Win rate"    tip="Percent of trades that ended profitable." value={stats ? `${stats.winRate}%` : "—"} tone="gain" sub={stats ? `${stats.totalTrades} trades` : ""} />
        <StatCard label="Avg win"     tip="Average dollars made on winning trades." value={stats ? `+${fmtMoney(stats.avgWin)}` : "—"} tone="gain" sub="per trade" />
        <StatCard label="Avg loss"    tip="Average dollars lost on losing trades." value={stats ? fmtMoney(stats.avgLoss) : "—"} tone="loss" sub="per trade" />
      </div>

      {/* Open positions + tip */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="soft-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold">Open positions</h2>
            <Tip text="Trades the bot has placed that are still waiting to hit profit target or stop loss." />
          </div>
          <div className="space-y-3">
            {!positions ? <Skeleton className="h-24 w-full" /> :
              positions.map(p => {
                const positive = p.pnlPct >= 0;
                return (
                  <div key={p.contract} className="rounded-xl border border-border p-3 hover:bg-accent transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[14px]">{p.contract}</span>
                        <Pill tone={p.side === "CALL" ? "gain" : "loss"}>{p.side}</Pill>
                      </div>
                      <span className={`font-num font-semibold text-[14px] ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                        {positive ? "+" : ""}{p.pnlPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground font-num">
                      <span>${p.entry.toFixed(2)} → ${p.current.toFixed(2)}</span>
                      <span>{p.status}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${positive ? "bg-[var(--gain)]" : "bg-[var(--loss)]"}`} style={{ width: `${Math.min(Math.abs(p.pnlPct) * 3, 100)}%` }} />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        <div className="soft-card p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[var(--warn)]" />
              <h2 className="font-semibold">Beginner tip</h2>
            </div>
            <p className="text-[13px] text-muted-foreground">
              A "stop loss" auto-closes a trade once it loses a set amount, so you can't lose more than you planned. Gilbert sets one on every trade.
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <div className="text-[12px] text-muted-foreground mb-1">Cash available</div>
            <div className="text-xl font-semibold font-num">{summary ? fmtMoney(summary.cash) : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelFor(r: Range) {
  return ({ "1D": "Today", "1W": "Past week", "1M": "Past month", "3M": "Past 3 months", "6M": "Past 6 months", "1Y": "Past year", "ALL": "All time" } as const)[r];
}

function StatCard({ label, value, tone, sub, tip }: {
  label: string; value: string; tone: "gain" | "loss" | "info" | "muted"; sub: string; tip: string;
}) {
  const accent = { gain: "text-[var(--gain)]", loss: "text-[var(--loss)]", info: "text-primary", muted: "text-foreground" }[tone];
  return (
    <div className="soft-card p-4">
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">{label} <Tip text={tip} /></div>
      <div className={`mt-1.5 text-2xl font-semibold font-num ${accent}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

/* ------------------------------ POSITIONS ------------------------------ */

function PositionsView() {
  const { data: positions } = usePositions();
  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold">Open positions</h2>
        <Tip text="Trades Gilbert has opened and is still managing." />
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">{positions?.length ?? 0} open</p>
      {!positions ? <Skeleton className="h-40 w-full" /> : positions.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-muted-foreground">No open positions for this range.</div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="py-2 px-2">Contract</th><th className="py-2 px-2">Side</th>
              <th className="py-2 px-2 text-right">Entry</th><th className="py-2 px-2 text-right">Current</th>
              <th className="py-2 px-2 text-right">P&L</th><th className="py-2 px-2 text-right">Peak</th>
              <th className="py-2 px-2">Expiry</th><th className="py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => {
              const positive = p.pnlPct >= 0;
              return (
                <tr key={p.contract} className="border-b border-border/60 hover:bg-accent">
                  <td className="py-3 px-2 font-medium">{p.contract}</td>
                  <td className="py-3 px-2"><Pill tone={p.side === "CALL" ? "gain" : "loss"}>{p.side}</Pill></td>
                  <td className="py-3 px-2 text-right font-num">${p.entry.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-num">${p.current.toFixed(2)}</td>
                  <td className={`py-3 px-2 text-right font-num font-semibold ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>{positive ? "+" : ""}{p.pnlPct.toFixed(1)}%</td>
                  <td className="py-3 px-2 text-right font-num text-muted-foreground">{p.peakPct.toFixed(1)}%</td>
                  <td className="py-3 px-2 text-muted-foreground">{p.expiry}</td>
                  <td className="py-3 px-2"><Pill tone={p.status === "Near SL" ? "loss" : p.status === "Near TP" ? "gain" : "info"}>{p.status}</Pill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>)}
    </div>
  );
}

/* ------------------------------ HISTORY ------------------------------ */

function HistoryView() {
  const [range, setRange] = useState<Range>("1D");
  const { data: trades } = useRecentTrades(range);
  const wins = trades ? trades.filter(t => t.pnl > 0).length : 0;
  const losses = trades ? trades.length - wins : 0;
  const net = trades ? trades.reduce((s, t) => s + t.pnl, 0) : 0;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg">History</h2>
          <p className="text-[12px] text-muted-foreground">{labelFor(range)} · {trades?.length ?? 0} trades</p>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="soft-card p-4"><div className="text-[12px] text-muted-foreground">Wins</div><div className="text-2xl font-semibold text-[var(--gain)] font-num">{wins}</div></div>
        <div className="soft-card p-4"><div className="text-[12px] text-muted-foreground">Losses</div><div className="text-2xl font-semibold text-[var(--loss)] font-num">{losses}</div></div>
        <div className="soft-card p-4"><div className="text-[12px] text-muted-foreground">Net</div><div className={`text-2xl font-semibold font-num ${net >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>{fmtMoney(net)}</div></div>
      </div>
      <div className="soft-card p-5">
        <div className="flex items-center gap-2 mb-3"><h2 className="font-semibold">Closed trades</h2><Tip text="Trades Gilbert opened and then closed." /></div>
        {!trades ? <Skeleton className="h-40 w-full" /> : (
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-panel">
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Time</th><th className="py-2 px-2">Ticker</th><th className="py-2 px-2">Contract</th>
                <th className="py-2 px-2 text-right">Entry → Exit</th><th className="py-2 px-2 text-right">P&L</th><th className="py-2 px-2">Why closed</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={i} className="border-b border-border/60 hover:bg-accent">
                  <td className="py-2.5 px-2 text-muted-foreground font-num">{t.time}</td>
                  <td className="py-2.5 px-2 font-medium">{t.ticker}</td>
                  <td className="py-2.5 px-2 font-num">{t.strike} <span className="text-muted-foreground">{t.expiry}</span></td>
                  <td className="py-2.5 px-2 text-right font-num">${t.entry.toFixed(2)} → ${t.exit.toFixed(2)}</td>
                  <td className={`py-2.5 px-2 text-right font-num font-semibold ${t.pnl >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>{t.pnl >= 0 ? "+" : ""}${t.pnl}</td>
                  <td className="py-2.5 px-2"><Pill tone={t.reason.includes("Profit") ? "gain" : t.reason.includes("Stop") ? "loss" : "info"}>{t.reason}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>)}
      </div>
    </div>
  );
}

/* ------------------------------ INSIGHTS ------------------------------ */

function InsightsView() {
  const [range, setRange] = useState<Range>("1M");
  const { data: winrate } = useWinRateByTicker(range);
  const { data: exits } = useExitReasons(range);
  const { data: stats } = useStats(range);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg">Insights</h2>
          <p className="text-[12px] text-muted-foreground">{labelFor(range)}</p>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="soft-card p-5">
          <div className="flex items-center gap-2 mb-3"><h2 className="font-semibold">Win rate by ticker</h2><Tip text="How often trades on each stock end profitable." /></div>
          <div className="h-64">
            {!winrate ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winrate} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="ticker" type="category" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="winRate" radius={[0, 8, 8, 0]}>
                  {winrate.map((d, i) => <Cell key={i} fill={d.winRate >= 60 ? "var(--gain)" : d.winRate >= 50 ? "var(--primary)" : "var(--loss)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>)}
          </div>
        </div>
        <div className="soft-card p-5">
          <div className="flex items-center gap-2 mb-3"><h2 className="font-semibold">Why trades closed</h2><Tip text="The reason each trade ended." /></div>
          <div className="h-64">
            {!exits ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={exits} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {exits.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>)}
          </div>
          {exits && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {exits.map(e => (
                <div key={e.name} className="flex items-center gap-2 text-[12px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                  <span className="text-muted-foreground">{e.name}</span>
                  <span className="ml-auto font-num">{e.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="soft-card p-5">
        <div className="flex items-center gap-2 mb-3"><h2 className="font-semibold">Key numbers</h2><Tip text="Health check on Gilbert's overall trading." /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats && [
            { l: "Sharpe ratio", v: stats.sharpe.toFixed(2), t: "Risk-adjusted returns. Above 1 is good." },
            { l: "Max drawdown", v: fmtMoney(stats.maxDrawdown), t: "Biggest peak-to-trough loss seen." },
            { l: "Expectancy", v: `+${fmtMoney(stats.expectancy)}`, t: "Average expected profit per trade." },
            { l: "Total trades", v: stats.totalTrades, t: "Trades placed all-time." },
          ].map(s => (
            <div key={s.l} className="rounded-xl bg-muted/60 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{s.l} <Tip text={s.t} /></div>
              <div className="text-lg font-semibold font-num mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ WATCHLIST ------------------------------ */

function WatchlistView() {
  const { data: list } = useWatchlist();
  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-2 mb-1"><h2 className="font-semibold">Watchlist</h2><Tip text="Stocks Gilbert is keeping an eye on for you." /></div>
      <p className="text-[12px] text-muted-foreground mb-4">Live prices and a quick view of the day's trend.</p>
      {!list ? <Skeleton className="h-40 w-full" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {list.map(w => {
            const up = w.changePct >= 0;
            return (
              <div key={w.ticker} className="rounded-xl border border-border p-4 hover:bg-accent transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{w.ticker}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{w.name}</div>
                  </div>
                  <Pill tone={up ? "gain" : "loss"}>
                    {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {fmtPct(w.changePct)}
                  </Pill>
                </div>
                <div className="text-xl font-semibold font-num mt-2">${w.price.toFixed(2)}</div>
                <div className="h-12 mt-1 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={w.spark.map((v, i) => ({ i, v }))}>
                      <Line type="monotone" dataKey="v" stroke={up ? "var(--gain)" : "var(--loss)"} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ ACTIVITY ------------------------------ */

function ActivityView() {
  const feed = useScannerStream(40);
  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold">Live scanner</h2>
        <Pill tone="gain"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] pulse-green" /> Live</Pill>
        <Tip text="Every few seconds Gilbert checks the market. Each row is its decision on a stock." />
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">Most checks are skipped — that's normal. Gilbert only trades when conditions are great.</p>
      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
        {feed.map((e, i) => (
          <div key={e.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-border/70 text-[13px] ${i === 0 ? "flash-row" : ""}`}>
            <span className="text-[11px] text-muted-foreground font-num w-20 shrink-0">{e.time}</span>
            <span className="font-semibold w-14 shrink-0">{e.ticker}</span>
            <span className="text-muted-foreground flex-1 truncate">{e.detail}</span>
            <Pill tone={e.kind === "signal" ? "gain" : e.kind === "blocked" ? "warn" : "muted"}>
              {e.kind === "signal" ? "Trade" : e.kind === "blocked" ? "Blocked" : "Skipped"}
            </Pill>
          </div>
        ))}
      </div>
    </div>
  );
}


/* -------------------------------- NEWS -------------------------------- */

type NewsItem = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // seconds
  category: string;
  related: string;
};

const NEWS_CATEGORIES = ["general", "forex", "crypto", "merger"] as const;
type NewsCategory = (typeof NEWS_CATEGORIES)[number];

function timeAgo(unixSec: number) {
  const diff = Math.max(0, Date.now() / 1000 - unixSec);
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NewsView() {
  const [category, setCategory] = useState<NewsCategory>("general");
  const [symbol, setSymbol] = useState("");
  const [query, setQuery] = useState<{ symbol?: string; category: NewsCategory }>({ category: "general" });
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    const params = new URLSearchParams();
    if (query.symbol) params.set("symbol", query.symbol);
    else params.set("category", query.category);
    fetch(`/api/news?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (Array.isArray(d)) setItems(d.slice(0, 50));
        else setError(d?.error ?? "Failed to load news");
      })
      .catch(e => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" /> Live news
          </h2>
          <p className="text-[12px] text-muted-foreground">Fresh market headlines, powered by Finnhub.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const sym = symbol.trim().toUpperCase();
            setQuery(sym ? { symbol: sym, category } : { category });
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Ticker e.g. AAPL"
              className="bg-muted/70 border-0 rounded-full pl-9 pr-3 py-2 text-[13px] w-44 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button type="submit" className="px-3 py-2 rounded-full bg-foreground text-background text-[12px] font-semibold">Search</button>
          {query.symbol && (
            <button type="button" onClick={() => { setSymbol(""); setQuery({ category }); }} className="text-[12px] text-muted-foreground hover:text-foreground">Clear</button>
          )}
        </form>
      </div>

      {!query.symbol && (
        <div className="flex items-center gap-1 flex-wrap">
          {NEWS_CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCategory(c); setQuery({ category: c }); }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize transition ${query.category === c ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="soft-card p-4 text-[13px] text-[var(--loss)]">Couldn't load news: {error}</div>
      )}

      {!items && !error ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : items && items.length === 0 ? (
        <div className="soft-card p-10 text-center text-[13px] text-muted-foreground">No headlines found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items?.map(n => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="soft-card overflow-hidden flex flex-col hover:bg-accent transition group"
            >
              {n.image ? (
                <div className="aspect-[16/9] bg-muted overflow-hidden">
                  <img src={n.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gradient-to-br from-muted to-elevated flex items-center justify-center">
                  <Newspaper className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide truncate">{n.source}</span>
                  <span>·</span>
                  <span>{timeAgo(n.datetime)}</span>
                  {n.related && <Pill tone="info">{n.related.split(",")[0]}</Pill>}
                </div>
                <h3 className="font-semibold text-[14px] leading-snug line-clamp-3">{n.headline}</h3>
                {n.summary && <p className="text-[12px] text-muted-foreground line-clamp-3">{n.summary}</p>}
                <div className="mt-auto flex items-center gap-1 text-[11px] text-primary font-semibold pt-1">
                  Read more <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
