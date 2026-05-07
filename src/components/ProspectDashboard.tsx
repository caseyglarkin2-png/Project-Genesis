'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TAM_ANCHORS, TAM_ANCHOR_BY_DOMAIN } from '../data/tam-anchors';
import YardDetailPane from './YardDetailPane';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://project-genesis-backend-8uk2.onrender.com';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const LAST_DOMAIN_KEY = 'yardflow.lastDomain';

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

type SortKey = 'score' | 'paved_pct' | 'trailers' | 'gates' | 'confidence';

const TIER_COLOR: Record<Yard['classification'], string> = {
  WHALE: '#22c55e',
  STANDARD: '#fbbf24',
  LOW: '#94a3b8',
};

const CONFIDENCE_RANK: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, MOCK: 0 };

export default function ProspectDashboard() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [selected, setSelected] = useState<Yard | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDesc, setSortDesc] = useState(true);
  const [confFilter, setConfFilter] = useState<'all' | 'high'>('all');
  const [copied, setCopied] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem(LAST_DOMAIN_KEY);
    setDomain(saved || 'primobrands.com');
  }, []);

  const anchor = useMemo(
    () => TAM_ANCHOR_BY_DOMAIN[domain.trim().toLowerCase()] || null,
    [domain],
  );

  const sortedYards = useMemo(() => {
    if (!result?.yards) return [];
    const filtered =
      confFilter === 'high'
        ? result.yards.filter((y) => y.measurement.confidence === 'HIGH')
        : result.yards;
    const get = (y: Yard) => {
      if (sortKey === 'score') return y.score;
      if (sortKey === 'paved_pct') return y.details.paved_pct;
      if (sortKey === 'trailers') return y.details.trailers;
      if (sortKey === 'gates') return y.details.gates;
      return CONFIDENCE_RANK[y.measurement.confidence || 'LOW'] ?? 0;
    };
    return [...filtered].sort((a, b) => (sortDesc ? get(b) - get(a) : get(a) - get(b)));
  }, [result, sortKey, sortDesc, confFilter]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!result || sortedYards.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    for (const yard of sortedYards) {
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
    if (!bounds.isEmpty())
      map.fitBounds(bounds, { padding: 80, maxZoom: 11, duration: 800 });
  }, [sortedYards, result]);

  async function runDragnet(d?: string) {
    const target = (d ?? domain).trim().toLowerCase();
    if (!target) return;
    setError(null);
    setSelected(null);
    setResult(null);
    setLoading(true);
    if (typeof window !== 'undefined') localStorage.setItem(LAST_DOMAIN_KEY, target);
    try {
      const resp = await fetch(`${API_BASE}/api/score_company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: target, real: true, limit: 25 }),
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

  function copyAsCSV() {
    if (!sortedYards.length) return;
    const rows = [
      ['rank', 'yvs', 'tier', 'name', 'address', 'lat', 'lon', 'paved_pct', 'trailers', 'gates', 'confidence'].join(','),
      ...sortedYards.map((y, i) =>
        [
          i + 1,
          y.score,
          y.classification,
          `"${(y.name || '').replace(/"/g, '""')}"`,
          `"${(y.address || '').replace(/"/g, '""')}"`,
          y.lat,
          y.lon,
          y.details.paved_pct,
          y.details.trailers,
          y.details.gates,
          y.measurement.confidence || '',
        ].join(','),
      ),
    ].join('\n');
    navigator.clipboard.writeText(rows).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(true);
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
          <a href="/" style={styles.link}>← Back to YardMap</a>
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
            disabled={loading}
          />
          <button onClick={() => runDragnet()} disabled={loading || !domain} style={styles.button}>
            {loading ? 'Scanning…' : 'Run Dragnet'}
          </button>
        </div>
        <div style={styles.anchors}>
          {TAM_ANCHORS.slice(0, 16).map((a) => (
            <button
              key={a.domain}
              style={{
                ...styles.chip,
                ...(domain === a.domain ? styles.chipActive : {}),
              }}
              onClick={() => {
                setDomain(a.domain);
                runDragnet(a.domain);
              }}
              disabled={loading}
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
              <SummaryStat label="Yards" value={String(result.yard_count)} />
              <SummaryStat label="Whales" value={String(result.summary.whales)} accent="#22c55e" />
              <SummaryStat label="Avg YVS" value={String(result.summary.avg_score)} accent="#60a5fa" />
              <SummaryStat label="Trailer cap." value={result.summary.trailer_capacity_est.toLocaleString()} />
              <SummaryStat label="Paved" value={`${(result.summary.paved_area_total_m2 / 1000).toFixed(1)}k m²`} />
              <div style={styles.actionsCol}>
                <button onClick={copyAsCSV} style={styles.smallButton} disabled={!sortedYards.length}>
                  {copied ? '✓ Copied' : 'Copy CSV'}
                </button>
                <button
                  onClick={() => setConfFilter(confFilter === 'all' ? 'high' : 'all')}
                  style={{
                    ...styles.smallButton,
                    ...(confFilter === 'high' ? styles.smallButtonActive : {}),
                  }}
                  disabled={!sortedYards.length}
                >
                  {confFilter === 'high' ? 'HIGH only ✓' : 'All confidence'}
                </button>
              </div>
            </div>
          )}

          {loading && <LoadingSkeleton />}

          {!loading && result && (
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <SortableTh label="YVS" k="score" cur={sortKey} desc={sortDesc} onClick={toggleSort} />
                  <th style={styles.th}>Yard</th>
                  <th style={styles.th}>Tier</th>
                  <SortableTh label="Trailers" k="trailers" cur={sortKey} desc={sortDesc} onClick={toggleSort} />
                  <SortableTh label="Paved %" k="paved_pct" cur={sortKey} desc={sortDesc} onClick={toggleSort} />
                  <SortableTh label="Gates" k="gates" cur={sortKey} desc={sortDesc} onClick={toggleSort} />
                  <SortableTh label="Conf." k="confidence" cur={sortKey} desc={sortDesc} onClick={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {sortedYards.map((y, i) => (
                  <tr
                    key={`${y.lat}-${y.lon}-${i}`}
                    onClick={() => setSelected(y)}
                    style={{
                      ...styles.tr,
                      background: selected === y ? 'rgba(96,165,250,0.16)' : 'transparent',
                    }}
                  >
                    <td style={{ ...styles.td, color: TIER_COLOR[y.classification], fontWeight: 700 }}>
                      {y.score}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600 }}>{y.name}</div>
                      <div style={styles.tdSub}>{y.address}</div>
                    </td>
                    <td style={styles.td}>{y.emoji} {y.classification}</td>
                    <td style={styles.td}>{y.details.trailers}</td>
                    <td style={styles.td}>{y.details.paved_pct}%</td>
                    <td style={styles.td}>{y.details.gates}</td>
                    <td style={{ ...styles.td, ...confidenceStyle(y.measurement.confidence) }}>
                      {y.measurement.confidence || '—'}
                    </td>
                  </tr>
                ))}
                {sortedYards.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', opacity: 0.6 }}>
                      {confFilter === 'high' ? 'No HIGH-confidence yards. Switch filter to see all.' : 'No yards.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {!loading && !result && <EmptyState />}

          <Legend />
        </div>

        <div style={styles.detailPane}>
          {selected ? (
            <YardDetailPane
              yard={selected}
              apiBase={API_BASE}
              mapboxToken={MAPBOX_TOKEN}
              onClose={() => setSelected(null)}
            />
          ) : (
            <>
              <div ref={mapContainer} style={styles.map} />
              {!MAPBOX_TOKEN && (
                <div style={styles.mapMissing}>NEXT_PUBLIC_MAPBOX_TOKEN not set — map disabled.</div>
              )}
              {result && sortedYards.length > 0 && (
                <div style={styles.hint}>Click a yard pin or row to see real OSM-derived geometry.</div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function SortableTh({
  label, k, cur, desc, onClick,
}: { label: string; k: SortKey; cur: SortKey; desc: boolean; onClick: (k: SortKey) => void }) {
  const active = cur === k;
  return (
    <th
      style={{ ...styles.th, cursor: 'pointer', color: active ? '#e5e7eb' : undefined }}
      onClick={() => onClick(k)}
    >
      {label} {active ? (desc ? '↓' : '↑') : ''}
    </th>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent || '#e5e7eb' }}>{value}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={styles.skelPulse}>Scanning Mapbox + OpenStreetMap for facilities…</div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ ...styles.skelRow, opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.empty}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>🐋</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Pick an anchor or paste a domain.</div>
      <div style={{ opacity: 0.65, fontSize: 13 }}>
        We'll discover yards via Mapbox, score each with real OSM geometry, and rank the whales.
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={styles.legend}>
      <span style={styles.legendItem}><Dot c={TIER_COLOR.WHALE} /> WHALE 80+</span>
      <span style={styles.legendItem}><Dot c={TIER_COLOR.STANDARD} /> STANDARD 50-79</span>
      <span style={styles.legendItem}><Dot c={TIER_COLOR.LOW} /> LOW &lt;50</span>
      <span style={{ ...styles.legendItem, marginLeft: 'auto', opacity: 0.7 }}>
        Confidence: <span style={{ color: '#22c55e' }}>HIGH</span> = full OSM polygon ·{' '}
        <span style={{ color: '#fbbf24' }}>MED</span> = partial ·{' '}
        <span style={{ color: '#94a3b8' }}>LOW</span> = deterministic fallback
      </span>
    </div>
  );
}

function Dot({ c }: { c: string }) {
  return (
    <span
      style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, marginRight: 6 }}
    />
  );
}

function confidenceStyle(c?: string) {
  return {
    color:
      c === 'HIGH' ? '#22c55e' :
      c === 'MEDIUM' ? '#fbbf24' :
      c === 'MOCK' ? '#a78bfa' : '#94a3b8',
    fontWeight: 600,
    fontSize: 11,
  };
}

const styles: Record<string, any> = {
  page: { minHeight: '100vh', background: '#0b1220', color: '#e5e7eb', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #1f2937' },
  kicker: { fontSize: 11, letterSpacing: 2, opacity: 0.6 },
  h1: { margin: '4px 0 0', fontSize: 22, fontWeight: 600 },
  headerRight: { display: 'flex', gap: 12 },
  link: { color: '#60a5fa', textDecoration: 'none', fontSize: 14 },
  controls: { padding: '20px 28px', borderBottom: '1px solid #1f2937' },
  inputRow: { display: 'flex', gap: 10 },
  input: { flex: 1, padding: '12px 14px', background: '#0f172a', color: '#e5e7eb', border: '1px solid #334155', borderRadius: 8, fontSize: 15 },
  button: { padding: '12px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  anchors: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { padding: '5px 10px', background: 'rgba(96,165,250,0.1)', color: '#93c5fd', border: '1px solid #1e3a8a', borderRadius: 999, fontSize: 12, cursor: 'pointer' },
  chipActive: { background: '#1e3a8a', color: '#dbeafe' },
  anchorMeta: { marginTop: 10, fontSize: 13, opacity: 0.85 },
  anchorBadge: { background: '#1e3a8a', color: '#bfdbfe', padding: '2px 8px', borderRadius: 4, fontSize: 10, letterSpacing: 1, marginRight: 8 },
  error: { marginTop: 10, color: '#fca5a5' },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  tablePane: { flex: 1, overflow: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column' },
  summary: { display: 'flex', gap: 18, padding: '14px 16px', background: '#0f172a', borderRadius: 10, marginBottom: 14, border: '1px solid #1f2937', alignItems: 'center' },
  actionsCol: { display: 'flex', flexDirection: 'column', gap: 6 },
  smallButton: { padding: '6px 10px', background: '#0b1220', color: '#cbd5e1', border: '1px solid #334155', borderRadius: 6, fontSize: 11, cursor: 'pointer' },
  smallButtonActive: { background: '#1e3a8a', color: '#dbeafe', borderColor: '#3b82f6' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  theadRow: { background: '#0f172a', position: 'sticky', top: 0 },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #1f2937', fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.7 },
  tr: { cursor: 'pointer', borderBottom: '1px solid #1f2937' },
  td: { padding: '10px 8px', verticalAlign: 'top' },
  tdSub: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  detailPane: { width: '52%', minWidth: 480, position: 'relative', borderLeft: '1px solid #1f2937', background: '#0a0f1a' },
  map: { width: '100%', height: '100%' },
  mapMissing: { position: 'absolute', inset: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', background: 'rgba(0,0,0,0.5)' },
  hint: { position: 'absolute', top: 16, left: 16, padding: '6px 10px', background: 'rgba(15,23,42,0.85)', borderRadius: 6, fontSize: 12, color: '#cbd5e1' },
  empty: { padding: 40, textAlign: 'center', color: '#cbd5e1' },
  legend: { marginTop: 'auto', paddingTop: 14, paddingBottom: 4, fontSize: 11, opacity: 0.85, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' },
  legendItem: { display: 'inline-flex', alignItems: 'center' },
  skelPulse: { padding: 12, background: '#0f172a', borderRadius: 8, fontSize: 13, opacity: 0.8, marginBottom: 8, border: '1px solid #1f2937' },
  skelRow: { height: 38, background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', borderRadius: 4, marginBottom: 4 },
};
