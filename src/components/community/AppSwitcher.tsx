import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Leaf, Check, ChevronDown, Radio, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUserAppsAccess, ProprieteAccess, PartenaireIotAccess } from '@/hooks/useUserAppsAccess';
import { ProprieteTile } from '@/components/community/ProprieteTile';
import { AppChoiceDialog, getDefaultAppTarget } from '@/components/community/AppChoiceDialog';
import { cn } from '@/lib/utils';

interface AppSwitcherProps {
  userId?: string;
  /** Slug of the current property (if we're inside a property espace), or 'mdv' for Mon Espace */
  currentContext?: string;
}

const AppSwitcher: React.FC<AppSwitcherProps> = ({ userId, currentContext = 'mdv' }) => {
  const navigate = useNavigate();
  const { data } = useUserAppsAccess(userId);
  const proprietes = data?.proprietesAccessibles ?? [];
  const partenaires = data?.partenairesIot ?? [];
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [defaultTarget, setDefaultTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDefaultTarget(getDefaultAppTarget());
  }, [settingsOpen]);

  // Only show switcher if user has at least one other espace
  if (proprietes.length === 0 && partenaires.length === 0) return null;

  const currentLabel =
    currentContext === 'mdv'
      ? 'Mon Espace'
      : proprietes.find((p) => p.slug === currentContext)?.nom ??
        partenaires.find((f) => f.slug === currentContext)?.nom ??
        'Espace';

  const go = (path: string) => navigate(path);

  const DefaultStar = () => (
    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" aria-label="Ouverture automatique" />
  );


  return (
    <>
    <Popover>

      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Changer d'espace"
          className="flex items-center gap-1 rounded-full border border-border/60 bg-secondary/60 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors flex-shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span className="max-w-[90px] truncate">{currentLabel}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 pt-1 pb-2">
          Vos espaces
        </div>

        <button
          type="button"
          onClick={() => go('/marches-du-vivant/mon-espace')}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60 transition-colors',
            currentContext === 'mdv' && 'bg-muted/40'
          )}
        >
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-emerald-400/30 to-teal-500/30 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">Mon Espace</div>
            <div className="text-[11px] text-muted-foreground">Marches du Vivant</div>
          </div>
          {defaultTarget === 'mon-espace' && <DefaultStar />}
          {currentContext === 'mdv' && <Check className="w-4 h-4 text-primary" />}
        </button>


        {proprietes.length > 0 && (
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 pt-3 pb-1">
            Propriétés
          </div>
        )}
        <div className="max-h-72 overflow-y-auto space-y-0.5">
          {proprietes.map((p: ProprieteAccess) => {
            const active = currentContext === p.slug;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => go(`/propriete/${p.slug}`)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60 transition-colors',
                  active && 'bg-muted/40'
                )}
              >
                <ProprieteTile propriete={p} size={36} />

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                    {p.nom}
                    {p.is_main && (
                      <span className="text-[9px] uppercase tracking-wide text-primary bg-primary/10 rounded px-1 py-0.5">
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.ville ?? '—'} · {p.role}
                  </div>
                </div>
                {active && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
        {partenaires.length > 0 && (
          <>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 pt-3 pb-1">
              Espaces partenaires
            </div>
            <div className="space-y-0.5">
              {partenaires.map((f: PartenaireIotAccess) => {
                const active = currentContext === f.slug;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => go(`/partenaire-iot/${f.slug}`)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted/60 transition-colors',
                      active && 'bg-muted/40'
                    )}
                  >
                    <div className="w-9 h-9 rounded-md bg-sky-500/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {f.logo_url ? (
                        <img src={f.logo_url} alt={`Logo ${f.nom}`} className="h-full w-full object-cover" />
                      ) : (
                        <Radio className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{f.nom}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {f.capteurs_count} sonde{f.capteurs_count > 1 ? 's' : ''} · partenaire IoT
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AppSwitcher;
