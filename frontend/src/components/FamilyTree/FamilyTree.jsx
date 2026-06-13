import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  getBezierPath,
} from 'reactflow';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Users, 
  Info,
  HelpCircle,
  Sparkles,
  Heart,
  Search,
  User,
  Plus,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  UserCheck
} from 'lucide-react';
import 'reactflow/dist/style.css';
import { useAuth, API_URL } from '../../context/AuthContext';
import MemberProfile from '../MemberProfile';
import getProfileImage from '../../utils/getProfileImage';

// Nodes and edges dimensions for layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 160;

// Custom Node Component matching the 2nd image exactly
const MemberNode = ({ data }) => {
  const isMale = data.gender === 'Male';
  const isCurrentUser = data.isCurrentUser;
  
  // Custom double neon-pink/purple gradient for current user or standard purple/pink gradient
  const ringGradient = isCurrentUser
    ? 'from-pink-500 via-purple-500 to-indigo-500' 
    : isMale
      ? 'from-blue-500 to-purple-600'
      : 'from-pink-500 to-rose-600';

  return (
    <div className="flex flex-col items-center relative group">
      {/* Target handle for children connections */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Avatar Circle */}
      <div className="relative">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${ringGradient} p-[3px] flex items-center justify-center shadow-lg relative`}>
          {/* Double ring for current user */}
          {isCurrentUser ? (
            <div className="w-full h-full rounded-full bg-white p-[2px] flex items-center justify-center">
              <div className={`w-full h-full rounded-full bg-gradient-to-tr ${ringGradient} p-[2px] flex items-center justify-center`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {data.photo ? (
                    <img 
                      src={data.photo} 
                      alt={data.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-lg text-purple-600">
                      {data.fullName.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {data.photo ? (
                <img 
                  src={data.photo} 
                  alt={data.fullName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-extrabold text-lg text-purple-600">
                  {data.fullName.charAt(0)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Small floating heart badge for mother / spouse nodes */}
        {data.relation === 'Mother' && (
          <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-md">
            <Heart className="w-2.5 h-2.5 fill-white text-white" />
          </span>
        )}
      </div>

      {/* Label Card below Avatar */}
      <div 
        onClick={() => data.onNodeClick(data.id)}
        className="mt-2.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-center min-w-[120px] max-w-[160px] cursor-pointer hover:border-saas-primary hover:shadow-md transition-all duration-200 z-10"
      >
        <h4 className="font-extrabold text-slate-800 text-xs leading-tight truncate">{data.fullName}</h4>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{data.relation}</p>
      </div>

      {/* Red Pill badge for current user */}
      {isCurrentUser && (
        <span className="bg-rose-500 text-white font-extrabold text-[8px] px-2.5 py-0.5 rounded-full mt-2.5 uppercase tracking-wide shadow-sm whitespace-nowrap animate-pulse">
          THAT'S YOU :)
        </span>
      )}

      {/* Source handle for child links */}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Custom Spouse Connection Edge (Solid green horizontal line matching 2nd image style)
const SpouseEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {} }) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  return (
    <path
      id={id}
      style={{
        ...style,
        stroke: '#10b981', // Solid green lines as requested
        strokeWidth: 3,
      }}
      className="react-flow__edge-path"
      d={edgePath}
    />
  );
};

// Custom Parent-Child Edge (Solid green connecting lines matching 2nd image style)
const ParentChildEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {} }) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  return (
    <path
      id={id}
      style={{
        ...style,
        stroke: '#10b981', // Solid green lines as requested
        strokeWidth: 3,
      }}
      className="react-flow__edge-path"
      d={edgePath}
    />
  );
};

// Main Visualizer Canvas implementation
function FamilyTreeCanvas() {
  const { token, user } = useAuth();
  const reactFlowInstance = useReactFlow();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // App UI states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Node registration mapping
  const nodeTypes = useMemo(() => ({ memberNode: MemberNode }), []);
  const edgeTypes = useMemo(() => ({ spouseEdge: SpouseEdge, parentChildEdge: ParentChildEdge }), []);

  // Fetch all members
  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        setError('Failed to fetch family records for tree.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Construct Dagre hierarchical layout
  const layoutElements = useCallback((allNodes, allEdges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Separate spouses and siblings horizontally
    dagreGraph.setGraph({ 
      rankdir: direction, 
      nodesep: 80, 
      edgesep: 60, 
      ranksep: 100 
    });

    allNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    allEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    allNodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = Position.Top;
      node.sourcePosition = Position.Bottom;
      node.position = {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      };
    });

    return { layoutNodes: allNodes, layoutEdges: allEdges };
  }, []);

  // Process data to generate nodes and edges
  useEffect(() => {
    if (members.length === 0) return;

    // 1. Build all raw React Flow nodes
    const rawNodes = members.map(member => {
      const isCurrentUser = member._id === user?.memberProfile;

      return {
        id: member._id,
        type: 'memberNode',
        position: { x: 0, y: 0 },
        data: {
          id: member._id,
          fullName: member.fullName,
          gender: member.gender,
          relation: member.relation,
          photo: getProfileImage(member),
          isCurrentUser,
          onNodeClick: (id) => setSelectedProfileId(id),
        }
      };
    });

    // 2. Build all raw React Flow edges
    const rawEdges = [];
    const addedSpouseLinks = new Set();

    members.forEach(member => {
      // Spouse Connection
      if (member.spouse) {
        const spouseId = member.spouse._id || member.spouse;
        const linkKey = [member._id, spouseId].sort().join('-');
        
        if (!addedSpouseLinks.has(linkKey)) {
          addedSpouseLinks.add(linkKey);
          rawEdges.push({
            id: `spouse-${linkKey}`,
            source: member._id,
            target: spouseId,
            type: 'spouseEdge',
          });
        }
      }

      // Father to Child
      if (member.father) {
        const fatherId = member.father._id || member.father;
        rawEdges.push({
          id: `parent-child-${fatherId}-${member._id}`,
          source: fatherId,
          target: member._id,
          type: 'parentChildEdge',
        });
      }

      // Mother to Child
      if (member.mother) {
        const motherId = member.mother._id || member.mother;
        rawEdges.push({
          id: `parent-child-${motherId}-${member._id}`,
          source: motherId,
          target: member._id,
          type: 'parentChildEdge',
        });
      }
    });

    // 3. Align visible elements using dagre
    const { layoutNodes, layoutEdges } = layoutElements(rawNodes, rawEdges, 'TB');

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [members, layoutElements, user]);

  // Center canvas on logged-in user node
  const centerOnMe = useCallback(() => {
    if (!user?.memberProfile) return;
    const myNode = nodes.find(n => n.id === user.memberProfile);
    if (myNode) {
      reactFlowInstance.setCenter(myNode.position.x + NODE_WIDTH / 2, myNode.position.y + 40, {
        zoom: 1.1,
        duration: 800,
      });
    }
  }, [nodes, user, reactFlowInstance]);

  // Search input change handler
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      const results = members.filter(m => m.fullName.toLowerCase().includes(val.toLowerCase()));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Focus and zoom in on search result node
  const selectSearchResult = (member) => {
    setSearchQuery('');
    setSearchResults([]);
    
    setTimeout(() => {
      const targetNode = nodes.find(n => n.id === member._id);
      if (targetNode) {
        reactFlowInstance.setCenter(targetNode.position.x + NODE_WIDTH / 2, targetNode.position.y + 40, {
          zoom: 1.2,
          duration: 850,
        });
      }
    }, 100);
  };

  // Full Screen toggler
  const toggleFullscreen = () => {
    const elem = document.getElementById('tree-canvas-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error(err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      
      {/* Search and Title Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-saas-text-primary tracking-tight">Maddali Family Tree</h1>
          <p className="text-saas-text-secondary text-sm mt-0.5">Explore generation hierarchies, zoom/pan branches, and manage family profile details.</p>
        </div>

        {/* Member Search autocomplete */}
        <div className="relative w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-saas-text-secondary" />
            <input 
              type="text"
              placeholder="Search family member..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-saas-card border border-saas-border rounded-xl text-xs focus:outline-none focus:border-saas-primary text-saas-text-primary placeholder-saas-text-secondary/60 shadow-sm"
            />
          </div>
          
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-saas-card border border-saas-border rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-saas-border/40"
              >
                {searchResults.map(result => (
                  <div 
                    key={result._id}
                    onClick={() => selectSearchResult(result)}
                    className="p-3 hover:bg-saas-bg cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-saas-bg border border-saas-border overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-saas-text-secondary">
                      {getProfileImage(result) ? (
                        <img 
                          src={getProfileImage(result)} 
                          alt={result.fullName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{result.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-saas-text-primary">{result.fullName}</p>
                      <p className="text-[9px] font-bold text-saas-text-secondary uppercase mt-0.5">{result.relation}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Canvas Area - Soft light green background matching the image */}
      <div 
        id="tree-canvas-container"
        className={`relative bg-[#f0f9f4] border border-saas-border rounded-3xl flex-grow overflow-hidden shadow-saas-premium flex flex-col ${
          isFullscreen ? 'fixed inset-0 z-50 p-8 bg-[#f0f9f4]' : ''
        }`}
      >
        {/* Floating Custom Controls */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/95 border border-slate-200 p-1.5 rounded-xl shadow-md backdrop-blur-sm">
          <button 
            onClick={() => reactFlowInstance.zoomIn({ duration: 300 })}
            className="p-2.5 rounded-lg text-slate-500 hover:text-saas-primary hover:bg-slate-50 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => reactFlowInstance.zoomOut({ duration: 300 })}
            className="p-2.5 rounded-lg text-slate-500 hover:text-saas-primary hover:bg-slate-50 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          
          <div className="h-4 w-px bg-slate-200" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 rounded-lg text-slate-500 hover:text-saas-primary hover:bg-slate-50 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>

          {user?.memberProfile && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <button 
                onClick={centerOnMe}
                className="p-2 py-1 px-3 rounded-lg bg-saas-primary/10 hover:bg-saas-primary text-saas-primary hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                title="Focus on my node"
              >
                Center On Me
              </button>
            </>
          )}
        </div>

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-saas-primary border-t-transparent animate-spin" />
            <p className="text-xs font-semibold">Generating lineage tree...</p>
          </div>
        ) : error ? (
          <div className="flex-grow flex flex-col items-center justify-center text-rose-500 gap-2">
            <Info className="w-8 h-8 text-rose-400" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 gap-2">
            <Users className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold">No Family Members Cataloged</p>
            <p className="text-xs">Add a member to view the tree.</p>
          </div>
        ) : (
          <div className="flex-grow w-full h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
            </ReactFlow>

            {/* Custom footer watermark matching 2nd image */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
              <span className="text-[10px] font-bold text-slate-400/80">
                Copyright © 2026 <span className="font-extrabold text-slate-500">Maddali Family Tree</span> • Powered by Advanced Maddali System
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Profile sliding drawer */}
      {selectedProfileId && (
        <MemberProfile 
          memberId={selectedProfileId} 
          onClose={() => setSelectedProfileId(null)} 
          onEdit={(id) => {
            setSelectedProfileId(null);
            window.location.href = `/members?action=edit&id=${id}`;
          }}
        />
      )}

    </div>
  );
}

// Wrapper component to satisfy reactflow provider context
export default function FamilyTree() {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvas />
    </ReactFlowProvider>
  );
}
