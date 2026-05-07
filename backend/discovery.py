"""Domain → yard network discovery.

Given a company domain (e.g. 'primobrands.com') return a list of probable
facilities: name, address, lat, lon, source.

Strategy (all free / already-paid for; no new API keys):
  1. Look up the domain against the bundled TAM_ANCHORS hitlist for high-quality
     search hints (e.g. 'PepsiCo distribution center', 'Frito-Lay distribution').
  2. For each hint, hit the Mapbox Geocoding API with `proximity=ip` and the
     NAFTA bbox. Mapbox already powers the frontend so the token is in env.
  3. Dedupe by lat/lon proximity (≤500m clusters get collapsed).
  4. If we have zero hits, fall back to one geocode of the bare company name.
"""

from __future__ import annotations

import json
import math
import os
from typing import Dict, List, Optional
from urllib.parse import quote

import requests

import cache

MAPBOX_TOKEN = (
    os.environ.get('MAPBOX_TOKEN')
    or os.environ.get('NEXT_PUBLIC_MAPBOX_TOKEN')
    or os.environ.get('MAPBOX_PUBLIC_TOKEN')
)
NAFTA_BBOX = '-141.0,14.5,-52.0,72.0'  # rough W,S,E,N covering Mexico, US, Canada
MAX_RESULTS_PER_HINT = 10
DEDUPE_RADIUS_M = 500

EARTH_R = 6_371_000

# Bundled fallback hints for known anchors. Mirrors src/data/tam-anchors.ts so the
# backend can run without reading TS. Keep in sync if anchors change.
ANCHOR_HINTS: Dict[str, List[str]] = {
    'primobrands.com': ['Primo Water plant', 'ReadyRefresh depot'],
    'pepsico.com': ['PepsiCo distribution center', 'Frito-Lay distribution', 'Pepsi bottling plant'],
    'americold.com': ['Americold cold storage', 'Americold warehouse'],
    'lineagelogistics.com': ['Lineage Logistics warehouse', 'Lineage cold storage'],
    'xpo.com': ['XPO Logistics terminal', 'XPO service center'],
    'usfoods.com': ['US Foods distribution', 'US Foods DC'],
    'dollargeneral.com': ['Dollar General distribution center'],
    'cswg.com': ['C&S Wholesale Grocers warehouse'],
    'tysonfoods.com': ['Tyson Foods plant', 'Tyson Foods distribution'],
    'fedex.com': ['FedEx Ground hub', 'FedEx station', 'FedEx Freight terminal'],
    'sysco.com': ['Sysco distribution center'],
    'walmart.com': ['Walmart distribution center', 'Walmart fulfillment center', 'Sams Club distribution'],
    'thekrogerco.com': ['Kroger distribution center'],
    'costco.com': ['Costco depot', 'Costco distribution'],
    'amazon.com': ['Amazon fulfillment center', 'Amazon sortation center', 'Amazon delivery station'],
    'odfl.com': ['Old Dominion service center', 'ODFL terminal'],
    'jbhunt.com': ['J.B. Hunt terminal', 'J.B. Hunt cross-dock'],
    'knight-swift.com': ['Knight-Swift terminal', 'Swift Transportation terminal'],
    'penske.com': ['Penske Logistics warehouse'],
    'dhl.com': ['DHL Supply Chain warehouse'],
    'coca-colacompany.com': ['Coca-Cola bottling plant', 'Coca-Cola distribution'],
    'target.com': ['Target distribution center', 'Target sortation center'],
    'homedepot.com': ['Home Depot distribution center', 'Home Depot RDC'],
    'generalmills.com': ['General Mills plant', 'General Mills distribution'],
    'jnj.com': ['Johnson & Johnson plant', 'J&J distribution'],
    'pg.com': ['Procter & Gamble plant', 'P&G distribution center'],
    'nestleusa.com': ['Nestle plant', 'Nestle distribution'],
    'mclaneco.com': ['McLane distribution center', 'McLane Foodservice'],
    'schneider.com': ['Schneider National terminal', 'Schneider service center'],
    'estes-express.com': ['Estes Express service center'],
    'lowes.com': ["Lowe's distribution center", "Lowe's RDC"],
    'albertsons.com': ['Albertsons distribution', 'Safeway distribution center'],
    'bestbuy.com': ['Best Buy distribution center', 'Best Buy DDC'],
    'autozone.com': ['AutoZone distribution center', 'AutoZone mega hub'],
    'ups.com': ['UPS hub', 'UPS package center'],
    'gxo.com': ['GXO Logistics warehouse'],
    'ryder.com': ['Ryder warehouse', 'Ryder logistics center'],
    'cardinalhealth.com': ['Cardinal Health distribution'],
    'cvs.com': ['CVS distribution center'],
    'wayfair.com': ['Wayfair CastleGate warehouse'],
    'unfi.com': ['UNFI distribution center', 'United Natural Foods warehouse'],
    'stellantis.com': ['Mopar parts distribution'],
    'ab-inbev.com': ['Anheuser-Busch brewery', 'Anheuser-Busch distribution'],
    'tesla.com': ['Tesla Gigafactory', 'Tesla service center'],
    'nfiindustries.com': ['NFI warehouse', 'NFI distribution', 'NFI logistics'],
    'ford.com': ['Ford parts distribution', 'Ford assembly plant'],
}


def _haversine_m(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    dlat = math.radians(b_lat - a_lat)
    dlon = math.radians(b_lon - a_lon)
    h = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(a_lat)) * math.cos(math.radians(b_lat)) * math.sin(dlon / 2) ** 2)
    return 2 * EARTH_R * math.asin(math.sqrt(h))


def _company_name_from_domain(domain: str) -> str:
    base = domain.split('.')[0]
    return base.replace('-', ' ').title()


def _mapbox_geocode(query: str) -> List[dict]:
    if not MAPBOX_TOKEN:
        print('  [Discovery] No Mapbox token configured; geocoding disabled.')
        return []

    cached = cache.get('mapbox_geocode', query.lower())
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
        print(f'  [Discovery] Mapbox geocode failed for {query!r}: {e}')
        return []

    cache.set('mapbox_geocode', query.lower(), features)
    return features


def discover_facilities(domain: str) -> List[Dict]:
    """Return a list of probable facility records for the given domain."""
    domain = domain.strip().lower().lstrip('www.')

    hints = ANCHOR_HINTS.get(domain) or [_company_name_from_domain(domain) + ' distribution center']

    raw: List[Dict] = []
    for hint in hints:
        for feat in _mapbox_geocode(hint):
            center = feat.get('center')  # [lon, lat]
            if not center or len(center) != 2:
                continue
            raw.append({
                'name': feat.get('text') or feat.get('place_name') or hint,
                'address': feat.get('place_name', ''),
                'lat': center[1],
                'lon': center[0],
                'source': f'mapbox:{hint}',
                'mapbox_id': feat.get('id'),
                'place_type': feat.get('place_type', []),
                'relevance': feat.get('relevance', 0),
            })

    return _dedupe(raw)


def _dedupe(facilities: List[Dict]) -> List[Dict]:
    """Collapse pins within DEDUPE_RADIUS_M of each other; keep the highest relevance."""
    facilities.sort(key=lambda f: f.get('relevance', 0), reverse=True)
    keep: List[Dict] = []
    for f in facilities:
        too_close = any(
            _haversine_m(f['lat'], f['lon'], k['lat'], k['lon']) < DEDUPE_RADIUS_M
            for k in keep
        )
        if not too_close:
            keep.append(f)
    return keep
