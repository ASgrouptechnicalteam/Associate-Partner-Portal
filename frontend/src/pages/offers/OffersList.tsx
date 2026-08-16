import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Gift, Plus, Edit2, Trash2, Calendar, Target, Award, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  targetAudience: string;
  projectId: string | null;
  targetBookings: number | null;
  reward: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  project?: { name: string; id: string };
  achievedBookings?: number;
}

const OffersList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/v1/offers');
      setItems(res.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this offer?')) return;
    try {
      await api.delete(`/v1/offers/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to archive');
    }
  };

  const calculateProgress = (achieved: number = 0, target: number | null) => {
    if (!target || target === 0) return 0;
    const percentage = (achieved / target) * 100;
    return percentage > 100 ? 100 : percentage;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Gift className="w-6 h-6 mr-2 text-indigo-600" />
            Special Offers & Incentives
          </h1>
          <p className="text-sm text-gray-500">View and track promotional offers</p>
        </div>
        {(user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER') && (
          <Button
            onClick={() => navigate('/offers/create')}
            leftIcon={<Plus className="w-4 h-4 mr-1" />}
          >
            Create Offer
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} padding="md" className="hover:-translate-y-1 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <Badge variant={
                    item.status === 'ACTIVE' ? 'success' : 
                    item.status === 'SCHEDULED' ? 'info' : 
                    item.status === 'ARCHIVED' ? 'neutral' : 
                    'danger'
                  }>
                    {item.status.toLowerCase()}
                  </Badge>
                </div>
                {(user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER') && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" className="p-2" onClick={() => navigate(`/offers/${item.id}/edit`)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" className="p-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden line-clamp-2">
                {item.description || 'No description provided'}
              </p>

              <div className="space-y-3 mb-4">
                {item.project && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Target className="w-4 h-4 mr-2 text-indigo-500" />
                    <span>Project: {item.project.name}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <Award className="w-4 h-4 mr-2 text-yellow-500" />
                  <span>Reward: {item.reward || 'N/A'}</span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  <span>
                    {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Now'} - {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
              </div>

              {item.targetBookings && user?.role === 'ASSOCIATE' && item.status === 'ACTIVE' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Progress</span>
                    <span className="text-indigo-600 font-bold">{item.achievedBookings || 0} / {item.targetBookings}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${calculateProgress(item.achievedBookings, item.targetBookings)}%` }}
                    ></div>
                  </div>
                  {item.achievedBookings !== undefined && item.achievedBookings >= item.targetBookings && (
                    <p className="text-xs text-green-600 mt-2 font-medium flex items-center">
                      <Check className="w-3 h-3 mr-1" />
                      Target Achieved!
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card padding="xl" className="text-center text-muted-text mt-6">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Offers Available</h3>
          <p>There are no special offers or incentives at this time.</p>
        </Card>
      )}
    </div>
  );
};

export default OffersList;
