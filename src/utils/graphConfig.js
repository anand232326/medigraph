// Node "kind" values in diseases.json -> readable type shown in the UI
export const KIND_TO_TYPE = {
  disease: "Disease",
  gene: "Gene",
  pathway: "Pathway",
  drug: "Drug",
  target: "Drug target",
};

export const NODE_COLORS = {
  Disease: "#1e3a8a",
  Gene: "#059669",
  Pathway: "#d97706",
  Drug: "#be185d",
  "Drug target": "#0891b2",
};

// Edge "kind" values in diseases.json (upper-cased) -> colour
export const EDGE_COLORS = {
  ASSOCIATED: "#059669",
  IN_PATHWAY: "#d97706",
  PATHWAY_OF: "#f59e0b",
  DRUG_FOR: "#be185d",
  TARGETS: "#0891b2",
  RELATED: "#1e3a8a",
  SHARES_GENES: "#8b5cf6",
};

// Plain-English meaning of each relationship, shown in the sidebar legend
export const EDGE_HELP = {
  ASSOCIATED: "gene linked to the disease",
  IN_PATHWAY: "gene belongs to pathway",
  PATHWAY_OF: "pathway enriched in the disease",
  DRUG_FOR: "drug used for the disease",
  TARGETS: "drug acts on target",
  RELATED: "related disease",
  SHARES_GENES: "diseases share genes",
};

// Used only in the comparison view (two diseases side by side)
export const SIDE_COLORS = { a: "#2563eb", b: "#ea580c", shared: "#7c3aed" };

export const UP_COLOR = "#dc2626";
export const DOWN_COLOR = "#1d4ed8";

export const nodeRadius = (node) => {
  if (node.isRoot) return 13;
  if (node.type === "Disease") return 8;
  if (node.type === "Gene") return node.raw?.confidence === "high" ? 6 : 4.5;
  return 5;
};

export const prettify = (text) => String(text).replace(/_/g, " ");
