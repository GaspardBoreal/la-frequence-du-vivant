import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Leaf, MapPin, Star, Radio } from 'lucide-react';
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
  /**
   * `launch` (défaut) : dialogue de bienvenue à la connexion.
   * `settings` : réglage de l'espace de démarrage depuis le sélecteur d'espaces.
   */
  mode?: 'launch' | 'settings';
}

export function AppChoiceDialog({ open, onOpenChange, prenom, proprietes, partenaires = [], onDismiss, mode = 'launch' }: Props) {
  const isSettings = mode === 'settings';

  const navigate = useNavigate();
  const chosenRef = useRef(false);
  const [defaultTarget, setDefaultTarget] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      chosenRef.current = false;
      setDefaultTarget(getDefaultAppTarget());
    }
  }, [open]);

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v && !chosenRef.current) onDismiss?.();
  };

  const go = (target: string) => {
    chosenRef.current = true;
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

  const sortedProprietes = [...proprietes].sort((a, b) => {
    if (!!a.is_main !== !!b.is_main) return a.is_main ? -1 : 1;
    return a.nom.localeCompare(b.nom, 'fr');
  });
  const sortedPartenaires = [...partenaires].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

  const totalSpaces = 1 + proprietes.length + partenaires.length;

  const Row = ({
    target,
    icon,
    title,
    subtitle,
  }: {
    target: string;
    icon: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
  }) => {
    const isDefault = defaultTarget === target;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => go(target)}
          className="w-full text-left flex items-center gap-3 rounded-xl border border-white/15 bg-emerald-900 p-3 pr-11 hover:bg-emerald-800 active:bg-emerald-800 transition-colors"
        >
          <span className="shrink-0">{icon}</span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-white text-sm truncate">{title}</span>
            {subtitle && <span className="block text-xs text-emerald-100/70 truncate">{subtitle}</span>}
          </span>
        </button>
        <button
          type="button"
          onClick={() => toggleRemember(target)}
          aria-label={isDefault ? 'Ne plus ouvrir automatiquement' : 'Toujours ouvrir cet espace'}
          title={isDefault ? 'Ne plus ouvrir automatiquement' : 'Toujours ouvrir cet espace'}
          className="absolute top-1/2 -translate-y-1/2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-emerald-100/60 hover:text-amber-200"
        >
          <Star className={`w-4 h-4 ${isDefault ? 'fill-amber-300 text-amber-300' : ''}`} />
        </button>
      </div>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="pt-3 pb-1 text-[11px] uppercase tracking-[0.14em] text-emerald-200/60">{children}</div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg w-[calc(100vw-1.5rem)] max-h-[85dvh] overflow-y-auto overscroll-contain bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 border-white/10 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Bienvenue {prenom ? `${prenom} ` : ''}🌿
          </DialogTitle>
          <DialogDescription className="text-emerald-100/75">
            {totalSpaces} espaces disponibles. Où souhaitez-vous aller ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Row
            target="mon-espace"
            title="Mon Espace Marcheur"
            subtitle="Vos marches, votre carnet, votre progression"
            icon={
              <span className="w-10 h-10 rounded-xl bg-emerald-500/20 ring-1 ring-emerald-300/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-300" />
              </span>
            }
          />

          {sortedProprietes.length > 0 && <SectionTitle>Vos jardins &amp; propriétés</SectionTitle>}
          {sortedProprietes.map((p) => (
            <Row
              key={p.id}
              target={`propriete:${p.slug}`}
              title={p.nom}
              subtitle={
                <span className="inline-flex items-center gap-1">
                  {p.ville && (
                    <>
                      <MapPin className="w-3 h-3 shrink-0" />
                      {p.ville}
                      <span className="opacity-50">·</span>
                    </>
                  )}
                  {p.role}
                </span>
              }
              icon={<ProprieteTile propriete={p} size={40} />}
            />
          ))}

          {sortedPartenaires.length > 0 && <SectionTitle>Vos espaces partenaires</SectionTitle>}
          {sortedPartenaires.map((f) => {
            const maint = f.capteurs_maintenance ?? 0;
            const actives = f.capteurs_actifs ?? Math.max(f.capteurs_count - maint, 0);
            return (
              <Row
                key={f.id}
                target={`partenaire-iot:${f.slug}`}
                title={f.nom}
                subtitle={
                  <>
                    {actives} sonde{actives > 1 ? 's' : ''} active{actives > 1 ? 's' : ''}
                    {maint > 0 && ` · ${maint} en maintenance`}
                  </>
                }
                icon={
                  <span className="w-10 h-10 rounded-xl bg-white/90 ring-1 ring-white/25 flex items-center justify-center overflow-hidden p-1">
                    {f.logo_url ? (
                      <img src={f.logo_url} alt={`Logo ${f.nom}`} className="max-h-full max-w-full object-contain" loading="lazy" />
                    ) : (
                      <Radio className="w-5 h-5 text-sky-600" />
                    )}
                  </span>
                }
              />
            );
          })}
        </div>

        {defaultTarget && (
          <button
            type="button"
            onClick={() => toggleRemember(defaultTarget)}
            className="mt-1 text-xs text-amber-200/80 hover:text-amber-100 underline-offset-2 hover:underline"
          >
            Ne plus ouvrir automatiquement
          </button>
        )}
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
