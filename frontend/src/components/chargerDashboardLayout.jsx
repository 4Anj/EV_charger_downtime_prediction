"use client";

/* ==================================================
   Charger Dashboard Layout (STATIC / PREVIEW)
================================================== */

export default function ChargerDashboardLayout({ charger, mode }) {
  const latest = charger.history[0];
  const telemetry = charger.telemetry;

  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manual Prediction Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Static simulation · No live updates
          </p>
        </div>

        <span className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
          PREVIEW MODE
        </span>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-4 gap-4">
        <KPI
          title="Health Score"
          value={latest.charger_health_score}
          suffix="%"
        />
        <KPI title="Failure Risk" value={latest.predicted_failure_risk} />
        <KPI title="Priority" value={latest.maintenance_priority} />
        <KPI
          title="Internal Temp"
          value={telemetry.charger_internal_temperature_C}
          suffix="°C"
        />
      </div>

      {/* TELEMETRY */}
      <Panel title="Simulated Telemetry Input">
        <TelemetryGrid telemetry={telemetry} />
      </Panel>

      {/* HEALTH STATUS */}
      <Panel title="Prediction Result">
        <HealthStatus latest={latest} />
      </Panel>
    </main>
  );
}

/* ==================================================
   UI Components
================================================== */

function KPI({ title, value, suffix }) {
  return (
    <div className="rounded-xl border p-4 text-center">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-bold">
        {format(value)}
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

function TelemetryGrid({ telemetry }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {Object.entries(telemetry).map(([k, v]) => (
        <div key={k} className="rounded-lg border px-3 py-2">
          <p className="text-xs text-gray-500">{k.replace(/_/g, " ")}</p>
          <p className="font-mono font-semibold">{format(v)}</p>
        </div>
      ))}
    </div>
  );
}

function HealthStatus({ latest }) {
  let color = "bg-green-500";
  let label = "Healthy";

  if (latest.maintenance_priority === "Emergency") {
    color = "bg-red-500";
    label = "Critical";
  } else if (
    latest.maintenance_priority === "High" ||
    latest.maintenance_priority === "Medium"
  ) {
    color = "bg-yellow-500";
    label = "At Risk";
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm">Status</span>
        <span className="font-semibold">{label}</span>
      </div>

      <div className="w-full h-2 rounded overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${latest.charger_health_score}%` }}
        />
      </div>

      <p className="text-xs text-gray-500">
        Health Score: {latest.charger_health_score}% · Priority:{" "}
        {latest.maintenance_priority}
      </p>
    </div>
  );
}

/* ==================================================
   Helpers
================================================== */

function format(v) {
  if (typeof v !== "number") return v;
  return Number(v.toFixed(3));
}
