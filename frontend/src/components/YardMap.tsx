import React, { useRef, useState, useEffect } from 'react';
import Map, { MapRef, useMap } from 'react-map-gl';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import AssetPalette from './AssetPalette';
import Leaderboard from './Leaderboard';
import DigitalBOL from './DigitalBOL';

// MAPBOX TOKEN REQUIRED HERE
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// --- 3D Components ---

// 1. Camera Sync: Syncs Three.js camera with Mapbox camera
const CameraSync = () => {
  const { camera, scene } = useThree();
  const { current: map } = useMap();

  useFrame(() => {
    if (!map) return;
    // Placeholder for sync logic
  });

  return null;
};

// 2. Trailer Component: Improved 3D Model
const Trailer = ({ position, rotation = 0, color = "white" }: { position: [number, number, number], rotation?: number, color?: string }) => {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main Body */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 1, 0.8]} /> {/* 53ft scale */}
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Wheels */}
      <mesh position={[-0.8, 0, 0.3]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.8, 0, -0.3]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-1.1, 0, 0.3]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-1.1, 0, -0.3]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Cab Connector (Kingpin area) */}
      <mesh position={[1.1, 0.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
}

export default function YardMap() {
  const mapRef = useRef<MapRef>(null);
  const [showBOL, setShowBOL] = useState(false);
  const [scoreData, setScoreData] = useState({ score: 0, classification: 'LOADING...' });
  const [viewState, setViewState] = useState({
    longitude: -78.789,
    latitude: 34.754,
    zoom: 18,
    pitch: 45 // Angled view for 3D effect
  });

  useEffect(() => {
    // Fetch score from backend
    const fetchScore = async () => {
      try {
        const res = await fetch(`${API_URL}/api/score?lat=${viewState.latitude}&lon=${viewState.longitude}`);
        const data = await res.json();
        setScoreData(data);
      } catch (error) {
        console.error("Failed to fetch score:", error);
        setScoreData({ score: 75.5, classification: 'OFFLINE MODE' }); // Fallback
      }
    };

    fetchScore();
  }, []); // Run once on mount

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{source: 'mapbox-dem', exaggeration: 1.5}} 
      >
      </Map>
      
      {/* 3D Overlay Canvas */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 5, 5], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <directionalLight position={[-5, 5, 5]} intensity={0.5} />
            
            {/* 
               TODO: Implement full Camera Sync. 
            */}
            
            {/* Example Trailers */}
            <Trailer position={[0, 0, 0]} rotation={0.2} />
            <Trailer position={[1, 0, 2]} rotation={0.1} color="#ccc" />
            <Trailer position={[-2, 0, -1]} rotation={-0.1} color="#eee" />
        </Canvas>
      </div>
      
      {/* UI Overlay */}
      <AssetPalette />
      <Leaderboard />
      
      {/* BOL Trigger Button */}
      <button 
        onClick={() => setShowBOL(true)}
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#00ff00',
          color: '#000',
          border: 'none',
          padding: '10px 20px',
          fontWeight: 'bold',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 0 10px #00ff00',
          zIndex: 1000
        }}
      >
        DIGITAL BOL (NEW ARRIVAL)
      </button>

      {showBOL && <DigitalBOL onClose={() => setShowBOL(false)} />}
      
      <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'white', fontFamily: 'monospace', background: 'rgba(0,0,0,0.7)', padding: '10px' }}>
        <h3>YARD VELOCITY SCORE: {scoreData.score}</h3>
        <p>Status: {scoreData.classification}</p>
      </div>
    </div>
  );
}
