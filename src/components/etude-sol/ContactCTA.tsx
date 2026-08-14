import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';

export const ContactCTA: React.FC<{ contactHref: string }> = ({ contactHref }) => (
  <section id="contact" className="scroll-mt-16 bg-[hsl(var(--ds-cream))] py-16 sm:py-24">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55 }}
      className="mx-auto max-w-4xl px-5"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[hsl(var(--ds-forest))]/22 bg-white/75 p-8 text-center shadow-[0_10px_40px_hsl(var(--ds-forest-deep)/0.1)] sm:p-12">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[hsl(var(--ds-forest))]/8"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-[hsl(var(--ds-gold))]/12"
        />
        <h2 className="relative font-serif text-3xl leading-tight text-[hsl(var(--ds-forest-deep))] sm:text-4xl">
          Faisons parler votre sol
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
          Parc d’entreprise, domaine, collectivité, jardin privé : nous réalisons le diagnostic sur
          site et vous laissons le carnet, la carte et la palette végétale associée.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={contactHref}
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-forest-deep))] px-6 py-3 text-sm font-bold text-[hsl(var(--ds-cream))] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Mail className="h-4 w-4" /> Demander un diagnostic
          </a>
          <Link
            to="/roadmap/frequence-jardin"
            className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-forest))]/35 px-6 py-3 text-sm font-bold text-[hsl(var(--ds-forest-deep))] transition hover:bg-[hsl(var(--ds-forest))]/10"
          >
            Découvrir Fréquence Jardin <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="relative mt-6 text-[12.5px] text-[hsl(var(--ds-forest-deep))]/60">
          Déjà accompagné ?{' '}
          <Link to="/marches-du-vivant/connexion" className="underline underline-offset-2">
            Accéder à votre espace
          </Link>
        </p>
      </div>
    </motion.div>
  </section>
);

export default ContactCTA;
