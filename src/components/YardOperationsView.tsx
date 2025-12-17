import React, { useState, useMemo } from 'react';
import { PrimoFacility } from '../data/primo-facilities';

/**
 * =============================================================================
 * YARD OPERATIONS VIEW
 * =============================================================================
 * 
 * Dr. Phiroz Approach: Real-time yard state visualization.
 * 
 * This is where YMS earns its money - dock door utilization,
 * yard spot management, and trailer location tracking.
 * 
 * No searching. No guessing. Everything has a place.
 */

interface YardOperationsViewProps {
  facility: PrimoFacility;
  onClose: () => void;
}

// Simulated dock/yard state based on facility metrics
const generateYardState = (facility: PrimoFacility) => {
  const dockDoors: Array<{
    id: number;
    status: 'empty' | 'occupied' | 'loading' | 'unloading';
    trailerId?: string;
    carrier?: string;
    type?: 'inbound' | 'outbound' | 'live';
    dwellTime?: number; // minutes at door
    eta?: number; // minutes until complete
  }> = [];

  const yardSpots: Array<{
    id: string;
    row: string;
    spot: number;
    status: 'empty' | 'occupied' | 'reserved';
    trailerId?: string;
    carrier?: string;
    type?: 'loaded' | 'empty' | 'priority';
    dwellHours?: number;
  }> = [];

  // Generate dock door states
  const occupancyRate = facility.hasYMS ? 0.65 : 0.8; // YMS = better utilization
  for (let i = 1; i <= facility.dockDoors; i++) {
    const isOccupied = Math.random() < occupancyRate;
    if (isOccupied) {
      const statusRoll = Math.random();
      dockDoors.push({
        id: i,
        status: statusRoll < 0.4 ? 'loading' : statusRoll < 0.8 ? 'unloading' : 'occupied',
        trailerId: `TR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        carrier: ['Schneider', 'J.B. Hunt', 'Werner', 'Swift', 'Primo Fleet'][Math.floor(Math.random() * 5)],
        type: Math.random() < 0.6 ? 'inbound' : 'outbound',
        dwellTime: Math.floor(Math.random() * 90) + 15,
        eta: Math.floor(Math.random() * 45) + 5
      });
    } else {
      dockDoors.push({ id: i, status: 'empty' });
    }
  }

  // Generate yard spots in rows
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const spotsPerRow = Math.ceil(facility.yardSpots / rows.length);
  let spotCount = 0;

  for (const row of rows) {
    for (let i = 1; i <= spotsPerRow && spotCount < facility.yardSpots; i++) {
      spotCount++;
      const isOccupied = Math.random() < (facility.detectedTrailers / facility.yardSpots);
      if (isOccupied) {
        yardSpots.push({
          id: `${row}${i}`,
          row,
          spot: i,
          status: 'occupied',
          trailerId: `TR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          carrier: ['Schneider', 'J.B. Hunt', 'Werner', 'Swift', 'Primo Fleet'][Math.floor(Math.random() * 5)],
          type: Math.random() < 0.3 ? 'empty' : Math.random() < 0.5 ? 'priority' : 'loaded',
          dwellHours: Math.floor(Math.random() * 48)
        });
      } else if (Math.random() < 0.1) {
        yardSpots.push({
          id: `${row}${i}`,
          row,
          spot: i,
          status: 'reserved'
        });
      } else {
        yardSpots.push({
          id: `${row}${i}`,
          row,
          spot: i,
          status: 'empty'
        });
      }
    }
  }

  // Generate upcoming appointments
  const appointments: Array<{
    trailerId: string;
    carrier: string;
    type: 'inbound' | 'outbound';
    eta: number; // minutes
    assignedDoor?: number;
  }> = [];

  const upcomingCount = Math.floor(facility.trucksPerDay / 8); // ~4 hour window
  for (let i = 0; i < upcomingCount; i++) {
    appointments.push({
      trailerId: `TR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      carrier: ['Schneider', 'J.B. Hunt', 'Werner', 'Swift', 'Primo Fleet'][Math.floor(Math.random() * 5)],
      type: Math.random() < 0.6 ? 'inbound' : 'outbound',
      eta: Math.floor(Math.random() * 240) + 15,
      assignedDoor: facility.hasYMS ? Math.floor(Math.random() * facility.dockDoors) + 1 : undefined
    });
  }
  appointments.sort((a, b) => a.eta - b.eta);

  return { dockDoors, yardSpots, appointments };
};

const formatDwell = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function YardOperationsView({ facility, onClose }: YardOperationsViewProps) {
  const [selectedDoor, setSelectedDoor] = useState<number | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);

  const yardState = useMemo(() => generateYardState(facility), [facility]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const occupiedDoors = yardState.dockDoors.filter(d => d.status !== 'empty').length;
    const occupiedSpots = yardState.yardSpots.filter(s => s.status === 'occupied').length;
    const avgDoorDwell = yardState.dockDoors
      .filter(d => d.dwellTime)
      .reduce((sum, d) => sum + (d.dwellTime || 0), 0) / Math.max(occupiedDoors, 1);
    const priorityTrailers = yardState.yardSpots.filter(s => s.type === 'priority').length;
    const longDwells = yardState.yardSpots.filter(s => s.dwellHours && s.dwellHours > 24).length;

    return {
      doorUtilization: Math.round((occupiedDoors / facility.dockDoors) * 100),
      yardUtilization: Math.round((occupiedSpots / facility.yardSpots) * 100),
      avgDoorDwell: Math.round(avgDoorDwell),
      occupiedDoors,
      occupiedSpots,
      priorityTrailers,
      longDwells,
      upcomingCount: yardState.appointments.length
    };
  }, [yardState, facility]);

  // Group yard spots by row
  const spotsByRow = useMemo(() => {
    const grouped: Record<string, typeof yardState.yardSpots> = {};
    yardState.yardSpots.forEach(spot => {
      if (!grouped[spot.row]) grouped[spot.row] = [];
      grouped[spot.row].push(spot);
    });
    return grouped;
  }, [yardState]);

  const selectedDoorData = selectedDoor 
    ? yardState.dockDoors.find(d => d.id === selectedDoor) 
    : null;

  const selectedSpotData = selectedSpot
    ? yardState.yardSpots.find(s => s.id === selectedSpot)
    : null;

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
        top: '5%', left: '5%', right: '5%', bottom: '5%',
        background: 'linear-gradient(180deg, rgba(10, 15, 25, 0.98), rgba(5, 10, 20, 0.98))',
        border: '1px solid rgba(59, 130, 246, 0.3)',
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
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏭</span>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '1.2rem', 
                  fontWeight: '700',
                  color: '#E2E8F0'
                }}>
                  {facility.name}
                </h1>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {facility.location} • Yard Operations View
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                color: metrics.doorUtilization > 80 ? '#EF4444' : metrics.doorUtilization > 60 ? '#F59E0B' : '#10B981' 
              }}>
                {metrics.doorUtilization}%
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Door Util</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.4rem', 
                fontWeight: '700', 
                color: metrics.yardUtilization > 85 ? '#EF4444' : '#3B82F6' 
              }}>
                {metrics.yardUtilization}%
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Yard Util</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#A855F7' }}>
                {metrics.avgDoorDwell}m
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Avg Dwell</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60A5FA' }}>
                {metrics.upcomingCount}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#64748B' }}>Incoming</div>
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
                fontWeight: '600',
                marginLeft: '16px'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT: Dock Doors Visualization */}
          <div style={{ 
            width: '200px', 
            padding: '20px',
            borderRight: '1px solid rgba(59, 130, 246, 0.15)',
            background: 'rgba(5, 10, 20, 0.5)',
            overflowY: 'auto'
          }}>
            <div style={{ 
              fontSize: '0.65rem', 
              color: '#64748B', 
              textTransform: 'uppercase',
              marginBottom: '16px',
              letterSpacing: '1px'
            }}>
              🚪 Dock Doors ({metrics.occupiedDoors}/{facility.dockDoors})
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {yardState.dockDoors.map(door => (
                <div
                  key={door.id}
                  onClick={() => setSelectedDoor(door.id)}
                  style={{
                    padding: '12px 8px',
                    background: selectedDoor === door.id 
                      ? 'rgba(59, 130, 246, 0.3)' 
                      : door.status === 'empty' 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : door.status === 'loading'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : door.status === 'unloading'
                            ? 'rgba(139, 92, 246, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${
                      selectedDoor === door.id 
                        ? 'rgba(59, 130, 246, 0.5)'
                        : door.status === 'empty' 
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'rgba(239, 68, 68, 0.3)'
                    }`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '700',
                    color: door.status === 'empty' ? '#10B981' : '#E2E8F0'
                  }}>
                    {door.id}
                  </div>
                  <div style={{ 
                    fontSize: '0.55rem', 
                    color: '#64748B',
                    marginTop: '4px'
                  }}>
                    {door.status === 'empty' ? 'OPEN' : 
                     door.status === 'loading' ? 'LOAD' : 
                     door.status === 'unloading' ? 'UNLD' : 'BUSY'}
                  </div>
                  {door.dwellTime && (
                    <div style={{ 
                      fontSize: '0.5rem', 
                      color: door.dwellTime > 60 ? '#EF4444' : '#94A3B8',
                      marginTop: '2px'
                    }}>
                      {formatDwell(door.dwellTime)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: Yard Grid Visualization */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <div style={{ 
              fontSize: '0.65rem', 
              color: '#64748B', 
              textTransform: 'uppercase',
              marginBottom: '16px',
              letterSpacing: '1px'
            }}>
              🅿️ Yard Spots ({metrics.occupiedSpots}/{facility.yardSpots})
              {metrics.longDwells > 0 && (
                <span style={{ color: '#EF4444', marginLeft: '12px' }}>
                  ⚠️ {metrics.longDwells} long dwells (&gt;24h)
                </span>
              )}
              {metrics.priorityTrailers > 0 && (
                <span style={{ color: '#F59E0B', marginLeft: '12px' }}>
                  ⭐ {metrics.priorityTrailers} priority
                </span>
              )}
            </div>

            {/* Yard Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(spotsByRow).map(([row, spots]) => (
                <div key={row} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '24px', 
                    fontWeight: '700', 
                    color: '#64748B',
                    fontSize: '0.9rem'
                  }}>
                    {row}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {spots.map(spot => (
                      <div
                        key={spot.id}
                        onClick={() => setSelectedSpot(spot.id)}
                        style={{
                          width: '36px',
                          height: '24px',
                          background: selectedSpot === spot.id
                            ? 'rgba(59, 130, 246, 0.4)'
                            : spot.status === 'empty'
                              ? 'rgba(100, 116, 139, 0.15)'
                              : spot.status === 'reserved'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : spot.type === 'priority'
                                  ? 'rgba(245, 158, 11, 0.3)'
                                  : spot.type === 'empty'
                                    ? 'rgba(139, 92, 246, 0.25)'
                                    : 'rgba(16, 185, 129, 0.25)',
                          border: `1px solid ${
                            selectedSpot === spot.id
                              ? 'rgba(59, 130, 246, 0.6)'
                              : spot.status === 'occupied' && spot.dwellHours && spot.dwellHours > 24
                                ? 'rgba(239, 68, 68, 0.6)'
                                : 'rgba(100, 116, 139, 0.2)'
                          }`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.55rem',
                          color: spot.status === 'empty' ? '#64748B' : '#E2E8F0'
                        }}
                      >
                        {spot.status === 'occupied' ? (spot.type === 'priority' ? '⭐' : '█') : 
                         spot.status === 'reserved' ? 'R' : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginTop: '20px',
              padding: '12px',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '8px',
              fontSize: '0.6rem',
              color: '#94A3B8'
            }}>
              <span>█ Loaded</span>
              <span style={{ color: '#A855F7' }}>█ Empty trailer</span>
              <span style={{ color: '#F59E0B' }}>⭐ Priority</span>
              <span style={{ color: '#EF4444' }}>⬜ Long dwell</span>
              <span style={{ color: '#64748B' }}>⬜ Open</span>
            </div>
          </div>

          {/* RIGHT: Details Panel */}
          <div style={{ 
            width: '320px', 
            borderLeft: '1px solid rgba(59, 130, 246, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(5, 10, 20, 0.5)'
          }}>
            {/* Selection Details */}
            <div style={{ 
              padding: '20px',
              borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
              minHeight: '180px'
            }}>
              {selectedDoorData ? (
                <>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                    Door #{selectedDoorData.id}
                  </div>
                  {selectedDoorData.status === 'empty' ? (
                    <div style={{ marginTop: '12px', color: '#10B981', fontWeight: '600' }}>
                      ✓ Available for assignment
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#E2E8F0' }}>
                        {selectedDoorData.trailerId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                        {selectedDoorData.carrier}
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px',
                        marginTop: '12px'
                      }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Status</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#E2E8F0' }}>
                            {selectedDoorData.status.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Type</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#E2E8F0' }}>
                            {selectedDoorData.type?.toUpperCase() || 'N/A'}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>At Door</div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: '600', 
                            color: (selectedDoorData.dwellTime || 0) > 60 ? '#EF4444' : '#E2E8F0' 
                          }}>
                            {formatDwell(selectedDoorData.dwellTime || 0)}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>ETA Complete</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10B981' }}>
                            ~{selectedDoorData.eta}m
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : selectedSpotData ? (
                <>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', textTransform: 'uppercase' }}>
                    Spot {selectedSpotData.id}
                  </div>
                  {selectedSpotData.status === 'empty' ? (
                    <div style={{ marginTop: '12px', color: '#10B981', fontWeight: '600' }}>
                      ✓ Available
                    </div>
                  ) : selectedSpotData.status === 'reserved' ? (
                    <div style={{ marginTop: '12px', color: '#F59E0B', fontWeight: '600' }}>
                      ⏳ Reserved for incoming
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#E2E8F0' }}>
                        {selectedSpotData.trailerId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                        {selectedSpotData.carrier}
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px',
                        marginTop: '12px'
                      }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>Type</div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: '600',
                            color: selectedSpotData.type === 'priority' ? '#F59E0B' : '#E2E8F0'
                          }}>
                            {selectedSpotData.type?.toUpperCase() || 'LOADED'}
                          </div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.55rem', color: '#64748B' }}>In Yard</div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: '600',
                            color: (selectedSpotData.dwellHours || 0) > 24 ? '#EF4444' : '#E2E8F0'
                          }}>
                            {selectedSpotData.dwellHours}h
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#64748B', fontSize: '0.75rem' }}>
                  Click a door or yard spot to see details
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ 
                padding: '12px 20px',
                background: 'rgba(10, 15, 25, 0.5)',
                borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                fontSize: '0.65rem',
                color: '#64748B',
                textTransform: 'uppercase'
              }}>
                📅 Upcoming (Next 4 Hours)
              </div>
              
              {yardState.appointments.slice(0, 8).map((appt, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(59, 130, 246, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: appt.type === 'inbound' ? '#10B981' : '#3B82F6'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#E2E8F0' }}>
                      {appt.trailerId}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                      {appt.carrier} • {appt.type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '600',
                      color: appt.eta < 30 ? '#F59E0B' : '#94A3B8'
                    }}>
                      {appt.eta < 60 ? `${appt.eta}m` : `${Math.floor(appt.eta / 60)}h ${appt.eta % 60}m`}
                    </div>
                    {appt.assignedDoor && (
                      <div style={{ fontSize: '0.55rem', color: '#10B981' }}>
                        → Door {appt.assignedDoor}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* YMS Status */}
            <div style={{
              padding: '16px 20px',
              background: facility.hasYMS 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(245, 158, 11, 0.1)',
              borderTop: '1px solid rgba(59, 130, 246, 0.15)'
            }}>
              <div style={{ 
                fontSize: '0.7rem',
                fontWeight: '600',
                color: facility.hasYMS ? '#10B981' : '#F59E0B'
              }}>
                {facility.hasYMS ? '✓ YMS ACTIVE' : '⚠️ YMS NOT DEPLOYED'}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginTop: '4px' }}>
                {facility.hasYMS 
                  ? 'Auto door assignment enabled' 
                  : 'Manual yard management - deploy YMS for automation'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
