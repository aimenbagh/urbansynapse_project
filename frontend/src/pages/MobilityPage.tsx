import { Navigation, Bus, Bike, Footprints } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import KpiCard from "@/components/ui/KpiCard";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

const modalShare = [
  { mode: "Voiture", part: 52 },
  { mode: "Bus / Tram", part: 23 },
  { mode: "Marche", part: 15 },
  { mode: "Vélo", part: 7 },
  { mode: "Autre", part: 3 },
];

export default function MobilityPage() {
  return (
    <div>
      <PageHeader
        title="Mobilité & Accessibilité"
        subtitle="Flux de déplacement, parts modales et accessibilité aux services"
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Trafic moyen" value="68%" delta="5.6%" positive={false} icon={Navigation} />
        <KpiCard label="Couverture transports" value="74%" delta="3.1%" icon={Bus} />
        <KpiCard label="Pistes cyclables" value="120 km" delta="8.0%" icon={Bike} />
        <KpiCard label="Accessibilité piétonne" value="81%" delta="2.4%" icon={Footprints} />
      </div>
      <Panel title="Répartition modale des déplacements">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={modalShare}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="mode" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
            <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
            <Bar dataKey="part" fill="#2da3e0" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
