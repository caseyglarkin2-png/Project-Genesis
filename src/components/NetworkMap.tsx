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
  // SOUTHEAST REGION
  { id: 'JAX-001', name: 'Jacksonville DC', location: 'Jacksonville, FL', coordinates: { lat: 30.33, lng: -81.66 }, score: 75.5, status: 'online', trucksToday: 142, avgTurnTime: 28, dockDoors: 24, trailerSpots: 120 },
  { id: 'SAV-001', name: 'Savannah Port Terminal', location: 'Savannah, GA', coordinates: { lat: 32.08, lng: -81.09 }, score: 82.1, status: 'online', trucksToday: 198, avgTurnTime: 24, dockDoors: 36, trailerSpots: 200 },
  { id: 'ATL-001', name: 'Atlanta Distribution', location: 'Atlanta, GA', coordinates: { lat: 33.75, lng: -84.39 }, score: 68.4, status: 'warning', trucksToday: 165, avgTurnTime: 32, dockDoors: 28, trailerSpots: 150 },
  { id: 'MIA-001', name: 'Miami Cold Storage', location: 'Miami, FL', coordinates: { lat: 25.76, lng: -80.19 }, score: 91.0, status: 'online', trucksToday: 89, avgTurnTime: 22, dockDoors: 16, trailerSpots: 80 },
  { id: 'CLT-001', name: 'Charlotte Hub', location: 'Charlotte, NC', coordinates: { lat: 35.23, lng: -80.84 }, score: 55.2, status: 'warning', trucksToday: 134, avgTurnTime: 38, dockDoors: 20, trailerSpots: 100 },
  { id: 'TPA-001', name: 'Tampa Crossdock', location: 'Tampa, FL', coordinates: { lat: 27.95, lng: -82.46 }, score: 78.9, status: 'online', trucksToday: 112, avgTurnTime: 26, dockDoors: 18, trailerSpots: 90 },
  { id: 'ORL-001', name: 'Orlando Fulfillment', location: 'Orlando, FL', coordinates: { lat: 28.54, lng: -81.38 }, score: 84.3, status: 'online', trucksToday: 156, avgTurnTime: 23, dockDoors: 30, trailerSpots: 160 },
  { id: 'BHM-001', name: 'Birmingham Regional', location: 'Birmingham, AL', coordinates: { lat: 33.52, lng: -86.80 }, score: 71.6, status: 'online', trucksToday: 98, avgTurnTime: 29, dockDoors: 16, trailerSpots: 75 },
  { id: 'CHS-001', name: 'Charleston Port', location: 'Charleston, SC', coordinates: { lat: 32.78, lng: -79.93 }, score: 85.7, status: 'online', trucksToday: 178, avgTurnTime: 23, dockDoors: 32, trailerSpots: 175 },
  
  // CENTRAL REGION
  { id: 'NSH-001', name: 'Nashville Metro', location: 'Nashville, TN', coordinates: { lat: 36.16, lng: -86.78 }, score: 79.2, status: 'online', trucksToday: 143, avgTurnTime: 25, dockDoors: 22, trailerSpots: 110 },
  { id: 'MEM-001', name: 'Memphis Logistics Hub', location: 'Memphis, TN', coordinates: { lat: 35.15, lng: -90.05 }, score: 88.5, status: 'online', trucksToday: 234, avgTurnTime: 21, dockDoors: 48, trailerSpots: 280 },
  { id: 'KNX-001', name: 'Knoxville Regional', location: 'Knoxville, TN', coordinates: { lat: 35.96, lng: -83.92 }, score: 74.1, status: 'online', trucksToday: 82, avgTurnTime: 27, dockDoors: 14, trailerSpots: 70 },
  { id: 'LIT-001', name: 'Little Rock Hub', location: 'Little Rock, AR', coordinates: { lat: 34.75, lng: -92.29 }, score: 73.5, status: 'online', trucksToday: 89, avgTurnTime: 28, dockDoors: 16, trailerSpots: 80 },
  { id: 'NOL-001', name: 'New Orleans Terminal', location: 'New Orleans, LA', coordinates: { lat: 29.95, lng: -90.07 }, score: 70.2, status: 'online', trucksToday: 145, avgTurnTime: 30, dockDoors: 24, trailerSpots: 120 },
  { id: 'DFW-001', name: 'Dallas-Fort Worth DC', location: 'Dallas, TX', coordinates: { lat: 32.78, lng: -96.80 }, score: 86.3, status: 'online', trucksToday: 267, avgTurnTime: 22, dockDoors: 42, trailerSpots: 250 },
  { id: 'HOU-001', name: 'Houston Distribution', location: 'Houston, TX', coordinates: { lat: 29.76, lng: -95.37 }, score: 81.7, status: 'online', trucksToday: 189, avgTurnTime: 24, dockDoors: 36, trailerSpots: 180 },
  { id: 'SAT-001', name: 'San Antonio Hub', location: 'San Antonio, TX', coordinates: { lat: 29.42, lng: -98.49 }, score: 76.8, status: 'online', trucksToday: 134, avgTurnTime: 26, dockDoors: 22, trailerSpots: 110 },
  { id: 'AUS-001', name: 'Austin Fulfillment', location: 'Austin, TX', coordinates: { lat: 30.27, lng: -97.74 }, score: 83.2, status: 'online', trucksToday: 98, avgTurnTime: 23, dockDoors: 18, trailerSpots: 90 },
  { id: 'OKC-001', name: 'Oklahoma City DC', location: 'Oklahoma City, OK', coordinates: { lat: 35.47, lng: -97.52 }, score: 72.4, status: 'online', trucksToday: 87, avgTurnTime: 28, dockDoors: 16, trailerSpots: 75 },
  
  // MIDWEST REGION  
  { id: 'CHI-001', name: 'Chicago Distribution', location: 'Chicago, IL', coordinates: { lat: 41.88, lng: -87.63 }, score: 77.9, status: 'online', trucksToday: 312, avgTurnTime: 27, dockDoors: 52, trailerSpots: 320 },
  { id: 'CHI-002', name: 'Chicago South Hub', location: 'Joliet, IL', coordinates: { lat: 41.53, lng: -88.08 }, score: 82.6, status: 'online', trucksToday: 245, avgTurnTime: 24, dockDoors: 40, trailerSpots: 240 },
  { id: 'DET-001', name: 'Detroit Regional', location: 'Detroit, MI', coordinates: { lat: 42.33, lng: -83.05 }, score: 69.5, status: 'warning', trucksToday: 156, avgTurnTime: 31, dockDoors: 28, trailerSpots: 140 },
  { id: 'IND-001', name: 'Indianapolis Hub', location: 'Indianapolis, IN', coordinates: { lat: 39.77, lng: -86.16 }, score: 85.1, status: 'online', trucksToday: 178, avgTurnTime: 22, dockDoors: 32, trailerSpots: 165 },
  { id: 'CLE-001', name: 'Cleveland Distribution', location: 'Cleveland, OH', coordinates: { lat: 41.50, lng: -81.69 }, score: 71.3, status: 'online', trucksToday: 132, avgTurnTime: 28, dockDoors: 24, trailerSpots: 115 },
  { id: 'COL-001', name: 'Columbus DC', location: 'Columbus, OH', coordinates: { lat: 39.96, lng: -83.00 }, score: 79.8, status: 'online', trucksToday: 167, avgTurnTime: 25, dockDoors: 28, trailerSpots: 145 },
  { id: 'CIN-001', name: 'Cincinnati Regional', location: 'Cincinnati, OH', coordinates: { lat: 39.10, lng: -84.51 }, score: 74.6, status: 'online', trucksToday: 121, avgTurnTime: 27, dockDoors: 22, trailerSpots: 105 },
  { id: 'STL-001', name: 'St. Louis Gateway', location: 'St. Louis, MO', coordinates: { lat: 38.63, lng: -90.20 }, score: 80.4, status: 'online', trucksToday: 189, avgTurnTime: 24, dockDoors: 34, trailerSpots: 175 },
  { id: 'KCM-001', name: 'Kansas City Hub', location: 'Kansas City, MO', coordinates: { lat: 39.10, lng: -94.58 }, score: 78.3, status: 'online', trucksToday: 145, avgTurnTime: 25, dockDoors: 26, trailerSpots: 130 },
  { id: 'MKE-001', name: 'Milwaukee Distribution', location: 'Milwaukee, WI', coordinates: { lat: 43.04, lng: -87.91 }, score: 75.7, status: 'online', trucksToday: 98, avgTurnTime: 26, dockDoors: 18, trailerSpots: 85 },
  { id: 'MSP-001', name: 'Minneapolis Hub', location: 'Minneapolis, MN', coordinates: { lat: 44.98, lng: -93.27 }, score: 82.9, status: 'online', trucksToday: 134, avgTurnTime: 23, dockDoors: 24, trailerSpots: 120 },
  
  // NORTHEAST REGION
  { id: 'NOR-001', name: 'Norfolk Intermodal', location: 'Norfolk, VA', coordinates: { lat: 36.85, lng: -76.29 }, score: 73.8, status: 'online', trucksToday: 167, avgTurnTime: 27, dockDoors: 26, trailerSpots: 130 },
  { id: 'RIC-001', name: 'Richmond Distribution', location: 'Richmond, VA', coordinates: { lat: 37.54, lng: -77.44 }, score: 66.1, status: 'warning', trucksToday: 88, avgTurnTime: 34, dockDoors: 14, trailerSpots: 65 },
  { id: 'RAL-001', name: 'Raleigh Fulfillment', location: 'Raleigh, NC', coordinates: { lat: 35.78, lng: -78.64 }, score: 81.4, status: 'online', trucksToday: 121, avgTurnTime: 24, dockDoors: 20, trailerSpots: 95 },
  { id: 'NWK-001', name: 'Newark Distribution', location: 'Newark, NJ', coordinates: { lat: 40.74, lng: -74.17 }, score: 67.2, status: 'warning', trucksToday: 234, avgTurnTime: 35, dockDoors: 38, trailerSpots: 180 },
  { id: 'PHI-001', name: 'Philadelphia Hub', location: 'Philadelphia, PA', coordinates: { lat: 39.95, lng: -75.17 }, score: 74.5, status: 'online', trucksToday: 189, avgTurnTime: 28, dockDoors: 32, trailerSpots: 160 },
  { id: 'PIT-001', name: 'Pittsburgh Regional', location: 'Pittsburgh, PA', coordinates: { lat: 40.44, lng: -80.00 }, score: 72.1, status: 'online', trucksToday: 87, avgTurnTime: 29, dockDoors: 16, trailerSpots: 75 },
  { id: 'BOS-001', name: 'Boston Distribution', location: 'Boston, MA', coordinates: { lat: 42.36, lng: -71.06 }, score: 70.8, status: 'online', trucksToday: 112, avgTurnTime: 30, dockDoors: 20, trailerSpots: 95 },
  { id: 'HAR-001', name: 'Hartford Regional', location: 'Hartford, CT', coordinates: { lat: 41.76, lng: -72.69 }, score: 76.4, status: 'online', trucksToday: 78, avgTurnTime: 26, dockDoors: 14, trailerSpots: 65 },
  { id: 'BAL-001', name: 'Baltimore Port', location: 'Baltimore, MD', coordinates: { lat: 39.29, lng: -76.61 }, score: 79.6, status: 'online', trucksToday: 156, avgTurnTime: 25, dockDoors: 28, trailerSpots: 140 },
  
  // WEST REGION
  { id: 'LAX-001', name: 'Los Angeles DC', location: 'Los Angeles, CA', coordinates: { lat: 34.05, lng: -118.24 }, score: 84.2, status: 'online', trucksToday: 298, avgTurnTime: 24, dockDoors: 48, trailerSpots: 290 },
  { id: 'LAX-002', name: 'Long Beach Port', location: 'Long Beach, CA', coordinates: { lat: 33.77, lng: -118.19 }, score: 87.5, status: 'online', trucksToday: 345, avgTurnTime: 21, dockDoors: 56, trailerSpots: 340 },
  { id: 'SFO-001', name: 'San Francisco Bay', location: 'Oakland, CA', coordinates: { lat: 37.80, lng: -122.27 }, score: 78.9, status: 'online', trucksToday: 167, avgTurnTime: 26, dockDoors: 30, trailerSpots: 150 },
  { id: 'PHX-001', name: 'Phoenix Distribution', location: 'Phoenix, AZ', coordinates: { lat: 33.45, lng: -112.07 }, score: 81.3, status: 'online', trucksToday: 156, avgTurnTime: 24, dockDoors: 28, trailerSpots: 140 },
  { id: 'DEN-001', name: 'Denver Hub', location: 'Denver, CO', coordinates: { lat: 39.74, lng: -104.99 }, score: 83.7, status: 'online', trucksToday: 134, avgTurnTime: 23, dockDoors: 24, trailerSpots: 125 },
  { id: 'SLC-001', name: 'Salt Lake City DC', location: 'Salt Lake City, UT', coordinates: { lat: 40.76, lng: -111.89 }, score: 77.2, status: 'online', trucksToday: 89, avgTurnTime: 26, dockDoors: 18, trailerSpots: 85 },
  { id: 'SEA-001', name: 'Seattle Distribution', location: 'Seattle, WA', coordinates: { lat: 47.61, lng: -122.33 }, score: 80.1, status: 'online', trucksToday: 145, avgTurnTime: 25, dockDoors: 26, trailerSpots: 130 },
  { id: 'PDX-001', name: 'Portland Regional', location: 'Portland, OR', coordinates: { lat: 45.52, lng: -122.68 }, score: 76.8, status: 'online', trucksToday: 98, avgTurnTime: 27, dockDoors: 20, trailerSpots: 95 },
  { id: 'LVG-001', name: 'Las Vegas Crossdock', location: 'Las Vegas, NV', coordinates: { lat: 36.17, lng: -115.14 }, score: 73.4, status: 'online', trucksToday: 112, avgTurnTime: 28, dockDoors: 22, trailerSpots: 105 },
  { id: 'SAN-001', name: 'San Diego Hub', location: 'San Diego, CA', coordinates: { lat: 32.72, lng: -117.16 }, score: 79.5, status: 'online', trucksToday: 87, avgTurnTime: 25, dockDoors: 18, trailerSpots: 90 },
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
