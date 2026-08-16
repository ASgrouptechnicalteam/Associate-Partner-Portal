import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePwa } from '../../context/PwaContext';
import { Camera, Save, AlertCircle, CheckCircle2, FileText, User, CreditCard, HeartPulse, Building2, Smartphone, X } from 'lucide-react';
import api, { getStaticUrl } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { isInstallable, isInstalled, isInstalling, installApp } = usePwa();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    secondaryPhone: user?.secondaryPhone || '',
    whatsappNumber: user?.whatsappNumber || '',
    currentAddress: user?.currentAddress || '',
    permanentAddress: user?.permanentAddress || '',
    bloodGroup: user?.bloodGroup || '',
    panNumber: user?.panNumber || '',
    aadhaarNumber: user?.aadhaarNumber || '',
    bankName: user?.bankName || '',
    accountNumber: user?.accountNumber || '',
    ifscCode: user?.ifscCode || '',
    branchName: user?.branchName || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactRelation: user?.emergencyContactRelation || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
  });

  const [photoPreview, setPhotoPreview] = useState(
    user?.profileImageUrl ? getStaticUrl(user.profileImageUrl) : null
  );

  React.useEffect(() => {
    if (user?.profileImageUrl) {
      setPhotoPreview(getStaticUrl(user.profileImageUrl));
    }
  }, [user?.profileImageUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be 10 MB or less.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/users/profile/me/photo', formData);
      
      if (res.data.success) {
        setPhotoPreview(getStaticUrl(res.data.fileUrl));
        setSuccess('Profile photo updated successfully');
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile photo');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.patch('/users/profile/me', formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstallPWA = async () => {
    if (isInstalled) {
      return;
    }
    
    if (isInstallable) {
      await installApp();
    } else {
      setError("Installation is currently unavailable in this browser environment. You may need to use a supported browser like Chrome or Edge.");
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'identification', label: 'Identification', icon: FileText },
    { id: 'banking', label: 'Banking', icon: CreditCard },
    { id: 'emergency', label: 'Emergency', icon: HeartPulse },
    { id: 'official', label: 'Official Details', icon: Building2 },
    { id: 'security', label: 'Security', icon: FileText }, // Reusing FileText or another icon like Lock if imported
  ];

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      
      {/* Header section with photo */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div 
              className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-gray-100 cursor-pointer"
              onClick={() => { if (photoPreview) setIsPreviewOpen(true); }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="h-full w-full object-cover transition-transform hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-gold/10 text-brand-gold">
                  <User size={40} />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary-navy p-2 text-white shadow-md hover:bg-deep-navy transition-colors"
              title="Upload Photo"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 font-medium mt-1">{user.role.replace('_', ' ')} • {user.associateId || 'No Code Assigned'}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            onClick={isInstalled ? undefined : handleInstallPWA}
            variant={isInstalled ? "ghost" : "outline"}
            leftIcon={isInstalled ? <CheckCircle2 size={18} className="text-brand-green" /> : <Smartphone size={18} />}
            disabled={isInstalled || isInstalling}
            className={isInstalled ? "text-brand-green font-medium cursor-default opacity-100 bg-brand-green/10 border-transparent hover:bg-brand-green/10 hover:border-transparent" : ""}
          >
            {isInstalled ? 'App Installed' : isInstalling ? 'Installing...' : 'Install App'}
          </Button>
          
          {isEditing ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsEditing(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfile}
                isLoading={isSaving}
                leftIcon={<Save size={18} />}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700 border border-red-100">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700 border border-green-100 shadow-sm">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      {isInstalled && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-[#F0FDF4] p-4 text-[#166534] border border-[#DCFCE7] shadow-sm">
          <CheckCircle2 size={20} className="shrink-0" />
          <span className="font-medium">You have already installed the app.</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-primary-navy text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <Card padding="lg" className="flex-1">
          
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Full Name" name="name" value={formData.name} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Primary Phone" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Secondary Phone" name="secondaryPhone" value={formData.secondaryPhone} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="WhatsApp Number" name="whatsappNumber" value={formData.whatsappNumber} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Email Address" name="email" value={user.email} isEditing={false} onChange={handleInputChange} hint="Email cannot be changed" />
                <Field label="Blood Group" name="bloodGroup" value={formData.bloodGroup} isEditing={isEditing} onChange={handleInputChange} />
                <div className="md:col-span-2">
                  <Field label="Current Address" name="currentAddress" value={formData.currentAddress} isEditing={isEditing} onChange={handleInputChange} isTextArea />
                </div>
                <div className="md:col-span-2">
                  <Field label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} isEditing={isEditing} onChange={handleInputChange} isTextArea />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identification' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <h2 className="text-xl font-bold text-gray-900">Identification Details</h2>
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertCircle size={12} /> Sensitive
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field 
                  label="PAN Number" 
                  name="panNumber" 
                  value={formData.panNumber} 
                  isEditing={isEditing} 
                  onChange={handleInputChange}
                  isSensitive
                />
                <Field 
                  label="Aadhaar Number" 
                  name="aadhaarNumber" 
                  value={formData.aadhaarNumber} 
                  isEditing={isEditing} 
                  onChange={handleInputChange}
                  isSensitive
                />
              </div>
            </div>
          )}

          {activeTab === 'banking' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <h2 className="text-xl font-bold text-gray-900">Payroll & Banking</h2>
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertCircle size={12} /> Sensitive
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Bank Name" name="bankName" value={formData.bankName} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Account Number" name="accountNumber" value={formData.accountNumber} isEditing={isEditing} onChange={handleInputChange} isSensitive />
                <Field label="IFSC Code" name="ifscCode" value={formData.ifscCode} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Branch Name" name="branchName" value={formData.branchName} isEditing={isEditing} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Contact Person Name" name="emergencyContactName" value={formData.emergencyContactName} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Relationship" name="emergencyContactRelation" value={formData.emergencyContactRelation} isEditing={isEditing} onChange={handleInputChange} />
                <Field label="Phone Number" name="emergencyContactPhone" value={formData.emergencyContactPhone} isEditing={isEditing} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {activeTab === 'official' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Official Employment Details</h2>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  These fields are system-generated and managed by administrators.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Associate Code" name="associateId" value={user.associateId || 'N/A'} isEditing={false} onChange={handleInputChange} />
                <Field label="Role" name="role" value={user.role.replace('_', ' ')} isEditing={false} onChange={handleInputChange} />
                <Field label="Job Title" name="jobTitle" value={user.jobTitle || 'N/A'} isEditing={false} onChange={handleInputChange} />
                <Field label="Department" name="department" value={user.department || 'N/A'} isEditing={false} onChange={handleInputChange} />
                <Field label="Work Location" name="workLocation" value={user.workLocation || 'N/A'} isEditing={false} onChange={handleInputChange} />
                <Field label="Commission Percentage" name="commissionPercentage" value={user.commissionPercentage ? `${user.commissionPercentage}%` : 'N/A'} isEditing={false} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Security Settings</h2>
              <ChangePasswordForm />
            </div>
          )}

        </Card>
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && photoPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Close preview"
            >
              <X size={32} />
            </button>
            <img 
              src={photoPreview} 
              alt="Profile Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for Change Password
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{type: 'error' | 'success', msg: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    
    setIsSubmitting(true);
    setStatus(null);
    
    try {
      const res = await api.post('/auth/change-initial-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setStatus({ type: 'success', msg: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {status && (
        <div className={`p-3 rounded-lg text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status.msg}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
        <input 
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input 
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <input 
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
        />
      </div>
      <Button type="submit" isLoading={isSubmitting}>Change Password</Button>
    </form>
  );
}

// Helper component for fields
function Field({ 
  label, 
  name, 
  value, 
  isEditing, 
  onChange, 
  isTextArea = false,
  isSensitive = false,
  hint = ''
}: { 
  label: string, 
  name: string, 
  value: string, 
  isEditing: boolean, 
  onChange: (e: any) => void,
  isTextArea?: boolean,
  isSensitive?: boolean,
  hint?: string
}) {
  
  // Format sensitive value if not editing
  const displayValue = !isEditing && isSensitive && value
    ? '••••' + value.slice(-4)
    : value;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {isEditing ? (
        isTextArea ? (
            <textarea
              name={name}
              value={value}
              onChange={onChange}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-gray-900 focus:border-action-blue focus:outline-none focus:ring-2 focus:ring-action-blue/20"
              rows={3}
            />
          ) : (
            <input
              type="text"
              name={name}
              value={value}
              onChange={onChange}
              className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-gray-900 focus:border-action-blue focus:outline-none focus:ring-2 focus:ring-action-blue/20"
            />
          )
        ) : (
          <div className="w-full rounded-xl bg-app-bg px-4 py-3 text-gray-900 min-h-[48px] border border-transparent">
            {displayValue || <span className="text-gray-400 italic">Not provided</span>}
          </div>
      )}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
