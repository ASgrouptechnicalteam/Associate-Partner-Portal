import React from 'react';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import { getStaticUrl } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export interface FeaturedProjectData {
  id: string;
  name: string;
  code: string;
  location: string;
  projectType: string;
  status: string;
  verificationStatus: string;
  availableUnits: number;
  image: string | null;
}

interface Props {
  projects: FeaturedProjectData[];
}

const FeaturedProjects: React.FC<Props> = ({ projects }) => {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-gray-50">
        <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Featured Projects</h3>
        <p className="mt-1 text-sm text-gray-500">Currently there are no featured projects available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden hover:shadow-md transition-shadow group flex flex-col"
        >
          <div className="h-52 bg-gray-50 relative overflow-hidden">
            {project.image ? (
              <img 
                src={getStaticUrl(project.image)} 
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
            <h3 className="text-lg font-bold text-primary-text mb-1.5 line-clamp-1">{project.name}</h3>
            
            <div className="flex items-center text-sm text-muted-text mb-4 gap-4">
              <span className="flex items-center gap-1.5"><MapPin size={16} /> {project.location}</span>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border-subtle flex items-center justify-between">
              <div className="text-sm">
                <span className="font-bold text-primary-text">{project.availableUnits}</span>
                <span className="text-muted-text ml-1.5">Units Available</span>
              </div>
              <button 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="text-action-blue font-semibold text-sm flex items-center gap-1.5 hover:text-blue-700 transition-colors"
              >
                View Details <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturedProjects;
