import React from 'react';
import { MousePointer2, Move, Type, AlignLeft, AlignCenter, AlignRight, AlignVerticalSpaceAround, BringToFront, SendToBack, Square, Navigation, MapPin, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';

interface ToolbarProps {
  layout: any;
  setLayout: (l: any) => void;
  setIsDirty: (d: boolean) => void;
  setBgImageFile: (f: File | null) => void;
  addElement: (type: string) => void;
  currentTool: string;
  setCurrentTool: (tool: string) => void;
  alignElements: (alignment: string) => void;
  changeZIndex: (direction: 'front' | 'back') => void;
  hasSelection: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  layout,
  setLayout,
  setIsDirty,
  setBgImageFile,
  addElement,
  currentTool,
  setCurrentTool,
  alignElements,
  changeZIndex,
  hasSelection
}) => {
  return (
    <div className="w-56 border-r bg-gray-50 flex flex-col h-full overflow-y-auto">
      <div className="p-3 font-bold text-sm border-b">Tools</div>
      
      <div className="p-2 space-y-1">
        <button 
          onClick={() => setCurrentTool('SELECT')}
          className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${currentTool === 'SELECT' ? 'bg-primary-navy text-white font-bold' : 'hover:bg-gray-200 text-gray-700'}`}
        >
          <MousePointer2 size={16} /> Select
        </button>
        <button 
          onClick={() => setCurrentTool('PAN')}
          className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${currentTool === 'PAN' ? 'bg-primary-navy text-white font-bold' : 'hover:bg-gray-200 text-gray-700'}`}
        >
          <Move size={16} /> Pan Canvas
        </button>
      </div>

      <div className="p-3 font-bold text-sm border-b border-t mt-2">Add Elements</div>
      <div className="p-2 grid grid-cols-2 gap-2">
        <button onClick={() => addElement('PLOT')} className="flex flex-col items-center justify-center p-2 bg-white border rounded shadow-sm hover:border-brand-gold hover:text-brand-gold text-xs font-semibold text-gray-600 h-16">
          <Square size={20} className="mb-1" />
          Plot
        </button>
        <button onClick={() => addElement('ROAD')} className="flex flex-col items-center justify-center p-2 bg-white border rounded shadow-sm hover:border-brand-gold hover:text-brand-gold text-xs font-semibold text-gray-600 h-16">
          <Navigation size={20} className="mb-1" />
          Road
        </button>
        <button onClick={() => addElement('PARK')} className="flex flex-col items-center justify-center p-2 bg-white border rounded shadow-sm hover:border-brand-gold hover:text-brand-gold text-xs font-semibold text-gray-600 h-16">
          <MapPin size={20} className="mb-1 text-green-600" />
          Park
        </button>
        <button onClick={() => addElement('TEXT')} className="flex flex-col items-center justify-center p-2 bg-white border rounded shadow-sm hover:border-brand-gold hover:text-brand-gold text-xs font-semibold text-gray-600 h-16">
          <Type size={20} className="mb-1" />
          Text
        </button>
      </div>

      <div className="p-3 font-bold text-sm border-b border-t mt-2">Alignment</div>
      <div className="p-2 grid grid-cols-3 gap-1">
        <button disabled={!hasSelection} onClick={() => alignElements('LEFT')} className="p-2 flex justify-center hover:bg-gray-200 rounded disabled:opacity-30"><AlignLeft size={16} /></button>
        <button disabled={!hasSelection} onClick={() => alignElements('CENTER')} className="p-2 flex justify-center hover:bg-gray-200 rounded disabled:opacity-30"><AlignCenter size={16} /></button>
        <button disabled={!hasSelection} onClick={() => alignElements('RIGHT')} className="p-2 flex justify-center hover:bg-gray-200 rounded disabled:opacity-30"><AlignRight size={16} /></button>
        <button disabled={!hasSelection} onClick={() => alignElements('TOP')} className="p-2 flex justify-center hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUpToLine size={16} /></button>
        <button disabled={!hasSelection} onClick={() => alignElements('MIDDLE')} className="p-2 flex justify-center hover:bg-gray-200 rounded disabled:opacity-30"><AlignVerticalSpaceAround size={16} /></button>
        <button disabled={!hasSelection} onClick={() => alignElements('BOTTOM')} className="p-2 flex justify-center hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDownToLine size={16} /></button>
      </div>
      
      <div className="p-2 grid grid-cols-2 gap-1 mt-1 border-b pb-4">
        <button disabled={!hasSelection} onClick={() => changeZIndex('front')} className="p-1 flex items-center justify-center gap-1 text-xs font-semibold hover:bg-gray-200 rounded disabled:opacity-30"><BringToFront size={14}/> To Front</button>
        <button disabled={!hasSelection} onClick={() => changeZIndex('back')} className="p-1 flex items-center justify-center gap-1 text-xs font-semibold hover:bg-gray-200 rounded disabled:opacity-30"><SendToBack size={14}/> To Back</button>
      </div>

      <div className="p-3 font-bold text-sm border-b">Background Settings</div>
      <div className="p-3 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Canvas Width</label>
          <input 
            type="number" 
            value={layout.canvasWidth} 
            onChange={e => { setLayout({...layout, canvasWidth: parseInt(e.target.value)}); setIsDirty(true); }}
            className="w-full border p-1 text-sm rounded bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Canvas Height</label>
          <input 
            type="number" 
            value={layout.canvasHeight} 
            onChange={e => { setLayout({...layout, canvasHeight: parseInt(e.target.value)}); setIsDirty(true); }}
            className="w-full border p-1 text-sm rounded bg-white"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Grid Size (Snap)</label>
          <select 
            value={layout.gridSize || 20} 
            onChange={e => { setLayout({...layout, gridSize: parseInt(e.target.value)}); setIsDirty(true); }}
            className="w-full border p-1 text-sm rounded bg-white"
          >
            <option value="5">5 px</option>
            <option value="10">10 px</option>
            <option value="20">20 px</option>
            <option value="50">50 px</option>
            <option value="100">100 px</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Upload Master Plan</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setBgImageFile(e.target.files[0]);
                setIsDirty(true);
              }
            }}
            className="w-full text-xs"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Opacity</label>
          <input 
            type="range" 
            min="0" max="1" step="0.1"
            value={layout.backgroundOpacity}
            onChange={e => { setLayout({...layout, backgroundOpacity: parseFloat(e.target.value)}); setIsDirty(true); }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
