"""Charge les documents de référence dans la base (consultables dans l'app).

Lance : python -m scripts.seed_documents
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_sessionmaker, Base, get_engine
import app.models  # noqa
from app.models.document import Document

# Dossier des documents à charger
DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "seed_documents")

# Titres lisibles + type
CATALOG = {
    "Bilan-Energetique-National-2024.xlsx": ("Bilan Énergétique National Algérien 2024", "excel"),
    "Population-Alger-RGPH-2008.xls": ("Population d'Alger par commune (RGPH 2008)", "excel"),
    "Calcul-consommation-bati.pdf": ("Calcul de consommation du bâti", "pdf"),
    "Armature-urbaine-2008.pdf": ("Armature urbaine 2008", "pdf"),
    "Analyse-agglomerations.pdf": ("Analyse des agglomérations", "pdf"),
    "Mobilite-urbaine-Alger.pdf": ("La mobilité urbaine dans l'agglomération d'Alger", "pdf"),
    "RPA-2024.pdf": ("Règlement Parasismique Algérien (RPA 2024)", "pdf"),
    "Methode.pdf": ("Méthode UrbanSynapse", "pdf"),
    "Smart-Solutions.pdf": ("Smart Solutions — bâtiments, réseaux et territoires", "pdf"),
    "Reglementation-thermique-2008.pdf": ("Réglementation thermique (arrêté 2008)", "pdf"),
}

CONTENT_TYPES = {
    "pdf": "application/pdf",
    "excel": "application/vnd.ms-excel",
    "word": "application/msword",
}


def main():
    Base.metadata.create_all(bind=get_engine())
    db = get_sessionmaker()()
    added = 0
    try:
        for filename, (title, ftype) in CATALOG.items():
            path = os.path.join(DOCS_DIR, filename)
            if not os.path.exists(path):
                print(f"  [ignoré] {filename} introuvable")
                continue
            # éviter les doublons
            if db.query(Document).filter(Document.title == title).first():
                print(f"  [déjà présent] {title}")
                continue
            with open(path, "rb") as f:
                data = f.read()
            ct = CONTENT_TYPES.get(ftype, "application/octet-stream")
            if filename.endswith(".xlsx"):
                ct = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            doc = Document(
                title=title, filename=filename, content_type=ct,
                file_type=ftype, size_bytes=len(data), data=data,
                uploaded_by="système (données de référence)",
            )
            db.add(doc)
            added += 1
            print(f"  [ajouté] {title} ({len(data)//1024} Ko)")
        db.commit()
        print(f"\n{added} document(s) chargé(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
