import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Calendar, Clock, Eye } from 'lucide-react';

export default function DemoBookingList() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/v1/demo-bookings');
      setBookings(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load demo bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(b => {
    const s = searchQuery.toLowerCase();
    return b.customerName.toLowerCase().includes(s) ||
           (b.customerPhone && b.customerPhone.toLowerCase().includes(s)) ||
           b.project.name.toLowerCase().includes(s) ||
           (b.referenceId && b.referenceId.toLowerCase().includes(s)) ||
           b.id.toLowerCase().includes(s);
  });

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
          <h1 className="text-2xl font-bold text-primary-navy">Demo Bookings</h1>
          <p className="mt-1 text-sm font-medium text-muted-text">
            Manage and track customer property bookings.
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = '/demo-bookings/create' }}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Schedule Booking
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-action-blue" size={20} />
          <input 
            type="text"
            placeholder="Search by customer, phone, project or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-none rounded-xl text-sm focus:outline-none focus:ring-0 bg-transparent placeholder:text-gray-400 font-medium text-deep-navy"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Mobile view: Stacked cards */}
      <div className="md:hidden space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} padding="md">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{booking.customerName}</h3>
                <p className="text-xs text-gray-500">{booking.project.name}</p>
              </div>
              <Badge variant={
                booking.status === 'COMPLETED' ? 'success' : 
                booking.status === 'CANCELLED' ? 'danger' : 
                'info'
              }>
                {booking.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-gray-500 flex flex-col gap-1">
              <div>Date: {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}</div>
              <div>Time: {booking.scheduledTime}</div>
              {(user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER') && (
                <div>By: {booking.associate?.name}</div>
              )}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => { window.location.href = `/demo-bookings/${booking.id}` }}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
        {bookings.length === 0 && (
          <div className="text-center py-8 text-gray-500">No demo bookings found</div>
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
              {(user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER') && (
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Associate</th>
              )}
              <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-muted-text uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={(user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER') ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                  No demo bookings found
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-primary-navy">{booking.customerName}</div>
                  <div className="text-xs text-muted-text mt-0.5">{booking.customerPhone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.project.name}</div>
                  <div className="text-xs text-muted-text mt-0.5">Code: {booking.project.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <Calendar size={14} className="text-gray-400" />
                    {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-text mt-1">
                    <Clock size={12} className="text-gray-400" />
                    {booking.scheduledTime}
                  </div>
                  {booking.isDemo && (
                    <span className="inline-flex mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800">
                      DEMO
                    </span>
                  )}
                </td>
                {(user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER') && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.associate?.name}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={
                    booking.status === 'COMPLETED' ? 'success' : 
                    booking.status === 'CANCELLED' ? 'danger' : 
                    'info'
                  }>
                    {booking.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/demo-bookings/${booking.id}`} className="text-action-blue hover:text-blue-900 bg-action-blue/10 p-2 rounded-lg inline-flex items-center gap-1">
                    <Eye size={16} /> View
                  </Link>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
        {bookings.length === 0 && (
          <div className="text-center py-12 text-gray-500 font-medium">No demo bookings found.</div>
        )}
      </Card>
    </div>
  );
}
