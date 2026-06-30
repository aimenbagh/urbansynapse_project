import { Shield, Thermometer, Droplets, TreePine } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import KpiCard from "@/components/ui/KpiCard";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";

const dimensions = [
  { axis: "Climatique", score: 72 },
  { axis: "Énergétique", score: 78 },
  { axis: "Eau", score: 65 },
  { axis: "Sociale", score: 70 },
  { axis: "Économique", score: 68 },
  { axis: "Écologique", score: 60 },
];

export default function ResiliencePage() {
  return (
    <div>
      <PageHeader
        title="Résilience urbaine"
        subtitle="Capacité d'adaptation du territoire face aux aléas climatiques"
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Résilience globale" value="72%" delta="8%" icon={Shield} />
        <KpiCard label="Îlots de chaleur" value="14 zones" delta="2 zones" positive={false} icon={Thermometer} />
        <KpiCard label="Gestion de l'eau" value="92%" delta="1.2%" positive={false} icon={Droplets} />
        <KpiCard label="Trame verte" value="35%" delta="3.2%" icon={TreePine} />
      </div>
      <Panel title="Profil de résilience multidimensionnel">
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={dimensions}>
            <PolarGrid stroke="#ffffff20" />
            <PolarAngleAxis dataKey="axis" stroke="#94a3b8" fontSize={12} />
            <Radar dataKey="score" stroke="#7c4dff" fill="#7c4dff" fillOpacity={0.4} />
            <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
          </RadarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
