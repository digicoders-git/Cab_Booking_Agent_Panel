// src/components/BookingTable.jsx
import { useState, useMemo } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaTimes, FaSync, FaBan, FaMapMarkedAlt } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Phone, MapPin } from 'lucide-react';
import { agentService } from '../api/agentApi';
import { toast } from 'sonner';

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

  const handleOpenMap = (e) => {
    e.stopPropagation();
    setMapType('route');
    setShowMapModal(true);
  };

  const canCancel = ['pending', 'ongoing'].includes(booking.bookingStatus?.toLowerCase());

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
                {booking.bookingStatus?.toLowerCase() === 'ongoing' 
                  ? 'Track Live Location on Google Maps' 
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
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowMapModal(false)}>
              <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaMapMarkedAlt className="text-blue-600" size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {mapType === 'route' 
                          ? booking.bookingStatus?.toLowerCase() === 'accepted'
                            ? '🚗 Driver on the way to Pickup'
                            : booking.bookingStatus?.toLowerCase() === 'ongoing'
                            ? '🚗 Live Tracking - En Route'
                            : 'Route Map'
                          : mapType === 'pickup' 
                          ? 'Pickup Location' 
                          : 'Drop Location'
                        }
                      </h3>
                      <p className="text-xs text-gray-500">
                        {booking.passengerDetails?.name} - {booking._id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <FaTimes size={18} className="text-gray-400" />
                  </button>
                </div>

                {/* Map Container */}
                <div className="p-4">
                  <div 
                    className="w-full h-[500px] rounded-xl border-2 border-gray-200 overflow-hidden"
                    ref={(el) => {
                      if (el && !el.dataset.initialized && window.google) {
                        el.dataset.initialized = 'true';
                        
                        const pickupLat = booking.pickup?.latitude || booking.pickup?.lat;
                        const pickupLng = booking.pickup?.longitude || booking.pickup?.lng;
                        const dropLat = booking.drop?.latitude || booking.drop?.lat;
                        const dropLng = booking.drop?.longitude || booking.drop?.lng;
                        
                        // Driver location (mock for now - backend se aayega)
                        const driverLat = booking.driverLocation?.latitude || booking.driverLocation?.lat || pickupLat;
                        const driverLng = booking.driverLocation?.longitude || booking.driverLocation?.lng || pickupLng;

                        const status = booking.bookingStatus?.toLowerCase();

                        if (mapType === 'route') {
                          // ACCEPTED Status: Pickup + Driver Location
                          if (status === 'accepted' && pickupLat && pickupLng) {
                            const map = new window.google.maps.Map(el, {
                              center: { lat: pickupLat, lng: pickupLng },
                              zoom: 14,
                              mapTypeControl: true,
                              streetViewControl: true,
                              fullscreenControl: true,
                            });

                            // Pickup Marker (Green)
                            new window.google.maps.Marker({
                              position: { lat: pickupLat, lng: pickupLng },
                              map: map,
                              title: 'Pickup Location',
                              label: { text: 'P', color: 'white', fontWeight: 'bold' },
                              animation: window.google.maps.Animation.DROP,
                              icon: {
                                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: new window.google.maps.Size(50, 50)
                              }
                            });

                            // Driver Marker (Car Icon - From Backend)
                            const carImage = booking.carCategory?.image 
                              ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${booking.carCategory.image}`
                              : 'https://maps.google.com/mapfiles/kml/shapes/cabs.png';

                            const driverMarker = new window.google.maps.Marker({
                              position: { lat: driverLat, lng: driverLng },
                              map: map,
                              title: `Driver: ${booking.assignedDriver?.name || 'On the way'}`,
                              icon: {
                                url: carImage,
                                scaledSize: new window.google.maps.Size(60, 60)
                              }
                            });

                            // Draw LINE between Pickup and Driver (RED line)
                            const lineCoordinates = [
                              { lat: pickupLat, lng: pickupLng },
                              { lat: driverLat, lng: driverLng }
                            ];

                            new window.google.maps.Polyline({
                              path: lineCoordinates,
                              geodesic: true,
                              strokeColor: '#EF4444',
                              strokeOpacity: 0.8,
                              strokeWeight: 4,
                              map: map,
                              icons: [{
                                icon: {
                                  path: 'M 0,-1 0,1',
                                  strokeOpacity: 1,
                                  scale: 3
                                },
                                offset: '0',
                                repeat: '20px'
                              }]
                            });

                            // Info window for driver
                            const infoWindow = new window.google.maps.InfoWindow({
                              content: `<div style="padding: 8px;">
                                <p style="font-weight: bold; margin: 0; color: #1f2937;">🚗 ${booking.assignedDriver?.name || 'Driver'}</p>
                                <p style="font-size: 12px; margin: 4px 0 0 0; color: #6b7280;">On the way to pickup</p>
                              </div>`
                            });
                            
                            driverMarker.addListener('click', () => {
                              infoWindow.open(map, driverMarker);
                            });

                            // Auto-fit bounds
                            const bounds = new window.google.maps.LatLngBounds();
                            bounds.extend({ lat: pickupLat, lng: pickupLng });
                            bounds.extend({ lat: driverLat, lng: driverLng });
                            map.fitBounds(bounds);

                          } 
                          // ONGOING Status: Pickup + Drop + Driver Location
                          else if (status === 'ongoing' && pickupLat && pickupLng && dropLat && dropLng) {
                            const map = new window.google.maps.Map(el, {
                              center: { lat: pickupLat, lng: pickupLng },
                              zoom: 12,
                              mapTypeControl: true,
                              streetViewControl: true,
                              fullscreenControl: true,
                            });

                            // Pickup Marker (Green)
                            new window.google.maps.Marker({
                              position: { lat: pickupLat, lng: pickupLng },
                              map: map,
                              title: 'Pickup Location (Started)',
                              label: { text: 'P', color: 'white', fontWeight: 'bold' },
                              icon: {
                                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                              }
                            });

                            // Drop Marker (Red)
                            new window.google.maps.Marker({
                              position: { lat: dropLat, lng: dropLng },
                              map: map,
                              title: 'Drop Location (Destination)',
                              label: { text: 'D', color: 'white', fontWeight: 'bold' },
                              icon: {
                                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                              }
                            });

                            // Driver Marker (Car Icon - From Backend)
                            const carImage = booking.carCategory?.image 
                              ? `${import.meta.env.VITE_API_BASE_URL}/uploads/${booking.carCategory.image}`
                              : 'https://maps.google.com/mapfiles/kml/shapes/cabs.png';

                            const driverMarker = new window.google.maps.Marker({
                              position: { lat: driverLat, lng: driverLng },
                              map: map,
                              title: `Driver: ${booking.assignedDriver?.name || 'En route'}`,
                              icon: {
                                url: carImage,
                                scaledSize: new window.google.maps.Size(60, 60)
                              }
                            });

                            // Info window for driver
                            const infoWindow = new window.google.maps.InfoWindow({
                              content: `<div style="padding: 8px;">
                                <p style="font-weight: bold; margin: 0; color: #1f2937;">🚗 ${booking.assignedDriver?.name || 'Driver'}</p>
                                <p style="font-size: 12px; margin: 4px 0 0 0; color: #6b7280;">En route to destination</p>
                              </div>`
                            });
                            
                            driverMarker.addListener('click', () => {
                              infoWindow.open(map, driverMarker);
                            });

                            // Draw Route (Pickup to Drop)
                            const directionsService = new window.google.maps.DirectionsService();
                            const directionsRenderer = new window.google.maps.DirectionsRenderer({
                              map: map,
                              suppressMarkers: true,
                              polylineOptions: {
                                strokeColor: '#2563EB',
                                strokeWeight: 4,
                                strokeOpacity: 0.7
                              }
                            });

                            directionsService.route({
                              origin: { lat: pickupLat, lng: pickupLng },
                              destination: { lat: dropLat, lng: dropLng },
                              travelMode: window.google.maps.TravelMode.DRIVING
                            }, (result, status) => {
                              if (status === 'OK') {
                                directionsRenderer.setDirections(result);
                              }
                            });

                            // Auto-fit bounds
                            const bounds = new window.google.maps.LatLngBounds();
                            bounds.extend({ lat: pickupLat, lng: pickupLng });
                            bounds.extend({ lat: dropLat, lng: dropLng });
                            bounds.extend({ lat: driverLat, lng: driverLng });
                            map.fitBounds(bounds);
                          }
                          // COMPLETED Status: Full route
                          else if (status === 'completed' && pickupLat && pickupLng && dropLat && dropLng) {
                            const map = new window.google.maps.Map(el, {
                              center: { lat: pickupLat, lng: pickupLng },
                              zoom: 12,
                              mapTypeControl: true,
                              streetViewControl: true,
                              fullscreenControl: true,
                            });

                            // Pickup Marker
                            new window.google.maps.Marker({
                              position: { lat: pickupLat, lng: pickupLng },
                              map: map,
                              title: 'Pickup Location',
                              label: 'P',
                              icon: {
                                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                              }
                            });

                            // Drop Marker
                            new window.google.maps.Marker({
                              position: { lat: dropLat, lng: dropLng },
                              map: map,
                              title: 'Drop Location',
                              label: 'D',
                              icon: {
                                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                              }
                            });

                            // Draw Route
                            const directionsService = new window.google.maps.DirectionsService();
                            const directionsRenderer = new window.google.maps.DirectionsRenderer({
                              map: map,
                              suppressMarkers: true,
                              polylineOptions: {
                                strokeColor: '#10B981',
                                strokeWeight: 5,
                                strokeOpacity: 0.8
                              }
                            });

                            directionsService.route({
                              origin: { lat: pickupLat, lng: pickupLng },
                              destination: { lat: dropLat, lng: dropLng },
                              travelMode: window.google.maps.TravelMode.DRIVING
                            }, (result, status) => {
                              if (status === 'OK') {
                                directionsRenderer.setDirections(result);
                              }
                            });
                          }

                        } else if (mapType === 'pickup' && pickupLat && pickupLng) {
                          // Pickup Only
                          const map = new window.google.maps.Map(el, {
                            center: { lat: pickupLat, lng: pickupLng },
                            zoom: 16,
                            mapTypeControl: true,
                            streetViewControl: true,
                            fullscreenControl: true,
                          });

                          new window.google.maps.Marker({
                            position: { lat: pickupLat, lng: pickupLng },
                            map: map,
                            title: 'Pickup Location',
                            animation: window.google.maps.Animation.BOUNCE,
                            icon: {
                              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                              scaledSize: new window.google.maps.Size(50, 50)
                            }
                          });

                        } else if (mapType === 'drop' && dropLat && dropLng) {
                          // Drop Only
                          const map = new window.google.maps.Map(el, {
                            center: { lat: dropLat, lng: dropLng },
                            zoom: 16,
                            mapTypeControl: true,
                            streetViewControl: true,
                            fullscreenControl: true,
                          });

                          new window.google.maps.Marker({
                            position: { lat: dropLat, lng: dropLng },
                            map: map,
                            title: 'Drop Location',
                            animation: window.google.maps.Animation.BOUNCE,
                            icon: {
                              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                              scaledSize: new window.google.maps.Size(50, 50)
                            }
                          });
                        }
                      }
                    }}
                  />
                </div>

                {/* Location Details */}
                <div className="p-4 border-t bg-gray-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={14} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Pickup</p>
                      <p className="text-sm text-gray-800">{booking.pickup?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={14} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Drop</p>
                      <p className="text-sm text-gray-800">{booking.drop?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Distance:</span>
                      <span className="text-sm font-semibold text-gray-800">{booking.estimatedDistanceKm} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Status:</span>
                      <StatusBadge status={booking.bookingStatus} booking={booking} />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t flex gap-3">
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
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <FaMapMarkedAlt size={14} />
                    Open in Google Maps
                  </button>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
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
