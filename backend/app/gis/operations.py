"""Core PostGIS / Shapely geospatial operations."""
from shapely.geometry import shape, mapping
from shapely.ops import transform
import pyproj
from app.core.config import settings


def reproject(geom, src_srid: int, dst_srid: int):
    """Reproject a shapely geometry between two SRIDs."""
    project = pyproj.Transformer.from_crs(
        f"EPSG:{src_srid}", f"EPSG:{dst_srid}", always_xy=True
    ).transform
    return transform(project, geom)


def geojson_to_geom(geojson: dict):
    return shape(geojson)


def geom_to_geojson(geom) -> dict:
    return mapping(geom)


def area_m2(geojson: dict) -> float:
    """Compute area in m² using the Algerian projected CRS."""
    geom = shape(geojson)
    projected = reproject(geom, settings.DEFAULT_SRID, settings.PROJECTED_SRID)
    return projected.area
