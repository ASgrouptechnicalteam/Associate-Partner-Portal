import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Gift, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const EditOffer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAudience: 'ALL',
    projectId: '',
    targetBookings: '',
    reward: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [offerRes, projRes] = await Promise.all([
        api.get(`/v1/offers/${id}`),
        api.get('/projects')
      ]);
      
      const offer = offerRes.data.data;
      setForm({
        title: offer.title,
        description: offer.description || '',
        targetAudience: offer.targetAudience,
        projectId: offer.projectId || '',
        targetBookings: offer.targetBookings ? offer.targetBookings.toString() : '',
        reward: offer.reward || '',
        status: offer.status,
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : ''
      });
      setProjects(projRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/v1/offers/${id}`, {
        ...form,
        targetBookings: form.targetBookings ? parseInt(form.targetBookings) : null,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      });
      navigate('/offers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update offer');
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mr-4 p-2 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy flex items-center">
            <Gift className="w-6 h-6 mr-2 text-action-blue" />
            Edit Offer
          </h1>
          <p className="text-sm text-gray-500">Update promotional offer details</p>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 border-b border-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Title *</label>
              <input
                type="text"
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.targetAudience}
                onChange={e => setForm({...form, targetAudience: e.target.value})}
              >
                <option value="ALL">All Associates & Managers</option>
                <option value="ASSOCIATE">Associates Only</option>
                <option value="CHANNEL_PARTNER_MANAGER">Managers Only</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Specific Project (Optional)</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.projectId}
                onChange={e => setForm({...form, projectId: e.target.value})}
              >
                <option value="">-- Apply to All Projects --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EXPIRED">Expired</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows={3}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Bookings (Optional)</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.targetBookings}
                onChange={e => setForm({...form, targetBookings: e.target.value})}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward</label>
              <input
                type="text"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.reward}
                onChange={e => setForm({...form, reward: e.target.value})}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.startDate}
                onChange={e => setForm({...form, startDate: e.target.value})}
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={form.endDate}
                onChange={e => setForm({...form, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-subtle space-x-3">
            <Button
              type="button"
              onClick={() => navigate('/offers')}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditOffer;
