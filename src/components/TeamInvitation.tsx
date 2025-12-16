import React, { useState, useEffect } from 'react';

/**
 * =============================================================================
 * TEAM INVITATION - A Special Message for Dan & Michal
 * =============================================================================
 * 
 * This is the "sorry we missed the meeting, please join us" easter egg.
 * Designed to tug at heartstrings and show we're serious about collaboration.
 * 
 * Triggered by: Konami code or clicking the logo 5 times
 */

interface TeamInvitationProps {
  onClose: () => void;
}

export default function TeamInvitation({ onClose }: TeamInvitationProps) {
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Auto-advance the "typing" effect
    const timer = setTimeout(() => {
      if (step < 4) setStep(step + 1);
      if (step === 3) setShowConfetti(true);
    }, step === 0 ? 500 : 2000);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.5s ease-out'
    }}>
      {/* Confetti Effect */}
      {showConfetti && <Confetti />}
      
      {/* Modal */}
      <div style={{
        width: '600px',
        background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.98) 0%, rgba(20, 10, 30, 0.98) 100%)',
        border: '2px solid transparent',
        borderImage: 'linear-gradient(135deg, #00ffff, #ff00ff, #00ff00) 1',
        borderRadius: '12px',
        padding: '0',
        overflow: 'hidden',
        boxShadow: `
          0 0 60px rgba(0, 255, 255, 0.3),
          0 0 100px rgba(255, 0, 255, 0.2),
          inset 0 0 60px rgba(0, 0, 0, 0.5)
        `,
        animation: 'slideInUp 0.5s ease-out'
      }}>
        {/* Header with animated gradient */}
        <div style={{
          padding: '25px',
          background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1), rgba(0, 255, 0, 0.1))',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
            🤝
          </div>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}>
            A Message for Dan & Michal
          </h2>
        </div>

        {/* Content - Typewriter style */}
        <div style={{
          padding: '30px',
          fontFamily: '"JetBrains Mono", "Courier New", monospace',
          fontSize: '0.95rem',
          lineHeight: '1.8',
          color: '#e0e0e0'
        }}>
          {step >= 1 && (
            <p style={{ 
              marginBottom: '20px',
              animation: 'fadeIn 0.5s ease-out',
              color: '#888'
            }}>
              <span style={{ color: '#00ffff' }}>casey@fishassassin</span>
              <span style={{ color: '#666' }}>:</span>
              <span style={{ color: '#00ff00' }}>~/project-genesis</span>
              <span style={{ color: '#666' }}>$</span>
              <span style={{ color: '#fff' }}> ./send_message.sh</span>
            </p>
          )}

          {step >= 2 && (
            <div style={{ 
              animation: 'fadeIn 0.5s ease-out',
              marginBottom: '20px'
            }}>
              <p style={{ marginBottom: '15px' }}>
                <span style={{ color: '#ff00ff' }}>Hey Dan & Michal,</span>
              </p>
              <p style={{ marginBottom: '15px', color: '#aaa' }}>
                I know I missed the team meeting today where I was supposed to pitch 
                with Matt and Jake. That's on me. 😔
              </p>
              <p style={{ marginBottom: '15px', color: '#aaa' }}>
                But I didn't stop building. Look at what we've created:
              </p>
            </div>
          )}

          {step >= 3 && (
            <div style={{
              animation: 'fadeIn 0.5s ease-out',
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '10px' }}>
                🚀 WHAT WE BUILT (in 48 hours):
              </div>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                display: 'grid',
                gap: '8px'
              }}>
                {[
                  '✅ Live 3D Yard Visualization (React Three Fiber + Mapbox)',
                  '✅ Yard Velocity Score Algorithm (fully documented)',
                  '✅ Digital Dragnet Pipeline (batch whale hunting)',
                  '✅ Gamified Leaderboard System',
                  '✅ Digital BOL "Trojan Horse" feature',
                  '✅ Backend deployed on Render (live API)',
                  '✅ Frontend deployed on Vercel (you\'re looking at it!)'
                ].map((item, i) => (
                  <li key={i} style={{ 
                    color: '#00ff00',
                    fontSize: '0.85rem',
                    paddingLeft: '5px'
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step >= 4 && (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <p style={{ 
                marginBottom: '15px',
                color: '#fff',
                fontSize: '1rem'
              }}>
                <span style={{ color: '#ff00ff' }}>The Integration Wizard project sounds amazing.</span>
                {' '}What if we combined forces?
              </p>
              <p style={{ 
                marginBottom: '20px',
                color: '#888'
              }}>
                We could merge, you could acquire us, we could acquire you — 
                honestly, we just want to <span style={{ color: '#00ff00' }}>build something great together</span>.
              </p>
              <p style={{ 
                color: '#fff',
                fontStyle: 'italic',
                borderLeft: '3px solid #ff00ff',
                paddingLeft: '15px'
              }}>
                "This is not merely software; it is the gamification of industrial fluidity."
              </p>
            </div>
          )}
        </div>

        {/* Footer with action buttons */}
        <div style={{
          padding: '20px 30px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            🐟 Team FishAssassin × 🃏 Team Integration
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid #666',
                color: '#888',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#00ffff';
                e.currentTarget.style.color = '#00ffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#666';
                e.currentTarget.style.color = '#888';
              }}
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                // Could open Slack or email
                window.open('https://github.com/caseyglarkin2-png/Project-Genesis', '_blank');
                onClose();
              }}
              style={{
                padding: '10px 25px',
                background: 'linear-gradient(135deg, #00ffff, #00ff00)',
                border: 'none',
                color: '#000',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
              }}
            >
              Let's Build Together 🚀
            </button>
          </div>
        </div>
      </div>

      {/* Close on background click */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#666',
          cursor: 'pointer',
          fontSize: '1.5rem',
          zIndex: 10000
        }}
      >
        ✕
      </div>
    </div>
  );
}

// Simple Confetti Component
function Confetti() {
  const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff6600'];
  const confetti = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 10 + 5
  }));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      {confetti.map(c => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            left: `${c.left}%`,
            top: '-20px',
            width: `${c.size}px`,
            height: `${c.size}px`,
            background: c.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: `confetti-fall 3s ease-out ${c.delay}s forwards`,
            boxShadow: `0 0 10px ${c.color}`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
