import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const Login: React.FC = () => {
  const [associateId, setAssociateId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { associateId, password });
      if (response.data.success) {
        login(response.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F4FAFC] p-4 font-sans text-primary-navy">
      <div className="flex w-full max-w-[1000px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-blue-900/5">
        
        {/* Left Side: Branding / Visual (Hidden on mobile) */}
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-gold to-yellow-600 p-12 text-white md:flex">
          <div>
            <div className="mb-6 flex items-center justify-center w-[200px] bg-white rounded-2xl shadow-lg p-4">
               <img src="/logo.svg" alt="Sonthillu Constructions" className="w-full h-auto object-contain" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Welcome to the<br />Associate Partner Portal
            </h1>
            <p className="mt-4 text-white/90 text-lg">
              Manage your real estate business, track commissions, and access exclusive inventory.
            </p>
          </div>
          
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
            <p className="text-sm font-medium">"Building trust and delivering excellence in every square foot."</p>
            <p className="mt-2 text-xs text-white/70">— Sonthillu Constructions</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full p-8 md:w-1/2 md:p-16 flex flex-col justify-center">
          <div className="md:hidden mb-8 flex justify-center">
             <img src="/logo.svg" alt="Sonthillu Constructions" className="w-[140px] h-auto object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-500">Enter your associate credentials to access the portal.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="associateId">
                Associate ID
              </label>
              <input
                id="associateId"
                type="text"
                value={associateId}
                onChange={(e) => setAssociateId(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-gold/10"
                placeholder="ASSOC-XX-XXXX"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-gray-900 transition-all focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-gold/10"
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-navy py-3.5 font-bold text-white shadow-lg shadow-primary-navy/20 transition-all hover:bg-deep-navy hover:shadow-xl hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            Secure access restricted to authorized partners only.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
