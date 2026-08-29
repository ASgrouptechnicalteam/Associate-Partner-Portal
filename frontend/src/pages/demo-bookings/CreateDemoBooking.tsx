import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function CreateDemoBooking() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    projectId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    scheduledDate: '',
    scheduledTime: '',
    remarks: '',
    isDemo: false
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects'); // from phase 3
        setProjects(res.data.data.filter((p: any) => p.status === 'ACTIVE'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const dataToSubmit = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
      };
      console.log('Submitting data:', dataToSubmit);
      const res = await api.post('/v1/demo-bookings', dataToSubmit);
      console.log('Response:', res.data);
      navigate(`/demo-bookings/${res.data.data.id}`);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to schedule site booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-navy" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card padding="lg">
        <h3 className="text-lg leading-6 font-medium text-primary-navy">
          Schedule Site Booking
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Enter the customer details and schedule a property booking.</p>
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Project</label>
              <select
                id="projectId"
                name="projectId"
                required
                value={formData.projectId}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  name="customerName"
                  id="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="mt-1 shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Customer Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  id="customerPhone"
                  required
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="mt-1 shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Customer Email (Optional)</label>
              <input
                type="email"
                name="customerEmail"
                id="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="mt-1 shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">Booking Date</label>
                <input
                  type="date"
                  name="scheduledDate"
                  id="scheduledDate"
                  required
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className="mt-1 shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">Booking Time</label>
                <input
                  type="time"
                  name="scheduledTime"
                  id="scheduledTime"
                  required
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="mt-1 shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                value={formData.remarks}
                onChange={handleChange}
                className="mt-1 shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isDemo"
                name="isDemo"
                checked={formData.isDemo}
                onChange={(e) => setFormData({ ...formData, isDemo: e.target.checked })}
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
              <label htmlFor="isDemo" className="ml-2 block text-sm font-medium text-gray-900">
                This is a Book Demo request (Product Demonstration)
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle">
              <Button
                type="button"
                onClick={() => navigate('/demo-bookings')}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
              >
                Schedule Booking
              </Button>
            </div>
          </form>
      </Card>
    </div>
  );
}
