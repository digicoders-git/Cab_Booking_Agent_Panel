import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { agentService } from "../../api/agentApi";
import { useTheme } from "../../context/ThemeContext";
import {
  FaCalendarAlt, FaTruck, FaSyncAlt, FaTrash, FaCheckCircle,
  FaMapMarkerAlt, FaPlusCircle, FaKey, FaEye, FaTimes,
  FaEdit, FaTrashAlt, FaBan, FaArrowUp, FaDownload, FaUserCircle,
  FaRoute, FaBuilding, FaPhone, FaClock, FaSpinner, FaUsers
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";
import jsPDF from "jspdf";

const STATUS_CONFIG = {
  Marketplace: { label: 'Live on Marketplace', dot: true,  pulse: true  },
  Accepted:    { label: 'Accepted by Fleet',   dot: true,  pulse: false },
  Ongoing:     { label: 'Trip Ongoing',         dot: true,  pulse: true  },
  Completed:   { label: 'Completed',            dot: false, pulse: false },
  Cancelled:   { label: 'Cancelled',            dot: false, pulse: false },
};

const STATUS_COLORS = {
  Marketplace: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  Accepted:    { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
  Ongoing:     { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  Completed:   { bg: '#F9FAFB', text: '#4B5563', border: '#E5E7EB', dot: '#9CA3AF' },
  Cancelled:   { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#EF4444' },
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true
}) : '—';

// ─── Detail Modal ─────────────────────────────────────────────────
function DetailModal({ req, onClose, tc }) {
  if (!req) return null;
  const sc = STATUS_COLORS[req.status] || STATUS_COLORS.Marketplace;
  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Marketplace;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: tc.surface, border: `1px solid ${tc.border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sticky top-0 z-10 rounded-t-2xl"
          style={{ backgroundColor: tc.surface, borderBottom: `1px solid ${tc.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
              <FaTruck size={18} style={{ color: sc.text }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tc.textSecondary }}>Bulk Booking</p>
              <h2 className="text-base font-bold" style={{ color: tc.text }}>#{req._id?.slice(-8).toUpperCase()}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ backgroundColor: req.tripType === 'RoundTrip' ? tc.primary : tc.background, color: req.tripType === 'RoundTrip' ? '#fff' : tc.textSecondary, border: `1px solid ${req.tripType === 'RoundTrip' ? tc.primary : tc.border}` }}>
              {req.tripType === 'RoundTrip' ? 'Round Trip' : 'One Way'}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
              {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? 'animate-pulse' : ''}`} style={{ backgroundColor: sc.dot }} />}
              {cfg.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-xl transition-all" style={{ color: tc.textSecondary, backgroundColor: tc.background }}>
              <FaTimes size={15} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <MSection title="Route Details" icon={<FaMapMarkerAlt style={{ color: tc.info }} size={13} />} tc={tc}>
            <MRow label="Pickup" value={req.pickup?.address} tc={tc} />
            <MRow label="Drop" value={req.drop?.address} tc={tc} />
            <MRow label="Distance" value={req.totalDistance ? `${req.totalDistance} KM` : '—'} tc={tc} />
          </MSection>

          <MSection title="Schedule" icon={<FaCalendarAlt style={{ color: '#8B5CF6' }} size={13} />} tc={tc}>
            <MRow label="Departure" value={fmt(req.pickupDateTime)} tc={tc} />
            {req.tripType === 'RoundTrip' && <MRow label="Return Date" value={fmt(req.returnDateTime)} tc={tc} />}
            <MRow label="Duration" value={req.numberOfDays ? `${req.numberOfDays} Day(s)` : '—'} tc={tc} />
            <MRow label="Created" value={fmt(req.createdAt)} tc={tc} />
          </MSection>

          <MSection title="Fleet Required" icon={<FaTruck style={{ color: '#F97316' }} size={13} />} tc={tc}>
            <div className="flex flex-wrap gap-2 mt-1">
              {req.carsRequired?.map((car, i) => (
                <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: tc.background, border: `1px solid ${tc.border}`, color: tc.text }}>
                  {car.quantity}× {car.category?.name || car.name || '—'}
                </span>
              ))}
            </div>
          </MSection>

          <MSection title="Pricing" icon={<span className="text-sm font-bold" style={{ color: '#16A34A' }}>₹</span>} tc={tc}>
            <MRow label="Offered Price" value={`₹${req.offeredPrice?.toLocaleString()}`} tc={tc} highlight />
          </MSection>

          {req.status === 'Marketplace' && (
            <MSection title="Marketplace Status" icon={<span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />} tc={tc}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <FaSpinner className="animate-spin" size={12} style={{ color: '#C2410C' }} />
                <span className="text-sm font-medium" style={{ color: '#C2410C' }}>Waiting for Fleet to Accept...</span>
              </div>
              {req.notes && <MRow label="Notes" value={req.notes} tc={tc} />}
            </MSection>
          )}

          {req.status !== 'Cancelled' && req.assignedFleet && (
            <MSection title="Assigned Fleet" icon={<FaBuilding style={{ color: '#16A34A' }} size={13} />} tc={tc}>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-green-50/50 border border-green-100">
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm flex items-center justify-center shrink-0">
                  {req.assignedFleet.image ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${req.assignedFleet.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FaBuilding size={20} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold leading-tight" style={{ color: tc.text }}>{req.assignedFleet.companyName || req.assignedFleet.name}</h4>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: tc.textSecondary }}>Owner: {req.assignedFleet.name}</p>
                </div>
                <a href={`tel:${req.assignedFleet.phone}`} className="p-2.5 rounded-xl bg-white text-green-600 border border-green-100 hover:bg-green-600 hover:text-white transition-all shadow-sm">
                  <FaPhone size={14} />
                </a>
              </div>
              <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <FaClock size={10} className="text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Accepted {fmt(req.acceptedAt)}</span>
              </div>
            </MSection>
          )}

          {/* Assigned Drivers */}
          {req.assignedDrivers && req.assignedDrivers.length > 0 && (
            <MSection title={`Assigned Drivers (${req.assignedDrivers.length})`} icon={<FaUsers style={{ color: tc.primary }} size={13} />} tc={tc}>
              <div className="grid grid-cols-1 gap-2 mt-1">
                {req.assignedDrivers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-dashed hover:border-solid transition-all" style={{ backgroundColor: tc.surface, borderColor: tc.border }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white bg-gray-50 flex items-center justify-center shrink-0">
                        {item.driver?.image ? (
                          <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${item.driver.image}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FaUserCircle size={16} className="text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h6 className="text-[13px] font-bold" style={{ color: tc.text }}>{item.driver?.name}</h6>
                        <p className="text-[10px]" style={{ color: tc.textSecondary }}>{item.driver?.phone}</p>
                      </div>
                    </div>
                    <a href={`tel:${item.driver?.phone}`} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-500 transition-all">
                      <FaPhone size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </MSection>
          )}

          {req.startOtp && (
            <MSection title="Trip OTP" icon={<FaKey style={{ color: '#16A34A' }} size={13} />} tc={tc}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#16A34A' }}>Start OTP</p>
                  <p className="text-3xl font-bold tracking-[0.4em]" style={{ color: '#15803D' }}>{req.startOtp}</p>
                </div>
              </div>
            </MSection>
          )}
        </div>
      </div>
    </div>
  );
}

function MSection({ title, icon, children, tc }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: tc.background, border: `1px solid ${tc.border}` }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tc.textSecondary }}>{title}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MRow({ label, value, tc, highlight }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm shrink-0" style={{ color: tc.textSecondary }}>{label}</span>
      <span className={`text-sm font-semibold text-right`} style={{ color: highlight ? tc.primary : tc.text }}>{value || '—'}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function MyBulkBookings() {
  const navigate = useNavigate();
  const { themeColors: tc } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedReq, setSelectedReq] = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  // 🔔 Listen for real-time socket updates
  useEffect(() => {
    const handleBulkUpdate = (event) => {
      console.log('🔄 Bulk Booking status updated, refreshing list...', event.detail);
      fetchRequests(); // Refresh the list from server
    };

    window.addEventListener('bulk_booking_update', handleBulkUpdate);
    return () => window.removeEventListener('bulk_booking_update', handleBulkUpdate);
  }, []);

  const fetchRequests = async () => {
    try {
      setRefreshing(true);
      const res = await agentService.getMyBulkBookings();
      if (res.success) setRequests(res.bookings || []);
    } catch {
      toast.error("Failed to fetch booking history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Request?',
      text: "This request will be removed from the marketplace.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
    });
    if (result.isConfirmed) {
      try {
        const res = await agentService.cancelBulkBooking(id);
        if (res.success) { toast.success("Cancelled successfully"); fetchRequests(); }
        else toast.error(res.message);
      } catch { toast.error("Process failed"); }
    }
  };

  const filteredRequests = requests.filter(req =>
    activeTab === 'active'
      ? ['Marketplace', 'Accepted', 'Ongoing'].includes(req.status)
      : ['Completed', 'Cancelled'].includes(req.status)
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: tc.background }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: tc.primary }} />
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: tc.background }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: tc.text }}>
            <FaTruck style={{ color: tc.primary }} size={20} />
            My Bulk Rides
          </h1>
          <p className="text-sm mt-0.5" style={{ color: tc.textSecondary }}>
            Manage your marketplace fleet requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/agent/create-bulk-booking')}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: tc.primary, color: '#fff' }}
          >
            <FaPlusCircle size={14} /> New Bulk Booking
          </button>
          <button
            onClick={fetchRequests}
            disabled={refreshing}
            className="p-2.5 rounded-xl border transition-all hover:opacity-80"
            style={{ backgroundColor: tc.surface, borderColor: tc.border, color: tc.textSecondary }}
          >
            <FaSyncAlt size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: tc.surface, border: `1px solid ${tc.border}` }}>
        {[
          { key: 'active',  label: 'Active Requests' },
          { key: 'history', label: 'Past History'    },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={activeTab === tab.key
              ? { backgroundColor: tc.primary, color: '#fff' }
              : { color: tc.textSecondary, backgroundColor: 'transparent' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Cards ── */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed" style={{ backgroundColor: tc.surface, borderColor: tc.border }}>
            <FaTruck size={36} className="mx-auto mb-3" style={{ color: tc.border }} />
            <p className="text-base font-semibold" style={{ color: tc.textSecondary }}>No {activeTab} bookings yet</p>
            <p className="text-sm mt-1" style={{ color: tc.textSecondary }}>
              {activeTab === 'active' ? 'Create a new bulk booking to get started' : 'Completed trips will appear here'}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const sc = STATUS_COLORS[req.status] || STATUS_COLORS.Marketplace;
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Marketplace;
            return (
              <div
                key={req._id}
                className="rounded-2xl transition-all hover:shadow-md"
                style={{ backgroundColor: tc.surface, border: `1px solid ${tc.border}` }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${tc.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
                      <FaTruck size={18} style={{ color: sc.text }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: tc.textSecondary }}>Request ID</p>
                      <p className="text-sm font-bold" style={{ color: tc.text }}>#{req._id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: tc.textSecondary }}>Offered Amount</p>
                      <p className="text-lg font-bold" style={{ color: tc.primary }}>₹{req.offeredPrice?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${req.tripType === 'RoundTrip' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {req.tripType === 'RoundTrip' ? 'Round' : 'One-Way'}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                        style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {cfg.dot && (
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? 'animate-pulse' : ''}`}
                            style={{ backgroundColor: sc.dot }} />
                        )}
                        {req.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 px-5 py-4">
                  {/* Route */}
                  <div className="space-y-3 pr-4">
                    <div className="flex gap-2.5">
                      <FaMapMarkerAlt size={12} className="mt-0.5 shrink-0" style={{ color: tc.info }} />
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: tc.textSecondary }}>Pickup</p>
                        <p className="text-sm font-medium leading-snug" style={{ color: tc.text }}>{req.pickup?.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <FaMapMarkerAlt size={12} className="mt-0.5 shrink-0" style={{ color: '#EC4899' }} />
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: tc.textSecondary }}>Drop</p>
                        <p className="text-sm font-medium leading-snug" style={{ color: tc.text }}>{req.drop?.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-3 md:px-4 md:border-l md:border-r py-3 md:py-0" style={{ borderColor: tc.border }}>
                    <div className="flex gap-2.5">
                      <FaCalendarAlt size={12} className="mt-0.5 shrink-0" style={{ color: '#8B5CF6' }} />
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: tc.textSecondary }}>Departure</p>
                        <p className="text-sm font-medium" style={{ color: tc.text }}>
                          {new Date(req.pickupDateTime).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs" style={{ color: tc.textSecondary }}>
                          {new Date(req.pickupDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <FaRoute size={12} className="mt-0.5 shrink-0" style={{ color: tc.primary }} />
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: tc.textSecondary }}>Trip Details</p>
                        <p className="text-sm font-medium" style={{ color: tc.text }}>
                          {req.numberOfDays} Day(s) {req.tripType === 'RoundTrip' ? '· Round Trip' : '· One Way'}
                        </p>
                        <p className="text-[10px] italic" style={{ color: tc.textSecondary }}>{req.totalDistance} KM Package</p>
                      </div>
                    </div>
                  </div>

                  {/* Fleet */}
                  <div className="space-y-2 pl-0 md:pl-4">
                    <p className="text-xs font-medium" style={{ color: tc.textSecondary }}>Fleet Required</p>
                    <div className="flex flex-wrap gap-1.5">
                      {req.carsRequired?.map((car, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ backgroundColor: tc.background, border: `1px solid ${tc.border}`, color: tc.text }}>
                          {car.quantity}× {car.category?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* OTP */}
                {req.startOtp && (
                  <div className="mx-5 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <FaKey size={13} style={{ color: '#16A34A' }} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#16A34A' }}>Start OTP</p>
                      <p className="text-2xl font-bold tracking-[0.4em]" style={{ color: '#15803D' }}>{req.startOtp}</p>
                    </div>
                  </div>
                )}

                {/* Assigned Fleet & Drivers - CARD QUICK VIEW */}
                {req.assignedFleet && (
                  <div className="mx-5 mb-4 p-4 rounded-xl space-y-3" style={{ backgroundColor: tc.background, border: `1px solid ${tc.border}` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center shrink-0" style={{ borderColor: tc.border }}>
                          {req.assignedFleet.image ? (
                            <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${req.assignedFleet.image}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FaBuilding size={16} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: tc.primary }}>Fleet Owner</p>
                          <h5 className="text-xs font-bold leading-tight mt-0.5" style={{ color: tc.text }}>{req.assignedFleet.companyName || req.assignedFleet.name}</h5>
                        </div>
                      </div>
                      {req.assignedFleet.phone && (
                        <a href={`tel:${req.assignedFleet.phone}`} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 shadow-sm" style={{ backgroundColor: tc.primary, color: '#fff' }}>
                          <FaPhone size={10} />
                        </a>
                       )}
                    </div>

                    {/* Assigned Drivers Mini-List */}
                    {req.assignedDrivers && req.assignedDrivers.length > 0 && (
                      <div className="pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: tc.border }}>
                        {req.assignedDrivers.map((item, dIdx) => (
                          <div key={dIdx} className="flex items-center gap-2 px-2 py-1 rounded-full border bg-white/50" style={{ borderColor: tc.border }}>
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                              {item.driver?.image ? (
                                <img src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/uploads/${item.driver.image}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FaUserCircle size={10} className="text-gray-300" />
                              )}
                            </div>
                            <span className="text-[9px] font-bold" style={{ color: tc.text }}>{item.driver?.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex items-center justify-between px-5 py-3 rounded-b-2xl"
                  style={{ borderTop: `1px solid ${tc.border}`, backgroundColor: tc.background }}>
                  <div>
                    {req.status === 'Marketplace' && (
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#C2410C' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Waiting for Fleet...
                      </div>
                    )}
                    {req.status === 'Ongoing' && (
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#1D4ED8' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Trip in Progress
                      </div>
                    )}
                    {req.status === 'Completed' && (
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#4B5563' }}>
                        <FaCheckCircle size={13} />
                        Trip Completed
                      </div>
                    )}
                    {req.status === 'Cancelled' && (
                      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#DC2626' }}>
                        <FaBan size={13} />
                        Cancelled
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateReceipt(req)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all hover:opacity-80"
                      style={{ backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
                    >
                      <FaDownload size={11} /> Receipt
                    </button>
                    {(req.status === 'Marketplace' || req.status === 'Accepted') && (
                      <button
                        onClick={() => handleCancel(req._id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all hover:opacity-80"
                        style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                      >
                        <FaTrash size={11} /> Cancel
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedReq(req)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all hover:opacity-90 shadow-sm"
                      style={{ backgroundColor: tc.primary, color: '#fff' }}
                    >
                      <FaEye size={11} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
  {selectedReq && <DetailModal req={selectedReq} onClose={() => setSelectedReq(null)} tc={tc} />}
    </div>
  );
}

const generateReceipt = (booking) => {
  const doc = new jsPDF();
  const logoUrl = "/logo.png";
  
  doc.setDrawColor(0); doc.setLineWidth(0.5); doc.rect(5, 5, 200, 287); 
  const img = new Image(); img.src = logoUrl;
  doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.addImage(img, 'PNG', 45, 110, 120, 120); doc.restoreGraphicsState();
  
  doc.line(5, 15, 205, 15); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("PAN: GWKPS6928H", 10, 11); doc.text("TAX INVOICE", 175, 11);
  const topLogo = new Image(); topLogo.src = logoUrl; doc.addImage(topLogo, 'PNG', 92, 18, 25, 25); 
  doc.setFontSize(28); doc.setTextColor(0, 0, 0); doc.text("KWIK CABS", 105, 52, { align: "center" });
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text("Arun Bhawan Kalu Kuwan Baberu Road, Banda UP", 105, 59, { align: "center" });
  doc.text("MOB : +91 7310221010", 105, 64, { align: "center" });
  
  doc.line(5, 72, 205, 72); doc.line(125, 72, 125, 125); 
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("DETAIL OF RECEIVER / CONSIGNEE", 15, 80); doc.setLineWidth(0.2); doc.line(15, 81, 75, 81); 
  doc.setFontSize(9); doc.text("Name :", 10, 89); doc.setFont("helvetica", "normal");
  
  let userData = {};
  try { userData = JSON.parse(localStorage.getItem('admin-data') || localStorage.getItem('user') || '{}'); } catch (e) {}

  const userName = booking.customerName || booking.createdBy?.name || userData.name || 'Valued Customer';
  const userPhone = booking.customerPhone || booking.createdBy?.phone || userData.phone || 'N/A';
  const userEmail = booking.createdBy?.email || userData.email || 'N/A';
  doc.text(`${userName}`, 25, 89);
  doc.setFont("helvetica", "bold"); doc.text("Phone :", 10, 97); doc.setFont("helvetica", "normal"); doc.text(`${userPhone}`, 25, 97);
  doc.setFont("helvetica", "bold"); doc.text("Email :", 10, 105); doc.setFont("helvetica", "normal"); doc.text(`${userEmail}`, 25, 105);
  doc.setFont("helvetica", "bold"); doc.text("Pickup :", 10, 113); doc.setFont("helvetica", "normal");
  const pickupAddr = booking.pickup?.address || 'N/A';
  doc.text(`${pickupAddr.slice(0, 55)}${pickupAddr.length > 55 ? '...' : ''}`, 25, 113);
  doc.setFont("helvetica", "bold"); doc.text("Drop :", 10, 121); doc.setFont("helvetica", "normal");
  const dropAddr = booking.drop?.address || 'N/A';
  doc.text(`${dropAddr.slice(0, 55)}${dropAddr.length > 55 ? '...' : ''}`, 25, 121);
  
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No. : PT/${booking._id?.toString().slice(-3).toUpperCase() || 'NEW'}`, 130, 80);
  doc.text(`Invoice Date : ${new Date().toLocaleDateString('en-GB')}`, 130, 88);
  doc.text(`Pickup Date : ${new Date(booking.pickupDateTime).toLocaleDateString('en-GB')}`, 130, 96);
  if (booking.tripType === 'RoundTrip' && booking.returnDateTime) {
      doc.text(`Return Date : ${new Date(booking.returnDateTime).toLocaleDateString('en-GB')}`, 130, 104);
  } else { doc.text(`Duration : ${booking.numberOfDays} Day(s)`, 130, 104); }
  doc.text(`Trip Mode : ${booking.tripType}`, 130, 112);
  
  const tableTop = 125; doc.line(5, tableTop, 205, tableTop); doc.line(5, tableTop + 10, 205, tableTop + 10);
  doc.setFont("helvetica", "bold"); doc.text("S. NO.", 8, tableTop + 7); doc.text("Description", 70, tableTop + 7, { align: "center" });
  doc.text("Unit", 130, tableTop + 7); doc.text("Qty.", 150, tableTop + 7); doc.text("Rate", 170, tableTop + 7); doc.text("Total", 190, tableTop + 7);
  const tableBottom = 230; doc.line(18, tableTop, 18, tableBottom); doc.line(125, tableTop, 125, tableBottom);
  doc.line(145, tableTop, 145, tableBottom); doc.line(165, tableTop, 165, tableBottom); doc.line(185, tableTop, 185, tableBottom);
  
  let currentY = tableTop + 17;
  const cars = booking.carsRequired || [];
  
  // 🛡️ Calculate Proportional Prices
  // We use base rates to distribute the total offeredPrice fairly among different car types
  const totalWeight = cars.reduce((acc, car) => {
      const baseRate = car.category?.bulkBookingBasePrice || car.price || 1000;
      return acc + (baseRate * car.quantity);
  }, 0);

  cars.forEach((item, index) => {
     doc.setFont("helvetica", "normal"); doc.text(`${index + 1}`, 11, currentY);
     
     const catName = item.category?.name || item.name || 'Vehicle';
     doc.text(`Bulk Booking - ${catName} (${booking.tripType})`, 25, currentY);
     
     doc.text("NOS", 129, currentY); doc.text(`${item.quantity}`, 152, currentY);
     
     // Calculate this category's share of the total price
     const baseRate = item.category?.bulkBookingBasePrice || item.price || 1000;
     const shareWeight = (baseRate * item.quantity);
     const totalForCategory = totalWeight > 0 ? Math.round((shareWeight / totalWeight) * booking.offeredPrice) : 0;
     const rate = item.quantity > 0 ? Math.round(totalForCategory / item.quantity) : 0;
     
     doc.text(`${rate.toLocaleString()}`, 168, currentY); 
     doc.setFont("helvetica", "bold"); 
     doc.text(`${totalForCategory.toLocaleString()}`, 188, currentY);
     
     doc.line(5, currentY + 3, 205, currentY + 3); currentY += 10;
  });
  for(let i = currentY; i < tableBottom; i += 10) { doc.line(5, i, 205, i); }
  doc.line(5, tableBottom, 205, tableBottom);
  doc.setFont("helvetica", "bold"); 
  const advAmt = booking.advancePayment?.amount || Math.round(booking.offeredPrice * 0.25);
  const advPercent = Math.round((advAmt / booking.offeredPrice) * 100);
  const remBal = booking.offeredPrice - advAmt;

  doc.text("TOTAL PRICE", 130, tableBottom + 7); doc.text(`${booking.offeredPrice.toLocaleString()}`, 185, tableBottom + 7);
  doc.line(80, tableBottom + 10, 205, tableBottom + 10);
  doc.text(`ADVANCE PAID (${advPercent}%)`, 130, tableBottom + 17); doc.text(`${advAmt.toLocaleString()}`, 185, tableBottom + 17);
  doc.line(80, tableBottom + 20, 205, tableBottom + 20);
  doc.setFillColor(230, 230, 230); doc.rect(80, tableBottom + 20, 125, 10, 'F');
  doc.text("REMAINING BALANCE", 130, tableBottom + 27); doc.text(`INR ${remBal.toLocaleString()}`, 185, tableBottom + 27);
  doc.line(80, tableBottom + 30, 205, tableBottom + 30);
  doc.setFontSize(8); doc.text(`Total Amount (in words) : RUPEES ${booking.offeredPrice.toLocaleString()} ONLY`, 10, tableBottom + 35);
  doc.text(`Note: Balance of INR ${remBal.toLocaleString()} to be paid directly to the fleet owner.`, 10, tableBottom + 40);
  doc.setFont("helvetica", "bold"); doc.text("For KWIK CABS", 150, tableBottom + 50);
  doc.line(140, tableBottom + 75, 200, tableBottom + 75); doc.text("Authorized Signatory", 155, tableBottom + 82);
  doc.save(`KwikCabs_Receipt_${booking._id?.toString().slice(-6) || 'Agent'}.pdf`);
};
