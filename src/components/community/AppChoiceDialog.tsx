import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Leaf, MapPin, Star, ArrowRight, Radio, Search, X } from 'lucide-react';
import { ProprieteTile } from './ProprieteTile';
import type { ProprieteAccess, PartenaireIotAccess } from '@/hooks/useUserAppsAccess';

const DEFAULT_KEY = 'mdv:default-app';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prenom?: string;
  proprietes: ProprieteAccess[];
  /** Fabricants de sondes dont l'utilisateur est partenaire. */
  partenaires?: PartenaireIotAccess[];
  /** Appelé si le dialogue est fermé sans qu'aucun espace n'ait été choisi. */
  onDismiss?: () => void;
}

type Entry =
  | { kind: 'marcheur'; key: string; target: string; label: string }
  | { kind: 'propriete'; key: string; target: string; label: string; p: ProprieteAccess }
  | { kind: 'partenaire'; key: string; target: string; label: string; f: PartenaireIotAccess };

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function AppChoiceDialog({ open, onOpenChange, prenom, proprietes, partenaires = [], onDismiss }: Props) {
  const navigate = useNavigate();
  const chosenRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [defaultTarget, setDefaultTarget] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      chosenRef.current = false;
      setDefaultTarget(getDefaultAppTarget());
    }
  }, [open]);

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v && !chosenRef.current) onDismiss?.();
  };

  const go = (target: string, remember?: boolean) => {
    chosenRef.current = true;
    if (remember) {
      try { localStorage.setItem(DEFAULT_KEY, target); } catch { /* stockage indisponible */ }
    }
    onOpenChange(false);
    if (target === 'mon-espace') {
      navigate('/marches-du-vivant/mon-espace');
    } else if (target.startsWith('propriete:')) {
      navigate(`/propriete/${target.slice('propriete:'.length)}`);
    } else if (target.startsWith('partenaire-iot:')) {
      navigate(`/partenaire-iot/${target.slice('partenaire-iot:'.length)}`);
    }
  };

  const toggleRemember = (target: string) => {
    const isDefault = defaultTarget === target;
    try {
      if (isDefault) localStorage.removeItem(DEFAULT_KEY);
      else localStorage.setItem(DEFAULT_KEY, target);
    } catch { /* stockage indisponible */ }
    setDefaultTarget(isDefault ? null : target);
  };

  /* ---------------- Données groupées, triées, filtrées ---------------- */

  const sortedProprietes = useMemo(
    () =>
      [...proprietes].sort((a, b) => {
        if (!!a.is_main !== !!b.is_main) return a.is_main ? -1 : 1;
        return a.nom.localeCompare(b.nom, 'fr');
      }),
    [proprietes],
  );

  const sortedPartenaires = useMemo(
    () => [...partenaires].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [partenaires],
  );

  const q = norm(query.trim());
  const match = (...fields: (string | null | undefined)[]) =>
    !q || fields.some((f) => f && norm(f).includes(q));

  const marcheurEntries: Entry[] = match('mon espace marcheur', 'marches', 'carnet')
    ? [{ kind: 'marcheur', key: 'mon-espace', target: 'mon-espace', label: 'Mon Espace Marcheur' }]
    : [];

  const proprieteEntries: Entry[] = sortedProprietes
    .filter((p) => match(p.nom, p.ville, p.role))
    .map((p) => ({ kind: 'propriete', key: p.id, target: `propriete:${p.slug}`, label: p.nom, p }));

  const partenaireEntries: Entry[] = sortedPartenaires
    .filter((f) => match(f.nom, 'partenaire iot'))
    .map((f) => ({ kind: 'partenaire', key: f.id, target: `partenaire-iot:${f.slug}`, label: f.nom, f }));

  const flat = useMemo(
    () => [...marcheurEntries, ...proprieteEntries, ...partenaireEntries],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, proprietes, partenaires],
  );

  const totalSpaces = 1 + proprietes.length + partenaires.length;
  const showSearch = totalSpaces >= 6;

  useEffect(() => { setCursor(0); }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (flat.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => {
        const next = e.key === 'ArrowDown' ? c + 1 : c - 1;
        return (next + flat.length) % flat.length;
      });
    } else if (e.key === 'Enter') {
      const entry = flat[cursor];
      if (entry) {
        e.preventDefault();
        go(entry.target);
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-cursor="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  /* ---------------- Rendu ---------------- */

  const cardBase =
    'group relative overflow-hidden rounded-xl border transition-all p-3 text-left flex items-center gap-3 focus:outline-none';

  const cardTone = (active: boolean) =>
    active
      ? 'border-emerald-300/60 bg-white/[0.14] ring-1 ring-emerald-300/40'
      : 'border-white/12 bg-white/[0.05] hover:bg-white/10 hover:border-white/25';

  const StarToggle = ({ target }: { target: string }) => {
    const isDefault = defaultTarget === target;
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleRemember(target); }}
        title={isDefault ? 'Ne plus ouvrir automatiquement' : 'Toujours ouvrir cet espace'}
        aria-label={isDefault ? 'Ne plus ouvrir automatiquement' : 'Toujours ouvrir cet espace'}
        className={[
          'absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all',
          'bg-black/25 backdrop-blur-sm ring-1 ring-white/10',
          isDefault
            ? 'opacity-100 text-amber-300'
            : 'opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 text-emerald-100/70 hover:text-amber-200',
        ].join(' ')}
      >
        <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-amber-300' : ''}`} />
      </button>
    );
  };

  const SectionTitle = ({ children, count }: { children: React.ReactNode; count?: number }) => (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-1.5 backdrop-blur-md bg-emerald-950/70">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/60">{children}</span>
        {typeof count === 'number' && (
          <span className="text-[10px] tabular-nums text-emerald-200/45">{count}</span>
        )}
        <span className="flex-1 h-px bg-gradient-to-r from-white/12 to-transparent" />
      </div>
    </div>
  );

  const Chip = ({ tone, children }: { tone: 'amber' | 'emerald' | 'sky'; children: React.ReactNode }) => {
    const tones = {
      amber: 'bg-amber-400/15 text-amber-200 ring-amber-300/20',
      emerald: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/20',
      sky: 'bg-sky-400/15 text-sky-200 ring-sky-300/20',
    } as const;
    return (
      <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full ring-1 shrink-0 ${tones[tone]}`}>
        {children}
      </span>
    );
  };

  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-white/15 bg-white/[0.07] text-[10px] font-medium text-emerald-100/80">
      {children}
    </kbd>
  );

  let idx = -1;
  const nextIndex = () => ++idx;


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onKeyDown={onKeyDown}
        className="max-w-3xl w-[calc(100vw-1.5rem)] max-h-[86dvh] flex flex-col overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 border-white/10 text-white"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl text-white">
            Bienvenue {prenom ? `${prenom} ` : ''}🌿
          </DialogTitle>
          <DialogDescription className="text-emerald-100/75">
            {totalSpaces} espaces disponibles. Où souhaitez-vous aller ?
          </DialogDescription>
        </DialogHeader>

        {showSearch && (
          <div className="shrink-0 relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200/50 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un espace…"
              className="w-full h-10 pl-9 pr-9 rounded-xl bg-white/[0.06] border border-white/12 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:ring-1 focus:ring-emerald-300/50 focus:border-emerald-300/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-emerald-100/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="relative flex-1 min-h-0 mt-2">
          {/* Fondus haut / bas */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-5 bg-gradient-to-b from-emerald-950/90 to-transparent z-30" />
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-emerald-950/80 to-transparent z-30" />

          <div
            ref={listRef}
            className="h-full overflow-y-auto overscroll-contain -mx-1 px-1 pb-10 space-y-1"
          >
            {flat.length === 0 && (
              <div className="py-10 text-center text-sm text-emerald-100/55">
                Aucun espace ne correspond à « {query} ».
              </div>
            )}

            {/* Marcheur */}
            {marcheurEntries.length > 0 && (
              <>
                <SectionTitle>Marcheur</SectionTitle>
                <div className="grid gap-2 sm:grid-cols-2 pb-1">
                  {marcheurEntries.map(() => {
                    const i = nextIndex();
                    const active = i === cursor;
                    return (
                      <button
                        key="mon-espace"
                        data-cursor={active}
                        onClick={() => go('mon-espace')}
                        onMouseEnter={() => setCursor(i)}
                        className={`${cardBase} ${cardTone(active)}`}
                      >
                        <StarToggle target="mon-espace" />
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-300/20 flex items-center justify-center shrink-0">
                          <Leaf className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="font-semibold text-white text-sm truncate">Mon Espace Marcheur</div>
                          <div className="text-xs text-emerald-100/60 truncate">
                            Vos marches, votre carnet, votre progression
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Propriétés */}
            {proprieteEntries.length > 0 && (
              <>
                <SectionTitle count={proprieteEntries.length}>Vos jardins &amp; propriétés</SectionTitle>
                <div className="grid gap-2 sm:grid-cols-2 pb-1">
                  {proprieteEntries.map((entry) => {
                    if (entry.kind !== 'propriete') return null;
                    const p = entry.p;
                    const i = nextIndex();
                    const active = i === cursor;
                    return (
                      <button
                        key={p.id}
                        data-cursor={active}
                        onClick={() => go(entry.target)}
                        onMouseEnter={() => setCursor(i)}
                        className={`${cardBase} ${cardTone(active)}`}
                      >
                        <StarToggle target={entry.target} />
                        <ProprieteTile propriete={p} size={44} />
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-white text-sm truncate">{p.nom}</span>
                            {p.is_main && (
                              <Chip tone="amber">
                                <Star className="w-2.5 h-2.5" /> Principal
                              </Chip>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            {p.ville && (
                              <span className="text-xs text-emerald-100/60 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" /> {p.ville}
                              </span>
                            )}
                            <Chip tone="emerald">{p.role}</Chip>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Partenaires IoT */}
            {partenaireEntries.length > 0 && (
              <>
                <SectionTitle count={partenaireEntries.length}>Vos espaces partenaires</SectionTitle>
                <div className="grid gap-2 pb-1">
                  {partenaireEntries.map((entry) => {
                    if (entry.kind !== 'partenaire') return null;
                    const f = entry.f;
                    const i = nextIndex();
                    const active = i === cursor;
                    return (
                      <button
                        key={f.id}
                        data-cursor={active}
                        onClick={() => go(entry.target)}
                        onMouseEnter={() => setCursor(i)}
                        className={[
                          cardBase,
                          'p-3.5 pl-4 items-start gap-4',
                          active
                            ? 'border-sky-300/50 bg-white/[0.14] ring-1 ring-sky-300/40'
                            : 'border-white/12 bg-white/[0.05] hover:bg-white/10 hover:border-sky-300/30 hover:shadow-[0_0_0_1px_rgba(125,211,252,0.15),0_8px_30px_-12px_rgba(56,189,248,0.45)]',
                        ].join(' ')}
                      >
                        {/* Liseré sky */}
                        <span
                          aria-hidden
                          className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-b from-sky-300/70 via-cyan-300/40 to-transparent"
                        />
                        <StarToggle target={entry.target} />
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/90 ring-1 ring-white/25 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                          {f.logo_url ? (
                            <img
                              src={f.logo_url}
                              alt={`Logo ${f.nom}`}
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <Radio className="w-6 h-6 text-sky-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-9">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-sky-200/90">
                            Partenaire IoT
                          </div>
                          <div className="font-semibold text-white text-[15px] leading-snug line-clamp-2 mt-0.5">
                            {f.nom}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-emerald-50/85">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
                            <span className="tabular-nums font-semibold text-white">{f.capteurs_count}</span>
                            sonde{f.capteurs_count > 1 ? 's' : ''} active{f.capteurs_count > 1 ? 's' : ''}
                          </div>
                        </div>
                        <ArrowRight className="hidden sm:block w-4 h-4 self-center text-sky-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 mt-2 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          {showSearch && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-200/55">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="mx-0.5">naviguer</span>
              <Kbd>Entrée</Kbd>
              <span>ouvrir</span>
            </span>
          )}
          <p className="text-xs text-emerald-200/45">
            Changement d'espace possible depuis le sélecteur en haut de page.
          </p>
          {defaultTarget && (
            <button
              type="button"
              onClick={() => toggleRemember(defaultTarget)}
              className="text-xs text-amber-200/80 hover:text-amber-100 underline-offset-2 hover:underline whitespace-nowrap"
            >
              Ne plus ouvrir automatiquement
            </button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}

export function getDefaultAppTarget(): string | null {
  try { return localStorage.getItem(DEFAULT_KEY); } catch { return null; }
}

export function clearDefaultAppTarget() {
  try { localStorage.removeItem(DEFAULT_KEY); } catch { /* stockage indisponible */ }
}
