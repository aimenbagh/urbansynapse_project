import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { fetchAlgeriaReference } from "@/api/reference";

const LABELS: Record<string, { label: string; color: string }> = {
  residentiel: { label: "Résidentiel", color: "#22c55e" },
  transport: { label: "Transport", color: "#a855f7" },
  industrie: { label: "Industrie", color: "#eab308" },
  tertiaire: { label: "Tertiaire", color: "#3b82f6" },
};

const FALLBACK = [
  { name: "Résidentiel", value: 45, color: "#22c55e" },
  { name: "Transport", value: 30, color: "#a855f7" },
  { name: "Industrie", value: 15, color: "#eab308" },
  { name: "Tertiaire", value: 10, color: "#3b82f6" },
];

export default function SectorDonut() {
  const { data: ref } = useQuery({
    queryKey: ["algeria-ref"],
    queryFn: fetchAlgeriaReference,
  });

  const data = ref
    ? Object.entries(ref.sector_consumption_pct).map(([k, v]) => ({
        name: LABELS[k]?.label ?? k, value: v, color: LABELS[k]?.color ?? "#94a3b8",
      }))
    : FALLBACK;

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        Source : Bilan Énergétique National algérien
      </p>
    </div>
  );
}
