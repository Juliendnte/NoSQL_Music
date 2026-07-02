import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const ACCENT = "#c6ff3a";
const NEUTRAL = "#6b6b6b";

export function BarListChart({ data, dataKey = "value", nameKey = "name", height = 260, colorByIndex = false }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.1)" />
        <XAxis type="number" allowDecimals={false} stroke="#8f8f8f" tick={{ fill: "#8f8f8f", fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={110}
          stroke="#8f8f8f"
          tick={{ fill: "#fafafa", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{ background: "#121212", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#fafafa" }}
          labelStyle={{ color: "#8f8f8f" }}
        />
        <Bar dataKey={dataKey} fill={ACCENT} radius={[0, 4, 4, 0]} maxBarSize={16}>
          {/* Only the top-ranked bar keeps the accent; the rest stay neutral so the highlight reads as a signal, not decoration. */}
          {colorByIndex && data.map((_, i) => <Cell key={i} fill={i === 0 ? ACCENT : NEUTRAL} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
