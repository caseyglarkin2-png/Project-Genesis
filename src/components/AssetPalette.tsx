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
      background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.95) 0%, rgba(10, 5, 25, 0.95) 100%)', 
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000,
      border: '1px solid rgba(0, 255, 0, 0.4)',
      boxShadow: '0 0 30px rgba(0, 255, 0, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      minWidth: '220px',
      overflow: 'hidden',
      animation: 'slideInLeft 0.5s ease-out'
    }}>
      {/* Header */}
      <div 
        style={{ 
          padding: '12px 15px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.3)',
          background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.15) 0%, rgba(0, 255, 255, 0.05) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: '7px 7px 0 0'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 style={{ 
          margin: 0, 
          fontFamily: '"JetBrains Mono", monospace', 
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          background: 'linear-gradient(90deg, #00ff00, #00ffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🎮 Asset Palette
        </h3>
        <span style={{ 
          color: '#00ff00', 
          fontSize: '0.8rem',
          transition: 'transform 0.3s ease',
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
            color: '#555', 
            marginBottom: '12px',
            padding: '0 4px',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            Click to select, then place on map
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ASSETS.map((asset) => (
              <button 
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
                style={{ 
                  background: selectedAsset === asset.id 
                    ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 255, 255, 0.1) 100%)' 
                    : 'rgba(30, 30, 40, 0.8)', 
                  color: selectedAsset === asset.id ? '#00ff00' : '#ccc', 
                  border: selectedAsset === asset.id 
                    ? '1px solid rgba(0, 255, 0, 0.6)' 
                    : '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '10px 12px', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  boxShadow: selectedAsset === asset.id 
                    ? '0 0 15px rgba(0, 255, 0, 0.3)' 
                    : 'none'
                }}
                title={asset.description}
              >
                <span style={{ fontSize: '1.3rem' }}>{asset.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{asset.name}</div>
                  <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '2px' }}>
                    {asset.description.substring(0, 35)}...
                  </div>
                </div>
                <span style={{ 
                  fontSize: '0.6rem', 
                  color: '#444',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
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
              background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '6px',
              fontSize: '0.7rem'
            }}>
              <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '6px' }}>
                ✓ {ASSETS.find(a => a.id === selectedAsset)?.name} Selected
              </div>
              <div style={{ color: '#888', lineHeight: '1.4' }}>
                {ASSETS.find(a => a.id === selectedAsset)?.description}
              </div>
              <div style={{ color: '#444', marginTop: '8px', fontStyle: 'italic' }}>
                Click on the map to place
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '8px'
          }}>
            <button style={{
              flex: 1,
              background: 'rgba(30, 30, 40, 0.8)',
              color: '#666',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.65rem',
              transition: 'all 0.3s ease'
            }}>
              ↩ Undo
            </button>
            <button style={{
              flex: 1,
              background: 'rgba(30, 30, 40, 0.8)',
              color: '#666',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.65rem',
              transition: 'all 0.3s ease'
            }}>
              🗑 Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
