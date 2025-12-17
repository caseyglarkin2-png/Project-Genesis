/**
 * Coordinate Validation System
 * Scans surrounding areas to verify facility coordinates are accurate
 * Uses Mapbox Geocoding API to find actual facility locations
 */

import { PrimoFacility } from '@/data/primo-facilities';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2dsYXJraW40MTAiLCJhIjoiY21qN3R1dDc2MDBidjNlcTc1ZjVjcXJ0OSJ9.mSsGQbC0253Lhf9kTmIp_Q';

export interface CoordinateValidationResult {
  facility: PrimoFacility;
  currentCoords: { lat: number; lng: number };
  suggestedCoords: { lat: number; lng: number } | null;
  distanceMeters: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_FOUND';
  matchedName: string | null;
  matchedAddress: string | null;
  needsReview: boolean;
  searchQuery: string;
}

export interface ValidationSummary {
  total: number;
  validated: number;
  needsReview: number;
  notFound: number;
  avgDistanceMeters: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Build search queries for a facility
 */
function buildSearchQueries(facility: PrimoFacility): string[] {
  const queries: string[] = [];
  
  // Extract brand and facility type from name
  const name = facility.name;
  const location = facility.location;
  
  // Parse facility name for better search
  // Format: "US PL Poland Spring Factory" -> search for "Poland Spring bottling" or "Poland Spring factory"
  const nameParts = name.split(' ');
  const brandStart = nameParts.findIndex(p => !['US', 'CA', 'MX', 'PL', 'BF', 'DC', 'WH'].includes(p));
  const brandAndType = nameParts.slice(brandStart).join(' ');
  
  // Primary: Full facility name + location
  queries.push(`${brandAndType} ${location}`);
  
  // Secondary: Brand + "bottling" + location (for beverage facilities)
  const brand = nameParts.slice(brandStart, -1).join(' ');
  queries.push(`${brand} bottling center ${location}`);
  queries.push(`${brand} distribution center ${location}`);
  queries.push(`${brand} warehouse ${location}`);
  
  // Tertiary: Just brand + city
  const city = location.split(',')[0];
  queries.push(`${brand} ${city}`);
  
  return queries;
}

/**
 * Search for a location using Mapbox Geocoding API
 */
async function geocodeSearch(
  query: string,
  proximity: { lat: number; lng: number }
): Promise<{
  coords: { lat: number; lng: number } | null;
  name: string | null;
  address: string | null;
  relevance: number;
}> {
  try {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      types: 'poi,address',
      limit: '1',
      proximity: `${proximity.lng},${proximity.lat}`,
    });
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Geocoding failed for "${query}": ${response.status}`);
      return { coords: null, name: null, address: null, relevance: 0 };
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        coords: {
          lng: feature.center[0],
          lat: feature.center[1]
        },
        name: feature.text || null,
        address: feature.place_name || null,
        relevance: feature.relevance || 0
      };
    }
    
    return { coords: null, name: null, address: null, relevance: 0 };
  } catch (error) {
    console.error(`Geocoding error for "${query}":`, error);
    return { coords: null, name: null, address: null, relevance: 0 };
  }
}

/**
 * Validate a single facility's coordinates
 */
export async function validateFacilityCoordinates(
  facility: PrimoFacility
): Promise<CoordinateValidationResult> {
  const queries = buildSearchQueries(facility);
  
  let bestResult: {
    coords: { lat: number; lng: number } | null;
    name: string | null;
    address: string | null;
    relevance: number;
    query: string;
  } = { coords: null, name: null, address: null, relevance: 0, query: queries[0] };
  
  // Try each search query until we find a good match
  for (const query of queries) {
    const result = await geocodeSearch(query, facility.coordinates);
    
    if (result.coords && result.relevance > bestResult.relevance) {
      bestResult = { ...result, query };
      
      // If we found a high relevance match, stop searching
      if (result.relevance > 0.8) break;
    }
    
    // Rate limiting - wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate distance if we found coordinates
  const distanceMeters = bestResult.coords
    ? calculateDistance(
        facility.coordinates.lat, facility.coordinates.lng,
        bestResult.coords.lat, bestResult.coords.lng
      )
    : 0;
  
  // Determine confidence and if review is needed
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_FOUND';
  let needsReview = false;
  
  if (!bestResult.coords) {
    confidence = 'NOT_FOUND';
    needsReview = true;
  } else if (bestResult.relevance > 0.8 && distanceMeters < 500) {
    confidence = 'HIGH';
  } else if (bestResult.relevance > 0.6 && distanceMeters < 2000) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
    needsReview = true;
  }
  
  // Flag for review if distance is significant (> 500m)
  if (distanceMeters > 500) {
    needsReview = true;
  }
  
  return {
    facility,
    currentCoords: facility.coordinates,
    suggestedCoords: bestResult.coords,
    distanceMeters,
    confidence,
    matchedName: bestResult.name,
    matchedAddress: bestResult.address,
    needsReview,
    searchQuery: bestResult.query
  };
}

/**
 * Validate multiple facilities with progress callback
 */
export async function validateFacilities(
  facilities: PrimoFacility[],
  onProgress?: (completed: number, total: number, current: CoordinateValidationResult) => void
): Promise<CoordinateValidationResult[]> {
  const results: CoordinateValidationResult[] = [];
  
  for (let i = 0; i < facilities.length; i++) {
    const result = await validateFacilityCoordinates(facilities[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, facilities.length, result);
    }
    
    // Rate limiting between facilities
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  return results;
}

/**
 * Get validation summary statistics
 */
export function getValidationSummary(results: CoordinateValidationResult[]): ValidationSummary {
  const needsReview = results.filter(r => r.needsReview);
  const notFound = results.filter(r => r.confidence === 'NOT_FOUND');
  const validated = results.filter(r => r.suggestedCoords && !r.needsReview);
  
  const avgDistance = results
    .filter(r => r.suggestedCoords)
    .reduce((sum, r) => sum + r.distanceMeters, 0) / 
    Math.max(1, results.filter(r => r.suggestedCoords).length);
  
  return {
    total: results.length,
    validated: validated.length,
    needsReview: needsReview.length,
    notFound: notFound.length,
    avgDistanceMeters: Math.round(avgDistance)
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Generate coordinate correction code for a facility
 */
export function generateCorrectionCode(result: CoordinateValidationResult): string {
  if (!result.suggestedCoords) return '';
  
  return `// ${result.facility.name}
// Current: ${result.currentCoords.lat}, ${result.currentCoords.lng}
// Suggested: ${result.suggestedCoords.lat}, ${result.suggestedCoords.lng}
// Distance: ${formatDistance(result.distanceMeters)}
coordinates: { lat: ${result.suggestedCoords.lat}, lng: ${result.suggestedCoords.lng} },`;
}
