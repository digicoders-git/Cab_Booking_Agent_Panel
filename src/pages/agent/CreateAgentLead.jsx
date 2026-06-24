import React, { useState, useEffect } from "react";
import { createAgentLead } from "../../apis/agentLead";
import { agentService } from "../../api/agentApi";
import { useNavigate } from "react-router-dom";
import GOOGLE_MAPS_API from "../../utils/locationUtils";
import Swal from "sweetalert2";
import { FaMapMarkerAlt, FaRupeeSign, FaPercentage, FaCheckCircle, FaUser, FaPhone, FaCalendarAlt, FaTimes, FaCar } from "react-icons/fa";

export default function CreateAgentLead() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    pickupDateTime: "",
    carCategoryId: "",
    pickupAddress: "",
    pickupLat: null,
    pickupLng: null,
    dropAddress: "",
    dropLat: null,
    dropLng: null,
    totalPrice: "",
    agentCommission: ""
  });
  
  const [carCategories, setCarCategories] = useState([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCarCategories();
    const checkMapsLoaded = async () => {
      const loaded = await GOOGLE_MAPS_API.waitForLoad();
      setMapsLoaded(loaded);
    };
    checkMapsLoaded();
  }, []);

  const fetchCarCategories = async () => {
    try {
      const res = await agentService.getAllCarCategories();
      if (res.success) {
        setCarCategories(res.categories || []);
      }
    } catch (error) {
      console.error("Failed to load car categories", error);
    }
  };

  useEffect(() => {
    if (!mapsLoaded || formData.pickupAddress.length < 2 || !showPickupSuggestions) return;
    const timer = setTimeout(async () => {
      const results = await GOOGLE_MAPS_API.getSuggestions(formData.pickupAddress);
      setPickupSuggestions(results);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.pickupAddress, mapsLoaded, showPickupSuggestions]);

  useEffect(() => {
    if (!mapsLoaded || formData.dropAddress.length < 2 || !showDropSuggestions) return;
    const timer = setTimeout(async () => {
      const results = await GOOGLE_MAPS_API.getSuggestions(formData.dropAddress);
      setDropSuggestions(results);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.dropAddress, mapsLoaded, showDropSuggestions]);

  const selectPickup = (place) => {
    setFormData({ ...formData, pickupAddress: place.description });
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
    
    GOOGLE_MAPS_API.geocode(place.description).then(result => {
        if (result.success) {
            setFormData(prev => ({ ...prev, pickupLat: result.lat, pickupLng: result.lng }));
        }
    });
  };

  const selectDrop = (place) => {
    setFormData({ ...formData, dropAddress: place.description });
    setDropSuggestions([]);
    setShowDropSuggestions(false);
    
    GOOGLE_MAPS_API.geocode(place.description).then(result => {
        if (result.success) {
            setFormData(prev => ({ ...prev, dropLat: result.lat, dropLng: result.lng }));
        }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.pickupDateTime || !formData.carCategoryId || !formData.pickupAddress || !formData.dropAddress || !formData.totalPrice || !formData.agentCommission) {
      return Swal.fire("Error", "All fields are required", "error");
    }

    if (!formData.pickupLat || !formData.dropLat) {
      return Swal.fire("Error", "Please select valid locations from the map suggestions", "error");
    }

    if (Number(formData.agentCommission) >= Number(formData.totalPrice)) {
      return Swal.fire("Error", "Commission must be less than Total Price", "error");
    }

    try {
      setLoading(true);
      const res = await createAgentLead({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        pickupDateTime: formData.pickupDateTime,
        carCategoryId: formData.carCategoryId,
        pickupAddress: formData.pickupAddress,
        pickupLat: formData.pickupLat,
        pickupLng: formData.pickupLng,
        dropAddress: formData.dropAddress,
        dropLat: formData.dropLat,
        dropLng: formData.dropLng,
        totalPrice: Number(formData.totalPrice),
        agentCommission: Number(formData.agentCommission)
      });

      if (res.success) {
        await Swal.fire("Success", "Lead created successfully and pushed to Marketplace!", "success");
        setFormData({ 
          customerName: "", customerPhone: "", pickupDateTime: "", carCategoryId: "",
          pickupAddress: "", pickupLat: null, pickupLng: null, 
          dropAddress: "", dropLat: null, dropLng: null, 
          totalPrice: "", agentCommission: "" 
        });
        navigate("/agent/my-leads");
      } else {
        Swal.fire("Error", res.message || "Failed to create lead", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-8 mt-12">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaCheckCircle /> Create Marketplace Lead
          </h2>
          <p className="text-blue-100 text-sm mt-1">Post a lead for drivers and set your own commission.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="10 digit number"
                  maxLength="10"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.pickupDateTime}
                  onChange={(e) => setFormData({ ...formData, pickupDateTime: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Car Category</label>
              <div className="relative">
                <FaCar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.carCategoryId}
                  onChange={(e) => setFormData({ ...formData, carCategoryId: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">-- Select Car Category --</option>
                  {carCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} ({cat.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Address {!mapsLoaded && <span className="text-orange-500 text-xs">(Loading maps...)</span>}
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                <input
                  type="text"
                  value={formData.pickupAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, pickupAddress: e.target.value });
                    setShowPickupSuggestions(true);
                  }}
                  onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                  placeholder="Enter pickup location"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.pickupAddress && (
                  <button type="button" onClick={() => setFormData({...formData, pickupAddress: '', pickupLat: null, pickupLng: null})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaTimes />
                  </button>
                )}
              </div>
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {pickupSuggestions.map((place, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b" onMouseDown={(e) => e.preventDefault()} onClick={() => selectPickup(place)}>
                      <p className="text-sm text-gray-900">{place.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Drop Address</label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                <input
                  type="text"
                  value={formData.dropAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, dropAddress: e.target.value });
                    setShowDropSuggestions(true);
                  }}
                  onFocus={() => dropSuggestions.length > 0 && setShowDropSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                  placeholder="Enter drop location"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.dropAddress && (
                  <button type="button" onClick={() => setFormData({...formData, dropAddress: '', dropLat: null, dropLng: null})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaTimes />
                  </button>
                )}
              </div>
              {showDropSuggestions && dropSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {dropSuggestions.map((place, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b" onMouseDown={(e) => e.preventDefault()} onClick={() => selectDrop(place)}>
                      <p className="text-sm text-gray-900">{place.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (to Customer)</label>
                <div className="relative">
                  <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                    placeholder="e.g. 1000"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Commission</label>
                <div className="relative">
                  <FaPercentage className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    type="number"
                    value={formData.agentCommission}
                    onChange={(e) => setFormData({ ...formData, agentCommission: e.target.value })}
                    placeholder="e.g. 200"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {formData.totalPrice && formData.agentCommission && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Driver Earning:</strong> ₹{Number(formData.totalPrice) - Number(formData.agentCommission)}
                </p>
                <p className="text-xs text-blue-600 mt-1">This is the amount the driver will see and keep after paying your commission via wallet deduction.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Publish Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
