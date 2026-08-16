import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';

interface ReviewAnalyticsData {
  totalReviews: number;
  averageRating: number;
  details: {
    overallExperience: number;
    communication: number;
    propertyExperience: number;
    associateSupport: number;
  };
  bookings: number;
  siteVisits: number;
  conversion: number;
}

const ReviewAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ReviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/reviews/analytics');
      setAnalytics(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load review analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100">
        <h3 className="font-semibold text-lg mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!analytics) return null;

  const scoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-500';
    if (score >= 3.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Review Analytics</h1>
          <p className="mt-1 text-sm font-medium text-muted-text">
            Monitor customer satisfaction and feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="lg" className="flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-blue-100/50 p-4 rounded-2xl mb-4 border border-blue-200">
            <Users className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider mb-1">Total Reviews</h3>
          <p className="text-4xl font-bold text-primary-navy">{analytics.totalReviews}</p>
        </Card>

        <Card padding="lg" className="flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-yellow-100/50 p-4 rounded-2xl mb-4 border border-yellow-200">
            <Clock className="h-7 w-7 text-yellow-600" />
          </div>
          <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider mb-1">Total Bookings</h3>
          <p className="text-4xl font-bold text-primary-navy">{analytics.bookings}</p>
        </Card>

        <Card padding="lg" className="flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-green-100/50 p-4 rounded-2xl mb-4 border border-green-200">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider mb-1">Conversion</h3>
          <p className="text-4xl font-bold text-primary-navy">{analytics.conversion}%</p>
          <p className="text-xs text-gray-400 mt-2 font-medium">Bookings / Site Visits</p>
        </Card>

        <Card padding="lg" className="flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
          <div className="bg-purple-100/50 p-4 rounded-2xl mb-4 border border-purple-200">
            <TrendingUp className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-sm font-bold text-muted-text uppercase tracking-wider mb-1">Overall Avg Score</h3>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className={`text-4xl font-bold ${scoreColor(analytics.averageRating)}`}>
              {(analytics.averageRating || 0).toFixed(1)}
            </span>
            <Star className={`h-6 w-6 ${scoreColor(analytics.averageRating)} fill-current`} />
          </div>
        </Card>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle bg-gray-50/50">
          <h2 className="text-lg font-bold text-primary-navy">Average Category Scores</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Communication</span>
                <span className={scoreColor(analytics.details.communication)}>{(analytics.details.communication || 0).toFixed(1)} / 5</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-primary-gold h-2.5 rounded-full" 
                  style={{ width: `${(analytics.details.communication / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Property Experience</span>
                <span className={scoreColor(analytics.details.propertyExperience)}>{(analytics.details.propertyExperience || 0).toFixed(1)} / 5</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-primary-gold h-2.5 rounded-full" 
                  style={{ width: `${(analytics.details.propertyExperience / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-gray-700">Associate Support</span>
                <span className={scoreColor(analytics.details.associateSupport)}>{(analytics.details.associateSupport || 0).toFixed(1)} / 5</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-primary-gold h-2.5 rounded-full" 
                  style={{ width: `${(analytics.details.associateSupport / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReviewAnalytics;
