import { Navigate, Link } from "react-router-dom";
import { CloudRain, Zap, Navigation, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const PILLARS = [
  {
    icon: CloudRain,
    color: "#2da3e0",
    title: "Risques naturels",
    text: "Zonage sismique, inondations, feux de forêt et vagues de chaleur, cartographiés wilaya par wilaya.",
  },
  {
    icon: Zap,
    color: "#c9a227",
    title: "Performance énergétique",
    text: "Bilans du bâti et scénarios de rénovation évalués à l'échelle du territoire.",
  },
  {
    icon: Navigation,
    color: "#7c4dff",
    title: "Mobilité & accessibilité",
    text: "Répartition modale, couverture des transports et accessibilité piétonne.",
  },
  {
    icon: ShieldCheck,
    color: "#2da3e0",
    title: "Résilience urbaine",
    text: "Simulation de trajectoires d'aménagement et comparaison de leurs impacts.",
  },
];

export default function LandingPage() {
  const isAuth = useAuthStore((s) => !!s.token);
  if (isAuth) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <style>{`
        .us-display { font-family: 'Space Grotesk', sans-serif; }
        .us-hub { transform-origin: center; transform-box: fill-box; }
        @media (prefers-reduced-motion: no-preference) {
          .us-hub { animation: us-pulse 3.2s ease-in-out infinite; }
          .us-hub-2 { animation-delay: .8s; }
          .us-hub-3 { animation-delay: 1.6s; }
        }
        @keyframes us-pulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.35); }
        }
      `}</style>

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-8 w-8" />
          <span className="us-display text-[15px] font-semibold tracking-tight">UrbanSynapse AI</span>
        </div>
        <Link
          to="/login"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-primary/40 hover:text-primary"
        >
          Connexion
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pt-16">
        <div>
          <h1 className="us-display text-[2.6rem] leading-[1.08] font-semibold tracking-tight md:text-[3.25rem]">
            Comprendre chaque wilaya avant d'y construire.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-400">
            UrbanSynapse AI croise données spatiales, énergétiques et climatiques pour
            cartographier les risques, simuler des scénarios d'aménagement et éclairer
            la décision publique à travers les 58 wilayas d'Algérie.
          </p>
          <div className="mt-9 flex items-center gap-5">
            <Link
              to="/login"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Accéder à la plateforme
            </Link>
            <a href="#domaines" className="text-sm text-slate-400 transition hover:text-slate-200">
              Voir les domaines couverts
            </a>
          </div>

          <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/5 pt-7">
            <div>
              <dt className="text-[11px] text-slate-500">Couverture</dt>
              <dd className="us-display text-xl font-semibold text-accent">58 wilayas</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Domaines croisés</dt>
              <dd className="us-display text-xl font-semibold">4</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Analyse</dt>
              <dd className="us-display text-xl font-semibold text-accent-2">Prédictive</dd>
            </div>
          </dl>
        </div>

        {/* Réseau / synapse illustration */}
        <svg viewBox="0 0 560 460" className="w-full max-w-md justify-self-center md:justify-self-end" aria-hidden="true">
          <g stroke="#2da3e0" strokeWidth="1" opacity="0.28">
            <line x1="70" y1="110" x2="280" y2="210" />
            <line x1="150" y1="55" x2="280" y2="210" />
            <line x1="250" y1="85" x2="280" y2="210" />
            <line x1="330" y1="45" x2="280" y2="210" />
            <line x1="410" y1="100" x2="280" y2="210" />
            <line x1="480" y1="65" x2="410" y2="100" />
            <line x1="50" y1="225" x2="280" y2="210" />
            <line x1="170" y1="190" x2="280" y2="210" />
            <line x1="400" y1="220" x2="280" y2="210" />
            <line x1="500" y1="200" x2="400" y2="220" />
            <line x1="280" y1="210" x2="345" y2="345" />
            <line x1="280" y1="210" x2="190" y2="420" />
            <line x1="110" y1="345" x2="190" y2="420" />
            <line x1="230" y1="365" x2="190" y2="420" />
            <line x1="345" y1="345" x2="440" y2="325" />
            <line x1="345" y1="345" x2="325" y2="430" />
            <line x1="190" y1="420" x2="325" y2="430" />
          </g>
          <g fill="#2da3e0">
            {[
              [70, 110], [150, 55], [250, 85], [330, 45], [410, 100], [480, 65],
              [50, 225], [170, 190], [500, 200], [110, 345], [230, 365], [440, 325],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" opacity="0.5" />
            ))}
          </g>
          <circle className="us-hub" cx="280" cy="210" r="7" fill="#2da3e0" />
          <circle className="us-hub us-hub-2" cx="345" cy="345" r="6" fill="#c9a227" />
          <circle className="us-hub us-hub-3" cx="190" cy="420" r="6" fill="#7c4dff" />
        </svg>
      </section>

      {/* Domaines */}
      <section id="domaines" className="mx-auto max-w-6xl border-t border-white/5 px-6 py-16">
        <h2 className="us-display max-w-lg text-xl font-semibold tracking-tight md:text-2xl">
          Quatre domaines, une seule vue du territoire.
        </h2>
        <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="flex gap-4">
              <p.icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: p.color }} />
              <div>
                <h3 className="text-[15px] font-medium">{p.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-400">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl border border-white/5 bg-navy-light/60 px-8 py-10 md:flex md:items-center md:justify-between">
          <div>
            <h3 className="us-display text-lg font-semibold">Prêt à explorer votre wilaya ?</h3>
            <p className="mt-1.5 text-sm text-slate-400">
              Connectez-vous pour accéder au tableau de bord et lancer une première analyse.
            </p>
          </div>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 md:mt-0"
          >
            Se connecter
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-[13px] text-slate-500">
        UrbanSynapse AI — Intelligence territoriale prédictive
      </footer>
    </div>
  );
}
