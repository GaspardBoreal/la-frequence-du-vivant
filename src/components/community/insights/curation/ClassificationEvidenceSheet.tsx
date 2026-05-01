import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  getCatLabel,
  getSourceLabel,
  type CategoryValue,
} from './curationCategories';
import CategoryBadge from './CategoryBadge';
import type {
  ExplorationCuration,
  ClassificationEvidenceItem,
} from '@/hooks/useExplorationCurations';
import { useUpsertCuration } from '@/hooks/useExplorationCurations';

interface Props {
  open: boolean;
  onClose: () => void;
  curation: ExplorationCuration | null;
  /** Affichage : nom commun (FR de préférence) */
  displayName?: string;
  scientificName?: string | null;
  /** Identifiant de l'espèce dans le pool (entity_id) — utile en édition */
  entityId?: string | null;
  isCurator: boolean;
}

const ClassificationEvidenceSheet: React.FC<Props> = ({
  open,
  onClose,
  curation,
  displayName,
  scientificName,
  entityId,
  isCurator,
}) => {
  const upsert = useUpsertCuration();
  const [editing, setEditing] = useState(false);
  const [primary, setPrimary] = useState<CategoryValue | null>(null);
  const [secondaries, setSecondaries] = useState<string[]>([]);

  React.useEffect(() => {
    // Reset à chaque ouverture
    if (open && curation) {
      setEditing(false);
      setPrimary((curation.category as CategoryValue) ?? null);
      setSecondaries(curation.secondary_categories ?? []);
    }
  }, [open, curation]);

  if (!curation) return null;

  const evidence: ClassificationEvidenceItem[] =
    (curation.classification_evidence as ClassificationEvidenceItem[]) ?? [];
  const source = curation.classification_source ?? null;
  const confidence = curation.classification_confidence ?? null;
  const needsReview = !!curation.needs_review;

  const sourceIcon =
    source === 'knowledge_base' ? (
      <ShieldCheck className="w-4 h-4" />
    ) : source === 'curator' ? (
      <ShieldCheck className="w-4 h-4" />
    ) : source === 'ai' ? (
      <Sparkles className="w-4 h-4" />
    ) : (
      <AlertTriangle className="w-4 h-4" />
    );

  const handleValidate = async () => {
    await upsert.mutateAsync({
      id: curation.id,
      exploration_id: curation.exploration_id,
      sense: curation.sense,
      entity_type: curation.entity_type,
      entity_id: entityId ?? curation.entity_id,
      needs_review: false,
      classification_source: 'curator',
    });
  };

  const handleSaveEdit = async () => {
    await upsert.mutateAsync({
      id: curation.id,
      exploration_id: curation.exploration_id,
      sense: curation.sense,
      entity_type: curation.entity_type,
      entity_id: entityId ?? curation.entity_id,
      category: primary,
      secondary_categories: secondaries,
      classification_source: 'curator',
      needs_review: false,
    });
    setEditing(false);
  };

  const toggleSecondary = (val: string) => {
    setSecondaries((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const confidencePct =
    confidence != null ? Math.round(Math.max(0, Math.min(1, confidence)) * 100) : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="text-left space-y-2">
          <SheetTitle className="text-base">
            {displayName || scientificName || 'Espèce'}
          </SheetTitle>
          {scientificName && displayName !== scientificName && (
            <SheetDescription className="italic">{scientificName}</SheetDescription>
          )}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {curation.category && (
              <CategoryBadge category={curation.category} variant="primary" size="sm" />
            )}
            {(curation.secondary_categories ?? []).map((s) => (
              <CategoryBadge key={s} category={s} variant="secondary" size="xs" />
            ))}
            {needsReview && (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-400"
              >
                À réviser
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Métadonnées de provenance */}
        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            {sourceIcon}
            <span>{getSourceLabel(source)}</span>
          </div>
          {confidencePct != null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Niveau de confiance</span>
                <span className="font-medium text-foreground">{confidencePct}%</span>
              </div>
              <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    confidencePct >= 80
                      ? 'bg-emerald-500'
                      : confidencePct >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
            </div>
          )}
          {curation.updated_at && (
            <p className="text-[10px] text-muted-foreground">
              Dernière mise à jour :{' '}
              {new Date(curation.updated_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        {/* Évidences */}
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Évidences sourcées ({evidence.length})
          </h3>
          {evidence.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                Aucune citation n'est attachée à cette classification — elle
                provient probablement d'une analyse legacy ou d'une IA sans
                tool-calling.
              </p>
              {isCurator && (
                <p className="text-[11px]">
                  Relancez l'analyse IA depuis l'onglet « Sélection » pour
                  obtenir des sources auditables.
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {evidence.map((e, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-card p-2.5 text-xs space-y-1"
                >
                  <p className="font-medium text-foreground">{e.source}</p>
                  {e.quote && (
                    <p className="italic text-muted-foreground leading-snug">
                      «&nbsp;{e.quote}&nbsp;»
                    </p>
                  )}
                  {e.reference && (
                    <p className="text-[10px] text-muted-foreground/80">
                      {e.reference}
                    </p>
                  )}
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Consulter la source
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bandeau « À réviser » + actions curateur */}
        {isCurator && (
          <div className="mt-5 space-y-2">
            {needsReview && !editing && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs space-y-2">
                <p className="text-amber-800 dark:text-amber-300">
                  Cette classification automatique attend une validation humaine.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleValidate}
                  disabled={upsert.isPending}
                >
                  {upsert.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Valider cette classification
                </Button>
              </div>
            )}

            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Modifier la classification
              </Button>
            ) : (
              <div className="rounded-lg border border-border bg-card p-3 space-y-3 text-xs">
                <div className="space-y-1.5">
                  <p className="font-medium text-foreground">Catégorie principale</p>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPrimary(c.value)}
                        className={`px-2 py-1 rounded-md border text-[10px] transition ${
                          primary === c.value
                            ? `${c.color} ring-1 ring-current/40`
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="font-medium text-foreground">
                    Catégories secondaires
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.filter((c) => c.value !== primary).map((c) => {
                      const active = secondaries.includes(c.value);
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => toggleSecondary(c.value)}
                          className={`px-2 py-1 rounded-md border text-[10px] transition ${
                            active
                              ? `${c.color} ring-1 ring-current/40`
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={!primary || upsert.isPending}
                    className="flex-1"
                  >
                    {upsert.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  La validation manuelle marque la source comme « curateur » et
                  retire l'alerte « à réviser ».
                </p>
              </div>
            )}
          </div>
        )}

        {!isCurator && needsReview && (
          <div className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300">
            Classification provisoire — en attente de validation par un
            curateur.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ClassificationEvidenceSheet;
