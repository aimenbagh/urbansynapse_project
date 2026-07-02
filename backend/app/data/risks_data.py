"""Données de risques naturels par wilaya (basées sur des références réelles).

- Zonage sismique : Règlement Parasismique Algérien (RPA 99/2003 + RPA 2024)
  Zones : 0 (négligeable), I (faible), IIa/IIb (moyenne), III (élevée).
  Le nord de l'Algérie (tell) est en zone II-III ; le sud saharien en 0-I.
- Inondation : plus élevé sur la bande côtière et les vallées (nord).
- Îlot de chaleur : plus élevé au sud et dans les grandes agglomérations denses.
- Feu de forêt : élevé dans les wilayas boisées du nord (Kabylie, Tell).
"""

# Zone sismique RPA par code wilaya (III = plus fort)
SEISMIC_ZONE = {
    "16": "III", "06": "III", "42": "III", "44": "III", "09": "III",  # Alger, Béjaïa, Tipaza, Aïn Defla, Blida
    "35": "III", "02": "III", "48": "III",                              # Boumerdès, Chlef, Relizane
    "31": "IIa", "13": "IIa", "22": "IIa", "46": "IIa", "27": "IIa",   # Oran, Tlemcen, Sidi Bel Abbès, Aïn Témouchent, Mostaganem
    "25": "IIa", "43": "IIa", "23": "IIa", "24": "IIa", "05": "IIa",   # Constantine, Mila, Annaba, Guelma, Batna
    "15": "IIa", "10": "IIa", "34": "IIa", "19": "IIa", "18": "IIa",   # Tizi Ouzou, Bouira, BBA, Sétif, Jijel
    "21": "IIa", "26": "IIa", "38": "IIa", "04": "IIa", "40": "IIa",   # Skikda, Médéa, Tissemsilt, Oum El Bouaghi, Khenchela
    "12": "I", "14": "I", "20": "I", "29": "I", "17": "I", "28": "I",  # Tébessa, Tiaret, Saïda, Mascara, Djelfa, M'Sila
    "03": "I", "32": "I", "45": "I", "36": "I", "41": "I",             # Laghouat, El Bayadh, Naâma, El Tarf, Souk Ahras
}
# Valeur numérique de l'aléa sismique selon la zone
SEISMIC_VALUE = {"III": 85, "IIb": 72, "IIa": 62, "I": 38, "0": 18}

# Wilayas fortement boisées (risque feu de forêt élevé)
FOREST_WILAYAS = {"15", "06", "18", "21", "19", "10", "16", "09", "44", "42", "24", "23", "41", "43"}


def risk_profile(wilaya_code: str, lat: float, population: int, area_km2: float) -> dict:
    """Renvoie les 4 aléas avec valeur 0-100, niveau et zone concernée."""
    lat = lat or 36.0
    density = (population / area_km2) if (population and area_km2) else 100

    # Séisme : d'après la zone RPA réelle
    zone = SEISMIC_ZONE.get(wilaya_code, "I")
    seismic = SEISMIC_VALUE.get(zone, 40)

    # Inondation : plus fort au nord (côte, lat élevée)
    flood = max(10, min(95, round(30 + (lat - 30) * 6)))

    # Îlot de chaleur : plus fort au sud (lat basse) et si forte densité urbaine
    heat = max(10, min(95, round(35 + (36 - lat) * 7 + min(25, density / 200))))

    # Feu de forêt : élevé si wilaya boisée
    forest = 70 if wilaya_code in FOREST_WILAYAS else 30
    if wilaya_code in FOREST_WILAYAS and lat > 36:
        forest = 78

    def level(v):
        return "Élevé" if v >= 65 else "Modéré" if v >= 40 else "Faible"

    global_idx = round((flood + heat + seismic + forest) / 4)
    return {
        "global": global_idx,
        "seismic_zone": zone,
        "hazards": [
            {"key": "flood", "name": "Inondation", "value": flood, "level": level(flood),
             "zone": "Bande côtière et vallées" if flood >= 55 else "Zones basses"},
            {"key": "seismic", "name": "Séisme", "value": seismic, "level": level(seismic),
             "zone": f"Zone sismique {zone} (RPA)"},
            {"key": "heat", "name": "Îlot de chaleur", "value": heat, "level": level(heat),
             "zone": "Centre urbain dense" if density > 1000 else "Ensemble du territoire"},
            {"key": "forest", "name": "Feu de forêt", "value": forest, "level": level(forest),
             "zone": "Périphérie boisée" if forest >= 55 else "Zones éparses"},
        ],
    }
