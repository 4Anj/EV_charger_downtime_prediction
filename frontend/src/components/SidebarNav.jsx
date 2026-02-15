"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSyncExternalStore, useState } from "react";

const MAX_HISTORY = 10;

/* ==================================================
   External store (navigation history)
================================================== */

let cachedHistory = [];

function getClientSnapshot() {
  if (typeof window === "undefined") return cachedHistory;

  const raw = localStorage.getItem("nav_history");
  const parsed = raw ? JSON.parse(raw) : [];

  if (JSON.stringify(parsed) === JSON.stringify(cachedHistory)) {
    return cachedHistory;
  }

  cachedHistory = parsed;
  return cachedHistory;
}

function getServerSnapshot() {
  return [];
}

function subscribe(callback) {
  window.addEventListener("nav-history-change", callback);
  return () => window.removeEventListener("nav-history-change", callback);
}

function updateHistory(pathname) {
  if (!pathname) return;

  const prev = getClientSnapshot();
  if (prev[0] === pathname) return;

  const next = [pathname, ...prev.filter((p) => p !== pathname)].slice(
    0,
    MAX_HISTORY,
  );

  cachedHistory = next;
  localStorage.setItem("nav_history", JSON.stringify(next));
  window.dispatchEvent(new Event("nav-history-change"));
}

/* ==================================================
   Sidebar
================================================== */

export default function SidebarNav() {
  const router = useRouter();
  const pathname = usePathname();

  const history = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const [open, setOpen] = useState(false);

  if (typeof window !== "undefined") {
    updateHistory(pathname);
  }

  return (
    <aside
      className={`h-screen border-r bg-black text-white flex flex-col
        transition-all duration-300 ease-in-out
        ${open ? "w-64" : "w-14"}`}
    >
      {/* TOP BAR */}
      <div className="h-14 flex items-center justify-between px-3 border-b">
        {open && <span className="font-bold text-sm">Rotware</span>}

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-gray-300 hover:text-white flex justify-center items-center rounded focus:outline-none pl-2"
          title="Toggle sidebar"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* HOME ICON */}
      <div className="p-2 border-b font-bold text-sm cursor-pointer hover:bg-gray-800">
        <p onClick={() => router.push("/Home")}>Home</p>
      </div>

      {/* HISTORY */}
      <div className="flex-1 overflow-auto p-2">
        {open && (
          <p className="text-xs text-gray-400 mb-2 px-2">Recent Views</p>
        )}

        <div className="space-y-1">
          {history.map((path, i) => (
            <button
              key={i}
              onClick={() => router.push(path)}
              className={`flex items-center gap-2 w-full px-2 py-2 rounded text-xs
                ${
                  path === pathname
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              title={!open ? formatPath(path) : undefined}
            >
              {open && <span>{formatPath(path)}</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ==================================================
   UI Helpers
================================================== */

function IconButton({ children, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-2 rounded
        hover:bg-gray-800 text-sm"
    >
      <span>{children}</span>
      {label && <span>{label}</span>}
    </button>
  );
}

function formatPath(path) {
  if (path === "/" || path === "/Home") return "Home";
  if (path.includes("preview")) return "Manual Preview";
  if (path.includes("/dashboard/")) {
    return `Charger ${path.split("/").pop()}`;
  }
  return path;
}
