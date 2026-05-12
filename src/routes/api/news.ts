import { createFileRoute } from "@tanstack/react-router";

/**
 * News endpoint backed by Yahoo Finance (no API key required).
 * Returns Finnhub-shaped objects so the existing UI works unchanged.
 */

type YahooNewsItem = {
  uuid?: string;
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

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const symbol = url.searchParams.get("symbol");
        const category = url.searchParams.get("category") ?? "general";
        const q = symbol ? symbol : (CATEGORY_QUERY[category] ?? "stocks");

        try {
          const endpoint = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=30&quotesCount=0`;
          const res = await fetch(endpoint, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; GilbertBot/1.0)",
              "Accept": "application/json",
            },
          });
          if (!res.ok) {
            return Response.json([], { status: 200 });
          }
          const data = (await res.json()) as { news?: YahooNewsItem[] };
          const items = (data.news ?? []).map((n, i) => ({
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
          return new Response(JSON.stringify(items), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch {
          return Response.json([], { status: 200 });
        }
      },
    },
  },
});
