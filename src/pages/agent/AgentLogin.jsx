import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { agentService } from '../../api/agentApi';
import { toast } from 'sonner';
import { FaUserCircle, FaLock, FaSignInAlt } from 'react-icons/fa';

export default function AgentLogin() {
  const navigate = useNavigate();
  const { setLoginData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('🔑 Login attempt:', { email });
      const res = await agentService.login(email, password);
      console.log('✅ Login response:', res);
      
      if (res.success) {
        setLoginData({ ...res.agent, token: res.token });
        toast.success('Login successful!');
        navigate('/agent/dashboard');
      } else {
        toast.error(res.message || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err?.response?.data);
      toast.error(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <FaUserCircle className="text-4xl text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Login</h1>
          <p className="text-sm text-gray-500 mt-1">Access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="agent@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <FaSignInAlt size={16} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}