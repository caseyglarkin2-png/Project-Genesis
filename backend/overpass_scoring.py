"""Real YVS inputs derived from OpenStreetMap via the Overpass API.

Replaces the random.randint() mocks in dragnet.py. For a given lat/lon we measure:
  - paved_area_pct: paved/industrial polygon area / total polygon area within radius
  - trailer_capacity: derived from parking polygon area (1 spot ≈ 165 m² for a 53ft trailer)
  - gate_count: distinct service/road ways crossing the industrial polygon perimeter

OSM data is open and free; rate limits are gentle. We aggressively cache.
"""

from __future__ import annotations

import math
import os
from typing import Dict, List, Optional

import requests

import cache

OVERPASS_URL = os.environ.get('OVERPASS_URL', 'https://overpass-api.de/api/interpreter')
OVERPASS_TIMEOUT_S = 25
SEARCH_RADIUS_M = 1000           # 1km bbox so we still hit the yard when geocode is off-pin
TRAILER_SLOT_M2 = 165             # 53ft trailer footprint w/ aisle share

# Explicit industrial-building tag values (per discovery spec). Used to flag
# real industrial polygons even when no landuse=industrial polygon is mapped.
INDUSTRIAL_BUILDING_VALUES = {'warehouse', 'industrial', 'manufacture', 'factory'}

EARTH_R = 6_371_000


def _bbox(lat: float, lon: float, radius_m: int) -> str:
    """Return south,west,north,east bbox string."""
    dlat = (radius_m / EARTH_R) * (180 / math.pi)
    dlon = dlat / math.cos(math.radians(lat))
    return f'{lat - dlat},{lon - dlon},{lat + dlat},{lon + dlon}'


def _query(lat: float, lon: float) -> Optional[dict]:
    cache_key = f'{lat:.5f},{lon:.5f}'
    cached = cache.get('overpass', cache_key)
    if cached is not None:
        return cached

    bbox = _bbox(lat, lon, SEARCH_RADIUS_M)
    # Pull industrial landuse, parking surfaces, buildings (for total footprint
    # and industrial-tag classification), surface paving, and highway ways
    # inside the bbox. `out geom` returns inline geometry. The generic
    # way["building"] match covers warehouse/industrial/manufacture/factory;
    # we classify by tag value in Python.
    ql = f"""
    [out:json][timeout:{OVERPASS_TIMEOUT_S}];
    (
      way["landuse"="industrial"]({bbox});
      way["landuse"="commercial"]({bbox});
      way["amenity"="parking"]({bbox});
      way["surface"~"asphalt|concrete|paved"]({bbox});
      way["building"]({bbox});
      way["highway"]({bbox});
    );
    out geom tags;
    """
    try:
        resp = requests.post(
            OVERPASS_URL,
            data={'data': ql},
            timeout=OVERPASS_TIMEOUT_S + 5,
            headers={'User-Agent': 'YardFlow-Genesis/1.0 (yardflow.ai)'},
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f'  [Overpass] query failed for ({lat},{lon}): {e}')
        return None

    cache.set('overpass', cache_key, data)
    return data


def _polygon_area_m2(geom: List[dict]) -> float:
    """Shoelace area on equirectangular projection (good enough at 500m scale)."""
    if not geom or len(geom) < 3:
        return 0.0
    lat0 = sum(p['lat'] for p in geom) / len(geom)
    cos_lat = math.cos(math.radians(lat0))
    pts = [
        ((p['lon']) * EARTH_R * math.radians(1) * cos_lat, p['lat'] * EARTH_R * math.radians(1))
        for p in geom
    ]
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2.0


def _is_closed(way: dict) -> bool:
    g = way.get('geometry') or []
    return len(g) >= 3 and g[0]['lat'] == g[-1]['lat'] and g[0]['lon'] == g[-1]['lon']


def measure_facility(lat: float, lon: float, include_geometry: bool = False) -> Dict:
    """Return real measurements for a facility centroid.

    Returns dict with:
      paved_area_pct (0-100), trailer_count (int), gate_nodes (int),
      paved_area_m2 (float), parking_area_m2 (float), confidence ('HIGH'|'MEDIUM'|'LOW'),
      source ('osm' | 'fallback')
    """
    data = _query(lat, lon)
    if not data or 'elements' not in data:
        return _fallback(lat, lon, reason='overpass_unavailable')

    elements = data['elements']
    industrial_m2 = 0.0
    industrial_building_m2 = 0.0
    parking_m2 = 0.0
    paved_surface_m2 = 0.0
    building_m2 = 0.0
    bbox_m2 = (SEARCH_RADIUS_M * 2) ** 2  # rough denominator for paved %

    industrial_polys: List[List[dict]] = []
    parking_polys: List[List[dict]] = []
    paved_polys: List[List[dict]] = []
    building_polys: List[List[dict]] = []
    highway_ways: List[dict] = []

    for el in elements:
        if el.get('type') != 'way':
            continue
        tags = el.get('tags') or {}
        geom = el.get('geometry') or []

        if 'highway' in tags:
            highway_ways.append(el)
            continue

        if not _is_closed(el):
            continue

        area = _polygon_area_m2(geom)
        if tags.get('landuse') in ('industrial', 'commercial'):
            industrial_m2 += area
            industrial_polys.append(geom)
        if tags.get('amenity') == 'parking':
            parking_m2 += area
            parking_polys.append(geom)
        if tags.get('surface') in ('asphalt', 'concrete', 'paved'):
            paved_surface_m2 += area
            paved_polys.append(geom)
        if 'building' in tags:
            building_m2 += area
            building_polys.append(geom)
            if tags.get('building') in INDUSTRIAL_BUILDING_VALUES:
                industrial_building_m2 += area
                # Also count industrial buildings as part of the operational
                # polygon so paved% has a sensible denominator at sites that
                # are mapped as building footprints rather than landuse polys.
                industrial_polys.append(geom)

    operational_m2 = max(industrial_m2, parking_m2 + paved_surface_m2 + building_m2)
    paved_pct = 100.0 * (parking_m2 + paved_surface_m2) / operational_m2 if operational_m2 > 0 else 0.0
    paved_pct = min(paved_pct, 100.0)

    # Trailer capacity: parking-only area / 165m² per slot. Bias toward parking_m2 since
    # full industrial polygons would over-count buildings.
    trailer_count = int((parking_m2 + 0.4 * paved_surface_m2) / TRAILER_SLOT_M2) if parking_m2 + paved_surface_m2 > 0 else 0

    # Gate count: highway ways that intersect the perimeter of the industrial polygon.
    gate_nodes, gate_points = _count_gate_intersections(industrial_polys, highway_ways, return_points=True)

    # Confidence (spec):
    #   HIGH   — real OSM industrial polygon found (landuse=industrial OR a
    #            sizable industrial-tagged building).
    #   MEDIUM — only parking / generic buildings / paved surfaces; no
    #            industrial polygon, but enough operational signal to score.
    #   LOW    — nothing meaningful in OSM → deterministic fallback.
    has_industrial_polygon = industrial_m2 > 0 or industrial_building_m2 > 1000
    has_operational_signal = (parking_m2 + paved_surface_m2 + building_m2) > 500

    if has_industrial_polygon:
        confidence = 'HIGH'
    elif has_operational_signal:
        confidence = 'MEDIUM'
    else:
        confidence = 'LOW'

    if confidence == 'LOW':
        # Fall back to a deterministic estimate so YVS still produces a value.
        return _fallback(lat, lon, reason='no_industrial_polygon', overlay={
            'paved_area_m2': parking_m2 + paved_surface_m2,
            'parking_area_m2': parking_m2,
        })

    result = {
        'paved_area_pct': round(paved_pct, 1),
        'trailer_count': trailer_count,
        'gate_nodes': max(gate_nodes, 1),
        'paved_area_m2': round(parking_m2 + paved_surface_m2, 1),
        'parking_area_m2': round(parking_m2, 1),
        'industrial_m2': round(industrial_m2, 1),
        'industrial_building_m2': round(industrial_building_m2, 1),
        'building_m2': round(building_m2, 1),
        'confidence': confidence,
        'source': 'osm',
    }
    if include_geometry:
        result['geometry'] = {
            'industrial': industrial_polys,
            'parking': parking_polys,
            'paved_surface': paved_polys,
            'buildings': building_polys,
            'gate_points': gate_points,
        }
    return result


def _count_gate_intersections(polys: List[List[dict]], highways: List[dict], return_points: bool = False):
    """Approximate gate count: number of highway ways whose endpoints are inside one
    industrial polygon and outside it (or vice versa).

    Returns (count, gate_points) when return_points=True, else just count.
    """
    if not polys or not highways:
        return (0, []) if return_points else 0
    count = 0
    seen_ways = set()
    gate_points: List[Dict] = []
    for way in highways:
        geom = way.get('geometry') or []
        if len(geom) < 2:
            continue
        for poly in polys:
            inside_first = _point_in_poly(geom[0], poly)
            inside_last = _point_in_poly(geom[-1], poly)
            if inside_first != inside_last:
                wid = way.get('id')
                if wid not in seen_ways:
                    seen_ways.add(wid)
                    count += 1
                    boundary_pt = geom[0] if inside_last else geom[-1]
                    gate_points.append({'lat': boundary_pt['lat'], 'lon': boundary_pt['lon']})
                break
    return (count, gate_points) if return_points else count


def _point_in_poly(pt: dict, poly: List[dict]) -> bool:
    x, y = pt['lon'], pt['lat']
    inside = False
    n = len(poly)
    for i in range(n):
        a = poly[i]
        b = poly[(i + 1) % n]
        ax, ay = a['lon'], a['lat']
        bx, by = b['lon'], b['lat']
        if ((ay > y) != (by > y)) and (x < (bx - ax) * (y - ay) / ((by - ay) or 1e-12) + ax):
            inside = not inside
    return inside


def _fallback(lat: float, lon: float, reason: str, overlay: Optional[Dict] = None) -> Dict:
    """Deterministic fallback when OSM has no industrial polygon at this location.

    Uses a hashed-but-stable estimate so the same coords always score the same.
    Marked LOW confidence so downstream UI can flag it for human review.
    """
    seed = abs(hash((round(lat, 4), round(lon, 4)))) % 1_000_000
    paved = 55 + (seed % 30)            # 55-84%
    trailers = 40 + (seed % 60)         # 40-99
    gates = 1 + (seed % 3)              # 1-3
    out = {
        'paved_area_pct': float(paved),
        'trailer_count': trailers,
        'gate_nodes': gates,
        'paved_area_m2': 0.0,
        'parking_area_m2': 0.0,
        'industrial_m2': 0.0,
        'industrial_building_m2': 0.0,
        'building_m2': 0.0,
        'confidence': 'LOW',
        'source': f'fallback:{reason}',
    }
    if overlay:
        out.update(overlay)
    return out
