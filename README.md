# MediGraph

MediGraph is a React + Vite disease knowledge graph explorer. It lets users search diseases, view disease-linked genes, pathways, drugs, and publications, and compare two diseases side by side in an interactive graph.

## What this app does

- Search for a disease from the homepage or from any graph page
- Open a disease graph where the disease sits at the center
- Explore directly connected genes, pathways, drugs, biomarkers, and related entities
- Click nodes to inspect details and publication evidence
- Compare two diseases and highlight genes unique to each disease versus shared genes
- Review source PubMed links and evidence sentences behind each relationship

## Stack

- React 18
- Vite
- React Router DOM
- Tailwind CSS
- react-force-graph-2d

## Quick start

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Project flow

The data flow in this project is:

1. Raw disease data is stored in `public/data/diseases.json`.
2. `src/api/diseaseApi.js` loads the JSON and exposes helpers like `getDiseaseGraph`, `getComparisonGraph`, and `searchDiseases`.
3. `src/utils/normalise.js` converts each JSON disease entry into the UI-friendly graph shape used by the front-end.
4. `src/utils/graphUtils.js` builds the initial graph and adjacency indexes so the app can show neighbors and expand graph connections.
5. `src/pages/Home.jsx`, `src/pages/DiseasePage.jsx`, and `src/pages/ComparePage.jsx` route the user to the appropriate graph view.
6. `src/components/GraphExplorer.jsx` loads the disease data, creates the graph state, manages filters, and resolves the selected node.
7. `src/components/GraphView.jsx` renders the force-directed network canvas.
8. `src/components/GraphSidebar.jsx` and `src/components/NodeDetails.jsx` show the dataset summary, legend, filters, and clicked-node metadata.
9. Evidence and PubMed references are displayed via `src/components/EvidenceList.jsx`.

## Data model

The disease dataset is a JSON array. Each entry is either:

- a single disease object with `id`, `name`, `nodes`, `edges`, `regulated`, `totals`, and optionally `subtitle`
- a comparison object with `mode: "pair"`, `a`, `b`, `stats`, and `subtitle`

Every record needs a unique `id`, a `name`, and `nodes` and `edges` arrays. Each node needs a unique `id`, `kind`, and `label`; each edge needs `source`, `target`, and `kind`, and both endpoints must exist in that record's `nodes`. Mark the disease node with `"focus": true` (two focused disease nodes for a comparison). For comparisons, `a` and `b` must reference those disease nodes.

For example, add another disease as a new object in the JSON array:

```json
{
  "id": "DIS:example",
  "name": "Example condition",
  "nodes": [
    { "id": "DIS:example", "kind": "disease", "label": "Example condition", "focus": true },
    { "id": "GENE:EXAMPLE1", "kind": "gene", "label": "EXAMPLE1", "description": "Example gene" },
    { "id": "DATA:EXAMPLE1", "kind": "imaging_dataset", "label": "Example dataset", "sample_count": 12 }
  ],
  "edges": [
    { "source": "DIS:example", "target": "GENE:EXAMPLE1", "kind": "associated" },
    { "source": "DIS:example", "target": "DATA:EXAMPLE1", "kind": "has_data" }
  ]
}
```

Each node has fields such as:

- `id`
- `kind` (for example `gene`, `pathway`, `drug`, `disease`)
- `label`
- `description`
- `confidence`
- `sources`
- `pmids`
- `direction`
- `stats` for disease nodes

Each edge contains the source and target IDs and a relationship type such as `ASSOCIATED`, `PATHWAY_OF`, `DRUG_FOR`, `TARGETS`, or `SHARES_GENES`.

Node kinds are not limited to the examples above: new kinds are automatically normalized, listed as graph filters, and shown with their additional JSON fields when selected. Known kinds keep their specialized details and colors; unknown kinds use a default color. `totals` is optional for single-disease records: missing gene, variant, publication, pathway, drug, and biomarker totals are counted from `nodes`. Explicit values in `totals` are kept, which lets you provide full-dataset counts when the graph only contains a subset of records. The app validates the data file when it loads and reports which record, node, or edge needs correction.

## File-by-file overview

### Root files

- `package.json` — project metadata and scripts (`dev`, `build`, `preview`).
- `index.html` — HTML shell for the Vite app.
- `README.md` — project overview and developer documentation.
- `.env.example` — example environment file for local setup.

### App shell

- `src/main.jsx` — boots React, wraps the app in `BrowserRouter`, and mounts it into the root element.
- `src/App.jsx` — sets up the route table and shared app layout.
- `src/index.css` — global styling and Tailwind import.

### Routing pages

- `src/pages/Home.jsx` — homepage with search, featured disease cards, and summary comparison cards.
- `src/pages/DiseasePage.jsx` — page for a single disease graph.
- `src/pages/ComparePage.jsx` — page for a disease-to-disease comparison view.
- `src/pages/About.jsx` — about-page content.
- `src/pages/Team.jsx` — team listing page.
- `src/pages/Contact.jsx` — contact form page with a placeholder submit action.

### Search and data access

- `src/api/diseaseApi.js` — loads the disease dataset from `public/data/diseases.json`, supports search, disease listing, comparison lookup, and graph retrieval.

### Graph logic and utilities

- `src/utils/normalise.js` — maps raw node and edge JSON into normalized graph objects with consistent `type` values.
- `src/utils/graphConfig.js` — defines node colors, edge colors, labels, type mappings, and helper formatting functions.
- `src/utils/graphUtils.js` — builds adjacency indexes, merges node/edge data, and creates the initial graph view.

### UI components

- `src/components/Header.jsx` — top navigation bar with site links.
- `src/components/SearchBar.jsx` — disease search input with live filtering and navigation to disease pages.
- `src/components/DiseaseCard.jsx` — summary card for a disease on the homepage.
- `src/components/GraphExplorer.jsx` — central page-level graph controller; fetches data, handles filtering, selection, and loading states.
- `src/components/GraphView.jsx` — renders the interactive force graph with node painting, labeling, zoom, selection, and resize logic.
- `src/components/GraphSidebar.jsx` — sidebar with graph statistics, dataset totals, filters, and comparison legend.
- `src/components/NodeDetails.jsx` — details panel shown for the selected node, including facts, evidence links, and connections.
- `src/components/EvidenceList.jsx` — displays PubMed evidence sentences and metadata for a selected link.

### Data source

- `public/data/diseases.json` — main disease graph database used by the app. This is the file you edit or extend when adding new diseases or comparison datasets.

## Typical development workflow

1. Add or update the disease records in `public/data/diseases.json`.
2. Run the app with `npm run dev`.
3. Search for the disease in the UI.
4. Inspect the graph, node details, and evidence panel.
5. If needed, adjust graph styling or logic in the utility/components files.

## Notes

- Diseases without a dedicated graph entry still appear in search results as “No data yet” until they have their own dataset row.
- The app is designed for educational and research exploration rather than clinical decision-making.
- The footer includes the warning that the app does not provide medical advice.

## Extension ideas

- add server-side data persistence or API endpoints
- add disease comparison analytics beyond the side-by-side graph
- add export/share buttons for a graph or evidence summary
- add richer filtering by node type or relationship type
- improve accessibility and mobile responsiveness
