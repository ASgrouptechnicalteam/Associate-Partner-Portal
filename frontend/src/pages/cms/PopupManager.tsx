import React, { useState, useEffect, useRef } from 'react';
import api, { getStaticUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface PopupItem {
  id: string;
  heading: string;
  description: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaTargetUrl: string | null;
  projectId: string | null;
  status: string;
  startAt: string | null;
  endAt: string | null;
  project?: { name: string; id: string };
}

interface Project {
  id: string;
  name: string;
}

const PopupManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PopupItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<PopupItem | null>(null);
  const [form, setForm] = useState({
    heading: '', description: '', imageUrl: '', ctaLabel: '', ctaTargetUrl: '', 
    projectId: '', status: 'ACTIVE', startAt: '', endAt: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.role !== 'MD' && user.role !== 'ASSOCIATE_MANAGER') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [popupRes, projRes] = await Promise.all([
        api.get('/v1/popups'),
        api.get('/projects')
      ]);
      setItems(popupRes.data.data);
      setProjects(projRes.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/v1/popups/${id}`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup?')) return;
    try {
      await api.delete(`/v1/popups/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openForm = (item?: PopupItem) => {
    if (item) {
      setEditItem(item);
      setForm({
        heading: item.heading,
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        ctaLabel: item.ctaLabel || '',
        ctaTargetUrl: item.ctaTargetUrl || '',
        projectId: item.projectId || '',
        status: item.status,
        startAt: item.startAt ? new Date(item.startAt).toISOString().slice(0, 16) : '',
        endAt: item.endAt ? new Date(item.endAt).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditItem(null);
      setForm({
        heading: '', description: '', imageUrl: '', ctaLabel: '', ctaTargetUrl: '', 
        projectId: '', status: 'ACTIVE', startAt: '', endAt: ''
      });
    }
    setFile(null);
    setIsEditing(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      let finalImageUrl = form.imageUrl;
      
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        // We reuse carousel upload endpoint because it just returns a URL
        const uploadRes = await api.post('/v1/carousel/upload', formData);
        finalImageUrl = uploadRes.data.data.url;
      }

      const payload = {
        ...form,
        imageUrl: finalImageUrl,
        startAt: form.startAt || null,
        endAt: form.endAt || null
      };

      if (editItem) {
        await api.patch(`/v1/popups/${editItem.id}`, payload);
      } else {
        await api.post('/v1/popups', payload);
      }

      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Popup CMS</h1>
          <p className="text-sm text-gray-500">Manage promotional popups</p>
        </div>
        <Button
          onClick={() => openForm()}
          leftIcon={<Plus className="w-4 h-4 mr-2" />}
        >
          Add Popup
        </Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-medium mb-4">{editItem ? 'Edit Popup' : 'New Popup'}</h2>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Image Upload (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  ref={fileInputRef}
                />
                {(form.imageUrl || file) && (
                  <div className="mt-2 text-sm text-gray-500">
                    {file ? 'New image selected' : 'Current image: ' + form.imageUrl}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Project (Optional)</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.projectId}
                  onChange={e => setForm({...form, projectId: e.target.value})}
                >
                  <option value="">-- None --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Heading *</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.heading}
                  onChange={e => setForm({...form, heading: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CTA Label</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.ctaLabel}
                  onChange={e => setForm({...form, ctaLabel: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CTA Target URL</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.ctaTargetUrl}
                  onChange={e => setForm({...form, ctaTargetUrl: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.startAt}
                  onChange={e => setForm({...form, startAt: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.endAt}
                  onChange={e => setForm({...form, endAt: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 border-t border-border-subtle pt-4">
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={saving}
              >
                Save Popup
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card padding="none">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-3">Preview</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-2">Schedule</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                <div className="col-span-3">
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={getStaticUrl(item.imageUrl)} alt={item.heading} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="col-span-4">
                  <p className="font-medium text-gray-900 truncate">{item.heading}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  {item.project && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {item.project.name}
                    </span>
                  )}
                </div>

                <div className="col-span-2 text-sm text-gray-500 space-y-1">
                  <div><span className="font-medium">Start:</span> {item.startAt ? new Date(item.startAt).toLocaleDateString() : 'Immediate'}</div>
                  <div><span className="font-medium">End:</span> {item.endAt ? new Date(item.endAt).toLocaleDateString() : 'Never'}</div>
                </div>

                <div className="col-span-1">
                  <Badge variant={
                    item.status === 'ACTIVE' ? 'success' : 
                    item.status === 'SCHEDULED' ? 'info' : 
                    item.status === 'EXPIRED' ? 'danger' : 
                    'neutral'
                  }>
                    {item.status.toLowerCase()}
                  </Badge>
                </div>

                <div className="col-span-2 flex justify-end space-x-2">
                  <button
                    onClick={() => handleStatusChange(item.id, item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className={`p-2 rounded-md ${item.status === 'ACTIVE' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openForm(item)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No promotional popups found. Click "Add Popup" to create one.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PopupManager;
