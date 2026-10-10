import { useState } from "react";

const pubmed = (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

function EvidenceItem({ ev }) {
  const [open, setOpen] = useState(false);
  const text = ev.sentence || "";
  const long = text.length > 220;

  return (
    <li className="evidence-item">
      <div className="evidence-meta">
        <a href={pubmed(ev.pmid)} target="_blank" rel="noreferrer">PMID {ev.pmid}</a>
        {ev.year && <span>{String(ev.year).slice(0, 4)}</span>}
        {ev.type && <span className="chip">{String(ev.type).toLowerCase()}</span>}
        {ev.direction && ev.direction !== "NOT_APPLICABLE" && (
          <span className="chip">{String(ev.direction).toLowerCase()}</span>
        )}
      </div>
      {text && <p>{open || !long ? text : `${text.slice(0, 220)}…`}</p>}
      {long && (
        <button type="button" className="link-btn" onClick={() => setOpen(!open)}>
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </li>
  );
}

// One block per disease: summary numbers + the publications that support the link
export default function EvidenceList({ title, edge }) {
  const raw = edge.raw;
  const evidence = raw.evidence || [];
  const summary = [
    raw.confidence && `${raw.confidence} confidence`,
    raw.papers != null && `${raw.papers} paper${raw.papers === 1 ? "" : "s"}`,
    raw.variants != null && `${raw.variants} variants`,
    raw.pathogenic != null && `${raw.pathogenic} pathogenic`,
  ].filter(Boolean);

  return (
    <div className="evidence">
      <h4>{title}</h4>
      {summary.length > 0 && <p className="muted small">{summary.join(" · ")}</p>}
      {raw.sources?.length > 0 && <p className="muted small">Sources: {raw.sources.join(", ")}</p>}
      {evidence.length > 0 ? (
        <ul>
          {evidence.map((ev, i) => (
            <EvidenceItem key={`${ev.pmid}-${i}`} ev={ev} />
          ))}
        </ul>
      ) : (
        <p className="muted small">No publication sentences recorded for this link.</p>
      )}
    </div>
  );
}
