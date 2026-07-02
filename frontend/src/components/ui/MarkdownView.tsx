/**
 * Rendu Markdown léger (sans dépendance externe).
 * Gère : titres #/##/###, gras **...**, tableaux | a | b |, listes - / *,
 * citations >, séparateurs ---, et nettoie les clôtures ```markdown.
 */
import React from "react";

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // convertir les <br> (et variantes) en vrais sauts de ligne
  const segments = text.split(/<br\s*\/?>/gi);
  const out: React.ReactNode[] = [];
  segments.forEach((seg, si) => {
    if (si > 0) out.push(<br key={`${keyPrefix}-br${si}`} />);
    // gras **...**
    const parts = seg.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        out.push(<strong key={`${keyPrefix}-b${si}-${i}`} className="font-semibold text-white">{p.slice(2, -2)}</strong>);
      } else if (p) {
        out.push(<React.Fragment key={`${keyPrefix}-t${si}-${i}`}>{p}</React.Fragment>);
      }
    });
  });
  return out;
}

function Table({ rows }: { rows: string[] }) {
  // rows = lignes markdown du tableau (header, séparateur, corps)
  const parse = (line: string) =>
    line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const header = parse(rows[0]);
  const body = rows.slice(2).map(parse); // saute la ligne séparatrice ---
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} className="border-b border-white/10 bg-white/5 px-3 py-2 text-left font-semibold text-slate-200">
                {renderInline(h, `th${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri} className="border-b border-white/5">
              {r.map((c, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-300">{renderInline(c, `td${ri}-${ci}`)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarkdownView({ content }: { content: string }) {
  // nettoyer les clôtures de bloc de code ```markdown / ```
  const cleaned = content.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
  const lines = cleaned.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length) {
      blocks.push(
        <ul key={key} className="my-2 ml-5 list-disc space-y-1 text-slate-300">
          {listBuffer.map((li, idx) => <li key={idx}>{renderInline(li, `li${key}-${idx}`)}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Tableau : ligne | ... | suivie d'une ligne séparatrice |---|
    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
      flushList(`fl${i}`);
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { tbl.push(lines[i]); i++; }
      blocks.push(<Table key={`tbl${i}`} rows={tbl} />);
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      flushList(`fl${i}`);
      const level = trimmed.match(/^#+/)![0].length;
      const txt = trimmed.replace(/^#+\s/, "");
      const cls = level === 1 ? "mt-4 mb-2 text-xl font-bold text-primary"
        : level === 2 ? "mt-4 mb-2 text-lg font-semibold text-slate-100"
        : level === 3 ? "mt-3 mb-1 text-base font-semibold text-accent"
        : "mt-2 mb-1 text-sm font-semibold text-accent-2";
      blocks.push(<div key={`h${i}`} className={cls}>{renderInline(txt, `h${i}`)}</div>);
    } else if (/^[-*]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s/, ""));
    } else if (trimmed.startsWith(">")) {
      flushList(`fl${i}`);
      blocks.push(
        <blockquote key={`q${i}`} className="my-2 border-l-2 border-primary/50 pl-3 text-sm italic text-slate-400">
          {renderInline(trimmed.replace(/^>\s?/, ""), `q${i}`)}
        </blockquote>
      );
    } else if (/^---+$/.test(trimmed)) {
      flushList(`fl${i}`);
      blocks.push(<hr key={`hr${i}`} className="my-3 border-white/10" />);
    } else if (trimmed === "") {
      flushList(`fl${i}`);
    } else {
      flushList(`fl${i}`);
      blocks.push(<p key={`p${i}`} className="my-1.5 text-sm leading-relaxed text-slate-300">{renderInline(trimmed, `p${i}`)}</p>);
    }
    i++;
  }
  flushList("fl-end");

  return <div className="markdown-view">{blocks}</div>;
}
