import { useEffect, useRef } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';

export default function GoogleMapView({ pickupMarker, dropMarker, stops = [], mapCenter, onClose }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const stopMarkersRef = useRef([]);

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        console.log('🗺️ GoogleMapView: Rendering map with multi-stops:', { pickupMarker, dropMarker, stops });

        // Clear previous directions & markers
        if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
            directionsRendererRef.current = null;
        }
        stopMarkersRef.current.forEach(m => m.setMap(null));
        stopMarkersRef.current = [];

        // Create or reuse map instance
        if (!mapInstanceRef.current) {
            const map = new window.google.maps.Map(mapRef.current, {
                center: mapCenter,
                zoom: 13,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
            });
            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // 1. Pickup Marker
        if (pickupMarker) {
            new window.google.maps.Marker({
                position: pickupMarker,
                map: map,
                title: 'Pickup Location',
                label: { text: 'P', color: 'white', fontWeight: 'bold' },
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                }
            });
        }

        // 2. Intermediate Stop Markers
        stops.forEach((stop, idx) => {
            const sLat = stop.lat || stop.latitude;
            const sLng = stop.lng || stop.longitude;
            if (sLat && sLng) {
                const marker = new window.google.maps.Marker({
                    position: { lat: sLat, lng: sLng },
                    map: map,
                    title: `Stop ${idx + 1}`,
                    label: { text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' },
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                        scaledSize: new window.google.maps.Size(35, 35)
                    }
                });
                stopMarkersRef.current.push(marker);
            }
        });

        // 3. Drop Marker
        if (dropMarker) {
            new window.google.maps.Marker({
                position: dropMarker,
                map: map,
                title: 'Drop Location',
                label: { text: 'D', color: 'white', fontWeight: 'bold' },
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                }
            });

            // 4. Draw Route with Waypoints
            if (pickupMarker) {
                const directionsService = new window.google.maps.DirectionsService();
                const directionsRenderer = new window.google.maps.DirectionsRenderer({
                    map: map,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: '#2563EB',
                        strokeWeight: 6,
                        strokeOpacity: 0.9
                    }
                });

                directionsRendererRef.current = directionsRenderer;

                // Prepare waypoints
                const waypoints = stops
                    .map(s => ({
                        location: new window.google.maps.LatLng(s.lat || s.latitude, s.lng || s.longitude),
                        stopover: true
                    }))
                    .filter(w => w.location.lat() && w.location.lng());

                directionsService.route(
                    {
                        origin: pickupMarker,
                        destination: dropMarker,
                        waypoints: waypoints,
                        travelMode: window.google.maps.TravelMode.DRIVING
                    },
                    (result, status) => {
                        if (status === 'OK') {
                            directionsRenderer.setDirections(result);
                        }
                    }
                );
            }
        }

        // Fit bounds to show ALL markers
        const bounds = new window.google.maps.LatLngBounds();
        let hasAny = false;
        
        if (pickupMarker) { bounds.extend(pickupMarker); hasAny = true; }
        stops.forEach(s => { if (s.lat && s.lng) { bounds.extend({ lat: s.lat, lng: s.lng }); hasAny = true; } });
        if (dropMarker) { bounds.extend(dropMarker); hasAny = true; }

        if (hasAny) {
            if (pickupMarker && dropMarker) {
                map.fitBounds(bounds);
            } else {
                map.setCenter(pickupMarker || dropMarker || mapCenter);
                map.setZoom(14);
            }
        }

    }, [pickupMarker, dropMarker, stops, mapCenter]);

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Navigation size={18} className="text-blue-600" />
                    <label className="block text-sm font-semibold text-gray-800">Route Map</label>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                )}
            </div>
            <div ref={mapRef} className="w-full h-96 rounded-xl border-2 border-gray-200 overflow-hidden shadow-lg" />
            <div className="mt-3 flex flex-wrap gap-4 text-[10px] sm:text-xs bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                {pickupMarker && (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                            <MapPin size={10} className="text-white" />
                        </div>
                        <span className="text-gray-700 font-bold">PICKUP</span>
                    </div>
                )}
                {stops.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-orange-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                            <MapPin size={10} className="text-white" />
                        </div>
                        <span className="text-gray-700 font-bold">STOPS ({stops.length})</span>
                    </div>
                )}
                {dropMarker && (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                            <MapPin size={10} className="text-white" />
                        </div>
                        <span className="text-gray-700 font-bold">DROP</span>
                    </div>
                )}
                {pickupMarker && dropMarker && (
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="w-8 h-1 bg-blue-600 rounded"></div>
                        <span className="text-gray-700 font-bold">ROUTE</span>
                    </div>
                )}
            </div>
        </div>
    );
}
