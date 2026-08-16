import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Network, Search, User, List, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TeamStatistics from './TeamStatistics';
import TeamTreeView from './TeamTreeView';
import TeamRequests from './TeamRequests';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';

interface DownlineUser {
  id: string;
  associateId: string;
  name: string;
  email: string;
  phone: string;
  role: { name: string };
  upline: { parentAssociateId: string } | null;
  bookingsCount?: number;
  siteVisitsCount?: number;
  totalCommission?: number;
}

const TeamHierarchy: React.FC = () => {
  const [downline, setDownline] = useState<DownlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'LIST' | 'TREE' | 'REQUESTS'>('LIST');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDownline();
  }, []);

  const fetchDownline = async () => {
    try {
      const res = await api.get('/team/downline');
      setDownline(res.data.data);
    } catch (error) {
      console.error('Failed to fetch team downline', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = downline.filter(member => 
    member.name.toLowerCase().includes(search.toLowerCase()) || 
    member.associateId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Team Dashboard</h1>
          <p className="text-sm text-gray-500">View and manage your team hierarchy and performance.</p>
        </div>
        <Button onClick={() => navigate('/users/create')} leftIcon={<UserPlus size={16} />}>
          Add Associate
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'LIST' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-primary-navy hover:border-gray-300'
          }`}
        >
          <List size={16} />
          List View
        </button>
        <button
          onClick={() => setActiveTab('TREE')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'TREE' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-primary-navy hover:border-gray-300'
          }`}
        >
          <Network size={16} />
          Tree View
        </button>
        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'REQUESTS' ? 'border-brand-gold text-brand-gold' : 'border-transparent text-gray-500 hover:text-primary-navy hover:border-gray-300'
          }`}
        >
          <Settings size={16} />
          Team Requests
        </button>
      </div>

      {/* Requests Tab renders isolated */}
      {activeTab === 'REQUESTS' ? (
        <TeamRequests />
      ) : (
        <>
          <TeamStatistics />

          {/* List and Tree View controls */}
          <Card padding="md" className="flex items-center gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search team members by name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue bg-gray-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
            </div>
          ) : (
            <>
              {activeTab === 'LIST' && (
                <Card padding="none" className="overflow-hidden bg-white shadow-sm">
                  {filteredTeam.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border-subtle">
                        <thead className="bg-gray-50/80">
                          <tr>
                            <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Associate</th>
                            <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Role & Contact</th>
                            <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Performance KPIs</th>
                            <th className="py-4 px-6 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Hierarchy Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredTeam.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary-navy/10 flex items-center justify-center text-primary-navy shrink-0">
                                    <User size={18} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-primary-navy text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-text mt-0.5">{member.associateId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="mb-1">
                                  <Badge variant="neutral">
                                    {member.role.name.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium text-gray-800">{member.email}</p>
                                <p className="text-xs text-muted-text">{member.phone}</p>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-4">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Bookings</p>
                                    <p className="text-sm font-bold text-primary-navy">{member.bookingsCount || 0}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Visits</p>
                                    <p className="text-sm font-bold text-primary-navy">{member.siteVisitsCount || 0}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-semibold uppercase">Earned</p>
                                    <p className="text-sm font-bold text-green-600">{formatCurrency(member.totalCommission || 0)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                {member.upline?.parentAssociateId === user?.id ? (
                                  <Badge variant="success">Direct Report</Badge>
                                ) : (
                                  <Badge variant="info">Indirect Downline</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <Network size={48} className="text-gray-300 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Team Members Found</h3>
                      <p className="text-gray-500 max-w-sm">
                        You don't have anyone in your downline yet, or no one matches your search.
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {activeTab === 'TREE' && (
                <TeamTreeView data={filteredTeam} currentUserId={user?.id || ''} />
              )}
            </>
          )}
        </>
      )}

    </div>
  );
};

export default TeamHierarchy;
