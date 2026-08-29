import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';

interface Project {
  id: string;
  name: string;
  code: string;
}

interface InventoryUnit {
  id: string;
  unitNumber: string;
  price: number;
  shape?: string;
  roadInformation?: string;
}

const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    projectId: searchParams.get('projectId') || '',
    inventoryUnitId: searchParams.get('unitId') || '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    bookingDate: new Date().toISOString().split('T')[0],
    expectedAmount: 0,
    paymentMode: 'Bank Transfer',
    bookingAmount: 0,
    notes: ''
  });

  useEffect(() => {
    // Fetch projects
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data);
      } catch (err) {
        console.error('Failed to load projects');
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    // Fetch units when project changes
    const fetchUnits = async () => {
      if (!formData.projectId) {
        setUnits([]);
        return;
      }
      try {
        const res = await api.get(`/inventory/project/${formData.projectId}`);
        const availableUnits = res.data.data.filter((u: any) => u.status === 'AVAILABLE');
        setUnits(availableUnits);
        
        // Deselect if currently selected unit is no longer available
        setFormData(prev => {
          if (prev.inventoryUnitId && !availableUnits.find((u: any) => u.id === prev.inventoryUnitId)) {
            return { ...prev, inventoryUnitId: '', expectedAmount: 0 };
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to load inventory units');
      }
    };
    
    fetchUnits();

    const intervalId = setInterval(() => {
      fetchUnits();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [formData.projectId]);

  // Make fetchUnits available for manual refresh on failure
  const refreshInventory = async () => {
    if (!formData.projectId) return;
    try {
      const res = await api.get(`/inventory/project/${formData.projectId}`);
      const availableUnits = res.data.data.filter((u: any) => u.status === 'AVAILABLE');
      setUnits(availableUnits);
      setFormData(prev => {
        if (prev.inventoryUnitId && !availableUnits.find((u: any) => u.id === prev.inventoryUnitId)) {
          return { ...prev, inventoryUnitId: '', expectedAmount: 0 };
        }
        return prev;
      });
    } catch (err) {}
  };

  const handleUnitChange = (unitId: string) => {
    const selectedUnit = units.find(u => u.id === unitId);
    setFormData(prev => ({
      ...prev,
      inventoryUnitId: unitId,
      expectedAmount: selectedUnit ? selectedUnit.price : 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/v1/bookings', {
        ...formData,
        bookingDate: new Date(formData.bookingDate).toISOString(),
        expectedAmount: Number(formData.expectedAmount),
        bookingAmount: Number(formData.bookingAmount)
      });
      navigate('/bookings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. The unit might no longer be available.');
      await refreshInventory(); // Refresh immediately on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-primary-navy">Create New Booking</h1>
        <p className="text-gray-500">Submit a new booking request for MD/AM verification.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 space-y-10">
        
        {/* Project & Unit Selection */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-action-blue flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="text-xl font-bold text-deep-navy">Property Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Project *</label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, inventoryUnitId: '' })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none bg-white"
              >
                <option value="">Select a project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Inventory Unit *</label>
              <select
                required
                value={formData.inventoryUnitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                disabled={!formData.projectId}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none bg-white disabled:bg-gray-100"
              >
                <option value="">Select a unit</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>Unit: {u.unitNumber} - {formatCurrency(u.price)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-action-blue flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="text-xl font-bold text-deep-navy">Customer Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
              <input
                required type="text" minLength={2}
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Customer Phone *</label>
              <input
                required type="tel" minLength={10}
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Customer Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Customer Address</label>
              <input
                type="text"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              />
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-action-blue flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="text-xl font-bold text-deep-navy">Financial Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Expected Amount (₹)</label>
              <input
                required type="number" min="0" step="0.01" readOnly
                value={formData.expectedAmount}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Authoritative price from unit</p>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Booking Amount Received (₹) *</label>
              <input
                required type="number" min="0" step="0.01"
                value={formData.bookingAmount || ''}
                onChange={(e) => setFormData({ ...formData, bookingAmount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Payment Mode *</label>
              <select
                required
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Booking Date *</label>
              <input
                required type="date"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Notes / Remarks</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-action-blue outline-none"
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-8 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.inventoryUnitId}
            className="px-8 py-3 bg-action-blue text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all"
          >
            {loading ? 'Submitting...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBooking;
