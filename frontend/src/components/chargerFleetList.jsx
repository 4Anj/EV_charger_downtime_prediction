"use client";
import { useEffect, useState, useMemo } from "react";

export default function ChargerFleetList({ onSelect, activeCharger }) {
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("health_desc");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [minHealth, setMinHealth] = useState(0);

  async function fetchChargers() {
    try {
      const res = await fetch("https://ev-charger-downtime-prediction.onrender.com/chargers/live");
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Unexpected response:", data);
        setError("Invalid charger data");
        setChargers([]);
        return;
      }

      setChargers(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch chargers", err);
      setError("Backend not reachable");
      setChargers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChargers();
    const interval = setInterval(fetchChargers, 3000);
    return () => clearInterval(interval);
  }, []);

  function color(score) {
    if (score == null) return "bg-gray-500";
    if (score < 30) return "bg-red-600";
    if (score < 50) return "bg-orange-500";
    if (score < 86) return "bg-yellow-500";
    return "bg-green-600";
  }

  const visibleChargers = useMemo(() => {
    return chargers
      .filter((c) => c.charger_id.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => {
        if (
          priorityFilter !== "all" &&
          c.maintenance_priority !== priorityFilter
        ) {
          return false;
        }

        if (c.health_score != null && c.health_score < minHealth) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "health_asc":
            return (a.health_score ?? 999) - (b.health_score ?? 999);
          case "health_desc":
            return (b.health_score ?? -1) - (a.health_score ?? -1);
          case "id_asc":
            return a.charger_id.localeCompare(b.charger_id);
          case "id_desc":
            return b.charger_id.localeCompare(a.charger_id);
          default:
            return 0;
        }
      });
  }, [chargers, search, sortBy, priorityFilter, minHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading chargers…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col gap-2 p-2 border-b border-white/10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search charger ID…"
          className="w-full px-3 py-2 rounded bg-zinc-900 text-white text-sm outline-none"
        />

        <div className="flex gap-2 text-sm">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-zinc-900 text-white"
          >
            <option value="health_desc">Health ↓</option>
            <option value="health_asc">Health ↑</option>
            <option value="id_asc">ID A–Z</option>
            <option value="id_desc">ID Z–A</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-zinc-900 text-white"
          >
            <option value="all">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col w-full gap-2 p-2 overflow-y-auto">
        {visibleChargers.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            No chargers match filters
          </div>
        )}

        {visibleChargers.map((c) => {
          const isActive = c.charger_id === activeCharger;

          return (
            <div
              key={c.charger_id}
              onClick={() => onSelect(c.charger_id)}
              className={`
                cursor-pointer p-3 rounded text-white transition-all
                ${color(c.health_score)}
                ${isActive ? "ring-2 ring-white scale-[1.02]" : "opacity-90"}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="font-bold">{c.charger_id}</div>
                {isActive && (
                  <span className="text-xs bg-black/30 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
              </div>

              {c.health_score != null ? (
                <>
                  <div className="text-sm mt-1">Health: {c.health_score}</div>
                  <div className="text-xs opacity-90">
                    {c.maintenance_priority}
                  </div>
                </>
              ) : (
                <div className="text-xs italic mt-1">No data yet</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
