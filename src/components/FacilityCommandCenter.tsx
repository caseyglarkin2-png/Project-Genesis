import React, { useState, useMemo } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PRIMO_FACILITIES, PrimoFacility, getNetworkStats, calculateRiskProfile, getNetworkRiskAnalysis } from '../data/primo-facilities';
import YardOperationsView from './YardOperationsView';
import RiskCompetitivePanel from './RiskCompetitivePanel';
import CoordinateValidatorPanel from './CoordinateValidatorPanel';
import SatelliteAnalysisPanel from './SatelliteAnalysisPanel';

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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2dsYXJraW40MTAiLCJhIjoiY21qN3R1dDc2MDBidjNlcTc1ZjVjcXJ0OSJ9.mSsGQbC0253Lhf9kTmIp_Q';

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
  const [viewMode, setViewMode] = useState<'facility' | 'waves'>('facility');
  const [selectedWave, setSelectedWave] = useState<string | null>(null);
  const [showYardOps, setShowYardOps] = useState(false);
  const [showRiskPanel, setShowRiskPanel] = useState(false);
  const [showCoordValidator, setShowCoordValidator] = useState(false);
  const [showSatelliteAnalysis, setShowSatelliteAnalysis] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets' | 'dark'>('satellite');
  
  const stats = useMemo(() => getNetworkStats(), []);
  const riskAnalysis = useMemo(() => getNetworkRiskAnalysis(), []);
  
  // Map style URLs
  const MAP_STYLES = {
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    streets: 'mapbox://styles/mapbox/streets-v12',
    dark: 'mapbox://styles/mapbox/dark-v11'
  };
  
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

  // ==========================================================================
  // DEPLOYMENT WAVE OPTIMIZATION (Phiroz Method)
  // ==========================================================================
  // Group facilities by region for efficient field resource deployment
  // Maximize ROI per wave while minimizing travel/training overhead
  
  const deploymentWaves = useMemo(() => {
    const notStarted = PRIMO_FACILITIES.filter(f => f.adoptionStatus === 'not_started');
    
    // Group by state/province
    const byRegion: Record<string, PrimoFacility[]> = {};
    notStarted.forEach(f => {
      const region = f.state;
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(f);
    });
    
    // Calculate wave metrics per region
    const waves = Object.entries(byRegion)
      .map(([region, facilities]) => {
        const totalROI = facilities.reduce((sum, f) => sum + f.projectedAnnualROI, 0);
        const totalDockDoors = facilities.reduce((sum, f) => sum + f.dockDoors, 0);
        const avgYVS = facilities.reduce((sum, f) => sum + f.yvsScore, 0) / facilities.length;
        const totalTrucks = facilities.reduce((sum, f) => sum + f.trucksPerDay, 0);
        const implementationCost = facilities.length * 48000;
        const roiPerDollar = totalROI / implementationCost;
        
        return {
          region,
          facilities,
          count: facilities.length,
          totalROI,
          totalDockDoors,
          avgYVS,
          totalTrucks,
          implementationCost,
          roiPerDollar, // Higher = more efficient deployment
          priority: roiPerDollar >= 3 ? 'CRITICAL' : roiPerDollar >= 2 ? 'HIGH' : roiPerDollar >= 1.5 ? 'STANDARD' : 'QUEUE'
        };
      })
      .sort((a, b) => b.roiPerDollar - a.roiPerDollar);
    
    return waves;
  }, []);

  // Top 3 waves for immediate deployment focus
  const priorityWaves = deploymentWaves.slice(0, 3);
  
  // Deployment velocity tracking
  const deploymentVelocity = useMemo(() => {
    const deployed = PRIMO_FACILITIES.filter(f => f.adoptionStatus !== 'not_started');
    const remaining = PRIMO_FACILITIES.filter(f => f.adoptionStatus === 'not_started');
    
    // Assume 52-week target for full deployment
    const weeksRemaining = 52;
    const facilitiesPerWeek = remaining.length / weeksRemaining;
    const roiPerWeek = remaining.reduce((sum, f) => sum + f.projectedAnnualROI, 0) / weeksRemaining;
    
    return {
      deployed: deployed.length,
      remaining: remaining.length,
      targetPerWeek: Math.ceil(facilitiesPerWeek),
      roiPerWeek,
      weeksToComplete: weeksRemaining,
      currentPace: deployed.length > 0 ? 'ON_TRACK' : 'STARTING' // Would calculate from goLiveDates
    };
  }, []);

  // Calculate facility-specific metrics with detailed ROI breakdown
  const facilityMetrics = useMemo(() => {
    const f = selectedFacility;
    const implementationCost = 48000;
    const paybackMonths = f.projectedAnnualROI > 0 
      ? Math.ceil((implementationCost / f.projectedAnnualROI) * 12) 
      : 99;
    
    const roiPriority = f.projectedAnnualROI >= ROI_THRESHOLDS.high ? 'HIGH' :
                        f.projectedAnnualROI >= ROI_THRESHOLDS.medium ? 'MEDIUM' : 'STANDARD';
    
    // Detailed ROI breakdown (Phiroz methodology)
    // Detention savings = dock doors * avg detention cost reduction
    const avgDetentionPerDoor = f.hasYMS ? 0 : Math.round(f.monthlyDetentionSavings / Math.max(f.dockDoors, 1));
    
    // Labor savings = reduced ghost searches + paperwork elimination
    const laborPerTruck = f.hasYMS ? 0 : Math.round((f.monthlyLaborSavings * 12) / (f.trucksPerDay * 365));
    
    // Yard efficiency gain from spot visibility
    const yardEfficiencyGain = f.hasYMS ? 0 : Math.round(f.yardSpots * 2.5 * 12); // ~$2.50/spot/month
    
    // Turn time value = faster turns = more capacity
    const turnTimeValue = f.hasYMS ? 0 : Math.round((f.turnTimeImprovement / 100) * f.trucksPerDay * 15 * 260); // $15/turn saved * days/year
    
    return {
      paybackMonths,
      roiPriority,
      dailySavings: Math.round((f.monthlyDetentionSavings + f.monthlyLaborSavings) / 30),
      capacityUtilization: Math.round((f.detectedTrailers / (f.trucksPerDay * 0.8)) * 100),
      // ROI components
      detentionROI: f.monthlyDetentionSavings * 12,
      laborROI: f.monthlyLaborSavings * 12,
      avgDetentionPerDoor,
      laborPerTruck,
      yardEfficiencyGain,
      turnTimeValue,
      // Door economics
      costPerDoor: Math.round(implementationCost / f.dockDoors),
      savingsPerDoor: Math.round(f.projectedAnnualROI / f.dockDoors),
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
            {/* View Mode Toggle */}
            <div style={{ 
              display: 'flex', 
              background: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <button
                onClick={() => setViewMode('facility')}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'facility' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: viewMode === 'facility' ? '#60A5FA' : '#64748B',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📍 Facilities
              </button>
              <button
                onClick={() => setViewMode('waves')}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'waves' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: viewMode === 'waves' ? '#10B981' : '#64748B',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🌊 Waves
              </button>
            </div>
            
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
            
            {/* Risk & Competitive Intel Button */}
            <button
              onClick={() => setShowRiskPanel(true)}
              style={{
                background: riskAnalysis.vectorThreat > 0 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${riskAnalysis.vectorThreat > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
                color: riskAnalysis.vectorThreat > 0 ? '#EF4444' : '#F59E0B',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ⚔️ Risk/Intel
              {riskAnalysis.vectorThreat > 0 && (
                <span style={{
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '0.55rem',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontWeight: '700'
                }}>
                  {riskAnalysis.vectorThreat}
                </span>
              )}
            </button>
            
            {/* Coordinate Validator Button */}
            <button
              onClick={() => setShowCoordValidator(true)}
              style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                color: '#A855F7',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📍 Validate Coords
            </button>
            
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

        {/* Main Content Area */}
        {viewMode === 'waves' ? (
          /* ================================================================
           * WAVE PLANNING VIEW - Deployment Optimization Dashboard
           * ================================================================ */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* LEFT: Wave List */}
            <div style={{
              width: '360px',
              background: 'rgba(5, 10, 20, 0.95)',
              borderRight: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Velocity Header */}
              <div style={{ 
                padding: '16px',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1), transparent)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  📊 Deployment Velocity
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>
                      {deploymentVelocity.targetPerWeek}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748B' }}>facilities/week</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3B82F6' }}>
                      {deploymentVelocity.remaining}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748B' }}>remaining</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#F59E0B' }}>
                      {formatCurrency(deploymentVelocity.roiPerWeek)}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748B' }}>ROI/week</div>
                  </div>
                </div>
              </div>
              
              {/* Wave List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '12px 16px', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                  🌊 Regional Deployment Waves ({deploymentWaves.length})
                </div>
                {deploymentWaves.map((wave, idx) => (
                  <div
                    key={wave.region}
                    onClick={() => setSelectedWave(wave.region)}
                    style={{
                      padding: '14px 16px',
                      background: selectedWave === wave.region ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
                      borderLeft: selectedWave === wave.region ? '3px solid #10B981' : '3px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '0.85rem',
                          color: selectedWave === wave.region ? '#10B981' : '#E2E8F0'
                        }}>
                          {wave.region}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                          {wave.count} facilities • {wave.totalDockDoors} dock doors
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '0.6rem', 
                          padding: '2px 6px',
                          background: wave.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' :
                                      wave.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' :
                                      'rgba(59, 130, 246, 0.2)',
                          color: wave.priority === 'CRITICAL' ? '#EF4444' :
                                 wave.priority === 'HIGH' ? '#F59E0B' : '#3B82F6',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {wave.priority}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      marginTop: '8px',
                      fontSize: '0.65rem'
                    }}>
                      <span style={{ color: '#10B981' }}>{formatCurrency(wave.totalROI)} ROI</span>
                      <span style={{ color: '#64748B' }}>•</span>
                      <span style={{ color: '#60A5FA' }}>{wave.roiPerDollar.toFixed(1)}x return</span>
                      <span style={{ color: '#64748B' }}>•</span>
                      <span style={{ color: '#94A3B8' }}>{formatNumber(wave.totalTrucks)} trucks/day</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* CENTER: Wave Map */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  longitude: -98,
                  latitude: 39,
                  zoom: 3.5
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
              >
                {/* Show all pending facilities, highlight selected wave */}
                {PRIMO_FACILITIES.filter(f => f.adoptionStatus === 'not_started').map(facility => {
                  const isInSelectedWave = selectedWave === facility.state;
                  return (
                    <Marker
                      key={facility.id}
                      longitude={facility.coordinates.lng}
                      latitude={facility.coordinates.lat}
                    >
                      <div
                        onClick={() => {
                          setSelectedWave(facility.state);
                          setSelectedFacility(facility);
                        }}
                        style={{
                          width: isInSelectedWave ? '16px' : '10px',
                          height: isInSelectedWave ? '16px' : '10px',
                          background: isInSelectedWave ? '#10B981' : 'rgba(100, 116, 139, 0.6)',
                          borderRadius: '50%',
                          border: isInSelectedWave ? '2px solid #fff' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isInSelectedWave ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
                        }}
                      />
                    </Marker>
                  );
                })}
              </Map>
              
              {/* Wave Summary Overlay */}
              {selectedWave && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'rgba(5, 10, 20, 0.95)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  minWidth: '320px'
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                    Wave Details
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981', marginTop: '4px' }}>
                    {selectedWave} Region
                  </div>
                  {(() => {
                    const wave = deploymentWaves.find(w => w.region === selectedWave);
                    if (!wave) return null;
                    const waveIndex = deploymentWaves.findIndex(w => w.region === selectedWave);
                    // Calculate projected timeline based on wave priority
                    const weeksPerWave = Math.ceil(wave.count / 5); // 5 facilities/week capacity
                    const cumulativeWeeks = deploymentWaves
                      .slice(0, waveIndex)
                      .reduce((sum, w) => sum + Math.ceil(w.count / 5), 0);
                    const startWeek = cumulativeWeeks + 1;
                    const endWeek = startWeek + weeksPerWave - 1;
                    
                    // Calculate projected dates
                    const today = new Date();
                    const startDate = new Date(today.getTime() + (startWeek * 7 * 24 * 60 * 60 * 1000));
                    const endDate = new Date(today.getTime() + (endWeek * 7 * 24 * 60 * 60 * 1000));
                    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <>
                        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10B981' }}>{wave.count}</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Facilities</div>
                          </div>
                          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#3B82F6' }}>{wave.totalDockDoors}</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Dock Doors</div>
                          </div>
                          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F59E0B' }}>{formatCurrency(wave.totalROI)}</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Wave ROI</div>
                          </div>
                          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#A855F7' }}>{wave.roiPerDollar.toFixed(1)}x</div>
                            <div style={{ fontSize: '0.6rem', color: '#64748B' }}>ROI/$ Spent</div>
                          </div>
                        </div>
                        
                        {/* Projected Timeline */}
                        <div style={{
                          marginTop: '12px',
                          padding: '10px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ fontSize: '0.6rem', color: '#60A5FA', fontWeight: '600', marginBottom: '6px' }}>
                            📅 PROJECTED TIMELINE
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Start</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#E2E8F0' }}>
                                {formatDate(startDate)}
                              </div>
                            </div>
                            <div style={{ color: '#64748B', fontSize: '1rem' }}>→</div>
                            <div>
                              <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Complete</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10B981' }}>
                                {formatDate(endDate)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Duration</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#F59E0B' }}>
                                {weeksPerWave} wk{weeksPerWave > 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* RIGHT: Wave Action Panel */}
            <div style={{
              width: '300px',
              background: 'rgba(5, 10, 20, 0.95)',
              borderLeft: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                  🎯 Priority Waves
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px' }}>
                  Top 3 by ROI efficiency
                </div>
              </div>
              
              {priorityWaves.map((wave, idx) => (
                <div 
                  key={wave.region}
                  onClick={() => setSelectedWave(wave.region)}
                  style={{ 
                    padding: '16px',
                    borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
                    cursor: 'pointer',
                    background: selectedWave === wave.region ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      background: idx === 0 ? 'rgba(239, 68, 68, 0.2)' :
                                  idx === 1 ? 'rgba(245, 158, 11, 0.2)' :
                                  'rgba(59, 130, 246, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: idx === 0 ? '#EF4444' : idx === 1 ? '#F59E0B' : '#3B82F6'
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{wave.region}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                        {wave.count} facilities • {wave.roiPerDollar.toFixed(1)}x return
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#10B981' }}>
                        {formatCurrency(wave.totalROI)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Launch Wave Button */}
              {selectedWave && (
                <div style={{ padding: '16px', marginTop: 'auto' }}>
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
                    marginBottom: '8px'
                  }}>
                    🚀 LAUNCH {selectedWave} WAVE
                  </button>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textAlign: 'center' }}>
                    {deploymentWaves.find(w => w.region === selectedWave)?.count || 0} facilities • 
                    Est. {Math.ceil((deploymentWaves.find(w => w.region === selectedWave)?.count || 1) / 5)} weeks
                  </div>
                </div>
              )}
              
              {/* Quick Stats */}
              <div style={{ padding: '16px', background: 'rgba(10, 15, 25, 0.5)', borderTop: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Network Progress
                </div>
                <div style={{ 
                  height: '8px', 
                  background: 'rgba(100, 116, 139, 0.2)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(deploymentVelocity.deployed / (deploymentVelocity.deployed + deploymentVelocity.remaining)) * 100}%`,
                    background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                    borderRadius: '4px'
                  }} />
                </div>
                <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginTop: '4px' }}>
                  {deploymentVelocity.deployed} live / {deploymentVelocity.deployed + deploymentVelocity.remaining} total
                </div>
              </div>
            </div>
          </div>
        ) : (
        /* ================================================================
         * FACILITY VIEW - Original 3 Column Layout
         * ================================================================ */
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
                const riskProfile = facility.adoptionStatus === 'not_started' ? calculateRiskProfile(facility) : null;
                
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
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {facility.name}
                          {riskProfile && riskProfile.activeCompetitors.length > 0 && (
                            <span style={{
                              fontSize: '0.5rem',
                              padding: '1px 4px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#EF4444',
                              borderRadius: '3px',
                              fontWeight: '700'
                            }}>
                              ⚔️ {riskProfile.activeCompetitors[0]}
                            </span>
                          )}
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
                      <span style={{ color: '#F59E0B' }}>
                        {facility.dockDoors || '?'} docks
                      </span>
                      <span style={{ color: '#64748B' }}>
                        {facility.trucksPerDay}/day
                      </span>
                      {riskProfile && riskProfile.overallRisk !== 'LOW' && (
                        <span style={{ 
                          color: riskProfile.overallRisk === 'CRITICAL' ? '#DC2626' :
                                 riskProfile.overallRisk === 'HIGH' ? '#EF4444' : '#F59E0B'
                        }}>
                          ⚠️ {riskProfile.overallRisk}
                        </span>
                      )}
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
            
            {/* Map View */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Map
                key={`${selectedFacility.id}-${mapStyle}`}
                initialViewState={{
                  longitude: selectedFacility.coordinates.lng,
                  latitude: selectedFacility.coordinates.lat,
                  zoom: 17,
                  pitch: mapStyle === 'satellite' ? 45 : 0
                }}
                mapStyle={MAP_STYLES[mapStyle]}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                interactive={true}
                reuseMaps={false}
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
              
              {/* Map Style Toggle */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  background: 'rgba(10, 15, 25, 0.95)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '4px',
                  gap: '4px'
                }}>
                  {[
                    { id: 'satellite', label: '🛰️ Satellite', icon: '🛰️' },
                    { id: 'streets', label: '🗺️ Streets', icon: '🗺️' },
                    { id: 'dark', label: '🌙 Dark', icon: '🌙' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setMapStyle(style.id as typeof mapStyle)}
                      style={{
                        padding: '6px 10px',
                        background: mapStyle === style.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: mapStyle === style.id ? '#60A5FA' : '#64748B',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {style.icon}
                    </button>
                  ))}
                </div>
                
                {/* Satellite Analysis Button */}
                <button
                  onClick={() => setShowSatelliteAnalysis(true)}
                  style={{
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))',
                    border: '1px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '8px',
                    color: '#A855F7',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🔬 Analyze Facility
                </button>
              </div>
              
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
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981' }}>
                    {selectedFacility.dockDoors || '—'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Dock Doors</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F59E0B' }}>
                    {selectedFacility.yardSpots || '—'}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Yard Spots</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3B82F6' }}>
                    {selectedFacility.gateNodes}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Gates</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#EC4899' }}>
                    {selectedFacility.trucksPerDay}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>Trucks/Day</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#A855F7' }}>
                    {selectedFacility.yvsScore}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase' }}>YVS</div>
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
              
              {/* Per-Door Economics - The Phiroz Metric */}
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  fontSize: '0.6rem', 
                  color: '#60A5FA', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  🚪 PER-DOOR ECONOMICS
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Implementation Cost</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#EF4444' }}>
                    {formatCurrency(facilityMetrics.costPerDoor)}/door
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Annual Return</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10B981' }}>
                    {formatCurrency(facilityMetrics.savingsPerDoor)}/door
                  </span>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  paddingTop: '8px', 
                  borderTop: '1px solid rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>ROI per Door</span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: '700', 
                    color: facilityMetrics.savingsPerDoor > facilityMetrics.costPerDoor ? '#10B981' : '#F59E0B' 
                  }}>
                    {((facilityMetrics.savingsPerDoor / facilityMetrics.costPerDoor) * 100).toFixed(0)}%
                  </span>
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
                  <button 
                    onClick={() => setShowYardOps(true)}
                    style={{
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
                    🏭 YARD OPERATIONS
                  </button>
                  <button style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#3B82F6',
                    fontSize: '0.75rem',
                    fontWeight: '600',
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
        )}
      </div>
      
      {/* Yard Operations Drill-Down */}
      {showYardOps && (
        <YardOperationsView 
          facility={selectedFacility}
          onClose={() => setShowYardOps(false)}
        />
      )}
      
      {/* Risk & Competitive Intelligence Panel */}
      {showRiskPanel && (
        <RiskCompetitivePanel
          onSelectFacility={(facility) => {
            setSelectedFacility(facility);
            setShowRiskPanel(false);
          }}
          onClose={() => setShowRiskPanel(false)}
        />
      )}
      
      {/* Coordinate Validator Panel */}
      {showCoordValidator && (
        <CoordinateValidatorPanel
          onSelectFacility={(facility) => {
            setSelectedFacility(facility);
            setShowCoordValidator(false);
          }}
          onClose={() => setShowCoordValidator(false)}
        />
      )}
      
      {/* Satellite Analysis Panel */}
      {showSatelliteAnalysis && (
        <SatelliteAnalysisPanel
          facility={selectedFacility}
          onClose={() => setShowSatelliteAnalysis(false)}
        />
      )}
    </>
  );
}
