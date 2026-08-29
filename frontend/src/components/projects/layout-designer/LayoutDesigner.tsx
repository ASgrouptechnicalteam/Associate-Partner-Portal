import React, { useState, useEffect, useRef } from 'react';
import api, { getStaticUrl } from '../../../services/api';
import { ZoomIn, ZoomOut, Save, ArrowRight, Download } from 'lucide-react';
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Transformer, Group, Line } from 'react-konva';
import useImage from 'use-image';
import { getInventoryStatusColor } from '../../../utils/statusColors';
import { calculatePlotPolygon } from '../../../utils/geometryUtils';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';

interface LayoutDesignerProps {
  projectId: string;
  inventoryUnits: any[];
  onRefreshProject?: () => void;
}

const BackgroundImage = ({ url, opacity, width, height }: { url: string, opacity: number, width: number, height: number }) => {
  const [image] = useImage(url);
  return <KonvaImage image={image} width={width} height={height} opacity={opacity} />;
};

export const LayoutDesigner: React.FC<LayoutDesignerProps> = ({ projectId, inventoryUnits, onRefreshProject }) => {
  const [layout, setLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // App State
  const [elements, setElements] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  
  // Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [currentTool, setCurrentTool] = useState('SELECT'); // SELECT, PAN
  
  // Selection box
  const [selectionBox, setSelectionBox] = useState<{ visible: boolean, x1: number, y1: number, x2: number, y2: number }>({ visible: false, x1: 0, y1: 0, x2: 0, y2: 0 });

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          deleteSelectedElements();
        }
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'd') {
          e.preventDefault();
          duplicateSelectedElements();
        }
        if (e.key === 'a') {
          e.preventDefault();
          setSelectedIds(elements.map(el => el.id));
        }
      }
      
      // Arrow keys movement
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        
        setElements(prev => {
          let updated = false;
          const next = prev.map(el => {
            if (selectedIds.includes(el.id)) {
              updated = true;
              return {
                ...el,
                x: e.key === 'ArrowLeft' ? el.x - step : e.key === 'ArrowRight' ? el.x + step : el.x,
                y: e.key === 'ArrowUp' ? el.y - step : e.key === 'ArrowDown' ? el.y + step : el.y,
              };
            }
            return el;
          });
          if (updated) setIsDirty(true);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements]);

  // Handle Transformer Updates
  useEffect(() => {
    if (selectedIds.length > 0 && trRef.current && layerRef.current) {
      const nodes = selectedIds.map(id => layerRef.current.findOne(`#el-${id}`)).filter(n => n !== undefined);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedIds, elements]);

  // Load Data
  useEffect(() => {
    fetchDraftLayout();
  }, [projectId]);

  const fetchDraftLayout = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${projectId}/layout/draft`);
      const layoutData = res.data.data;
      // Ensure elementData is parsed if it comes back as string sometimes
      const parsedElements = (layoutData.elements || []).map((el: any) => ({
        ...el,
        elementData: typeof el.elementData === 'string' ? JSON.parse(el.elementData) : (el.elementData || {})
      })).sort((a: any, b: any) => a.zIndex - b.zIndex);
      
      setLayout(layoutData);
      setElements(parsedElements);
    } catch (err: any) {
      console.error('Failed to fetch draft layout', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      
      let bgUrl = layout.backgroundImage;
      if (bgImageFile) {
        const formData = new FormData();
        formData.append('image', bgImageFile);
        const uploadRes = await api.post(`/projects/${projectId}/layout/background`, formData);
        bgUrl = uploadRes.data.url;
      }

      // Filter out any PLOT or UNIT that lacks an inventoryUnitId to prevent sending orphans
      const cleanElements = elements.filter(el => {
        if ((el.type === 'PLOT' || el.type === 'UNIT') && !el.inventoryUnitId) {
          console.warn('Stripping orphan element from save payload:', el.id);
          return false;
        }
        return true;
      });

      await api.post(`/projects/${projectId}/layout/draft`, {
        name: layout.name,
        canvasWidth: layout.canvasWidth,
        canvasHeight: layout.canvasHeight,
        backgroundImage: bgUrl,
        backgroundOpacity: layout.backgroundOpacity,
        gridSize: layout.gridSize,
        elements: cleanElements.map(el => ({
          ...el,
          elementData: el.elementData // Axios handles JSON serialization
        }))
      });
      
      setIsDirty(false);
      alert('Draft saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (isDirty) {
      alert('Please save your draft before publishing.');
      return;
    }
    
    // Quick validation
    const plotNumbers = new Set();
    let duplicateError = false;
    elements.filter(e => e.type === 'PLOT').forEach(el => {
      const pnum = el.elementData?.plotNumber;
      if (pnum) {
        if (plotNumbers.has(pnum)) duplicateError = true;
        plotNumbers.add(pnum);
      }
    });

    if (duplicateError) {
      alert('Validation Error: You have duplicate plot numbers on the canvas.');
      return;
    }

    if (window.confirm('Publish this layout? This will make it visible to all authorized associates.')) {
      try {
        setSaving(true);
        await api.post(`/projects/layout/${layout.id}/publish`);
        alert('Layout published successfully!');
        fetchDraftLayout();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Failed to publish layout.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDownload = () => {
    if (stageRef.current) {
      // Temporarily hide transformer before exporting
      const wasTransformerVisible = trRef.current && trRef.current.nodes().length > 0;
      if (wasTransformerVisible) {
        trRef.current.nodes([]);
      }
      
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      
      if (wasTransformerVisible && selectedIds.length > 0) {
        const nodes = selectedIds.map(id => layerRef.current.findOne(`#el-${id}`)).filter((n: any) => n !== undefined);
        trRef.current.nodes(nodes);
      }
      
      const link = document.createElement('a');
      link.download = `project-${projectId}-layout.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  const handleMouseDown = (e: any) => {
    if (currentTool === 'PAN') return;
    
    // If we click on empty canvas, start selection box or deselect
    if (e.target === e.target.getStage() || e.target.name() === 'bg-rect' || e.target.name() === 'bg-image') {
      const pos = e.target.getStage().getPointerPosition();
      const stage = stageRef.current;
      const x = (pos.x - stage.x()) / stage.scaleX();
      const y = (pos.y - stage.y()) / stage.scaleY();
      
      setSelectionBox({ visible: true, x1: x, y1: y, x2: x, y2: y });
      
      if (!e.evt.shiftKey && !e.evt.ctrlKey) {
        setSelectedIds([]);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (!selectionBox.visible) return;
    
    const pos = e.target.getStage().getPointerPosition();
    const stage = stageRef.current;
    const x = (pos.x - stage.x()) / stage.scaleX();
    const y = (pos.y - stage.y()) / stage.scaleY();
    
    setSelectionBox(prev => ({ ...prev, x2: x, y2: y }));
  };

  const handleMouseUp = (e: any) => {
    if (!selectionBox.visible) return;
    setSelectionBox(prev => ({ ...prev, visible: false }));
    
    // Find intersecting elements
    const box = {
      x: Math.min(selectionBox.x1, selectionBox.x2),
      y: Math.min(selectionBox.y1, selectionBox.y2),
      width: Math.abs(selectionBox.x2 - selectionBox.x1),
      height: Math.abs(selectionBox.y2 - selectionBox.y1),
    };
    
    // Only select if dragged more than 2px
    if (box.width > 2 || box.height > 2) {
      const newSelected = elements.filter(el => {
        return (
          el.x >= box.x &&
          el.y >= box.y &&
          el.x + (el.width || 0) <= box.x + box.width &&
          el.y + (el.height || 0) <= box.y + box.height
        );
      }).map(el => el.id);
      
      if (e.evt.shiftKey || e.evt.ctrlKey) {
        setSelectedIds(prev => Array.from(new Set([...prev, ...newSelected])));
      } else {
        setSelectedIds(newSelected);
      }
    }
  };

  // Element Actions
  const addElement = (type: string) => {
    // Generate next available plot number
    let nextPlotNum = '';
    if (type === 'PLOT') {
      const existingPlots = elements.filter(e => e.type === 'PLOT' && e.elementData?.plotNumber).map(e => parseInt(e.elementData.plotNumber)).filter(n => !isNaN(n));
      const maxNum = existingPlots.length > 0 ? Math.max(...existingPlots) : 100;
      nextPlotNum = (maxNum + 1).toString();
    }

    const stage = stageRef.current;
    const scale = stage.scaleX();
    const viewCenterX = (-stage.x() + stage.width() / 2) / scale;
    const viewCenterY = (-stage.y() + stage.height() / 2) / scale;
    
    // Snap to grid initially
    const g = layout.gridSize || 20;
    const snappedX = Math.round(viewCenterX / g) * g;
    const snappedY = Math.round(viewCenterY / g) * g;

    const newElement = {
      id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      x: snappedX,
      y: snappedY,
      width: type === 'ROAD' ? 200 : type === 'PLOT' ? 60 : 80,
      height: type === 'ROAD' ? 40 : type === 'PLOT' ? 100 : 80,
      rotation: 0,
      zIndex: elements.length + 1,
      inventoryUnitId: null,
      elementData: type === 'PLOT' 
        ? { plotNumber: nextPlotNum, facing: 'East', roadWidth: '30' } 
        : { label: type === 'ROAD' ? 'Main Road' : type }
    };
    
    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
    setIsDirty(true);
    setCurrentTool('SELECT');
  };

  const addInventoryUnit = (unit: any) => {
    const stage = stageRef.current;
    const scale = stage.scaleX();
    const viewCenterX = (-stage.x() + stage.width() / 2) / scale;
    const viewCenterY = (-stage.y() + stage.height() / 2) / scale;
    
    // Snap to grid initially
    const g = layout.gridSize || 20;
    const snappedX = Math.round(viewCenterX / g) * g;
    const snappedY = Math.round(viewCenterY / g) * g;

    // Use area or a default size
    let width = 60;
    let height = 100;
    if (unit.propertyType === 'UNIT') {
      width = 80;
      height = 80;
    }

    const newElement = {
      id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: unit.propertyType === 'PLOT' ? 'PLOT' : 'UNIT',
      x: snappedX,
      y: snappedY,
      width,
      height,
      rotation: 0,
      zIndex: elements.length + 1,
      inventoryUnitId: unit.id,
      elementData: { 
        plotNumber: unit.unitNumber,
        facing: unit.facing,
        northBoundary: unit.northBoundary,
        southBoundary: unit.southBoundary,
        eastBoundary: unit.eastBoundary,
        westBoundary: unit.westBoundary
      }
    };
    
    setElements([...elements, newElement]);
    setSelectedIds([newElement.id]);
    setIsDirty(true);
    setCurrentTool('SELECT');
  };

  const updateSelectedElements = (updates: any) => {
    setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el));
    setIsDirty(true);
  };

  const deleteSelectedElements = () => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setSelectedIds([]);
    setIsDirty(true);
  };

  const duplicateSelectedElements = () => {
    const toDuplicate = elements.filter(el => selectedIds.includes(el.id));
    const newElements = toDuplicate.map(el => {
        if (el.type === 'PLOT' || el.type === 'UNIT') {
          return null; // Cannot duplicate plots or units to prevent orphans
        }

        return {
          ...el,
          id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          x: el.x + (layout.gridSize || 20),
          y: el.y + (layout.gridSize || 20),
          zIndex: elements.length + 1,
          inventoryUnitId: null, // Critical: DO NOT copy inventory unit mapping
          elementData: {
            ...el.elementData
          }
        };
      }).filter(Boolean);
      setElements([...elements, ...newElements as any]);
      setSelectedIds(newElements.map((el: any) => el.id));
      setIsDirty(true);
  };

  const alignElements = (alignment: string) => {
    if (selectedIds.length < 2) return;
    const targets = elements.filter(el => selectedIds.includes(el.id));
    
    setElements(prev => {
      let next = [...prev];
      
      const bounds = {
        minX: Math.min(...targets.map(t => t.x)),
        maxX: Math.max(...targets.map(t => t.x + (t.width || 0))),
        minY: Math.min(...targets.map(t => t.y)),
        maxY: Math.max(...targets.map(t => t.y + (t.height || 0))),
      };
      
      targets.forEach(t => {
        const index = next.findIndex(n => n.id === t.id);
        if (index > -1) {
          const el = {...next[index]};
          switch(alignment) {
            case 'LEFT': el.x = bounds.minX; break;
            case 'RIGHT': el.x = bounds.maxX - (el.width || 0); break;
            case 'CENTER': el.x = bounds.minX + (bounds.maxX - bounds.minX)/2 - (el.width || 0)/2; break;
            case 'TOP': el.y = bounds.minY; break;
            case 'BOTTOM': el.y = bounds.maxY - (el.height || 0); break;
            case 'MIDDLE': el.y = bounds.minY + (bounds.maxY - bounds.minY)/2 - (el.height || 0)/2; break;
          }
          next[index] = el;
        }
      });
      return next;
    });
    setIsDirty(true);
  };

  const changeZIndex = (direction: 'front' | 'back') => {
    if (selectedIds.length === 0) return;
    setElements(prev => {
      let next = [...prev];
      if (direction === 'front') {
        const maxZ = Math.max(...next.map(el => el.zIndex || 0));
        next = next.map(el => selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el);
      } else {
        const minZ = Math.min(...next.map(el => el.zIndex || 0));
        next = next.map(el => selectedIds.includes(el.id) ? { ...el, zIndex: minZ - 1 } : el);
      }
      return next.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    });
    setIsDirty(true);
  };

  // Konva specific event handlers
  const handleDragMove = (e: any) => {
    if (layout.gridSize > 0) {
      const g = layout.gridSize;
      const x = Math.round(e.target.x() / g) * g;
      const y = Math.round(e.target.y() / g) * g;
      e.target.position({ x, y });
    }
  };

  const handleDragEnd = (e: any) => {
    const id = e.target.id().replace('el-', '');
    // If it's a multi-drag (group dragging), this gets complex. Konva handles node array dragging natively via Transformer? No, transformer only resizes. Dragging multiple nodes natively is tricky unless grouped. 
    // For now, dragging a single element updates it. 
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return {
          ...el,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return el;
    }));
    setIsDirty(true);
  };

  const handleTransformEnd = () => {
    const node = layerRef.current.findOne(`#el-${selectedIds[0]}`);
    if (!node) return;
    
    // Scale is applied on transform, we need to convert it to width/height and reset scale
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    setElements(prev => prev.map(el => {
      if (el.id === selectedIds[0]) {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, el.width * scaleX),
          height: Math.max(5, el.height * scaleY),
        };
      }
      return el;
    }));
    setIsDirty(true);
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Designer...</div>;
  if (!layout) return <div className="p-12 text-center text-red-500">Failed to load layout drafting system.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px]" tabIndex={0}>
      
      {/* Top Bar */}
      <div className="p-3 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-primary-navy">Layout Designer <span className="text-sm font-normal text-gray-500 ml-2">({layout.status})</span></h2>
          {isDirty && <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded">Unsaved Changes</span>}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} /> Download
          </button>
          
          <button 
            onClick={handleSaveDraft}
            disabled={saving || !isDirty}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold ${isDirty ? 'bg-primary-navy text-white hover:bg-opacity-90' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <Save size={16} /> Save Draft
          </button>
          
          <button 
            onClick={handlePublish}
            disabled={saving || isDirty}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-bold ${!isDirty ? 'bg-brand-gold text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <ArrowRight size={16} /> Publish Layout
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Toolbar */}
        <Toolbar 
          layout={layout} setLayout={setLayout} setIsDirty={setIsDirty}
          setBgImageFile={setBgImageFile}
          addElement={addElement} currentTool={currentTool} setCurrentTool={setCurrentTool}
          alignElements={alignElements} changeZIndex={changeZIndex}
          hasSelection={selectedIds.length > 0}
        />

        {/* Center Canvas with Konva */}
        <div className="flex-1 bg-gray-300 overflow-hidden relative" id="canvas-container">
          
          <div className="absolute top-4 right-4 z-50 flex gap-1 bg-white p-1 rounded shadow-md">
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="p-1 hover:bg-gray-100 rounded"><ZoomOut size={16} /></button>
            <span className="text-xs font-bold w-10 text-center flex items-center justify-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(5, z + 0.2))} className="p-1 hover:bg-gray-100 rounded"><ZoomIn size={16} /></button>
          </div>

          <Stage 
            width={window.innerWidth} // In real app, bind to container width, for now oversized is fine or calculate resize observer
            height={800}
            ref={stageRef}
            scaleX={zoom}
            scaleY={zoom}
            x={pan.x}
            y={pan.y}
            draggable={currentTool === 'PAN'}
            onDragMove={(e) => {
              if (e.target === stageRef.current) {
                setPan({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={currentTool === 'PAN' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}
            style={{ width: '100%', height: '100%' }}
          >
            <Layer ref={layerRef}>
              
              {/* White Background Rect for sizing visually */}
              <Rect 
                name="bg-rect"
                x={0} y={0} width={layout.canvasWidth} height={layout.canvasHeight}
                fill="white"
                shadowColor="black" shadowBlur={10} shadowOpacity={0.1}
              />

              {/* Uploaded Background Image */}
              {(bgImageFile || layout.backgroundImage) && (
                <BackgroundImage 
                  url={bgImageFile ? URL.createObjectURL(bgImageFile) : getStaticUrl(layout.backgroundImage)}
                  opacity={layout.backgroundOpacity}
                  width={layout.canvasWidth}
                  height={layout.canvasHeight}
                />
              )}

              {/* Elements Rendering */}
              {elements.map(el => {
                
                let fill = "#9ca3af"; // gray-400
                let stroke = "transparent";
                let strokeWidth = 0;
                let textColor = "white";
                let textValue = el.elementData?.label || "?";
                let isText = false;

                let targetInv: any = null;

                if (el.type === 'PLOT' || el.type === 'UNIT') {
                  // If it has inventory, get status color
                  fill = "#22c55e"; // green-500 default
                  stroke = "#15803d"; // green-700
                  strokeWidth = 2;
                  
                  if (el.inventoryUnitId) {
                    targetInv = inventoryUnits.find(iu => iu.id === el.inventoryUnitId);
                    if (targetInv) {
                      textValue = targetInv.unitNumber;
                      fill = getInventoryStatusColor(targetInv.status);
                      stroke = "#1f2937"; // Dark border for better visibility
                    }
                  } else if (el.elementData?.plotNumber) {
                    textValue = el.elementData.plotNumber;
                  }
                } else if (el.type === 'ROAD') {
                  fill = "#4b5563"; // gray-600
                  textValue = el.elementData?.label || "";
                } else if (el.type === 'PARK') {
                  fill = "#bbf7d0"; // green-200
                  stroke = "#22c55e";
                  strokeWidth = 2;
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
                    id={`el-${el.id}`}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    rotation={el.rotation}
                    draggable={currentTool === 'SELECT'}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      if (currentTool !== 'SELECT') return;
                      e.cancelBubble = true;
                      if (e.evt.shiftKey || e.evt.ctrlKey) {
                        setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
                      } else {
                        setSelectedIds([el.id]);
                      }
                    }}
                  >
                    {!isText && (
                      (el.type === 'PLOT' || el.type === 'UNIT') ? (
                        <Line
                          points={(() => {
                            const w = el.width || 60;
                            const h = el.height || 100;
                            if (targetInv) {
                               return calculatePlotPolygon(
                                 targetInv.northLength,
                                 targetInv.southLength,
                                 targetInv.eastLength,
                                 targetInv.westLength,
                                 w,
                                 h
                               );
                            }
                            return [0, 0, w, 0, w, h, 0, h];
                          })()}
                          closed={true}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          opacity={0.9}
                        />
                      ) : el.type === 'ROAD' && el.elementData?.points && el.elementData.points.length > 0 ? (
                        <Line
                          points={el.elementData.points}
                          stroke={fill}
                          strokeWidth={el.elementData.roadWidth || el.height || 40}
                          lineCap="round"
                          lineJoin="round"
                          tension={0.3}
                          opacity={0.9}
                        />
                      ) : (
                        <Rect
                          width={el.width}
                          height={el.height}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          cornerRadius={el.type === 'PARK' ? 4 : 2}
                          opacity={0.9}
                        />
                      )
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

              <Transformer 
                ref={trRef} 
                boundBoxFunc={(oldBox, newBox) => {
                  // minimum resize
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
                onTransformEnd={handleTransformEnd}
                // Only allow proportional resizing for multi-select, otherwise normal
              />

              {/* Selection Box */}
              {selectionBox.visible && (
                <Rect 
                  x={Math.min(selectionBox.x1, selectionBox.x2)}
                  y={Math.min(selectionBox.y1, selectionBox.y2)}
                  width={Math.abs(selectionBox.x2 - selectionBox.x1)}
                  height={Math.abs(selectionBox.y2 - selectionBox.y1)}
                  fill="rgba(59, 130, 246, 0.3)" // blue-500 with opacity
                  stroke="#3b82f6"
                  strokeWidth={1}
                />
              )}

            </Layer>
          </Stage>
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel 
          selectedElements={elements.filter(el => selectedIds.includes(el.id))}
          elements={elements}
          inventoryUnits={inventoryUnits}
          updateSelectedElements={updateSelectedElements}
          deleteSelectedElements={deleteSelectedElements}
          duplicateSelectedElements={duplicateSelectedElements}
          addInventoryUnit={addInventoryUnit}
          onRefreshProject={onRefreshProject}
        />
      </div>
    </div>
  );
};
