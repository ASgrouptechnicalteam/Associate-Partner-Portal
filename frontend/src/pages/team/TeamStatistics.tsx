import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, UserCheck, Briefcase, IndianRupee } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';

interface TeamStats {
  directMembers: number;
  totalMembers: number;
  totalBookings: number;
  totalCommission: number;
}

const TeamStatistics: React.FC = () => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/team/statistics');
        setStats(res.data.data);
      } catch (error) {
        console.error('Failed to fetch team statistics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card padding="md" className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 text-action-blue rounded-lg">
          <UserCheck size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Direct Members</p>
          <h3 className="text-2xl font-bold text-primary-navy mt-1">{stats.directMembers}</h3>
        </div>
      </Card>
      <Card padding="md" className="flex items-start gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Downline</p>
          <h3 className="text-2xl font-bold text-primary-navy mt-1">{stats.totalMembers}</h3>
        </div>
      </Card>
      <Card padding="md" className="flex items-start gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
          <Briefcase size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Team Bookings</p>
          <h3 className="text-2xl font-bold text-primary-navy mt-1">{stats.totalBookings}</h3>
        </div>
      </Card>
      <Card padding="md" className="flex items-start gap-4">
        <div className="p-3 bg-yellow-50 text-brand-gold rounded-lg">
          <IndianRupee size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Team Commission</p>
          <h3 className="text-2xl font-bold text-primary-navy mt-1">{formatCurrency(stats.totalCommission)}</h3>
        </div>
      </Card>
    </div>
  );
};

export default TeamStatistics;
