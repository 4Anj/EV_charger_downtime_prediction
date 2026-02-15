"use client";

import { useEffect, useState } from "react";

export function useChargerSocket(chargerId) {
  const [live, setLive] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!chargerId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/chargers/${chargerId}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      setLive(JSON.parse(event.data));
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
      ws.close();
    };

    return () => ws.close();
  }, [chargerId]);

  return { live, connected };
}
