import React, { useState, useEffect } from 'react';

/**
 * =============================================================================
 * COMMAND HEADER - FreightRoll Orchestration Command Center
 * =============================================================================
 * 
 * Industrial Fluidity design - feels like an operating system, not a website.
 * Dark, high-contrast interfaces for the command center.
 */

// FreightRoll Node Logo SVG Component
const NodeLogo = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hexagon outline */}
    <path 
      d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
      stroke="#3B82F6" 
      strokeWidth="2" 
      fill="none"
      opacity="0.8"
    />
    {/* Inner hexagon */}
    <path 
      d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" 
      stroke="#64748B" 
      strokeWidth="1.5" 
      fill="rgba(59, 130, 246, 0.1)"
    />
    {/* Center circle - The Node */}
    <circle cx="50" cy="50" r="8" fill="#3B82F6" />
    <circle cx="50" cy="50" r="14" stroke="#3B82F6" strokeWidth="1" fill="none" opacity="0.5" />
    {/* Connection lines from center */}
    <line x1="50" y1="50" x2="50" y2="20" stroke="#3B82F6" strokeWidth="1.5" opacity="0.6" />
    <line x1="50" y1="50" x2="75" y2="35" stroke="#3B82F6" strokeWidth="1.5" opacity="0.6" />
    <line x1="50" y1="50" x2="25" y2="35" stroke="#3B82F6" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

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
      height: '56px',
      background: 'linear-gradient(180deg, rgba(10, 14, 20, 0.98) 0%, rgba(15, 20, 25, 0.95) 100%)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 2000,
      fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Left: Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* The Node Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'float 4s ease-in-out infinite'
        }}>
          <NodeLogo />
        </div>
        
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: '#F1F5F9',
            letterSpacing: '3px',
            fontFamily: '"Inter", sans-serif'
          }}>
            FREIGHTROLL
          </div>
          <div style={{
            fontSize: '0.6rem',
            color: '#64748B',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            FACILITY ORCHESTRATION
          </div>
        </div>
      </div>

      {/* Center: Status Indicators */}
      <div style={{ 
        display: 'flex', 
        gap: '24px',
        fontSize: '0.75rem'
      }}>
        <StatusIndicator 
          label="ORCHESTRATOR" 
          status="online" 
          detail="Active" 
        />
        <StatusIndicator 
          label="VISION AI" 
          status="ready" 
          detail="YOLOv8" 
        />
        <StatusIndicator 
          label="GROUND TRUTH" 
          status="live" 
          detail="Synced" 
        />
      </div>

      {/* Right: Clock & Mode */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px',
        fontSize: '0.8rem'
      }}>
        {/* Live Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            color: '#F1F5F9', 
            fontSize: '0.95rem',
            fontWeight: '600',
            letterSpacing: '1px',
            fontFamily: '"SF Mono", "JetBrains Mono", monospace'
          }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div style={{ color: '#475569', fontSize: '0.6rem', fontWeight: '500' }}>
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ 
          width: '1px', 
          height: '28px', 
          background: 'linear-gradient(180deg, transparent, #3B82F6, transparent)',
          opacity: 0.4
        }} />

        {/* Mode Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '6px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
          }} />
          <div>
            <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '0.7rem', letterSpacing: '1px' }}>
              COMMAND MODE
            </div>
            <div style={{ color: '#64748B', fontSize: '0.55rem', letterSpacing: '0.5px' }}>
              NO FRICTION
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Status Indicator Component - Industrial Style
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
    online: '#10B981',
    ready: '#3B82F6',
    live: '#60A5FA',
    offline: '#EF4444'
  };
  
  const color = colors[status];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: 'pulse 2s infinite'
      }} />
      <div>
        <div style={{ color: '#64748B', fontSize: '0.55rem', letterSpacing: '1px', fontWeight: '500' }}>
          {label}
        </div>
        <div style={{ color: '#E2E8F0', fontWeight: '600', fontSize: '0.7rem' }}>
          {status.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
