/**
 * Geo-spatial helper utility for Hyperlocal Marketplace
 */

// City Center Coordinate Database (defaults for Indian metros & major cities)
const CITY_COORDINATES = {
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'ludhiana': { lat: 30.9010, lng: 75.8573 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
};

// High-priority Pincode Centroid Lookup (resolves exact neighborhood centers)
const PINCODE_COORDINATES = {
  // Hyderabad & Secunderabad
  '500084': { lat: 17.4628, lng: 78.3614, area: 'Kondapur / Kothaguda' },
  '500081': { lat: 17.4483, lng: 78.3915, area: 'Madhapur / Hitec City' },
  '500032': { lat: 17.4401, lng: 78.3489, area: 'Gachibowli' },
  '500034': { lat: 17.4156, lng: 78.4357, area: 'Banjara Hills' },
  '500033': { lat: 17.4319, lng: 78.4073, area: 'Jubilee Hills' },
  '500072': { lat: 17.4849, lng: 78.4138, area: 'Kukatpally' },
  '500019': { lat: 17.4837, lng: 78.3158, area: 'Serilingampally' },
  '500001': { lat: 17.3871, lng: 78.4734, area: 'Hyderabad GPO / Abids' },
  '500003': { lat: 17.4399, lng: 78.4983, area: 'Secunderabad' },
  '500090': { lat: 17.5186, lng: 78.3842, area: 'Nizampet' },
  '500049': { lat: 17.4988, lng: 78.3472, area: 'Miyapur' },

  // Bengaluru
  '560001': { lat: 12.9797, lng: 77.5947, area: 'Bengaluru GPO / MG Road' },
  '560038': { lat: 12.9784, lng: 77.6408, area: 'Indiranagar' },
  '560034': { lat: 12.9352, lng: 77.6245, area: 'Koramangala' },
  '560066': { lat: 12.9698, lng: 77.7500, area: 'Whitefield' },
  '560100': { lat: 12.8452, lng: 77.6602, area: 'Electronic City' },
  '560076': { lat: 12.8893, lng: 77.5976, area: 'BTM Layout / Bannerghatta' },

  // Delhi NCR
  '110001': { lat: 28.6293, lng: 77.2189, area: 'Connaught Place' },
  '110085': { lat: 28.7142, lng: 77.1082, area: 'Rohini' },
  '110016': { lat: 28.5494, lng: 77.2001, area: 'Hauz Khas' },
  '201301': { lat: 28.5700, lng: 77.3271, area: 'Noida Sector 1-19' },
  '122001': { lat: 28.4595, lng: 77.0266, area: 'Gurugram' },

  // Mumbai & Pune
  '400001': { lat: 18.9322, lng: 72.8347, area: 'Fort / South Mumbai' },
  '400050': { lat: 19.0596, lng: 72.8295, area: 'Bandra West' },
  '400053': { lat: 19.1363, lng: 72.8277, area: 'Andheri West' },
  '411001': { lat: 18.5204, lng: 73.8567, area: 'Pune Station' },
  '411057': { lat: 18.5913, lng: 73.7389, area: 'Hinjawadi' }
};

/**
 * Derives deterministic latitude & longitude for a location (city, pincode, area)
 */
function resolveCoordinates({ latitude, longitude, pincode, city, area, id, label = '' }) {
  const prefix = label ? `[geoUtils:${label}]` : '[geoUtils]';

  // 1. Exact GPS coordinates (highest priority)
  if (
    latitude !== undefined && latitude !== null && !isNaN(latitude) && Number(latitude) !== 0 &&
    longitude !== undefined && longitude !== null && !isNaN(longitude) && Number(longitude) !== 0
  ) {
    const coords = { lat: Number(latitude), lng: Number(longitude) };
    console.log(`📍 ${prefix} Using exact GPS coordinates: (${coords.lat}, ${coords.lng})`);
    return coords;
  }

  // 2. Pincode centroid lookup (priority over city center!)
  const cleanPin = pincode ? String(pincode).trim() : '';
  const pincodeEntry = cleanPin ? PINCODE_COORDINATES[cleanPin] : null;

  if (pincodeEntry) {
    let seedStr = (area || '') + (id ? id.toString() : '');
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = (((hash % 100) - 50) / 100000) * 2;
    const lngOffset = (((((hash >> 2) % 100)) - 50) / 100000) * 2;
    const coords = {
      lat: Number((pincodeEntry.lat + latOffset).toFixed(6)),
      lng: Number((pincodeEntry.lng + lngOffset).toFixed(6))
    };
    console.log(`📮 ${prefix} Resolved via PINCODE (${cleanPin} - ${pincodeEntry.area}) centroid: (${coords.lat}, ${coords.lng})`);
    return coords;
  }

  // 3. City Center fallback
  const cityKey = (city || '').trim().toLowerCase();
  const baseCoords = CITY_COORDINATES[cityKey] || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi center

  // Generate a deterministic offset based on pincode & area so items don't stack on top of each other
  let seedStr = (pincode || '000000') + (area || '') + (id ? id.toString() : '');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const latOffset = (((hash % 100) - 50) / 10000) * 2;
  const lngOffset = (((((hash >> 2) % 100)) - 50) / 10000) * 2;

  const coords = {
    lat: Number((baseCoords.lat + latOffset).toFixed(6)),
    lng: Number((baseCoords.lng + lngOffset).toFixed(6))
  };

  console.log(`🏙️ ${prefix} Fallback: No GPS or Pincode match for PIN '${cleanPin}'. Using city center '${cityKey || 'delhi'}': (${coords.lat}, ${coords.lng})`);
  return coords;
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2, labelA = 'Point A', labelB = 'Point B') {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    console.log(`⚠️ [geoUtils:calculateDistanceKm] Missing coordinates: [${labelA}] (${lat1}, ${lon1}) to [${labelB}] (${lat2}, ${lon2}) -> Distance: null`);
    return null;
  }

  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Number((R * c).toFixed(1)); // Rounded to 1 decimal place (e.g. 1.4)

  console.log(`📏 [geoUtils:calculateDistanceKm] Distance between [${labelA}] (${lat1}, ${lon1}) and [${labelB}] (${lat2}, ${lon2}) = ${distance} km`);
  return distance;
}

module.exports = {
  CITY_COORDINATES,
  PINCODE_COORDINATES,
  resolveCoordinates,
  calculateDistanceKm
};
