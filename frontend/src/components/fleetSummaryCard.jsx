"use client";

import { useEffect, useState } from "react";

export default function FleetSummaryCard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("https://ev-charger-downtime-prediction.onrender.com/fleet/summary");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to fetch fleet summary", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();

    // simple live refresh (can replace with WS later)
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !summary) {
    return <div className="text-sm text-white">Loading fleet data…</div>;
  }

  const atRisk = summary.high + summary.medium;

  return (
    <div className="w-full h-full p-4 flex flex-col justify-between">
      <h2 className="text-lg font-bold mb-2">Battery Overview</h2>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <Metric
          label="Total Chargers"
          value={summary.total_chargers}
          color="text-white"
        />

        <Metric
          label="Healthy"
          value={summary.healthy}
          color="text-green-600"
        />

        <Metric label="At-Risk" value={atRisk} color="text-orange-500" />

        <Metric
          label="Critical"
          value={summary.emergency}
          color="text-red-600"
        />
      </div>
    </div>
  );
}

function Metric({ label, value, color = "text-gray-800" }) {
  return (
    <div className="rounded-xl border p-3 flex flex-col items-center justify-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
