# 🚀 Project Genesis - YardBuilder AI

> **"SimCity for Logistics"** - A gamified orchestration engine for the automated supply chain

[![Backend Status](https://img.shields.io/badge/Backend-LIVE-brightgreen)](https://project-genesis-backend-8uk2.onrender.com)
[![Frontend Status](https://img.shields.io/badge/Frontend-LIVE-brightgreen)](https://project-genesis-three.vercel.app)

## 🎯 What is Project Genesis?

Project Genesis is a revolutionary approach to logistics yard management. Instead of traditional enterprise software that requires months of consultant-led configuration, we've built a **product-led, gamified ingestion engine** that lets facility managers digitize their own infrastructure.

### The Problem: "Heavy Water" Logistics
- Trucks spend 48 minutes turning a trailer when it should take 24
- "Yard Hunting" - drivers searching for lost trailers in circles
- Digital records don't match physical reality
- Legacy software requires 3-5 day on-site implementations per facility

### The Solution: Gamified Self-Service
- **God Mode Interface** - Satellite view + 3D overlay for facility mapping
- **Drag & Drop Assets** - Place docks, trailers, gates like SimCity
- **Network Leaderboards** - Compete on Turn-Time Velocity
- **Digital Dragnet** - AI-powered facility reconnaissance

---

## 📊 Yard Velocity Score (YVS) - The Algorithm Explained

The **Yard Velocity Score** is a composite metric (0-100) that predicts a facility's operational complexity and potential ROI from automation.

### Formula

```
YVS = (α × Paved Area %) + (β × Normalized Trailers) + (γ × Normalized Gates)
```

### Coefficients

| Symbol | Weight | Component | Why This Weight? |
|--------|--------|-----------|------------------|
| **α** | 50% | Paved Area % | Strongest predictor of yard complexity. More paved = more trailer parking = more friction |
| **β** | 30% | Trailer Count | Directly correlates with throughput volume and "Yard Hunting" risk |
| **γ** | 20% | Gate Nodes | Adds orchestration overhead but less predictive than capacity metrics |

### Normalization

- **Trailer Count**: Divided by 300 (whale benchmark), capped at 100
- **Gate Nodes**: Divided by 5 (max complexity), capped at 100
- **Paved Area**: Already 0-100%

### Classification Tiers

| Score Range | Classification | Emoji | Expected ROI | Action |
|-------------|----------------|-------|--------------|--------|
| **80-100** | WHALE | 🐋 | $500K+ annually | Immediate outreach with pre-built Digital Twin |
| **50-79** | STANDARD | 🎯 | $50K-$500K annually | Add to nurture campaign |
| **0-49** | LOW | 📉 | Limited | Monitor for growth |

### Example Calculation

A facility with **85% paved**, **180 trailers**, **3 gates**:

```
Paved contribution:   0.50 × 85.0 = 42.5
Trailer normalized:   180 / 300 × 100 = 60.0
Trailer contribution: 0.30 × 60.0 = 18.0
Gate normalized:      3 / 5 × 100 = 60.0
Gate contribution:    0.20 × 60.0 = 12.0
───────────────────────────────────────
TOTAL YVS:            72.5 (STANDARD PROSPECT)
```

---

## 🛠️ Tech Stack

### Frontend (Vercel)
- **Next.js 14** - React framework
- **React Three Fiber** - 3D rendering via Three.js
- **Mapbox GL** - Satellite imagery + geospatial
- **TypeScript** - Type safety

### Backend (Render)
- **Python/Flask** - REST API
- **YOLOv8-OBB** - Trailer detection (mock in demo)
- **SAM** - Surface segmentation (mock in demo)

---

## 🌐 Live Deployment

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://project-genesis-three.vercel.app | ✅ Live |
| **Backend API** | https://project-genesis-backend-8uk2.onrender.com | ✅ Live |
| **API Docs** | https://project-genesis-backend-8uk2.onrender.com/api/explain | ✅ Live |

### API Endpoints

```bash
# Health Check
curl https://project-genesis-backend-8uk2.onrender.com/

# Get Score for Coordinates
curl "https://project-genesis-backend-8uk2.onrender.com/api/score?lat=34.754&lon=-78.789"

# Algorithm Documentation
curl https://project-genesis-backend-8uk2.onrender.com/api/explain

# Batch Process (POST)
curl -X POST https://project-genesis-backend-8uk2.onrender.com/api/batch \
  -H "Content-Type: application/json" \
  -d '{"facilities": [{"name": "Test DC", "lat": 34.754, "lon": -78.789}]}'
```

---

## 💻 Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### Frontend

```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

### Environment Variables

Create `.env.local` in root:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
Project-Genesis/
├── src/
│   ├── app/                    # Next.js app router
│   └── components/
│       ├── YardMap.tsx         # Main 3D map interface
│       ├── Leaderboard.tsx     # Network velocity dashboard
│       ├── AssetPalette.tsx    # SimCity-style builder menu
│       └── DigitalBOL.tsx      # Bill of Lading modal
├── backend/
│   ├── app.py                  # Flask API server
│   ├── dragnet.py              # YVS algorithm + CV pipeline
│   └── batch_dragnet.py        # Whale hunting batch processor
├── package.json
├── vercel.json
└── render.yaml
```

---

## 🎮 Features

### 1. God Mode Interface
- Satellite imagery with 3D overlay
- Place and arrange assets visually
- Real-time score updates

### 2. Asset Palette
- **Dock Doors** - Loading/unloading points
- **Trailer Spots** - 53ft parking positions
- **Gate Nodes** - Entry/exit points
- **Paint Zones** - Staging lanes, no-go areas
- **Reefer Areas** - Cold storage monitoring

### 3. Network Leaderboard
- Facility rankings by Yard Velocity Score
- Turn-time tracking (Target: 24 minutes)
- Ghost count (lost assets)
- Trend indicators

### 4. Digital BOL (Trojan Horse)
- Paperless check-in flow
- Gate pass generation
- Dock assignment
- Saves $10,900/year in paper costs

### 5. Digital Dragnet
- Batch reconnaissance of target facilities
- Automated whale identification
- Sales prioritization reports

---

## 📈 ROI Model

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Turn Time | 48 min | 24 min | 50% faster |
| Paper Costs | $10,900/yr | $0 | $10,900/yr |
| Yard Hunting | 30% of time | 5% of time | 25% labor saved |
| Ghost Assets | 15% | 0% | 100% visibility |

---

## 🤝 Team

- **Dan "The Man" Zacks** - AI/Backend (Digital Dragnet)
- **Michal "The Joker" Scasny** - Frontend/Map (R3F Interface)
- **Matt "The Assassin" Koppinger** - UX/Workflow
- **Casey "The Fish" Larkin** - Sales/Pitch

---

## 📜 License

Internal Strategy / Restricted

---

*"This is not merely software; it is the gamification of industrial fluidity."*
