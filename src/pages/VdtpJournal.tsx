import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, Eye, Ruler, BookOpen, Compass, ArrowRight, ArrowUpRight, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Footer from '@/components/Footer';
import {
  JOURNAL_ENTRIES,
  JOURNAL_THEME_LABEL,
  type JournalTheme,
} from '@/content/vdtp/journal';
import { PARTNER_AUDIT_PASSWORD } from '@/lib/partnerAudits';

const STORAGE_KEY = 'vdtp-configurateur-unlocked';

const THEME_ICON: Record<JournalTheme, React.ComponentType<{ className?: string }>> = {
  observer: Eye,
  mesurer: Ruler,
  raconter: BookOpen,
  piloter: Compass,
};

const THEME_ORDER: JournalTheme[] = ['observer', 'mesurer', 'raconter', 'piloter'];

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${iso}T12:00:00`),
  );

const VdtpJournal: React.FC = () => {
  const [unlocked, setUnlocked] = React.useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1',
  );
  const [pwd, setPwd] = React.useState('');
  const [pwdError, setPwdError] = React.useState(false);
  const [theme, setTheme] = React.useState<JournalTheme | 'all'>('all');

  const entries = React.useMemo(() => {
    const sorted = [...JOURNAL_ENTRIES].sort((a, b) => b.date.localeCompare(a.date));
    return theme === 'all' ? sorted : sorted.filter((e) => e.theme === theme);
  }, [theme]);

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--ds-cream))] px-6">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Journal des briques — espace partenaire</title>
        </Helmet>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwd.trim().toUpperCase() === PARTNER_AUDIT_PASSWORD) {
              sessionStorage.setItem(STORAGE_KEY, '1');
              setUnlocked(true);
            } else {
              setPwdError(true);
            }
          }}
          className="w-full max-w-sm space-y-5 rounded-3xl border border-[hsl(var(--ds-line))] bg-white/70 p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-forest))]/10">
            <Lock className="h-6 w-6 text-[hsl(var(--ds-forest-deep))]" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ds-ink-soft))]">
              Espace partenaire
            </p>
            <h1 className="font-serif text-xl text-[hsl(var(--ds-forest-deep))]">
              Ver de Terre Production
            </h1>
            <p className="text-sm text-[hsl(var(--ds-ink-soft))]">
              Ce journal est protégé. Saisissez le mot de passe transmis.
            </p>
          </div>
          <Input
            autoFocus
            type="password"
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              setPwdError(false);
            }}
            placeholder="Mot de passe"
            className="text-center tracking-widest"
          />
          {pwdError && <p className="text-xs text-destructive">Mot de passe incorrect.</p>}
          <Button type="submit" className="w-full">
            Ouvrir le journal
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))]">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Journal des briques — VDTP × La Fréquence du Vivant</title>
      </Helmet>

      {/* En-tête : même ton que la page de négociation */}
      <header className="border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest-deep))] px-5 py-10 text-[hsl(var(--ds-cream))] sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--ds-gold))]">
            Proposition · Ver de Terre Production
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
            Le journal des briques
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[hsl(var(--ds-cream))]/85 sm:text-base">
            Depuis la proposition du 9 juillet 2026, chaque brique livrée est consignée ici :
            datée, décrite en langage métier, reliée à sa démo. Briques livrées et en cours —
            mise à jour à chaque livraison.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-[hsl(var(--ds-cream))]/40 bg-transparent text-[hsl(var(--ds-cream))] hover:bg-[hsl(var(--ds-cream))]/10 hover:text-[hsl(var(--ds-cream))]">
              <Link to="/offre-VDT-MDV">
                Relire la proposition <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="bg-[hsl(var(--ds-gold))] text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-gold))]/90">
              <Link to="/partenaires/vdtp/configurateur">
                Ouvrir le configurateur <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Filtres par thème */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setTheme('all')}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              theme === 'all'
                ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-forest-deep))]'
            }`}
          >
            Tout · {JOURNAL_ENTRIES.length}
          </button>
          {THEME_ORDER.map((t) => {
            const Icon = THEME_ICON[t];
            const count = JOURNAL_ENTRIES.filter((e) => e.theme === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
                  theme === t
                    ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                    : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-forest-deep))]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {JOURNAL_THEME_LABEL[t]} · {count}
              </button>
            );
          })}
        </div>

        {/* Frise chronologique */}
        <div className="relative mt-8 border-l-2 border-[hsl(var(--ds-line))] pl-6 sm:pl-8">
          {entries.map((entry, i) => {
            const Icon = THEME_ICON[entry.theme];
            return (
              <motion.article
                key={`${entry.date}-${entry.titre}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                className="relative mb-8 last:mb-0"
              >
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-cream))] sm:-left-[39px]" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ds-ink-soft))]">
                  {formatDate(entry.date)}
                </p>
                <div className="mt-2 rounded-3xl border border-[hsl(var(--ds-line))] bg-white/70 p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--ds-forest))]/30 bg-[hsl(var(--ds-forest))]/10">
                      <Icon className="h-4 w-4 text-[hsl(var(--ds-forest-deep))]" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg leading-snug text-[hsl(var(--ds-forest-deep))] sm:text-xl">
                        {entry.titre}
                      </h2>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ds-ink-soft))]">
                        {JOURNAL_THEME_LABEL[entry.theme]}
                        {entry.statut === 'en_cours' && ' · en cours'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--ds-ink-soft))]">
                    {entry.description}
                  </p>
                  {entry.lien && (
                    <Link
                      to={entry.lien}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--ds-forest))] underline-offset-4 hover:underline"
                    >
                      {entry.lienLabel ?? 'Voir'} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Pied */}
        <div className="mt-12 rounded-3xl border border-dashed border-[hsl(var(--ds-line))] bg-white/50 p-5 text-center sm:p-7">
          <Sparkles className="mx-auto h-5 w-5 text-[hsl(var(--ds-gold))]" />
          <p className="mt-2 font-serif text-lg text-[hsl(var(--ds-forest-deep))]">
            La suite s'écrit à chaque livraison.
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--ds-ink-soft))]">
            Une brique livrée = une entrée datée dans ce journal, reliée à sa démonstration.
          </p>
        </div>
      </main>

      <div className="bg-background">
        <Footer variant="marches" />
      </div>
    </div>
  );
};

export default VdtpJournal;
