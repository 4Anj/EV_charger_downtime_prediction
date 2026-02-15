"use client";

import React, { useState } from "react";
import "./home.css";
import PredictForm from "@/components/Prediction";
import { useRouter } from "next/navigation";
import ChargerFleetList from "@/components/chargerFleetList";
import FleetHealthIndicator from "@/components/fleetHealthIndicator";
import ChargerControlBar from "@/components/chargerControlBox";
import FleetSummaryCard from "@/components/fleetSummaryCard";
import FleetHealthLineChart from "@/components/fleetHealthLineChart";
import FleetAveragesBar from "@/components/fleetAverageBar";
import FleetActionPanel from "@/components/fleetActionPanel";

export default function HomePage() {
  const [activeCharger, setActiveCharger] = useState(null);

  const router = useRouter();

  function handleResult(result) {
    localStorage.setItem("last_prediction", JSON.stringify(result));
    router.push("/dashboard");
  }

  return (
    <div className="parent w-screen h-screen">
      <div className="div1 border-2 rounded-t-2xl rounded-b-[8px] flex">
        <ChargerFleetList
          onSelect={setActiveCharger}
          activeCharger={activeCharger}
        />
      </div>
      <div className="div2 border-2 md:rounded-2xl flex items-center justify-center ">
        <ChargerControlBar />
      </div>
      <div className="div3 border-2 md:rounded-2xl flex items-center justify-center">
        <FleetHealthIndicator />
      </div>
      <div className="div4 border-2 md:rounded-2xl flex items-center justify-center">
        <FleetSummaryCard />
      </div>
      <div className="div5 border-2 rounded-2xl flex items-center justify-center">
        <FleetHealthLineChart />
      </div>
      <div className="div6 border-2 md:rounded-2xl flex items-center justify-center">
        <PredictForm onResult={handleResult} />
      </div>
      <div className="div8 mt-4 md:rounded-2xl flex items-center justify-center">
        <FleetAveragesBar />
      </div>

      <div className="div7 md:rounded-2xl flex items-center justify-center">
        <FleetActionPanel />
      </div>
    </div>
  );
}
