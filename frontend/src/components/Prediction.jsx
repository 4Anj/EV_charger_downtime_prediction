"use client";

import { useState } from "react";
import { predictFailure } from "@/lib/api";
import { useRouter } from "next/navigation";

const FIELDS = [
  {
    key: "charger_output_voltage_V",
    label: "Output Voltage (V)",
    min: 360,
    max: 440,
    step: 1,
  },
  {
    key: "charging_current_A",
    label: "Charging Current (A)",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: "charging_power_kW",
    label: "Charging Power (kW)",
    min: 0,
    max: 150,
    step: 0.5,
  },
  {
    key: "charger_load_kW",
    label: "Charger Load (kW)",
    min: 0,
    max: 150,
    step: 0.5,
  },
  {
    key: "ambient_temperature_C",
    label: "Ambient Temp (°C)",
    min: -10,
    max: 60,
    step: 1,
  },
  {
    key: "charger_internal_temperature_C",
    label: "Internal Temp (°C)",
    min: 10,
    max: 120,
    step: 1,
  },
];

export default function PredictForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    charger_output_voltage_V: 400,
    charging_current_A: 50,
    charging_power_kW: 20,
    charger_load_kW: 18,
    ambient_temperature_C: 30,
    charger_internal_temperature_C: 45,
  });

  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const prediction = await predictFailure(form);

      router.push(
        `/dashboard/preview?data=${encodeURIComponent(
          JSON.stringify({
            telemetry: form,
            prediction,
          }),
        )}`,
      );
    } catch (err) {
      alert("Prediction failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 bg-black p-6 rounded-xl md:rounded-2xl w-full h-full overflow-y-auto"
    >
      <h2 className="text-xl font-semibold text-white">
        Manual Charger Simulation
      </h2>

      {FIELDS.map(({ key, label, min, max, step }) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-1 text-gray-300">
            <label>{label}</label>
            <span className="font-mono">{form[key]}</span>
          </div>

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={form[key]}
            onChange={(e) => updateField(key, +e.target.value)}
            className="w-full accent-blue-500"
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded font-semibold"
      >
        {loading ? "Analyzing..." : "Predict"}
      </button>
    </form>
  );
}
