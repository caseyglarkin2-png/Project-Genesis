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
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
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
        background: 'rgba(15, 20, 25, 0.98)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        color: '#E2E8F0',
        fontFamily: '"Inter", -apple-system, sans-serif',
        zIndex: 2000,
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 41, 59, 0.3) 100%)',
          borderRadius: '11px 11px 0 0'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '0.95rem', 
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#3B82F6',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1rem' }}>◈</span> Digital Bill of Lading
          </h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#EF4444', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              padding: '4px 10px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              fontWeight: '500'
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
                    color: '#3B82F6', 
                    fontSize: '0.65rem', 
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    fontWeight: '500'
                  }}>
                    Carrier
                  </label>
                  <input 
                    type="text" 
                    defaultValue="SWIFT TRANSPORT" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(30, 41, 59, 0.6)', 
                      border: '1px solid rgba(148, 163, 184, 0.15)', 
                      color: '#E2E8F0', 
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease'
                    }} 
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#3B82F6', 
                    fontSize: '0.65rem', 
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    fontWeight: '500'
                  }}>
                    Trailer #
                  </label>
                  <input 
                    type="text" 
                    defaultValue="TRL-55920" 
                    style={{ 
                      width: '100%', 
                      background: 'rgba(30, 41, 59, 0.6)', 
                      border: '1px solid rgba(148, 163, 184, 0.15)', 
                      color: '#E2E8F0', 
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#3B82F6', 
                  fontSize: '0.65rem', 
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontWeight: '500'
                }}>
                  Origin
                </label>
                <input 
                  type="text" 
                  defaultValue="SAVANNAH PORT TERMINAL" 
                  style={{ 
                    width: '100%', 
                    background: 'rgba(30, 41, 59, 0.6)', 
                    border: '1px solid rgba(148, 163, 184, 0.15)', 
                    color: '#E2E8F0', 
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                  }} 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#3B82F6', 
                  fontSize: '0.65rem', 
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontWeight: '500'
                }}>
                  Contents
                </label>
                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.6)', 
                  border: '1px solid rgba(148, 163, 184, 0.15)', 
                  padding: '15px',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#E2E8F0' }}>
                    <span>24 PALLETS / CONSUMER ELECTRONICS</span>
                    <span style={{ color: '#10B981' }}>22,000 LBS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.8rem' }}>
                    <span>SKU: 88492-A</span>
                    <span>HAZMAT: <span style={{ color: '#10B981' }}>NO</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ 
                fontSize: '4rem', 
                color: '#10B981', 
                marginBottom: '15px',
                animation: 'pulse 1s ease-in-out'
              }}>
                ◉
              </div>
              <h3 style={{ 
                color: '#E2E8F0', 
                fontSize: '1.2rem',
                marginBottom: '15px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>
                Check-In Complete
              </h3>
              <p style={{ color: '#94A3B8', marginBottom: '8px' }}>
                Gate Pass Generated: <span style={{ color: '#3B82F6' }}>#GP-9921</span>
              </p>
              <p style={{ color: '#94A3B8' }}>
                Assigned Dock: <span style={{ color: '#10B981', fontSize: '1.1rem', fontWeight: '600' }}>DOCK 04</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 25px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          {step === 1 ? (
            <button 
              onClick={() => setStep(2)}
              style={{ 
                background: '#3B82F6', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 24px', 
                fontWeight: '600', 
                cursor: 'pointer',
                textTransform: 'uppercase',
                borderRadius: '8px',
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease'
              }}
            >
              Sign & Process
            </button>
          ) : (
            <button 
              onClick={onClose}
              style={{ 
                background: 'rgba(30, 41, 59, 0.8)', 
                color: '#E2E8F0', 
                border: '1px solid rgba(148, 163, 184, 0.15)', 
                padding: '12px 24px', 
                fontWeight: '600', 
                cursor: 'pointer',
                textTransform: 'uppercase',
                borderRadius: '8px',
                fontSize: '0.8rem',
                letterSpacing: '0.5px'
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