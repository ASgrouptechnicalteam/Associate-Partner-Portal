import React, { useState } from 'react';
import { Trash2, Copy, Save, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import api from '../../../services/api';

interface PropertiesPanelProps {
  selectedElements: any[];
  elements: any[];
  inventoryUnits: any[];
  updateSelectedElements: (updates: any) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  addInventoryUnit?: (unit: any) => void;
  onRefreshProject?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedElements, 
  elements, 
  inventoryUnits,
  updateSelectedElements,
  deleteSelectedElements,
  duplicateSelectedElements,
  addInventoryUnit,
  onRefreshProject
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'unplaced'>('unplaced');
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [editInvData, setEditInvData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (selectedElements.length > 0) {
      setActiveTab('properties');
    } else {
      setActiveTab('unplaced');
    }
  }, [selectedElements.length]);
  
  const placedUnitIds = new Set(elements.map(el => el.inventoryUnitId).filter(Boolean));
  const unplacedUnits = inventoryUnits.filter(iu => !placedUnitIds.has(iu.id));

  // Group unplaced apartments by tower -> floor
  const unplacedPlots = unplacedUnits.filter(u => u.propertyType === 'PLOT');
  const unplacedApartments = unplacedUnits.filter(u => u.propertyType === 'UNIT');
  
  const groupedApartments = unplacedApartments.reduce((acc: any, curr: any) => {
    const tower = curr.towerBlock || 'No Tower';
    const floor = curr.floor || 'No Floor';
    if (!acc[tower]) acc[tower] = {};
    if (!acc[tower][floor]) acc[tower][floor] = [];
    acc[tower][floor].push(curr);
    return acc;
  }, {});

  if (activeTab === 'unplaced') {
    return (
      <div className="w-72 border-l bg-gray-50 flex flex-col h-full">
        <div className="flex border-b bg-white">
          <button className="flex-1 py-3 text-sm font-bold border-b-2 border-primary-navy text-primary-navy">
            Unplaced Inventory
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {unplacedUnits.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-8">
              All inventory units have been placed on the layout!
            </div>
          )}

          {unplacedPlots.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-2 border-b pb-1">Plots</h3>
              <div className="space-y-2">
                {unplacedPlots.map(unit => (
                  <div key={unit.id} className="bg-white p-3 border rounded shadow-sm text-sm">
                    <div className="flex justify-between font-bold mb-1">
                      <span>{unit.unitNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${unit.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {unit.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {unit.size || (unit.area ? `${unit.area} sq.ft` : '')} • {unit.facing || 'No Facing'} • {unit.shape || 'Standard'}
                    </div>
                    <button 
                      onClick={() => addInventoryUnit && addInventoryUnit(unit)}
                      className="w-full bg-brand-gold text-white font-bold py-1.5 rounded hover:bg-yellow-600 transition-colors"
                    >
                      Place on Canvas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(groupedApartments).length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-2 border-b pb-1 mt-4">Apartments</h3>
              <div className="space-y-4">
                {Object.keys(groupedApartments).map(tower => (
                  <div key={tower} className="space-y-2">
                    <h4 className="font-bold text-xs text-primary-navy bg-blue-50 p-1 rounded">{tower}</h4>
                    {Object.keys(groupedApartments[tower]).map(floor => (
                      <div key={floor} className="ml-2 border-l-2 border-blue-100 pl-2">
                        <div className="text-xs font-semibold text-gray-600 mb-1">{floor}</div>
                        <div className="space-y-2">
                          {groupedApartments[tower][floor].map((unit: any) => (
                            <div key={unit.id} className="bg-white p-2 border rounded shadow-sm flex items-center justify-between">
                              <div>
                                <div className="font-bold text-sm">{unit.unitNumber}</div>
                                <div className="text-[10px] text-gray-500">{unit.status}</div>
                              </div>
                              <button 
                                onClick={() => addInventoryUnit && addInventoryUnit(unit)}
                                className="bg-brand-gold text-white text-xs font-bold px-2 py-1 rounded hover:bg-yellow-600"
                              >
                                Place
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
      <div className="flex border-b bg-white cursor-pointer" onClick={() => setActiveTab('unplaced')}>
        <button className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 border-b-2 border-transparent">
          ← Back to Unplaced
        </button>
      </div>
      <div className="p-3 font-bold text-sm border-b flex justify-between items-center bg-gray-100">
        {isMultiSelect ? `Multiple (${selectedElements.length})` : 'Properties'}
        <div className="flex items-center gap-1">
          <button onClick={duplicateSelectedElements} className="text-gray-500 hover:bg-gray-200 p-1 rounded" title="Duplicate">
            <Copy size={16} />
          </button>
          <button onClick={deleteSelectedElements} className="text-gray-500 hover:bg-gray-200 hover:text-red-500 p-1 rounded" title="Delete">
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
                            
                            <button 
                              onClick={() => {
                                setEditingInvId(inv.id);
                                setEditInvData({...inv});
                              }}
                              className="mt-2 w-full bg-primary-navy text-white text-[10px] py-1 rounded hover:bg-opacity-90"
                            >
                              Edit Unit Details
                            </button>
                            <p className="text-[9px] text-gray-500 mt-1 leading-tight text-center">
                              * Synchronizes directly with Inventory database.
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Inline Inventory Editor */}
                  {editingInvId === el.inventoryUnitId && el.inventoryUnitId && (
                    <div className="mt-2 p-3 bg-white border border-gray-200 shadow-sm rounded relative">
                      <button 
                        onClick={() => setEditingInvId(null)}
                        className="absolute top-1 right-1 text-gray-400 hover:text-gray-700"
                      >
                        <X size={14} />
                      </button>
                      <h4 className="text-xs font-bold text-gray-700 mb-3 pb-1 border-b">Edit DB Properties</h4>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-gray-500 mb-1">Status</label>
                          <select 
                            value={editInvData.status || ''} 
                            onChange={e => setEditInvData({...editInvData, status: e.target.value})}
                            className="w-full border p-1 rounded bg-gray-50"
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="RESERVED">RESERVED</option>
                            <option value="HOLD">HOLD</option>
                            <option value="BOOKED">BOOKED</option>
                            <option value="REGISTERED">REGISTERED</option>
                            <option value="SOLD">SOLD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-1">Price</label>
                          <input 
                            type="number" 
                            value={editInvData.price || ''} 
                            onChange={e => setEditInvData({...editInvData, price: parseFloat(e.target.value)})}
                            className="w-full border p-1 rounded bg-gray-50" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-500 mb-1">Area</label>
                            <input 
                              type="text" 
                              value={editInvData.area || ''} 
                              onChange={e => setEditInvData({...editInvData, area: e.target.value})}
                              className="w-full border p-1 rounded bg-gray-50" 
                            />
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1">Shape</label>
                            <input 
                              type="text" 
                              value={editInvData.shape || ''} 
                              onChange={e => setEditInvData({...editInvData, shape: e.target.value})}
                              className="w-full border p-1 rounded bg-gray-50" 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-500 mb-1">N Length</label>
                            <input type="number" value={editInvData.northLength || ''} onChange={e => setEditInvData({...editInvData, northLength: parseFloat(e.target.value)})} className="w-full border p-1 rounded bg-gray-50" />
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1">S Length</label>
                            <input type="number" value={editInvData.southLength || ''} onChange={e => setEditInvData({...editInvData, southLength: parseFloat(e.target.value)})} className="w-full border p-1 rounded bg-gray-50" />
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1">E Length</label>
                            <input type="number" value={editInvData.eastLength || ''} onChange={e => setEditInvData({...editInvData, eastLength: parseFloat(e.target.value)})} className="w-full border p-1 rounded bg-gray-50" />
                          </div>
                          <div>
                            <label className="block text-gray-500 mb-1">W Length</label>
                            <input type="number" value={editInvData.westLength || ''} onChange={e => setEditInvData({...editInvData, westLength: parseFloat(e.target.value)})} className="w-full border p-1 rounded bg-gray-50" />
                          </div>
                        </div>
                        
                        <button 
                          onClick={async () => {
                            setIsSaving(true);
                            try {
                              await api.patch(`/inventory/${editingInvId}`, editInvData);
                              alert('Inventory updated successfully.');
                              if (onRefreshProject) onRefreshProject();
                            } catch (err) {
                              alert('Failed to update inventory');
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          disabled={isSaving}
                          className="w-full mt-3 bg-green-600 text-white py-1.5 rounded font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <Save size={14} /> {isSaving ? 'Saving...' : 'Save to DB'}
                        </button>
                      </div>
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
                  <label className="block text-xs text-gray-500 mb-1">Road Width / Thickness (ft)</label>
                  <input 
                    type="number" 
                    value={el.elementData?.roadWidth || el.height || 40} 
                    onChange={e => updateSelectedElements({elementData: {...el.elementData, roadWidth: parseInt(e.target.value)}})}
                    className="w-full border p-1.5 text-sm rounded bg-white" 
                  />
                </div>
                
                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Road Path (Points)</label>
                  <p className="text-[10px] text-gray-500 mb-2">To make a curved road, define points relative to the road's X/Y position.</p>
                  
                  {el.elementData?.points && el.elementData.points.length > 0 ? (
                    <div className="space-y-2">
                      {Array.from({ length: el.elementData.points.length / 2 }).map((_, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-[10px] font-bold w-4">{i+1}.</span>
                          <input 
                            type="number" 
                            className="w-full border p-1 text-xs rounded"
                            value={el.elementData.points[i * 2]} 
                            onChange={e => {
                              const newPts = [...el.elementData.points];
                              newPts[i * 2] = parseFloat(e.target.value) || 0;
                              updateSelectedElements({elementData: {...el.elementData, points: newPts}});
                            }}
                          />
                          <input 
                            type="number" 
                            className="w-full border p-1 text-xs rounded"
                            value={el.elementData.points[i * 2 + 1]} 
                            onChange={e => {
                              const newPts = [...el.elementData.points];
                              newPts[i * 2 + 1] = parseFloat(e.target.value) || 0;
                              updateSelectedElements({elementData: {...el.elementData, points: newPts}});
                            }}
                          />
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              const newPts = [...el.elementData.points];
                              newPts.splice(i * 2, 2);
                              updateSelectedElements({elementData: {...el.elementData, points: newPts}});
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        className="w-full bg-gray-200 text-gray-700 text-xs py-1 rounded mt-1"
                        onClick={() => {
                          const pts = el.elementData.points || [];
                          // add a point offset from the last one
                          const lastX = pts.length >= 2 ? pts[pts.length - 2] : 0;
                          const lastY = pts.length >= 2 ? pts[pts.length - 1] : 0;
                          updateSelectedElements({elementData: {...el.elementData, points: [...pts, lastX + 50, lastY + 50]}});
                        }}
                      >
                        + Add Point
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="w-full bg-indigo-100 text-indigo-700 font-bold text-xs py-1.5 rounded"
                      onClick={() => {
                        // Convert to line format
                        updateSelectedElements({
                          elementData: {
                            ...el.elementData, 
                            points: [0, 0, el.width || 100, 0] // starting straight line
                          }
                        });
                      }}
                    >
                      Convert to Curved Path
                    </button>
                  )}
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
