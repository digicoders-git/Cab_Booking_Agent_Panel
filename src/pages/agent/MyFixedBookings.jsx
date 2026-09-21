// src/pages/agent/MyFixedBookings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  FaRoute, FaCar, FaClock, FaCalendarAlt, FaUser, FaPhone,
  FaSearch, FaSync, FaDownload, FaBan, FaCheckCircle,
  FaSpinner, FaTimes, FaMapMarkerAlt, FaEye, FaCoins,
  FaShieldAlt, FaPlusCircle, FaCarSide, FaInfoCircle
} from 'react-icons/fa';

const STATUS_CONFIG = {
  Marketplace: { label: 'In Marketplace', dot: true, pulse: true,  bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', dotColor: '#F97316' },
  Accepted:    { label: 'Driver Assigned', dot: true, pulse: false, bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dotColor: '#3B82F6' },
  Started:     { label: 'Trip Started',    dot: true, pulse: true,  bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dotColor: '#8B5CF6' },
  Completed:   { label: 'Completed',       dot: false, pulse: false, bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dotColor: '#22C55E' },
  Cancelled:   { label: 'Cancelled',       dot: false, pulse: false, bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dotColor: '#EF4444' },
};

export default function MyFixedBookings() {
  const navigate = useNavigate();
  const { themeColors: tc, theme } = useTheme();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await agentService.getMyFixedBookings();
      const list = res?.bookings || res || [];
      setBookings(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load package bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = bookings.length;
    const marketplace = bookings.filter(b => b.status === 'Marketplace').length;
    const active = bookings.filter(b => ['Accepted', 'Started'].includes(b.status)).length;
    const completed = bookings.filter(b => b.status === 'Completed').length;
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length;
    const totalCommission = bookings
      .filter(b => b.status === 'Completed' || b.agentCommissionPaid)
      .reduce((sum, b) => sum + (Number(b.agentCommission) || 0), 0);

    return { total, marketplace, active, completed, cancelled, totalCommission };
  }, [bookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchStatus;

      const idMatch = b._id?.toLowerCase().includes(term);
      const custNameMatch = b.customerName?.toLowerCase().includes(term);
      const custPhoneMatch = b.customerPhone?.toLowerCase().includes(term);
      const pickupMatch = b.pickupLocation?.toLowerCase().includes(term);
      const dropMatch = b.dropLocation?.toLowerCase().includes(term);
      const driverMatch = b.assignedDriver?.name?.toLowerCase().includes(term);

      return matchStatus && (idMatch || custNameMatch || custPhoneMatch || pickupMatch || dropMatch || driverMatch);
    });
  }, [bookings, statusFilter, searchTerm]);

  // Download Receipt PDF
  const handleDownloadReceipt = async (bookingId, e) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(bookingId);
      const resData = await agentService.downloadFixedBookingReceipt(bookingId);
      const blob = new Blob([resData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FixedRoute_Receipt_${bookingId.slice(-6).toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully!');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (booking, e) => {
    if (e) e.stopPropagation();

    const result = await Swal.fire({
      title: 'Cancel Package Ride?',
      text: `Are you sure you want to cancel the booking for ${booking.customerName || 'customer'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: tc.danger || '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Cancel Ride'
    });

    if (result.isConfirmed) {
      try {
        setCancellingId(booking._id);
        const res = await agentService.cancelFixedBooking(booking._id);
        if (res?.success) {
          toast.success('Package booking cancelled successfully');
          fetchBookings();
        } else {
          toast.error(res?.message || 'Failed to cancel booking');
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel booking');
      } finally {
        setCancellingId(null);
      }
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div
      className="w-full min-h-screen p-4 sm:p-6 transition-colors duration-200"
      style={{ backgroundColor: tc.background }}
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-transform"
            style={{ backgroundColor: tc.primary, color: '#ffffff' }}
          >
            <FaRoute size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: tc.text }}>
              My Package Rides
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: tc.textSecondary }}>
              Track customer fixed-route bookings, live status, and earned commissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/agent/fixed-packages')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90 shadow-sm active:scale-95"
            style={{ backgroundColor: tc.primary, color: '#ffffff' }}
          >
            <FaPlusCircle size={14} /> Book New Package
          </button>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2.5 rounded-xl border transition-all hover:opacity-80"
            style={{ backgroundColor: tc.surface, borderColor: tc.border, color: tc.textSecondary }}
            title="Refresh"
          >
            <FaSync size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div
          className="p-4 rounded-2xl border transition-all"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tc.textSecondary }}>Total Rides</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: tc.text }}>{stats.total}</p>
        </div>
        <div
          className="p-4 rounded-2xl border transition-all"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Marketplace</p>
          <p className="text-2xl font-extrabold mt-1 text-amber-600">{stats.marketplace}</p>
        </div>
        <div
          className="p-4 rounded-2xl border transition-all"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Active</p>
          <p className="text-2xl font-extrabold mt-1 text-blue-600">{stats.active}</p>
        </div>
        <div
          className="p-4 rounded-2xl border transition-all"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="text-2xl font-extrabold mt-1 text-emerald-600">{stats.completed}</p>
        </div>
        <div
          className="p-4 rounded-2xl border transition-all"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Cancelled</p>
          <p className="text-2xl font-extrabold mt-1 text-rose-600">{stats.cancelled}</p>
        </div>
        <div
          className="p-4 rounded-2xl border transition-all flex flex-col justify-between"
          style={{
            backgroundColor: tc.surface,
            borderColor: '#10B981',
            borderLeftWidth: '4px'
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Commission</p>
            <FaCoins className="text-emerald-500" size={13} />
          </div>
          <p className="text-2xl font-black mt-1 text-emerald-600">₹{stats.totalCommission.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div
        className="p-3.5 rounded-2xl border mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
        style={{ backgroundColor: tc.surface, borderColor: tc.border }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: tc.textSecondary }} size={13} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, phone, route, driver or ID..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-sm border focus:outline-none transition-all"
            style={{
              backgroundColor: tc.background,
              borderColor: tc.border,
              color: tc.text
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: tc.textSecondary }}
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>

        {/* Tabs Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {['ALL', 'Marketplace', 'Accepted', 'Started', 'Completed', 'Cancelled'].map((st) => {
            const isSel = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                style={isSel ? {
                  backgroundColor: tc.primary,
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                } : {
                  backgroundColor: tc.background,
                  color: tc.textSecondary,
                  border: `1px solid ${tc.border}`
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bookings Grid / Cards ── */}
      {loading ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl border"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <FaSpinner className="animate-spin text-3xl mb-3" style={{ color: tc.primary }} />
          <p className="text-sm font-semibold" style={{ color: tc.textSecondary }}>Loading package bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div
          className="text-center py-20 px-4 rounded-2xl border border-dashed"
          style={{ backgroundColor: tc.surface, borderColor: tc.border }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: tc.background }}
          >
            <FaRoute size={28} style={{ color: tc.textSecondary }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: tc.text }}>
            {searchTerm || statusFilter !== 'ALL' ? 'No matching package bookings' : 'No package bookings yet'}
          </h3>
          <p className="text-xs max-w-md mx-auto mb-5" style={{ color: tc.textSecondary }}>
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or filter tabs.'
              : 'Book fixed route packages for your customers to earn guaranteed commissions on every completed ride!'}
          </p>
          {searchTerm || statusFilter !== 'ALL' ? (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
              style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.text }}
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={() => navigate('/agent/fixed-packages')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
              style={{ backgroundColor: tc.primary, color: '#ffffff' }}
            >
              <FaPlusCircle size={13} /> Explore Available Packages
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.Marketplace;
            const isCancellable = ['Marketplace', 'Accepted'].includes(b.status);

            return (
              <div
                key={b._id}
                onClick={() => setSelectedBooking(b)}
                className="rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between overflow-hidden cursor-pointer"
                style={{ backgroundColor: tc.surface, borderColor: tc.border }}
              >
                {/* Card Top */}
                <div
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: tc.border, backgroundColor: tc.background }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border"
                      style={{ backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }}
                    >
                      #{b._id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${tc.primary}15`, color: tc.primary }}
                    >
                      {b.tripType || 'One-Way'}
                    </span>
                  </div>

                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border"
                    style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}
                  >
                    {sc.dot && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${sc.pulse ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: sc.dotColor }}
                      />
                    )}
                    {sc.label}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3 flex-1 text-xs">
                  {/* Route */}
                  <div className="space-y-2 p-2.5 rounded-xl border" style={{ backgroundColor: tc.background, borderColor: tc.border }}>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-emerald-500 mt-0.5 shrink-0" size={13} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium" style={{ color: tc.textSecondary }}>Pickup</p>
                        <p className="font-semibold truncate" style={{ color: tc.text }}>{b.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-rose-500 mt-0.5 shrink-0" size={13} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium" style={{ color: tc.textSecondary }}>Drop</p>
                        <p className="font-semibold truncate" style={{ color: tc.text }}>{b.dropLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div
                    className="flex items-center justify-between p-2.5 rounded-xl border"
                    style={{ backgroundColor: tc.background, borderColor: tc.border }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold"
                        style={{ backgroundColor: `${tc.primary}15`, color: tc.primary }}
                      >
                        <FaUser size={11} />
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: tc.text }}>{b.customerName || 'Customer'}</p>
                        <p className="text-[11px]" style={{ color: tc.textSecondary }}>{b.customerPhone}</p>
                      </div>
                    </div>
                    {b.customerPhone && (
                      <a
                        href={`tel:${b.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg border hover:opacity-80 transition-all text-emerald-600"
                        style={{ backgroundColor: tc.surface, borderColor: tc.border }}
                        title="Call Customer"
                      >
                        <FaPhone size={11} />
                      </a>
                    )}
                  </div>

                  {/* Schedule & Car Specs */}
                  <div className="grid grid-cols-2 gap-2" style={{ color: tc.textSecondary }}>
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-blue-500" size={11} />
                      <span>{formatDate(b.pickupDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaClock className="text-purple-500" size={11} />
                      <span>{b.pickupTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <FaCar className="text-slate-500" size={11} />
                      <span className="font-semibold" style={{ color: tc.text }}>
                        {b.carCategory?.name || 'Cab'}
                      </span>
                    </div>
                  </div>

                  {/* Start OTP (Show when Accepted or Started) */}
                  {b.startOtp && ['Accepted', 'Started'].includes(b.status) && (
                    <div
                      className="p-2.5 rounded-xl border flex items-center justify-between"
                      style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
                    >
                      <div className="flex items-center gap-2 text-amber-900">
                        <FaShieldAlt size={12} className="text-amber-600" />
                        <span className="font-bold text-xs uppercase tracking-wider">Ride Start OTP:</span>
                      </div>
                      <span className="font-mono text-base font-black text-amber-900 tracking-widest bg-amber-200/80 px-2 py-0.5 rounded-md">
                        {b.startOtp}
                      </span>
                    </div>
                  )}

                  {/* Assigned Driver (if any) */}
                  {b.assignedDriver && (
                    <div
                      className="p-2.5 rounded-xl border"
                      style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                        Assigned Driver
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-blue-950">{b.assignedDriver.name}</p>
                          <p className="text-[11px] text-blue-700">
                            {b.assignedDriver.carDetails?.carNumber || b.assignedDriver.phone}
                          </p>
                        </div>
                        {b.assignedDriver.phone && (
                          <a
                            href={`tel:${b.assignedDriver.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Call Driver"
                          >
                            <FaPhone size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing and Commission */}
                  <div
                    className="pt-2.5 border-t flex items-center justify-between"
                    style={{ borderColor: tc.border }}
                  >
                    <div>
                      <p className="text-[10px] uppercase font-semibold" style={{ color: tc.textSecondary }}>Total Fare</p>
                      <p className="text-base font-black" style={{ color: tc.text }}>
                        ₹{(b.finalPrice || b.totalWithTax || b.price)?.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase font-semibold text-emerald-600">Your Commission</p>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-base font-black text-emerald-600">
                          ₹{(b.agentCommission || 0).toLocaleString('en-IN')}
                        </span>
                        {b.agentCommissionPaid && (
                          <FaCheckCircle className="text-emerald-500" size={11} title="Credited to Wallet" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div
                  className="p-3 border-t flex items-center justify-between gap-2"
                  style={{ backgroundColor: tc.background, borderColor: tc.border }}
                >
                  <button
                    onClick={(e) => handleDownloadReceipt(b._id, e)}
                    disabled={downloadingId === b._id}
                    className="flex-1 py-1.5 px-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-80"
                    style={{ backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }}
                  >
                    {downloadingId === b._id ? (
                      <FaSpinner className="animate-spin text-blue-500" size={11} />
                    ) : (
                      <FaDownload size={11} />
                    )}
                    Receipt
                  </button>

                  {isCancellable && (
                    <button
                      onClick={(e) => handleCancelBooking(b, e)}
                      disabled={cancellingId === b._id}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                    >
                      {cancellingId === b._id ? (
                        <FaSpinner className="animate-spin text-rose-500" size={11} />
                      ) : (
                        <FaBan size={11} />
                      )}
                      Cancel
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    style={{
                      backgroundColor: `${tc.primary}15`,
                      color: tc.primary,
                      border: `1px solid ${tc.primary}30`
                    }}
                  >
                    <FaEye size={11} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detailed Modal ── */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border"
            style={{ backgroundColor: tc.surface, borderColor: tc.border }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-5 border-b flex items-center justify-between sticky top-0 z-10"
              style={{ backgroundColor: tc.surface, borderColor: tc.border }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${tc.primary}15`, color: tc.primary }}
                >
                  <FaRoute size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: tc.text }}>
                    Package #{selectedBooking._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-xs" style={{ color: tc.textSecondary }}>
                    Booked on {formatDate(selectedBooking.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl transition-all border"
                style={{ backgroundColor: tc.background, borderColor: tc.border, color: tc.textSecondary }}
              >
                <FaTimes size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-sm">
              {/* Status */}
              <div
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{ backgroundColor: tc.background, borderColor: tc.border }}
              >
                <span className="text-xs font-semibold" style={{ color: tc.textSecondary }}>Booking Status:</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: STATUS_CONFIG[selectedBooking.status]?.bg,
                    color: STATUS_CONFIG[selectedBooking.status]?.text,
                    borderColor: STATUS_CONFIG[selectedBooking.status]?.border
                  }}
                >
                  {STATUS_CONFIG[selectedBooking.status]?.label || selectedBooking.status}
                </span>
              </div>

              {/* Start OTP */}
              {selectedBooking.startOtp && (
                <div
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}
                >
                  <div>
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Ride Start OTP</p>
                    <p className="text-xs text-amber-700 mt-0.5">Share with driver or passenger to start trip</p>
                  </div>
                  <span className="text-xl font-black text-amber-900 font-mono tracking-widest bg-amber-200/90 px-3 py-1 rounded-xl">
                    {selectedBooking.startOtp}
                  </span>
                </div>
              )}

              {/* Route */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ backgroundColor: tc.background, borderColor: tc.border }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tc.textSecondary }}>Route Overview</p>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-emerald-500 mt-1 shrink-0" size={15} />
                  <div>
                    <p className="text-xs" style={{ color: tc.textSecondary }}>Pickup Location</p>
                    <p className="font-semibold" style={{ color: tc.text }}>{selectedBooking.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-rose-500 mt-1 shrink-0" size={15} />
                  <div>
                    <p className="text-xs" style={{ color: tc.textSecondary }}>Drop Location</p>
                    <p className="font-semibold" style={{ color: tc.text }}>{selectedBooking.dropLocation}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{ backgroundColor: tc.background, borderColor: tc.border }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tc.textSecondary }}>Customer Details</p>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: tc.textSecondary }}>Customer Name:</span>
                  <span className="font-bold" style={{ color: tc.text }}>{selectedBooking.customerName || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: tc.textSecondary }}>Customer Phone:</span>
                  <span className="font-bold" style={{ color: tc.text }}>{selectedBooking.customerPhone || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: tc.textSecondary }}>Pickup Date &amp; Time:</span>
                  <span className="font-bold" style={{ color: tc.text }}>
                    {formatDate(selectedBooking.pickupDate)} at {selectedBooking.pickupTime}
                  </span>
                </div>
              </div>

              {/* Assigned Driver */}
              {selectedBooking.assignedDriver && (
                <div
                  className="p-4 rounded-xl border space-y-2"
                  style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Assigned Driver</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-800">Driver Name:</span>
                    <span className="font-bold text-blue-950">{selectedBooking.assignedDriver.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-800">Driver Phone:</span>
                    <span className="font-bold text-blue-950">{selectedBooking.assignedDriver.phone}</span>
                  </div>
                  {selectedBooking.assignedDriver.carDetails?.carNumber && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-800">Vehicle Number:</span>
                      <span className="font-mono font-bold text-blue-950">
                        {selectedBooking.assignedDriver.carDetails.carNumber}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Financials */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{ backgroundColor: tc.background, borderColor: tc.border }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tc.textSecondary }}>Fare &amp; Commission Summary</p>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: tc.textSecondary }}>Package Base Fare:</span>
                  <span className="font-semibold" style={{ color: tc.text }}>₹{selectedBooking.price?.toLocaleString('en-IN')}</span>
                </div>
                {(selectedBooking.cgst > 0 || selectedBooking.sgst > 0) && (
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: tc.textSecondary }}>GST (5%):</span>
                    <span className="font-semibold" style={{ color: tc.text }}>
                      ₹{((selectedBooking.cgst || 0) + (selectedBooking.sgst || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div
                  className="flex items-center justify-between text-sm pt-2 border-t"
                  style={{ borderColor: tc.border }}
                >
                  <span className="font-bold" style={{ color: tc.text }}>Total Customer Price:</span>
                  <span className="font-black" style={{ color: tc.text }}>
                    ₹{(selectedBooking.finalPrice || selectedBooking.totalWithTax || selectedBooking.price)?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: tc.textSecondary }}>Payment Mode:</span>
                  <span className="font-bold" style={{ color: tc.text }}>
                    {selectedBooking.paymentMethod} ({selectedBooking.paymentStatus || 'Pending'})
                  </span>
                </div>

                {/* Commission Box */}
                <div
                  className="mt-3 p-3 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}
                >
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Your Commission</p>
                    <p className="text-[11px] text-emerald-600">
                      {selectedBooking.agentCommissionPaid ? 'Credited to Agent Wallet' : 'Credited upon ride completion'}
                    </p>
                  </div>
                  <span className="text-lg font-black text-emerald-700">
                    ₹{(selectedBooking.agentCommission || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="p-4 border-t flex items-center justify-end gap-3 rounded-b-2xl"
              style={{ backgroundColor: tc.background, borderColor: tc.border }}
            >
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 border font-bold rounded-xl text-xs transition-all"
                style={{ backgroundColor: tc.surface, borderColor: tc.border, color: tc.text }}
              >
                Close
              </button>
              <button
                onClick={(e) => handleDownloadReceipt(selectedBooking._id, e)}
                disabled={downloadingId === selectedBooking._id}
                className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                style={{ backgroundColor: tc.primary, color: '#ffffff' }}
              >
                {downloadingId === selectedBooking._id ? (
                  <FaSpinner className="animate-spin" size={11} />
                ) : (
                  <FaDownload size={11} />
                )}
                Download Receipt PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
