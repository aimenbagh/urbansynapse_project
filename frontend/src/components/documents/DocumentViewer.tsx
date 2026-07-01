import { useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { fetchDocumentBlob, type DocMeta } from "@/api/documents";

export default function DocumentViewer({ doc, onClose }: { doc: DocMeta; onClose: () => void }) {
  const [html, setHtml] = useState<string>("");
  const [tables, setTables] = useState<string[][][]>([]);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let revoke: string | null = null;
    (async () => {
      setLoading(true); setError(""); setHtml(""); setTables([]); setPdfUrl("");
      try {
        const blob = await fetchDocumentBlob(doc.id);
        if (doc.file_type === "pdf") {
          const url = URL.createObjectURL(blob); revoke = url; setPdfUrl(url);
        } else if (doc.file_type === "word") {
          const mammoth = await import("mammoth");
          const buf = await blob.arrayBuffer();
          const res = await mammoth.convertToHtml({ arrayBuffer: buf });
          setHtml(res.value || "<p>(Document vide)</p>");
        } else if (doc.file_type === "excel") {
          const XLSX = await import("xlsx");
          const buf = await blob.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array" });
          const sheets: string[][][] = wb.SheetNames.map((n) =>
            XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }) as string[][]);
          setTables(sheets);
        }
      } catch {
        setError("Impossible d'afficher ce document.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [doc]);

  const download = async () => {
    const blob = await fetchDocumentBlob(doc.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = doc.filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-navy-light shadow-2xl"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            <h3 className="font-semibold">{doc.title}</h3>
            <p className="text-xs text-slate-400">{doc.filename} · {(doc.size_bytes / 1024).toFixed(0)} Ko</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={download} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
              <Download size={14} /> Télécharger
            </button>
            <button onClick={onClose} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/10"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-white">
          {loading && (
            <div className="flex h-full items-center justify-center text-slate-500">
              <Loader2 className="animate-spin" /> <span className="ml-2">Chargement…</span>
            </div>
          )}
          {error && <div className="p-8 text-center text-rose-600">{error}
            <button onClick={download} className="mt-3 mx-auto block rounded bg-primary px-3 py-1.5 text-white">Télécharger le fichier</button></div>}
          {!loading && !error && doc.file_type === "pdf" && (
            <iframe src={pdfUrl} title={doc.title} className="h-full w-full" />
          )}
          {!loading && !error && doc.file_type === "word" && (
            <div className="prose mx-auto max-w-3xl p-8 text-slate-800" dangerouslySetInnerHTML={{ __html: html }} />
          )}
          {!loading && !error && doc.file_type === "excel" && (
            <div className="p-4 text-slate-800">
              {tables.map((rows, si) => (
                <div key={si} className="mb-6 overflow-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={ri} className={ri === 0 ? "bg-slate-100 font-semibold" : ""}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="border border-slate-300 px-2 py-1">{cell ?? ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
