import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Team from "./pages/Team.jsx";
import Contact from "./pages/Contact.jsx";
import DiseasePage from "./pages/DiseasePage.jsx";
import ComparePage from "./pages/ComparePage.jsx";

export default function App() {
  const { pathname } = useLocation();
  const isGraphPage =
    /^\/disease\/[^/]+$/.test(pathname) ||
    /^\/compare\/[^/]+\/[^/]+$/.test(pathname);
  const isComparePage = pathname === "/compare";

  return (
    <div
      className={`app${isGraphPage ? " graph-app" : ""}${isComparePage ? " compare-app" : ""}`}
    >
      <Header />
      <main
        className={`main${isGraphPage ? " graph-main" : ""}${isComparePage ? " compare-main" : ""}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/disease/:id" element={<DiseasePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/compare/:a/:b" element={<ComparePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<p className="state">Page not found.</p>} />
        </Routes>
      </main>
      {!isGraphPage && (
        <footer className="footer">
          MediGraph is an educational demo and does not provide medical advice.
        </footer>
      )}
    </div>
  );
}
