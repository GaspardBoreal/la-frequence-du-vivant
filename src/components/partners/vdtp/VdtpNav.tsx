import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarCheck, Sparkles, ArrowUpRight } from 'lucide-react';

export type VdtpPage = 'journal' | 'officiel' | 'enrichi';

const PAGES: {
  id: VdtpPage;
  to: string;
  label: string;
  short: string;
  Icon: React.ComponentType<{ className?: string }>;
  keepSelection?: boolean;
}[] = [
  { id: 'journal', to: '/partenaires/vdtp/journal', label: 'Journal des briques', short: 'Journal', Icon: BookOpen },
  {
    id: 'officiel',
    to: '/partenaires/vdtp/configurateur-18-09-2026',
    label: 'Configurateur 18.09.2026',
    short: '18.09.2026',
    Icon: CalendarCheck,
    keepSelection: true,
  },
  {
    id: 'enrichi',
    to: '/partenaires/vdtp/configurateur',
    label: 'Configurateur enrichi',
    short: 'Enrichi',
    Icon: Sparkles,
    keepSelection: true,
  },
];

const useHref = () => {
  const [params] = useSearchParams();
  const s = params.get('s');
  return (p: (typeof PAGES)[number]) => (p.keepSelection && s ? `${p.to}?s=${s}` : p.to);
};

/** Barre partagée, collante, identique sur les trois pages de l'espace VDTP. */
export const VdtpNav: React.FC<{ active: VdtpPage }> = ({ active }) => {
  const href = useHref();
  return (
    <nav
      aria-label="Espace partenaire Ver de Terre Production"
      className="sticky top-0 z-50 border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 backdrop-blur print:hidden"
    >
      <div className="mx-auto flex w-full max-w-5xl gap-1.5 px-3 py-2 sm:px-8">
        {PAGES.map((p) => {
          const on = p.id === active;
          return (
            <Link
              key={p.id}
              to={href(p)}
              aria-current={on ? 'page' : undefined}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                on
                  ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                  : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]'
              }`}
            >
              <p.Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate sm:hidden">{p.short}</span>
              <span className="hidden truncate sm:inline">{p.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/** Rappel « Voir aussi » en bas de page : les deux autres pages + la proposition. */
export const VdtpSeeAlso: React.FC<{ active: VdtpPage }> = ({ active }) => {
  const href = useHref();
  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-5 sm:px-8 print:hidden">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--ds-ink-soft))]">Voir aussi</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {PAGES.filter((p) => p.id !== active).map((p) => (
          <Link
            key={p.id}
            to={href(p)}
            className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 px-4 py-3 text-sm text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]"
          >
            <p.Icon className="h-4 w-4" /> {p.label}
          </Link>
        ))}
        <Link
          to="/offre-VDT-MDV"
          className="flex items-center gap-2 rounded-2xl border border-dashed border-[hsl(var(--ds-line))] px-4 py-3 text-sm text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest))]"
        >
          <ArrowUpRight className="h-4 w-4" /> La proposition du 9 juillet 2026
        </Link>
      </div>
    </section>
  );
};
