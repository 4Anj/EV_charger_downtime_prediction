"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChargerControlBar() {
  const [chargerId, setChargerId] = useState("");
  const router = useRouter();

  async function handleAdd() {
    if (!chargerId.trim()) {
      alert("Enter a charger ID");
      return;
    }

    const res = await fetch("https://ev-charger-downtime-prediction.onrender.com/chargers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ charger_id: chargerId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.detail);
      return;
    }

    alert(`Charger ${chargerId} added`);
    setChargerId("");
  }

  async function handleGo() {
    if (!chargerId.trim()) {
      alert("Enter a charger ID");
      return;
    }

    const res = await fetch(
      `https://ev-charger-downtime-prediction.onrender.com/chargers/exists/${chargerId}`,
    );
    const data = await res.json();

    if (!data.exists) {
      alert("Charger does not exist. Add it first.");
      return;
    }

    router.push(`/dashboard/${chargerId}`);
  }

  return (
    <div className="flex flex-col h-full w-full items-center gap-3 p-4">
      <input
        value={chargerId}
        onChange={(e) => setChargerId(e.target.value)}
        placeholder="Enter Charger ID (e.g. EV-109)"
        className="flex-1 px-3 py-2 h-[40%] border rounded-lg outline-none w-full"
      />

      {/* Add charger */}
      <div className="flex w-full h-[40%] mb-2 items-center justify-center">
        <div className="grid w-full grid-cols-2 place-items-center h-full gap-1">
          <button
            onClick={handleAdd}
            className="px-4 py-2 w-full h-full rounded-lg bg-green-600 text-white font-bold cursor-pointer"
            title="Add charger"
          >
            +
          </button>

          {/* Navigate */}
          <button
            onClick={handleGo}
            className="px-4 py-2 w-full h-full rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
            title="Go to charger dashboard"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
