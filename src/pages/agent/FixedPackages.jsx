// src/pages/agent/FixedPackages.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  FaRoute, FaCar, FaClock, FaRoad, FaMoneyBillWave,
  FaCalendarAlt, FaUser, FaPhone, FaSearch, FaSync,
  FaCheckCircle, FaTimes, FaMapMarkerAlt, FaPercent, FaPlusCircle, FaInfoCircle
} from 'react-icons/fa';

export default function FixedPackages() {
  const navigate = useNavigate();
  const { themeColors: tc } = useTheme();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupDate: '',
    pickupTime: '',
    paymentMethod: 'Cash'
  });

  const fetchActiveRoutes = async () => {
    try {
      setLoading(true);
      const res = await agentService.getActiveFixedRoutes();
      const routeList = res?.routes || res || [];
      setRoutes(routeList);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load fixed packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRoutes();
  }, []);

  const handleOpenBooking = (route) => {
    setSelectedRoute(route);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      customerName: '',
      customerPhone: '',
      pickupDate: today,
      pickupTime: '10:00',
      paymentMethod: 'Cash'
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      return toast.error('Please enter customer name and phone number');
    }
    if (!formData.pickupDate || !formData.pickupTime) {
      return toast.error('Please select pickup date and time');
    }

    try {
      setBookingLoading(true);
      const payload = {
        routeId: selectedRoute._id,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        paymentMethod: formData.paymentMethod
      };

      const res = await agentService.bookFixedRoute(payload);

      if (res?.success) {
        setShowBookingModal(false);
        Swal.fire({
          title: 'Package Booked! 🚖',
          text: `Booking for ${formData.customerName} has been posted to the Marketplace successfully!`,
          icon: 'success',
          confirmButtonText: 'View My Package Bookings',
          confirmButtonColor: tc.primary || '#3B82F6',
          showCancelButton: true,
          cancelButtonText: 'Book Another'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/agent/my-fixed-bookings');
          }
        });
      } else {
        toast.error(res?.message || 'Failed to book package');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Error occurred while booking package');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.routeName?.toLowerCase().includes(term) ||
      r.pickupLocation?.toLowerCase().includes(term) ||
      r.dropLocation?.toLowerCase().includes(term) ||
      r.carCategory?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div
      className="w-full min-h-screen p-4 sm:p-6 space-y-6 transition-colors duration-200"
      style={{ backgroundColor: tc.background }}
    >
      {/* Header Banner */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary || '#1e40af'} 100%)`
        }}
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaRoute className="text-yellow-300" /> Fixed Route Packages
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Book predefined city, airport, and outstation packages for your customers and earn instant commission.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/agent/my-fixed-bookings')}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition backdrop-blur-sm flex items-center gap-2 border border-white/20"
          >
            My Package Bookings
          </button>
          <button
            onClick={fetchActiveRoutes}
            disabled={loading}
            className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition backdrop-blur-sm border border-white/20"
            title="Refresh"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="flex items-center gap-3 p-3 rounded-xl border shadow-sm"
        style={{ backgroundColor: tc.surface, borderColor: tc.border }}
      >
        <FaSearch className="ml-2" style={{ color: tc.textSecondary }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search packages by route, city, or cab type..."
          className="w-full bg-transparent border-none outline-none text-sm"
          style={{ color: tc.text }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="pr-2 hover:opacity-80"
            style={{ color: tc.textSecondary }}
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-3"
            style={{ borderColor: tc.primary, borderTopColor: 'transparent' }}
          ></div>
          <p className="text-sm font-semibold" style={{ color: tc.textSecondary }}>Loading Packages...</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border border-dashed p-8"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <FaRoute className="text-5xl mx-auto mb-3" style={{ color: tc.textSecondary }} />
          <h3 className="text-lg font-bold mb-1" style={{ color: tc.text }}>No Packages Found</h3>
          <p className="text-sm" style={{ color: tc.textSecondary }}>There are no active fixed route packages available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRoutes.map((route) => {
            const gstAmount = Math.round(route.price * 0.05);
            const totalEstimatedPrice = route.price + gstAmount;

            return (
              <div
                key={route._id}
                className="rounded-2xl border hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                style={{ backgroundColor: tc.surface, borderColor: tc.border }}
              >
                <div>
                  {/* Card Top */}
                  <div
                    className="p-5 border-b"
                    style={{ backgroundColor: tc.background, borderColor: tc.border }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg mb-2"
                          style={{ backgroundColor: `${tc.primary}15`, color: tc.primary }}
                        >
                          {route.tripType || 'One-Way Package'}
                        </span>
                        <h3 className="font-bold text-base leading-snug" style={{ color: tc.text }}>
                          {route.routeName}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black" style={{ color: tc.text }}>₹{route.price}</span>
                        <p className="text-[11px]" style={{ color: tc.textSecondary }}>+5% GST</p>
                      </div>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center mt-1">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                        <span className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700 my-0.5"></span>
                        <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100"></span>
                      </div>
                      <div className="flex-1 space-y-2 text-xs">
                        <div>
                          <p className="font-medium" style={{ color: tc.textSecondary }}>Pickup</p>
                          <p className="font-semibold line-clamp-1" style={{ color: tc.text }}>{route.pickupLocation}</p>
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: tc.textSecondary }}>Drop</p>
                          <p className="font-semibold line-clamp-1" style={{ color: tc.text }}>{route.dropLocation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div
                      className="grid grid-cols-2 gap-2 pt-2 border-t text-xs"
                      style={{ borderColor: tc.border }}
                    >
                      <div
                        className="flex items-center gap-1.5 p-2 rounded-lg"
                        style={{ backgroundColor: tc.background }}
                      >
                        <FaCar className="text-blue-500 shrink-0" />
                        <span className="truncate font-semibold" style={{ color: tc.text }}>{route.carCategory?.name || 'Cab'}</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 p-2 rounded-lg"
                        style={{ backgroundColor: tc.background }}
                      >
                        <FaRoad className="text-purple-500 shrink-0" />
                        <span className="truncate font-semibold" style={{ color: tc.text }}>
                          {route.maxDistanceKm ? `${route.maxDistanceKm} KM` : 'Flat Distance'}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 p-2 rounded-lg"
                        style={{ backgroundColor: tc.background }}
                      >
                        <FaClock className="text-amber-500 shrink-0" />
                        <span className="truncate font-semibold" style={{ color: tc.text }}>
                          {route.maxTimeHours ? `${route.maxTimeHours} Hours` : 'Standard Duration'}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 p-2 rounded-lg"
                        style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}
                      >
                        <FaPercent className="shrink-0" />
                        <span className="font-bold">Commission Share</span>
                      </div>
                    </div>

                    {/* Toll Note Banner */}
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-left">
                      <FaInfoCircle className="text-amber-500 text-xs mt-0.5 shrink-0" />
                      <p className="text-[11px] leading-tight text-amber-700 dark:text-amber-300 font-medium">
                        <span className="font-bold text-amber-800 dark:text-amber-200">Note:</span> Fare ke alawa toll alag se pay karna hoga. Kisi bhi offer / package ride mein toll include nahi hai.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div
                  className="p-4 border-t flex items-center justify-between"
                  style={{ backgroundColor: tc.background, borderColor: tc.border }}
                >
                  <div className="text-xs">
                    <p style={{ color: tc.textSecondary }}>Estimated Total</p>
                    <p className="font-black text-sm" style={{ color: tc.text }}>₹{totalEstimatedPrice}</p>
                  </div>
                  <button
                    onClick={() => handleOpenBooking(route)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 hover:opacity-90"
                    style={{ backgroundColor: tc.primary, color: '#ffffff' }}
                  >
                    <FaPlusCircle size={12} /> Book for Customer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedRoute && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowBookingModal(false)}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border"
            style={{ backgroundColor: tc.surface, borderColor: tc.border }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-5 border-b flex items-center justify-between sticky top-0 z-10"
              style={{ backgroundColor: tc.surface, borderColor: tc.border }}
            >
              <div>
                <h3 className="font-bold text-base" style={{ color: tc.text }}>
                  Book Package for Customer
                </h3>
                <p className="text-xs" style={{ color: tc.textSecondary }}>
                  {selectedRoute.routeName} ({selectedRoute.carCategory?.name || 'Cab'})
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 rounded-xl border transition hover:opacity-80"
                style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.textSecondary }}
              >
                <FaTimes size={15} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBookingSubmit} className="p-5 space-y-4 text-xs">
              {/* Route Summary */}
              <div
                className="p-3 rounded-xl border space-y-2"
                style={{ backgroundColor: tc.background, borderColor: tc.border }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: tc.textSecondary }}>Package Price:</span>
                  <span className="font-bold text-sm" style={{ color: tc.text }}>₹{selectedRoute.price} (+5% GST)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: tc.textSecondary }}>Pickup:</span>
                  <span className="font-medium truncate max-w-[250px]" style={{ color: tc.text }}>{selectedRoute.pickupLocation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: tc.textSecondary }}>Drop:</span>
                  <span className="font-medium truncate max-w-[250px]" style={{ color: tc.text }}>{selectedRoute.dropLocation}</span>
                </div>
              </div>

              {/* Toll Note in Modal */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-left">
                <FaInfoCircle className="text-amber-500 text-sm mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300 font-medium">
                  <strong className="text-amber-700 dark:text-amber-200">Important Note:</strong> Fare ke alawa Toll tax customer ko alag se pay karna hoga. Kisi bhi offer / package ride mein toll include nahi hai.
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block font-bold mb-1" style={{ color: tc.text }}>
                  Customer Name *
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tc.textSecondary }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter customer's full name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.text }}
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block font-bold mb-1" style={{ color: tc.text }}>
                  Customer Phone Number *
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tc.textSecondary }} />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.text }}
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1" style={{ color: tc.text }}>
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.text }}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1" style={{ color: tc.text }}>
                    Pickup Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.pickupTime}
                    onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border focus:outline-none"
                    style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.text }}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block font-bold mb-1" style={{ color: tc.text }}>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Cash', 'Online'].map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setFormData({ ...formData, paymentMethod: mode })}
                      className="py-2.5 rounded-xl font-bold border transition-all text-xs"
                      style={formData.paymentMethod === mode ? {
                        backgroundColor: tc.primary,
                        color: '#ffffff',
                        borderColor: tc.primary
                      } : {
                        backgroundColor: tc.background,
                        color: tc.textSecondary,
                        borderColor: tc.border
                      }}
                    >
                      {mode === 'Cash' ? '💵 Pay to Driver (Cash)' : '💳 Online Payment'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div
                className="pt-4 border-t flex items-center justify-end gap-3"
                style={{ borderColor: tc.border }}
              >
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2.5 border rounded-xl font-bold transition hover:opacity-80"
                  style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:opacity-90 flex items-center gap-2"
                  style={{ backgroundColor: tc.primary, color: '#ffffff' }}
                >
                  {bookingLoading ? (
                    <FaSync className="animate-spin" />
                  ) : (
                    <FaCheckCircle />
                  )}
                  Confirm &amp; Book Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
