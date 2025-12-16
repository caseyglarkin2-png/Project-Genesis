import React, { useState } from 'react';
import { 
  NETWORK_FACILITIES, 
  Facility, 
  getScoreColor, 
  getStatusColor, 
  getNetworkStats 
} from '../data/facilities';

/**
 * =============================================================================
 * NETWORK MAP - All Facilities Overview
 * =============================================================================
 * 
 * Shows all 250 facilities in the Primo Brands network with their YVS scores 
 * and status. Allows users to see the big picture and drill down into individual sites.
 */

export default function NetworkMap({ onClose }: { onClose: () => void }) {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'trucks' | 'name'>('score');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'warning' | 'offline'>('all');
  const [filterRegion, setFilterRegion] = useState<'all' | 'southeast' | 'central' | 'midwest' | 'northeast' | 'west'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Region detection based on state prefix
  const getRegion = (id: string) => {
    const state = id.split('-')[0];
    const southeast = ['FL', 'GA', 'NC', 'SC', 'AL', 'MS'];
    const central = ['TX', 'LA', 'OK', 'AR', 'TN', 'KY'];
    const midwest = ['IL', 'OH', 'MI', 'IN', 'MO', 'WI', 'MN'];
    const northeast = ['NY', 'NJ', 'PA', 'MA', 'CT', 'VA', 'MD', 'NH', 'RI', 'ME', 'VT'];
    const west = ['CA', 'WA', 'OR', 'AZ', 'CO', 'NV', 'UT', 'NM', 'ID', 'MT', 'WY'];
    
    if (southeast.includes(state)) return 'southeast';
    if (central.includes(state)) return 'central';
    if (midwest.includes(state)) return 'midwest';
    if (northeast.includes(state)) return 'northeast';
    if (west.includes(state)) return 'west';
    return 'other';
  };

  const sortedFacilities = [...NETWORK_FACILITIES]
    .filter(f => filterStatus === 'all' || f.status === filterStatus)
    .filter(f => filterRegion === 'all' || getRegion(f.id) === filterRegion)
    .filter(f => searchTerm === '' || 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'trucks') return b.trucksToday - a.trucksToday;
      return a.name.localeCompare(b.name);
    });

  const networkStats = getNetworkStats();

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
          background: 'rgba(0, 0, 0, 0.85)',
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
        height: '85vh',
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.98) 0%, rgba(10, 5, 25, 0.98) 100%)',
        border: '1px solid rgba(0, 255, 255, 0.4)',
        borderRadius: '12px',
        color: '#e0e0e0',
        fontFamily: '"JetBrains Mono", monospace',
        zIndex: 3000,
        boxShadow: '0 0 80px rgba(0, 255, 255, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.3s ease-out'
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
              🌐 Network Command Center
            </h2>
            <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '4px' }}>
              {networkStats.total} Facilities | {networkStats.totalTrucks.toLocaleString()} Trucks Today
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
          display: 'flex',
          gap: '15px',
          padding: '15px 25px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {[
            { label: 'Facilities', value: networkStats.total, color: '#00ffff', icon: '🏭' },
            { label: 'Online', value: networkStats.online, color: '#00ff00', icon: '✓' },
            { label: 'Warnings', value: networkStats.warning, color: '#ff6600', icon: '⚠' },
            { label: 'Avg YVS', value: networkStats.avgScore, color: getScoreColor(networkStats.avgScore), icon: '📊' },
            { label: 'Total Docks', value: networkStats.totalDocks, color: '#ff00ff', icon: '🚪' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              flex: 1,
              background: 'rgba(0,0,0,0.3)',
              padding: '12px 15px',
              borderRadius: '6px',
              border: `1px solid ${color}30`,
              textAlign: 'center'
            }}>
              <div style={{ color, fontSize: '1.5rem', fontWeight: 'bold' }}>
                {icon} {value}
              </div>
              <div style={{ color: '#666', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {label}
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
          flexWrap: 'wrap'
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
          
          <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '10px' }}>REGION:</span>
          {(['all', 'southeast', 'central', 'midwest', 'northeast', 'west'] as const).map(region => (
            <button
              key={region}
              onClick={() => setFilterRegion(region)}
              style={{
                background: filterRegion === region ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                border: filterRegion === region ? '1px solid #ff00ff' : '1px solid rgba(255,255,255,0.1)',
                color: filterRegion === region ? '#ff00ff' : '#666',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                textTransform: 'uppercase'
              }}
            >
              {region === 'all' ? 'ALL' : region.slice(0,2).toUpperCase()}
            </button>
          ))}
          
          <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '10px' }}>SORT:</span>
          {(['score', 'trucks', 'name'] as const).map(sort => (
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
          
          <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '10px' }}>STATUS:</span>
          {(['all', 'online', 'warning', 'offline'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                background: filterStatus === status ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0,0,0,0.3)',
                border: filterStatus === status ? '1px solid #00ff00' : '1px solid rgba(255,255,255,0.1)',
                color: filterStatus === status ? '#00ff00' : '#666',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                textTransform: 'uppercase'
              }}
            >
              {status}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', color: '#888', fontSize: '0.7rem' }}>
            Showing {sortedFacilities.length} of {networkStats.total}
          </div>
        </div>

        {/* Facility Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 25px 25px 25px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '15px',
          alignContent: 'start'
        }}>
          {sortedFacilities.map((facility, index) => (
            <div
              key={facility.id}
              onClick={() => setSelectedFacility(facility)}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 20, 30, 0.8) 0%, rgba(10, 10, 25, 0.8) 100%)',
                border: `1px solid ${getStatusColor(facility.status)}40`,
                borderRadius: '8px',
                padding: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = getScoreColor(facility.score);
                e.currentTarget.style.boxShadow = `0 0 20px ${getScoreColor(facility.score)}40`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = `${getStatusColor(facility.status)}40`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Rank Badge */}
              <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
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
                {index + 1}
              </div>

              {/* Status Indicator */}
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor(facility.status),
                boxShadow: `0 0 10px ${getStatusColor(facility.status)}`,
                animation: facility.status === 'warning' ? 'pulse 1s infinite' : 'none'
              }} />

              {/* Facility Info */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  color: '#fff',
                  marginBottom: '2px'
                }}>
                  {facility.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '10px' }}>
                  {facility.location} • {facility.id}
                </div>

                {/* Score */}
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getScoreColor(facility.score),
                  textShadow: `0 0 15px ${getScoreColor(facility.score)}50`,
                  marginBottom: '10px'
                }}>
                  {facility.score}
                  <span style={{ fontSize: '0.7rem', color: '#555' }}>/100</span>
                </div>

                {/* Quick Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px',
                  fontSize: '0.65rem'
                }}>
                  <div style={{ color: '#888' }}>
                    🚛 <span style={{ color: '#fff' }}>{facility.trucksToday}</span> trucks
                  </div>
                  <div style={{ color: '#888' }}>
                    ⏱️ <span style={{ color: '#fff' }}>{facility.avgTurnTime}</span> min avg
                  </div>
                  <div style={{ color: '#888' }}>
                    🚪 <span style={{ color: '#fff' }}>{facility.dockDoors}</span> docks
                  </div>
                  <div style={{ color: '#888' }}>
                    📍 <span style={{ color: '#fff' }}>{facility.trailerSpots}</span> spots
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
