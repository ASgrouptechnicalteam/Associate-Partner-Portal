import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Car, CheckCircle, XCircle, CreditCard, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { getStaticUrl } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface TravelRequest {
  id: string;
  requesterId: string;
  travelDate: string;
  fromLocation: string;
  toLocation: string;
  purpose: string;
  projectId?: string;
  customerName?: string;
  distanceKm: string;
  travelMode: string;
  amountRequested: string;
  billUrl?: string;
  notes?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  paidBy?: string;
  paidAt?: string;
  amountPaid?: string;
  paymentNotes?: string;
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; name: string; associateId?: string; email: string };
  project?: { id: string; name: string; code: string };
}

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; icon: React.ReactNode; color: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  PENDING:   { label: 'Draft / Pending',  bgClass: 'bg-yellow-50',  textClass: 'text-yellow-700',  icon: <Clock size={16} />, color: 'warning' },
  MD_REVIEW: { label: 'Under MD Review',  bgClass: 'bg-blue-50',    textClass: 'text-blue-700',    icon: <Clock size={16} />, color: 'info' },
  APPROVED:  { label: 'Approved',          bgClass: 'bg-green-50',   textClass: 'text-green-700',   icon: <CheckCircle size={16} />, color: 'success' },
  PAID:      { label: 'Paid',              bgClass: 'bg-purple-50',  textClass: 'text-purple-700',  icon: <CreditCard size={16} />, color: 'info' },
  REJECTED:  { label: 'Rejected',          bgClass: 'bg-red-50',     textClass: 'text-red-700',     icon: <XCircle size={16} />, color: 'danger' },
};

const TRAVEL_MODE_LABELS: Record<string, string> = {
  OWN_VEHICLE: 'Own Vehicle', TAXI: 'Taxi / Cab',
  PUBLIC_TRANSPORT: 'Public Transport', AUTO: 'Auto-rickshaw', OTHER: 'Other',
};

const TravelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMD = user?.role === 'MD';

  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Review form state (MD only)
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Payment form state (MD only)
  const [showPayForm, setShowPayForm] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/v1/travel/${id}`);
      setRequest(res.data.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load travel request');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!request) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/v1/travel/${id}/submit`);
      fetchRequest();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/v1/travel/${id}/review`, { decision: 'APPROVED' });
      fetchRequest();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please enter a rejection reason');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/v1/travel/${id}/review`, { decision: 'REJECTED', rejectionReason });
      setShowRejectForm(false);
      fetchRequest();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!amountPaid || Number(amountPaid) <= 0) {
      setActionError('Please enter a valid payment amount');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await api.patch(`/v1/travel/${id}/pay`, { amountPaid: Number(amountPaid), paymentNotes });
      setShowPayForm(false);
      fetchRequest();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to mark paid');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-gold border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <button onClick={() => navigate('/travel')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-navy">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
    </div>
  );

  if (!request) return null;

  const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG['PENDING'];
  const isOwner = request.requesterId === user?.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/travel')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary-navy">Travel Request</h1>
          <p className="text-xs text-gray-400 font-mono">{request.id.slice(0, 8)}</p>
        </div>
        <Badge variant={cfg.color} className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          {cfg.icon} {cfg.label}
        </Badge>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {actionError}
        </div>
      )}

      {/* Details Card */}
      <Card padding="none" className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-navy to-deep-navy p-6">
          <div className="flex items-center gap-2 text-white">
            <Car size={20} className="text-brand-gold" />
            <span className="font-semibold text-lg">{request.fromLocation} → {request.toLocation}</span>
          </div>
          <p className="text-white/70 text-sm mt-1">{request.purpose}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <InfoField label="Travel Date" value={new Date(request.travelDate).toLocaleDateString('en-IN', { dateStyle: 'long' })} />
            <InfoField label="Mode" value={TRAVEL_MODE_LABELS[request.travelMode] || request.travelMode} />
            <InfoField label="Distance" value={`${Number(request.distanceKm).toFixed(1)} km`} />
            <InfoField label="Amount Requested" value={formatCurrency(request.amountRequested)} highlight />
            {request.customerName && <InfoField label="Customer" value={request.customerName} />}
            {request.project && <InfoField label="Project" value={`${request.project.name} (${request.project.code})`} />}
          </div>

          {request.notes && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Notes</p>
              <p>{request.notes}</p>
            </div>
          )}

          {/* Bill */}
          {request.billUrl && (
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Supporting Bill</p>
              <a
                href={getStaticUrl(request.billUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-gold hover:underline font-medium"
              >
                <ExternalLink size={14} /> View Bill Document
              </a>
            </div>
          )}

          {/* Rejection reason */}
          {request.status === 'REJECTED' && request.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-600">{request.rejectionReason}</p>
              {request.reviewedAt && (
                <p className="text-xs text-red-400 mt-2">Reviewed on {new Date(request.reviewedAt).toLocaleString('en-IN')}</p>
              )}
            </div>
          )}

          {/* Payment info */}
          {request.status === 'PAID' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-purple-700 mb-1">Payment Information</p>
              <p className="text-sm text-purple-600">Amount Paid: {formatCurrency(request.amountPaid)}</p>
              {request.paymentNotes && <p className="text-xs text-purple-500 mt-1">{request.paymentNotes}</p>}
              {request.paidAt && <p className="text-xs text-purple-400 mt-1">Paid on {new Date(request.paidAt).toLocaleString('en-IN')}</p>}
            </div>
          )}

          {/* Requester info (MD view) */}
          {isMD && request.requester && (
            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 space-y-1">
              <p>Requested by: <span className="text-gray-600 font-medium">{request.requester.name}</span> ({request.requester.email})</p>
              <p>Created: {new Date(request.createdAt).toLocaleString('en-IN')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {/* Associate: Submit */}
        {isOwner && request.status === 'PENDING' && (
          <Button
            onClick={handleSubmit}
            isLoading={actionLoading}
            size="lg"
            fullWidth
          >
            Submit for MD Review
          </Button>
        )}

        {/* MD: Approve / Reject */}
        {isMD && request.status === 'MD_REVIEW' && (
          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              isLoading={actionLoading}
              variant="success"
              className="flex-1"
            >
              ✓ Approve
            </Button>
            <Button
              onClick={() => setShowRejectForm(v => !v)}
              disabled={actionLoading}
              variant="danger"
              className="flex-1"
            >
              ✕ Reject
            </Button>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <label className="block text-sm font-semibold text-red-700">Rejection Reason <span className="text-red-500">*</span></label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Explain why this request is being rejected"
              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <button
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
            >
              {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        )}

        {/* MD: Mark Paid */}
        {isMD && request.status === 'APPROVED' && (
          <Button
            onClick={() => setShowPayForm(v => !v)}
            fullWidth
            size="lg"
          >
            Mark as Paid
          </Button>
        )}

        {showPayForm && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
            <label className="block text-sm font-semibold text-purple-700">Payment Amount (₹) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              placeholder={`Requested: ${formatCurrency(request.amountRequested)}`}
              min="1"
              step="0.01"
              className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <textarea
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
              rows={2}
              placeholder="Payment notes (optional)"
              className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
            <button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
            >
              {actionLoading ? 'Processing…' : 'Confirm Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoField: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className={`font-semibold ${highlight ? 'text-brand-gold text-lg' : 'text-primary-navy text-sm'}`}>{value}</p>
  </div>
);

export default TravelDetails;
