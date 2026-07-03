import { jsPDF } from "jspdf";
import { apiClient } from "./client";

interface Recommendation {
  category: string; priority: string; title: string; detail: string; impact: string;
}

/** Génère le PDF du rapport directement dans le navigateur (fallback robuste). */
export async function generateClientPDF(territoryId: number, territoryName: string) {
  // Récupérer les données nécessaires (profil + recommandations)
  let stats: any = {}, indicators: any[] = [], recs: Recommendation[] = [];
  try {
    const [s, ind, rc] = await Promise.all([
      apiClient.get(`/territories/${territoryId}/stats`).then(r => r.data).catch(() => ({})),
      apiClient.get(`/indicators/?territory_id=${territoryId}`).then(r => r.data).catch(() => []),
      apiClient.get(`/planning/${territoryId}/recommendations`).then(r => r.data.recommendations).catch(() => []),
    ]);
    stats = s; indicators = ind; recs = rc;
  } catch { /* on continue avec ce qu'on a */ }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  let y = margin;
  const W = doc.internal.pageSize.getWidth();

  const line = (h = 6) => { y += h; if (y > 275) { doc.addPage(); y = margin; } };

  // Titre
  doc.setFontSize(20); doc.setTextColor(45, 163, 224);
  doc.text("Rapport de synthèse territoriale", margin, y); line(8);
  doc.setFontSize(14); doc.setTextColor(10, 20, 40);
  doc.text(territoryName, margin, y); line(6);
  doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")} par UrbanSynapse AI`, margin, y); line(4);
  doc.setDrawColor(45, 163, 224); doc.setLineWidth(0.5); doc.line(margin, y, W - margin, y); line(8);

  // Profil
  doc.setFontSize(13); doc.setTextColor(10, 20, 40);
  doc.text("1. Profil du territoire", margin, y); line(7);
  doc.setFontSize(10); doc.setTextColor(40);
  const profile: [string, string][] = [
    ["Population", `${stats.population ?? "—"}`],
    ["Densité", `${stats.density ?? "—"} hab/km²`],
    ["Zones", `${stats.zones_count ?? "—"}`],
    ["Bâtiments analysés", `${stats.buildings_count ?? "—"}`],
    ["Âge moyen du bâti", `${stats.avg_building_age ?? "—"} ans`],
  ];
  profile.forEach(([k, v]) => { doc.setFont("helvetica", "bold"); doc.text(`${k} :`, margin, y); doc.setFont("helvetica", "normal"); doc.text(v, margin + 55, y); line(6); });
  line(2);

  // Indicateurs
  doc.setFontSize(13); doc.setTextColor(10, 20, 40);
  doc.text("2. Indicateurs clés", margin, y); line(7);
  doc.setFontSize(10); doc.setTextColor(40);
  if (indicators.length) {
    indicators.forEach((i: any) => { doc.text(`• ${i.key} : ${i.value}${i.unit ?? ""}`, margin, y); line(6); });
  } else { doc.text("Aucun indicateur.", margin, y); line(6); }
  line(2);

  // Recommandations
  doc.setFontSize(13); doc.setTextColor(10, 20, 40);
  doc.text("3. Recommandations de planification (IA)", margin, y); line(7);
  doc.setFontSize(10);
  if (!recs.length) { doc.setTextColor(40); doc.text("Aucune recommandation.", margin, y); line(6); }
  recs.forEach((r, i) => {
    const col = r.priority === "Haute" ? [220, 38, 38] : r.priority === "Moyenne" ? [180, 83, 9] : [21, 128, 61];
    doc.setFont("helvetica", "bold"); doc.setTextColor(40);
    const titleLines = doc.splitTextToSize(`${i + 1}. ${r.title}`, W - 2 * margin - 25);
    doc.text(titleLines, margin, y);
    doc.setTextColor(col[0], col[1], col[2]);
    doc.text(`[${r.priority}]`, W - margin - 22, y);
    line(6 * titleLines.length);
    doc.setFont("helvetica", "normal"); doc.setTextColor(70);
    const detail = doc.splitTextToSize(r.detail, W - 2 * margin);
    doc.text(detail, margin, y); line(5 * detail.length);
    doc.setTextColor(21, 128, 61);
    doc.text(`→ ${r.impact}`, margin, y); line(8);
  });

  doc.save(`rapport_${territoryName}.pdf`);
}
