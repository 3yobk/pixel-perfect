import { useEffect, useRef, useState } from "react";
import {
  Activity, Bot, CheckCircle2, Wifi, MessageSquare, AlertCircle, X,
  Search, ChevronDown, Pause, Play, Send,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  openPositions, recentTrades, pnlCurve, initialScanner, makeScannerEntry,
  signalQueue, quickStats, winRateByTicker, hourHeatmap, drawdownSeries,
  exitReasons, tradeDistribution, avgWinLossByTicker, botLog,
  type ScannerEntry,
} from "@/lib/mockData";

type Tab = "Quote" | "Chart" | "News" | "Options" | "GilbertTrader";
type SubTab = "Dashboard" | "Analytics" | "Bot Log";

export function GilbertDashboard() {
  const [activeTopTab, setActiveTopTab] = useState<Tab>("GilbertTrader");
  const [subTab, setSubTab] = useState<SubTab>("Dashboard");
  const [dataMode, setDataMode] = useState<"Mock" | "Live">("Mock");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const et = now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Webull-style nav */}
      <header className="border-b border-border bg-panel">
        <div className="flex items-center h-11 px-3">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mr-4 font-num">
            <span className="text-foreground font-semibold tracking-wide">WEBULL</span>
            <span className="ml-2">AAPL · Apple Inc.</span>
            <span className="ml-2 text-gain">$232.41 +1.24 (+0.54%)</span>
          </div>
          <nav className="flex items-end h-11">
            {(["Quote","Chart","News","Options","GilbertTrader"] as Tab[]).map(t => {
              const active = activeTopTab === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveTopTab(t)}
                  className={`relative h-11 px-4 text-[13px] transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "GilbertTrader" ? <span>🤖 GilbertTrader</span> : t}
                  {active && <span className="absolute left-2 right-2 bottom-0 h-[2px] bg-primary" />}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-[11px]">
            <button
              onClick={() => setDataMode(m => m === "Mock" ? "Live" : "Mock")}
              className="flex items-center border border-border rounded overflow-hidden"
            >
              <span className={`px-2 py-1 ${dataMode === "Mock" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Mock Data</span>
              <span className={`px-2 py-1 ${dataMode === "Live" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Live</span>
            </button>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gain pulse-green" />
              <span className="text-gain font-semibold tracking-wide">OPEN</span>
            </span>
            <span className="font-num text-muted-foreground">{et} ET</span>
            <span className="px-2 py-1 bg-elevated border border-border rounded font-num text-warn">
              PAPER · $100,000.00
            </span>
          </div>
        </div>

        {activeTopTab === "GilbertTrader" && (
          <div className="flex items-center gap-1 px-3 h-9 border-t border-border bg-background">
            {(["Dashboard","Analytics","Bot Log"] as SubTab[]).map(s => {
              const active = subTab === s;
              return (
                <button
                  key={s}
                  onClick={() => setSubTab(s)}
                  className={`px-3 h-7 text-[12px] rounded-sm ${active ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {activeTopTab !== "GilbertTrader" ? (
        <PlaceholderTab name={activeTopTab} />
      ) : dataMode === "Live" ? (
        <LiveModeMessage />
      ) : subTab === "Dashboard" ? (
        <Dashboard />
      ) : subTab === "Analytics" ? (
        <Analytics />
      ) : (
        <BotLog />
      )}
    </div>
  );
}

/* ---------- Tabs / Live ---------- */

function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
      {name} tab — switch to <span className="mx-1 text-foreground">🤖 GilbertTrader</span> to view the bot.
    </div>
  );
}

function LiveModeMessage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="panel max-w-md w-full p-6">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Live Mode</div>
        <div className="text-base text-foreground mb-3">Connect to GilbertTrader API</div>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
          Set the following environment variables to stream live bot data:
        </p>
        <pre className="font-num text-[11px] bg-background border border-border p-3 rounded text-foreground overflow-x-auto">
{`GILBERT_API_URL=https://your-bot.com/api
GILBERT_API_KEY=...`}
        </pre>
        <p className="text-[12px] text-muted-foreground mt-3">
          Then refresh — the dashboard will subscribe to <code className="text-foreground">/positions</code>, <code className="text-foreground">/trades</code>, and <code className="text-foreground">/scanner</code>.
        </p>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard() {
  return (
    <div className="flex-1 grid grid-cols-[240px_1fr_280px] gap-2 p-2 min-h-0">
      <LeftColumn />
      <CenterColumn />
      <RightColumn />
    </div>
  );
}

function LeftColumn() {
  return (
    <div className="flex flex-col gap-2 min-h-0">
      <div className="panel">
        <div className="panel-header">
          <span>Gilbert Trader</span>
          <span className="flex items-center gap-1.5 text-gain normal-case">
            <span className="w-1.5 h-1.5 rounded-full bg-gain pulse-green" /> Active
          </span>
        </div>
        <div className="p-3 space-y-2.5 text-[12px]">
          <Row label="Mode"><Badge tone="warn">PAPER</Badge></Row>
          <Row label="Strategy">
            <span className="text-foreground">NORMAL</span>
            <span className="text-muted-foreground font-num ml-1.5">TP 25% · SL 15%</span>
          </Row>
          <Row label="Regime">
            <span className="text-gain">🟢 BULL</span>
            <span className="text-muted-foreground font-num ml-1.5">+1.2% vs SMA20</span>
          </Row>
          <Row label="Last scan"><span className="font-num text-muted-foreground">10:42:31</span></Row>
          <Row label="Next in"><span className="font-num text-foreground">00:18</span></Row>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span>Today's P&amp;L</span></div>
        <div className="p-3 space-y-2">
          <div className="font-num text-[24px] text-gain leading-none">+$304.18</div>
          <Row label="Win / Loss"><span className="font-num"><span className="text-gain">9W</span> <span className="text-loss">5L</span></span></Row>
          <Row label="Best trade"><span className="font-num text-gain">+$95.00</span></Row>
          <Row label="Budget left"><span className="font-num">$94,210</span></Row>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span>System Health</span></div>
        <div className="p-3 space-y-1.5 text-[12px]">
          <Health icon={<Wifi className="w-3 h-3"/>}        label="API"          ok="Connected" />
          <Health icon={<MessageSquare className="w-3 h-3"/>} label="Discord"    ok="Online" />
          <Health icon={<Activity className="w-3 h-3"/>}    label="Tradier"      ok="Live" />
          <Health icon={<Bot className="w-3 h-3"/>}         label="Webull API"   ok="Ready" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</span>
      <span className="text-[12px]">{children}</span>
    </div>
  );
}

function Badge({ tone, children }: { tone: "warn" | "gain" | "loss" | "primary"; children: React.ReactNode }) {
  const map = {
    warn:    "bg-warn/15 text-warn",
    gain:    "bg-gain/15 text-gain",
    loss:    "bg-loss/15 text-loss",
    primary: "bg-primary/20 text-primary",
  };
  return <span className={`px-1.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-sm ${map[tone]}`}>{children}</span>;
}

function Health({ icon, label, ok }: { icon: React.ReactNode; label: string; ok: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className="text-gain flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{ok}</span>
    </div>
  );
}

/* ---------- Center ---------- */

function CenterColumn() {
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"Today"|"Week"|"Month"|"All Time">("Today");

  return (
    <div className="flex flex-col gap-2 min-h-0">
      <div className="panel flex flex-col">
        <div className="panel-header"><span>Open Positions</span><span className="text-muted-foreground normal-case">{openPositions.length} active</span></div>
        {openPositions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-[12px]">No open positions — scanner is watching 20 tickers</div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left  font-normal px-3 py-2">Contract</th>
                <th className="text-left  font-normal px-2 py-2">Side</th>
                <th className="text-right font-normal px-2 py-2">Entry</th>
                <th className="text-right font-normal px-2 py-2">Current</th>
                <th className="text-right font-normal px-2 py-2">P&amp;L %</th>
                <th className="text-right font-normal px-2 py-2">Peak</th>
                <th className="text-right font-normal px-2 py-2">Size</th>
                <th className="text-right font-normal px-2 py-2">Expiry</th>
                <th className="text-left  font-normal px-2 py-2">Status</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {openPositions.map((p, i) => {
                const positive = p.pnlPct >= 0;
                const glow = p.pnlPct >= 20 ? "glow-gain" : p.pnlPct <= -10 ? "glow-loss" : "";
                return (
                  <tr key={p.contract} className={`group border-t border-border hover:bg-elevated ${glow} ${i % 2 ? "bg-background/40" : ""}`}>
                    <td className="px-3 py-2 font-num">{p.contract}</td>
                    <td className="px-2 py-2"><span className={p.side === "CALL" ? "text-gain" : "text-loss"}>{p.side}</span></td>
                    <td className="px-2 py-2 text-right font-num">{p.entry.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right font-num">{p.current.toFixed(2)}</td>
                    <td className={`px-2 py-2 text-right font-num ${positive ? "text-gain" : "text-loss"}`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{positive ? "+" : ""}{p.pnlPct.toFixed(1)}%</span>
                        <span className="inline-block h-1 w-10 bg-elevated overflow-hidden rounded-sm">
                          <span className={`block h-full ${positive ? "bg-gain" : "bg-loss"}`} style={{ width: `${Math.min(100, Math.abs(p.pnlPct) * 3)}%` }} />
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right font-num text-muted-foreground">+{p.peakPct.toFixed(1)}%</td>
                    <td className="px-2 py-2 text-right font-num">{p.size}</td>
                    <td className="px-2 py-2 text-right font-num">{p.expiry}</td>
                    <td className="px-2 py-2"><StatusPill status={p.status} /></td>
                    <td className="px-2 py-2 text-right">
                      <button onClick={() => setConfirmClose(p.contract)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-loss">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel flex-1 min-h-0 flex flex-col">
        <div className="panel-header">
          <span>P&amp;L Curve</span>
          <div className="flex gap-0.5 normal-case">
            {(["Today","Week","Month","All Time"] as const).map(r => (
              <button key={r}
                onClick={() => setChartRange(r)}
                className={`text-[11px] px-2 py-0.5 rounded-sm ${chartRange === r ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-[180px] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pnlCurve} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="g-gain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00c087" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00c087" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2d3e" vertical={false} strokeDasharray="2 4" />
              <XAxis dataKey="t" stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }}
                labelStyle={{ color: "#8b90a8" }}
                formatter={(v: number) => [`$${v}`, "P&L"]}
              />
              <Area type="monotone" dataKey="v" stroke="#00c087" strokeWidth={1.5} fill="url(#g-gain)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span>Recent Trades</span></div>
        <div className="max-h-[260px] overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-panel">
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-normal px-3 py-2">Time</th>
                <th className="text-left font-normal px-2 py-2">Ticker</th>
                <th className="text-left font-normal px-2 py-2">Strike</th>
                <th className="text-left font-normal px-2 py-2">Expiry</th>
                <th className="text-left font-normal px-2 py-2">Side</th>
                <th className="text-right font-normal px-2 py-2">Entry</th>
                <th className="text-right font-normal px-2 py-2">Exit</th>
                <th className="text-right font-normal px-2 py-2">P&amp;L $</th>
                <th className="text-left font-normal px-2 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t, i) => {
                const positive = t.pnl >= 0;
                return (
                  <tr key={i} className={`border-t border-border hover:bg-elevated ${positive ? "border-l-2 border-l-gain" : "border-l-2 border-l-loss"} ${i % 2 ? "bg-background/40" : ""}`}>
                    <td className="px-3 py-1.5 font-num text-muted-foreground">{t.time}</td>
                    <td className="px-2 py-1.5 font-num">{t.ticker}</td>
                    <td className="px-2 py-1.5 font-num">{t.strike}</td>
                    <td className="px-2 py-1.5 font-num">{t.expiry}</td>
                    <td className={`px-2 py-1.5 ${t.side === "CALL" ? "text-gain" : "text-loss"}`}>{t.side}</td>
                    <td className="px-2 py-1.5 text-right font-num">{t.entry.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-num">{t.exit.toFixed(2)}</td>
                    <td className={`px-2 py-1.5 text-right font-num ${positive ? "text-gain" : "text-loss"}`}>{positive ? "+" : ""}${t.pnl.toFixed(0)}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{t.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmClose && <ConfirmModal contract={confirmClose} onClose={() => setConfirmClose(null)} />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Monitoring":  "bg-primary/15 text-primary",
    "Near TP":     "bg-gain/15 text-gain",
    "Near SL":     "bg-loss/15 text-loss",
    "Scaling Out": "bg-warn/15 text-warn",
  };
  const pulse = status === "Near TP" || status === "Near SL";
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${styles[status]}`}>
      {pulse && <span className="inline-block w-1 h-1 rounded-full bg-current mr-1 align-middle pulse-green" />}
      {status}
    </span>
  );
}

function ConfirmModal({ contract, onClose }: { contract: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="panel w-[380px]">
        <div className="panel-header"><span>Close Position</span><button onClick={onClose}><X className="w-3 h-3"/></button></div>
        <div className="p-4">
          <p className="text-[13px] text-foreground mb-1">Are you sure?</p>
          <p className="text-[12px] text-muted-foreground mb-4">This will place a market STC order for <span className="font-num text-foreground">{contract}</span>.</p>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-[12px] border border-border rounded-sm hover:bg-elevated">Cancel</button>
            <button onClick={onClose} className="px-3 py-1.5 text-[12px] bg-loss text-white rounded-sm hover:opacity-90">Close Position</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Right column ---------- */

function RightColumn() {
  const [scanner, setScanner] = useState<ScannerEntry[]>(initialScanner);
  const idRef = useRef(100);
  useEffect(() => {
    const id = setInterval(() => {
      setScanner(prev => [makeScannerEntry(idRef.current++), ...prev].slice(0, 30));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2 min-h-0">
      <div className="panel flex flex-col min-h-0 flex-1">
        <div className="panel-header">
          <span className="flex items-center gap-1.5">Scanner <span className="w-1.5 h-1.5 rounded-full bg-gain pulse-green" /></span>
          <span className="text-muted-foreground normal-case font-num">{scanner.length}</span>
        </div>
        <div className="flex-1 overflow-auto font-num text-[11px] leading-tight">
          {scanner.map((s, i) => {
            const color = s.kind === "signal" ? "text-gain" : s.kind === "blocked" ? "text-loss" : "text-muted-foreground";
            return (
              <div key={s.id} className={`px-2 py-1 ${i === 0 ? "flash-row" : ""} ${color} border-b border-border/50`}>
                <span className="text-muted-foreground">{s.time}</span>{" "}
                <span className="text-foreground">{s.ticker.padEnd(5)}</span>{" "}
                <span>{s.detail}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span>Signal Queue</span></div>
        <div className="p-2 space-y-1.5 text-[11px]">
          {signalQueue.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-2 p-1.5 bg-background border border-border rounded-sm">
              <div className="min-w-0">
                <div className="font-num text-foreground">{s.ticker}</div>
                <div className="text-muted-foreground truncate">{s.text}</div>
              </div>
              <div className={`shrink-0 ${s.state === "Approved" ? "text-gain" : s.state === "Rejected" ? "text-loss" : "text-warn"}`}>
                {s.state === "Analyzing" ? "…" : s.state === "Approved" ? "✓" : "✗"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><span>Quick Stats</span></div>
        <div className="grid grid-cols-2 gap-px bg-border text-[11px]">
          <Stat label="Total Trades" value={quickStats.totalTrades.toString()} />
          <Stat label="Win Rate"     value={`${quickStats.winRate}%`} tone="gain" />
          <Stat label="Avg Win"      value={`+$${quickStats.avgWin}`} tone="gain" />
          <Stat label="Avg Loss"     value={`$${quickStats.avgLoss}`} tone="loss" />
          <Stat label="Expectancy"   value={`+$${quickStats.expectancy}`} tone="gain" />
          <Stat label="Max Drawdown" value={`$${quickStats.maxDrawdown}`} tone="loss" />
          <Stat label="Sharpe"       value={quickStats.sharpe.toFixed(2)} />
          <Stat label="Profit Factor" value="2.31" tone="gain" />
        </div>
      </div>

      <DiscordPanel />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  const c = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-foreground";
  return (
    <div className="bg-panel p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-num text-[14px] mt-0.5 ${c}`}>{value}</div>
    </div>
  );
}

const COMMANDS = ["!status", "!scan", "!pause", "!resume", "!close ALL", "!profile"];

function DiscordPanel() {
  const [history, setHistory] = useState([
    { cmd: "!status", res: "Bot active · 3 open · P&L +$304.18" },
    { cmd: "!scan",   res: "Scanner cycle complete — 1 signal (META)" },
    { cmd: "!profile", res: "Strategy NORMAL · TP 25% · SL 15%" },
  ]);
  const [input, setInput] = useState("");
  const [showAuto, setShowAuto] = useState(false);

  const matches = COMMANDS.filter(c => c.startsWith(input) && input.length > 0);

  const send = (cmd?: string) => {
    const c = (cmd || input).trim();
    if (!c) return;
    setHistory(h => [...h.slice(-4), { cmd: c, res: "OK · " + c.replace("!", "") + " executed" }]);
    setInput("");
    setShowAuto(false);
  };

  return (
    <div className="panel flex flex-col">
      <div className="panel-header"><span>Discord</span></div>
      <div className="p-2 space-y-1 text-[11px] font-num max-h-[140px] overflow-auto">
        {history.map((h, i) => (
          <div key={i}>
            <div className="text-primary">&gt; {h.cmd}</div>
            <div className="text-muted-foreground pl-2">{h.res}</div>
          </div>
        ))}
      </div>
      <div className="relative border-t border-border">
        {showAuto && matches.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-elevated border border-border max-h-32 overflow-auto">
            {matches.map(m => (
              <button key={m} onClick={() => send(m)}
                className="block w-full text-left px-2 py-1 text-[11px] font-num hover:bg-background text-foreground">
                {m}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center px-2 h-8">
          <span className="text-primary mr-1 font-num">&gt;</span>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setShowAuto(true); }}
            onKeyDown={e => e.key === "Enter" && send()}
            onFocus={() => setShowAuto(true)}
            onBlur={() => setTimeout(() => setShowAuto(false), 150)}
            placeholder="!status"
            className="flex-1 bg-transparent text-[12px] font-num outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={() => send()} className="text-muted-foreground hover:text-primary"><Send className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Analytics ---------- */

function Analytics() {
  return (
    <div className="flex-1 grid grid-cols-12 gap-2 p-2 auto-rows-[minmax(220px,auto)] overflow-auto">
      <ChartPanel title="Win Rate by Ticker" className="col-span-6">
        <ResponsiveContainer>
          <BarChart layout="vertical" data={winRateByTicker} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid stroke="#2a2d3e" horizontal={false} strokeDasharray="2 4" />
            <XAxis type="number" stroke="#8b90a8" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="ticker" stroke="#8b90a8" fontSize={10} width={50} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }} />
            <Bar dataKey="winRate" radius={[0, 2, 2, 0]}>
              {winRateByTicker.map((d, i) => <Cell key={i} fill={d.winRate >= 50 ? "#00c087" : "#ff5252"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="P&L by Hour (ET)" className="col-span-6">
        <ResponsiveContainer>
          <BarChart data={hourHeatmap}>
            <CartesianGrid stroke="#2a2d3e" vertical={false} strokeDasharray="2 4" />
            <XAxis dataKey="hour" stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }} />
            <Bar dataKey="v">
              {hourHeatmap.map((d, i) => <Cell key={i} fill={d.v >= 0 ? "#00c087" : "#ff5252"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Drawdown Over Time" className="col-span-8">
        <ResponsiveContainer>
          <AreaChart data={drawdownSeries}>
            <defs>
              <linearGradient id="g-loss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5252" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ff5252" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2a2d3e" vertical={false} strokeDasharray="2 4" />
            <XAxis dataKey="d" stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }} />
            <Area type="monotone" dataKey="dd" stroke="#ff5252" strokeWidth={1.5} fill="url(#g-loss)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Exit Reasons" className="col-span-4">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={exitReasons} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} stroke="#13151f">
              {exitReasons.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#8b90a8" }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Trade Distribution" className="col-span-6">
        <ResponsiveContainer>
          <BarChart data={tradeDistribution}>
            <CartesianGrid stroke="#2a2d3e" vertical={false} strokeDasharray="2 4" />
            <XAxis dataKey="bucket" stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }} />
            <Bar dataKey="n">
              {tradeDistribution.map((d, i) => <Cell key={i} fill={Number(d.bucket) >= 0 ? "#00c087" : "#ff5252"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Avg Win vs Avg Loss by Ticker" className="col-span-6">
        <ResponsiveContainer>
          <BarChart data={avgWinLossByTicker}>
            <CartesianGrid stroke="#2a2d3e" vertical={false} strokeDasharray="2 4" />
            <XAxis dataKey="ticker" stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#8b90a8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#13151f", border: "1px solid #2a2d3e", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "#8b90a8" }} />
            <Bar dataKey="win" fill="#00c087" />
            <Bar dataKey="loss" fill="#ff5252" />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel flex flex-col ${className}`}>
      <div className="panel-header"><span>{title}</span></div>
      <div className="flex-1 p-2 min-h-[200px]">{children}</div>
    </div>
  );
}

/* ---------- Bot Log ---------- */

function BotLog() {
  const [filter, setFilter] = useState("");
  const filtered = botLog.filter(l => (l.msg + l.lvl).toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="flex-1 p-2 min-h-0 flex">
      <div className="panel flex-1 flex flex-col min-h-0">
        <div className="panel-header">
          <span>brain.log — last 100 lines</span>
          <div className="flex items-center gap-1 normal-case">
            <Search className="w-3 h-3 text-muted-foreground" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="filter..."
              className="bg-background border border-border rounded-sm px-2 py-0.5 text-[11px] font-num outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto font-num text-[11px] p-2 leading-relaxed">
          {filtered.map((l, i) => {
            const c =
              l.lvl === "ERROR" ? "text-loss" :
              l.lvl === "WARN"  ? "text-warn" :
              l.lvl === "TRADE" ? "text-gain" :
              "text-muted-foreground";
            return (
              <div key={i} className="hover:bg-elevated px-1">
                <span className="text-muted-foreground">{l.t}</span>{" "}
                <span className={`${c} w-12 inline-block`}>[{l.lvl}]</span>{" "}
                <span className="text-foreground">{l.msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
