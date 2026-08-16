import React from 'react';
import { Trash2, Copy } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface PropertiesPanelProps {
  selectedElements: any[];
  elements: any[];
  inventoryUnits: any[];
  updateSelectedElements: (updates: any) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedElements, 
  elements, 
  inventoryUnits,
  updateSelectedElements,
  deleteSelectedElements,
  duplicateSelectedElements
}) => {
  
  if (selectedElements.length === 0) {
    return (
      <div className="w-72 border-l bg-gray-50 flex flex-col">
        <div className="p-3 font-bold text-sm border-b flex justify-between items-center">
          Properties
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-center text-gray-400 mt-12 text-sm">
            Select an element on the canvas to view and edit its properties.
          </div>
        </div>
      </div>
    );
  }

  const isMultiSelect = selectedElements.length > 1;
  const el = selectedElements[0];

  return (
    <div className="w-72 border-l bg-gray-50 flex flex-col h-full">
      <div className="p-3 font-bold text-sm border-b flex justify-between items-center">
        {isMultiSelect ? `Multiple (${selectedElements.length})` : 'Properties'}
        <div className="flex items-center gap-1">
          <button onClick={duplicateSelectedElements} className="text-gray-500 hover:bg-gray-200 p-1 rounded" title="Duplicate">
            <Copy size={16} />
          </button>
          <button onClick={deleteSelectedElements} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {isMultiSelect ? (
          <div className="text-sm text-gray-600">
            <p className="mb-4 font-bold">{selectedElements.length} elements selected.</p>
            <p>You can move, duplicate, or delete them together.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary-navy text-white px-3 py-1.5 rounded text-sm font-bold flex justify-between items-center">
              <span>{el.type}</span>
              <span className="text-xs opacity-70">ID: {el.id.slice(0,6)}...</span>
            </div>

            {/* Geometry */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X Pos</label>
                <input type="number" value={Math.round(el.x)} onChange={e => updateSelectedElements({x: parseFloat(e.target.value)})} className="w-full border p-1.5 text-sm rounded bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y Pos</label>
                <input type="number" value={Math.round(el.y)} onChange={e => updateSelectedElements({y: parseFloat(e.target.value)})} className="w-full border p-1.5 text-sm rounded bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input type="number" value={Math.round(el.width || 0)} onChange={e => updateSelectedElements({width: parseFloat(e.target.value)})} className="w-full border p-1.5 text-sm rounded bg-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input type="number" value={Math.round(el.height || 0)} onChange={e => updateSelectedElements({height: parseFloat(e.target.value)})} className="w-full border p-1.5 text-sm rounded bg-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Rotation (deg)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="360" value={Math.round(el.rotation || 0)} onChange={e => updateSelectedElements({rotation: parseFloat(e.target.value)})} className="flex-1" />
                  <input type="number" min="0" max="360" value={Math.round(el.rotation || 0)} onChange={e => updateSelectedElements({rotation: parseFloat(e.target.value)})} className="w-16 border p-1.5 text-sm rounded bg-white" />
                </div>
              </div>
            </div>

            <hr className="my-2 border-gray-200" />

            {/* Element Specific Properties */}
            {el.type === 'PLOT' && (
              <div className="space-y-3">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Plot Number</label>
                  <input 
                    type="text" 
                    value={el.elementData?.plotNumber || ''} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, plotNumber: e.target.value}})}
                    className="w-full border p-1.5 text-sm rounded bg-white font-bold" 
                    placeholder="e.g. 101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-gold mb-1">Link to Inventory Unit</label>
                  <select 
                    value={el.inventoryUnitId || ''} 
                    onChange={e => {
                      const val = e.target.value || null;
                      if (val) {
                        const existing = elements.find(item => item.id !== el.id && item.inventoryUnitId === val);
                        if (existing) {
                          alert('This inventory unit is already linked to another plot.');
                          return;
                        }
                      }
                      updateSelectedElements({inventoryUnitId: val})
                    }}
                    className="w-full border border-brand-gold bg-yellow-50 p-2 text-sm rounded font-semibold"
                  >
                    <option value="">-- Unmapped --</option>
                    {inventoryUnits.map(iu => (
                      <option key={iu.id} value={iu.id}>{iu.unitNumber} ({iu.status}) - {formatCurrency(iu.price)}</option>
                    ))}
                  </select>
                  
                  {el.inventoryUnitId && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs space-y-1">
                      {(() => {
                        const inv = inventoryUnits.find(iu => iu.id === el.inventoryUnitId);
                        if (!inv) return <span>Inventory not found</span>;
                        return (
                          <>
                            <div className="flex justify-between"><span>Status:</span> <span className="font-bold">{inv.status}</span></div>
                            <div className="flex justify-between"><span>Price:</span> <span className="font-bold">{formatCurrency(inv.price)}</span></div>
                            {inv.size && <div className="flex justify-between"><span>Inv Size:</span> <span>{inv.size}</span></div>}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Facing</label>
                    <select 
                      value={el.elementData?.facing || ''} 
                      onChange={e => updateSelectedElements({elementData: {...el.elementData, facing: e.target.value}})}
                      className="w-full border p-1.5 text-sm rounded bg-white"
                    >
                      <option value="">-- Select --</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="North-East">North-East</option>
                      <option value="North-West">North-West</option>
                      <option value="South-East">South-East</option>
                      <option value="South-West">South-West</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Road Width (ft)</label>
                    <input 
                      type="text" 
                      value={el.elementData?.roadWidth || ''} 
                      onChange={e => updateSelectedElements({elementData: {...el.elementData, roadWidth: e.target.value}})}
                      className="w-full border p-1.5 text-sm rounded bg-white" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input 
                      type="checkbox" 
                      checked={el.elementData?.cornerPlot || false}
                      onChange={e => updateSelectedElements({elementData: {...el.elementData, cornerPlot: e.target.checked}})}
                    />
                    Corner Plot
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input 
                      type="checkbox" 
                      checked={el.elementData?.roadFacing || false}
                      onChange={e => updateSelectedElements({elementData: {...el.elementData, roadFacing: e.target.checked}})}
                    />
                    Road Facing
                  </label>
                </div>
              </div>
            )}

            {el.type === 'ROAD' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Road Type</label>
                  <select 
                    value={el.elementData?.roadType || 'Main Road'} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, roadType: e.target.value}})}
                    className="w-full border p-1.5 text-sm rounded bg-white"
                  >
                    <option value="Main Road">Main Road</option>
                    <option value="Internal Road">Internal Road</option>
                    <option value="Approach Road">Approach Road</option>
                    <option value="Secondary Road">Secondary Road</option>
                    <option value="Service Road">Service Road</option>
                    <option value="Entrance Road">Entrance Road</option>
                    <option value="Exit Road">Exit Road</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Road Name / Label</label>
                  <input 
                    type="text" 
                    value={el.elementData?.label || ''} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, label: e.target.value}})}
                    className="w-full border p-1.5 text-sm rounded bg-white" 
                    placeholder="e.g. 40 Ft Main Road"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Road Width (ft)</label>
                  <input 
                    type="number" 
                    value={el.elementData?.actualWidth || 40} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, actualWidth: parseInt(e.target.value)}})}
                    className="w-full border p-1.5 text-sm rounded bg-white" 
                  />
                </div>
              </div>
            )}

            {(el.type === 'PARK' || el.type === 'AMENITY') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input 
                    type="text" 
                    value={el.elementData?.label || ''} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, label: e.target.value}})}
                    className="w-full border p-1.5 text-sm rounded bg-white" 
                  />
                </div>
              </div>
            )}
            
            {(el.type === 'TEXT') && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Content</label>
                  <input 
                    type="text" 
                    value={el.elementData?.text || 'Text'} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, text: e.target.value}})}
                    className="w-full border p-1.5 text-sm rounded bg-white font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                  <input 
                    type="number" 
                    value={el.elementData?.fontSize || 24} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, fontSize: parseInt(e.target.value)}})}
                    className="w-full border p-1.5 text-sm rounded bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                  <input 
                    type="color" 
                    value={el.elementData?.color || '#000000'} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, color: e.target.value}})}
                    className="w-full border p-1 rounded bg-white h-8" 
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
