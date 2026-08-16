import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, ChevronRight, Filter } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/currency';

interface Booking {
  id: string;
  customerName: string;
  project: { name: string; code: string };
  inventoryUnit: { unitNumber: string; propertyType: string };
  associate?: { name: string; associateId: string };
  bookingDate: string;
  status: string;
  expectedAmount: number;
}

const BookingsList: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'PAYMENT_PENDING'>('ALL');
  const [viewType, setViewType] = useState<'MY' | 'TEAM'>('MY');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const endpoint =
        user?.role === 'ASSOCIATE'
          ? viewType === 'MY'
            ? '/v1/bookings/my-bookings'
            : '/v1/bookings/team-bookings'
          : '/v1/bookings'; 

      const res = await api.get(endpoint);
      setBookings(res.data.data);
    } catch (error) {
      console.error('Failed to load bookings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [viewType]);

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

  const filteredBookings = bookings.filter(b => {
    const matchesTab = activeTab === 'ALL' || b.status === activeTab;
    const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.project.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Bookings & Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage unit reservations and customer bookings.</p>
        </div>
        <Link to="/bookings/create">
          <Button leftIcon={<Plus size={18} />}>
            New Booking
          </Button>
        </Link>
      </div>

      {/* View Toggle (Associate only) */}
      {user?.role === 'ASSOCIATE' && (
        <div className="bg-white rounded-lg p-1 border border-border-subtle inline-flex shadow-sm">
          <button
            onClick={() => setViewType('MY')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewType === 'MY' ? 'bg-primary-navy text-white' : 'text-gray-500 hover:text-primary-navy'}`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setViewType('TEAM')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewType === 'TEAM' ? 'bg-primary-navy text-white' : 'text-gray-500 hover:text-primary-navy'}`}
          >
            Team Bookings
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <Card padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer or project..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue bg-gray-50"
            />
          </div>
          <Button variant="outline" className="hidden sm:flex" leftIcon={<Filter size={16} />}>Filter</Button>
        </div>
      </Card>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-gray-200 pb-px">
        {[
          { id: 'ALL', label: 'All Bookings' },
          { id: 'SUBMITTED', label: 'Submitted' },
          { id: 'UNDER_REVIEW', label: 'Under Review' },
          { id: 'PAYMENT_PENDING', label: 'Payment Pending' },
          { id: 'VERIFIED', label: 'Verified' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-4 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'border-brand-gold text-brand-gold' 
                : 'border-transparent text-gray-500 hover:text-primary-navy hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card padding="xl" className="text-center bg-gray-50/50 border-dashed">
            <p className="text-gray-500 font-medium">No bookings found for the selected filters.</p>
          </Card>
        ) : (
          filteredBookings.map(booking => (
            <Card key={booking.id} padding="none" className="hover:shadow-md transition-shadow group">
              <Link to={`/bookings/${booking.id}`} className="flex flex-col sm:flex-row p-5 sm:items-center gap-5 relative">
                
                {/* Left: Customer & Project */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-bold text-primary-navy text-lg group-hover:text-action-blue transition-colors">
                      {booking.customerName}
                    </h3>
                    <Badge variant={getStatusColor(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {booking.project.name} &bull; <span className="text-muted-text">Unit {booking.inventoryUnit.unitNumber}</span>
                  </p>
                  {booking.associate && user?.role !== 'ASSOCIATE' && (
                    <p className="text-xs text-muted-text mt-2">
                      Associate: <span className="font-semibold text-primary-text">{booking.associate.name}</span>
                    </p>
                  )}
                </div>

                {/* Right: Date, Amount & Arrow */}
                <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2 pt-4 border-t sm:pt-0 sm:border-t-0 border-border-subtle sm:border-l sm:pl-5">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="font-bold text-lg text-primary-text">
                    {formatCurrency(booking.expectedAmount || 0)}
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-action-blue absolute right-5 top-1/2 -translate-y-1/2 hidden sm:block" />
                </div>
                
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsList;
