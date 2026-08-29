import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

interface BookingDetail {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  expectedAmount: string;
  bookingAmount: string;
  paymentMode: string;
  bookingDate: string;
  notes: string;
  status: string;
  rejectionReason: string | null;
  project: { name: string; code: string };
  inventoryUnit: { unitNumber: string; propertyType: string };
  associate?: {
    name: string;
    userId: string;
    profileImageUrl?: string;
  };
}

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/v1/bookings/${id}`);
        setBooking(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const updateStatus = async (status: string, reason?: string) => {
    try {
      await api.patch(`/v1/bookings/${id}/status`, { status, reason });
      setBooking((prev) => prev ? { ...prev, status, rejectionReason: reason || null } : null);
      setShowRejectModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    switch (status) {
      case 'SUBMITTED': return 'info';
      case 'UNDER_REVIEW': return 'warning';
      case 'VERIFIED': return 'success';
      case 'PAYMENT_PENDING': return 'warning';
      case 'REJECTED':
      case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading booking details...</div>;
  if (error || !booking) return <div className="p-8 text-center text-red-500">{error}</div>;

  const isManager = user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-primary-navy">
        <ArrowLeft size={20} /> Back
      </button>

      <Card padding="lg" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-navy">Booking: {booking.inventoryUnit.unitNumber}</h1>
            <p className="text-muted-text mt-1">Project: {booking.project.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(booking.status)}>
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary-navy mb-4">Customer Details</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500">Name:</span> {booking.customerName}</p>
                <p><span className="text-gray-500">Phone:</span> {booking.customerPhone}</p>
                <p><span className="text-gray-500">Email:</span> {booking.customerEmail || 'N/A'}</p>
                <p><span className="text-gray-500">Address:</span> {booking.customerAddress || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-primary-navy mb-4">Associate Details</h3>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <Avatar name={booking.associate?.name || 'Unknown'} imageUrl={booking.associate?.profileImageUrl} size="md" />
                  <div>
                    <p className="font-bold text-deep-navy">{booking.associate?.name}</p>
                    <p className="text-xs text-gray-500">{booking.associate?.userId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary-navy mb-4">Financial Details</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500">Expected Amount:</span> {formatCurrency(booking.expectedAmount)}</p>
                <p><span className="text-gray-500">Booking Amount Paid:</span> {formatCurrency(booking.bookingAmount)}</p>
                <p><span className="text-gray-500">Payment Mode:</span> {booking.paymentMode}</p>
                <p><span className="text-gray-500">Booking Date:</span> {new Date(booking.bookingDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            {booking.notes && (
              <div>
                <h3 className="text-lg font-bold text-primary-navy mb-4">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">{booking.notes}</p>
              </div>
            )}
            
            {booking.rejectionReason && (
              <div>
                <h3 className="text-lg font-bold text-red-700 mb-4">Rejection Reason</h3>
                <p className="text-sm text-red-800 bg-red-50 p-4 rounded-lg border border-red-100">{booking.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Manager Actions */}
        {isManager && (booking.status === 'SUBMITTED' || booking.status === 'UNDER_REVIEW') && (
          <div className="pt-6 border-t border-border-subtle flex gap-4 justify-end">
            <Button
              onClick={() => setShowRejectModal(true)}
              variant="danger"
              leftIcon={<X size={18} />}
            >
              Reject
            </Button>
            
            {booking.status === 'SUBMITTED' && (
              <Button
                onClick={() => updateStatus('UNDER_REVIEW')}
                variant="secondary"
                leftIcon={<Check size={18} />}
              >
                Start Review
              </Button>
            )}

            {booking.status === 'UNDER_REVIEW' && (
              <Button
                onClick={() => updateStatus('VERIFIED')}
                variant="success"
                leftIcon={<Check size={18} />}
              >
                Verify & Confirm
              </Button>
            )}
          </div>
        )}
      </Card>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-primary-navy">Reject Booking</h3>
            <p className="text-sm text-gray-500">Please provide a reason for rejecting this booking.</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              rows={4}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowRejectModal(false)}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateStatus('REJECTED', rejectReason)}
                disabled={!rejectReason.trim()}
                variant="danger"
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
