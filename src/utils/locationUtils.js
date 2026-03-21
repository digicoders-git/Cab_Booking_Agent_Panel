// src/utils/locationUtils.js
// Google Maps API Integration

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE = 'https://maps.googleapis.com/maps/api';

const GOOGLE_MAPS_API = {

  // 📍 Address → Coordinates (Geocoding)
  geocode: async (address) => {
    try {
      const url = `${GOOGLE_MAPS_BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=in`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          displayName: result.formatted_address
        };
      }
      return { success: false, error: `Location not found: ${address}` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 🔍 Address Suggestions (Autocomplete)
  getSuggestions: async (query) => {
    try {
      if (!query || query.length < 2) return [];

      const url = `${GOOGLE_MAPS_BASE}/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.predictions) {
        return data.predictions.map(item => ({
          description: item.description,
          mainText: item.structured_formatting.main_text,
          secondaryText: item.structured_formatting.secondary_text || '',
          placeId: item.place_id
        }));
      }
      return [];
    } catch (err) {
      console.error('Suggestions error:', err);
      return [];
    }
  },

  // 📏 Distance using Google Distance Matrix API
  getDistance: async (lat1, lng1, lat2, lng2) => {
    try {
      const origin = `${lat1},${lng1}`;
      const destination = `${lat2},${lng2}`;
      const url = `${GOOGLE_MAPS_BASE}/distancematrix/json?origins=${origin}&destinations=${destination}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        return parseFloat((distanceInMeters / 1000).toFixed(2)); // Convert to km
      }
      
      // Fallback to Haversine if API fails
      return calculateHaversineDistance(lat1, lng1, lat2, lng2);
    } catch (err) {
      console.error('Distance API error:', err);
      return calculateHaversineDistance(lat1, lng1, lat2, lng2);
    }
  }
};

// Fallback Haversine calculation
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((straightLine * 1.3).toFixed(2));
}

export default GOOGLE_MAPS_API;
