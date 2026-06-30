"""Constantes calibrées sur les données énergétiques nationales algériennes.

Sources : Bilans Énergétiques Nationaux (ME/APRUE/SONELGAZ), 2019-2024,
et rapports de transition énergétique. Les valeurs sont des ordres de grandeur
documentés servant à calibrer les simulations de la plateforme. Elles restent
ajustables à mesure que des données locales plus fines sont intégrées.
"""

# --- Facteur d'émission du mix électrique algérien ---
# Le mix est dominé par le gaz naturel (~99% de la production électrique).
# Facteur d'émission indicatif d'une production gaz : ~0.55-0.61 kg CO2/kWh.
CO2_PER_KWH = 0.58  # kg CO2 / kWh

# --- Tarif moyen de l'électricité (usage résidentiel/tertiaire) ---
# Tarifs SONELGAZ subventionnés. Ordre de grandeur moyen.
PRICE_PER_KWH_DA = 4.18  # DA / kWh

# --- Objectif national d'énergies renouvelables ---
# Programme national : ~27% de la production électrique d'origine renouvelable
# visée à l'horizon 2030 (capacités ~22 GW).
RENEWABLE_TARGET_2030_PCT = 27

# --- Répartition indicative de la consommation finale par secteur (Algérie) ---
# Le résidentiel/ménages et le transport dominent la consommation finale.
SECTOR_CONSUMPTION_PCT = {
    "residentiel": 45,
    "transport": 30,
    "industrie": 15,
    "tertiaire": 10,
}

# --- Consommation de référence du bâti (kWh/m²/an) par classe énergétique ---
# Adaptée au climat algérien (besoins de climatisation estivale notables).
CLASS_BASELINE_KWH_M2 = {
    "A": 50, "B": 90, "C": 150, "D": 230, "E": 330, "F": 450, "G": 600,
}

# --- Évolution de la production électrique nationale (GWh éq., bilan 2024) ---
# Donnée réelle extraite du Bilan Énergétique National 2024.
ELECTRICITY_PRODUCTION = {
    2000: 7404, 2005: 9548, 2010: 11715, 2015: 16362,
    2019: 18555, 2020: 18130, 2021: 20497, 2022: 21852,
    2023: 22494, 2024: 24135,
}
