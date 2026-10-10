import { useState } from "react";

const pubmed = (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

function EvidenceItem({ ev }) {
  const [open, setOpen] = useState(false);
  const text = ev.sentence || "";
  const long = text.length > 220;

  return (
    <li className="bg-slate-855/60 border border-slate-800 rounded-lg p-3 space-y-2 text-sm text-slate-300">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <a 
          href={pubmed(ev.pmid)} 
          target="_blank" 
          rel="noreferrer"
          className="text-sky-400 hover:text-sky-300 font-medium underline underline-offset-2"
        >
          PMID {ev.pmid}
        </a>
        {ev.year && <span className="text-slate-400 font-medium">{String(ev.year).slice(0, 4)}</span>}
        {ev.type && (
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-700/60 uppercase tracking-wider">
            {String(ev.type).toLowerCase()}
          </span>
        )}
        {ev.direction && ev.direction !== "NOT_APPLICABLE" && (
          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-[11px] font-medium border border-blue-500/20 uppercase tracking-wider">
            {String(ev.direction).toLowerCase()}
          </span>
        )}
      </div>
      {text && (
        <p className="text-slate-300 text-xs leading-relaxed">
          {open || !long ? text : `${text.slice(0, 220)}…`}
        </p>
      )}
      {long && (
        <button 
          type="button" 
          className="text-xs text-sky-400 hover:text-sky-300 font-medium mt-1 focus:outline-none" 
          onClick={() => setOpen(!open)}
        >
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
    <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-100">
      <h4 className="font-semibold text-sm text-white tracking-wide">{title}</h4>
      
      {summary.length > 0 && (
        <p className="text-slate-400 text-xs font-medium">
          {summary.join(" · ")}
        </p>
      )}
      
      {raw.sources?.length > 0 && (
        <p className="text-slate-400 text-xs">
          <strong className="text-slate-300">Sources:</strong> {raw.sources.join(", ")}
        </p>
      )}

      {evidence.length > 0 ? (
        <ul className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {evidence.map((ev, i) => (
            <EvidenceItem key={`${ev.pmid}-${i}`} ev={ev} />
          ))}
        </ul>
      ) : (
        <p className="text-slate-500 text-xs italic">
          No publication sentences recorded for this link.
        </p>
      )}
    </div>
  );
}