import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { OriginAggregate, BiogeographyAggregates, BiogeographyRow } from '@/hooks/useExplorationBiogeography';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, ExternalLink, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import SpeciesName from '@/components/species/SpeciesName';

interface Props {
  open: boolean;
  aggregate: OriginAggregate | null;
  biogeography: BiogeographyAggregates;
  onClose: () => void;
}

function confidenceMeta(c?: string | null) {
  switch (c) {
    case 'verified':
      return { label: 'Vérifié', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    case 'high':
      return { label: 'Confiance élevée', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    case 'medium':
      return { label: 'Confiance moyenne', icon: ShieldQuestion, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    case 'low':
    default:
      return { label: 'À vérifier', icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  }
}

function sourceBadge(source?: string | null) {
  switch (source) {
    case 'powo': return '🌿 POWO';
    case 'gbif_type': return '🌍 GBIF type';
    case 'gbif_distribution_strict': return '🌍 GBIF';
    case 'iucn': return '🦋 IUCN';
    case 'inferred_describer': return '~ inféré';
    default: return '—';
  }
}

const SourcesPopover: React.FC<{ row: BiogeographyRow }> = ({ row }) => {
  const sources = row.sources || [];
  const meta = confidenceMeta(row.type_locality_confidence);
  const Icon = meta.icon;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.color} hover:scale-105 transition`}
          aria-label={`Sources scientifiques — ${meta.label}`}
        >
          <Icon className="w-3 h-3" />
          {sourceBadge(row.type_locality_source)}
        </button>
      </PopoverTrigger>
      <PopoverContent side="left" className="w-80 p-4 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className="font-semibold">{meta.label}</span>
        </div>
        {sources.length === 0 ? (
          <p className="text-muted-foreground">Aucune source enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {sources.map((s, i) => (
              <li key={i} className="border-l-2 border-border pl-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  {s.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="text-muted-foreground mt-0.5">{s.field}</div>
              </li>
            ))}
          </ul>
        )}
        {row.fetched_at && (
          <div className="mt-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
            Vérifié le {new Date(row.fetched_at).toLocaleDateString('fr-FR')}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            const subject = encodeURIComponent(`Signalement origine espèce : ${row.scientific_name}`);
            const body = encodeURIComponent(
              `Bonjour,\n\nJe signale une possible erreur d'origine pour l'espèce ${row.scientific_name}.\n\nOrigine actuelle : ${row.type_locality_country || '—'}\nSource : ${row.type_locality_source || '—'}\nConfiance : ${row.type_locality_confidence || '—'}\n\nOrigine attendue :\nJustification :\n`,
            );
            window.location.href = `mailto:contact@la-frequence-du-vivant.com?subject=${subject}&body=${body}`;
          }}
          className="mt-3 w-full text-[11px] text-rose-600 dark:text-rose-400 hover:underline text-left"
        >
          ⚠️ Signaler une erreur d'origine
        </button>
      </PopoverContent>
    </Popover>
  );
};

const CountryOriginDrawer: React.FC<Props> = ({ open, aggregate, biogeography, onClose }) => {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {aggregate && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-amber-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{aggregate.country.flag}</span>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl">{aggregate.country.nameFr}</SheetTitle>
                  <SheetDescription>
                    <span className="text-foreground font-semibold">{aggregate.species.length}</span> espèce{aggregate.species.length > 1 ? 's' : ''} originaire{aggregate.species.length > 1 ? 's' : ''} de ce territoire
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-1.5 text-[10px] text-muted-foreground">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  Sources : <strong>POWO</strong> (RBG Kew), <strong>GBIF</strong> (statut natif strict), <strong>IUCN</strong>. Cliquez sur le badge à droite de chaque espèce pour voir et vérifier les sources.
                </span>
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <ul className="divide-y divide-border/50">
                {aggregate.species.map((sp) => {
                  const row = biogeography.byScientificName.get(sp.scientificName || '');
                  return (
                    <li key={sp.scientificName} className="px-6 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-3">
                        {sp.photos?.[0] && (
                          <img src={sp.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" loading="lazy" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">
                            <SpeciesName scientificName={sp.scientificName} commonName={sp.commonName} />
                          </div>
                          <div className="text-[11px] text-muted-foreground italic mt-0.5">{sp.scientificName}</div>
                          {row?.describer_name && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                              ✒️ {row.describer_name}{row.describer_year ? `, ${row.describer_year}` : ''}
                            </div>
                          )}
                        </div>
                        {row && <SourcesPopover row={row} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CountryOriginDrawer;
