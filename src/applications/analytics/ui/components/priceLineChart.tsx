"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { IngredientPriceHistory } from "@/applications/analytics/domain/entities/analytics";

const LINE_COLORS = ["#6366f1", "#22c55e", "#f97316", "#a855f7", "#14b8a6"];

interface Props {
  ingredients: IngredientPriceHistory[];
}

export function PriceLineChart({ ingredients }: Props) {
  const [selected, setSelected] = useState(0);

  if (!ingredients.length) return null;

  const current = ingredients[selected];

  const chartData = current.points.map((p) => ({
    date: new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    prix: p.price,
    store: p.storeName,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ingredients.map((ing, i) => (
          <button
            key={ing.ingredientName}
            onClick={() => setSelected(i)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
              selected === i
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {ing.ingredientName}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
          <Tooltip
            formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(2)} €`, "Prix"]}
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="prix"
            stroke={LINE_COLORS[selected % LINE_COLORS.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: LINE_COLORS[selected % LINE_COLORS.length], strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
