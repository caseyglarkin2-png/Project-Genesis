"""Push YVS results back to HubSpot company records.

Looks up a company by domain (HubSpot search), then PATCHes the 9 YardFlow
Dragnet custom properties onto the existing record. If no match is found,
prints a warning and skips (we don't want to spam-create company records).
"""

from __future__ import annotations

import datetime as dt
import os
from typing import Dict, List, Optional

import requests

HS_TOKEN = os.environ.get('HUBSPOT_PRIVATE_APP_TOKEN')


def _headers() -> Dict[str, str]:
    return {
        'Authorization': f'Bearer {HS_TOKEN}',
        'Content-Type': 'application/json',
    }


def find_company_by_domain(domain: str) -> Optional[int]:
    """Return the HubSpot company id for the given domain, or None."""
    if not HS_TOKEN:
        return None
    url = 'https://api.hubapi.com/crm/v3/objects/companies/search'
    body = {
        'filterGroups': [{'filters': [{'propertyName': 'domain', 'operator': 'EQ', 'value': domain}]}],
        'properties': ['domain', 'name'],
        'limit': 1,
    }
    resp = requests.post(url, headers=_headers(), json=body, timeout=20)
    if not resp.ok:
        print(f'  [HS] search failed for {domain}: {resp.status_code} {resp.text[:200]}')
        return None
    results = resp.json().get('results', [])
    return int(results[0]['id']) if results else None


def push_company_yvs(domain: str, summary: Dict, dossier_url: str) -> bool:
    """Push the YVS summary onto the HubSpot company record. Returns True on success.

    `summary` shape (from /api/score_company):
      {
        'yvs_score': float,
        'classification': 'WHALE'|'STANDARD'|'LOW',
        'yard_count': int,
        'paved_area_total_m2': float,
        'trailer_capacity_est': int,
        'dock_doors_est': int,
        'primary_freight_type': str,
      }
    """
    if not HS_TOKEN:
        print('  [HS] HUBSPOT_PRIVATE_APP_TOKEN not set; skipping push.')
        return False

    company_id = find_company_by_domain(domain)
    if not company_id:
        print(f'  [HS] no company found for domain={domain}; skipping.')
        return False

    props = {
        'yvs_score': str(round(summary['yvs_score'], 1)),
        'yvs_classification': summary['classification'],
        'yard_count': str(summary['yard_count']),
        'paved_area_total_m2': str(round(summary.get('paved_area_total_m2', 0), 1)),
        'trailer_capacity_est': str(summary.get('trailer_capacity_est', 0)),
        'dock_doors_est': str(summary.get('dock_doors_est', 0)),
        'primary_freight_type': summary.get('primary_freight_type', ''),
        'yardflow_dossier_url': dossier_url,
        'yvs_last_scored_at': dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    }
    url = f'https://api.hubapi.com/crm/v3/objects/companies/{company_id}'
    resp = requests.patch(url, headers=_headers(), json={'properties': props}, timeout=20)
    if resp.ok:
        print(f'  [HS] updated company {company_id} ({domain}) — YVS {props["yvs_score"]}')
        return True
    print(f'  [HS] update failed for {domain}: {resp.status_code} {resp.text[:200]}')
    return False
