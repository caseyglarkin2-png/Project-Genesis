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
import ROICalculator from './ROICalculator';
import NetworkMap from './NetworkMap';

// MAPBOX TOKEN REQUIRED HERE
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
// Default to the live Render backend if the environment variable is not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-genesis-backend-8uk2.onrender.com';

// --- Sound System ---
let audioContext: AudioContext | null = null;

const playSound = (type: string) => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    const now = ctx.currentTime;
    const volume = 0.2;

    switch (type) {
      case 'truckArrival':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
      case 'truckDeparture':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        gainNode.gain.setValueAtTime(volume * 0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
      case 'dockAssign':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(660, now + 0.1);
        gainNode.gain.setValueAtTime(volume * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
      case 'notification':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        gainNode.gain.setValueAtTime(volume * 0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
    }
  } catch (e) {
    // Silent fail if audio not available
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
  const [soundEnabled, setSoundEnabled] = useState(true);
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
    longitude: -78.789,
    latitude: 34.754,
    zoom: 18,
    pitch: 45
  });

  // Simulate live activity feed
  useEffect(() => {
    const events = [
      { text: '🚛 TRL-{ID} arrived', color: '#00ff00', sound: 'truckArrival' },
      { text: '🚪 Dock {DOCK} assigned', color: '#00ffff', sound: 'dockAssign' },
      { text: '📦 Load verified at Dock {DOCK}', color: '#ffff00', sound: 'notification' },
      { text: '✓ TRL-{ID} departed', color: '#00ff00', sound: 'truckDeparture' },
      { text: '⚠ Yard check initiated', color: '#ff6600', sound: 'notification' },
    ];

    const interval = setInterval(() => {
      const event = events[Math.floor(Math.random() * events.length)];
      const newEvent = {
        id: Date.now(),
        text: event.text
          .replace('{ID}', String(10000 + Math.floor(Math.random() * 90000)))
          .replace('{DOCK}', String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')),
        time: 'now',
        color: event.color,
      };
      
      if (soundEnabled) {
        playSound(event.sound);
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
      
      {/* Network Stats Ticker */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        height: '32px',
        background: 'linear-gradient(90deg, rgba(0, 10, 20, 0.95), rgba(10, 5, 25, 0.95))',
        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 500
      }}>
        <div style={{
          display: 'flex',
          animation: 'ticker 30s linear infinite',
          whiteSpace: 'nowrap',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.7rem'
        }}>
          {[1, 2].map((_, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '40px', paddingRight: '40px' }}>
              <span style={{ color: '#00ffff' }}>📊 NETWORK STATS</span>
              <span style={{ color: '#888' }}>Facilities Online: <span style={{ color: '#00ff00' }}>847</span></span>
              <span style={{ color: '#888' }}>Active Trailers: <span style={{ color: '#00ffff' }}>12,459</span></span>
              <span style={{ color: '#888' }}>Avg Turn Time: <span style={{ color: '#ffff00' }}>26.4 min</span></span>
              <span style={{ color: '#888' }}>Trucks in Transit: <span style={{ color: '#ff00ff' }}>3,291</span></span>
              <span style={{ color: '#888' }}>Network YVS: <span style={{ color: '#00ff00' }}>78.2</span></span>
              <span style={{ color: '#888' }}>Daily Moves: <span style={{ color: '#00ffff' }}>45,892</span></span>
              <span style={{ color: '#888' }}>Ghost Assets: <span style={{ color: '#ff6600' }}>142</span></span>
              <span style={{ color: '#00ff00' }}>▲ +2.1% WoW</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 3D Overlay Canvas */}
      <div style={{ 
        position: 'absolute', 
        top: 92, 
        left: 0, 
        width: '100%', 
        height: 'calc(100% - 92px)', 
        pointerEvents: 'none' 
      }}>
        <Canvas camera={{ position: [0, 8, 10], fov: 50 }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
            <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff00ff" />
            <pointLight position={[0, 5, -8]} intensity={1} color="#00ff00" />
            <directionalLight position={[-5, 5, 5]} intensity={0.8} />
            <fog attach="fog" args={['#0a0a0f', 15, 35]} />
            
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
      
      {/* Quick Action Buttons */}
      <div style={{
        position: 'absolute',
        top: 110,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setShowROI(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 200, 0, 0.1) 100%)',
            border: '1px solid rgba(0, 255, 0, 0.4)',
            color: '#00ff00',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '1px',
            transition: 'all 0.3s ease'
          }}
        >
          💰 ROI Calculator
        </button>
        <button
          onClick={() => setShowNetwork(true)}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 200, 200, 0.1) 100%)',
            border: '1px solid rgba(0, 255, 255, 0.4)',
            color: '#00ffff',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.7rem',
            letterSpacing: '1px',
            transition: 'all 0.3s ease'
          }}
        >
          🌐 Network (250 Plants)
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            background: soundEnabled ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${soundEnabled ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 0, 0, 0.4)'}`,
            color: soundEnabled ? '#00ffff' : '#ff4444',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.9rem'
          }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </div>
      
      {/* Mini Radar */}
      <div style={{
        position: 'absolute',
        top: 160,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 20, 30, 0.9) 0%, rgba(0, 10, 20, 0.95) 100%)',
        border: '2px solid rgba(0, 255, 255, 0.4)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 30px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* Radar Grid */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60px',
          height: '60px',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '30px',
          height: '30px',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(0, 255, 255, 0.15)',
          borderRadius: '50%'
        }} />
        {/* Crosshairs */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'rgba(0, 255, 255, 0.2)'
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '1px',
          background: 'rgba(0, 255, 255, 0.2)'
        }} />
        {/* Sweep Line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '40px',
          height: '2px',
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.8), transparent)',
          transformOrigin: 'left center',
          animation: 'radar-sweep 3s linear infinite'
        }} />
        {/* Blips */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '60%',
          width: '4px',
          height: '4px',
          background: '#00ff00',
          borderRadius: '50%',
          boxShadow: '0 0 6px #00ff00',
          animation: 'pulse 1s infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '25%',
          width: '4px',
          height: '4px',
          background: '#00ff00',
          borderRadius: '50%',
          boxShadow: '0 0 6px #00ff00',
          animation: 'pulse 1.5s infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '70%',
          left: '65%',
          width: '3px',
          height: '3px',
          background: '#ffff00',
          borderRadius: '50%',
          boxShadow: '0 0 6px #ffff00',
          animation: 'pulse 2s infinite'
        }} />
      </div>
      
      {/* UI Overlay */}
      <AssetPalette />
      <Leaderboard />
      
      {/* BOL Trigger Button - Redesigned */}
      <button 
        onClick={() => setShowBOL(true)}
        style={{
          position: 'absolute',
          top: 200,
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
      
      {/* ROI Calculator Modal */}
      {showROI && (
        <ROICalculator onClose={() => setShowROI(false)} />
      )}
      
      {/* Network Map Modal */}
      {showNetwork && (
        <NetworkMap onClose={() => setShowNetwork(false)} />
      )}
    </div>
  );
}
