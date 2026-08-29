import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getStaticUrl } from '../../services/api';
import { ArrowLeft, CheckCircle, XCircle, Map, LayoutDashboard, MapPin, Building2, Calendar, ShieldCheck, Home, Eye, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDesigner } from '../../components/projects/layout-designer/LayoutDesigner';
import { LayoutViewer } from '../../components/projects/layout-viewer/LayoutViewer';
import { formatCurrency } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AddUnitModal } from '../../components/projects/inventory/AddUnitModal';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'layout' | 'gallery' | 'layout_manager'>('overview');
  
  // Media upload and viewer state
  const [isUploading, setIsUploading] = useState(false);
  const [settingCoverId, setSettingCoverId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const isManager = user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER';
  const isMD = user?.role === 'MD';

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch (err: any) {
      setError('Failed to fetch project details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'submit' | 'approve' | 'reject') => {
    try {
      const payload = action === 'reject' ? { rejectionReason: 'Rejected by MD' } : {};
      await api.patch(`/projects/${id}/${action}`, payload);
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} project`);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    // Validate file sizes first
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`The following files exceed the 10 MB maximum and will not be uploaded:\n${oversizedFiles.map(f => f.name).join('\n')}`);
    }

    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    let uploadErrors = false;
    
    try {
      // If uploading exactly one image, we can ask about the cover image
      let isCover = false;
      if (validFiles.length === 1 && validFiles[0].type.startsWith('image/')) {
        isCover = window.confirm('Mark this image as the Cover Image?');
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Only the first image gets the cover flag if chosen
        formData.append('isCover', (isCover && i === 0) ? 'true' : 'false');
        formData.append('mediaType', file.type.startsWith('video/') ? 'VIDEO' : file.type === 'application/pdf' ? 'DOCUMENT' : 'GALLERY');
        
        try {
          await api.post(`/projects/${id}/media`, formData);
        } catch (err) {
          console.error(`Failed to upload ${file.name}`, err);
          uploadErrors = true;
        }
      }

      if (uploadErrors) {
        alert('Some files failed to upload. Please try again.');
      }
      
      fetchProject();
    } catch (err: any) {
      alert('Failed to process media upload');
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
      </div>
    );
  }

  if (error || !project) {
    return <div className="p-8 text-center text-red-500">{error || 'Project not found'}</div>;
  }

  const getHeroImageUrl = () => {
    if (!project || !project.media || project.media.length === 0) return null;
    const coverMedia = project.media.find((m: any) => m.isCover === true);
    const selectedMedia = coverMedia || project.media[0];
    return getStaticUrl(selectedMedia.url);
  };
  const heroImage = getHeroImageUrl();

  return (
    <div className="space-y-6 pb-24 animate-in fade-in max-w-7xl mx-auto">
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg shadow-sm border border-green-100 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-muted-text hover:text-primary-navy transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          <span className="font-medium text-sm">Back to Projects</span>
        </button>
        
        {isManager && (
          <div className="flex gap-2">
            {project.status === 'DRAFT' && (
              <Button onClick={() => handleAction('submit')}>Submit for Approval</Button>
            )}
            {isMD && project.status === 'PENDING_APPROVAL' && (
              <>
                <Button onClick={() => handleAction('approve')} variant="success" leftIcon={<CheckCircle size={16} />}>Approve</Button>
                <Button onClick={() => {
                    const reason = prompt('Reason for rejection:');
                    if (reason) {
                      api.patch(`/projects/${id}/reject`, { rejectionReason: reason })
                        .then(() => fetchProject())
                        .catch((err: any) => alert(err.response?.data?.message || 'Failed'));
                    }
                  }} variant="danger" leftIcon={<XCircle size={16} />}>Reject</Button>
              </>
            )}
            <Button 
              onClick={() => {
                api.patch(`/projects/${id}/hot`, { isHot: !project.isHot })
                  .then(() => fetchProject())
                  .catch((err: any) => alert(err.response?.data?.message || 'Failed'));
              }} 
              variant="outline"
              className={project.isHot ? "bg-orange-50 border-orange-200 text-orange-600" : ""}
            >
              {project.isHot ? 'Remove from Hot' : 'Mark as Hot'}
            </Button>
            <Button 
              onClick={() => {
                api.patch(`/projects/${id}/featured`, { isFeatured: !project.isFeatured })
                  .then(() => fetchProject())
                  .catch((err: any) => alert(err.response?.data?.message || 'Failed'));
              }} 
              variant="outline"
              className={project.isFeatured ? "bg-blue-50 border-blue-200 text-blue-600" : ""}
            >
              {project.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
            </Button>
            <Button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete or archive this project? Historical bookings may be preserved.')) {
                  api.delete(`/projects/${id}`)
                    .then(() => {
                      alert('Project deleted successfully');
                      navigate('/projects');
                    })
                    .catch((err: any) => alert(err.response?.data?.message || 'Failed to delete project'));
                }
              }} 
              variant="danger"
            >
              Delete Project
            </Button>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <Card padding="none" className="overflow-hidden">
        <div className="h-64 md:h-80 relative bg-gray-100 flex items-center justify-center">
          {heroImage ? (
            <img src={heroImage} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 size={64} className="text-gray-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/80 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="neutral" className="bg-white/20 text-white border-none backdrop-blur-md">{project.code}</Badge>
              {project.verificationStatus === 'VERIFIED' && (
                <Badge variant="success" className="bg-green-500/20 text-green-100 border-green-400/30 backdrop-blur-md flex items-center gap-1">
                  <ShieldCheck size={14} /> Verified
                </Badge>
              )}
              <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'} className="backdrop-blur-md">
                {project.status.replace('_', ' ')}
              </Badge>
              {project.isHot && (
                <Badge variant="warning" className="bg-orange-500/20 text-orange-100 border-orange-400/30 backdrop-blur-md">
                  HOT PROPERTY
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.name}</h1>
            <div className="flex items-center gap-2 text-gray-200 text-sm md:text-base">
              <MapPin size={18} />
              <span>{project.location}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-border-subtle overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Home },
          { id: 'layout', label: 'Master Plan & Inventory', icon: Map },
          { id: 'gallery', label: 'Gallery', icon: Building2 },
          ...(isManager ? [{ id: 'layout_manager', label: 'Manage Layout', icon: LayoutDashboard }] : [])
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm transition-all whitespace-nowrap rounded-t-lg ${
              activeTab === tab.id 
                ? 'bg-white border-t border-l border-r border-border-subtle text-action-blue -mb-px' 
                : 'text-muted-text hover:text-primary-navy hover:bg-gray-50 border-transparent border-t border-l border-r'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'layout_manager' && isManager ? (
          <LayoutDesigner 
            projectId={project.id} 
            inventoryUnits={project.inventory || []} 
            onRefreshProject={fetchProject}
          />
        ) : activeTab === 'layout' ? (
          <div className="space-y-6">
            <LayoutViewer projectId={project.id} inventoryUnits={project.inventory || []} />
            
            <Card padding="md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary-navy">Inventory List</h2>
                {isManager && (
                  <Button size="sm" variant="outline" onClick={() => setIsAddUnitModalOpen(true)}>
                    + Add Unit
                  </Button>
                )}
              </div>
              
              {project.inventory && project.inventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border-subtle bg-gray-50/50">
                        <th className="py-3 px-4 text-xs font-bold text-muted-text uppercase tracking-wider rounded-tl-lg">Unit No</th>
                        <th className="py-3 px-4 text-xs font-bold text-muted-text uppercase tracking-wider">Type</th>
                        <th className="py-3 px-4 text-xs font-bold text-muted-text uppercase tracking-wider">Size</th>
                        <th className="py-3 px-4 text-xs font-bold text-muted-text uppercase tracking-wider">Price</th>
                        <th className="py-3 px-4 text-xs font-bold text-muted-text uppercase tracking-wider rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.inventory.map((unit: any) => (
                        <tr key={unit.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-primary-navy">{unit.unitNumber}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 font-medium">{unit.propertyType}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{unit.size ? `${unit.size} sq.ft` : '-'}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-primary-navy">{formatCurrency(unit.price)}</td>
                          <td className="py-3 px-4">
                            <Badge variant={unit.status === 'AVAILABLE' ? 'success' : unit.status === 'BOOKED' ? 'info' : 'danger'}>
                              {unit.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <p className="text-sm text-gray-500 font-medium">No inventory units mapped yet.</p>
                </div>
              )}
            </Card>
          </div>
        ) : activeTab === 'gallery' ? (
          <Card padding="md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary-navy">Project Gallery</h2>
              {isManager && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    accept="image/*,video/*,application/pdf"
                    multiple
                    className="hidden" 
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    isLoading={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Media
                  </Button>
                </>
              )}
            </div>
            
            {project.media && project.media.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {project.media.map((item: any) => (
                  <div key={item.id} className={`aspect-square bg-gray-100 rounded-xl overflow-hidden relative group cursor-pointer border ${item.isCover ? 'border-brand-gold ring-2 ring-brand-gold/50' : 'border-border-subtle'}`}>
                    <img src={getStaticUrl(item.url)} alt={item.title || 'Media'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    {item.isCover && (
                      <div className="absolute top-2 left-2 bg-brand-gold text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10">
                        COVER
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => setViewerImage(getStaticUrl(item.url))}
                    >
                      <span className="text-white text-sm font-medium px-3 py-1 bg-black/30 rounded-full backdrop-blur-sm flex items-center gap-2">
                        <Eye size={16} /> View
                      </span>
                      {isManager && (
                        <>
                          <button 
                            className="absolute top-2 right-2 text-white bg-red-500/80 hover:bg-red-600 rounded-full p-1.5 z-20"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this media?')) {
                                try {
                                  await api.delete(`/projects/media/${item.id}`);
                                  fetchProject();
                                } catch (err) {
                                  alert('Failed to delete media');
                                }
                              }
                            }}
                          >
                            <XCircle size={14} />
                          </button>
                          
                          {!item.isCover && (
                            <button 
                              disabled={settingCoverId === item.id}
                              className="absolute top-2 right-10 text-white bg-blue-500/80 hover:bg-blue-600 rounded px-2 py-1 text-xs font-bold shadow-md z-20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              onClick={async (e) => {
                                e.stopPropagation();
                                setSettingCoverId(item.id);
                                setError('');
                                setSuccessMsg('');
                                try {
                                  await api.patch(`/projects/media/${item.id}/cover`);
                                  // Optimistically update the local state to change the hero image immediately
                                  setProject({
                                    ...project,
                                    media: project.media.map((m: any) => ({
                                      ...m,
                                      isCover: m.id === item.id
                                    }))
                                  });
                                  setSuccessMsg('Cover image updated successfully');
                                  await fetchProject();
                                  setTimeout(() => setSuccessMsg(''), 5000);
                                } catch (err: any) {
                                  const msg = err.response?.data?.message || 'Unable to update cover image. Please try again.';
                                  setError(msg);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                } finally {
                                  setSettingCoverId(null);
                                }
                              }}
                            >
                              {settingCoverId === item.id ? 'SETTING...' : 'SET COVER'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-sm text-gray-500 font-medium">No gallery images available.</p>
              </div>
            )}
          </Card>
        ) : (
          /* Overview Tab */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card padding="md">
                <h2 className="text-xl font-bold text-primary-navy mb-4">About the Project</h2>
                <div className="prose max-w-none text-gray-600 leading-relaxed text-sm md:text-base">
                  <p>{project.description || 'No description provided.'}</p>
                </div>
              </Card>

              {project.amenities && Object.values(project.amenities).some(v => v) && (
                <Card padding="md">
                  <h3 className="text-lg font-bold text-primary-navy mb-4">Amenities</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(project.amenities).map(([key, value]) => 
                      value ? (
                        <span key={key} className="px-4 py-2 bg-brand-gold/10 text-[#c29633] text-sm font-bold rounded-lg border border-brand-gold/20 capitalize shadow-sm">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ) : null
                    )}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card padding="md" className="bg-gray-50/50 border-gray-200">
                <h3 className="text-lg font-bold text-primary-navy mb-4">Quick Facts</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0"><Building2 size={18} /></div>
                    <div>
                      <p className="text-xs font-semibold text-muted-text uppercase tracking-wider">Developer</p>
                      <p className="font-medium text-primary-text">{project.developerName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0"><Map size={18} /></div>
                    <div>
                      <p className="text-xs font-semibold text-muted-text uppercase tracking-wider">Total Area</p>
                      <p className="font-medium text-primary-text">{project.totalArea ? `${project.totalArea} sq ft` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 shrink-0"><Calendar size={18} /></div>
                    <div>
                      <p className="text-xs font-semibold text-muted-text uppercase tracking-wider">Possession</p>
                      <p className="font-medium text-primary-text">{project.possessionDate ? new Date(project.possessionDate).toLocaleDateString() : 'Ready to Move'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {project.legalInfo && (
                <Card padding="md" className="bg-gray-50/50 border-gray-200">
                  <h3 className="text-lg font-bold text-primary-navy mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-brand-gold" /> Legal & Approvals
                  </h3>
                  <div className="space-y-3">
                    {project.legalInfo.reraNumber && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <span className="text-sm font-medium text-muted-text">RERA</span>
                        <span className="text-sm font-bold text-primary-navy">{project.legalInfo.reraNumber}</span>
                      </div>
                    )}
                    {project.legalInfo.dtcpApproval && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <span className="text-sm font-medium text-muted-text">DTCP</span>
                        <span className="text-sm font-bold text-primary-navy">{project.legalInfo.dtcpApproval}</span>
                      </div>
                    )}
                    {project.legalInfo.hmdaApproval && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <span className="text-sm font-medium text-muted-text">HMDA</span>
                        <span className="text-sm font-bold text-primary-navy">{project.legalInfo.hmdaApproval}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {viewerImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setViewerImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-brand-gold p-2 bg-black/50 rounded-full transition-colors z-50"
            onClick={(e) => { e.stopPropagation(); setViewerImage(null); }}
          >
            <X size={24} />
          </button>
          <div className="relative w-full max-w-6xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={viewerImage} 
              alt="Gallery Fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {isAddUnitModalOpen && (
        <AddUnitModal
          projectId={project.id}
          isOpen={isAddUnitModalOpen}
          onClose={() => setIsAddUnitModalOpen(false)}
          onSuccess={() => {
            setSuccessMsg('Unit added successfully');
            fetchProject();
            setTimeout(() => setSuccessMsg(''), 3000);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
