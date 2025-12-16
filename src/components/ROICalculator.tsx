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
        background: 'rgba(15, 20, 25, 0.98)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        color: '#E2E8F0',
        fontFamily: '"Inter", -apple-system, sans-serif',
        zIndex: 3000,
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(30, 41, 59, 0.3) 100%)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#3B82F6',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.1rem' }}>◈</span> ROI Calculator
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#EF4444', 
              cursor: 'pointer', 
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          {(['facility', 'network'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '15px',
                background: activeTab === tab ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
                color: activeTab === tab ? '#3B82F6' : '#64748B',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'facility' ? '◇ Single Facility' : '◈ Network-Wide'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          {/* Left: Inputs */}
          <div>
            <h3 style={{ color: '#3B82F6', margin: '0 0 15px 0', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
              ◎ Your Metrics
            </h3>
            
            {activeTab === 'network' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#64748B', fontSize: '0.65rem', marginBottom: '5px', textTransform: 'uppercase' }}>
                  Number of Facilities
                </label>
                <input
                  type="number"
                  value={networkSize}
                  onChange={(e) => setNetworkSize(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3B82F6',
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
                { key: 'trucksPerDay', label: 'Trucks per Day', icon: '◇' },
                { key: 'avgTurnTime', label: 'Avg Turn Time (min)', icon: '◷' },
                { key: 'detentionCostPerHour', label: 'Detention Cost/Hour ($)', icon: '◆' },
                { key: 'yardChecksPerDay', label: 'Manual Yard Checks/Day', icon: '◎' },
                { key: 'laborCostPerHour', label: 'Labor Cost/Hour ($)', icon: '◉' },
                { key: 'ghostSearchesPerWeek', label: 'Ghost Searches/Week', icon: '◌' },
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label style={{ display: 'block', color: '#64748B', fontSize: '0.6rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                    {icon} {label}
                  </label>
                  <input
                    type="number"
                    value={inputs[key as keyof ROIInputs]}
                    onChange={(e) => setInputs({ ...inputs, [key]: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      color: '#E2E8F0',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            <h3 style={{ color: '#10B981', margin: '0 0 15px 0', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
              ▲ Projected Savings
            </h3>
            
            {/* Total ROI Card */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#94A3B8', fontSize: '0.65rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeTab === 'facility' ? 'Annual Facility ROI' : 'Annual Network ROI'}
              </div>
              <div style={{ 
                fontSize: '2.2rem', 
                fontWeight: '700', 
                color: '#10B981'
              }}>
                {formatCurrency(activeTab === 'facility' ? facilityROI.totalAnnualROI : networkROI.totalAnnualROI)}
              </div>
              <div style={{ color: '#3B82F6', fontSize: '0.75rem', marginTop: '5px', fontWeight: '500' }}>
                {facilityROI.paybackMonths} month payback
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Detention Savings', value: activeTab === 'facility' ? facilityROI.annualDetentionSavings : networkROI.annualDetentionSavings, color: '#10B981', icon: '◷' },
                { label: 'Labor Savings', value: activeTab === 'facility' ? facilityROI.annualLaborSavings : networkROI.annualLaborSavings, color: '#3B82F6', icon: '◉' },
                { label: 'Ghost Search Savings', value: activeTab === 'facility' ? facilityROI.annualGhostSavings : networkROI.annualGhostSavings, color: '#8B5CF6', icon: '◌' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${color}`
                }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{icon} {label}</span>
                  <span style={{ color, fontWeight: '600' }}>{formatCurrency(value)}</span>
                </div>
              ))}
            </div>

            {/* Throughput */}
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#F59E0B', fontSize: '1.4rem', fontWeight: '700' }}>
                +{facilityROI.throughputIncrease}%
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Throughput Increase</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '15px 25px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(10, 14, 20, 0.4)',
          textAlign: 'center',
          fontSize: '0.65rem',
          color: '#64748B'
        }}>
          Based on industry averages: 30% turn time reduction, 50% fewer yard checks, 80% ghost reduction
        </div>
      </div>
    </>
  );
}
