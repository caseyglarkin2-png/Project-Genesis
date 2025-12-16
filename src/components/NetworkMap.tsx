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
 * NETWORK MAP - Primo Brands Facility Network
 * =============================================================================
 * 
 * Real Primo Brands / ReadyRefresh facilities with gamified adoption tracking.
 * Break down silos. Align incentives. Make adoption FUN.
 */

const getScoreColor = (score: number) => {
  if (score >= 80) return '#00ff00';
  if (score >= 60) return '#ffff00';
  if (score >= 40) return '#ff6600';
  return '#ff0000';
};

export default function NetworkMap({ onClose }: { onClose: () => void }) {
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'trucks' | 'name' | 'adoption'>('score');
  const [filterType, setFilterType] = useState<'all' | 'manufacturing' | 'distribution' | 'delivery_hub'>('all');
  const [filterAdoption, setFilterAdoption] = useState<'all' | 'champion' | 'full' | 'partial' | 'pilot' | 'not_started'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const sortedFacilities = [...PRIMO_FACILITIES]
    .filter(f => filterType === 'all' || f.type === filterType)
    .filter(f => filterAdoption === 'all' || f.adoptionStatus === filterAdoption)
    .filter(f => searchTerm === '' || 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.yvsScore - a.yvsScore;
      if (sortBy === 'trucks') return b.trucksPerDay - a.trucksPerDay;
      if (sortBy === 'adoption') return b.adoptionPct - a.adoptionPct;
      return a.name.localeCompare(b.name);
    });

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
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(6px)',
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
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.98) 0%, rgba(10, 5, 25, 0.98) 100%)',
        border: '2px solid rgba(0, 255, 255, 0.4)',
        borderRadius: '12px',
        color: '#e0e0e0',
        fontFamily: '"JetBrains Mono", monospace',
        zIndex: 3000,
        boxShadow: '0 0 80px rgba(0, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%)'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.1rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              🌐 Primo Brands Network
            </h2>
            <div style={{ color: '#888', fontSize: '0.7rem', marginTop: '4px' }}>
              {PRIMO_FACILITIES.length} Real Facilities | Sourced from ReadyRefresh Directory & FDA Registrations
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

        {/* Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '10px',
          padding: '15px 25px',
          background: 'rgba(0,0,0,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {[
            { label: 'Total ROI', value: formatCurrency(networkStats.projectedAnnualROI), color: '#00ff00', icon: '💰' },
            { label: 'Adoption Rate', value: `${networkStats.adoptionRate}%`, color: '#ffd700', icon: '📈' },
            { label: 'Avg Improvement', value: `${networkStats.avgTurnTimeImprovement}%`, color: '#00ffff', icon: '⚡' },
            { label: 'Network Points', value: networkStats.totalPoints.toLocaleString(), color: '#ff00ff', icon: '🏆' },
            { label: 'Daily Trucks', value: networkStats.totalTrucksPerDay.toLocaleString(), color: '#ff6600', icon: '🚛' },
            { label: 'Avg YVS', value: networkStats.avgYVS.toString(), color: '#00ff00', icon: '📊' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '10px',
              borderRadius: '6px',
              border: `1px solid ${color}30`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.55rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {icon} {label}
              </div>
              <div style={{ color, fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '12px 25px',
          alignItems: 'center',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search facilities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              width: '180px',
              outline: 'none'
            }}
          />
          
          <span style={{ color: '#666', fontSize: '0.65rem', marginLeft: '10px' }}>TYPE:</span>
          {(['all', 'manufacturing', 'distribution', 'delivery_hub'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                background: filterType === type ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                border: filterType === type ? '1px solid #ff00ff' : '1px solid rgba(255,255,255,0.1)',
                color: filterType === type ? '#ff00ff' : '#666',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                textTransform: 'uppercase'
              }}
            >
              {type === 'all' ? 'ALL' : type === 'delivery_hub' ? 'HUB' : type.slice(0, 4)}
            </button>
          ))}
          
          <span style={{ color: '#666', fontSize: '0.65rem', marginLeft: '10px' }}>ADOPTION:</span>
          {(['all', 'champion', 'full', 'partial', 'pilot', 'not_started'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterAdoption(status)}
              style={{
                background: filterAdoption === status ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0,0,0,0.3)',
                border: filterAdoption === status ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                color: filterAdoption === status ? '#ffd700' : '#666',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                textTransform: 'uppercase'
              }}
            >
              {status === 'all' ? 'ALL' : status === 'not_started' ? 'NEW' : status.slice(0, 4)}
            </button>
          ))}
          
          <span style={{ color: '#666', fontSize: '0.65rem', marginLeft: '10px' }}>SORT:</span>
          {(['score', 'trucks', 'adoption', 'name'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              style={{
                background: sortBy === sort ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                border: sortBy === sort ? '1px solid #00ffff' : '1px solid rgba(255,255,255,0.1)',
                color: sortBy === sort ? '#00ffff' : '#666',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                textTransform: 'uppercase'
              }}
            >
              {sort}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', color: '#888', fontSize: '0.65rem' }}>
            Showing {sortedFacilities.length} of {PRIMO_FACILITIES.length}
          </div>
        </div>

        {/* Facility Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '15px 25px 25px 25px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '12px',
          alignContent: 'start'
        }}>
          {sortedFacilities.map((facility, index) => (
            <div
              key={facility.id}
              onClick={() => setSelectedFacility(selectedFacility?.id === facility.id ? null : facility)}
              style={{
                background: selectedFacility?.id === facility.id 
                  ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(255, 0, 255, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 20, 30, 0.8) 0%, rgba(10, 10, 25, 0.8) 100%)',
                border: `1px solid ${selectedFacility?.id === facility.id ? '#00ffff' : getAdoptionColor(facility.adoptionStatus)}40`,
                borderRadius: '8px',
                padding: '12px 15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Rank Badge */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: index < 3 ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0,0,0,0.5)',
                border: index < 3 ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: index < 3 ? '#ffd700' : '#555'
              }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>

              {/* Adoption Status Badge */}
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: `${getAdoptionColor(facility.adoptionStatus)}20`,
                border: `1px solid ${getAdoptionColor(facility.adoptionStatus)}50`,
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.55rem',
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
                  fontWeight: 'bold', 
                  color: '#fff',
                  marginBottom: '2px'
                }}>
                  {facility.name}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: '8px' }}>
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
          ))}
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
