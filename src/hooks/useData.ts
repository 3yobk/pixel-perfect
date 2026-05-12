import { useEffect, useRef, useState } from "react";
import { provider, type Range } from "@/lib/provider";
import type { ScannerEntry as ScannerEntryType } from "@/lib/mockData";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fn().then(d => { if (alive) { setData(d); setError(null); } })
        .catch(e => { if (alive) setError(e instanceof Error ? e : new Error(String(e))); })
        .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, deps);
  return { data, loading, error };
}

export const usePortfolioSummary = (r?: Range) => useAsync(() => provider.getPortfolioSummary(r), [r]);
export const usePortfolioSeries  = (r: Range) => useAsync(() => provider.getPortfolioSeries(r), [r]);
export const usePositions        = (r?: Range) => useAsync(() => provider.getPositions(r), [r]);
export const useRecentTrades     = (r?: Range) => useAsync(() => provider.getRecentTrades(r), [r]);
export const useStats            = (r?: Range) => useAsync(() => provider.getStats(r), [r]);
export const useWinRateByTicker  = (r?: Range) => useAsync(() => provider.getWinRateByTicker(r), [r]);
export const useExitReasons      = (r?: Range) => useAsync(() => provider.getExitReasons(r), [r]);
export const useWatchlist        = () => useAsync(() => provider.getWatchlist(), []);

export function useScannerStream(max = 40) {
  const [feed, setFeed] = useState<ScannerEntryType[]>([]);
  const ref = useRef(feed);
  ref.current = feed;
  useEffect(() => {
    const sub = provider.subscribeScanner((e) => {
      setFeed(prev => [e, ...prev].slice(0, max));
    });
    setFeed(sub.initial);
    return () => sub.unsubscribe();
  }, [max]);
  return feed;
}
