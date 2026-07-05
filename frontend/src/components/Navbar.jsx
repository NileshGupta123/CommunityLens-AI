import { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/predictions", label: "Predictions" },
  { to: "/chat", label: "AI Chat" },
  { to: "/alerts", label: "Alerts" },
];

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
    isActive ? "text-signal border-b-2 border-signal" : "text-ink/70 hover:text-ink"
  }`;

const mobileNavLinkClass = ({ isActive }) =>
  `block px-4 py-3 text-sm font-medium rounded-lg ${
    isActive ? "bg-signal/10 text-signal" : "text-ink/70 hover:bg-ink/5"
  }`;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-ink/10">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="font-display font-semibold text-lg text-ink tracking-tight">
            CommunityLens<span className="text-signal">AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="md:hidden p-2 text-ink" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Toggle menu">
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-ink/10 bg-paper px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={mobileNavLinkClass} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}