import React, { useState, useMemo } from "react";
import { Network, Info, User, Code, FileText, AlertTriangle, ShieldCheck, Database, Layers } from "lucide-react";
import { KnowledgeGraphNode, KnowledgeGraphEdge } from "../types";

interface KnowledgeGraphViewProps {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId: string | null;
}

export default function KnowledgeGraphView({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId,
}: KnowledgeGraphViewProps) {
  const [filterType, setFilterType] = useState<string>("all");

  // Assign deterministic, elegant coordinate layout to keep nodes pristine
  const positionedNodes = useMemo(() => {
    return nodes.map((node, index) => {
      // Calculate a nice circular/semi-grid path layout so the nodes never clump or overlap
      const total = nodes.length;
      const angle = (index / total) * 2 * Math.PI;
      
      // Centralized hub coordinates
      const cx = 350;
      const cy = 200;
      
      // Specialized radius per node type to create structural orbit layers
      let r = 140;
      if (node.type === "author") r = 80;       // Inner people orbit
      if (node.type === "tech_stack") r = 180;   // Outer stack orbit
      if (node.type === "service") r = 110;      // Mid-tier system orbit
      
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      return {
        ...node,
        x: Math.round(x),
        y: Math.round(y),
      };
    });
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (filterType === "all") return positionedNodes;
    return positionedNodes.filter((n) => n.type === filterType);
  }, [positionedNodes, filterType]);

  const activeNode = useMemo(() => {
    return positionedNodes.find((n) => n.id === selectedNodeId) || null;
  }, [positionedNodes, selectedNodeId]);

  // Find edges connecting active/filtered nodes
  const visibleEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  }, [edges, filteredNodes]);

  // Node UI theme pairing
  const getNodeStyles = (type: string, isSelected: boolean) => {
    const base = "cursor-pointer transition-all duration-300";
    let fill = "fill-slate-900 stroke-slate-700";
    let textFill = "fill-slate-400";
    let iconColor = "text-slate-400";

    switch (type) {
      case "author":
        fill = isSelected ? "fill-blue-500/20 stroke-blue-400 stroke-2" : "fill-slate-900 stroke-blue-500/50";
        textFill = "fill-blue-200";
        iconColor = "text-blue-400";
        break;
      case "commit":
        fill = isSelected ? "fill-purple-500/20 stroke-purple-400 stroke-2" : "fill-slate-900 stroke-purple-500/50";
        textFill = "fill-purple-200";
        iconColor = "text-purple-400";
        break;
      case "pr":
        fill = isSelected ? "fill-indigo-500/20 stroke-indigo-400 stroke-2" : "fill-slate-900 stroke-indigo-500/50";
        textFill = "fill-indigo-200";
        iconColor = "text-indigo-400";
        break;
      case "issue":
        fill = isSelected ? "fill-amber-500/20 stroke-amber-400 stroke-2" : "fill-slate-900 stroke-amber-500/50";
        textFill = "fill-amber-200";
        iconColor = "text-amber-400";
        break;
      case "ci_run":
        fill = isSelected ? "fill-red-500/20 stroke-red-400 stroke-2" : "fill-slate-900 stroke-red-500/50";
        textFill = "fill-red-200";
        iconColor = "text-red-400";
        break;
      case "tech_stack":
        fill = isSelected ? "fill-emerald-500/20 stroke-emerald-400 stroke-2" : "fill-slate-900 stroke-emerald-500/50";
        textFill = "fill-emerald-200";
        iconColor = "text-emerald-400";
        break;
      case "service":
        fill = isSelected ? "fill-cyan-500/20 stroke-cyan-400 stroke-2" : "fill-slate-900 stroke-cyan-500/50";
        textFill = "fill-cyan-200";
        iconColor = "text-cyan-400";
        break;
    }

    return { base, fill, textFill, iconColor };
  };

  const getSidebarIcon = (type: string) => {
    switch (type) {
      case "author":
        return <User size={14} className="text-blue-400" />;
      case "commit":
        return <Code size={14} className="text-purple-400" />;
      case "pr":
        return <FileText size={14} className="text-indigo-400" />;
      case "issue":
        return <AlertTriangle size={14} className="text-amber-400" />;
      case "ci_run":
        return <Layers size={14} className="text-red-400" />;
      case "tech_stack":
        return <Database size={14} className="text-emerald-400" />;
      default:
        return <Network size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" id="knowledge-graph-section">
      {/* Sidebar Controls and Inspect Panel */}
      <div className="flex flex-col gap-4">
        {/* Type Filtering */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono font-bold text-slate-500 block mb-3 uppercase tracking-wider">
            Graph Node Filters
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2 py-1.5 rounded border text-left font-mono ${
                filterType === "all"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              All Nodes ({nodes.length})
            </button>
            <button
              onClick={() => setFilterType("author")}
              className={`px-2 py-1.5 rounded border text-left font-mono ${
                filterType === "author"
                  ? "bg-blue-600/10 border-blue-500/40 text-blue-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              Authors
            </button>
            <button
              onClick={() => setFilterType("commit")}
              className={`px-2 py-1.5 rounded border text-left font-mono ${
                filterType === "commit"
                  ? "bg-purple-600/10 border-purple-500/40 text-purple-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              Commits
            </button>
            <button
              onClick={() => setFilterType("pr")}
              className={`px-2 py-1.5 rounded border text-left font-mono ${
                filterType === "pr"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              Pull Requests
            </button>
            <button
              onClick={() => setFilterType("tech_stack")}
              className={`px-2 py-1.5 rounded border text-left font-mono ${
                filterType === "tech_stack"
                  ? "bg-emerald-600/10 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              Stack Services
            </button>
            <button
              onClick={() => setFilterType("ci_run")}
              className={`px-2 py-1.5 rounded border text-left font-mono ${
                filterType === "ci_run"
                  ? "bg-red-600/10 border-red-500/40 text-red-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              CI Builds
            </button>
          </div>
        </div>

        {/* Selected Node Properties */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex-1 min-h-[180px]">
          <span className="text-[10px] font-mono font-bold text-slate-500 block mb-2 uppercase tracking-wider">
            Selected Entity Inspector
          </span>
          {activeNode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                {getSidebarIcon(activeNode.type)}
                <span className="text-xs font-mono font-bold text-slate-200">
                  {activeNode.label}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID:</span>
                  <span className="font-mono text-[11px] text-slate-300">{activeNode.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-mono text-[11px] text-slate-300 capitalize">{activeNode.type.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Workspace Domain:</span>
                  <span className="font-mono text-[11px] text-indigo-400">{activeNode.group.toUpperCase()}</span>
                </div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed font-mono">
                {activeNode.type === "author" && `Represents active contributor '${activeNode.id}' who committed changes or completed PR reviews.`}
                {activeNode.type === "commit" && `Code modifications identified in commit logs. Correlated to files and authorship.`}
                {activeNode.type === "pr" && `Vetted pull request merge log outlining code audits and reviews.`}
                {activeNode.type === "issue" && `Problem statement or architectural goal documenting engineering intents.`}
                {activeNode.type === "ci_run" && `Automated pipeline validation output highlighting memory stats or test warnings.`}
                {activeNode.type === "tech_stack" && `Third-party container dependencies used in backend clusters.`}
                {activeNode.type === "service" && `Key code controller file hosting the logic related to this incident.`}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[120px] text-slate-600 text-center text-xs gap-1">
              <Info size={16} />
              <span>No entity selected</span>
              <p className="text-[10px] max-w-[180px] text-slate-500">
                Click on any node in the relationship graph to inspect its metadata.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Graph SVG Stage */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col min-h-[380px] relative overflow-hidden">
        <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Network size={14} className="text-indigo-400" />
            <span className="text-xs font-mono font-bold text-slate-300">Semantic Event Relations Graph</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Hover to view relationships | Click to inspect properties
          </span>
        </div>

        {/* SVG Viewport */}
        <div className="flex-1 min-h-[350px] bg-slate-950 rounded-lg relative overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full min-h-[340px]" viewBox="100 50 500 300">
            {/* Markers for directed arrows */}
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
            </defs>

            {/* Relations/Edges */}
            <g>
              {visibleEdges.map((edge) => {
                const sourceNode = positionedNodes.find((n) => n.id === edge.source);
                const targetNode = positionedNodes.find((n) => n.id === edge.target);

                if (!sourceNode || !targetNode) return null;

                const sx = sourceNode.x || 0;
                const sy = sourceNode.y || 0;
                const tx = targetNode.x || 0;
                const ty = targetNode.y || 0;

                const isConnectedToSelected =
                  selectedNodeId === edge.source || selectedNodeId === edge.target;

                return (
                  <g key={edge.id} className="group">
                    {/* Line connection */}
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke={isConnectedToSelected ? "#6366f1" : "#334155"}
                      strokeWidth={isConnectedToSelected ? 2 : 1}
                      strokeDasharray={isConnectedToSelected ? "none" : "3,3"}
                      markerEnd={isConnectedToSelected ? "url(#arrow-active)" : "url(#arrow)"}
                      className="transition-colors duration-300"
                    />
                    {/* Relationship label */}
                    <text
                      x={(sx + tx) / 2}
                      y={(sy + ty) / 2 - 4}
                      className="fill-slate-500 text-[8px] font-mono font-medium text-center select-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 pointer-events-none"
                      textAnchor="middle"
                    >
                      {edge.relation}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Entities/Nodes */}
            <g>
              {filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const { fill, textFill } = getNodeStyles(node.type, isSelected);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x || 0}, ${node.y || 0})`}
                    onClick={() => onSelectNode && onSelectNode(node.id)}
                    className="cursor-pointer group"
                  >
                    {/* Outer glow aura on selected */}
                    {isSelected && (
                      <circle
                        r="18"
                        className="fill-indigo-500/10 stroke-none animate-ping"
                      />
                    )}
                    {/* Main Node bubble */}
                    <circle
                      r="12"
                      className={`${fill} transition-all duration-300 group-hover:stroke-slate-300`}
                    />
                    {/* Mini Type Identifier Badge */}
                    <text
                      dy="3.5"
                      textAnchor="middle"
                      className="fill-slate-400 text-[8px] font-mono font-bold select-none pointer-events-none uppercase"
                    >
                      {node.type.substring(0, 2)}
                    </text>
                    {/* Title label underneath */}
                    <text
                      y="23"
                      textAnchor="middle"
                      className={`${textFill} text-[9px] font-mono select-none font-semibold group-hover:fill-white transition-colors duration-300 pointer-events-none`}
                    >
                      {node.label.split(" (")[0]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
