import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchDiseases } from "../api/diseaseApi.js";

export default function SearchBar({
  placeholder = "Search a disease, e.g. Keratoconus",
  onSelectDisease,
}) {
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
    if (onSelectDisease) {
      setQuery("");
      onSelectDisease(disease);
    } else {
      setQuery(disease.name);
      navigate(`/disease/${disease.id}`);
    }
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
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white p-1.5 shadow-lg shadow-blue-900/10 ring-1 ring-white/80 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100"
      >
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
            className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none sm:px-4"
          />
        </div>
        <button
          type="submit"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-900/20 transition hover:from-blue-600 hover:to-indigo-500 sm:px-5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
          >
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Search
        </button>
      </form>

      {open && query.trim() && searched && (
        <ul className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15">
          {results.length === 0 && (
            <li className="px-4 py-3 text-center text-xs italic text-slate-500">
              No disease found
            </li>
          )}
          {results.map((d, index) => (
            <li key={d.id} className="border-b border-slate-100 last:border-none">
              <button
                type="button"
                disabled={!d.available}
                onClick={() => openDisease(d)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  d.available
                    ? "cursor-pointer text-slate-800 hover:bg-blue-50"
                    : "cursor-not-allowed bg-slate-50 text-slate-400 opacity-70"
                }`}
              >
                <span className="mr-3 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700">
                  {index + 1}
                </span>
                <strong className="flex-1 truncate pr-2 text-left text-xs font-semibold">{d.name}</strong>
                <span className="shrink-0 text-[11px] font-medium text-slate-500">
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