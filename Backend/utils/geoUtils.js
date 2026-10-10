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

/**
 * Derives deterministic latitude & longitude for a location (city, pincode, area)
 */
function resolveCoordinates({ latitude, longitude, pincode, city, area, id }) {
  if (latitude && longitude) {
    return { lat: Number(latitude), lng: Number(longitude) };
  }

  const cityKey = (city || '').trim().toLowerCase();
  const baseCoords = CITY_COORDINATES[cityKey] || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi center

  // Generate a deterministic jitter based on pincode/area string so items in the same city don't overlap on 1 pixel
  let seedStr = (pincode || '') + (area || '') + (id ? id.toString() : '');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const latOffset = ((hash % 100) / 1000) * 0.4;
  const lngOffset = (((hash >> 2) % 100) / 1000) * 0.4;

  return {
    lat: Number((baseCoords.lat + latOffset).toFixed(6)),
    lng: Number((baseCoords.lng + lngOffset).toFixed(6))
  };
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

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
  const distance = R * c;

  return Number(distance.toFixed(1)); // Rounded to 1 decimal place (e.g. 1.4)
}

module.exports = {
  resolveCoordinates,
  calculateDistanceKm
};
