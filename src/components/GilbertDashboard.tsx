import { useEffect, useRef, useState } from "react";
import {
  Activity, Bot, Wifi, Sparkles, TrendingUp, TrendingDown,
  HelpCircle, BookOpen, Zap, Shield, Target, Clock, PlayCircle, PauseCircle,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  openPositions, recentTrades, pnlCurve, initialScanner, makeScannerEntry,
  quickStats, winRateByTicker, exitReasons,
  type ScannerEntry,
} from "@/lib/mockData";

type Tab = "Today" | "Positions" | "History" | "Insights" | "Activity" | "Learn";

const tabs: { id: Tab; label: string; icon: typeof Activity; hint: string }[] = [
  { id: "Today",     label: "Today",     icon: Sparkles,  hint: "What's happening right now" },
  { id: "Positions", label: "Positions", icon: Target,    hint: "Trades currently open" },
  { id: "History",   label: "History",   icon: Clock,     hint: "Recently closed trades" },
  { id: "Insights",  label: "Insights",  icon: TrendingUp,hint: "Performance patterns" },
  { id: "Activity",  label: "Activity",  icon: Activity,  hint: "Bot's live thinking" },
  { id: "Learn",     label: "Learn",     icon: BookOpen,  hint: "Glossary & tips" },
];

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

export function GilbertDashboard() {
  const [tab, setTab] = useState<Tab>("Today");
  const [now, setNow] = useState(new Date());
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const et = now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: true });
  const totalPnl = pnlCurve[pnlCurve.length - 1].v;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-panel/80 backdrop-blur border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#7aa6ff] flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-[15px] leading-tight">Gilbert</div>
              <div className="text-[11px] text-muted-foreground leading-tight">Your trading assistant</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[12px]">
            <Pill tone="gain"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] pulse-green" /> Connected</Pill>
            <Pill tone="muted"><Clock className="w-3 h-3" /> {et} ET</Pill>
            <Pill tone="info"><Shield className="w-3 h-3" /> Paper mode</Pill>
          </div>

          <button
            onClick={() => setRunning(r => !r)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition ${running ? "bg-[var(--gain-soft)] text-[var(--gain)] hover:brightness-95" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            {running ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            {running ? "Bot is running" : "Bot is paused"}
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 flex items-center gap-1 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`group relative flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition border-b-2 ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {tab === "Today"     && <TodayView totalPnl={totalPnl} running={running} />}
        {tab === "Positions" && <PositionsView />}
        {tab === "History"   && <HistoryView />}
        {tab === "Insights"  && <InsightsView />}
        {tab === "Activity"  && <ActivityView />}
        {tab === "Learn"     && <LearnView />}
      </main>
    </div>
  );
}

/* ------------------------------- TODAY ------------------------------- */

function TodayView({ totalPnl, running }: { totalPnl: number; running: boolean }) {
  const pnlPositive = totalPnl >= 0;
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="soft-card p-5 sm:p-6 bg-gradient-to-br from-[var(--info-soft)] to-panel">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-semibold">Good day! Here's what Gilbert is up to.</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              {running
                ? "I'm scanning the market and managing your trades. You don't need to do anything — just check in whenever you like."
                : "I'm paused. Press 'Bot is paused' in the top right to start scanning again."}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Today's P&L"
          tip="Profit and Loss — how much money you've made or lost today."
          value={`${pnlPositive ? "+" : ""}$${totalPnl}`}
          tone={pnlPositive ? "gain" : "loss"}
          sub={`${pnlPositive ? "▲" : "▼"} vs. yesterday`}
        />
        <StatCard
          label="Open trades"
          tip="Trades that are still active and not yet closed."
          value={`${openPositions.length}`}
          tone="info"
          sub="being monitored"
        />
        <StatCard
          label="Win rate"
          tip="The percentage of trades that ended profitable."
          value={`${quickStats.winRate}%`}
          tone="gain"
          sub={`${quickStats.totalTrades} trades total`}
        />
        <StatCard
          label="Avg win / loss"
          tip="Average dollars made on winning trades vs. lost on losing trades."
          value={`+$${quickStats.avgWin} / -$${Math.abs(quickStats.avgLoss)}`}
          tone="muted"
          sub={`Expectancy +$${quickStats.expectancy}`}
        />
      </div>

      {/* P&L chart + positions */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="soft-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Today's P&L curve</h2>
              <Tip text="A timeline of how your account has gone up or down throughout the day." />
            </div>
            <Pill tone={pnlPositive ? "gain" : "loss"}>
              {pnlPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {pnlPositive ? "+" : ""}{totalPnl}
            </Pill>
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">Updated live as trades close.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlCurve}>
                <defs>
                  <linearGradient id="pnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gain)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--gain)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`$${v}`, "P&L"]}
                />
                <Area type="monotone" dataKey="v" stroke="var(--gain)" strokeWidth={2.5} fill="url(#pnl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="soft-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold">Open positions</h2>
            <Tip text="Trades the bot has placed that are still waiting to hit profit target or stop loss." />
          </div>
          <div className="space-y-3">
            {openPositions.map(p => {
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
                    <span>Entry ${p.entry.toFixed(2)} → ${p.current.toFixed(2)}</span>
                    <span>{p.status}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${positive ? "bg-[var(--gain)]" : "bg-[var(--loss)]"}`}
                      style={{ width: `${Math.min(Math.abs(p.pnlPct) * 3, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tip of the day */}
      <div className="soft-card p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--warn-soft)] flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-[var(--warn)]" />
        </div>
        <div>
          <div className="font-semibold text-[14px]">Beginner tip</div>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            A "stop loss" automatically closes a trade once it loses a certain amount, so you can't lose more than you planned. Gilbert sets one on every trade.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone, sub, tip }: {
  label: string; value: string; tone: "gain" | "loss" | "info" | "muted"; sub: string; tip: string;
}) {
  const accent = {
    gain: "text-[var(--gain)]",
    loss: "text-[var(--loss)]",
    info: "text-primary",
    muted: "text-foreground",
  }[tone];
  return (
    <div className="soft-card p-4">
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {label} <Tip text={tip} />
      </div>
      <div className={`mt-1.5 text-2xl font-semibold font-num ${accent}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

/* ------------------------------ POSITIONS ------------------------------ */

function PositionsView() {
  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold">Open positions</h2>
        <Tip text="Each row is a trade Gilbert has opened and is still managing." />
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">The bot will close these automatically when conditions are met.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="py-2 px-2">Contract</th>
              <th className="py-2 px-2">Side</th>
              <th className="py-2 px-2 text-right">Entry</th>
              <th className="py-2 px-2 text-right">Current</th>
              <th className="py-2 px-2 text-right">P&L</th>
              <th className="py-2 px-2 text-right">Peak</th>
              <th className="py-2 px-2">Expiry</th>
              <th className="py-2 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {openPositions.map(p => {
              const positive = p.pnlPct >= 0;
              return (
                <tr key={p.contract} className="border-b border-border/60 hover:bg-accent">
                  <td className="py-3 px-2 font-medium">{p.contract}</td>
                  <td className="py-3 px-2"><Pill tone={p.side === "CALL" ? "gain" : "loss"}>{p.side}</Pill></td>
                  <td className="py-3 px-2 text-right font-num">${p.entry.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-num">${p.current.toFixed(2)}</td>
                  <td className={`py-3 px-2 text-right font-num font-semibold ${positive ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                    {positive ? "+" : ""}{p.pnlPct.toFixed(1)}%
                  </td>
                  <td className="py-3 px-2 text-right font-num text-muted-foreground">{p.peakPct.toFixed(1)}%</td>
                  <td className="py-3 px-2 text-muted-foreground">{p.expiry}</td>
                  <td className="py-3 px-2">
                    <Pill tone={p.status === "Near SL" ? "loss" : p.status === "Near TP" ? "gain" : "info"}>{p.status}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ HISTORY ------------------------------ */

function HistoryView() {
  const wins = recentTrades.filter(t => t.pnl > 0).length;
  const losses = recentTrades.length - wins;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="soft-card p-4">
          <div className="text-[12px] text-muted-foreground">Wins today</div>
          <div className="text-2xl font-semibold text-[var(--gain)] font-num">{wins}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-[12px] text-muted-foreground">Losses today</div>
          <div className="text-2xl font-semibold text-[var(--loss)] font-num">{losses}</div>
        </div>
        <div className="soft-card p-4">
          <div className="text-[12px] text-muted-foreground">Net</div>
          <div className="text-2xl font-semibold font-num">
            ${recentTrades.reduce((s, t) => s + t.pnl, 0)}
          </div>
        </div>
      </div>
      <div className="soft-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold">Recently closed trades</h2>
          <Tip text="Each row is a trade Gilbert opened and then closed today." />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2">Ticker</th>
                <th className="py-2 px-2">Contract</th>
                <th className="py-2 px-2 text-right">Entry → Exit</th>
                <th className="py-2 px-2 text-right">P&L</th>
                <th className="py-2 px-2">Why closed</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t, i) => (
                <tr key={i} className="border-b border-border/60 hover:bg-accent">
                  <td className="py-2.5 px-2 text-muted-foreground font-num">{t.time}</td>
                  <td className="py-2.5 px-2 font-medium">{t.ticker}</td>
                  <td className="py-2.5 px-2 font-num">{t.strike} <span className="text-muted-foreground">{t.expiry}</span></td>
                  <td className="py-2.5 px-2 text-right font-num">${t.entry.toFixed(2)} → ${t.exit.toFixed(2)}</td>
                  <td className={`py-2.5 px-2 text-right font-num font-semibold ${t.pnl >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}`}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl}
                  </td>
                  <td className="py-2.5 px-2">
                    <Pill tone={t.reason.includes("Profit") ? "gain" : t.reason.includes("Stop") ? "loss" : "info"}>{t.reason}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ INSIGHTS ------------------------------ */

function InsightsView() {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="soft-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold">Win rate by ticker</h2>
            <Tip text="How often trades on each stock end profitable." />
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">Higher = more reliable for Gilbert.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateByTicker} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="ticker" type="category" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="winRate" radius={[0, 8, 8, 0]}>
                  {winRateByTicker.map((d, i) => (
                    <Cell key={i} fill={d.winRate >= 60 ? "var(--gain)" : d.winRate >= 50 ? "var(--primary)" : "var(--loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="soft-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold">Why trades closed</h2>
            <Tip text="The reason each trade ended — hitting profit target, stop loss, or other." />
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">A healthy bot hits profit targets often.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={exitReasons} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {exitReasons.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {exitReasons.map(e => (
              <div key={e.name} className="flex items-center gap-2 text-[12px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                <span className="text-muted-foreground">{e.name}</span>
                <span className="ml-auto font-num">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="soft-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold">Key numbers</h2>
          <Tip text="A quick health check on Gilbert's overall trading." />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Sharpe ratio", v: quickStats.sharpe.toFixed(2), t: "Risk-adjusted returns. Above 1 is good." },
            { l: "Max drawdown", v: `$${quickStats.maxDrawdown}`, t: "Biggest peak-to-trough loss seen." },
            { l: "Expectancy", v: `+$${quickStats.expectancy}`, t: "Average expected profit per trade." },
            { l: "Total trades", v: quickStats.totalTrades, t: "Trades placed all-time." },
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

/* ------------------------------ ACTIVITY ------------------------------ */

function ActivityView() {
  const [feed, setFeed] = useState<ScannerEntry[]>(initialScanner);
  const idRef = useRef(initialScanner.length + 1);

  useEffect(() => {
    const id = setInterval(() => {
      setFeed(f => [makeScannerEntry(idRef.current++), ...f].slice(0, 40));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold">Live scanner</h2>
        <Pill tone="gain"><span className="w-1.5 h-1.5 rounded-full bg-[var(--gain)] pulse-green" /> Live</Pill>
        <Tip text="Every few seconds Gilbert checks the market. Each row is a stock it looked at and its decision." />
      </div>
      <p className="text-[12px] text-muted-foreground mb-4">
        Gilbert is constantly checking conditions like RSI (momentum) and Volume to find good trades. Most checks are skipped — that's normal.
      </p>
      <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
        {feed.map((e, i) => (
          <div
            key={e.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-border/70 text-[13px] ${i === 0 ? "flash-row" : ""}`}
          >
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

/* ------------------------------- LEARN ------------------------------- */

function LearnView() {
  const items = [
    { q: "What is RSI?", a: "RSI (Relative Strength Index) measures momentum. Below 30 = stock may be oversold (a buy signal), above 70 = overbought." },
    { q: "What's a CALL vs a PUT?", a: "A CALL profits when a stock goes UP. A PUT profits when it goes DOWN. Gilbert picks based on the setup." },
    { q: "What is a stop loss?", a: "A safety net — if a trade loses a set amount, it auto-closes so you can't lose more than planned." },
    { q: "What is a profit target?", a: "The point where Gilbert auto-closes a winning trade to lock in gains." },
    { q: "What does 'Paper mode' mean?", a: "Trades are simulated with fake money. Great for learning without risk before going live." },
    { q: "What's a good win rate?", a: "Anywhere between 50–70% is healthy, as long as wins are bigger than losses on average." },
  ];
  return (
    <div className="space-y-4">
      <div className="soft-card p-6 bg-gradient-to-br from-[var(--info-soft)] to-panel">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">New to trading?</h2>
        </div>
        <p className="text-[13px] text-muted-foreground max-w-2xl">
          No worries — Gilbert handles the hard parts. Here are the words and ideas you'll see most often.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map(it => (
          <div key={it.q} className="soft-card p-4">
            <div className="font-medium text-[14px]">{it.q}</div>
            <p className="text-[13px] text-muted-foreground mt-1">{it.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
