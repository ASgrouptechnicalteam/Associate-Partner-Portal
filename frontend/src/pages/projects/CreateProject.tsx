import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, Map, MapPin, Building2, ShieldCheck, Home, Info, DollarSign, Activity, Image, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    projectType: 'APARTMENT',
    totalArea: '',
    description: '',
    developerName: '',
    marketingCompany: '',
    possessionDate: '',
    isFeatured: false,
  });

  const [locationDetails, setLocationDetails] = useState({ address: '', city: '', state: '', pincode: '', googleMapsLink: '' });
  const [legalInfo, setLegalInfo] = useState({ reraNumber: '', dtcpApproval: '', hmdaApproval: '' });
  const [amenities, setAmenities] = useState({ clubhouse: false, pool: false, gym: false, park: false, security: false, powerBackup: false, vastuCompliant: false, rainwaterHarvesting: false });
  const [landDetails, setLandDetails] = useState({ surveyNumbers: '', totalAcres: '', plotCount: '' });
  const [pricingInfo, setPricingInfo] = useState({ basePricePerSqft: '', maintenanceCharges: '', registrationCharges: '' });
  const [nearbyInfo, setNearbyInfo] = useState({ schools: '', hospitals: '', transit: '', itParks: '' });
  const [constructionDetails, setConstructionDetails] = useState({ builder: '', constructionStatus: 'UNDER_CONSTRUCTION', completionPercentage: '' });
  const [marketingInfo, setMarketingInfo] = useState({ brochureLink: '', videoLink: '', virtualTourLink: '' });
  const [salesInfo, setSalesInfo] = useState({ salesPhase: 'PRE_LAUNCH', launchDate: '' });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeSection, setActiveSection] = useState('basic');

  // IDOR protection
  if (user?.role !== 'MD' && user?.role !== 'CHANNEL_PARTNER_MANAGER') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  const handleMainChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const createHandler = (setter: React.Dispatch<React.SetStateAction<any>>) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setter((prev: any) => ({ ...prev, [e.target.name]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { totalArea, ...cleanFormData } = formData;
      const res = await api.post('/projects', {
        ...cleanFormData,
        possessionDate: cleanFormData.possessionDate ? new Date(cleanFormData.possessionDate).toISOString() : null,
        locationDetails,
        legalInfo,
        amenities,
        landDetails: {
          ...landDetails,
          totalArea: totalArea ? parseFloat(totalArea) : null
        },
        pricingInfo,
        nearbyInfo,
        constructionDetails,
        marketingInfo,
        salesInfo
      });
      navigate(`/projects/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'basic', title: '1. Basic Project Information', icon: Info },
    { id: 'location', title: '2. Location Details', icon: MapPin },
    { id: 'legal', title: '3. Legal Information', icon: ShieldCheck },
    { id: 'land', title: '4. Land Details', icon: Map },
    { id: 'inventory', title: '5. Inventory Details', icon: Building2 },
    { id: 'pricing', title: '6. Pricing Details', icon: DollarSign },
    { id: 'payment', title: '7. Payment Plans', icon: DollarSign },
    { id: 'amenities', title: '8. Amenities', icon: Home },
    { id: 'nearby', title: '9. Infrastructure Nearby', icon: Map },
    { id: 'construction', title: '10. Construction Details', icon: Building2 },
    { id: 'marketing', title: '11. Marketing Information', icon: Image },
    { id: 'media', title: '12. Media Library', icon: Image },
    { id: 'sales', title: '13. Sales Information', icon: Activity },
    { id: 'faq', title: '14. Customer FAQs', icon: Info }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary-navy">Create Project</h1>
          <p className="text-sm text-gray-500">Premium Multi-Section Project Registration</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-border-subtle p-4 space-y-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Form Sections</h3>
            {sections.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollToSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id 
                    ? 'bg-primary-navy/5 text-primary-navy' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <s.icon size={16} className={activeSection === s.id ? 'text-brand-gold' : 'text-gray-400'} />
                {s.title}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-border-subtle px-3">
              <Button
                onClick={handleSubmit}
                isLoading={loading}
                leftIcon={<Save size={18} />}
                className="w-full"
              >
                Save Project
              </Button>
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-8 pb-32">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <CheckCircle size={18} className="text-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div id="section-basic" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">1. Basic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Code *</label>
                    <input type="text" name="code" required value={formData.code} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Location *</label>
                    <input type="text" name="location" required value={formData.location} onChange={handleMainChange} placeholder="e.g. Hyderabad" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
                    <select name="projectType" value={formData.projectType} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors bg-white">
                      <option value="APARTMENT">Apartment</option>
                      <option value="VILLA">Villa</option>
                      <option value="PLOT">Plot</option>
                      <option value="COMMERCIAL">Commercial</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-metrics" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">2. Project Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Area (sq ft)</label>
                    <input type="number" name="totalArea" value={formData.totalArea} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Possession Date</label>
                    <input type="date" name="possessionDate" value={formData.possessionDate} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleMainChange} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleMainChange} className="w-5 h-5 text-brand-gold rounded border-gray-300 focus:ring-brand-gold" />
                      <div>
                        <div className="font-semibold text-gray-900">Featured Project</div>
                        <div className="text-sm text-gray-500">Show this project on the main dashboard highlights.</div>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-stakeholders" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">3. Stakeholders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
                    <input type="text" name="developerName" value={formData.developerName} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marketing Company</label>
                    <input type="text" name="marketingCompany" value={formData.marketingCompany} onChange={handleMainChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-location" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">4. Location Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <input type="text" name="address" value={locationDetails.address} onChange={createHandler(setLocationDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" name="city" value={locationDetails.city} onChange={createHandler(setLocationDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" name="state" value={locationDetails.state} onChange={createHandler(setLocationDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input type="text" name="pincode" value={locationDetails.pincode} onChange={createHandler(setLocationDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                    <input type="text" name="googleMapsLink" value={locationDetails.googleMapsLink} onChange={createHandler(setLocationDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-legal" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">5. Legal & Approvals</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RERA Number</label>
                    <input type="text" name="reraNumber" value={legalInfo.reraNumber} onChange={createHandler(setLegalInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DTCP Approval</label>
                    <input type="text" name="dtcpApproval" value={legalInfo.dtcpApproval} onChange={createHandler(setLegalInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HMDA Approval</label>
                    <input type="text" name="hmdaApproval" value={legalInfo.hmdaApproval} onChange={createHandler(setLegalInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-land" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">6. Land Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Survey Numbers</label>
                    <input type="text" name="surveyNumbers" value={landDetails.surveyNumbers} onChange={createHandler(setLandDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Acres</label>
                    <input type="number" name="totalAcres" value={landDetails.totalAcres} onChange={createHandler(setLandDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plot / Unit Count</label>
                    <input type="number" name="plotCount" value={landDetails.plotCount} onChange={createHandler(setLandDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-pricing" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">7. Pricing Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price / sqft (₹)</label>
                    <input type="number" name="basePricePerSqft" value={pricingInfo.basePricePerSqft} onChange={createHandler(setPricingInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Charges (₹)</label>
                    <input type="number" name="maintenanceCharges" value={pricingInfo.maintenanceCharges} onChange={createHandler(setPricingInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Charges</label>
                    <input type="text" name="registrationCharges" value={pricingInfo.registrationCharges} onChange={createHandler(setPricingInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-amenities" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">8. Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(amenities).map((key) => (
                    <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        name={key} 
                        checked={(amenities as any)[key]} 
                        onChange={createHandler(setAmenities)}
                        className="w-4 h-4 text-brand-gold rounded border-gray-300 focus:ring-brand-gold"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            <div id="section-nearby" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">9. Nearby Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schools</label>
                    <textarea name="schools" value={nearbyInfo.schools} onChange={createHandler(setNearbyInfo)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospitals</label>
                    <textarea name="hospitals" value={nearbyInfo.hospitals} onChange={createHandler(setNearbyInfo)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transit / Metro</label>
                    <textarea name="transit" value={nearbyInfo.transit} onChange={createHandler(setNearbyInfo)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IT Parks / Work Hubs</label>
                    <textarea name="itParks" value={nearbyInfo.itParks} onChange={createHandler(setNearbyInfo)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-construction" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">10. Construction Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Builder</label>
                    <input type="text" name="builder" value={constructionDetails.builder} onChange={createHandler(setConstructionDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Construction Status</label>
                    <select name="constructionStatus" value={constructionDetails.constructionStatus} onChange={createHandler(setConstructionDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors bg-white">
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="UNDER_CONSTRUCTION">Under Construction</option>
                      <option value="NEAR_COMPLETION">Near Completion</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Completion %</label>
                    <input type="number" name="completionPercentage" value={constructionDetails.completionPercentage} onChange={createHandler(setConstructionDetails)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-marketing" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">11. Marketing Assets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brochure Link (PDF/Drive)</label>
                    <input type="url" name="brochureLink" value={marketingInfo.brochureLink} onChange={createHandler(setMarketingInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube / Video Link</label>
                    <input type="url" name="videoLink" value={marketingInfo.videoLink} onChange={createHandler(setMarketingInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Tour (360 Link)</label>
                    <input type="url" name="virtualTourLink" value={marketingInfo.virtualTourLink} onChange={createHandler(setMarketingInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-sales" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">13. Sales Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Phase</label>
                    <select name="salesPhase" value={salesInfo.salesPhase} onChange={createHandler(setSalesInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors bg-white">
                      <option value="PRE_LAUNCH">Pre Launch</option>
                      <option value="LAUNCHED">Launched</option>
                      <option value="READY_TO_MOVE">Ready to Move</option>
                      <option value="SOLD_OUT">Sold Out</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Official Launch Date</label>
                    <input type="date" name="launchDate" value={salesInfo.launchDate} onChange={createHandler(setSalesInfo)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-colors" />
                  </div>
                </div>
              </Card>
            </div>

            <div id="section-inventory" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6 bg-blue-50/50">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">5. Inventory Details</h2>
                <p className="text-sm text-muted-text">Inventory Units (Plots/Villas) can be added and managed after creating this project profile via the <strong>Layout & Inventory</strong> tab on the project details page.</p>
              </Card>
            </div>
            
            <div id="section-payment" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">7. Payment Plans</h2>
                <p className="text-sm text-muted-text">Standard payment plans, down payment options, and bank loan integrations will be configured dynamically via the Pricing Strategy engine once the project is created.</p>
              </Card>
            </div>

            <div id="section-media" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6 bg-blue-50/50">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">12. Media Library</h2>
                <p className="text-sm text-muted-text">You can upload up to 8+ photos, master plans, layouts, brochures, drone videos, and 360° virtual tours in the <strong>Media Library</strong> tab after creating the project.</p>
              </Card>
            </div>

            <div id="section-faq" className="scroll-mt-24">
              <Card padding="lg" className="space-y-6">
                <h2 className="text-xl font-bold text-primary-navy border-b border-border-subtle pb-3">14. Customer FAQs</h2>
                <p className="text-sm text-muted-text">Customer FAQs regarding legal approvals, pricing, amenities, and possession can be authored via the Project details panel after creation.</p>
              </Card>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
