// src/pages/agent/SelectCab.jsx
import { useState, useEffect } from 'react';
import {
    FaTimes, FaCar, FaUsers, FaTag, FaClock,
    FaMapMarkerAlt, FaDollarSign, FaStar
} from 'react-icons/fa';
import { X, Users, Clock, MapPin, DollarSign } from 'lucide-react';

export default function SelectCabModal({ isOpen, onClose, cabs, onSelect, loading, rideType: initialRideType, seatsBooked: initialSeats }) {
    const [selectedCabId, setSelectedCabId] = useState(null);
    const [selectedRideType, setSelectedRideType] = useState(initialRideType || 'Both');
    const [seats, setSeats] = useState(initialSeats || 1);
    const [selectedSeatsList, setSelectedSeatsList] = useState([]);

    // Sync with parent when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedRideType(initialRideType || 'Both');
            setSeats(initialSeats || 1);
            setSelectedCabId(null);
            setSelectedSeatsList([]);
        }
    }, [isOpen, initialRideType, initialSeats]);

    if (!isOpen) return null;

    const handleSelect = (cab) => {
        setSelectedCabId(cab.carCategoryId);
    };

    const handleConfirm = () => {
        const cab = cabs.find(c => c.carCategoryId === selectedCabId);
        if (cab) {
            onSelect(cab, selectedRideType, seats, selectedSeatsList);
        }
    };

    const getFare = (cab) => {
        if (selectedRideType === 'Private' && cab.privateFare) {
            return cab.privateFare;
        }
        if (selectedRideType === 'Shared' && cab.sharedFare) {
            return cab.sharedFare * seats;
        }
        if (cab.fare) {
            return cab.fare;
        }
        return cab.privateFare || cab.sharedFare || cab.fare || 0;
    };

    // Parse seat layout
    const parseSeatLayout = (layout) => {
        if (Array.isArray(layout)) return layout;
        if (typeof layout === 'string') {
            try {
                return JSON.parse(layout);
            } catch {
                return [];
            }
        }
        return [];
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-white"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FaCar className="text-blue-600" size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Select a Cab</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{cabs.length} cabs available</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-gray-200">
                            <button
                                onClick={() => setSelectedRideType('Both')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedRideType === 'Both' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Both
                            </button>
                            <button
                                onClick={() => setSelectedRideType('Private')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedRideType === 'Private' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Private
                            </button>
                            <button
                                onClick={() => setSelectedRideType('Shared')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedRideType === 'Shared' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                Shared
                            </button>
                        </div>

                        {selectedRideType === 'Shared' && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Seats:</label>
                                <select
                                    value={seats}
                                    onChange={(e) => setSeats(parseInt(e.target.value))}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n}>{n} seat(s)</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cab List */}
                <div className="p-6 space-y-4">
                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-gray-500">Searching for cabs...</p>
                        </div>
                    ) : cabs.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            No cabs available for this route
                        </div>
                    ) : (
                        cabs.map((cab) => {
                            const isSelected = selectedCabId === cab.carCategoryId;
                            const fare = getFare(cab);
                            const seatLayout = parseSeatLayout(cab.seatLayout);

                            return (
                                <div
                                    key={cab.carCategoryId}
                                    onClick={() => handleSelect(cab)}
                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Image & Basic Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                                                {cab.image ? (
                                                    <img src={cab.image} alt={cab.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <FaCar size={32} className="text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">{cab.name}</h3>
                                                    {cab.tag && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                            {cab.tag}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">{cab.description}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 text-xs text-gray-600">
                                                        <Users size={14} />
                                                        {cab.seatCapacity} seats
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-600">
                                                        <Clock size={14} />
                                                        {cab.arrivalMins || '2-3 mins'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fare & Action */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 mb-1">Estimated Fare</p>
                                                <p className="text-2xl font-bold text-green-600">₹{fare}</p>
                                                {selectedRideType === 'Shared' && (
                                                    <p className="text-xs text-gray-400 mt-1">per seat: ₹{cab.sharedFare}</p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Seat Layout (if expanded) */}
                                    {isSelected && selectedRideType === 'Shared' && seatLayout.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <p className="text-sm font-medium text-gray-700 mb-3">Select Seats:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {seatLayout.map((seat, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (selectedSeatsList.includes(seat)) {
                                                                setSelectedSeatsList(selectedSeatsList.filter(s => s !== seat));
                                                            } else if (selectedSeatsList.length < seats) {
                                                                setSelectedSeatsList([...selectedSeatsList, seat]);
                                                            }
                                                        }}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSeatsList.includes(seat)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            } ${selectedSeatsList.length >= seats && !selectedSeatsList.includes(seat) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={selectedSeatsList.length >= seats && !selectedSeatsList.includes(seat)}
                                                    >
                                                        {seat}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Selected: {selectedSeatsList.length} of {seats} seats
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCabId || (selectedRideType === 'Shared' && selectedSeatsList.length !== seats)}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-medium shadow-lg shadow-blue-200"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
}