"""Bulk-score the 47 TAM anchors and (optionally) push results back to HubSpot.

Usage:
    python backend/run_anchors.py                # scores all anchors, prints CSV
    python backend/run_anchors.py --push         # also pushes to HubSpot (requires token)
    python backend/run_anchors.py --domain primobrands.com   # single anchor
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from typing import List

from discovery import ANCHOR_HINTS, discover_facilities
from dragnet import calculate_velocity_score, classify_facility
from overpass_scoring import measure_facility

PROSPECT_URL_BASE = os.environ.get('GENESIS_FRONTEND', 'https://project-genesis-three.vercel.app')


def score_domain(domain: str):
    facilities = discover_facilities(domain)
    if not facilities:
        return None
    yards = []
    paved_m2 = 0.0
    trailer_total = 0
    gate_total = 0
    for f in facilities:
        m = measure_facility(f['lat'], f['lon'])
        score = calculate_velocity_score(m['paved_area_pct'], m['trailer_count'], m['gate_nodes'])
        cls = classify_facility(score)
        yards.append({**f, 'score': round(score, 1), 'classification': cls['label'], **m})
        paved_m2 += m.get('paved_area_m2', 0) or 0
        trailer_total += m['trailer_count']
        gate_total += m['gate_nodes']

    yards.sort(key=lambda y: y['score'], reverse=True)
    top = yards[0]
    avg = sum(y['score'] for y in yards) / len(yards)
    summary = {
        'domain': domain,
        'yard_count': len(yards),
        'top_score': top['score'],
        'avg_score': round(avg, 1),
        'top_classification': top['classification'],
        'paved_area_total_m2': round(paved_m2, 1),
        'trailer_capacity_est': trailer_total,
        'dock_doors_est': max(int(trailer_total * 0.15), 1),  # rough proxy
        'classification': classify_facility(avg)['label'],
        'yvs_score': round(avg, 1),
        'dossier_url': f'{PROSPECT_URL_BASE}/prospect?domain={domain}',
    }
    return summary, yards


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--domain', help='Run a single domain instead of all anchors')
    parser.add_argument('--push', action='store_true', help='Push aggregate YVS to HubSpot')
    parser.add_argument('--push-drive', action='store_true', help='Append to TAM Hitlist + per-yard Drive sheet')
    parser.add_argument('--out', default='backend/anchor_scores.csv', help='Output CSV path')
    args = parser.parse_args(argv)

    domains = [args.domain] if args.domain else list(ANCHOR_HINTS.keys())

    rows = []
    detail_rows: List[dict] = []
    for domain in domains:
        print(f'\n=== {domain} ===')
        result = score_domain(domain)
        if not result:
            print(f'  no facilities discovered for {domain}; skipping')
            continue
        summary, yards = result
        print(f"  {summary['yard_count']} yards, top YVS {summary['top_score']} ({summary['top_classification']}), avg {summary['avg_score']}")
        rows.append(summary)

        if args.push:
            from hubspot_writer import push_company_yvs
            push_company_yvs(domain, summary, summary['dossier_url'])

        if args.push_drive:
            from drive_writer import update_hitlist_dossier, yard_to_detail_row
            update_hitlist_dossier(domain, summary['dossier_url'], summary)
            for rank, yard in enumerate(yards, start=1):
                detail_rows.append(yard_to_detail_row(domain, domain, rank, yard, summary['dossier_url']))

    if args.push_drive and detail_rows:
        from drive_writer import append_yard_details
        append_yard_details(detail_rows)

    if rows:
        with open(args.out, 'w', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
        print(f'\nWrote {len(rows)} rows → {args.out}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
