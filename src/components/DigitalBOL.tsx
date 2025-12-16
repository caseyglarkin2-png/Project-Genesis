import React, { useState } from 'react';

export default function DigitalBOL({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1999
        }} 
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.98) 0%, rgba(10, 5, 25, 0.98) 100%)',
        border: '1px solid rgba(0, 255, 0, 0.4)',
        borderRadius: '12px',
        color: '#e0e0e0',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        zIndex: 2000,
        boxShadow: '0 0 60px rgba(0, 255, 0, 0.3), inset 0 0 100px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(0, 255, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.15) 0%, rgba(0, 255, 255, 0.05) 100%)',
          borderRadius: '11px 11px 0 0'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1rem', 
            textTransform: 'uppercase',
            letterSpacing: '2px',
            background: 'linear-gradient(90deg, #00ff00, #00ffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            📄 Digital Bill of Lading
          </h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 0, 0, 0.1)', 
              border: '1px solid rgba(255, 0, 0, 0.3)', 
              color: '#ff4444', 
              cursor: 'pointer', 
              fontSize: '1rem',
              padding: '4px 10px',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '25px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#00ffff', 
                    fontSize: '0.7rem', 
                    marginBottom: '6px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    CARRIER
                  </label>
                  <input 
                    type="text" 
                    defaultValue="SWIFT TRANSPORT" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(0, 0, 0, 0.4)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      color: '#fff', 
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#00ffff', 
                    fontSize: '0.7rem', 
                    marginBottom: '6px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    TRAILER #
                  </label>
                  <input 
                    type="text" 
                    defaultValue="TRL-55920" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(0, 0, 0, 0.4)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      color: '#fff', 
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#00ffff', 
                  fontSize: '0.7rem', 
                  marginBottom: '6px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  ORIGIN
                </label>
                <input 
                  type="text" 
                  defaultValue="SAVANNAH PORT TERMINAL" 
                  style={{ 
                    width: '100%', 
                    background: 'rgba(0, 0, 0, 0.4)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#fff', 
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }} 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#00ffff', 
                  fontSize: '0.7rem', 
                  marginBottom: '6px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  CONTENTS
                </label>
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.4)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '15px',
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>24 PALLETS / CONSUMER ELECTRONICS</span>
                    <span style={{ color: '#00ff00' }}>22,000 LBS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: '0.85rem' }}>
                    <span>SKU: 88492-A</span>
                    <span>HAZMAT: <span style={{ color: '#00ff00' }}>NO</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ 
                fontSize: '5rem', 
                color: '#00ff00', 
                marginBottom: '15px',
                textShadow: '0 0 30px rgba(0, 255, 0, 0.5)',
                animation: 'pulse 1s ease-in-out'
              }}>
                ✓
              </div>
              <h3 style={{ 
                color: '#fff', 
                fontSize: '1.3rem',
                marginBottom: '15px',
                letterSpacing: '2px'
              }}>
                CHECK-IN COMPLETE
              </h3>
              <p style={{ color: '#888', marginBottom: '8px' }}>
                Gate Pass Generated: <span style={{ color: '#00ffff' }}>#GP-9921</span>
              </p>
              <p style={{ color: '#888' }}>
                Assigned Dock: <span style={{ color: '#00ff00', fontSize: '1.2rem', fontWeight: 'bold' }}>DOCK 04</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 25px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          {step === 1 ? (
            <button 
              onClick={() => setStep(2)}
              style={{ 
                background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)', 
                color: '#000', 
                border: 'none', 
                padding: '12px 24px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                textTransform: 'uppercase',
                borderRadius: '6px',
                fontSize: '0.85rem',
                letterSpacing: '1px',
                boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              Sign & Process
            </button>
          ) : (
            <button 
              onClick={onClose}
              style={{ 
                background: 'rgba(50, 50, 60, 0.8)', 
                color: '#fff', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                padding: '12px 24px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                textTransform: 'uppercase',
                borderRadius: '6px',
                fontSize: '0.85rem',
                letterSpacing: '1px'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}