"""Domain → yard network discovery.

Given a company domain (e.g. 'primobrands.com') return a list of probable
facilities: name, address, lat, lon, source, discovery_confidence.

Multi-source pipeline:
  1. PRIMARY — OSM Nominatim (free, no key). For each known company alias
     (sub-brand) × each generic facility-type term, run one bounded search
     across the NAFTA bbox. Rate-limited 1 req/sec, cached 30 days.
  2. SECONDARY — Mapbox Geocoding (filtered). Strict POI/industrial filter,
     name must match a known alias, residential/retail/hotel/restaurant
     and bare-address results are rejected.
  3. Combine + dedupe at 500m clusters (highest-confidence kept), cap at 50.

All external calls go through cache.py (30-day TTL).
"""

from __future__ import annotations

import math
import os
import time
from typing import Dict, List, Optional
from urllib.parse import quote

import requests

import cache

MAPBOX_TOKEN = (
    os.environ.get('MAPBOX_TOKEN')
    or os.environ.get('NEXT_PUBLIC_MAPBOX_TOKEN')
    or os.environ.get('MAPBOX_PUBLIC_TOKEN')
)

# W,S,E,N (lon_min, lat_min, lon_max, lat_max) — Mexico, US, Canada
NAFTA_BBOX = '-141.0,14.5,-52.0,72.0'

NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
NOMINATIM_USER_AGENT = 'YardFlow-Genesis/1.0 (yardflow.ai)'
NOMINATIM_DELAY_S = 1.1
NOMINATIM_NS = 'nominatim'
NOMINATIM_TTL_S = 60 * 60 * 24 * 30  # 30 days

MAPBOX_NS = 'mapbox_geocode'
MAX_RESULTS_PER_HINT = 10

DEDUPE_RADIUS_M = 500
MAX_FACILITIES = 50
MAX_NAMES_PER_DOMAIN = 5  # bound first-run cost: top N aliases used for searching

EARTH_R = 6_371_000

# Generic facility-type terms — combined with each alias for Nominatim queries.
FACILITY_TERMS = [
    'distribution center',
    'warehouse',
    'DC',
    'terminal',
    'freight terminal',
    'manufacturing',
    'manufacturing plant',
    'bottling plant',
    'production facility',
    'fulfillment center',
    'cross-dock',
    'intermodal',
    'truck terminal',
    'service center',
    'logistics center',
]

# OSM Nominatim `type` field values that indicate an industrial/distribution site.
NOMINATIM_INDUSTRIAL_TYPES = {
    'industrial', 'warehouse', 'factory', 'manufacture', 'commercial',
    'logistics', 'depot', 'hub', 'terminal', 'plot', 'distribution',
    'plant', 'brewery', 'bottling', 'freight', 'parcel',
}

# OSM Nominatim `type` values we explicitly reject (consumer-facing or unrelated).
NOMINATIM_REJECTED_TYPES = {
    'vending_machine', 'retail', 'convenience', 'mall', 'fuel',
    'food', 'restaurant', 'hotel', 'motel', 'residential', 'house',
    'apartment', 'school', 'university', 'hospital', 'clinic', 'church',
    'park', 'gym', 'fitness', 'salon', 'shop', 'supermarket', 'cafe',
    'pharmacy', 'fast_food', 'bar', 'pub', 'theater', 'museum',
}

# Display-name keyword fallback when OSM `type` is generic (e.g. 'yes', 'building').
DISPLAY_NAME_INDUSTRIAL_HINTS = (
    'distribution', 'warehouse', 'logistics', 'industrial', 'plant',
    'manufacturing', 'factory', 'depot', 'terminal', 'hub', 'fulfillment',
    'cross-dock', 'sortation', 'service center', 'freight', 'cold storage',
)

# Mapbox response category fragments that indicate an industrial/distribution site.
ACCEPT_CATEGORY_KEYWORDS = (
    'warehouse', 'industrial', 'factory', 'building', 'distribution',
    'manufacturing', 'logistics', 'depot', 'terminal', 'plant', 'freight',
    'office', 'company',  # corporate parks often house DCs
)

# Mapbox response category fragments we explicitly reject.
REJECT_CATEGORY_KEYWORDS = (
    'residential', 'house', 'apartment', 'condo', 'dormitory',
    'hotel', 'lodging', 'motel', 'inn', 'hostel', 'resort',
    'restaurant', 'cafe', 'bar', 'pub', 'food', 'fast food', 'diner',
    'retail', 'shop', 'store', 'mall', 'boutique', 'market',
    'school', 'university', 'hospital', 'clinic', 'church', 'temple',
    'park', 'garden', 'gym', 'fitness', 'salon', 'theater', 'museum',
)

# Per-domain aliases (sub-brand list). The first entry is the canonical brand.
# Used both for searching (top MAX_NAMES_PER_DOMAIN entries) and filtering.
ANCHOR_HINTS: Dict[str, Dict[str, List[str]]] = {
    'primobrands.com': {'aliases': [
        'Primo Water', 'Primo Brands', 'ReadyRefresh', 'BlueTriton',
        'Poland Spring', 'Deer Park', 'Arrowhead', 'Ozarka',
        'Crystal Springs', 'Mountain Valley', 'Zephyrhills',
    ]},
    'pepsico.com': {'aliases': [
        'PepsiCo', 'Frito-Lay', 'Pepsi Bottling', 'Quaker',
        'Gatorade', 'Tropicana', 'Pepsi-Cola',
    ]},
    'americold.com': {'aliases': ['Americold']},
    'lineagelogistics.com': {'aliases': ['Lineage Logistics', 'Lineage']},
    'xpo.com': {'aliases': ['XPO Logistics', 'XPO']},
    'usfoods.com': {'aliases': ['US Foods']},
    'dollargeneral.com': {'aliases': ['Dollar General']},
    'cswg.com': {'aliases': ['C&S Wholesale Grocers', 'C&S']},
    'tysonfoods.com': {'aliases': ['Tyson Foods', 'Tyson', 'Hillshire Brands', 'Jimmy Dean', 'Ball Park']},
    'fedex.com': {'aliases': ['FedEx', 'FedEx Ground', 'FedEx Freight', 'FedEx Express']},
    'sysco.com': {'aliases': ['Sysco']},
    'walmart.com': {'aliases': ['Walmart', "Sam's Club", 'Sams Club', 'Walmart Supply Chain']},
    'thekrogerco.com': {'aliases': ['Kroger', 'Fred Meyer', 'Ralphs', 'Smiths Food', 'Harris Teeter', 'Fry\'s Food']},
    'costco.com': {'aliases': ['Costco', 'Costco Wholesale']},
    'amazon.com': {'aliases': [
        'Amazon', 'Amazon Fulfillment', 'Amazon Sortation',
        'Amazon Delivery', 'Amazon Logistics',
    ]},
    'odfl.com': {'aliases': ['Old Dominion', 'ODFL', 'Old Dominion Freight Line']},
    'jbhunt.com': {'aliases': ['J.B. Hunt', 'JB Hunt']},
    'knight-swift.com': {'aliases': ['Knight-Swift', 'Knight Transportation', 'Swift Transportation']},
    'penske.com': {'aliases': ['Penske Logistics', 'Penske']},
    'dhl.com': {'aliases': ['DHL Supply Chain', 'DHL']},
    'coca-colacompany.com': {'aliases': ['Coca-Cola', 'Coca-Cola Consolidated', 'Coca-Cola Bottling']},
    'target.com': {'aliases': ['Target']},
    'homedepot.com': {'aliases': ['Home Depot', 'The Home Depot']},
    'generalmills.com': {'aliases': ['General Mills']},
    'jnj.com': {'aliases': ['Johnson & Johnson', 'J&J', 'Janssen']},
    'pg.com': {'aliases': ['Procter & Gamble', 'P&G']},
    'nestleusa.com': {'aliases': ['Nestle', 'Nestlé', 'Nestle USA']},
    'mclaneco.com': {'aliases': ['McLane', 'McLane Foodservice']},
    'schneider.com': {'aliases': ['Schneider National', 'Schneider']},
    'estes-express.com': {'aliases': ['Estes Express', 'Estes']},
    'lowes.com': {'aliases': ["Lowe's", 'Lowes']},
    'albertsons.com': {'aliases': ['Albertsons', 'Safeway', 'Vons', 'Jewel-Osco', "Shaw's"]},
    'bestbuy.com': {'aliases': ['Best Buy']},
    'autozone.com': {'aliases': ['AutoZone']},
    'ups.com': {'aliases': ['UPS', 'United Parcel Service', 'UPS Worldport']},
    'gxo.com': {'aliases': ['GXO Logistics', 'GXO']},
    'ryder.com': {'aliases': ['Ryder']},
    'cardinalhealth.com': {'aliases': ['Cardinal Health']},
    'cvs.com': {'aliases': ['CVS', 'CVS Pharmacy', 'CVS Health']},
    'wayfair.com': {'aliases': ['Wayfair', 'CastleGate']},
    'unfi.com': {'aliases': ['UNFI', 'United Natural Foods']},
    'stellantis.com': {'aliases': ['Mopar', 'Stellantis', 'Chrysler', 'Dodge', 'Jeep', 'Ram']},
    'ab-inbev.com': {'aliases': ['Anheuser-Busch', 'Budweiser', 'AB-InBev']},
    'tesla.com': {'aliases': ['Tesla', 'Tesla Gigafactory']},
    'nfiindustries.com': {'aliases': ['NFI Industries', 'NFI']},
    'ford.com': {'aliases': ['Ford', 'Ford Motor', 'Ford Parts']},
}


def _company_aliases(domain: str) -> List[str]:
    entry = ANCHOR_HINTS.get(domain)
    if entry and entry.get('aliases'):
        return entry['aliases']
    base = domain.split('.')[0].replace('-', ' ').title()
    return [base]


def _haversine_m(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    dlat = math.radians(b_lat - a_lat)
    dlon = math.radians(b_lon - a_lon)
    h = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(a_lat)) * math.cos(math.radians(b_lat)) * math.sin(dlon / 2) ** 2)
    return 2 * EARTH_R * math.asin(math.sqrt(h))


# ── Nominatim primary ───────────────────────────────────────────────────────

_last_nominatim_call = [0.0]


def _nominatim_search(query: str) -> List[dict]:
    cached = cache.get(NOMINATIM_NS, query.lower())
    if cached is not None:
        return cached

    elapsed = time.time() - _last_nominatim_call[0]
    if elapsed < NOMINATIM_DELAY_S:
        time.sleep(NOMINATIM_DELAY_S - elapsed)
    _last_nominatim_call[0] = time.time()

    params = {
        'q': query,
        'format': 'jsonv2',
        'viewbox': NAFTA_BBOX,
        'bounded': '1',
        'limit': '10',
    }
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params=params,
            headers={'User-Agent': NOMINATIM_USER_AGENT},
            timeout=20,
        )
        resp.raise_for_status()
        results = resp.json() or []
    except Exception as e:
        print(f'  [Discovery/Nominatim] failed for {query!r}: {e}')
        return []

    cache.set(NOMINATIM_NS, query.lower(), results, ttl_seconds=NOMINATIM_TTL_S)
    return results


def _accept_nominatim(item: dict) -> bool:
    """True if this Nominatim result looks like an industrial/distribution site.

    Hard-rejects consumer types (retail, vending, restaurant, hotel, etc.).
    Accepts known industrial OSM types outright; for generic types ('yes',
    'building') falls back to display-name keyword scan.
    """
    typ = (item.get('type') or '').lower()
    if typ in NOMINATIM_REJECTED_TYPES:
        return False
    if typ in NOMINATIM_INDUSTRIAL_TYPES:
        return True
    display = (item.get('display_name') or '').lower()
    return any(k in display for k in DISPLAY_NAME_INDUSTRIAL_HINTS)


def _nominatim_to_facility(item: dict, source_query: str, aliases_lower: List[str]) -> Optional[Dict]:
    try:
        lat = float(item['lat'])
        lon = float(item['lon'])
    except (KeyError, TypeError, ValueError):
        return None

    display = item.get('display_name', '') or ''
    name = display.split(',')[0].strip() or item.get('name', '') or 'Unknown'

    # Sanity guard: result must mention a known alias somewhere in the display name.
    if not any(a in display.lower() for a in aliases_lower):
        return None

    if not _accept_nominatim(item):
        return None

    return {
        'name': name,
        'address': display,
        'lat': lat,
        'lon': lon,
        'source': f'nominatim:{source_query}',
        'osm_type': item.get('osm_type'),
        'osm_class': item.get('class'),
        'osm_category': item.get('type'),
        'importance': item.get('importance', 0),
        'discovery_confidence': 'HIGH',
    }


# ── Mapbox secondary ────────────────────────────────────────────────────────

def _mapbox_geocode(query: str) -> List[dict]:
    if not MAPBOX_TOKEN:
        return []
    cached = cache.get(MAPBOX_NS, query.lower())
    if cached is not None:
        return cached

    url = (
        'https://api.mapbox.com/geocoding/v5/mapbox.places/'
        f'{quote(query)}.json'
        f'?bbox={NAFTA_BBOX}'
        f'&limit={MAX_RESULTS_PER_HINT}'
        '&types=poi,address'
        f'&access_token={MAPBOX_TOKEN}'
    )
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        features = resp.json().get('features', [])
    except Exception as e:
        print(f'  [Discovery/Mapbox] failed for {query!r}: {e}')
        return []
    cache.set(MAPBOX_NS, query.lower(), features)
    return features


def _passes_mapbox_filter(feat: dict, aliases_lower: List[str]) -> bool:
    place_types = [pt.lower() for pt in (feat.get('place_type') or [])]
    props = feat.get('properties') or {}
    cat_str = (props.get('category') or '').lower()

    if any(rk in cat_str for rk in REJECT_CATEGORY_KEYWORDS):
        return False

    is_poi = 'poi' in place_types
    has_industrial_cat = any(ak in cat_str for ak in ACCEPT_CATEGORY_KEYWORDS)
    if not (is_poi or has_industrial_cat):
        return False

    text = (feat.get('text') or '').lower()
    place_name = (feat.get('place_name') or '').lower()
    blob = text + ' || ' + place_name
    if not any(a in blob for a in aliases_lower):
        return False

    return True


def _mapbox_to_facility(feat: dict, source_query: str) -> Optional[Dict]:
    center = feat.get('center')
    if not center or len(center) != 2:
        return None
    return {
        'name': feat.get('text') or feat.get('place_name') or source_query,
        'address': feat.get('place_name', ''),
        'lat': center[1],
        'lon': center[0],
        'source': f'mapbox:{source_query}',
        'mapbox_id': feat.get('id'),
        'place_type': feat.get('place_type', []),
        'relevance': feat.get('relevance', 0),
        'discovery_confidence': 'MEDIUM',
    }


# ── Public API ──────────────────────────────────────────────────────────────

def discover_facilities(domain: str) -> List[Dict]:
    """Return a deduped list of probable facility records for the given domain."""
    domain = domain.strip().lower()
    if domain.startswith('www.'):
        domain = domain[4:]
    aliases = _company_aliases(domain)
    aliases_lower = [a.lower() for a in aliases]
    search_names = aliases[:MAX_NAMES_PER_DOMAIN]

    raw: List[Dict] = []

    # PRIMARY — Nominatim. Two passes:
    #   (a) brand-only search for each alias, keeping only OSM industrial types
    #       (covers Walmart-style sites that ARE in OSM as `type=industrial`
    #       but never matched by `{brand} distribution center` text search).
    #   (b) `{brand} {facility-type}` search across all FACILITY_TERMS for
    #       sites that ARE explicitly named (e.g. "Walmart Distribution Center").
    for name in search_names:
        for item in _nominatim_search(name):
            f = _nominatim_to_facility(item, name, aliases_lower)
            if f:
                raw.append(f)
        for term in FACILITY_TERMS:
            q = f'{name} {term}'
            for item in _nominatim_search(q):
                f = _nominatim_to_facility(item, q, aliases_lower)
                if f:
                    raw.append(f)

    # SECONDARY — Mapbox (filtered). Bias to broad terms to keep query count small.
    mapbox_terms = ['distribution center', 'warehouse', 'plant', 'terminal']
    for name in search_names[:3]:
        for term in mapbox_terms:
            q = f'{name} {term}'
            for feat in _mapbox_geocode(q):
                if _passes_mapbox_filter(feat, aliases_lower):
                    f = _mapbox_to_facility(feat, q)
                    if f:
                        raw.append(f)

    return _dedupe(raw)[:MAX_FACILITIES]


def _dedupe(facilities: List[Dict]) -> List[Dict]:
    """Collapse pins within DEDUPE_RADIUS_M; keep highest discovery_confidence."""
    rank = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}

    def conf_score(f):
        return (
            rank.get(f.get('discovery_confidence', 'LOW'), 1),
            f.get('importance', 0) or f.get('relevance', 0) or 0,
        )

    facilities.sort(key=conf_score, reverse=True)
    keep: List[Dict] = []
    for f in facilities:
        too_close = any(
            _haversine_m(f['lat'], f['lon'], k['lat'], k['lon']) < DEDUPE_RADIUS_M
            for k in keep
        )
        if not too_close:
            keep.append(f)
    return keep
