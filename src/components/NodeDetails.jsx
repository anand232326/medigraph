import { NODE_COLORS, prettify } from "../utils/graphConfig.js";
import EvidenceList from "./EvidenceList.jsx";

const STAT_LABELS = {
  n_gene: "Genes", n_variant: "Variants", n_publication: "Publications", n_drug: "Drugs",
  n_pathway: "Pathways", n_biomarker: "Biomarkers", n_protein: "Proteins", n_ncbiprotein: "NCBI proteins",
  n_georecord: "GEO records", n_phenotype: "Phenotypes", n_anatomy: "Anatomy terms",
};

const yesNo = (v) => (v === true ? "Yes" : v === false ? "No" : null);
const join = (arr) => (Array.isArray(arr) && arr.length ? arr.join(", ") : null);
const STRUCTURAL_FIELDS = new Set(["id", "kind", "label", "focus"]);
const DISPLAYED_FIELDS = {
  gene: ["description", "location", "confidence", "direction", "papers", "variants", "pathogenic", "sources", "side", "pmids"],
  pathway: ["source", "category", "genes_total", "kg_genes", "fdr", "url"],
  drug: ["drug_type", "stage", "approved", "actions", "mechanism"],
  target: ["description", "linked_to_disease"],
  disease: ["stats"],
};

function displayValue(value) {
  if (Array.isArray(value)) {
    return value.every((item) => item == null || ["string", "number", "boolean"].includes(typeof item))
      ? value.join(", ")
      : JSON.stringify(value);
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return yesNo(value);
  return value;
}

function fieldLabel(key) {
  return prettify(key.replace(/([a-z])([A-Z])/g, "$1 $2"))
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// [label, value] rows for the clicked node, depending on what kind of node it is
function factsFor(node, sideNames) {
  const r = node.raw;
  let facts;
  switch (node.kind) {
    case "gene":
      facts = [
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
      break;
    case "pathway":
      facts = [
        ["Source", r.source],
        ["Category", r.category],
        ["Genes in pathway", r.genes_total],
        ["Genes in this graph", r.kg_genes],
        ["FDR", r.fdr != null ? Number(r.fdr).toExponential(2) : null],
      ];
      break;
    case "drug":
      facts = [
        ["Type", r.drug_type],
        ["Stage", r.stage ? prettify(r.stage) : null],
        ["Approved", yesNo(r.approved)],
        ["Action", join(r.actions)],
        ["Mechanism", join(r.mechanism)],
      ];
      break;
    case "target":
      facts = [
        ["Description", r.description],
        ["Linked to the disease", yesNo(r.linked_to_disease)],
      ];
      break;
    case "disease":
      facts = Object.entries(r.stats || {}).map(([k, v]) => [
        STAT_LABELS[k] || fieldLabel(k.replace(/^n_/, "")),
        v,
      ]);
      break;
    default:
      facts = [];
  }

  const displayedFields = new Set([
    ...STRUCTURAL_FIELDS,
    ...(DISPLAYED_FIELDS[node.kind] || []),
  ]);
  const additionalFacts = Object.entries(r)
    .filter(([key, value]) =>
      !displayedFields.has(key) &&
      value !== null &&
      value !== undefined &&
      value !== ""
    )
    .map(([key, value]) => [fieldLabel(key), displayValue(value)]);

  return [...facts, ...additionalFacts];
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
      <aside className="p-4 text-slate-400 text-sm">
        <p>Click a node to see its details and references.</p>
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
    <aside className="h-full flex flex-col p-4 overflow-y-auto space-y-4 text-slate-100 text-sm">
      <div className="flex items-center justify-between">
        <span 
          className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider text-white" 
          style={{ background: NODE_COLORS[node.type] || "#64748b" }}
        >
          {node.type}
        </span>
      </div>

      <h2 className="text-lg font-bold text-white break-words">{node.label}</h2>

      {facts.length > 0 && (
        <dl className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-800/60 pb-1.5 last:border-none last:pb-0">
              <dt className="text-slate-400 font-medium">{label}</dt>
              <dd className="text-slate-200 text-right font-medium max-w-[60%] truncate">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {links.map((l) => (
            <a 
              key={l.href} 
              href={l.href} 
              target="_blank" 
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300 font-medium underline underline-offset-2 flex items-center gap-1"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}

      {node.kind === "disease" && !canOpen && !currentRootIds.includes(node.id) && (
        <p className="text-slate-400 text-xs italic">No detailed graph is available for this disease yet.</p>
      )}

      {canOpen && (
        <button 
          type="button" 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-lg text-xs transition-colors shadow-lg shadow-blue-600/20" 
          onClick={() => onOpenDisease(node.id)}
        >
          Open {node.label} graph
        </button>
      )}

      <button 
        type="button" 
        className={`w-full font-medium py-2 px-3 rounded-lg text-xs transition-colors border ${
          isExpanded 
            ? "bg-slate-800/40 border-slate-700 text-slate-400 cursor-not-allowed" 
            : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
        }`} 
        onClick={onExpand} 
        disabled={isExpanded}
      >
        {isExpanded ? "Connections shown on graph" : "Show connections on graph"}
      </button>

      {sharedGeneEdges.map((c) => (
        <div key={c.edge.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
          <h4 className="font-semibold text-xs text-slate-200">Shares {c.edge.raw.count} genes with {c.other.label}</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            {(c.edge.raw.genes || []).join(", ")}
            {c.edge.raw.count > (c.edge.raw.genes || []).length ? " …" : ""}
          </p>
        </div>
      ))}

      {node.kind === "gene" && evidenceEdges.length === 0 && (node.raw.pmids || []).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
          <h4 className="font-semibold text-xs text-slate-200">Publications</h4>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {node.raw.pmids.map((p) => (
              <a 
                key={p} 
                className="text-[11px] bg-slate-800 text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded border border-slate-700 font-medium" 
                href={`https://pubmed.ncbi.nlm.nih.gov/${p}/`} 
                target="_blank" 
                rel="noreferrer"
              >
                PMID {p}
              </a>
            ))}
          </div>
        </div>
      )}

      {evidenceEdges.length > 0 && <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider pt-2">References</h3>}
      {evidenceEdges.map((c) => (
        <EvidenceList key={c.edge.id} title={`Link to ${c.other.label}`} edge={c.edge} />
      ))}

      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Connections ({connections.length})</h3>
        <ul className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {connections.map((c) => (
            <li key={c.edge.id}>
              <button 
                type="button" 
                onClick={() => onSelect(c.other.id)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: NODE_COLORS[c.other.type] || "#64748b" }} />
                  <span className="text-slate-300 group-hover:text-white truncate text-xs font-medium">{c.other.label}</span>
                </div>
                <span className="text-slate-500 text-[11px] uppercase tracking-wider flex-shrink-0 pl-2">{describeEdge(c.edge)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}