import { useParams } from "react-router-dom";
import GraphExplorer from "../components/GraphExplorer.jsx";

export default function DiseasePage() {
  const { id } = useParams();
  // key resets the graph whenever a different disease is searched
  return <GraphExplorer key={id} a={id} />;
}
