import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
        }
        const url = new URL(request.url);
        const symbol = url.searchParams.get("symbol");
        const category = url.searchParams.get("category") ?? "general";

        try {
          let endpoint: string;
          if (symbol) {
            const to = new Date();
            const from = new Date(Date.now() - 7 * 24 * 3600 * 1000);
            const fmt = (d: Date) => d.toISOString().slice(0, 10);
            endpoint = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`;
          } else {
            endpoint = `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${apiKey}`;
          }
          const res = await fetch(endpoint);
          if (!res.ok) {
            return Response.json({ error: `Finnhub ${res.status}` }, { status: 502 });
          }
          const data = await res.json();
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
