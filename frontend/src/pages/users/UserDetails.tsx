import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Edit, ShieldAlert, KeyRound, CheckCircle, XCircle } from 'lucide-react';
import ResetPasswordModal from './components/ResetPasswordModal';
import { useAuth } from '../../context/AuthContext';

interface UserDetails {
  id: string;
  associateId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  secondaryPhone: string | null;
  whatsappNumber: string | null;
  currentAddress: string | null;
  permanentAddress: string | null;
  bloodGroup: string | null;
  socialMedia: any;
  panNumber: string | null;
  aadhaarNumber: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  branchName: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  jobTitle: string | null;
  department: string | null;
  workLocation: string | null;
  dateOfJoining: string | null;
  commissionPercentage: number | null;
  rejectionReason: string | null;
}

const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load associate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

    try {
      const response = await api.patch(`/users/${user.id}/status`, { status: newStatus });
      if (response.data.success) {
        fetchUser();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to approve this associate?')) return;
    try {
      const response = await api.patch(`/users/${user.id}/approve`, { status: 'ACTIVE' });
      if (response.data.success) fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!user) return;
    const reason = window.prompt('Please enter a rejection reason:');
    if (reason === null) return;
    try {
      const response = await api.patch(`/users/${user.id}/approve`, { status: 'REJECTED', rejectionReason: reason });
      if (response.data.success) fetchUser();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800';
      case 'DEACTIVATED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy"></div></div>;
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error || 'Associate not found'}
        </div>
        <button onClick={() => navigate('/users')} className="mt-4 text-primary-navy font-medium">
          &larr; Back to Associates
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/users')} className="rounded-full p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary-navy">{user.name}</h1>
            <p className="text-sm font-medium text-primary-gold">{user.associateId || 'No ID'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.status === 'PENDING_APPROVAL' && currentUser?.role === 'MD' && (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Approve
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                <XCircle size={16} />
                Reject
              </button>
            </>
          )}

          {user.status !== 'PENDING_APPROVAL' && (
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                user.status === 'ACTIVE' 
                  ? 'border-red-200 text-red-700 hover:bg-red-50' 
                  : 'border-green-200 text-green-700 hover:bg-green-50'
              }`}
            >
              <ShieldAlert size={16} />
              {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
          )}

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
          >
            <KeyRound size={16} />
            Reset Password
          </button>
          
          <Link
            to={`/users/${user.id}/edit`}
            className="flex items-center gap-2 rounded-md bg-primary-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-deep-navy"
          >
            <Edit size={16} />
            Edit Profile
          </Link>
        </div>
      </div>

      {user.status === 'REJECTED' && user.rejectionReason && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800">Rejection Reason:</h3>
          <p className="mt-1 text-red-700">{user.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Account Status Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 font-semibold text-gray-900">Account Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${getStatusColor(user.status)}`}>
                {user.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created Date</p>
              <p className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="text-sm text-gray-900">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never logged in'}</p>
            </div>
          </div>
        </div>

        {/* 1. Personal Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 border-b pb-2 font-semibold text-gray-900">1. Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Primary Phone</p>
              <p className="font-medium text-gray-900">{user.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Secondary Phone</p>
              <p className="font-medium text-gray-900">{user.secondaryPhone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">WhatsApp Number</p>
              <p className="font-medium text-gray-900">{user.whatsappNumber || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Blood Group</p>
              <p className="font-medium text-gray-900">{user.bloodGroup || '-'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Current Address</p>
              <p className="font-medium text-gray-900">{user.currentAddress || '-'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Permanent Address</p>
              <p className="font-medium text-gray-900">{user.permanentAddress || '-'}</p>
            </div>
          </div>
        </div>

        {/* 2. Identification Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 font-semibold text-gray-900">2. Identification Details</h3>
          {currentUser?.role === 'MD' || currentUser?.role === 'ASSOCIATE_MANAGER' || currentUser?.id === user.id ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">PAN Number</p>
                <p className="font-medium text-gray-900">{user.panNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Aadhaar Number</p>
                <p className="font-medium text-gray-900">{user.aadhaarNumber || '-'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-gray-400">Hidden for security reasons</p>
          )}
        </div>

        {/* 3. Banking Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 font-semibold text-gray-900">3. Banking Details</h3>
          {currentUser?.role === 'MD' || currentUser?.role === 'ASSOCIATE_MANAGER' || currentUser?.id === user.id ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Bank Name</p>
                <p className="font-medium text-gray-900">{user.bankName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">{user.accountNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IFSC Code</p>
                <p className="font-medium text-gray-900">{user.ifscCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Branch Name</p>
                <p className="font-medium text-gray-900">{user.branchName || '-'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-gray-400">Hidden for security reasons</p>
          )}
        </div>

        {/* 4. Emergency Contact Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 font-semibold text-gray-900">4. Emergency Contact</h3>
          {currentUser?.role === 'MD' || currentUser?.role === 'ASSOCIATE_MANAGER' || currentUser?.id === user.id ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Contact Name</p>
                <p className="font-medium text-gray-900">{user.emergencyContactName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Relationship</p>
                <p className="font-medium text-gray-900">{user.emergencyContactRelation || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">{user.emergencyContactPhone || '-'}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-gray-400">Hidden for security reasons</p>
          )}
        </div>

        {/* 5. Official Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-3">
          <h3 className="mb-4 border-b pb-2 font-semibold text-gray-900">5. Official Associate Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Job Title</p>
              <p className="font-medium text-gray-900">{user.jobTitle || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium text-gray-900">{user.department || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Work Location</p>
              <p className="font-medium text-gray-900">{user.workLocation || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Joining</p>
              <p className="font-medium text-gray-900">{user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission %</p>
              <p className="font-medium text-gray-900">{user.commissionPercentage !== null ? `${user.commissionPercentage}%` : '-'}</p>
            </div>
          </div>
        </div>

      </div>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        userId={user.id}
        userName={user.name}
      />
    </div>
  );
};

export default UserDetails;
