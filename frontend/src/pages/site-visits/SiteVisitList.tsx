import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Calendar, Clock, Eye } from 'lucide-react';

export default function SiteVisitList() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVisits = async () => {
    try {
      const res = await api.get('/v1/site-visits');
      setVisits(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load site visits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Site Visits</h1>
          <p className="mt-1 text-sm font-medium text-muted-text">
            Manage and track customer property visits.
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = '/site-visits/create' }}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Schedule Visit
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Mobile view: Stacked cards */}
      <div className="md:hidden space-y-4">
        {visits.map((visit) => (
          <Card key={visit.id} padding="md">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{visit.customerName}</h3>
                <p className="text-xs text-gray-500">{visit.project.name}</p>
              </div>
              <Badge variant={
                visit.status === 'COMPLETED' ? 'success' : 
                visit.status === 'CANCELLED' ? 'danger' : 
                'info'
              }>
                {visit.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-gray-500 flex flex-col gap-1">
              <div>Date: {format(new Date(visit.visitDate), 'MMM d, yyyy')}</div>
              <div>Time: {visit.visitTime}</div>
              {(user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER') && (
                <div>By: {visit.associate?.name}</div>
              )}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => { window.location.href = `/site-visits/${visit.id}` }}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
        {visits.length === 0 && (
          <div className="text-center py-8 text-gray-500">No site visits found</div>
        )}
      </div>

      {/* Desktop view: Table */}
      <Card padding="none" className="hidden md:block overflow-hidden bg-white shadow-sm">
        <table className="min-w-full divide-y divide-border-subtle">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Project</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Date & Time</th>
              {(user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER') && (
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Associate</th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted-text uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {visits.map((visit) => (
              <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-primary-navy">{visit.customerName}</div>
                  <div className="text-xs text-muted-text mt-0.5">{visit.customerPhone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{visit.project.name}</div>
                  <div className="text-xs text-muted-text mt-0.5">Code: {visit.project.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <Calendar size={14} className="text-gray-400" />
                    {format(new Date(visit.visitDate), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-text mt-1">
                    <Clock size={12} className="text-gray-400" />
                    {visit.visitTime}
                  </div>
                </td>
                {(user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER') && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{visit.associate?.name}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={
                    visit.status === 'COMPLETED' ? 'success' : 
                    visit.status === 'CANCELLED' ? 'danger' : 
                    'info'
                  }>
                    {visit.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/site-visits/${visit.id}`} className="text-action-blue hover:text-blue-900 bg-action-blue/10 p-2 rounded-lg inline-flex items-center gap-1">
                    <Eye size={16} /> View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visits.length === 0 && (
          <div className="text-center py-12 text-gray-500 font-medium">No site visits found.</div>
        )}
      </Card>
    </div>
  );
}
