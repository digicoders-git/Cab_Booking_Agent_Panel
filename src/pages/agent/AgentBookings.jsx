// src/pages/agent/AgentBookings.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';
import { FaSync, FaPlusCircle, FaArrowLeft } from 'react-icons/fa';
import BookingTable from '../../components/BookingTable';
import LiveLocationMonitor from '../../components/LiveLocationMonitor';

export default function AgentBookings() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await agentService.getMyBookings();
      const bookingsList = data?.bookings || data || [];
      
      console.log('📦 Fetched Bookings from API:', {
        count: bookingsList.length,
        bookings: bookingsList.map(b => ({
          id: b._id?.slice(-8),
          passenger: b.passengerDetails?.name,
          status: b.bookingStatus,
          driverLocation: b.driverLocation,
          assignedDriver: b.assignedDriver
        }))
      });
      
      setBookings(bookingsList);
    } catch (err) {
      toast.error(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // Real-time booking updates
  useEffect(() => {
    const handleBookingUpdate = (event) => {
      const data = event.detail;
      console.log('📢 Real-time booking update received:', data);
      
      // Update booking in list
      setBookings(prevBookings => {
        return prevBookings.map(booking => {
          if (booking._id === data.bookingId) {
            return {
              ...booking,
              bookingStatus: data.status,
              // FIX: driverLocation aur assignedDriver._id bhi update karo
              // Taaki map turant driver dikhaye bina refresh ke
              driverLocation: data.driverLocation?.latitude
                ? data.driverLocation
                : booking.driverLocation,
              assignedDriver: data.driverName ? {
                ...booking.assignedDriver,
                _id: data.driverId || booking.assignedDriver?._id, // FIX: _id zaruri hai map tracking ke liye
                name: data.driverName,
                phone: data.driverPhone
              } : booking.assignedDriver
            };
          }
          return booking;
        });
      });
    };

    const handleLocationUpdate = (event) => {
      const data = event.detail;
      console.log('🚗 AgentBookings: Driver Location Update Received:', data);
      
      setBookings(prevBookings => {
        const updated = prevBookings.map(booking => {
          // Check if this booking belongs to this driver and is active
          const driverId = typeof booking.assignedDriver === 'object' 
            ? booking.assignedDriver?._id 
            : booking.assignedDriver;

          if (driverId === data.driverId && 
              booking.bookingStatus && 
              ['accepted', 'ongoing'].includes(booking.bookingStatus.toLowerCase())) {
            
            return {
              ...booking,
              driverLocation: {
                latitude: data.latitude,
                longitude: data.longitude,
                heading: data.heading,
                lastUpdated: data.timestamp
              }
            };
          }
          return booking;
        });
        return updated;
      });
    };

    const handleDriverArrived = (event) => {
      const data = event.detail;
      console.log('📍 AgentBookings: Driver Arrived Event Received:', data);
      
      setBookings(prevBookings => {
        return prevBookings.map(booking => {
          if (booking._id === data.bookingId) {
            return {
              ...booking,
              tripData: {
                ...booking.tripData,
                arrivedAt: data.arrivedAt || new Date().toISOString()
              }
            };
          }
          return booking;
        });
      });
    };

    const handleStopUpdate = (event) => {
      const data = event.detail;
      console.log('📍 AgentBookings: Stop Update Received:', data);
      
      setBookings(prevBookings => {
        return prevBookings.map(booking => {
          if (booking._id === data.bookingId) {
             const updatedStops = [...(booking.stops || [])];
             if (updatedStops[data.stopIndex]) {
                updatedStops[data.stopIndex] = {
                   ...updatedStops[data.stopIndex],
                   status: data.status,
                   arrivedAt: data.arrivedAt,
                   waitingTimeMin: data.waitingTimeMin,
                   waitingCharges: data.waitingCharges
                };
             }
             return {
                ...booking,
                stops: updatedStops,
                actualFare: data.actualFare || booking.actualFare
             };
          }
          return booking;
        });
      });
    };

    // Listen for custom events
    window.addEventListener('booking_update', handleBookingUpdate);
    window.addEventListener('driver_location_update', handleLocationUpdate);
    window.addEventListener('driver_arrived', handleDriverArrived);
    window.addEventListener('stop_update', handleStopUpdate);

    return () => {
      window.removeEventListener('booking_update', handleBookingUpdate);
      window.removeEventListener('driver_location_update', handleLocationUpdate);
      window.removeEventListener('driver_arrived', handleDriverArrived);
      window.removeEventListener('stop_update', handleStopUpdate);
    };
  }, []);

  const stats = useMemo(() => ({
    total:     bookings.length,
    completed: bookings.filter(b => b.bookingStatus?.toLowerCase() === 'completed').length,
    pending:   bookings.filter(b => b.bookingStatus?.toLowerCase() === 'pending').length,
    ongoing:   bookings.filter(b => b.bookingStatus?.toLowerCase() === 'ongoing').length,
    cancelled: bookings.filter(b => b.bookingStatus?.toLowerCase() === 'cancelled').length,
    expired:   bookings.filter(b => b.bookingStatus?.toLowerCase() === 'expired').length,
  }), [bookings]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      {/* Header */}
      <div className="mb-6">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {stats.total} total • Click row to expand details
                {connected && <span className="ml-2 text-green-600">• 🟢 Live</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agent/create-booking')}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-200"
            >
              <FaPlusCircle size={14} /> New Booking
            </button>
            <button
              onClick={fetchBookings}
              className="p-2.5 bg-white rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
            >
              <FaSync className={loading ? 'animate-spin' : ''} size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total',     val: stats.total,     color: 'text-gray-900' },
          { label: 'Completed', val: stats.completed, color: 'text-green-600' },
          { label: 'Pending',   val: stats.pending,   color: 'text-yellow-600' },
          { label: 'Ongoing',   val: stats.ongoing,   color: 'text-blue-600' },
          { label: 'Cancelled', val: stats.cancelled, color: 'text-red-600' },
          { label: 'Expired',   val: stats.expired,   color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Booking Table */}
      <BookingTable bookings={bookings} loading={loading} onRefresh={fetchBookings} />

      {/* Live Location Monitor - Floating Button */}
      <LiveLocationMonitor />
    </div>
  );
}
