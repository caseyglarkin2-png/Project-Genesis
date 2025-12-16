import React, { useState } from 'react';

/**
 * =============================================================================
 * LEADERBOARD COMPONENT - Network Velocity Dashboard
 * =============================================================================
 * 
 * Displays the gamified leaderboard for facility performance across the network.
 * This is the "Network Dominance" tier of the gamification system.
 * 
 * SCORE INTERPRETATION:
 * - 80-100 (GREEN):  🐋 WHALE - Top performer, minimal "Heavy Water" friction
 * - 50-79 (YELLOW):  🎯 STANDARD - Good performance, room for optimization
 * - 0-49 (RED):      📉 LOW - Underperforming, needs attention
 * 
 * METRICS EXPLAINED:
 * - Yard Velocity Score (YVS): Composite metric of Turn-Time, Staging Accuracy, 
 *   and Asset Visibility. Higher = faster truck throughput.
 * - Trend Arrow: Performance vs. 7-day rolling average
 *   ▲ Improving | ▼ Declining | - Stable
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
  if (score >= 80) return '#00ff00'; // Green - WHALE
  if (score >= 50) return '#ffff00'; // Yellow - STANDARD
  return '#ff0000'; // Red - LOW
};

const getScoreEmoji = (score: number): string => {
  if (score >= 80) return '🐋';
  if (score >= 50) return '🎯';
  return '📉';
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
      top: 20,
      right: 20,
      width: '340px',
      background: 'rgba(0, 10, 20, 0.95)',
      border: '1px solid #00ffff',
      borderRadius: '4px',
      color: '#e0e0e0',
      fontFamily: '"Courier New", Courier, monospace',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
      zIndex: 1000,
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #00ffff',
        background: 'rgba(0, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Network Velocity
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setShowLegend(!showLegend)}
            style={{ 
              background: 'none', 
              border: '1px solid #00ffff', 
              color: '#00ffff', 
              padding: '2px 6px', 
              cursor: 'pointer',
              fontSize: '0.7rem',
              borderRadius: '2px'
            }}
          >
            {showLegend ? 'HIDE' : 'INFO'}
          </button>
          <span style={{ fontSize: '0.7rem', color: '#00ff00', animation: 'pulse 2s infinite' }}>● LIVE</span>
        </div>
      </div>

      {/* Legend Panel (Collapsible) */}
      {showLegend && (
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid #333',
          background: 'rgba(0, 0, 0, 0.5)',
          fontSize: '0.75rem'
        }}>
          <div style={{ marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>YARD VELOCITY SCORE (YVS)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00ff00', fontWeight: 'bold' }}>80-100</span>
              <span>🐋 WHALE - Top performer, minimal friction</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ffff00', fontWeight: 'bold' }}>50-79</span>
              <span>🎯 STANDARD - Good, room to optimize</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ff0000', fontWeight: 'bold' }}>0-49</span>
              <span>📉 LOW - Needs immediate attention</span>
            </div>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #333', color: '#666' }}>
            <div><strong>Turn Time:</strong> Avg minutes per truck (Target: 24)</div>
            <div><strong>Ghosts:</strong> "Lost" assets needing manual search</div>
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
              borderBottom: index !== sortedData.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              background: isUser ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
              borderLeft: isUser ? '3px solid #00ff00' : '3px solid transparent',
              borderRadius: '2px'
            }}>
              {/* Rank & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ 
                  color: index < 3 ? '#ffd700' : '#555', 
                  fontWeight: 'bold',
                  width: '24px',
                  fontSize: '0.9rem'
                }}>
                  #{index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: isUser ? 'bold' : 'normal', 
                    color: isUser ? '#fff' : '#aaa',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {facility.name}
                    <span style={{ fontSize: '0.9rem' }}>{getScoreEmoji(facility.score)}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span>{facility.tier}</span>
                    {facility.turnTime && <span>⏱ {facility.turnTime}m</span>}
                    {facility.ghostCount !== undefined && facility.ghostCount > 0 && (
                      <span style={{ color: '#ff6600' }}>👻 {facility.ghostCount}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Score & Trend */}
              <div style={{ textAlign: 'right', minWidth: '50px' }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: scoreColor,
                  textShadow: `0 0 8px ${scoreColor}40`
                }}>
                  {facility.score.toFixed(1)}
                </div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: facility.trend === 'up' ? '#00ff00' : facility.trend === 'down' ? '#ff0000' : '#888' 
                }}>
                  {facility.trend === 'up' ? '▲ +2.1' : facility.trend === 'down' ? '▼ -1.8' : '- 0.0'}
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
        fontSize: '0.75rem', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '4px' }}>NETWORK TARGET</div>
        <div style={{ color: '#888' }}>
          Turn Time: <span style={{ color: '#00ff00' }}>24 MIN</span> | 
          Ghost Count: <span style={{ color: '#00ff00' }}>0</span> | 
          YVS: <span style={{ color: '#00ff00' }}>80+</span>
        </div>
      </div>
    </div>
  );
}
