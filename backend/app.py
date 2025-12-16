from flask import Flask, jsonify, request
from flask_cors import CORS
from dragnet import calculate_velocity_score, mock_yolo_inference, mock_sam_segmentation, detect_gate_nodes

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "message": "Project Genesis Backend is Live",
        "version": "1.0.0"
    })

@app.route('/api/score', methods=['GET'])
def get_score():
    lat = float(request.args.get('lat', 34.754))
    lon = float(request.args.get('lon', -78.789))
    
    print(f"Received request for coordinates: {lat}, {lon}")
    
    # 1. Mock Data Fetching
    image_path = "temp_request.jpg"
    
    # 2. Run Intelligence Pipeline
    detections = mock_yolo_inference(image_path)
    paved_area = mock_sam_segmentation(image_path)
    gate_nodes = detect_gate_nodes(lat, lon)
    
    # 3. Calculate Score
    score = calculate_velocity_score(paved_area, detections["trailers"], gate_nodes)
    
    # 4. Classify
    classification = "LOW PRIORITY"
    if score > 80:
        classification = "WHALE (High Priority)"
    elif score > 50:
        classification = "STANDARD PROSPECT"
        
    return jsonify({
        "score": round(score, 1),
        "classification": classification,
        "details": {
            "trailers": detections["trailers"],
            "paved_pct": round(paved_area, 1),
            "gates": gate_nodes
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
