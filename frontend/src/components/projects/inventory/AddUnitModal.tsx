import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../../services/api';

interface AddUnitModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    unitNumber: '',
    propertyType: 'PLOT',
    size: '',
    price: '',
    status: 'AVAILABLE',
    area: '',
    facing: '',
    northBoundary: '',
    southBoundary: '',
    eastBoundary: '',
    westBoundary: '',
    northLength: '',
    southLength: '',
    eastLength: '',
    westLength: '',
    shape: '',
    roadInformation: '',
    towerBlock: '',
    floor: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/inventory', {
        projectId,
        unitNumber: formData.unitNumber,
        propertyType: formData.propertyType,
        size: formData.size,
        price: Number(formData.price) || 0,
        status: formData.status,
        area: formData.area ? Number(formData.area) : undefined,
        facing: formData.facing || undefined,
        northBoundary: formData.northBoundary || undefined,
        southBoundary: formData.southBoundary || undefined,
        eastBoundary: formData.eastBoundary || undefined,
        westBoundary: formData.westBoundary || undefined,
        northLength: formData.northLength ? Number(formData.northLength) : undefined,
        southLength: formData.southLength ? Number(formData.southLength) : undefined,
        eastLength: formData.eastLength ? Number(formData.eastLength) : undefined,
        westLength: formData.westLength ? Number(formData.westLength) : undefined,
        shape: formData.shape || undefined,
        roadInformation: formData.roadInformation || undefined,
        towerBlock: formData.towerBlock || undefined,
        floor: formData.floor || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-primary-navy">Add Inventory Unit</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number / Plot Number *</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              value={formData.unitNumber}
              onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              value={formData.propertyType}
              onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
            >
              <option value="PLOT">Plot</option>
              <option value="UNIT">Unit / Apartment</option>
              <option value="VILLA">Villa</option>
              <option value="COMMERCIAL">Commercial Space</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size / Area</label>
            <input 
              type="text" 
              placeholder="e.g. 150 sq.yd"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
            />
          </div>

          {formData.propertyType === 'PLOT' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area (sq.yd) *</label>
                <input type="number" required className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facing</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  value={formData.facing} onChange={(e) => setFormData({...formData, facing: e.target.value})} />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                  <input type="text" placeholder="e.g. Regular, Irregular" className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    value={formData.shape} onChange={(e) => setFormData({...formData, shape: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Road Information</label>
                  <input type="text" placeholder="e.g. East side - 30 ft" className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    value={formData.roadInformation} onChange={(e) => setFormData({...formData, roadInformation: e.target.value})} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Boundaries (N, S, E, W)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="North Boundary" className="px-3 py-2 border rounded-lg" value={formData.northBoundary} onChange={e => setFormData({...formData, northBoundary: e.target.value})} />
                  <input type="text" placeholder="South Boundary" className="px-3 py-2 border rounded-lg" value={formData.southBoundary} onChange={e => setFormData({...formData, southBoundary: e.target.value})} />
                  <input type="text" placeholder="East Boundary" className="px-3 py-2 border rounded-lg" value={formData.eastBoundary} onChange={e => setFormData({...formData, eastBoundary: e.target.value})} />
                  <input type="text" placeholder="West Boundary" className="px-3 py-2 border rounded-lg" value={formData.westBoundary} onChange={e => setFormData({...formData, westBoundary: e.target.value})} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Side Lengths (N, S, E, W in ft/m)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="North Length" className="px-3 py-2 border rounded-lg" value={formData.northLength} onChange={e => setFormData({...formData, northLength: e.target.value})} />
                  <input type="number" placeholder="South Length" className="px-3 py-2 border rounded-lg" value={formData.southLength} onChange={e => setFormData({...formData, southLength: e.target.value})} />
                  <input type="number" placeholder="East Length" className="px-3 py-2 border rounded-lg" value={formData.eastLength} onChange={e => setFormData({...formData, eastLength: e.target.value})} />
                  <input type="number" placeholder="West Length" className="px-3 py-2 border rounded-lg" value={formData.westLength} onChange={e => setFormData({...formData, westLength: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {(formData.propertyType === 'APARTMENT' || formData.propertyType === 'UNIT') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tower/Block *</label>
                <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  value={formData.towerBlock} onChange={(e) => setFormData({...formData, towerBlock: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input 
              type="number" 
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status *</label>
            <select
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="HOLD">Hold</option>
              <option value="BOOKED">Booked</option>
              <option value="REGISTERED">Registered</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
