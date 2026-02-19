"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

type MetricItem = {
  date: string;
  inboundCalls: number;
};

export function CallsLineChart({ data }: { data: MetricItem[] }) {
  const normalized = useMemo(
    () =>
      data.map((item) => ({
        label: new Date(item.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
        }),
        value: item.inboundCalls,
      })),
    [data],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = (width: number, height: number) => {
      const safeWidth = Math.max(Math.round(width), 240);
      const safeHeight = Math.max(Math.round(height), 192);
      setSize((current) =>
        current.width === safeWidth && current.height === safeHeight
          ? current
          : { width: safeWidth, height: safeHeight },
      );
    };

    updateSize(container.clientWidth, container.clientHeight);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateSize(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-48 w-full min-w-0">
      {size.width > 0 && size.height > 0 ? (
        <LineChart width={size.width} height={size.height} data={normalized}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#A7A296", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#A7A296", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
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
      ) : null}
    </div>
  );
}
