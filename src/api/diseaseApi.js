import { normalise } from "../utils/normalise.js";

// All disease data lives in public/data/diseases.json.
let cache = null;

function loadAll() {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/diseases.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load disease data (${res.status})`);
        return res.json();
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
      totals: d.totals || {}, 
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
  single(all).forEach((d) => found.set(d.id, { id: d.id, name: d.name, available: true, totals: d.totals || {} }));
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
  
  // Passes the raw dataset object directly into normalise without slicing nodes/edges
  return normalise(ds);
}

export async function getComparisonGraph(a, b) {
  const all = await loadAll();
  const ds = all.find((d) => d.mode === "pair" && ((d.a === a && d.b === b) || (d.a === b && d.b === a)));
  if (!ds) throw new Error("No comparison data is available for these diseases.");
  return normalise(ds);
}