import { useEffect, useRef } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';

export default function GoogleMapView({ pickupMarker, dropMarker, mapCenter, onClose }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const directionsRendererRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        console.log('🗺️ GoogleMapView: Rendering map with:', { pickupMarker, dropMarker });

        // Clear previous directions renderer
        if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
            directionsRendererRef.current = null;
        }

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

        // Clear existing markers (if any)
        // Note: In production, you'd want to store marker refs and clear them
        // For now, we'll just create new ones

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

            // Draw route if both markers exist
            if (pickupMarker) {
                console.log('🛣️ Drawing route from pickup to drop');
                
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

                directionsService.route(
                    {
                        origin: pickupMarker,
                        destination: dropMarker,
                        travelMode: window.google.maps.TravelMode.DRIVING
                    },
                    (result, status) => {
                        if (status === 'OK') {
                            console.log('✅ Route drawn successfully');
                            directionsRenderer.setDirections(result);
                        } else {
                            console.error('❌ Route drawing failed:', status);
                        }
                    }
                );
            }
        }

        // Fit bounds to show both markers
        if (pickupMarker && dropMarker) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(pickupMarker);
            bounds.extend(dropMarker);
            map.fitBounds(bounds);
        } else if (pickupMarker) {
            map.setCenter(pickupMarker);
            map.setZoom(15);
        } else if (dropMarker) {
            map.setCenter(dropMarker);
            map.setZoom(15);
        }

    }, [pickupMarker, dropMarker, mapCenter]);

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
            <div className="mt-3 flex gap-4 text-xs bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                {pickupMarker && (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                            <MapPin size={12} className="text-white" />
                        </div>
                        <span className="text-gray-700 font-semibold">Pickup Point</span>
                    </div>
                )}
                {dropMarker && (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                            <MapPin size={12} className="text-white" />
                        </div>
                        <span className="text-gray-700 font-semibold">Drop Point</span>
                    </div>
                )}
                {pickupMarker && dropMarker && (
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="w-8 h-1 bg-blue-600 rounded"></div>
                        <span className="text-gray-700 font-semibold">Driving Route</span>
                    </div>
                )}
            </div>
        </div>
    );
}
