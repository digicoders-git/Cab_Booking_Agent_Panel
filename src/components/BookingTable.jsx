// src/components/BookingTable.jsx
import { useState, useMemo } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaTimes, FaSync } from 'react-icons/fa';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Phone } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const cfg = {
    completed: 'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    ongoing:   'bg-blue-100 text-blue-700',
    expired:   'bg-gray-100 text-gray-600',
  }[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  return <span className={`px-2 py-1 ${cfg} rounded-full text-xs font-medium`}>{status || '—'}</span>;
};

const BookingRow = ({ booking }) => {
  const [expanded, setExpanded] = useState(false);

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
          <p className="text-xs text-gray-700 max-w-[150px] truncate" title={booking.pickup?.address}>
            {booking.pickup?.address || '—'}
          </p>
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-700 max-w-[150px] truncate" title={booking.drop?.address}>
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
        <td className="px-4 py-3"><StatusBadge status={booking.bookingStatus} /></td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-600">{new Date(booking.createdAt).toLocaleDateString('en-IN')}</p>
          <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </td>
        <td className="px-4 py-3 text-gray-400">
          {expanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-blue-50/40">
          <td colSpan={11} className="px-6 py-4">
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
                <p className="font-semibold text-gray-800">{booking.assignedDriver || 'Not Assigned'}</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-gray-400 uppercase mb-1">Assigned Car</p>
                <p className="font-semibold text-gray-800">{booking.assignedCar || 'Not Assigned'}</p>
              </div>
              {booking.selectedSeats?.length > 0 && (
                <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                  <p className="text-gray-400 uppercase mb-1">Selected Seats</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {booking.selectedSeats.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{s}</span>
                    ))}
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
export default function BookingTable({ bookings = [], loading = false, limit, showSearch = true }) {
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
                <th className="px-4 py-3"></th>
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
                displayed.map(b => <BookingRow key={b._id} booking={b} />)
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
