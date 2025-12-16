"""
================================================================================
PROJECT GENESIS - BATCH DIGITAL DRAGNET ("WHALE HUNTING" PIPELINE)
================================================================================

This script automates the "Digital Dragnet" reconnaissance process across
multiple logistics facilities. It's designed to be run against target lists
(e.g., all Costco DCs, Primo Water facilities) to identify high-value
automation prospects ("Whales").

USAGE:
    python batch_dragnet.py                    # Run with default targets
    python batch_dragnet.py --csv targets.csv  # Run with custom CSV

OUTPUT:
    - Console report with sorted rankings
    - JSON file with full results for CRM import
    - CSV export for sales team

THE "WHALE HUNTING" STRATEGY:
    1. Ingest target list (from scraping, SEC filings, or manual entry)
    2. Run satellite analysis on each facility
    3. Calculate Yard Velocity Score (YVS)
    4. Rank and classify prospects
    5. Generate "Sniper Marketing" hit list

================================================================================
"""

import json
import csv
import random
from datetime import datetime
from dragnet import (
    calculate_velocity_score, 
    mock_yolo_inference, 
    mock_sam_segmentation, 
    detect_gate_nodes,
    classify_facility,
    explain_score_breakdown,
    ALPHA, BETA, GAMMA
)

# =============================================================================
# TARGET DATABASE
# =============================================================================
# In production, this would be loaded from:
# - Scraped store locator sitemaps
# - SEC 10-K filings (Item 2. Properties)
# - CRM exports
# - Google Places API bulk geocoding

TARGET_LIST = [
    # Tier 1: Known Whales (Large DCs)
    {"name": "Costco Distribution Center #54", "lat": 34.754, "lon": -78.789, "tier": "Enterprise"},
    {"name": "Smithfield Tar Heel Plant", "lat": 34.750, "lon": -78.780, "tier": "Enterprise"},
    {"name": "Walmart Fulfillment Center #402", "lat": 33.900, "lon": -84.200, "tier": "Enterprise"},
    {"name": "Amazon ATL4", "lat": 33.600, "lon": -84.400, "tier": "Enterprise"},
    
    # Tier 2: Regional Prospects
    {"name": "Primo Water - Zephyrhills", "lat": 28.233, "lon": -82.181, "tier": "Regional"},
    {"name": "ReadyRefresh Tampa Hub", "lat": 27.950, "lon": -82.457, "tier": "Regional"},
    {"name": "Crowley Jacksonville Port", "lat": 30.330, "lon": -81.650, "tier": "Regional"},
    {"name": "Estes Express Terminal ATL", "lat": 33.750, "lon": -84.350, "tier": "Regional"},
    
    # Tier 3: Smaller Targets (for pipeline building)
    {"name": "Small Regional Depot", "lat": 35.000, "lon": -79.000, "tier": "SMB"},
    {"name": "Local Cold Storage Co", "lat": 34.500, "lon": -79.500, "tier": "SMB"},
]

def run_batch_dragnet(targets, output_json=True, output_csv=True):
    """
    Executes the full Digital Dragnet pipeline on a list of targets.
    
    Args:
        targets: List of dicts with name, lat, lon, tier
        output_json: Save results to JSON file
        output_csv: Save results to CSV file
    
    Returns:
        List of results sorted by score (highest first)
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print("="*70)
    print("🎯 DIGITAL DRAGNET - BATCH RECONNAISSANCE INITIATED")
    print("="*70)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Targets Loaded: {len(targets)}")
    print(f"Scoring Formula: ({ALPHA*100:.0f}% × Paved) + ({BETA*100:.0f}% × Trailers) + ({GAMMA*100:.0f}% × Gates)")
    print("="*70 + "\n")
    
    results = []
    
    for i, target in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] Scanning: {target['name']}")
        print(f"         Coordinates: ({target['lat']}, {target['lon']})")
        
        # 1. Mock Data Fetching (Simulating satellite tile retrieval)
        image_path = f"tile_{target['name'].replace(' ', '_')}.jpg"
        
        # 2. Run Intelligence Pipeline
        detections = mock_yolo_inference(image_path)
        paved_area = mock_sam_segmentation(image_path)
        gate_nodes = detect_gate_nodes(target['lat'], target['lon'])
        
        # 3. Calculate Score
        score = calculate_velocity_score(paved_area, detections["trailers"], gate_nodes)
        
        # 4. Classify
        classification = classify_facility(score)
        
        # 5. Get breakdown
        breakdown = explain_score_breakdown(paved_area, detections["trailers"], gate_nodes, score)
            
        result = {
            "name": target['name'],
            "tier": target.get('tier', 'Unknown'),
            "coordinates": {"lat": target['lat'], "lon": target['lon']},
            "score": round(score, 1),
            "classification": classification['tier'],
            "classification_label": classification['label'],
            "emoji": classification['emoji'],
            "expected_roi": classification['expected_roi'],
            "action": classification['action'],
            "details": {
                "trailers": detections["trailers"],
                "paved_pct": round(paved_area, 1),
                "gates": gate_nodes
            },
            "breakdown": breakdown
        }
        results.append(result)
        
        print(f"         Score: {score:.1f} | {classification['emoji']} {classification['label']}")
        print(f"         Trailers: {detections['trailers']} | Paved: {paved_area:.1f}% | Gates: {gate_nodes}\n")

    # Sort results by score (descending) - Whales float to top
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # =============================================================================
    # GENERATE REPORTS
    # =============================================================================
    
    print("\n" + "="*70)
    print("📊 BATCH ANALYSIS COMPLETE - PRIORITIZED TARGET REPORT")
    print("="*70)
    print(f"\n{'RANK':<5} {'FACILITY NAME':<35} {'SCORE':<8} {'CLASS':<10} {'ACTION'}")
    print("-" * 90)
    
    for i, r in enumerate(results, 1):
        emoji = r['emoji']
        action_short = r['action'][:30] + "..." if len(r['action']) > 30 else r['action']
        print(f"{i:<5} {r['name']:<35} {r['score']:<8} {emoji} {r['classification_label']:<8} {action_short}")
    
    # Summary Statistics
    whales = [r for r in results if r['score'] >= 80]
    standard = [r for r in results if 50 <= r['score'] < 80]
    low = [r for r in results if r['score'] < 50]
    
    print("\n" + "="*70)
    print("📈 SUMMARY STATISTICS")
    print("="*70)
    print(f"🐋 WHALES (80+):        {len(whales)} facilities - Immediate outreach")
    print(f"🎯 STANDARD (50-79):    {len(standard)} facilities - Nurture campaign")
    print(f"📉 LOW (<50):           {len(low)} facilities - Deprioritize")
    print(f"\n🏆 TOP TARGET: {results[0]['name']}")
    print(f"   Score: {results[0]['score']} | Expected ROI: {results[0]['expected_roi']}")
    print(f"   Action: {results[0]['action']}")
    
    # Output files
    if output_json:
        json_filename = f"dragnet_results_{timestamp}.json"
        with open(json_filename, 'w') as f:
            json.dump({
                "timestamp": timestamp,
                "total_targets": len(results),
                "summary": {
                    "whales": len(whales),
                    "standard": len(standard),
                    "low": len(low)
                },
                "results": results
            }, f, indent=2)
        print(f"\n📁 JSON Report: {json_filename}")
    
    if output_csv:
        csv_filename = f"dragnet_results_{timestamp}.csv"
        with open(csv_filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Rank', 'Facility', 'Score', 'Classification', 'Trailers', 'Paved%', 'Gates', 'Expected ROI', 'Action'])
            for i, r in enumerate(results, 1):
                writer.writerow([
                    i, r['name'], r['score'], r['classification_label'],
                    r['details']['trailers'], r['details']['paved_pct'], r['details']['gates'],
                    r['expected_roi'], r['action']
                ])
        print(f"📁 CSV Report:  {csv_filename}")
    
    print("\n" + "="*70)
    print("🚀 RECOMMENDATION: Send Digital Twin demo links to top 3 Whales")
    print("="*70 + "\n")
    
    return results


def generate_demo_link(facility_name: str) -> str:
    """
    Generates a pre-built demo URL for the sales team to send.
    This is the "I already built your yard" hook.
    """
    slug = facility_name.lower().replace(' ', '-').replace('#', '').replace('&', 'and')
    return f"https://app.freightroll.com/demo/{slug}"


if __name__ == "__main__":
    results = run_batch_dragnet(TARGET_LIST)
    
    # Generate demo links for top targets
    print("\n🔗 DEMO LINKS FOR SALES OUTREACH:")
    print("-" * 50)
    for r in results[:3]:  # Top 3
        link = generate_demo_link(r['name'])
        print(f"{r['emoji']} {r['name']}")
        print(f"   {link}")
        print()
