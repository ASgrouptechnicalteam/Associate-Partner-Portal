import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthTest: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-app-background p-8 text-primary-navy">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-lg bg-card-surface shadow">
        <div className="border-b border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Authentication Test Page</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded bg-primary-navy px-4 py-2 text-sm font-semibold text-white hover:bg-deep-navy"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <p className="mb-4 text-green-600 font-semibold">✅ You are successfully authenticated!</p>
          
          <div className="rounded bg-white p-4 shadow-inner">
            <h2 className="mb-4 text-lg font-semibold border-b pb-2">Safe User Profile</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Associate ID</p>
                <p className="font-medium">{user?.associateId || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-500 bg-blue-50 p-4 rounded border border-blue-100">
            <p className="font-semibold text-blue-800">Security Check:</p>
            <ul className="list-disc pl-5 mt-2 text-blue-700">
              <li>No password hash is visible here.</li>
              <li>The JWT is stored securely in an HttpOnly cookie, not in localStorage.</li>
              <li>Refreshing this page will maintain your session.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
