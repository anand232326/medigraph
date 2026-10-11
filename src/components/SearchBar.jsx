import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchDiseases } from "../api/diseaseApi.js";

export default function SearchBar({ placeholder = "Search a disease, e.g. Keratoconus" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search while typing
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await searchDiseases(q);
        if (!cancelled) {
          setResults(data);
          setSearched(true);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearched(true);
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openDisease = (disease) => {
    setOpen(false);
    setQuery(disease.name);
    navigate(`/disease/${disease.id}`);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const list = results.length ? results : await searchDiseases(q);
    const first = list.find((d) => d.available);
    if (first) {
      openDisease(first);
    } else {
      setResults(list);
      setSearched(true);
      setOpen(true);
    }
  };

  return (
    <div className="relative w-full" ref={boxRef}>
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            aria-label="Search disease"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-md shadow-blue-600/20 flex-shrink-0"
        >
          Search
        </button>
      </form>

      {open && query.trim() && searched && (
        <ul className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
          {results.length === 0 && (
            <li className="px-4 py-3 text-xs text-slate-400 text-center italic">
              No disease found
            </li>
          )}
          {results.map((d) => (
            <li key={d.id} className="border-b border-slate-800/60 last:border-none">
              <button
                type="button"
                disabled={!d.available}
                onClick={() => openDisease(d)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  d.available
                    ? "hover:bg-slate-800/80 text-slate-200 cursor-pointer"
                    : "opacity-50 cursor-not-allowed text-slate-400 bg-slate-900/40"
                }`}
              >
                <strong className="text-xs font-semibold truncate pr-2">{d.name}</strong>
                <span className="text-[11px] text-slate-400 flex-shrink-0 font-medium">
                  {d.available ? `${(d.totals.genes || 0).toLocaleString()} genes` : "No data yet"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}