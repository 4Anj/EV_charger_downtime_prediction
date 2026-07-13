"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useChargerSocket } from "@/hooks/useChargerSocket";
import SingleChargerHealthChart from "@/components/singleChargerHealthChart";

/* ==================================================
   Charger Dashboard (Live + Preview)
================================================== */

export default function ChargerDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();

  const chargerId = params?.chargerId;
  const previewData = searchParams.get("data");
  const isPreview = chargerId === "preview";

  const [charger, setCharger] = useState(null);
  const [loading, setLoading] = useState(!isPreview);

  const { live, connected } = useChargerSocket(!isPreview ? chargerId : null);

  /* -----------------------------
     Fetch charger (LIVE MODE)
  ----------------------------- */

  useEffect(() => {
    if (isPreview) return;

    async function fetchCharger() {
      try {
        const res = await fetch(`https://ev-charger-downtime-prediction.onrender.com/chargers/${chargerId}`);
        if (!res.ok) throw new Error();
        setCharger(await res.json());
      } catch {
        setCharger(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCharger();
  }, [chargerId, isPreview]);

  /* -----------------------------
     Preview charger (MANUAL MODE)
  ----------------------------- */

  const previewCharger = useMemo(() => {
    if (!isPreview || !previewData) return null;

    const parsed = JSON.parse(previewData);

    return {
      charger_id: "Manual Preview",
      telemetry: parsed.telemetry,
      history: [
        {
          timestamp: new Date().toISOString(),
          charger_health_score: parsed.prediction.charger_health_score,
          predicted_failure_risk: parsed.prediction.predicted_failure_risk,
          maintenance_priority: parsed.prediction.maintenance_priority,
        },
      ],
    };
  }, [isPreview, previewData]);

  const activeCharger = isPreview ? previewCharger : charger;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading dashboard…
      </div>
    );
  }

  if (!activeCharger) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        Charger not found
      </div>
    );
  }

  /* -----------------------------
     Normalize Health Data
  ----------------------------- */

  const health = normalizeHealth(live, activeCharger.history);
  const telemetry = live?.telemetry || activeCharger.telemetry;

  /* ==================================================
     RENDER
  ================================================== */

  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isPreview
            ? "Manual Prediction Dashboard"
            : `Charger Dashboard — ${chargerId}`}
        </h1>

        {!isPreview && (
          <span
            className={`text-sm font-semibold ${
              connected ? "text-green-500" : "text-red-500"
            }`}
          >
            {connected ? "LIVE" : "DISCONNECTED"}
          </span>
        )}
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-5 gap-4">
        <KPI title="Health Score" value={health.score} suffix="%" />
        <KPI title="Risk" value={health.risk} />
        <KPI title="Priority" value={health.priority} />
        <KPI
          title="Voltage"
          value={formatNumber(telemetry.charger_output_voltage_V)}
          suffix="V"
        />
        <KPI
          title="Internal Temp"
          value={formatNumber(telemetry.charger_internal_temperature_C)}
          suffix="°C"
        />
      </div>

      {!isPreview && live && (
        <SingleChargerHealthChart chargerId={chargerId} live={live} />
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 gap-6">
        <Panel title={isPreview ? "Simulated Telemetry" : "Live Telemetry"}>
          <TelemetryTable telemetry={telemetry} />
        </Panel>

        <Panel title="Health Status">
          <HealthStatus health={health} />
        </Panel>
      </div>

      {/* HISTORY */}
      <Panel title="Recent Alerts & Predictions">
        <HistoryTable history={activeCharger.history.slice(-5)} />
      </Panel>
    </main>
  );
}

/* ==================================================
   HELPERS
================================================== */

function formatNumber(value) {
  if (typeof value !== "number") return value;
  return Number(value.toFixed(3));
}

function normalizeHealth(live, history) {
  if (live?.health) {
    return {
      score: formatNumber(live.health.health_score),
      risk: formatNumber(live.health.risk),
      priority: live.health.priority,
    };
  }

  const last = history?.at(-1);
  if (!last) return {};

  return {
    score: formatNumber(last.charger_health_score),
    risk: formatNumber(last.predicted_failure_risk),
    priority: last.maintenance_priority,
  };
}

/* ==================================================
   UI COMPONENTS
================================================== */

function KPI({ title, value, suffix }) {
  return (
    <div className="rounded-xl border p-4 text-center">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-bold">
        {value ?? "--"}
        {suffix}
      </p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function TelemetryTable({ telemetry }) {
  return (
    <div className="space-y-2 text-sm">
      {Object.entries(telemetry).map(([k, v]) => (
        <div key={k} className="flex justify-between border-b pb-1">
          <span className="text-gray-500">{k.replace(/_/g, " ")}</span>
          <span className="font-mono">{formatNumber(v)}</span>
        </div>
      ))}
    </div>
  );
}

function HealthStatus({ health }) {
  let color = "text-green-500";
  let label = "Healthy";

  if (health.priority === "Emergency") {
    color = "text-red-500";
    label = "Critical";
  } else if (health.priority === "High" || health.priority === "Medium") {
    color = "text-yellow-500";
    label = "At Risk";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className={`text-4xl font-bold ${color}`}>{label}</div>
      <div className="mt-2 text-sm text-gray-500">
        Priority: {health.priority}
      </div>
      <div className="text-xs text-gray-400">Health Score: {health.score}%</div>
    </div>
  );
}

function HistoryTable({ history }) {
  if (!history.length) {
    return <p className="text-sm text-gray-500">No history available</p>;
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-left p-2">Time</th>
            <th className="text-left p-2">Health</th>
            <th className="text-left p-2">Risk</th>
            <th className="text-left p-2">Priority</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">
                {new Date(h.timestamp).toLocaleTimeString()}
              </td>
              <td className="p-2">{formatNumber(h.charger_health_score)}%</td>
              <td className="p-2">{formatNumber(h.predicted_failure_risk)}</td>
              <td className="p-2 font-semibold">{h.maintenance_priority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
