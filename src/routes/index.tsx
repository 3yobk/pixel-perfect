import { createFileRoute } from "@tanstack/react-router";
import { GilbertDashboard } from "@/components/GilbertDashboard";

export const Route = createFileRoute("/")({
  component: GilbertDashboard,
  head: () => ({
    meta: [
      { title: "GilbertTrader · Webull" },
      { name: "description", content: "Automated options trading dashboard" },
    ],
  }),
});
