import { toast } from 'react-toastify';

export const handleSuccess = (msg) =>{
    toast.success(msg, {
        position: 'top-center',
        theme: 'dark',
        autoClose: 2000,
    })
}

export const handleError = (msg) =>{
    toast.error(msg, {
        position: "top-center",
        theme: 'dark',
        autoClose: 2000,
    })
}

/**
 * Resolves centroid latitude and longitude for a given 6-digit Indian pincode via OpenStreetMap Nominatim
 */
export const fetchPincodeCoordinates = async (pincode) => {
  if (!pincode || String(pincode).trim().length !== 6) return null;
  const cleanPin = String(pincode).trim();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(cleanPin)}&country=India&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
    }
  } catch (err) {
    console.warn("Pincode centroid geocoding warning:", err);
  }
  return null;
};