import React, { useState, useEffect } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PrimoFacility } from '../data/primo-facilities';

/**
 * =============================================================================
 * SATELLITE RECON - AI-Powered Facility Analysis
 * =============================================================================
 * 
 * Demonstrates the "Ingestion Engine" vision:
 * 
 * STEP 1: INSTANT RECONNAISSANCE
 * - Address → Satellite Imagery
 * - Computer Vision (YOLOv8, SAM) detects:
 *   • Building footprints
 *   • Dock doors
 *   • Parking spots
 *   • Paved areas
 *   • Trailers/trucks
 * 
 * STEP 2: AUTOMATED MAPPING (90%)
 * - AI identifies boundaries, warehouses, docks
 * - Calculates Yard Velocity Score (YVS)
 * 
 * STEP 3: GESTURAL COMPLETION (10%)
 * - Human defines traffic flow
 * - Custom zones via "brush" tools
 * 
 * This is the foundation for REPEATABLE onboarding across all customers.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Simulated AI detection results - in production, this would come from YOLOv8/SAM
interface AIDetection {
  type: 'building' | 'dock_door' | 'parking_spot' | 'trailer' | 'truck' | 'paved_area' | 'boundary';
  confidence: number;
  coordinates: [number, number]; // [lng, lat]
  bounds?: [[number, number], [number, number], [number, number], [number, number]]; // polygon
  label?: string;
}

// Generate simulated AI detections based on facility location
const generateDetections = (facility: PrimoFacility): AIDetection[] => {
  const { lng, lat } = facility.coordinates;
  const detections: AIDetection[] = [];
  
  // Simulated building footprint
  const buildingOffset = 0.0008;
  detections.push({
    type: 'building',
    confidence: 0.94,
    coordinates: [lng, lat],
    bounds: [
      [lng - buildingOffset, lat - buildingOffset/2],
      [lng + buildingOffset, lat - buildingOffset/2],
      [lng + buildingOffset, lat + buildingOffset/2],
      [lng - buildingOffset, lat + buildingOffset/2],
    ],
    label: 'Main Warehouse'
  });
  
  // Simulated dock doors (along building edge)
  const numDocks = Math.floor(facility.trucksPerDay / 15) + 4;
  for (let i = 0; i < numDocks; i++) {
    const dockLng = lng - buildingOffset + (i * (buildingOffset * 2) / numDocks);
    detections.push({
      type: 'dock_door',
      confidence: 0.87 + Math.random() * 0.1,
      coordinates: [dockLng, lat - buildingOffset/2 - 0.0001],
      label: `Dock ${String(i + 1).padStart(2, '0')}`
    });
  }
  
  // Simulated parking spots / yard spots
  const numSpots = Math.floor(facility.trucksPerDay / 5) + 10;
  for (let i = 0; i < numSpots; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const spotLng = lng - buildingOffset * 1.2 + col * 0.0003;
    const spotLat = lat + buildingOffset + row * 0.00025;
    detections.push({
      type: 'parking_spot',
      confidence: 0.82 + Math.random() * 0.15,
      coordinates: [spotLng, spotLat],
      label: `Spot ${String(i + 1).padStart(3, '0')}`
    });
  }
  
  // Simulated trailers currently in yard
  const numTrailers = Math.floor(Math.random() * 8) + 3;
  for (let i = 0; i < numTrailers; i++) {
    const trailerLng = lng - buildingOffset * 0.8 + Math.random() * buildingOffset * 1.6;
    const trailerLat = lat + buildingOffset * 0.5 + Math.random() * buildingOffset;
    detections.push({
      type: 'trailer',
      confidence: 0.91 + Math.random() * 0.08,
      coordinates: [trailerLng, trailerLat],
      label: `TRL-${10000 + Math.floor(Math.random() * 90000)}`
    });
  }
  
  // Paved area boundary
  const pavedOffset = buildingOffset * 2;
  detections.push({
    type: 'paved_area',
    confidence: 0.96,
    coordinates: [lng, lat],
    bounds: [
      [lng - pavedOffset, lat - pavedOffset * 0.7],
      [lng + pavedOffset, lat - pavedOffset * 0.7],
      [lng + pavedOffset, lat + pavedOffset],
      [lng - pavedOffset, lat + pavedOffset],
    ],
    label: 'Paved Yard Area'
  });
  
  return detections;
};

// Detection type styling
const DETECTION_STYLES = {
  building: { color: '#3B82F6', icon: '🏢', label: 'Building' },
  dock_door: { color: '#10B981', icon: '🚪', label: 'Dock Door' },
  parking_spot: { color: '#F59E0B', icon: '🅿️', label: 'Yard Spot' },
  trailer: { color: '#EF4444', icon: '🚛', label: 'Trailer' },
  truck: { color: '#8B5CF6', icon: '🚚', label: 'Truck' },
  paved_area: { color: '#64748B', icon: '◻️', label: 'Paved Area' },
  boundary: { color: '#EC4899', icon: '⬜', label: 'Boundary' },
};

interface SatelliteReconProps {
  facility: PrimoFacility;
  onClose: () => void;
  onAcceptMapping?: (detections: AIDetection[]) => void;
}

export default function SatelliteRecon({ facility, onClose, onAcceptMapping }: SatelliteReconProps) {
  const [scanPhase, setScanPhase] = useState<'scanning' | 'analyzing' | 'complete'>('scanning');
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const [showDetectionType, setShowDetectionType] = useState<Record<string, boolean>>({
    building: true,
    dock_door: true,
    parking_spot: true,
    trailer: true,
    paved_area: true,
  });
  const [selectedDetection, setSelectedDetection] = useState<AIDetection | null>(null);
  
  const [viewState, setViewState] = useState({
    longitude: facility.coordinates.lng,
    latitude: facility.coordinates.lat,
    zoom: 18,
    pitch: 45,
    bearing: 0
  });

  // Simulate AI scanning process
  useEffect(() => {
    const scanTimer = setTimeout(() => {
      setScanPhase('analyzing');
    }, 1500);
    
    const analyzeTimer = setTimeout(() => {
      const detected = generateDetections(facility);
      setDetections(detected);
      setScanPhase('complete');
    }, 3500);
    
    return () => {
      clearTimeout(scanTimer);
      clearTimeout(analyzeTimer);
    };
  }, [facility]);

  // Calculate stats from detections
  const stats = {
    buildings: detections.filter(d => d.type === 'building').length,
    dockDoors: detections.filter(d => d.type === 'dock_door').length,
    yardSpots: detections.filter(d => d.type === 'parking_spot').length,
    trailersDetected: detections.filter(d => d.type === 'trailer').length,
    avgConfidence: detections.length > 0 
      ? Math.round(detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length * 100)
      : 0,
  };

  // GeoJSON for polygon overlays
  const buildingGeoJSON = {
    type: 'FeatureCollection' as const,
    features: detections
      .filter(d => d.type === 'building' && d.bounds && showDetectionType.building)
      .map(d => ({
        type: 'Feature' as const,
        properties: { label: d.label, confidence: d.confidence },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [d.bounds ? [...d.bounds, d.bounds[0]] : []],
        }
      }))
  };

  const pavedGeoJSON = {
    type: 'FeatureCollection' as const,
    features: detections
      .filter(d => d.type === 'paved_area' && d.bounds && showDetectionType.paved_area)
      .map(d => ({
        type: 'Feature' as const,
        properties: { label: d.label },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [d.bounds ? [...d.bounds, d.bounds[0]] : []],
        }
      }))
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 4000
        }} 
      />
      
      {/* Main Panel */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '95vw',
        maxWidth: '1400px',
        height: '90vh',
        background: 'linear-gradient(135deg, rgba(10, 15, 25, 0.99) 0%, rgba(5, 8, 15, 0.99) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '16px',
        color: '#E2E8F0',
        fontFamily: '"Inter", -apple-system, sans-serif',
        zIndex: 4001,
        boxShadow: '0 40px 120px rgba(0, 0, 0, 0.9), 0 0 80px rgba(59, 130, 246, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          background: 'linear-gradient(90deg, rgba(15, 20, 30, 0.98), rgba(10, 15, 25, 0.98))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              🛰️
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.2rem',
                fontWeight: '700',
                background: 'linear-gradient(90deg, #60A5FA, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SATELLITE RECON — INGESTION ENGINE
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                {facility.name} • {facility.coordinates.lat.toFixed(4)}°, {facility.coordinates.lng.toFixed(4)}°
              </p>
            </div>
          </div>
          
          {/* Scan Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              padding: '8px 16px',
              background: scanPhase === 'complete' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${scanPhase === 'complete' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {scanPhase === 'scanning' && (
                <>
                  <span style={{ animation: 'pulse 1s infinite' }}>📡</span>
                  <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: '600' }}>
                    ACQUIRING IMAGERY...
                  </span>
                </>
              )}
              {scanPhase === 'analyzing' && (
                <>
                  <span style={{ animation: 'pulse 0.5s infinite' }}>🧠</span>
                  <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: '600' }}>
                    AI ANALYZING (YOLOv8 + SAM)...
                  </span>
                </>
              )}
              {scanPhase === 'complete' && (
                <>
                  <span>✓</span>
                  <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: '600' }}>
                    RECON COMPLETE — {detections.length} OBJECTS DETECTED
                  </span>
                </>
              )}
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
          
          {/* Left Panel - Detection Controls */}
          <div style={{
            width: '280px',
            borderRight: '1px solid rgba(59, 130, 246, 0.2)',
            background: 'rgba(5, 10, 20, 0.5)',
            padding: '16px',
            overflowY: 'auto'
          }}>
            {/* Process Steps */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#64748B', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '12px'
              }}>
                Ingestion Pipeline
              </div>
              
              {/* Step 1 */}
              <div style={{
                padding: '10px 12px',
                background: scanPhase !== 'scanning' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${scanPhase !== 'scanning' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>
                    {scanPhase !== 'scanning' ? '✓' : '⏳'}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: scanPhase !== 'scanning' ? '#10B981' : '#F59E0B'
                  }}>
                    1. Instant Reconnaissance
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginLeft: '24px' }}>
                  Satellite imagery acquired
                </div>
              </div>
              
              {/* Step 2 */}
              <div style={{
                padding: '10px 12px',
                background: scanPhase === 'complete' ? 'rgba(16, 185, 129, 0.1)' : 
                            scanPhase === 'analyzing' ? 'rgba(245, 158, 11, 0.1)' : 
                            'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${scanPhase === 'complete' ? 'rgba(16, 185, 129, 0.3)' : 
                         scanPhase === 'analyzing' ? 'rgba(245, 158, 11, 0.3)' : 
                         'rgba(100, 116, 139, 0.2)'}`,
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>
                    {scanPhase === 'complete' ? '✓' : scanPhase === 'analyzing' ? '⏳' : '○'}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: scanPhase === 'complete' ? '#10B981' : 
                           scanPhase === 'analyzing' ? '#F59E0B' : '#64748B'
                  }}>
                    2. Automated Mapping (90%)
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginLeft: '24px' }}>
                  YOLOv8 + SAM detection
                </div>
              </div>
              
              {/* Step 3 */}
              <div style={{
                padding: '10px 12px',
                background: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '0.9rem' }}>○</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B' }}>
                    3. Gestural Completion (10%)
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginLeft: '24px' }}>
                  Human defines traffic flow
                </div>
              </div>
            </div>
            
            {/* Detection Types Toggle */}
            {scanPhase === 'complete' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: '#64748B', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  marginBottom: '12px'
                }}>
                  AI Detections
                </div>
                
                {Object.entries(DETECTION_STYLES).map(([type, style]) => {
                  const count = detections.filter(d => d.type === type).length;
                  if (count === 0) return null;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setShowDetectionType(prev => ({ ...prev, [type]: !prev[type] }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        background: showDetectionType[type] 
                          ? `${style.color}15` 
                          : 'transparent',
                        border: `1px solid ${showDetectionType[type] ? `${style.color}40` : 'rgba(100, 116, 139, 0.2)'}`,
                        borderRadius: '6px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{style.icon}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: showDetectionType[type] ? style.color : '#64748B'
                        }}>
                          {style.label}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: '600',
                        color: showDetectionType[type] ? style.color : '#64748B'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {/* Detection Stats */}
            {scanPhase === 'complete' && (
              <div style={{
                padding: '14px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px'
              }}>
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: '#64748B', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  marginBottom: '12px'
                }}>
                  Facility Analysis
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3B82F6' }}>
                      {stats.dockDoors}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Dock Doors</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F59E0B' }}>
                      {stats.yardSpots}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Yard Spots</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#EF4444' }}>
                      {stats.trailersDetected}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Trailers Now</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981' }}>
                      {stats.avgConfidence}%
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Confidence</div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                  fontSize: '0.65rem',
                  color: '#64748B'
                }}>
                  <strong style={{ color: '#94A3B8' }}>YVS Score:</strong>{' '}
                  <span style={{ 
                    color: facility.yvsScore >= 80 ? '#10B981' : '#F59E0B',
                    fontWeight: '600'
                  }}>
                    {facility.yvsScore}/100
                  </span>
                  <br />
                  <span style={{ fontSize: '0.6rem' }}>
                    Based on paved area, trailer capacity, and gate access
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Map Area */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Paved Area Overlay */}
              {scanPhase === 'complete' && (
                <Source id="paved-area" type="geojson" data={pavedGeoJSON}>
                  <Layer
                    id="paved-fill"
                    type="fill"
                    paint={{
                      'fill-color': '#64748B',
                      'fill-opacity': 0.15
                    }}
                  />
                  <Layer
                    id="paved-line"
                    type="line"
                    paint={{
                      'line-color': '#64748B',
                      'line-width': 2,
                      'line-dasharray': [3, 2]
                    }}
                  />
                </Source>
              )}
              
              {/* Building Overlay */}
              {scanPhase === 'complete' && (
                <Source id="buildings" type="geojson" data={buildingGeoJSON}>
                  <Layer
                    id="building-fill"
                    type="fill"
                    paint={{
                      'fill-color': '#3B82F6',
                      'fill-opacity': 0.25
                    }}
                  />
                  <Layer
                    id="building-line"
                    type="line"
                    paint={{
                      'line-color': '#3B82F6',
                      'line-width': 2
                    }}
                  />
                </Source>
              )}
              
              {/* Point Markers */}
              {scanPhase === 'complete' && detections
                .filter(d => !['building', 'paved_area'].includes(d.type) && showDetectionType[d.type])
                .map((detection, idx) => {
                  const style = DETECTION_STYLES[detection.type];
                  return (
                    <Marker
                      key={`${detection.type}-${idx}`}
                      longitude={detection.coordinates[0]}
                      latitude={detection.coordinates[1]}
                      anchor="center"
                    >
                      <div
                        onClick={() => setSelectedDetection(detection)}
                        style={{
                          width: detection.type === 'trailer' ? 20 : 14,
                          height: detection.type === 'trailer' ? 20 : 14,
                          borderRadius: detection.type === 'trailer' ? '4px' : '50%',
                          background: `${style.color}80`,
                          border: `2px solid ${style.color}`,
                          boxShadow: `0 0 10px ${style.color}60`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px'
                        }}
                        title={detection.label}
                      />
                    </Marker>
                  );
                })}
            </Map>
            
            {/* Scanning Overlay */}
            {scanPhase !== 'complete' && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  border: '4px solid transparent',
                  borderTopColor: '#3B82F6',
                  borderRightColor: '#3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{ 
                  marginTop: '24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#60A5FA',
                  textAlign: 'center'
                }}>
                  {scanPhase === 'scanning' ? 'Acquiring Satellite Imagery...' : 'Running AI Detection Models...'}
                </div>
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  color: '#64748B'
                }}>
                  {scanPhase === 'scanning' 
                    ? 'Fetching high-resolution imagery from Mapbox' 
                    : 'YOLOv8 + SAM analyzing facility layout'}
                </div>
              </div>
            )}
            
            {/* Legend */}
            {scanPhase === 'complete' && (
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(10, 15, 25, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                minWidth: '180px'
              }}>
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: '#64748B', 
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>
                  Detection Legend
                </div>
                {Object.entries(DETECTION_STYLES).map(([type, style]) => {
                  const count = detections.filter(d => d.type === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '4px',
                      opacity: showDetectionType[type] ? 1 : 0.4
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: type === 'trailer' ? '2px' : '50%',
                        background: style.color
                      }} />
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {style.label} ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Right Panel - Next Steps */}
          <div style={{
            width: '260px',
            borderLeft: '1px solid rgba(59, 130, 246, 0.2)',
            background: 'rgba(5, 10, 20, 0.5)',
            padding: '16px',
            overflowY: 'auto'
          }}>
            <div style={{ 
              fontSize: '0.65rem', 
              color: '#64748B', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              Value Proposition
            </div>
            
            {/* Paper Savings */}
            <div style={{
              padding: '14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '4px' }}>
                Estimated Savings per Facility
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>
                $10,900
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                Paper elimination + efficiency gains
              </div>
            </div>
            
            {/* Double Gate Capacity */}
            <div style={{
              padding: '14px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '4px' }}>
                Gate Capacity Impact
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3B82F6' }}>
                2x THROUGHPUT
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                50% faster trailer turn time
              </div>
            </div>
            
            {/* Tech Stack */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#64748B', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                Computer Vision Stack
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: '#94A3B8',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: '#60A5FA' }}>YOLOv8:</strong> Real-time object detection for trailers, trucks, dock doors<br/><br/>
                <strong style={{ color: '#A78BFA' }}>SAM:</strong> Segment Anything Model for precise boundary detection<br/><br/>
                <strong style={{ color: '#34D399' }}>Mapbox:</strong> High-res satellite imagery at 0.5m resolution
              </div>
            </div>
            
            {/* Accept Button */}
            {scanPhase === 'complete' && (
              <button
                onClick={() => {
                  if (onAcceptMapping) {
                    onAcceptMapping(detections);
                  }
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                ✓ ACCEPT MAPPING
              </button>
            )}
            
            <div style={{ 
              marginTop: '12px',
              fontSize: '0.6rem',
              color: '#475569',
              textAlign: 'center'
            }}>
              Proceeds to Step 3: Define traffic flow
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
