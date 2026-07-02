import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, Ban, Clock, Trash2, CheckCircle, X, Shield, User as UserIcon,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import {
  fetchUsers, createUser, suspendUser, unsuspendUser, blockUser, unblockUser,
  deleteUser, changeUserRole, type ManagedUser,
} from "@/api/users";

const STATUS_STYLE: any = {
  actif: "bg-emerald-500/15 text-emerald-400",
  suspendu: "bg-amber-500/15 text-amber-400",
  bloqué: "bg-rose-500/15 text-rose-400",
};

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "user" });
  const [err, setErr] = useState("");
  // Modale de suspension avec durée au choix
  const [suspendTarget, setSuspendTarget] = useState<ManagedUser | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);

  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });

  const create = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => { refresh(); setShowCreate(false); setForm({ email: "", full_name: "", password: "", role: "user" }); setErr(""); },
    onError: (e: any) => setErr(e?.response?.data?.detail ?? "Échec"),
  });
  const act = (fn: () => Promise<any>) => { fn().then(refresh).catch((e) => alert(e?.response?.data?.detail ?? "Erreur")); };

  const confirmSuspend = () => {
    if (!suspendTarget) return;
    suspendUser(suspendTarget.id, suspendDays).then(() => { refresh(); setSuspendTarget(null); setSuspendDays(7); });
  };

  return (
    <div>
      <PageHeader title="Gestion des utilisateurs" subtitle="Ajouter, suspendre, bloquer, changer le rôle ou supprimer des comptes"
        action={
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            <UserPlus size={16} /> Nouvel utilisateur
          </button>
        } />

      <Panel>
        {isLoading ? <p className="text-slate-400">Chargement…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="pb-2">Utilisateur</th><th className="pb-2">Rôle</th>
                  <th className="pb-2">Statut</th><th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((u) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {u.role === "admin" ? <Shield size={16} className="text-accent" /> : <UserIcon size={16} className="text-slate-400" />}
                        <div><p className="font-medium">{u.full_name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                      </div>
                    </td>
                    {/* Rôle modifiable via menu déroulant */}
                    <td className="py-3">
                      <select value={u.role}
                        onChange={(e) => act(() => changeUserRole(u.id, e.target.value))}
                        className={`rounded-lg bg-white/5 px-2 py-1 text-xs outline-none ${u.role === "admin" ? "text-accent" : "text-slate-300"}`}>
                        <option value="user" className="bg-navy">user</option>
                        <option value="admin" className="bg-navy">admin</option>
                      </select>
                    </td>
                    <td className="py-3"><span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLE[u.status]}`}>{u.status}</span></td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        {u.status === "suspendu"
                          ? <button title="Lever la suspension" onClick={() => act(() => unsuspendUser(u.id))} className="rounded p-1.5 text-emerald-400 hover:bg-white/5"><CheckCircle size={16} /></button>
                          : <button title="Suspendre (durée au choix)" onClick={() => { setSuspendTarget(u); setSuspendDays(7); }} className="rounded p-1.5 text-amber-400 hover:bg-white/5"><Clock size={16} /></button>}
                        {u.is_active
                          ? <button title="Bloquer" onClick={() => act(() => blockUser(u.id))} className="rounded p-1.5 text-rose-400 hover:bg-white/5"><Ban size={16} /></button>
                          : <button title="Débloquer" onClick={() => act(() => unblockUser(u.id))} className="rounded p-1.5 text-emerald-400 hover:bg-white/5"><CheckCircle size={16} /></button>}
                        <button title="Supprimer" onClick={() => { if (confirm(`Supprimer ${u.email} ?`)) act(() => deleteUser(u.id)); }} className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-400"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Modale de suspension avec durée au choix */}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSuspendTarget(null)}>
          <div className="w-full max-w-sm rounded-xl bg-navy-light p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Suspendre {suspendTarget.full_name}</h3>
              <button onClick={() => setSuspendTarget(null)}><X size={18} /></button>
            </div>
            <label className="mb-1 block text-sm text-slate-300">Durée de la suspension</label>
            {/* Choix rapides */}
            <div className="mb-3 flex flex-wrap gap-2">
              {[1, 3, 7, 14, 30, 90].map((d) => (
                <button key={d} onClick={() => setSuspendDays(d)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${suspendDays === d ? "bg-amber-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                  {d} j
                </button>
              ))}
            </div>
            {/* Durée personnalisée */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-slate-400">ou</span>
              <input type="number" min={1} value={suspendDays}
                onChange={(e) => setSuspendDays(Math.max(1, Number(e.target.value)))}
                className="w-24 rounded-lg bg-white/5 px-3 py-1.5 text-sm outline-none" />
              <span className="text-sm text-slate-400">jour(s)</span>
            </div>
            <button onClick={confirmSuspend}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500">
              <Clock size={15} /> Suspendre pour {suspendDays} jour(s)
            </button>
          </div>
        </div>
      )}

      {/* Modale de création */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-xl bg-navy-light p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Nouvel utilisateur</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            {[["Nom complet", "full_name", "text"], ["Email", "email", "email"], ["Mot de passe", "password", "password"]].map(([label, key, type]) => (
              <div key={key} className="mb-3">
                <label className="mb-1 block text-sm text-slate-300">{label}</label>
                <input type={type} value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none" />
              </div>
            ))}
            <div className="mb-4">
              <label className="mb-1 block text-sm text-slate-300">Rôle</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none">
                <option value="user" className="bg-navy">Utilisateur (consultation)</option>
                <option value="admin" className="bg-navy">Administrateur</option>
              </select>
            </div>
            {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}
            <button disabled={!form.email || !form.password || create.isPending}
              onClick={() => create.mutate()}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {create.isPending ? "Création…" : "Créer l'utilisateur"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
