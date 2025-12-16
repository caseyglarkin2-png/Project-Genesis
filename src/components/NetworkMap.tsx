import React, { useState } from 'react';

/**
 * =============================================================================
 * NETWORK MAP - All Facilities Overview
 * =============================================================================
 * 
 * Shows all facilities in the network with their YVS scores and status.
 * Allows users to see the big picture and drill down into individual sites.
 */

interface Facility {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  score: number;
  status: 'online' | 'offline' | 'warning';
  trucksToday: number;
  avgTurnTime: number;
  dockDoors: number;
  trailerSpots: number;
}

const NETWORK_FACILITIES: Facility[] = [
  { id: 'JAX-001', name: 'Jacksonville DC', location: 'Jacksonville, FL', coordinates: { lat: 30.33, lng: -81.66 }, score: 75.5, status: 'online', trucksToday: 142, avgTurnTime: 28, dockDoors: 24, trailerSpots: 120 },
  { id: 'SAV-001', name: 'Savannah Port Terminal', location: 'Savannah, GA', coordinates: { lat: 32.08, lng: -81.09 }, score: 82.1, status: 'online', trucksToday: 198, avgTurnTime: 24, dockDoors: 36, trailerSpots: 200 },
  { id: 'ATL-001', name: 'Atlanta Distribution', location: 'Atlanta, GA', coordinates: { lat: 33.75, lng: -84.39 }, score: 68.4, status: 'warning', trucksToday: 165, avgTurnTime: 32, dockDoors: 28, trailerSpots: 150 },
  { id: 'MIA-001', name: 'Miami Cold Storage', location: 'Miami, FL', coordinates: { lat: 25.76, lng: -80.19 }, score: 91.0, status: 'online', trucksToday: 89, avgTurnTime: 22, dockDoors: 16, trailerSpots: 80 },
  { id: 'CLT-001', name: 'Charlotte Hub', location: 'Charlotte, NC', coordinates: { lat: 35.23, lng: -80.84 }, score: 55.2, status: 'warning', trucksToday: 134, avgTurnTime: 38, dockDoors: 20, trailerSpots: 100 },
  { id: 'TPA-001', name: 'Tampa Crossdock', location: 'Tampa, FL', coordinates: { lat: 27.95, lng: -82.46 }, score: 78.9, status: 'online', trucksToday: 112, avgTurnTime: 26, dockDoors: 18, trailerSpots: 90 },
  { id: 'ORL-001', name: 'Orlando Fulfillment', location: 'Orlando, FL', coordinates: { lat: 28.54, lng: -81.38 }, score: 84.3, status: 'online', trucksToday: 156, avgTurnTime: 23, dockDoors: 30, trailerSpots: 160 },
  { id: 'BHM-001', name: 'Birmingham Regional', location: 'Birmingham, AL', coordinates: { lat: 33.52, lng: -86.80 }, score: 71.6, status: 'online', trucksToday: 98, avgTurnTime: 29, dockDoors: 16, trailerSpots: 75 },
  { id: 'NSH-001', name: 'Nashville Metro', location: 'Nashville, TN', coordinates: { lat: 36.16, lng: -86.78 }, score: 79.2, status: 'online', trucksToday: 143, avgTurnTime: 25, dockDoors: 22, trailerSpots: 110 },
  { id: 'MEM-001', name: 'Memphis Logistics', location: 'Memphis, TN', coordinates: { lat: 35.15, lng: -90.05 }, score: 88.5, status: 'online', trucksToday: 234, avgTurnTime: 21, dockDoors: 48, trailerSpots: 280 },
  { id: 'NOR-001', name: 'Norfolk Intermodal', location: 'Norfolk, VA', coordinates: { lat: 36.85, lng: -76.29 }, score: 73.8, status: 'online', trucksToday: 167, avgTurnTime: 27, dockDoors: 26, trailerSpots: 130 },
  { id: 'RIC-001', name: 'Richmond Distribution', location: 'Richmond, VA', coordinates: { lat: 37.54, lng: -77.44 }, score: 66.1, status: 'warning', trucksToday: 88, avgTurnTime: 34, dockDoors: 14, trailerSpots: 65 },
  { id: 'RAL-001', name: 'Raleigh Fulfillment', location: 'Raleigh, NC', coordinates: { lat: 35.78, lng: -78.64 }, score: 81.4, status: 'online', trucksToday: 121, avgTurnTime: 24, dockDoors: 20, trailerSpots: 95 },
  { id: 'CHS-001', name: 'Charleston Port', location: 'Charleston, SC', coordinates: { lat: 32.78, lng: -79.93 }, score: 85.7, status: 'online', trucksToday: 178, avgTurnTime: 23, dockDoors: 32, trailerSpots: 175 },
  { id: 'COL-001', name: 'Columbia Hub', location: 'Columbia, SC', coordinates: { lat: 34.00, lng: -81.03 }, score: 69.3, status: 'online', trucksToday: 76, avgTurnTime: 31, dockDoors: 12, trailerSpots: 55 },
  { id: 'JAX-002', name: 'Jacksonville North', location: 'Jacksonville, FL', coordinates: { lat: 30.45, lng: -81.70 }, score: 77.8, status: 'online', trucksToday: 94, avgTurnTime: 26, dockDoors: 16, trailerSpots: 85 },
  { id: 'MIA-002', name: 'Miami Perishables', location: 'Doral, FL', coordinates: { lat: 25.82, lng: -80.34 }, score: 89.2, status: 'online', trucksToday: 67, avgTurnTime: 20, dockDoors: 12, trailerSpots: 50 },
  { id: 'ATL-002', name: 'Atlanta South', location: 'College Park, GA', coordinates: { lat: 33.65, lng: -84.45 }, score: 72.4, status: 'online', trucksToday: 145, avgTurnTime: 28, dockDoors: 24, trailerSpots: 115 },
  { id: 'KNX-001', name: 'Knoxville Regional', location: 'Knoxville, TN', coordinates: { lat: 35.96, lng: -83.92 }, score: 74.1, status: 'online', trucksToday: 82, avgTurnTime: 27, dockDoors: 14, trailerSpots: 70 },
  { id: 'GRN-001', name: 'Greenville DC', location: 'Greenville, SC', coordinates: { lat: 34.85, lng: -82.40 }, score: 80.6, status: 'online', trucksToday: 108, avgTurnTime: 24, dockDoors: 18, trailerSpots: 90 },
  { id: 'MOB-001', name: 'Mobile Port Terminal', location: 'Mobile, AL', coordinates: { lat: 30.69, lng: -88.04 }, score: 76.3, status: 'online', trucksToday: 134, avgTurnTime: 26, dockDoors: 22, trailerSpots: 105 },
  { id: 'PNS-001', name: 'Pensacola Crossdock', location: 'Pensacola, FL', coordinates: { lat: 30.42, lng: -87.22 }, score: 67.8, status: 'warning', trucksToday: 56, avgTurnTime: 33, dockDoors: 10, trailerSpots: 45 },
  { id: 'LIT-001', name: 'Little Rock Hub', location: 'Little Rock, AR', coordinates: { lat: 34.75, lng: -92.29 }, score: 73.5, status: 'online', trucksToday: 89, avgTurnTime: 28, dockDoors: 16, trailerSpots: 80 },
  { id: 'NOL-001', name: 'New Orleans Terminal', location: 'New Orleans, LA', coordinates: { lat: 29.95, lng: -90.07 }, score: 70.2, status: 'online', trucksToday: 145, avgTurnTime: 30, dockDoors: 24, trailerSpots: 120 },
  { id: 'BTR-001', name: 'Baton Rouge DC', location: 'Baton Rouge, LA', coordinates: { lat: 30.45, lng: -91.15 }, score: 78.1, status: 'online', trucksToday: 97, avgTurnTime: 25, dockDoors: 18, trailerSpots: 85 },
];

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#00ff00';
  if (score >= 50) return '#ffff00';
  return '#ff0000';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online': return '#00ff00';
    case 'warning': return '#ff6600';
    case 'offline': return '#ff0000';
    default: return '#888';
  }
};

export default function NetworkMap({ onClose }: { onClose: () => void }) {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'trucks' | 'name'>('score');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'warning'>('all');

  const sortedFacilities = [...NETWORK_FACILITIES]
    .filter(f => filterStatus === 'all' || f.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'trucks') return b.trucksToday - a.trucksToday;
      return a.name.localeCompare(b.name);
    });

  const networkStats = {
    total: NETWORK_FACILITIES.length,
    online: NETWORK_FACILITIES.filter(f => f.status === 'online').length,
    warning: NETWORK_FACILITIES.filter(f => f.status === 'warning').length,
    avgScore: Math.round(NETWORK_FACILITIES.reduce((sum, f) => sum + f.score, 0) / NETWORK_FACILITIES.length * 10) / 10,
    totalTrucks: NETWORK_FACILITIES.reduce((sum, f) => sum + f.trucksToday, 0),
    totalDocks: NETWORK_FACILITIES.reduce((sum, f) => sum + f.dockDoors, 0),
  };

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
          alignItems: 'center'
        }}>
          <span style={{ color: '#666', fontSize: '0.7rem' }}>SORT:</span>
          {(['score', 'trucks', 'name'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              style={{
                background: sortBy === sort ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                border: sortBy === sort ? '1px solid #00ffff' : '1px solid rgba(255,255,255,0.1)',
                color: sortBy === sort ? '#00ffff' : '#666',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                textTransform: 'uppercase'
              }}
            >
              {sort}
            </button>
          ))}
          <span style={{ color: '#666', fontSize: '0.7rem', marginLeft: '20px' }}>FILTER:</span>
          {(['all', 'online', 'warning'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                background: filterStatus === status ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0,0,0,0.3)',
                border: filterStatus === status ? '1px solid #00ffff' : '1px solid rgba(255,255,255,0.1)',
                color: filterStatus === status ? '#00ffff' : '#666',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                textTransform: 'uppercase'
              }}
            >
              {status}
            </button>
          ))}
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
