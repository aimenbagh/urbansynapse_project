import { useQuery } from "@tanstack/react-query";
import { MapPin, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchTerritories } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

export default function TerritorySelect() {
  const navigate = useNavigate();
  const { activeTerritoryId, setActiveTerritory } = useAppStore();
  const { data: territories } = useQuery({
    queryKey: ["territories"],
    queryFn: fetchTerritories,
  });

  const onChange = (id: number) => {
    setActiveTerritory(id);
    // Cliquer/choisir une wilaya ouvre son profil
    navigate(`/wilaya/${id}`);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
        <MapPin size={14} className="text-primary" />
        <select
          value={activeTerritoryId}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-transparent text-sm outline-none"
        >
          {territories?.map((t) => (
            <option key={t.id} value={t.id} className="bg-navy">
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => navigate(`/wilaya/${activeTerritoryId}`)}
        title="Voir le profil de la wilaya"
        className="rounded-lg bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-primary"
      >
        <BarChart3 size={14} />
      </button>
    </div>
  );
}
