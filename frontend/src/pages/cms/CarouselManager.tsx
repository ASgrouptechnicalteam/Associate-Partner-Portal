import React, { useState, useEffect, useRef } from 'react';
import api, { getStaticUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, Plus, Edit2, Trash2, ArrowUp, ArrowDown, GripVertical, Check, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface CarouselItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaTargetUrl: string | null;
  projectId: string | null;
  status: string;
  displayOrder: number;
  startAt: string | null;
  endAt: string | null;
  project?: { name: string; id: string };
}

interface Project {
  id: string;
  name: string;
}

const CarouselManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOrderChanged, setIsOrderChanged] = useState(false);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<CarouselItem | null>(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', imageUrl: '', ctaLabel: '', ctaTargetUrl: '', 
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
      const [carouselRes, projRes] = await Promise.all([
        api.get('/v1/carousel'),
        api.get('/projects')
      ]);
      setItems(carouselRes.data.data.sort((a: CarouselItem, b: CarouselItem) => a.displayOrder - b.displayOrder));
      setProjects(projRes.data.data);
      setIsOrderChanged(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.parentNode as any);
    e.dataTransfer.setDragImage(e.currentTarget.parentNode as Element, 20, 20);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setItems(newItems);
    setIsOrderChanged(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    setIsOrderChanged(true);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);
    setIsOrderChanged(true);
  };

  const saveOrder = async () => {
    try {
      setSaving(true);
      const payload = items.map((item, idx) => ({ id: item.id, displayOrder: idx + 1 }));
      await api.patch('/v1/carousel/reorder', { items: payload });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/v1/carousel/${id}`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this carousel banner?')) return;
    try {
      await api.delete(`/v1/carousel/${id}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openForm = (item?: CarouselItem) => {
    if (item) {
      setEditItem(item);
      setForm({
        title: item.title || '',
        subtitle: item.subtitle || '',
        imageUrl: item.imageUrl,
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
        title: '', subtitle: '', imageUrl: '', ctaLabel: '', ctaTargetUrl: '', 
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
        const uploadRes = await api.post('/v1/carousel/upload', formData);
        finalImageUrl = uploadRes.data.data.url;
      }

      if (!finalImageUrl) {
        throw new Error('Image is required');
      }

      const payload = {
        ...form,
        imageUrl: finalImageUrl,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
        displayOrder: editItem ? editItem.displayOrder : items.length + 1
      };

      if (editItem) {
        await api.patch(`/v1/carousel/${editItem.id}`, payload);
      } else {
        await api.post('/v1/carousel', payload);
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
          <h1 className="text-2xl font-bold text-gray-900">Carousel CMS</h1>
          <p className="text-sm text-gray-500">Manage dashboard banners</p>
        </div>
        <div className="flex space-x-3">
          {isOrderChanged && (
            <Button
              onClick={saveOrder}
              isLoading={saving}
              variant="success"
              leftIcon={<Save className="w-4 h-4 mr-2" />}
            >
              Save Order
            </Button>
          )}
          <Button
            onClick={() => openForm()}
            leftIcon={<Plus className="w-4 h-4 mr-2" />}
          >
            Add Banner
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      {isEditing ? (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-medium mb-4">{editItem ? 'Edit Banner' : 'New Banner'}</h2>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Image Upload</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  ref={fileInputRef}
                  required={!editItem && !form.imageUrl}
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
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.subtitle}
                  onChange={e => setForm({...form, subtitle: e.target.value})}
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
                Save Banner
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card padding="none">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-1 text-center">Order</div>
            <div className="col-span-3">Preview</div>
            <div className="col-span-3">Details</div>
            <div className="col-span-2">Schedule</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          <div className="divide-y divide-gray-200" onDragOver={(e) => e.preventDefault()}>
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${draggedIndex === index ? 'bg-indigo-50 opacity-50' : 'hover:bg-gray-50'}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDragEnd}
              >
                <div className="col-span-1 flex flex-col items-center space-y-2">
                  <button 
                    type="button"
                    onClick={() => moveUp(index)} 
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-700"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <button 
                    type="button"
                    onClick={() => moveDown(index)} 
                    disabled={index === items.length - 1}
                    className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="col-span-3">
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={getStaticUrl(item.imageUrl)} alt={item.title || 'Banner'} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="col-span-3">
                  <p className="font-medium text-gray-900 truncate">{item.title || '(No title)'}</p>
                  <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
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
                No carousel banners found. Click "Add Banner" to create one.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CarouselManager;
