/**
 * =============================================================================
 * PRIMO BRANDS MANUFACTURING NETWORK - 250 FACILITIES
 * =============================================================================
 * 
 * Complete facility database for the Primo Brands / YardBuilder AI network.
 * Generated using Digital Dragnet reconnaissance data.
 * 
 * Regions:
 * - Southeast (50 facilities)
 * - Central/South (50 facilities)  
 * - Midwest (50 facilities)
 * - Northeast (50 facilities)
 * - West/Pacific (50 facilities)
 */

export interface Facility {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  score: number;
  status: 'online' | 'offline' | 'warning';
  trucksToday: number;
  avgTurnTime: number;
  dockDoors: number;
  trailerSpots: number;
}

// Helper to generate realistic facility data
const generateFacility = (
  id: string, 
  name: string, 
  location: string, 
  lat: number, 
  lng: number,
  tier: 'large' | 'medium' | 'small' = 'medium'
): Facility => {
  const baseScore = tier === 'large' ? 75 : tier === 'medium' ? 65 : 55;
  const variance = Math.random() * 20 - 5;
  const score = Math.min(95, Math.max(45, baseScore + variance));
  
  const baseTrucks = tier === 'large' ? 180 : tier === 'medium' ? 100 : 50;
  const trucksToday = Math.floor(baseTrucks + Math.random() * baseTrucks * 0.5);
  
  const baseTurn = tier === 'large' ? 24 : tier === 'medium' ? 28 : 32;
  const avgTurnTime = Math.floor(baseTurn + Math.random() * 10 - 3);
  
  const baseDocks = tier === 'large' ? 32 : tier === 'medium' ? 20 : 12;
  const dockDoors = Math.floor(baseDocks + Math.random() * 10);
  
  const trailerSpots = Math.floor(dockDoors * 5 + Math.random() * 50);
  
  // 85% online, 12% warning, 3% offline
  const statusRoll = Math.random();
  const status: 'online' | 'offline' | 'warning' = 
    statusRoll > 0.15 ? 'online' : statusRoll > 0.03 ? 'warning' : 'offline';
  
  return {
    id,
    name,
    location,
    coordinates: { lat, lng },
    score: Math.round(score * 10) / 10,
    status,
    trucksToday,
    avgTurnTime,
    dockDoors,
    trailerSpots
  };
};

export const NETWORK_FACILITIES: Facility[] = [
  // ============================================================================
  // SOUTHEAST REGION (50 facilities)
  // ============================================================================
  
  // Florida (15)
  generateFacility('FL-JAX-001', 'Jacksonville Main DC', 'Jacksonville, FL', 30.33, -81.66, 'large'),
  generateFacility('FL-JAX-002', 'Jacksonville North', 'Jacksonville, FL', 30.45, -81.70, 'medium'),
  generateFacility('FL-JAX-003', 'Jacksonville Port', 'Jacksonville, FL', 30.32, -81.63, 'large'),
  generateFacility('FL-MIA-001', 'Miami Distribution', 'Miami, FL', 25.76, -80.19, 'large'),
  generateFacility('FL-MIA-002', 'Miami Cold Storage', 'Doral, FL', 25.82, -80.34, 'medium'),
  generateFacility('FL-MIA-003', 'Miami Port Terminal', 'Miami, FL', 25.77, -80.17, 'large'),
  generateFacility('FL-TPA-001', 'Tampa Crossdock', 'Tampa, FL', 27.95, -82.46, 'medium'),
  generateFacility('FL-TPA-002', 'Tampa East Hub', 'Brandon, FL', 27.94, -82.29, 'small'),
  generateFacility('FL-ORL-001', 'Orlando Fulfillment', 'Orlando, FL', 28.54, -81.38, 'large'),
  generateFacility('FL-ORL-002', 'Orlando South DC', 'Kissimmee, FL', 28.29, -81.41, 'medium'),
  generateFacility('FL-FTL-001', 'Fort Lauderdale Hub', 'Fort Lauderdale, FL', 26.12, -80.14, 'medium'),
  generateFacility('FL-WPB-001', 'West Palm Beach DC', 'West Palm Beach, FL', 26.72, -80.05, 'small'),
  generateFacility('FL-PNS-001', 'Pensacola Regional', 'Pensacola, FL', 30.42, -87.22, 'small'),
  generateFacility('FL-TLH-001', 'Tallahassee Hub', 'Tallahassee, FL', 30.44, -84.28, 'small'),
  generateFacility('FL-ZPH-001', 'Zephyrhills Water Plant', 'Zephyrhills, FL', 28.23, -82.18, 'medium'),
  
  // Georgia (10)
  generateFacility('GA-ATL-001', 'Atlanta Main DC', 'Atlanta, GA', 33.75, -84.39, 'large'),
  generateFacility('GA-ATL-002', 'Atlanta South', 'College Park, GA', 33.65, -84.45, 'large'),
  generateFacility('GA-ATL-003', 'Atlanta East', 'Stone Mountain, GA', 33.80, -84.17, 'medium'),
  generateFacility('GA-ATL-004', 'Atlanta West', 'Douglasville, GA', 33.75, -84.75, 'medium'),
  generateFacility('GA-SAV-001', 'Savannah Port', 'Savannah, GA', 32.08, -81.09, 'large'),
  generateFacility('GA-SAV-002', 'Savannah Inland', 'Garden City, GA', 32.12, -81.17, 'medium'),
  generateFacility('GA-AUG-001', 'Augusta Regional', 'Augusta, GA', 33.47, -82.01, 'small'),
  generateFacility('GA-MAC-001', 'Macon Hub', 'Macon, GA', 32.84, -83.63, 'medium'),
  generateFacility('GA-ALB-001', 'Albany Distribution', 'Albany, GA', 31.58, -84.16, 'small'),
  generateFacility('GA-COL-001', 'Columbus Depot', 'Columbus, GA', 32.46, -84.99, 'small'),
  
  // North Carolina (8)
  generateFacility('NC-CLT-001', 'Charlotte Main Hub', 'Charlotte, NC', 35.23, -80.84, 'large'),
  generateFacility('NC-CLT-002', 'Charlotte South', 'Pineville, NC', 35.08, -80.89, 'medium'),
  generateFacility('NC-RAL-001', 'Raleigh Fulfillment', 'Raleigh, NC', 35.78, -78.64, 'large'),
  generateFacility('NC-RAL-002', 'Raleigh East', 'Knightdale, NC', 35.79, -78.48, 'medium'),
  generateFacility('NC-GSO-001', 'Greensboro DC', 'Greensboro, NC', 36.07, -79.79, 'medium'),
  generateFacility('NC-WIL-001', 'Wilmington Port', 'Wilmington, NC', 34.23, -77.94, 'medium'),
  generateFacility('NC-FAY-001', 'Fayetteville Regional', 'Fayetteville, NC', 35.05, -78.88, 'small'),
  generateFacility('NC-ASH-001', 'Asheville Hub', 'Asheville, NC', 35.60, -82.55, 'small'),
  
  // South Carolina (6)
  generateFacility('SC-CHS-001', 'Charleston Port', 'Charleston, SC', 32.78, -79.93, 'large'),
  generateFacility('SC-CHS-002', 'Charleston Inland', 'Summerville, SC', 33.02, -80.18, 'medium'),
  generateFacility('SC-GVL-001', 'Greenville DC', 'Greenville, SC', 34.85, -82.40, 'large'),
  generateFacility('SC-GVL-002', 'Spartanburg Hub', 'Spartanburg, SC', 34.95, -81.93, 'medium'),
  generateFacility('SC-COL-001', 'Columbia Distribution', 'Columbia, SC', 34.00, -81.03, 'medium'),
  generateFacility('SC-MYR-001', 'Myrtle Beach Depot', 'Myrtle Beach, SC', 33.69, -78.89, 'small'),
  
  // Alabama (6)
  generateFacility('AL-BHM-001', 'Birmingham Main', 'Birmingham, AL', 33.52, -86.80, 'large'),
  generateFacility('AL-BHM-002', 'Birmingham East', 'Leeds, AL', 33.55, -86.56, 'medium'),
  generateFacility('AL-MOB-001', 'Mobile Port', 'Mobile, AL', 30.69, -88.04, 'large'),
  generateFacility('AL-HUN-001', 'Huntsville DC', 'Huntsville, AL', 34.73, -86.59, 'medium'),
  generateFacility('AL-MGM-001', 'Montgomery Hub', 'Montgomery, AL', 32.37, -86.30, 'medium'),
  generateFacility('AL-DOT-001', 'Dothan Depot', 'Dothan, AL', 31.22, -85.39, 'small'),
  
  // Mississippi (5)
  generateFacility('MS-JAN-001', 'Jackson Main DC', 'Jackson, MS', 32.30, -90.18, 'medium'),
  generateFacility('MS-GUL-001', 'Gulfport Port', 'Gulfport, MS', 30.37, -89.09, 'medium'),
  generateFacility('MS-TUP-001', 'Tupelo Regional', 'Tupelo, MS', 34.26, -88.70, 'small'),
  generateFacility('MS-HAT-001', 'Hattiesburg Hub', 'Hattiesburg, MS', 31.33, -89.29, 'small'),
  generateFacility('MS-MER-001', 'Meridian Depot', 'Meridian, MS', 32.36, -88.70, 'small'),

  // ============================================================================
  // CENTRAL / SOUTH REGION (50 facilities)
  // ============================================================================
  
  // Texas (20)
  generateFacility('TX-DFW-001', 'Dallas Main DC', 'Dallas, TX', 32.78, -96.80, 'large'),
  generateFacility('TX-DFW-002', 'Dallas North', 'Plano, TX', 33.02, -96.70, 'large'),
  generateFacility('TX-DFW-003', 'Fort Worth Hub', 'Fort Worth, TX', 32.75, -97.33, 'large'),
  generateFacility('TX-DFW-004', 'Arlington DC', 'Arlington, TX', 32.74, -97.11, 'medium'),
  generateFacility('TX-DFW-005', 'Irving Distribution', 'Irving, TX', 32.81, -96.95, 'medium'),
  generateFacility('TX-HOU-001', 'Houston Main', 'Houston, TX', 29.76, -95.37, 'large'),
  generateFacility('TX-HOU-002', 'Houston North', 'Spring, TX', 30.08, -95.42, 'large'),
  generateFacility('TX-HOU-003', 'Houston East', 'Baytown, TX', 29.74, -94.98, 'medium'),
  generateFacility('TX-HOU-004', 'Houston Port', 'Pasadena, TX', 29.69, -95.21, 'large'),
  generateFacility('TX-SAT-001', 'San Antonio Main', 'San Antonio, TX', 29.42, -98.49, 'large'),
  generateFacility('TX-SAT-002', 'San Antonio North', 'Schertz, TX', 29.55, -98.27, 'medium'),
  generateFacility('TX-AUS-001', 'Austin Fulfillment', 'Austin, TX', 30.27, -97.74, 'large'),
  generateFacility('TX-AUS-002', 'Austin South', 'Kyle, TX', 30.00, -97.88, 'medium'),
  generateFacility('TX-ELP-001', 'El Paso Border Hub', 'El Paso, TX', 31.76, -106.49, 'large'),
  generateFacility('TX-ELP-002', 'El Paso East', 'Socorro, TX', 31.65, -106.26, 'medium'),
  generateFacility('TX-LBB-001', 'Lubbock Regional', 'Lubbock, TX', 33.58, -101.86, 'small'),
  generateFacility('TX-CRP-001', 'Corpus Christi DC', 'Corpus Christi, TX', 27.80, -97.40, 'medium'),
  generateFacility('TX-LAR-001', 'Laredo Border', 'Laredo, TX', 27.51, -99.51, 'large'),
  generateFacility('TX-MCA-001', 'McAllen Border', 'McAllen, TX', 26.20, -98.23, 'medium'),
  generateFacility('TX-AMR-001', 'Amarillo Hub', 'Amarillo, TX', 35.22, -101.83, 'small'),
  
  // Louisiana (6)
  generateFacility('LA-NOL-001', 'New Orleans Port', 'New Orleans, LA', 29.95, -90.07, 'large'),
  generateFacility('LA-NOL-002', 'New Orleans East', 'Kenner, LA', 29.99, -90.24, 'medium'),
  generateFacility('LA-BTR-001', 'Baton Rouge DC', 'Baton Rouge, LA', 30.45, -91.15, 'large'),
  generateFacility('LA-SHV-001', 'Shreveport Hub', 'Shreveport, LA', 32.53, -93.75, 'medium'),
  generateFacility('LA-LAF-001', 'Lafayette Regional', 'Lafayette, LA', 30.22, -92.02, 'small'),
  generateFacility('LA-LCH-001', 'Lake Charles Depot', 'Lake Charles, LA', 30.23, -93.22, 'small'),
  
  // Oklahoma (5)
  generateFacility('OK-OKC-001', 'Oklahoma City Main', 'Oklahoma City, OK', 35.47, -97.52, 'large'),
  generateFacility('OK-OKC-002', 'Oklahoma City South', 'Moore, OK', 35.34, -97.49, 'medium'),
  generateFacility('OK-TUL-001', 'Tulsa DC', 'Tulsa, OK', 36.15, -95.99, 'large'),
  generateFacility('OK-TUL-002', 'Tulsa East', 'Broken Arrow, OK', 36.05, -95.79, 'medium'),
  generateFacility('OK-LAW-001', 'Lawton Regional', 'Lawton, OK', 34.61, -98.39, 'small'),
  
  // Arkansas (5)
  generateFacility('AR-LIT-001', 'Little Rock Main', 'Little Rock, AR', 34.75, -92.29, 'large'),
  generateFacility('AR-LIT-002', 'Little Rock North', 'Conway, AR', 35.09, -92.44, 'medium'),
  generateFacility('AR-FYV-001', 'Fayetteville Hub', 'Fayetteville, AR', 36.06, -94.16, 'medium'),
  generateFacility('AR-FSM-001', 'Fort Smith DC', 'Fort Smith, AR', 35.39, -94.40, 'medium'),
  generateFacility('AR-JON-001', 'Jonesboro Depot', 'Jonesboro, AR', 35.84, -90.70, 'small'),
  
  // Tennessee (10)
  generateFacility('TN-MEM-001', 'Memphis Super Hub', 'Memphis, TN', 35.15, -90.05, 'large'),
  generateFacility('TN-MEM-002', 'Memphis East', 'Collierville, TN', 35.04, -89.66, 'large'),
  generateFacility('TN-MEM-003', 'Memphis Airport DC', 'Memphis, TN', 35.06, -89.98, 'large'),
  generateFacility('TN-NSH-001', 'Nashville Main', 'Nashville, TN', 36.16, -86.78, 'large'),
  generateFacility('TN-NSH-002', 'Nashville South', 'Murfreesboro, TN', 35.85, -86.39, 'medium'),
  generateFacility('TN-NSH-003', 'Nashville East', 'Lebanon, TN', 36.21, -86.29, 'medium'),
  generateFacility('TN-KNX-001', 'Knoxville DC', 'Knoxville, TN', 35.96, -83.92, 'medium'),
  generateFacility('TN-CHT-001', 'Chattanooga Hub', 'Chattanooga, TN', 35.05, -85.31, 'medium'),
  generateFacility('TN-JCT-001', 'Johnson City Depot', 'Johnson City, TN', 36.31, -82.35, 'small'),
  generateFacility('TN-CLK-001', 'Clarksville Regional', 'Clarksville, TN', 36.53, -87.36, 'small'),
  
  // Kentucky (4)
  generateFacility('KY-LOU-001', 'Louisville Main DC', 'Louisville, KY', 38.25, -85.76, 'large'),
  generateFacility('KY-LOU-002', 'Louisville UPS Hub', 'Louisville, KY', 38.17, -85.74, 'large'),
  generateFacility('KY-LEX-001', 'Lexington Distribution', 'Lexington, KY', 38.04, -84.50, 'medium'),
  generateFacility('KY-CVG-001', 'Covington Regional', 'Covington, KY', 39.08, -84.51, 'medium'),

  // ============================================================================
  // MIDWEST REGION (50 facilities)
  // ============================================================================
  
  // Illinois (10)
  generateFacility('IL-CHI-001', 'Chicago Main DC', 'Chicago, IL', 41.88, -87.63, 'large'),
  generateFacility('IL-CHI-002', 'Chicago South', 'Joliet, IL', 41.53, -88.08, 'large'),
  generateFacility('IL-CHI-003', 'Chicago West', 'Aurora, IL', 41.76, -88.32, 'large'),
  generateFacility('IL-CHI-004', 'Chicago North', 'Waukegan, IL', 42.36, -87.84, 'medium'),
  generateFacility('IL-CHI-005', 'Chicago Heights', 'Chicago Heights, IL', 41.51, -87.64, 'medium'),
  generateFacility('IL-CHI-006', 'Elgin Hub', 'Elgin, IL', 42.04, -88.28, 'medium'),
  generateFacility('IL-RFD-001', 'Rockford DC', 'Rockford, IL', 42.27, -89.09, 'medium'),
  generateFacility('IL-SPR-001', 'Springfield Regional', 'Springfield, IL', 39.80, -89.64, 'medium'),
  generateFacility('IL-PEO-001', 'Peoria Hub', 'Peoria, IL', 40.69, -89.59, 'small'),
  generateFacility('IL-ESL-001', 'East St. Louis DC', 'East St. Louis, IL', 38.62, -90.15, 'medium'),
  
  // Ohio (10)
  generateFacility('OH-COL-001', 'Columbus Main DC', 'Columbus, OH', 39.96, -83.00, 'large'),
  generateFacility('OH-COL-002', 'Columbus East', 'Reynoldsburg, OH', 39.96, -82.81, 'large'),
  generateFacility('OH-COL-003', 'Columbus West', 'Grove City, OH', 39.88, -83.09, 'medium'),
  generateFacility('OH-CLE-001', 'Cleveland Main', 'Cleveland, OH', 41.50, -81.69, 'large'),
  generateFacility('OH-CLE-002', 'Cleveland East', 'Mentor, OH', 41.67, -81.34, 'medium'),
  generateFacility('OH-CIN-001', 'Cincinnati Main', 'Cincinnati, OH', 39.10, -84.51, 'large'),
  generateFacility('OH-CIN-002', 'Cincinnati North', 'Mason, OH', 39.36, -84.31, 'medium'),
  generateFacility('OH-TOL-001', 'Toledo Distribution', 'Toledo, OH', 41.66, -83.56, 'medium'),
  generateFacility('OH-DAY-001', 'Dayton Hub', 'Dayton, OH', 39.76, -84.19, 'medium'),
  generateFacility('OH-AKR-001', 'Akron Regional', 'Akron, OH', 41.08, -81.52, 'medium'),
  
  // Michigan (8)
  generateFacility('MI-DET-001', 'Detroit Main', 'Detroit, MI', 42.33, -83.05, 'large'),
  generateFacility('MI-DET-002', 'Detroit North', 'Troy, MI', 42.58, -83.15, 'large'),
  generateFacility('MI-DET-003', 'Detroit South', 'Taylor, MI', 42.24, -83.27, 'medium'),
  generateFacility('MI-GRR-001', 'Grand Rapids DC', 'Grand Rapids, MI', 42.96, -85.66, 'large'),
  generateFacility('MI-LAN-001', 'Lansing Hub', 'Lansing, MI', 42.73, -84.56, 'medium'),
  generateFacility('MI-FLN-001', 'Flint Regional', 'Flint, MI', 43.01, -83.69, 'medium'),
  generateFacility('MI-ANN-001', 'Ann Arbor Depot', 'Ann Arbor, MI', 42.28, -83.74, 'small'),
  generateFacility('MI-KAL-001', 'Kalamazoo Hub', 'Kalamazoo, MI', 42.29, -85.59, 'small'),
  
  // Indiana (6)
  generateFacility('IN-IND-001', 'Indianapolis Main', 'Indianapolis, IN', 39.77, -86.16, 'large'),
  generateFacility('IN-IND-002', 'Indianapolis East', 'Greenfield, IN', 39.79, -85.77, 'large'),
  generateFacility('IN-IND-003', 'Indianapolis South', 'Greenwood, IN', 39.61, -86.11, 'medium'),
  generateFacility('IN-FTW-001', 'Fort Wayne DC', 'Fort Wayne, IN', 41.08, -85.14, 'medium'),
  generateFacility('IN-EVV-001', 'Evansville Hub', 'Evansville, IN', 37.97, -87.56, 'medium'),
  generateFacility('IN-SBN-001', 'South Bend Regional', 'South Bend, IN', 41.68, -86.25, 'small'),
  
  // Missouri (6)
  generateFacility('MO-STL-001', 'St. Louis Main', 'St. Louis, MO', 38.63, -90.20, 'large'),
  generateFacility('MO-STL-002', 'St. Louis West', 'Chesterfield, MO', 38.66, -90.58, 'large'),
  generateFacility('MO-KCM-001', 'Kansas City Main', 'Kansas City, MO', 39.10, -94.58, 'large'),
  generateFacility('MO-KCM-002', 'Kansas City North', 'North Kansas City, MO', 39.13, -94.57, 'medium'),
  generateFacility('MO-SPF-001', 'Springfield DC', 'Springfield, MO', 37.22, -93.29, 'medium'),
  generateFacility('MO-COL-001', 'Columbia Hub', 'Columbia, MO', 38.95, -92.33, 'small'),
  
  // Wisconsin (5)
  generateFacility('WI-MKE-001', 'Milwaukee Main', 'Milwaukee, WI', 43.04, -87.91, 'large'),
  generateFacility('WI-MKE-002', 'Milwaukee South', 'Oak Creek, WI', 42.89, -87.90, 'medium'),
  generateFacility('WI-MAD-001', 'Madison DC', 'Madison, WI', 43.07, -89.40, 'medium'),
  generateFacility('WI-GRB-001', 'Green Bay Hub', 'Green Bay, WI', 44.51, -88.02, 'medium'),
  generateFacility('WI-APP-001', 'Appleton Regional', 'Appleton, WI', 44.26, -88.42, 'small'),
  
  // Minnesota (5)
  generateFacility('MN-MSP-001', 'Minneapolis Main', 'Minneapolis, MN', 44.98, -93.27, 'large'),
  generateFacility('MN-MSP-002', 'Minneapolis South', 'Bloomington, MN', 44.84, -93.30, 'large'),
  generateFacility('MN-STP-001', 'St. Paul DC', 'St. Paul, MN', 44.95, -93.09, 'medium'),
  generateFacility('MN-ROC-001', 'Rochester Hub', 'Rochester, MN', 44.02, -92.47, 'medium'),
  generateFacility('MN-DLH-001', 'Duluth Regional', 'Duluth, MN', 46.79, -92.10, 'small'),

  // ============================================================================
  // NORTHEAST REGION (50 facilities)
  // ============================================================================
  
  // New York (10)
  generateFacility('NY-NYC-001', 'New York Metro', 'Bronx, NY', 40.85, -73.87, 'large'),
  generateFacility('NY-NYC-002', 'Brooklyn Distribution', 'Brooklyn, NY', 40.65, -73.95, 'large'),
  generateFacility('NY-NYC-003', 'Queens Hub', 'Jamaica, NY', 40.69, -73.79, 'medium'),
  generateFacility('NY-LI-001', 'Long Island DC', 'Melville, NY', 40.79, -73.41, 'large'),
  generateFacility('NY-LI-002', 'Long Island East', 'Riverhead, NY', 40.92, -72.66, 'medium'),
  generateFacility('NY-ALB-001', 'Albany Distribution', 'Albany, NY', 42.65, -73.76, 'medium'),
  generateFacility('NY-BUF-001', 'Buffalo Main', 'Buffalo, NY', 42.89, -78.88, 'medium'),
  generateFacility('NY-ROC-001', 'Rochester DC', 'Rochester, NY', 43.16, -77.61, 'medium'),
  generateFacility('NY-SYR-001', 'Syracuse Hub', 'Syracuse, NY', 43.05, -76.15, 'medium'),
  generateFacility('NY-WHT-001', 'Westchester Depot', 'White Plains, NY', 41.03, -73.76, 'small'),
  
  // New Jersey (8)
  generateFacility('NJ-NWK-001', 'Newark Main DC', 'Newark, NJ', 40.74, -74.17, 'large'),
  generateFacility('NJ-NWK-002', 'Newark Port', 'Elizabeth, NJ', 40.66, -74.21, 'large'),
  generateFacility('NJ-JER-001', 'Jersey City Hub', 'Jersey City, NJ', 40.73, -74.04, 'large'),
  generateFacility('NJ-EDI-001', 'Edison Distribution', 'Edison, NJ', 40.52, -74.41, 'large'),
  generateFacility('NJ-TRN-001', 'Trenton Regional', 'Trenton, NJ', 40.22, -74.76, 'medium'),
  generateFacility('NJ-CAM-001', 'Camden DC', 'Camden, NJ', 39.93, -75.12, 'medium'),
  generateFacility('NJ-MOR-001', 'Morristown Hub', 'Morristown, NJ', 40.80, -74.48, 'medium'),
  generateFacility('NJ-PAT-001', 'Paterson Depot', 'Paterson, NJ', 40.92, -74.17, 'small'),
  
  // Pennsylvania (8)
  generateFacility('PA-PHI-001', 'Philadelphia Main', 'Philadelphia, PA', 39.95, -75.17, 'large'),
  generateFacility('PA-PHI-002', 'Philadelphia North', 'Bensalem, PA', 40.10, -74.95, 'large'),
  generateFacility('PA-PHI-003', 'Philadelphia West', 'King of Prussia, PA', 40.09, -75.38, 'medium'),
  generateFacility('PA-PIT-001', 'Pittsburgh Main', 'Pittsburgh, PA', 40.44, -80.00, 'large'),
  generateFacility('PA-PIT-002', 'Pittsburgh South', 'Canonsburg, PA', 40.27, -80.19, 'medium'),
  generateFacility('PA-HAR-001', 'Harrisburg DC', 'Harrisburg, PA', 40.27, -76.88, 'large'),
  generateFacility('PA-ALL-001', 'Allentown Hub', 'Allentown, PA', 40.60, -75.47, 'medium'),
  generateFacility('PA-SCR-001', 'Scranton Regional', 'Scranton, PA', 41.41, -75.66, 'medium'),
  
  // Massachusetts (6)
  generateFacility('MA-BOS-001', 'Boston Main', 'Boston, MA', 42.36, -71.06, 'large'),
  generateFacility('MA-BOS-002', 'Boston South', 'Braintree, MA', 42.20, -71.00, 'large'),
  generateFacility('MA-BOS-003', 'Boston West', 'Framingham, MA', 42.28, -71.42, 'medium'),
  generateFacility('MA-WOR-001', 'Worcester DC', 'Worcester, MA', 42.26, -71.80, 'medium'),
  generateFacility('MA-SPR-001', 'Springfield Hub', 'Springfield, MA', 42.10, -72.59, 'medium'),
  generateFacility('MA-LOW-001', 'Lowell Regional', 'Lowell, MA', 42.63, -71.32, 'small'),
  
  // Connecticut (4)
  generateFacility('CT-HAR-001', 'Hartford Main', 'Hartford, CT', 41.76, -72.69, 'medium'),
  generateFacility('CT-BRD-001', 'Bridgeport DC', 'Bridgeport, CT', 41.18, -73.19, 'medium'),
  generateFacility('CT-NHV-001', 'New Haven Hub', 'New Haven, CT', 41.31, -72.93, 'medium'),
  generateFacility('CT-STA-001', 'Stamford Depot', 'Stamford, CT', 41.05, -73.54, 'small'),
  
  // Virginia (6)
  generateFacility('VA-NOR-001', 'Norfolk Port', 'Norfolk, VA', 36.85, -76.29, 'large'),
  generateFacility('VA-NOR-002', 'Virginia Beach DC', 'Virginia Beach, VA', 36.85, -75.98, 'medium'),
  generateFacility('VA-RIC-001', 'Richmond Main', 'Richmond, VA', 37.54, -77.44, 'large'),
  generateFacility('VA-RIC-002', 'Richmond South', 'Chester, VA', 37.35, -77.41, 'medium'),
  generateFacility('VA-DC-001', 'Northern Virginia', 'Sterling, VA', 39.01, -77.43, 'large'),
  generateFacility('VA-DC-002', 'Manassas Hub', 'Manassas, VA', 38.75, -77.48, 'medium'),
  
  // Maryland (4)
  generateFacility('MD-BAL-001', 'Baltimore Main', 'Baltimore, MD', 39.29, -76.61, 'large'),
  generateFacility('MD-BAL-002', 'Baltimore Port', 'Dundalk, MD', 39.25, -76.52, 'large'),
  generateFacility('MD-DC-001', 'DC Metro Hub', 'Landover, MD', 38.93, -76.90, 'large'),
  generateFacility('MD-FRD-001', 'Frederick Regional', 'Frederick, MD', 39.41, -77.41, 'medium'),
  
  // Other NE States (4)
  generateFacility('NH-MAN-001', 'Manchester DC', 'Manchester, NH', 42.99, -71.46, 'medium'),
  generateFacility('RI-PRV-001', 'Providence Hub', 'Providence, RI', 41.82, -71.41, 'medium'),
  generateFacility('ME-POR-001', 'Portland Maine', 'Portland, ME', 43.66, -70.26, 'small'),
  generateFacility('VT-BUR-001', 'Burlington Depot', 'Burlington, VT', 44.48, -73.21, 'small'),

  // ============================================================================
  // WEST / PACIFIC REGION (50 facilities)
  // ============================================================================
  
  // California (18)
  generateFacility('CA-LAX-001', 'Los Angeles Main', 'Los Angeles, CA', 34.05, -118.24, 'large'),
  generateFacility('CA-LAX-002', 'Los Angeles South', 'Carson, CA', 33.83, -118.26, 'large'),
  generateFacility('CA-LAX-003', 'Los Angeles East', 'City of Industry, CA', 34.02, -117.93, 'large'),
  generateFacility('CA-LGB-001', 'Long Beach Port', 'Long Beach, CA', 33.77, -118.19, 'large'),
  generateFacility('CA-LGB-002', 'Long Beach Inland', 'Signal Hill, CA', 33.80, -118.17, 'medium'),
  generateFacility('CA-SFO-001', 'San Francisco Bay', 'Oakland, CA', 37.80, -122.27, 'large'),
  generateFacility('CA-SFO-002', 'San Francisco South', 'San Bruno, CA', 37.63, -122.41, 'medium'),
  generateFacility('CA-SJC-001', 'San Jose DC', 'San Jose, CA', 37.34, -121.89, 'large'),
  generateFacility('CA-SAC-001', 'Sacramento Main', 'Sacramento, CA', 38.58, -121.49, 'large'),
  generateFacility('CA-SAC-002', 'Sacramento East', 'Rancho Cordova, CA', 38.59, -121.30, 'medium'),
  generateFacility('CA-SAN-001', 'San Diego Main', 'San Diego, CA', 32.72, -117.16, 'large'),
  generateFacility('CA-SAN-002', 'San Diego North', 'Carlsbad, CA', 33.16, -117.35, 'medium'),
  generateFacility('CA-RIV-001', 'Riverside/IE Hub', 'Riverside, CA', 33.95, -117.40, 'large'),
  generateFacility('CA-ONT-001', 'Ontario DC', 'Ontario, CA', 34.07, -117.65, 'large'),
  generateFacility('CA-FRE-001', 'Fresno Distribution', 'Fresno, CA', 36.74, -119.79, 'medium'),
  generateFacility('CA-BAK-001', 'Bakersfield Hub', 'Bakersfield, CA', 35.37, -119.02, 'medium'),
  generateFacility('CA-STK-001', 'Stockton DC', 'Stockton, CA', 37.96, -121.29, 'medium'),
  generateFacility('CA-MOD-001', 'Modesto Regional', 'Modesto, CA', 37.64, -121.00, 'small'),
  
  // Washington (6)
  generateFacility('WA-SEA-001', 'Seattle Main', 'Seattle, WA', 47.61, -122.33, 'large'),
  generateFacility('WA-SEA-002', 'Seattle South', 'Tukwila, WA', 47.47, -122.26, 'large'),
  generateFacility('WA-TAC-001', 'Tacoma Port', 'Tacoma, WA', 47.25, -122.44, 'large'),
  generateFacility('WA-SPO-001', 'Spokane DC', 'Spokane, WA', 47.66, -117.43, 'medium'),
  generateFacility('WA-VAN-001', 'Vancouver Hub', 'Vancouver, WA', 45.64, -122.66, 'medium'),
  generateFacility('WA-TRI-001', 'Tri-Cities Depot', 'Kennewick, WA', 46.21, -119.14, 'small'),
  
  // Oregon (4)
  generateFacility('OR-PDX-001', 'Portland Main', 'Portland, OR', 45.52, -122.68, 'large'),
  generateFacility('OR-PDX-002', 'Portland East', 'Gresham, OR', 45.50, -122.43, 'medium'),
  generateFacility('OR-SAL-001', 'Salem Hub', 'Salem, OR', 44.94, -123.04, 'medium'),
  generateFacility('OR-EUG-001', 'Eugene Regional', 'Eugene, OR', 44.05, -123.09, 'small'),
  
  // Arizona (5)
  generateFacility('AZ-PHX-001', 'Phoenix Main', 'Phoenix, AZ', 33.45, -112.07, 'large'),
  generateFacility('AZ-PHX-002', 'Phoenix West', 'Goodyear, AZ', 33.44, -112.36, 'large'),
  generateFacility('AZ-PHX-003', 'Phoenix East', 'Mesa, AZ', 33.42, -111.82, 'medium'),
  generateFacility('AZ-TUC-001', 'Tucson DC', 'Tucson, AZ', 32.22, -110.93, 'medium'),
  generateFacility('AZ-FLG-001', 'Flagstaff Depot', 'Flagstaff, AZ', 35.20, -111.65, 'small'),
  
  // Colorado (5)
  generateFacility('CO-DEN-001', 'Denver Main', 'Denver, CO', 39.74, -104.99, 'large'),
  generateFacility('CO-DEN-002', 'Denver East', 'Aurora, CO', 39.73, -104.83, 'large'),
  generateFacility('CO-DEN-003', 'Denver North', 'Commerce City, CO', 39.81, -104.93, 'medium'),
  generateFacility('CO-COS-001', 'Colorado Springs', 'Colorado Springs, CO', 38.83, -104.82, 'medium'),
  generateFacility('CO-FTC-001', 'Fort Collins Hub', 'Fort Collins, CO', 40.59, -105.08, 'small'),
  
  // Nevada (4)
  generateFacility('NV-LVG-001', 'Las Vegas Main', 'Las Vegas, NV', 36.17, -115.14, 'large'),
  generateFacility('NV-LVG-002', 'Las Vegas North', 'North Las Vegas, NV', 36.27, -115.12, 'large'),
  generateFacility('NV-RNO-001', 'Reno DC', 'Reno, NV', 39.53, -119.81, 'large'),
  generateFacility('NV-RNO-002', 'Reno Tahoe', 'Sparks, NV', 39.54, -119.75, 'medium'),
  
  // Utah (4)
  generateFacility('UT-SLC-001', 'Salt Lake City Main', 'Salt Lake City, UT', 40.76, -111.89, 'large'),
  generateFacility('UT-SLC-002', 'Salt Lake South', 'West Jordan, UT', 40.61, -111.94, 'medium'),
  generateFacility('UT-OGD-001', 'Ogden DC', 'Ogden, UT', 41.23, -111.97, 'medium'),
  generateFacility('UT-PRO-001', 'Provo Hub', 'Provo, UT', 40.23, -111.66, 'small'),
  
  // Other Western States (4)
  generateFacility('NM-ABQ-001', 'Albuquerque Main', 'Albuquerque, NM', 35.08, -106.65, 'medium'),
  generateFacility('ID-BOI-001', 'Boise DC', 'Boise, ID', 43.62, -116.21, 'medium'),
  generateFacility('MT-BIL-001', 'Billings Hub', 'Billings, MT', 45.78, -108.50, 'small'),
  generateFacility('WY-CHE-001', 'Cheyenne Depot', 'Cheyenne, WY', 41.14, -104.82, 'small'),
];

// Utility functions - Industrial Fluidity color palette
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#10B981'; // Green
  if (score >= 50) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online': return '#10B981'; // Green
    case 'warning': return '#F59E0B'; // Amber
    case 'offline': return '#EF4444'; // Red
    default: return '#64748B'; // Steel
  }
};

export const getNetworkStats = () => ({
  total: NETWORK_FACILITIES.length,
  online: NETWORK_FACILITIES.filter(f => f.status === 'online').length,
  warning: NETWORK_FACILITIES.filter(f => f.status === 'warning').length,
  offline: NETWORK_FACILITIES.filter(f => f.status === 'offline').length,
  avgScore: Math.round(NETWORK_FACILITIES.reduce((sum, f) => sum + f.score, 0) / NETWORK_FACILITIES.length * 10) / 10,
  totalTrucks: NETWORK_FACILITIES.reduce((sum, f) => sum + f.trucksToday, 0),
  totalDocks: NETWORK_FACILITIES.reduce((sum, f) => sum + f.dockDoors, 0),
  totalTrailerSpots: NETWORK_FACILITIES.reduce((sum, f) => sum + f.trailerSpots, 0),
});
