import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Booking {
  id: string;
  customerName: string;
  project: { name: string; code: string };
  inventoryUnit: { unitNumber: string };
  bookingDate: string;
  status: string;
}

interface ReviewRequest {
  id: string;
  token: string;
  customerName: string;
  requestDate: string;
  status: string;
  project: { name: string };
  booking: { inventoryUnit: { unitNumber: string } };
}

const ReviewRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [interactionSummary, setInteractionSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsRes, bookingsRes] = await Promise.all([
        api.get('/v1/reviews/requests'),
        api.get('/v1/bookings/my-bookings')
      ]);
      setRequests(reqsRes.data.data);
      setBookings(bookingsRes.data.data.filter((b: Booking) => b.status === 'VERIFIED'));
    } catch (err: any) {
      console.error('Failed to load review requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError('Please select a verified booking');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post('/v1/reviews/requests', {
        bookingId: selectedBookingId,
        interactionSummary
      });
      setShowModal(false);
      setSelectedBookingId('');
      setInteractionSummary('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create review request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SUBMITTED': return 'success';
      default: return 'neutral';
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/public/reviews/${token}`;
    navigator.clipboard.writeText(url);
    alert('Review link copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Review Requests</h1>
          <p className="mt-1 text-sm font-medium text-muted-text">
            Generate and manage customer review links for verified bookings.
          </p>
        </div>
        
        {user?.role === 'ASSOCIATE' && (
          <Button
            onClick={() => setShowModal(true)}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Generate Request
          </Button>
        )}
      </div>

      <Card padding="none" className="overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Customer</th>
                <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Project / Unit</th>
                <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-muted-text uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold border-t-transparent mx-auto"></div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500 font-medium">
                    <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    No review requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(req.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-primary-navy">{req.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{req.project?.name}</div>
                      <div className="text-xs text-muted-text mt-0.5">Unit: {req.booking?.inventoryUnit?.unitNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(req.status)}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => copyToClipboard(req.token)}
                        className="text-action-blue hover:text-blue-900 bg-action-blue/10 p-2 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                        title="Copy Public Link"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Copy Link</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-primary-navy">Generate Review Request</h2>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Verified Booking</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                  required
                >
                  <option value="">Select a verified booking...</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.customerName} - {b.project.name} (Unit: {b.inventoryUnit.unitNumber})
                    </option>
                  ))}
                </select>
                {bookings.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No verified bookings available.</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Interaction Summary (Optional)</label>
                <textarea
                  value={interactionSummary}
                  onChange={(e) => setInteractionSummary(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                  rows={3}
                  placeholder="Brief note about this customer interaction..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || bookings.length === 0}
                  isLoading={submitting}
                >
                  Generate Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewRequests;
