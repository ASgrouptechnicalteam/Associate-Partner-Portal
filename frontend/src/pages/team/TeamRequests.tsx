import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Check, X, FileText, UserPlus, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface TeamRequest {
  id: string;
  requestType: 'ADD' | 'REMOVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  requester: { id: string; name: string; associateId: string };
  targetAssociate: { id: string; name: string; associateId: string };
  proposedParent: { id: string; name: string; associateId: string } | null;
}

const TeamRequests: React.FC = () => {
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Create Request State
  const [showCreate, setShowCreate] = useState(false);
  const [requestType, setRequestType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [targetAssociateId, setTargetAssociateId] = useState('');
  const [proposedParentId, setProposedParentId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Reject State
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/team/requests');
      setRequests(res.data.data);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!targetAssociateId.trim()) {
      setError('Target Associate ID is required');
      return;
    }
    
    if (requestType === 'ADD' && !proposedParentId.trim()) {
      setError('Proposed Parent ID is required for ADD requests');
      return;
    }

    try {
      setActionLoading('create');
      await api.post('/team/requests', {
        targetAssociateId,
        proposedParentId: requestType === 'ADD' ? proposedParentId : null,
        requestType,
        reason
      });
      setShowCreate(false);
      setTargetAssociateId('');
      setProposedParentId('');
      setReason('');
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this team request?')) return;
    try {
      setActionLoading(`approve-${id}`);
      await api.patch(`/team/requests/${id}/approve`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    try {
      setActionLoading(`reject-${id}`);
      await api.patch(`/team/requests/${id}/reject`, { rejectionReason: rejectReason });
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const canApprove = user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Team Requests</h1>
          <p className="text-sm text-gray-500">Manage team addition and removal requests.</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          leftIcon={showCreate ? <X size={18} /> : <UserPlus size={18} />}
        >
          {showCreate ? 'Cancel' : 'New Request'}
        </Button>
      </div>

      {showCreate && (
        <Card padding="md" className="mb-6">
          <h3 className="text-lg font-bold text-primary-text mb-4">Create Team Request</h3>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as 'ADD' | 'REMOVE')}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
                >
                  <option value="ADD">Add to Team</option>
                  <option value="REMOVE">Remove from Team</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Associate UUID</label>
                <input
                  type="text"
                  required
                  value={targetAssociateId}
                  onChange={(e) => setTargetAssociateId(e.target.value)}
                  placeholder="Paste UUID of the associate"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
                />
              </div>

              {requestType === 'ADD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Parent UUID</label>
                  <input
                    type="text"
                    required
                    value={proposedParentId}
                    onChange={(e) => setProposedParentId(e.target.value)}
                    placeholder="Paste UUID of the new manager"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-navy/20"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={actionLoading === 'create'}
              >
                Submit Request
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-navy" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.length === 0 ? (
            <Card padding="xl" className="text-center text-muted-text">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Requests Found</h3>
              <p>There are no pending or past team requests.</p>
            </Card>
          ) : (
            requests.map(req => (
              <Card key={req.id} padding="md" className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={req.requestType === 'ADD' ? 'info' : 'danger'}>
                      {req.requestType}
                    </Badge>
                    <Badge variant={
                      req.status === 'PENDING' ? 'warning' :
                      req.status === 'APPROVED' ? 'success' :
                      'neutral'
                    }>
                      {req.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-800">
                    <span className="font-semibold">{req.requester.name}</span> requested to{' '}
                    <span className="font-semibold">{req.requestType.toLowerCase()}</span>{' '}
                    <span className="font-semibold text-primary-navy">{req.targetAssociate.name} ({req.targetAssociate.associateId})</span>
                    {req.requestType === 'ADD' && req.proposedParent && (
                      <span> under <span className="font-semibold text-primary-navy">{req.proposedParent.name} ({req.proposedParent.associateId})</span></span>
                    )}
                  </div>
                  
                  {req.reason && <p className="text-sm text-gray-600">Reason: {req.reason}</p>}
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <p className="text-sm text-red-600">Rejection: {req.rejectionReason}</p>
                  )}
                </div>
                
                {req.status === 'PENDING' && canApprove && (
                  <div className="flex items-center gap-2">
                    {rejectingId === req.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Reason..." 
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                        />
                        <button 
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading === `reject-${req.id}`}
                          className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          className="bg-gray-200 text-gray-700 p-1.5 rounded hover:bg-gray-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading === `approve-${req.id}`}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TeamRequests;
