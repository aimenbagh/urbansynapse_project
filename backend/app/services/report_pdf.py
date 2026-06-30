"""Génération du rapport de synthèse territoriale au format PDF (reportlab)."""
from __future__ import annotations
from datetime import datetime
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
                     recommendations: list[dict]) -> bytes:
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

    elems.append(Spacer(1, 16))
    elems.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
    elems.append(Paragraph(
        "Sources : Bilans Énergétiques Nationaux algériens. Document généré automatiquement.", small))

    doc.build(elems)
    return buf.getvalue()
