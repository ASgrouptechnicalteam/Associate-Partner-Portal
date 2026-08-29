import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Search, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

const DESIGNATIONS = [
  { name: 'Marketing Manager', commission: 10 },
  { name: 'Senior Marketing Manager', commission: 12 },
  { name: 'Assistant General Manager', commission: 14 },
  { name: 'Senior Assistant General Manager', commission: 16 },
  { name: 'Deputy General Manager', commission: 18 },
  { name: 'Senior Deputy General Manager', commission: 20 },
  { name: 'General Manager', commission: 22 },
  { name: 'Senior General Manager', commission: 24 },
  { name: 'Chief General Manager', commission: 26 },
  { name: 'Senior Chief General Manager', commission: 28 },
  { name: 'Marketing Director', commission: 30 }
];

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [sendingCredentials, setSendingCredentials] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [credentialMessage, setCredentialMessage] = useState('');

  // Referral State
  const [referralUserId, setReferralUserId] = useState('');
  const [referralUser, setReferralUser] = useState<any>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

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
    department: '',
    workLocation: '',
    dateOfJoining: '',
    designation: '',
    teamId: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/team/main-teams');
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load teams');
    }
  };

  const handleReferralSearch = async () => {
    if (!referralUserId.trim()) {
      setReferralUser(null);
      setReferralError(null);
      setFormData(prev => ({ ...prev, teamId: '' }));
      return;
    }
    
    setReferralLoading(true);
    setReferralError(null);
    setReferralUser(null);
    
    try {
      const response = await api.get(`/users?search=${encodeURIComponent(referralUserId.trim())}`);
      if (response.data.success && response.data.users.length > 0) {
        const found = response.data.users.find((u: any) => u.userIdentifier === referralUserId.trim().toUpperCase());
        if (found) {
          setReferralUser(found);
          // Automatically set team from referral
          if (found.teamId) {
            setFormData(prev => ({ ...prev, teamId: found.teamId }));
          }
        } else {
          setReferralError('User not found');
        }
      } else {
        setReferralError('User not found');
      }
    } catch (err) {
      setReferralError('Failed to lookup user');
    } finally {
      setReferralLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Auto-calculated commission
  const currentCommission = DESIGNATIONS.find(d => d.name === formData.designation)?.commission || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        referralUserId: referralUser?.userIdentifier || referralUserId.trim() || undefined,
        commissionPercentage: currentCommission
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

  const handleSendCredentials = (user: any, password: string) => {
    if (!user.whatsappNumber) {
      setCredentialStatus('error');
      setCredentialMessage('WhatsApp number is not available for this Associate.');
      return;
    }

    setSendingCredentials(true);
    setCredentialStatus('idle');
    setCredentialMessage('');

    // Short delay to prevent rapid clicking and show intent
    setTimeout(() => {
      let cleanPhone = user.whatsappNumber.replace(/\D/g, '');
      
      // If the number is exactly 10 digits (assumed Indian local), prepend 91
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }

      // We should use the window.location.origin or a configured portal URL
      // In a real app this might come from env vars, but origin works for frontend
      const portalUrl = window.location.origin;

      const messageText = `Hello ${user.name},

Welcome to Sonthillu Constructions.

Your Marketing & Sales Portal account has been created.

User ID: ${user.userIdentifier}
Password: ${password}

Portal:
${portalUrl}

Please log in and change your password after your first login.

Regards,
Sonthillu Constructions`;

      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      setCredentialStatus('success');
      setCredentialMessage('WhatsApp opened with the credentials message.');
      setSendingCredentials(false);
    }, 500);
  };

  if (successData) {
    const { user, temporaryPassword } = successData;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Member Created Successfully</h2>
          
          <div className="mx-auto max-w-md rounded-md bg-gray-50 p-6 text-left">
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Name:</span>
              <span className="font-semibold text-gray-900">{user.name}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">User ID:</span>
              <span className="font-semibold text-primary-gold">{user.userIdentifier}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Email:</span>
              <span className="font-semibold text-gray-900">{user.email}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Designation:</span>
              <span className="font-semibold text-gray-900">{user.designation || '-'}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Commission:</span>
              <span className="font-semibold text-gray-900">{user.commissionPercentage || 0}%</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Immediate Superior:</span>
              <span className="font-semibold text-gray-900">{user.parent?.userIdentifier || '-'}</span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Main Team:</span>
              <span className="font-semibold text-gray-900">
                {teams.find(t => t.id === user.teamId)?.name || '-'}
              </span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Date of Joining:</span>
              <span className="font-semibold text-gray-900">
                {user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="mb-3 flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-500">Status:</span>
              <span className="font-semibold text-yellow-600">{user.status.replace('_', ' ')}</span>
            </div>
            <div className="mb-3 flex justify-between">
              <span className="font-medium text-gray-500">Temporary Password:</span>
              <span className="select-all rounded bg-gray-200 px-2 font-mono font-bold tracking-wider text-red-600">
                {temporaryPassword}
              </span>
            </div>
            {user.whatsappNumber && (
              <div className="mb-3 flex justify-between border-t border-gray-200 pt-3">
                <span className="font-medium text-gray-500 mt-2">Send Credentials:</span>
                <button
                  onClick={() => handleSendCredentials(user, temporaryPassword)}
                  disabled={sendingCredentials}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {sendingCredentials ? 'Opening WhatsApp...' : 'Send Credentials via WhatsApp'}
                </button>
              </div>
            )}
            {credentialMessage && (
              <div className={`mt-2 p-3 text-sm rounded ${credentialStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {credentialMessage}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg bg-yellow-50 p-4 text-left text-sm text-yellow-800">
            <p className="mb-2 font-semibold">Important Instructions:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>This account requires approval before the Associate can log in (if created by non-MD).</li>
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

          {/* 5. Official Details */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">5. Official Details</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Designation *</label>
                <select name="designation" required className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.designation} onChange={handleChange}>
                  <option value="">Select Designation</option>
                  {DESIGNATIONS.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Commission Percentage</label>
                <div className="relative">
                  <input 
                    type="text" 
                    readOnly 
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 outline-none text-gray-600 font-medium" 
                    value={formData.designation ? `${currentCommission}%` : 'Select Designation'} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">READ ONLY</div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date of Joining</label>
                <input type="date" name="dateOfJoining" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.dateOfJoining} onChange={handleChange} />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
                <input type="text" name="department" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.department} onChange={handleChange} />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Work Location</label>
                <input type="text" name="workLocation" className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold" value={formData.workLocation} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* 6. Hierarchy Placement */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-800 border-b pb-2">6. Hierarchy Placement</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Referral User ID</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. RS-1024"
                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold uppercase" 
                    value={referralUserId} 
                    onChange={(e) => setReferralUserId(e.target.value.toUpperCase())}
                    onBlur={handleReferralSearch}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleReferralSearch())}
                  />
                  <button type="button" onClick={handleReferralSearch} className="rounded-md bg-gray-100 px-4 text-gray-600 hover:bg-gray-200" disabled={referralLoading}>
                    <Search size={18} />
                  </button>
                </div>
                {referralError && <p className="mt-1 text-sm text-red-600">{referralError}</p>}
                
                {referralUser && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Reports To:</h4>
                    <div className="flex items-center gap-3">
                      <Avatar name={referralUser.name} imageUrl={referralUser.profileImageUrl} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{referralUser.name}</p>
                        <p className="text-xs text-gray-500">User ID: {referralUser.userIdentifier}</p>
                        <p className="text-xs text-gray-500">Designation: {referralUser.designation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Team</label>
                {referralUser ? (
                  <div className="relative">
                    <select 
                      disabled 
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 outline-none text-gray-600 appearance-none"
                      value={formData.teamId}
                    >
                      <option value="">No Team Assigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">AUTO-ASSIGNED</div>
                    <p className="mt-1 text-xs text-gray-500">Team automatically inherited from referral user.</p>
                  </div>
                ) : (
                  <select 
                    name="teamId" 
                    className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    value={formData.teamId}
                    onChange={handleChange}
                  >
                    <option value="">Select Team (Optional)</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
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
