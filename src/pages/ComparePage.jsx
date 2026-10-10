import { useParams } from "react-router-dom";
import GraphExplorer from "../components/GraphExplorer.jsx";

export default function ComparePage() {
  const { a, b } = useParams();
  return <GraphExplorer key={`${a}+${b}`} a={a} b={b} />;
}
