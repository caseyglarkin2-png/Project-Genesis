import React, { useState, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PRIMO_FACILITIES, PrimoFacility, getNetworkStats } from '../data/primo-facilities';

/**
 * =============================================================================
 * FACILITY COMMAND CENTER
 * =============================================================================
 * 
 * Dr. Phiroz Approach: Single unified view for deployment decisions.
 * 
 * GOAL: Get facilities from "Not Started" → "Live" as fast as possible.
 * 
 * KEY PRINCIPLES:
 * 1. No theater - instant data, instant decisions
 * 2. All information in ONE view - no modal hopping
 * 3. Clear ROI and Go/No-Go metrics visible immediately
 * 4. One-click actions: Schedule, Prioritize, Flag
 * 
 * Layout: 
 * [Facility List] | [Satellite + Analysis] | [Action Panel]
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Quick status colors
const STATUS_CONFIG = {
  champion: { color: '#FFD700', label: 'CHAMPION', icon: '★', priority: 0 },
  full: { color: '#10B981', label: 'LIVE', icon: '●', priority: 1 },
  partial: { color: '#3B82F6', label: 'PARTIAL', icon: '◐', priority: 2 },
  pilot: { color: '#F59E0B', label: 'PILOT', icon: '◌', priority: 3 },
  not_started: { color: '#64748B', label: 'PENDING', icon: '○', priority: 4 },
};

// ROI thresholds for deployment prioritization
const ROI_THRESHOLDS = {
  high: 200000,    // >$200K = High priority
  medium: 100000,  // >$100K = Medium
  low: 0           // <$100K = Lower priority (still valuable)
};

const formatCurrency = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

const formatNumber = (n: number) => n.toLocaleString();

interface FacilityCommandCenterProps {
  onClose: () => void;
  initialFacility?: PrimoFacility;
}

export default function FacilityCommandCenter({ onClose, initialFacility }: FacilityCommandCenterProps) {
  const [selectedFacility, setSelectedFacility] = useState<PrimoFacility>(
    initialFacility || PRIMO_FACILITIES[0]
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'roi' | 'yvs' | 'trucks' | 'name'>('roi');
  const [searchQuery, setSearchQuery] = useState('');
  
  const stats = useMemo(() => getNetworkStats(), []);
  
  // Filter and sort facilities
  const filteredFacilities = useMemo(() => {
    let facilities = PRIMO_FACILITIES.filter(f => {
      if (filterStatus !== 'all' && f.adoptionStatus !== filterStatus) return false;
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !f.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    
    // Sort
    facilities.sort((a, b) => {
      switch (sortBy) {
        case 'roi': return b.projectedAnnualROI - a.projectedAnnualROI;
        case 'yvs': return b.yvsScore - a.yvsScore;
        case 'trucks': return b.trucksPerDay - a.trucksPerDay;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
    
    return facilities;
  }, [filterStatus, sortBy, searchQuery]);

  // Deployment queue - not started, sorted by ROI
  const deploymentQueue = useMemo(() => {
    return PRIMO_FACILITIES
      .filter(f => f.adoptionStatus === 'not_started')
      .sort((a, b) => b.projectedAnnualROI - a.projectedAnnualROI)
      .slice(0, 10);
  }, []);

  // Calculate facility-specific metrics
  const facilityMetrics = useMemo(() => {
    const f = selectedFacility;
    const implementationCost = 48000;
    const paybackMonths = f.projectedAnnualROI > 0 
      ? Math.ceil((implementationCost / f.projectedAnnualROI) * 12) 
      : 99;
    
    const roiPriority = f.projectedAnnualROI >= ROI_THRESHOLDS.high ? 'HIGH' :
                        f.projectedAnnualROI >= ROI_THRESHOLDS.medium ? 'MEDIUM' : 'STANDARD';
    
    return {
      paybackMonths,
      roiPriority,
      dailySavings: Math.round((f.monthlyDetentionSavings + f.monthlyLaborSavings) / 30),
      capacityUtilization: Math.round((f.detectedTrailers / (f.trucksPerDay * 0.8)) * 100),
    };
  }, [selectedFacility]);

  return (
    <>
      {/* Full-screen backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 5, 15, 0.98)',
          zIndex: 5000
        }} 
      />
      
      {/* Main Container */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", -apple-system, sans-serif',
        color: '#E2E8F0',
        zIndex: 5001
      }}>
        
        {/* Header Bar */}
        <div style={{
          height: '60px',
          background: 'linear-gradient(90deg, rgba(10, 15, 25, 0.98), rgba(15, 20, 30, 0.98))',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '1.1rem', 
                fontWeight: '700',
                background: 'linear-gradient(90deg, #60A5FA, #34D399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                FACILITY COMMAND CENTER
              </h1>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                Primo Brands Network • {stats.totalFacilities} Facilities • {stats.adoptedFacilities} Live
              </span>
            </div>
          </div>
          
          {/* Network Summary */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#10B981' }}>
                {formatCurrency(stats.projectedAnnualROI)}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>
                Network ROI Potential
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#3B82F6' }}>
                {stats.totalFacilities - stats.adoptedFacilities}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>
                Awaiting Deployment
              </div>
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
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT: Facility List */}
          <div style={{
            width: '320px',
            background: 'rgba(5, 10, 20, 0.95)',
            borderRight: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Search & Filter */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                {['all', 'not_started', 'pilot', 'partial', 'full', 'champion'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: '4px 8px',
                      background: filterStatus === status 
                        ? status === 'all' ? 'rgba(59, 130, 246, 0.3)' : `${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color}30`
                        : 'transparent',
                      border: `1px solid ${filterStatus === status 
                        ? status === 'all' ? 'rgba(59, 130, 246, 0.5)' : `${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color}60`
                        : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '4px',
                      color: filterStatus === status 
                        ? status === 'all' ? '#60A5FA' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color
                        : '#64748B',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      fontWeight: filterStatus === status ? '600' : '400'
                    }}
                  >
                    {status === 'all' ? 'ALL' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
                  </button>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.6rem', color: '#64748B', alignSelf: 'center' }}>Sort:</span>
                {[
                  { key: 'roi', label: 'ROI' },
                  { key: 'yvs', label: 'YVS' },
                  { key: 'trucks', label: 'Volume' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key as typeof sortBy)}
                    style={{
                      padding: '3px 8px',
                      background: sortBy === key ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: `1px solid ${sortBy === key ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                      borderRadius: '4px',
                      color: sortBy === key ? '#10B981' : '#64748B',
                      fontSize: '0.6rem',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Facility List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredFacilities.map(facility => {
                const status = STATUS_CONFIG[facility.adoptionStatus];
                const isSelected = facility.id === selectedFacility.id;
                
                return (
                  <div
                    key={facility.id}
                    onClick={() => setSelectedFacility(facility)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      cursor: 'pointer',
                      borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: '600', 
                          color: '#E2E8F0',
                          marginBottom: '2px'
                        }}>
                          {facility.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {facility.location}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.55rem',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: `${status.color}20`,
                        color: status.color,
                        border: `1px solid ${status.color}40`
                      }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      marginTop: '6px',
                      fontSize: '0.65rem'
                    }}>
                      <span style={{ color: '#10B981' }}>
                        {formatCurrency(facility.projectedAnnualROI)}/yr
                      </span>
                      <span style={{ color: '#64748B' }}>
                        YVS: {facility.yvsScore}
                      </span>
                      <span style={{ color: '#64748B' }}>
                        {facility.trucksPerDay}/day
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Quick Stats Footer */}
            <div style={{ 
              padding: '10px 14px', 
              borderTop: '1px solid rgba(59, 130, 246, 0.2)',
              background: 'rgba(10, 15, 25, 0.8)',
              fontSize: '0.65rem',
              color: '#64748B'
            }}>
              Showing {filteredFacilities.length} of {PRIMO_FACILITIES.length} facilities
            </div>
          </div>

          {/* CENTER: Satellite View + Facility Analysis */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            {/* Satellite Map */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Map
                longitude={selectedFacility.coordinates.lng}
                latitude={selectedFacility.coordinates.lat}
                zoom={17}
                pitch={45}
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                interactive={true}
              >
                {/* Facility Marker */}
                <Marker
                  longitude={selectedFacility.coordinates.lng}
                  latitude={selectedFacility.coordinates.lat}
                  anchor="center"
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: STATUS_CONFIG[selectedFacility.adoptionStatus].color,
                    border: '3px solid #fff',
                    boxShadow: `0 0 20px ${STATUS_CONFIG[selectedFacility.adoptionStatus].color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#000',
                    fontWeight: 'bold'
                  }}>
                    {STATUS_CONFIG[selectedFacility.adoptionStatus].icon}
                  </div>
                </Marker>
              </Map>
              
              {/* Facility Name Overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(10, 15, 25, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                padding: '14px 18px'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F1F5F9', marginBottom: '4px' }}>
                  {selectedFacility.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {selectedFacility.location} • {selectedFacility.coordinates.lat.toFixed(4)}°, {selectedFacility.coordinates.lng.toFixed(4)}°
                </div>
              </div>
              
              {/* Quick Metrics Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                background: 'rgba(10, 15, 25, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-around'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3B82F6' }}>
                    {selectedFacility.yvsScore}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>YVS Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981' }}>
                    {selectedFacility.gateNodes}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Gates</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F59E0B' }}>
                    {selectedFacility.detectedTrailers}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Trailers</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#A855F7' }}>
                    {selectedFacility.pavedAreaPct}%
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Paved</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#EC4899' }}>
                    {selectedFacility.trucksPerDay}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Trucks/Day</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Action Panel */}
          <div style={{
            width: '320px',
            background: 'rgba(5, 10, 20, 0.95)',
            borderLeft: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {/* Deployment Status */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#64748B', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px'
              }}>
                Deployment Status
              </div>
              
              <div style={{
                padding: '14px',
                background: `${STATUS_CONFIG[selectedFacility.adoptionStatus].color}15`,
                border: `1px solid ${STATUS_CONFIG[selectedFacility.adoptionStatus].color}40`,
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: STATUS_CONFIG[selectedFacility.adoptionStatus].color,
                  marginBottom: '4px'
                }}>
                  {STATUS_CONFIG[selectedFacility.adoptionStatus].icon} {STATUS_CONFIG[selectedFacility.adoptionStatus].label}
                </div>
                {selectedFacility.goLiveDate && (
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                    Live since {new Date(selectedFacility.goLiveDate).toLocaleDateString()}
                  </div>
                )}
                {!selectedFacility.goLiveDate && (
                  <div style={{ fontSize: '0.7rem', color: '#F59E0B' }}>
                    Awaiting deployment
                  </div>
                )}
              </div>
              
              {/* Products Enabled */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <div style={{
                  flex: 1,
                  padding: '8px',
                  background: selectedFacility.hasYES ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  border: `1px solid ${selectedFacility.hasYES ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: selectedFacility.hasYES ? '#10B981' : '#64748B' }}>
                    {selectedFacility.hasYES ? '✓' : '○'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>YES</div>
                </div>
                <div style={{
                  flex: 1,
                  padding: '8px',
                  background: selectedFacility.hasYMS ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                  border: `1px solid ${selectedFacility.hasYMS ? 'rgba(59, 130, 246, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.9rem', color: selectedFacility.hasYMS ? '#3B82F6' : '#64748B' }}>
                    {selectedFacility.hasYMS ? '✓' : '○'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>YMS</div>
                </div>
              </div>
            </div>
            
            {/* ROI Analysis */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#64748B', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px'
              }}>
                ROI Analysis
              </div>
              
              {/* Annual ROI */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                textAlign: 'center',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '4px' }}>
                  Projected Annual ROI
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981' }}>
                  {formatCurrency(selectedFacility.projectedAnnualROI)}
                </div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: facilityMetrics.roiPriority === 'HIGH' ? '#10B981' : '#F59E0B',
                  fontWeight: '600',
                  marginTop: '4px'
                }}>
                  {facilityMetrics.roiPriority} PRIORITY
                </div>
              </div>
              
              {/* ROI Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#F59E0B' }}>
                    {formatCurrency(selectedFacility.monthlyDetentionSavings)}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Detention Savings/mo</div>
                </div>
                <div style={{
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#3B82F6' }}>
                    {formatCurrency(selectedFacility.monthlyLaborSavings)}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Labor Savings/mo</div>
                </div>
                <div style={{
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#A855F7' }}>
                    {facilityMetrics.paybackMonths <= 1 ? '<1' : facilityMetrics.paybackMonths} mo
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Payback Period</div>
                </div>
                <div style={{
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#EC4899' }}>
                    {formatCurrency(facilityMetrics.dailySavings)}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Daily Savings</div>
                </div>
              </div>
            </div>
            
            {/* Operations Impact */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#64748B', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px'
              }}>
                Operations Impact
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Avg Turn Time</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#E2E8F0' }}>
                    {selectedFacility.avgTurnTime} min
                    {selectedFacility.turnTimeImprovement > 0 && (
                      <span style={{ color: '#10B981', marginLeft: '6px', fontSize: '0.7rem' }}>
                        ▲{selectedFacility.turnTimeImprovement}%
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Ghost Searches</span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: selectedFacility.ghostSearches === 0 ? '#10B981' : '#EF4444' 
                  }}>
                    {selectedFacility.ghostSearches}/day
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Paper Documents</span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '600', 
                    color: selectedFacility.paperDocuments === 0 ? '#10B981' : '#F59E0B' 
                  }}>
                    {selectedFacility.paperDocuments}/day
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div style={{ padding: '16px', marginTop: 'auto' }}>
              {selectedFacility.adoptionStatus === 'not_started' ? (
                <>
                  <button style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}>
                    📅 SCHEDULE DEPLOYMENT
                  </button>
                  <button style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    color: '#F59E0B',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    ⭐ PRIORITIZE
                  </button>
                </>
              ) : (
                <>
                  <button style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}>
                    📊 VIEW ANALYTICS
                  </button>
                  <button style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#A855F7',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    🎯 OPTIMIZATION REVIEW
                  </button>
                </>
              )}
            </div>
            
            {/* Deployment Queue Preview */}
            {filterStatus === 'not_started' && (
              <div style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                background: 'rgba(10, 15, 25, 0.5)'
              }}>
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#64748B', 
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  🚀 Top 5 by ROI
                </div>
                {deploymentQueue.slice(0, 5).map((f, i) => (
                  <div 
                    key={f.id}
                    onClick={() => setSelectedFacility(f)}
                    style={{ 
                      fontSize: '0.65rem', 
                      color: '#94A3B8',
                      padding: '4px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{i + 1}. {f.name.split(' - ')[0]}</span>
                    <span style={{ color: '#10B981' }}>{formatCurrency(f.projectedAnnualROI)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
