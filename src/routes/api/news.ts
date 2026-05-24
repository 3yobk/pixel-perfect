import { createFileRoute } from "@tanstack/react-router";

/**
 * News endpoint backed by Finnhub.
 * Uses FINNHUB_API_KEY from server env (runtime secret).
 * Yahoo fallback is kept silent in case the key is missing or rate-limited.
 */

type FinnhubItem = {
  id?: number;
  category?: string;
  datetime?: number;
  headline?: string;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

type YahooNewsItem = {
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
  summary?: string;
  thumbnail?: { resolutions?: Array<{ url: string; width: number; height: number }> };
  relatedTickers?: string[];
};

const CATEGORY_QUERY: Record<string, string> = {
  general: "stocks",
  forex: "forex",
  crypto: "crypto",
  merger: "merger acquisition",
};

function pickImage(t?: YahooNewsItem["thumbnail"]): string {
  if (!t?.resolutions?.length) return "";
  const sorted = [...t.resolutions].sort((a, b) => b.width - a.width);
  return sorted[0]?.url ?? "";
}

async function fetchFinnhub(symbol: string | null, category: string, apiKey: string) {
  const endpoint = symbol
    ? `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)}&to=${new Date().toISOString().slice(0, 10)}&token=${apiKey}`
    : `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${apiKey}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  return (await res.json()) as FinnhubItem[];
}

async function fetchYahoo(symbol: string | null, category: string) {
  const q = symbol ? symbol : (CATEGORY_QUERY[category] ?? "stocks");
  const endpoint = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=30&quotesCount=0`;
  const res = await fetch(endpoint, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GilbertBot/1.0)", "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const data = (await res.json()) as { news?: YahooNewsItem[] };
  return (data.news ?? []).map((n, i) => ({
    id: i + 1,
    headline: n.title ?? "",
    summary: n.summary ?? "",
    source: n.publisher ?? "Yahoo Finance",
    url: n.link ?? "",
    image: pickImage(n.thumbnail),
    datetime: n.providerPublishTime ?? Math.floor(Date.now() / 1000),
    category,
    related: (n.relatedTickers ?? []).join(","),
  }));
}

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const symbol = url.searchParams.get("symbol");
        const category = url.searchParams.get("category") ?? "general";
        const apiKey = process.env.FINNHUB_API_KEY;

        let items: FinnhubItem[] = [];
        if (apiKey) {
          try { items = await fetchFinnhub(symbol, category, apiKey); } catch { /* fall through */ }
        }
        if (!items.length) {
          try { items = await fetchYahoo(symbol, category); } catch { /* empty */ }
        }

        return new Response(JSON.stringify(items), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});
