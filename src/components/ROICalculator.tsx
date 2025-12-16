import React, { useState } from 'react';

/**
 * =============================================================================
 * ROI CALCULATOR - Value Demonstration for YardBuilder AI
 * =============================================================================
 * 
 * Shows the tangible business value of optimizing yard operations:
 * - Facility Level: ROI for a single distribution center
 * - Network Level: Aggregated savings across all facilities
 * 
 * Key Metrics:
 * - Turn Time Savings: Reduced truck wait time = lower detention fees
 * - Labor Efficiency: Less manual yard checks = fewer FTEs needed
 * - Asset Utilization: Better visibility = fewer "ghost" searches
 * - Throughput Increase: Faster turns = more trucks per day
 */

interface ROIInputs {
  trucksPerDay: number;
  avgTurnTime: number;
  detentionCostPerHour: number;
  yardChecksPerDay: number;
  laborCostPerHour: number;
  ghostSearchesPerWeek: number;
  searchTimeMinutes: number;
}

interface ROIResults {
  annualDetentionSavings: number;
  annualLaborSavings: number;
  annualGhostSavings: number;
  throughputIncrease: number;
  totalAnnualROI: number;
  paybackMonths: number;
}

const DEFAULT_FACILITY: ROIInputs = {
  trucksPerDay: 150,
  avgTurnTime: 45, // minutes
  detentionCostPerHour: 75,
  yardChecksPerDay: 12,
  laborCostPerHour: 25,
  ghostSearchesPerWeek: 8,
  searchTimeMinutes: 30,
};

const IMPLEMENTATION_COST = 48000; // Annual subscription

function calculateROI(inputs: ROIInputs): ROIResults {
  // Turn time improvement: 30% reduction with YardBuilder
  const turnTimeReduction = 0.30;
  const minutesSavedPerTruck = inputs.avgTurnTime * turnTimeReduction;
  const hoursSavedPerDay = (minutesSavedPerTruck * inputs.trucksPerDay) / 60;
  const annualDetentionSavings = hoursSavedPerDay * inputs.detentionCostPerHour * 365;

  // Labor savings: 50% reduction in manual yard checks
  const checksReduction = 0.50;
  const checksEliminated = inputs.yardChecksPerDay * checksReduction;
  const laborHoursSavedPerDay = checksEliminated * 0.5; // 30 min per check
  const annualLaborSavings = laborHoursSavedPerDay * inputs.laborCostPerHour * 365;

  // Ghost asset savings: 80% reduction in search time
  const ghostReduction = 0.80;
  const searchesEliminated = inputs.ghostSearchesPerWeek * ghostReduction;
  const searchHoursSavedPerWeek = (searchesEliminated * inputs.searchTimeMinutes) / 60;
  const annualGhostSavings = searchHoursSavedPerWeek * inputs.laborCostPerHour * 52;

  // Throughput increase
  const throughputIncrease = Math.round((minutesSavedPerTruck / inputs.avgTurnTime) * 100);

  const totalAnnualROI = annualDetentionSavings + annualLaborSavings + annualGhostSavings;
  const paybackMonths = Math.round((IMPLEMENTATION_COST / totalAnnualROI) * 12);

  return {
    annualDetentionSavings,
    annualLaborSavings,
    annualGhostSavings,
    throughputIncrease,
    totalAnnualROI,
    paybackMonths,
  };
}

export default function ROICalculator({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'facility' | 'network'>('facility');
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_FACILITY);
  const [networkSize, setNetworkSize] = useState(25);
  
  const facilityROI = calculateROI(inputs);
  const networkROI = {
    ...facilityROI,
    annualDetentionSavings: facilityROI.annualDetentionSavings * networkSize,
    annualLaborSavings: facilityROI.annualLaborSavings * networkSize,
    annualGhostSavings: facilityROI.annualGhostSavings * networkSize,
    totalAnnualROI: facilityROI.totalAnnualROI * networkSize,
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

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
          backdropFilter: 'blur(4px)',
          zIndex: 2999
        }} 
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.98) 0%, rgba(10, 5, 25, 0.98) 100%)',
        border: '1px solid rgba(0, 255, 255, 0.4)',
        borderRadius: '12px',
        color: '#e0e0e0',
        fontFamily: '"JetBrains Mono", monospace',
        zIndex: 3000,
        boxShadow: '0 0 60px rgba(0, 255, 255, 0.3)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 255, 0.1) 100%)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.1rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, #00ff00, #00ffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            💰 ROI Calculator
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(255, 0, 0, 0.1)', 
              border: '1px solid rgba(255, 0, 0, 0.3)', 
              color: '#ff4444', 
              cursor: 'pointer', 
              padding: '6px 12px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {(['facility', 'network'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '15px',
                background: activeTab === tab ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #00ffff' : '2px solid transparent',
                color: activeTab === tab ? '#00ffff' : '#666',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease'
              }}
            >
              {tab === 'facility' ? '🏭 Single Facility' : '🌐 Network-Wide'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          {/* Left: Inputs */}
          <div>
            <h3 style={{ color: '#00ffff', margin: '0 0 15px 0', fontSize: '0.85rem', letterSpacing: '1px' }}>
              📊 YOUR METRICS
            </h3>
            
            {activeTab === 'network' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '5px' }}>
                  NUMBER OF FACILITIES
                </label>
                <input
                  type="number"
                  value={networkSize}
                  onChange={(e) => setNetworkSize(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    color: '#00ffff',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'trucksPerDay', label: 'Trucks per Day', icon: '🚛' },
                { key: 'avgTurnTime', label: 'Avg Turn Time (min)', icon: '⏱️' },
                { key: 'detentionCostPerHour', label: 'Detention Cost/Hour ($)', icon: '💵' },
                { key: 'yardChecksPerDay', label: 'Manual Yard Checks/Day', icon: '👁️' },
                { key: 'laborCostPerHour', label: 'Labor Cost/Hour ($)', icon: '👷' },
                { key: 'ghostSearchesPerWeek', label: 'Ghost Searches/Week', icon: '👻' },
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label style={{ display: 'block', color: '#666', fontSize: '0.65rem', marginBottom: '4px' }}>
                    {icon} {label}
                  </label>
                  <input
                    type="number"
                    value={inputs[key as keyof ROIInputs]}
                    onChange={(e) => setInputs({ ...inputs, [key]: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            <h3 style={{ color: '#00ff00', margin: '0 0 15px 0', fontSize: '0.85rem', letterSpacing: '1px' }}>
              📈 PROJECTED SAVINGS
            </h3>
            
            {/* Total ROI Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.15) 0%, rgba(0, 255, 255, 0.1) 100%)',
              border: '1px solid rgba(0, 255, 0, 0.4)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '5px', textTransform: 'uppercase' }}>
                {activeTab === 'facility' ? 'Annual Facility ROI' : 'Annual Network ROI'}
              </div>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 'bold', 
                color: '#00ff00',
                textShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
              }}>
                {formatCurrency(activeTab === 'facility' ? facilityROI.totalAnnualROI : networkROI.totalAnnualROI)}
              </div>
              <div style={{ color: '#00ffff', fontSize: '0.8rem', marginTop: '5px' }}>
                {facilityROI.paybackMonths} month payback
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Detention Savings', value: activeTab === 'facility' ? facilityROI.annualDetentionSavings : networkROI.annualDetentionSavings, color: '#00ff00', icon: '⏱️' },
                { label: 'Labor Savings', value: activeTab === 'facility' ? facilityROI.annualLaborSavings : networkROI.annualLaborSavings, color: '#00ffff', icon: '👷' },
                { label: 'Ghost Search Savings', value: activeTab === 'facility' ? facilityROI.annualGhostSavings : networkROI.annualGhostSavings, color: '#ff00ff', icon: '👻' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${color}`
                }}>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>{icon} {label}</span>
                  <span style={{ color, fontWeight: 'bold' }}>{formatCurrency(value)}</span>
                </div>
              ))}
            </div>

            {/* Throughput */}
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: 'rgba(255, 255, 0, 0.1)',
              border: '1px solid rgba(255, 255, 0, 0.3)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ffff00', fontSize: '1.5rem', fontWeight: 'bold' }}>
                +{facilityROI.throughputIncrease}%
              </div>
              <div style={{ color: '#888', fontSize: '0.7rem' }}>Throughput Increase</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '15px 25px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.3)',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#555'
        }}>
          Based on industry averages: 30% turn time reduction, 50% fewer yard checks, 80% ghost reduction
        </div>
      </div>
    </>
  );
}
