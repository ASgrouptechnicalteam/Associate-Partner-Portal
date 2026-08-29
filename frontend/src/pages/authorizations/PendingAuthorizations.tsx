import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, Calendar, Network, IndianRupee, AlertCircle, Eye, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface PendingSummary {
  projects: { count: number; items: any[] };
  bookings: { count: number; items: any[] };
  teamRequests: { count: number; items: any[] };
  commissionPolicies: { count: number; items: any[] };
  total: number;
}

const PendingAuthorizations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PendingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'MD') {
      navigate('/dashboard');
      return;
    }
    fetchSummary();
  }, [user, navigate]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/v1/authorizations/summary');
      setSummary(res.data.data);
    } catch (err: any) {
      console.error('Error fetching authorizations summary', err);
      setError(err.response?.data?.message || 'Failed to load pending authorizations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading authorizations</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <button
              onClick={fetchSummary}
              className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    { title: 'Projects', count: summary.projects.count, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Bookings', count: summary.bookings.count, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Team Requests', count: summary.teamRequests.count, icon: Network, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Commission Rules', count: summary.commissionPolicies.count, icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-action-blue" />
          Pending Authorizations
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-text">
          Review and manage requests requiring Managing Director authorization.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <Card key={idx} padding="md" className="hover:-translate-y-1 transition-transform">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-xl p-3 ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-bold text-muted-text uppercase tracking-wider truncate">{card.title}</p>
                <div className="text-2xl font-bold text-primary-navy mt-1">{card.count}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {summary.total === 0 && (
        <Card padding="xl" className="text-center bg-gray-50/50 border-dashed">
          <CheckCircle className="mx-auto h-16 w-16 text-green-400 mb-4" />
          <h3 className="text-xl font-bold text-primary-navy">No Pending Authorizations</h3>
          <p className="text-gray-500 font-medium mt-2">All authorization queues are currently clear. Great job!</p>
        </Card>
      )}

      {/* Detailed Lists */}
      {summary.total > 0 && (
        <Card padding="none" className="overflow-hidden bg-white shadow-sm">
          <ul className="divide-y divide-border-subtle">
            {/* Team Requests */}
            {summary.teamRequests.items.map((tr: any) => (
              <li key={tr.id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-indigo-100/50 p-3 rounded-full border border-indigo-200">
                      <Network className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-navy">
                        Team Request - {tr.requester.name}
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-0.5">
                        {tr.requestType} <span className="font-bold text-primary-text">{tr.targetUser.name}</span> ({tr.targetUser.userId})
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/team`)} leftIcon={<Eye size={16} />}>Review</Button>
                </div>
              </li>
            ))}

            {/* Bookings */}
            {summary.bookings.items.map((b: any) => (
              <li key={b.id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-purple-100/50 p-3 rounded-full border border-purple-200">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-navy">
                        Booking: {b.project.name} - <span className="text-action-blue">{b.customerName}</span>
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-0.5">
                        Assoc: {b.user.name} ({b.user.userIdentifier}) &bull; <span className="text-brand-gold">{b.status.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/bookings/${b.id}`)} leftIcon={<Eye size={16} />}>Review</Button>
                </div>
              </li>
            ))}

            {/* Projects */}
            {summary.projects.items.map((p: any) => (
              <li key={p.id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-blue-100/50 p-3 rounded-full border border-blue-200">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-navy">
                        Project Approval - {p.name}
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-0.5">
                        Code: {p.code}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${p.id}`)} leftIcon={<Eye size={16} />}>Review</Button>
                </div>
              </li>
            ))}

            {/* Commission Policies */}
            {summary.commissionPolicies.items.map((cp: any) => (
              <li key={cp.id} className="p-4 sm:p-6 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 bg-amber-100/50 p-3 rounded-full border border-amber-200">
                      <IndianRupee className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary-navy">
                        Commission Rules - {cp.user.name} <span className="text-xs text-muted-text font-normal ml-1">({cp.user.userIdentifier})</span>
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-0.5">
                        {cp.project?.name || 'Global'} &bull; <span className="font-bold text-primary-text">{cp.type === 'PERCENTAGE' ? `${cp.value}%` : formatCurrency(cp.value)}</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/commissions`)} leftIcon={<Eye size={16} />}>Review</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default PendingAuthorizations;
