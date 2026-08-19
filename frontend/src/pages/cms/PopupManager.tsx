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
    heading: '',
    description: '',
    imageUrl: '',
    ctaLabel: '',
    ctaTargetUrl: '',
    projectId: '',
    status: 'ACTIVE',
    startAt: '',
    endAt: '',
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
        api.get('/projects'),
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

  const handleStatusChange = async (
    id: string,
    newStatus: string
  ) => {
    try {
      await api.patch(`/v1/popups/${id}`, {
        status: newStatus,
      });

      fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to update status'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this popup?')) {
      return;
    }

    try {
      await api.delete(`/v1/popups/${id}`);
      fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to delete'
      );
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
        startAt: item.startAt
          ? new Date(item.startAt)
              .toISOString()
              .slice(0, 16)
          : '',
        endAt: item.endAt
          ? new Date(item.endAt)
              .toISOString()
              .slice(0, 16)
          : '',
      });
    } else {
      setEditItem(null);

      setForm({
        heading: '',
        description: '',
        imageUrl: '',
        ctaLabel: '',
        ctaTargetUrl: '',
        projectId: '',
        status: 'ACTIVE',
        startAt: '',
        endAt: '',
      });
    }

    setFile(null);
    setIsEditing(true);
  };

  const submitForm = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSaving(true);

      let finalImageUrl = form.imageUrl;

      if (file) {
        const formData = new FormData();

        formData.append('file', file);

        // Reuse carousel upload endpoint.
        const uploadRes = await api.post(
          '/v1/carousel/upload',
          formData
        );

        finalImageUrl =
          uploadRes.data.data.url;
      }

      const payload = {
        ...form,
        imageUrl: finalImageUrl,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      };

      if (editItem) {
        await api.patch(
          `/v1/popups/${editItem.id}`,
          payload
        );
      } else {
        await api.post(
          '/v1/popups',
          payload
        );
      }

      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to save'
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusVariant = (
    status: string
  ) => {
    if (status === 'ACTIVE') {
      return 'success';
    }

    if (status === 'SCHEDULED') {
      return 'info';
    }

    if (status === 'EXPIRED') {
      return 'danger';
    }

    return 'neutral';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full min-w-0">

      {/* ============================== */}
      {/* PAGE HEADER */}
      {/* ============================== */}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-primary-navy">
            Popup CMS
          </h1>

          <p className="text-sm text-gray-500">
            Manage promotional popups
          </p>
        </div>

        <Button
          onClick={() => openForm()}
          leftIcon={
            <Plus className="w-4 h-4 mr-2" />
          }
          className="w-full sm:w-auto"
        >
          Add Popup
        </Button>

      </div>

      {/* ============================== */}
      {/* ERROR */}
      {/* ============================== */}

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 break-words">
          {error}
        </div>
      )}

      {/* ============================== */}
      {/* FORM */}
      {/* ============================== */}

      {isEditing ? (

        <Card
          padding="lg"
          className="mb-6 w-full min-w-0"
        >

          <h2 className="text-lg font-medium mb-4">
            {editItem
              ? 'Edit Popup'
              : 'New Popup'}
          </h2>

          <form
            onSubmit={submitForm}
            className="space-y-4"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Image Upload */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  Image Upload (Optional)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                  className="mt-1 block w-full max-w-full text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  ref={fileInputRef}
                />

                {(form.imageUrl || file) && (
                  <div className="mt-2 text-sm text-gray-500 break-all">
                    {file
                      ? 'New image selected'
                      : 'Current image: ' +
                        form.imageUrl}
                  </div>
                )}

              </div>

              {/* Project */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  Project (Optional)
                </label>

                <select
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.projectId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      projectId:
                        e.target.value,
                    })
                  }
                >

                  <option value="">
                    -- None --
                  </option>

                  {projects.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* Heading */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  Heading *
                </label>

                <input
                  type="text"
                  required
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.heading}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      heading:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* Description */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>

                <input
                  type="text"
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* CTA Label */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  CTA Label
                </label>

                <input
                  type="text"
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.ctaLabel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ctaLabel:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* CTA Target URL */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  CTA Target URL
                </label>

                <input
                  type="text"
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={
                    form.ctaTargetUrl
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ctaTargetUrl:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* Start Date */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  Start Date (Optional)
                </label>

                <input
                  type="datetime-local"
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      startAt:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* End Date */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  End Date (Optional)
                </label>

                <input
                  type="datetime-local"
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.endAt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endAt:
                        e.target.value,
                    })
                  }
                />

              </div>

              {/* Status */}

              <div className="min-w-0">

                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  className="mt-1 block w-full max-w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value,
                    })
                  }
                >

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 border-t border-border-subtle pt-4">

              <Button
                type="button"
                onClick={() =>
                  setIsEditing(false)
                }
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                isLoading={saving}
                className="w-full sm:w-auto"
              >
                Save Popup
              </Button>

            </div>

          </form>

        </Card>

      ) : (

        /* ============================== */
        /* POPUP LIST */
        /* ============================== */

        <Card
          padding="none"
          className="w-full min-w-0 overflow-hidden"
        >

          {/* ================================= */}
          {/* DESKTOP TABLE HEADER */}
          {/* ================================= */}

          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">

            <div className="col-span-3">
              Preview
            </div>

            <div className="col-span-4">
              Details
            </div>

            <div className="col-span-2">
              Schedule
            </div>

            <div className="col-span-1">
              Status
            </div>

            <div className="col-span-2 text-right">
              Actions
            </div>

          </div>

          <div className="divide-y divide-gray-200">

            {items.map((item) => (

              <React.Fragment key={item.id}>

                {/* ================================= */}
                {/* DESKTOP ROW */}
                {/* ================================= */}

                <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">

                  {/* Preview */}

                  <div className="col-span-3 min-w-0">

                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex items-center justify-center">

                      {item.imageUrl ? (

                        <img
                          src={getStaticUrl(
                            item.imageUrl
                          )}
                          alt={item.heading}
                          className="w-full h-full object-cover"
                        />

                      ) : (

                        <ImageIcon className="w-8 h-8 text-gray-400" />

                      )}

                    </div>

                  </div>

                  {/* Details */}

                  <div className="col-span-4 min-w-0">

                    <p className="font-medium text-gray-900 truncate">
                      {item.heading}
                    </p>

                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 break-words">
                        {item.description}
                      </p>
                    )}

                    {item.project && (

                      <span className="inline-flex max-w-full items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1 truncate">
                        {item.project.name}
                      </span>

                    )}

                  </div>

                  {/* Schedule */}

                  <div className="col-span-2 text-sm text-gray-500 space-y-1">

                    <div>
                      <span className="font-medium">
                        Start:
                      </span>{' '}
                      {item.startAt
                        ? new Date(
                            item.startAt
                          ).toLocaleDateString()
                        : 'Immediate'}
                    </div>

                    <div>
                      <span className="font-medium">
                        End:
                      </span>{' '}
                      {item.endAt
                        ? new Date(
                            item.endAt
                          ).toLocaleDateString()
                        : 'Never'}
                    </div>

                  </div>

                  {/* Status */}

                  <div className="col-span-1">

                    <Badge
                      variant={getStatusVariant(
                        item.status
                      )}
                    >
                      {item.status.toLowerCase()}
                    </Badge>

                  </div>

                  {/* Actions */}

                  <div className="col-span-2 flex justify-end space-x-2">

                    <button
                      onClick={() =>
                        handleStatusChange(
                          item.id,
                          item.status === 'ACTIVE'
                            ? 'INACTIVE'
                            : 'ACTIVE'
                        )
                      }
                      className={`p-2 rounded-md ${
                        item.status === 'ACTIVE'
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={
                        item.status === 'ACTIVE'
                          ? 'Deactivate'
                          : 'Activate'
                      }
                    >
                      <Check className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() =>
                        openForm(item)
                      }
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                  </div>

                </div>

                {/* ================================= */}
                {/* MOBILE CARD */}
                {/* ================================= */}

                <div className="md:hidden p-3 sm:p-4">

                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">

                    {/* Mobile Preview */}

                    <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">

                      {item.imageUrl ? (

                        <img
                          src={getStaticUrl(
                            item.imageUrl
                          )}
                          alt={item.heading}
                          className="w-full h-full object-cover"
                        />

                      ) : (

                        <ImageIcon className="w-10 h-10 text-gray-400" />

                      )}

                    </div>

                    {/* Mobile Content */}

                    <div className="p-4 space-y-4">

                      {/* Heading + Status */}

                      <div className="flex items-start gap-3">

                        <div className="min-w-0 flex-1">

                          <h3 className="font-semibold text-gray-900 break-words">
                            {item.heading}
                          </h3>

                          {item.description && (
                            <p className="mt-1 text-sm text-gray-500 break-words whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}

                        </div>

                        <div className="shrink-0">

                          <Badge
                            variant={getStatusVariant(
                              item.status
                            )}
                          >
                            {item.status.toLowerCase()}
                          </Badge>

                        </div>

                      </div>

                      {/* Project */}

                      {item.project && (

                        <div>

                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Project
                          </p>

                          <span className="inline-flex max-w-full px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 break-words">
                            {item.project.name}
                          </span>

                        </div>

                      )}

                      {/* Schedule */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                        <div className="rounded-lg bg-gray-50 p-3 min-w-0">

                          <p className="text-xs font-medium text-gray-500">
                            Start
                          </p>

                          <p className="mt-1 text-sm text-gray-900 break-words">
                            {item.startAt
                              ? new Date(
                                  item.startAt
                                ).toLocaleDateString()
                              : 'Immediate'}
                          </p>

                        </div>

                        <div className="rounded-lg bg-gray-50 p-3 min-w-0">

                          <p className="text-xs font-medium text-gray-500">
                            End
                          </p>

                          <p className="mt-1 text-sm text-gray-900 break-words">
                            {item.endAt
                              ? new Date(
                                  item.endAt
                                ).toLocaleDateString()
                              : 'Never'}
                          </p>

                        </div>

                      </div>

                      {/* CTA Information */}

                      {(item.ctaLabel ||
                        item.ctaTargetUrl) && (

                        <div className="rounded-lg border border-gray-200 p-3 space-y-2">

                          {item.ctaLabel && (

                            <div>

                              <p className="text-xs font-medium text-gray-500">
                                CTA Label
                              </p>

                              <p className="text-sm text-gray-900 break-words">
                                {item.ctaLabel}
                              </p>

                            </div>

                          )}

                          {item.ctaTargetUrl && (

                            <div>

                              <p className="text-xs font-medium text-gray-500">
                                Target
                              </p>

                              <p className="text-sm text-gray-600 break-all">
                                {item.ctaTargetUrl}
                              </p>

                            </div>

                          )}

                        </div>

                      )}

                      {/* Mobile Actions */}

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">

                        <button
                          onClick={() =>
                            handleStatusChange(
                              item.id,
                              item.status === 'ACTIVE'
                                ? 'INACTIVE'
                                : 'ACTIVE'
                            )
                          }
                          className={`min-h-11 flex items-center justify-center gap-1 rounded-lg border text-sm font-medium ${
                            item.status === 'ACTIVE'
                              ? 'border-green-200 text-green-600 hover:bg-green-50'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                          title={
                            item.status === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'
                          }
                        >
                          <Check className="w-4 h-4 shrink-0" />

                          <span className="hidden sm:inline">
                            {item.status === 'ACTIVE'
                              ? 'Off'
                              : 'On'}
                          </span>

                        </button>

                        <button
                          onClick={() =>
                            openForm(item)
                          }
                          className="min-h-11 flex items-center justify-center gap-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-medium"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 shrink-0" />

                          <span>
                            Edit
                          </span>

                        </button>

                        <button
                          onClick={() =>
                            handleDelete(item.id)
                          }
                          className="min-h-11 flex items-center justify-center gap-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />

                          <span>
                            Delete
                          </span>

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              </React.Fragment>

            ))}

            {/* Empty State */}

            {items.length === 0 && (

              <div className="p-8 text-center text-gray-500">
                No promotional popups found. Click
                "Add Popup" to create one.
              </div>

            )}

          </div>

        </Card>

      )}

    </div>
  );
};

export default PopupManager;