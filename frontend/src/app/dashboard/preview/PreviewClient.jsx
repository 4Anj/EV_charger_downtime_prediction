"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ChargerDashboardLayout from "@/components/chargerDashboardLayout";

export default function PreviewDashboardPage() {
  const params = useSearchParams();
  const router = useRouter();

  const raw = params.get("data");

  if (!raw) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">No preview data available</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Go back to Home
        </button>
      </div>
    );
  }

  const parsed = JSON.parse(decodeURIComponent(raw));

  const charger = {
    charger_id: "MANUAL_PREVIEW",
    telemetry: parsed.telemetry,
    history: [
      {
        timestamp: new Date().toISOString(),
        predicted_failure_risk: parsed.prediction.predicted_failure_risk,
        charger_health_score: parsed.prediction.charger_health_score,
        maintenance_priority: parsed.prediction.maintenance_priority,
      },
    ],
  };

  return <ChargerDashboardLayout charger={charger} mode="preview" />;
}
