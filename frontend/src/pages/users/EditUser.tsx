import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';

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

const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teams, setTeams] = useState<any[]>([]);
  
  // Referral State
  const [referralUserId, setReferralUserId] = useState('');
  const [referralUser, setReferralUser] = useState<any>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  // Marketing Director Team Head State
  const [headedTeamId, setHeadedTeamId] = useState('');

  const [formData, setFormData] = useState({
    userIdentifier: '',
    status: '',
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
    designation: '',
    teamId: '',
    role: ''
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        if (response.data.success) {
          const user = response.data.user;
          
          setFormData({
            userIdentifier: user.userIdentifier || '',
            status: user.status || '',
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
            designation: user.designation || '',
            teamId: user.teamId || '',
            role: user.role || ''
          });

          // Pre-populate referral user if parentId is set (but not for Team Heads)
          if (user.parent) {
             setReferralUserId(user.parent.userIdentifier || '');
             setReferralUser(user.parent);
          }

          // Pre-populate headedTeamId if user is a team head
          if (teams.length > 0) {
            const headedTeam = teams.find(t => t.headUserId === user.id);
            if (headedTeam) {
              setHeadedTeamId(headedTeam.id);
            }
          } else {
             // If teams haven't loaded yet, we'll need to fetch the team separately
             api.get('/team/main-teams').then(res => {
                 if (res.data.success) {
                     const headedTeam = res.data.data.find((t: any) => t.headUserId === user.id);
                     if (headedTeam) setHeadedTeamId(headedTeam.id);
                 }
             });
          }
        }
      } catch (err: any) {
        setError('Failed to load associate details');
      } finally {
        setFetching(false);
      }
    };
    if (teams.length > 0) {
       fetchUser();
    } else {
       // if teams fails to load or takes long, still fetch user
       fetchUser();
    }
  }, [id, teams.length === 0]); // Dependency trick to run once, but also after teams might load initially

  const handleReferralSearch = async () => {
    if (!referralUserId.trim()) {
      setReferralUser(null);
      setReferralError(null);
      // We don't clear teamId automatically on edit unless user wants to.
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
          if (found.id === id) {
             setReferralError('Cannot assign self as referral');
          } else {
             setReferralUser(found);
             // Automatically set team from referral
             if (found.teamId) {
               setFormData(prev => ({ ...prev, teamId: found.teamId }));
             }
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

  const currentCommission = DESIGNATIONS.find(d => d.name === formData.designation)?.commission || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        commissionPercentage: currentCommission
      };

      if (referralUser) {
        payload.referralUserId = referralUser.userIdentifier;
      } else if (!referralUserId) {
        payload.referralUserId = null; // Clear parent if intentionally emptied
      }

      if (formData.designation === 'Marketing Director') {
        if (headedTeamId) {
           payload.headedTeamId = headedTeamId;
        } else {
           payload.headedTeamId = null;
        }
      }

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

  // Check roles based on backend logic. Usually currentUser.role can be string or object.
  const userRoleStr = typeof currentUser?.role === 'string' ? currentUser.role : (currentUser?.role as any)?.name;
  const canEditSensitive = userRoleStr === 'MD' || userRoleStr === 'CHANNEL_PARTNER_MANAGER' || currentUser?.id === id;
  const canAssignTeamHead = userRoleStr === 'MD' || userRoleStr === 'CHANNEL_PARTNER_MANAGER';

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
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 bg-gray-50 p-4 rounded-md border border-gray-100 mb-6">
             <div>
               <label className="mb-1 block text-sm font-medium text-gray-500">User ID</label>
               <div className="text-lg font-bold text-primary-gold">{formData.userIdentifier}</div>
             </div>
             <div>
               <label className="mb-1 block text-sm font-medium text-gray-500">Status</label>
               <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                  className="rounded-md border border-gray-300 px-3 py-1 outline-none focus:border-brand-gold text-sm"
               >
                 <option value="ACTIVE">ACTIVE</option>
                 <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                 <option value="INACTIVE">INACTIVE</option>
                 <option value="SUSPENDED">SUSPENDED</option>
               </select>
             </div>
          </div>

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

          {/* 7. Marketing Director Team Head Assignment */}
          {formData.designation === 'Marketing Director' && canAssignTeamHead && (
             <section className="rounded-lg border-2 border-brand-gold bg-yellow-50/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-primary-gold border-b border-brand-gold/20 pb-2">7. Team Head Assignment</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Because this associate is a Marketing Director, you may optionally assign them as the Head of a Main Team.
                  Doing so will set them as the top organizational root for that team.
                </p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                   <div>
                     <label className="mb-1 block text-sm font-medium text-gray-700">Select Main Team</label>
                     <select 
                       value={headedTeamId}
                       onChange={(e) => setHeadedTeamId(e.target.value)}
                       className="w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold bg-white"
                     >
                       <option value="">-- No Team Head Assignment --</option>
                       {teams.map(t => (
                         <option key={t.id} value={t.id}>{t.name}</option>
                       ))}
                     </select>
                   </div>
                </div>
             </section>
          )}

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
