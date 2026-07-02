import { useNavigate } from "react-router-dom";
import {
  Database, BrainCircuit, GitBranch, ClipboardCheck, Check, ArrowRight,
  ArrowLeft, RotateCcw, Play, Droplets, Flame, Building2, Zap, Loader2, Sparkles, FileDown,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { useWizardStore } from "@/store/useWizardStore";
import { useAppStore } from "@/store/useAppStore";
import { downloadReportPDF, fetchRecommendations } from "@/api/planning";
import { fetchProfile } from "@/api/profile";
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
      // Analyse : profil + recommandations
      const [p, recs] = await Promise.all([
        fetchProfile(activeTerritoryId),
        fetchRecommendations(activeTerritoryId).catch(() => ({ recommendations: [] } as any)),
      ]);
      const nb = recs?.recommendations?.length ?? 0;
      return `Analyse de ${name} : ${p.analysis} — ${nb} recommandation(s) générée(s).`;
    }
    if (n === 3) {
      // Scénarios prospectifs
      const sc = await fetchScenarios(activeTerritoryId, 10);
      const items = (sc as any)?.scenarios ?? [];
      if (items.length) {
        const lines = items.map((x: any) =>
          `• ${x.name ?? x.label ?? "Scénario"} : ${x.description ?? x.summary ?? ""}`).join("\n");
        return `${items.length} scénario(s) d'aménagement générés pour ${name} :\n${lines}`;
      }
      return `Scénarios prospectifs générés pour ${name}.`;
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
