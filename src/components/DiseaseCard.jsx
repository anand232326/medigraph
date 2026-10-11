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
      className="group relative flex flex-col justify-between rounded-xl border border-white bg-white/90 p-5 shadow-md shadow-blue-900/5 ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800 transition-colors group-hover:bg-blue-700 group-hover:text-white">
            #{rank}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            Explore graph <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>

        <h3 className="mb-4 line-clamp-2 text-base font-semibold text-slate-900">
          {disease.name}
        </h3>

        <dl className="grid grid-cols-2 gap-2 mb-2">
          {CHIPS.filter(([key]) => disease.totals[key] != null).map(([key, label]) => (
            <div key={key} className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-2">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                {Number(disease.totals[key]).toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>View network details</span>
        <span className="text-blue-600 transition-colors group-hover:text-indigo-700">Interactive &rarr;</span>
      </div>
    </Link>
  );
}