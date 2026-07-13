import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Eye, Ear, Sparkles, MapPin, BookOpen, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import m01 from '@/assets/marcheurs/Marcheurs_01.jpeg.asset.json';
import m02 from '@/assets/marcheurs/Marcheurs_02.jpeg.asset.json';
import m03 from '@/assets/marcheurs/Marcheurs_03.jpeg.asset.json';
import m04 from '@/assets/marcheurs/Marcheurs_04.jpeg.asset.json';
import m05 from '@/assets/marcheurs/Marcheurs_05.jpeg.asset.json';
import m07 from '@/assets/marcheurs/Marcheurs_07.jpeg.asset.json';
import m09 from '@/assets/marcheurs/Marcheurs_09.jpeg.asset.json';
import m10 from '@/assets/marcheurs/Marcheurs_10.jpeg.asset.json';
import m11 from '@/assets/marcheurs/Marcheurs_11.jpg.asset.json';
import m12 from '@/assets/marcheurs/Marcheurs_12.jpg.asset.json';
import m13 from '@/assets/marcheurs/Marcheurs_13.jpg.asset.json';

// Bento layout : span classes per index (mobile-first single col, then desktop mosaic)
const BENTO = [
  { asset: m03, alt: 'Selfie de groupe joyeux après une marche', className: 'sm:col-span-2 sm:row-span-2 aspect-[4/5] sm:aspect-auto' },
  { asset: m10, alt: 'Marcheurs observant un jardin partagé', className: 'aspect-[4/5]' },
  { asset: m12, alt: 'Marche en forêt sous la pluie', className: 'aspect-[4/5]' },
  { asset: m04, alt: 'Observation au pied d\'un vieux chêne', className: 'sm:col-span-2 aspect-[4/3]' },
  { asset: m11, alt: 'Cercle d\'écoute au milieu du pré', className: 'aspect-[4/5]' },
  { asset: m02, alt: 'Marcheurs dispersés dans les champs dorés', className: 'aspect-[4/5]' },
  { asset: m13, alt: 'Groupe de marcheurs observant le ciel sur un chemin de campagne', className: 'aspect-[4/5]' },
  { asset: m01, alt: 'Marcheurs en lisière de forêt', className: 'sm:col-span-2 aspect-[4/3]' },
  { asset: m09, alt: 'Atelier étudiants autour d\'une table', className: 'aspect-[4/5]' },
];

const VERBS = [
  { icon: Eye, label: 'Observer', color: 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/20' },
  { icon: Ear, label: 'Écouter', color: 'text-sky-500 bg-sky-500/10 ring-sky-500/20' },
  { icon: Sparkles, label: 'S\'émerveiller', color: 'text-amber-500 bg-amber-500/10 ring-amber-500/20' },
];

const BENEFICES = [
  { icon: MapPin, title: 'Valoriser', text: 'Faire connaître votre lieu par le récit sensible d\'un marcheur.' },
  { icon: BookOpen, title: 'Documenter', text: 'Recevoir l\'inventaire du vivant observé chez vous : espèces, sons, textes.' },
  { icon: Users, title: 'Rassembler', text: 'Accueillir une communauté attentive, curieuse et bienveillante.' },
];

const EnsembleTab: React.FC = () => (
  <div>
    {/* ─── Section marcheurs ─────────────────────────────── */}
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/[0.04] via-transparent to-transparent" />
      <div className="container mx-auto px-4 py-10 sm:py-16 relative">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Users className="h-3.5 w-3.5" />
            La communauté des marcheurs
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-serif tracking-tight">
            La joie de marcher<br />à plusieurs.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Une marche du vivant, c'est un pas commun, un regard partagé, une attention offerte
            au monde. On y vient seul·e, on en repart avec des complices.
          </p>
        </div>

        {/* Verbes */}
        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
          {VERBS.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-4">
              <div className={cn('h-10 w-10 rounded-full flex items-center justify-center ring-1', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Galerie bento */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 auto-rows-auto">
          {BENTO.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={cn(
                'group relative overflow-hidden rounded-2xl bg-muted/40 shadow-sm ring-1 ring-border/50',
                item.className,
              )}
            >
              <img
                src={item.asset.url}
                alt={item.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/marches-du-vivant/connexion">
              Rejoindre la communauté
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/marches-du-vivant/carte-marches-du-vivant?tab=carte">
              Voir les prochaines marches
            </Link>
          </Button>
        </div>
      </div>
    </section>

    {/* ─── Section propriétaires ─────────────────────────── */}
    <section className="relative overflow-hidden border-t border-border bg-gradient-to-br from-amber-500/[0.06] via-background to-emerald-500/[0.05]">
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Image immersive */}
          <div className="relative order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border/50"
            >
              <img src={m07.url} alt="Mains examinant le système racinaire d'une plante" className="h-full w-full object-cover" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute -bottom-6 -right-4 sm:-right-8 w-40 sm:w-56 aspect-square overflow-hidden rounded-2xl shadow-xl ring-4 ring-background"
            >
              <img src={m05.url} alt="Plantation collective dans un jardin" className="h-full w-full object-cover" />
            </motion.div>
          </div>

          {/* Texte + bénéfices */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <MapPin className="h-3.5 w-3.5" />
              Vous avez un lieu à partager ?
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-serif tracking-tight">
              Ouvrez votre territoire<br />au Vivant.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Domaine, ferme, jardin, forêt, friche, sentier... Chaque lieu recèle une histoire
              écologique unique. Accueillez une marche du vivant, et laissez notre communauté
              en révéler la richesse.
            </p>

            <div className="mt-8 space-y-4">
              {BENEFICES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/marches-du-vivant/partenaires">
                  Référencer mon lieu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/marches-du-vivant">Comment ça marche</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default EnsembleTab;
