import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, Filter, Clock, CheckCircle, XCircle, CreditCard, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface TravelRequest {
  id: string;
  travelDate: string;
  fromLocation: string;
  toLocation: string;
  purpose: string;
  travelMode: string;
  amountRequested: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  requester?: { name: string; associateId: string };
  project?: { name: string; code: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; icon: React.ReactNode }> = {
  PENDING:    { label: 'Pending',    color: 'warning',   icon: <Clock size={12} /> },
  MD_REVIEW:  { label: 'In Review',  color: 'info',       icon: <Clock size={12} /> },
  APPROVED:   { label: 'Approved',   color: 'success',     icon: <CheckCircle size={12} /> },
  PAID:       { label: 'Paid',       color: 'info',   icon: <CreditCard size={12} /> },
  REJECTED:   { label: 'Rejected',   color: 'danger',         icon: <XCircle size={12} /> },
};

const TRAVEL_MODE_LABELS: Record<string, string> = {
  OWN_VEHICLE:      'Own Vehicle',
  TAXI:             'Taxi / Cab',
  PUBLIC_TRANSPORT: 'Public Transport',
  AUTO:             'Auto-rickshaw',
  OTHER:            'Other',
};

const TravelList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMD = user?.role === 'MD';

  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/v1/travel', { params });
      let data: TravelRequest[] = res.data.data;

      // For MD "my" tab — filter to own requests client-side
      if (isMD && activeTab === 'my') {
        data = data.filter(r => r.requester === undefined || (r as any).requesterId === user?.id);
      }

      setRequests(data);
      setError('');
    } catch {
      setError('Failed to load travel requests');
    } finally {
      setLoading(false);
    }
  };

  const statuses = Object.keys(STATUS_CONFIG);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-gold/10 rounded-lg">
            <Car className="text-brand-gold" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-navy">Travel Allowance</h1>
            <p className="text-sm text-gray-500">Manage travel reimbursement requests</p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/travel/create')}
          leftIcon={<Plus size={18} />}
        >
          <span className="hidden sm:inline">New Request</span>
        </Button>
      </div>

      {/* Tabs (MD only) */}
      {isMD && (
        <div className="flex border-b border-gray-200">
          {(['my', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'my' ? 'My Requests' : 'All Requests'}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500">Filter by status:</span>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${!statusFilter ? 'bg-primary-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </button>
        {statuses.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Car size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No travel requests found</p>
          <p className="text-sm mt-1">Create a new request to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG['PENDING'];
            return (
              <Card
                key={req.id}
                padding="md"
                onClick={() => navigate(`/travel/${req.id}`)}
                className="cursor-pointer hover:border-brand-gold hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={cfg.color} className="flex items-center gap-1">
                        {cfg.icon} {cfg.label}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {TRAVEL_MODE_LABELS[req.travelMode] || req.travelMode}
                      </span>
                      {req.project && (
                        <span className="text-xs text-gray-400">• {req.project.name}</span>
                      )}
                    </div>
                    <p className="mt-1.5 font-semibold text-primary-navy truncate">
                      {req.fromLocation} → {req.toLocation}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{req.purpose}</p>
                    {isMD && req.requester && (
                      <p className="text-xs text-gray-400 mt-1">{req.requester.name} ({req.requester.associateId})</p>
                    )}
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1 truncate">⚠ {req.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-bold text-primary-navy text-lg">{formatCurrency(req.amountRequested)}</p>
                    <p className="text-xs text-gray-400">{new Date(req.travelDate).toLocaleDateString('en-IN')}</p>
                    <ChevronRight size={16} className="text-gray-300 mt-1" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TravelList;
