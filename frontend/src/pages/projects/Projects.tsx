import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { getStaticUrl } from '../../services/api';
import { Plus, Building2, Search, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
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
  isHot?: boolean;
  isFeatured?: boolean;
  media?: any[];
  inventory?: any[];
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const searchParams = new URLSearchParams(location.search);
  const filterParam = searchParams.get('filter');
  
  const isManager = user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER';

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

  const filteredProjects = projects.filter(p => {
    if (filterParam === 'hot' && !p.isHot) return false;
    if (filterParam === 'featured' && !p.isFeatured) return false;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || 
           p.code.toLowerCase().includes(s) ||
           (p.location && p.location.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-deep-navy uppercase tracking-wide">
            {filterParam === 'hot' ? 'HOT DEALS' : filterParam === 'featured' ? 'FEATURED PROPERTIES' : 'Projects'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">Manage and view property projects.</p>
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
            <div 
              key={project.id} 
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-1"
            >
              <div className="h-56 bg-gray-100 relative overflow-hidden">
                {project.media && project.media.length > 0 ? (
                  <img 
                    src={getStaticUrl(project.media[0].url)} 
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                    <Building2 size={56} />
                  </div>
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  {project.isHot && (
                    <span className="bg-gradient-to-r from-red-600 to-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-red-500/30 flex items-center gap-1.5 uppercase tracking-widest animate-pulse">
                      🔥 HOT
                    </span>
                  )}
                  {project.isFeatured && !project.isHot && (
                    <span className="bg-gradient-to-r from-brand-gold to-yellow-500 text-deep-navy px-3 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-brand-gold/30 flex items-center gap-1.5 uppercase tracking-widest">
                      ⭐ FEATURED
                    </span>
                  )}
                </div>

                <div className="absolute top-4 left-4">
                   <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-deep-navy shadow-lg">
                    {project.code}
                  </span>
                </div>
                
                {project.verificationStatus === 'VERIFIED' && (
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1 uppercase tracking-wider">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-1 relative bg-white">
                <h3 className="text-xl font-black text-deep-navy mb-2 line-clamp-1 group-hover:text-action-blue transition-colors">{project.name}</h3>
                
                <div className="flex items-center text-sm text-gray-500 mb-6 gap-2">
                  <MapPin size={16} className="text-gray-400" /> 
                  <span className="line-clamp-1 font-medium">{project.location}</span>
                </div>
                
                <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-between">
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
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-action-blue group-hover:bg-action-blue group-hover:text-white transition-colors duration-300">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            </div>
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
