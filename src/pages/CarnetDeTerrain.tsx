import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Leaf, Camera, Headphones, Bird, Flower2, TreeDeciduous, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Footer from '@/components/Footer';
import BotanicalLeaf from '@/components/carnets/BotanicalLeaf';
import { useFeaturedMarches } from '@/hooks/useFeaturedMarches';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/slugGenerator';
import { getSeasonFromDate, getKigoSuggestions } from '@/components/carnets/carnetUtils';
import { Loader2 } from 'lucide-react';

/* ── Scroll direction hook ── */
function useScrollDirection() {
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  const onScroll = useCallback(() => {
    const y = window.scrollY;
    if (y < 100) { setVisible(true); }
    else if (y > lastY + 10) { setVisible(false); }
    else if (y < lastY - 10) { setVisible(true); }
    setLastY(y);
  }, [lastY]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return visible;
}

/* ── Trame Ambassadeur data ── */
const TRAME_STEPS = [
  {
    time: '09h',
    title: "L'Accordage",
    duration: '15–20 min',
    icon: Clock,
    items: [
      'Cercle : prénom + "ce que je viens écouter"',
      'Silence actif (1 min) : chacun ferme les yeux',
      '"Ici, on ne récolte pas : on témoigne."',
      '"La donnée est une trace, pas un trophée."',
      '"Le vivant a le droit au secret."',
      'Choix du kigo : 1 mot proposé par personne → vote du "plus juste"',
    ],
  },
  {
    time: '10h',
    title: 'Marche des Capteurs',
    duration: '60 min',
    icon: Headphones,
    items: [
      'Marche lente — 3 arrêts de 7 min',
      'Arrêt 1 : écouter le sol (frottements, insectes, eau)',
      'Arrêt 2 : écouter la haie/bois (passereaux, stridulations)',
      'Arrêt 3 : écouter le ciel (appel, vent, lointain)',
      '1 son max enregistré ou rien, si ça dérange',
    ],
  },
  {
    time: '11h',
    title: 'Éclosion Géopoétique',
    duration: '25–35 min',
    icon: Flower2,
    items: [
      'Chacun produit une trace au choix :',
      '— 3 lignes (haïku libre)',
      '— titre + 5 mots + 1 phrase',
      '— croquis rapide + 1 phrase',
      'Lecture volontaire (pas obligatoire)',
    ],
  },
  {
    time: '12h',
    title: 'Banquet des Retours',
    duration: '20–30 min',
    icon: TreeDeciduous,
    items: [
      '1 tour de cercle : "ce que je repars avec"',
      'Collecte finale : 1 mot (kigo) + 1 phrase par personne',
      'Photo de groupe optionnelle',
      'Format "Carte postale du vivant" pour partage social',
    ],
  },
];

const CarnetDeTerrain: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: allMarches, isLoading: isLoadingMarches } = useFeaturedMarches(999, true);

  // Find the matching marche
  const marche = useMemo(() => {
    if (!allMarches || !slug) return null;
    return allMarches.find(m => createSlug(m.nom_marche || '', m.ville) === slug);
  }, [allMarches, slug]);

  // Compute prev/next marches
  const { prevMarche, nextMarche, currentIndex, total } = useMemo(() => {
    if (!allMarches || !marche) return { prevMarche: null, nextMarche: null, currentIndex: -1, total: 0 };
    const sorted = [...allMarches].sort((a, b) => b.completeness_score - a.completeness_score);
    const idx = sorted.findIndex(m => m.id === marche.id);
    return {
      prevMarche: idx > 0 ? sorted[idx - 1] : null,
      nextMarche: idx < sorted.length - 1 ? sorted[idx + 1] : null,
      currentIndex: idx,
      total: sorted.length,
    };
  }, [allMarches, marche]);

  const navVisible = useScrollDirection();

  // Fetch photos + audio for this marche
  const { data: photos } = useQuery({
    queryKey: ['carnet-photos', marche?.id],
    queryFn: async () => {
      if (!marche?.id) return [];
      const { data } = await supabase
        .from('marche_photos')
        .select('id, url_supabase, titre, description, ordre')
        .eq('marche_id', marche.id)
        .order('ordre', { ascending: true });
      return data || [];
    },
    enabled: !!marche?.id,
  });

  const { data: audios } = useQuery({
    queryKey: ['carnet-audio', marche?.id],
    queryFn: async () => {
      if (!marche?.id) return [];
      const { data } = await supabase
        .from('marche_audio')
        .select('id, url_supabase, titre, description, duree_secondes')
        .eq('marche_id', marche.id)
        .order('ordre', { ascending: true });
      return data || [];
    },
    enabled: !!marche?.id,
  });

  const season = marche ? getSeasonFromDate(marche.date) : 'printemps';
  const kigos = marche ? getKigoSuggestions(marche.ville, season) : [];

  const formattedDate = marche?.date
    ? new Date(marche.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (isLoadingMarches) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500/60" />
      </div>
    );
  }

  if (!marche) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-serif italic text-lg">Ce carnet n'existe pas encore.</p>
        <Link to="/marches-du-vivant/carnets-de-terrain" className="text-emerald-400 hover:underline text-sm">
          ← Retour à la galerie
        </Link>
      </div>
    );
  }

  const displayName = marche.nom_marche || marche.ville;

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background pb-16">
        <SEOHead
          title={`${displayName} — Carnet de Terrain`}
          description={marche.descriptif_court || `Carnet de terrain : ${displayName}, ${marche.ville}. ${marche.total_species} espèces, ${marche.photos_count} photos.`}
        />

        {/* ═══ Section 1 : Hero ═══ */}
        <section className="relative min-h-[60vh] flex items-end overflow-hidden">
          {marche.cover_photo_url ? (
            <img
              src={marche.cover_photo_url}
              alt={displayName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 to-emerald-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          <div className="relative w-full max-w-4xl mx-auto px-6 pb-12 pt-24 space-y-4">
            <Link
              to="/marches-du-vivant/carnets-de-terrain"
              className="inline-flex items-center gap-2 text-sm text-emerald-400/80 hover:text-emerald-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Carnets de Terrain
            </Link>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-crimson text-3xl md:text-5xl lg:text-6xl text-foreground leading-tight"
            >
              {displayName}
            </motion.h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" />{marche.ville}{marche.departement ? `, ${marche.departement}` : ''}</span>
              {formattedDate && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-500" />{formattedDate}</span>}
              {marche.region && <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/15 border border-amber-400/20 text-amber-300">{marche.region}</span>}
            </div>

            <div className="flex gap-3 pt-2">
              {marche.total_species > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  <Leaf className="w-4 h-4" /> {marche.total_species} espèces
                </span>
              )}
              {marche.photos_count > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full">
                  <Camera className="w-4 h-4" /> {marche.photos_count} photos
                </span>
              )}
              {marche.audio_count > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <Headphones className="w-4 h-4" /> {marche.audio_count} audio
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ═══ Section 2 : Le Territoire ═══ */}
        <section className="max-w-4xl mx-auto px-6 py-16 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-0.5 bg-emerald-500/40" />
            <h2 className="font-crimson text-2xl md:text-3xl text-foreground">Le Territoire</h2>
          </div>

          {marche.descriptif_court && (
            <p className="text-muted-foreground text-lg font-serif italic leading-relaxed">
              {marche.descriptif_court}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Leaf, value: marche.total_species, label: 'Espèces', color: 'emerald' },
              { icon: Bird, value: marche.birds_count, label: 'Oiseaux', color: 'sky' },
              { icon: Flower2, value: marche.plants_count, label: 'Plantes', color: 'green' },
              { icon: Camera, value: marche.photos_count, label: 'Photos', color: 'amber' },
            ].map(({ icon: Icon, value, label, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white/[0.05] border border-border/30 rounded-xl p-4 text-center space-y-1"
              >
                <Icon className={`w-5 h-5 mx-auto text-${color}-400/70`} />
                <p className="text-2xl font-semibold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ Section 3 : La Trame Ambassadeur ═══ */}
        <section className="relative py-16 overflow-hidden">
          <BotanicalLeaf className="absolute top-8 right-8 w-24 text-emerald-700 opacity-40" flip />
          <div className="max-w-4xl mx-auto px-6 space-y-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-0.5 bg-emerald-500/40" />
              <h2 className="font-crimson text-2xl md:text-3xl text-foreground">La Trame</h2>
            </div>
            <p className="text-muted-foreground font-serif italic">
              Protocole géopoétique en 4 temps — de l'accordage au banquet des retours.
            </p>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-emerald-500/20" />

              <div className="space-y-8">
                {TRAME_STEPS.map((step, i) => (
                  <motion.div
                    key={step.time}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pl-14"
                  >
                    {/* Time dot */}
                    <div className="absolute left-0 top-1 w-11 h-11 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                      <span className="text-xs font-mono text-emerald-400">{step.time}</span>
                    </div>

                    <div className="bg-white/[0.04] border border-border/30 rounded-xl p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <step.icon className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-crimson text-lg text-foreground">{step.title}</h3>
                        <span className="text-xs text-muted-foreground ml-auto">{step.duration}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {step.items.map((item, j) => (
                          <li key={j} className="text-sm text-muted-foreground leading-relaxed pl-3 border-l border-emerald-500/10">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Kigo suggestions */}
            <div className="mt-12 space-y-4">
              <h3 className="font-crimson text-xl text-foreground">5 Kigo suggérés — {season === 'printemps' ? 'Printemps' : season === 'ete' ? 'Été' : season === 'automne' ? 'Automne' : 'Hiver'}</h3>
              <p className="text-sm text-muted-foreground italic">
                Micro-rituel : demander au groupe de proposer 1 mot chacun, puis voter non pas "le plus joli" mais "le plus juste".
              </p>
              <div className="grid gap-3">
                {kigos.map((kigo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white/[0.04] border border-border/30 rounded-lg p-4"
                  >
                    <p className="font-crimson text-foreground mb-2">{i + 1}. {kigo.titre}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p className="text-emerald-400/70 italic">Matin : <span className="text-muted-foreground">{kigo.matin}</span></p>
                      <p className="text-amber-400/70 italic">Soir : <span className="text-muted-foreground">{kigo.soir}</span></p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Section 4 : Les Traces ═══ */}
        {((photos && photos.length > 0) || (audios && audios.length > 0)) && (
          <section className="max-w-4xl mx-auto px-6 py-16 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-0.5 bg-emerald-500/40" />
              <h2 className="font-crimson text-2xl md:text-3xl text-foreground">Les Traces</h2>
            </div>

            {/* Photos grid */}
            {photos && photos.length > 0 && (
              <div className="columns-2 md:columns-3 gap-3 space-y-3">
                {photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="break-inside-avoid"
                  >
                    <img
                      src={photo.url_supabase}
                      alt={photo.titre || photo.description || 'Photo de terrain'}
                      className="w-full rounded-lg"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Audio players */}
            {audios && audios.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-crimson text-lg text-foreground flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-amber-400" /> Captations sonores
                </h3>
                {audios.map((audio) => (
                  <div key={audio.id} className="bg-white/[0.04] border border-border/30 rounded-lg p-4 space-y-2">
                    {audio.titre && <p className="text-sm text-foreground">{audio.titre}</p>}
                    {audio.description && <p className="text-xs text-muted-foreground italic">{audio.description}</p>}
                    <audio controls className="w-full h-10" preload="none">
                      <source src={audio.url_supabase} />
                    </audio>
                  </div>
                ))}
              </div>
            )}

            {/* Link to full detail */}
            <div className="pt-4">
              <Link
                to={`/marche/${createSlug(marche.nom_marche || '', marche.ville)}`}
                className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
              >
                Voir la page complète de cette marche →
              </Link>
            </div>
          </section>
        )}

        {/* ═══ Section 5 : CTA Ambassadeur ═══ */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)'
          }} />
          <BotanicalLeaf className="absolute bottom-4 left-8 w-20 text-emerald-700 opacity-30" />

          <div className="max-w-2xl mx-auto px-6 text-center space-y-6 relative">
            <h2 className="font-crimson text-2xl md:text-3xl text-foreground">
              Reproduisez cette marche dans votre territoire
            </h2>
            <p className="text-muted-foreground font-serif italic">
              Chaque lieu a ses voix. Devenez ambassadeur et créez votre propre carnet de terrain.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/marches-du-vivant/explorer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Devenez Marcheur du Vivant
              </Link>
              <Link
                to="/marches-du-vivant/entreprises"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.06] border border-border/40 hover:border-emerald-400/40 text-foreground rounded-lg text-sm transition-colors"
              >
                Organiser pour votre structure
              </Link>
            </div>
          </div>
        </section>

        <Footer />

        {/* ═══ Navigation Précédent / Suivant ═══ */}
        <nav
          className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
            navVisible ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="bg-background/80 backdrop-blur-xl border-t border-emerald-500/15">
            <div className="max-w-4xl mx-auto flex items-center h-[60px]">
              {/* Prev */}
              {prevMarche ? (
                <Link
                  to={`/marches-du-vivant/carnets-de-terrain/${createSlug(prevMarche.nom_marche || '', prevMarche.ville)}`}
                  className="flex items-center gap-2 px-4 h-full flex-1 min-w-0 group transition-colors hover:bg-white/[0.04]"
                >
                  <ChevronLeft className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-crimson text-foreground/80 truncate text-sm hidden md:block">
                    {prevMarche.nom_marche || prevMarche.ville}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-4 h-full flex-1 opacity-30 pointer-events-none">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              )}

              {/* Center indicator */}
              <div className="shrink-0 px-3 text-center">
                <span className="text-xs text-muted-foreground font-mono">
                  {currentIndex + 1} / {total}
                </span>
              </div>

              {/* Next */}
              {nextMarche ? (
                <Link
                  to={`/marches-du-vivant/carnets-de-terrain/${createSlug(nextMarche.nom_marche || '', nextMarche.ville)}`}
                  className="flex items-center justify-end gap-2 px-4 h-full flex-1 min-w-0 group transition-colors hover:bg-white/[0.04]"
                >
                  <span className="font-crimson text-foreground/80 truncate text-sm hidden md:block">
                    {nextMarche.nom_marche || nextMarche.ville}
                  </span>
                  <ChevronRight className="w-5 h-5 text-emerald-500 shrink-0" />
                </Link>
              ) : (
                <div className="flex items-center justify-end gap-2 px-4 h-full flex-1 opacity-30 pointer-events-none">
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>
    </HelmetProvider>
  );
};

export default CarnetDeTerrain;
