"use client";

import * as React from "react";
import { LineChart, Line, XAxis, CartesianGrid, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function toFiveMinuteBucket(isoTimestamp) {
  const d = new Date(isoTimestamp);
  d.setSeconds(0, 0);

  const minutes = d.getMinutes();
  const rounded = Math.floor(minutes / 5) * 5;
  d.setMinutes(rounded);

  return d;
}

function groupByFiveMinutes(chargers) {
  const map = {};

  chargers.forEach((charger) => {
    charger.history.forEach((entry) => {
      const bucket = toFiveMinuteBucket(entry.timestamp).getTime();

      if (!map[bucket]) {
        map[bucket] = { total: 0, count: 0 };
      }

      map[bucket].total += entry.charger_health_score;
      map[bucket].count += 1;
    });
  });

  return Object.entries(map)
    .map(([time, v]) => ({
      time: new Date(Number(time)), // ✅ REAL DATE
      avgHealth: +(v.total / v.count).toFixed(2),
    }))
    .sort((a, b) => a.time - b.time);
}

export default function FleetHealthLineChart() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchFleet() {
      try {
        const res = await fetch("http://localhost:8000/chargers/live");
        const live = await res.json();

        const histories = await Promise.all(
          live.map((c) =>
            fetch(`http://localhost:8000/chargers/${c.charger_id}`).then((r) =>
              r.json(),
            ),
          ),
        );

        setData(groupByFiveMinutes(histories));
      } catch (err) {
        console.error("Fleet health fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFleet();
    const interval = setInterval(fetchFleet, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center bg-black">
        Loading fleet health…
      </Card>
    );
  }

  return (
    <Card className="py-4 h-full w-full sm:py-0 bg-black overflow-y-auto">
      <CardHeader className="border-b px-6 py-6">
        <CardTitle>Fleet Health Trend</CardTitle>
        <CardDescription>
          Average battery health (5-minute intervals)
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={{
            avgHealth: {
              label: "Avg Health",
              color: "var(--chart-1)",
            },
          }}
          className="h-[250px] w-full"
        >
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />

            <YAxis
              domain={["dataMin - 2", 100]}
              tickLine={false}
              axisLine={false}
            />

            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                value instanceof Date
                  ? value.toLocaleString("en-US", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""
              }
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    value instanceof Date
                      ? value.toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""
                  }
                />
              }
            />

            <Line
              dataKey="avgHealth"
              type="monotone"
              stroke="var(--color-avgHealth)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
