"""Génère un PDF de plan de gestion des risques (lieu précis ou national)."""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem


def _styles():
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=ss["Title"], fontSize=18, textColor=colors.HexColor("#0b3d91"))
    h2 = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=13, textColor=colors.HexColor("#b45309"), spaceBefore=10)
    h3 = ParagraphStyle("h3", parent=ss["Heading3"], fontSize=11, textColor=colors.HexColor("#0369a1"))
    normal = ss["BodyText"]; normal.fontSize = 9.5
    small = ParagraphStyle("small", parent=normal, fontSize=8, textColor=colors.HexColor("#64748b"))
    return h1, h2, h3, normal, small


def build_single_risk_pdf(plan: dict, ai_text: str | None = None) -> bytes:
    h1, h2, h3, normal, small = _styles()
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=1.8*cm, rightMargin=1.8*cm)
    e = []
    e.append(Paragraph(f"Plan de gestion des risques — {plan['territoire']}", h1))
    e.append(Paragraph(f"Wilaya {plan['wilaya_code']} · Zone sismique {plan['zone_sismique']} (RPA) · "
                       f"Indice de risque global {plan['risque_global']}/100", small))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2"))); e.append(Spacer(1, 8))

    for sc in plan["scénarios"]:
        val = f" — {sc['valeur']}/100" if sc.get("valeur") is not None else ""
        e.append(Paragraph(f"{sc['aléa']} ({sc['niveau']}{val})", h2))
        e.append(Paragraph(sc["scénario"], normal)); e.append(Spacer(1, 3))
        e.append(Paragraph("Mesures de prévention :", h3))
        e.append(ListFlowable([ListItem(Paragraph(x, normal)) for x in sc["prévention"]],
                              bulletType="bullet", start="•"))
        e.append(Paragraph("Réponse en cas de crise :", h3))
        e.append(ListFlowable([ListItem(Paragraph(x, normal)) for x in sc["réponse_crise"]],
                              bulletType="bullet", start="•"))
        e.append(Spacer(1, 6))

    if ai_text:
        e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
        e.append(Paragraph("Plan d'action détaillé (IA)", h2))
        for para in ai_text.split("\n"):
            para = para.strip()
            if not para:
                continue
            clean = para.lstrip("#* ").replace("**", "")
            style = h3 if para.startswith("#") or para.startswith("**") else normal
            e.append(Paragraph(clean, style))

    e.append(Spacer(1, 12))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
    e.append(Paragraph("UrbanSynapse AI — Généré automatiquement. Sources : RPA, exposition géographique.", small))
    doc.build(e)
    return buf.getvalue()


def build_global_risk_pdf(plan: dict, ai_text: str | None = None) -> bytes:
    h1, h2, h3, normal, small = _styles()
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=1.8*cm, rightMargin=1.8*cm)
    e = []
    e.append(Paragraph("Plan national de gestion des risques — Algérie", h1))
    e.append(Paragraph(plan["périmètre"], small))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2"))); e.append(Spacer(1, 8))

    e.append(Paragraph("Wilayas les plus exposées", h2))
    e.append(ListFlowable(
        [ListItem(Paragraph(f"{w['nom']} — risque {w['risque_global']}/100, zone sismique {w['zone_sismique']}", normal))
         for w in plan["wilayas_plus_risquées"]], bulletType="bullet", start="•"))

    e.append(Paragraph("Zones sismiques élevées (III / IIb)", h2))
    e.append(Paragraph(", ".join(plan["zones_sismiques_élevées"]) or "—", normal))
    e.append(Paragraph("Exposition inondation élevée", h2))
    e.append(Paragraph(", ".join(plan["zones_inondation_élevée"]) or "—", normal))
    e.append(Paragraph("Exposition feux de forêt élevée", h2))
    e.append(Paragraph(", ".join(plan["zones_feu_forêt_élevé"]) or "—", normal))

    e.append(Paragraph("Priorités nationales", h2))
    e.append(ListFlowable([ListItem(Paragraph(x, normal)) for x in plan["priorités_nationales"]],
                          bulletType="bullet", start="•"))

    if ai_text:
        e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
        e.append(Paragraph("Analyse et plan national détaillé (IA)", h2))
        for para in ai_text.split("\n"):
            para = para.strip()
            if not para:
                continue
            clean = para.lstrip("#* ").replace("**", "")
            style = h3 if para.startswith("#") or para.startswith("**") else normal
            e.append(Paragraph(clean, style))

    e.append(Spacer(1, 12))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
    e.append(Paragraph("UrbanSynapse AI — Généré automatiquement. Sources : RPA, exposition géographique.", small))
    doc.build(e)
    return buf.getvalue()
