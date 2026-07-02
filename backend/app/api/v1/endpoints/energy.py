from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.energy import simulate_retrofit, aggregate_territory_retrofit

router = APIRouter(prefix="/energy", tags=["energy"])


class RetrofitRequest(BaseModel):
    surface_m2: float = Field(..., gt=0, json_schema_extra={"example": 100})
    energy_class: str = Field(..., json_schema_extra={"example": "E"})
    measures: list[str] = Field(default_factory=list,
                                json_schema_extra={"example": ["insulation", "glazing"]})


@router.post("/retrofit")
def retrofit(payload: RetrofitRequest):
    return simulate_retrofit(payload.surface_m2, payload.energy_class, payload.measures)


class TerritoryRetrofitRequest(BaseModel):
    territory_id: int
    measures: list[str] = Field(default_factory=lambda: ["insulation", "glazing"])


@router.post("/territory-retrofit")
def territory_retrofit(payload: TerritoryRetrofitRequest, db: Session = Depends(get_db)):
    """Agrège la simulation de rénovation sur tout le bâti d'un territoire."""
    from app.models.territory import Zone, Building
    zone_ids = [z.id for z in db.query(Zone).filter(Zone.territory_id == payload.territory_id).all()]
    buildings = (
        db.query(Building).filter(Building.zone_id.in_(zone_ids)).all() if zone_ids else []
    )
    data = [{"surface_m2": b.surface_m2, "energy_class": b.energy_class} for b in buildings]
    return aggregate_territory_retrofit(data, payload.measures)


@router.get("/{territory_id}/distribution")
def energy_distribution_detail(territory_id: int, db: Session = Depends(get_db)):
    """Distribution des classes énergétiques (wilaya) + détail daïra/commune."""
    from app.models.territory import Territory, Zone, Building
    from app.data.energy_data import energy_distribution, estimate_buildings, CLASS_KWH
    from app.data.admin_divisions import ADMIN_DIVISIONS

    t = db.get(Territory, territory_id)
    if not t:
        from fastapi import HTTPException
        raise HTTPException(404, "Territoire introuvable")

    wcode = (t.wilaya_code or "").zfill(2)

    # Si la wilaya a de VRAIS bâtiments seedés, on les utilise
    zones = db.query(Zone).filter(Zone.territory_id == territory_id).all()
    zids = [z.id for z in zones]
    real_buildings = db.query(Building).filter(Building.zone_id.in_(zids)).all() if zids else []

    if real_buildings:
        from collections import Counter
        cc = Counter(b.energy_class for b in real_buildings if b.energy_class)
        distribution = [{"classe": c, "count": cc.get(c, 0)} for c in ["A","B","C","D","E","F","G"]]
        total = len(real_buildings)
        avg = round(sum(CLASS_KWH.get(b.energy_class, 190) for b in real_buildings) / total, 1)
        perf = max(15, min(95, round(100 - (avg - 45) / 4.25)))
        wilaya_dist = {"distribution": distribution, "total_buildings": total,
                       "avg_kwh_m2": avg, "performance": perf, "source": "réel"}
    else:
        nb = estimate_buildings(t.population or 0)
        wilaya_dist = energy_distribution(f"wilaya-{wcode}", nb)
        wilaya_dist["source"] = "estimé"

    # Hiérarchie daïra/commune (distribution estimée par commune)
    wilaya_data = ADMIN_DIVISIONS.get(wcode)
    dairas = []
    if wilaya_data:
        pop_per_commune = (t.population or 0) / max(1, sum(len(cs) for cs in wilaya_data["dairas"].values()))
        for daira_name, communes in wilaya_data["dairas"].items():
            clist = []
            for cname in communes:
                nb_c = max(10, round(pop_per_commune / 25))
                cd = energy_distribution(f"commune-{cname}", nb_c)
                clist.append({"name": cname, "performance": cd["performance"],
                              "avg_kwh_m2": cd["avg_kwh_m2"], "total_buildings": cd["total_buildings"],
                              "distribution": cd["distribution"]})
            # daïra = agrégat de ses communes
            dperf = round(sum(c["performance"] for c in clist) / len(clist)) if clist else 50
            ddist = []
            for i, cl in enumerate(["A","B","C","D","E","F","G"]):
                s = sum(c["distribution"][i]["count"] for c in clist)
                ddist.append({"classe": cl, "count": s})
            dairas.append({"name": daira_name, "performance": dperf,
                          "total_buildings": sum(c["total_buildings"] for c in clist),
                          "distribution": ddist, "communes": clist})

    return {
        "territory_id": t.id, "territory_name": t.name, "wilaya_code": wcode,
        "distribution": wilaya_dist["distribution"],
        "total_buildings": wilaya_dist["total_buildings"],
        "avg_kwh_m2": wilaya_dist["avg_kwh_m2"],
        "performance": wilaya_dist["performance"],
        "source": wilaya_dist["source"],
        "dairas": dairas, "has_detail": len(dairas) > 0,
    }
