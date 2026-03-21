// src/pages/agent/CreateBooking.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
    FaArrowLeft, FaUser, FaPhone, FaCar, FaSearch,
    FaSpinner, FaCheckCircle, FaExclamationTriangle, FaUsers,
    FaArrowRight
} from 'react-icons/fa';
import { MapPin, User, Phone, Calendar, Clock, Navigation, X } from 'lucide-react';
import GOOGLE_MAPS_API from '../../utils/locationUtils';
import GoogleMapView from '../../components/GoogleMapView';

export default function CreateBooking() {
    const navigate = useNavigate();

    // Current Step
    const [currentStep, setCurrentStep] = useState(1);

    // Google Maps loaded state
    const [mapsLoaded, setMapsLoaded] = useState(false);

    // Step 1: Passenger
    const [passengerName, setPassengerName] = useState('');
    const [passengerPhone, setPassengerPhone] = useState('');

    // Step 2: Location
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropAddress, setDropAddress] = useState('');
    const [distance, setDistance] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
    const [showDropSuggestions, setShowDropSuggestions] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 26.8467, lng: 80.9462 }); // Default: Lucknow
    const [pickupMarker, setPickupMarker] = useState(null);
    const [dropMarker, setDropMarker] = useState(null);

    // Step 3: Ride Type
    const [rideType, setRideType] = useState('');
    const [seatsBooked, setSeatsBooked] = useState(1);

    // Step 4: Cab Selection
    const [availableCabs, setAvailableCabs] = useState([]);
    const [searchingCabs, setSearchingCabs] = useState(false);
    const [selectedCab, setSelectedCab] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [showSeatSelection, setShowSeatSelection] = useState(false);

    // Step 5: Schedule
    const [creating, setCreating] = useState(false);

    // Wait for Google Maps to load
    useEffect(() => {
        const checkMapsLoaded = async () => {
            console.log('⏳ Waiting for Google Maps to load...');
            const loaded = await GOOGLE_MAPS_API.waitForLoad();
            console.log('🗺️ Google Maps loaded:', loaded);
            setMapsLoaded(loaded);
            if (!loaded) {
                toast.error('Google Maps load nahi hua. Page refresh karo.');
            } else {
                toast.success('Google Maps ready! 🗺️');
            }
        };
        checkMapsLoaded();
    }, []);

    // Suggestions
    useEffect(() => {
        if (!mapsLoaded || pickupAddress.length < 2) {
            setPickupSuggestions([]);
            setShowPickupSuggestions(false);
            return;
        }
        // Don't fetch if suggestions are hidden (user just selected)
        if (!showPickupSuggestions) return;

        console.log('🔍 Fetching pickup suggestions for:', pickupAddress);
        const timer = setTimeout(async () => {
            const results = await GOOGLE_MAPS_API.getSuggestions(pickupAddress);
            console.log('✅ Pickup suggestions received:', results);
            console.log('✅ Pickup suggestions length:', results.length);
            setPickupSuggestions(results);
            setShowPickupSuggestions(results.length > 0);
            console.log('👁️ Show pickup suggestions:', results.length > 0);
        }, 400);
        return () => clearTimeout(timer);
    }, [pickupAddress, mapsLoaded, showPickupSuggestions]);

    useEffect(() => {
        if (!mapsLoaded || dropAddress.length < 2) {
            setDropSuggestions([]);
            setShowDropSuggestions(false);
            return;
        }
        // Don't fetch if suggestions are hidden (user just selected)
        if (!showDropSuggestions) return;

        console.log('🔍 Fetching drop suggestions for:', dropAddress);
        const timer = setTimeout(async () => {
            const results = await GOOGLE_MAPS_API.getSuggestions(dropAddress);
            console.log('✅ Drop suggestions received:', results);
            console.log('✅ Drop suggestions length:', results.length);
            setDropSuggestions(results);
            setShowDropSuggestions(results.length > 0);
            console.log('👁️ Show drop suggestions:', results.length > 0);
        }, 400);
        return () => clearTimeout(timer);
    }, [dropAddress, mapsLoaded, showDropSuggestions]);

    const selectPickup = (place) => {
        setPickupAddress(place.description);
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
    };

    const selectDrop = (place) => {
        setDropAddress(place.description);
        setDropSuggestions([]);
        setShowDropSuggestions(false);
    };

    // Get Current Location
    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation supported nahi hai tumhare browser mein');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    // Reverse geocode to get address
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            setPickupAddress(results[0].formatted_address);
                            setPickupMarker({ lat, lng });
                            setMapCenter({ lat, lng });
                            setShowMap(true);
                            toast.success('Current location set ho gaya! 📍');
                        } else {
                            toast.error('Address nahi mila');
                        }
                        setGettingLocation(false);
                    });
                } catch (err) {
                    toast.error('Location fetch failed');
                    setGettingLocation(false);
                }
            },
            (error) => {
                toast.error('Location access denied. Browser settings check karo.');
                setGettingLocation(false);
            }
        );
    };

    // Calculate Distance
    const handleCalculateDistance = async () => {
        if (!pickupAddress.trim() || !dropAddress.trim())
            return toast.error('Pickup aur Drop dono enter karo');

        setCalculating(true);
        try {
            toast.loading('Locations dhundh raha hai...', { id: 'loc' });
            const [pickupResult, dropResult] = await Promise.all([
                GOOGLE_MAPS_API.geocode(pickupAddress),
                GOOGLE_MAPS_API.geocode(dropAddress)
            ]);

            if (!pickupResult.success) throw new Error(`Pickup: ${pickupResult.error}`);
            if (!dropResult.success) throw new Error(`Drop: ${dropResult.error}`);

            const dist = await GOOGLE_MAPS_API.getDistance(
                pickupResult.lat, pickupResult.lng,
                dropResult.lat, dropResult.lng
            );

            // Set markers for map
            setPickupMarker({ lat: pickupResult.lat, lng: pickupResult.lng });
            setDropMarker({ lat: dropResult.lat, lng: dropResult.lng });
            setMapCenter({ lat: pickupResult.lat, lng: pickupResult.lng });
            setShowMap(true);

            setDistance({
                value: dist,
                pickup: { lat: pickupResult.lat, lng: pickupResult.lng },
                drop: { lat: dropResult.lat, lng: dropResult.lng },
                pickupName: pickupResult.displayName,
                dropName: dropResult.displayName
            });

            toast.success(`Distance: ${dist} km`, { id: 'loc' });
            setCurrentStep(3); // Auto move to ride type selection
        } catch (err) {
            toast.error(err.message || 'Distance calculate nahi hua', { id: 'loc' });
        } finally {
            setCalculating(false);
        }
    };

    // Search Cabs
    const handleRideTypeSelect = async (type) => {
        setRideType(type);
        setSearchingCabs(true);
        try {
            toast.loading('Cabs dhundh raha hai...', { id: 'search' });
            const response = await agentService.searchCabs({
                distanceKm: distance.value,
                rideType: type,
                seatsBooked: type === 'Shared' ? seatsBooked : 1,
                pickupAddress,
                dropAddress,
                pickupLat: distance.pickup.lat,
                pickupLng: distance.pickup.lng,
                dropLat: distance.drop.lat,
                dropLng: distance.drop.lng
            });

            if (response.success && response.options?.length > 0) {
                console.log('Cabs API Response:', response.options);
                console.log('First cab:', response.options[0]);
                setAvailableCabs(response.options);
                toast.success(`${response.options.length} cabs mile!`, { id: 'search' });
                setCurrentStep(4); // Auto move to cab selection
            } else {
                toast.warning('Is route pe koi cab available nahi', { id: 'search' });
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Cabs search failed', { id: 'search' });
        } finally {
            setSearchingCabs(false);
        }
    };

    // Cab Select
    const handleCabSelect = (cab) => {
        setSelectedCab(cab);
        if (rideType === 'Shared') {
            // Shared ride — seat selection dikhao
            setShowSeatSelection(true);
        } else {
            // Private ride — direct next step
            toast.success(`${cab.name} select hua!`);
            setCurrentStep(5);
        }
    };

    const handleSeatConfirm = () => {
        if (selectedSeats.length === 0) {
            return toast.error('Kam se kam 1 seat select karo');
        }
        // Update seatsBooked with actual selected count
        setSeatsBooked(selectedSeats.length);
        toast.success(`${selectedCab.name} + ${selectedSeats.length} seats select hua!`);
        setCurrentStep(5);
    };

    // Create Booking
    const handleCreateBooking = async () => {
        if (!passengerName || !passengerPhone) return toast.error('Passenger details bharo');
        if (!distance) return toast.error('Distance calculate karo');
        if (!selectedCab) return toast.error('Cab select karo');

        setCreating(true);
        try {
            toast.loading('Booking ban rahi hai...', { id: 'create' });
            const response = await agentService.createBooking({
                passengerName,
                passengerPhone,
                rideType,
                carCategoryId: selectedCab.carCategoryId,
                seatsBooked: rideType === 'Shared' ? seatsBooked : 1,
                selectedSeats: rideType === 'Shared' ? selectedSeats : [],
                pickupAddress,
                pickupLat: distance.pickup.lat,
                pickupLng: distance.pickup.lng,
                dropAddress,
                dropLat: distance.drop.lat,
                dropLng: distance.drop.lng,
                distanceKm: distance.value
            });

            if (response.success) {
                toast.dismiss('create');
                
                // Sweet Alert Success
                await Swal.fire({
                    icon: 'success',
                    title: 'Booking Successful!',
                    html: `
                        <div style="text-align: left; padding: 10px;">
                            <p><strong>Passenger:</strong> ${passengerName}</p>
                            <p><strong>Phone:</strong> ${passengerPhone}</p>
                            <p><strong>Cab:</strong> ${selectedCab.name}</p>
                            <p><strong>Fare:</strong> ₹${rideType === 'Private' ? (selectedCab.privateFare || selectedCab.fare || 0) : ((selectedCab.sharedFare || selectedCab.farePerSeat || selectedCab.fare || 0) * seatsBooked)}</p>
                            <p><strong>Distance:</strong> ${distance.value} km</p>
                        </div>
                    `,
                    confirmButtonText: 'View My Bookings',
                    confirmButtonColor: '#2563EB',
                    showCancelButton: false,
                    allowOutsideClick: false
                });
                
                navigate('/agent/bookings');
            } else {
                throw new Error(response.message || 'Booking failed');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || 'Booking failed', { id: 'create' });
        } finally {
            setCreating(false);
        }
    };

    const parseSeatLayout = (layout) => {
        if (Array.isArray(layout)) return layout;
        if (typeof layout === 'string') {
            try { return JSON.parse(layout); } catch { return []; }
        }
        return [];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">

            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">

                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-blue-600 rounded-full" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Booking</h1>
                        <p className="text-sm text-gray-500 mt-1">Step {currentStep} of 5</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    {[
                        { label: 'Passenger', num: 1 },
                        { label: 'Location', num: 2 },
                        { label: 'Ride Type', num: 3 },
                        { label: 'Select Cab', num: 4 },
                        { label: 'Confirm', num: 5 }
                    ].map((step, idx) => (
                        <div key={idx} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= step.num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {step.num}
                                </div>
                                <span className="text-xs mt-2 text-gray-600">{step.label}</span>
                            </div>
                            {idx < 4 && (
                                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto">

                {/* STEP 1: Passenger Details */}
                {currentStep === 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Passenger Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={passengerName}
                                    onChange={(e) => setPassengerName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g., Rahul Kumar"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={passengerPhone}
                                    onChange={(e) => setPassengerPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g., 9876543210"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (!passengerName.trim() || !passengerPhone.trim()) {
                                    return toast.error('Name aur Phone dono bharo');
                                }
                                setCurrentStep(2);
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                        >
                            Next: Location <FaArrowRight size={14} />
                        </button>
                    </div>
                )}

                {/* STEP 2: Location */}
                {currentStep === 2 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Navigation size={20} className="text-green-600" />
                            Trip Details
                            {!mapsLoaded && <span className="text-xs text-orange-500">(Loading Maps...)</span>}
                        </h2>

                        {/* Pickup */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                                <button
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation || !mapsLoaded}
                                    className="flex items-center gap-1 px-3 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
                                >
                                    {gettingLocation ? (
                                        <><FaSpinner className="animate-spin" size={10} />Getting...</>
                                    ) : (
                                        <><Navigation size={12} />Use Current Location</>
                                    )}
                                </button>
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={pickupAddress}
                                    onChange={(e) => {
                                        setPickupAddress(e.target.value);
                                        setShowPickupSuggestions(true);
                                    }}
                                    onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g., Lucknow Charbagh Station"
                                    autoComplete="off"
                                />
                                {pickupAddress && (
                                    <button
                                        onClick={() => {
                                            setPickupAddress('');
                                            setPickupSuggestions([]);
                                            setShowPickupSuggestions(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            {showPickupSuggestions && pickupSuggestions.length > 0 && (
                                <div
                                    className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    {pickupSuggestions.map((place, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                            onClick={() => selectPickup(place)}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{place.mainText}</p>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{place.secondaryText}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drop */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Drop Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={dropAddress}
                                    onChange={(e) => {
                                        setDropAddress(e.target.value);
                                        setShowDropSuggestions(true);
                                    }}
                                    onFocus={() => dropSuggestions.length > 0 && setShowDropSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="e.g., Delhi Airport"
                                    autoComplete="off"
                                />
                                {dropAddress && (
                                    <button
                                        onClick={() => {
                                            setDropAddress('');
                                            setDropSuggestions([]);
                                            setShowDropSuggestions(false);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            {showDropSuggestions && dropSuggestions.length > 0 && (
                                <div
                                    className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    {dropSuggestions.map((place, idx) => (
                                        <div
                                            key={idx}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                            onClick={() => selectDrop(place)}
                                        >
                                            <p className="text-sm font-medium text-gray-900">{place.mainText}</p>
                                            <p className="text-xs text-gray-500 mt-1 truncate">{place.secondaryText}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Google Map View */}
                        {showMap && mapsLoaded && (pickupMarker || dropMarker) && (
                            <GoogleMapView
                                pickupMarker={pickupMarker}
                                dropMarker={dropMarker}
                                mapCenter={mapCenter}
                                onClose={() => setShowMap(false)}
                            />
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setCurrentStep(1)} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium">
                                Back
                            </button>
                            <button
                                onClick={handleCalculateDistance}
                                disabled={calculating}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                            >
                                {calculating ? <><FaSpinner className="animate-spin" size={16} />Calculating...</> : <><FaSearch size={16} />Calculate Distance</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Ride Type */}
                {currentStep === 3 && distance && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                            <p className="text-sm font-medium text-gray-900 mb-2">Distance Calculated</p>
                            <p className="text-xs text-gray-600">From: {distance.pickupName?.split(',')[0]}</p>
                            <p className="text-xs text-gray-600">To: {distance.dropName?.split(',')[0]}</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{distance.value} km</p>
                        </div>

                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FaCar className="text-blue-600" />
                            Choose Ride Type
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleRideTypeSelect('Private')}
                                disabled={searchingCabs}
                                className="p-6 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
                            >
                                <Navigation size={32} className="text-purple-600" />
                                <div className="text-center">
                                    <p className="font-bold text-lg">Private Ride</p>
                                    <p className="text-xs text-gray-500 mt-1">Direct & Fast</p>
                                </div>
                            </button>
                            <button
                                onClick={() => handleRideTypeSelect('Shared')}
                                disabled={searchingCabs}
                                className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
                            >
                                <FaUsers size={32} className="text-blue-600" />
                                <div className="text-center">
                                    <p className="font-bold text-lg">Shared Ride</p>
                                    <p className="text-xs text-gray-500 mt-1">Wait & Save</p>
                                </div>
                            </button>
                        </div>

                        {searchingCabs && (
                            <div className="text-center py-4">
                                <FaSpinner className="animate-spin mx-auto text-blue-600 mb-2" size={24} />
                                <p className="text-sm text-gray-600">Searching cabs...</p>
                            </div>
                        )}

                        <button onClick={() => setCurrentStep(2)} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium">
                            Back to Location
                        </button>
                    </div>
                )}

                {/* STEP 4: Cab Selection */}
                {currentStep === 4 && availableCabs.length > 0 && !showSeatSelection && (
                    <div className="space-y-6">
                        {/* Google Map with Route */}
                        {distance && distance.pickup && distance.drop && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <GoogleMapView
                                    pickupMarker={distance.pickup}
                                    dropMarker={distance.drop}
                                    mapCenter={distance.pickup}
                                    onClose={() => { }}
                                />
                            </div>
                        )}

                        {/* Cab List */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FaCar className="text-purple-600" />
                                Select a Cab ({availableCabs.length} available)
                            </h2>

                            <div className="space-y-3">
                                {availableCabs.map((cab) => {
                                    let fare = 0;
                                    let perSeatFare = 0;

                                    if (rideType === 'Private') {
                                        fare = cab.privateFare || cab.fare || 0;
                                    } else {
                                        perSeatFare = cab.sharedFare || cab.farePerSeat || cab.fare || 0;
                                        fare = perSeatFare * seatsBooked;
                                    }

                                    console.log('Cab:', cab.name, 'RideType:', rideType, 'privateFare:', cab.privateFare, 'sharedFare:', cab.sharedFare, 'farePerSeat:', cab.farePerSeat, 'fare:', cab.fare, 'Calculated fare:', fare);

                                    return (
                                        <div
                                            key={cab.carCategoryId}
                                            onClick={() => handleCabSelect(cab)}
                                            className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all relative"
                                        >
                                            {cab.tag && (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-md">
                                                    {cab.tag}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center overflow-hidden">
                                                        {cab.image ? (
                                                            <img 
                                                                src={cab.image} 
                                                                alt={cab.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <FaCar 
                                                            size={28} 
                                                            className="text-blue-600" 
                                                            style={{ display: cab.image ? 'none' : 'block' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{cab.name}</h3>
                                                        <p className="text-xs text-gray-500">{cab.description}</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                <Clock size={12} className="text-green-600" />
                                                                <span className="font-medium text-green-600">{cab.arrivalMins || 'N/A'}</span>
                                                            </p>
                                                            <span className="text-gray-300">•</span>
                                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                <Navigation size={12} className="text-blue-600" />
                                                                <span className="font-medium text-blue-600">{cab.dropTime || 'N/A'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-green-600">₹{fare > 0 ? fare : 'N/A'}</p>
                                                    {rideType === 'Shared' && perSeatFare > 0 && (
                                                        <p className="text-xs text-gray-400">₹{perSeatFare} × {seatsBooked} seat(s)</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button onClick={() => setCurrentStep(3)} className="w-full py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium">
                                Back to Ride Type
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4.5: Seat Selection (Shared Ride Only) */}
                {currentStep === 4 && showSeatSelection && selectedCab && rideType === 'Shared' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FaUsers className="text-blue-600" />
                                Select Seats
                            </h2>
                            <button
                                onClick={() => {
                                    setShowSeatSelection(false);
                                    setSelectedCab(null);
                                    setSelectedSeats([]);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="font-semibold text-gray-900">{selectedCab.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                ₹{selectedCab.sharedFare || selectedCab.farePerSeat || selectedCab.fare || 0} per seat × {selectedSeats.length} = ₹{(selectedCab.sharedFare || selectedCab.farePerSeat || selectedCab.fare || 0) * selectedSeats.length}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Select Seats (Click to select/deselect)</label>
                            <div className="grid grid-cols-3 gap-3">
                                {parseSeatLayout(selectedCab.seatLayout).map((seat, idx) => {
                                    const isSelected = selectedSeats.includes(seat);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedSeats(selectedSeats.filter(s => s !== seat));
                                                } else {
                                                    setSelectedSeats([...selectedSeats, seat]);
                                                }
                                            }}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all ${isSelected ? 'bg-blue-600 text-white border-2 border-blue-600' :
                                                'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500'
                                                }`}
                                        >
                                            {seat}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-3">
                                Selected: {selectedSeats.length} seat(s)
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSeatSelection(false);
                                    setSelectedCab(null);
                                    setSelectedSeats([]);
                                }}
                                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSeatConfirm}
                                disabled={selectedSeats.length === 0}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                            >
                                Confirm {selectedSeats.length} Seat(s) <FaArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 5: Schedule & Confirm */}
                {currentStep === 5 && selectedCab && (
                    <div className="space-y-6">
                        {/* Pickup Location Map - Zoomed */}
                        {distance && distance.pickup && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin size={18} className="text-green-600" />
                                    <h3 className="text-sm font-semibold text-gray-800">Pickup Location</h3>
                                </div>
                                <div 
                                    className="w-full h-64 rounded-xl border-2 border-gray-200 overflow-hidden shadow-md"
                                    ref={(el) => {
                                        if (el && !el.dataset.initialized && window.google) {
                                            el.dataset.initialized = 'true';
                                            const map = new window.google.maps.Map(el, {
                                                center: distance.pickup,
                                                zoom: 16,
                                                mapTypeControl: true,
                                                streetViewControl: true,
                                                fullscreenControl: true,
                                            });

                                            new window.google.maps.Marker({
                                                position: distance.pickup,
                                                map: map,
                                                title: 'Pickup Location',
                                                animation: window.google.maps.Animation.DROP,
                                                icon: {
                                                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                                    scaledSize: new window.google.maps.Size(40, 40)
                                                }
                                            });
                                        }
                                    }}
                                />
                                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                    <p className="text-xs text-gray-600 font-medium">{distance.pickupName}</p>
                                </div>
                            </div>
                        )}

                        {/* Selected Cab Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-gray-500 mb-3">Selected Cab</h3>
                            <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center overflow-hidden">
                                            {selectedCab.image ? (
                                                <img 
                                                    src={selectedCab.image} 
                                                    alt={selectedCab.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <FaCar 
                                                size={24} 
                                                className="text-purple-600" 
                                                style={{ display: selectedCab.image ? 'none' : 'block' }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{selectedCab.name}</p>
                                            <p className="text-xs text-gray-500">{rideType} • {seatsBooked} seat(s)</p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-bold text-green-600">
                                        ₹{rideType === 'Private'
                                            ? (selectedCab.privateFare || selectedCab.fare || 0)
                                            : ((selectedCab.sharedFare || selectedCab.farePerSeat || selectedCab.fare || 0) * seatsBooked)
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 pt-2 border-t border-purple-200">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-green-600" />
                                        <span className="text-xs font-medium text-green-600">{selectedCab.arrivalMins || 'N/A'}</span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <div className="flex items-center gap-2">
                                        <Navigation size={14} className="text-blue-600" />
                                        <span className="text-xs font-medium text-blue-600">{selectedCab.dropTime || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button onClick={() => setCurrentStep(4)} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium">
                                Back
                            </button>
                            <button
                                onClick={handleCreateBooking}
                                disabled={creating}
                                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-3 text-lg shadow-lg"
                            >
                                {creating ? <><FaSpinner className="animate-spin" size={20} />Creating...</> : <><FaCheckCircle size={20} />Confirm Booking</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
