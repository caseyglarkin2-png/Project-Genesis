import React, { useState } from 'react';

/**
 * =============================================================================
 * ROI CALCULATOR - Value Demonstration for FreightRoll
 * =============================================================================
 * 
 * UPDATED: Clear labels, defensible assumptions, transparent calculations
 * 
 * Key Improvements:
 * - Explicit detention threshold (120 min) with rate-based calculation
 * - Ghost searches clearly defined with tooltips
 * - "How projections are calculated" section
 * - Tooltips on every input
 * - Formulas shown in human-readable format
 */

interface ROIInputs {
  // Volume
  loadsPerDay: number;
  
  // Turn Time
  avgTurnTime: number;          // Gate-in to Gate-out, in minutes
  detentionThreshold: number;   // Minutes before detention kicks in (default 120)
  
  // Detention
  detentionRate: number;        // % of loads that incur detention (0-100)
  detentionCostPerHour: number; // $/hour penalty rate
  
  // Labor
  yardChecksPerDay: number;
  laborCostPerHour: number;
  
  // Ghost Searches
  ghostSearchesPerWeek: number;
  searchTimeMinutes: number;
}

interface ROIResults {
  // Raw calculations
  currentDetentionHoursPerDay: number;
  projectedDetentionHoursPerDay: number;
  detentionHoursSavedPerDay: number;
  
  // Annual savings
  annualDetentionSavings: number;
  annualLaborSavings: number;
  annualGhostSavings: number;
  
  // Totals
  throughputIncrease: number;
  totalAnnualROI: number;
  paybackMonths: number;
  
  // Per-load metrics
  savingsPerLoad: number;
}

// Tooltips for every input
const TOOLTIPS: Record<string, string> = {
  loadsPerDay: "Total inbound + outbound truck loads processed at this facility per day. Typical range: 50-500 depending on facility size.",
  avgTurnTime: "Average time from gate-in to gate-out for all trucks, including wait time, loading/unloading, and paperwork. Industry average: 90-180 minutes.",
  detentionThreshold: "Minutes of free time before detention charges begin. Standard is 120 minutes (2 hours). Some carriers use 60-90 min.",
  detentionRate: "Percentage of loads where trucks exceed the detention threshold. If 20% of your trucks wait longer than 2 hours, enter 20. Typical: 10-40%.",
  detentionCostPerHour: "Hourly rate charged by carriers for detention. Blended average across carriers. Typical: $50-$100/hour.",
  yardChecksPerDay: "Number of manual yard audits where someone physically walks/drives the yard to locate assets. Typical: 4-20/day.",
  laborCostPerHour: "Fully loaded labor cost (wages + benefits) for yard workers. Typical: $20-$40/hour.",
  ghostSearchesPerWeek: "Weekly count of 'ghost hunts' - searching for trailers/loads that can't be located due to poor visibility. These waste time and delay shipments.",
  searchTimeMinutes: "Average time spent per ghost search before the asset is found or declared missing. Typical: 15-45 minutes.",
};

// Default improvement assumptions (conservative, based on customer data)
const DEFAULT_ASSUMPTIONS = {
  turnTimeReduction: 25,        // 25% turn time reduction
  detentionRateReduction: 40,   // 40% reduction in detention incidents
  yardCheckReduction: 60,       // 60% fewer manual yard checks
  ghostReduction: 80,           // 80% reduction in ghost searches
  minutesPerYardCheck: 30,      // 30 min per manual yard check
};

interface Assumptions {
  turnTimeReduction: number;
  detentionRateReduction: number;
  yardCheckReduction: number;
  ghostReduction: number;
  minutesPerYardCheck: number;
}

const IMPLEMENTATION_COST = 48000; // Annual subscription

const DEFAULT_FACILITY: ROIInputs = {
  loadsPerDay: 150,
  avgTurnTime: 135,              // 2h 15m average
  detentionThreshold: 120,       // 2 hour free time
  detentionRate: 25,             // 25% of loads incur detention
  detentionCostPerHour: 75,
  yardChecksPerDay: 12,
  laborCostPerHour: 28,
  ghostSearchesPerWeek: 8,
  searchTimeMinutes: 30,
};

function calculateROI(inputs: ROIInputs, assumptions: Assumptions): ROIResults {
  // ============================================
  // DETENTION SAVINGS
  // ============================================
  // Current: For loads that incur detention, calculate excess time
  const detentionLoadsPerDay = (inputs.loadsPerDay * inputs.detentionRate) / 100;
  
  // Average detention time = max(0, avgTurnTime - threshold)
  // But only for the % of loads that actually incur detention
  const avgDetentionMinutes = Math.max(0, inputs.avgTurnTime - inputs.detentionThreshold);
  const currentDetentionHoursPerDay = (detentionLoadsPerDay * avgDetentionMinutes) / 60;
  
  // With FreightRoll: Apply custom assumption percentages
  const improvedTurnTime = inputs.avgTurnTime * (1 - assumptions.turnTimeReduction / 100);
  const improvedDetentionMinutes = Math.max(0, improvedTurnTime - inputs.detentionThreshold);
  const improvedDetentionRate = inputs.detentionRate * (1 - assumptions.detentionRateReduction / 100);
  const improvedDetentionLoadsPerDay = (inputs.loadsPerDay * improvedDetentionRate) / 100;
  const projectedDetentionHoursPerDay = (improvedDetentionLoadsPerDay * improvedDetentionMinutes) / 60;
  
  const detentionHoursSavedPerDay = currentDetentionHoursPerDay - projectedDetentionHoursPerDay;
  const annualDetentionSavings = detentionHoursSavedPerDay * inputs.detentionCostPerHour * 365;

  // ============================================
  // LABOR SAVINGS (Yard Checks)
  // ============================================
  const checksEliminated = inputs.yardChecksPerDay * (assumptions.yardCheckReduction / 100);
  const laborHoursSavedPerDay = (checksEliminated * assumptions.minutesPerYardCheck) / 60;
  const annualLaborSavings = laborHoursSavedPerDay * inputs.laborCostPerHour * 365;

  // ============================================
  // GHOST SEARCH SAVINGS
  // ============================================
  const searchesEliminated = inputs.ghostSearchesPerWeek * (assumptions.ghostReduction / 100);
  const searchHoursSavedPerWeek = (searchesEliminated * inputs.searchTimeMinutes) / 60;
  const annualGhostSavings = searchHoursSavedPerWeek * inputs.laborCostPerHour * 52;

  // ============================================
  // THROUGHPUT & TOTALS
  // ============================================
  const throughputIncrease = Math.round(assumptions.turnTimeReduction);
  const totalAnnualROI = annualDetentionSavings + annualLaborSavings + annualGhostSavings;
  const paybackMonths = totalAnnualROI > 0 ? Math.round((IMPLEMENTATION_COST / totalAnnualROI) * 12) : 99;
  const savingsPerLoad = totalAnnualROI / (inputs.loadsPerDay * 365);

  return {
    currentDetentionHoursPerDay,
    projectedDetentionHoursPerDay,
    detentionHoursSavedPerDay,
    annualDetentionSavings,
    annualLaborSavings,
    annualGhostSavings,
    throughputIncrease,
    totalAnnualROI,
    paybackMonths,
    savingsPerLoad,
  };
}

// Tooltip component
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  
  return (
    <span 
      style={{ position: 'relative', cursor: 'help', marginLeft: '6px' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ 
        color: '#64748B', 
        fontSize: '0.65rem',
        border: '1px solid #64748B',
        borderRadius: '50%',
        width: '14px',
        height: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>?</span>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '220px',
          padding: '10px 12px',
          background: 'rgba(30, 41, 59, 0.98)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '6px',
          color: '#CBD5E1',
          fontSize: '0.65rem',
          lineHeight: '1.4',
          zIndex: 100,
          marginBottom: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {text}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(30, 41, 59, 0.98)'
          }} />
        </div>
      )}
    </span>
  );
}

// Slider component for assumptions
function AssumptionSlider({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100,
  color,
  description
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  color: string;
  description: string;
}) {
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.4)',
      padding: '12px 14px',
      borderRadius: '8px',
      borderLeft: `3px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: '#CBD5E1', fontSize: '0.7rem', fontWeight: '500' }}>{label}</span>
        <span style={{ 
          color: color, 
          fontWeight: '700', 
          fontSize: '0.9rem',
          background: `${color}15`,
          padding: '2px 8px',
          borderRadius: '4px'
        }}>{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, ${color} 0%, ${color} ${value}%, rgba(100,116,139,0.3) ${value}%, rgba(100,116,139,0.3) 100%)`,
          appearance: 'none',
          cursor: 'pointer',
          outline: 'none'
        }}
      />
      <div style={{ color: '#64748B', fontSize: '0.55rem', marginTop: '4px' }}>{description}</div>
    </div>
  );
}

export default function ROICalculator({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'facility' | 'network' | 'methodology'>('facility');
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULT_FACILITY);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [networkSize, setNetworkSize] = useState(25);
  
  const facilityROI = calculateROI(inputs, assumptions);
  const networkROI = {
    ...facilityROI,
    annualDetentionSavings: facilityROI.annualDetentionSavings * networkSize,
    annualLaborSavings: facilityROI.annualLaborSavings * networkSize,
    annualGhostSavings: facilityROI.annualGhostSavings * networkSize,
    totalAnnualROI: facilityROI.totalAnnualROI * networkSize,
  };

  const resetAssumptions = () => setAssumptions(DEFAULT_ASSUMPTIONS);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatNumber = (value: number, decimals = 1) => 
    value.toFixed(decimals);

  // Input field component with tooltip
  const InputField = ({ 
    inputKey, 
    label, 
    icon, 
    unit,
    min = 0,
    max,
    step = 1
  }: { 
    inputKey: keyof ROIInputs; 
    label: string; 
    icon: string;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', color: '#94A3B8', fontSize: '0.6rem', marginBottom: '4px', textTransform: 'uppercase' }}>
        <span style={{ color: '#64748B' }}>{icon}</span>
        <span style={{ marginLeft: '6px' }}>{label}</span>
        {unit && <span style={{ color: '#64748B', marginLeft: '4px' }}>({unit})</span>}
        <Tooltip text={TOOLTIPS[inputKey]} />
      </label>
      <input
        type="number"
        value={inputs[inputKey]}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setInputs({ ...inputs, [inputKey]: Number(e.target.value) })}
        style={{
          width: '100%',
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          color: '#E2E8F0',
          padding: '8px 10px',
          borderRadius: '6px',
          fontSize: '0.85rem'
        }}
      />
    </div>
  );

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
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 2999
        }} 
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, rgba(15, 20, 25, 0.98) 0%, rgba(10, 14, 20, 0.98) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
        color: '#E2E8F0',
        fontFamily: '"Inter", -apple-system, sans-serif',
        zIndex: 3000,
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.1)',
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
          <div>
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
            <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748B' }}>
              Defensible projections based on FreightRoll customer data
            </p>
          </div>
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
          {([
            { key: 'facility', label: '◇ Single Facility' },
            { key: 'network', label: '◈ Network-Wide' },
            { key: 'methodology', label: '◎ How It\'s Calculated' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '14px',
                background: activeTab === tab.key ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #3B82F6' : '2px solid transparent',
                color: activeTab === tab.key ? '#3B82F6' : '#64748B',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Methodology Tab */}
        {activeTab === 'methodology' && (
          <div style={{ padding: '25px' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.05)', 
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#3B82F6', margin: '0 0 15px 0', fontSize: '0.8rem', letterSpacing: '1px' }}>
                ◎ CALCULATION METHODOLOGY
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.7rem', lineHeight: '1.6', margin: 0 }}>
                These projections are based on aggregated performance data from FreightRoll deployments. 
                All assumptions are conservative and represent typical improvements seen within the first 90 days of implementation.
              </p>
            </div>

            {/* Assumptions */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#F59E0B', fontSize: '0.7rem', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ▲ Core Assumptions
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <AssumptionSlider
                  label="Turn Time Reduction"
                  value={assumptions.turnTimeReduction}
                  onChange={(v) => setAssumptions({ ...assumptions, turnTimeReduction: v })}
                  color="#10B981"
                  description="Average improvement in gate-to-gate time"
                  max={50}
                />
                <AssumptionSlider
                  label="Detention Rate Reduction"
                  value={assumptions.detentionRateReduction}
                  onChange={(v) => setAssumptions({ ...assumptions, detentionRateReduction: v })}
                  color="#F59E0B"
                  description="Fewer loads exceeding free time threshold"
                  max={80}
                />
                <AssumptionSlider
                  label="Yard Check Reduction"
                  value={assumptions.yardCheckReduction}
                  onChange={(v) => setAssumptions({ ...assumptions, yardCheckReduction: v })}
                  color="#3B82F6"
                  description="Fewer manual audits with real-time visibility"
                  max={90}
                />
                <AssumptionSlider
                  label="Ghost Search Reduction"
                  value={assumptions.ghostReduction}
                  onChange={(v) => setAssumptions({ ...assumptions, ghostReduction: v })}
                  color="#8B5CF6"
                  description="Near-elimination of lost asset hunts"
                  max={100}
                />
              </div>
              <button
                onClick={resetAssumptions}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px dashed rgba(100, 116, 139, 0.4)',
                  borderRadius: '6px',
                  color: '#64748B',
                  fontSize: '0.6rem',
                  cursor: 'pointer'
                }}
              >
                ↺ Reset to Defaults
              </button>
            </div>

            {/* Formulas */}
            <div>
              <h4 style={{ color: '#10B981', fontSize: '0.7rem', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ◉ Formulas (Human Readable)
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Detention Formula */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: '600', marginBottom: '8px' }}>
                    DETENTION SAVINGS
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.65rem', 
                    color: '#CBD5E1',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '10px',
                    borderRadius: '4px',
                    lineHeight: '1.8'
                  }}>
                    <div>Current Detention Hours/Day = </div>
                    <div style={{ paddingLeft: '12px', color: '#94A3B8' }}>
                      (Loads × Detention Rate) × max(0, Avg Turn Time − Threshold) ÷ 60
                    </div>
                    <div style={{ marginTop: '8px' }}>With FreightRoll:</div>
                    <div style={{ paddingLeft: '12px', color: '#10B981' }}>
                      • Turn time reduced by <strong>{assumptions.turnTimeReduction}%</strong>
                    </div>
                    <div style={{ paddingLeft: '12px', color: '#F59E0B' }}>
                      • Detention incidents reduced by <strong>{assumptions.detentionRateReduction}%</strong>
                    </div>
                    <div style={{ marginTop: '8px' }}>Annual Savings = Hours Saved × $/Hour × 365</div>
                  </div>
                </div>

                {/* Labor Formula */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ color: '#3B82F6', fontSize: '0.7rem', fontWeight: '600', marginBottom: '8px' }}>
                    LABOR SAVINGS (Yard Checks)
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.65rem', 
                    color: '#CBD5E1',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '10px',
                    borderRadius: '4px',
                    lineHeight: '1.8'
                  }}>
                    <div>Checks Eliminated = Checks/Day × <span style={{ color: '#3B82F6' }}><strong>{assumptions.yardCheckReduction}%</strong></span> reduction</div>
                    <div>Hours Saved/Day = Checks Eliminated × 30 min ÷ 60</div>
                    <div>Annual Savings = Hours Saved × Labor Rate × 365</div>
                  </div>
                </div>

                {/* Ghost Formula */}
                <div style={{
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <div style={{ color: '#8B5CF6', fontSize: '0.7rem', fontWeight: '600', marginBottom: '8px' }}>
                    GHOST SEARCH SAVINGS
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.65rem', 
                    color: '#CBD5E1',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '10px',
                    borderRadius: '4px',
                    lineHeight: '1.8'
                  }}>
                    <div>Searches Eliminated = Searches/Week × <span style={{ color: '#8B5CF6' }}><strong>{assumptions.ghostReduction}%</strong></span> reduction</div>
                    <div>Hours Saved/Week = Searches Eliminated × Search Time ÷ 60</div>
                    <div>Annual Savings = Hours Saved × Labor Rate × 52 weeks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* What moves ROI */}
            <div style={{ marginTop: '25px' }}>
              <h4 style={{ color: '#F59E0B', fontSize: '0.7rem', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ◆ What Moves ROI The Most?
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { lever: 'Loads/Day', impact: 'High', desc: 'More volume = more savings' },
                  { lever: 'Detention Rate', impact: 'High', desc: 'Higher rate = bigger opportunity' },
                  { lever: 'Turn Time', impact: 'Medium', desc: 'Longer turns = more detention' },
                  { lever: 'Ghost Searches', impact: 'Medium', desc: 'More chaos = more value' },
                  { lever: 'Labor Cost', impact: 'Low', desc: 'Scales labor savings linearly' },
                  { lever: 'Network Size', impact: 'High', desc: 'Multiplier for all savings' },
                ].map(item => (
                  <div key={item.lever} style={{
                    background: 'rgba(30, 41, 59, 0.3)',
                    padding: '10px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#E2E8F0', fontSize: '0.7rem', fontWeight: '600' }}>{item.lever}</div>
                    <div style={{ 
                      color: item.impact === 'High' ? '#10B981' : item.impact === 'Medium' ? '#F59E0B' : '#64748B',
                      fontSize: '0.6rem',
                      marginTop: '4px'
                    }}>
                      {item.impact} Impact
                    </div>
                    <div style={{ color: '#64748B', fontSize: '0.55rem', marginTop: '2px' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Facility/Network Content */}
        {activeTab !== 'methodology' && (
          <div style={{ padding: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            {/* Left: Inputs */}
            <div>
              <h3 style={{ color: '#3B82F6', margin: '0 0 15px 0', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                ◎ Your Facility Metrics
              </h3>
              
              {activeTab === 'network' && (
                <div style={{ 
                  marginBottom: '20px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#3B82F6', fontSize: '0.65rem', marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                    ◈ Number of Facilities
                    <Tooltip text="Total facilities in your network. ROI will be multiplied across all facilities assuming similar operations." />
                  </label>
                  <input
                    type="number"
                    value={networkSize}
                    onChange={(e) => setNetworkSize(Number(e.target.value))}
                    min={1}
                    max={500}
                    style={{
                      width: '100%',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#3B82F6',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </div>
              )}
              
              {/* Volume Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#64748B', fontSize: '0.55rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Volume
                </div>
                <InputField inputKey="loadsPerDay" label="Loads per Day" icon="◇" />
              </div>

              {/* Turn Time & Detention Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#64748B', fontSize: '0.55rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Turn Time & Detention
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <InputField inputKey="avgTurnTime" label="Avg Turn Time" icon="◷" unit="Gate-in → Gate-out, min" />
                  <InputField inputKey="detentionThreshold" label="Detention Threshold" icon="⏱" unit="free time, min" />
                  <InputField inputKey="detentionRate" label="Detention Rate" icon="%" unit="% of loads" min={0} max={100} />
                  <InputField inputKey="detentionCostPerHour" label="Detention Cost" icon="$" unit="$/hour" />
                </div>
              </div>

              {/* Labor Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#64748B', fontSize: '0.55rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Labor & Yard Operations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <InputField inputKey="yardChecksPerDay" label="Manual Yard Checks" icon="◎" unit="/day" />
                  <InputField inputKey="laborCostPerHour" label="Labor Cost" icon="◉" unit="$/hour" />
                </div>
              </div>

              {/* Ghost Section */}
              <div>
                <div style={{ color: '#64748B', fontSize: '0.55rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Asset Visibility
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <InputField inputKey="ghostSearchesPerWeek" label="Ghost Searches" icon="◌" unit="/week" />
                  <InputField inputKey="searchTimeMinutes" label="Avg Search Time" icon="⧗" unit="min/search" />
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div>
              <h3 style={{ color: '#10B981', margin: '0 0 15px 0', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                ▲ Projected Annual Savings
              </h3>
              
              {/* Total ROI Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ color: '#94A3B8', fontSize: '0.6rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activeTab === 'facility' ? 'Annual Facility ROI' : `Annual Network ROI (${networkSize} facilities)`}
                </div>
                <div style={{ 
                  fontSize: '2.4rem', 
                  fontWeight: '700', 
                  color: '#10B981',
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                }}>
                  {formatCurrency(activeTab === 'facility' ? facilityROI.totalAnnualROI : networkROI.totalAnnualROI)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.6rem' }}>Payback: </span>
                    <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: '600' }}>
                      {facilityROI.paybackMonths < 12 ? `${facilityROI.paybackMonths} months` : '< 1 month'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '0.6rem' }}>Per Load: </span>
                    <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: '600' }}>
                      {formatCurrency(facilityROI.savingsPerLoad)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detention Details */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '0.65rem' }}>◷ Detention Savings</span>
                  <span style={{ color: '#10B981', fontWeight: '700', fontSize: '1rem' }}>
                    {formatCurrency(activeTab === 'facility' ? facilityROI.annualDetentionSavings : networkROI.annualDetentionSavings)}
                  </span>
                </div>
                <div style={{ fontSize: '0.55rem', color: '#64748B', display: 'flex', gap: '15px' }}>
                  <span>Current: {formatNumber(facilityROI.currentDetentionHoursPerDay)} hrs/day</span>
                  <span>→</span>
                  <span style={{ color: '#10B981' }}>Projected: {formatNumber(facilityROI.projectedDetentionHoursPerDay)} hrs/day</span>
                </div>
              </div>

              {/* Other Savings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { 
                    label: 'Labor Savings', 
                    sublabel: 'Reduced yard checks',
                    value: activeTab === 'facility' ? facilityROI.annualLaborSavings : networkROI.annualLaborSavings, 
                    color: '#3B82F6', 
                    icon: '◉' 
                  },
                  { 
                    label: 'Ghost Search Savings', 
                    sublabel: 'Eliminated asset hunts',
                    value: activeTab === 'facility' ? facilityROI.annualGhostSavings : networkROI.annualGhostSavings, 
                    color: '#8B5CF6', 
                    icon: '◌' 
                  },
                ].map(({ label, sublabel, value, color, icon }) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${color}`
                  }}>
                    <div>
                      <div style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>{icon} {label}</div>
                      <div style={{ color: '#64748B', fontSize: '0.55rem' }}>{sublabel}</div>
                    </div>
                    <span style={{ color, fontWeight: '600', fontSize: '0.95rem' }}>{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>

              {/* Throughput */}
              <div style={{
                marginTop: '15px',
                padding: '15px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#F59E0B', fontSize: '1.6rem', fontWeight: '700' }}>
                  +{facilityROI.throughputIncrease}%
                </div>
                <div style={{ color: '#94A3B8', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Throughput Increase
                </div>
                <div style={{ color: '#64748B', fontSize: '0.55rem', marginTop: '4px' }}>
                  Faster turns = more trucks/day capacity
                </div>
              </div>

              {/* View Methodology Link */}
              <button
                onClick={() => setActiveTab('methodology')}
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '10px',
                  background: 'transparent',
                  border: '1px dashed rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#64748B',
                  fontSize: '0.6rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ◎ How are these projections calculated? →
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '12px 25px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(10, 14, 20, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.6rem',
          color: '#64748B'
        }}>
          <span>
            Current: <span style={{ color: '#10B981' }}>{assumptions.turnTimeReduction}%</span> turn time ↓ · <span style={{ color: '#F59E0B' }}>{assumptions.detentionRateReduction}%</span> detention ↓ · <span style={{ color: '#3B82F6' }}>{assumptions.yardCheckReduction}%</span> yard checks ↓ · <span style={{ color: '#8B5CF6' }}>{assumptions.ghostReduction}%</span> ghost ↓
          </span>
          <span style={{ color: '#3B82F6' }}>
            Adjust in "How It's Calculated" tab
          </span>
        </div>
      </div>
    </>
  );
}
