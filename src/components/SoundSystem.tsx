import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * =============================================================================
 * SOUND EFFECTS SYSTEM - Immersive Audio Feedback
 * =============================================================================
 * 
 * Provides audio feedback for key yard events:
 * - Truck arrivals/departures
 * - Gate opens
 * - Dock assignments
 * - Alerts and warnings
 * - UI interactions
 * 
 * Uses Web Audio API for low-latency, procedurally generated sounds.
 */

type SoundType = 
  | 'truckArrival' 
  | 'truckDeparture' 
  | 'gateOpen' 
  | 'dockAssign' 
  | 'alert' 
  | 'success' 
  | 'click' 
  | 'hover'
  | 'scan'
  | 'notification';

interface SoundContextType {
  playSound: (type: SoundType) => void;
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (vol: number) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const useSounds = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSounds must be used within a SoundProvider');
  }
  return context;
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first user interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;

      switch (type) {
        case 'truckArrival':
          // Low rumble then high beep
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(80, now);
          oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);
          gainNode.gain.setValueAtTime(volume * 0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          oscillator.start(now);
          oscillator.stop(now + 0.4);
          break;

        case 'truckDeparture':
          // High to low fade
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(500, now);
          oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
          gainNode.gain.setValueAtTime(volume * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;

        case 'gateOpen':
          // Mechanical clunk
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.setValueAtTime(100, now + 0.05);
          oscillator.frequency.setValueAtTime(200, now + 0.1);
          gainNode.gain.setValueAtTime(volume * 0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;

        case 'dockAssign':
          // Two-tone beep
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, now);
          oscillator.frequency.setValueAtTime(660, now + 0.1);
          gainNode.gain.setValueAtTime(volume * 0.3, now);
          gainNode.gain.setValueAtTime(volume * 0.3, now + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;

        case 'alert':
          // Urgent beeping
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(880, now);
          oscillator.frequency.setValueAtTime(440, now + 0.1);
          oscillator.frequency.setValueAtTime(880, now + 0.2);
          gainNode.gain.setValueAtTime(volume * 0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;

        case 'success':
          // Happy ascending tones
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(523, now); // C5
          oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
          oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
          gainNode.gain.setValueAtTime(volume * 0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          oscillator.start(now);
          oscillator.stop(now + 0.35);
          break;

        case 'click':
          // Quick tick
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(1000, now);
          gainNode.gain.setValueAtTime(volume * 0.15, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          oscillator.start(now);
          oscillator.stop(now + 0.05);
          break;

        case 'hover':
          // Soft blip
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, now);
          gainNode.gain.setValueAtTime(volume * 0.08, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
          oscillator.start(now);
          oscillator.stop(now + 0.03);
          break;

        case 'scan':
          // Sci-fi sweep
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
          oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.6);
          gainNode.gain.setValueAtTime(volume * 0.15, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          oscillator.start(now);
          oscillator.stop(now + 0.6);
          break;

        case 'notification':
          // Gentle ping
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, now);
          oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.15);
          gainNode.gain.setValueAtTime(volume * 0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;

        default:
          break;
      }
    } catch (error) {
      console.log('Sound playback error:', error);
    }
  }, [isMuted, volume, getAudioContext]);

  return (
    <SoundContext.Provider value={{ playSound, isMuted, setMuted, volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  );
};

// Sound Control Toggle Component
export const SoundToggle: React.FC = () => {
  const { isMuted, setMuted, volume, setVolume, playSound } = useSounds();

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(0, 10, 20, 0.9)',
      padding: '8px 15px',
      borderRadius: '20px',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      zIndex: 1000,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.7rem'
    }}>
      <button
        onClick={() => {
          setMuted(!isMuted);
          if (isMuted) playSound('click');
        }}
        style={{
          background: 'none',
          border: 'none',
          color: isMuted ? '#ff4444' : '#00ffff',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '2px'
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        disabled={isMuted}
        style={{
          width: '60px',
          accentColor: '#00ffff',
          opacity: isMuted ? 0.5 : 1
        }}
      />
      <span style={{ color: '#666', minWidth: '30px' }}>
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
};
