import React, { useState, useEffect } from 'react';

/**
 * =============================================================================
 * COMMAND HEADER - Tactical Operations Center Header
 * =============================================================================
 * 
 * The cinematic header that makes this feel like a military-grade operations
 * center. Shows system status, live clock, and connection info.
 */

export default function CommandHeader() {
  const [time, setTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'linear-gradient(180deg, rgba(0, 10, 20, 0.98) 0%, rgba(0, 10, 20, 0.85) 100%)',
      borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 2000,
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 30px rgba(0, 255, 255, 0.1)',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Left: Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Animated Logo */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00ffff 0%, #00ff00 50%, #ff00ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
        }}>
          🚀
        </div>
        
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #00ffff, #00ff00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px'
          }}>
            PROJECT GENESIS
          </div>
          <div style={{
            fontSize: '0.65rem',
            color: '#666',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}>
            YARD ORCHESTRATION COMMAND
          </div>
        </div>
      </div>

      {/* Center: Status Indicators */}
      <div style={{ 
        display: 'flex', 
        gap: '25px',
        fontSize: '0.75rem'
      }}>
        <StatusIndicator 
          label="BACKEND" 
          status="online" 
          detail="Render" 
        />
        <StatusIndicator 
          label="VISION AI" 
          status="ready" 
          detail="YOLOv8" 
        />
        <StatusIndicator 
          label="SATELLITE" 
          status="live" 
          detail="Mapbox" 
        />
      </div>

      {/* Right: Clock & User */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px',
        fontSize: '0.8rem'
      }}>
        {/* Live Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            color: '#00ffff', 
            fontSize: '1rem',
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div style={{ color: '#555', fontSize: '0.65rem' }}>
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ 
          width: '1px', 
          height: '30px', 
          background: 'linear-gradient(180deg, transparent, #00ffff, transparent)' 
        }} />

        {/* Team Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(255, 0, 255, 0.1)',
          border: '1px solid rgba(255, 0, 255, 0.3)',
          borderRadius: '20px'
        }}>
          <span style={{ fontSize: '1rem' }}>🐟</span>
          <div>
            <div style={{ color: '#ff00ff', fontWeight: 'bold', fontSize: '0.7rem' }}>
              TEAM FISHASSASSIN
            </div>
            <div style={{ color: '#666', fontSize: '0.6rem' }}>
              HACKATHON 2025
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Status Indicator Component
function StatusIndicator({ 
  label, 
  status, 
  detail 
}: { 
  label: string; 
  status: 'online' | 'ready' | 'live' | 'offline'; 
  detail: string;
}) {
  const colors = {
    online: '#00ff00',
    ready: '#00ffff',
    live: '#ff00ff',
    offline: '#ff0000'
  };
  
  const color = colors[status];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 10px ${color}`,
        animation: 'pulse 2s infinite'
      }} />
      <div>
        <div style={{ color: '#888', fontSize: '0.6rem', letterSpacing: '1px' }}>
          {label}
        </div>
        <div style={{ color: color, fontWeight: 'bold' }}>
          {status.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
