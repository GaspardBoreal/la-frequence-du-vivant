import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bird, Bug, Leaf, TreePine, Rabbit, Fish, Sparkles, ArrowRight,
  Share2, Trophy, RotateCcw, ChevronLeft, Check, X, Eye, MapPin,
} from 'lucide-react';
import {
  usePublicEvent,
  usePublicEventBiodiversity,
  logPublicEventCtaClick,
  logPublicEventShare,
  type PublicSpecies,
} from '@/hooks/usePublicEvent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/* ---------------- Tag taxonomy (iconic_taxon → tag) ---------------- */

interface TagDef {
  id: string;
  emoji: string;
  label: string;
  icon: React.ElementType;
  match: (iconic: string | null) => boolean;
  hue: string;          // tailwind color name
  poetic: string;       // hero subtitle
}

const TAGS: TagDef[] = [
  { id: 'papillons', emoji: '🦋', label: 'Papillons & insectes', icon: Bug,
    match: (i) => i === 'Insecta' || i === 'Arachnida',
    hue: 'violet', poetic: 'Les peuples ailés du tout-petit' },
  { id: 'oiseaux', emoji: '🐦', label: 'Oiseaux', icon: Bird,
    match: (i) => i === 'Aves',
    hue: 'amber', poetic: 'Voix du ciel, sentinelles des saisons' },
  { id: 'plantes', emoji: '🌿', label: 'Plantes', icon: Leaf,
    match: (i) => i === 'Plantae',
    hue: 'emerald', poetic: 'Les architectes silencieuses du paysage' },
  { id: 'arbres', emoji: '🌳', label: 'Arbres & champignons', icon: TreePine,
    match: (i) => i === 'Fungi',
    hue: 'lime', poetic: 'Mémoire profonde, racines invisibles' },
  { id: 'mammiferes', emoji: '🦊', label: 'Mammifères', icon: Rabbit,
    match: (i) => i === 'Mammalia' || i === 'Reptilia' || i === 'Amphibia',
    hue: 'rose', poetic: 'Le sauvage qui partage nos chemins' },
  { id: 'autres', emoji: '✨', label: 'Autres rencontres', icon: Sparkles,
    match: (i) => !['Insecta','Arachnida','Aves','Plantae','Fungi','Mammalia','Reptilia','Amphibia'].includes(i || ''),
    hue: 'cyan', poetic: 'Le vivant qui échappe aux cases' },
];

const findTag = (iconic: string | null) =>
  TAGS.find(t => t.match(iconic)) || TAGS[TAGS.length - 1];

/* ---------------- Page ---------------- */

type Step = 'portal' | 'tags' | 'cards' | 'quiz' | 'badge';

const ApprendreMarchePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEvent(slug);
  const { data: bio } = usePublicEventBiodiversity(slug);

  const [step, setStep] = useState<Step>('portal');
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  /* Group species by tag */
  const grouped = useMemo(() => {
    const m: Record<string, PublicSpecies[]> = {};
    (bio?.species || []).forEach(s => {
      const t = findTag(s.iconic_taxon);
      if (!m[t.id]) m[t.id] = [];
      m[t.id].push(s);
    });
    return m;
  }, [bio]);

  const tagsWithCounts = useMemo(
    () => TAGS.filter(t => (grouped[t.id]?.length || 0) > 0)
      .map(t => ({ ...t, count: grouped[t.id].length })),
    [grouped],
  );

  const activeTag = TAGS.find(t => t.id === activeTagId);
  const activeSpecies = activeTagId ? (grouped[activeTagId] || []) : [];
  const totalSpecies = bio?.species_count || 0;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-600">Chargement…</div>;
  }
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-8 text-center">
        <p className="text-stone-700">Cette marche n'existe pas ou n'est pas encore publique.</p>
        <Link to="/" className="text-emerald-700 underline mt-4">Retour à l'accueil</Link>
      </div>
    );
  }

  const handleStart = () => {
    logPublicEventCtaClick(slug!, 'apprendre_started');
    setStep('tags');
  };

  const handleTagPick = (id: string) => {
    logPublicEventCtaClick(slug!, `apprendre_tag:${id}`);
    setActiveTagId(id);
    setStep('cards');
  };

  return (
    <>
      <Helmet>
        <title>{`Apprendre le vivant de ${event.title} — La Fréquence du Vivant`}</title>
        <meta name="description" content={`Découvre, reconnais et mémorise les ${totalSpecies} espèces observées lors de la marche "${event.title}". Une expérience pédagogique courte, incarnée, gratuite.`} />
        <link rel="canonical" href={`https://la-frequence-du-vivant.com/apprendre/${slug}`} />
        <meta property="og:title" content={`Apprendre le vivant de ${event.title}`} />
        <meta property="og:description" content={`${totalSpecies} espèces réelles, racontées par les marcheurs qui les ont rencontrées.`} />
        <meta property="og:url" content={`https://la-frequence-du-vivant.com/apprendre/${slug}`} />
        <meta property="og:type" content="website" />
        {event.cover_image_url && <meta property="og:image" content={event.cover_image_url} />}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-stone-50 via-emerald-50/30 to-stone-50 text-stone-900">
        <AnimatePresence mode="wait">
          {step === 'portal' && (
            <Portal key="portal" event={event} totalSpecies={totalSpecies} onStart={handleStart} />
          )}
          {step === 'tags' && (
            <TagPicker key="tags" tags={tagsWithCounts} onPick={handleTagPick} eventTitle={event.title} />
          )}
          {step === 'cards' && activeTag && (
            <CardDeck
              key="cards"
              tag={activeTag}
              species={activeSpecies}
              onDone={() => setStep('quiz')}
              onBack={() => setStep('tags')}
            />
          )}
          {step === 'quiz' && activeTag && (
            <FlashQuiz
              key="quiz"
              tag={activeTag}
              species={activeSpecies}
              onDone={() => setStep('badge')}
            />
          )}
          {step === 'badge' && activeTag && (
            <BadgeReveal
              key="badge"
              tag={activeTag}
              eventTitle={event.title}
              slug={slug!}
              speciesCount={activeSpecies.length}
              onAgain={() => { setStep('tags'); setActiveTagId(null); }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/* ---------------- 1. Portal ---------------- */

const Portal: React.FC<{ event: any; totalSpecies: number; onStart: () => void }> = ({ event, totalSpecies, onStart }) => (
  <motion.section
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center"
  >
    {event.cover_image_url && (
      <div
        className="absolute inset-0 -z-10 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${event.cover_image_url})` }}
      />
    )}
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-6xl mb-6">🌿</motion.div>
    <p className="text-sm uppercase tracking-widest text-emerald-700 font-medium mb-3">
      Apprendre le vivant
    </p>
    <h1 className="font-serif text-3xl md:text-5xl text-stone-900 max-w-2xl leading-tight mb-4">
      Découvre les <span className="text-emerald-700">{totalSpecies}</span> espèces vivantes de
    </h1>
    <h2 className="font-serif italic text-2xl md:text-3xl text-stone-700 max-w-2xl mb-8">
      {event.title}
    </h2>
    {event.lieu && (
      <p className="text-stone-500 flex items-center gap-2 mb-10">
        <MapPin className="w-4 h-4" />
        {event.lieu}
      </p>
    )}
    <Button
      onClick={onStart}
      size="lg"
      className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-6 rounded-full text-base shadow-lg shadow-emerald-700/20"
    >
      Commencer le voyage <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
    <p className="text-xs text-stone-400 mt-6 max-w-md">
      ~5 minutes par tag · Sans inscription · Une carte = une rencontre réelle
    </p>
  </motion.section>
);

/* ---------------- 2. Tag picker ---------------- */

const TagPicker: React.FC<{
  tags: (TagDef & { count: number })[];
  onPick: (id: string) => void;
  eventTitle: string;
}> = ({ tags, onPick, eventTitle }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
    className="min-h-screen px-6 py-12 max-w-3xl mx-auto"
  >
    <p className="text-xs uppercase tracking-widest text-emerald-700 mb-2">Choisis ta famille</p>
    <h2 className="font-serif text-2xl md:text-3xl text-stone-900 mb-8">
      Qui veux-tu apprendre à reconnaître à <span className="italic">{eventTitle}</span> ?
    </h2>
    <div className="grid sm:grid-cols-2 gap-4">
      {tags.map((t, i) => (
        <motion.button
          key={t.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPick(t.id)}
          className="group text-left p-5 rounded-2xl bg-white border border-stone-200 hover:border-emerald-400 hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-4xl">{t.emoji}</span>
            <Badge className="bg-emerald-100 text-emerald-800 border-0">{t.count}</Badge>
          </div>
          <h3 className="font-serif text-lg text-stone-900 mb-1">{t.label}</h3>
          <p className="text-sm text-stone-500 italic">{t.poetic}</p>
          <p className="text-xs text-emerald-700 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Découvrir <ArrowRight className="w-3 h-3" />
          </p>
        </motion.button>
      ))}
    </div>
  </motion.section>
);

/* ---------------- 3. Memory card deck (swipe + flip) ---------------- */

const CardDeck: React.FC<{
  tag: TagDef;
  species: PublicSpecies[];
  onDone: () => void;
  onBack: () => void;
}> = ({ tag, species, onDone, onBack }) => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = species[idx];
  const progress = ((idx) / species.length) * 100;

  // 3 multiple choice options (current name + 2 distractors from same tag)
  const choices = useMemo(() => {
    if (!current) return [];
    const others = species.filter(s => s.scientific_name !== current.scientific_name);
    const distractors = [...others].sort(() => Math.random() - 0.5).slice(0, 2);
    return [...distractors, current]
      .sort(() => Math.random() - 0.5)
      .map(s => ({ name: s.common_name || s.scientific_name, correct: s.scientific_name === current.scientific_name }));
  }, [idx, species]);

  const [answered, setAnswered] = useState<string | null>(null);

  const handleAnswer = (name: string, correct: boolean) => {
    setAnswered(name);
    if (correct) {
      setTimeout(() => setFlipped(true), 400);
    } else {
      setTimeout(() => setFlipped(true), 600);
    }
  };

  const next = useCallback(() => {
    setFlipped(false);
    setAnswered(null);
    if (idx + 1 >= species.length) {
      onDone();
    } else {
      setIdx(idx + 1);
    }
  }, [idx, species.length, onDone]);

  if (!current) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col px-4 py-6 max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-stone-500 hover:text-stone-800 p-2"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-sm text-stone-600">
          <span className="text-xl mr-1">{tag.emoji}</span>
          {idx + 1} / {species.length}
        </div>
        <div className="w-9" />
      </div>
      {/* Progress */}
      <div className="h-1 bg-stone-200 rounded-full overflow-hidden mb-6">
        <motion.div className="h-full bg-emerald-600" animate={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md" style={{ perspective: 1200 }}>
          <motion.div
            className="relative w-full"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.7, type: 'spring', damping: 18 }}
          >
            {/* RECTO */}
            <div className="rounded-3xl overflow-hidden bg-white shadow-2xl shadow-stone-300/50 border border-stone-100"
                 style={{ backfaceVisibility: 'hidden' }}>
              <div className="aspect-square bg-stone-100 relative">
                {current.photo_url ? (
                  <img src={current.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl text-stone-300">
                    {tag.emoji}
                  </div>
                )}
                {current.has_walker_observation && (
                  <Badge className="absolute top-3 left-3 bg-white/90 text-emerald-800 border-0 shadow">
                    📸 Photo d'un marcheur
                  </Badge>
                )}
              </div>
              <div className="p-5">
                <p className="text-sm text-stone-500 mb-3">Qui suis-je ?</p>
                <div className="space-y-2">
                  {choices.map(c => {
                    const isAnswered = answered !== null;
                    const isThis = answered === c.name;
                    const showCorrect = isAnswered && c.correct;
                    const showWrong = isThis && !c.correct;
                    return (
                      <button
                        key={c.name}
                        disabled={isAnswered}
                        onClick={() => handleAnswer(c.name, c.correct)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                          showCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-900' :
                          showWrong ? 'bg-rose-50 border-rose-300 text-rose-900' :
                          isAnswered ? 'bg-stone-50 border-stone-200 text-stone-400' :
                          'bg-white border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-stone-700'
                        }`}
                      >
                        <span className="italic">{c.name}</span>
                        {showCorrect && <Check className="w-4 h-4" />}
                        {showWrong && <X className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* VERSO */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-stone-50 shadow-2xl shadow-stone-300/50 border border-emerald-100 p-6 flex flex-col"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="text-4xl mb-3">{tag.emoji}</div>
              <h3 className="font-serif text-2xl text-stone-900 mb-1">
                {current.common_name || current.scientific_name}
              </h3>
              <p className="text-sm italic text-stone-500 mb-4">{current.scientific_name}</p>

              <div className="space-y-3 text-sm text-stone-700 flex-1">
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
                  <span>
                    Observée <strong>{current.observations_count}</strong> fois pendant cette marche
                  </span>
                </div>
                {current.has_walker_observation && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                    <span className="italic">Photographiée par un marcheur — pas une image générique d'internet</span>
                  </div>
                )}
                <p className="text-xs text-stone-500 pt-2 border-t border-stone-200">
                  💡 Astuce de mémoire : retiens un seul détail visuel — la couleur dominante, la forme, le mouvement.
                </p>
              </div>

              <Button onClick={next} className="bg-emerald-700 hover:bg-emerald-800 text-white mt-4">
                {idx + 1 >= species.length ? 'Passer au quiz' : 'Suivante'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

/* ---------------- 4. Flash quiz (3 photo→name questions) ---------------- */

const FlashQuiz: React.FC<{
  tag: TagDef;
  species: PublicSpecies[];
  onDone: () => void;
}> = ({ tag, species, onDone }) => {
  const questions = useMemo(() => {
    const withPhotos = species.filter(s => s.photo_url);
    const pool = withPhotos.length >= 4 ? withPhotos : species;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(3, pool.length));
    return shuffled.map(target => {
      const others = pool.filter(s => s.scientific_name !== target.scientific_name);
      const distractors = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
      const choices = [...distractors, target]
        .sort(() => Math.random() - 0.5)
        .map(s => ({ name: s.common_name || s.scientific_name, correct: s.scientific_name === target.scientific_name }));
      return { target, choices };
    });
  }, [species]);

  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[qIdx];

  if (!q) {
    // No questions possible
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={onDone}>Continuer</Button>
      </div>
    );
  }

  const handlePick = (name: string, correct: boolean) => {
    setPicked(name);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (qIdx + 1 >= questions.length) onDone();
      else setQIdx(qIdx + 1);
    }, 900);
  };

  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col px-4 py-6 max-w-xl mx-auto"
    >
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-widest text-emerald-700">Quiz éclair</p>
        <p className="text-sm text-stone-500 mt-1">Question {qIdx + 1} / {questions.length}</p>
      </div>

      <div className="aspect-square w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-stone-100 shadow-xl mb-6">
        {q.target.photo_url ? (
          <img src={q.target.photo_url} alt="Identifier cette espèce" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">{tag.emoji}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
        {q.choices.map(c => {
          const isPicked = picked === c.name;
          const showCorrect = picked !== null && c.correct;
          const showWrong = isPicked && !c.correct;
          return (
            <button
              key={c.name}
              disabled={picked !== null}
              onClick={() => handlePick(c.name, c.correct)}
              className={`p-3 rounded-xl border text-sm italic transition-all ${
                showCorrect ? 'bg-emerald-100 border-emerald-500 text-emerald-900' :
                showWrong ? 'bg-rose-100 border-rose-400 text-rose-900' :
                picked !== null ? 'bg-stone-50 border-stone-200 text-stone-400' :
                'bg-white border-stone-200 hover:border-emerald-400 text-stone-800'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="text-center mt-6 text-sm text-stone-500">
        Score : <strong className="text-emerald-700">{score}</strong> / {questions.length}
      </div>
    </motion.section>
  );
};

/* ---------------- 5. Badge reveal ---------------- */

const BadgeReveal: React.FC<{
  tag: TagDef;
  eventTitle: string;
  slug: string;
  speciesCount: number;
  onAgain: () => void;
}> = ({ tag, eventTitle, slug, speciesCount, onAgain }) => {
  const handleShare = async () => {
    const url = `${window.location.origin}/apprendre/${slug}`;
    const text = `Je viens d'apprendre à reconnaître les ${tag.label.toLowerCase()} de ${eventTitle} 🌿 ${url}`;
    logPublicEventShare(slug, 'apprendre_badge');
    if (navigator.share) {
      try { await navigator.share({ title: 'La Fréquence du Vivant', text, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Lien copié dans le presse-papier');
      } catch {
        toast.error('Impossible de partager');
      }
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative mb-8"
      >
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-7xl shadow-2xl shadow-emerald-600/30">
          {tag.emoji}
        </div>
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}
          className="absolute -bottom-2 -right-2 bg-amber-400 rounded-full p-3 shadow-lg"
        >
          <Trophy className="w-6 h-6 text-white" />
        </motion.div>
      </motion.div>

      <h2 className="font-serif text-3xl md:text-4xl text-stone-900 max-w-md mb-3">
        Tu connais les {speciesCount} {tag.label.toLowerCase()}
      </h2>
      <p className="text-stone-600 italic mb-8">de {eventTitle}</p>

      <p className="text-sm text-stone-500 max-w-md mb-10">
        Ces espèces vivent près de chez toi. La prochaine fois que tu marches, ouvre les yeux — tu en reconnaîtras peut-être une.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button onClick={handleShare} className="bg-emerald-700 hover:bg-emerald-800 text-white flex-1">
          <Share2 className="w-4 h-4 mr-2" /> Partager
        </Button>
        <Button onClick={onAgain} variant="outline" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" /> Autre famille
        </Button>
      </div>

      <Link
        to={`/m/${slug}`}
        onClick={() => logPublicEventCtaClick(slug, 'apprendre_to_event')}
        className="text-sm text-emerald-700 hover:text-emerald-900 mt-8 underline underline-offset-4"
      >
        Voir la marche complète →
      </Link>
    </motion.section>
  );
};

export default ApprendreMarchePage;
