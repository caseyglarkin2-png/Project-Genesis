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
  const [sortBy, setSortBy] = useState<'points' | 'streak' | 'roi' | 'improvement' | 'yvs'>('points');
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility | null>(null);
  const [showAll, setShowAll] = useState(false); // Include not_started facilities
  const [currentPage, setCurrentPage] = useState(1);
  const facilitiesPerPage = 25;
  
  const stats = getNetworkStats();
  
  // Get leaderboard with option to show all
  const allFacilities = showAll 
    ? [...PRIMO_FACILITIES].sort((a, b) => {
        switch (sortBy) {
          case 'points': return b.totalPoints - a.totalPoints;
          case 'streak': return b.currentStreak - a.currentStreak;
          case 'roi': return b.projectedAnnualROI - a.projectedAnnualROI;
          case 'improvement': return b.turnTimeImprovement - a.turnTimeImprovement;
          case 'yvs': return b.yvsScore - a.yvsScore;
          default: return b.totalPoints - a.totalPoints;
        }
      })
    : getLeaderboard(sortBy);
  
  const totalPages = Math.ceil(allFacilities.length / facilitiesPerPage);
  const paginatedFacilities = allFacilities.slice(
    (currentPage - 1) * facilitiesPerPage,
    currentPage * facilitiesPerPage
  );
  
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
        background: 'rgba(15, 20, 25, 0.98)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        color: '#E2E8F0',
        fontFamily: '"Inter", -apple-system, sans-serif',
        zIndex: 3000,
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 41, 59, 0.3) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.1rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#3B82F6',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>◈</span> Adoption Leaderboard
              </h2>
              <div style={{ color: '#64748B', fontSize: '0.7rem', marginTop: '4px' }}>
                FreightRoll Network • Facility Orchestration Rankings
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                color: '#EF4444', 
                cursor: 'pointer', 
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '500'
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
          background: 'rgba(10, 14, 20, 0.6)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          {[
            { label: 'Network ROI', value: formatCurrency(stats.projectedAnnualROI), color: '#10B981', icon: '◆' },
            { label: 'Adoption Rate', value: `${stats.adoptionRate}%`, color: '#F59E0B', icon: '◈' },
            { label: 'Avg Improvement', value: `${stats.avgTurnTimeImprovement}%`, color: '#3B82F6', icon: '▲' },
            { label: 'Network Points', value: formatNumber(stats.totalPoints), color: '#8B5CF6', icon: '◉' },
            { label: 'Daily Trucks', value: formatNumber(stats.totalTrucksPerDay), color: '#F97316', icon: '◇' },
            { label: 'Avg YVS', value: stats.avgYVS.toString(), color: '#10B981', icon: '◎' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              textAlign: 'center',
              padding: '10px',
              background: 'rgba(30, 41, 59, 0.4)',
              borderRadius: '8px',
              border: `1px solid ${color}20`
            }}>
              <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {icon} {label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color, marginTop: '4px' }}>
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
          borderBottom: '1px solid rgba(148, 163, 184, 0.08)'
        }}>
          {[
            { id: 'leaderboard', label: '◈ Facility Rankings', icon: '◈' },
            { id: 'regional', label: '◇ Regional Battle', icon: '◇' },
            { id: 'achievements', label: '◆ Achievements', icon: '◆' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                border: activeTab === tab.id ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(148, 163, 184, 0.1)',
                color: activeTab === tab.id ? '#3B82F6' : '#94A3B8',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}
            >
              {tab.label}
            </button>
          ))}
          
          {activeTab === 'leaderboard' && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Show All Toggle */}
              <button
                onClick={() => { setShowAll(!showAll); setCurrentPage(1); }}
                style={{
                  background: showAll ? 'rgba(255, 165, 0, 0.2)' : 'transparent',
                  border: showAll ? '1px solid #ffa500' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: showAll ? '#ffa500' : '#666',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showAll ? '◉' : '○'} ALL FACILITIES
              </button>
              
              <div style={{ width: '1px', height: '16px', background: 'rgba(148, 163, 184, 0.1)' }} />
              
              <span style={{ color: '#64748B', fontSize: '0.6rem' }}>SORT:</span>
              {(['points', 'yvs', 'streak', 'roi', 'improvement'] as const).map(sort => (
                <button
                  key={sort}
                  onClick={() => { setSortBy(sort); setCurrentPage(1); }}
                  style={{
                    background: sortBy === sort ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: sortBy === sort ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(148, 163, 184, 0.1)',
                    color: sortBy === sort ? '#3B82F6' : '#64748B',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.55rem',
                    textTransform: 'uppercase',
                    fontWeight: '500'
                  }}
                >
                  {sort === 'yvs' ? '◎ YVS' : sort}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '15px 25px' }}>
          
          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Header Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '45px 1.5fr 75px 60px 70px 70px 85px',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'rgba(255, 215, 0, 0.05)',
                borderRadius: '6px',
                borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
                marginBottom: '4px'
              }}>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>#</div>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Facility</div>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' }}>Points</div>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' }}>YVS</div>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' }}>Streak</div>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' }}>Faster</div>
                <div style={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center' }}>ROI/yr</div>
              </div>
              
              {/* Facility Rows */}
              {paginatedFacilities.map((facility, idx) => {
                const index = (currentPage - 1) * facilitiesPerPage + idx;
                const isTop3 = index < 3;
                return (
                  <div
                    key={facility.id}
                    onClick={() => setSelectedFacility(facility)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '45px 1.5fr 75px 60px 70px 70px 85px',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: isTop3 
                        ? `linear-gradient(90deg, rgba(255, 215, 0, ${0.12 - index * 0.03}) 0%, rgba(0, 0, 0, 0.25) 100%)`
                        : 'rgba(0, 0, 0, 0.25)',
                      border: isTop3 
                        ? `1px solid rgba(255, 215, 0, ${0.4 - index * 0.12})`
                        : '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      fontSize: isTop3 ? '1.1rem' : '0.8rem',
                      fontWeight: 'bold',
                      color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#555',
                      textAlign: 'center'
                    }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </div>
                    
                    {/* Facility Info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#fff', 
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {facility.name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '2px', alignItems: 'center' }}>
                        <span style={{ 
                          color: getAdoptionColor(facility.adoptionStatus),
                          fontSize: '0.55rem',
                          padding: '1px 4px',
                          background: `${getAdoptionColor(facility.adoptionStatus)}15`,
                          borderRadius: '3px'
                        }}>
                          {getAdoptionLabel(facility.adoptionStatus)}
                        </span>
                        <span style={{ color: '#555', fontSize: '0.55rem' }}>
                          {facility.state}
                        </span>
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {formatNumber(facility.totalPoints)}
                      </div>
                    </div>
                    
                    {/* YVS Score */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: facility.yvsScore >= 90 ? '#00ff00' : facility.yvsScore >= 70 ? '#00ffff' : facility.yvsScore >= 50 ? '#ffd700' : '#ff4444',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {facility.yvsScore}
                      </div>
                    </div>
                    
                    {/* Streak */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        color: facility.currentStreak >= 30 ? '#00ff00' : facility.currentStreak >= 14 ? '#00ffff' : '#666', 
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}>
                        🔥{facility.currentStreak}
                      </div>
                    </div>
                    
                    {/* Improvement */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        ↑{facility.turnTimeImprovement}%
                      </div>
                    </div>
                    
                    {/* Annual ROI */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        {formatCurrency(facility.projectedAnnualROI)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Pagination Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                marginTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ color: '#666', fontSize: '0.7rem' }}>
                  Showing {((currentPage - 1) * facilitiesPerPage) + 1}-{Math.min(currentPage * facilitiesPerPage, allFacilities.length)} of <span style={{ color: '#ffd700' }}>{allFacilities.length}</span> facilities
                  {!showAll && <span style={{ color: '#888' }}> (active only)</span>}
                </div>
                
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: currentPage === 1 ? '#333' : '#888',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    ««
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: currentPage === 1 ? '#333' : '#888',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    ‹ Prev
                  </button>
                  
                  <span style={{ 
                    color: '#ffd700', 
                    padding: '0 12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    Page {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: currentPage === totalPages ? '#333' : '#888',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    Next ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: currentPage === totalPages ? '#333' : '#888',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    »»
                  </button>
                </div>
              </div>
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
