import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';

/** Barre de navigation publique de la série d'entretiens. */
const EntretienNav: React.FC = () => (
  <div className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur">
    <div className="mx-auto flex max-w-5xl items-center gap-3 overflow-x-auto px-4 py-3">
      <Link to="/entretiens" className="flex shrink-0 items-center gap-2 pr-2 text-sm font-medium text-foreground">
        <MessagesSquare className="h-4 w-4 text-primary" /> Entretiens
      </Link>
      <nav className="flex items-center gap-1.5 text-sm">
        {[
          { to: '/marches-du-vivant', label: 'Les Marches du Vivant' },
          { to: '/roadmap/frequence-jardin', label: 'Fréquence Jardin' },
          { to: '/marches-du-vivant/association', label: 'Association' },
        ].map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </div>
);

export default EntretienNav;
