import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { agentService, API_BASE_URL } from "../../api/agentApi";
import {
  FaCar, FaMapMarkerAlt, FaPlus, FaMinus, FaChevronRight,
  FaCheckCircle, FaWallet, FaInfoCircle, FaTruck, FaArrowLeft
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";

// --- Helper: Load Razorpay Script ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CreateBulkBooking() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCars, setSelectedCars] = useState([]);
  const [formData, setFormData] = useState({
    date: "", time: "10:00",
    tripType: "OneWay",
    returnDate: "",
    days: 1, distance: 0,
    notes: "", priceModifier: 0
  });

  const pickupRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    fetchCategories();
    const timer = setTimeout(initAutocomplete, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🕒 Auto-calculate days for RoundTrip
  useEffect(() => {
    if (formData.tripType === 'RoundTrip' && formData.date && formData.returnDate) {
        const start = new Date(formData.date);
        const end = new Date(formData.returnDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
        setFormData(prev => ({ ...prev, days: diffDays }));
    }
  }, [formData.date, formData.returnDate, formData.tripType]);

  const initAutocomplete = () => {
    if (!window.google || !pickupRef.current || !dropRef.current) return;
    const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry"] };

    const pickupAC = new window.google.maps.places.Autocomplete(pickupRef.current, options);
    const dropAC = new window.google.maps.places.Autocomplete(dropRef.current, options);

    pickupAC.addListener("place_changed", () => {
      const place = pickupAC.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          pickup: place.formatted_address,
          pickupCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
        setTimeout(calculateDistance, 300);
      }
    });

    dropAC.addListener("place_changed", () => {
      const place = dropAC.getPlace();
      if (place.geometry) {
        setFormData(prev => ({
          ...prev,
          drop: place.formatted_address,
          dropCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
        setTimeout(calculateDistance, 300);
      }
    });
  };

  const calculateDistance = () => {
    if (!window.google || !pickupRef.current?.value || !dropRef.current?.value) return;
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      { origins: [pickupRef.current.value], destinations: [dropRef.current.value], travelMode: "DRIVING" },
      (response, status) => {
        if (status === "OK" && response.rows[0].elements[0].status === "OK") {
          const distKm = response.rows[0].elements[0].distance.value / 1000;
          setFormData(prev => ({ ...prev, distance: Math.round(distKm) }));
        }
      }
    );
  };

  const fetchCategories = async () => {
    try {
      const res = await agentService.getAllCarCategories();
      if (res.success) setCategories(res.categories || []);
    } catch {
      toast.error("Failed to load car categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = (cat) => {
    setSelectedCars(prev => {
      const existing = prev.find(item => item.id === cat._id);
      if (existing) return prev.map(item => item.id === cat._id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { id: cat._id, name: cat.name, image: cat.image, price: cat.bulkBookingBasePrice || 1000, quantity: 1 }];
    });
  };

  const handleRemoveCar = (catId) => {
    setSelectedCars(prev => {
      const existing = prev.find(item => item.id === catId);
      if (!existing) return prev;
      if (existing.quantity > 1) return prev.map(item => item.id === catId ? { ...item, quantity: item.quantity - 1 } : item);
      return prev.filter(item => item.id !== catId);
    });
  };

  const calculateTotal = () => {
    const distanceMultiplier = formData.tripType === 'RoundTrip' ? 2 : 1;
    const base = selectedCars.reduce((acc, car) => acc + car.price * car.quantity * formData.days * ((formData.distance || 0) * distanceMultiplier), 0);
    return Math.round(base + base * (formData.priceModifier / 100));
  };

  const handleSubmit = async () => {
    if (selectedCars.length === 0) return toast.error("Please select at least one vehicle");
    if (!formData.pickup || !formData.drop || !formData.date) return toast.error("Please fill all required fields");

    const total = calculateTotal();
    const result = await Swal.fire({
      title: 'Submit Bulk Request?',
      text: `Total offered amount: ₹${total.toLocaleString()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      confirmButtonText: 'Yes, Submit'
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const res = await agentService.createBulkBooking({
        pickup: { address: formData.pickup, latitude: formData.pickupCoords.lat, longitude: formData.pickupCoords.lng },
        drop: { address: formData.drop, latitude: formData.dropCoords.lat, longitude: formData.dropCoords.lng },
        pickupDateTime: `${formData.date}T${formData.time}`,
        tripType: formData.tripType,
        returnDateTime: formData.tripType === 'RoundTrip' ? `${formData.returnDate}T${formData.time}` : null,
        numberOfDays: formData.days,
        totalDistance: formData.distance,
        carsRequired: selectedCars.map(c => ({ category: c.id, quantity: c.quantity })),
        offeredPrice: total,
        notes: formData.notes,
      });

      if (res.success) {
        const { bookingId, advanceAmount } = res;
        
        // 💳 START RAZORPAY PAYMENT
        const resScript = await loadRazorpay();
        if (!resScript) {
          toast.error("Razorpay SDK failed to load");
          setSubmitting(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: advanceAmount * 100, // in paise
          currency: "INR",
          name: "Agent Bulk Advance",
          description: "25% Advance for Bulk Booking",
          handler: async (response) => {
            try {
              setSubmitting(true);
              const verifyRes = await agentService.verifyBulkPayment({
                bookingId,
                paymentId: response.razorpay_payment_id,
                type: 'advance'
              });
              if (verifyRes.success) {
                toast.success("Advance Paid! Request Live on Marketplace.");
                navigate("/agent/my-bulk-bookings");
              }
            } catch (err) {
              toast.error("Payment verification failed.");
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: "Agent",
          },
          theme: { color: "#2563EB" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-600 rounded-full" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Bulk Booking</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Fleet request for events, weddings & corporate trips</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/agent/my-bulk-bookings")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            <FaArrowLeft size={12} /> Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT: Main Form */}
        <div className="xl:col-span-8 space-y-5">

          {/* Fleet Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaCar className="text-blue-600" /> Select Fleet
              </h2>
              {selectedCars.length > 0 && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {selectedCars.reduce((a, c) => a + c.quantity, 0)} selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => {
                const sel = selectedCars.find(s => s.id === cat._id);
                return (
                  <div
                    key={cat._id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      sel ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center p-1.5 relative">
                        <img
                          src={`${API_BASE_URL}/uploads/${cat.image}`}
                          alt={cat.name}
                          className="w-full h-full object-contain"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {sel && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-white text-[8px]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">₹{cat.bulkBookingBasePrice || 0}/km</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveCar(cat._id)}
                        className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-all"
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="text-sm font-bold text-gray-800 w-5 text-center">
                        {sel?.quantity || 0}
                      </span>
                      <button
                        onClick={() => handleAddCar(cat)}
                        className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-all"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route & Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <FaMapMarkerAlt className="text-green-600" /> Route & Schedule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Pickup Location *</label>
                <input
                  ref={pickupRef}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter pickup address"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Drop Location *</label>
                <input
                  ref={dropRef}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter drop address"
                />
              </div>

              <div className="sm:col-span-2 space-y-2 mb-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trip Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tripType: "OneWay", days: 1 })}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${formData.tripType === 'OneWay' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
                  >
                    One Way Ride
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tripType: "RoundTrip" })}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${formData.tripType === 'RoundTrip' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
                  >
                    Round Trip (Return)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reporting Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                      const selected = e.target.value;
                      setFormData({ 
                        ...formData, 
                        date: selected,
                        returnDate: formData.returnDate < selected ? selected : formData.returnDate
                      });
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                {formData.tripType === 'RoundTrip' ? (
                  <>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 text-pink-600 font-bold">Return Date *</label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      min={formData.date || new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                      className="w-full bg-pink-50 border border-pink-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all font-bold"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Trip Duration (Days)</label>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2">
                      <button onClick={() => setFormData({ ...formData, days: Math.max(1, formData.days - 1) })} className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all"><FaMinus size={10} /></button>
                      <span className="flex-1 text-center text-sm font-semibold text-gray-800">{formData.days} Day(s)</span>
                      <button onClick={() => setFormData({ ...formData, days: formData.days + 1 })} className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-all"><FaPlus size={10} /></button>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Distance (Auto-calculated)</label>
                <div className="relative">
                  <input
                    type="number"
                    readOnly
                    value={formData.distance}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 pr-12 text-sm font-semibold text-blue-600 outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">km</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Special Instructions (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="AC required, luggage space, driver preferences..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Price Summary */}
        <div className="xl:col-span-4">
          <div className="sticky top-6 space-y-4">

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <FaWallet className="text-purple-600" /> Price Summary
              </h2>

              {/* Selected vehicles list */}
              <div className="space-y-2 mb-4">
                {selectedCars.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <FaCar className="text-gray-300 text-2xl mx-auto mb-1.5" />
                    <p className="text-xs text-gray-400">No vehicles selected</p>
                  </div>
                ) : (
                  selectedCars.map(car => (
                    <div key={car.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{car.quantity}× {car.name}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        ₹{(car.price * car.quantity * formData.days * (formData.distance || 0)).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Market Boost Slider */}
              <div className="mb-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Market Boost</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    formData.priceModifier >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {formData.priceModifier > 0 ? '+' : ''}{formData.priceModifier}%
                  </span>
                </div>
                <input
                  type="range" min="-20" max="100" step="5"
                  value={formData.priceModifier}
                  onChange={e => setFormData({ ...formData, priceModifier: parseInt(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200"
                />
                <p className="text-xs text-gray-400 mt-1.5">Adjust to attract fleet owners faster</p>
              </div>

              {/* Total */}
              <div className="bg-blue-600 rounded-xl p-4 text-white text-center mb-4">
                <p className="text-xs font-medium opacity-80 mb-1">Total Offered Amount</p>
                <p className="text-3xl font-bold">₹{calculateTotal().toLocaleString()}</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={selectedCars.length === 0 || submitting}
                className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                {submitting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <><FaTruck size={14} /> Submit to Marketplace <FaChevronRight size={11} /></>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" size={14} />
              <p className="text-xs text-blue-700 leading-relaxed">
                Your request will be visible to all verified fleet owners. Expect responses within 24 hours.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
