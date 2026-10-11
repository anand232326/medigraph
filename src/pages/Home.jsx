import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar.jsx";
import DiseaseCard from "../components/DiseaseCard.jsx";
import { getComparisons, getTopDiseases } from "../api/diseaseApi.js";

export default function Home() {
  const [top, setTop] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTopDiseases(5), getComparisons()])
      .then(([diseases, pairs]) => {
        if (cancelled) return;
        setTop(diseases);
        setComparisons(pairs);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col space-y-12 bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-8 text-slate-900 sm:space-y-16 sm:px-6 sm:py-10">
      {/* Hero Section */}
      <section className="mx-auto flex max-w-3xl flex-col items-center space-y-5 pt-5 text-center sm:space-y-6 sm:pt-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Explore the disease network
        </span>
        <h1 className="bg-gradient-to-r from-blue-800 via-indigo-700 to-cyan-700 bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent sm:text-5xl">
          Search any disease and see what it is connected to
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Find the genes, pathways and drugs linked to a disease as an interactive graph. Click any
          node to see its details and the publications behind the link.
        </p>
        <div className="w-full max-w-xl pt-1">
          <SearchBar />
        </div>
      </section>

      {/* Top Diseases Section */}
      <section className="space-y-5 sm:space-y-6">
        <h2 className="border-b border-blue-100 pb-3 text-xl font-bold tracking-wide text-slate-900">Top diseases</h2>
        {status === "loading" && <p className="text-sm text-slate-500">Loading…</p>}
        {status === "error" && <p className="text-sm text-red-600">Could not load diseases.</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {top.map((d, i) => (
            <DiseaseCard key={d.id} disease={d} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Compare Diseases Section */}
      {comparisons.length > 0 && (
        <section className="space-y-5 pb-8 sm:space-y-6 sm:pb-12">
          <h2 className="border-b border-blue-100 pb-3 text-xl font-bold tracking-wide text-slate-900">Compare diseases</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-6">
            {comparisons.map((c) => (
              <Link 
                key={c.id} 
                to={`/compare/${c.a}/${c.b}`} 
                className="group relative flex flex-col justify-between rounded-xl border border-white bg-white/90 p-5 shadow-md shadow-blue-900/5 ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900">{c.name}</h3>
                    <span className="text-xs font-medium text-blue-700 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      Compare →
                    </span>
                  </div>
                  {c.subtitle && <p className="text-xs leading-relaxed text-slate-600">{c.subtitle}</p>}
                  
                  <dl className="grid grid-cols-3 gap-2 pt-2">
                    {c.stats.slice(0, 3).map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-2">
                        <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</dt>
                        <dd className="mt-0.5 text-xs font-semibold text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}