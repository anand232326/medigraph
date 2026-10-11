
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import SearchBar from "./SearchBar.jsx";
import GraphView from "./GraphView.jsx";
import GraphSidebar from "./GraphSidebar.jsx";
import NodeDetails from "./NodeDetails.jsx";

import {
  getAvailableDiseaseIds,
  getComparisonGraph,
  getDiseaseGraph,
} from "../api/diseaseApi.js";

import {
  buildIndex,
  buildInitialGraph,
  idOf,
} from "../utils/graphUtils.js";

export default function GraphExplorer({ a, b }) {
  const navigate = useNavigate();

  const [dataset, setDataset] = useState(null);
  const [availableIds, setAvailableIds] = useState(() => new Set());
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  const [rootIds, setRootIds] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // Load the complete dataset whenever the selected disease changes.
  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      setStatus("loading");
      setError("");
      setDataset(null);
      setGraph({ nodes: [], links: [] });
      setSelectedId(null);
      setHiddenTypes(new Set());
      setRootIds([]);

      try {
        const [ds, ids] = await Promise.all([
          b ? getComparisonGraph(a, b) : getDiseaseGraph(a),
          getAvailableDiseaseIds(),
        ]);

        if (cancelled) return;

        if (!ds || !Array.isArray(ds.nodes) || !Array.isArray(ds.edges)) {
          throw new Error("The graph API returned an invalid dataset.");
        }

        const index = buildIndex(ds);
        const initial = buildInitialGraph(ds, index);

        // Development diagnostics: verify the full dataset is loaded.
        console.table({
          datasetNodes: ds.nodes.length,
          datasetEdges: ds.edges.length,
          initialGraphNodes: initial.graph.nodes.length,
          initialGraphEdges: initial.graph.links.length,
        });

        setDataset({ ds, index });
        setAvailableIds(ids);
        setGraph(initial.graph);
        setRootIds(initial.rootIds);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;

        setError(err.message || "Failed to load the graph.");
        setStatus("error");
      }
    }

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [a, b]);

  // Select a node and display its details.
  const handleNodeClick = useCallback((node) => {
    setSelectedId((currentId) =>
      currentId === node.id ? null : node.id
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Toggle an individual node category.
  const toggleType = useCallback((type) => {
    setHiddenTypes((previous) => {
      const next = new Set(previous);

      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      return next;
    });
  }, []);

  // Show or hide all node categories.
  const setAllTypes = useCallback((hide, types) => {
    setHiddenTypes(hide ? new Set(types) : new Set());
  }, []);

  // Derive the visible graph without modifying the complete graph.
  const visible = useMemo(() => {
    const nodes = graph.nodes.filter(
      (node) => !hiddenTypes.has(node.type)
    );

    const visibleNodeIds = new Set(
      nodes.map((node) => node.id)
    );

    const links = graph.links.filter((link) => {
      const sourceId = idOf(link.source);
      const targetId = idOf(link.target);

      return (
        visibleNodeIds.has(sourceId) &&
        visibleNodeIds.has(targetId)
      );
    });

    return { nodes, links };
  }, [graph, hiddenTypes]);

  // Resolve selected-node details from the complete dataset.
  const selectedNode = useMemo(() => {
    if (!dataset || !selectedId) return null;

    return dataset.index.nodeById.get(selectedId) ?? null;
  }, [dataset, selectedId]);

  // List every connection available in the source dataset.
  const connections = useMemo(() => {
    if (!dataset || !selectedId) return [];

    return (dataset.index.adj.get(selectedId) || [])
      .map((edge) => {
        const sourceId = idOf(edge.source);
        const targetId = idOf(edge.target);

        const otherId =
          sourceId === selectedId ? targetId : sourceId;

        return {
          edge,
          other: dataset.index.nodeById.get(otherId),
        };
      })
      .filter((connection) => Boolean(connection.other));
  }, [dataset, selectedId]);

  // Disease-specific labels for comparison mode.
  const sideNames = useMemo(() => {
    if (!dataset?.ds.isPair) return {};

    const nameOf = (id) =>
      dataset.index.nodeById.get(id)?.label || id;

    return {
      a: `${nameOf(dataset.ds.a)} only`,
      b: `${nameOf(dataset.ds.b)} only`,
      shared: "Both diseases",
    };
  }, [dataset]);

  // Loading state.
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm font-medium">
            Loading graph…
          </span>
        </div>
      </div>
    );
  }

  // Error state.
  if (status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-4 text-center text-slate-300">
        <div className="max-w-md rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <p className="text-sm font-medium">{error}</p>
        </div>

        <Link
          to="/"
          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top navigation */}
      <header className="z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-3 backdrop-blur-md">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <span>←</span>
          Home
        </Link>

        <div className="w-96">
          <SearchBar placeholder="Search another disease" />
        </div>
      </header>

      {/* Main graph workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        <GraphSidebar
          dataset={dataset.ds}
          nodes={dataset.ds.nodes}
          links={dataset.ds.edges}
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

        {/* Selected-node details */}
        {selectedNode && (
          <div className="z-20 flex h-full w-96 flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
            <NodeDetails
              node={selectedNode}
              connections={connections}
              sideNames={sideNames}
              isExpanded={true}
              onExpand={() => {}}
              onSelect={setSelectedId}
              onClose={clearSelection}
              availableIds={availableIds}
              currentRootIds={rootIds}
              onOpenDisease={(id) =>
                navigate(`/disease/${id}`)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
