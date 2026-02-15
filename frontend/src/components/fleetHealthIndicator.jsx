"use client";
import { useEffect, useState } from "react";
import { deriveFleetStatus } from "@/lib/fleetStatus";

export default function FleetHealthIndicator() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      const res = await fetch("http://localhost:8000/fleet/summary");
      const json = await res.json();
      setSummary(json);
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!summary) return null;

  const status = deriveFleetStatus(summary);

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-6xl">{status.emoji}</div>

      <div
        className={`mt-2 text-sm font-semibold ${
          status.color === "red"
            ? "text-red-500"
            : status.color === "yellow"
              ? "text-yellow-500"
              : "text-green-500"
        }`}
      >
        {status.label}
      </div>

      <div className="mt-1 text-xs text-gray-500">
        {summary.emergency} critical · {summary.high} high · {summary.medium}{" "}
        medium · {summary.total_chargers} total
      </div>
    </div>
  );
}
