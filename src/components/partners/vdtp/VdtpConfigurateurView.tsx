import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, Printer, ListChecks, CalendarCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import PriceHeader from '@/components/partners/vdtp/PriceHeader';
import OptionCard from '@/components/partners/vdtp/OptionCard';
import RecapSheet from '@/components/partners/vdtp/RecapSheet';
import ConfigPrintLayout from '@/components/partners/vdtp/ConfigPrintLayout';
import { VdtpNav, VdtpSeeAlso } from '@/components/partners/vdtp/VdtpNav';
import { CATALOG_2026_09_18, type VdtpCatalog } from '@/content/vdtp/configurateur-2026-09-18';
import { computePrice, decodeSelection, encodeSelection, formatEuro, maxPrice } from '@/lib/vdtp/pricing';
import { PARTNER_AUDIT_PASSWORD } from '@/lib/partnerAudits';

const STORAGE_KEY = 'vdtp-configurateur-unlocked';
type Scope = 'officiel' | 'nouveautes' | 'tout';

interface Props {
  mode: 'officiel' | 'enrichi';
  catalog: VdtpCatalog;
}

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${iso}T12:00:00`),
  );

const VdtpConfigurateurView: React.FC<Props> = ({ mode, catalog }) => {
  const CONFIG_OPTIONS = catalog.options;
  const CONFIG_PRESETS = catalog.presets;
  const OPTION_BY_ID = catalog.byId;
  const CORE_IDS = CONFIG_OPTIONS.filter((o) => o.core).map((o) => o.id);
  const officialIds = React.useMemo(
    () => new Set(CATALOG_2026_09_18.options.map((o) => o.id)),
    [],
  );
  const newCount = CONFIG_OPTIONS.filter((o) => !officialIds.has(o.id)).length;
  const [scope, setScope] = React.useState<Scope>('tout');
  const CONFIG_GRIDS = React.useMemo(
    () =>
      catalog.grids
        .map((g) => ({
          ...g,
          optionIds: g.optionIds.filter((id) =>
            scope === 'tout' ? true : scope === 'officiel' ? officialIds.has(id) : !officialIds.has(id),
          ),
        }))
        .filter((g) => g.optionIds.length > 0),
    [catalog, scope, officialIds],
  );
  const [params, setParams] = useSearchParams();
  const [unlocked, setUnlocked] = React.useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1',
  );
  const [pwd, setPwd] = React.useState('');
  const [pwdError, setPwdError] = React.useState(false);

  const [selected, setSelected] = React.useState<string[]>(() => {
    const fromUrl = decodeSelection(params.get('s'), catalog);
    return fromUrl.length > 0
      ? fromUrl
      : (CONFIG_PRESETS.find((p) => p.id === 'recommande')?.optionIds ?? []);
  });
  const [gridId, setGridId] = React.useState(CONFIG_GRIDS[0].id);
  const [recapOpen, setRecapOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const code = encodeSelection(selected, catalog);
    const next = new URLSearchParams(params);
    next.set('s', code);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const price = React.useMemo(() => computePrice(selected, catalog), [selected, catalog]);
  const grid = CONFIG_GRIDS.find((g) => g.id === gridId) ?? CONFIG_GRIDS[0];
  const officialPart = computePrice(selected.filter((id) => officialIds.has(id)), CATALOG_2026_09_18);
  const coreMissing = CORE_IDS.filter((id) => !selected.includes(id));

  const toggle = (id: string) => {
    const option = OPTION_BY_ID.get(id);
    if (!option) return;
    setSelected((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
        if (option.core) {
          // Décrocher une brique socle retire les briques qui en dépendent.
          let removed = 0;
          CONFIG_OPTIONS.forEach((o) => {
            if (o.requires?.includes(id) && set.has(o.id)) {
              set.delete(o.id);
              removed += 1;
            }
          });
          if (removed > 0) {
            toast.info(
              `« ${option.label} » est une brique socle : ${removed} brique${
                removed > 1 ? 's' : ''
              } qui en dépend${removed > 1 ? 'ent' : ''} ${removed > 1 ? 'ont' : 'a'} été retirée${
                removed > 1 ? 's' : ''
              }.`,
            );
          }
        }
      } else {
        set.add(id);
        (option.requires ?? []).forEach((req) => set.add(req));
      }
      return CONFIG_OPTIONS.filter((o) => set.has(o.id)).map((o) => o.id);
    });
  };

  const applyPreset = (ids: string[]) => {
    setSelected(CONFIG_OPTIONS.filter((o) => ids.includes(o.id)).map((o) => o.id));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Lien de la sélection copié.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Impossible de copier le lien depuis ce navigateur.");
    }
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--ds-cream))] px-6">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <title>Configurateur Jardin nourricier — espace partenaire</title>
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
              Ce configurateur est protégé. Saisissez le mot de passe transmis.
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
            Ouvrir le configurateur
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--ds-cream))] pb-28 print:bg-white print:pb-0">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{mode === 'officiel' ? 'Configurateur 18.09.2026 (officiel)' : 'Configurateur enrichi'} — VDTP × La Fréquence du Vivant</title>
      </Helmet>

      <ConfigPrintLayout catalog={catalog} selected={selected} price={price} />

      <div className="print:hidden">
        <VdtpNav active={mode} />
        {/* En-tête */}
        <header className="border-b border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest-deep))] px-5 py-8 text-[hsl(var(--ds-cream))] sm:px-8 sm:py-12">
          <div className="mx-auto w-full max-w-5xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--ds-gold))]">
              Ver de Terre Production × bziiit · PiloTerra
            </p>
            {mode === 'officiel' ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-gold))]/60 px-3 py-1 text-xs text-[hsl(var(--ds-cream))]">
                <CalendarCheck className="h-3.5 w-3.5" /> Présentation officielle — 18 septembre 2026 · version de référence, non modifiée
              </p>
            ) : (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-gold))]/60 px-3 py-1 text-xs text-[hsl(var(--ds-cream))]">
                <Sparkles className="h-3.5 w-3.5" /> Version enrichie · 18.09.2026 + {newCount} brique{newCount > 1 ? 's' : ''} livrée{newCount > 1 ? 's' : ''} depuis
              </p>
            )}
            <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-5xl">
              Jardin nourricier — que reprenez-vous du socle ?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[hsl(var(--ds-cream))]/85 sm:text-base">
              Le même patrimoine, lu de trois façons. Cochez ce que vous voulez dans Jardin
              nourricier : le montant se recalcule à chaque choix. Tout retenu : {formatEuro(maxPrice(catalog))}. Rien
              retenu : 0 €. Une seule brique : le plancher de 15 000 €.
              {mode === 'enrichi' &&
                " Le périmètre du 18.09.2026 garde exactement son prix : les nouveautés s'ajoutent au-delà de 50 000 €."}
            </p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 sm:py-10">
          <PriceHeader catalog={catalog} price={price} selected={selected} totalOptions={CONFIG_OPTIONS.length} />

          {mode === 'enrichi' && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ds-ink-soft))]">Périmètre 18.09.2026</p>
                  <p className="mt-1 text-lg font-semibold text-[hsl(var(--ds-forest-deep))]">{formatEuro(officialPart)}</p>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--ds-gold))] bg-white/60 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ds-ink-soft))]">Valeur ajoutée depuis</p>
                  <p className="mt-1 text-lg font-semibold text-[hsl(var(--ds-forest-deep))]">+ {formatEuro(Math.max(0, price - officialPart))}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Périmètre">
                {([
                  ['tout', 'Tout'],
                  ['officiel', 'Périmètre du 18.09'],
                  ['nouveautes', `Nouveautés depuis (${newCount})`],
                ] as [Scope, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={scope === id}
                    onClick={() => {
                      setScope(id);
                      if (id === 'nouveautes') setGridId('nouveautes');
                      else if (gridId === 'nouveautes' && id === 'officiel') setGridId(catalog.grids[0].id);
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                      scope === id
                        ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/20 text-[hsl(var(--ds-forest-deep))]'
                        : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-ink-soft))]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Paniers préparés */}
          <div className="mt-5 flex flex-wrap gap-2">
            {CONFIG_PRESETS.map((preset) => {
              const presetPrice = computePrice(preset.optionIds, catalog);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.optionIds)}
                  className="group flex-1 min-w-[150px] rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 px-4 py-3 text-left transition-colors hover:border-[hsl(var(--ds-forest))]"
                >
                  <p className="text-sm font-semibold text-[hsl(var(--ds-forest-deep))]">
                    {preset.label} · {formatEuro(presetPrice)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[hsl(var(--ds-ink-soft))]">{preset.hint}</p>
                </button>
              );
            })}
          </div>

          {/* Onglets de grille */}
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {CONFIG_GRIDS.map((g) => {
              const count = g.optionIds.filter((id) => selected.includes(id)).length;
              const active = g.id === gridId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGridId(g.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                      : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-forest-deep))]'
                  }`}
                >
                  <span className="mr-1.5 text-[11px] opacity-70">{g.number}</span>
                  {g.label}
                  <span className="ml-2 text-[11px] opacity-80">
                    {count}/{g.optionIds.length}
                  </span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={grid.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--ds-ink-soft))]">
              {grid.tagline}
            </p>
            <p className="mt-1 text-sm text-[hsl(var(--ds-ink-soft))]">{grid.audience}</p>

            {coreMissing.length > 0 && (
              <p className="mt-4 rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-white/50 p-3 text-[13px] text-[hsl(var(--ds-ink-soft))]">
                Briques socle non retenues :{' '}
                {coreMissing.map((id) => OPTION_BY_ID.get(id)?.label).join(', ')}. Les briques qui
                en dépendent les réactiveront automatiquement.
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {grid.optionIds.map((id) => {
                const option = OPTION_BY_ID.get(id)!;
                return (
                  <div key={id} className="relative">
                    {option.addedOn && (
                      <span className="pointer-events-none absolute -top-2 right-3 z-10 rounded-full bg-[hsl(var(--ds-gold))] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                        Nouveau · {formatDay(option.addedOn)}
                      </span>
                    )}
                    <OptionCard option={option} selected={selected.includes(id)} onToggle={toggle} />
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Règle du jeu */}
          <section className="mt-10 rounded-3xl border border-[hsl(var(--ds-line))] bg-white/60 p-5 sm:p-7">
            <h2 className="font-serif text-xl text-[hsl(var(--ds-forest-deep))]">
              Comment le prix est calculé
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-[hsl(var(--ds-forest-deep))] p-4 text-[12px] leading-relaxed text-[hsl(var(--ds-cream))]">
{`aucune brique retenue  →  0 €
au moins une brique    →  15 000 € + 35 000 € × (poids retenus / poids total)
toutes les briques du 18.09.2026  →  50 000 €`}
            </pre>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--ds-ink-soft))]">
              Chaque brique porte un poids proportionnel au travail déjà réalisé et à la valeur
              qu'elle apporte au jardinier. Le montant est arrondi à la centaine d'euros. Les deux
              tiers sont dus à la commande, le tiers restant uniquement si le projet réussit. La
              prestation de développement (36 jours · 36 000 €) reste une ligne distincte : elle
              paie le travail à venir, pas le socle repris.
            </p>
          </section>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button onClick={() => setRecapOpen(true)} className="flex-1 min-w-[180px]">
              <ListChecks className="mr-1.5 h-4 w-4" /> Voir le récapitulatif
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 min-w-[180px]"
            >
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer / PDF
            </Button>
          </div>
        </main>

        <VdtpSeeAlso active={mode} />

        {/* Bandeau mobile collant */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="font-serif text-xl leading-none text-[hsl(var(--ds-forest-deep))]">
                {formatEuro(price)}
              </p>
              <p className="text-[11px] text-[hsl(var(--ds-ink-soft))]">
                {selected.length} brique{selected.length > 1 ? 's' : ''} retenue
                {selected.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button size="sm" className="ml-auto" onClick={() => setRecapOpen(true)}>
              Récapitulatif
            </Button>
          </div>
        </div>

        {/* Pied de page identique à /association : fond sombre sous le footer */}
        <div className="bg-background">
          <Footer variant="marches" />
        </div>
      </div>

      <RecapSheet
        catalog={catalog}
        open={recapOpen}
        onOpenChange={setRecapOpen}
        selected={selected}
        price={price}
        onCopyLink={copyLink}
        copied={copied}
      />
    </div>
  );
};

export default VdtpConfigurateurView;
