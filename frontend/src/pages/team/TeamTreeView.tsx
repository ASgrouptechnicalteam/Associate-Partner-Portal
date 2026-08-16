import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, User, Network } from 'lucide-react';

interface DownlineUser {
  id: string;
  associateId: string;
  name: string;
  email: string;
  phone: string;
  role: { name: string };
  upline: { parentAssociateId: string } | null;
}

interface TreeNode extends DownlineUser {
  children: TreeNode[];
}

interface TeamTreeViewProps {
  data: DownlineUser[];
  currentUserId: string;
}

const buildTree = (data: DownlineUser[], rootId: string): TreeNode[] => {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Initialize map
  data.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // Build tree
  data.forEach((item) => {
    const node = map.get(item.id)!;
    const parentId = item.upline?.parentAssociateId;
    
    // If the parent is the current user (who might not be in the data array)
    // or if the parent is not in the data array, it's a root
    if (parentId === rootId || !parentId || !map.has(parentId)) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node); // Fallback
      }
    }
  });

  return roots;
};

const TreeNodeComponent: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
  const [expanded, setExpanded] = useState(level < 2); // Expand first 2 levels by default
  const hasChildren = node.children.length > 0;

  return (
    <div className="w-full">
      <div 
        className={`flex items-center p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${level === 0 ? 'bg-gray-50/50' : ''}`}
        style={{ paddingLeft: `${Math.max(0.75, level * 2)}rem` }}
      >
        <button 
          onClick={() => setExpanded(!expanded)}
          className={`p-1 rounded hover:bg-gray-200 text-gray-500 mr-2 ${!hasChildren ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        
        <div className="h-8 w-8 rounded-full bg-primary-navy/10 flex items-center justify-center text-primary-navy mr-3 shrink-0">
          <User size={16} />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div className="min-w-[200px]">
            <p className="font-semibold text-primary-navy truncate">{node.name}</p>
            <p className="text-xs text-gray-500">{node.associateId}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
              {node.role.name}
            </span>
            <span className="truncate">{node.email}</span>
          </div>
        </div>
        
        {hasChildren && (
          <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded ml-4">
            {node.children.length} direct
          </div>
        )}
      </div>
      
      {expanded && hasChildren && (
        <div className="flex flex-col border-l-2 border-gray-100 ml-[1.125rem]">
          {node.children.map(child => (
            <TreeNodeComponent key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const TeamTreeView: React.FC<TeamTreeViewProps> = ({ data, currentUserId }) => {
  const treeData = useMemo(() => buildTree(data, currentUserId), [data, currentUserId]);

  if (data.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <Network size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">No Hierarchy Data</h3>
        <p className="text-gray-500 max-w-sm">
          No team members found to build a tree structure.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
      <div className="min-w-[600px]">
        {treeData.map(node => (
          <TreeNodeComponent key={node.id} node={node} level={0} />
        ))}
      </div>
    </div>
  );
};

export default TeamTreeView;
