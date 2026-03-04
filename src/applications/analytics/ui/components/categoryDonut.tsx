"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryStat } from "@/applications/analytics/domain/entities/analytics";

const COLORS = [
  "#22c55e", "#f97316", "#3b82f6", "#a855f7",
  "#eab308", "#14b8a6", "#ef4444", "#ec4899", "#6b7280",
];

interface Props {
  data: CategoryStat[];
}

export function CategoryDonut({ data }: Props) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="count"
            nameKey="category"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0} articles`, name ?? ""]}
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{total}</span>
        <span className="text-[11px] text-gray-400">articles</span>
      </div>
    </div>
  );
}
