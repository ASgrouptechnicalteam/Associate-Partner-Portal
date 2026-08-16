import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // 1. Personal
    name: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    whatsappNumber: '',
    currentAddress: '',
    permanentAddress: '',
    bloodGroup: '',
    // 2. Identification
    panNumber: '',
    aadhaarNumber: '',
    // 3. Banking
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    // 4. Emergency
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    // 5. Official
    jobTitle: '',
    department: '',
    workLocation: '',
    dateOfJoining: '',
    commissionPercentage: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        if (response.data.success) {
          const user = response.data.user;
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            secondaryPhone: user.secondaryPhone || '',
            whatsappNumber: user.whatsappNumber || '',
            currentAddress: user.currentAddress || '',
            permanentAddress: user.permanentAddress || '',
            bloodGroup: user.bloodGroup || '',
            panNumber: user.panNumber || '',
            aadhaarNumber: user.aadhaarNumber || '',
            bankName: user.bankName || '',
            accountNumber: user.accountNumber || '',
            ifscCode: user.ifscCode || '',
            branchName: user.branchName || '',
            emergencyContactName: user.emergencyContactName || '',
            emergencyContactRelation: user.emergencyContactRelation || '',
            emergencyContactPhone: user.emergencyContactPhone || '',
            jobTitle: user.jobTitle || '',
            department: user.department || '',
            workLocation: user.workLocation || '',
            dateOfJoining: user.dateOfJoining ? user.dateOfJoining.split('T')[0] : '',
            commissionPercentage: user.commissionPercentage !== null ? user.commissionPercentage.toString() : ''
          });
        }
      } catch (err: any) {
        setError('Failed to load associate details');
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        commissionPercentage: formData.commissionPercentage ? parseFloat(formData.commissionPercentage) : undefined
      };
      
      const response = await api.patch(`/users/${id}`, payload);
      if (response.data.success) {
        navigate(`/users/${id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update associate');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-navy"></div></div>;
  }

  const canEditSensitive = currentUser?.role === 'MD' || currentUser?.role === 'ASSOCIATE_MANAGER' || currentUser?.id === id;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/users/${id}`)} className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Edit Associate</h1>
          <p className="text-sm text-gray-500">Update associate information</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Personal Information */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">1. Personal Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                <input type="text" name="name" required className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email Address *</label>
                <input type="email" name="email" required className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.email} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Primary Phone Number *</label>
                <input type="tel" name="phone" required className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.phone} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Secondary Contact Number</label>
                <input type="tel" name="secondaryPhone" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.secondaryPhone} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp Number</label>
                <input type="tel" name="whatsappNumber" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.whatsappNumber} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Blood Group</label>
                <input type="text" name="bloodGroup" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.bloodGroup} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Current Address</label>
                <input type="text" name="currentAddress" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.currentAddress} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Permanent Address</label>
                <input type="text" name="permanentAddress" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.permanentAddress} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* 2. Identification Details */}
          {canEditSensitive && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">2. Identification Details</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">PAN Number</label>
                  <input type="text" name="panNumber" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.panNumber} onChange={handleChange} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Aadhaar Number</label>
                  <input type="text" name="aadhaarNumber" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.aadhaarNumber} onChange={handleChange} />
                </div>
              </div>
            </section>
          )}

          {/* 3. Banking Details */}
          {canEditSensitive && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">3. Banking Details</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
                  <input type="text" name="bankName" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.bankName} onChange={handleChange} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Account Number</label>
                  <input type="text" name="accountNumber" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.accountNumber} onChange={handleChange} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">IFSC Code</label>
                  <input type="text" name="ifscCode" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.ifscCode} onChange={handleChange} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Branch Name</label>
                  <input type="text" name="branchName" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.branchName} onChange={handleChange} />
                </div>
              </div>
            </section>
          )}

          {/* 4. Emergency Contact Information */}
          {canEditSensitive && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">4. Emergency Contact Information</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Contact Person Name</label>
                  <input type="text" name="emergencyContactName" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.emergencyContactName} onChange={handleChange} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Relationship</label>
                  <input type="text" name="emergencyContactRelation" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.emergencyContactRelation} onChange={handleChange} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input type="tel" name="emergencyContactPhone" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.emergencyContactPhone} onChange={handleChange} />
                </div>
              </div>
            </section>
          )}

          {/* 5. Official Associate Details */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">5. Official Associate Details</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Official Job Title</label>
                <input type="text" name="jobTitle" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.jobTitle} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
                <input type="text" name="department" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.department} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Work Location</label>
                <input type="text" name="workLocation" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.workLocation} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date of Joining</label>
                <input type="date" name="dateOfJoining" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.dateOfJoining} onChange={handleChange} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Commission Percentage</label>
                <input type="number" step="0.01" name="commissionPercentage" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.commissionPercentage} onChange={handleChange} />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/users/${id}`)}
              className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary-navy px-6 py-2 font-medium text-white transition-colors hover:bg-deep-navy disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
