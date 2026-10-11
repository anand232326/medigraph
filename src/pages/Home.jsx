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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col px-6 py-10 max-w-7xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6 pt-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Search any disease and see what it is connected to
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Find the genes, pathways and drugs linked to a disease as an interactive graph. Click any
          node to see its details and the publications behind the link.
        </p>
        <div className="w-full max-w-md pt-2">
          <SearchBar />
        </div>
      </section>

      {/* Top Diseases Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-wide border-b border-slate-800 pb-3">Top diseases</h2>
        {status === "loading" && <p className="text-slate-400 text-sm">Loading…</p>}
        {status === "error" && <p className="text-red-400 text-sm">Could not load diseases.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {top.map((d, i) => (
            <DiseaseCard key={d.id} disease={d} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Compare Diseases Section */}
      {comparisons.length > 0 && (
        <section className="space-y-6 pb-12">
          <h2 className="text-xl font-bold text-white tracking-wide border-b border-slate-800 pb-3">Compare diseases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((c) => (
              <Link 
                key={c.id} 
                to={`/compare/${c.a}/${c.b}`} 
                className="group relative bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-850 transition-all duration-200 flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-white">{c.name}</h3>
                    <span className="text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Compare →
                    </span>
                  </div>
                  {c.subtitle && <p className="text-xs text-slate-400">{c.subtitle}</p>}
                  
                  <dl className="grid grid-cols-3 gap-2 pt-2">
                    {c.stats.slice(0, 3).map(([label, value]) => (
                      <div key={label} className="bg-slate-800/40 rounded-lg p-2 border border-slate-800/60">
                        <dt className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</dt>
                        <dd className="text-xs font-semibold text-slate-200 mt-0.5">{value}</dd>
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