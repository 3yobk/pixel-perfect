import { useEffect, useRef, useState } from "react";
import { provider, type Range, type ScannerEntry } from "@/lib/provider";
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

export const usePortfolioSummary = () => useAsync(() => provider.getPortfolioSummary(), []);
export const usePortfolioSeries  = (r: Range) => useAsync(() => provider.getPortfolioSeries(r), [r]);
export const usePositions        = () => useAsync(() => provider.getPositions(), []);
export const useRecentTrades     = () => useAsync(() => provider.getRecentTrades(), []);
export const useStats            = () => useAsync(() => provider.getStats(), []);
export const useWinRateByTicker  = () => useAsync(() => provider.getWinRateByTicker(), []);
export const useExitReasons      = () => useAsync(() => provider.getExitReasons(), []);
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
