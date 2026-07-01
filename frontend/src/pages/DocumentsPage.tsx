import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, FileSpreadsheet, File, Upload, Trash2, Plus, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import DocumentViewer from "@/components/documents/DocumentViewer";
import { fetchDocuments, uploadDocument, deleteDocument, type DocMeta } from "@/api/documents";
import { useAuthStore } from "@/store/useAuthStore";

const ICON = { pdf: File, word: FileText, excel: FileSpreadsheet } as any;
const COLOR = { pdf: "text-rose-400", word: "text-blue-400", excel: "text-emerald-400" } as any;

export default function DocumentsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<DocMeta | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");

  const { data: docs, isLoading } = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments });

  const upload = useMutation({
    mutationFn: () => uploadDocument(title, file!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      setShowUpload(false); setTitle(""); setFile(null); setErr("");
    },
    onError: (e: any) => setErr(e?.response?.data?.detail ?? "Échec du téléversement"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  return (
    <div>
      <PageHeader title="Documents" subtitle="Consultez les documents de la plateforme"
        action={isAdmin ? (
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            <Plus size={16} /> Ajouter un document
          </button>
        ) : undefined}
      />

      {isLoading ? (
        <p className="text-slate-400">Chargement…</p>
      ) : !docs?.length ? (
        <Panel><p className="py-8 text-center text-slate-400">Aucun document pour le moment.</p></Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => {
            const Icon = ICON[d.file_type] ?? File;
            return (
              <div key={d.id}
                className="group cursor-pointer rounded-xl border border-white/5 bg-navy-light/60 p-4 transition hover:border-primary/40"
                onClick={() => setViewing(d)}>
                <div className="flex items-start justify-between">
                  <Icon className={COLOR[d.file_type] ?? "text-slate-400"} size={28} />
                  {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer "${d.title}" ?`)) remove.mutate(d.id); }}
                      className="text-slate-500 opacity-0 transition hover:text-rose-400 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <h3 className="mt-3 font-medium">{d.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{d.filename}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {d.file_type.toUpperCase()} · {(d.size_bytes / 1024).toFixed(0)} Ko
                </p>
              </div>
            );
          })}
        </div>
      )}

      {viewing && <DocumentViewer doc={viewing} onClose={() => setViewing(null)} />}

      {/* Modale d'upload (admin) */}
      {showUpload && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowUpload(false)}>
          <div className="w-full max-w-md rounded-xl bg-navy-light p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Ajouter un document</h3>
              <button onClick={() => setShowUpload(false)}><X size={18} /></button>
            </div>
            <label className="mb-1 block text-sm text-slate-300">Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="mb-3 w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none" placeholder="Ex : Bilan énergétique 2024" />
            <label className="mb-1 block text-sm text-slate-300">Fichier (Word, Excel ou PDF)</label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mb-3 w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white" />
            {err && <p className="mb-3 text-sm text-rose-400">{err}</p>}
            <button disabled={!title || !file || upload.isPending}
              onClick={() => upload.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              <Upload size={16} /> {upload.isPending ? "Téléversement…" : "Téléverser"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
