"""
================================================================================
PROJECT GENESIS - FLASK API SERVER
================================================================================
Backend API for the YardBuilder AI / Digital Dragnet system.

Endpoints:
    GET /              - Health check
    GET /api/score     - Calculate Yard Velocity Score for coordinates
    GET /api/explain   - Get detailed breakdown of scoring algorithm
    POST /api/batch    - Batch process multiple facilities

================================================================================
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from dragnet import (
    calculate_velocity_score, 
    mock_yolo_inference, 
    mock_sam_segmentation, 
    detect_gate_nodes,
    classify_facility,
    explain_score_breakdown,
    ALPHA, BETA, GAMMA,
    MAX_TRAILER_BENCHMARK,
    MAX_GATE_BENCHMARK
)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint - confirms API is online."""
    return jsonify({
        "status": "online",
        "message": "🚀 Project Genesis Backend is Live",
        "version": "2.0.0",
        "endpoints": {
            "/api/score": "GET - Calculate Yard Velocity Score",
            "/api/explain": "GET - Algorithm documentation",
            "/api/batch": "POST - Batch process facilities"
        }
    })

@app.route('/api/explain', methods=['GET'])
def explain_algorithm():
    """
    Returns comprehensive documentation of the Yard Velocity Score algorithm.
    Use this to understand what the numbers mean.
    """
    return jsonify({
        "algorithm": "Yard Velocity Score (YVS)",
        "version": "2.0",
        "purpose": "Scores logistics facilities (0-100) to identify high-value automation targets",
        "formula": "YVS = (α × Paved%) + (β × NormTrailers) + (γ × NormGates)",
        "coefficients": {
            "alpha": {
                "symbol": "α",
                "value": ALPHA,
                "weight_percent": f"{ALPHA * 100:.0f}%",
                "component": "Paved Area Percentage",
                "rationale": "Paved area is the strongest predictor of yard complexity. More paved = more trailer parking = more 'Heavy Water' friction."
            },
            "beta": {
                "symbol": "β", 
                "value": BETA,
                "weight_percent": f"{BETA * 100:.0f}%",
                "component": "Trailer Count (normalized)",
                "rationale": "Trailer count directly correlates with throughput volume and 'Yard Hunting' risk.",
                "normalization": f"Divided by {MAX_TRAILER_BENCHMARK}, capped at 100"
            },
            "gamma": {
                "symbol": "γ",
                "value": GAMMA,
                "weight_percent": f"{GAMMA * 100:.0f}%",
                "component": "Gate Nodes (normalized)",
                "rationale": "Gate complexity adds orchestration overhead but is less predictive than capacity metrics.",
                "normalization": f"Divided by {MAX_GATE_BENCHMARK}, capped at 100"
            }
        },
        "classifications": {
            "whale": {
                "score_range": "80-100",
                "emoji": "🐋",
                "label": "WHALE (High Priority)",
                "description": "Enterprise-grade facility with massive Heavy Water friction",
                "expected_roi": "$500K+ annually",
                "action": "Immediate outreach with pre-built Digital Twin demo"
            },
            "standard": {
                "score_range": "50-79",
                "emoji": "🎯",
                "label": "STANDARD PROSPECT",
                "description": "Good automation candidate with solid ROI potential",
                "expected_roi": "$50K-$500K annually",
                "action": "Add to nurture campaign, send value proposition"
            },
            "low": {
                "score_range": "0-49",
                "emoji": "📉",
                "label": "LOW PRIORITY",
                "description": "Small operation or limited infrastructure",
                "expected_roi": "Limited ROI potential",
                "action": "Monitor for growth, deprioritize sales effort"
            }
        },
        "component_interpretation": {
            "paved_area": {
                "90-100%": "Mega DC - Maximum land utilization, high complexity",
                "70-89%": "Standard DC - Good operational footprint",
                "50-69%": "Mixed-use - Room for optimization",
                "<50%": "Limited paved area - May be office-heavy"
            },
            "trailer_count": {
                "200+": "WHALE territory - Major distribution hub",
                "100-199": "High-volume facility - Significant throughput",
                "50-99": "Regional depot - Moderate activity",
                "<50": "Small operation - Limited scale"
            },
            "gate_nodes": {
                "4-5": "Complex multi-flow - High orchestration needs",
                "2-3": "Standard facility - Some traffic separation",
                "1": "Single entry point - Simple flow"
            }
        },
        "example_calculation": {
            "input": {
                "paved_area": 85.0,
                "trailer_count": 180,
                "gate_nodes": 3
            },
            "calculation": {
                "paved_contribution": f"{ALPHA} × 85.0 = {ALPHA * 85.0}",
                "trailer_normalized": f"180 / {MAX_TRAILER_BENCHMARK} × 100 = 60.0",
                "trailer_contribution": f"{BETA} × 60.0 = {BETA * 60.0}",
                "gate_normalized": f"3 / {MAX_GATE_BENCHMARK} × 100 = 60.0",
                "gate_contribution": f"{GAMMA} × 60.0 = {GAMMA * 60.0}",
                "total": f"{ALPHA * 85.0} + {BETA * 60.0} + {GAMMA * 60.0} = {ALPHA * 85.0 + BETA * 60.0 + GAMMA * 60.0}"
            },
            "result": {
                "score": ALPHA * 85.0 + BETA * 60.0 + GAMMA * 60.0,
                "classification": "STANDARD PROSPECT"
            }
        }
    })

@app.route('/api/score', methods=['GET'])
def get_score():
    """
    Calculate Yard Velocity Score for given coordinates.
    
    Query Parameters:
        lat (float): Latitude (default: 34.754)
        lon (float): Longitude (default: -78.789)
        name (str): Facility name (optional)
    
    Returns:
        JSON with score, classification, details, and breakdown
    """
    lat = float(request.args.get('lat', 34.754))
    lon = float(request.args.get('lon', -78.789))
    facility_name = request.args.get('name', 'Unknown Facility')
    
    print(f"[API] Analyzing: {facility_name} at ({lat}, {lon})")
    
    # 1. Mock Data Fetching (Simulating satellite tile retrieval)
    image_path = "temp_request.jpg"
    
    # 2. Run Intelligence Pipeline
    detections = mock_yolo_inference(image_path)
    paved_area = mock_sam_segmentation(image_path)
    gate_nodes = detect_gate_nodes(lat, lon)
    
    # 3. Calculate Score
    score = calculate_velocity_score(paved_area, detections["trailers"], gate_nodes)
    
    # 4. Classify
    classification = classify_facility(score)
    
    # 5. Get detailed breakdown
    breakdown = explain_score_breakdown(paved_area, detections["trailers"], gate_nodes, score)
    
    return jsonify({
        "facility": facility_name,
        "coordinates": {"lat": lat, "lon": lon},
        "score": round(score, 1),
        "classification": classification["tier"],
        "classification_details": classification,
        "details": {
            "trailers": detections["trailers"],
            "paved_pct": round(paved_area, 1),
            "gates": gate_nodes
        },
        "breakdown": breakdown,
        "interpretation": {
            "score_meaning": f"This facility scores {score:.1f}/100, classified as {classification['label']}",
            "paved_area_meaning": breakdown["components"]["paved_area"]["interpretation"],
            "trailer_meaning": breakdown["components"]["trailer_count"]["interpretation"],
            "gate_meaning": breakdown["components"]["gate_nodes"]["interpretation"]
        },
        "recommendation": {
            "action": classification["action"],
            "expected_roi": classification["expected_roi"]
        }
    })

@app.route('/api/batch', methods=['POST'])
def batch_process():
    """
    Batch process multiple facilities.
    
    Request Body (JSON):
        {
            "facilities": [
                {"name": "Facility 1", "lat": 34.754, "lon": -78.789},
                {"name": "Facility 2", "lat": 33.900, "lon": -84.200}
            ]
        }
    
    Returns:
        JSON with results sorted by score (highest first)
    """
    data = request.get_json()
    facilities = data.get('facilities', [])
    
    if not facilities:
        return jsonify({"error": "No facilities provided"}), 400
    
    results = []
    for facility in facilities:
        lat = facility.get('lat', 0)
        lon = facility.get('lon', 0)
        name = facility.get('name', 'Unknown')
        
        # Run analysis
        detections = mock_yolo_inference("batch_temp.jpg")
        paved_area = mock_sam_segmentation("batch_temp.jpg")
        gate_nodes = detect_gate_nodes(lat, lon)
        score = calculate_velocity_score(paved_area, detections["trailers"], gate_nodes)
        classification = classify_facility(score)
        
        results.append({
            "name": name,
            "coordinates": {"lat": lat, "lon": lon},
            "score": round(score, 1),
            "classification": classification["tier"],
            "emoji": classification["emoji"],
            "details": {
                "trailers": detections["trailers"],
                "paved_pct": round(paved_area, 1),
                "gates": gate_nodes
            }
        })
    
    # Sort by score descending (whales first)
    results.sort(key=lambda x: x['score'], reverse=True)
    
    # Summary stats
    whales = len([r for r in results if r['score'] >= 80])
    standard = len([r for r in results if 50 <= r['score'] < 80])
    low = len([r for r in results if r['score'] < 50])
    
    return jsonify({
        "total_facilities": len(results),
        "summary": {
            "whales": whales,
            "standard_prospects": standard,
            "low_priority": low
        },
        "top_target": results[0] if results else None,
        "results": results
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
