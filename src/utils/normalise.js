import { KIND_TO_TYPE } from "./graphConfig.js";

const normalizeKind = (kind) =>
  String(kind).trim().toLowerCase().replace(/[\s-]+/g, "_");

// Helper to normalize and fallback kind values
const resolveNodeType = (kind) => {
  if (!kind) return "Unknown";
  if (Object.hasOwn(KIND_TO_TYPE, kind)) return KIND_TO_TYPE[kind];

  return kind
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// Turns one entry of diseases.json into the shape the UI uses.
// The original node/edge objects are kept untouched in `raw`.
export function normalise(ds) {
  const nodes = (ds.nodes || []).map((n) => {
    const kind = normalizeKind(n.kind);
    return {
      id: n.id,
      label: n.label,
      kind,
      type: resolveNodeType(kind),
      raw: n,
    };
  });
  
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