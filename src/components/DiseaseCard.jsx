import { Link } from "react-router-dom";

const CHIPS = [
  ["genes", "Genes"],
  ["variants", "Variants"],
  ["papers", "Publications"],
  ["drugs", "Drugs"],
  ["pathways", "Pathways"],
];

export default function DiseaseCard({ disease, rank }) {
  return (
    <Link 
      to={`/disease/${disease.id}`} 
      className="group relative bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-850 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-sky-500/5"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
            #{rank}
          </span>
          <span className="text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Explore graph <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-100 group-hover:text-white mb-4 line-clamp-2">
          {disease.name}
        </h3>

        <dl className="grid grid-cols-2 gap-2 mb-2">
          {CHIPS.filter(([key]) => disease.totals[key] != null).map(([key, label]) => (
            <div key={key} className="bg-slate-800/40 rounded-lg p-2 border border-slate-800/60">
              <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</dt>
              <dd className="text-sm font-semibold text-slate-200 mt-0.5">
                {Number(disease.totals[key]).toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>View network details</span>
        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Interactive &rarr;</span>
      </div>
    </Link>
  );
}