import React, { useState } from 'react';
import { 
  PRIMO_FACILITIES, 
  PrimoFacility, 
  getAdoptionColor,
  getAdoptionLabel,
  getNetworkStats 
} from '../data/primo-facilities';

/**
 * =============================================================================
 * NETWORK MAP - Primo Brands Facility Orchestration
 * =============================================================================
 * 
 * FreightRoll Industrial Fluidity design. Real Primo Brands / ReadyRefresh 
 * facilities with autonomous handoff tracking. NO FRICTION.
 */

const getScoreColor = (score: number) => {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#3B82F6';
  return '#EF4444';
};

export default function NetworkMap({ onClose }: { onClose: () => void }) {
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'trucks' | 'name' | 'adoption'>('score');
  const [filterType, setFilterType] = useState<'all' | 'manufacturing' | 'distribution' | 'delivery_hub' | 'cross_dock' | 'headquarters' | 'warehouse'>('all');
  const [filterAdoption, setFilterAdoption] = useState<'all' | 'champion' | 'full' | 'partial' | 'pilot' | 'not_started'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const facilitiesPerPage = 50;

  const sortedFacilities = [...PRIMO_FACILITIES]
    .filter(f => filterType === 'all' || f.type === filterType)
    .filter(f => filterAdoption === 'all' || f.adoptionStatus === filterAdoption)
    .filter(f => searchTerm === '' || 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.yvsScore - a.yvsScore;
      if (sortBy === 'trucks') return b.trucksPerDay - a.trucksPerDay;
      if (sortBy === 'adoption') return b.adoptionPct - a.adoptionPct;
      return a.name.localeCompare(b.name);
    });

  const totalPages = Math.ceil(sortedFacilities.length / facilitiesPerPage);
  const paginatedFacilities = sortedFacilities.slice(
    (currentPage - 1) * facilitiesPerPage,
    currentPage * facilitiesPerPage
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: any, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const networkStats = getNetworkStats();
  const formatCurrency = (n: number) => `$${(n / 1000).toFixed(0)}K`;

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
          background: 'rgba(10, 14, 20, 0.95)',
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
        maxWidth: '1200px',
        height: '90vh',
        background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(10, 14, 20, 0.98) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        color: '#E2E8F0',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
        zIndex: 3000,
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 25px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(30, 41, 59, 0.3) 100%)'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: '600',
              color: '#F1F5F9'
            }}>
              ⬡ PRIMO BRANDS ORCHESTRATION
            </h2>
            <div style={{ color: '#64748B', fontSize: '0.65rem', marginTop: '4px', fontWeight: '500' }}>
              {PRIMO_FACILITIES.length} Facilities | Ground Truth Infrastructure Control
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              color: '#EF4444', 
              cursor: 'pointer', 
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '10px',
          padding: '15px 25px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.03)'
        }}>
          {[
            { label: 'Projected ROI', value: formatCurrency(networkStats.projectedAnnualROI), color: '#10B981', icon: '◈' },
            { label: 'Orchestration', value: `${networkStats.adoptionRate}%`, color: '#F59E0B', icon: '◉' },
            { label: 'Turn Improvement', value: `${networkStats.avgTurnTimeImprovement}%`, color: '#3B82F6', icon: '⚡' },
            { label: 'Network Score', value: networkStats.totalPoints.toLocaleString(), color: '#60A5FA', icon: '◆' },
            { label: 'Daily Handoffs', value: networkStats.totalTrucksPerDay.toLocaleString(), color: '#F97316', icon: '⇄' },
            { label: 'Avg YVS', value: networkStats.avgYVS.toString(), color: '#10B981', icon: '◎' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: 'rgba(15, 20, 25, 0.8)',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid rgba(59, 130, 246, 0.1)`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.55rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500' }}>
                <span style={{ color }}>{icon}</span> {label}
              </div>
              <div style={{ color, fontSize: '1.1rem', fontWeight: '700', marginTop: '4px' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters - Row 1 */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '10px 25px 5px 25px',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.02)'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="⌕ Search facilities..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{
              background: 'rgba(15, 20, 25, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#E2E8F0',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              width: '160px',
              outline: 'none',
              fontFamily: '"Inter", sans-serif'
            }}
          />
          
          <span style={{ color: '#475569', fontSize: '0.6rem', marginLeft: '10px', fontWeight: '500' }}>TYPE:</span>
          {(['all', 'manufacturing', 'distribution', 'delivery_hub', 'cross_dock'] as const).map(type => (
            <button
              key={type}
              onClick={() => handleFilterChange(setFilterType, type)}
              style={{
                background: filterType === type ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 20, 25, 0.6)',
                border: filterType === type ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                color: filterType === type ? '#60A5FA' : '#64748B',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {type === 'all' ? 'ALL' : type === 'delivery_hub' ? 'HUB' : type === 'cross_dock' ? 'X-DCK' : type.slice(0, 4)}
            </button>
          ))}
          
          <span style={{ color: '#475569', fontSize: '0.6rem', marginLeft: '10px', fontWeight: '500' }}>STATUS:</span>
          {(['all', 'champion', 'full', 'partial', 'pilot', 'not_started'] as const).map(status => (
            <button
              key={status}
              onClick={() => handleFilterChange(setFilterAdoption, status)}
              style={{
                background: filterAdoption === status ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 20, 25, 0.6)',
                border: filterAdoption === status ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                color: filterAdoption === status ? '#F59E0B' : '#64748B',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {status === 'all' ? 'ALL' : status === 'not_started' ? 'NEW' : status.slice(0, 4)}
            </button>
          ))}
        </div>

        {/* Filters - Row 2 */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '5px 25px 10px 25px',
          alignItems: 'center',
          borderBottom: '1px solid rgba(59, 130, 246, 0.08)'
        }}>
          <span style={{ color: '#475569', fontSize: '0.6rem', fontWeight: '500' }}>SORT:</span>
          {(['score', 'trucks', 'adoption', 'name'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => handleFilterChange(setSortBy, sort)}
              style={{
                background: sortBy === sort ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 20, 25, 0.6)',
                border: sortBy === sort ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                color: sortBy === sort ? '#10B981' : '#64748B',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {sort}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#64748B', fontSize: '0.6rem', fontWeight: '500' }}>
              {sortedFacilities.length} facilities
            </span>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: 'rgba(15, 20, 25, 0.6)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    color: currentPage === 1 ? '#334155' : '#94A3B8',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.65rem',
                    fontWeight: '500'
                  }}
                >
                  ‹
                </button>
                <span style={{ color: '#3B82F6', fontSize: '0.6rem', padding: '0 6px', fontWeight: '600' }}>
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    background: 'rgba(15, 20, 25, 0.6)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    color: currentPage === totalPages ? '#334155' : '#94A3B8',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.65rem',
                    fontWeight: '500'
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Facility Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '15px 25px 25px 25px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '10px',
          alignContent: 'start'
        }}>
          {paginatedFacilities.map((facility, idx) => {
            const index = (currentPage - 1) * facilitiesPerPage + idx;
            return (
            <div
              key={facility.id}
              onClick={() => setSelectedFacility(selectedFacility?.id === facility.id ? null : facility)}
              style={{
                background: selectedFacility?.id === facility.id 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 0.5) 100%)'
                  : 'rgba(15, 20, 25, 0.8)',
                border: `1px solid ${selectedFacility?.id === facility.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.1)'}`,
                borderRadius: '8px',
                padding: '12px 15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Rank Badge */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: index < 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 20, 25, 0.9)',
                border: index < 3 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(59, 130, 246, 0.1)',
                borderRadius: '6px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: '600',
                color: index < 3 ? '#F59E0B' : '#64748B'
              }}>
                {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : index + 1}
              </div>

              {/* Adoption Status Badge */}
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: `${getAdoptionColor(facility.adoptionStatus)}15`,
                border: `1px solid ${getAdoptionColor(facility.adoptionStatus)}40`,
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.55rem',
                fontWeight: '600',
                color: getAdoptionColor(facility.adoptionStatus),
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {getAdoptionLabel(facility.adoptionStatus)}
              </div>

              {/* Facility Info */}
              <div style={{ marginTop: '25px' }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '600', 
                  color: '#F1F5F9',
                  marginBottom: '2px'
                }}>
                  {facility.name}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#64748B', marginBottom: '8px', fontWeight: '500' }}>
                  {facility.location} • {facility.brand} • {facility.type.replace('_', ' ')}
                </div>

                {/* Score & Streak Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 'bold',
                    color: getScoreColor(facility.yvsScore),
                    textShadow: `0 0 15px ${getScoreColor(facility.yvsScore)}50`
                  }}>
                    {facility.yvsScore.toFixed(1)}
                    <span style={{ fontSize: '0.6rem', color: '#555' }}>/100</span>
                  </div>
                  
                  {facility.currentStreak > 0 && (
                    <div style={{ 
                      color: facility.currentStreak >= 30 ? '#00ff00' : facility.currentStreak >= 14 ? '#ffd700' : '#ff6600',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      🔥 {facility.currentStreak} day streak
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '8px',
                  fontSize: '0.6rem'
                }}>
                  <div style={{ color: '#888' }}>
                    🚛 <span style={{ color: '#fff' }}>{facility.trucksPerDay}</span>/day
                  </div>
                  <div style={{ color: '#888' }}>
                    ⏱️ <span style={{ color: '#fff' }}>{facility.avgTurnTime}</span> min
                  </div>
                  <div style={{ color: '#888' }}>
                    ↑ <span style={{ color: '#00ff00' }}>{facility.turnTimeImprovement}%</span> faster
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedFacility?.id === facility.id && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '8px',
                      fontSize: '0.6rem',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <span style={{ color: '#666' }}>Monthly Detention Savings:</span>
                        <span style={{ color: '#00ff00', marginLeft: '5px' }}>${facility.monthlyDetentionSavings.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Monthly Labor Savings:</span>
                        <span style={{ color: '#00ff00', marginLeft: '5px' }}>${facility.monthlyLaborSavings.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Projected Annual ROI:</span>
                        <span style={{ color: '#00ff00', fontWeight: 'bold', marginLeft: '5px' }}>${facility.projectedAnnualROI.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Total Points:</span>
                        <span style={{ color: '#ffd700', fontWeight: 'bold', marginLeft: '5px' }}>{facility.totalPoints.toLocaleString()}</span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Ghost Searches/Week:</span>
                        <span style={{ color: facility.ghostSearches === 0 ? '#00ff00' : '#ff6600', marginLeft: '5px' }}>{facility.ghostSearches}</span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Paper Docs/Day:</span>
                        <span style={{ color: facility.paperDocuments === 0 ? '#00ff00' : '#ff6600', marginLeft: '5px' }}>{facility.paperDocuments}</span>
                      </div>
                    </div>
                    
                    {/* Achievements */}
                    {facility.achievements.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ color: '#666', fontSize: '0.55rem', marginBottom: '4px' }}>ACHIEVEMENTS:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {facility.achievements.map((achievement, i) => (
                            <span key={i} style={{
                              background: 'rgba(255, 215, 0, 0.1)',
                              border: '1px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.55rem',
                              color: '#ffd700'
                            }}>
                              {achievement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {facility.goLiveDate && (
                      <div style={{ marginTop: '8px', fontSize: '0.55rem', color: '#666' }}>
                        Go Live: <span style={{ color: '#00ffff' }}>{facility.goLiveDate}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '12px 25px',
          borderTop: '1px solid rgba(0, 255, 255, 0.2)',
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.65rem'
        }}>
          <div style={{ color: '#666' }}>
            💡 Data sourced from local.readyrefresh.com, FDA/State registrations
          </div>
          <div style={{ color: '#00ffff' }}>
            🏆 Click a facility to see detailed adoption metrics and achievements
          </div>
        </div>
      </div>
    </>
  );
}
