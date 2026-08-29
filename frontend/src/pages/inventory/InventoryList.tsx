import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Plus, Building2, Map, Search } from 'lucide-react';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/currency';
import { AddUnitModal } from '../../components/projects/inventory/AddUnitModal';

interface InventoryUnit {
  id: string;
  projectId: string;
  unitNumber: string;
  propertyType: string;
  size?: string;
  price: string;
  status: string;
  facing?: string;
  shape?: string;
  area?: number;
  roadInformation?: string;
  northBoundary?: string;
  southBoundary?: string;
  eastBoundary?: string;
  westBoundary?: string;
  towerBlock?: string;
  floor?: string;
  project?: { name: string; code: string };
}

export default function InventoryList() {
  const { user } = useAuth();
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Example list of projects for filtering (in a real scenario, fetch projects)
  
  useEffect(() => {
    // We would need an API to get all inventory across projects or just fetch projects first and aggregate.
    // For now, let's fetch projects and their inventory if MD/CPM.
    // Given Phase 1 has 'getProjects', we'll get projects and list their inventory.
    const fetchInventory = async (isPolling = false) => {
      try {
        if (!isPolling) setLoading(true);
        // Note: Currently we only have GET /api/inventory/project/:projectId
        // For a global inventory view, we fetch all projects then all inventory.
        const projRes = await api.get('/projects');
        const projs = projRes.data.data || [];
        setProjects(projs);
        let allUnits: InventoryUnit[] = [];
        
        for (const proj of projs) {
          try {
            const invRes = await api.get(`/inventory/project/${proj.id}`);
            if (invRes.data.data) {
              const mapped = invRes.data.data.map((u: any) => ({ ...u, project: { name: proj.name, code: proj.code } }));
              allUnits = [...allUnits, ...mapped];
            }
          } catch (e) {
            console.error(`Failed to fetch inventory for project ${proj.id}`, e);
          }
        }
        setUnits(allUnits);
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInventory();

    const intervalId = setInterval(() => {
      fetchInventory(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const filteredUnits = units.filter(u => {
    if (filterType !== 'ALL' && u.propertyType !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <LayoutDashboard className="h-6 w-6 mr-2 text-indigo-600" />
          Inventory Management
        </h1>
        {(user?.role === 'MD' || user?.role === 'CHANNEL_PARTNER_MANAGER') && (
          <button 
            onClick={() => {
              if (projects.length > 0) {
                setSelectedProjectId(projects[0].id); // For global inventory view, pick the first project or allow selection in modal.
                setIsAddUnitModalOpen(true);
              } else {
                alert('No projects available to add inventory to.');
              }
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </button>
        )}
      </div>

      <Card padding="sm" className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-action-blue" size={20} />
          <input 
            type="text"
            placeholder="Search by unit number, status, facing or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-action-blue bg-gray-50 placeholder:text-gray-400 font-medium text-deep-navy"
          />
        </div>
        <select 
          className="border-none bg-gray-50 focus:ring-0 text-sm font-medium text-primary-navy rounded-lg px-4 py-2"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="PLOT">Plots</option>
          <option value="APARTMENT">Apartments</option>
        </select>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-navy border-t-brand-gold"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => (
            <div 
              key={unit.id} 
              className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 hover:border-action-blue/30 transition-all duration-300 group cursor-default"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-xl text-deep-navy group-hover:text-action-blue transition-colors">
                    {unit.project?.name} - {unit.unitNumber}
                  </h3>
                  <div className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest bg-gray-100 inline-block px-2 py-1 rounded-md">
                    {unit.propertyType}
                  </div>
                </div>
                <Badge variant={
                  unit.status === 'AVAILABLE' ? 'success' : 
                  unit.status === 'BOOKED' ? 'danger' : 'neutral'
                }>
                  {unit.status}
                </Badge>
              </div>
              
              <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 group-hover:bg-blue-50/30 transition-colors">
                  {unit.propertyType === 'PLOT' ? (
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                        <span className="flex items-center text-gray-500 font-medium"><Map className="h-4 w-4 mr-2 text-action-blue"/> Area / Facing</span>
                        <span className="font-bold text-deep-navy">{unit.area || 'N/A'} <span className="font-normal text-xs text-gray-300 mx-1.5">|</span> {unit.facing || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                        <span className="text-gray-500 font-medium">Shape / Road</span>
                        <span className="font-bold text-deep-navy text-right text-xs truncate max-w-[120px]" title={unit.roadInformation || 'N/A'}>{unit.shape || 'N/A'} | {unit.roadInformation || 'N/A'}</span>
                      </div>
                      <div className="pt-2 text-xs text-gray-600 flex justify-between font-medium">
                        <span className="bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm"><b className="text-gray-400 font-normal">N:</b> {unit.northBoundary || '-'}</span>
                        <span className="bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm"><b className="text-gray-400 font-normal">S:</b> {unit.southBoundary || '-'}</span>
                        <span className="bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm"><b className="text-gray-400 font-normal">E:</b> {unit.eastBoundary || '-'}</span>
                        <span className="bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm"><b className="text-gray-400 font-normal">W:</b> {unit.westBoundary || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-around text-sm text-gray-700 py-3">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-gray-100">
                          <Building2 className="h-5 w-5 text-action-blue" />
                        </div>
                        <div className="font-bold text-deep-navy">{unit.towerBlock || 'N/A'}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tower</div>
                      </div>
                      <div className="h-12 w-px bg-gray-200"></div>
                      <div className="text-center">
                        <div className="font-black text-2xl text-deep-navy leading-none mb-1">{unit.floor || 'N/A'}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Floor</div>
                      </div>
                    </div>
                  )}
              </div>
              
              <div className="mt-5 pt-5 border-t border-gray-100 flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Price</span>
                <div className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-deep-navy to-action-blue">{formatCurrency(Number(unit.price))}</div>
              </div>
            </div>
          ))}
            {filteredUnits.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <LayoutDashboard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No inventory found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            )}
        </div>
      )}

      {isAddUnitModalOpen && selectedProjectId && (
        <AddUnitModal
          projectId={selectedProjectId}
          isOpen={isAddUnitModalOpen}
          onClose={() => setIsAddUnitModalOpen(false)}
          onSuccess={() => {
            setIsAddUnitModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
