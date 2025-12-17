'use client';

import React, { useState, useCallback } from 'react';
import { PRIMO_FACILITIES, PrimoFacility } from '@/data/primo-facilities';
import {
  validateFacilities,
  CoordinateValidationResult,
  ValidationSummary,
  getValidationSummary,
  formatDistance,
  calculateDistance
} from '@/utils/coordinateValidator';

interface CoordinateValidatorPanelProps {
  onClose: () => void;
  onSelectFacility?: (facility: PrimoFacility) => void;
  onUpdateCoordinates?: (facilityId: string, newCoords: { lat: number; lng: number }) => void;
}

export default function CoordinateValidatorPanel({ 
  onClose, 
  onSelectFacility,
  onUpdateCoordinates 
}: CoordinateValidatorPanelProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [results, setResults] = useState<CoordinateValidationResult[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'review' | 'far'>('review');
  const [selectedResult, setSelectedResult] = useState<CoordinateValidationResult | null>(null);
  const [validationScope, setValidationScope] = useState<'all' | 'sample'>('sample');

  const startValidation = useCallback(async () => {
    setIsValidating(true);
    setResults([]);
    setSummary(null);
    
    // Select facilities to validate
    const facilitiesToValidate = validationScope === 'sample'
      ? PRIMO_FACILITIES.filter((_, i) => i % 10 === 0).slice(0, 26) // Every 10th facility (26 total)
      : PRIMO_FACILITIES;
    
    setProgress({ completed: 0, total: facilitiesToValidate.length });
    
    const validationResults = await validateFacilities(
      facilitiesToValidate,
      (completed, total, current) => {
        setProgress({ completed, total });
        setResults(prev => [...prev, current]);
      }
    );
    
    setSummary(getValidationSummary(validationResults));
    setIsValidating(false);
  }, [validationScope]);

  const filteredResults = results.filter(r => {
    if (filterMode === 'all') return true;
    if (filterMode === 'review') return r.needsReview;
    if (filterMode === 'far') return r.distanceMeters > 1000;
    return true;
  });

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#EF4444';
      case 'NOT_FOUND': return '#6B7280';
      default: return '#64748B';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(10, 15, 25, 0.98)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📍 Coordinate Validation System
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '400' }}>
              Mapbox Geocoding API
            </span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
            Scan and verify facility coordinates against real-world locations
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#EF4444',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Controls & Results */}
        <div style={{ width: '400px', borderRight: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Validation Scope</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {[
                  { id: 'sample', label: 'Sample (26)', desc: 'Quick scan' },
                  { id: 'all', label: 'All (260)', desc: 'Full validation' }
                ].map(scope => (
                  <button
                    key={scope.id}
                    onClick={() => setValidationScope(scope.id as typeof validationScope)}
                    disabled={isValidating}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: validationScope === scope.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${validationScope === scope.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '8px',
                      color: validationScope === scope.id ? '#60A5FA' : '#94A3B8',
                      cursor: isValidating ? 'not-allowed' : 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{scope.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{scope.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startValidation}
              disabled={isValidating}
              style={{
                width: '100%',
                padding: '12px',
                background: isValidating ? 'rgba(100, 116, 139, 0.3)' : 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: isValidating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isValidating ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Validating... {progress.completed}/{progress.total}
                </>
              ) : (
                <>🔍 Start Coordinate Scan</>
              )}
            </button>

            {/* Progress Bar */}
            {isValidating && (
              <div style={{ marginTop: '12px' }}>
                <div style={{
                  height: '6px',
                  background: 'rgba(100, 116, 139, 0.3)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(progress.completed / progress.total) * 100}%`,
                    background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {summary && (
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#10B981' }}>{summary.validated}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>VALIDATED</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#EF4444' }}>{summary.needsReview}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>NEEDS REVIEW</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#F59E0B' }}>{formatDistance(summary.avgDistanceMeters)}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>AVG OFFSET</div>
                </div>
                <div style={{ background: 'rgba(107, 114, 128, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#6B7280' }}>{summary.notFound}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B' }}>NOT FOUND</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {results.length > 0 && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(59, 130, 246, 0.15)', display: 'flex', gap: '6px' }}>
              {[
                { id: 'review', label: `⚠️ Needs Review (${results.filter(r => r.needsReview).length})` },
                { id: 'far', label: `📍 >1km Off (${results.filter(r => r.distanceMeters > 1000).length})` },
                { id: 'all', label: `All (${results.length})` }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterMode(filter.id as typeof filterMode)}
                  style={{
                    padding: '6px 10px',
                    background: filterMode === filter.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    border: `1px solid ${filterMode === filter.id ? 'rgba(59, 130, 246, 0.4)' : 'transparent'}`,
                    borderRadius: '6px',
                    color: filterMode === filter.id ? '#60A5FA' : '#64748B',
                    fontSize: '0.65rem',
                    cursor: 'pointer'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {/* Results List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredResults.map((result, idx) => (
              <div
                key={result.facility.id}
                onClick={() => setSelectedResult(result)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                  cursor: 'pointer',
                  background: selectedResult?.facility.id === result.facility.id 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'transparent',
                  borderLeft: selectedResult?.facility.id === result.facility.id
                    ? '3px solid #3B82F6'
                    : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#E2E8F0' }}>
                      {result.facility.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>
                      {result.facility.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: getConfidenceColor(result.confidence),
                      background: `${getConfidenceColor(result.confidence)}20`,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {result.confidence}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '0.65rem' }}>
                  <span style={{ color: result.distanceMeters > 500 ? '#EF4444' : '#10B981' }}>
                    📍 {formatDistance(result.distanceMeters)} offset
                  </span>
                  {result.needsReview && (
                    <span style={{ color: '#F59E0B' }}>⚠️ Review needed</span>
                  )}
                </div>
              </div>
            ))}
            
            {results.length === 0 && !isValidating && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🗺️</div>
                <div style={{ fontSize: '0.85rem' }}>Click "Start Coordinate Scan" to validate facility locations</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Detail View */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {selectedResult ? (
            <div>
              <h3 style={{ margin: '0 0 16px', color: '#F1F5F9', fontSize: '1.1rem' }}>
                {selectedResult.facility.name}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Current Coordinates */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#EF4444', textTransform: 'uppercase', marginBottom: '8px' }}>
                    📍 Current Coordinates
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#F1F5F9', fontSize: '0.9rem' }}>
                    {selectedResult.currentCoords.lat.toFixed(6)},
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#F1F5F9', fontSize: '0.9rem' }}>
                    {selectedResult.currentCoords.lng.toFixed(6)}
                  </div>
                </div>

                {/* Suggested Coordinates */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>
                    ✓ Suggested Coordinates
                  </div>
                  {selectedResult.suggestedCoords ? (
                    <>
                      <div style={{ fontFamily: 'monospace', color: '#F1F5F9', fontSize: '0.9rem' }}>
                        {selectedResult.suggestedCoords.lat.toFixed(6)},
                      </div>
                      <div style={{ fontFamily: 'monospace', color: '#F1F5F9', fontSize: '0.9rem' }}>
                        {selectedResult.suggestedCoords.lng.toFixed(6)}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#6B7280' }}>Not found</div>
                  )}
                </div>
              </div>

              {/* Distance & Confidence */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Distance Offset</div>
                    <div style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: '700', 
                      color: selectedResult.distanceMeters > 500 ? '#EF4444' : '#10B981' 
                    }}>
                      {formatDistance(selectedResult.distanceMeters)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Confidence</div>
                    <div style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: '700', 
                      color: getConfidenceColor(selectedResult.confidence)
                    }}>
                      {selectedResult.confidence}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>Status</div>
                    <div style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: '700', 
                      color: selectedResult.needsReview ? '#F59E0B' : '#10B981'
                    }}>
                      {selectedResult.needsReview ? '⚠️ Review' : '✓ OK'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched Location Info */}
              {selectedResult.matchedAddress && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Geocoding Match
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: '0.85rem' }}>
                    {selectedResult.matchedAddress}
                  </div>
                  <div style={{ color: '#64748B', fontSize: '0.7rem', marginTop: '4px' }}>
                    Search: "{selectedResult.searchQuery}"
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedResult.suggestedCoords && selectedResult.needsReview && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      // Open in Google Maps for comparison
                      const url = `https://www.google.com/maps/search/?api=1&query=${selectedResult.suggestedCoords!.lat},${selectedResult.suggestedCoords!.lng}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '8px',
                      color: '#60A5FA',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.8rem'
                    }}
                  >
                    🗺️ View Suggested in Google Maps
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${selectedResult.currentCoords.lat},${selectedResult.currentCoords.lng}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(100, 116, 139, 0.2)',
                      border: '1px solid rgba(100, 116, 139, 0.4)',
                      borderRadius: '8px',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.8rem'
                    }}
                  >
                    📍 View Current in Google Maps
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#64748B'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛰️</div>
              <div style={{ fontSize: '1rem', marginBottom: '8px' }}>Select a facility to view details</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Compare current vs suggested coordinates
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
