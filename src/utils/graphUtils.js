// After the graph library runs, link.source/target become node objects. Handle both.
export const idOf = (x) => (typeof x === "object" ? x.id : x);

// Lookup tables so we can find a node's connections quickly
export function buildIndex(ds) {
  const adj = new Map();
  const nodeById = new Map(ds.nodes.map((n) => [n.id, n]));
  ds.edges.forEach((e) => {
    [e.source, e.target].forEach((id) => {
      if (!adj.has(id)) adj.set(id, []);
      adj.get(id).push(e);
    });
  });
  return { adj, nodeById };
}

// All nodes and edges directly connected to nodeId
export function neighborsOf(index, nodeId) {
  const edges = index.adj.get(nodeId) || [];
  const ids = new Set();
  edges.forEach((e) => {
    ids.add(e.source);
    ids.add(e.target);
  });
  ids.delete(nodeId);
  const nodes = [...ids].map((id) => index.nodeById.get(id)).filter(Boolean);
  return { nodes, edges };
}

// Add nodes/edges to the visible graph without duplicates
export function mergeGraph(prev, newNodes, newEdges, anchor) {
  const nodeMap = new Map(prev.nodes.map((n) => [n.id, n]));
  newNodes.forEach((n) => {
    if (!nodeMap.has(n.id)) {
      const spawn = { ...n };
      // start new nodes next to the node that was clicked so the layout stays tidy
      if (anchor && anchor.x !== undefined) {
        spawn.x = anchor.x + (Math.random() - 0.5) * 30;
        spawn.y = anchor.y + (Math.random() - 0.5) * 30;
      }
      nodeMap.set(n.id, spawn);
    }
  });

  const linkIds = new Set(prev.links.map((l) => l.id));
  const links = [...prev.links];
  newEdges.forEach((e) => {
    if (!linkIds.has(e.id) && nodeMap.has(e.source) && nodeMap.has(e.target)) {
      linkIds.add(e.id);
      links.push({ ...e });
    }
  });

  return { nodes: [...nodeMap.values()], links };
}

// Build the first view: the focus disease(s) in the centre plus everything directly linked to them
export function buildInitialGraph(ds, index) {
  const roots = ds.nodes.filter((n) => n.raw.focus);
  let graph = { nodes: [], links: [] };

  // 1. place the parent node(s). Two diseases (comparison) sit left and right.
  roots.forEach((r) => {
    const x = roots.length > 1 ? (r.raw.side === "b" ? 240 : -240) : 0;
    graph = mergeGraph(graph, [{ ...r, isRoot: true, fx: x, fy: 0 }], [], null);
  });

  // 2. connect their direct neighbours
  roots.forEach((r) => {
    const nb = neighborsOf(index, r.id);
    graph = mergeGraph(graph, nb.nodes, nb.edges, null);
  });

  return { graph, rootIds: roots.map((r) => r.id) };
}
