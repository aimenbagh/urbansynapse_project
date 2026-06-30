import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

// Données de démonstration (12 mois)
const data = MONTHS.map((m, i) => ({
  month: m,
  energie: 60 + Math.round(Math.sin(i / 2) * 8 + i * 1.4),
  resilience: 55 + Math.round(Math.cos(i / 2) * 6 + i * 1.1),
  air: 70 + Math.round(Math.sin(i / 3) * 5 + i * 0.8),
  mobilite: 50 + Math.round(Math.cos(i / 3) * 7 + i * 1.0),
}));

const series = [
  { key: "energie", label: "Performance énergétique", color: "#22c55e" },
  { key: "resilience", label: "Résilience territoriale", color: "#3b82f6" },
  { key: "air", label: "Qualité de l'air", color: "#06b6d4" },
  { key: "mobilite", label: "Mobilité durable", color: "#a855f7" },
];

export default function IndicatorTrend() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
        <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
                stroke={s.color} strokeWidth={2} dot={{ r: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
