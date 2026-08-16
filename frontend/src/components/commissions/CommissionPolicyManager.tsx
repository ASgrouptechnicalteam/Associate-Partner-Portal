import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Check, XCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface CommissionPolicy {
  id: string;
  type: string;
  value: string;
  status: string;
  createdAt: string;
  associate: { name: string; associateId: string };
  project: { name: string } | null;
}

interface User {
  id: string;
  name: string;
  associateId: string;
}

interface Project {
  id: string;
  name: string;
}

interface Props {
  onClose: () => void;
}

export default function CommissionPolicyManager({ onClose }: Props) {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<CommissionPolicy[]>([]);
  const [associates, setAssociates] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedAssociate, setSelectedAssociate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [polRes, usrRes, prjRes] = await Promise.all([
        api.get('/v1/commissions/policies'),
        api.get('/users?role=ASSOCIATE'), // Assuming this returns associates
        api.get('/projects') // Ensure this returns basic project info
      ]);
      setPolicies(polRes.data.data);
      // Depending on API response shape for users/projects, adapt this:
      setAssociates(usrRes.data.data?.users || usrRes.data.data || []);
      setProjects(prjRes.data.data?.projects || prjRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data for policies manager', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/v1/commissions/policies', {
        associateId: selectedAssociate,
        projectId: selectedProject || null,
        type,
        value: Number(value)
      });
      setSelectedAssociate('');
      setSelectedProject('');
      setValue('');
      fetchData();
    } catch (error) {
      console.error('Failed to create policy', error);
      alert('Failed to create policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    if (!window.confirm(`Are you sure you want to mark this policy as ${status}?`)) return;
    try {
      await api.patch(`/v1/commissions/policies/${id}/approve`, { status });
      fetchData();
    } catch (error) {
      console.error('Failed to approve policy', error);
      alert('Failed to approve policy.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border-color flex justify-between items-center bg-deep-navy text-white rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold">Manage Commission</h2>
            <p className="text-sm text-blue-100 font-normal mt-1">Configure commission rates and rules for associates and projects.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          {/* Create Form */}
          {user?.role === 'ASSOCIATE_MANAGER' || user?.role === 'MD' ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold text-primary-navy mb-4">Create Commission Rule</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Associate *</label>
                  <select required value={selectedAssociate} onChange={e => setSelectedAssociate(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                    <option value="">Select...</option>
                    {associates.map(a => <option key={a.id} value={a.id}>{a.name} ({a.associateId})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project (Optional)</label>
                  <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                    <option value="">Global (All Projects)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type *</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'PERCENTAGE' ? 'Commission Rate *' : 'Commission Amount (₹) *'}
                  </label>
                  <input type="number" required min="0" step={type === 'PERCENTAGE' ? '0.1' : '1'} value={value} onChange={e => setValue(e.target.value)} className="w-full border rounded-lg p-2 text-sm" placeholder={type === 'PERCENTAGE' ? 'e.g. 5' : 'e.g. 50000'} />
                </div>
                <div>
                  <button type="submit" disabled={submitting} className="w-full bg-action-blue text-white rounded-lg p-2 text-sm font-medium hover:bg-action-blue/90 disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* List */}
          <div>
            <h3 className="font-bold text-primary-navy mb-4">Commission Rules</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3">Associate</th>
                      <th className="p-3">Project</th>
                      <th className="p-3">Commission Type</th>
                      <th className="p-3">Commission Value</th>
                      <th className="p-3">Status</th>
                      {user?.role === 'MD' && <th className="p-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {policies.length === 0 ? (
                      <tr><td colSpan={6} className="p-4 text-center text-gray-500">No commission rules configured.</td></tr>
                    ) : (
                      policies.map(p => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="p-3">{p.associate.name}</td>
                          <td className="p-3 text-gray-600">{p.project ? p.project.name : 'Global'}</td>
                          <td className="p-3">{p.type}</td>
                          <td className="p-3 font-medium">{p.type === 'PERCENTAGE' ? `${p.value}%` : formatCurrency(p.value)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                              p.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          {user?.role === 'MD' && (
                            <td className="p-3">
                              {p.status === 'PENDING_APPROVAL' && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleApprove(p.id, 'ACTIVE')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve">
                                    <Check size={18} />
                                  </button>
                                  <button onClick={() => handleApprove(p.id, 'REJECTED')} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Reject">
                                    <XCircle size={18} />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
