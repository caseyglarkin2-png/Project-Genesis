'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

type Geom = { lat: number; lon: number };

type YardDetail = {
  name: string;
  lat: number;
  lon: number;
  score: number;
  classification: { label: string; tier: string; emoji: string; expected_roi: string; action: string };
  measurement: {
    paved_area_pct: number;
    trailer_count: number;
    gate_nodes: number;
    paved_area_m2: number;
    parking_area_m2: number;
    industrial_m2: number;
    building_m2: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'MOCK';
    source: string;
    geometry?: {
      industrial: Geom[][];
      parking: Geom[][];
      paved_surface: Geom[][];
      buildings: Geom[][];
      gate_points: Geom[];
    };
  };
  breakdown: {
    formula: string;
    components: Record<string, { contribution: number; interpretation: string }>;
  };
};

type YardSummary = {
  name: string;
  lat: number;
  lon: number;
  score: number;
  classification: 'WHALE' | 'STANDARD' | 'LOW';
  emoji: string;
  details: { paved_pct: number; trailers: number; gates: number };
};

const TIER_COLOR: Record<YardSummary['classification'], string> = {
  WHALE: '#22c55e',
  STANDARD: '#fbbf24',
  LOW: '#94a3b8',
};

export default function YardDetailPane({
  yard, apiBase, mapboxToken, onClose,
}: {
  yard: YardSummary;
  apiBase: string;
  mapboxToken: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<YardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    setLoading(true);
    const url = new URL(`${apiBase}/api/yard_detail`);
    url.searchParams.set('lat', String(yard.lat));
    url.searchParams.set('lon', String(yard.lon));
    url.searchParams.set('name', yard.name);
    fetch(url.toString())
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setDetail(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [yard.lat, yard.lon, yard.name, apiBase]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    mapboxgl.accessToken = mapboxToken;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [yard.lon, yard.lat],
      zoom: 16,
      pitch: 45,
    });
    mapRef.current = map;

    map.on('load', () => {
      // Center pin (yard centroid)
      new mapboxgl.Marker({ color: TIER_COLOR[yard.classification] })
        .setLngLat([yard.lon, yard.lat])
        .addTo(map);

      if (detail?.measurement.geometry) addGeometryLayers(map, detail.measurement.geometry);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [yard.lat, yard.lon, yard.classification, mapboxToken]);

  // When detail arrives after map init, push the geometry layers in.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !detail?.measurement.geometry) return;
    if (!map.isStyleLoaded()) {
      map.once('load', () => addGeometryLayers(map, detail.measurement.geometry!));
    } else {
      addGeometryLayers(map, detail.measurement.geometry);
    }
  }, [detail]);

  return (
    <div style={styles.container}>
      <div style={styles.mapWrap}>
        <div ref={mapContainer} style={styles.map} />
        {!mapboxToken && (
          <div style={styles.mapMissing}>NEXT_PUBLIC_MAPBOX_TOKEN not set.</div>
        )}
        <button onClick={onClose} style={styles.closeBtn} aria-label="Close detail">✕</button>
      </div>

      <div style={styles.info}>
        <div style={styles.infoHeader}>
          <div style={{ flex: 1 }}>
            <div style={styles.infoTitle}>{yard.name}</div>
            <div style={styles.infoSub}>{yard.lat.toFixed(5)}, {yard.lon.toFixed(5)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...styles.score, color: TIER_COLOR[yard.classification] }}>
              {yard.score}
            </div>
            <div style={styles.tier}>{yard.emoji} {yard.classification}</div>
          </div>
        </div>

        {loading && <div style={styles.loadingRow}>Pulling OSM polygons + recomputing YVS…</div>}
        {error && <div style={styles.errorRow}>⚠ {error}</div>}

        {detail && (
          <>
            <div style={styles.metricsGrid}>
              <Metric label="Paved area" value={`${detail.measurement.paved_area_pct.toFixed(0)}%`} sub={`${(detail.measurement.paved_area_m2 / 1000).toFixed(1)}k m²`} />
              <Metric label="Trailer slots (est.)" value={detail.measurement.trailer_count.toLocaleString()} sub={`${(detail.measurement.parking_area_m2 / 165).toFixed(0)} from parking`} />
              <Metric label="Gates" value={String(detail.measurement.gate_nodes)} sub="OSM road crossings" />
              <Metric label="Industrial polygon" value={`${(detail.measurement.industrial_m2 / 1000).toFixed(1)}k m²`} sub={`buildings: ${(detail.measurement.building_m2 / 1000).toFixed(1)}k`} />
            </div>

            <div style={styles.breakdownBox}>
              <div style={styles.breakdownTitle}>YVS BREAKDOWN</div>
              <div style={{ fontSize: 12, opacity: 0.85, fontFamily: 'monospace' }}>
                {detail.breakdown.formula}
              </div>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#cbd5e1' }}>
                {Object.entries(detail.breakdown.components).map(([k, v]) => (
                  <li key={k}><b>{k.replace('_', ' ')}:</b> {v.contribution} pts — <i style={{ opacity: 0.7 }}>{v.interpretation}</i></li>
                ))}
              </ul>
            </div>

            <div style={styles.recoBox}>
              <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1 }}>RECOMMENDED ACTION</div>
              <div style={{ marginTop: 4, fontWeight: 600 }}>{detail.classification.action}</div>
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>Expected ROI: {detail.classification.expected_roi}</div>
            </div>

            <div style={styles.confRow}>
              <span>Source:</span>
              <span style={{ ...confidenceStyle(detail.measurement.confidence), marginLeft: 8 }}>
                {detail.measurement.confidence}
              </span>
              <span style={{ marginLeft: 8, opacity: 0.6, fontSize: 11 }}>{detail.measurement.source}</span>
              <a
                href={`https://www.google.com/maps/@${yard.lat},${yard.lon},18z`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: 'auto', color: '#60a5fa', fontSize: 12 }}
              >
                Open in Google Maps ↗
              </a>
            </div>

            <div style={styles.legend}>
              <LegendSwatch color="rgba(34, 197, 94, 0.35)" label="Industrial / commercial" />
              <LegendSwatch color="rgba(96, 165, 250, 0.55)" label="Parking" />
              <LegendSwatch color="rgba(251, 191, 36, 0.45)" label="Paved surface" />
              <LegendSwatch color="rgba(248, 113, 113, 0.55)" label="Buildings" />
              <LegendSwatch color="#fbbf24" label="Gates" dot />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function addGeometryLayers(map: mapboxgl.Map, g: NonNullable<YardDetail['measurement']['geometry']>) {
  const setPoly = (id: string, polys: Geom[][], color: string, opacity: number) => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
    if (map.getSource(id)) map.removeSource(id);

    if (!polys.length) return;
    const fc = {
      type: 'FeatureCollection' as const,
      features: polys.map((poly) => ({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [poly.map((p) => [p.lon, p.lat])],
        },
      })),
    };
    map.addSource(id, { type: 'geojson', data: fc as any });
    map.addLayer({ id, type: 'fill', source: id, paint: { 'fill-color': color, 'fill-opacity': opacity } });
    map.addLayer({ id: `${id}-line`, type: 'line', source: id, paint: { 'line-color': color, 'line-width': 1.5, 'line-opacity': 0.9 } });
  };

  setPoly('genesis-industrial', g.industrial, '#22c55e', 0.18);
  setPoly('genesis-parking', g.parking, '#60a5fa', 0.55);
  setPoly('genesis-paved', g.paved_surface, '#fbbf24', 0.45);
  setPoly('genesis-buildings', g.buildings, '#f87171', 0.55);

  // Gate points
  if (map.getLayer('genesis-gates')) map.removeLayer('genesis-gates');
  if (map.getSource('genesis-gates')) map.removeSource('genesis-gates');
  if (g.gate_points.length) {
    map.addSource('genesis-gates', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: g.gate_points.map((p) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        })),
      } as any,
    });
    map.addLayer({
      id: 'genesis-gates',
      type: 'circle',
      source: 'genesis-gates',
      paint: {
        'circle-radius': 7,
        'circle-color': '#fbbf24',
        'circle-stroke-color': '#0b1220',
        'circle-stroke-width': 2,
      },
    });
  }
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      {sub && <div style={styles.metricSub}>{sub}</div>}
    </div>
  );
}

function LegendSwatch({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, marginRight: 12 }}>
      <span
        style={{
          display: 'inline-block',
          width: dot ? 10 : 14,
          height: dot ? 10 : 10,
          background: color,
          borderRadius: dot ? '50%' : 2,
          marginRight: 5,
          border: dot ? '2px solid #0b1220' : '1px solid rgba(255,255,255,0.2)',
        }}
      />
      {label}
    </span>
  );
}

function confidenceStyle(c?: string) {
  return {
    color: c === 'HIGH' ? '#22c55e' : c === 'MEDIUM' ? '#fbbf24' : c === 'MOCK' ? '#a78bfa' : '#94a3b8',
    fontWeight: 600,
    fontSize: 12,
  };
}

const styles: Record<string, any> = {
  container: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column' },
  mapWrap: { flex: '1 1 55%', minHeight: 280, position: 'relative' },
  map: { width: '100%', height: '100%' },
  mapMissing: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', background: 'rgba(0,0,0,0.5)' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', border: '1px solid #334155', background: 'rgba(15,23,42,0.85)', color: '#e5e7eb', cursor: 'pointer', fontSize: 14 },
  info: { flex: '0 0 auto', padding: '14px 18px', background: '#0a0f1a', borderTop: '1px solid #1f2937', overflowY: 'auto', maxHeight: '50%' },
  infoHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  infoTitle: { fontSize: 16, fontWeight: 600 },
  infoSub: { fontSize: 11, opacity: 0.6, marginTop: 2 },
  score: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
  tier: { fontSize: 11, opacity: 0.85, marginTop: 2 },
  loadingRow: { marginTop: 10, fontSize: 12, opacity: 0.75 },
  errorRow: { marginTop: 10, fontSize: 12, color: '#fca5a5' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 },
  metric: { padding: '8px 10px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 6 },
  metricLabel: { fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  metricSub: { fontSize: 11, opacity: 0.55, marginTop: 1 },
  breakdownBox: { marginTop: 12, padding: '10px 12px', background: '#0f172a', border: '1px solid #1f2937', borderRadius: 6 },
  breakdownTitle: { fontSize: 10, opacity: 0.6, letterSpacing: 1, marginBottom: 4 },
  recoBox: { marginTop: 10, padding: '10px 12px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: 6 },
  confRow: { display: 'flex', alignItems: 'center', marginTop: 10, fontSize: 12, color: '#cbd5e1' },
  legend: { marginTop: 10, padding: '8px 0', borderTop: '1px solid #1f2937', display: 'flex', flexWrap: 'wrap' },
};
