import { normalise } from "../utils/normalise.js";

// All disease data lives in public/data/diseases.json.
let cache = null;

const TOTAL_KIND_KEYS = {
  genes: ["gene"],
  variants: ["variant"],
  papers: ["publication", "paper"],
  pathways: ["pathway"],
  drugs: ["drug"],
  biomarkers: ["biomarker"],
};

function totalsFor(disease) {
  const totals = { ...(disease.totals || {}) };
  const nodes = disease.nodes || [];

  for (const [totalKey, kinds] of Object.entries(TOTAL_KIND_KEYS)) {
    if (totals[totalKey] == null) {
      totals[totalKey] = nodes.filter(
        (node) => kinds.includes(String(node.kind).toLowerCase())
      ).length;
    }
  }

  return totals;
}

function validateDataset(data) {
  if (!Array.isArray(data)) {
    throw new Error("Disease data must be a JSON array of disease records.");
  }

  const recordIds = new Set();

  data.forEach((disease, index) => {
    const recordLabel = `Disease record at index ${index}`;
    if (!disease || typeof disease !== "object" || Array.isArray(disease)) {
      throw new Error(`${recordLabel} must be a JSON object.`);
    }
    if (typeof disease.id !== "string" || !disease.id.trim()) {
      throw new Error(`${recordLabel} is missing a non-empty "id".`);
    }
    if (recordIds.has(disease.id)) {
      throw new Error(`Disease data contains duplicate record id "${disease.id}".`);
    }
    recordIds.add(disease.id);
    if (typeof disease.name !== "string" || !disease.name.trim()) {
      throw new Error(`Disease record "${disease.id}" is missing a non-empty "name".`);
    }
    if (!Array.isArray(disease.nodes) || !Array.isArray(disease.edges)) {
      throw new Error(`Disease record "${disease.id}" must include "nodes" and "edges" arrays.`);
    }
    if (
      disease.totals != null &&
      (typeof disease.totals !== "object" || Array.isArray(disease.totals))
    ) {
      throw new Error(`Disease record "${disease.id}" must provide "totals" as an object.`);
    }

    const nodeIds = new Set();
    const focusIds = new Set();
    let focusCount = 0;
    disease.nodes.forEach((node, nodeIndex) => {
      if (
        !node ||
        typeof node.id !== "string" ||
        !node.id.trim() ||
        typeof node.kind !== "string" ||
        !node.kind.trim() ||
        typeof node.label !== "string" ||
        !node.label.trim()
      ) {
        throw new Error(
          `Node ${nodeIndex} in "${disease.id}" must include non-empty "id", "kind", and "label" values.`
        );
      }
      if (nodeIds.has(node.id)) {
        throw new Error(`Disease record "${disease.id}" contains duplicate node id "${node.id}".`);
      }
      nodeIds.add(node.id);
      if (node.focus === true) {
        focusCount += 1;
        focusIds.add(node.id);
      }
    });

    disease.edges.forEach((edge, edgeIndex) => {
      if (
        !edge ||
        typeof edge.source !== "string" ||
        typeof edge.target !== "string" ||
        typeof edge.kind !== "string" ||
        !edge.kind.trim()
      ) {
        throw new Error(
          `Edge ${edgeIndex} in "${disease.id}" must include "source", "target", and "kind" values.`
        );
      }
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(
          `Edge ${edgeIndex} in "${disease.id}" refers to a node that is not in its "nodes" array.`
        );
      }
    });

    const isPair = disease.mode === "pair";
    const expectedFocusCount = isPair ? 2 : 1;
    if (focusCount !== expectedFocusCount) {
      throw new Error(
        `Disease record "${disease.id}" must have ${expectedFocusCount} focus node${isPair ? "s" : ""}.`
      );
    }
    if (
      isPair &&
      (typeof disease.a !== "string" ||
        typeof disease.b !== "string" ||
        !nodeIds.has(disease.a) ||
        !nodeIds.has(disease.b) ||
        !focusIds.has(disease.a) ||
        !focusIds.has(disease.b))
    ) {
      throw new Error(
        `Comparison record "${disease.id}" must reference its two focused disease nodes with "a" and "b".`
      );
    }
    if (isPair && disease.stats != null && !Array.isArray(disease.stats)) {
      throw new Error(`Comparison record "${disease.id}" must provide "stats" as an array.`);
    }
  });
}

function loadAll() {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/diseases.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load disease data (${res.status})`);
        return res.json();
      })
      .then((data) => {
        validateDataset(data);
        return data;
      })
      .catch((err) => {
        cache = null; // allow a retry
        throw err;
      });
  }
  return cache;
}

const single = (all) => all.filter((d) => d.mode !== "pair");

// Diseases that have a full graph, most-studied first
export async function getDiseaseList() {
  const all = await loadAll();
  return single(all)
    .map((d) => ({ 
      id: d.id, 
      name: d.name, 
      totals: totalsFor(d),
      regulated: d.regulated 
    }))
    .sort((a, b) => (b.totals.papers || b.totals.Publication || 0) - (a.totals.papers || a.totals.Publication || 0));
}

export async function getTopDiseases(limit = 5) {
  return (await getDiseaseList()).slice(0, limit);
}

export async function getComparisons() {
  const all = await loadAll();
  return all
    .filter((d) => d.mode === "pair")
    .map((d) => ({ 
      id: d.id, 
      name: d.name, 
      a: d.a, 
      b: d.b, 
      subtitle: d.subtitle, 
      stats: d.stats || [] 
    }));
}

export async function getAvailableDiseaseIds() {
  const all = await loadAll();
  return new Set(single(all).map((d) => d.id));
}

// Search by disease name.
export async function searchDiseases(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await loadAll();

  const found = new Map();
  single(all).forEach((d) => found.set(d.id, { id: d.id, name: d.name, available: true, totals: totalsFor(d) }));
  all.forEach((d) =>
    d.nodes?.forEach((n) => {
      if (n.kind === "disease" && !found.has(n.id)) {
        found.set(n.id, { id: n.id, name: n.label, available: false, totals: {} });
      }
    })
  );

  return [...found.values()]
    .filter((d) => d.name.toLowerCase().includes(q))
    .sort((a, b) => Number(b.available) - Number(a.available))
    .slice(0, 8);
}

export async function getDiseaseGraph(id) {
  const all = await loadAll();
  const ds = single(all).find((d) => d.id === id);
  if (!ds) throw new Error("No data is available for this disease yet.");
  
  return { ...normalise(ds), totals: totalsFor(ds) };
}

export async function getComparisonGraph(a, b) {
  const all = await loadAll();
  const ds = all.find((d) => d.mode === "pair" && ((d.a === a && d.b === b) || (d.a === b && d.b === a)));
  if (!ds) throw new Error("No comparison data is available for these diseases.");
  return { ...normalise(ds), totals: totalsFor(ds) };
}