import { useMemo } from "react";
import {
  DOWN_COLOR, EDGE_COLORS, EDGE_HELP, NODE_COLORS, SIDE_COLORS, UP_COLOR,
} from "../utils/graphConfig.js";

const TOTAL_LABELS = {
  genes: "Genes",
  high_genes: "High-confidence genes",
  variants: "Variants",
  papers: "Publications",
  pathways: "Pathways",
  drugs: "Drugs",
  biomarkers: "Biomarkers",
};

export default function GraphSidebar({
  dataset, nodes, links, hiddenTypes, onToggleType, onSetAll, sideMode,
}) {
  const typeCounts = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.type] = (map[n.type] || 0) + 1;
    });
    return map;
  }, [nodes]);

  const relCounts = useMemo(() => {
    const map = {};
    links.forEach((l) => {
      map[l.type] = (map[l.type] || 0) + 1;
    });
    return map;
  }, [links]);

  const sideCounts = useMemo(() => {
    const map = { a: 0, b: 0, shared: 0 };
    nodes.forEach((n) => {
      if (n.type === "Gene" && n.raw?.side) map[n.raw.side] += 1;
    });
    return map;
  }, [nodes]);

  const types = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
  const rels = Object.keys(relCounts).sort((a, b) => relCounts[b] - relCounts[a]);
  const totals = Object.entries(dataset.totals || {}).filter(([k]) => TOTAL_LABELS[k]);
  const diseaseLabel = (id) => dataset.nodes.find((n) => n.id === id)?.label || id;

  return (
    <aside className="sidebar">
      <h2>{dataset.name}</h2>
      {dataset.subtitle && <p className="muted">{dataset.subtitle}</p>}

      <div className="stats">
        <div><span>Nodes shown</span><strong>{nodes.length}</strong></div>
        <div><span>Edges shown</span><strong>{links.length}</strong></div>
        <div><span>Node types</span><strong>{types.length}</strong></div>
        <div><span>Relationships</span><strong>{rels.length}</strong></div>
      </div>

      {dataset.isPair && dataset.stats && (
        <>
          <h3>Comparison</h3>
          <dl className="kv">
            {dataset.stats.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </>
      )}

      {totals.length > 0 && (
        <>
          <h3>In the database</h3>
          <dl className="kv">
            {totals.map(([key, value]) => (
              <div key={key}><dt>{TOTAL_LABELS[key]}</dt><dd>{Number(value).toLocaleString()}</dd></div>
            ))}
          </dl>
          <p className="muted small">The graph shows the strongest connections only.</p>
        </>
      )}

      {sideMode && (
        <>
          <h3>Gene colours</h3>
          <ul className="legend">
            <li><span className="dot" style={{ background: SIDE_COLORS.a }} /><span className="legend-name">{diseaseLabel(dataset.a)} only</span><span className="legend-count">{sideCounts.a}</span></li>
            <li><span className="dot" style={{ background: SIDE_COLORS.b }} /><span className="legend-name">{diseaseLabel(dataset.b)} only</span><span className="legend-count">{sideCounts.b}</span></li>
            <li><span className="dot" style={{ background: SIDE_COLORS.shared }} /><span className="legend-name">Shared by both</span><span className="legend-count">{sideCounts.shared}</span></li>
          </ul>
        </>
      )}

      {dataset.regulated && (
        <>
          <h3>Gene expression</h3>
          <ul className="legend">
            <li><span className="ring" style={{ borderColor: UP_COLOR }} /><span className="legend-name">Up-regulated (red ring)</span><span className="legend-count">{dataset.regulated.up}</span></li>
            <li><span className="ring" style={{ borderColor: DOWN_COLOR }} /><span className="legend-name">Down-regulated (blue ring)</span><span className="legend-count">{dataset.regulated.down}</span></li>
          </ul>
        </>
      )}

      <div className="sidebar-head">
        <h3>Show on the graph</h3>
        <div className="mini-buttons">
          <button type="button" onClick={() => onSetAll(false, types)}>Show all</button>
          <button type="button" onClick={() => onSetAll(true, types)}>Hide all</button>
        </div>
      </div>
      <ul className="legend">
        {types.map((t) => (
          <li key={t}>
            <label>
              <input type="checkbox" checked={!hiddenTypes.has(t)} onChange={() => onToggleType(t)} />
              <span className="dot" style={{ background: NODE_COLORS[t] || "#64748b" }} />
              <span className="legend-name">{t}</span>
              <span className="legend-count">{typeCounts[t]}</span>
            </label>
          </li>
        ))}
      </ul>

      <h3>Relationships</h3>
      <ul className="legend">
        {rels.map((r) => (
          <li key={r} title={EDGE_HELP[r]}>
            <span className="line" style={{ background: EDGE_COLORS[r] || "#cbd5e1" }} />
            <span className="legend-name">
              {r.replace(/_/g, " ").toLowerCase()}
              {EDGE_HELP[r] && <small>{EDGE_HELP[r]}</small>}
            </span>
            <span className="legend-count">{relCounts[r]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
