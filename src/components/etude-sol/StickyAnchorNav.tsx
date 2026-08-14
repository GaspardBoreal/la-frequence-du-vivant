import React from 'react';
import { Mail } from 'lucide-react';

export interface AnchorItem {
  id: string;
  label: string;
  short: string;
}

export const StickyAnchorNav: React.FC<{
  items: AnchorItem[];
  contactHref: string;
}> = ({ items, contactHref }) => {
  const [active, setActive] = React.useState(items[0]?.id ?? '');

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.05, 0.25, 0.6] },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className="sticky top-0 z-40 border-y border-[hsl(var(--ds-forest))]/20 bg-[hsl(var(--ds-cream))]/92 backdrop-blur-md"
      aria-label="Sections de la page"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => go(i.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
              active === i.id
                ? 'border-transparent bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))] shadow-sm'
                : 'border-[hsl(var(--ds-forest))]/30 bg-transparent text-[hsl(var(--ds-forest-deep))]/80 hover:bg-[hsl(var(--ds-forest))]/10'
            }`}
          >
            <span className="hidden sm:inline">{i.label}</span>
            <span className="sm:hidden">{i.short}</span>
          </button>
        ))}
        <a
          href={contactHref}
          className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--ds-gold))]/60 bg-[hsl(var(--ds-gold))]/15 px-3.5 py-1.5 text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))] transition hover:bg-[hsl(var(--ds-gold))]/30 md:inline-flex"
        >
          <Mail className="h-3.5 w-3.5" /> Nous contacter
        </a>
      </div>
    </nav>
  );
};

export default StickyAnchorNav;
