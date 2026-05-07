"""Google Sheets writeback for the Digital Dragnet.

Two outputs:
  1. Append/update the "Dossier Link" column on the canonical YardFlow TAM Hitlist
     (sheet id `1a7S_E3TROYoSjQNDmOxgRu3C6MgZrXl2bQlyN0zFyqg`).
  2. Maintain a "YardFlow YVS Detail — one row per yard" sheet (created if missing)
     with per-yard YVS results (rank, domain, name, lat, lon, score, classification,
     trailers, paved %, gates, confidence, dossier_url, scored_at).

Auth: needs a Google service account with Sheets API access. Set
`GOOGLE_APPLICATION_CREDENTIALS` to the JSON key file, or set
`GENESIS_SHEETS_SERVICE_ACCOUNT_JSON` to the JSON contents directly.

Share the canonical TAM Hitlist with the service account's `client_email` as Editor
before running.

Usage from run_anchors.py: this module is called when --push-drive is passed.
"""

from __future__ import annotations

import datetime as dt
import json
import os
from typing import Dict, List, Optional

try:
    import gspread
    from google.oauth2.service_account import Credentials
    HAS_GSPREAD = True
except ImportError:
    HAS_GSPREAD = False

TAM_HITLIST_ID = '1a7S_E3TROYoSjQNDmOxgRu3C6MgZrXl2bQlyN0zFyqg'
DETAIL_SHEET_TITLE = 'YardFlow YVS Detail'

DETAIL_HEADERS = [
    'rank', 'domain', 'company', 'yard_name', 'address', 'lat', 'lon',
    'yvs', 'classification', 'trailers', 'paved_pct', 'gates',
    'confidence', 'source', 'dossier_url', 'scored_at',
]

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
]


def _client() -> Optional['gspread.Client']:
    if not HAS_GSPREAD:
        print('  [Drive] gspread not installed. pip install gspread google-auth')
        return None

    raw = os.environ.get('GENESIS_SHEETS_SERVICE_ACCOUNT_JSON')
    if raw:
        info = json.loads(raw)
        creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    else:
        path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if not path or not os.path.exists(path):
            print('  [Drive] No service account JSON. Set GOOGLE_APPLICATION_CREDENTIALS or GENESIS_SHEETS_SERVICE_ACCOUNT_JSON.')
            return None
        creds = Credentials.from_service_account_file(path, scopes=SCOPES)

    return gspread.authorize(creds)


def update_hitlist_dossier(domain: str, dossier_url: str, summary: Dict) -> bool:
    """Find the row for `domain` in the TAM Hitlist and update its Dossier Link column.

    The hitlist's first column is "Company Name" and second is "Website URL". We
    match on the website URL containing the domain.
    """
    client = _client()
    if not client:
        return False

    try:
        sh = client.open_by_key(TAM_HITLIST_ID)
        ws = sh.sheet1
    except Exception as e:
        print(f'  [Drive] cannot open TAM Hitlist: {e}')
        return False

    rows = ws.get_all_values()
    if not rows:
        return False

    headers = rows[0]
    try:
        url_col = next(i for i, h in enumerate(headers) if 'website' in h.lower() or 'url' in h.lower())
    except StopIteration:
        url_col = 1
    try:
        dossier_col = next(i for i, h in enumerate(headers) if 'dossier' in h.lower())
    except StopIteration:
        dossier_col = len(headers) - 1

    target = domain.lower()
    for idx, row in enumerate(rows[1:], start=2):
        if url_col < len(row) and target in (row[url_col] or '').lower():
            cell_a1 = gspread.utils.rowcol_to_a1(idx, dossier_col + 1)
            ws.update(cell_a1, [[dossier_url]])
            print(f'  [Drive] Hitlist row {idx} ({domain}) → Dossier Link updated')
            return True

    print(f'  [Drive] no Hitlist row found for {domain}; skipped')
    return False


def append_yard_details(rows_in: List[Dict]) -> bool:
    """Append per-yard rows to the YardFlow YVS Detail sheet (creates it if missing).

    Each item in rows_in is the per-yard dict returned by run_anchors.score_domain's
    yards list (plus domain, company), normalized to DETAIL_HEADERS.
    """
    client = _client()
    if not client or not rows_in:
        return False

    try:
        sh = client.open(DETAIL_SHEET_TITLE)
    except gspread.SpreadsheetNotFound:
        sh = client.create(DETAIL_SHEET_TITLE)
        sh.sheet1.append_row(DETAIL_HEADERS)
        print(f'  [Drive] created new sheet "{DETAIL_SHEET_TITLE}" — share it with relevant users.')

    ws = sh.sheet1
    existing = ws.get_all_values()
    if not existing:
        ws.append_row(DETAIL_HEADERS)

    payload = [[r.get(h, '') for h in DETAIL_HEADERS] for r in rows_in]
    ws.append_rows(payload, value_input_option='USER_ENTERED')
    print(f'  [Drive] appended {len(payload)} yard rows to "{DETAIL_SHEET_TITLE}"')
    return True


def yard_to_detail_row(domain: str, company: str, rank: int, yard: Dict, dossier_url: str) -> Dict:
    """Normalize a yard dict from run_anchors into a DETAIL_HEADERS-keyed row."""
    return {
        'rank': rank,
        'domain': domain,
        'company': company,
        'yard_name': yard.get('name', ''),
        'address': yard.get('address', ''),
        'lat': yard.get('lat', ''),
        'lon': yard.get('lon', ''),
        'yvs': yard.get('score', ''),
        'classification': yard.get('classification', ''),
        'trailers': yard.get('trailer_count', yard.get('details', {}).get('trailers', '')),
        'paved_pct': yard.get('paved_area_pct', yard.get('details', {}).get('paved_pct', '')),
        'gates': yard.get('gate_nodes', yard.get('details', {}).get('gates', '')),
        'confidence': yard.get('confidence', ''),
        'source': yard.get('source', ''),
        'dossier_url': dossier_url,
        'scored_at': dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    }
