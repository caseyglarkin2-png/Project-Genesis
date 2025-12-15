import React from 'react';

export default function AssetPalette() {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 20, 
      left: 20, 
      background: 'rgba(0,0,0,0.8)', 
      padding: '1rem', 
      borderRadius: '8px',
      color: 'white',
      zIndex: 1000,
      border: '1px solid #00ff00', // Sci-fi neon green border
      boxShadow: '0 0 10px #00ff00'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontFamily: 'monospace' }}>ASSET PALETTE</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px' }}>Dock Door</button>
        <button style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px' }}>Trailer</button>
        <button style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px' }}>Guard Shack</button>
        <button style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '5px' }}>Paint Zone</button>
      </div>
    </div>
  );
}
