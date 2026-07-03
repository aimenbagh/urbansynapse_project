"""Génération du rapport de synthèse territoriale au format PDF (reportlab)."""
from __future__ import annotations
from datetime import datetime
import random
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

NAVY = colors.HexColor("#0a1428")
PRIMARY = colors.HexColor("#2da3e0")
ACCENT = colors.HexColor("#c9a227")


def build_report_pdf(territory_name: str, stats: dict, indicators: dict,
                     recommendations: list[dict], profile: dict = None) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=2 * cm, bottomMargin=2 * cm,
                            leftMargin=2 * cm, rightMargin=2 * cm,
                            title=f"Rapport - {territory_name}")
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=PRIMARY, fontSize=20)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=NAVY, fontSize=13,
                        spaceBefore=14)
    normal = styles["Normal"]
    small = ParagraphStyle("small", parent=normal, fontSize=8, textColor=colors.grey)

    elems = []
    elems.append(Paragraph(f"Rapport de synthèse territoriale", h1))
    elems.append(Paragraph(f"<b>{territory_name}</b>", styles["Heading2"]))
    elems.append(Paragraph(
        f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} par UrbanSynapse AI", small))
    elems.append(Spacer(1, 6))
    elems.append(HRFlowable(width="100%", color=PRIMARY, thickness=1.5))
    elems.append(Spacer(1, 10))

    # 1. Profil
    elems.append(Paragraph("1. Profil du territoire", h2))
    profile_rows = [
        ["Population", f"{stats.get('population', '—')}"],
        ["Densité", f"{stats.get('density', '—')} hab/km²"],
        ["Zones", f"{stats.get('zones_count', '—')}"],
        ["Bâtiments analysés", f"{stats.get('buildings_count', '—')}"],
        ["Âge moyen du bâti", f"{stats.get('avg_building_age', '—')} ans"],
    ]
    t = Table(profile_rows, colWidths=[6 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef4fb")),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d0d7e2")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, colors.HexColor("#f7f9fc")]),
    ]))
    elems.append(t)

    # 2. Indicateurs
    elems.append(Paragraph("2. Indicateurs clés", h2))
    if indicators:
        ind_rows = [["Indicateur", "Valeur"]] + [[k, str(v)] for k, v in indicators.items()]
        it = Table(ind_rows, colWidths=[9 * cm, 6 * cm])
        it.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d0d7e2")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f9fc")]),
        ]))
        elems.append(it)
    else:
        elems.append(Paragraph("Aucun indicateur disponible.", normal))

    # 3. Recommandations IA
    elems.append(Paragraph("3. Recommandations de planification (IA)", h2))
    if not recommendations:
        elems.append(Paragraph("Aucune recommandation : indicateurs satisfaisants.", normal))
    for i, r in enumerate(recommendations, 1):
        pr_color = {"Haute": "#dc2626", "Moyenne": "#b45309", "Basse": "#15803d"}.get(r["priority"], "#334155")
        elems.append(Spacer(1, 6))
        elems.append(Paragraph(
            f'<b>{i}. {r["title"]}</b> '
            f'<font color="{pr_color}">[{r["priority"]}]</font> '
            f'<font color="#64748b">· {r["category"]}</font>', normal))
        elems.append(Paragraph(r["detail"], normal))
        elems.append(Paragraph(f'<i>Impact attendu : {r["impact"]}</i>',
                               ParagraphStyle("imp", parent=normal, textColor=colors.HexColor("#15803d"))))

    # 4. Analyse détaillée (risques / résilience / mobilité)
    prof = profile or {}
    if prof.get("hazards") or prof.get("resilience_dimensions") or prof.get("modal_split"):
        elems.append(Paragraph("4. Analyse territoriale détaillée", h2))

        # Risques naturels
        if prof.get("hazards"):
            elems.append(Paragraph(
                f'<b>Risques naturels</b> — zone sismique {prof.get("seismic_zone", "—")} (RPA)', normal))
            rrows = [["Aléa", "Niveau", "Valeur"]] + [
                [h["name"], h["level"], f'{h["value"]}/100'] for h in prof["hazards"]]
            rt = Table(rrows, colWidths=[6 * cm, 4 * cm, 5 * cm])
            rt.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#b45309")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d0d7e2")),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f9fc")]),
            ]))
            elems.append(Spacer(1, 4)); elems.append(rt); elems.append(Spacer(1, 8))

        # Résilience
        if prof.get("resilience_dimensions"):
            elems.append(Paragraph(
                f'<b>Résilience urbaine</b> — indice global {prof.get("resilience_global", "—")}%', normal))
            dims = ", ".join(f'{d["axis"]} {d["score"]}%' for d in prof["resilience_dimensions"])
            elems.append(Paragraph(dims, normal)); elems.append(Spacer(1, 8))

        # Mobilité
        if prof.get("modal_split"):
            elems.append(Paragraph(
                f'<b>Mobilité</b> — couverture transports {prof.get("transport_coverage", "—")}%, '
                f'accessibilité piétonne {prof.get("pedestrian", "—")}%', normal))
            modal = ", ".join(f'{m["mode"]} {m["value"]}%' for m in prof["modal_split"])
            elems.append(Paragraph(f"Répartition modale : {modal}", normal)); elems.append(Spacer(1, 8))

    # 5. Scénarios d'aménagement proposés
    elems.append(Paragraph("5. Scénarios d'aménagement proposés", h2))
    perf = (profile or {}).get("energy_performance", 70)
    risk = (profile or {}).get("risk_global", 50)
    try:
        perf = round(float(perf)); risk = round(float(risk))
    except Exception:
        perf, risk = 70, 50
    gain = min(95, perf + 15)
    pool = [
        ("Transition énergétique",
         f"Porter la performance énergétique de {perf}% à {gain}% via un programme de rénovation "
         f"massive du bâti (isolation, double vitrage, systèmes CVC performants)."),
        ("Ville résiliente",
         f"Réduire l'indice de risque (actuellement {risk}/100) par la végétalisation urbaine, la "
         f"gestion des eaux pluviales et le renforcement parasismique (RPA)."),
        ("Mobilité durable",
         "Réduire la dépendance à la voiture par l'extension des transports en commun (bus/tramway), "
         "le développement des pistes cyclables et des pôles multimodaux."),
        ("Sobriété et solaire",
         f"Déployer le photovoltaïque sur les grandes toitures et l'éclairage public basse "
         f"consommation pour couvrir une part de la demande locale."),
        ("Densification maîtrisée",
         "Concentrer la croissance autour des axes de transport (TOD) pour limiter l'étalement "
         "urbain et préserver les terres agricoles périphériques."),
        ("Trame verte et bleue",
         "Créer un réseau continu de corridors écologiques et restaurer les zones humides comme "
         "tampons naturels contre les inondations et réservoirs de biodiversité."),
        ("Rénovation du bâti public",
         "Prioriser la rénovation énergétique des équipements publics (écoles, hôpitaux, "
         "administrations) comme effet d'entraînement et vitrine pour le territoire."),
        ("Économie circulaire",
         "Développer le tri, la valorisation des déchets et les matériaux de construction locaux "
         "pour réduire l'empreinte carbone du secteur du bâtiment."),
    ]
    # 3 scénarios variés : les 2 prioritaires (énergie, risque) + un aléatoire parmi les autres
    scenarios = pool[:2] + random.sample(pool[2:], 2)
    for i, (titre, desc) in enumerate(scenarios, 1):
        elems.append(Spacer(1, 6))
        elems.append(Paragraph(f'<b>{i}. Scénario « {titre} »</b>', normal))
        elems.append(Paragraph(desc, normal))

    elems.append(Spacer(1, 16))
    elems.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
    elems.append(Paragraph(
        "Sources : Bilans Énergétiques Nationaux algériens. Document généré automatiquement.", small))

    doc.build(elems)
    return buf.getvalue()
