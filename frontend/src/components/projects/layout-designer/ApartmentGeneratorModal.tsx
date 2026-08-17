import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ApartmentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (units: any[]) => void;
}

export const ApartmentGeneratorModal: React.FC<ApartmentGeneratorModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [formData, setFormData] = useState({
    towerName: 'Tower A',
    numFloors: 5,
    startFloor: 1,
    unitsPerFloor: 4,
    unitPrefix: 'A',
    area: '1200',
    price: '5000000'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newElements: any[] = [];
    
    let yOffset = 100;
    
    // Generate logical block for Tower itself
    newElements.push({
      id: crypto.randomUUID(),
      type: 'TEXT',
      x: 100,
      y: yOffset,
      width: 200,
      height: 40,
      rotation: 0,
      zIndex: 1,
      elementData: {
        text: formData.towerName,
        fontSize: 24,
        fill: '#1e3a8a',
        fontWeight: 'bold'
      }
    });

    yOffset += 60;

    for (let f = 0; f < formData.numFloors; f++) {
      const floorNum = formData.startFloor + f;
      
      let xOffset = 100;
      for (let u = 1; u <= formData.unitsPerFloor; u++) {
        // e.g., A101
        const unitNumber = `${formData.unitPrefix}${floorNum}${u.toString().padStart(2, '0')}`;
        
        newElements.push({
          id: crypto.randomUUID(),
          type: 'APARTMENT_UNIT',
          x: xOffset,
          y: yOffset,
          width: 80,
          height: 60,
          rotation: 0,
          zIndex: 1,
          elementData: {
            label: unitNumber,
            tower: formData.towerName,
            floor: floorNum,
            area: formData.area,
            price: Number(formData.price),
            fill: '#e0f2fe',
            stroke: '#0284c7'
          }
        });
        xOffset += 100;
      }
      yOffset += 80;
    }
    
    onGenerate(newElements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle">
          <h2 className="text-xl font-bold text-primary-navy">Generate Apartment Block</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tower / Block Name</label>
            <input 
              type="text" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
              value={formData.towerName}
              onChange={(e) => setFormData({...formData, towerName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Floors</label>
              <input 
                type="number" required min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                value={formData.numFloors}
                onChange={(e) => setFormData({...formData, numFloors: parseInt(e.target.value) || 1})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Floor</label>
              <input 
                type="number" required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                value={formData.startFloor}
                onChange={(e) => setFormData({...formData, startFloor: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units Per Floor</label>
              <input 
                type="number" required min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                value={formData.unitsPerFloor}
                onChange={(e) => setFormData({...formData, unitsPerFloor: parseInt(e.target.value) || 1})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Prefix</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                value={formData.unitPrefix}
                onChange={(e) => setFormData({...formData, unitPrefix: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Area (sq.ft)</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Price (₹)</label>
              <input 
                type="number" required min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
              Generate {formData.numFloors * formData.unitsPerFloor} Units
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
