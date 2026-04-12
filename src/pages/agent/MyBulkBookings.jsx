import React, { useState, useEffect } from "react";
import { agentService } from "../../api/agentApi";
import { 
  FaCalendarAlt, FaTruck, FaSyncAlt, FaTrash, FaCheckCircle, FaChevronRight, FaMapMarkerAlt
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";

export default function MyBulkBookings() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active | history

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setRefreshing(true);
      const res = await agentService.getMyBulkBookings();
      if (res.success) {
        setRequests(res.bookings || []);
      }
    } catch (err) {
      console.error("Fetch requests failed");
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
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        const res = await agentService.cancelBulkBooking(id);
        if (res.success) {
          toast.success("Cancelled successfully");
          fetchRequests();
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error("Process failed");
      }
    }
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'active') {
      return ['Marketplace', 'Accepted', 'Ongoing'].includes(req.status);
    }
    return ['Completed', 'Cancelled'].includes(req.status);
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FaTruck className="text-blue-600" /> My Bulk Rides
          </h1>
          <p className="text-sm text-gray-500 mt-1">Status and management of your marketplace requests.</p>
        </div>
        <button 
          onClick={fetchRequests} 
          disabled={refreshing}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-400"
        >
          <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
            activeTab === 'active' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Requests
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
            activeTab === 'history' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Past History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <FaTruck size={40} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">No {activeTab} bookings yet</h3>
            <p className="text-sm text-gray-300">You haven't {activeTab === 'active' ? 'created any marketplace requests' : 'had any completed rides'} yet.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    req.status === 'Accepted' ? 'bg-green-100 text-green-600' : 
                    req.status === 'Marketplace' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    <FaTruck size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request ID</span>
                    <h4 className="text-sm font-bold text-gray-900 tracking-tight uppercase">#{req._id.slice(-8)}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Offered Amount</p>
                    <p className="text-xl font-black text-blue-600">₹{req.offeredPrice.toLocaleString()}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center min-w-[100px] ${
                    req.status === 'Accepted' ? 'bg-green-100 text-green-600' : 
                    req.status === 'Marketplace' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {req.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-gray-50 mb-6">
                 <div className="space-y-4">
                    <div className="flex gap-3">
                        <FaMapMarkerAlt className="text-blue-500 mt-1" size={12} />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">Pickup Address</p>
                            <p className="text-xs font-bold text-gray-700 leading-snug">{req.pickup.address}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <FaMapMarkerAlt className="text-pink-500 mt-1" size={12} />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">Drop Destination</p>
                            <p className="text-xs font-bold text-gray-700 leading-snug">{req.drop.address}</p>
                        </div>
                    </div>
                 </div>

                 <div className="flex flex-col justify-center gap-4 border-l border-gray-50 pl-8">
                    <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-blue-400" size={12} />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Departure</p>
                            <p className="text-xs font-bold text-gray-700">{new Date(req.pickupDateTime).toLocaleDateString()} | {new Date(req.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-purple-400" size={12} />
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Duration</p>
                            <p className="text-xs font-bold text-gray-700">{req.numberOfDays} Days Trip</p>
                        </div>
                    </div>
                 </div>

                 <div className="border-l border-gray-50 pl-8 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Fleet Requirement</p>
                    <div className="flex flex-wrap gap-2">
                        {req.carsRequired.map((car, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600">
                                {car.quantity}x {car.category?.name}
                            </span>
                        ))}
                    </div>
                    <p className="text-[10px] text-blue-500 font-bold mt-2 uppercase tracking-tighter">{req.totalDistance} KM Combined Distance</p>
                 </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   {req.status === 'Accepted' && (
                     <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                        <FaCheckCircle size={14} />
                        <span className="text-[10px] font-bold uppercase">Assigned Successfully</span>
                     </div>
                   )}
                   {req.status === 'Marketplace' && (
                     <div className="text-[10px] font-bold text-orange-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                        Live on Marketplace
                     </div>
                   )}
                </div>
                
                <div className="flex items-center gap-3">
                  {req.status === 'Marketplace' && (
                    <button 
                      onClick={() => handleCancel(req._id)}
                      className="px-6 py-2 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                      <FaTrash size={10} /> Cancel
                    </button>
                  )}
                  {req.status === 'Accepted' && (
                    <button className="px-6 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 uppercase tracking-widest">
                       Details <FaChevronRight size={10} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
