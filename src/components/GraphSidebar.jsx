import { useMemo } from "react";
import {
  DOWN_COLOR,
  EDGE_COLORS,
  EDGE_HELP,
  NODE_COLORS,
  SIDE_COLORS,
  UP_COLOR,
} from "../utils/graphConfig.js";

const TYPE_STATS_KEYS = {
  Gene: "n_gene",
  Protein: "n_protein",
  "NCBI Protein": "n_ncbiprotein",
  Variant: "n_variant",
  Pathway: "n_pathway",
  Drug: "n_drug",
  Publication: "n_publication",
  Biomarker: "n_biomarker",
  "GEO Record": "n_georecord",
  Phenotype: "n_phenotype",
  "GO Term": "n_goterm",
  InterPro: "n_interpro",
  Pfam: "n_pfam",
  Anatomy: "n_anatomy",
};

const DEFAULT_NODE_COLOR = "#64748b";
const DEFAULT_EDGE_COLOR = "#cbd5e1";
const SIDEBAR_NODE_TYPES = Object.keys(NODE_COLORS).filter(
  (type) => type !== "Drug target"
);

const formatNumber = (value) => Number(value ?? 0).toLocaleString();

export default function GraphSidebar({
  dataset,
  nodes = [],
  links = [],
  visibleNodes,
  visibleLinks,
  hiddenTypes = new Set(),
  onToggleType,
  onSetAll,
  sideMode = false,
}) {
  const displayedNodes = visibleNodes ?? nodes;
  const displayedLinks = visibleLinks ?? links;

  // Count all node categories so filters never disappear.
  const typeCounts = useMemo(() => {
    const counts = {};

    for (const node of nodes) {
      if (node.type) {
        const type = node.type === "Drug target" ? "Drug" : node.type;
        counts[type] = (counts[type] || 0) + 1;
      }
    }

    const focusStats = nodes.find((node) => node.raw?.focus)?.raw?.stats;
    if (focusStats) {
      for (const [type, key] of Object.entries(TYPE_STATS_KEYS)) {
        if (Number.isFinite(focusStats[key])) {
          counts[type] = focusStats[key];
        }
      }
    }

    for (const type of SIDEBAR_NODE_TYPES) {
      if (!(type in counts)) counts[type] = 0;
    }

    delete counts["Drug target"];
    return counts;
  }, [nodes]);

  // Count currently visible relationships.
  const relCounts = useMemo(() => {
    const counts = {};

    for (const link of displayedLinks) {
      if (link.type) {
        counts[link.type] = (counts[link.type] || 0) + 1;
      }
    }

    return counts;
  }, [displayedLinks]);

  // Keep all relationship types available in the legend.
  const relationshipTypes = useMemo(() => {
    return [
      ...new Set(
        links
          .map((link) => link.type)
          .filter(Boolean)
      ),
    ].sort();
  }, [links]);

  // Keep category ordering stable, even when categories are hidden.
  const types = useMemo(() => {
    return [...SIDEBAR_NODE_TYPES].sort(
      (a, b) =>
        typeCounts[b] - typeCounts[a] || a.localeCompare(b)
    );
  }, [typeCounts]);

  // Count visible gene-comparison groups.
  const sideCounts = useMemo(() => {
    const counts = { a: 0, b: 0, shared: 0 };

    for (const node of displayedNodes) {
      if (node.type !== "Gene") continue;

      const side = node.raw?.side;

      if (side && Object.hasOwn(counts, side)) {
        counts[side] += 1;
      }
    }

    return counts;
  }, [displayedNodes]);

  const comparisonGroups = [
    {
      key: "a",
      label: "Group A only",
      color: SIDE_COLORS.a,
    },
    {
      key: "b",
      label: "Group B only",
      color: SIDE_COLORS.b,
    },
    {
      key: "shared",
      label: "Shared by both",
      color: SIDE_COLORS.shared,
    },
  ];

  return (
    <aside className="flex h-full max-h-full w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-800 bg-slate-900 p-4 text-sm text-slate-100 max-md:h-auto max-md:max-h-[42vh] max-md:w-full max-md:border-r-0 max-md:border-b">
      {/* Dataset header */}
      <header>
        <h2 className="text-lg font-bold text-white">
          {dataset?.name}
        </h2>

        {dataset?.subtitle && (
          <p className="mt-1 text-xs text-slate-400">
            {dataset.subtitle}
          </p>
        )}
      </header>

      {/* Graph statistics */}
      <section
        aria-label="Graph statistics"
        className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800 bg-slate-800/50 p-3"
      >
        <Stat
          label="Visible nodes"
          value={displayedNodes.length}
          detail={`of ${formatNumber(nodes.length)} total`}
        />

        <Stat
          label="Visible edges"
          value={displayedLinks.length}
          detail={`of ${formatNumber(links.length)} total`}
        />

        <Stat label="Node types" value={types.length} />

        <Stat
          label="Relationship types"
          value={relationshipTypes.length}
        />
      </section>

      {/* Disease comparison */}
      {dataset?.isPair && dataset?.stats && (
        <section className="space-y-2">
          <SectionTitle>Comparison</SectionTitle>

          <dl className="space-y-1 rounded-lg border border-slate-800 bg-slate-800/40 p-2">
            {dataset.stats.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-3 border-b border-slate-800/60 py-1 last:border-none"
              >
                <dt className="text-slate-400">{label}</dt>
                <dd className="font-medium text-slate-200">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Comparison gene colors */}
      {sideMode && (
        <section className="space-y-2">
          <SectionTitle>Gene colours</SectionTitle>

          <ul className="space-y-2">
            {comparisonGroups.map((group) => (
              <li
                key={group.key}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-slate-300">
                    {group.label}
                  </span>
                </div>

                <span className="text-xs text-slate-400">
                  {formatNumber(sideCounts[group.key])}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Entity visibility filters */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle>Show on the graph</SectionTitle>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onSetAll?.(false, types)}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-blue-500 hover:bg-slate-800"
            >
              Show all
            </button>

            <button
              type="button"
              onClick={() => onSetAll?.(true, types)}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:border-blue-500 hover:bg-slate-800"
            >
              Hide all
            </button>
          </div>
        </div>

        <ul className="space-y-2">
          {types.map((type) => {
            const checked = !hiddenTypes.has(type);
            const totalCount = typeCounts[type];

            return (
              <li key={type}>
                <label className="group flex cursor-pointer items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleType?.(type)}
                      className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />

                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          NODE_COLORS[type] || DEFAULT_NODE_COLOR,
                      }}
                    />

                    <span className="truncate text-slate-300 transition-colors group-hover:text-white">
                      {type}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs tabular-nums text-slate-400">
                    {formatNumber(totalCount)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-slate-500">
          Select a node type to show or hide it on the graph.
        </p>
      </section>

      {/* Relationship legend */}
      <section className="space-y-2 border-t border-slate-800 pt-3">
        <SectionTitle>Relationships</SectionTitle>

        <ul className="space-y-2">
          {relationshipTypes.map((type) => (
            <li
              key={type}
              title={EDGE_HELP[type] || type}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-1 w-4 shrink-0 rounded"
                  style={{
                    backgroundColor:
                      EDGE_COLORS[type] || DEFAULT_EDGE_COLOR,
                  }}
                />

                <span className="truncate text-xs capitalize text-slate-300">
                  {type.replace(/_/g, " ").toLowerCase()}
                </span>
              </span>

              <span className="shrink-0 text-xs tabular-nums text-slate-400">
                {formatNumber(relCounts[type] || 0)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
  );
}

function Stat({ label, value, detail }) {
  return (
    <div className="flex min-w-0 flex-col border-l-2 border-slate-700 pl-3">
      <span className="text-xs text-slate-400">{label}</span>
      <strong className="text-lg font-bold tabular-nums text-white">
        {formatNumber(value)}
      </strong>
      {detail && (
        <span className="text-xs text-slate-500">{detail}</span>
      )}
    </div>
  );
}