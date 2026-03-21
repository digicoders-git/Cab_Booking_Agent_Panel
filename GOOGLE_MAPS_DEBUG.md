# 🗺️ Google Maps API Debug Guide

## ✅ Check Karo:

### 1. Browser Console Open Karo (F12)
- Chrome/Edge: F12 ya Right Click → Inspect → Console tab

### 2. Page Load Hone Par Ye Messages Dikhne Chahiye:
```
⏳ Waiting for Google Maps to load...
🗺️ Google Maps loaded: true
✅ Google Maps ready! 🗺️
```

### 3. Jab Tum Pickup/Drop Field Mein Type Karo:
```
🔍 Fetching pickup suggestions for: lucknow
🔍 Google Maps isLoaded check: true
🔍 Calling Google Places API for: lucknow
📡 Google API Status: OK
📡 Predictions: [Array of predictions]
✅ Formatted results: [Array of formatted results]
✅ Pickup suggestions received: [Array]
```

## ❌ Agar Ye Errors Aayein:

### Error 1: "Google Maps load nahi hua"
**Solution:**
- API key check karo: `C1z9jJUEOfeBJXESrt_YyLa95wU=`
- Google Cloud Console mein jao
- Places API enable karo
- API key restrictions check karo

### Error 2: "REQUEST_DENIED"
**Solution:**
- API key invalid hai
- Places API enabled nahi hai
- Billing account setup nahi hai

### Error 3: "ZERO_RESULTS"
**Solution:**
- Query too short (minimum 2 characters)
- Location India mein nahi hai

## 🔧 API Key Verify Karne Ka Tarika:

1. Google Cloud Console: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Check karo:
   - ✅ Places API enabled
   - ✅ Geocoding API enabled
   - ✅ Distance Matrix API enabled
   - ✅ API key restrictions (HTTP referrers allow localhost)

## 🧪 Manual Test:

Browser console mein ye run karo:
```javascript
// Check if Google Maps loaded
console.log('Google Maps:', window.google?.maps ? '✅ Loaded' : '❌ Not Loaded');

// Check Places API
console.log('Places API:', window.google?.maps?.places ? '✅ Available' : '❌ Not Available');

// Test Autocomplete
const service = new google.maps.places.AutocompleteService();
service.getPlacePredictions(
  { input: 'lucknow', componentRestrictions: { country: 'in' } },
  (predictions, status) => {
    console.log('Status:', status);
    console.log('Results:', predictions);
  }
);
```

## 📝 Common Issues:

1. **API Key Format Wrong**
   - Google Maps keys usually start with `AIza...`
   - Tumhara key: `C1z9jJUEOfeBJXESrt_YyLa95wU=`
   - Ye unusual format hai, verify karo

2. **CORS Error**
   - Localhost allowed hona chahiye API restrictions mein

3. **Billing Not Enabled**
   - Google Maps APIs require billing account (free tier available)

## 🚀 Next Steps:

1. Server restart karo: `npm run dev`
2. `/agent/create-booking` pe jao
3. Browser console open karo (F12)
4. Pickup field mein type karo: "lucknow"
5. Console logs dekho
6. Agar suggestions nahi aaye toh error message screenshot bhejo
