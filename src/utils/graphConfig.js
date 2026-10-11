// Node "kind" values in diseases.json -> readable type shown in the UI
export const KIND_TO_TYPE = {
  disease: "Disease",
  gene: "Gene",
  protein: "Protein",
  nc_protein: "NCBI Protein",
  ncbi_protein: "NCBI Protein",
  variant: "Variant",
  pathway: "Pathway",
  drug: "Drug",
  target: "Drug target",
  publication: "Publication",
  paper: "Publication",
  biomarker: "Biomarker",
  geo_record: "GEO Record",
  phenotype: "Phenotype",
  go_term: "GO Term",
  interpro: "InterPro",
  pfam: "Pfam",
  anatomy: "Anatomy",
};

export const NODE_COLORS = {
  Gene: "#059669",         // Emerald green
  Protein: "#14b8a6",      // Teal
  "NCBI Protein": "#0284c7", // Sky blue
  Variant: "#8b5cf6",      // Purple
  Pathway: "#d97706",      // Amber / Orange
  Drug: "#be185d",         // Pink / Deep Rose
  Publication: "#2563eb",  // Blue
  Biomarker: "#f97316",    // Orange-Red
  "GEO Record": "#0d9488", // Dark Teal
  Phenotype: "#fb923c",    // Light Orange
  "GO Term": "#7c3aed",    // Violet
  InterPro: "#92400e",     // Dark Amber / Brown
  Pfam: "#b45309",         // Brown
  Anatomy: "#15803d",      // Forest Green
  Disease: "#1e3a8a",      // Dark Blue
  "Drug target": "#0891b2", // Cyan
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