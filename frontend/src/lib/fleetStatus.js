// lib/fleetStatus.js
export function deriveFleetStatus(summary) {
  const { emergency, high, medium, total_chargers } = summary;

  const atRisk = high + medium;

  if (emergency >= 1) {
    return {
      level: "critical",
      emoji: "😡",
      label: "Critical Alerts",
      color: "red",
      atRisk,
      total: total_chargers,
    };
  }

  if (emergency >= 1 || atRisk >= 3) {
    return {
      level: "warning",
      emoji: "😐",
      label: "At Risk",
      color: "yellow",
      atRisk,
      total: total_chargers,
    };
  }

  return {
    level: "healthy",
    emoji: "😄",
    label: "Fleet Healthy",
    color: "green",
    atRisk,
    total: total_chargers,
  };
}
