import { KIND_TO_TYPE } from "./graphConfig.js";

// Helper to normalize and fallback kind values
const resolveNodeType = (kind) => {
  if (!kind) return "Unknown";
  if (KIND_TO_TYPE[kind]) return KIND_TO_TYPE[kind];
  if (KIND_TO_TYPE[kind.toLowerCase()]) return KIND_TO_TYPE[kind.toLowerCase()];
  
  // Title case fallback if not explicitly found in map
  return kind.charAt(0).toUpperCase() + kind.slice(1).toLowerCase();
};

// Turns one entry of diseases.json into the shape the UI uses.
// The original node/edge objects are kept untouched in `raw`.
export function normalise(ds) {
  const nodes = (ds.nodes || []).map((n) => ({
    id: n.id,
    label: n.label,
    kind: n.kind,
    type: resolveNodeType(n.kind),
    raw: n,
  }));
  
  const edges = (ds.edges || []).map((e) => ({
    id: `${e.source}|${e.kind}|${e.target}`,
    source: e.source,
    target: e.target,
    type: e.kind ? e.kind.toUpperCase() : "ASSOCIATED",
    raw: e,
  }));

  return {
    id: ds.id,
    name: ds.name,
    isPair: ds.mode === "pair",
    a: ds.a,
    b: ds.b,
    regulated: ds.regulated || null,
    totals: ds.totals || {},
    stats: ds.stats || null,
    subtitle: ds.subtitle || null,
    nodes,
    edges,
  };
}