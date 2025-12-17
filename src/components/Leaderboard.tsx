import React, { useState } from 'react';
import { 
  PRIMO_FACILITIES, 
  getLeaderboard,
  getNetworkStats,
  getAdoptionLabel
} from '../data/primo-facilities';

/**
 * =============================================================================
 * LEADERBOARD COMPONENT - Network Velocity Dashboard
 * =============================================================================
 * 
 * Displays the facility performance leaderboard across the Primo Brands network.
 * Industrial Fluidity design - operating system aesthetic.
 * 
 * LIVE DATA from 260 Primo Brands facilities under FreightRoll deployment.
 * 
 * SCORE INTERPRETATION:
 * - 80-100 (GREEN):  ◆ WHALE - Top performer, minimal friction
 * - 50-79 (AMBER):   ◇ STANDARD - Good performance, room for optimization
 * - 0-49 (RED):      ◁ LOW - Underperforming, needs attention
 * 
 * NO FRICTION - Autonomous Orchestration at scale.
 */

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

const getTrendData = (facility: typeof PRIMO_FACILITIES[0]) => {
  // Calculate trend based on adoption status and improvements
  if (facility.adoptionStatus === 'champion' || facility.turnTimeImprovement >= 50) {
    return { direction: 'up' as const, change: '+' + (facility.turnTimeImprovement / 10).toFixed(1) };
  } else if (facility.adoptionStatus === 'not_started' || facility.turnTimeImprovement < 20) {
    return { direction: 'down' as const, change: '-' + ((100 - facility.yvsScore) / 20).toFixed(1) };
  }
  return { direction: 'stable' as const, change: '0.0' };
};

export default function Leaderboard() {
  const [showLegend, setShowLegend] = useState(false);
  
  // Get real data from Primo facilities
  const stats = getNetworkStats();
  const leaderboard = getLeaderboard('yvs').slice(0, 8); // Top 8 by YVS score

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
          Primo Network
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
            <span style={{ animation: 'pulse 2s infinite' }}>●</span> {stats.adoptedFacilities} LIVE
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
          <div style={{ marginBottom: '8px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Primo Brands Network</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
              <span style={{ color: '#10B981', fontWeight: '600' }}>{stats.fullAdoptionFacilities}</span>
              <span>Facilities fully deployed (YES + YMS)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
              <span style={{ color: '#3B82F6', fontWeight: '600' }}>{stats.adoptedFacilities}</span>
              <span>Total facilities in deployment</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0' }}>
              <span style={{ color: '#64748B', fontWeight: '600' }}>{stats.totalFacilities - stats.adoptedFacilities}</span>
              <span>Pending deployment</span>
            </div>
          </div>
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', color: '#64748B', fontSize: '0.65rem' }}>
            <div><strong>Avg YVS:</strong> {stats.avgYVS} | <strong>Adoption:</strong> {stats.adoptionRate}%</div>
            <div><strong>Network ROI:</strong> ${(stats.projectedAnnualROI / 1000000).toFixed(1)}M annually</div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <ul style={{ listStyle: 'none', margin: 0, padding: '8px 10px' }}>
        {leaderboard.map((facility, index) => {
          const isChampion = facility.adoptionStatus === 'champion';
          const scoreColor = getScoreColor(facility.yvsScore);
          const trend = getTrendData(facility);
          
          return (
            <li key={facility.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 6px',
              borderBottom: index !== leaderboard.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
              background: isChampion ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              borderLeft: isChampion ? '3px solid #F59E0B' : '3px solid transparent',
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
                    fontWeight: isChampion ? '600' : '400', 
                    color: isChampion ? '#E2E8F0' : '#94A3B8',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {facility.name.replace('US PL ', '').replace(' Factory', '').replace(' Distribution', ' DC')}
                    <span style={{ fontSize: '0.8rem' }}>{getScoreEmoji(facility.yvsScore)}</span>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span>{facility.state}</span>
                    <span>◷ {facility.avgTurnTime}m</span>
                    {facility.ghostSearches > 0 && (
                      <span style={{ color: '#F59E0B' }}>◌ {facility.ghostSearches}</span>
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
                  {facility.yvsScore.toFixed(1)}
                </div>
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: trend.direction === 'up' ? '#10B981' : trend.direction === 'down' ? '#EF4444' : '#64748B' 
                }}>
                  {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.change}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      {/* Footer - Network Stats */}
      <div style={{ 
        padding: '10px 12px', 
        textAlign: 'center', 
        fontSize: '0.7rem', 
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(10, 14, 20, 0.4)'
      }}>
        <div style={{ color: '#3B82F6', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Network Status</div>
        <div style={{ color: '#94A3B8' }}>
          Facilities: <span style={{ color: '#10B981' }}>{stats.adoptedFacilities}/{stats.totalFacilities}</span> | 
          Avg Improvement: <span style={{ color: '#10B981' }}>+{stats.avgTurnTimeImprovement}%</span> | 
          YVS: <span style={{ color: '#10B981' }}>{stats.avgYVS}</span>
        </div>
      </div>
    </div>
  );
}
