// src/components/BookingTable.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaTimes, FaSync, FaBan, FaMapMarkedAlt } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Phone, MapPin } from 'lucide-react';
import { agentService } from '../api/agentApi';
import { toast } from 'sonner';

// --- LIVE MAP COMPONENT ---
const LiveMapModalContent = ({ booking, mapType }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const directionsRendererRef = useRef(null); // ✅ Store DirectionsRenderer
  const [liveDriverLocation, setLiveDriverLocation] = useState(null); // 🔴 NEW: Live location state

  // 🔴 NEW: Listen to real-time location updates
  useEffect(() => {
    const handleLiveLocationUpdate = (event) => {
      const data = event.detail;
      const driverId = typeof booking.assignedDriver === 'object' 
        ? booking.assignedDriver?._id 
        : booking.assignedDriver;

      console.log('🗺️ LiveMapModalContent: Checking location update:', {
        incomingDriverId: data.driverId,
        bookingDriverId: driverId,
        match: data.driverId === driverId,
        bookingStatus: booking.bookingStatus
      });

      // Only update if this is the correct driver for this booking
      if (data.driverId === driverId) {
        console.log('✅ MATCH! Updating live location in map:', {
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading
        });
        setLiveDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          timestamp: data.timestamp
        });
      }
    };

    window.addEventListener('driver_location_update', handleLiveLocationUpdate);

    return () => {
      window.removeEventListener('driver_location_update', handleLiveLocationUpdate);
    };
  }, [booking.assignedDriver, booking._id]);

  // 1. Initial Map Setup
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const pickupLat = booking.pickup?.latitude || booking.pickup?.lat;
    const pickupLng = booking.pickup?.longitude || booking.pickup?.lng;
    const dropLat = booking.drop?.latitude || booking.drop?.lat;
    const dropLng = booking.drop?.longitude || booking.drop?.lng;
    const driverLat = booking.driverLocation?.latitude || booking.driverLocation?.lat || pickupLat;
    const driverLng = booking.driverLocation?.longitude || booking.driverLocation?.lng || pickupLng;
    const status = booking.bookingStatus?.toLowerCase();

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: pickupLat, lng: pickupLng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });
    mapInstanceRef.current = map;

    if (mapType === 'route') {
      // Setup Markers for Route
      if (pickupLat && pickupLng) {
        new window.google.maps.Marker({
          position: { lat: pickupLat, lng: pickupLng },
          map: map,
          title: 'Pickup',
          label: { text: 'P', color: 'white', fontWeight: 'bold' },
          icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(50, 50) }
        });
      }

      if (dropLat && dropLng) {
        new window.google.maps.Marker({
          position: { lat: dropLat, lng: dropLng },
          map: map,
          title: 'Drop',
          label: { text: 'D', color: 'white', fontWeight: 'bold' },
          icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(50, 50) }
        });
      }

      // Driver Marker with Custom Car Icon
      const driverName = typeof booking.assignedDriver === 'object' 
        ? booking.assignedDriver?.name 
        : booking.assignedDriver || 'Driver';
      
      // Custom car icon SVG - Better visibility
      const carIconSvg = `
        <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="24" cy="42" rx="16" ry="3" fill="rgba(0,0,0,0.2)"/>
          <!-- Car Body -->
          <path d="M12 28 L12 32 C12 33 13 34 14 34 L16 34 C17 34 18 33 18 32 L18 30 L30 30 L30 32 C30 33 31 34 32 34 L34 34 C35 34 36 33 36 32 L36 28 L38 28 C39 28 40 27 40 26 L40 20 C40 19 39.5 18 38.5 17 L35 12 C34.5 11 33.5 10 32 10 L16 10 C14.5 10 13.5 11 13 12 L9.5 17 C8.5 18 8 19 8 20 L8 26 C8 27 9 28 10 28 L12 28 Z" fill="#3B82F6" stroke="#1E40AF" stroke-width="1.5"/>
          <!-- Windows -->
          <path d="M14 16 L18 12 L30 12 L34 16 L34 20 L14 20 Z" fill="#93C5FD" stroke="#1E40AF" stroke-width="1"/>
          <!-- Windshield divider -->
          <line x1="24" y1="12" x2="24" y2="20" stroke="#1E40AF" stroke-width="1.5"/>
          <!-- Headlights -->
          <circle cx="12" cy="24" r="2" fill="#FCD34D"/>
          <circle cx="36" cy="24" r="2" fill="#FCD34D"/>
          <!-- Wheels -->
          <circle cx="14" cy="30" r="3" fill="#1F2937" stroke="#000" stroke-width="1"/>
          <circle cx="34" cy="30" r="3" fill="#1F2937" stroke="#000" stroke-width="1"/>
          <!-- Wheel centers -->
          <circle cx="14" cy="30" r="1.5" fill="#6B7280"/>
          <circle cx="34" cy="30" r="1.5" fill="#6B7280"/>
        </svg>
      `;
      
      const carIconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(carIconSvg);

      const driverMarker = new window.google.maps.Marker({
        position: { lat: driverLat, lng: driverLng },
        map: map,
        title: `Driver: ${driverName}`,
        icon: { 
          url: carIconUrl,
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 24) // Center the icon
        },
        zIndex: 1000,
        animation: window.google.maps.Animation.DROP
      });
      driverMarkerRef.current = driverMarker;

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px;">
            <p style="font-weight: bold; margin: 0 0 4px 0; color: #1F2937;">🚗 ${driverName}</p>
            <p style="margin: 0; font-size: 11px; color: #6B7280;">Live Location</p>
          </div>
        `
      });
      infoWindowRef.current = infoWindow;
      driverMarker.addListener('click', () => infoWindow.open(map, driverMarker));

      // ✅ ROUTE LINE DRAWING - Based on Status
      const directionsService = new window.google.maps.DirectionsService();
      
      // Clear previous renderer if exists
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      
      if (status === 'accepted') {
        // 🟢 ACCEPTED: Driver → Pickup (Green Line)
        console.log('🟢 Drawing ACCEPTED route: Driver → Pickup');
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true, // Hide default markers
          polylineOptions: { 
            strokeColor: '#10B981', // Green color
            strokeWeight: 5, 
            strokeOpacity: 0.8 
          },
          preserveViewport: false // Allow auto-zoom to route
        });
        directionsRendererRef.current = directionsRenderer; // Store in ref

        directionsService.route({
          origin: { lat: driverLat, lng: driverLng },
          destination: { lat: pickupLat, lng: pickupLng },
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => { 
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            console.log('✅ ACCEPTED route drawn successfully!');
          } else {
            console.error('❌ ACCEPTED route failed:', status);
          }
        });

      } else if (status === 'ongoing') {
        // 🔵 ONGOING: Driver → Drop (Blue Line)
        console.log('🔵 Drawing ONGOING route: Driver → Drop');
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true, // Hide default markers
          polylineOptions: { 
            strokeColor: '#3B82F6', // Blue color
            strokeWeight: 5, 
            strokeOpacity: 0.8 
          },
          preserveViewport: false
        });
        directionsRendererRef.current = directionsRenderer; // Store in ref

        directionsService.route({
          origin: { lat: driverLat, lng: driverLng },
          destination: { lat: dropLat, lng: dropLng },
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => { 
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            console.log('✅ ONGOING route drawn successfully!');
          } else {
            console.error('❌ ONGOING route failed:', status);
          }
        });

      } else if (status === 'completed') {
        // ⚪ COMPLETED: Pickup → Drop (Gray Line) - Full route
        console.log('⚪ Drawing COMPLETED route: Pickup → Drop');
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: { 
            strokeColor: '#6B7280', // Gray color
            strokeWeight: 4, 
            strokeOpacity: 0.6 
          },
          preserveViewport: false
        });
        directionsRendererRef.current = directionsRenderer; // Store in ref

        directionsService.route({
          origin: { lat: pickupLat, lng: pickupLng },
          destination: { lat: dropLat, lng: dropLng },
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, status) => { 
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            console.log('✅ COMPLETED route drawn successfully!');
          } else {
            console.error('❌ COMPLETED route failed:', status);
          }
        });
      }

      // Auto-fit bounds only if no route is being drawn
      if (!['accepted', 'ongoing', 'completed'].includes(status)) {
        const bounds = new window.google.maps.LatLngBounds();
        if (pickupLat && pickupLng) bounds.extend({ lat: pickupLat, lng: pickupLng });
        if (dropLat && dropLng) bounds.extend({ lat: dropLat, lng: dropLng });
        bounds.extend({ lat: driverLat, lng: driverLng });
        map.fitBounds(bounds);
      }

    } else if (mapType === 'pickup' && pickupLat && pickupLng) {
      new window.google.maps.Marker({
        position: { lat: pickupLat, lng: pickupLng },
        map: map,
        animation: window.google.maps.Animation.BOUNCE,
        icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(50, 50) }
      });
      map.setCenter({ lat: pickupLat, lng: pickupLng });
      map.setZoom(16);
    } else if (mapType === 'drop' && dropLat && dropLng) {
      new window.google.maps.Marker({
        position: { lat: dropLat, lng: dropLng },
        map: map,
        animation: window.google.maps.Animation.BOUNCE,
        icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(50, 50) }
      });
      map.setCenter({ lat: dropLat, lng: dropLng });
      map.setZoom(16);
    }

    // Cleanup function
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
        driverMarkerRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };

  }, [mapType, booking._id, booking.bookingStatus]);

  // 2. Real-time Position Update - Using liveDriverLocation state
  useEffect(() => {
    console.log('🔍 LiveMapModalContent: Live location state changed:', {
      bookingId: booking._id?.slice(-8),
      hasMarker: !!driverMarkerRef.current,
      hasGoogle: !!window.google,
      mapType,
      liveDriverLocation,
      bookingStatus: booking.bookingStatus
    });

    if (!driverMarkerRef.current || !window.google || mapType !== 'route') {
      console.log('⚠️ Map Update Skipped:', {
        hasMarker: !!driverMarkerRef.current,
        hasGoogle: !!window.google,
        mapType,
        reason: !driverMarkerRef.current ? 'No marker' : !window.google ? 'No Google' : mapType !== 'route' ? 'Wrong map type' : 'Unknown'
      });
      return;
    }
    
    // Use live location if available, otherwise use booking location
    const lat = liveDriverLocation?.latitude || booking.driverLocation?.latitude || booking.driverLocation?.lat;
    const lng = liveDriverLocation?.longitude || booking.driverLocation?.longitude || booking.driverLocation?.lng;
    const status = booking.bookingStatus?.toLowerCase();
    
    console.log('🗺️ LiveMapModalContent: Attempting to update marker:', {
      bookingId: booking._id?.slice(-8),
      lat,
      lng,
      status,
      isLiveUpdate: !!liveDriverLocation,
      hasMarker: !!driverMarkerRef.current,
      hasRenderer: !!directionsRendererRef.current
    });
    
    if (lat && lng) {
      console.log('✅ Updating Driver Marker on Map:', { lat, lng, isLive: !!liveDriverLocation });
      const newPos = new window.google.maps.LatLng(lat, lng);
      
      // 🎬 Smooth marker animation
      if (liveDriverLocation) {
        // Animate marker movement for live updates
        const currentPos = driverMarkerRef.current.getPosition();
        if (currentPos) {
          // Smooth transition
          driverMarkerRef.current.setPosition(newPos);
          // Optional: Add bounce animation for new update
          driverMarkerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            driverMarkerRef.current.setAnimation(null);
          }, 700);
        } else {
          driverMarkerRef.current.setPosition(newPos);
        }
      } else {
        driverMarkerRef.current.setPosition(newPos);
      }
      
      // 🔄 Update route line based on status
      if (directionsRendererRef.current && mapInstanceRef.current) {
        const pickupLat = booking.pickup?.latitude || booking.pickup?.lat;
        const pickupLng = booking.pickup?.longitude || booking.pickup?.lng;
        const dropLat = booking.drop?.latitude || booking.drop?.lat;
        const dropLng = booking.drop?.longitude || booking.drop?.lng;

        const directionsService = new window.google.maps.DirectionsService();
        
        if (status === 'accepted' && pickupLat && pickupLng) {
          // Update route: Driver → Pickup
          console.log('🔄 Updating ACCEPTED route with new driver position');
          directionsService.route({
            origin: newPos,
            destination: { lat: pickupLat, lng: pickupLng },
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result, status) => { 
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
              console.log('✅ ACCEPTED route updated!');
            }
          });
        } else if (status === 'ongoing' && dropLat && dropLng) {
          // Update route: Driver → Drop
          console.log('🔄 Updating ONGOING route with new driver position');
          directionsService.route({
            origin: newPos,
            destination: { lat: dropLat, lng: dropLng },
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result, status) => { 
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
              console.log('✅ ONGOING route updated!');
            }
          });
        }
      }
      
      // 🎯 Optional: Center map on driver for live updates
      if (liveDriverLocation && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newPos);
      }
    } else {
      console.log('❌ No valid coordinates to update marker');
    }
  }, [liveDriverLocation, booking.driverLocation, mapType, booking.bookingStatus]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-lg sm:rounded-xl border-2 border-gray-200 overflow-hidden" />
      
      {/* Live Update Indicator */}
      {mapType === 'route' && liveDriverLocation && (
        <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium animate-pulse z-10">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          <span>Live Tracking Active</span>
        </div>
      )}
      
      {/* Last Update Time */}
      {mapType === 'route' && liveDriverLocation && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg text-xs font-medium text-gray-700 z-10">
          🕐 Updated: {new Date(liveDriverLocation.timestamp || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status, booking }) => {
  const cfg = {
    completed: 'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    ongoing:   'bg-blue-100 text-blue-700',
    expired:   'bg-gray-100 text-gray-600',
    accepted:  'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200',
  }[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';

  const handleStatusClick = (e) => {
    e.stopPropagation();
    if (status?.toLowerCase() === 'accepted' && booking) {
      console.log('📍 Status Click - Full Booking:', booking);
      console.log('📍 Pickup:', booking.pickup);
      console.log('📍 Drop:', booking.drop);
      
      const pickupLat = booking.pickup?.coordinates?.lat || booking.pickup?.lat || booking.pickup?.latitude || booking.pickupLat;
      const pickupLng = booking.pickup?.coordinates?.lng || booking.pickup?.lng || booking.pickup?.longitude || booking.pickupLng;
      const dropLat = booking.drop?.coordinates?.lat || booking.drop?.lat || booking.drop?.latitude || booking.dropLat;
      const dropLng = booking.drop?.coordinates?.lng || booking.drop?.lng || booking.drop?.longitude || booking.dropLng;

      console.log('📍 Extracted Coordinates:', { pickupLat, pickupLng, dropLat, dropLng });

      if (pickupLat && pickupLng && dropLat && dropLng) {
        // Google Maps URL with directions
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${dropLat},${dropLng}&travelmode=driving`;
        window.open(mapsUrl, '_blank');
        toast.success('Google Maps open ho raha hai! 🗺️');
      } else {
        console.error('❌ Coordinates missing:', { 
          pickup: booking.pickup, 
          drop: booking.drop,
          pickupLat, pickupLng, dropLat, dropLng 
        });
        toast.error('Location coordinates nahi mile! Console check karo.');
      }
    }
  };

  return (
    <span 
      className={`px-2 py-1 ${cfg} rounded-full text-xs font-medium`}
      onClick={handleStatusClick}
      title={status?.toLowerCase() === 'accepted' ? 'Click to view route on Google Maps' : ''}
    >
      {status || '—'}
    </span>
  );
};

const BookingRow = ({ booking, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapType, setMapType] = useState('route'); // 'route', 'pickup', 'drop'

  // Debug: Log when booking prop changes
  useEffect(() => {
    console.log('🔄 BookingRow: Booking prop updated:', {
      bookingId: booking._id?.slice(-8),
      passengerName: booking.passengerDetails?.name,
      status: booking.bookingStatus,
      driverLocation: booking.driverLocation,
      assignedDriver: booking.assignedDriver,
      pickup: booking.pickup,
      drop: booking.drop
    });
  }, [booking]);

  const handleOpenMap = (e) => {
    e.stopPropagation();
    setMapType('route');
    setShowMapModal(true);
  };

  const canCancel = ['pending', 'accepted'].includes(booking.bookingStatus?.toLowerCase()); // Pending and Accepted bookings can be cancelled

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Cancel reason zaruri hai');
      return;
    }

    setCancelling(true);
    try {
      const response = await agentService.cancelBooking(booking._id, cancelReason);
      if (response.success) {
        toast.success('Booking successfully cancel ho gayi!');
        setShowCancelModal(false);
        setCancelReason('');
        if (onRefresh) onRefresh();
      } else {
        toast.error(response.message || 'Cancel failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <td className="px-4 py-3">
          <p className="font-medium text-sm text-gray-900">{booking.passengerDetails?.name || '—'}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone size={10} />{booking.passengerDetails?.phone || '—'}
          </p>
        </td>
        <td className="px-4 py-3">
          <p 
            className="text-xs text-gray-700 max-w-[150px] truncate cursor-pointer hover:text-blue-600 hover:underline" 
            title={`${booking.pickup?.address || '—'} (Click to view on map)`}
            onClick={(e) => {
              e.stopPropagation();
              setMapType('pickup');
              setShowMapModal(true);
            }}
          >
            {booking.pickup?.address || '—'}
          </p>
        </td>
        <td className="px-4 py-3">
          <p 
            className="text-xs text-gray-700 max-w-[150px] truncate cursor-pointer hover:text-blue-600 hover:underline" 
            title={`${booking.drop?.address || '—'} (Click to view on map)`}
            onClick={(e) => {
              e.stopPropagation();
              setMapType('drop');
              setShowMapModal(true);
            }}
          >
            {booking.drop?.address || '—'}
          </p>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            booking.rideType === 'Private' ? 'bg-purple-100 text-purple-700' :
            booking.rideType === 'Shared'  ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-500'
          }`}>{booking.rideType || '—'}</span>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{booking.carCategory?.name || '—'}</p>
          <p className="text-xs text-gray-500">{booking.seatsBooked} seat(s)</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-700">{booking.estimatedDistanceKm ? `${booking.estimatedDistanceKm} km` : '—'}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-bold text-green-600">₹{booking.fareEstimate?.toLocaleString() || '—'}</p>
          <p className="text-xs text-gray-400">{booking.paymentMethod || '—'}</p>
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            booking.paymentStatus === 'Paid'    ? 'bg-green-100 text-green-700' :
            booking.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-500'
          }`}>{booking.paymentStatus || '—'}</span>
        </td>
        <td className="px-4 py-3"><StatusBadge status={booking.bookingStatus} booking={booking} /></td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-600">{new Date(booking.createdAt).toLocaleDateString('en-IN')}</p>
          <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Map Button - Show for accepted/ongoing bookings */}
            {['accepted', 'ongoing', 'completed'].includes(booking.bookingStatus?.toLowerCase()) && (
              <button
                onClick={handleOpenMap}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="View Route on Google Maps"
              >
                <FaMapMarkedAlt size={14} />
              </button>
            )}
            {canCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCancelModal(true);
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Cancel Booking"
              >
                <FaBan size={14} />
              </button>
            )}
            <button onClick={() => setExpanded(p => !p)} className="text-gray-400">
              {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-blue-50/40">
          <td colSpan={11} className="px-6 py-4">
            {/* Map Button - Full Width */}
            {['accepted', 'ongoing', 'completed'].includes(booking.bookingStatus?.toLowerCase()) && (
              <button
                onClick={handleOpenMap}
                className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200"
              >
                <FaMapMarkedAlt size={16} />
                {booking.bookingStatus?.toLowerCase() === 'accepted'
                  ? '🟢 Track Driver to Pickup Location'
                  : booking.bookingStatus?.toLowerCase() === 'ongoing' 
                  ? '🔵 Track Live Location to Drop' 
                  : booking.bookingStatus?.toLowerCase() === 'completed'
                  ? '⚪ View Completed Trip Route'
                  : 'View Route on Google Maps'
                }
              </button>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Commission</p>
                <p className="font-semibold text-orange-600">₹{booking.agentCommission?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Start OTP</p>
                <p className="font-bold text-blue-600 tracking-widest">{booking.tripData?.startOtp || '—'}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Pickup Date</p>
                <p className="font-semibold text-gray-800">
                  {booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString('en-IN') : '—'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Pickup Time</p>
                <p className="font-semibold text-gray-800">{booking.pickupTime || '—'}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Actual Fare</p>
                <p className="font-semibold text-gray-800">₹{booking.actualFare?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Assigned Driver</p>
                <p className="font-semibold text-gray-800">
                  {typeof booking.assignedDriver === 'object' 
                    ? booking.assignedDriver?.name || 'Not Assigned'
                    : booking.assignedDriver || 'Not Assigned'
                  }
                </p>
                {typeof booking.assignedDriver === 'object' && booking.assignedDriver?.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">{booking.assignedDriver.phone}</p>
                )}
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Assigned Car</p>
                <p className="font-semibold text-gray-800">
                  {typeof booking.assignedCar === 'object'
                    ? booking.assignedCar?.carDetails || booking.assignedCar?.name || 'Not Assigned'
                    : booking.assignedCar || 'Not Assigned'
                  }
                </p>
              </div>
              {booking.selectedSeats?.length > 0 && (
                <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                  <p className="text-gray-400 uppercase mb-1">Selected Seats</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      // Parse seats if they're in string format
                      let seats = booking.selectedSeats;
                      
                      // If first element is a JSON string, parse it
                      if (seats.length > 0 && typeof seats[0] === 'string' && seats[0].startsWith('[')) {
                        try {
                          seats = JSON.parse(seats[0]);
                        } catch (e) {
                          console.error('Error parsing seats:', e);
                        }
                      }
                      
                      return seats.map((seat, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                          {seat}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}
              {booking.cancelReason && (
                <div className="bg-white rounded-lg p-2.5 border border-red-100 col-span-2">
                  <p className="text-gray-400 uppercase mb-1">Cancel Reason</p>
                  <p className="text-red-600 font-medium">{booking.cancelReason}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <tr>
          <td colSpan={11}>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowMapModal(false)}>
              <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <FaMapMarkedAlt className="text-blue-600" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                        {mapType === 'route' 
                          ? booking.bookingStatus?.toLowerCase() === 'accepted'
                            ? '🟢 Driver on the way to Pickup'
                            : booking.bookingStatus?.toLowerCase() === 'ongoing'
                            ? '🔵 Live Tracking - En Route to Drop'
                            : booking.bookingStatus?.toLowerCase() === 'completed'
                            ? '⚪ Trip Completed - Full Route'
                            : 'Route Map'
                          : mapType === 'pickup' 
                          ? 'Pickup Location' 
                          : 'Drop Location'
                        }
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {booking.passengerDetails?.name} - {booking._id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-all shrink-0 ml-2"
                  >
                    <FaTimes size={16} className="text-gray-400" />
                  </button>
                </div>

                {/* Map Container - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-2 sm:p-4">
                    <LiveMapModalContent booking={booking} mapType={mapType} />
                  </div>

                  {/* Location Details */}
                  <div className="p-3 sm:p-4 border-t bg-gray-50 space-y-3">
                    {/* Route Legend - Show only for route map */}
                    {mapType === 'route' && (
                      <div className="bg-white rounded-lg p-2.5 sm:p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">🗺️ Route Legend:</p>
                        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                          {booking.bookingStatus?.toLowerCase() === 'accepted' && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-6 sm:w-8 h-0.5 sm:h-1 bg-green-500 rounded"></div>
                              <span className="text-gray-600">Driver → Pickup</span>
                            </div>
                          )}
                          {booking.bookingStatus?.toLowerCase() === 'ongoing' && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-6 sm:w-8 h-0.5 sm:h-1 bg-blue-500 rounded"></div>
                              <span className="text-gray-600">Driver → Drop</span>
                            </div>
                          )}
                          {booking.bookingStatus?.toLowerCase() === 'completed' && (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-6 sm:w-8 h-0.5 sm:h-1 bg-gray-500 rounded"></div>
                              <span className="text-gray-600">Pickup → Drop</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">Pickup</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
                            <span className="text-gray-600">Drop</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-base sm:text-lg">🚗</span>
                            <span className="text-gray-600">Driver</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={12} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Pickup</p>
                        <p className="text-xs sm:text-sm text-gray-800 break-words">{booking.pickup?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={12} className="text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Drop</p>
                        <p className="text-xs sm:text-sm text-gray-800 break-words">{booking.drop?.address}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Distance:</span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-800">{booking.estimatedDistanceKm} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <StatusBadge status={booking.bookingStatus} booking={booking} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => {
                      const pickupLat = booking.pickup?.latitude || booking.pickup?.lat;
                      const pickupLng = booking.pickup?.longitude || booking.pickup?.lng;
                      const dropLat = booking.drop?.latitude || booking.drop?.lat;
                      const dropLng = booking.drop?.longitude || booking.drop?.lng;
                      
                      if (pickupLat && pickupLng && dropLat && dropLng) {
                        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${dropLat},${dropLng}&travelmode=driving`;
                        window.open(mapsUrl, '_blank');
                        toast.success('Google Maps app open ho raha hai!');
                      }
                    }}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all font-medium flex items-center justify-center gap-2 text-sm"
                  >
                    <FaMapMarkedAlt size={14} />
                    <span className="hidden sm:inline">Open in Google Maps</span>
                    <span className="sm:hidden">Google Maps</span>
                  </button>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <tr>
          <td colSpan={11}>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCancelModal(false)}>
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaBan className="text-red-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
                    <p className="text-xs text-gray-500">Booking ID: {booking._id?.slice(-8)}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancel Reason *</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                    rows={4}
                    placeholder="e.g., Customer ne cancel karne ko kaha"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelling || !cancelReason.trim()}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 font-medium"
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Main BookingTable Component
// Props:
//   bookings   — array of booking objects
//   loading    — boolean
//   limit      — number (optional) — if set, hides pagination/filter, shows only N rows
//   showSearch — boolean (default true, false when limit is set)
// ─────────────────────────────────────────────────────────────
export default function BookingTable({ bookings = [], loading = false, limit, showSearch = true, onRefresh }) {
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isCompact = Boolean(limit); // dashboard mode

  const stats = useMemo(() => ({
    total:     bookings.length,
    completed: bookings.filter(b => b.bookingStatus?.toLowerCase() === 'completed').length,
    pending:   bookings.filter(b => b.bookingStatus?.toLowerCase() === 'pending').length,
    ongoing:   bookings.filter(b => b.bookingStatus?.toLowerCase() === 'ongoing').length,
    cancelled: bookings.filter(b => b.bookingStatus?.toLowerCase() === 'cancelled').length,
    expired:   bookings.filter(b => b.bookingStatus?.toLowerCase() === 'expired').length,
  }), [bookings]);

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (!isCompact && filter !== 'all')
      list = list.filter(b => b.bookingStatus?.toLowerCase() === filter);
    if (!isCompact && search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.passengerDetails?.name?.toLowerCase().includes(q) ||
        b.passengerDetails?.phone?.includes(q) ||
        b._id?.toLowerCase().includes(q) ||
        b.carCategory?.name?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bookings, filter, search, isCompact]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed  = useMemo(() => {
    if (isCompact) return filtered.slice(0, limit);
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, isCompact, limit, currentPage, itemsPerPage]);

  const FILTERS = [
    { key: 'all',       label: `All (${stats.total})` },
    { key: 'pending',   label: `Pending (${stats.pending})` },
    { key: 'ongoing',   label: `Ongoing (${stats.ongoing})` },
    { key: 'completed', label: `Completed (${stats.completed})` },
    { key: 'cancelled', label: `Cancelled (${stats.cancelled})` },
    { key: 'expired',   label: `Expired (${stats.expired})` },
  ];

  return (
    <div className="space-y-3">

      {/* Filter + Search — only in full mode */}
      {!isCompact && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search by name, phone, booking ID, car..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Passenger</th>
                <th className="px-4 py-3 text-left">Pickup</th>
                <th className="px-4 py-3 text-left">Drop</th>
                <th className="px-4 py-3 text-left">Ride Type</th>
                <th className="px-4 py-3 text-left">Car / Seats</th>
                <th className="px-4 py-3 text-left">Distance</th>
                <th className="px-4 py-3 text-left">Fare</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400 text-sm">
                    No bookings found
                  </td>
                </tr>
              ) : (
                displayed.map(b => <BookingRow key={b._id} booking={b} onRefresh={onRefresh} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — only in full mode */}
        {!isCompact && !loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}–
                {Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-sm border rounded-md px-2 py-1 focus:outline-none"
              >
                {[10, 20, 50].map(v => <option key={v} value={v}>{v} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30"><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30"><ChevronLeft size={14} /></button>
              <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30"><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border hover:bg-white disabled:opacity-30"><ChevronsRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
