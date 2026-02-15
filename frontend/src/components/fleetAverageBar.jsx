"use client";

import { useEffect, useState } from "react";

export default function FleetAveragesBar() {
  const [averages, setAverages] = useState(null);

  useEffect(() => {
    async function fetchAverages() {
      try {
        // Step 1: get charger IDs
        const res = await fetch("http://localhost:8000/chargers/live");
        const chargers = await res.json();

        if (chargers.length === 0) return;

        // Step 2: fetch full charger data
        const fullData = await Promise.all(
          chargers.map((c) =>
            fetch(`http://localhost:8000/chargers/${c.charger_id}`).then((r) =>
              r.json(),
            ),
          ),
        );

        // Step 3: aggregate telemetry
        let voltage = 0;
        let current = 0;
        let temp = 0;
        let load = 0;

        fullData.forEach((c) => {
          const t = c.telemetry;
          voltage += t.charger_output_voltage_V;
          current += t.charging_current_A;
          temp += t.charger_internal_temperature_C;
          load += t.charger_load_kW;
        });

        const count = fullData.length;

        setAverages({
          voltage: (voltage / count).toFixed(1),
          current: (current / count).toFixed(1),
          temperature: (temp / count).toFixed(1),
          load: (load / count).toFixed(1),
        });
      } catch (err) {
        console.error("Failed to compute fleet averages", err);
      }
    }

    fetchAverages();

    const interval = setInterval(fetchAverages, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!averages) {
    return <div className="text-sm text-gray-500">Loading fleet metrics…</div>;
  }

  return (
    <div className="w-full h-full px-4 flex items-center gap-4">
      <Metric label="Avg Voltage" value={`${averages.voltage} V`} />
      <Metric label="Avg Current" value={`${averages.current} A`} />
      <Metric label="Avg Temp" value={`${averages.temperature} °C`} />
      <Metric label="Avg Load" value={`${averages.load} kW`} />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex-1 h-full rounded-xl border flex flex-col items-center justify-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
