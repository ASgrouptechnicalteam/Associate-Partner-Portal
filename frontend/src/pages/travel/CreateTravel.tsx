import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Project {
  id: string;
  name: string;
  code: string;
}

const TRAVEL_MODES = [
  { value: 'OWN_VEHICLE',      label: 'Own Vehicle' },
  { value: 'TAXI',             label: 'Taxi / Cab' },
  { value: 'PUBLIC_TRANSPORT', label: 'Public Transport' },
  { value: 'AUTO',             label: 'Auto-rickshaw' },
  { value: 'OTHER',            label: 'Other' },
];

const CreateTravel: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    travelDate:      new Date().toISOString().split('T')[0],
    fromLocation:    '',
    toLocation:      '',
    purpose:         '',
    projectId:       '',
    customerName:    '',
    distanceKm:      '',
    travelMode:      'OWN_VEHICLE',
    amountRequested: '',
    notes:           '',
  });

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Bill file must be under 10 MB');
        return;
      }
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Only images and PDF files are allowed for the bill');
        return;
      }
    }
    setBillFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fromLocation.trim() || !form.toLocation.trim()) {
      return setError('From and To locations are required');
    }
    if (!form.purpose.trim()) return setError('Purpose is required');
    if (!form.distanceKm || Number(form.distanceKm) <= 0) return setError('Distance must be greater than 0');
    if (!form.amountRequested || Number(form.amountRequested) <= 0) return setError('Amount must be greater than 0');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('travelDate', form.travelDate);
      formData.append('fromLocation', form.fromLocation);
      formData.append('toLocation', form.toLocation);
      formData.append('purpose', form.purpose);
      if (form.projectId) formData.append('projectId', form.projectId);
      if (form.customerName) formData.append('customerName', form.customerName);
      formData.append('distanceKm', form.distanceKm);
      formData.append('travelMode', form.travelMode);
      formData.append('amountRequested', form.amountRequested);
      if (form.notes) formData.append('notes', form.notes);
      if (billFile) formData.append('bill', billFile);

      await api.post('/v1/travel', formData);

      navigate('/travel');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create travel request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => navigate('/travel')}
          variant="ghost"
          className="px-2"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">New Travel Request</h1>
          <p className="text-sm text-gray-500">Fill in your travel details for reimbursement</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card padding="lg" className="space-y-6">
          {/* Travel Details */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Travel Details</legend>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date <span className="text-red-500">*</span></label>
              <input
              type="date"
              name="travelDate"
              value={form.travelDate}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="fromLocation"
                value={form.fromLocation}
                onChange={handleChange}
                placeholder="Departure location"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="toLocation"
                value={form.toLocation}
                onChange={handleChange}
                placeholder="Destination"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose <span className="text-red-500">*</span></label>
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              placeholder="Describe the purpose of travel"
              required
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Travel Mode <span className="text-red-500">*</span></label>
              <select
                name="travelMode"
                value={form.travelMode}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                {TRAVEL_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="distanceKm"
                value={form.distanceKm}
                onChange={handleChange}
                placeholder="e.g. 45.5"
                min="0.1"
                step="0.1"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </div>
        </fieldset>

        {/* Optional Details */}
        <fieldset className="space-y-4 border-t border-gray-100 pt-6">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Project & Customer (Optional)</legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Related Project</label>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="">-- None --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Client / prospect name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </div>
        </fieldset>

        {/* Financial */}
        <fieldset className="space-y-4 border-t border-gray-100 pt-6">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Financial</legend>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested (₹) <span className="text-red-500">*</span></label>
            <input
              type="number"
              name="amountRequested"
              value={form.amountRequested}
              onChange={handleChange}
              placeholder="e.g. 850"
              min="1"
              step="0.01"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          {/* Bill Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Bill</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand-gold transition-colors"
            >
              {billFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-green-600 font-medium">{billFile.name}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setBillFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload size={24} className="mx-auto text-gray-300" />
                  <p className="text-sm text-gray-500">Click to upload bill (image or PDF, max 10 MB)</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="border-t border-gray-100 pt-6">
          <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Notes</legend>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Additional notes or comments (optional)"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
          />
        </fieldset>

        <div className="flex gap-3 border-t border-gray-100 pt-6">
          <Button
            type="button"
            onClick={() => navigate('/travel')}
            variant="ghost"
            className="flex-1 border-gray-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1"
          >
            Save as Draft
          </Button>
        </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateTravel;
