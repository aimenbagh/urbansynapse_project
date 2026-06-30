import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogIn, UserPlus, Loader2, Mail, Lock, User } from "lucide-react";
import { login, register } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("admin@urbansynapse.ai");
  const [password, setPassword] = useState("admin123");
  const [fullName, setFullName] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      mode === "login"
        ? login(email, password)
        : register(email, fullName, password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user);
      navigate("/dashboard");
    },
  });

  const inputCls = "w-full rounded-lg bg-white/5 py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="UrbanSynapse AI" className="mx-auto h-16 w-16" />
          <h1 className="mt-3 text-2xl font-bold text-primary">UrbanSynapse AI</h1>
          <p className="text-sm text-slate-400">Intelligence territoriale prédictive</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-navy-light/60 p-8">
          {/* Onglets */}
          <div className="mb-6 flex gap-2">
            <button onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-primary text-white" : "bg-white/5 text-slate-400"}`}>
              Connexion
            </button>
            <button onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "register" ? "bg-primary text-white" : "bg-white/5 text-slate-400"}`}>
              Inscription
            </button>
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={16} />
                <input className={inputCls} placeholder="Nom complet"
                  value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
              <input className={inputCls} type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
              <input className={inputCls} type="password" placeholder="Mot de passe"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && mutation.mutate()} />
            </div>
          </div>

          {mutation.isError && (
            <p className="mt-4 text-sm text-rose-400">
              {(mutation.error as any)?.response?.data?.detail ??
               "Erreur — le backend est-il lancé (port 8000) ?"}
            </p>
          )}

          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" />
              : mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mutation.isPending ? "Connexion…" : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>

          {mode === "login" && (
            <p className="mt-4 text-center text-xs text-slate-500">
              Compte de démonstration : admin@urbansynapse.ai / admin123
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
