import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

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

      const response = await api.post('/users', payload);

      if (response.data.success) {
        setSuccessData(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    const { user, temporaryPassword } = successData;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Associate Created Successfully</h2>
          
          <div className="mx-auto max-w-md rounded-md bg-gray-50 p-6 text-left">
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Name:</span>
              <span className="font-semibold text-gray-900">{user.name}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Associate ID:</span>
              <span className="font-semibold text-primary-gold">{user.associateId}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Email:</span>
              <span className="font-semibold text-gray-900">{user.email}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Status:</span>
              <span className="font-semibold text-yellow-600">Pending Approval</span>
            </div>
            <div className="mb-3 flex justify-between">
              <span className="font-medium text-gray-500">Temporary Password:</span>
              <span className="select-all rounded bg-gray-200 px-2 font-mono font-bold tracking-wider text-red-600">
                {temporaryPassword}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-yellow-50 p-4 text-left text-sm text-yellow-800">
            <p className="mb-2 font-semibold">Important Instructions:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>This account requires MD approval before the Associate can log in.</li>
              <li>The temporary password must be given securely to the Associate.</li>
              <li>The Associate will be required to change the password during first login.</li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate('/users')}
              className="rounded-md bg-primary-navy px-6 py-2 font-medium text-white transition-colors hover:bg-deep-navy"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users')} className="rounded-full p-2 transition-colors hover:bg-gray-100">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Add New Associate</h1>
          <p className="text-sm text-gray-500">Create a new partner account</p>
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

          {/* 3. Banking Details */}
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

          {/* 4. Emergency Contact Information */}
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
              onClick={() => navigate('/users')}
              className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary-navy px-6 py-2 font-medium text-white transition-colors hover:bg-deep-navy disabled:opacity-70"
            >
              {loading ? 'Creating...' : 'Create Associate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
