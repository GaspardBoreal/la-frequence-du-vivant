import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Route } from 'lucide-react';
import { AUDIENCES } from '@/lib/roadmap/types';

/** Barre de navigation publique de la Roadmap vivante. */
const RoadmapNav: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/roadmap' || pathname.startsWith('/roadmap/semaine');

  const cls = (active: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
      active
        ? 'bg-primary text-primary-foreground shadow'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-3">
        <span className="flex shrink-0 items-center gap-2 pr-2 text-sm font-medium text-foreground">
          <Route className="h-4 w-4 text-primary" /> Roadmap vivante
        </span>
        <nav className="flex items-center gap-1.5">
          <NavLink to="/roadmap" end className={() => cls(isHome)}>
            Accueil
          </NavLink>
          {AUDIENCES.map((a) => (
            <NavLink
              key={a.slug}
              to={`/roadmap/${a.slug}`}
              className={({ isActive }) => cls(isActive)}
            >
              {a.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default RoadmapNav;
