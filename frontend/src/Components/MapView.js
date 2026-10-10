import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from '../ComponentStyles/mapView.module.css';

function MapView({ listings = [], userLocation = null, onItemClick = () => {} }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Default center to user location or first item or Delhi center
    const centerLat = userLocation?.latitude || listings[0]?.latitude || 28.6139;
    const centerLng = userLocation?.longitude || listings[0]?.longitude || 77.2090;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([centerLat, centerLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng]);
    }

    // Clear existing markers
    markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    markersRef.current = [];

    // Render User Location Marker (Red Pin)
    if (userLocation?.latitude && userLocation?.longitude) {
      const userIcon = L.divIcon({
        className: 'user-map-pin',
        html: `<div style="background:#dc2626;color:#fff;padding:4px 8px;border-radius:12px;font-weight:800;font-size:0.75rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">📍 YOU</div>`,
        iconSize: [50, 24],
        iconAnchor: [25, 12]
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>📍 Your Current Location</b>');
      
      markersRef.current.push(userMarker);
    }

    // Render Price Tag Markers for Listings
    listings.forEach(item => {
      if (!item.latitude || !item.longitude) return;

      const priceIcon = L.divIcon({
        className: 'custom-price-pin',
        html: `<div class="${styles.priceMarker}">₹${item.price}</div>`,
        iconSize: [60, 26],
        iconAnchor: [30, 13]
      });

      const imgUrl = item.images && item.images.length > 0
        ? `http://localhost:9000${item.images[0]}`
        : "https://via.placeholder.com/200x110?text=No+Image";

      const popupHtml = `
        <div class="${styles.popupCard}">
          <img src="${imgUrl}" class="${styles.popupImg}" alt="${item.title}" />
          <div class="${styles.popupTitle}">${item.title}</div>
          <div class="${styles.popupPrice}">₹${item.price}</div>
          ${item.distanceKm !== null ? `<div class="${styles.popupDist}">📍 ${item.distanceKm} km away</div>` : ''}
          <button id="btn-map-${item._id}" class="${styles.popupBtn}">View Details</button>
        </div>
      `;

      const marker = L.marker([item.latitude, item.longitude], { icon: priceIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-map-${item._id}`);
        if (btn) {
          btn.onclick = () => onItemClick(item);
        }
      });

      markersRef.current.push(marker);
    });
  }, [listings, userLocation, onItemClick]);

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.mapElement} />
    </div>
  );
}

export default MapView;
