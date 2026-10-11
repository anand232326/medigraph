import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getComparisons, getTopDiseases } from "../api/diseaseApi.js";
import GraphExplorer from "../components/GraphExplorer.jsx";
import SearchBar from "../components/SearchBar.jsx";

function DiseaseComparisonSearch() {
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [topDiseases, setTopDiseases] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    Promise.all([getComparisons(), getTopDiseases(5)])
      .then(([comparisonData, diseaseData]) => {
        if (!cancelled) {
          setComparisons(comparisonData);
          setTopDiseases(diseaseData);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "Could not load disease comparisons.");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPairSupported = useMemo(() => {
    if (selectedDiseases.length !== 2) return false;
    const [first, second] = selectedDiseases;
    return comparisons.some(
      (comparison) =>
        (comparison.a === first.id && comparison.b === second.id) ||
        (comparison.a === second.id && comparison.b === first.id)
    );
  }, [comparisons, selectedDiseases]);

  const addDisease = (disease) => {
    setSelectedDiseases((current) => {
      if (current.length >= 2 || current.some((item) => item.id === disease.id)) {
        return current;
      }
      return [...current, disease];
    });
  };

  const removeDisease = (id) => {
    setSelectedDiseases((current) =>
      current.filter((disease) => disease.id !== id)
    );
  };

  const openComparison = () => {
    if (!selectedPairSupported) return;
    navigate(`/compare/${selectedDiseases[0].id}/${selectedDiseases[1].id}`);
  };

  const renderDiseaseSlot = (slot) => {
    const disease = selectedDiseases[slot];
    return (
      <div
        key={slot}
        className={`flex min-h-20 items-center justify-between gap-2 rounded-xl border p-4 ${
          disease
            ? "border-blue-200 bg-blue-50"
            : "border-dashed border-slate-300 bg-slate-50"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
            {slot + 1}
          </span>
          <span className={`truncate text-sm ${disease ? "font-semibold text-slate-900" : "text-slate-500"}`}>
            {disease?.name || "Choose a disease"}
          </span>
        </div>
        {disease && (
          <button
            type="button"
            onClick={() => removeDisease(disease.id)}
            aria-label={`Remove ${disease.name}`}
            className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-blue-100 hover:text-blue-800"
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="mx-auto mb-8 max-w-3xl space-y-4 text-center sm:mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Disease relationships
          </span>
          <h1 className="bg-gradient-to-r from-blue-800 via-indigo-700 to-cyan-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Compare diseases
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Explore shared genes and discover what makes each disease unique.
            Choose two diseases to visualize their relationship.
          </p>
        </section>

        <section className="mx-auto max-w-3xl rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-blue-900/10 ring-1 ring-slate-200/80 backdrop-blur sm:p-7">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Find a disease
            </label>
            {selectedDiseases.length < 2 ? (
              <SearchBar
                placeholder="Search a disease, e.g. Keratoconus"
                onSelectDisease={addDisease}
              />
            ) : (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Remove a selected disease to search for another.
              </p>
            )}
          </div>

          <div className="mb-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Top 5 diseases
            </h2>
            {status === "loading" && (
              <p className="text-sm text-slate-500">Loading diseases…</p>
            )}
            {status === "error" && (
              <p role="alert" className="text-sm text-red-400">{loadError}</p>
            )}
            {status === "ready" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topDiseases.map((disease, index) => {
                  const selected = selectedDiseases.some(
                    (item) => item.id === disease.id
                  );
                  const canSelect =
                    selected || selectedDiseases.length < 2;
                  return (
                    <button
                      key={disease.id}
                      type="button"
                      disabled={!canSelect}
                      onClick={() =>
                        selected
                          ? removeDisease(disease.id)
                          : addDisease(disease)
                      }
                      className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : canSelect
                            ? "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            : "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {disease.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {Number(disease.totals.genes || 0).toLocaleString()} genes
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-blue-700">
                        {selected ? "Selected" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Your comparison
              </h2>
              <span className="text-xs tabular-nums text-slate-500">
                {selectedDiseases.length} of 2 selected
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              {renderDiseaseSlot(0)}
              <span aria-hidden="true" className="text-center text-xs font-bold text-indigo-500">
                VS
              </span>
              {renderDiseaseSlot(1)}
            </div>
          </div>

          {selectedDiseases.length === 2 && !selectedPairSupported && (
            <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              A relationship graph is not available for this pair yet.
            </p>
          )}
          {loadError && status !== "error" && (
            <p role="alert" className="mb-4 text-sm text-red-400">{loadError}</p>
          )}

          <button
            type="button"
            disabled={!selectedPairSupported}
            onClick={openComparison}
            className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-500 disabled:cursor-not-allowed disabled:transform-none disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            Show disease relationships
          </button>
        </section>

        {comparisons.length > 0 && (
          <section className="mx-auto mt-8 max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Ready-to-explore comparison
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {comparisons.map((comparison) => (
                <button
                  key={comparison.id}
                  type="button"
                  onClick={() => navigate(`/compare/${comparison.a}/${comparison.b}`)}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-white bg-white/90 px-4 py-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {comparison.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Open relationship graph
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-blue-600 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { a, b } = useParams();
  if (a && b) return <GraphExplorer key={`${a}+${b}`} a={a} b={b} />;
  return <DiseaseComparisonSearch />;
}
