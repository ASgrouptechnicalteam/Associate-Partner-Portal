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
    name: string;
    associateId: string;
    role: string;
  };
  statistics: {
    team: number;
    bookings: number | null;
    commission: number | null;
    siteVisits: number | null;
  };
  featuredProjects: FeaturedProjectData[];
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
      <div className="flex justify-center items-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-primary-text tracking-tight">
            Welcome back, {data.user.name}!
          </h1>
          <p className="mt-1.5 text-muted-text text-sm font-medium">
            {data.user.associateId} &bull; {data.user.role.replace('_', ' ')}
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
        <button onClick={() => navigate('/team')} className="text-left">
          <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-text tracking-wide">MY TEAM</h3>
              <div className="bg-primary-navy/5 p-2 rounded-xl">
                <Users className="text-primary-navy" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-text">{data.statistics.team}</div>
          </Card>
        </button>

        {/* Bookings Card */}
        <button onClick={() => navigate('/bookings')} className="text-left">
          <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-text tracking-wide">BOOKINGS</h3>
              <div className="bg-action-blue/10 p-2 rounded-xl">
                <CheckSquare className="text-action-blue" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-text">{data.statistics.bookings ?? 0}</div>
          </Card>
        </button>

        {/* Commission Card */}
        <button onClick={() => navigate('/commissions')} className="text-left">
          <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-text tracking-wide">COMMISSION</h3>
              <div className="bg-[#E0B040]/10 p-2 rounded-xl">
                <IndianRupee className="text-[#E0B040]" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-text">
              {formatCurrency(data.statistics.commission || 0)}
            </div>
          </Card>
        </button>

        {/* Site Visits Card */}
        <button onClick={() => navigate('/site-visits')} className="text-left">
          <Card padding="md" className="flex flex-col justify-between h-36 hover:-translate-y-1 transition-transform w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-text tracking-wide">SITE VISITS</h3>
              <div className="bg-green-100 p-2 rounded-xl">
                <MapPin className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary-text">{data.statistics.siteVisits ?? 0}</div>
          </Card>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Main Content Area (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Featured Projects */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary-text px-1">Featured Projects</h2>
            <FeaturedProjects projects={data.featuredProjects} />
          </div>
        </div>

        {/* Secondary Area */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-primary-text px-1">Quick Actions</h2>
          <Card padding="md" className="space-y-3">
            <button onClick={() => navigate('/bookings/create')} className="w-full flex items-center justify-between rounded-[12px] bg-app-background p-4 border border-border-subtle text-left hover:border-action-blue hover:text-action-blue transition-all group">
              <div>
                <span className="font-semibold text-primary-text group-hover:text-action-blue block">Create Booking</span>
                <span className="text-xs text-muted-text mt-0.5 block">Reserve a new unit</span>
              </div>
              <ArrowRight size={18} className="text-gray-400 group-hover:text-action-blue transition-colors" />
            </button>
            
            <button onClick={() => navigate('/site-visits/create')} className="w-full flex items-center justify-between rounded-[12px] bg-app-background p-4 border border-border-subtle text-left hover:border-action-blue hover:text-action-blue transition-all group">
              <div>
                <span className="font-semibold text-primary-text group-hover:text-action-blue block">Schedule Site Visit</span>
                <span className="text-xs text-muted-text mt-0.5 block">Log a new client visit</span>
              </div>
              <ArrowRight size={18} className="text-gray-400 group-hover:text-action-blue transition-colors" />
            </button>

            <button onClick={() => navigate('/travel/create')} className="w-full flex items-center justify-between rounded-[12px] bg-app-background p-4 border border-border-subtle text-left hover:border-action-blue hover:text-action-blue transition-all group">
              <div>
                <span className="font-semibold text-primary-text group-hover:text-action-blue block">Travel Allowance</span>
                <span className="text-xs text-muted-text mt-0.5 block">Submit travel expenses</span>
              </div>
              <ArrowRight size={18} className="text-gray-400 group-hover:text-action-blue transition-colors" />
            </button>
          </Card>

          {data.activeOffers && data.activeOffers.length > 0 && (
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold text-primary-text px-1 flex items-center gap-2">
                <Gift className="text-brand-gold" size={20} />
                Active Offers
              </h2>
              <div className="space-y-3">
                {data.activeOffers.map(offer => (
                  <Card key={offer.id} padding="md" className="border-l-4 border-l-brand-gold bg-gradient-to-r from-brand-gold/5 to-transparent">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-primary-navy text-sm">{offer.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{offer.description}</p>
                      </div>
                      <Badge variant="warning">
                        {offer.targetAudience}
                      </Badge>
                    </div>
                    {offer.reward && (
                      <div className="mt-3 text-xs font-semibold text-brand-gold bg-brand-gold/10 px-2 py-1 rounded inline-block">
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
