// @ts-nocheck
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Map, { MapRef, useMap } from 'react-map-gl/mapbox';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import AssetPalette from './AssetPalette';
import Leaderboard from './Leaderboard';
import DigitalBOL from './DigitalBOL';
import CommandHeader from './CommandHeader';
import TeamInvitation from './TeamInvitation';
import ROICalculator from './ROICalculator';
import NetworkMap from './NetworkMap';
import AdoptionLeaderboard from './AdoptionLeaderboard';
import NorthAmericaMap from './NorthAmericaMap';
import FacilityCommandCenter from './FacilityCommandCenter';
import { getNetworkStats, PRIMO_FACILITIES, PrimoFacility } from '../data/primo-facilities';

// MAPBOX TOKEN REQUIRED HERE
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
// Default to the live Render backend if the environment variable is not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-genesis-backend-8uk2.onrender.com';

// --- Voice Announcement System ---
// Uses browser Speech Synthesis for meaningful yard activity announcements

const speak = (message: string) => {
  try {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.1; // Slightly faster
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to get a professional-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Microsoft') || 
        v.name.includes('Samantha') ||
        v.lang === 'en-US'
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    // Silent fail if speech not available
  }
};

// Map event types to voice announcements
const playSound = (type: string, details?: string) => {
  switch (type) {
    case 'truckArrival':
      speak(details || 'Truck arrival detected');
      break;
    case 'truckDeparture':
      speak(details || 'Truck departure confirmed');
      break;
    case 'dockAssign':
      speak(details || 'Dock assignment complete');
      break;
    case 'notification':
      speak(details || 'Yard activity update');
      break;
  }
};

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

// 3D Warehouse Building
const Warehouse = ({ position = [0, 0, -8] as [number, number, number] }) => {
  const meshRef = useRef<any>();
  
  return (
    <group position={position}>
      {/* Main Building */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[12, 4, 6]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          roughness={0.8} 
          metalness={0.2}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 4.3, 0]}>
        <boxGeometry args={[12.5, 0.3, 6.5]} />
        <meshStandardMaterial color="#0d0d15" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Dock Doors */}
      {[-4, -1.5, 1, 3.5].map((x, i) => (
        <group key={i} position={[x, 1.5, 3.05]}>
          {/* Door Frame */}
          <mesh>
            <boxGeometry args={[2, 2.5, 0.1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          {/* Door Number */}
          <mesh position={[0, 1.5, 0.1]}>
            <boxGeometry args={[0.5, 0.3, 0.05]} />
            <meshStandardMaterial 
              color="#00ff00" 
              emissive="#00ff00"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Status Light */}
          <mesh position={[0.8, 1.5, 0.1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#00ff00" : "#ff6600"} 
              emissive={i % 2 === 0 ? "#00ff00" : "#ff6600"}
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      ))}
      {/* Company Sign */}
      <mesh position={[0, 3.5, 3.1]}>
        <boxGeometry args={[4, 0.5, 0.1]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

// Dock Platform
const DockPlatform = ({ position = [0, 0, -4.5] as [number, number, number] }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[14, 0.3, 3]} />
      <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
    </mesh>
  );
}

// Animated Truck - Drives in from the right, stops, then drives out
const AnimatedTruck = ({ startDelay = 0, lane = 0 }: { startDelay?: number, lane?: number }) => {
  const groupRef = useRef<any>();
  const [phase, setPhase] = useState<'waiting' | 'arriving' | 'stopped' | 'departing' | 'done'>('waiting');
  const startTimeRef = useRef<number | null>(null);
  const laneZ = 5 + lane * 3;
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Initialize start time
    if (startTimeRef.current === null) {
      startTimeRef.current = time + startDelay;
    }
    
    const elapsed = time - startTimeRef.current;
    
    if (elapsed < 0) {
      // Still waiting
      groupRef.current.position.x = 15;
      return;
    }
    
    if (phase === 'waiting' && elapsed >= 0) {
      setPhase('arriving');
    }
    
    if (phase === 'arriving') {
      // Drive in from right
      const progress = Math.min(elapsed / 3, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out
      groupRef.current.position.x = 15 - eased * 17; // Stop at x = -2
      groupRef.current.position.z = laneZ;
      
      if (progress >= 1) {
        setPhase('stopped');
      }
    }
    
    if (phase === 'stopped') {
      // Wait for 4 seconds
      if (elapsed > 7) {
        setPhase('departing');
      }
    }
    
    if (phase === 'departing') {
      // Drive out to the left
      const departTime = elapsed - 7;
      const progress = Math.min(departTime / 3, 1);
      const eased = progress * progress; // Ease in
      groupRef.current.position.x = -2 - eased * 15;
      
      if (progress >= 1) {
        setPhase('done');
        // Reset for next cycle
        startTimeRef.current = time + 5 + Math.random() * 10;
        setPhase('waiting');
      }
    }
  });
  
  return (
    <group ref={groupRef} position={[15, 0, laneZ]} rotation={[0, Math.PI / 2, 0]}>
      {/* Cab */}
      <mesh position={[1.3, 0.6, 0]}>
        <boxGeometry args={[1, 1, 0.9]} />
        <meshStandardMaterial 
          color="#2255cc" 
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      {/* Cab Roof */}
      <mesh position={[1.3, 1.2, 0]}>
        <boxGeometry args={[0.9, 0.3, 0.85]} />
        <meshStandardMaterial color="#1a3d8f" />
      </mesh>
      {/* Trailer Connection */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 1, 0.8]} />
        <meshStandardMaterial 
          color="#e0e0e0" 
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Wheels */}
      {[-0.8, -0.4, 1.0, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {[-0.8, -0.4, 1.0, 1.4].map((x, i) => (
        <mesh key={i + 10} position={[x, 0.15, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[1.85, 0.5, 0.3]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color="#ffff00" 
          emissive="#ffff00"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[1.85, 0.5, -0.3]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color="#ffff00" 
          emissive="#ffff00"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// Animated Camera Rig
const CameraRig = () => {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.1;
    state.camera.position.x = Math.sin(t) * 2;
    state.camera.position.z = 8 + Math.cos(t) * 2;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// Floating Particles Effect
const FloatingParticles = () => {
  const particlesRef = useRef<any>();
  const count = 50;
  
  // Generate random positions
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 8 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#00ffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
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
  const [showROI, setShowROI] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);
  const [showAdoptionLeaderboard, setShowAdoptionLeaderboard] = useState(false);
  const [showNorthAmericaMap, setShowNorthAmericaMap] = useState(false);
  const [showFacilitySelector, setShowFacilitySelector] = useState(false);
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility>(PRIMO_FACILITIES[0]); // Default to first facility
  const [soundEnabled, setSoundEnabled] = useState(false); // Off by default - user must enable
  const [logoClicks, setLogoClicks] = useState(0);
  const [scoreData, setScoreData] = useState<ScoreData>({ 
    score: 0, 
    classification: 'INITIALIZING...',
    details: undefined
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([
    { id: 1, text: '🚛 TRL-55920 arrived', time: '2m ago', color: '#00ff00' },
    { id: 2, text: '🚪 Dock 04 assigned', time: '2m ago', color: '#00ffff' },
    { id: 3, text: '📦 Load verified', time: '5m ago', color: '#ffff00' },
    { id: 4, text: '✓ TRL-44101 departed', time: '8m ago', color: '#00ff00' },
  ]);
  const [viewState, setViewState] = useState({
    longitude: PRIMO_FACILITIES[0].coordinates.lng,
    latitude: PRIMO_FACILITIES[0].coordinates.lat,
    zoom: 18,
    pitch: 45
  });

  // Simulate live activity feed
  useEffect(() => {
    const events = [
      { text: '🚛 TRL-{ID} arrived', color: '#00ff00', sound: 'truckArrival', speech: 'Trailer {ID} has arrived at the yard' },
      { text: '🚪 Dock {DOCK} assigned', color: '#00ffff', sound: 'dockAssign', speech: 'Dock {DOCK} has been assigned' },
      { text: '📦 Load verified at Dock {DOCK}', color: '#ffff00', sound: 'notification', speech: 'Load verified at dock {DOCK}' },
      { text: '✓ TRL-{ID} departed', color: '#00ff00', sound: 'truckDeparture', speech: 'Trailer {ID} has departed' },
      { text: '⚠ Yard check initiated', color: '#ff6600', sound: 'notification', speech: 'Yard check initiated' },
    ];

    const interval = setInterval(() => {
      const event = events[Math.floor(Math.random() * events.length)];
      const trailerId = String(10000 + Math.floor(Math.random() * 90000));
      const dockNum = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      
      const newEvent = {
        id: Date.now(),
        text: event.text
          .replace('{ID}', trailerId)
          .replace('{DOCK}', dockNum),
        time: 'now',
        color: event.color,
      };
      
      if (soundEnabled) {
        const speechText = event.speech
          .replace('{ID}', trailerId)
          .replace('{DOCK}', dockNum);
        playSound(event.sound, speechText);
      }
      
      setActivityLog(prev => [newEvent, ...prev.slice(0, 3)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

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
      background: '#0A0E14'
    }}>
      {/* Command Header */}
      <CommandHeader />
      
      {/* Main Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        style={{width: '100%', height: '100%', marginTop: '56px'}}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{source: 'mapbox-dem', exaggeration: 1.5}} 
      >
      </Map>
      
      {/* Vignette Overlay - Industrial Fluidity */}
      <div style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at center, transparent 50%, rgba(10, 14, 20, 0.5) 100%),
          linear-gradient(180deg, rgba(59, 130, 246, 0.02) 0%, transparent 10%, transparent 90%, rgba(30, 41, 59, 0.05) 100%)
        `,
        zIndex: 100
      }} />
      
      {/* Scan Line Effect - Subtle */}
      <div style={{
        position: 'absolute',
        top: 56,
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
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
          animation: 'scan-line 5s linear infinite',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
        }} />
      </div>
      
      {/* Network Stats Ticker - Industrial Design */}
      <div style={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        height: '30px',
        background: 'linear-gradient(90deg, rgba(10, 14, 20, 0.98), rgba(15, 20, 25, 0.98))',
        borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 500
      }}>
        <div style={{
          display: 'flex',
          animation: 'ticker 35s linear infinite',
          whiteSpace: 'nowrap',
          fontFamily: '"Inter", -apple-system, sans-serif',
          fontSize: '0.65rem',
          fontWeight: '500'
        }}>
          {[1, 2].map((_, idx) => {
            const stats = getNetworkStats();
            const totalTrailers = PRIMO_FACILITIES.reduce((sum, f) => sum + f.detectedTrailers, 0);
            const totalGhosts = PRIMO_FACILITIES.filter(f => f.adoptionStatus !== 'not_started').reduce((sum, f) => sum + f.ghostSearches, 0);
            return (
            <div key={idx} style={{ display: 'flex', gap: '40px', paddingRight: '40px' }}>
              <span style={{ color: '#3B82F6' }}>◈ PRIMO BRANDS NETWORK</span>
              <span style={{ color: '#64748B' }}>Facilities Live: <span style={{ color: '#10B981' }}>{stats.adoptedFacilities}/{stats.totalFacilities}</span></span>
              <span style={{ color: '#64748B' }}>Adoption: <span style={{ color: '#3B82F6' }}>{stats.adoptionRate}%</span></span>
              <span style={{ color: '#64748B' }}>Avg Turn Time: <span style={{ color: '#F59E0B' }}>{Math.round(PRIMO_FACILITIES.filter(f => f.adoptionStatus !== 'not_started').reduce((sum, f) => sum + f.avgTurnTime, 0) / stats.adoptedFacilities)} min</span></span>
              <span style={{ color: '#64748B' }}>Daily Trucks: <span style={{ color: '#60A5FA' }}>{stats.totalTrucksPerDay.toLocaleString()}</span></span>
              <span style={{ color: '#64748B' }}>Network YVS: <span style={{ color: '#10B981' }}>{stats.avgYVS}</span></span>
              <span style={{ color: '#64748B' }}>Trailers: <span style={{ color: '#3B82F6' }}>{totalTrailers.toLocaleString()}</span></span>
              <span style={{ color: '#64748B' }}>Untracked: <span style={{ color: totalGhosts > 50 ? '#F97316' : '#10B981' }}>{totalGhosts}</span></span>
              <span style={{ color: '#10B981' }}>▲ +{stats.avgTurnTimeImprovement}% improvement</span>
            </div>
            );
          })}
        </div>
      </div>
      
      {/* 3D Overlay Canvas */}
      <div style={{ 
        position: 'absolute', 
        top: 86, 
        left: 0, 
        width: '100%', 
        height: 'calc(100% - 86px)', 
        pointerEvents: 'none' 
      }}>
        <Canvas camera={{ position: [0, 8, 10], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.2} color="#3B82F6" />
            <pointLight position={[-10, 10, -10]} intensity={0.4} color="#60A5FA" />
            <pointLight position={[0, 5, -8]} intensity={0.8} color="#10B981" />
            <directionalLight position={[-5, 5, 5]} intensity={0.9} />
            <fog attach="fog" args={['#0A0E14', 18, 40]} />
            
            {/* Animated Camera */}
            <CameraRig />
            
            {/* Grid Floor */}
            <GridFloor />
            
            {/* Warehouse Building */}
            <Warehouse />
            
            {/* Dock Platform */}
            <DockPlatform />
            
            {/* Floating Particles */}
            <FloatingParticles />
            
            {/* Trailers at dock */}
            <Trailer position={[-4, 0, -2.5]} rotation={0} color="#e8e8e8" isHighlighted={true} />
            <Trailer position={[-1.5, 0, -2.5]} rotation={0} color="#d0d0d0" isHighlighted={true} />
            <Trailer position={[1, 0, -2.5]} rotation={0} color="#f0f0f0" />
            <Trailer position={[3.5, 0, -2.5]} rotation={0} color="#ddd" isHighlighted={true} />
            
            {/* Trailers in yard */}
            <Trailer position={[-3, 0, 3]} rotation={0.3} color="#c8c8c8" />
            <Trailer position={[0, 0, 4]} rotation={-0.2} color="#e0e0e0" />
            <Trailer position={[4, 0, 2]} rotation={0.1} color="#d5d5d5" />
            
            {/* Animated Trucks driving through */}
            <AnimatedTruck startDelay={0} lane={0} />
            <AnimatedTruck startDelay={5} lane={1} />
            <AnimatedTruck startDelay={12} lane={0} />
        </Canvas>
      </div>
      
      {/* Quick Action Buttons - Industrial Style */}
      <div style={{
        position: 'absolute',
        top: 102,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 1000
      }}>
        {/* PRIMARY CTA: Command Center - Deployment Hub */}
        <button
          onClick={() => setShowCommandCenter(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            color: '#10B981',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontSize: '0.8rem',
            fontWeight: '700',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🎯 Deployment Hub
          <span style={{
            background: '#10B981',
            color: '#000',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.6rem',
            fontWeight: '800'
          }}>260 SITES</span>
        </button>
        
        <button
          onClick={() => setShowROI(true)}
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease'
          }}
        >
          ◈ ROI Calculator
        </button>
        <button
          onClick={() => setShowNetwork(true)}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3B82F6',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease'
          }}
        >
          ⬡ Primo Network
        </button>
        <button
          onClick={() => setShowNorthAmericaMap(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#60A5FA',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.2)'
          }}
        >
          🗺️ NA Network Map
        </button>
        <button
          onClick={() => setShowAdoptionLeaderboard(true)}
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#F59E0B',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease'
          }}
        >
          ◆ Leaderboard
        </button>
        
        {/* Facility Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFacilitySelector(!showFacilitySelector)}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📍 {selectedFacility?.name?.split(' - ')[0] || 'Select Facility'} ▾
          </button>
          
          {showFacilitySelector && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
              background: 'rgba(15, 23, 42, 0.98)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              maxHeight: '400px',
              width: '350px',
              overflowY: 'auto',
              zIndex: 2000,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ 
                color: '#10B981', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                paddingBottom: '8px'
              }}>
                Jump to Facility ({PRIMO_FACILITIES.length} locations)
              </div>
              
              {/* Quick Filter - Show deployed facilities first */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.65rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🟢 Live Facilities
                </div>
                {PRIMO_FACILITIES.filter(f => ['champion', 'full', 'partial', 'pilot'].includes(f.adoptionStatus)).map(facility => (
                  <button
                    key={facility.id}
                    onClick={() => {
                      setSelectedFacility(facility);
                      setShowFacilitySelector(false);
                      // Fly to the facility
                      setViewState(prev => ({
                        ...prev,
                        longitude: facility.coordinates.lng,
                        latitude: facility.coordinates.lat,
                        zoom: 18,
                        pitch: 45
                      }));
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: selectedFacility?.id === facility.id ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: 'none',
                      color: '#E2E8F0',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      fontSize: '0.75rem',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <span style={{ 
                      color: facility.adoptionStatus === 'champion' ? '#FFD700' : 
                             facility.adoptionStatus === 'full' ? '#10B981' : 
                             facility.adoptionStatus === 'partial' ? '#3B82F6' : '#F59E0B',
                      marginRight: '8px'
                    }}>
                      {facility.adoptionStatus === 'champion' ? '★' : '●'}
                    </span>
                    {facility.name}
                    <span style={{ color: '#64748B', fontSize: '0.65rem', marginLeft: '8px' }}>
                      {facility.region}
                    </span>
                  </button>
                ))}
              </div>
              
              <div style={{ borderTop: '1px solid rgba(71, 85, 105, 0.3)', paddingTop: '10px', marginTop: '10px' }}>
                <div style={{ color: '#94A3B8', fontSize: '0.65rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚪ Other Facilities
                </div>
                {PRIMO_FACILITIES.filter(f => f.adoptionStatus === 'not_started').slice(0, 20).map(facility => (
                  <button
                    key={facility.id}
                    onClick={() => {
                      setSelectedFacility(facility);
                      setShowFacilitySelector(false);
                      setViewState(prev => ({
                        ...prev,
                        longitude: facility.coordinates.lng,
                        latitude: facility.coordinates.lat,
                        zoom: 18,
                        pitch: 45
                      }));
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: selectedFacility?.id === facility.id ? 'rgba(100, 116, 139, 0.2)' : 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      fontSize: '0.75rem',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    ○ {facility.name}
                    <span style={{ color: '#475569', fontSize: '0.65rem', marginLeft: '8px' }}>
                      {facility.region}
                    </span>
                  </button>
                ))}
                <div style={{ color: '#475569', fontSize: '0.65rem', textAlign: 'center', marginTop: '8px' }}>
                  +{PRIMO_FACILITIES.filter(f => f.adoptionStatus === 'not_started').length - 20} more facilities...
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            background: soundEnabled ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${soundEnabled ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: soundEnabled ? '#3B82F6' : '#EF4444',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"Inter", -apple-system, sans-serif',
            fontSize: '0.85rem'
          }}
        >
          {soundEnabled ? '◉' : '○'}
        </button>
      </div>
      
      {/* Mini Radar - Industrial Design */}
      <div style={{
        position: 'absolute',
        top: 150,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15, 20, 25, 0.95) 0%, rgba(10, 14, 20, 0.98) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* Radar Grid */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '50px',
          height: '50px',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '26px',
          height: '26px',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          borderRadius: '50%'
        }} />
        {/* Crosshairs */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'rgba(59, 130, 246, 0.15)'
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          background: 'rgba(59, 130, 246, 0.15)'
        }} />
        {/* Sweep Line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '35px',
          height: '1px',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.6), transparent)',
          transformOrigin: 'left center',
          animation: 'radar-sweep 4s linear infinite'
        }} />
        {/* Blips */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '60%',
          width: '4px',
          height: '4px',
          background: '#10B981',
          borderRadius: '50%',
          boxShadow: '0 0 6px #10B981',
          animation: 'pulse 1s infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '25%',
          width: '4px',
          height: '4px',
          background: '#10B981',
          borderRadius: '50%',
          boxShadow: '0 0 6px #10B981',
          animation: 'pulse 1.5s infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '70%',
          left: '65%',
          width: '3px',
          height: '3px',
          background: '#F59E0B',
          borderRadius: '50%',
          boxShadow: '0 0 6px #F59E0B',
          animation: 'pulse 2s infinite'
        }} />
      </div>
      
      {/* UI Overlay */}
      <AssetPalette />
      <Leaderboard />
      
      {/* BOL Trigger Button - Industrial Design */}
      <button 
        onClick={() => setShowBOL(true)}
        style={{
          position: 'absolute',
          top: 238,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10B981',
          color: '#0A0E14',
          border: 'none',
          padding: '10px 20px',
          fontWeight: '600',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: '"Inter", -apple-system, sans-serif',
          fontSize: '0.8rem',
          letterSpacing: '0.5px',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          transition: 'all 0.2s ease',
          animation: 'float-centered 4s ease-in-out infinite'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)';
        }}
      >
        ⇄ NEW HANDOFF - DIGITAL BOL
      </button>

      {showBOL && <DigitalBOL onClose={() => setShowBOL(false)} />}
      
      {/* Team Invitation Easter Egg */}
      {showInvitation && <TeamInvitation onClose={() => setShowInvitation(false)} />}
      
      {/* Enhanced Score Display Panel - Industrial Style */}
      <div style={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 20, 
        color: '#E2E8F0', 
        fontFamily: '"Inter", -apple-system, sans-serif', 
        background: 'rgba(15, 20, 25, 0.95)', 
        padding: '20px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        minWidth: '280px',
        backdropFilter: 'blur(12px)',
        animation: 'slideInLeft 0.3s ease-out',
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.15)'
        }}>
          <span style={{ 
            color: '#94A3B8', 
            fontSize: '0.7rem', 
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            fontWeight: '600'
          }}>
            Facility Analysis
          </span>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: '600',
            color: scoreData.score >= 80 ? '#10B981' : scoreData.score >= 50 ? '#F59E0B' : '#EF4444',
            background: `${scoreData.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : scoreData.score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
            padding: '4px 10px',
            borderRadius: '4px',
            border: `1px solid ${scoreData.score >= 80 ? 'rgba(16, 185, 129, 0.25)' : scoreData.score >= 50 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
          }}>
            {scoreData.score >= 80 ? '◆ HIGH VALUE' : scoreData.score >= 50 ? '◈ STANDARD' : '○ LOW'}
          </span>
        </div>
        
        {/* Score Display */}
        {isLoading ? (
          <div style={{ 
            fontSize: '1.4rem', 
            color: '#3B82F6',
            fontWeight: '600',
            animation: 'pulse 1s infinite'
          }}>
            ANALYZING...
          </div>
        ) : (
          <div style={{ 
            fontSize: '2.8rem', 
            fontWeight: '700', 
            color: scoreData.score >= 80 ? '#10B981' : scoreData.score >= 50 ? '#F59E0B' : '#EF4444',
            marginBottom: '5px',
            lineHeight: '1'
          }}>
            {scoreData.score}
            <span style={{ fontSize: '1rem', color: '#475569', marginLeft: '5px', fontWeight: '500' }}>/100</span>
          </div>
        )}
        
        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '15px', fontWeight: '500' }}>
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
      
      {/* Live Activity Feed - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: '280px',
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.9) 0%, rgba(10, 5, 25, 0.9) 100%)',
        border: '1px solid rgba(255, 0, 255, 0.3)',
        borderRadius: '8px',
        padding: '15px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.7rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(255, 0, 255, 0.1)',
        zIndex: 1000,
        animation: 'slideInRight 0.5s ease-out'
      }}>
        <div style={{ 
          color: '#ff00ff', 
          marginBottom: '10px',
          fontSize: '0.65rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ animation: 'pulse 1s infinite' }}>⚡</span>
          Live Activity
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activityLog.map((event) => (
            <div 
              key={event.id}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                color: '#888',
                padding: '6px 8px',
                background: `${event.color}08`,
                borderRadius: '4px',
                borderLeft: `2px solid ${event.color}`,
                animation: event.time === 'now' ? 'fadeIn 0.3s ease-out' : 'none'
              }}
            >
              <span>{event.text}</span>
              <span style={{ color: event.color }}>{event.time}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Easter Egg Hint (subtle) */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.55rem',
        color: '#1a1a1a',
        zIndex: 100,
        letterSpacing: '2px'
      }}>
        ↑↑↓↓←→←→BA
      </div>
      
      {/* Selected Facility Info Card - Top Left */}
      {selectedFacility && (
        <div style={{
          position: 'absolute',
          top: 140,
          left: 20,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '260px',
          maxWidth: '300px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          animation: 'slideInLeft 0.3s ease-out'
        }}>
          {/* Facility Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ 
                color: '#10B981', 
                fontSize: '0.65rem', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                📍 Current Location
              </div>
              <div style={{ 
                color: '#F1F5F9', 
                fontSize: '0.9rem', 
                fontWeight: '700',
                lineHeight: '1.3'
              }}>
                {selectedFacility.name}
              </div>
            </div>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: '600',
              padding: '4px 8px',
              borderRadius: '4px',
              background: selectedFacility.adoptionStatus === 'champion' ? 'rgba(255, 215, 0, 0.15)' :
                          selectedFacility.adoptionStatus === 'full' ? 'rgba(16, 185, 129, 0.15)' :
                          selectedFacility.adoptionStatus === 'partial' ? 'rgba(59, 130, 246, 0.15)' :
                          selectedFacility.adoptionStatus === 'pilot' ? 'rgba(245, 158, 11, 0.15)' :
                          'rgba(100, 116, 139, 0.15)',
              color: selectedFacility.adoptionStatus === 'champion' ? '#FFD700' :
                     selectedFacility.adoptionStatus === 'full' ? '#10B981' :
                     selectedFacility.adoptionStatus === 'partial' ? '#3B82F6' :
                     selectedFacility.adoptionStatus === 'pilot' ? '#F59E0B' :
                     '#64748B',
              border: `1px solid ${
                selectedFacility.adoptionStatus === 'champion' ? 'rgba(255, 215, 0, 0.3)' :
                selectedFacility.adoptionStatus === 'full' ? 'rgba(16, 185, 129, 0.3)' :
                selectedFacility.adoptionStatus === 'partial' ? 'rgba(59, 130, 246, 0.3)' :
                selectedFacility.adoptionStatus === 'pilot' ? 'rgba(245, 158, 11, 0.3)' :
                'rgba(100, 116, 139, 0.3)'
              }`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {selectedFacility.adoptionStatus === 'champion' ? '★ CHAMPION' :
               selectedFacility.adoptionStatus === 'full' ? '● LIVE' :
               selectedFacility.adoptionStatus === 'partial' ? '◐ PARTIAL' :
               selectedFacility.adoptionStatus === 'pilot' ? '◌ PILOT' :
               '○ PENDING'}
            </span>
          </div>
          
          <div style={{ 
            color: '#64748B', 
            fontSize: '0.7rem', 
            marginBottom: '12px',
            display: 'flex',
            gap: '12px'
          }}>
            <span>{selectedFacility.region}</span>
            <span>•</span>
            <span>{selectedFacility.coordinates.lat.toFixed(4)}°, {selectedFacility.coordinates.lng.toFixed(4)}°</span>
          </div>
          
          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                YVS Score
              </div>
              <div style={{ 
                color: selectedFacility.yvsScore >= 80 ? '#10B981' : selectedFacility.yvsScore >= 60 ? '#F59E0B' : '#EF4444',
                fontSize: '1.1rem', 
                fontWeight: '700' 
              }}>
                {selectedFacility.yvsScore}/100
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Trucks/Day
              </div>
              <div style={{ color: '#E2E8F0', fontSize: '1.1rem', fontWeight: '700' }}>
                {selectedFacility.trucksPerDay}
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Avg Turn Time
              </div>
              <div style={{ color: '#E2E8F0', fontSize: '1.1rem', fontWeight: '700' }}>
                {selectedFacility.avgTurnTime}min
              </div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Annual ROI
              </div>
              <div style={{ color: '#10B981', fontSize: '1.1rem', fontWeight: '700' }}>
                ${(selectedFacility.projectedAnnualROI / 1000).toFixed(0)}K
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => {
                setViewState(prev => ({ ...prev, zoom: prev.zoom + 1 }));
              }}
              style={{
                flex: 1,
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3B82F6',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontWeight: '600'
              }}
            >
              🔍 Zoom In
            </button>
            <button
              onClick={() => {
                setViewState(prev => ({ 
                  ...prev, 
                  pitch: prev.pitch === 45 ? 0 : 45 
                }));
              }}
              style={{
                flex: 1,
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#A855F7',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.65rem',
                fontWeight: '600'
              }}
            >
              🎯 Toggle 3D
            </button>
          </div>
          
          {/* Open Command Center Button */}
          <button
            onClick={() => setShowCommandCenter(true)}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              color: '#34D399',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            🎯 COMMAND CENTER
          </button>
        </div>
      )}
      
      {/* ROI Calculator Modal */}
      {showROI && (
        <ROICalculator onClose={() => setShowROI(false)} />
      )}
      
      {/* Network Map Modal */}
      {showNetwork && (
        <NetworkMap onClose={() => setShowNetwork(false)} />
      )}
      
      {/* North America Map Modal */}
      {showNorthAmericaMap && (
        <NorthAmericaMap 
          onClose={() => setShowNorthAmericaMap(false)} 
          onZoomToFacility={(facility) => {
            // Close the NA map and open Command Center for that facility
            setShowNorthAmericaMap(false);
            setSelectedFacility(facility);
            setShowCommandCenter(true);
          }}
        />
      )}
      
      {/* Adoption Leaderboard Modal */}
      {showAdoptionLeaderboard && (
        <AdoptionLeaderboard onClose={() => setShowAdoptionLeaderboard(false)} />
      )}
      
      {/* Facility Command Center - Unified deployment view */}
      {showCommandCenter && (
        <FacilityCommandCenter 
          onClose={() => setShowCommandCenter(false)}
          initialFacility={selectedFacility}
        />
      )}
    </div>
  );
}
