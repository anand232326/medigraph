import { useCallback, useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import {
  DOWN_COLOR, EDGE_COLORS, NODE_COLORS, SIDE_COLORS, UP_COLOR, nodeRadius, prettify,
} from "../utils/graphConfig.js";

export default function GraphView({ data, selectedId, onNodeClick, sideMode }) {
  const fgRef = useRef(null);
  const wrapRef = useRef(null);
  const fitted = useRef(false);
  const [size, setSize] = useState({ width: 800, height: 680 });

  // Keep the canvas the same size as its container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Spread nodes out a little
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force("charge")?.strength(-110);
    fg.d3Force("link")?.distance(55);
  }, []);

  const colorOf = useCallback(
    (node) => {
      if (sideMode && node.type === "Gene" && node.raw?.side) return SIDE_COLORS[node.raw.side];
      return NODE_COLORS[node.type] || "#64748b";
    },
    [sideMode]
  );

  const paintNode = useCallback(
    (node, ctx, scale) => {
      const r = nodeRadius(node);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = colorOf(node);
      ctx.fill();

      // red ring = up-regulated gene, blue ring = down-regulated gene
      const dir = node.raw?.direction;
      if (dir === "UP" || dir === "DOWN") {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = dir === "UP" ? UP_COLOR : DOWN_COLOR;
        ctx.stroke();
      }

      if (node.id === selectedId) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 3 / scale, 0, 2 * Math.PI);
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = "#38bdf8"; // Updated to a nice sky blue highlight matching tailwind theme
        ctx.stroke();
      }

      // labels: always for diseases, otherwise when zoomed in or selected
      if (node.type === "Disease" || node.id === selectedId || scale >= 1.3) {
        const bold = node.isRoot || node.type === "Disease";
        const fontSize = (node.isRoot ? 15 : 11) / scale;
        ctx.font = `${bold ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#f8fafc"; // Light text for dark canvas background
        const label = node.label.length > 26 ? `${node.label.slice(0, 25)}…` : node.label;
        ctx.fillText(label, node.x, node.y + r + 3 / scale);
      }
    },
    [selectedId, colorOf]
  );

  const paintPointerArea = useCallback((node, color, ctx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius(node) + 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const zoomBy = (factor) => {
    const fg = fgRef.current;
    if (fg) fg.zoom(fg.zoom() * factor, 300);
  };

  return (
    <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden flex flex-col" ref={wrapRef}>
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={data}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintPointerArea}
        nodeLabel={(n) => `${n.label} (${n.type})`}
        linkColor={(l) => EDGE_COLORS[l.type] || "#334155"}
        linkWidth={1.2}
        linkLabel={(l) => prettify(l.type)}
        onNodeClick={onNodeClick}
        cooldownTicks={150}
        onEngineStop={() => {
          if (!fitted.current) {
            fitted.current = true;
            fgRef.current?.zoomToFit(500, 60);
          }
        }}
      />

      {/* Floating Zoom & Fit Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl z-10">
        <button 
          type="button" 
          onClick={() => zoomBy(1.4)} 
          aria-label="Zoom in"
          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white rounded text-base font-medium transition-colors"
        >
          +
        </button>
        <button 
          type="button" 
          onClick={() => zoomBy(1 / 1.4)} 
          aria-label="Zoom out"
          className="w-8 h-8 flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white rounded text-base font-medium transition-colors"
        >
          −
        </button>
        <button 
          type="button" 
          onClick={() => fgRef.current?.zoomToFit(500, 60)}
          className="px-2 py-1 flex items-center justify-center text-slate-200 hover:bg-slate-800 hover:text-white rounded text-xs font-medium transition-colors"
        >
          Fit
        </button>
      </div>

      {/* Floating Hint Overlay */}
      <div className="absolute bottom-6 left-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-400 text-xs px-3 py-2 rounded-lg shadow-xl pointer-events-none z-10 max-w-xs">
        Click a node for its references and to reveal its connections. Zoom in to see all labels.
      </div>
    </div>
  );
}