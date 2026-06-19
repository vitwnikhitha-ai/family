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
import { calculateRelation } from '../../utils/relationCalculator';

// Nodes and edges dimensions for layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 160;

// Custom Node Component matching the 2nd image exactly
const MemberNode = ({ data }) => {
  const isCurrentUser = data.isCurrentUser;
  
  return (
    <div className="flex flex-col items-center relative group">
      {/* Target handle for children connections */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      {/* Avatar Circle */}
      <div className="relative">
        <div className={`w-[72px] h-[72px] rounded-full bg-white/5 border border-white/20 backdrop-blur-xl shadow-[inset_0_0_15px_rgba(255,255,255,0.1),0_0_15px_rgba(255,255,255,0.05)] flex items-center justify-center relative z-10 ${isCurrentUser ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent' : ''}`}>
          <div className="w-[64px] h-[64px] rounded-full overflow-hidden border border-white/10 relative">
            {data.photo ? (
              <img 
                src={data.photo} 
                alt={data.fullName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-xl text-black/50 flex items-center justify-center h-full w-full">
                {data.fullName.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Small floating heart badge for mother / spouse nodes */}
        {data.relation === 'Mother' && (
          <span className="absolute -top-1 -right-1 bg-white/20 backdrop-blur-md text-black rounded-full w-5 h-5 flex items-center justify-center border border-white/30 shadow-lg z-20">
            <Heart className="w-2.5 h-2.5 fill-white text-black" />
          </span>
        )}
      </div>

      {/* Label Card below Avatar */}
      <div 
        onClick={() => data.onNodeClick(data.id)}
        className="mt-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-center min-w-[130px] max-w-[180px] cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all duration-300 z-10"
      >
        <h4 className="font-bold text-black text-[13px] leading-tight truncate">{data.fullName}</h4>
        <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-1">{data.relation}</p>
      </div>

      {/* Red Pill badge for current user */}
      {isCurrentUser && (
        <span className="bg-white/20 backdrop-blur-md text-black font-bold text-[8px] px-3 py-1 rounded-full mt-3 border border-white/20 uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.1)] whitespace-nowrap">
          THAT'S YOU
        </span>
      )}

      {/* Source handle for child links */}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Custom Spouse Connection Edge (Cyan Glass Glow)
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
        stroke: 'rgba(34, 211, 238, 0.4)',
        strokeWidth: 2.5,
        filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))'
      }}
      className="react-flow__edge-path transition-all duration-300"
      d={edgePath}
    />
  );
};

// Custom Parent-Child Edge (Cyan Glass Glow)
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
        stroke: 'rgba(34, 211, 238, 0.4)',
        strokeWidth: 2.5,
        filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))'
      }}
      className="react-flow__edge-path transition-all duration-300"
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
          relation: calculateRelation(member, members, user?.memberProfile),
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
          <h1 className="text-3xl font-black text-black tracking-tight">Maddali Family Tree</h1>
          <p className="text-black/60 text-sm mt-0.5">Explore generation hierarchies, zoom/pan branches, and manage family profile details.</p>
        </div>

        {/* Member Search autocomplete */}
        <div className="relative w-full md:w-80 z-50">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-4 h-4 text-black/50" />
            <input 
              type="text"
              placeholder="Search family member..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[13px] focus:outline-none focus:border-white/30 text-black placeholder-white/40 shadow-sm backdrop-blur-xl transition-all"
            />
          </div>
          
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
              >
                {searchResults.map(result => (
                  <div 
                    key={result._id}
                    onClick={() => selectSearchResult(result)}
                    className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-black/50">
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
                      <p className="font-bold text-[13px] text-black">{result.fullName}</p>
                      <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-0.5">{calculateRelation(result, members, user?.memberProfile)}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Canvas Area - Liquid Glass */}
      <div 
        id="tree-canvas-container"
        className={`relative bg-white/[0.02] border border-white/10 rounded-[32px] flex-grow overflow-hidden shadow-2xl flex flex-col backdrop-blur-[40px] ${
          isFullscreen ? 'fixed inset-0 z-50 p-8' : ''
        }`}
      >
        {/* Floating Custom Controls */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-1.5 bg-white/5 border border-white/10 p-1.5 rounded-full shadow-lg backdrop-blur-xl">
          <button 
            onClick={() => reactFlowInstance.zoomIn({ duration: 300 })}
            className="p-2.5 rounded-full text-black/60 hover:text-black hover:bg-white/10 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => reactFlowInstance.zoomOut({ duration: 300 })}
            className="p-2.5 rounded-full text-black/60 hover:text-black hover:bg-white/10 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className="h-5 w-px bg-white/10 mx-1" />
          
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full text-black/60 hover:text-black hover:bg-white/10 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {user?.memberProfile && (
            <>
              <div className="h-5 w-px bg-white/10 mx-1" />
              <button 
                onClick={centerOnMe}
                className="py-2 px-4 rounded-full bg-white/10 hover:bg-white/20 text-black font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer border border-white/5 shadow-sm"
                title="Focus on my node"
              >
                Center On Me
              </button>
            </>
          )}
        </div>

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center text-black/60 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <p className="text-[13px] font-semibold tracking-wide">Generating holographic tree...</p>
          </div>
        ) : error ? (
          <div className="flex-grow flex flex-col items-center justify-center text-rose-400 gap-2">
            <Info className="w-8 h-8 text-rose-400/80" />
            <p className="text-[13px] font-semibold">{error}</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-black/40 gap-3">
            <Users className="w-10 h-10 text-black/20" />
            <p className="text-[13px] font-semibold tracking-wide">No Family Members Cataloged</p>
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
