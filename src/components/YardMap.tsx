// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import Map, { MapRef, useMap } from 'react-map-gl/mapbox';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import AssetPalette from './AssetPalette';
import Leaderboard from './Leaderboard';
import DigitalBOL from './DigitalBOL';
import CommandHeader from './CommandHeader';
import TeamInvitation from './TeamInvitation';

// MAPBOX TOKEN REQUIRED HERE
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
// Default to the live Render backend if the environment variable is not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-genesis-backend-8uk2.onrender.com';

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

// 2. Animated Trailer Component with Glow Effects
const Trailer = ({ position, rotation = 0, color = "#ffffff", isHighlighted = false }: { 
  position: [number, number, number], 
  rotation?: number, 
  color?: string,
  isHighlighted?: boolean 
}) => {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);
  
  // Subtle floating animation
  useFrame((state) => {
    if (meshRef.current && isHighlighted) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main Body with emissive glow */}
      <mesh 
        ref={meshRef}
        position={[0, 0.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.5, 1, 0.8]} />
        <meshStandardMaterial 
          color={hovered ? "#00ffff" : color} 
          roughness={0.3} 
          metalness={0.6}
          emissive={hovered ? "#00ffff" : isHighlighted ? "#00ff00" : "#000000"}
          emissiveIntensity={hovered ? 0.5 : isHighlighted ? 0.2 : 0}
        />
      </mesh>
      {/* Wheels - darker and metallic */}
      <mesh position={[-0.8, 0.15, 0.35]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-0.8, 0.15, -0.35]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-1.1, 0.15, 0.35]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-1.1, 0.15, -0.35]}>
        <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Kingpin connector */}
      <mesh position={[1.1, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.25, 8]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Status light on trailer */}
      <mesh position={[-1.2, 0.9, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial 
          color={isHighlighted ? "#00ff00" : "#ff6600"} 
          emissive={isHighlighted ? "#00ff00" : "#ff6600"}
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

// Ground Grid Effect
const GridFloor = () => {
  return (
    <gridHelper 
      args={[20, 20, '#00ffff', '#003333']} 
      position={[0, 0.01, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Type for API response
interface ScoreData {
  score: number;
  classification: string;
  details?: {
    trailers: number;
    paved_pct: number;
    gates: number;
  };
}

export default function YardMap() {
  const mapRef = useRef<MapRef>(null);
  const [showBOL, setShowBOL] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [scoreData, setScoreData] = useState<ScoreData>({ 
    score: 0, 
    classification: 'INITIALIZING...',
    details: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: -78.789,
    latitude: 34.754,
    zoom: 18,
    pitch: 45
  });

  // Konami code detection for easter egg
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          setShowInvitation(true);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Logo click easter egg (5 clicks)
  useEffect(() => {
    if (logoClicks >= 5) {
      setShowInvitation(true);
      setLogoClicks(0);
    }
  }, [logoClicks]);

  useEffect(() => {
    const fetchScore = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/score?lat=${viewState.latitude}&lon=${viewState.longitude}`);
        const data = await res.json();
        // Simulate loading for effect
        await new Promise(resolve => setTimeout(resolve, 800));
        setScoreData({
          score: data.score,
          classification: data.classification,
          details: data.details
        });
      } catch (error) {
        console.error("Failed to fetch score:", error);
        setScoreData({ 
          score: 75.5, 
          classification: 'OFFLINE MODE',
          details: { trailers: 120, paved_pct: 78.5, gates: 3 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchScore();
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative',
      background: '#0a0a0f'
    }}>
      {/* Command Header */}
      <CommandHeader />
      
      {/* Main Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        style={{width: '100%', height: '100%', marginTop: '60px'}}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{source: 'mapbox-dem', exaggeration: 1.5}} 
      >
      </Map>
      
      {/* Vignette Overlay for cinematic effect */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at center, transparent 40%, rgba(0, 10, 20, 0.6) 100%),
          linear-gradient(180deg, rgba(0, 255, 255, 0.02) 0%, transparent 10%, transparent 90%, rgba(255, 0, 255, 0.02) 100%)
        `,
        zIndex: 100
      }} />
      
      {/* Scan Line Effect */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 101
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.5), transparent)',
          animation: 'scan-line 4s linear infinite',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
        }} />
      </div>
      
      {/* 3D Overlay Canvas */}
      <div style={{ 
        position: 'absolute', 
        top: 60, 
        left: 0, 
        width: '100%', 
        height: 'calc(100% - 60px)', 
        pointerEvents: 'none' 
      }}>
        <Canvas camera={{ position: [0, 8, 8], fov: 50 }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff00ff" />
            <directionalLight position={[-5, 5, 5]} intensity={0.8} />
            <fog attach="fog" args={['#0a0a0f', 10, 30]} />
            
            {/* Grid Floor */}
            <GridFloor />
            
            {/* Trailers with varied states */}
            <Trailer position={[0, 0, 0]} rotation={0.2} color="#e8e8e8" isHighlighted={true} />
            <Trailer position={[3, 0, 1]} rotation={0.15} color="#d0d0d0" />
            <Trailer position={[-3, 0, 2]} rotation={-0.1} color="#c8c8c8" />
            <Trailer position={[1.5, 0, -2]} rotation={0.3} color="#f0f0f0" isHighlighted={true} />
            <Trailer position={[-2, 0, -1.5]} rotation={-0.2} color="#ddd" />
        </Canvas>
      </div>
      
      {/* UI Overlay */}
      <AssetPalette />
      <Leaderboard />
      
      {/* BOL Trigger Button - Redesigned */}
      <button 
        onClick={() => setShowBOL(true)}
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
          color: '#000',
          border: 'none',
          padding: '12px 24px',
          fontWeight: 'bold',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.85rem',
          letterSpacing: '1px',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          animation: 'float-centered 3s ease-in-out infinite'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 0, 0.6), 0 6px 20px rgba(0, 0, 0, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3)';
        }}
      >
        🚛 NEW ARRIVAL - DIGITAL BOL
      </button>

      {showBOL && <DigitalBOL onClose={() => setShowBOL(false)} />}
      
      {/* Team Invitation Easter Egg */}
      {showInvitation && <TeamInvitation onClose={() => setShowInvitation(false)} />}
      
      {/* Enhanced Score Display Panel */}
      <div style={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 20, 
        color: 'white', 
        fontFamily: '"JetBrains Mono", "Courier New", monospace', 
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.95) 0%, rgba(10, 5, 25, 0.95) 100%)', 
        padding: '20px',
        border: '1px solid rgba(0, 255, 255, 0.4)',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
        minWidth: '300px',
        backdropFilter: 'blur(10px)',
        animation: 'slideInLeft 0.5s ease-out',
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.2)'
        }}>
          <span style={{ 
            color: '#00ffff', 
            fontSize: '0.75rem', 
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Facility Analysis
          </span>
          <span style={{ 
            fontSize: '0.7rem', 
            color: scoreData.score >= 80 ? '#00ff00' : scoreData.score >= 50 ? '#ffff00' : '#ff0000',
            background: 'rgba(0,0,0,0.5)',
            padding: '4px 10px',
            borderRadius: '12px',
            border: `1px solid ${scoreData.score >= 80 ? 'rgba(0,255,0,0.3)' : scoreData.score >= 50 ? 'rgba(255,255,0,0.3)' : 'rgba(255,0,0,0.3)'}`
          }}>
            {scoreData.score >= 80 ? '🐋 WHALE' : scoreData.score >= 50 ? '🎯 STANDARD' : '📉 LOW'}
          </span>
        </div>
        
        {/* Score Display */}
        {isLoading ? (
          <div style={{ 
            fontSize: '1.5rem', 
            color: '#00ffff',
            animation: 'pulse 1s infinite'
          }}>
            SCANNING...
          </div>
        ) : (
          <div style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: scoreData.score >= 80 ? '#00ff00' : scoreData.score >= 50 ? '#ffff00' : '#ff0000',
            textShadow: `0 0 30px ${scoreData.score >= 80 ? '#00ff00' : scoreData.score >= 50 ? '#ffff00' : '#ff0000'}60`,
            marginBottom: '5px',
            lineHeight: '1'
          }}>
            {scoreData.score}
            <span style={{ fontSize: '1rem', color: '#555', marginLeft: '5px' }}>/100</span>
          </div>
        )}
        
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
          {scoreData.classification}
        </div>
        
        {/* Score Breakdown */}
        {scoreData.details && (
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.4)', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ 
              color: '#00ffff', 
              marginBottom: '10px', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.65rem'
            }}>
              🔍 Detection Results
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#888' }}>🚛 Trailers:</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{scoreData.details.trailers}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#888' }}>📐 Paved Area:</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{scoreData.details.paved_pct}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#888' }}>🚧 Gates:</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{scoreData.details.gates}</span>
            </div>
          </div>
        )}
        
        {/* Formula Footer */}
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.6rem',
          color: '#444',
          textAlign: 'center'
        }}>
          YVS = (50% × Paved) + (30% × Trailers) + (20% × Gates)
        </div>
      </div>
      
      {/* Easter Egg Hint (subtle) */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        fontSize: '0.6rem',
        color: '#222',
        zIndex: 100
      }}>
        ↑↑↓↓←→←→BA
      </div>
    </div>
  );
}
