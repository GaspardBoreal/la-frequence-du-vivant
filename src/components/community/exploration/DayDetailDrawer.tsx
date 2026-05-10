import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Sparkles, MapPin, Users, ExternalLink, Leaf, Bird, TreePine, Bug } from 'lucide-react';
import type { DayBucket, DayObservation } from '@/hooks/useBiodiversityEvolution';
import { SpeciesName } from '@/components/species/SpeciesName';
import SpeciesGalleryDetailModal from '@/components/biodiversity/SpeciesGalleryDetailModal';
import type { SpeciesMarcheData } from '@/hooks/useSpeciesMarches';

interface Props {
  open: boolean;
  onClose: () => void;
  day: string | null;
  bucket: DayBucket | null;
  marchesById?: Map<string, { name: string; ville?: string; latitude?: number; longitude?: number }>;
  onNavigateToMarche?: (marcheId: string) => void;
  explorationId?: string;
  allEventMarches?: SpeciesMarcheData[];
}

const formatDateFr = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

const kingdomIcon = (k?: string) => {
  switch (k) {
    case 'Animalia': return Bird;
    case 'Plantae': return TreePine;
    case 'Fungi': return Leaf;
    default: return Bug;
  }
};

const kingdomColor = (k?: string) => {
  switch (k) {
    case 'Animalia': return 'text-sky-600 dark:text-sky-400 bg-sky-500/10';
    case 'Plantae': return 'text-green-600 dark:text-green-400 bg-green-500/10';
    case 'Fungi': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
    default: return 'text-purple-600 dark:text-purple-400 bg-purple-500/10';
  }
};

const SpeciesRow: React.FC<{ obs: DayObservation; isNew?: boolean; onClick?: () => void }> = ({ obs, isNew, onClick }) => {
  const Icon = kingdomIcon(obs.kingdom);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/40 transition-colors"
    >
      {obs.photo ? (
        <img src={obs.photo} alt={obs.scientificName} className="w-10 h-10 rounded-lg object-cover bg-muted" loading="lazy" />
      ) : (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kingdomColor(obs.kingdom)}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            <SpeciesName
              scientificName={obs.scientificName}
              commonName={obs.commonName}
              size="sm"
              truncate
              showScientific
            />
          </div>
          {isNew && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-semibold flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              1ère obs.
            </span>
          )}
        </div>
      </div>
      {obs.originalUrl && (
        <a
          href={obs.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Voir sur iNaturalist"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </button>
  );
};

const DayDetailDrawer: React.FC<Props> = ({ open, onClose, day, bucket, marchesById, onNavigateToMarche, explorationId, allEventMarches }) => {
  const newSp = bucket ? Array.from(bucket.newSpecies.values()) : [];
  const reSp = bucket ? Array.from(bucket.reSpecies.values()) : [];
  const contributors = bucket ? Array.from(bucket.contributors.values()).sort((a, b) => b.count - a.count) : [];
  const marches = bucket ? Array.from(bucket.marcheIds) : [];
  const [selectedSpecies, setSelectedSpecies] = useState<DayObservation | null>(null);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="capitalize text-base">
            {day ? formatDateFr(day) : ''}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {bucket ? (
              <>
                {newSp.length > 0 && <span className="text-primary font-medium">+{newSp.length} nouvelle{newSp.length > 1 ? 's' : ''} espèce{newSp.length > 1 ? 's' : ''}</span>}
                {newSp.length > 0 && (reSp.length > 0 || bucket.observations.length > 0) && ' · '}
                {bucket.observations.length} observation{bucket.observations.length > 1 ? 's' : ''}
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        {bucket && (
          <div className="mt-5 space-y-6">
            {/* Nouvelles espèces */}
            {newSp.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Nouvelles espèces ({newSp.length})
                  </h4>
                </div>
                <div className="space-y-0.5">
                  {newSp.map(obs => <SpeciesRow key={obs.scientificName} obs={obs} isNew onClick={() => setSelectedSpecies(obs)} />)}
                </div>
              </section>
            )}

            {/* Re-observées */}
            {reSp.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Re-observées ({reSp.length})
                  </h4>
                </div>
                <div className="space-y-0.5">
                  {reSp.map(obs => <SpeciesRow key={obs.scientificName} obs={obs} />)}
                </div>
              </section>
            )}

            {/* Marches actives */}
            {marches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Marches actives ({marches.length})
                  </h4>
                </div>
                <div className="space-y-1">
                  {marches.map(mid => {
                    const m = marchesById?.get(mid);
                    return (
                      <button
                        key={mid}
                        onClick={() => onNavigateToMarche?.(mid)}
                        className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-foreground truncate">{m?.name || 'Marche'}</div>
                          {m?.ville && <div className="text-[11px] text-muted-foreground truncate">{m.ville}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Contributeurs */}
            {contributors.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Contributeurs iNaturalist ({contributors.length})
                  </h4>
                </div>
                <div className="space-y-1">
                  {contributors.map(c => (
                    <div key={c.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400/30 to-emerald-500/20 flex items-center justify-center text-[11px] font-semibold text-foreground">
                        {c.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground truncate">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.count} obs.</div>
                      </div>
                      {c.profileUrl && (
                        <a
                          href={c.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Profil iNaturalist"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {newSp.length === 0 && reSp.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune observation détaillée pour ce jour.</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DayDetailDrawer;
