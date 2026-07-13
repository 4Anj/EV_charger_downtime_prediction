"use client";

import { useEffect, useState } from "react";

export default function FleetActionPanel() {
  const [alertLevel, setAlertLevel] = useState("green");

  useEffect(() => {
    async function checkAlerts() {
      try {
        const res = await fetch("https://ev-charger-downtime-prediction.onrender.com/fleet/summary");
        const data = await res.json();

        const atRisk = data.high + data.medium;

        if (atRisk >= 3) {
          setAlertLevel("yellow");
        } else {
          setAlertLevel("green");
        }
      } catch (err) {
        console.error("Failed to fetch fleet summary", err);
      }
    }

    checkAlerts();
    const interval = setInterval(checkAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  async function downloadLogs() {
    try {
      const res = await fetch("https://ev-charger-downtime-prediction.onrender.com/fleet/logs");
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fleet-logs-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Log download failed", err);
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* ALERT BUTTON */}
      <button
        className={`w-full h-1/2 rounded-xl font-bold text-lg transition-colors
          ${
            alertLevel === "yellow"
              ? "bg-yellow-400 text-black"
              : "bg-green-500 text-white"
          }`}
      >
        Alert Status
      </button>

      {/* LOG DOWNLOAD */}
      <button
        onClick={downloadLogs}
        className="w-full h-1/2 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 transition"
      >
        Download Logs
      </button>
    </div>
  );
}
