import React, { useMemo, useState } from 'react';
import { 
  PrimoFacility, 
  PRIMO_FACILITIES,
  calculateRiskProfile, 
  getNetworkRiskAnalysis,
  COMPETITORS,
  RiskLevel,
  FacilityRiskProfile
} from '../data/primo-facilities';

/**
 * =============================================================================
 * RISK & COMPETITIVE ANALYSIS PANEL
 * =============================================================================
 * 
 * Dr. Phiroz Methodology: Know your risks, know your competition.
 * 
 * Three critical questions:
 * 1. Which facilities are hard to implement? (Risk scoring)
 * 2. How many people do we need? (Resource allocation)
 * 3. Who's trying to steal our deal? (Competitive threats)
 */

interface RiskCompetitivePanelProps {
  onSelectFacility: (facility: PrimoFacility) => void;
  onClose: () => void;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B', 
  HIGH: '#EF4444',
  CRITICAL: '#DC2626'
};

const formatCurrency = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

export default function RiskCompetitivePanel({ onSelectFacility, onClose }: RiskCompetitivePanelProps) {
  const [activeTab, setActiveTab] = useState<'risk' | 'resources' | 'competitive'>('competitive');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('vector');
  
  const networkAnalysis = useMemo(() => getNetworkRiskAnalysis(), []);
  
  // Get facilities with risk profiles
  const facilitiesWithRisk = useMemo(() => {
    return PRIMO_FACILITIES
      .filter(f => f.adoptionStatus === 'not_started')
      .map(f => ({ facility: f, risk: calculateRiskProfile(f) }))
      .sort((a, b) => b.risk.riskScore - a.risk.riskScore);
  }, []);
  
  // Group by risk level
  const byRiskLevel = useMemo(() => {
    const groups: Record<RiskLevel, typeof facilitiesWithRisk> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    };
    facilitiesWithRisk.forEach(item => {
      groups[item.risk.overallRisk].push(item);
    });
    return groups;
  }, [facilitiesWithRisk]);
  
  // Facilities threatened by selected competitor
  const threatenedFacilities = useMemo(() => {
    const competitorName = selectedCompetitor === 'vector' ? 'Vector' :
                          selectedCompetitor === 'blueyonder' ? 'Blue Yonder' :
                          selectedCompetitor === 'fourkites' ? 'FourKites' :
                          selectedCompetitor === 'descartes' ? 'Descartes' : 'Trimble';
    
    return facilitiesWithRisk.filter(item => 
      item.risk.activeCompetitors.includes(competitorName)
    );
  }, [facilitiesWithRisk, selectedCompetitor]);
  
  // Resource allocation by wave (state)
  const resourcesByWave = useMemo(() => {
    const byState: Record<string, { 
      facilities: number;
      engineers: number;
      weeks: number;
      totalROI: number;
      criticalCount: number;
    }> = {};
    
    facilitiesWithRisk.forEach(({ facility, risk }) => {
      if (!byState[facility.state]) {
        byState[facility.state] = { facilities: 0, engineers: 0, weeks: 0, totalROI: 0, criticalCount: 0 };
      }
      byState[facility.state].facilities++;
      byState[facility.state].engineers += risk.fieldEngineersNeeded;
      byState[facility.state].weeks += risk.implementationWeeks;
      byState[facility.state].totalROI += facility.projectedAnnualROI;
      if (risk.overallRisk === 'CRITICAL' || risk.overallRisk === 'HIGH') {
        byState[facility.state].criticalCount++;
      }
    });
    
    return Object.entries(byState)
      .map(([state, data]) => ({ state, ...data }))
      .sort((a, b) => b.totalROI - a.totalROI);
  }, [facilitiesWithRisk]);

  const competitor = COMPETITORS[selectedCompetitor as keyof typeof COMPETITORS];

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 5, 15, 0.95)',
          zIndex: 6000
        }}
      />

      {/* Main Panel */}
      <div style={{
        position: 'fixed',
        top: '3%', left: '3%', right: '3%', bottom: '3%',
        background: 'linear-gradient(180deg, rgba(10, 15, 25, 0.98), rgba(5, 10, 20, 0.98))',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Inter", -apple-system, sans-serif',
        color: '#E2E8F0',
        zIndex: 6001,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚔️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#E2E8F0' }}>
                Risk & Competitive Intelligence
              </h1>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                {networkAnalysis.totalPending} pending facilities • {networkAnalysis.criticalRisk + networkAnalysis.highRisk} high-risk
              </span>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#EF4444' }}>
                {networkAnalysis.vectorThreat}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Vector Threat</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#F59E0B' }}>
                {formatCurrency(networkAnalysis.atRiskROI)}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748B' }}>At-Risk ROI</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#3B82F6' }}>
                {networkAnalysis.totalFieldEngineers}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Engineers Needed</div>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                color: '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'rgba(5, 10, 20, 0.5)'
        }}>
          {[
            { id: 'competitive', label: '⚔️ Competitive Threats', color: '#EF4444' },
            { id: 'risk', label: '⚠️ Risk Scoring', color: '#F59E0B' },
            { id: 'resources', label: '👷 Resource Allocation', color: '#3B82F6' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '14px 24px',
                background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                color: activeTab === tab.id ? tab.color : '#64748B',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          
          {/* COMPETITIVE THREATS TAB */}
          {activeTab === 'competitive' && (
            <>
              {/* Left: Competitor Selection */}
              <div style={{ 
                width: '280px', 
                borderRight: '1px solid rgba(239, 68, 68, 0.15)',
                overflowY: 'auto',
                background: 'rgba(5, 10, 20, 0.5)'
              }}>
                <div style={{ padding: '16px', fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                  🎯 Competitor Profiles
                </div>
                
                {Object.entries(COMPETITORS).map(([key, comp]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedCompetitor(key)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
                      cursor: 'pointer',
                      background: selectedCompetitor === key ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                      borderLeft: selectedCompetitor === key ? '3px solid #EF4444' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#E2E8F0' }}>
                        {comp.name}
                      </div>
                      <span style={{
                        fontSize: '0.55rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: comp.threat === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' :
                                   comp.threat === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        color: comp.threat === 'HIGH' ? '#EF4444' :
                               comp.threat === 'MEDIUM' ? '#F59E0B' : '#64748B',
                        fontWeight: '600'
                      }}>
                        {comp.threat}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                      {comp.focus}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Center: Competitor Details */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '600px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: competitor.threat === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {competitor.name === 'Vector' ? '📄' :
                       competitor.name === 'Blue Yonder' ? '🏢' :
                       competitor.name === 'FourKites' ? '📍' :
                       competitor.name === 'Descartes' ? '🛃' : '🚛'}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{competitor.name}</h2>
                      <div style={{ color: '#64748B', fontSize: '0.85rem' }}>{competitor.focus}</div>
                    </div>
                  </div>
                  
                  <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                    {competitor.description}
                  </p>
                  
                  {/* Their Weaknesses */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '0.75rem', 
                      color: '#10B981', 
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>
                      ✓ Their Weaknesses (Our Advantages)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {competitor.weaknesses.map((weakness, i) => (
                        <div key={i} style={{
                          padding: '10px 14px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#E2E8F0'
                        }}>
                          {weakness}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* At-Risk Profile */}
                  <div style={{
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px'
                  }}>
                    <h3 style={{ 
                      fontSize: '0.75rem', 
                      color: '#EF4444', 
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      margin: 0
                    }}>
                      ⚠️ Facilities at Risk
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: '8px 0 0 0' }}>
                      {competitor.facilities_at_risk}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right: Threatened Facilities */}
              <div style={{ 
                width: '340px',
                borderLeft: '1px solid rgba(239, 68, 68, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(5, 10, 20, 0.5)'
              }}>
                <div style={{ 
                  padding: '16px',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
                  background: 'rgba(239, 68, 68, 0.05)'
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#EF4444', textTransform: 'uppercase', fontWeight: '600' }}>
                    🎯 {competitor.name} Target Facilities ({threatenedFacilities.length})
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>
                    {formatCurrency(threatenedFacilities.reduce((sum, f) => sum + f.facility.projectedAnnualROI, 0))} annual ROI at risk
                  </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {threatenedFacilities.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                      No facilities at high risk from {competitor.name}
                    </div>
                  ) : (
                    threatenedFacilities.map(({ facility, risk }) => (
                      <div
                        key={facility.id}
                        onClick={() => onSelectFacility(facility)}
                        style={{
                          padding: '14px 16px',
                          borderBottom: '1px solid rgba(239, 68, 68, 0.08)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.8rem', color: '#E2E8F0' }}>
                            {facility.name.split(' - ')[0]}
                          </div>
                          <span style={{ color: '#10B981', fontSize: '0.75rem' }}>
                            {formatCurrency(facility.projectedAnnualROI)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '4px' }}>
                          {facility.location} • {facility.dockDoors} doors • {facility.paperDocuments} paper/day
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          marginTop: '6px',
                          fontSize: '0.55rem'
                        }}>
                          {risk.factors.paperHeavy && (
                            <span style={{ 
                              padding: '2px 6px', 
                              background: 'rgba(239, 68, 68, 0.2)',
                              borderRadius: '4px',
                              color: '#EF4444'
                            }}>
                              PAPER HEAVY
                            </span>
                          )}
                          {risk.factors.highVolume && (
                            <span style={{ 
                              padding: '2px 6px', 
                              background: 'rgba(245, 158, 11, 0.2)',
                              borderRadius: '4px',
                              color: '#F59E0B'
                            }}>
                              HIGH VOLUME
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {threatenedFacilities.length > 0 && (
                  <div style={{ 
                    padding: '16px',
                    borderTop: '1px solid rgba(239, 68, 68, 0.15)',
                    background: 'rgba(239, 68, 68, 0.05)'
                  }}>
                    <button style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}>
                      🚨 PRIORITIZE THESE {threatenedFacilities.length} FACILITIES
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* RISK SCORING TAB */}
          {activeTab === 'risk' && (
            <>
              {/* Risk Overview */}
              <div style={{ 
                width: '300px',
                borderRight: '1px solid rgba(245, 158, 11, 0.15)',
                padding: '20px',
                background: 'rgba(5, 10, 20, 0.5)'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
                  📊 Risk Distribution
                </div>
                
                {/* Risk Level Bars */}
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map(level => (
                  <div key={level} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: RISK_COLORS[level], fontWeight: '600' }}>
                        {level}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {byRiskLevel[level].length} facilities
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'rgba(100, 116, 139, 0.2)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(byRiskLevel[level].length / facilitiesWithRisk.length) * 100}%`,
                        background: RISK_COLORS[level],
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>
                ))}
                
                {/* Risk Factors Legend */}
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Risk Factors
                  </div>
                  {[
                    { label: 'Low YVS (<50)', points: '+25', color: '#EF4444' },
                    { label: 'High Turn Time (>45m)', points: '+20', color: '#F59E0B' },
                    { label: 'Complex Layout', points: '+20', color: '#A855F7' },
                    { label: 'Paper Heavy (>10/day)', points: '+20', color: '#EC4899' },
                    { label: 'High Volume (>60/day)', points: '+15', color: '#3B82F6' },
                  ].map(factor => (
                    <div key={factor.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      fontSize: '0.7rem'
                    }}>
                      <span style={{ color: '#94A3B8' }}>{factor.label}</span>
                      <span style={{ color: factor.color, fontWeight: '600' }}>{factor.points}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Facility Risk List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '12px'
                }}>
                  {facilitiesWithRisk.slice(0, 50).map(({ facility, risk }) => (
                    <div
                      key={facility.id}
                      onClick={() => onSelectFacility(facility)}
                      style={{
                        padding: '16px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: `1px solid ${RISK_COLORS[risk.overallRisk]}30`,
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#E2E8F0' }}>
                            {facility.name.split(' - ')[0]}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>
                            {facility.location}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 10px',
                          background: `${RISK_COLORS[risk.overallRisk]}20`,
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          color: RISK_COLORS[risk.overallRisk]
                        }}>
                          {risk.riskScore}
                        </div>
                      </div>
                      
                      {/* Risk Factors */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                        {risk.factors.lowYVS && (
                          <span style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderRadius: '4px' }}>
                            LOW YVS
                          </span>
                        )}
                        {risk.factors.highTurnTime && (
                          <span style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', borderRadius: '4px' }}>
                            SLOW TURNS
                          </span>
                        )}
                        {risk.factors.complexLayout && (
                          <span style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(139, 92, 246, 0.15)', color: '#A855F7', borderRadius: '4px' }}>
                            COMPLEX
                          </span>
                        )}
                        {risk.factors.paperHeavy && (
                          <span style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899', borderRadius: '4px' }}>
                            PAPER
                          </span>
                        )}
                        {risk.factors.highVolume && (
                          <span style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', borderRadius: '4px' }}>
                            HIGH VOL
                          </span>
                        )}
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(100, 116, 139, 0.15)',
                        fontSize: '0.65rem',
                        color: '#64748B'
                      }}>
                        <span>~{risk.implementationWeeks} weeks</span>
                        <span>{risk.fieldEngineersNeeded} engineer{risk.fieldEngineersNeeded > 1 ? 's' : ''}</span>
                        <span style={{ color: '#10B981' }}>{formatCurrency(facility.projectedAnnualROI)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* RESOURCE ALLOCATION TAB */}
          {activeTab === 'resources' && (
            <>
              {/* Resource Summary */}
              <div style={{
                width: '320px',
                borderRight: '1px solid rgba(59, 130, 246, 0.15)',
                padding: '20px',
                background: 'rgba(5, 10, 20, 0.5)'
              }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
                  👷 Resource Requirements
                </div>
                
                {/* Total Requirements */}
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3B82F6' }}>
                        {networkAnalysis.totalFieldEngineers}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Total Engineer-Deployments</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#A855F7' }}>
                        {networkAnalysis.avgImplementationWeeks}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Avg Weeks/Facility</div>
                    </div>
                  </div>
                </div>
                
                {/* Team Sizing Calculator */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: '12px' }}>
                    Team Sizing (52-week deployment)
                  </div>
                  
                  {[
                    { engineers: 4, weeks: Math.ceil(networkAnalysis.totalFieldEngineers / 4), pace: 'Conservative' },
                    { engineers: 8, weeks: Math.ceil(networkAnalysis.totalFieldEngineers / 8), pace: 'Standard' },
                    { engineers: 12, weeks: Math.ceil(networkAnalysis.totalFieldEngineers / 12), pace: 'Aggressive' },
                  ].map(scenario => (
                    <div key={scenario.engineers} style={{
                      padding: '12px',
                      background: scenario.engineers === 8 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                      border: scenario.engineers === 8 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(100, 116, 139, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '600', color: '#E2E8F0', fontSize: '0.8rem' }}>
                          {scenario.engineers} Engineers
                        </span>
                        <span style={{ 
                          fontSize: '0.65rem',
                          color: scenario.weeks <= 52 ? '#10B981' : '#EF4444'
                        }}>
                          {scenario.weeks} weeks
                        </span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '4px' }}>
                        {scenario.pace} • {Math.round(networkAnalysis.totalPending / scenario.weeks * 10) / 10} facilities/week
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Cost Estimate */}
                <div style={{
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '10px'
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#10B981', textTransform: 'uppercase', marginBottom: '8px' }}>
                    💰 Implementation Budget
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>
                    {formatCurrency(networkAnalysis.totalPending * 48000)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '4px' }}>
                    {networkAnalysis.totalPending} facilities × $48K avg
                  </div>
                </div>
              </div>
              
              {/* Resource by Wave */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '16px' }}>
                  📍 Resources by Region (sorted by ROI)
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.2)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '0.65rem', color: '#64748B', fontWeight: '600' }}>Region</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.65rem', color: '#64748B', fontWeight: '600' }}>Facilities</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.65rem', color: '#64748B', fontWeight: '600' }}>Engineers</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.65rem', color: '#64748B', fontWeight: '600' }}>Weeks</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '0.65rem', color: '#64748B', fontWeight: '600' }}>High Risk</th>
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '0.65rem', color: '#64748B', fontWeight: '600' }}>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourcesByWave.map((wave, idx) => (
                      <tr 
                        key={wave.state}
                        style={{ 
                          borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
                          background: idx < 3 ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: '600', color: '#E2E8F0', fontSize: '0.85rem' }}>
                            {wave.state}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px', fontSize: '0.85rem', color: '#94A3B8' }}>
                          {wave.facilities}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            color: '#3B82F6'
                          }}>
                            {wave.engineers}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px', fontSize: '0.85rem', color: '#94A3B8' }}>
                          {wave.weeks}
                        </td>
                        <td style={{ textAlign: 'center', padding: '14px 8px' }}>
                          {wave.criticalCount > 0 ? (
                            <span style={{
                              padding: '4px 10px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#EF4444'
                            }}>
                              {wave.criticalCount}
                            </span>
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', padding: '14px 8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10B981' }}>
                            {formatCurrency(wave.totalROI)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <td style={{ padding: '14px 8px', fontWeight: '700', color: '#E2E8F0' }}>TOTAL</td>
                      <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: '700', color: '#E2E8F0' }}>
                        {resourcesByWave.reduce((sum, w) => sum + w.facilities, 0)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: '700', color: '#3B82F6' }}>
                        {resourcesByWave.reduce((sum, w) => sum + w.engineers, 0)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: '700', color: '#E2E8F0' }}>
                        {resourcesByWave.reduce((sum, w) => sum + w.weeks, 0)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '14px 8px', fontWeight: '700', color: '#EF4444' }}>
                        {resourcesByWave.reduce((sum, w) => sum + w.criticalCount, 0)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '14px 8px', fontWeight: '700', color: '#10B981' }}>
                        {formatCurrency(resourcesByWave.reduce((sum, w) => sum + w.totalROI, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
