import React, { useState } from 'react';
import { 
  PRIMO_FACILITIES, 
  PrimoFacility,
  getAdoptionColor,
  getAdoptionLabel,
  getNetworkStats,
  getLeaderboard,
  getRegionalLeaderboard
} from '../data/primo-facilities';

/**
 * =============================================================================
 * ADOPTION LEADERBOARD - Gamified Facility Rankings
 * =============================================================================
 * 
 * Break down silos. Align incentives. Make adoption FUN.
 * 
 * Features:
 * - Facility rankings by points, streak, ROI, improvement
 * - Regional competitions
 * - Achievement badges
 * - Live adoption tracking
 */

export default function AdoptionLeaderboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'regional' | 'achievements'>('leaderboard');
  const [sortBy, setSortBy] = useState<'points' | 'streak' | 'roi' | 'improvement'>('points');
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility | null>(null);
  
  const stats = getNetworkStats();
  const leaderboard = getLeaderboard(sortBy);
  const regionalStats = getRegionalLeaderboard();

  const formatCurrency = (n: number) => `$${(n / 1000).toFixed(0)}K`;
  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 2999
        }} 
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '95vw',
        maxWidth: '1100px',
        height: '90vh',
        background: 'linear-gradient(135deg, rgba(0, 5, 15, 0.98) 0%, rgba(15, 5, 30, 0.98) 100%)',
        border: '2px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '16px',
        color: '#e0e0e0',
        fontFamily: '"JetBrains Mono", monospace',
        zIndex: 3000,
        boxShadow: '0 0 100px rgba(255, 215, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
          background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.3rem',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #ffd700, #ff6600)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                🏆 Adoption Leaderboard
              </h2>
              <div style={{ color: '#888', fontSize: '0.7rem', marginTop: '4px' }}>
                FreightRoll Network Championship • Break Silos • Win Together
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{ 
                background: 'rgba(255, 0, 0, 0.1)', 
                border: '1px solid rgba(255, 0, 0, 0.3)', 
                color: '#ff4444', 
                cursor: 'pointer', 
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Network Stats Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '10px',
          padding: '15px 25px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          {[
            { label: 'Network ROI', value: formatCurrency(stats.projectedAnnualROI), color: '#00ff00', icon: '💰' },
            { label: 'Adoption Rate', value: `${stats.adoptionRate}%`, color: '#ffd700', icon: '📈' },
            { label: 'Avg Improvement', value: `${stats.avgTurnTimeImprovement}%`, color: '#00ffff', icon: '⚡' },
            { label: 'Network Points', value: formatNumber(stats.totalPoints), color: '#ff00ff', icon: '🏆' },
            { label: 'Daily Trucks', value: formatNumber(stats.totalTrucksPerDay), color: '#ff6600', icon: '🚛' },
            { label: 'Avg YVS', value: stats.avgYVS.toString(), color: '#00ff00', icon: '📊' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              textAlign: 'center',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              border: `1px solid ${color}30`
            }}>
              <div style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {icon} {label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color, marginTop: '4px' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '5px',
          padding: '15px 25px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { id: 'leaderboard', label: '🏅 Facility Rankings', icon: '🏆' },
            { id: 'regional', label: '🗺️ Regional Battle', icon: '🌎' },
            { id: 'achievements', label: '🎖️ Achievements', icon: '⭐' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                border: activeTab === tab.id ? '1px solid #ffd700' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeTab === tab.id ? '#ffd700' : '#888',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              {tab.label}
            </button>
          ))}
          
          {activeTab === 'leaderboard' && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ color: '#666', fontSize: '0.65rem' }}>SORT:</span>
              {(['points', 'streak', 'roi', 'improvement'] as const).map(sort => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  style={{
                    background: sortBy === sort ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
                    border: sortBy === sort ? '1px solid #00ffff' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: sortBy === sort ? '#00ffff' : '#666',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    textTransform: 'uppercase'
                  }}
                >
                  {sort}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 25px' }}>
          
          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map((facility, index) => (
                <div
                  key={facility.id}
                  onClick={() => setSelectedFacility(facility)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 100px 100px 100px 120px',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '12px 15px',
                    background: index < 3 
                      ? `linear-gradient(90deg, rgba(255, 215, 0, ${0.15 - index * 0.04}) 0%, rgba(0, 0, 0, 0.3) 100%)`
                      : 'rgba(0, 0, 0, 0.3)',
                    border: index < 3 
                      ? `1px solid rgba(255, 215, 0, ${0.5 - index * 0.15})`
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    fontSize: index < 3 ? '1.5rem' : '1rem',
                    fontWeight: 'bold',
                    color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#666',
                    textAlign: 'center'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  
                  {/* Facility Info */}
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>
                      {facility.name}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{ 
                        color: getAdoptionColor(facility.adoptionStatus),
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        background: `${getAdoptionColor(facility.adoptionStatus)}20`,
                        borderRadius: '4px'
                      }}>
                        {getAdoptionLabel(facility.adoptionStatus)}
                      </span>
                      <span style={{ color: '#666', fontSize: '0.65rem' }}>
                        {facility.location}
                      </span>
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1rem' }}>
                      {formatNumber(facility.totalPoints)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.55rem', textTransform: 'uppercase' }}>
                      Points
                    </div>
                  </div>
                  
                  {/* Streak */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: facility.currentStreak >= 30 ? '#00ff00' : facility.currentStreak >= 14 ? '#00ffff' : '#888', fontWeight: 'bold' }}>
                      🔥 {facility.currentStreak}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.55rem', textTransform: 'uppercase' }}>
                      Day Streak
                    </div>
                  </div>
                  
                  {/* Improvement */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold' }}>
                      ↑{facility.turnTimeImprovement}%
                    </div>
                    <div style={{ color: '#666', fontSize: '0.55rem', textTransform: 'uppercase' }}>
                      Faster
                    </div>
                  </div>
                  
                  {/* Annual ROI */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {formatCurrency(facility.projectedAnnualROI)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.55rem', textTransform: 'uppercase' }}>
                      Annual ROI
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regional Tab */}
          {activeTab === 'regional' && (
            <div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#888', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🏆 Regional Championship Rankings • Compete Against Other Regions!
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {regionalStats.map((region, index) => (
                  <div
                    key={region.region}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 120px 120px 120px',
                      alignItems: 'center',
                      gap: '20px',
                      padding: '20px',
                      background: index === 0 
                        ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: index === 0 ? '2px solid rgba(255, 215, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{
                      fontSize: '2rem',
                      textAlign: 'center'
                    }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                        {region.region}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>
                        {region.facilities} facilities competing
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1.3rem' }}>
                        {formatNumber(region.totalPoints)}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.65rem' }}>TOTAL POINTS</div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '1.3rem' }}>
                        {region.adoptionRate}%
                      </div>
                      <div style={{ color: '#666', fontSize: '0.65rem' }}>ADOPTION</div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '1.3rem' }}>
                        {region.avgYVS}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.65rem' }}>AVG YVS</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#888', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                🎖️ Unlock achievements by improving your facility metrics!
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '15px'
              }}>
                {[
                  { icon: '🏆', name: 'First Adopter', desc: 'Be among the first facilities to go live', unlocked: 8 },
                  { icon: '🔥', name: '30-Day Streak', desc: 'Improve metrics for 30 consecutive days', unlocked: 6 },
                  { icon: '💎', name: 'Perfect Week', desc: 'Zero ghost searches for 7 days', unlocked: 4 },
                  { icon: '📦', name: '100K Trailers', desc: 'Process 100,000 trailers', unlocked: 3 },
                  { icon: '🚀', name: 'ROI Champion', desc: 'Exceed $500K annual ROI', unlocked: 5 },
                  { icon: '⚡', name: 'Speed Demon', desc: '50%+ turn time improvement', unlocked: 4 },
                  { icon: '📄', name: 'Paper Free', desc: 'Eliminate all paper documents', unlocked: 3 },
                  { icon: '🎯', name: 'Zero Ghost', desc: 'No ghost searches for 30 days', unlocked: 2 },
                  { icon: '🌟', name: 'Network MVP', desc: 'Rank #1 overall for a month', unlocked: 1 },
                  { icon: '🏭', name: 'Manufacturing Excellence', desc: 'Top manufacturing plant score', unlocked: 6 },
                  { icon: '🤠', name: 'Texas Champion', desc: 'Top Texas facility', unlocked: 2 },
                  { icon: '🌴', name: 'West Coast Champion', desc: 'Top West Coast facility', unlocked: 2 },
                ].map((achievement) => (
                  <div
                    key={achievement.name}
                    style={{
                      padding: '15px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: '10px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ 
                      fontSize: '2rem',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '10px'
                    }}>
                      {achievement.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {achievement.name}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '2px' }}>
                        {achievement.desc}
                      </div>
                      <div style={{ 
                        color: '#00ff00', 
                        fontSize: '0.65rem', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✓ {achievement.unlocked} facilities unlocked
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '15px 25px',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: '#666', fontSize: '0.7rem' }}>
            💡 Tip: Facilities compete weekly and monthly. Top 3 get bonus points!
          </div>
          <div style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Next Weekly Reset: 3d 14h 22m
          </div>
        </div>
      </div>
    </>
  );
}
