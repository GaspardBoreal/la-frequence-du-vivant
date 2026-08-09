import React from 'react';

export const ROADMAP_SECTIONS = [
  { id: 'roadmap-01', index: '01', label: "Ce qui est ressorti de l'entretien", short: 'Entretien' },
  { id: 'roadmap-02', index: '02', label: "Lecture d'ensemble", short: "Lecture d'ensemble" },
  { id: 'roadmap-03', index: '03', label: 'Les chantiers, par ordre de priorité', short: 'Chantiers' },
  { id: 'roadmap-04', index: '04', label: 'Planning', short: 'Planning' },
  { id: 'roadmap-05', index: '05', label: "Extraits de l'entretien", short: 'Extraits' },
] as const;

/**
 * Sommaire collant de la feuille de route : ancres vers les 5 sections,
 * avec mise en évidence automatique de la section à l'écran.
 */
export const RoadmapTocNav: React.FC<{
  /** Conteneur scrollable (panneau CRM) ; par défaut la fenêtre. */
  scrollRoot?: HTMLElement | null;
  className?: string;
  /** Variante compacte pour intégration dans le drawer CRM. */
  embedded?: boolean;
}> = ({ scrollRoot, className, embedded }) => {
  const [active, setActive] = React.useState<string>(ROADMAP_SECTIONS[0].id);

  React.useEffect(() => {
    const els = ROADMAP_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (e): e is HTMLElement => Boolean(e),
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      {
        root: scrollRoot ?? null,
        rootMargin: '-15% 0px -70% 0px',
        threshold: 0,
      },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [scrollRoot]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Sommaire de la feuille de route"
      className={`${embedded ? '' : 'sticky top-[52px]'} z-20 border-b border-border/50 bg-background/85 backdrop-blur print:hidden ${className ?? ''}`}
    >
      <div
        className={`mx-auto flex w-full ${embedded ? '' : 'max-w-5xl px-6'} items-center justify-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {ROADMAP_SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span
                className={`font-mono text-[10px] tracking-widest ${
                  isActive ? 'text-primary' : 'text-muted-foreground/60'
                }`}
              >
                {s.index}
              </span>
              <span className="whitespace-nowrap font-medium">{s.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default RoadmapTocNav;
