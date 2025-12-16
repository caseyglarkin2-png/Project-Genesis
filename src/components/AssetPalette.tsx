import React, { useState } from 'react';

/**
 * =============================================================================
 * ASSET PALETTE - Facility Orchestration Builder
 * =============================================================================
 * 
 * Industrial Fluidity design. The Asset Palette is the "Ground Truth" interface 
 * for facility managers to digitize their yard. Each asset type represents 
 * a different yard element for autonomous handoffs.
 * 
 * NO FRICTION - click to place, orchestrate your facility.
 */

type Asset = {
  id: string;
  name: string;
  icon: string;
  description: string;
  hotkey: string;
};

const ASSETS: Asset[] = [
  { 
    id: 'dock', 
    name: 'Dock Door', 
    icon: '⬚', 
    description: 'Loading/unloading point. Snap to warehouse walls.',
    hotkey: 'D'
  },
  { 
    id: 'trailer', 
    name: 'Trailer Spot', 
    icon: '▭', 
    description: 'Define 53ft parking positions. System auto-calculates capacity.',
    hotkey: 'T'
  },
  { 
    id: 'gate', 
    name: 'Gate Node', 
    icon: '◇', 
    description: 'Entry/exit points. Configure as Manned or Unmanned.',
    hotkey: 'G'
  },
  { 
    id: 'zone', 
    name: 'Flow Zone', 
    icon: '◈', 
    description: 'Define staging lanes, no-go areas, or flow paths.',
    hotkey: 'Z'
  },
  { 
    id: 'reefer', 
    name: 'Reefer Area', 
    icon: '◆', 
    description: 'Cold storage zones with dwell-time monitoring.',
    hotkey: 'R'
  },
];

export default function AssetPalette() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 102, 
      left: 20, 
      background: 'rgba(15, 20, 25, 0.95)', 
      borderRadius: '10px',
      color: '#E2E8F0',
      zIndex: 1000,
      border: '1px solid rgba(59, 130, 246, 0.2)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px)',
      minWidth: '220px',
      overflow: 'hidden',
      animation: 'slideInLeft 0.3s ease-out',
      fontFamily: '"Inter", -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div 
        style={{ 
          padding: '12px 15px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 41, 59, 0.3) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: '9px 9px 0 0'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 style={{ 
          margin: 0, 
          fontFamily: '"Inter", -apple-system, sans-serif', 
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          color: '#3B82F6',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1rem' }}>◈</span>
          Asset Palette
        </h3>
        <span style={{ 
          color: '#94A3B8', 
          fontSize: '0.75rem',
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
        }}>
          ▼
        </span>
      </div>
      
      {/* Asset Buttons */}
      {isExpanded && (
        <div style={{ padding: '12px' }}>
          <div style={{ 
            fontSize: '0.65rem', 
            color: '#64748B', 
            marginBottom: '12px',
            padding: '0 4px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Select asset to place
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ASSETS.map((asset) => (
              <button 
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
                style={{ 
                  background: selectedAsset === asset.id 
                    ? 'rgba(59, 130, 246, 0.15)' 
                    : 'rgba(30, 41, 59, 0.6)', 
                  color: selectedAsset === asset.id ? '#3B82F6' : '#E2E8F0', 
                  border: selectedAsset === asset.id 
                    ? '1px solid rgba(59, 130, 246, 0.5)' 
                    : '1px solid rgba(148, 163, 184, 0.1)', 
                  padding: '10px 12px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  boxShadow: selectedAsset === asset.id 
                    ? '0 4px 20px rgba(59, 130, 246, 0.2)' 
                    : 'none',
                  fontFamily: '"Inter", -apple-system, sans-serif'
                }}
                title={asset.description}
              >
                <span style={{ 
                  fontSize: '1.2rem',
                  color: selectedAsset === asset.id ? '#3B82F6' : '#94A3B8',
                  width: '24px',
                  textAlign: 'center'
                }}>{asset.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.8rem' }}>{asset.name}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748B', marginTop: '2px' }}>
                    {asset.description.substring(0, 35)}...
                  </div>
                </div>
                <span style={{ 
                  fontSize: '0.6rem', 
                  color: '#64748B',
                  background: 'rgba(30, 41, 59, 0.8)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  fontFamily: '"JetBrains Mono", monospace'
                }}>
                  {asset.hotkey}
                </span>
              </button>
            ))}
          </div>
          
          {/* Selected Asset Info */}
          {selectedAsset && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              fontSize: '0.7rem'
            }}>
              <div style={{ color: '#3B82F6', fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#10B981' }}>◉</span> {ASSETS.find(a => a.id === selectedAsset)?.name} Active
              </div>
              <div style={{ color: '#94A3B8', lineHeight: '1.4' }}>
                {ASSETS.find(a => a.id === selectedAsset)?.description}
              </div>
              <div style={{ color: '#64748B', marginTop: '8px', fontSize: '0.6rem' }}>
                Click on map to place
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            display: 'flex',
            gap: '8px'
          }}>
            <button style={{
              flex: 1,
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#94A3B8',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.65rem',
              transition: 'all 0.2s ease',
              fontFamily: '"Inter", -apple-system, sans-serif'
            }}>
              ↩ Undo
            </button>
            <button style={{
              flex: 1,
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#94A3B8',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.65rem',
              transition: 'all 0.2s ease',
              fontFamily: '"Inter", -apple-system, sans-serif'
            }}>
              ⊘ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
