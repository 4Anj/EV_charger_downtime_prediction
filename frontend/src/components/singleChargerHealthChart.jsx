"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

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

/* ==================================================
   Single Charger Live Health Chart
================================================== */

export default function SingleChargerHealthChart({ chargerId, live }) {
  const [data, setData] = React.useState([]);

  /* -----------------------------
     Append live data every update
  ----------------------------- */

  React.useEffect(() => {
    if (!live?.health?.health_score) return;

    setData((prev) => {
      const next = [
        ...prev,
        {
          t: prev.length, // rolling index (every 5s)
          health: Number(live.health.health_score.toFixed(2)),
        },
      ];

      // keep last 60 points (~5 minutes if interval = 5s)
      return next.slice(-60);
    });
  }, [live]);

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle>Live Health Trend</CardTitle>
        <CardDescription>
          Real-time charger health (updates every 5s)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={{
            health: {
              label: "Health Score",
              color: "var(--chart-1)",
            },
          }}
          className="h-[260px] w-full"
        >
          <LineChart data={data}>
            <CartesianGrid vertical={false} />

            {/* X AXIS: rolling index */}
            <XAxis
              dataKey="t"
              tick={false} // hide numbers
              axisLine={false}
            />

            {/* Y AXIS: health score */}
            <YAxis
              domain={["dataMin - 2", 100]}
              tickLine={false}
              axisLine={false}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={() => "Live Sample"} />
              }
            />

            <Line
              type="monotone"
              dataKey="health"
              stroke="var(--color-health)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
