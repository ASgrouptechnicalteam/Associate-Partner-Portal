import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="mb-4 text-brand-gold" size={64} />
      <h1 className="mb-2 text-4xl font-bold text-primary-navy">404</h1>
      <h2 className="mb-6 text-xl font-medium text-gray-600">Page Not Found</h2>
      <p className="mb-8 text-gray-500 max-w-md">
        The page you are looking for doesn't exist or has been moved.
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

export default NotFound;
