import React from 'react';
import { ArrowRight, Building2, MapPin, CheckCircle2 } from 'lucide-react';
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
  isHot?: boolean;
  isFeatured?: boolean;
}

interface Props {
  projects: FeaturedProjectData[];
}

const FeaturedProjects: React.FC<Props> = ({ projects }) => {
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No Projects Found</h3>
        <p className="mt-2 text-sm text-gray-500">Currently there are no featured projects available to display.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {projects.map((project) => (
        <div 
          key={project.id} 
          onClick={() => navigate(`/projects/${project.id}`)}
          className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group flex flex-col cursor-pointer hover:-translate-y-1"
        >
          <div className="h-56 bg-gray-100 relative overflow-hidden">
            {project.image ? (
              <img 
                src={getStaticUrl(project.image)} 
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                <Building2 size={56} />
              </div>
            )}
            
            {/* Overlay Gradient for better text legibility if needed later */}
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
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Availability</span>
                <span className="font-black text-lg text-deep-navy leading-none">
                  {project.availableUnits} <span className="text-sm font-medium text-gray-500">Units</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-action-blue group-hover:bg-action-blue group-hover:text-white transition-colors duration-300">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(FeaturedProjects);
