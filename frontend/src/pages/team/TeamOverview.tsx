import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, User, Briefcase, Plus, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface Team {
  id: string;
  name: string;
  headUserId: string | null;
  createdAt: string;
  headUser: { id: string; userIdentifier: string; name: string; email: string; designation: string; profileImageUrl?: string | null } | null;
  totalMembers: number;
  activeMembers: number;
  directMembers: number;
}

export const TeamOverview: React.FC<{ onSelectTeam: (teamId: string) => void }> = ({ onSelectTeam }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const { user } = useAuth();
  const canManageTeams = user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER';

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamHeadId, setNewTeamHeadId] = useState('');
  const [creating, setCreating] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users?limit=100');
      if(res.data.users) setAvailableUsers(res.data.users);
    } catch(err) { console.error('Failed to fetch users', err); }
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/team/main-teams');
      setTeams(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch teams', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const memberIdsArray = selectedMembers;
      await api.post('/team/main-teams', { 
        name: newTeamName,
        headUserId: newTeamHeadId.trim() || undefined,
        memberIds: memberIdsArray
      });
      setNewTeamName('');
      setNewTeamHeadId('');
      setSelectedMembers([]);
      setShowCreateForm(false);
      fetchTeams(); // Reload teams
    } catch (err) {
      console.error('Failed to create team', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const totalMembersGlobal = teams.reduce((acc, t) => acc + t.totalMembers, 0);

  const handleDeleteTeam = async (e: React.MouseEvent, teamId: string, activeMembers: number) => {
    e.stopPropagation();
    if (activeMembers > 0) {
      alert('Cannot delete this team while members are assigned. Reassign the members first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this empty team?')) {
      try {
        await api.delete(`/team/main-teams/${teamId}`);
        fetchTeams();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete team');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-blue-50 text-action-blue rounded-full flex items-center justify-center mb-3">
            <Briefcase size={24} />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Teams</p>
          <h3 className="text-3xl font-black text-deep-navy">{teams.length}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
            <Users size={24} />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Members</p>
          <h3 className="text-3xl font-black text-deep-navy">{totalMembersGlobal}</h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search teams..."
            className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-action-blue focus:ring-1 focus:ring-action-blue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canManageTeams && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)} leftIcon={<Plus size={16} />}>
            Create Main Team
          </Button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateTeam} className="bg-white p-6 rounded-2xl shadow-sm border border-brand-gold flex items-end gap-4 animate-fade-in">
          <div className="flex-1 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">New Team Name</label>
              <input 
                type="text" 
                placeholder="e.g., Alpha Sales Division" 
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-brand-gold"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">Team Head (Optional)</label>
              <select
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-brand-gold"
                value={newTeamHeadId}
                onChange={e => setNewTeamHeadId(e.target.value)}
              >
                <option value="">Select Team Head</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.userIdentifier}) - {u.designation || 'Member'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700">Add Members (Optional)</label>
              <div className="h-48 overflow-y-auto border border-gray-300 rounded-xl p-2 bg-gray-50">
                {availableUsers.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border-b border-gray-100 last:border-0">
                    <input 
                      type="checkbox" 
                      className="rounded text-brand-gold focus:ring-brand-gold"
                      checked={selectedMembers.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMembers([...selectedMembers, u.id]);
                        else setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.userIdentifier} • {u.designation || 'Member'}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Save Team'}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div 
              key={team.id} 
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer flex flex-col"
              onClick={() => onSelectTeam(team.id)}
            >
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-deep-navy group-hover:text-action-blue transition-colors">{team.name}</h3>
                  <div className="flex items-center gap-2">
                    {canManageTeams && (
                      <button 
                        onClick={(e) => handleDeleteTeam(e, team.id, team.activeMembers)}
                        className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-action-blue transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>

                {team.headUser ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
                    <Avatar name={team.headUser.name} imageUrl={team.headUser.profileImageUrl} size="md" />
                    <div>
                      <p className="text-[10px] font-black text-action-blue uppercase tracking-wider mb-0.5">Team Head</p>
                      <p className="text-sm font-bold text-deep-navy">{team.headUser.name}</p>
                      <p className="text-xs text-gray-500">{team.headUser.userIdentifier}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-500">No Team Head</p>
                      <p className="text-xs text-gray-400">Unassigned</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">Total Members</p>
                    <p className="text-xl font-black text-deep-navy">{team.totalMembers}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">Direct to Head</p>
                    <p className="text-xl font-black text-deep-navy">{team.directMembers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-500 group-hover:text-action-blue transition-colors">
                <span>View Team Details</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
          
          {filteredTeams.length === 0 && !loading && (
             <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
               <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-3" />
               <h3 className="text-lg font-bold text-gray-900">No Teams Found</h3>
               <p className="text-gray-500 text-sm mt-1">Try a different search term or check back later.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
