import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, HelpCircle, Zap, PlayCircle, PauseCircle, Wallet,
  ArrowUpRight, ArrowDownRight, Search, Moon, Sun, Newspaper, ExternalLink, Menu, X, ChevronDown,
  RefreshCw, Zap as Bolt, Send,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";
import {
  usePortfolioSummary, usePortfolioSeries, usePositions, useRecentTrades,
  useStats, useWinRateByTicker, useExitReasons, useWatchlist, useScannerStream,
  useBotStatus, useRegime,
} from "@/hooks/useData";
import { provider, type Range } from "@/lib/provider";
import type { Position } from "@/lib/mockData";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
const postSilent = (path: string, body?: unknown) =>
  fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);

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

const FULL_RANGES: Range[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"];
const QUICK_RANGES: Range[] = ["1D", "1W", "1M", "1Y"];
const CUSTOM_RANGES: Range[] = ["3M", "6M", "ALL"];

/** Full range bar (Today / portfolio chart) — every preset visible inline. */
function FullRangeTabs({ value, onChange, className = "" }: { value: Range; onChange: (r: Range) => void; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 flex-wrap justify-center ${className}`}>
      {FULL_RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-2.5 py-1 border border-foreground font-mono text-[10px] uppercase tracking-widest transition ${value === r ? "bg-foreground text-background" : "text-foreground hover:bg-foreground hover:text-background"}`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}


/** Compact range bar w/ Custom popover (dates + 3M/6M/ALL). */
function RangeTabs({
  value, onChange, className = "",
  customDates, onCustomDates,
}: {
  value: Range;
  onChange: (r: Range) => void;
  className?: string;
  customDates?: { start: string; end: string } | null;
  onCustomDates?: (d: { start: string; end: string } | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(customDates?.start ?? "");
  const [end, setEnd] = useState(customDates?.end ?? "");
  const isCustomRange = (CUSTOM_RANGES as Range[]).includes(value);
  const hasCustomDates = !!customDates?.start && !!customDates?.end;
  const isCustom = isCustomRange || hasCustomDates;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const fmtShort = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const customLabel = hasCustomDates
    ? `${fmtShort(customDates!.start)} – ${fmtShort(customDates!.end)}`
    : (isCustomRange ? value : "Custom");

  const applyDates = () => {
    if (!start || !end) return;
    onCustomDates?.({ start, end });
    setOpen(false);
  };
  const clearDates = () => {
    setStart(""); setEnd("");
    onCustomDates?.(null);
  };

  return (
    <div ref={wrapRef} className={`relative inline-flex items-center gap-0.5 bg-muted/60 rounded-full p-1 ${className}`}>
      {QUICK_RANGES.map(r => (
        <button
          key={r}
          onClick={() => { onChange(r); onCustomDates?.(null); setOpen(false); }}
          className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold transition ${value === r && !hasCustomDates ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {r}
        </button>
      ))}
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-semibold transition max-w-[180px] truncate ${isCustom ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        <span className="truncate">{customLabel}</span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-40 soft-card p-3 w-[260px]">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground pb-1">Custom dates</div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="w-10">Start</span>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="flex-1 px-2 py-1 rounded-md bg-muted border border-border text-foreground text-[12px] outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="w-10">End</span>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="flex-1 px-2 py-1 rounded-md bg-muted border border-border text-foreground text-[12px] outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={applyDates}
                disabled={!start || !end}
                className="flex-1 px-2 py-1.5 rounded-md text-[12px] font-semibold bg-primary text-primary-foreground disabled:opacity-50"
              >
                Apply
              </button>
              {hasCustomDates && (
                <button onClick={clearDates} className="px-2 py-1.5 rounded-md text-[12px] font-semibold hover:bg-muted text-muted-foreground">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground pb-1">Quick presets</div>
            <div className="flex flex-wrap gap-1">
              {CUSTOM_RANGES.map(r => (
                <button
                  key={r}
                  onClick={() => { onChange(r); onCustomDates?.(null); setStart(""); setEnd(""); setOpen(false); }}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition ${value === r && !hasCustomDates ? "bg-foreground text-background" : "hover:bg-muted text-foreground"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Creative Gilbert wordmark/logo with cyber-emerald glow. */
function GilbertLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center font-mono font-bold"
      style={{
        width: size,
        height: size,
        background: "var(--foreground)",
        color: "var(--background)",
        fontSize: size * 0.55,
        lineHeight: 1,
      }}
    >
      G
      <span
        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full pulse-green"
        style={{ background: "var(--gain)", boxShadow: "0 0 6px var(--gain)" }}
      />
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
  const [menuOpen, setMenuOpen] = useState(false);
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
      <header className="sticky top-0 z-30 bg-panel border-b border-border">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-foreground"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <GilbertLogo size={32} />
            <span className="font-semibold text-[15px] hidden sm:inline">Gilbert</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <BotControl running={running} setRunning={setRunning} />
            <button
              onClick={() => setDark(d => !d)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              title={dark ? "Switch to light" : "Switch to dark"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <RegimeBanner />

      {menuOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 h-full w-[78%] max-w-[320px] bg-panel border-r border-border shadow-xl flex flex-col"
          >
            <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <GilbertLogo size={32} />
                <span className="font-semibold">Gilbert</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 flex flex-col gap-1">
              {tabs.map(t => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setMenuOpen(false); }}
                    className={`text-left px-4 py-3 rounded-xl text-[14px] font-medium transition ${active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

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

/* ----------------------- BOT CONTROL + REGIME BANNER ----------------------- */

function BotControl({ running, setRunning }: { running: boolean; setRunning: (fn: (r: boolean) => boolean) => void }) {
  const status = useBotStatus(10000);
  const [scanning, setScanning] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from server when available
  useEffect(() => {
    if (!status) return;
    setRunning(() => !!status.running && !status.paused);
  }, [status, setRunning]);

  const toggle = () => {
    setRunning(r => {
      const next = !r;
      postSilent(next ? "/api/bot/resume" : "/api/bot/pause");
      return next;
    });
  };

  const scan = () => {
    setScanning(true);
    postSilent("/api/bot/scan");
    setTimeout(() => setScanning(false), 2000);
  };

  const closeAll = () => {
    if (confirmClose) {
      postSilent("/api/bot/close-all");
      setConfirmClose(false);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      return;
    }
    setConfirmClose(true);
    confirmTimer.current = setTimeout(() => setConfirmClose(false), 3000);
  };

  return (
    <>
      {/* Mobile: dot + play/pause */}
      <div className="flex sm:hidden items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${running ? "bg-[var(--gain)] pulse-green" : "bg-muted-foreground"}`} />
        <button
          onClick={toggle}
          title={running ? "Pause" : "Resume"}
          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground"
        >
          {running ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
        </button>
      </div>

      {/* Desktop pill group */}
      <div className="hidden sm:flex items-center gap-1 bg-muted/60 rounded-full p-1">
        <span className={`ml-2 mr-1 w-2 h-2 rounded-full ${running ? "bg-[var(--gain)] pulse-green" : "bg-muted-foreground"}`} />
        <button
          onClick={toggle}
          title={running ? "Pause bot" : "Resume bot"}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition ${running ? "bg-[var(--gain-soft)] text-[var(--gain)]" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
        >
          {running ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
          {running ? "Running" : "Paused"}
        </button>
        <button
          onClick={scan}
          title="Force scan"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
          Scan
        </button>
        <button
          onClick={closeAll}
          title="Close all positions"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition ${confirmClose ? "bg-[var(--loss-soft)] text-[var(--loss)]" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Bolt className="w-3.5 h-3.5" />
          {confirmClose ? "Confirm?" : "Close All"}
        </button>
      </div>
    </>
  );
}

function RegimeBanner() {
  const data = useRegime(60000);
  if (!data) return null;
  const regime = (data.regime ?? "neutral").toLowerCase();
  const tone =
    regime === "bull" ? { bg: "bg-[var(--gain-soft)]", fg: "text-[var(--gain)]", label: "🟢 BULL MARKET" }
    : regime === "bear" ? { bg: "bg-[var(--loss-soft)]", fg: "text-[var(--loss)]", label: "🔴 BEAR MARKET" }
    : { bg: "bg-muted", fg: "text-muted-foreground", label: "⚪ NEUTRAL" };
  const pct = typeof data.spy_vs_sma20 === "number" ? `${data.spy_vs_sma20 >= 0 ? "+" : ""}${data.spy_vs_sma20.toFixed(2)}%` : "—";
  const parts = [
    tone.label,
    `SPY ${pct} vs SMA-20`,
    `Scanner: ${data.scanner_active === false ? "idle" : "active"}`,
    data.last_scan ? `Last scan: ${data.last_scan}` : null,
    typeof data.open_positions === "number" ? `Open positions: ${data.open_positions}` : null,
  ].filter(Boolean);
  return (
    <div className={`${tone.bg} ${tone.fg} w-full border-b border-border`} style={{ height: 28 }}>
      <div className="max-w-[1400px] mx-auto h-full px-3 sm:px-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap font-mono text-[11px]">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="opacity-50">|</span>}
            <span>{p}</span>
          </span>
        ))}
      </div>
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
      <div className="pb-2">
        <h1 className="font-serif-display text-3xl sm:text-5xl leading-tight">
          Good day! Here's what <span className="italic">Gilbert</span> is up to.
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-2">
          {running ? "Scanning the market / Managing active trades" : "Paused — press resume up top to start scanning again"}
        </p>
      </div>

      {/* Portfolio chart card */}
      <div className="soft-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Portfolio value <Tip text="Total value of your account, updated live." />
            </div>
            {sumLoading || !rangeStats ? (
              <Skeleton className="h-12 w-56 mt-2" />
            ) : (
              <div className="font-serif-display text-4xl sm:text-6xl mt-1 tracking-tight">
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
        <div className="mt-3 flex items-center justify-center">
          <FullRangeTabs value={range} onChange={(r) => { setRange(r); setHover(null); }} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Open trades" tip="Trades that are still active." value={positions ? `${positions.length}` : "—"} tone="info" sub="being monitored" />
        <StatCard label="Win rate"    tip="Percent of trades that ended profitable." value={stats ? `${stats.winRate.toFixed(1)}%` : "—"} tone="gain" sub={stats ? `${stats.totalTrades} trades` : ""} />
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

        <NewsTicker cash={summary ? fmtMoney(summary.cash) : "—"} />

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
  const accent = { gain: "bg-[var(--gain)]", loss: "bg-[var(--loss)]", info: "bg-foreground", muted: "bg-foreground" }[tone];
  return (
    <div className="border-t-2 border-foreground pt-3 px-1">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label} <Tip text={tip} /></div>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-serif-display text-3xl sm:text-4xl leading-none">{value}</span>
        <span className={`flex-1 h-[2px] mb-2 opacity-40 ${accent}`} />
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mt-2">{sub}</div>
    </div>
  );
}


/* ------------------------------ POSITIONS ------------------------------ */

function PositionsView() {
  const { data: initial } = usePositions();
  const [positions, setPositions] = useState<Position[] | null>(null);
  const [flash, setFlash] = useState<Record<string, "up" | "down">>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const prevRef = useRef<Record<string, number>>({});

  useEffect(() => { if (initial) setPositions(initial); }, [initial]);

  // Live polling — try /api/positions, fall back to provider mock
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      let next: Position[] | null = null;
      try {
        const r = await fetch(`${API_BASE}/api/positions`);
        if (r.ok) next = await r.json();
      } catch { /* silent */ }
      if (!next) {
        try { next = await provider.getPositions(); } catch { /* silent */ }
      }
      if (!alive || !next) return;
      const flashes: Record<string, "up" | "down"> = {};
      for (const p of next) {
        const prev = prevRef.current[p.contract];
        if (prev !== undefined && prev !== p.pnlPct) flashes[p.contract] = p.pnlPct > prev ? "up" : "down";
        prevRef.current[p.contract] = p.pnlPct;
      }
      setPositions(next);
      if (Object.keys(flashes).length) {
        setFlash(flashes);
        setTimeout(() => setFlash({}), 350);
      }
    };
    const id = setInterval(tick, 10000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const closeOne = (contract: string) => {
    postSilent("/api/bot/close", { contract });
    setPositions(prev => prev ? prev.filter(p => p.contract !== contract) : prev);
    setConfirmKey(null);
  };

  const pnlClass = (p: Position) => {
    const f = flash[p.contract];
    const base = p.pnlPct >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]";
    const flashCls = f === "up" ? "bg-[var(--gain-soft)] rounded px-1" : f === "down" ? "bg-[var(--loss-soft)] rounded px-1" : "";
    return `${base} ${flashCls} transition-colors duration-300`;
  };

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
      <>
        {/* Mobile: card list */}
        <div className="md:hidden space-y-2">
          {positions.map(p => {
            const positive = p.pnlPct >= 0;
            return (
              <div key={p.contract} className="group rounded-xl border border-border p-3 relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-[14px] truncate">{p.contract}</span>
                    <Pill tone={p.side === "CALL" ? "gain" : "loss"}>{p.side}</Pill>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-num font-semibold text-[14px] ${pnlClass(p)}`}>
                      {positive ? "+" : ""}{p.pnlPct.toFixed(1)}%
                    </span>
                    <CloseBtn
                      confirming={confirmKey === p.contract}
                      onClick={() => confirmKey === p.contract ? closeOne(p.contract) : setConfirmKey(p.contract)}
                      onCancel={() => setConfirmKey(null)}
                      label={p.contract}
                    />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground font-num">
                  <div><div className="text-[10px] uppercase">Entry</div><div className="text-foreground">${p.entry.toFixed(2)}</div></div>
                  <div><div className="text-[10px] uppercase">Now</div><div className="text-foreground">${p.current.toFixed(2)}</div></div>
                  <div><div className="text-[10px] uppercase">Peak</div><div className="text-foreground">{p.peakPct.toFixed(1)}%</div></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Exp {p.expiry}</span>
                  <Pill tone={p.status === "Near SL" ? "loss" : p.status === "Near TP" ? "gain" : "info"}>{p.status}</Pill>
                </div>
              </div>
            );
          })}
        </div>
        {/* Desktop: table */}
        <div className="hidden md:block">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Contract</th><th className="py-2 px-2">Side</th>
                <th className="py-2 px-2 text-right">Entry</th><th className="py-2 px-2 text-right">Current</th>
                <th className="py-2 px-2 text-right">P&L</th><th className="py-2 px-2 text-right">Peak</th>
                <th className="py-2 px-2">Expiry</th><th className="py-2 px-2">Status</th>
                <th className="py-2 px-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const positive = p.pnlPct >= 0;
                return (
                  <tr key={p.contract} className="group border-b border-border/60 hover:bg-accent">
                    <td className="py-3 px-2 font-medium">{p.contract}</td>
                    <td className="py-3 px-2"><Pill tone={p.side === "CALL" ? "gain" : "loss"}>{p.side}</Pill></td>
                    <td className="py-3 px-2 text-right font-num">${p.entry.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-num">${p.current.toFixed(2)}</td>
                    <td className={`py-3 px-2 text-right font-num font-semibold ${pnlClass(p)}`}>{positive ? "+" : ""}{p.pnlPct.toFixed(1)}%</td>
                    <td className="py-3 px-2 text-right font-num text-muted-foreground">{p.peakPct.toFixed(1)}%</td>
                    <td className="py-3 px-2 text-muted-foreground">{p.expiry}</td>
                    <td className="py-3 px-2"><Pill tone={p.status === "Near SL" ? "loss" : p.status === "Near TP" ? "gain" : "info"}>{p.status}</Pill></td>
                    <td className="py-2 px-2 text-right">
                      <CloseBtn
                        confirming={confirmKey === p.contract}
                        onClick={() => confirmKey === p.contract ? closeOne(p.contract) : setConfirmKey(p.contract)}
                        onCancel={() => setConfirmKey(null)}
                        label={p.contract}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
}

function CloseBtn({ confirming, onClick, onCancel, label }: { confirming: boolean; onClick: () => void; onCancel: () => void; label: string }) {
  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px]">
        <span className="text-muted-foreground hidden sm:inline">Close {label}?</span>
        <button onClick={onClick} className="px-2 py-0.5 rounded-md bg-[var(--loss)] text-white font-semibold">Yes</button>
        <button onClick={onCancel} className="px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground">No</button>
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      title="Close position"
      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-[var(--loss-soft)] hover:text-[var(--loss)] text-muted-foreground inline-flex items-center justify-center transition"
    >
      <X className="w-3.5 h-3.5" />
    </button>
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
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {trades.map((t, i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-[14px]">{t.ticker}</span>
                    <span className="text-[11px] text-muted-foreground font-num">{t.strike} {t.expiry}</span>
                  </div>
                  <span className={`font-num font-semibold text-[14px] ${t.pnl >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground font-num">
                  <span>${t.entry.toFixed(2)} → ${t.exit.toFixed(2)}</span>
                  <span>{t.time}</span>
                </div>
                <div className="mt-2">
                  <Pill tone={t.reason.includes("Profit") ? "gain" : t.reason.includes("Stop") ? "loss" : "info"}>{t.reason}</Pill>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block">
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
          </div>
        </>)}
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
    <div className="space-y-6">
      <div className="soft-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-semibold">Live scanner</h2>
          <Pill tone="gain"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] pulse-green" /> Live</Pill>
          <Tip text="Every few seconds Gilbert checks the market. Each row is its decision on a stock." />
        </div>
        <p className="text-[12px] text-muted-foreground mb-4">Most checks are skipped — that's normal. Gilbert only trades when conditions are great.</p>
        <div className="space-y-1.5 pr-1">
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
      <DiscordTerminal />
    </div>
  );
}

const COMMANDS = ["!status", "!scan", "!pause", "!resume", "!close ALL", "!watchlist", "!help"];

function DiscordTerminal() {
  type Entry = { ts: string; cmd: string; resp: string };
  const [log, setLog] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const showSuggest = input.startsWith("!");
  const filtered = COMMANDS.filter(c => c.startsWith(input));

  const send = async (raw?: string) => {
    const cmd = (raw ?? input).trim();
    if (!cmd) return;
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    setInput("");
    let resp = "Sent.";
    try {
      const r = await fetch(`${API_BASE}/api/bot/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      if (r.ok) {
        const data = await r.json().catch(() => null);
        resp = data?.response ?? data?.message ?? "ok";
      } else {
        resp = "(no response)";
      }
    } catch {
      resp = "(offline)";
    }
    setLog(prev => [...prev.slice(-9), { ts, cmd, resp }]);
  };

  return (
    <div className="soft-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Discord Commands</h3>
        <span className="text-[10px] text-muted-foreground">{log.length}/10</span>
      </div>
      <div className="rounded-lg bg-muted/40 border border-border p-3 h-44 overflow-y-auto font-mono text-[12px] space-y-2">
        {log.length === 0 ? (
          <div className="text-muted-foreground text-[11px]">Type a command below. Try !help</div>
        ) : log.slice(-5).map((e, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{e.ts}</span>
              <span className="text-foreground">{e.cmd}</span>
            </div>
            <div className="text-muted-foreground pl-4">→ {e.resp}</div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="relative mt-3 flex items-center gap-2"
      >
        {showSuggest && filtered.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 soft-card p-1 w-56 z-10">
            {filtered.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { setInput(c); }}
                className="w-full text-left px-3 py-1.5 rounded-md text-[12px] font-mono hover:bg-muted text-foreground"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="!command"
          className="flex-1 bg-muted/70 border-0 rounded-full px-4 py-2 text-[13px] font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>
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
          <p className="text-[12px] text-muted-foreground">Fresh market headlines.</p>
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
