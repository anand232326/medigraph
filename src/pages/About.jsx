export default function About() {
  return (
    <div className="page">
      <h1>About MediGraph</h1>
      <p>
        MediGraph is a disease analysis tool that shows how a disease connects to genes, proteins,
        pathways, drugs, biomarkers, phenotypes and publications. Search a disease and it becomes the
        central node of a knowledge graph. Click any node to expand its own connections and keep exploring.
      </p>
      <p>
        Each link between a gene and a disease comes with the publications (PubMed IDs) and evidence
        sentences it is based on, so you can check the source yourself.
      </p>
    </div>
  );
}
