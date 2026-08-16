import React, { useState, useEffect, useRef } from 'react';
import api, { getStaticUrl } from '../../../services/api';
import { ZoomIn, ZoomOut, Maximize, Search, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Group } from 'react-konva';
import useImage from 'use-image';

interface LayoutViewerProps {
  projectId: string;
  inventoryUnits: any[];
}

const BackgroundImage = ({ url, opacity, width, height }: { url: string, opacity: number, width: number, height: number }) => {
  const [image] = useImage(url);
  return <KonvaImage image={image} width={width} height={height} opacity={opacity} />;
};

export const LayoutViewer: React.FC<LayoutViewerProps> = ({ projectId, inventoryUnits }) => {
  const [layout, setLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  // Filter/Search State
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const stageRef = useRef<any>(null);

  useEffect(() => {
    fetchPublishedLayout();
  }, [projectId]);

  const fetchPublishedLayout = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/layout/published`);
      const layoutData = res.data.data;
      const parsedElements = (layoutData.elements || []).map((el: any) => ({
        ...el,
        elementData: typeof el.elementData === 'string' ? JSON.parse(el.elementData) : (el.elementData || {})
      })).sort((a: any, b: any) => a.zIndex - b.zIndex);
      
      setLayout({ ...layoutData, elements: parsedElements });
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to fetch layout', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      let direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;

      setZoom(newScale);
      setPan({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    }
  };

  const handleSearchPlot = (q: string) => {
    setSearchQuery(q);
    if (q.trim() === '') return;
    
    // Find the plot
    const target = elements.find((el: any) => {
      if (el.type !== 'PLOT') return false;
      const plotNum = el.liveInventory?.unitNumber || el.elementData?.plotNumber;
      return plotNum && plotNum.toLowerCase() === q.toLowerCase();
    });

    if (target && stageRef.current) {
      // Zoom and center to plot
      const targetZoom = 2; // zoom in closer
      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      
      const targetCenter = {
        x: target.x + (target.width || 60)/2,
        y: target.y + (target.height || 100)/2
      };

      setZoom(targetZoom);
      setPan({
        x: stageWidth / 2 - targetCenter.x * targetZoom,
        y: stageHeight / 2 - targetCenter.y * targetZoom
      });
      setSelectedElement(target);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading Master Plan...</div>;
  }

  if (!layout) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        <Maximize size={48} className="mx-auto text-gray-300 mb-4" />
        <p>No published Master Plan available yet.</p>
      </div>
    );
  }

  // Combine elements with live inventory data
  const elements = layout.elements.map((el: any) => {
    if (el.type === 'PLOT' && el.inventoryUnitId) {
      const inv = inventoryUnits.find(iu => iu.id === el.inventoryUnitId);
      return { ...el, liveInventory: inv };
    }
    return el;
  });

  const filteredElements = elements.filter((el: any) => {
    if (el.type !== 'PLOT') return true;
    if (!el.liveInventory) return true;
    
    // Status Filter
    if (filterStatus !== 'ALL' && el.liveInventory.status !== filterStatus) return false;
    
    // Search Filter
    if (searchQuery && !el.liveInventory.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      // If we are searching exactly, we only want to filter out non-matching plots if it's a strict search. 
      // But typically a viewer wants to see the whole map and just HIGHLIGHT the searched plot. 
      // We will handle highlighting in rendering rather than filtering them out entirely.
    }
    
    return true;
  });

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return { fill: '#22c55e', stroke: '#15803d' };
      case 'BOOKED': return { fill: '#3b82f6', stroke: '#1d4ed8' };
      case 'HOLD': return { fill: '#eab308', stroke: '#a16207' };
      case 'RESERVED': return { fill: '#f97316', stroke: '#c2410c' };
      case 'REGISTERED': return { fill: '#ef4444', stroke: '#b91c1c' };
      case 'SOLD': return { fill: '#991b1b', stroke: '#7f1d1d' };
      default: return { fill: '#9ca3af', stroke: 'transparent' };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px]">
      
      {/* Top Bar */}
      <div className="p-3 border-b flex flex-wrap justify-between items-center bg-gray-50 gap-4 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-primary-navy">Master Plan</h2>
          
          {/* Filters */}
          <div className="flex items-center gap-2 text-sm border-l pl-4">
            <span className="font-semibold text-gray-600">Filter:</span>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="border rounded px-2 py-1 bg-white focus:ring-brand-gold focus:border-brand-gold"
            >
              <option value="ALL">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="HOLD">Hold</option>
              <option value="BOOKED">Booked</option>
              <option value="REGISTERED">Registered</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search plot..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchPlot(searchQuery); }}
              className="pl-7 pr-2 py-1 text-sm border rounded focus:ring-brand-gold focus:border-brand-gold"
            />
            <button 
              onClick={() => handleSearchPlot(searchQuery)}
              className="ml-2 px-3 py-1 bg-primary-navy text-white text-xs font-bold rounded hover:bg-opacity-90"
            >
              Find
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="p-1.5 bg-white border rounded text-gray-600 hover:bg-gray-50"><ZoomOut size={16} /></button>
          <span className="text-sm font-semibold w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.2))} className="p-1.5 bg-white border rounded text-gray-600 hover:bg-gray-50"><ZoomIn size={16} /></button>
          <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-1.5 bg-white border rounded text-gray-600 hover:bg-gray-50 text-xs font-bold px-2">FIT</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Canvas Area */}
        <div className="flex-1 bg-gray-200 overflow-hidden relative" id="canvas-container">
          <Stage 
            width={window.innerWidth} 
            height={700}
            ref={stageRef}
            scaleX={zoom}
            scaleY={zoom}
            x={pan.x}
            y={pan.y}
            draggable={true} // Viewer is always in Pan mode essentially
            onDragMove={(e) => {
              if (e.target === stageRef.current) {
                setPan({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onWheel={handleWheel}
            className="cursor-grab active:cursor-grabbing"
            style={{ width: '100%', height: '100%' }}
          >
            <Layer>
              <Rect 
                x={0} y={0} width={layout.canvasWidth} height={layout.canvasHeight}
                fill="white"
                shadowColor="black" shadowBlur={10} shadowOpacity={0.1}
              />

              {layout.backgroundImage && (
                <BackgroundImage 
                  url={getStaticUrl(layout.backgroundImage)}
                  opacity={layout.backgroundOpacity}
                  width={layout.canvasWidth}
                  height={layout.canvasHeight}
                />
              )}

              {filteredElements.map((el: any) => {
                const isSelected = selectedElement?.id === el.id;
                
                let fill = "#9ca3af";
                let stroke = "transparent";
                let strokeWidth = 0;
                let textColor = "white";
                let textValue = el.elementData?.label || "?";
                let isText = false;
                let isMatch = false;

                if (el.type === 'PLOT') {
                  fill = "#22c55e"; stroke = "#15803d"; strokeWidth = 2;
                  
                  if (el.liveInventory) {
                    textValue = el.liveInventory.unitNumber;
                    const colors = getStatusColors(el.liveInventory.status);
                    fill = colors.fill;
                    stroke = colors.stroke;
                  } else if (el.elementData?.plotNumber) {
                    textValue = el.elementData.plotNumber;
                  }
                  
                  if (searchQuery && textValue.toLowerCase() === searchQuery.toLowerCase()) {
                    isMatch = true;
                  }
                } else if (el.type === 'ROAD') {
                  fill = "#4b5563";
                  textValue = el.elementData?.label || "";
                } else if (el.type === 'PARK') {
                  fill = "#bbf7d0"; stroke = "#22c55e"; strokeWidth = 2;
                  textColor = "#166534";
                  textValue = el.elementData?.label || "Park";
                } else if (el.type === 'TEXT') {
                  isText = true;
                  textValue = el.elementData?.text || "Text";
                  textColor = el.elementData?.color || "#000000";
                }

                return (
                  <Group
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rotation={el.rotation}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (el.type === 'PLOT') setSelectedElement(el);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      if (el.type === 'PLOT') setSelectedElement(el);
                    }}
                  >
                    {!isText && (
                      <Rect
                        width={el.width}
                        height={el.height}
                        fill={fill}
                        stroke={isMatch ? '#fbbf24' : (isSelected ? 'white' : stroke)} // yellow border if matched
                        strokeWidth={isMatch ? 4 : (isSelected ? 4 : strokeWidth)}
                        shadowColor={isSelected || isMatch ? 'black' : 'transparent'}
                        shadowBlur={10}
                        shadowOpacity={0.5}
                        cornerRadius={el.type === 'PARK' ? 4 : 2}
                        opacity={0.9}
                      />
                    )}
                    
                    {isText ? (
                      <KonvaText
                        text={textValue}
                        fill={textColor}
                        fontSize={el.elementData?.fontSize || 24}
                        fontFamily="Arial"
                        fontStyle="bold"
                      />
                    ) : (
                      <KonvaText
                        text={textValue}
                        width={el.width}
                        height={el.height}
                        fill={textColor}
                        fontSize={el.type === 'ROAD' ? 10 : 12}
                        fontFamily="Arial"
                        fontStyle="bold"
                        align="center"
                        verticalAlign="middle"
                      />
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        {/* Selected Plot Panel */}
        {selectedElement && selectedElement.liveInventory && (
          <div className="w-80 border-l bg-white shadow-xl flex flex-col z-40 absolute right-0 top-0 h-full animate-slide-in-right">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Plot {selectedElement.liveInventory.unitNumber}</h3>
              <button onClick={() => setSelectedElement(null)} className="text-gray-500 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">Status</span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full text-white`} style={{ backgroundColor: getStatusColors(selectedElement.liveInventory.status).fill }}>
                  {selectedElement.liveInventory.status}
                </span>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Area / Size</span>
                  <span className="font-medium">{selectedElement.liveInventory.size || 'N/A'}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Price</span>
                  <span className="font-bold text-lg text-primary-navy">{formatCurrency(selectedElement.liveInventory.price)}</span>
                </div>
                
                {selectedElement.elementData?.facing && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Facing</span>
                    <span className="font-medium">{selectedElement.elementData.facing}</span>
                  </div>
                )}
                
                {selectedElement.elementData?.roadWidth && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Road Width</span>
                    <span className="font-medium">{selectedElement.elementData.roadWidth}</span>
                  </div>
                )}

                {selectedElement.elementData?.cornerPlot && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Special</span>
                    <span className="font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs inline-block w-max">Corner Plot</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedElement.liveInventory.status === 'AVAILABLE' && (
                <div className="pt-6 mt-4 border-t border-gray-100">
                  <a 
                    href={`/projects/${projectId}/book/${selectedElement.liveInventory.id}`}
                    className="block w-full text-center bg-brand-gold text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Initiate Booking
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="p-2 border-t bg-white flex justify-center flex-wrap gap-6 text-xs font-semibold">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div> Available</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#f97316' }}></div> Reserved</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#eab308' }}></div> Hold</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#3b82f6' }}></div> Booked</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div> Registered</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#991b1b' }}></div> Sold</div>
      </div>
    </div>
  );
};
