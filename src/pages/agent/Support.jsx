// src/pages/agent/Support.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaArrowLeft, FaHeadset, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Support() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      return toast.error('Subject aur Message dono bharo');
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('agentToken');
      const response = await axios.post(
        `${API_BASE_URL}/api/support/create`,
        { subject, message },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success('Support request successfully submit ho gayi!');
        setSubject('');
        setMessage('');
      } else {
        throw new Error(response.data.message || 'Request failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Support request submit nahi hui');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => navigate('/agent/dashboard')}
          className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4 group"
        >
          <div className="p-2 bg-white rounded-lg border border-gray-200 group-hover:border-blue-300 transition-all">
            <FaArrowLeft size={12} />
          </div>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-blue-600 rounded-full" />
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900">Support & Help</h1>
            <p className="text-sm text-gray-500 mt-1">Koi problem hai? Hume batao, hum help karenge</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FaHeadset className="text-white text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to Agent Support Portal</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Yeh portal specially agents ke liye banaya gaya hai jahan aap apni saari problems, queries aur suggestions share kar sakte ho.
                Humari dedicated support team 24-48 hours ke andar aapki har request ko carefully review karegi aur best possible solution provide karegi.
                Aap yahan booking issues, payment problems, wallet queries, technical glitches, ya koi bhi platform related concern share kar sakte ho.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Agar aapko koi urgent help chahiye toh aap directly humari helpline pe call kar sakte ho. Hum Monday se Saturday, 9 AM se 6 PM tak available hain.
                Email support 24/7 active hai aur aapko detailed response milega. Apni problem ko clearly describe karein taaki hum jaldi se jaldi solution provide kar sakein.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Quick Response</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Expert Team</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Form */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl">
                <FaHeadset className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Submit Support Request</h2>
                <p className="text-xs text-gray-500 mt-1">Apni problem detail me batao</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g., Gaadi List nahi ho rahi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  rows="6"
                  placeholder="Apni problem detail me likho... e.g., Maine Sedan car add ki thi par woh inactive dikha raha hai."
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  Jitni zyada detail doge, utni jaldi help mil sakegi
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={16} />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Common Issues & Contact Info */}
        <div className="space-y-6">
          {/* Quick Help */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle size={16} className="text-blue-600" />
              Common Issues & Solutions
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-gray-900">Booking create nahi ho rahi?</p>
                <p className="text-xs text-gray-500 mt-1">Passenger details aur location sahi se fill karein</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-gray-900">Wallet balance update nahi ho raha?</p>
                <p className="text-xs text-gray-500 mt-1">Page refresh karke dekho ya logout/login try karo</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-gray-900">Commission calculation galat lag raha?</p>
                <p className="text-xs text-gray-500 mt-1">Dashboard me commission rate check karo</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-gray-900">Login issue ho raha hai?</p>
                <p className="text-xs text-gray-500 mt-1">Password reset karke try karo ya admin se contact karo</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-gray-900">Cab list nahi dikha rahi?</p>
                <p className="text-xs text-gray-500 mt-1">Distance calculate karne ke baad cabs dikhenge</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={16} className="text-green-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={16} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email Support</p>
                  <p className="text-sm font-medium text-gray-900">agent.support@cabservice.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone size={16} className="text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Helpline Number</p>
                  <p className="text-sm font-medium text-gray-900">+91 1800-AGENT-HELP</p>
                  <p className="text-xs text-gray-400 mt-1">Mon-Sat: 9 AM - 6 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle size={16} className="text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Average Response Time</p>
                  <p className="text-sm font-medium text-gray-900">24-48 hours</p>
                  <p className="text-xs text-gray-400 mt-1">We reply as soon as possible</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
