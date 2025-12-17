'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { PrimoFacility } from '@/data/primo-facilities';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2dsYXJraW40MTAiLCJhIjoiY21qN3R1dDc2MDBidjNlcTc1ZjVjcXJ0OSJ9.mSsGQbC0253Lhf9kTmIp_Q';

interface SatelliteAnalysisPanelProps {
  facility: PrimoFacility;
  onClose: () => void;
  onUpdateFacility?: (updates: Partial<PrimoFacility>) => void;
}

interface DetectedFeature {
  id: string;
  type: 'dock_door' | 'trailer' | 'truck' | 'parking' | 'gate' | 'building';
  coordinates: [number, number];
  label?: string;
}

interface AnalysisResults {
  dockDoorsDetected: number;
  trailersDetected: number;
  trucksDetected: number;
  parkingSpotsEstimated: number;
  buildingFootprintSqFt: number;
  yardAreaSqFt: number;
  confidence: number;
}

export default function SatelliteAnalysisPanel({ 
  facility, 
  onClose,
  onUpdateFacility 
}: SatelliteAnalysisPanelProps) {
  const mapRef = useRef<MapRef>(null);
  const [zoom, setZoom] = useState(18);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'satellite-streets'>('satellite');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Annotation mode
  const [annotationMode, setAnnotationMode] = useState<'view' | 'dock' | 'trailer' | 'gate' | 'parking'>('view');
  const [detectedFeatures, setDetectedFeatures] = useState<DetectedFeature[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  
  // Coordinate adjustment
  const [isAdjustingCoords, setIsAdjustingCoords] = useState(false);
  const [newCoords, setNewCoords] = useState(facility.coordinates);
  
  // Measurement tool
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    
    if (isAdjustingCoords) {
      setNewCoords({ lat, lng });
      return;
    }
    
    if (measureMode) {
      setMeasurePoints(prev => [...prev, [lng, lat]]);
      return;
    }
    
    if (annotationMode !== 'view') {
      const newFeature: DetectedFeature = {
        id: `${annotationMode}-${Date.now()}`,
        type: annotationMode === 'dock' ? 'dock_door' : annotationMode,
        coordinates: [lng, lat],
        label: `${annotationMode} ${detectedFeatures.filter(f => f.type === (annotationMode === 'dock' ? 'dock_door' : annotationMode)).length + 1}`
      };
      setDetectedFeatures(prev => [...prev, newFeature]);
    }
  }, [annotationMode, isAdjustingCoords, measureMode, detectedFeatures]);

  const runAutoAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis - in production this would call a vision API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use newCoords (current pin location) not original facility.coordinates
    const analysisCenter = newCoords;
    
    // Generate mock detection based on facility data
    const mockDockDoors: DetectedFeature[] = [];
    const dockCount = facility.dockDoors || 24;
    
    // Create dock door markers in a line (simulating detection)
    for (let i = 0; i < Math.min(dockCount, 20); i++) {
      const offset = (i - 10) * 0.00008;
      mockDockDoors.push({
        id: `dock-${i}`,
        type: 'dock_door',
        coordinates: [analysisCenter.lng + offset, analysisCenter.lat + 0.0003],
        label: `Dock ${i + 1}`
      });
    }
    
    // Add some trailers
    const trailerCount = Math.floor((facility.detectedTrailers || 20) * 0.7);
    for (let i = 0; i < Math.min(trailerCount, 15); i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      mockDockDoors.push({
        idanalysisCenter.lng + (col - 2) * 0.00015,
          analysisCenter
        coordinates: [
          facility.coordinates.lng + (col - 2) * 0.00015,
          facility.coordinates.lat - 0.0005 - row * 0.0002
        ],
        label: `Trailer ${i + 1}`
      });
    }
    
    setDetectedFeatures(mockDockDoors);
    
    setAnalysisResults({
      dockDoorsDetected: dockCount,
      trailersDetected: trailerCount,
      trucksDetected: facility.detectedTrucks || 15,
      parkingSpotsEstimated: (facility.yardSpots || 50),
      buildingFootprintSqFt: 150000 + Math.random() * 100000,
      yardAreaSqFt: 300000 + Math.random() * 200000,
      confidence: 0.78 + Math.random() * 0.15
    });
    
    setIsAnalyzing(false);
    setAnalysisComplete(true);
  };

  const calculateDistance = (p1: [number, number], p2: [number, number]): number => {
    const R = 6371000; // Earth radius in meters
    const dLat = (p2[1] - p1[1]) * Math.PI / 180;
    const dLng = (p2[0] - p1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) * 
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getMeasurementDistance = (): string => {
    if (measurePoints.length < 2) return '—';
    let total = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      total += calculateDistance(measurePoints[i - 1], measurePoints[i]);
    }
    if (total < 1000) return `${Math.round(total)}m / ${Math.round(total * 3.281)}ft`;
    return `${(total / 1000).toFixed(2)}km / ${Math.round(total * 3.281)}ft`;
  };

  const clearAnnotations = () => {
    setDetectedFeatures([]);
    setMeasurePoints([]);
    setAnalysisResults(null);
    setAnalysisComplete(false);
  };

  const saveCoordinateUpdate = () => {
    if (onUpdateFacility) {
      onUpdateFacility({ coordinates: newCoords });
    }
    setIsAdjustingCoords(false);
  };

  const featureColors: Record<string, string> = {
    dock_door: '#10B981',
    trailer: '#F59E0B',
    truck: '#3B82F6',
    parking: '#8B5CF6',
    gate: '#EF4444',
    building: '#6B7280'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0A0F19',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(10, 15, 25, 0.98)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛰️ Satellite Analysis: {facility.name}
          </h2>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
            {facility.location} • {newCoords.lat.toFixed(5)}°, {newCoords.lng.toFixed(5)}°
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAdjustingCoords && (
            <button
              onClick={saveCoordinateUpdate}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              ✓ Save New Location
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '8px 16px',
              color: '#EF4444',
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
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Tools Panel */}
        <div style={{
          width: '280px',
          background: 'rgba(5, 10, 20, 0.95)',
          borderRight: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* View Controls */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
              View Controls
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Zoom: {zoom}</label>
              <input
                type="range"
                min="15"
                max="20"
                step="0.5"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Pitch: {pitch}°</label>
              <input
                type="range"
                min="0"
                max="60"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Rotation: {bearing}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={bearing}
                onChange={(e) => setBearing(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setMapStyle('satellite')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: mapStyle === 'satellite' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  border: `1px solid ${mapStyle === 'satellite' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                  borderRadius: '4px',
                  color: mapStyle === 'satellite' ? '#60A5FA' : '#64748B',
                  fontSize: '0.65rem',
                  cursor: 'pointer'
                }}
              >
                Pure Satellite
              </button>
              <button
                onClick={() => setMapStyle('satellite-streets')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: mapStyle === 'satellite-streets' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  border: `1px solid ${mapStyle === 'satellite-streets' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                  borderRadius: '4px',
                  color: mapStyle === 'satellite-streets' ? '#60A5FA' : '#64748B',
                  fontSize: '0.65rem',
                  cursor: 'pointer'
                }}
              >
                + Labels
              </button>
            </div>
          </div>

          {/* Analysis Tools */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
              Analysis Tools
            </div>
            
            <button
              onClick={runAutoAnalysis}
              disabled={isAnalyzing}
              style={{
                width: '100%',
                padding: '12px',
                background: isAnalyzing 
                  ? 'rgba(100, 116, 139, 0.3)' 
                  : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.8rem',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isAnalyzing ? (
                <>⏳ Analyzing...</>
              ) : (
                <>🤖 Auto-Detect Features</>
              )}
            </button>
            
            <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '8px' }}>
              Manual Annotation:
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { mode: 'view', icon: '👁️', label: 'View' },
                { mode: 'dock', icon: '🚪', label: 'Dock Door' },
                { mode: 'trailer', icon: '🚛', label: 'Trailer' },
                { mode: 'gate', icon: '🚧', label: 'Gate' },
              ].map(tool => (
                <button
                  key={tool.mode}
                  onClick={() => setAnnotationMode(tool.mode as typeof annotationMode)}
                  style={{
                    padding: '8px',
                    background: annotationMode === tool.mode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${annotationMode === tool.mode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                    borderRadius: '6px',
                    color: annotationMode === tool.mode ? '#10B981' : '#94A3B8',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {tool.icon} {tool.label}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button
                onClick={() => {
                  setMeasureMode(!measureMode);
                  if (!measureMode) setMeasurePoints([]);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: measureMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${measureMode ? 'rgba(245, 158, 11, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                  borderRadius: '6px',
                  color: measureMode ? '#F59E0B' : '#94A3B8',
                  fontSize: '0.65rem',
                  cursor: 'pointer'
                }}
              >
                📏 Measure
              </button>
              <button
                onClick={clearAnnotations}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#EF4444',
                  fontSize: '0.65rem',
                  cursor: 'pointer'
                }}
              >
                🗑️ Clear
              </button>
            </div>
            
            {measureMode && measurePoints.length > 0 && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#F59E0B' }}>Distance:</div>
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F59E0B' }}>
                  {getMeasurementDistance()}
                </div>
              </div>
            )}
          </div>

          {/* Coordinate Adjustment */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
              📍 Coordinate Adjustment
            </div>
            
            <button
              onClick={() => setIsAdjustingCoords(!isAdjustingCoords)}
              style={{
                width: '100%',
                padding: '10px',
                background: isAdjustingCoords ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                border: `1px solid ${isAdjustingCoords ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`,
                borderRadius: '6px',
                color: isAdjustingCoords ? '#EF4444' : '#60A5FA',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {isAdjustingCoords ? '✕ Cancel Adjustment' : '📍 Relocate Facility Pin'}
            </button>
            
            {isAdjustingCoords && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: '#10B981'
              }}>
                Click on the map to set the new facility location
              </div>
            )}
          </div>

          {/* Detection Results */}
          {analysisResults && (
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                Detection Results
              </div>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Confidence</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#10B981' }}>
                    {(analysisResults.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  background: 'rgba(100, 116, 139, 0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${analysisResults.confidence * 100}%`,
                    background: '#10B981'
                  }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981' }}>
                    {analysisResults.dockDoorsDetected}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>DOCK DOORS</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F59E0B' }}>
                    {analysisResults.trailersDetected}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>TRAILERS</div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#3B82F6' }}>
                    {analysisResults.trucksDetected}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>TRUCKS</div>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#8B5CF6' }}>
                    {analysisResults.parkingSpotsEstimated}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748B' }}>YARD SPOTS</div>
                </div>
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '0.7rem', color: '#94A3B8' }}>
                <div>Building: ~{Math.round(analysisResults.buildingFootprintSqFt / 1000)}k sq ft</div>
                <div>Yard Area: ~{Math.round(analysisResults.yardAreaSqFt / 1000)}k sq ft</div>
              </div>
              
              {/* Compare with stored data */}
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '6px' }}>
                  vs. Stored Data:
                </div>
                <div style={{ fontSize: '0.7rem' }}>
                  <span style={{ color: analysisResults.dockDoorsDetected === facility.dockDoors ? '#10B981' : '#F59E0B' }}>
                    Doors: {facility.dockDoors || '?'} stored vs {analysisResults.dockDoorsDetected} detected
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem' }}>
                  <span style={{ color: Math.abs((analysisResults.trailersDetected) - (facility.detectedTrailers || 0)) < 10 ? '#10B981' : '#F59E0B' }}>
                    Trailers: {facility.detectedTrailers || '?'} stored vs {analysisResults.trailersDetected} detected
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map View */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: facility.coordinates.lng,
              latitude: facility.coordinates.lat,
              zoom: zoom,
              pitch: pitch,
              bearing: bearing
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={`mapbox://styles/mapbox/${mapStyle === 'satellite' ? 'satellite-v9' : 'satellite-streets-v12'}`}
            onClick={handleMapClick}
            onMove={(e) => {
              setZoom(e.viewState.zoom);
              setPitch(e.viewState.pitch);
              setBearing(e.viewState.bearing);
            }}
          >
            {/* Facility Center Marker */}
            <Marker
              longitude={newCoords.lng}
              latitude={newCoords.lat}
              anchor="center"
              draggable={isAdjustingCoords}
              onDragEnd={(e) => setNewCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
            >
              <div style={{
                width: isAdjustingCoords ? '32px' : '20px',
                height: isAdjustingCoords ? '32px' : '20px',
                borderRadius: '50%',
                background: isAdjustingCoords ? '#EF4444' : '#3B82F6',
                border: '3px solid #fff',
                boxShadow: `0 0 20px ${isAdjustingCoords ? '#EF4444' : '#3B82F6'}`,
                cursor: isAdjustingCoords ? 'move' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#fff'
              }}>
                📍
              </div>
            </Marker>

            {/* Detected Features */}
            {detectedFeatures.map(feature => (
              <Marker
                key={feature.id}
                longitude={feature.coordinates[0]}
                latitude={feature.coordinates[1]}
                anchor="center"
              >
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: feature.type === 'trailer' ? '2px' : '50%',
                    background: featureColors[feature.type] || '#fff',
                    border: '2px solid #fff',
                    boxShadow: `0 0 8px ${featureColors[feature.type]}`,
                    cursor: 'pointer'
                  }}
                  title={feature.label}
                />
              </Marker>
            ))}

            {/* Measurement Line */}
            {measurePoints.length > 1 && (
              <Source
                type="geojson"
                data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: measurePoints
                  }
                }}
              >
                <Layer
                  type="line"
                  paint={{
                    'line-color': '#F59E0B',
                    'line-width': 3,
                    'line-dasharray': [2, 2]
                  }}
                />
              </Source>
            )}

            {/* Measurement Points */}
            {measurePoints.map((point, i) => (
              <Marker key={`measure-${i}`} longitude={point[0]} latitude={point[1]} anchor="center">
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#F59E0B',
                  border: '2px solid #fff'
                }} />
              </Marker>
            ))}
          </Map>

          {/* Legend */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(10, 15, 25, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '8px' }}>LEGEND</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(featureColors).slice(0, 4).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: type === 'trailer' ? '2px' : '50%',
                    background: color
                  }} />
                  <span style={{ fontSize: '0.6rem', color: '#94A3B8', textTransform: 'capitalize' }}>
                    {type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Counts */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(10, 15, 25, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '0.65rem', color: '#64748B', marginBottom: '8px' }}>ANNOTATIONS</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10B981' }}>
                  {detectedFeatures.filter(f => f.type === 'dock_door').length}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Docks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F59E0B' }}>
                  {detectedFeatures.filter(f => f.type === 'trailer').length}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Trailers</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#EF4444' }}>
                  {detectedFeatures.filter(f => f.type === 'gate').length}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Gates</div>
              </div>
            </div>
          </div>

          {/* Mode Indicator */}
          {annotationMode !== 'view' && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(16, 185, 129, 0.9)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              Click to place: {annotationMode === 'dock' ? 'Dock Door' : annotationMode}
            </div>
          )}

          {isAdjustingCoords && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.9)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              📍 Click or drag to set new facility location
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
