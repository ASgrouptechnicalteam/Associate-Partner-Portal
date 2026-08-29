import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, ChevronRight, Filter } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { formatCurrency } from '../../utils/currency';

interface Booking {
  id: string;
  customerName: string;
  project: { name: string; code: string };
  inventoryUnit: { unitNumber: string; propertyType: string };
  associate?: { name: string; userId: string; profileImageUrl?: string };
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
    const s = searchQuery.toLowerCase();
    const matchesSearch = b.customerName.toLowerCase().includes(s) || 
                          b.project.name.toLowerCase().includes(s) ||
                          (b.inventoryUnit?.unitNumber && b.inventoryUnit.unitNumber.toLowerCase().includes(s)) ||
                          b.id.toLowerCase().includes(s);
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
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 px-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-action-blue" size={20} />
            <input 
              type="text" 
              placeholder="Search by customer or project..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-none rounded-xl text-sm focus:outline-none focus:ring-0 bg-transparent placeholder:text-gray-400 font-medium text-deep-navy"
            />
          </div>
        </div>
        <div className="hidden sm:flex pr-2">
          <Button variant="outline" leftIcon={<Filter size={16} />}>Filter</Button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-gray-200/60 pb-px">
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
            className={`py-3 px-5 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-brand-gold text-deep-navy' 
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
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
          <div className="text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl p-16">
            <p className="text-gray-500 font-bold text-lg">No bookings found for the selected filters.</p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-action-blue/30 transition-all duration-300 group">
              <Link to={`/bookings/${booking.id}`} className="flex flex-col sm:flex-row p-6 sm:items-center gap-6 relative">
                
                {/* Left: Customer & Project */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-deep-navy text-xl group-hover:text-action-blue transition-colors">
                      {booking.customerName}
                    </h3>
                    <Badge variant={getStatusColor(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm font-bold text-gray-600 bg-gray-50 inline-flex px-3 py-1.5 rounded-lg border border-gray-100">
                    {booking.project.name} &bull; <span className="text-action-blue ml-1">Unit {booking.inventoryUnit.unitNumber}</span>
                  </p>
                  {booking.associate && user?.role !== 'ASSOCIATE' && (
                    <div className="mt-4 flex items-center gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100 inline-flex">
                      <Avatar name={booking.associate.name} imageUrl={booking.associate.profileImageUrl} size="sm" />
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Associate</p>
                        <p className="font-bold text-deep-navy text-sm leading-none">{booking.associate.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Date, Amount & Arrow */}
                <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2 pt-4 border-t sm:pt-0 sm:border-t-0 border-gray-100 sm:border-l sm:pl-6">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-deep-navy to-action-blue">
                    {formatCurrency(booking.expectedAmount || 0)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-action-blue group-hover:bg-action-blue group-hover:text-white transition-colors duration-300 absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex">
                    <ChevronRight size={20} />
                  </div>
                </div>
                
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsList;
