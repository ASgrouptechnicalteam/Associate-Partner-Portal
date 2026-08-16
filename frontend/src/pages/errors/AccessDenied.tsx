import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const AccessDenied: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center px-4">
      <ShieldAlert className="mb-4 text-red-500" size={64} />
      <h1 className="mb-2 text-4xl font-bold text-primary-navy">403</h1>
      <h2 className="mb-6 text-xl font-medium text-gray-600">Access Denied</h2>
      <p className="mb-8 text-gray-500 max-w-md">
        You do not have permission to view this page. If you believe this is an error, please contact your administrator.
      </p>
      <Link
        to="/dashboard"
        className="rounded bg-primary-navy px-6 py-2 text-white font-medium hover:bg-deep-navy transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default AccessDenied;
