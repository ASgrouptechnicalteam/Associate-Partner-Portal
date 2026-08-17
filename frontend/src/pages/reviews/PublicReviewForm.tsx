import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface PublicReviewRequest {
  token: string;
  customerName: string;
  project: { name: string };
  booking: { inventoryUnit: { propertyType: string } };
  status: string;
}

const PublicReviewForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<PublicReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    overallExperience: 0,
    communication: 0,
    propertyExperience: 0,
    associateSupport: 0,
    writtenReview: ''
  });

  useEffect(() => {
    fetchRequest();
  }, [token]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://associate-partner-portal.onrender.com/api';
      const res = await axios.get(`${apiUrl}/v1/public/reviews/${token}`);
      setRequest(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired review link');
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (field: keyof typeof formData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.overallExperience || !formData.communication || !formData.propertyExperience || !formData.associateSupport) {
      setError('Please provide a rating for all required categories.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://associate-partner-portal.onrender.com/api';
      await axios.post(`${apiUrl}/v1/public/reviews/${token}`, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ field, label }: { field: keyof typeof formData, label: string }) => {
    const value = formData[field] as number;
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label} <span className="text-red-500">*</span></label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(field, star)}
              className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-gold ${value >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
            >
              <Star className={`h-8 w-8 ${value >= star ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-navy"></div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Link Invalid</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success || request?.status === 'SUBMITTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
          <p className="text-gray-600">Your review has been successfully submitted. We appreciate your feedback and your trust in Sonthillu Constructions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-primary-navy tracking-tight">How did we do?</h1>
          <p className="text-lg text-gray-600">
            Hi {request?.customerName}, please rate your experience with your {request?.booking.inventoryUnit.propertyType?.toLowerCase()} purchase at {request?.project.name}.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StarRating field="overallExperience" label="Overall Experience" />
              <StarRating field="communication" label="Communication" />
              <StarRating field="propertyExperience" label="Property Experience" />
              <StarRating field="associateSupport" label="Associate Support" />
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700">Additional Comments (Optional)</label>
              <textarea
                value={formData.writtenReview}
                onChange={(e) => setFormData(prev => ({ ...prev, writtenReview: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-shadow"
                placeholder="Tell us what you loved or how we can improve..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-primary-navy hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-navy transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicReviewForm;
