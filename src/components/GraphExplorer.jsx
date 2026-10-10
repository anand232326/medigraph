import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar.jsx";
import GraphView from "./GraphView.jsx";
import GraphSidebar from "./GraphSidebar.jsx";
import NodeDetails from "./NodeDetails.jsx";
import { getAvailableDiseaseIds, getComparisonGraph, getDiseaseGraph } from "../api/diseaseApi.js";
import { buildIndex, buildInitialGraph, idOf, mergeGraph, neighborsOf } from "../utils/graphUtils.js";

// Shows one disease (a) or a comparison of two diseases (a and b).
// The parent page gives it a `key`, so all state resets when the disease changes.
export default function GraphExplorer({ a, b }) {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null); // { ds, index }
  const [availableIds, setAvailableIds] = useState(() => new Set());
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [expanded, setExpanded] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  const [rootIds, setRootIds] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  // 1. Load the data: the searched disease becomes the parent node, its direct links surround it
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ds, ids] = await Promise.all([
          b ? getComparisonGraph(a, b) : getDiseaseGraph(a),
          getAvailableDiseaseIds(),
        ]);
        if (cancelled) return;
        const index = buildIndex(ds);
        const initial = buildInitialGraph(ds, index);
        setDataset({ ds, index });
        setAvailableIds(ids);
        setGraph(initial.graph);
        setRootIds(initial.rootIds);
        setExpanded(new Set(initial.rootIds));
        setSelectedId(null); // nothing selected at first, so the details panel stays hidden
        setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Something went wrong");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [a, b]);

  // 2. Expand a node: add its connected nodes and edges to the graph
  const expandNode = useCallback(
    (nodeId) => {
      if (!dataset || expanded.has(nodeId)) return;
      const nb = neighborsOf(dataset.index, nodeId);
      setGraph((prev) =>
        mergeGraph(prev, nb.nodes, nb.edges, prev.nodes.find((n) => n.id === nodeId))
      );
      setExpanded((prev) => new Set(prev).add(nodeId));
    },
    [dataset, expanded]
  );

  const clearSelection = useCallback(() => setSelectedId(null), []);

  // Click a node: select it (opens the details panel) and show its connections.
  // Click the same node again: unselect it (closes the panel).
  const handleNodeClick = useCallback(
    (node) => {
      if (node.id === selectedId) {
        setSelectedId(null);
        return;
      }
      setSelectedId(node.id);
      expandNode(node.id);
    },
    [selectedId, expandNode]
  );

  // Clicking a connection in the details panel: make sure it is on the graph, then select it
  const selectFromList = useCallback(
    (nodeId) => {
      if (selectedId && !graph.nodes.some((n) => n.id === nodeId)) expandNode(selectedId);
      setSelectedId(nodeId);
    },
    [selectedId, graph.nodes, expandNode]
  );

  // 3. Hide / show node types
  const toggleType = (type) =>
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  const setAllTypes = (hide, types) => setHiddenTypes(hide ? new Set(types) : new Set());

  const visible = useMemo(() => {
    const nodes = graph.nodes.filter((n) => !hiddenTypes.has(n.type));
    const ids = new Set(nodes.map((n) => n.id));
    const links = graph.links.filter((l) => ids.has(idOf(l.source)) && ids.has(idOf(l.target)));
    return { nodes, links };
  }, [graph, hiddenTypes]);

  // Details of the selected node come from the full dataset, so every connection is listed
  const selectedNode = dataset && selectedId ? dataset.index.nodeById.get(selectedId) : null;

  const connections = useMemo(() => {
    if (!dataset || !selectedId) return [];
    return (dataset.index.adj.get(selectedId) || [])
      .map((edge) => {
        const otherId = edge.source === selectedId ? edge.target : edge.source;
        return { edge, other: dataset.index.nodeById.get(otherId) };
      })
      .filter((c) => c.other);
  }, [dataset, selectedId]);

  const sideNames = useMemo(() => {
    if (!dataset?.ds.isPair) return {};
    const name = (id) => dataset.index.nodeById.get(id)?.label || id;
    return { a: `${name(dataset.ds.a)} only`, b: `${name(dataset.ds.b)} only`, shared: "Both diseases" };
  }, [dataset]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading graph…</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-300 gap-4 p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl max-w-md">
          <p className="font-medium text-sm">{error}</p>
        </div>
        <Link to="/" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-20">
        <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
          <span>←</span> Home
        </Link>
        <div className="w-96">
          <SearchBar placeholder="Search another disease" />
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 relative overflow-hidden">
        <GraphSidebar
          dataset={dataset.ds}
          nodes={graph.nodes}
          links={graph.links}
          hiddenTypes={hiddenTypes}
          onToggleType={toggleType}
          onSetAll={setAllTypes}
          sideMode={dataset.ds.isPair}
        />

        <GraphView
          data={visible}
          selectedId={selectedId}
          onNodeClick={handleNodeClick}
          onBackgroundClick={clearSelection}
          sideMode={dataset.ds.isPair}
        />

        {selectedNode && (
          <div className="w-96 h-full border-l border-slate-800 bg-slate-900 z-20 shadow-2xl flex flex-col">
            <NodeDetails
              node={selectedNode}
              connections={connections}
              sideNames={sideNames}
              isExpanded={expanded.has(selectedId)}
              onExpand={() => expandNode(selectedId)}
              onSelect={selectFromList}
              onClose={clearSelection}
              availableIds={availableIds}
              currentRootIds={rootIds}
              onOpenDisease={(id) => navigate(`/disease