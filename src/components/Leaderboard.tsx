import React, { useState } from 'react';

/**
 * =============================================================================
 * LEADERBOARD COMPONENT - Network Velocity Dashboard
 * =============================================================================
 * 
 * Displays the facility performance leaderboard across the network.
 * Industrial Fluidity design - operating system aesthetic.
 * 
 * SCORE INTERPRETATION:
 * - 80-100 (GREEN):  ◆ WHALE - Top performer, minimal friction
 * - 50-79 (AMBER):   ◇ STANDARD - Good performance, room for optimization
 * - 0-49 (RED):      ◁ LOW - Underperforming, needs attention
 * 
 * NO FRICTION - Autonomous Orchestration at scale.
 */

type Facility = {
  id: string;
  name: string;
  score: number;
  tier: 'Local' | 'Regional' | 'Network';
  trend: 'up' | 'down' | 'stable';
  turnTime?: number; // Average minutes per truck turn
  ghostCount?: number; // Number of "lost" assets
};

const MOCK_LEADERBOARD: Facility[] = [
  { id: '1', name: 'Jacksonville DC (You)', score: 75.5, tier: 'Local', trend: 'up', turnTime: 28, ghostCount: 2 },
  { id: '2', name: 'Savannah Port Terminal', score: 82.1, tier: 'Regional', trend: 'stable', turnTime: 24, ghostCount: 0 },
  { id: '3', name: 'Atlanta Distribution', score: 68.4, tier: 'Regional', trend: 'down', turnTime: 32, ghostCount: 5 },
  { id: '4', name: 'Miami Cold Storage', score: 91.0, tier: 'Network', trend: 'up', turnTime: 22, ghostCount: 0 },
  { id: '5', name: 'Charlotte Hub', score: 55.2, tier: 'Regional', trend: 'down', turnTime: 38, ghostCount: 8 },
];

// Score color coding based on classification thresholds
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10B981'; // Green - WHALE
  if (score >= 50) return '#F59E0B'; // Amber - STANDARD
  return '#EF4444'; // Red - LOW
};

const getScoreEmoji = (score: number): string => {
  if (score >= 80) return '◆';
  if (score >= 50) return '◇';
  return '◁';
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'WHALE';
  if (score >= 50) return 'STANDARD';
  return 'LOW';
};

export default function Leaderboard() {
  const [showLegend, setShowLegend] = useState(false);
  
  // Sort by score descending
  const sortedData = [...MOCK_LEADERBOARD].sort((a, b) => b.score - a.score);

  return (
    <div style={{
      position: 'absolute',
      top: 102,
      right: 20,
      width: '360px',
      background: 'rgba(15, 20, 25, 0.95)',
      border: '1px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '10px',
      color: '#E2E8F0',
      fontFamily: '"Inter", -apple-system, sans-serif',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      padding: '0',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 15px',
        borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
        background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 41, 59, 0.3) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '9px 9px 0 0'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '2px',
          color: '#3B82F6',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1rem' }}>◈</span>
          Network Velocity
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setShowLegend(!showLegend)}
            style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              color: '#3B82F6', 
              padding: '4px 10px', 
              cursor: 'pointer',
              fontSize: '0.6rem',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: '500'
            }}
          >
            {showLegend ? 'HIDE' : 'INFO'}
          </button>
          <span style={{ 
            fontSize: '0.65rem', 
            color: '#10B981', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px'
          }}>
            <span style={{ animation: 'pulse 2s infinite' }}>●</span> LIVE
          </span>
        </div>
      </div>

      {/* Legend Panel (Collapsible) */}
      {showLegend && (
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(10, 14, 20, 0.6)',
          fontSize: '0.7rem'
        }}>
          <div style={{ marginBottom: '8px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Yard Velocity Score</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
              <span style={{ color: '#10B981', fontWeight: '600' }}>80-100</span>
              <span>◆ WHALE - Top performer, minimal friction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
              <span style={{ color: '#F59E0B', fontWeight: '600' }}>50-79</span>
              <span>◇ STANDARD - Good, room to optimize</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
              <span style={{ color: '#EF4444', fontWeight: '600' }}>0-49</span>
              <span>◁ LOW - Needs immediate attention</span>
            </div>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', color: '#64748B', fontSize: '0.65rem' }}>
            <div><strong>Turn Time:</strong> Avg minutes per truck (Target: 24)</div>
            <div><strong>Ghosts:</strong> Untracked assets needing manual search</div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <ul style={{ listStyle: 'none', margin: 0, padding: '8px 10px' }}>
        {sortedData.map((facility, index) => {
          const isUser = facility.name.includes('(You)');
          const scoreColor = getScoreColor(facility.score);
          
          return (
            <li key={facility.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 6px',
              borderBottom: index !== sortedData.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
              background: isUser ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isUser ? '3px solid #3B82F6' : '3px solid transparent',
              borderRadius: '4px'
            }}>
              {/* Rank & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ 
                  color: index < 3 ? '#F59E0B' : '#64748B', 
                  fontWeight: '600',
                  width: '24px',
                  fontSize: '0.85rem'
                }}>
                  #{index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: isUser ? '600' : '400', 
                    color: isUser ? '#E2E8F0' : '#94A3B8',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {facility.name}
                    <span style={{ fontSize: '0.85rem' }}>{getScoreEmoji(facility.score)}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span>{facility.tier}</span>
                    {facility.turnTime && <span>◷ {facility.turnTime}m</span>}
                    {facility.ghostCount !== undefined && facility.ghostCount > 0 && (
                      <span style={{ color: '#F59E0B' }}>◌ {facility.ghostCount}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Score & Trend */}
              <div style={{ textAlign: 'right', minWidth: '50px' }}>
                <div style={{ 
                  fontSize: '1.05rem', 
                  fontWeight: '600', 
                  color: scoreColor
                }}>
                  {facility.score.toFixed(1)}
                </div>
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: facility.trend === 'up' ? '#10B981' : facility.trend === 'down' ? '#EF4444' : '#64748B' 
                }}>
                  {facility.trend === 'up' ? '▲ +2.1' : facility.trend === 'down' ? '▼ -1.8' : '— 0.0'}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      {/* Footer - KPI Target */}
      <div style={{ 
        padding: '10px 12px', 
        textAlign: 'center', 
        fontSize: '0.7rem', 
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(10, 14, 20, 0.4)'
      }}>
        <div style={{ color: '#3B82F6', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Network Target</div>
        <div style={{ color: '#94A3B8' }}>
          Turn Time: <span style={{ color: '#10B981' }}>24 MIN</span> | 
          Ghost Count: <span style={{ color: '#10B981' }}>0</span> | 
          YVS: <span style={{ color: '#10B981' }}>80+</span>
        </div>
      </div>
    </div>
  );
}
