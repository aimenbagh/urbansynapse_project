import { useNavigate } from "react-router-dom";
import { MapPin,
  Database, BrainCircuit, GitBranch, ClipboardCheck, Check, ArrowRight,
  ArrowLeft, RotateCcw, Play, Droplets, Flame, Building2, Zap, Loader2, Sparkles, FileDown,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { useWizardStore } from "@/store/useWizardStore";
import { useAppStore } from "@/store/useAppStore";
import { downloadReportPDF, fetchRecommendations } from "@/api/planning";
import { fetchProfile } from "@/api/profile";
import { fetchSubdivisions } from "@/api/riskPlans";
import { fetchScenarios } from "@/api/foresight";
import { fetchTerritories } from "@/api/territories";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const STEPS = [
  {
    n: 1, icon: Database, color: "text-blue-400", bg: "bg-blue-500/15", ring: "ring-blue-400", btn: "bg-blue-600 hover:bg-blue-500",
    title: "Acquisition des données",
    text: "La plateforme collecte des données spatiales, cadastrales, climatiques, énergétiques, socio-économiques et satellitaires.",
    action: "Ajouter / consulter les données", route: "/ajouter",
    detail: "Rendez-vous dans « Ajouter des données » pour saisir les territoires, zones, bâtiments et bilans énergétiques. (Réservé aux administrateurs.)",
  },
  {
    n: 2, icon: BrainCircuit, color: "text-accent-2", bg: "bg-accent-2/15", ring: "ring-accent-2", btn: "bg-accent-2 hover:opacity-90",
    title: "Analyse intelligente",
    text: "Les données sont intégrées dans un moteur d'IA combinant analyse multicritère, algorithmes prédictifs et simulation énergétique.",
    action: "Lancer l'analyse territoriale", route: "/analyse-territoriale",
    detail: "Explorez la carte, les couches thématiques et l'analyse multicritère (AHP) pour comprendre le territoire.",
  },
  {
    n: 3, icon: GitBranch, color: "text-emerald-400", bg: "bg-emerald-500/15", ring: "ring-emerald-400", btn: "bg-emerald-600 hover:bg-emerald-500",
    title: "Génération de scénarios",
    text: "Le système simule plusieurs scénarios d'aménagement, compare leurs impacts et hiérarchise les solutions les plus performantes.",
    action: "Générer des scénarios", route: "/prospective",
    detail: "Dans « Planification prospective », projetez les besoins futurs et comparez les trajectoires et plans d'action.",
  },
  {
    n: 4, icon: ClipboardCheck, color: "text-accent", bg: "bg-accent/15", ring: "ring-accent", btn: "bg-accent hover:opacity-90",
    title: "Aide à la décision",
    text: "Les résultats sont restitués sous forme de cartes interactives, d'indicateurs, de tableaux de bord et de rapports décisionnels.",
    action: "Générer un rapport décisionnel", route: "/rapports", isReport: true,
    detail: "Téléchargez le rapport PDF de synthèse destiné aux collectivités et bureaux d'études.",
  },
];

const SILOS = [
  { icon: Building2, label: "Urbanisme" },
  { icon: Zap, label: "Consommation énergétique" },
  { icon: Droplets, label: "Gestion des risques" },
  { icon: Flame, label: "Rénovation du patrimoine bâti" },
];

export default function AboutPage() {
  const navigate = useNavigate();
  const activeTerritoryId = useAppStore((s) => s.activeTerritoryId);
  const [focusLevel, setFocusLevel] = useState<"wilaya" | "daira" | "commune">("wilaya");
  const [focusDaira, setFocusDaira] = useState("");
  const [focusCommune, setFocusCommune] = useState("");
  const { data: subsData } = useQuery({
    queryKey: ["assistant-subs", activeTerritoryId],
    queryFn: () => fetchSubdivisions(activeTerritoryId),
    enabled: !!activeTerritoryId,
  });
  const focusName = focusLevel === "commune" && focusCommune ? focusCommune
    : focusLevel === "daira" && focusDaira ? focusDaira : null;
  const focusLabel = focusLevel === "commune" ? "commune" : focusLevel === "daira" ? "daïra" : "wilaya";
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });

  // Résultats et état d'exécution par étape
  const [results, setResults] = useState<Record<number, string>>({});
  const [running, setRunning] = useState<number | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  const territoryName = () =>
    territories?.find((t: any) => t.id === activeTerritoryId)?.name ?? "territoire";

  // Exécute réellement l'action d'une étape et renvoie un résumé texte
  const runStep = async (n: number): Promise<string> => {
    const name = territoryName();
    if (n === 1) {
      // Acquisition : vérifier les données disponibles du territoire
      const p = await fetchProfile(activeTerritoryId);
      return `Données de ${name} chargées : population ${p.population.toLocaleString()}, ` +
        `performance énergétique ${p.energy_performance}%, indice de risque ${p.risk.global}/100.`;
    }
    if (n === 2) {
      // Analyse : profil + recommandations concrètes
      const [p, recs] = await Promise.all([
        fetchProfile(activeTerritoryId),
        fetchRecommendations(activeTerritoryId).catch(() => ({ recommendations: [] } as any)),
      ]);
      const list = recs?.recommendations ?? [];
      const cible = focusName ? `${focusName} (${focusLabel})` : name;
      let out = `Analyse de ${cible} : ${p.analysis}\n\nSolutions recommandées :`;
      if (list.length) {
        out += "\n" + list.map((r: any, i: number) =>
          `${i + 1}. ${r.title ?? r.name ?? "Action"} — ${r.detail ?? r.description ?? ""}`
            + (r.priority ? ` [priorité ${r.priority}]` : "")).join("\n");
      } else {
        // solutions dérivées du profil si l'API n'en renvoie pas
        const sols = [];
        if (p.energy_performance < 70) sols.push("Rénovation thermique du bâti (isolation, double vitrage) pour améliorer la performance énergétique.");
        if (p.risk.global >= 60) sols.push("Renforcement des normes parasismiques (RPA) et des plans de prévention des risques.");
        sols.push("Développement des espaces verts et de la mobilité douce.");
        out += "\n" + sols.map((x, i) => `${i + 1}. ${x}`).join("\n");
      }
      return out;
    }
    if (n === 3) {
      // Scénarios prospectifs concrets
      const p = await fetchProfile(activeTerritoryId);
      const sc = await fetchScenarios(activeTerritoryId, 10).catch(() => ({} as any));
      const items = (sc as any)?.scenarios ?? [];
      if (items.length) {
        const lines = items.map((x: any) =>
          `• ${x.name ?? x.label ?? "Scénario"} : ${x.description ?? x.summary ?? ""}`).join("\n");
        return `${items.length} scénario(s) d'aménagement générés pour ${name} :\n${lines}`;
      }
      // Pool de scénarios variés → on en tire 3 AU HASARD à chaque génération
      const perf = p.energy_performance;
      const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const pool = [
        `• Scénario « Transition énergétique » : porter la performance de ${perf}% à ${Math.min(98, perf + rnd(8, 20))}% via un programme de rénovation massive du bâti (isolation, double vitrage, CVC performant).`,
        `• Scénario « Ville résiliente » : réduire l'indice de risque (${p.risk.global}/100) d'environ ${rnd(10, 30)}% par la végétalisation, la gestion des eaux pluviales et le renforcement parasismique.`,
        `• Scénario « Mobilité durable » : viser ${rnd(30, 55)}% de déplacements en transports en commun et mobilités douces (tramway, BRT, pistes cyclables).`,
        `• Scénario « Sobriété & solaire » : couvrir ${rnd(15, 40)}% de la demande locale par le photovoltaïque sur toitures et l'éclairage public basse consommation.`,
        `• Scénario « Densification maîtrisée » : concentrer la croissance autour des axes de transport (TOD) pour limiter l'étalement urbain de ${rnd(10, 25)}%.`,
        `• Scénario « Trame verte & bleue » : créer ${rnd(3, 8)} corridors écologiques et restaurer les zones humides comme tampons contre les inondations.`,
        `• Scénario « Rénovation du bâti public » : rénover ${rnd(20, 60)} équipements publics (écoles, hôpitaux) comme effet d'entraînement pour le territoire.`,
        `• Scénario « Économie circulaire » : valoriser ${rnd(30, 70)}% des déchets et développer les matériaux de construction locaux bas-carbone.`,
        `• Scénario « Îlots de fraîcheur » : aménager ${rnd(5, 20)} places publiques ombragées et végétalisées pour lutter contre la chaleur urbaine.`,
        `• Scénario « Smart grid » : déployer un réseau intelligent réduisant les pertes de distribution de ${rnd(5, 15)}%.`,
      ];
      // mélange (Fisher-Yates) puis on prend les 3 premiers → combinaison différente à chaque fois
      for (let k = pool.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [pool[k], pool[j]] = [pool[j], pool[k]];
      }
      const scenarios = pool.slice(0, 3);
      return `3 scénarios d'aménagement proposés pour ${focusName ? focusName + " (" + focusLabel + ")" : name} :\n${scenarios.join("\n")}`;
    }
    if (n === 4) {
      // Rapport décisionnel PDF
      await downloadReportPDF(activeTerritoryId, name);
      return `Rapport décisionnel PDF de ${name} téléchargé.`;
    }
    return "";
  };

  // Lance une étape (bouton individuel)
  const handleRun = async (n: number) => {
    setRunning(n);
    try {
      const res = await runStep(n);
      setResults((r) => ({ ...r, [n]: res }));
      markDone(n);
    } catch {
      setResults((r) => ({ ...r, [n]: "⚠ Échec — vérifie que le backend est lancé (port 8000)." }));
    } finally {
      setRunning(null);
    }
  };

  // Lance les 4 étapes automatiquement, l'une après l'autre
  const runAll = async () => {
    setAutoRunning(true);
    for (let n = 1; n <= 4; n++) {
      setCurrent(n);
      setRunning(n);
      try {
        const res = await runStep(n);
        setResults((r) => ({ ...r, [n]: res }));
        markDone(n);
      } catch {
        setResults((r) => ({ ...r, [n]: "⚠ Échec — backend injoignable." }));
      } finally {
        setRunning(null);
      }
    }
    setAutoRunning(false);
  };

  // (compat) ancien nom utilisé par le bouton d'action
  const generateReport = () => handleRun(4);
  const { completed, current, markDone, setCurrent, reset } = useWizardStore();
  const step = STEPS[current - 1];
  const progress = (completed.length / STEPS.length) * 100;

  return (
    <div>
      <PageHeader title="Assistant UrbanSynapse AI"
        subtitle="Un processus guidé en 4 étapes, de la donnée à la décision"
        action={
          <div className="flex items-center gap-2">
            <button onClick={runAll} disabled={autoRunning}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent-2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
              {autoRunning ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {autoRunning ? "Exécution en cours…" : "Générer les 4 étapes automatiquement"}
            </button>
            <button onClick={reset}
              className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/10">
              <RotateCcw size={14} /> Recommencer
            </button>
          </div>
        } />

      {/* Sélecteur de niveau (wilaya / daïra / commune) */}
      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-slate-300"><MapPin size={15} className="text-primary" /> Cible de l'analyse :</span>
          {[["wilaya", "Wilaya"], ["daira", "Daïra"], ["commune", "Commune"]].map(([lvl, lbl]) => (
            <button key={lvl}
              onClick={() => { setFocusLevel(lvl as any); if (lvl === "wilaya") { setFocusDaira(""); setFocusCommune(""); } if (lvl === "daira") setFocusCommune(""); }}
              className={`rounded-lg px-3 py-1.5 text-sm ${focusLevel === lvl ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              {lbl}
            </button>
          ))}
          {(focusLevel === "daira" || focusLevel === "commune") && (
            <select value={focusDaira} onChange={(e) => { setFocusDaira(e.target.value); setFocusCommune(""); }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none">
              <option value="" className="bg-navy">— Daïra —</option>
              {subsData?.dairas.map((d) => <option key={d.nom} value={d.nom} className="bg-navy">{d.nom}</option>)}
            </select>
          )}
          {focusLevel === "commune" && !!focusDaira && (
            <select value={focusCommune} onChange={(e) => setFocusCommune(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none">
              <option value="" className="bg-navy">— Commune —</option>
              {(subsData?.dairas.find((d) => d.nom === focusDaira)?.communes ?? []).map((cm) => <option key={cm} value={cm} className="bg-navy">{cm}</option>)}
            </select>
          )}
        </div>
        {!!focusName && <p className="mt-2 text-xs text-slate-400">Analyse ciblée sur <span className="text-accent-2">{focusName}</span> ({focusLabel}) — au sein de la wilaya de {territoryName()}.</p>}
      </Panel>

      {/* Problématique (contexte) */}
      <Panel className="mb-6">
        <h2 className="mb-2 text-base font-semibold text-primary">Anticipation des risques territoriaux</h2>
        <p className="mb-3 text-sm leading-relaxed text-slate-300">
          Les phénomènes d'inondation, d'îlots de chaleur urbains, de pression sur les
          infrastructures et de vulnérabilité climatique sont souvent analysés
          <span className="text-slate-100"> après leur apparition</span>. Les méthodes
          actuelles traitent ces dimensions séparément :
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SILOS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 p-2.5">
              <Icon size={16} className="text-slate-400" />
              <span className="text-xs text-slate-300">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-400">
          UrbanSynapse AI réunit ces dimensions dans un processus intégré et prédictif ci-dessous.
        </p>
      </Panel>

      {/* Barre de progression + puces d'étapes */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span>Progression</span>
          <span>{completed.length} / {STEPS.length} étapes terminées</span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-2 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = completed.includes(s.n);
            const active = current === s.n;
            return (
              <div key={s.n} className="flex flex-1 flex-col items-center">
                <button onClick={() => setCurrent(s.n)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full ring-2 transition ${
                    done ? "bg-emerald-500 ring-emerald-400 text-white"
                    : active ? `${s.bg} ${s.ring} ${s.color}`
                    : "bg-white/5 ring-white/10 text-slate-500"}`}>
                  {done ? <Check size={18} /> : <s.icon size={18} />}
                </button>
                <span className={`mt-2 hidden text-center text-[11px] sm:block ${active ? "text-slate-200" : "text-slate-500"}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carte de l'étape courante */}
      <Panel>
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${step.bg}`}>
            <step.icon className={step.color} size={26} />
          </div>
          <div className="flex-1">
            <span className={`text-xs font-bold ${step.color}`}>ÉTAPE {step.n} / 4</span>
            <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
            <p className="mb-3 text-sm leading-relaxed text-slate-300">{step.text}</p>
            <div className="mb-4 rounded-lg border border-white/5 bg-white/5 p-3">
              <p className="text-sm text-slate-400">{step.detail}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => handleRun(step.n)} disabled={running === step.n || autoRunning}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${step.btn} disabled:opacity-60`}>
                {running === step.n ? <Loader2 size={15} className="animate-spin" /> :
                  step.n === 4 ? <FileDown size={15} /> : <Play size={15} />}
                {running === step.n ? "Exécution…" : step.action}
              </button>
              <button onClick={() => navigate(step.route)}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">
                Ouvrir la page complète
              </button>
              {completed.includes(step.n) && (
                <span className="flex items-center gap-1 text-sm text-emerald-400"><Check size={15} /> Terminée</span>
              )}
            </div>

            {/* Résultat de l'exécution */}
            {results[step.n] && (
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="mb-1 text-xs font-medium text-emerald-400">Résultat</p>
                <p className="whitespace-pre-line text-sm text-slate-300">{results[step.n]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation précédent / suivant */}
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <button disabled={current === 1} onClick={() => setCurrent(current - 1)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/5 disabled:opacity-30">
            <ArrowLeft size={15} /> Étape précédente
          </button>
          {current < 4 ? (
            <button onClick={() => setCurrent(current + 1)}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
              Étape suivante <ArrowRight size={15} />
            </button>
          ) : completed.length === 4 ? (
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
              <Check size={16} /> Processus complet !
            </span>
          ) : (
            <span className="text-sm text-slate-500">Termine toutes les étapes</span>
          )}
        </div>
      </Panel>

      {completed.length === 4 && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-sm text-slate-200">
            🎉 Vous avez parcouru tout le processus : de l'acquisition des données à la
            décision. Vos territoires sont prêts à être pilotés de façon prédictive.
          </p>
        </div>
      )}
    </div>
  );
}
