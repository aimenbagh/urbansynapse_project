"""Rapport de l'Assistant UrbanSynapse AI : uniquement les 4 étapes du wizard
(données → analyse & solutions → scénarios → synthèse)."""
from io import BytesIO
import random
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem


def build_assistant_pdf(name: str, profile: dict, recommendations: list) -> bytes:
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=ss["Title"], fontSize=18, textColor=colors.HexColor("#5b21b6"))
    h2 = ParagraphStyle("h2", parent=ss["Heading2"], fontSize=13, textColor=colors.HexColor("#7c3aed"), spaceBefore=10)
    normal = ss["BodyText"]; normal.fontSize = 9.5
    small = ParagraphStyle("small", parent=normal, fontSize=8, textColor=colors.HexColor("#64748b"))

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=1.8*cm, rightMargin=1.8*cm)
    e = []
    e.append(Paragraph("Assistant UrbanSynapse AI — Rapport guidé", h1))
    e.append(Paragraph(f"Territoire : {name} · Processus en 4 étapes, de la donnée à la décision.", small))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2"))); e.append(Spacer(1, 8))

    perf = profile.get("energy_performance", 70)
    risk = profile.get("risk", {}).get("global", 50) if isinstance(profile.get("risk"), dict) else 50
    pop = profile.get("population", "—")

    # Étape 1 : données
    e.append(Paragraph("Étape 1 — Consultation des données", h2))
    e.append(Paragraph(f"Population : {pop} · Performance énergétique : {perf}% · "
                       f"Indice de risque : {risk}/100.", normal))

    # Étape 2 : analyse & solutions
    e.append(Paragraph("Étape 2 — Analyse & solutions recommandées", h2))
    e.append(Paragraph(profile.get("analysis", f"Diagnostic territorial de {name}."), normal))
    sols = [f"{r.get('title', r.get('name', 'Action'))} — {r.get('detail', r.get('description', ''))}"
            for r in (recommendations or [])]
    if not sols:
        sols = ["Rénovation thermique du bâti pour améliorer la performance énergétique.",
                "Renforcement de la résilience et des normes parasismiques.",
                "Développement des espaces verts et de la mobilité douce."]
    e.append(ListFlowable([ListItem(Paragraph(x, normal)) for x in sols], bulletType="1"))

    # Étape 3 : scénarios (variés)
    e.append(Paragraph("Étape 3 — Scénarios d'aménagement", h2))
    pool = [
        f"Transition énergétique : porter la performance de {perf}% à {min(98, perf+15)}% (rénovation massive du bâti).",
        f"Ville résiliente : réduire l'indice de risque ({risk}/100) par la végétalisation et le renforcement parasismique.",
        "Mobilité durable : extension des transports en commun et des pistes cyclables.",
        "Sobriété & solaire : photovoltaïque sur toitures et éclairage public basse consommation.",
        "Densification maîtrisée : croissance concentrée autour des axes de transport (TOD).",
        "Trame verte & bleue : corridors écologiques et restauration des zones humides.",
    ]
    chosen = pool[:2] + random.sample(pool[2:], 2)
    e.append(ListFlowable([ListItem(Paragraph(x, normal)) for x in chosen], bulletType="bullet", start="•"))

    # Étape 4 : synthèse
    e.append(Paragraph("Étape 4 — Synthèse décisionnelle", h2))
    e.append(Paragraph(f"Ce rapport guidé synthétise le diagnostic de {name}, les solutions "
                       f"prioritaires et des scénarios d'aménagement pour appuyer la décision.", normal))

    e.append(Spacer(1, 14))
    e.append(HRFlowable(width="100%", color=colors.HexColor("#d0d7e2")))
    e.append(Paragraph("UrbanSynapse AI — Rapport de l'Assistant guidé.", small))
    doc.build(e)
    return buf.getvalue()
