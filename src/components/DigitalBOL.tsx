import React, { useState } from 'react';

export default function DigitalBOL({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      background: '#0a0a0a',
      border: '2px solid #00ff00',
      borderRadius: '8px',
      color: '#e0e0e0',
      fontFamily: '"Courier New", Courier, monospace',
      zIndex: 2000,
      boxShadow: '0 0 30px rgba(0, 255, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 255, 0, 0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>Digital Bill of Lading</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#00ff00', cursor: 'pointer', fontSize: '1.2rem' }}>X</button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>CARRIER</label>
                <input type="text" defaultValue="SWIFT TRANSPORT" style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '8px' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>TRAILER #</label>
                <input type="text" defaultValue="TRL-55920" style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '8px' }} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>ORIGIN</label>
              <input type="text" defaultValue="SAVANNAH PORT TERMINAL" style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '8px' }} />
            </div>

            <div>
              <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>CONTENTS</label>
              <div style={{ background: '#111', border: '1px solid #333', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>24 PALLETS / CONSUMER ELECTRONICS</span>
                  <span>22,000 LBS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem' }}>
                  <span>SKU: 88492-A</span>
                  <span>HAZMAT: NO</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '4rem', color: '#00ff00', marginBottom: '10px' }}>✓</div>
            <h3 style={{ color: '#fff' }}>CHECK-IN COMPLETE</h3>
            <p style={{ color: '#888' }}>Gate Pass Generated: #GP-9921</p>
            <p style={{ color: '#888' }}>Assigned Dock: <span style={{ color: '#00ff00' }}>DOCK 04</span></p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        {step === 1 ? (
          <button 
            onClick={() => setStep(2)}
            style={{ 
              background: '#00ff00', 
              color: '#000', 
              border: 'none', 
              padding: '10px 20px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Sign & Process
          </button>
        ) : (
          <button 
            onClick={onClose}
            style={{ 
              background: '#333', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 20px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
