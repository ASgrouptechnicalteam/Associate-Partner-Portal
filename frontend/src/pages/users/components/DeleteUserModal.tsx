import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: {
    name: string;
    userIdentifier: string;
    designation?: string;
    teamName?: string;
    directMembersCount?: number;
    totalDescendantsCount?: number;
  } | null;
  loading?: boolean;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, onClose, onConfirm, user, loading }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
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
          <div className="mb-6 flex items-start gap-4 rounded-lg bg-red-50 p-4">
            <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={24} />
            <div>
              <h3 className="font-semibold text-red-800">
                Warning: Irreversible Action
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Deleting this user may affect hierarchy and historical business records. Are you absolutely sure you want to proceed?
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-xs text-gray-500">Name</p>
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
                <p className="text-xs text-gray-500">Team</p>
                <p className="font-semibold text-gray-900">{user.teamName}</p>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
              <div>
                <p className="text-xs text-gray-500">Direct Members</p>
                <p className="font-semibold text-gray-900">{user.directMembersCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Below</p>
                <p className="font-semibold text-gray-900">{user.totalDescendantsCount || 0}</p>
              </div>
            </div>
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
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
