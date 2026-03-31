// src/components/BookingTable.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaTimes, FaSync, FaBan, FaMapMarkedAlt } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Phone, MapPin } from 'lucide-react';
import { agentService, API_BASE_URL } from '../api/agentApi';
import { toast } from 'sonner';

// --- LIVE MAP COMPONENT ---
const LiveMapModalContent = ({ booking, mapType }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [liveDriverLocation, setLiveDriverLocation] = useState(null);

  // Helper function to extract coordinates robustly
  const getCoords = (obj, type = '') => {
    if (!obj) {
      if (type === 'pickup') return { lat: Number(booking.pickupLat), lng: Number(booking.pickupLng) };
      if (type === 'drop') return { lat: Number(booking.dropLat), lng: Number(booking.dropLng) };
      return null;
    }
    const lat = obj.coordinates?.lat || obj.lat || obj.latitude;
    const lng = obj.coordinates?.lng || obj.lng || obj.longitude;
    return (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null;
  };

  const pickupPos = getCoords(booking.pickup, 'pickup');
  const dropPos = getCoords(booking.drop, 'drop');

  // Driver Marker Icon (Category Image or SVG fallback)
  const getCarIcon = (heading = 0) => {
    // 1. Agar Category Image hai, toh seedha URL return karo (Rotation nahi hogi but dikhegi 100%)
    if (booking.carCategory?.image) {
      return `${API_BASE_URL}/uploads/${booking.carCategory.image}`;
    }

    // 2. Fallback: Rotating SVG (Agar image missing hai)
    const svg = `
      <svg width="46" height="46" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${heading} 24 24)">
          <ellipse cx="24" cy="42" rx="16" ry="3" fill="rgba(0,0,0,0.2)"/>
          <path d="M12 28 L12 32 C12 33 13 34 14 34 L16 34 C17 34 18 33 18 32 L18 30 L30 30 L30 32 C30 33 31 34 32 34 L34 34 C35 34 36 33 36 32 L36 28 L38 28 C39 28 40 27 40 26 L40 20 C40 19 39.5 18 38.5 17 L35 12 C34.5 11 33.5 10 32 10 L16 10 C14.5 10 13.5 11 13 12 L9.5 17 C8.5 18 8 19 8 20 L8 26 C8 27 9 28 10 28 L12 28 Z" fill="#3B82F6" stroke="#1E40AF" stroke-width="1.5"/>
          <path d="M14 16 L18 12 L30 12 L34 16 L34 20 L14 20 Z" fill="#93C5FD" stroke="#1E40AF" stroke-width="1"/>
        </g>
      </svg>
    `;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  // ✅ FIX 1: Watch booking.driverLocation prop directly
  // AgentBookings.jsx WebSocket se update karta hai booking.driverLocation
  // Jab bhi woh change ho, map marker update ho jaye
  useEffect(() => {
    const dLoc = booking.driverLocation;
    if (dLoc?.latitude && dLoc?.longitude) {
      console.log('📍 booking.driverLocation prop changed → updating map marker:', {
        bookingId: booking._id?.slice(-8),
        lat: dLoc.latitude,
        lng: dLoc.longitude
      });
      setLiveDriverLocation({
        latitude: dLoc.latitude,
        longitude: dLoc.longitude,
        heading: dLoc.heading || 0,
        timestamp: dLoc.lastUpdated || Date.now()
      });
    }
  }, [booking.driverLocation, booking._id]);

  // ✅ FIX 2: Direct WebSocket listener (backup) — driverId comparison with debug
  useEffect(() => {
    const handleLiveLocationUpdate = (event) => {
      const data = event.detail;
      const driverId = typeof booking.assignedDriver === 'object' 
        ? booking.assignedDriver?._id 
        : booking.assignedDriver;

      console.log('🔌 WebSocket event in LiveMapModalContent:', {
        incomingDriverId: data.driverId,
        bookingDriverId: driverId,
        match: data.driverId === driverId
      });

      if (data.driverId === driverId) {
        console.log('✅ Direct WebSocket Match for Booking:', booking._id?.slice(-8));
        setLiveDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
          timestamp: data.timestamp || Date.now()
        });
      }
    };

    window.addEventListener('driver_location_update', handleLiveLocationUpdate);
    return () => window.removeEventListener('driver_location_update', handleLiveLocationUpdate);
  }, [booking.assignedDriver, booking._id]);

  // Initial Map Setup
  useEffect(() => {
    if (!mapRef.current || !window.google || !pickupPos) return;

    const status = booking.bookingStatus?.toLowerCase();
    const dLoc = booking.driverLocation || {};
    // ✅ FIX 3: Agar driverLocation nahi hai toh pickup pe mat rakho
    // Pickup ke paas hi center karo map ko, marker hidden rakho
    const hasRealDriverLocation = !!(dLoc.latitude && dLoc.longitude);
    const driverLat = dLoc.latitude || dLoc.lat || null;
    const driverLng = dLoc.longitude || dLoc.lng || null;

    console.log('🗺️ Map Init - Driver Location Status:', {
      bookingId: booking._id?.slice(-8),
      hasRealDriverLocation,
      driverLat,
      driverLng,
      driverLocation: booking.driverLocation
    });

    const map = new window.google.maps.Map(mapRef.current, {
      center: pickupPos,
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });
    mapInstanceRef.current = map;

    // 1. Pickup Marker
    new window.google.maps.Marker({
      position: pickupPos,
      map,
      title: 'Pickup',
      label: { text: 'P', color: 'white', fontWeight: 'bold' },
      icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', scaledSize: new window.google.maps.Size(40, 40) }
    });

    // 2. Drop Marker
    if (dropPos) {
      new window.google.maps.Marker({
        position: dropPos,
        map,
        title: 'Drop',
        label: { text: 'D', color: 'white', fontWeight: 'bold' },
        icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(40, 40) }
      });
    }

    // 3. Driver Marker (Custom Car SVG)
    // 3. Driver Marker Icon (Category Image or SVG fallback)

    // ✅ FIX 4: Sirf real driver location ho toh marker dikhao, warna hidden
    const driverMarker = new window.google.maps.Marker({
      position: hasRealDriverLocation 
        ? { lat: driverLat, lng: driverLng } 
        : pickupPos, // temporary position, visible: false se chupaaya
      map: hasRealDriverLocation ? map : null, // ← Real location nahi hai toh map pe mat dikhao!
      icon: { 
        url: getCarIcon(0), 
        scaledSize: new window.google.maps.Size(60, 60), 
        anchor: new window.google.maps.Point(30, 30) 
      },
      zIndex: 1000,
      visible: hasRealDriverLocation // ← Real location nahi toh invisible
    });
    driverMarker.setMap(map); // Map se connect karo (marker object chahiye future updates ke liye)
    driverMarkerRef.current = driverMarker;

    // 4. Initial Route
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true, // ✅ FIX: Map resets zoom every update because of this. Set to true.
      polylineOptions: { strokeColor: status === 'accepted' ? '#10B981' : '#3B82F6', strokeWeight: 6, strokeOpacity: 0.8 }
    });
    directionsRendererRef.current = directionsRenderer;

    // Route sirf tab draw karo jab real driver location ho
    if (hasRealDriverLocation) {
      let origin = { lat: driverLat, lng: driverLng };
      let destination = pickupPos;

      if (status === 'accepted') {
        destination = pickupPos;
      } else if (status === 'ongoing' && dropPos) {
        destination = dropPos;
      } else {
        directionsRenderer.setMap(null);
      }

      if (destination && origin.lat !== destination.lat) {
        directionsService.route({
          origin, destination, travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, stat) => {
          if (stat === 'OK') directionsRenderer.setDirections(result);
        });
      }
    } else {
      directionsRenderer.setMap(null);
      console.log('⚠️ Driver location nahi hai abhi — waiting for WebSocket update...');
    }

    // Bounds fitting
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickupPos);
    if (dropPos) bounds.extend(dropPos);
    if (hasRealDriverLocation) bounds.extend({ lat: driverLat, lng: driverLng });
    map.fitBounds(bounds);

    return () => {
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
      if (driverMarkerRef.current) driverMarkerRef.current.setMap(null);
    };
  }, [mapType, booking._id, booking.bookingStatus]); // REMOVED driverLocation dependency

  const animationRef = useRef(null); // Previous animation cancel karne ke liye

  // Handle Location Updates & Animations
  useEffect(() => {
    if (!driverMarkerRef.current || !window.google || !liveDriverLocation) return;

    const lat = liveDriverLocation.latitude;
    const lng = liveDriverLocation.longitude;
    const heading = liveDriverLocation.heading || 0;
    const newPos = new window.google.maps.LatLng(lat, lng);

    // ✅ Update Car Rotation immediately (Only once per location hit)
    if (driverMarkerRef.current) {
        const iconUrl = getCarIcon(heading);
        driverMarkerRef.current.setIcon({
            url: iconUrl,
            scaledSize: new window.google.maps.Size(60, 60), // Match SVG size
            anchor: new window.google.maps.Point(30, 30) // Center of 60x60
        });
    }

    // ✅ Agar marker pehle hidden tha, ab visible karo
    if (!driverMarkerRef.current.getVisible()) {
      console.log('🚗 Driver marker ab visible ho raha hai! First location received.');
      driverMarkerRef.current.setVisible(true);
      driverMarkerRef.current.setMap(mapInstanceRef.current);
      driverMarkerRef.current.setPosition(newPos);
    }

    // ✅ Pichli animation cancel karo — naya update aagaya toh jitter mat ho
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // 🚗 Smooth Sliding Animation with Ease-In-Out
    const startPos = driverMarkerRef.current.getPosition();
    if (startPos) {
      const startLat = startPos.lat();
      const startLng = startPos.lng();
      let step = 0;
      const numSteps = 60; // ~1 second @ 60fps

      const animate = () => {
        step++;
        if (step <= numSteps) {
          const progress = step / numSteps;
          // Ease-in-out for natural car movement feel
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          if (driverMarkerRef.current) {
            driverMarkerRef.current.setPosition(
              new window.google.maps.LatLng(
                startLat + (lat - startLat) * eased,
                startLng + (lng - startLng) * eased
              )
            );
          }
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Exact final position
          if (driverMarkerRef.current) driverMarkerRef.current.setPosition(newPos);
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      driverMarkerRef.current.setPosition(newPos);
    }

    // Update Route Line
    if (directionsRendererRef.current) {
      const status = booking.bookingStatus?.toLowerCase();
      let destination = status === 'accepted' ? pickupPos : (status === 'ongoing' ? dropPos : null);
      
      if (destination) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route({
          origin: newPos,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        }, (result, stat) => {
          // preserveViewport: true upar set kiya hai, toh ye map ko move nahi karega
          if (stat === 'OK') directionsRendererRef.current.setDirections(result);
        });
      }
    }
    
    // ❌ REMOVED: Automatic panTo interference
    // Iski wajah se user jab zoom/pan karta tha toh map wapas snap ho jata tha.
    /*
    const bounds = mapInstanceRef.current?.getBounds();
    if (mapInstanceRef.current && bounds && !bounds.contains(newPos)) {
      mapInstanceRef.current.panTo(newPos);
    }
    */

  }, [liveDriverLocation]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[400px] md:h-[500px] rounded-xl border-2 border-gray-200 overflow-hidden shadow-inner" />
      {liveDriverLocation && (
        <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-pulse z-10 border-2 border-white">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span>LIVE TRACKING</span>
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
