import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeamOverview } from './TeamOverview';
import { TeamDetail } from './TeamDetail';

const TeamHierarchy: React.FC = () => {
  const { user } = useAuth();
  
  // MD sees the Overview by default, else we skip right to their team details.
  const canSeeOverview = user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER';
  
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(canSeeOverview ? null : (user as any)?.teamId || null);

  return (
    <div className="w-full">
      {selectedTeamId ? (
        <TeamDetail teamId={selectedTeamId} onBack={() => setSelectedTeamId(null)} />
      ) : (
        <TeamOverview onSelectTeam={setSelectedTeamId} />
      )}
    </div>
  );
};

export default TeamHierarchy;
