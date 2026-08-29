import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';

interface DownlineUser {
  id: string;
  userIdentifier: string;
  name: string;
  designation: string;
  role: { name: string };
  commissionPercentage: number;
  status: string;
  dateOfJoining: string;
  teamId: string;
  profileImageUrl?: string;
  parentId: string | null;
  directMembersCount: number;
  totalDescendantsCount: number;
  children: DownlineUser[];
}

const ExpandableRow: React.FC<{ 
  member: DownlineUser; 
  level: number; 
  parentMap: Record<string, { name: string, userIdentifier: string }>;
  teamName: string;
}> = ({ member, level, parentMap, teamName }) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = member.children && member.children.length > 0;
  
  const parentDetails = member.parentId ? parentMap[member.parentId] : null;

  return (
    <>
      <tr className="hover:bg-blue-50/30 transition-colors border-b border-gray-100">
        <td className="py-4 px-4" style={{ paddingLeft: `${Math.max(16, level * 32 + 16)}px` }}>
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="p-1 rounded-md hover:bg-gray-200">
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <div className="w-6" /> // spacer
            )}
            <Avatar name={member.name} imageUrl={member.profileImageUrl} size="md" className="flex-shrink-0" />
            <div>
              <p className="font-bold text-deep-navy">{member.name}</p>
              <p className="text-xs text-gray-500">{member.userIdentifier}</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-4">
          <p className="font-semibold text-action-blue text-sm">{member.designation || member.role?.name}</p>
          {member.commissionPercentage !== null && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full font-bold inline-block mt-1">
              {member.commissionPercentage}% Comm
            </span>
          )}
        </td>
        <td className="py-4 px-4 text-sm text-gray-700">
          {teamName}
        </td>
        <td className="py-4 px-4">
          {parentDetails ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{parentDetails.name}</p>
              <p className="text-xs text-gray-500">{parentDetails.userIdentifier}</p>
            </div>
          ) : (
             <span className="text-sm text-gray-400">None</span>
          )}
        </td>
        <td className="py-4 px-4 text-center">
          <p className="text-sm font-bold text-gray-900">{member.directMembersCount || 0}</p>
        </td>
        <td className="py-4 px-4 text-center">
          <p className="text-sm font-bold text-action-blue">{member.totalDescendantsCount || 0}</p>
        </td>
        <td className="py-4 px-4">
           <p className="text-sm text-gray-900">{member.dateOfJoining ? new Date(member.dateOfJoining).toLocaleDateString() : '-'}</p>
        </td>
        <td className="py-4 px-4">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {member.status}
          </span>
        </td>
        <td className="py-4 px-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Link to={`/users/${member.id}`} className="text-sm font-semibold text-action-blue hover:underline">
              Profile
            </Link>
            {hasChildren && (
              <button 
                onClick={() => setExpanded(!expanded)} 
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-1 rounded-md ml-2"
              >
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {expanded && hasChildren && member.children.map(child => (
        <ExpandableRow 
          key={child.id} 
          member={child} 
          level={level + 1} 
          parentMap={parentMap}
          teamName={teamName}
        />
      ))}
    </>
  );
};

export const TeamDetail: React.FC<{ teamId: string, onBack: () => void }> = ({ teamId, onBack }) => {
  const [hierarchyData, setHierarchyData] = useState<DownlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState<string>('Team');
  const [parentMap, setParentMap] = useState<Record<string, { name: string, userIdentifier: string }>>({});

  useEffect(() => {
    fetchHierarchy();
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    try {
      const res = await api.get('/team/main-teams');
      const team = res.data.data?.find((t: any) => t.id === teamId);
      if (team) setTeamName(team.name);
    } catch (e) {}
  };

  const fetchHierarchy = async () => {
    try {
      const res = await api.get(`/team/main-teams/${teamId}/hierarchy`);
      const roots = res.data.data || [];
      setHierarchyData(roots);
      
      // Build parent map for name resolution
      const map: Record<string, { name: string, userIdentifier: string }> = {};
      const traverse = (nodes: DownlineUser[]) => {
        nodes.forEach(n => {
          map[n.id] = { name: n.name, userIdentifier: n.userIdentifier };
          if (n.children) traverse(n.children);
        });
      };
      traverse(roots);
      setParentMap(map);

    } catch (error) {
      console.error('Failed to fetch team hierarchy', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">{teamName} - Hierarchy</h1>
          <p className="text-sm text-gray-500">View and manage this team's members.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Associate</th>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Designation</th>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Team</th>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Immediate Superior</th>
                <th className="py-4 px-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Direct</th>
                <th className="py-4 px-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Below</th>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hierarchyData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">No members found in this hierarchy.</td>
                </tr>
              ) : (
                hierarchyData.map(root => (
                  <ExpandableRow 
                    key={root.id} 
                    member={root} 
                    level={0} 
                    parentMap={parentMap}
                    teamName={teamName}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

