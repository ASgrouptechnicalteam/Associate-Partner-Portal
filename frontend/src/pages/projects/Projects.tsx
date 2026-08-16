import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getStaticUrl } from '../../services/api';
import { Plus, Building2, Search, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface Project {
  id: string;
  code: string;
  name: string;
  location: string;
  projectType: string;
  status: string;
  verificationStatus: string;
  media?: any[];
  inventory?: any[];
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isManager = user?.role === 'MD' || user?.role === 'ASSOCIATE_MANAGER';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Projects</h1>
          <p className="text-sm text-gray-500">Manage and view property projects.</p>
        </div>
        
        {isManager && (
          <Button
            onClick={() => navigate('/projects/create')}
            leftIcon={<Plus size={18} />}
          >
            Create Project
          </Button>
        )}
      </div>

      <Card padding="sm" className="flex items-center gap-3 focus-within:ring-2 focus-within:ring-action-blue/20 focus-within:border-action-blue transition-all">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search projects..."
          className="flex-1 outline-none text-sm text-primary-text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              padding="none"
              className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="h-48 bg-gray-50 relative overflow-hidden">
                {project.media && project.media.length > 0 ? (
                  <img 
                    src={getStaticUrl(project.media[0].url)} 
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Building2 size={48} />
                  </div>
                )}
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary-text shadow-sm">
                    {project.code}
                  </span>
                  {project.verificationStatus === 'VERIFIED' && (
                    <span className="bg-green-500/95 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="text-lg font-bold text-primary-text line-clamp-1">{project.name}</h3>
                </div>
                
                <div className="flex items-center text-sm text-muted-text mb-4 gap-4">
                  <span className="flex items-center gap-1.5"><MapPin size={16} /> {project.location}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant={
                      project.status === 'ACTIVE' ? 'success' :
                      project.status === 'DRAFT' ? 'neutral' :
                      project.status === 'PENDING_APPROVAL' ? 'warning' :
                      'danger'
                    }>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <button 
                    className="text-action-blue font-semibold text-sm flex items-center gap-1.5 hover:text-blue-700 transition-colors"
                  >
                    Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No projects found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
