import React, { useState, useEffect, useRef } from "react";
import { agentService, API_BASE_URL } from "../../api/agentApi";
import { 
  FaCar, FaCalendarAlt, FaClock, FaMapMarkerAlt, 
  FaPlus, FaMinus, FaChevronRight, FaCheckCircle,
  FaPercentage, FaWallet, FaInfoCircle, FaTrash, FaSyncAlt, FaTruck
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";

export default function CreateBulkBooking() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCars, setSelectedCars] = useState([]);
  const [formData, setFormData] = useState({
    pickup: "",
    drop: "",
    pickupCoords: { lat: 0, lng: 0 },
    dropCoords: { lat: 0, lng: 0 },
    date: "",
    time: "10:00",
    days: 1,
    distance: 0,
    notes: "",
    offeredPrice: 0,
    priceModifier: 0 
  });

  const pickupRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    fetchCategories();
    initAutocomplete();
  }, []);

  const initAutocomplete = () => {
    if (!window.google) return;
    const options = { componentRestrictions: { country: "in" }, fields: ["formatted_address", "geometry"] };

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupRef.current, options);
    const dropAutocomplete = new window.google.maps.places.Autocomplete(dropRef.current, options);

    pickupAutocomplete.addListener("place_changed", () => {
      const place = pickupAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({ 
          ...prev, 
          pickup: place.formatted_address,
          pickupCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
      }
      calculateDistance();
    });

    dropAutocomplete.addListener("place_changed", () => {
      const place = dropAutocomplete.getPlace();
      if (place.geometry) {
        setFormData(prev => ({ 
          ...prev, 
          drop: place.formatted_address,
          dropCoords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        }));
      }
      calculateDistance();
    });
  };

  const calculateDistance = () => {
    if (!window.google || !pickupRef.current.value || !dropRef.current.value) return;
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
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      toast.error("Failed to load car categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = (cat) => {
    setSelectedCars((prev) => {
      const existing = prev.find((item) => item.id === cat._id);
      if (existing) {
        return prev.map((item) =>
          item.id === cat._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: cat._id,
          name: cat.name,
          image: cat.image,
          price: cat.bulkBookingBasePrice || 1000,
          quantity: 1,
        },
      ];
    });
  };

  const handleRemoveCar = (catId) => {
    setSelectedCars((prev) => {
      const existing = prev.find((item) => item.id === catId);
      if (!existing) return prev;
      if (existing.quantity > 1) {
        return prev.map((item) =>
          item.id === catId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== catId);
    });
  };

  const calculateTotal = () => {
    const baseTotal = selectedCars.reduce(
      (acc, car) => acc + car.price * car.quantity * formData.days * (formData.distance || 0),
      0
    );
    const modified = baseTotal + baseTotal * (formData.priceModifier / 100);
    return Math.round(modified);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCars.length === 0) return toast.error("Please select at least one car");
    if (!formData.pickup || !formData.drop || !formData.date) return toast.error("Please fill all details");

    try {
      const total = calculateTotal();
      const payload = {
        pickup: { 
          address: formData.pickup, 
          latitude: formData.pickupCoords.lat, 
          longitude: formData.pickupCoords.lng 
        },
        drop: { 
          address: formData.drop, 
          latitude: formData.dropCoords.lat, 
          longitude: formData.dropCoords.lng 
        },
        pickupDateTime: `${formData.date}T${formData.time}`,
        numberOfDays: formData.days,
        totalDistance: formData.distance,
        carsRequired: selectedCars.map((c) => ({ category: c.id, quantity: c.quantity })),
        offeredPrice: total,
        notes: formData.notes,
      };

      const result = await Swal.fire({
        title: 'Launch Request?',
        text: `Creating bulk request for ₹${total.toLocaleString()}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
      });

      if (result.isConfirmed) {
        const res = await agentService.createBulkBooking(payload);
        if (res.success) {
          toast.success("Bulk Booking live on Marketplace!");
          setSelectedCars([]);
          setFormData({
            pickup: "", drop: "", date: "", time: "10:00",
            days: 1, distance: 0, notes: "", offeredPrice: 0, priceModifier: 0
          });
          pickupRef.current.value = "";
          dropRef.current.value = "";
        }
      }
    } catch (err) {
      toast.error("Process failed");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FaTruck className="text-blue-600" /> Create Bulk Request
        </h1>
        <p className="text-sm text-gray-500 mt-1">Marketplace creation for weddings, events and corporate fleet requirements.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-6">
          
          {/* Fleet Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-md font-bold mb-6 flex items-center gap-2 text-gray-700">
              <FaCar className="text-blue-500" /> Select Fleet Types
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={`${API_BASE_URL}/uploads/${cat.image}`} alt={cat.name} className="w-12 h-10 object-contain bg-white rounded-lg p-1" />
                    <div>
                      <p className="text-sm font-bold text-gray-800">{cat.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold">₹{cat.bulkBookingBasePrice || 0}/km per unit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleRemoveCar(cat._id)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                      <FaMinus size={10} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">
                      {selectedCars.find(s => s.id === cat._id)?.quantity || 0}
                    </span>
                    <button onClick={() => handleAddCar(cat)} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-all">
                      <FaPlus size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-md font-bold mb-6 flex items-center gap-2 text-gray-700">
              <FaMapMarkerAlt className="text-green-500" /> Route & Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Pickup Location</label>
                <input ref={pickupRef} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 ring-blue-500 outline-none" placeholder="Enter pickup point" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Drop Location</label>
                <input ref={dropRef} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 ring-blue-500 outline-none" placeholder="Enter destination" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Reporting Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Reporting Time</label>
                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Duration (Days)</label>
                <div className="flex items-center justify-center gap-6 bg-gray-50 rounded-xl py-3 border border-gray-100">
                  <button onClick={() => setFormData({...formData, days: Math.max(1, formData.days - 1)})} className="text-gray-400 hover:text-gray-900"><FaMinus size={12} /></button>
                  <span className="font-bold text-sm min-w-[60px]">{formData.days} Days</span>
                  <button onClick={() => setFormData({...formData, days: formData.days + 1})} className="text-gray-400 hover:text-gray-900"><FaPlus size={12} /></button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Automatic KM Tracking</label>
                <div className="relative">
                  <FaCar className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" />
                  <input type="number" readOnly value={formData.distance} className="w-full bg-blue-50/50 border border-blue-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-blue-600 outline-none" placeholder="Calculating..." />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Special Instructions</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 ring-blue-500 h-24 outline-none" placeholder="Add specific requirements for the fleet..." />
              </div>
            </div>
          </div>
        </div>

        {/* Checkout */}
        <div className="xl:col-span-4">
          <div className="sticky top-6 space-y-4">
             <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-md font-bold mb-6 flex items-center gap-2 text-gray-700">
                  <FaWallet className="text-purple-500" /> Price Configuration
                </h3>
                
                <div className="space-y-3 mb-6">
                  {selectedCars.map(car => (
                    <div key={car.id} className="flex justify-between items-center text-xs font-medium text-gray-500">
                      <span>{car.quantity}x {car.name}</span>
                      <span className="text-gray-900 font-bold">₹{(car.price * car.quantity * formData.days * (formData.distance || 0)).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-dashed border-gray-100">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Market Boost</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${formData.priceModifier >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {formData.priceModifier > 0 ? '+' : ''}{formData.priceModifier}%
                        </span>
                     </div>
                     <input type="range" min="-20" max="100" step="5" value={formData.priceModifier} onChange={e => setFormData({...formData, priceModifier: parseInt(e.target.value)})} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2" />
                     <p className="text-[10px] text-gray-400 italic">Boost price to attract fleets faster.</p>
                  </div>
                </div>

                <div className="bg-blue-600 rounded-xl p-5 mb-6 text-white text-center">
                  <p className="text-[10px] font-bold opacity-70 uppercase mb-1">Estimated Total Offer</p>
                  <h2 className="text-3xl font-black">₹{calculateTotal().toLocaleString()}</h2>
                </div>

                <button onClick={handleSubmit} disabled={selectedCars.length === 0} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-30">
                  Create Bulk Request
                  <FaChevronRight size={12} />
                </button>
             </div>
             
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4">
               <FaInfoCircle className="text-blue-400 shrink-0 mt-1" />
               <p className="text-[10px] text-blue-700 leading-relaxed font-bold">
                 Request will be visible to all verified Fleet owners in Lucknow & surrounding zones.
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
