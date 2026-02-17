"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MetricItem = {
  date: string;
  inboundCalls: number;
};

export function CallsLineChart({ data }: { data: MetricItem[] }) {
  const normalized = data.map((item) => ({
    label: new Date(item.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    value: item.inboundCalls,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalized}>
          <XAxis dataKey="label" tick={{ fill: "#A7A296", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#A7A296", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ stroke: "rgba(229,199,107,0.2)" }}
            contentStyle={{
              background: "#121212",
              border: "1px solid rgba(229,199,107,0.3)",
              borderRadius: "10px",
              color: "#F5F3EE",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#E5C76B"
            strokeWidth={2}
            dot={{ fill: "#E5C76B", r: 2 }}
            activeDot={{ r: 4, fill: "#F8EBC1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
