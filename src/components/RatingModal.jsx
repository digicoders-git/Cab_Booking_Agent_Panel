import React, { useState } from 'react';
import { FaStar, FaTimes, FaSpinner } from 'react-icons/fa';
import { toast } from 'sonner';
import { agentService } from '../api/agentApi';

const RatingModal = ({ isOpen, onClose, bookingId, targetName, onRatingSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating.");
            return;
        }

        try {
            setLoading(true);
            const res = await agentService.rateDriver(bookingId, { rating, review });
            if (res.success) {
                toast.success('Rating submitted successfully!');
                onRatingSuccess(bookingId, rating);
                onClose();
            } else {
                toast.error(res.message || 'Failed to submit rating');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">Rate Driver</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-2">How was the experience with</p>
                        <p className="font-bold text-lg text-gray-900">{targetName || 'the Driver'}?</p>
                        
                        <div className="flex justify-center gap-2 mt-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(rating)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <FaStar
                                        size={32}
                                        className={`${
                                            star <= (hover || rating)
                                                ? 'text-yellow-400'
                                                : 'text-gray-200'
                                        } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review (Optional)
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Write about the driving experience, behavior, etc."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm resize-none h-24"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || rating === 0}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : 'Submit Rating'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
