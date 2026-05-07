'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TAM_ANCHORS, TAM_ANCHOR_BY_DOMAIN } from '../data/tam-anchors';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://project-genesis-backend-8uk2.onrender.com';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

type Yard = {
  name: string;
  address: string;
  lat: number;
  lon: number;
  score: number;
  classification: 'WHALE' | 'STANDARD' | 'LOW';
  tier: string;
  emoji: string;
  details: { paved_pct: number; trailers: number; gates: number };
  measurement: {
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'MOCK';
    source?: string;
    paved_area_m2?: number;
    parking_area_m2?: number;
  };
  source?: string;
};

type ScoreResult = {
  domain: string;
  yard_count: number;
  top_score?: number;
  top_classification?: string;
  summary?: {
    whales: number;
    standards: number;
    low: number;
    paved_area_total_m2: number;
    parking_area_total_m2: number;
    trailer_capacity_est: number;
    gate_count_total: number;
    avg_score: number;
  };
  yards: Yard[];
  message?: string;
};

const TIER_COLOR: Record<Yard['classification'], string> = {
  WHALE: '#22c55e',
  STANDARD: '#fbbf24',
  LOW: '#94a3b8',
};

export default function ProspectDashboard() {
  const [domain, setDomain] = useState('primobrands.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [selected, setSelected] = useState<Yard | null>(null);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const anchor = useMemo(
    () => TAM_ANCHOR_BY_DOMAIN[domain.trim().toLowerCase()] || null,
    [domain],
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-95, 39],
      zoom: 3.4,
    });
  }, []);

  // Sync markers when results change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!result || result.yards.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const yard of result.yards) {
      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.background = TIER_COLOR[yard.classification];
      el.style.border = '2px solid #0b1220';
      el.style.cursor = 'pointer';
      el.title = `${yard.name} — YVS ${yard.score}`;
      el.addEventListener('click', () => setSelected(yard));

      const marker = new mapboxgl.Marker(el).setLngLat([yard.lon, yard.lat]).addTo(map);
      markersRef.current.push(marker);
      bounds.extend([yard.lon, yard.lat]);
    }
    map.fitBounds(bounds, { padding: 80, maxZoom: 11, duration: 800 });
  }, [result]);

  async function runDragnet() {
    setError(null);
    setSelected(null);
    setResult(null);
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/score_company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim().toLowerCase(), real: true, limit: 25 }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: ScoreResult = await resp.json();
      setResult(data);
      if (data.yards.length === 0)
        setError(data.message || 'No yards found. Try a different domain.');
    } catch (e: any) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>YARDFLOW · DIGITAL DRAGNET</div>
          <h1 style={styles.h1}>Paste a domain. Map every yard. Score the whales.</h1>
        </div>
        <div style={styles.headerRight}>
          <a href="/" style={styles.link}>
            ← Back to YardMap
          </a>
        </div>
      </header>

      <section style={styles.controls}>
        <div style={styles.inputRow}>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runDragnet()}
            placeholder="e.g. primobrands.com"
            style={styles.input}
          />
          <button onClick={runDragnet} disabled={loading || !domain} style={styles.button}>
            {loading ? 'Scanning…' : 'Run Dragnet'}
          </button>
        </div>
        <div style={styles.anchors}>
          {TAM_ANCHORS.slice(0, 12).map((a) => (
            <button
              key={a.domain}
              style={styles.chip}
              onClick={() => {
                setDomain(a.domain);
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
        {anchor && (
          <div style={styles.anchorMeta}>
            <span style={styles.anchorBadge}>TAM ANCHOR</span>
            {anchor.facilities_text} · {anchor.est_annual_truckloads.toLocaleString()} loads/yr ·{' '}
            {anchor.freight.join(', ')}
          </div>
        )}
        {error && <div style={styles.error}>⚠ {error}</div>}
      </section>

      <section style={styles.body}>
        <div style={styles.tablePane}>
          {result && result.summary && (
            <div style={styles.summary}>
              <SummaryStat label="Yards found" value={String(result.yard_count)} />
              <SummaryStat label="Whales" value={String(result.summary.whales)} accent="#22c55e" />
              <SummaryStat
                label="Avg YVS"
                value={String(result.summary.avg_score)}
                accent="#60a5fa"
              />
              <SummaryStat
                label="Trailer cap. est."
                value={result.summary.trailer_capacity_est.toLocaleString()}
              />
              <SummaryStat
                label="Paved area"
                value={`${(result.summary.paved_area_total_m2 / 1000).toFixed(1)}k m²`}
              />
            </div>
          )}

          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>YVS</th>
                <th style={styles.th}>Yard</th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>Trailers</th>
                <th style={styles.th}>Paved %</th>
                <th style={styles.th}>Gates</th>
                <th style={styles.th}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {(result?.yards || []).map((y, i) => (
                <tr
                  key={`${y.lat}-${y.lon}-${i}`}
                  onClick={() => {
                    setSelected(y);
                    mapRef.current?.flyTo({ center: [y.lon, y.lat], zoom: 15 });
                  }}
                  style={{
                    ...styles.tr,
                    background: selected === y ? 'rgba(96,165,250,0.12)' : 'transparent',
                  }}
                >
                  <td style={{ ...styles.td, color: TIER_COLOR[y.classification], fontWeight: 700 }}>
                    {y.score}
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{y.name}</div>
                    <div style={styles.tdSub}>{y.address}</div>
                  </td>
                  <td style={styles.td}>
                    {y.emoji} {y.classification}
                  </td>
                  <td style={styles.td}>{y.details.trailers}</td>
                  <td style={styles.td}>{y.details.paved_pct}%</td>
                  <td style={styles.td}>{y.details.gates}</td>
                  <td style={{ ...styles.td, ...styles.confidence(y.measurement.confidence) }}>
                    {y.measurement.confidence || '—'}
                  </td>
                </tr>
              ))}
              {!loading && result?.yards.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...styles.td, textAlign: 'center', opacity: 0.6 }}>
                    No yards found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.mapPane}>
          <div ref={mapContainer} style={styles.map} />
          {!MAPBOX_TOKEN && (
            <div style={styles.mapMissing}>
              NEXT_PUBLIC_MAPBOX_TOKEN not set — map disabled.
            </div>
          )}
          {selected && (
            <div style={styles.selectedCard}>
              <div style={styles.selectedHeader}>
                <span style={{ color: TIER_COLOR[selected.classification], fontWeight: 700 }}>
                  YVS {selected.score}
                </span>{' '}
                · {selected.emoji} {selected.classification}
              </div>
              <div style={{ fontWeight: 600, margin: '6px 0 2px' }}>{selected.name}</div>
              <div style={styles.tdSub}>{selected.address}</div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                Source: {selected.measurement.source || 'unknown'} · {selected.lat.toFixed(4)},{' '}
                {selected.lon.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || '#e5e7eb' }}>{value}</div>
    </div>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: '#0b1220',
    color: '#e5e7eb',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 28px',
    borderBottom: '1px solid #1f2937',
  },
  kicker: { fontSize: 11, letterSpacing: 2, opacity: 0.6 },
  h1: { margin: '4px 0 0', fontSize: 22, fontWeight: 600 },
  headerRight: { display: 'flex', gap: 12 },
  link: { color: '#60a5fa', textDecoration: 'none', fontSize: 14 },
  controls: { padding: '20px 28px', borderBottom: '1px solid #1f2937' },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1,
    padding: '12px 14px',
    background: '#0f172a',
    color: '#e5e7eb',
    border: '1px solid #334155',
    borderRadius: 8,
    fontSize: 15,
  },
  button: {
    padding: '12px 22px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },
  anchors: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    padding: '5px 10px',
    background: 'rgba(96,165,250,0.1)',
    color: '#93c5fd',
    border: '1px solid #1e3a8a',
    borderRadius: 999,
    fontSize: 12,
    cursor: 'pointer',
  },
  anchorMeta: { marginTop: 10, fontSize: 13, opacity: 0.85 },
  anchorBadge: {
    background: '#1e3a8a',
    color: '#bfdbfe',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 1,
    marginRight: 8,
  },
  error: { marginTop: 10, color: '#fca5a5' },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  tablePane: { flex: 1, overflow: 'auto', padding: '14px 18px' },
  summary: {
    display: 'flex',
    gap: 18,
    padding: '14px 16px',
    background: '#0f172a',
    borderRadius: 10,
    marginBottom: 14,
    border: '1px solid #1f2937',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  theadRow: { background: '#0f172a' },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    borderBottom: '1px solid #1f2937',
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  tr: { cursor: 'pointer', borderBottom: '1px solid #1f2937' },
  td: { padding: '10px 8px', verticalAlign: 'top' },
  tdSub: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  confidence: (c?: string) => ({
    color: c === 'HIGH' ? '#22c55e' : c === 'MEDIUM' ? '#fbbf24' : c === 'MOCK' ? '#a78bfa' : '#94a3b8',
    fontWeight: 600,
    fontSize: 11,
  }),
  mapPane: { width: '50%', position: 'relative', borderLeft: '1px solid #1f2937' },
  map: { width: '100%', height: '100%' },
  mapMissing: {
    position: 'absolute',
    inset: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fca5a5',
    background: 'rgba(0,0,0,0.5)',
  },
  selectedCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 14,
    background: 'rgba(15,23,42,0.92)',
    border: '1px solid #1f2937',
    borderRadius: 10,
    backdropFilter: 'blur(6px)',
  },
  selectedHeader: { fontSize: 13 },
};
