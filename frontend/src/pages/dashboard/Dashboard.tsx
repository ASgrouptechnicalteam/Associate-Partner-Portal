import React, { useEffect, useState } from 'react';

import { ArrowRight, Users, CheckSquare, IndianRupee, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

import DashboardCarousel, { type CarouselItemData } from '../../components/dashboard/DashboardCarousel';
import OffersTicker from '../../components/dashboard/OffersTicker';
import PromotionalPopup, { type PromotionalPopupData } from '../../components/dashboard/PromotionalPopup';
import FeaturedProjects, { type FeaturedProjectData } from '../../components/dashboard/FeaturedProjects';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Gift } from 'lucide-react';

interface DashboardData {
  user: {
    id: string;
    name: string;
    userIdentifier: string;
    role: string;
  };
  statistics: {
    team: number;
    bookings: number | null;
    commission: number | null;
    siteVisits: number | null;
  };
  featuredProjects: FeaturedProjectData[];
  hotProjects: FeaturedProjectData[];
  carouselItems: CarouselItemData[];
  popup: PromotionalPopupData | null;
  activeOffers: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err: any) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-pulse mt-4">
        <div className="h-20 bg-border-subtle rounded-2xl w-full"></div>
        <div className="h-48 bg-border-subtle rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="h-36 bg-border-subtle rounded-2xl"></div>
          <div className="h-36 bg-border-subtle rounded-2xl"></div>
          <div className="h-36 bg-border-subtle rounded-2xl"></div>
          <div className="h-36 bg-border-subtle rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        {error || 'Unable to load dashboard.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <PromotionalPopup popup={data.popup} />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 bg-gradient-to-r from-deep-navy to-primary-navy p-6 rounded-2xl shadow-xl shadow-blue-900/10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, <span className="text-brand-gold">{data.user.name}</span>!
          </h1>
          <p className="mt-2 text-white/70 text-sm font-medium flex items-center gap-2">
            <span className="bg-white/10 px-2 py-0.5 rounded-md text-xs">{data.user.userIdentifier}</span> 
            <span>&bull;</span> 
            <span className="text-brand-gold font-semibold uppercase tracking-wider text-xs">{data.user.role.replace('_', ' ')}</span>
          </p>
        </div>
      </div>

      {/* Offers Carousel - MUST BE AT TOP ABOVE KPIs */}
      {data.carouselItems && data.carouselItems.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-subtle bg-white mb-6">
          <DashboardCarousel items={data.carouselItems} />
        </div>
      )}

      {/* Offers Ticker - Below Carousel */}
      {data.activeOffers && data.activeOffers.length > 0 && (
        <OffersTicker offers={data.activeOffers} />
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Team Card */}
        <button onClick={() => navigate('/team')} className="text-left w-full group">
          <Card padding="md" className="flex flex-col justify-between h-40 border-0 shadow-lg shadow-gray-200/50 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">MY TEAM</h3>
              <div className="bg-blue-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="text-action-blue" size={22} />
              </div>
            </div>
            <div className="text-4xl font-black text-deep-navy">{data.statistics.team}</div>
          </Card>
        </button>

        {/* Bookings Card */}
        <button onClick={() => navigate('/bookings')} className="text-left w-full group">
          <Card padding="md" className="flex flex-col justify-between h-40 border-0 shadow-lg shadow-gray-200/50 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">BOOKINGS</h3>
              <div className="bg-emerald-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <CheckSquare className="text-emerald-600" size={22} />
              </div>
            </div>
            <div className="text-4xl font-black text-deep-navy">{data.statistics.bookings ?? 0}</div>
          </Card>
        </button>

        {/* Commission Card */}
        <button onClick={() => navigate('/commissions')} className="text-left w-full group">
          <Card padding="md" className="flex flex-col justify-between h-40 border-0 shadow-lg shadow-brand-gold/10 bg-gradient-to-br from-white to-orange-50/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-brand-gold/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-brand-gold tracking-wider uppercase">COMMISSION</h3>
              <div className="bg-orange-100/50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <IndianRupee className="text-brand-gold" size={22} />
              </div>
            </div>
            <div className="text-3xl font-black text-deep-navy truncate">
              {formatCurrency(data.statistics.commission || 0)}
            </div>
          </Card>
        </button>

        {/* Site Visits Card */}
        <button onClick={() => navigate('/site-visits')} className="text-left w-full group">
          <Card padding="md" className="flex flex-col justify-between h-40 border-0 shadow-lg shadow-gray-200/50 bg-gradient-to-br from-white to-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">SITE VISITS</h3>
              <div className="bg-purple-50 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <MapPin className="text-purple-600" size={22} />
              </div>
            </div>
            <div className="text-4xl font-black text-deep-navy">{data.statistics.siteVisits ?? 0}</div>
          </Card>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Main Content Area (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hot Projects */}
          {data.hotProjects && data.hotProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 px-1 flex items-center gap-2 uppercase tracking-wide">
                <span className="bg-red-100/50 p-1 rounded-md text-red-500 shadow-sm border border-red-200">🔥</span>
                Hot Deals
              </h2>
              <FeaturedProjects projects={data.hotProjects} />
            </div>
          )}

          {/* Featured Projects */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-deep-navy px-1">Featured Projects</h2>
            <FeaturedProjects projects={data.featuredProjects} />
          </div>
        </div>

        {/* Secondary Area */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-deep-navy px-1">Quick Actions</h2>
          <Card padding="md" className="space-y-3 bg-white border-0 shadow-lg shadow-gray-200/50">
            <button onClick={() => navigate('/bookings/create')} className="w-full flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-transparent hover:bg-blue-50/50 hover:border-action-blue/30 transition-all group">
              <div>
                <span className="font-bold text-deep-navy group-hover:text-action-blue block">Create Booking</span>
                <span className="text-xs text-gray-500 mt-0.5 block">Reserve a new unit</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-action-blue group-hover:bg-blue-100 transition-colors">
                <ArrowRight size={16} />
              </div>
            </button>
            
            <button onClick={() => navigate('/site-visits/create')} className="w-full flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-transparent hover:bg-blue-50/50 hover:border-action-blue/30 transition-all group">
              <div>
                <span className="font-bold text-deep-navy group-hover:text-action-blue block">Schedule Site Visit</span>
                <span className="text-xs text-gray-500 mt-0.5 block">Log a new client visit</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-action-blue group-hover:bg-blue-100 transition-colors">
                <ArrowRight size={16} />
              </div>
            </button>
          </Card>

          {data.activeOffers && data.activeOffers.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-deep-navy px-1 flex items-center gap-2">
                <Gift className="text-brand-gold" size={20} />
                Active Offers
              </h2>
              <div className="space-y-3">
                {data.activeOffers.map(offer => (
                  <Card key={offer.id} padding="md" className="border-l-4 border-l-brand-gold bg-gradient-to-r from-brand-gold/5 to-white shadow-md border-y border-r border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-deep-navy text-sm">{offer.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.description}</p>
                      </div>
                      <Badge variant="warning">
                        {offer.targetAudience}
                      </Badge>
                    </div>
                    {offer.reward && (
                      <div className="mt-3 text-xs font-bold text-brand-gold bg-yellow-50 px-2.5 py-1 rounded-md inline-block border border-brand-gold/20">
                        Reward: {offer.reward}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              <button 
                onClick={() => navigate('/offers')}
                className="w-full text-center text-sm font-semibold text-action-blue hover:underline py-2"
              >
                View All Offers
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
