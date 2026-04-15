import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { agentService } from "../../api/agentApi";
import { useTheme } from "../../context/ThemeContext";
import {
  FaCalendarAlt, FaTruck, FaSyncAlt, FaTrash, FaCheckCircle,
  FaMapMarkerAlt, FaPlusCircle, FaKey, FaEye, FaTimes,
  FaPhone, FaBuilding, FaClock, FaBan, FaSpinner, FaRoute
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";

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

          {req.status === 'Accepted' && req.assignedFleet && (
            <MSection title="Assigned Fleet" icon={<FaBuilding style={{ color: '#16A34A' }} size={13} />} tc={tc}>
              <MRow label="Company" value={req.assignedFleet?.companyName} tc={tc} />
              <MRow label="Phone" value={req.assignedFleet?.phone} tc={tc} />
              <MRow label="Accepted At" value={fmt(req.acceptedAt)} tc={tc} />
              {req.message && <MRow label="Message" value={req.message} tc={tc} />}
            </MSection>
          )}

          {req.status === 'Ongoing' && (
            <MSection title="Trip Info" icon={<FaTruck style={{ color: tc.info }} size={13} />} tc={tc}>
              <MRow label="Started At" value={fmt(req.startedAt)} tc={tc} />
              {req.assignedFleet && <MRow label="Fleet" value={req.assignedFleet?.companyName} tc={tc} />}
            </MSection>
          )}

          {req.status === 'Completed' && (
            <MSection title="Trip Completed" icon={<FaCheckCircle style={{ color: '#16A34A' }} size={13} />} tc={tc}>
              <MRow label="Ended At" value={fmt(req.endedAt)} tc={tc} />
              {req.assignedFleet && <MRow label="Fleet" value={req.assignedFleet?.companyName} tc={tc} />}
            </MSection>
          )}

          {req.status === 'Cancelled' && (
            <MSection title="Cancellation" icon={<FaBan style={{ color: '#DC2626' }} size={13} />} tc={tc}>
              <MRow label="Cancelled At" value={fmt(req.cancelledAt)} tc={tc} />
              {req.cancelReason && <MRow label="Reason" value={req.cancelReason} tc={tc} />}
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
                        <p className="text-sm font-medium" style={{ color: tc.text }}>{req.numberOfDays} Day(s) · {req.totalDistance} KM</p>
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

                {/* Assigned Fleet */}
                {req.status === 'Accepted' && req.assignedFleet && (
                  <div className="mx-5 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <FaBuilding size={13} style={{ color: '#16A34A' }} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#16A34A' }}>Assigned Fleet</p>
                      <p className="text-sm font-bold" style={{ color: '#15803D' }}>{req.assignedFleet?.companyName}</p>
                    </div>
                    {req.assignedFleet?.phone && (
                      <a href={`tel:${req.assignedFleet.phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: '#16A34A' }}>
                        <FaPhone size={10} /> {req.assignedFleet.phone}
                      </a>
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
