// src/utils/locationUtils.js
// Google Maps API Integration with Places Autocomplete

const GOOGLE_MAPS_API = {

  // 📍 Address → Coordinates (Geocoding) using Google Geocoder
  geocode: async (address) => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        resolve({ success: false, error: 'Google Maps not loaded' });
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        {
          address: address,
          componentRestrictions: { country: 'IN' }
        },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              success: true,
              lat: location.lat(),
              lng: location.lng(),
              displayName: results[0].formatted_address
            });
          } else {
            resolve({ success: false, error: `Location not found: ${address}` });
          }
        }
      );
    });
  },

  // 🔍 Get Autocomplete Service for real-time suggestions
  getAutocompleteService: () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      return new window.google.maps.places.AutocompleteService();
    }
    return null;
  },

  // 🔍 Address Suggestions (Autocomplete) using Places API
  getSuggestions: async (query) => {
    return new Promise((resolve) => {
      if (!query || query.length < 2) {
        resolve([]);
        return;
      }

      const service = GOOGLE_MAPS_API.getAutocompleteService();
      if (!service) {
        console.error('❌ AutocompleteService not available');
        resolve([]);
        return;
      }

      console.log('🔍 Calling Google Places API for:', query);
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' }
        },
        (predictions, status) => {
          console.log('📡 Google API Status:', status);
          console.log('📡 Predictions:', predictions);
          console.log('📡 Status Code:', window.google.maps.places.PlacesServiceStatus);

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results = predictions.map(prediction => ({
              description: prediction.description,
              mainText: prediction.structured_formatting.main_text,
              secondaryText: prediction.structured_formatting.secondary_text || '',
              placeId: prediction.place_id
            }));
            console.log('✅ Formatted results:', results);
            console.log('✅ Total results:', results.length);
            resolve(results);
          } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            console.error('❌ REQUEST_DENIED - API key invalid or API not enabled');
            resolve([]);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.warn('⚠️ ZERO_RESULTS - No results found');
            resolve([]);
          } else {
            console.error('❌ Places API failed with status:', status);
            resolve([]);
          }
        }
      );
    });
  },

  // 📏 Distance using Google Distance Matrix Service
  getDistance: async (lat1, lng1, lat2, lng2) => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        resolve(calculateHaversineDistance(lat1, lng1, lat2, lng2));
        return;
      }

      const service = new window.google.maps.DistanceMatrixService();
      const origin = new window.google.maps.LatLng(lat1, lng1);
      const destination = new window.google.maps.LatLng(lat2, lng2);

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: 'DRIVING',
          unitSystem: window.google.maps.UnitSystem.METRIC
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const distanceInMeters = response.rows[0].elements[0].distance.value;
            resolve(parseFloat((distanceInMeters / 1000).toFixed(2)));
          } else {
            resolve(calculateHaversineDistance(lat1, lng1, lat2, lng2));
          }
        }
      );
    });
  },

  // Check if Google Maps is loaded
  isLoaded: () => {
    const loaded = !!(window.google && window.google.maps && window.google.maps.places);
    console.log('🔍 Google Maps isLoaded check:', loaded);
    return loaded;
  },

  // Wait for Google Maps to load
  waitForLoad: () => {
    return new Promise((resolve) => {
      if (GOOGLE_MAPS_API.isLoaded()) {
        resolve(true);
        return;
      }
      window.addEventListener('google-maps-loaded', () => resolve(true), { once: true });
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
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
