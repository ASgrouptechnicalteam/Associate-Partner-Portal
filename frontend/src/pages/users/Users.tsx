import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, ShieldAlert, User as UserIcon } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface User {
  id: string;
  associateId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  dateOfJoining: string | null;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access Denied');
      } else {
        setError('Unable to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PENDING_APPROVAL': return 'warning';
      case 'REJECTED': return 'danger';
      case 'SUSPENDED': return 'warning';
      case 'DEACTIVATED': return 'neutral';
      default: return 'neutral';
    }
  };

  if (error === 'Access Denied') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-primary-navy">Access Denied</h2>
          <p className="mt-2 text-gray-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Area */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Associate Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage portal associates and access.</p>
        </div>
        <Link to="/users/create">
          <Button leftIcon={<Plus size={18} />}>
            Add Associate
          </Button>
        </Link>
      </div>

      {/* Filters Area */}
      <Card padding="md" className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID, name, email or phone..."
            className="w-full rounded-xl border border-border-subtle bg-gray-50 py-2.5 pl-10 pr-4 outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <select
              className="appearance-none rounded-xl border border-border-subtle bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue font-semibold text-primary-text"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="MD">MD</option>
              <option value="ASSOCIATE_MANAGER">Associate Manager</option>
              <option value="ASSOCIATE">Associate</option>
            </select>
          </div>
          
          <div className="relative">
            <select
              className="appearance-none rounded-xl border border-border-subtle bg-gray-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue font-semibold text-primary-text"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {error && !loading ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      ) : loading && users.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-navy"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow-sm">
          <p className="text-gray-500">No associates found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card padding="none" className="hidden overflow-hidden md:block">
            <table className="min-w-full divide-y divide-border-subtle">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Associate</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Date of Joining</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-navy/10 flex items-center justify-center text-primary-navy shrink-0">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-primary-navy">{user.name}</div>
                          <div className="text-xs text-muted-text mt-0.5">{user.associateId || '-'}</div>
                          <div className="text-xs text-muted-text">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant="neutral">{user.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 font-medium">
                      {user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString() : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={getStatusColor(user.status)}>
                        {user.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/users/${user.id}`} className="text-action-blue hover:text-blue-900 bg-action-blue/10 p-2 rounded-lg" title="View Profile"><Eye size={18} /></Link>
                        <Link to={`/users/${user.id}/edit`} className="text-brand-gold hover:text-yellow-700 bg-brand-gold/10 p-2 rounded-lg" title="Edit Profile"><Edit size={18} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile Cards View */}
          <div className="space-y-4 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-primary-navy">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.associateId || 'No ID'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(user.status)}`}>
                    {user.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mb-4 space-y-1 text-sm text-gray-600">
                  <p>{user.email}</p>
                  <p className="font-medium text-gray-800">{user.role}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex gap-4">
                    <Link to={`/users/${user.id}`} className="p-1 text-blue-600"><Eye size={20} /></Link>
                    <Link to={`/users/${user.id}/edit`} className="p-1 text-yellow-600"><Edit size={20} /></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Users;
