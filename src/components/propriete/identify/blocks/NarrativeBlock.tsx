import React from 'react';
import { Sparkles, Loader2, RefreshCw, Check, Wand2, PenLine, Minimize2, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { EcoSourceNote } from '../EcoSourceNote';

export interface NarrationAiContext {
  propertyName?: string;
  commune?: string | null;
  plants?: Array<{ name: string; latin?: string; family?: string }>;
  poles?: Array<{ label: string; axis: string; level: string; points: number }>;
  soil?: Record<string, unknown>;
  concordance?: Record<string, unknown>;
  observationNotes?: string | null;
  speciesTotal?: number | null;
}

type VariantKey = 'agronomique' | 'sensible';
type NarrationLength = 'court' | 'standard' | 'detaille';

interface Variant {
  key: VariantKey;
  label: string;
  text: string;
}

const VARIANT_META: Record<VariantKey, { title: string; hint: string }> = {
  agronomique: {
    title: 'Variante A · Agronomique',
    hint: 'Factuelle et orientée décision — le registre attendu par un paysagiste.',
  },
  sensible: {
    title: 'Variante B · Sensible',
    hint: 'Le site raconté par sa végétation, sans rien perdre des données.',
  },
};

const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export const NarrativeBlock: React.FC<{
  conclusion: string;
  onChangeConclusion: (v: string) => void;
  notes: string;
  onChangeNotes: (v: string) => void;
  autoNarrative: string;
  aiContext?: NarrationAiContext;
  /** signature des données du diagnostic : change ⇒ une régénération est pertinente */
  contextKey?: string;
  /** false si le cortège est vide ou l'Étape 2 non renseignée */
  contextReady?: boolean;
  /** motif affiché lorsque le mode auto est indisponible */
  notReadyReason?: string;
  index?: number;
}> = ({
  conclusion,
  onChangeConclusion,
  notes,
  onChangeNotes,
  autoNarrative,
  aiContext,
  contextKey,
  contextReady = true,
  notReadyReason,
  index = 3,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [variants, setVariants] = React.useState<Variant[]>([]);
  const [adoptedKey, setAdoptedKey] = React.useState<VariantKey | null>(null);
  const [generatedAt, setGeneratedAt] = React.useState<string | null>(null);
  const [length, setLength] = React.useState<NarrationLength>('standard');
  const [dirtyByUser, setDirtyByUser] = React.useState(false);
  // Mode automatique : actif par défaut tant que rien n'a été écrit à la main
  const [autoMode, setAutoMode] = React.useState(() => !conclusion.trim());
  const lastRunRef = React.useRef<string | null>(null);

  const canGenerate = !!aiContext && contextReady;

  const generate = React.useCallback(
    async (nextLength: NarrationLength = length, silent = false) => {
      if (!aiContext) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('propriete-diagnostic-narration', {
          body: { ...aiContext, length: nextLength },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        const list: Variant[] = ((data as any)?.variants ?? [])
          .map((v: any) => ({
            key: (v.key === 'sensible' ? 'sensible' : 'agronomique') as VariantKey,
            label: v.label ?? '',
            text: (v.text ?? '').trim(),
          }))
          .filter((v: Variant) => v.text);
        if (!list.length) throw new Error("L'IA n'a rien retourné.");
        setVariants(list);
        setAdoptedKey(null);
        setGeneratedAt((data as any)?.generatedAt ?? new Date().toISOString());
        if (!silent) toast.success('Deux formulations proposées — choisissez celle qui vous ressemble.');
      } catch (e: any) {
        toast.error('Génération impossible', { description: e?.message ?? 'Réessayez dans un instant.' });
      } finally {
        setLoading(false);
      }
    },
    [aiContext, length],
  );

  // Préremplissage automatique : une seule génération par signature de données
  React.useEffect(() => {
    if (!autoMode || dirtyByUser || loading || !canGenerate || !contextKey) return;
    if (lastRunRef.current === contextKey) return;
    lastRunRef.current = contextKey;
    generate(length, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, dirtyByUser, canGenerate, contextKey]);

  const adopt = (v: Variant) => {
    onChangeConclusion(v.text);
    setAdoptedKey(v.key);
    toast.success('Narration adoptée — modifiez-la librement.');
  };

  const append = (v: Variant) => {
    onChangeConclusion(conclusion.trim() ? `${conclusion.trim()}\n\n${v.text}` : v.text);
    setAdoptedKey(v.key);
  };

  const changeLength = (next: NarrationLength) => {
    setLength(next);
    generate(next);
  };

  return (
    <AnalyzeCard
      number={5}
      category="Narration"
      title="Ce que la flore raconte"
      subtitle="Un texte auto-généré à partir de vos observations. Reformulez-le librement pour qu'il vous ressemble."
      index={index}
    >
      <div className="space-y-4">
        <p className="text-[11.5px] italic leading-relaxed text-[hsl(var(--ds-forest-deep))]/70">
          Rassemblez ici ce que la végétation vous apprend du lieu. Il n’y a pas d’exactitude à atteindre :
          l’objectif est une lecture argumentée, ouverte au doute, que vous pourrez confronter aux saisons suivantes.
        </p>

        {/* ── Mode Narration automatique ───────────────────────────────── */}
        <div className="print:hidden rounded-2xl border border-[hsl(var(--ds-gold))]/40 bg-[hsl(var(--ds-gold))]/8 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[220px] flex-1">
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-[hsl(var(--ds-forest))]">
                <Wand2 className="w-3 h-3" /> Narration automatique
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-[hsl(var(--ds-forest-deep))]/75">
                L’IA lit le profil de cette propriété — cortège relevé, sol de l’Étape 2, ICG et fiabilité — et
                prérempli le texte en vous proposant <strong>deux formulations au choix</strong>. Vous restez
                l’auteur : rien n’est écrit sans votre accord.
              </p>
            </div>

            {/* Interrupteur */}
            <button
              type="button"
              role="switch"
              aria-checked={autoMode}
              onClick={() => {
                const next = !autoMode;
                setAutoMode(next);
                if (next) {
                  setDirtyByUser(false);
                  lastRunRef.current = null;
                }
              }}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/80 px-2.5 py-1.5 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/85 disabled:opacity-50"
            >
              <span
                className="relative inline-block h-[16px] w-[30px] rounded-full transition-colors"
                style={{ background: autoMode ? 'hsl(var(--ds-forest))' : 'hsl(var(--ds-line))' }}
              >
                <span
                  className="absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white transition-all"
                  style={{ left: autoMode ? 16 : 2 }}
                />
              </span>
              {autoMode ? 'Activée' : 'Désactivée'}
            </button>
          </div>

          {!canGenerate && (
            <p className="mt-2 rounded-xl border border-dashed border-[hsl(var(--ds-line))] px-3 py-2 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/65">
              {notReadyReason ??
                'Cochez au moins une plante bio-indicatrice et renseignez l’Étape 2 pour activer la rédaction assistée.'}
            </p>
          )}

          {canGenerate && dirtyByUser && autoMode && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-cream))]/80 px-2.5 py-1 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/70">
              <PenLine className="w-3 h-3" /> Texte repris à la main — le mode automatique est en veille.
            </p>
          )}

          {canGenerate && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => generate()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))] px-3.5 py-2 text-[11px] font-semibold text-[hsl(var(--ds-cream))] transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {loading ? 'Lecture du site…' : variants.length ? 'Régénérer les deux' : 'Générer les deux variantes'}
              </button>
              {variants.length > 0 && !loading && (
                <>
                  <button
                    type="button"
                    onClick={() => changeLength('court')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/80"
                  >
                    <Minimize2 className="w-3 h-3" /> Plus court
                  </button>
                  <button
                    type="button"
                    onClick={() => changeLength('detaille')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/80"
                  >
                    <Maximize2 className="w-3 h-3" /> Plus détaillé
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Les deux variantes ─────────────────────────────────────── */}
          {loading && variants.length === 0 && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60"
                />
              ))}
            </div>
          )}

          {variants.length > 0 && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {variants.map((v) => {
                const adopted = adoptedKey === v.key;
                return (
                  <div
                    key={v.key}
                    className="flex flex-col rounded-xl border bg-[hsl(var(--ds-cream))]/80 p-3 transition"
                    style={{
                      borderColor: adopted ? 'hsl(var(--ds-forest))' : 'hsl(var(--ds-line))',
                      boxShadow: adopted ? '0 0 0 1px hsl(var(--ds-forest))' : undefined,
                      opacity: loading ? 0.55 : 1,
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest))]">
                        {VARIANT_META[v.key].title}
                      </span>
                      {adopted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))] px-2 py-[2px] text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--ds-cream))]">
                          <Check className="w-2.5 h-2.5" /> Adoptée
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60">
                      {VARIANT_META[v.key].hint}
                    </p>
                    <p className="mt-2 flex-1 whitespace-pre-line text-[12px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/90">
                      {v.text}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adopt(v)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-cream))]"
                      >
                        <Check className="w-3.5 h-3.5" /> Adopter
                      </button>
                      <button
                        type="button"
                        onClick={() => append(v)}
                        className="rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]/80"
                      >
                        Ajouter à la suite
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          adopt(v);
                          setVariants([v]);
                        }}
                        className="rounded-full border border-[hsl(var(--ds-line))] px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--ds-forest-deep))]/80"
                      >
                        Ne garder que celle-ci
                      </button>
                      <span className="ml-auto text-[10px] tabular-nums text-[hsl(var(--ds-forest-deep))]/55">
                        {wordCount(v.text)} mots
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {autoNarrative && (
          <div className="rounded-xl bg-[hsl(var(--ds-forest))]/6 border border-[hsl(var(--ds-forest))]/20 p-3 text-[12px] italic text-[hsl(var(--ds-forest-deep))]/80 leading-relaxed">
            <div className="text-[9px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70 mb-1">
              Suggestion automatique
            </div>
            {autoNarrative}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Conclusion floristique
          </label>
          <textarea
            rows={conclusion.length > 400 ? 10 : 3}
            value={conclusion}
            onChange={(e) => {
              setDirtyByUser(true);
              onChangeConclusion(e.target.value);
            }}
            placeholder="Ce que la végétation vous apprend du lieu…"
            className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 text-sm text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))] resize-none"
          />
          {adoptedKey && generatedAt && (
            <p className="print:hidden mt-1 flex items-center gap-1.5 text-[10px] text-[hsl(var(--ds-forest-deep))]/55">
              <RefreshCw className="w-3 h-3" />
              Registre {VARIANT_META[adoptedKey].title.split('· ')[1]} · généré le{' '}
              {new Date(generatedAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/70">
            Notes personnelles
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder="Anecdotes de terrain, doutes, plantes à revérifier…"
            className="mt-1 w-full rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 text-sm text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))] resize-none"
          />
        </div>
        <EcoSourceNote compact />
      </div>
    </AnalyzeCard>
  );
};
