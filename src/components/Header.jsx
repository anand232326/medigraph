import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/contact", label: "Contact Us" },
];

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <NavLink to="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
        MediGraph
      </NavLink>
      <nav className="flex items-center gap-6 text-sm font-medium">
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