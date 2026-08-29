import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DeactivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: {
    name: string;
    userIdentifier: string;
    designation?: string;
    teamName?: string;
    status: string;
  } | null;
  loading?: boolean;
}

const DeactivateUserModal: React.FC<DeactivateUserModalProps> = ({ isOpen, onClose, onConfirm, user, loading }) => {
  if (!isOpen || !user) return null;

  const isActive = user.status === 'ACTIVE';
  const actionText = isActive ? 'Deactivate' : 'Activate';
  const actionColor = isActive ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">{actionText} User</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-orange-50 p-4">
            <AlertCircle className="mt-0.5 shrink-0 text-orange-600" size={24} />
            <div>
              <h3 className="font-semibold text-orange-800">
                Are you sure you want to {actionText.toLowerCase()} this user?
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                {isActive 
                  ? 'The user will no longer be able to access their account.' 
                  : 'The user will regain access to their account.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-xs text-gray-500">User Name</p>
              <p className="font-semibold text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">User ID</p>
              <p className="font-semibold text-gray-900">{user.userIdentifier || 'No ID'}</p>
            </div>
            {user.designation && (
              <div>
                <p className="text-xs text-gray-500">Designation</p>
                <p className="font-semibold text-gray-900">{user.designation}</p>
              </div>
            )}
            {user.teamName && (
              <div>
                <p className="text-xs text-gray-500">Current Team</p>
                <p className="font-semibold text-gray-900">{user.teamName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${actionColor}`}
          >
            {loading ? 'Processing...' : actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateUserModal;
