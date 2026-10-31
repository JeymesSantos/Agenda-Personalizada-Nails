"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"

import { formatCents } from "@/lib/money"

type Point = { label: string; revenueCents: number; expensesCents: number }

/*
 * "Faturamento × despesas por semana" (A1): barras magenta (gradiente) e cinza,
 * valor do faturamento acima da barra, sem eixo Y.
 */
export function RevenueChart({ data }: { data: Point[] }) {
  const rows = data.map((p) => ({
    label: p.label,
    faturamento: p.revenueCents / 100,
    despesas: p.expensesCents / 100,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          barGap={6}
          barCategoryGap="28%"
          margin={{ top: 24, right: 8, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-magenta-400)" />
              <stop offset="100%" stopColor="var(--brand-magenta-700)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 6" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-sans)" }}
            dy={8}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--text-primary)",
            }}
            formatter={(value, name) => [
              formatCents(Number(value) * 100),
              name === "faturamento" ? "Faturamento" : "Despesas",
            ]}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          <Bar
            dataKey="faturamento"
            isAnimationActive={false}
            fill="url(#revenue-gradient)"
            radius={[6, 6, 2, 2]}
            maxBarSize={44}
          >
            <LabelList
              dataKey="faturamento"
              content={(props) => {
                const { x, y, width, value } = props as {
                  x?: number
                  y?: number
                  width?: number
                  value?: number
                }
                if (x == null || y == null || width == null || !value) return null
                return (
                  <text
                    x={x + width / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize={11}
                    fontFamily="var(--font-sans)"
                  >
                    {formatCents(value * 100)}
                  </text>
                )
              }}
            />
          </Bar>
          <Bar
            dataKey="despesas"
            isAnimationActive={false}
            fill="var(--bg-elevated)"
            radius={[6, 6, 2, 2]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
