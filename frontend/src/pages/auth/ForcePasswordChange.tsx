import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ForcePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/change-initial-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        await refreshUser(); // This updates mustChangePassword to false
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-app-background p-4 text-primary-navy">
      <div className="w-full max-w-md rounded-lg bg-card-surface p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-primary-navy">Action Required</h1>
          <p className="mt-2 text-sm opacity-80">
            For security, you must change your temporary password.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded bg-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Current Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-navy" htmlFor="currentPassword">
              Current Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 text-primary-navy opacity-50" />
              </div>
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                required
                placeholder="Enter current password"
                className="block w-full rounded border border-gray-300 bg-white p-2.5 pl-10 pr-10 text-primary-navy placeholder:text-gray-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-navy opacity-50 hover:opacity-100 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-navy" htmlFor="newPassword">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 text-primary-navy opacity-50" />
              </div>
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                placeholder="Enter new password"
                className="block w-full rounded border border-gray-300 bg-white p-2.5 pl-10 pr-10 text-primary-navy placeholder:text-gray-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-navy opacity-50 hover:opacity-100 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-1 text-xs opacity-70">Must be at least 8 characters long.</p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary-navy" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 text-primary-navy opacity-50" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm new password"
                className="block w-full rounded border border-gray-300 bg-white p-2.5 pl-10 pr-10 text-primary-navy placeholder:text-gray-400 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-navy opacity-50 hover:opacity-100 focus:outline-none"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-brand-gold px-5 py-3 text-center text-sm font-semibold text-primary-navy transition-colors hover:bg-yellow-500 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
