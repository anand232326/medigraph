import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/compare", label: "Compare Diseases" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/contact", label: "Contact Us" },
];

export default function Header() {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 shadow-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
        MediGraph
      </NavLink>
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium sm:gap-6 sm:text-sm">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              isActive
                ? "text-blue-400 font-semibold transition-colors"
                : "text-slate-400 hover:text-slate-200 transition-colors"
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}