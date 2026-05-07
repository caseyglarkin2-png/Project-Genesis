"""One-shot setup: create the 9 custom YardFlow properties on HubSpot Companies.

Run once, with HUBSPOT_PRIVATE_APP_TOKEN exported in env. Idempotent — POSTing an
existing property name returns 409 which we ignore.

Usage:
    HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-xxxx python backend/setup_hubspot_properties.py
"""

from __future__ import annotations

import os
import sys
from typing import Dict, List

import requests

HS_TOKEN = os.environ.get('HUBSPOT_PRIVATE_APP_TOKEN')
GROUP_NAME = 'yardflow_dragnet'
GROUP_LABEL = 'YardFlow Dragnet'

PROPERTIES: List[Dict] = [
    {'name': 'yvs_score', 'label': 'YVS Score (0-100)', 'type': 'number', 'fieldType': 'number',
     'description': 'Yard Velocity Score from the Digital Dragnet (0-100). Higher = bigger whale.'},
    {'name': 'yvs_classification', 'label': 'YVS Classification', 'type': 'enumeration', 'fieldType': 'select',
     'description': 'WHALE / STANDARD / LOW tier from the Dragnet.',
     'options': [
         {'label': 'WHALE', 'value': 'WHALE', 'displayOrder': 0},
         {'label': 'STANDARD', 'value': 'STANDARD', 'displayOrder': 1},
         {'label': 'LOW', 'value': 'LOW', 'displayOrder': 2},
     ]},
    {'name': 'yard_count', 'label': 'Discovered Yard Count', 'type': 'number', 'fieldType': 'number',
     'description': 'Number of yards/facilities discovered for this company by the Digital Dragnet.'},
    {'name': 'paved_area_total_m2', 'label': 'Paved Area Total (m²)', 'type': 'number', 'fieldType': 'number',
     'description': 'Sum of measured paved/parking polygon area across all discovered yards.'},
    {'name': 'trailer_capacity_est', 'label': 'Trailer Capacity (est.)', 'type': 'number', 'fieldType': 'number',
     'description': 'Estimated total trailer slot capacity across all yards (parking m² ÷ 165).'},
    {'name': 'dock_doors_est', 'label': 'Dock Doors (est.)', 'type': 'number', 'fieldType': 'number',
     'description': 'Estimated dock door count across all discovered yards.'},
    {'name': 'primary_freight_type', 'label': 'Primary Freight Type', 'type': 'string', 'fieldType': 'text',
     'description': 'Dry van / reefer / bulk / flatbed / intermodal / LTL / parcel / mixed.'},
    {'name': 'yardflow_dossier_url', 'label': 'YardFlow Dossier URL', 'type': 'string', 'fieldType': 'text',
     'description': 'Link to the in-app facility map for this company (Project Genesis).'},
    {'name': 'yvs_last_scored_at', 'label': 'YVS Last Scored At', 'type': 'datetime', 'fieldType': 'date',
     'description': 'Timestamp of the last Dragnet run.'},
]


def _headers() -> Dict[str, str]:
    return {
        'Authorization': f'Bearer {HS_TOKEN}',
        'Content-Type': 'application/json',
    }


def ensure_group() -> None:
    url = 'https://api.hubapi.com/crm/v3/properties/companies/groups'
    body = {'name': GROUP_NAME, 'label': GROUP_LABEL, 'displayOrder': -1}
    resp = requests.post(url, headers=_headers(), json=body, timeout=20)
    if resp.status_code in (200, 201):
        print(f'✓ Created property group "{GROUP_LABEL}"')
    elif resp.status_code == 409:
        print(f'· Property group "{GROUP_LABEL}" already exists')
    else:
        print(f'✗ Group create failed ({resp.status_code}): {resp.text}')


def ensure_property(prop: Dict) -> None:
    url = 'https://api.hubapi.com/crm/v3/properties/companies'
    body = {**prop, 'groupName': GROUP_NAME}
    resp = requests.post(url, headers=_headers(), json=body, timeout=20)
    if resp.status_code in (200, 201):
        print(f'✓ Created property "{prop["name"]}"')
    elif resp.status_code == 409:
        print(f'· Property "{prop["name"]}" already exists')
    else:
        print(f'✗ Property "{prop["name"]}" create failed ({resp.status_code}): {resp.text}')


def main() -> int:
    if not HS_TOKEN:
        print('ERROR: HUBSPOT_PRIVATE_APP_TOKEN not set in env.')
        print('Create a HubSpot private app with crm.schemas.companies.write scope and export the token.')
        return 1
    ensure_group()
    for prop in PROPERTIES:
        ensure_property(prop)
    print('\nDone. Verify in HubSpot → Settings → Properties → Companies → "YardFlow Dragnet" group.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
