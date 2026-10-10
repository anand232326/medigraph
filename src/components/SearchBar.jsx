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
    <div className="search" ref={boxRef}>
      <form onSubmit={onSubmit} className="search-form">
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
        />
        <button type="submit">Search</button>
      </form>

      {open && query.trim() && searched && (
        <ul className="search-list">
          {results.length === 0 && <li className="search-empty">No disease found</li>}
          {results.map((d) => (
            <li key={d.id}>
              <button type="button" disabled={!d.available} onClick={() => openDisease(d)}>
                <strong>{d.name}</strong>
                <span>
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
