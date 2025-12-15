import React from 'react';

type Facility = {
  id: string;
  name: string;
  score: number;
  tier: 'Local' | 'Regional' | 'Network';
  trend: 'up' | 'down' | 'stable';
};

const MOCK_LEADERBOARD: Facility[] = [
  { id: '1', name: 'Jacksonville DC (You)', score: 75.5, tier: 'Local', trend: 'up' },
  { id: '2', name: 'Savannah Port Terminal', score: 82.1, tier: 'Regional', trend: 'stable' },
  { id: '3', name: 'Atlanta Distribution', score: 68.4, tier: 'Regional', trend: 'down' },
  { id: '4', name: 'Miami Cold Storage', score: 91.0, tier: 'Network', trend: 'up' },
  { id: '5', name: 'Charlotte Hub', score: 55.2, tier: 'Regional', trend: 'down' },
];

export default function Leaderboard() {
  // Sort by score descending
  const sortedData = [...MOCK_LEADERBOARD].sort((a, b) => b.score - a.score);

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      width: '300px',
      background: 'rgba(0, 10, 20, 0.9)', // Dark blue/black background
      border: '1px solid #00ffff', // Cyan border for sci-fi look
      borderRadius: '4px',
      color: '#e0e0e0',
      fontFamily: '"Courier New", Courier, monospace',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
      zIndex: 1000,
      padding: '0'
    }}>
      <div style={{
        padding: '10px',
        borderBottom: '1px solid #00ffff',
        background: 'rgba(0, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Network Velocity</h3>
        <span style={{ fontSize: '0.8rem', color: '#00ffff' }}>LIVE</span>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: '10px' }}>
        {sortedData.map((facility, index) => {
          const isUser = facility.name.includes('(You)');
          return (
            <li key={facility.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 5px',
              borderBottom: index !== sortedData.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              background: isUser ? 'rgba(0, 255, 0, 0.1)' : 'transparent',
              borderLeft: isUser ? '3px solid #00ff00' : '3px solid transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  color: index < 3 ? '#ffd700' : '#888', 
                  fontWeight: 'bold',
                  width: '20px' 
                }}>
                  #{index + 1}
                </span>
                <div>
                  <div style={{ fontWeight: isUser ? 'bold' : 'normal', color: isUser ? '#fff' : '#aaa' }}>
                    {facility.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>
                    {facility.tier} Tier
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: facility.score > 80 ? '#00ff00' : facility.score > 60 ? '#ffff00' : '#ff0000' 
                }}>
                  {facility.score.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.7rem', color: facility.trend === 'up' ? '#00ff00' : '#ff0000' }}>
                  {facility.trend === 'up' ? '▲' : facility.trend === 'down' ? '▼' : '-'}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      
      <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', color: '#555', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        TARGET: 24 MIN TURN TIME
      </div>
    </div>
  );
}
