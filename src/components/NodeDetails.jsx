import { NODE_COLORS, prettify } from "../utils/graphConfig.js";
import EvidenceList from "./EvidenceList.jsx";

const STAT_LABELS = {
  n_gene: "Genes", n_variant: "Variants", n_publication: "Publications", n_drug: "Drugs",
  n_pathway: "Pathways", n_biomarker: "Biomarkers", n_protein: "Proteins", n_ncbiprotein: "NCBI proteins",
  n_georecord: "GEO records", n_phenotype: "Phenotypes", n_anatomy: "Anatomy terms",
};

const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : null);
const join = (arr) => (Array.isArray(arr) && arr.length ? arr.join(", ") : null);

// [label, value] rows for the clicked node, depending on what kind of node it is
function factsFor(node, sideNames) {
  const r = node.raw;
  switch (node.kind) {
    case "gene":
      return [
        ["Description", r.description],
        ["Location", r.location],
        ["Confidence", r.confidence],
        ["Expression", r.direction ? r.direction.toLowerCase() : null],
        ["Papers", r.papers],
        ["Variants", r.variants],
        ["Pathogenic variants", r.pathogenic],
        ["Sources", join(r.sources)],
        ["Found in", r.side ? sideNames[r.side] : null],
      ];
    case "pathway":
      return [
        ["Source", r.source],
        ["Category", r.category],
        ["Genes in pathway", r.genes_total],
        ["Genes in this graph", r.kg_genes],
        ["FDR", r.fdr != null ? Number(r.fdr).toExponential(2) : null],
      ];
    case "drug":
      return [
        ["Type", r.drug_type],
        ["Stage", r.stage ? prettify(r.stage) : null],
        ["Approved", yesNo(r.approved)],
        ["Action", join(r.actions)],
        ["Mechanism", join(r.mechanism)],
      ];
    case "target":
      return [
        ["Description", r.description],
        ["Linked to the disease", yesNo(r.linked_to_disease)],
      ];
    case "disease":
      return Object.entries(r.stats || {}).map(([k, v]) => [STAT_LABELS[k] || prettify(k), v]);
    default:
      return [];
  }
}

// External reference pages for the node
function linksFor(node) {
  const r = node.raw;
  if (node.kind === "gene" || node.kind === "target") {
    return [{
      label: "NCBI Gene",
      href: `https://www.ncbi.nlm.nih.gov/gene/?term=${encodeURIComponent(`${node.label}[Sym] AND human[Organism]`)}`,
    }];
  }
  if (node.kind === "pathway" && r.url) return [{ label: `${r.source || "Pathway"} page`, href: r.url }];
  if (node.kind === "drug") {
    const chembl = String(node.id).replace("DRUG:", "");
    return [{ label: "ChEMBL", href: `https://www.ebi.ac.uk/chembl/compound_report_card/${chembl}/` }];
  }
  return [];
}

// short text describing one relationship in the connections list
function describeEdge(edge) {
  const r = edge.raw;
  switch (edge.type) {
    case "ASSOCIATED": return r.confidence ? `associated · ${r.confidence}` : "associated";
    case "PATHWAY_OF": return r.fdr != null ? `pathway of · FDR ${Number(r.fdr).toExponential(1)}` : "pathway of";
    case "DRUG_FOR": return r.stage ? `drug for · ${prettify(r.stage).toLowerCase()}` : "drug for";
    case "TARGETS": return r.action ? `targets · ${r.action.toLowerCase()}` : "targets";
    case "RELATED": return r.relation ? prettify(r.relation).toLowerCase() : "related";
    case "SHARES_GENES": return `shares ${r.count} genes`;
    default: return prettify(edge.type).toLowerCase();
  }
}

export default function NodeDetails({
  node, connections, sideNames, isExpanded, onExpand, onSelect, availableIds, currentRootIds, onOpenDisease,
}) {
  if (!node) {
    return (
      <aside className="details">
        <p className="muted">Click a node to see its details and references.</p>
      </aside>
    );
  }

  const facts = factsFor(node, sideNames).filter(([, v]) => v !== null && v !== undefined && v !== "");
  const links = linksFor(node);

  // Publication evidence lives on the gene -> disease edges
  const evidenceEdges = connections.filter((c) => c.other.kind === "disease" && c.edge.raw.evidence);
  const sharedGeneEdges = connections.filter((c) => c.edge.type === "SHARES_GENES");
  const canOpen = node.kind === "disease" && availableIds.has(node.id) && !currentRootIds.includes(node.id);

  return (
    <aside className="details">
      <span className="badge" style={{ background: NODE_COLORS[node.type] || "#64748b" }}>
        {node.type}
      </span>
      <h2>{node.label}</h2>

      {facts.length > 0 && (
        <dl className="props">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {links.length > 0 && (
        <p className="ext-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>
          ))}
        </p>
      )}

      {node.kind === "disease" && !canOpen && !currentRootIds.includes(node.id) && (
        <p className="muted small">No detailed graph is available for this disease yet.</p>
      )}
      {canOpen && (
        <button type="button" className="expand-btn" onClick={() => onOpenDisease(node.id)}>
          Open {node.label} graph
        </button>
      )}

      <button type="button" className="expand-btn secondary" onClick={onExpand} disabled={isExpanded}>
        {isExpanded ? "Connections shown on graph" : "Show connections on graph"}
      </button>

      {sharedGeneEdges.map((c) => (
        <div key={c.edge.id} className="evidence">
          <h4>Shares {c.edge.raw.count} genes with {c.other.label}</h4>
          <p className="muted small">
            {(c.edge.raw.genes || []).join(", ")}
            {c.edge.raw.count > (c.edge.raw.genes || []).length ? " …" : ""}
          </p>
        </div>
      ))}

      {node.kind === "gene" && evidenceEdges.length === 0 && (node.raw.pmids || []).length > 0 && (
        <div className="evidence">
          <h4>Publications</h4>
          <p className="small">
            {node.raw.pmids.map((p) => (
              <a key={p} className="pmid" href={`https://pubmed.ncbi.nlm.nih.gov/${p}/`} target="_blank" rel="noreferrer">
                PMID {p}
              </a>
            ))}
          </p>
        </div>
      )}

      {evidenceEdges.length > 0 && <h3>References</h3>}
      {evidenceEdges.map((c) => (
        <EvidenceList key={c.edge.id} title={`Link to ${c.other.label}`} edge={c.edge} />
      ))}

      <h3>Connections ({connections.length})</h3>
      <ul className="connections">
        {connections.map((c) => (
          <li key={c.edge.id}>
            <button type="button" onClick={() => onSelect(c.other.id)}>
              <span className="dot" style={{ background: NODE_COLORS[c.other.type] || "#64748b" }} />
              <span className="conn-label">{c.other.label}</span>
              <span className="conn-type">{describeEdge(c.edge)}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
