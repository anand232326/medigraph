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
    <div className="home">
      <section className="hero">
        <h1>Search any disease and see what it is connected to</h1>
        <p>
          Find the genes, pathways and drugs linked to a disease as an interactive graph. Click any
          node to see its details and the publications behind the link.
        </p>
        <SearchBar />
      </section>

      <section className="top">
        <h2>Top diseases</h2>
        {status === "loading" && <p className="state">Loading…</p>}
        {status === "error" && <p className="state error">Could not load diseases.</p>}
        <div className="card-grid">
          {top.map((d, i) => (
            <DiseaseCard key={d.id} disease={d} rank={i + 1} />
          ))}
        </div>
      </section>

      {comparisons.length > 0 && (
        <section className="top">
          <h2>Compare diseases</h2>
          <div className="card-grid">
            {comparisons.map((c) => (
              <Link key={c.id} to={`/compare/${c.a}/${c.b}`} className="card">
                <h3>{c.name}</h3>
                <p>{c.subtitle}</p>
                <dl className="card-stats">
                  {c.stats.slice(0, 3).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <span className="card-link">Compare →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
