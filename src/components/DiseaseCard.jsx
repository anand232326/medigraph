import { Link } from "react-router-dom";

const CHIPS = [
  ["genes", "Genes"],
  ["variants", "Variants"],
  ["papers", "Publications"],
  ["drugs", "Drugs"],
  ["pathways", "Pathways"],
];

export default function DiseaseCard({ disease, rank }) {
  return (
    <Link to={`/disease/${disease.id}`} className="card">
      <span className="card-rank">{rank}</span>
      <h3>{disease.name}</h3>
      <dl className="card-stats">
        {CHIPS.filter(([key]) => disease.totals[key] != null).map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{Number(disease.totals[key]).toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <span className="card-link">Explore graph →</span>
    </Link>
  );
}
