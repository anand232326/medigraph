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
        ctx.strokeStyle = "#0f172a";
        ctx.stroke();
      }

      // labels: always for diseases, otherwise when zoomed in or selected
      if (node.type === "Disease" || node.id === selectedId || scale >= 1.3) {
        const bold = node.isRoot || node.type === "Disease";
        const fontSize = (node.isRoot ? 15 : 11) / scale;
        ctx.font = `${bold ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#1e293b";
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
    <div className="graph-wrap" ref={wrapRef}>
      <ForceGraph2D
        ref={fgRef}
        width={size.width}
        height={size.height}
        graphData={data}
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintPointerArea}
        nodeLabel={(n) => `${n.label} (${n.type})`}
        linkColor={(l) => EDGE_COLORS[l.type] || "#cbd5e1"}
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

      <div className="graph-controls">
        <button type="button" onClick={() => zoomBy(1.4)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out">−</button>
        <button type="button" onClick={() => fgRef.current?.zoomToFit(500, 60)}>Fit</button>
      </div>
      <p className="graph-hint">
        Click a node for its references and to reveal its connections. Zoom in to see all labels.
      </p>
    </div>
  );
}
