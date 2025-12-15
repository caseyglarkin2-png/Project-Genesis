import random
from dragnet import calculate_velocity_score, mock_yolo_inference, mock_sam_segmentation, detect_gate_nodes

# Mock Database of Targets
TARGET_LIST = [
    {"name": "Costco Distribution Center #54", "lat": 34.754, "lon": -78.789},
    {"name": "Smithfield Tar Heel Plant", "lat": 34.750, "lon": -78.780},
    {"name": "Walmart Fulfillment Center #402", "lat": 33.900, "lon": -84.200},
    {"name": "Amazon ATL4", "lat": 33.600, "lon": -84.400},
    {"name": "Small Regional Depot", "lat": 35.000, "lon": -79.000},
]

def run_batch_dragnet(targets):
    print(f"Initializing Digital Dragnet Batch Process...")
    print(f"Targets Loaded: {len(targets)}\n")
    
    results = []
    
    for target in targets:
        print(f"Scanning: {target['name']} ({target['lat']}, {target['lon']})...")
        
        # 1. Mock Data Fetching (Simulating API calls)
        # In reality, we would fetch the satellite tile here
        image_path = f"temp_{target['name'].replace(' ', '_')}.jpg"
        
        # 2. Run Intelligence Pipeline
        # We use the functions imported from dragnet.py
        detections = mock_yolo_inference(image_path)
        paved_area = mock_sam_segmentation(image_path)
        gate_nodes = detect_gate_nodes(target['lat'], target['lon'])
        
        # 3. Calculate Score
        score = calculate_velocity_score(paved_area, detections["trailers"], gate_nodes)
        
        # 4. Classify
        classification = "LOW PRIORITY"
        if score > 80:
            classification = "WHALE (High Priority)"
        elif score > 50:
            classification = "STANDARD"
            
        results.append({
            "name": target['name'],
            "score": score,
            "classification": classification,
            "trailers": detections["trailers"],
            "paved_pct": paved_area
        })
        print(f"  -> Score: {score:.1f} | {classification}\n")

    # Sort results by score (descending) to find the "Whales"
    results.sort(key=lambda x: x['score'], reverse=True)
    
    print("="*60)
    print("BATCH ANALYSIS COMPLETE - TARGET REPORT")
    print("="*60)
    print(f"{'FACILITY NAME':<35} | {'SCORE':<6} | {'CLASSIFICATION'}")
    print("-" * 60)
    
    for r in results:
        print(f"{r['name']:<35} | {r['score']:<6.1f} | {r['classification']}")
        
    print("="*60)
    print(f"Top Target: {results[0]['name']} (Score: {results[0]['score']:.1f})")
    print("Recommendation: Send 'Digital Twin' demo link immediately.")

if __name__ == "__main__":
    run_batch_dragnet(TARGET_LIST)
