
import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import {
  DOWN_COLOR,
  EDGE_COLORS,
  NODE_COLORS,
  SIDE_COLORS,
  UP_COLOR,
  nodeRadius,
  prettify,
} from "../utils/graphConfig.js";

const DEFAULT_NODE_COLOR = "#64748b";
const BACKGROUND_COLOR = "#020617";
const SELECTED_COLOR = "#38bdf8";

export default function GraphView({
  data,
  selectedId,
  onNodeClick,
  onBackgroundClick,
  sideMode = false,
  graphKey,
}) {
  const fgRef = useRef(null);
  const wrapRef = useRef(null);
  const fitted = useRef(false);

  const [size, setSize] = useState({
    width: 800,
    height: 680,
  });

  // Track container dimensions so the canvas responds to resizing.
  useEffect(() => {
    const element = wrapRef.current;

    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      setSize({
        width: Math.max(1, Math.floor(width)),
        height: Math.max(1, Math.floor(height)),
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Reset the automatic-fit flag whenever a different dataset is selected.
  useEffect(() => {
    fitted.current = false;
  }, [graphKey]);

  // Configure forces for a more spacious graph layout.
  useEffect(() => {
    const graph = fgRef.current;

    if (!graph) return;

    graph.d3Force("charge")?.strength(-180);
    graph.d3Force("link")?.distance(70);
    graph.d3Force("center")?.strength(0.08);
  }, [graphKey]);

  // Determine the fill color for each node.
  const colorOf = useCallback(
    (node) => {
      if (
        sideMode &&
        node.type === "Gene" &&
        node.raw?.side &&
        SIDE_COLORS[node.raw.side]
      ) {
        return SIDE_COLORS[node.raw.side];
      }

      return NODE_COLORS[node.type] || DEFAULT_NODE_COLOR;
    },
    [sideMode]
  );

  // Draw nodes, labels, expression rings, and the selection highlight.
  const paintNode = useCallback(
    (node, ctx, scale) => {
      const radius = nodeRadius(node);
      const label = String(node.label || node.id || "Unknown");
      const safeScale = Math.max(scale, 0.01);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colorOf(node);
      ctx.fill();

      // Indicate up- or down-regulated genes with a colored ring.
      const direction = node.raw?.direction;

      if (direction === "UP" || direction === "DOWN") {
        ctx.lineWidth = 2 / safeScale;
        ctx.strokeStyle =
          direction === "UP" ? UP_COLOR : DOWN_COLOR;
        ctx.stroke();
      }

      // Highlight the selected node.
      if (node.id === selectedId) {
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          radius + 3 / safeScale,
          0,
          Math.PI * 2
        );
        ctx.lineWidth = 2 / safeScale;
        ctx.strokeStyle = SELECTED_COLOR;
        ctx.stroke();
      }

      // Show labels for diseases, selected nodes, and zoomed-in views.
      const showLabel =
        node.type === "Disease" ||
        node.id === selectedId ||
        scale >= 1.3;

      if (!showLabel) return;

      const isImportant = node.isRoot || node.type === "Disease";
      const fontSize = (isImportant ? 15 : 11) / safeScale;
      const displayLabel =
        label.length > 26 ? `${label.slice(0, 25)}…` : label;

      ctx.font = `${isImportant ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#f8fafc";

      ctx.fillText(
        displayLabel,
        node.x,
        node.y + radius + 3 / safeScale
      );
    },
    [selectedId, colorOf]
  );

  // Define the clickable area around each node.
  const paintPointerArea = useCallback((node, color, ctx) => {
    ctx.beginPath();
    ctx.arc(
      node.x,
      node.y,
      nodeRadius(node) + 4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  // Zoom in or out relative to the current zoom level.
  const zoomBy = useCallback((factor) => {
    const graph = fgRef.current;

    if (!graph) return;

    graph.zoom(graph.zoom() * factor, 250);
  }, []);

  // Fit the current graph inside the visible canvas.
  const fitGraph = useCallback(() => {
    const graph = fgRef.current;

    if (!graph || !data.nodes?.length) return;

    graph.zoomToFit(500, 60);
  }, [data]);

  // Automatically fit once after the graph simulation settles.
  const handleEngineStop = useCallback(() => {
    if (fitted.current || !data.nodes?.length) return;

    fitted.current = true;
    fgRef.current?.zoomToFit(500, 60);
  }, [data]);

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 w-full h-full min-w-0 min-h-0 bg-slate-950 overflow-hidden"
    >
      <ForceGraph2D
        key={graphKey ?? "default-graph"}
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={data}
        backgroundColor={BACKGROUND_COLOR}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintPointerArea}
        nodeLabel={(node) =>
          `${node.label || node.id || "Unknown"} (${node.type || "Unknown type"})`
        }
        linkColor={(link) =>
          EDGE_COLORS[link.type] || "#334155"
        }
        linkWidth={1.2}
        linkLabel={(link) => prettify(link.type || "relationship")}
        onNodeClick={onNodeClick}
        onBackgroundClick={onBackgroundClick}
        cooldownTicks={150}
        onEngineStop={handleEngineStop}
      />

      {/* Zoom and fit controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => zoomBy(1.4)}
          aria-label="Zoom in"
          title="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded text-base font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => zoomBy(1 / 1.4)}
          aria-label="Zoom out"
          title="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded text-base font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
        >
          −
        </button>

        <button
          type="button"
          onClick={fitGraph}
          title="Fit the graph to the screen"
          className="flex items-center justify-center rounded px-2 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
        >
          Fit
        </button>
      </div>

      {/* Interaction hint */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-10 max-w-xs rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-400 shadow-xl backdrop-blur-md">
        Click a node to inspect its details. Click the background to clear
        selection. Zoom in to reveal more labels.
      </div>
    </div>
  );
}
