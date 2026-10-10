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
    <aside className="w-80 bg-slate-900 text-slate-100 p-4 overflow-y-auto h-screen flex flex-col gap-4 border-r border-slate-800 text-sm">
      <div>
        <h2 className="text-lg font-bold text-white">{dataset.name}</h2>
        {dataset.subtitle && <p className="text-slate-400 text-xs mt-1">{dataset.subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-col"><span className="text-slate-400 text-xs">Nodes shown</span><strong className="text-base text-white">{nodes.length}</strong></div>
        <div className="flex flex-col"><span className="text-slate-400 text-xs">Edges shown</span><strong className="text-base text-white">{links.length}</strong></div>
        <div className="flex flex-col"><span className="text-slate-400 text-xs">Node types</span><strong className="text-base text-white">{types.length}</strong></div>
        <div className="flex flex-col"><span className="text-slate-400 text-xs">Relationships</span><strong className="text-base text-white">{rels.length}</strong></div>
      </div>

      {dataset.isPair && dataset.stats && (
        <div className="space-y-1">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Comparison</h3>
          <dl className="bg-slate-800/40 rounded-lg p-2 space-y-1 border border-slate-800">
            {dataset.stats.map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b border-slate-800/60 last:border-none">
                <dt className="text-slate-400">{label}</dt>
                <dd className="font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {totals.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">In the database</h3>
          <dl className="bg-slate-800/40 rounded-lg p-2 space-y-1 border border-slate-800">
            {totals.map(([key, value]) => (
              <div key={key} className="flex justify-between py-1 border-b border-slate-800/60 last:border-none">
                <dt className="text-slate-400">{TOTAL_LABELS[key]}</dt>
                <dd className="font-medium text-slate-200">{Number(value).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <p className="text-slate-400 text-xs italic">The graph shows the strongest connections only.</p>
        </div>
      )}

      {sideMode && (
        <div className="space-y-2">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Gene colours</h3>
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: SIDE_COLORS.a }} />
                <span className="text-slate-300">{diseaseLabel(dataset.a)} only</span>
              </div>
              <span className="text-slate-400 text-xs">{sideCounts.a}</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: SIDE_COLORS.b }} />
                <span className="text-slate-300">{diseaseLabel(dataset.b)} only</span>
              </div>
              <span className="text-slate-400 text-xs">{sideCounts.b}</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: SIDE_COLORS.shared }} />
                <span className="text-slate-300">Shared by both</span>
              </div>
              <span className="text-slate-400 text-xs">{sideCounts.shared}</span>
            </li>
          </ul>
        </div>
      )}

      {dataset.regulated && (
        <div className="space-y-2">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Gene expression</h3>
          <ul className="space-y-1.5">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 inline-block bg-transparent" style={{ borderColor: UP_COLOR }} />
                <span className="text-slate-300">Up-regulated (red ring)</span>
              </div>
              <span className="text-slate-400 text-xs">{dataset.regulated.up}</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 inline-block bg-transparent" style={{ borderColor: DOWN_COLOR }} />
                <span className="text-slate-300">Down-regulated (blue ring)</span>
              </div>
              <span className="text-slate-400 text-xs">{dataset.regulated.down}</span>
            </li>
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Show on the graph</h3>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => onSetAll(false, types)} className="text-blue-400 hover:underline">Show all</button>
            <span className="text-slate-600">/</span>
            <button type="button" onClick={() => onSetAll(true, types)} className="text-blue-400 hover:underline">Hide all</button>
          </div>
        </div>
        <ul className="space-y-1.5">
          {types.map((t) => (
            <li key={t}>
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={!hiddenTypes.has(t)} 
                    onChange={() => onToggleType(t)} 
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: NODE_COLORS[t] || "#64748b" }} />
                  <span className="text-slate-300 group-hover:text-white transition-colors">{t}</span>
                </div>
                <span className="text-slate-400 text-xs">{typeCounts[t]}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Relationships</h3>
        <ul className="space-y-1.5">
          {rels.map((r) => (
            <li key={r} title={EDGE_HELP[r]} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 inline-block rounded" style={{ background: EDGE_COLORS[r] || "#cbd5e1" }} />
                <span className="text-slate-300 capitalize text-xs">
                  {r.replace(/_/g, " ").toLowerCase()}
                </span>
              </div>
              <span className="text-slate-400 text-xs">{relCounts[r]}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}