"""Rapport complet du site (dashboard, énergie, risques, résilience, mobilité,
comparaison, simulation, AHP). N'inclut PAS l'Assistant, la Gestion des risques,
ni la Planification prospective (rapports dédiés ailleurs)."""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak,
)


def _st():
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=ss["Title"], fontSize=19, textColor=colors.HexColor("#0b3d91"))
    h2 = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=13, textColor=colors.HexColor("#b45309"), spaceBefore=12)
    normal = ss["BodyText"]; normal.fontSize = 9.5
    small = ParagraphStyle("small", parent=normal, fontSize=8, textColor=colors.HexColor("#64748b"))
    return h1, h2, normal, small


def _table(rows, head_color="#0b3d91", widths=None):
    t = Table(rows, colWidths=widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(head_color)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d0d7e2")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f9fc")]),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def build_full_report_pdf(data: dict) -> bytes:
    """data contient : name, dashboard, energy, risks, resilience, mobility,
    compare (optionnel), simulation (optionnel), ahp (optionnel)."""
    h1, h2, normal, small = _st()
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=1.8*cm, rightMargin=1.8*cm)
    e = []
    name = data["name"]
    e.append(Paragraph(f"Rapport analytique complet — {name}", h1))
    e.append(Paragraph("Synthèse : tableau de bord, énergie, risques, résilience, mobilité, "
                       "comparaison, simulation et pondération multicritère.", small))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2"))); e.append(Spacer(1, 6))

    # 1. Tableau de bord
    d = data.get("dashboard", {})
    e.append(Paragraph("1. Tableau de bord", h2))
    e.append(_table([
        ["Indicateur", "Valeur"],
        ["Performance énergétique", f"{d.get('energy_performance','—')} %"],
        ["Résilience territoriale", f"{d.get('resilience','—')} %"],
        ["Qualité de l'air", f"{d.get('air_quality','—')}/100"],
        ["CO₂ évité / an", f"{d.get('co2_avoided','—')} t"],
        ["Population", f"{d.get('population','—'):,}".replace(",", " ") if isinstance(d.get('population'), int) else "—"],
        ["Densité", f"{d.get('density','—')} hab/km²"],
        ["Bâtiments estimés", f"{d.get('buildings','—')}"],
        ["Âge moyen du bâti", f"{d.get('avg_building_age','—')} ans"],
    ], widths=[9*cm, 6*cm]))

    # 2. Énergie
    en = data.get("energy", {})
    e.append(Paragraph("2. Performance énergétique", h2))
    dist = en.get("distribution", [])
    if dist:
        rows = [["Classe", "Bâtiments", "Part"]]
        for c in dist:
            rows.append([c.get("class", "—"), str(c.get("count", "—")), f"{c.get('pct', '—')} %"])
        e.append(_table(rows, "#b45309", widths=[5*cm, 5*cm, 5*cm]))
    else:
        e.append(Paragraph(f"Performance globale : {en.get('performance', '—')} %. "
                           f"{en.get('note', '')}", normal))

    # 3. Risques
    r = data.get("risks", {})
    e.append(Paragraph("3. Risques naturels", h2))
    e.append(Paragraph(f"Zone sismique {r.get('seismic_zone','—')} (RPA) · indice global {r.get('global','—')}/100", normal))
    if r.get("hazards"):
        rows = [["Aléa", "Niveau", "Valeur"]]
        for h in r["hazards"]:
            rows.append([h.get("name","—"), h.get("level","—"), f"{h.get('value','—')}/100"])
        e.append(_table(rows, "#b45309", widths=[6*cm, 5*cm, 4*cm]))

    # 4. Résilience
    res = data.get("resilience", {})
    e.append(Paragraph("4. Résilience urbaine", h2))
    e.append(Paragraph(f"Indice global : {res.get('global','—')} %", normal))
    if res.get("dimensions"):
        e.append(Paragraph(", ".join(f"{d['axis']} {d['score']}%" for d in res["dimensions"]), normal))

    # 5. Mobilité
    m = data.get("mobility", {})
    e.append(Paragraph("5. Mobilité & accessibilité", h2))
    e.append(Paragraph(f"Couverture transports : {m.get('transport_coverage','—')} % · "
                       f"accessibilité piétonne : {m.get('pedestrian','—')} %", normal))
    if m.get("modal_split"):
        e.append(Paragraph("Répartition modale : " +
                           ", ".join(f"{x['mode']} {x['value']}%" for x in m["modal_split"]), normal))

    # 6. Comparaison (optionnel)
    cmp = data.get("compare")
    if cmp:
        e.append(Paragraph("6. Comparaison territoriale", h2))
        e.append(Paragraph(f"{name} comparé à {cmp.get('other','—')} :", normal))
        if cmp.get("rows"):
            rows = [["Indicateur", name, cmp.get("other","Autre")]]
            for row in cmp["rows"]:
                rows.append([row["label"], str(row["a"]), str(row["b"])])
            e.append(_table(rows, "#0369a1"))

    # 7. Simulation (optionnel)
    sim = data.get("simulation")
    if sim:
        e.append(Paragraph("7. Simulation d'aménagement", h2))
        e.append(Paragraph(f"Scénario « {sim.get('name','—')} » — score global {sim.get('score','—')}.", normal))
        if sim.get("criteria"):
            e.append(Paragraph(", ".join(f"{k} {v}" for k, v in sim["criteria"].items()), normal))

    # 8. AHP (optionnel)
    ahp = data.get("ahp")
    if ahp:
        e.append(Paragraph("8. Pondération multicritère (AHP)", h2))
        e.append(Paragraph("Poids des critères (méthode de Saaty) :", normal))
        e.append(Paragraph(", ".join(f"{k} {round(v*100)}%" for k, v in ahp.get("weights", {}).items()), normal))

    e.append(Spacer(1, 14))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
    e.append(Paragraph("UrbanSynapse AI — Rapport analytique complet généré automatiquement.", small))
    doc.build(e)
    return buf.getvalue()
