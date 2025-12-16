import React, { useState } from 'react';

/**
 * =============================================================================
 * ASSET PALETTE - "SimCity" Style Builder Menu
 * =============================================================================
 * 
 * The Asset Palette is the "God Mode" interface for facility managers to
 * digitize their yard. Each asset type represents a different yard element
 * that can be placed on the satellite map.
 * 
 * ASSET TYPES:
 * - Dock Door: Loading/unloading points on warehouse walls
 * - Trailer: 53ft parking positions for trailers
 * - Guard Shack: Manned entry/exit gates
 * - Paint Zone: Define staging lanes and no-go areas
 * 
 * The goal is to make configuration feel like "playing" rather than "working"
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
    icon: '🚪', 
    description: 'Loading/unloading point. Snap to warehouse walls.',
    hotkey: 'D'
  },
  { 
    id: 'trailer', 
    name: 'Trailer Spot', 
    icon: '🚛', 
    description: 'Define 53ft parking positions. System auto-calculates capacity.',
    hotkey: 'T'
  },
  { 
    id: 'gate', 
    name: 'Gate Node', 
    icon: '🚧', 
    description: 'Entry/exit points. Configure as Manned or Unmanned.',
    hotkey: 'G'
  },
  { 
    id: 'zone', 
    name: 'Paint Zone', 
    icon: '🎨', 
    description: 'Define staging lanes, no-go areas, or flow paths.',
    hotkey: 'Z'
  },
  { 
    id: 'reefer', 
    name: 'Reefer Area', 
    icon: '❄️', 
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
      top: 80, 
      left: 20, 
      background: 'rgba(0, 10, 20, 0.95)', 
      borderRadius: '6px',
      color: 'white',
      zIndex: 1000,
      border: '1px solid #00ff00',
      boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)',
      minWidth: '200px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div 
        style={{ 
          padding: '10px 12px',
          borderBottom: '1px solid #333',
          background: 'rgba(0, 255, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 style={{ 
          margin: 0, 
          fontFamily: 'monospace', 
          fontSize: '0.9rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          🎮 Asset Palette
        </h3>
        <span style={{ color: '#00ff00', fontSize: '0.8rem' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      
      {/* Asset Buttons */}
      {isExpanded && (
        <div style={{ padding: '10px' }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: '#666', 
            marginBottom: '10px',
            padding: '0 4px'
          }}>
            Click to select, then place on map
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ASSETS.map((asset) => (
              <button 
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
                style={{ 
                  background: selectedAsset === asset.id ? 'rgba(0, 255, 0, 0.2)' : 'rgba(50, 50, 50, 0.8)', 
                  color: selectedAsset === asset.id ? '#00ff00' : '#fff', 
                  border: selectedAsset === asset.id ? '1px solid #00ff00' : '1px solid #444', 
                  padding: '8px 10px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                title={asset.description}
              >
                <span style={{ fontSize: '1.2rem' }}>{asset.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{asset.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '2px' }}>
                    {asset.description.substring(0, 35)}...
                  </div>
                </div>
                <span style={{ 
                  fontSize: '0.65rem', 
                  color: '#555',
                  background: '#222',
                  padding: '2px 6px',
                  borderRadius: '2px'
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
              padding: '10px',
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid #00ff00',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '4px' }}>
                ✓ {ASSETS.find(a => a.id === selectedAsset)?.name} Selected
              </div>
              <div style={{ color: '#888' }}>
                {ASSETS.find(a => a.id === selectedAsset)?.description}
              </div>
              <div style={{ color: '#555', marginTop: '6px', fontStyle: 'italic' }}>
                Click on the map to place
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '10px', 
            borderTop: '1px solid #333',
            display: 'flex',
            gap: '6px'
          }}>
            <button style={{
              flex: 1,
              background: '#333',
              color: '#888',
              border: '1px solid #444',
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}>
              ↩ Undo
            </button>
            <button style={{
              flex: 1,
              background: '#333',
              color: '#888',
              border: '1px solid #444',
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}>
              🗑 Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
