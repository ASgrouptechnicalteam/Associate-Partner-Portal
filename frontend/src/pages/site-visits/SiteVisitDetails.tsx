import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Navigation, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

export default function SiteVisitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const [outcomeData, setOutcomeData] = useState({
    outcome: '',
    remarks: '',
    followUpRequired: false,
    followUpDate: ''
  });

  const fetchVisit = async () => {
    try {
      const res = await api.get(`/v1/site-visits/${id}`);
      setVisit(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisit();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/v1/site-visits/${id}/status`, { status: newStatus });
      await fetchVisit();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.patch(`/v1/site-visits/${id}/status`, {
        status: 'COMPLETED',
        outcome: outcomeData.outcome
      });
      // also update the other fields
      await api.patch(`/v1/site-visits/${id}/outcome`, outcomeData);
      
      setShowCompletionModal(false);
      await fetchVisit();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete visit');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-navy" />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        {error || 'Site visit not found'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/site-visits')}
          variant="ghost"
          className="p-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-primary-navy">Site Visit Details</h1>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-primary-navy">
              {visit.customerName} - {visit.project.name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Scheduled for {format(new Date(visit.visitDate), 'MMMM d, yyyy')} at {visit.visitTime}
            </p>
          </div>
          <Badge variant={
            visit.status === 'COMPLETED' ? 'success' : 
            visit.status === 'CANCELLED' ? 'danger' : 
            'info'
          }>
            {visit.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{visit.customerPhone}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{visit.customerEmail || '-'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Associate</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {visit.associate ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={visit.associate.name} imageUrl={visit.associate.profileImageUrl} size="sm" />
                    <span>{visit.associate.name}</span>
                  </div>
                ) : (
                  '-'
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Remarks</dt>
              <dd className="mt-1 text-sm text-gray-900">{visit.remarks || '-'}</dd>
            </div>

            {visit.outcome && (
              <div className="sm:col-span-2 bg-gray-50 p-4 rounded-md">
                <dt className="text-sm font-medium text-gray-700 mb-2">Visit Outcome</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{visit.outcome}</dd>
              </div>
            )}
          </dl>
        </div>
        
        {/* Actions based on valid transitions */}
        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex flex-wrap gap-3 border-t border-gray-200">
          {visit.status === 'SCHEDULED' && (
            <>
              <Button
                onClick={() => updateStatus('ON_THE_WAY')}
                isLoading={actionLoading}
                leftIcon={<Navigation className="mr-2 h-4 w-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Mark On The Way
              </Button>
              <Button
                onClick={() => updateStatus('RESCHEDULED')}
                isLoading={actionLoading}
                leftIcon={<Clock className="mr-2 h-4 w-4" />}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Reschedule
              </Button>
            </>
          )}

          {visit.status === 'ON_THE_WAY' && (
            <Button
              onClick={() => updateStatus('ARRIVED')}
              isLoading={actionLoading}
              leftIcon={<MapPin className="mr-2 h-4 w-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Mark Arrived
            </Button>
          )}

          {visit.status === 'ARRIVED' && (
            <Button
              onClick={() => updateStatus('CUSTOMER_MET')}
              isLoading={actionLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Mark Customer Met
            </Button>
          )}

          {visit.status === 'CUSTOMER_MET' && (
            <Button
              onClick={() => setShowCompletionModal(true)}
              disabled={actionLoading}
              variant="success"
              leftIcon={<CheckCircle2 className="mr-2 h-4 w-4" />}
            >
              Complete Visit
            </Button>
          )}

          {visit.status === 'RESCHEDULED' && (
            <Button
              onClick={() => updateStatus('SCHEDULED')}
              isLoading={actionLoading}
            >
              Schedule Again
            </Button>
          )}

          {['SCHEDULED', 'ON_THE_WAY', 'ARRIVED'].includes(visit.status) && (
            <Button
              onClick={() => {
                if(window.confirm('Are you sure you want to cancel this visit?')) {
                  updateStatus('CANCELLED');
                }
              }}
              disabled={actionLoading}
              variant="danger"
              leftIcon={<XCircle className="mr-2 h-4 w-4" />}
              className="ml-auto"
            >
              Cancel Visit
            </Button>
          )}
        </div>
      </Card>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowCompletionModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Complete Site Visit</h3>
                <form onSubmit={handleComplete} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Outcome / Feedback (Required)</label>
                    <textarea
                      required
                      rows={3}
                      className="mt-1 shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                      value={outcomeData.outcome}
                      onChange={e => setOutcomeData({...outcomeData, outcome: e.target.value})}
                      placeholder="Customer showed interest in Plot 104..."
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="followUp"
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                      checked={outcomeData.followUpRequired}
                      onChange={e => setOutcomeData({...outcomeData, followUpRequired: e.target.checked})}
                    />
                    <label htmlFor="followUp" className="ml-2 block text-sm text-gray-900">Follow-up Required?</label>
                  </div>
                  {outcomeData.followUpRequired && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
                      <input
                        type="date"
                        required
                        className="mt-1 shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                        value={outcomeData.followUpDate}
                        onChange={e => setOutcomeData({...outcomeData, followUpDate: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <Button
                      type="submit"
                      isLoading={actionLoading}
                      variant="success"
                      className="sm:col-start-2"
                    >
                      Complete Visit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCompletionModal(false)}
                      variant="outline"
                      className="mt-3 sm:mt-0 sm:col-start-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
