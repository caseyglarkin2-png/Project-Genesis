import React, { useState, useMemo, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  PRIMO_FACILITIES, 
  PrimoFacility, 
  getAdoptionColor,
  getAdoptionLabel,
  getNetworkStats,
  getRegionalLeaderboard
} from '../data/primo-facilities';

/**
 * =============================================================================
 * NORTH AMERICA NETWORK MAP - Primo Brands Deployment Overview
 * =============================================================================
 * 
 * Shows all 260 Primo facilities across US & Canada with:
 * - Deployment status visualization (Champion → Not Started)
 * - Regional clustering and statistics
 * - Interactive facility cards with key metrics
 * - Deployment timeline and progress tracking
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYnVpbGRhcnNlbmFsIiwiYSI6ImNtMnc4ZHA0YTA3Y2MyaXF6cXcwM2gxbHQifQ.sMaHqi8s6hzO6h5lJMiCvg';

// Deployment phase definitions with target dates
const DEPLOYMENT_PHASES = {
  champion: { label: 'Champion', color: '#F59E0B', icon: '◆', order: 0 },
  full: { label: 'Full Adoption', color: '#10B981', icon: '◉', order: 1 },
  partial: { label: 'Partial', color: '#3B82F6', icon: '◈', order: 2 },
  pilot: { label: 'Pilot', color: '#F97316', icon: '▲', order: 3 },
  not_started: { label: 'Not Started', color: '#64748B', icon: '○', order: 4 },
};

// Regional groupings
const REGIONS = {
  'Northeast': ['CT', 'MA', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT', 'MD', 'DE'],
  'Southeast': ['FL', 'GA', 'NC', 'SC', 'VA', 'AL', 'TN', 'KY', 'WV', 'LA', 'MS', 'AR'],
  'Midwest': ['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  'Southwest': ['TX', 'OK', 'AZ', 'NM', 'CO', 'UT', 'NV'],
  'West': ['CA', 'WA', 'OR', 'ID', 'MT', 'WY', 'AK', 'HI'],
  'Canada': [], // Uses country code
};

const getRegion = (facility: PrimoFacility): string => {
  if (facility.country === 'CA') return 'Canada';
  for (const [region, states] of Object.entries(REGIONS)) {
    if (states.includes(facility.state)) return region;
  }
  return 'Other';
};

interface FacilityMarkerProps {
  facility: PrimoFacility;
  isSelected: boolean;
  onClick: () => void;
  zoom: number;
}

const FacilityMarker: React.FC<FacilityMarkerProps> = ({ facility, isSelected, onClick, zoom }) => {
  const phase = DEPLOYMENT_PHASES[facility.adoptionStatus];
  const size = zoom > 5 ? (isSelected ? 18 : 12) : (isSelected ? 14 : 8);
  
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: phase.color,
        border: `2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'}`,
        boxShadow: isSelected 
          ? `0 0 20px ${phase.color}, 0 0 40px ${phase.color}50`
          : `0 0 8px ${phase.color}80`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: zoom > 6 ? '8px' : '6px',
        color: '#fff',
        fontWeight: 'bold'
      }}
      title={facility.name}
    >
      {zoom > 7 && phase.icon}
    </div>
  );
};

export default function NorthAmericaMap({ onClose, onZoomToFacility }: { onClose: () => void; onZoomToFacility?: (facility: PrimoFacility) => void }) {
  const [viewState, setViewState] = useState({
    longitude: -98.5,
    latitude: 39.8,
    zoom: 4,
    pitch: 0,
    bearing: 0
  });
  
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredFacility, setHoveredFacility] = useState<PrimoFacility | null>(null);

  const stats = useMemo(() => getNetworkStats(), []);
  const regionalStats = useMemo(() => getRegionalLeaderboard(), []);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return PRIMO_FACILITIES.filter(f => {
      if (filterStatus !== 'all' && f.adoptionStatus !== filterStatus) return false;
      if (filterRegion !== 'all' && getRegion(f) !== filterRegion) return false;
      return true;
    });
  }, [filterStatus, filterRegion]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { champion: 0, full: 0, partial: 0, pilot: 0, not_started: 0 };
    filteredFacilities.forEach(f => counts[f.adoptionStatus]++);
    return counts;
  }, [filteredFacilities]);

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const handleFacilityClick = useCallback((facility: PrimoFacility) => {
    setSelectedFacility(facility);
    setViewState(prev => ({
      ...prev,
      longitude: facility.coordinates.lng,
      latitude: facility.coordinates.lat,
      zoom: Math.max(prev.zoom, 8)
    }));
  }, []);

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
          background: 'rgba(5, 10, 15, 0.95)',
          backdropFilter: 'blur(12px)',
          zIndex: 2999
        }} 
      />
      
      {/* Main Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '96vw',
        maxWidth: '1600px',
        height: '92vh',
        background: 'linear-gradient(135deg, rgba(10, 14, 20, 0.99) 0%, rgba(5, 8, 12, 0.99) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '16px',
        color: '#E2E8F0',
        fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
        zIndex: 3000,
        boxShadow: '0 30px 100px rgba(0, 0, 0, 0.8), 0 0 60px rgba(59, 130, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'linear-gradient(90deg, rgba(15, 20, 25, 0.98) 0%, rgba(10, 14, 20, 0.98) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>🗺️</span>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.1rem', 
                fontWeight: '600',
                background: 'linear-gradient(90deg, #60A5FA, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                PRIMO BRANDS NETWORK — NORTH AMERICA
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                260 Facilities • FreightRoll 5-Year Deployment
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981' }}>
                {stats.adoptedFacilities}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Live</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3B82F6' }}>
                {stats.adoptionRate}%
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Adoption</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F59E0B' }}>
                {formatCurrency(stats.projectedAnnualROI)}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Annual ROI</div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Sidebar - Filters & Legend */}
          <div style={{
            width: '280px',
            borderRight: '1px solid rgba(59, 130, 246, 0.15)',
            background: 'rgba(10, 14, 20, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Deployment Status Filter */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Deployment Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => setFilterStatus('all')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: filterStatus === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    border: '1px solid',
                    borderColor: filterStatus === 'all' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <span>All Facilities</span>
                  <span style={{ color: '#64748B' }}>{PRIMO_FACILITIES.length}</span>
                </button>
                
                {Object.entries(DEPLOYMENT_PHASES).map(([key, phase]) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: filterStatus === key ? `${phase.color}20` : 'transparent',
                      border: '1px solid',
                      borderColor: filterStatus === key ? `${phase.color}80` : 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '6px',
                      color: '#E2E8F0',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: phase.color 
                      }} />
                      {phase.icon} {phase.label}
                    </span>
                    <span style={{ color: phase.color, fontWeight: '600' }}>
                      {statusCounts[key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Regional Filter */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Region
              </h3>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(15, 20, 25, 0.8)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#E2E8F0',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Regions</option>
                {Object.keys(REGIONS).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Regional Stats */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Regional Performance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {regionalStats.map((region, idx) => (
                  <div
                    key={region.region}
                    onClick={() => setFilterRegion(filterRegion === region.region ? 'all' : region.region)}
                    style={{
                      padding: '10px 12px',
                      background: filterRegion === region.region 
                        ? 'rgba(59, 130, 246, 0.15)' 
                        : 'rgba(15, 20, 25, 0.5)',
                      border: '1px solid',
                      borderColor: filterRegion === region.region 
                        ? 'rgba(59, 130, 246, 0.4)' 
                        : 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#E2E8F0' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''} {region.region}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#10B981' }}>
                        {region.adoptionRate}% live
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748B' }}>
                      <span>{region.facilities} facilities</span>
                      <span>YVS {region.avgYVS}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                      marginTop: '6px',
                      height: '3px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${region.adoptionRate}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Summary */}
            <div style={{ 
              padding: '16px', 
              borderTop: '1px solid rgba(59, 130, 246, 0.15)',
              background: 'rgba(16, 185, 129, 0.05)'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>
                Network Summary
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10B981' }}>
                    {stats.totalTrucksPerDay.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Trucks/Day</div>
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#3B82F6' }}>
                    {stats.avgYVS}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Avg YVS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              style={{ width: '100%', height: '100%' }}
            >
              <NavigationControl position="bottom-right" />
              <ScaleControl position="bottom-left" />
              
              {/* Facility Markers */}
              {filteredFacilities.map(facility => (
                <Marker
                  key={facility.id}
                  longitude={facility.coordinates.lng}
                  latitude={facility.coordinates.lat}
                  anchor="center"
                >
                  <FacilityMarker
                    facility={facility}
                    isSelected={selectedFacility?.id === facility.id}
                    onClick={() => handleFacilityClick(facility)}
                    zoom={viewState.zoom}
                  />
                </Marker>
              ))}

              {/* Selected Facility Popup */}
              {selectedFacility && (
                <Popup
                  longitude={selectedFacility.coordinates.lng}
                  latitude={selectedFacility.coordinates.lat}
                  anchor="bottom"
                  onClose={() => setSelectedFacility(null)}
                  closeButton={false}
                  maxWidth="340px"
                >
                  <div style={{
                    background: 'rgba(15, 20, 25, 0.98)',
                    border: `2px solid ${DEPLOYMENT_PHASES[selectedFacility.adoptionStatus].color}`,
                    borderRadius: '12px',
                    padding: '16px',
                    color: '#E2E8F0',
                    fontFamily: '"Inter", -apple-system, sans-serif',
                    minWidth: '300px'
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ 
                          fontSize: '0.6rem', 
                          color: DEPLOYMENT_PHASES[selectedFacility.adoptionStatus].color,
                          fontWeight: '600',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {DEPLOYMENT_PHASES[selectedFacility.adoptionStatus].icon} {DEPLOYMENT_PHASES[selectedFacility.adoptionStatus].label}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>{selectedFacility.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {selectedFacility.location} • {selectedFacility.brand}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFacility(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Metrics Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '8px', 
                      marginBottom: '12px',
                      padding: '10px',
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10B981' }}>
                          {selectedFacility.yvsScore}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#64748B' }}>YVS Score</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3B82F6' }}>
                          {selectedFacility.trucksPerDay}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Trucks/Day</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F59E0B' }}>
                          {selectedFacility.avgTurnTime}m
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Avg Turn</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        background: selectedFacility.hasYES ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        border: `1px solid ${selectedFacility.hasYES ? 'rgba(16, 185, 129, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        color: selectedFacility.hasYES ? '#10B981' : '#64748B'
                      }}>
                        {selectedFacility.hasYES ? '✓' : '○'} YES (Check-in)
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        background: selectedFacility.hasYMS ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        border: `1px solid ${selectedFacility.hasYMS ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        color: selectedFacility.hasYMS ? '#3B82F6' : '#64748B'
                      }}>
                        {selectedFacility.hasYMS ? '✓' : '○'} YMS (Full)
                      </span>
                    </div>

                    {/* Performance */}
                    {selectedFacility.adoptionStatus !== 'not_started' && (
                      <div style={{
                        padding: '10px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Performance Since Go-Live
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ color: '#10B981', fontWeight: '600' }}>
                              ▲ {selectedFacility.turnTimeImprovement}%
                            </span>
                            <span style={{ color: '#64748B', fontSize: '0.7rem', marginLeft: '4px' }}>
                              turn time reduction
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <div>
                            <span style={{ color: '#3B82F6', fontWeight: '600' }}>
                              {formatCurrency(selectedFacility.projectedAnnualROI)}
                            </span>
                            <span style={{ color: '#64748B', fontSize: '0.7rem', marginLeft: '4px' }}>
                              projected annual ROI
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Go-Live / Target Date */}
                    <div style={{
                      padding: '10px',
                      background: selectedFacility.goLiveDate 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${selectedFacility.goLiveDate 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : 'rgba(245, 158, 11, 0.3)'}`,
                      borderRadius: '8px'
                    }}>
                      {selectedFacility.goLiveDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#10B981' }}>✓</span>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Go-Live Date</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10B981' }}>
                              {new Date(selectedFacility.goLiveDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#F59E0B' }}>◎</span>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Deployment Status</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#F59E0B' }}>
                              Scheduled for 2025
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gamification */}
                    {selectedFacility.adoptionStatus !== 'not_started' && selectedFacility.achievements.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '6px' }}>
                          Achievements
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {selectedFacility.achievements.slice(0, 3).map((achievement, idx) => (
                            <span key={idx} style={{
                              padding: '3px 6px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '4px',
                              fontSize: '0.6rem',
                              color: '#F59E0B'
                            }}>
                              {achievement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Satellite Recon Button */}
                    <button
                      onClick={() => {
                        if (onZoomToFacility) {
                          onZoomToFacility(selectedFacility);
                        }
                      }}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '8px',
                        color: '#60A5FA',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      🛰️ SATELLITE RECON
                      <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>→</span>
                    </button>
                  </div>
                </Popup>
              )}
            </Map>

            {/* Map Overlay - Deployment Progress */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(10, 14, 20, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '220px'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Deployment Progress
              </div>
              
              {/* Progress Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>
                    {stats.adoptedFacilities} of {stats.totalFacilities} Live
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
                    {stats.adoptionRate}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  {/* Stacked progress by status */}
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ 
                      width: `${(statusCounts.champion / stats.totalFacilities) * 100}%`,
                      background: DEPLOYMENT_PHASES.champion.color,
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{ 
                      width: `${(statusCounts.full / stats.totalFacilities) * 100}%`,
                      background: DEPLOYMENT_PHASES.full.color,
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{ 
                      width: `${(statusCounts.partial / stats.totalFacilities) * 100}%`,
                      background: DEPLOYMENT_PHASES.partial.color,
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{ 
                      width: `${(statusCounts.pilot / stats.totalFacilities) * 100}%`,
                      background: DEPLOYMENT_PHASES.pilot.color,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.entries(DEPLOYMENT_PHASES).filter(([k]) => k !== 'not_started').map(([key, phase]) => (
                  <div key={key} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '3px 6px',
                    background: `${phase.color}15`,
                    borderRadius: '4px'
                  }}>
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: phase.color 
                    }} />
                    <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>
                      {statusCounts[key]} {phase.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => setViewState(prev => ({ ...prev, longitude: -98.5, latitude: 39.8, zoom: 4 }))}
                style={{
                  background: 'rgba(10, 14, 20, 0.95)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#E2E8F0',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '500'
                }}
              >
                🔄 Reset View
              </button>
              <button
                onClick={() => {
                  // Focus on live facilities
                  const live = PRIMO_FACILITIES.filter(f => f.adoptionStatus !== 'not_started');
                  if (live.length > 0) {
                    const avgLat = live.reduce((sum, f) => sum + f.coordinates.lat, 0) / live.length;
                    const avgLng = live.reduce((sum, f) => sum + f.coordinates.lng, 0) / live.length;
                    setViewState(prev => ({ ...prev, longitude: avgLng, latitude: avgLat, zoom: 5 }));
                    setFilterStatus('all');
                  }
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10B981',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '500'
                }}
              >
                ◉ Live Facilities
              </button>
            </div>

            {/* Facility Count Badge */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10, 14, 20, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '20px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Showing</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#3B82F6' }}>
                {filteredFacilities.length}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>facilities</span>
            </div>
          </div>

          {/* Right Sidebar - Top Facilities */}
          <div style={{
            width: '280px',
            borderLeft: '1px solid rgba(59, 130, 246, 0.15)',
            background: 'rgba(10, 14, 20, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Top Performers */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🏆 Top Performers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PRIMO_FACILITIES
                  .filter(f => f.adoptionStatus !== 'not_started')
                  .sort((a, b) => b.yvsScore - a.yvsScore)
                  .slice(0, 5)
                  .map((facility, idx) => (
                    <div
                      key={facility.id}
                      onClick={() => handleFacilityClick(facility)}
                      style={{
                        padding: '10px 12px',
                        background: selectedFacility?.id === facility.id 
                          ? 'rgba(59, 130, 246, 0.15)' 
                          : 'rgba(15, 20, 25, 0.5)',
                        border: '1px solid',
                        borderColor: selectedFacility?.id === facility.id 
                          ? 'rgba(59, 130, 246, 0.4)' 
                          : 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontSize: '0.8rem',
                            opacity: idx < 3 ? 1 : 0.5
                          }}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#E2E8F0' }}>
                              {facility.name.replace('US ', '').replace(' Factory', '').replace(' Distribution', '')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#64748B' }}>
                              {facility.location}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '700', 
                            color: '#10B981' 
                          }}>
                            {facility.yvsScore}
                          </div>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>YVS</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Needs Attention */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚠️ Needs Attention
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PRIMO_FACILITIES
                  .filter(f => f.adoptionStatus !== 'not_started' && f.yvsScore < 70)
                  .sort((a, b) => a.yvsScore - b.yvsScore)
                  .slice(0, 5)
                  .map((facility) => (
                    <div
                      key={facility.id}
                      onClick={() => handleFacilityClick(facility)}
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#E2E8F0' }}>
                            {facility.name.replace('US ', '').replace(' Factory', '').replace(' Distribution', '')}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: '#64748B' }}>
                            {facility.location}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: '700', 
                            color: '#EF4444' 
                          }}>
                            {facility.yvsScore}
                          </div>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>YVS</div>
                        </div>
                      </div>
                    </div>
                  ))}
                {PRIMO_FACILITIES.filter(f => f.adoptionStatus !== 'not_started' && f.yvsScore < 70).length === 0 && (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#10B981',
                    fontSize: '0.75rem'
                  }}>
                    ✓ All live facilities performing well!
                  </div>
                )}
              </div>
            </div>

            {/* Call to Action */}
            <div style={{ 
              padding: '16px', 
              borderTop: '1px solid rgba(59, 130, 246, 0.15)',
              background: 'rgba(59, 130, 246, 0.05)'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '8px' }}>
                Ready to expand the network?
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📅 Schedule Deployments
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
