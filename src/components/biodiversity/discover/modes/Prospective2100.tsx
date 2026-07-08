import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Cloud, Loader2 } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { classifyProspective2100, PROSPECTIVE_2100_ACCENTS, type Prospective2100Status } from '@/lib/prospective2100';
import { getSpeciesPhoto } from '../useDiscoverData';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  species: BiodiversitySpecies[];
  photoBy: Map<string, string>;
}

interface Card {
  s: BiodiversitySpecies;
  status: Prospective2100Status;
  narrative: string;
  photo?: string;
}

const Prospective2100: React.FC<Props> = ({ species, photoBy }) => {
  const cards = useMemo<Card[]>(() => {
    return species.map((s) => {
      const r = classifyProspective2100(s);
      return { s, status: r.status, narrative: r.narrative, photo: getSpeciesPhoto(photoBy, s) };
    });
  }, [species, photoBy]);

  const counts = useMemo(() => {
    const c: Record<Prospective2100Status, number> = { stable: 0, recul: 0, migrante: 0, nouvelle: 0 };
    for (const x of cards) c[x.status] += 1;
    return c;
  }, [cards]);

  const [filter, setFilter] = useState<Prospective2100Status | 'all'>('all');
  const [selected, setSelected] = useState<Card | null>(null);
  const visible = filter === 'all' ? cards : cards.filter((c) => c.status === filter);

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-[#040814] via-[#08111F] to-[#0a1428] text-white">
      {/* Particules */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-cyan-200"
            style={{ left: `${(i * 137) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-20">
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Horizon 2100</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-extralight tracking-tight">
            Et si on regardait <em className="not-italic text-cyan-200">ces espèces</em> en 2100&nbsp;?
          </h2>
          <p className="mt-3 text-sm text-white/50 max-w-2xl">
            Projection symbolique basée sur la famille, le taxon et la sensibilité climatique connue.
            Approfondissable par espèce avec l'IA.
          </p>
        </motion.div>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} label={`Toutes (${cards.length})`} />
          {(Object.keys(counts) as Prospective2100Status[]).map((k) => (
            <Chip
              key={k}
              active={filter === k}
              onClick={() => setFilter(k)}
              label={`${PROSPECTIVE_2100_ACCENTS[k].label} (${counts[k]})`}
              tone={k}
            />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence>
            {visible.map((c, i) => {
              const a = PROSPECTIVE_2100_ACCENTS[c.status];
              return (
                <motion.button
                  key={c.s.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: (i % 20) * 0.02 }}
                  onClick={() => setSelected(c)}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 ${a.bg} ring-1 ${a.ring} aspect-[3/4] text-left`}
                >
                  {c.photo ? (
                    <img src={c.photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${a.bg} ${a.text} border border-white/10 backdrop-blur`}>
                      {a.label}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-2.5">
                    <p className="text-xs font-semibold text-white line-clamp-1">
                      {c.s.commonName?.trim() || c.s.scientificName}
                    </p>
                    <p className="text-[10px] italic text-white/60 line-clamp-1">{c.s.scientificName}</p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selected && <ProspectiveDetail card={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

const Chip: React.FC<{ active: boolean; onClick: () => void; label: string; tone?: Prospective2100Status }> = ({
  active, onClick, label, tone,
}) => {
  const a = tone ? PROSPECTIVE_2100_ACCENTS[tone] : null;
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition ${
        active
          ? `bg-white/20 border-white/30 text-white`
          : `bg-white/5 border-white/10 text-white/60 hover:text-white`
      } ${a && active ? `${a.bg} ${a.text} border-white/20` : ''}`}
    >
      {label}
    </button>
  );
};

const ProspectiveDetail: React.FC<{ card: Card; onClose: () => void }> = ({ card, onClose }) => {
  const a = PROSPECTIVE_2100_ACCENTS[card.status];
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const buildLiteraryFallback = () => {
    const name = card.s.commonName?.trim() || card.s.scientificName;
    const base = card.narrative?.trim() || 'Projection 2100 indisponible.';
    return `À l'horizon 2100, ${name} portera la mémoire des paysages actuels. ${base}`;
  };

  const askIA = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      const { data, error } = await supabase.functions.invoke('prospective-2100-species', {
        body: {
          scientific_name: card.s.scientificName,
          common_name: card.s.commonName,
          iconic_taxon: card.s.iconicTaxon,
          family: card.s.family,
          fallback_status: card.status,
        },
      });
      if (error) {
        // FunctionsHttpError expose le status
        const status = (error as any)?.context?.status ?? (error as any)?.status;
        if (status === 402) throw new Error('credits');
        if (status === 429) throw new Error('rate');
        // Essayer de lire le corps pour un code d'erreur applicatif
        const ctxBody = (error as any)?.context?.body;
        if (typeof ctxBody === 'string' && ctxBody.includes('credits_exhausted')) throw new Error('credits');
        if (typeof ctxBody === 'string' && ctxBody.includes('rate_limited')) throw new Error('rate');
        throw new Error('ai');
      }
      const payload = data as { narrative?: string; error?: string };
      if (payload?.error === 'credits_exhausted') throw new Error('credits');
      if (payload?.error === 'rate_limited') throw new Error('rate');
      const text = payload?.narrative;
      if (!text) throw new Error('empty');
      setAiNarrative(text);
    } catch (e: any) {
      const code = e?.message ?? 'ai';
      const msg =
        code === 'offline'
          ? 'Vous êtes hors ligne — reconnectez-vous pour interroger l\'IA.'
          : code === 'credits'
          ? 'Crédits IA épuisés côté espace — rechargez pour continuer à approfondir.'
          : code === 'rate'
          ? 'Trop de demandes en cours. Réessayez dans quelques secondes.'
          : code === 'empty'
          ? 'L\'IA a répondu trop brièvement. Réessayez pour affiner.'
          : 'L\'IA n\'a pas pu répondre. Réessayez ou lisez le récit heuristique ci-dessous.';
      setAiError(msg);
      setAttempts((n) => n + 1);
    } finally {
      setAiLoading(false);
    }
  };

  const showLiteraryFallback = attempts >= 2 && !aiNarrative;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`max-w-xl w-full rounded-2xl overflow-hidden border border-white/10 ring-1 ${a.ring} bg-[#08111F]`}
      >
        <div className="relative h-56 sm:h-64">
          {card.photo ? <img src={card.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-800" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08111F] via-[#08111F]/40 to-transparent" />
          <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4">
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${a.bg} ${a.text} border border-white/10 backdrop-blur`}>
              {a.label}
            </span>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="text-2xl font-light tracking-tight">{card.s.commonName?.trim() || card.s.scientificName}</h3>
          <p className="italic text-white/60 text-sm">{card.s.scientificName}</p>

          <div className="mt-4 rounded-lg bg-white/[0.04] border border-white/10 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-300/70 mb-2">
              <Cloud className="h-3.5 w-3.5" /> Projection 2100
            </div>
            <p className="text-sm text-white/85 leading-relaxed">{card.narrative}</p>
          </div>

          {aiNarrative && (
            <div className="mt-3 rounded-lg bg-fuchsia-500/10 border border-fuchsia-400/20 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-fuchsia-200 mb-2">
                <Sparkles className="h-3.5 w-3.5" /> Approfondi par l'IA
              </div>
              <p className="text-sm text-white/90 leading-relaxed">{aiNarrative}</p>
            </div>
          )}

          {aiError && (
            <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="text-xs text-rose-100 leading-relaxed">{aiError}</p>
              <button
                onClick={askIA}
                disabled={aiLoading}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-300/40 px-3 py-1 text-[11px] font-medium text-rose-50 hover:bg-rose-500/20 transition disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Réessayer
              </button>
            </div>
          )}

          {showLiteraryFallback && (
            <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/10 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 mb-2">
                <Cloud className="h-3.5 w-3.5" /> Récit heuristique
              </div>
              <p className="text-sm text-white/80 leading-relaxed italic">{buildLiteraryFallback()}</p>
            </div>
          )}

          {aiLoading && !aiNarrative && (
            <p className="mt-3 text-xs text-cyan-200/70 italic animate-pulse">
              ✨ L'IA écoute le paysage…
            </p>
          )}

          <button
            onClick={askIA}
            disabled={aiLoading}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500/30 to-cyan-500/30 border border-white/20 hover:border-white/40 px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiLoading ? 'Génération…' : aiNarrative ? 'Regénérer avec l\'IA' : 'Approfondir avec l\'IA'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Prospective2100;
