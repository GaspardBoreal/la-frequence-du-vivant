import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, MapPin, Lock, Camera, Binoculars, Leaf, GraduationCap, ImageOff } from 'lucide-react';
import AnticipationGallery from './AnticipationGallery';

interface AvantPremiereBannerProps {
  title: string;
  dateISO?: string | null;
  lieu?: string | null;
  isRegistered: boolean;
  isValidated: boolean;
  speciesCount?: number;
  eventType?: string | null;
  explorationId?: string | null;
  hasOwnPhotos: boolean;
  isAdmin?: boolean;
  coverMissing?: boolean;
  onOpenApprendre?: () => void;
  onOpenBiodiversite?: () => void;
}

const prepCards = [
  { icon: Camera, title: 'Photographier juste', text: 'Cadrez large puis serré, gardez la localisation activée : chaque photo devient une observation.' },
  { icon: Binoculars, title: 'Regarder autrement', text: 'Les lisières, les pieds de mur, les zones humides : c\'est là que le vivant se concentre.' },
  { icon: Leaf, title: 'Nommer sans se tromper', text: 'Un doute vaut mieux qu\'une erreur. Notez, photographiez, l\'identification viendra après.' },
];

const AvantPremiereBanner: React.FC<AvantPremiereBannerProps> = ({
  title,
  dateISO,
  lieu,
  isRegistered,
  isValidated,
  speciesCount,
  eventType,
  explorationId,
  hasOwnPhotos,
  isAdmin,
  coverMissing,
  onOpenApprendre,
  onOpenBiodiversite,
}) => {
  const date = dateISO ? new Date(dateISO) : null;
  const days = date ? differenceInCalendarDays(date, new Date()) : null;

  const countdown =
    days == null ? null
      : days > 1 ? `dans ${days} jours`
      : days === 1 ? 'demain'
      : days === 0 ? "aujourd'hui"
      : null;

  const statusLabel = isValidated
    ? 'Présence validée — vos contributions sont ouvertes'
    : isRegistered
      ? 'Inscription enregistrée — présence à valider sur place'
      : 'Marche à venir — lecture libre';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-5 space-y-4"
      data-chat-section="avant-premiere"
    >
      {/* Compte à rebours sensible */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-5">
        <motion.div
          aria-hidden
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative">
          {countdown && (
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {countdown}
            </span>
          )}
          <h2 className="mt-2 text-lg font-semibold text-foreground">{title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(date, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
              </span>
            )}
            {lieu && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {lieu}
              </span>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground/80">
            <Lock className="h-3.5 w-3.5 text-primary" />
            {statusLabel}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {typeof speciesCount === 'number' && speciesCount > 0 && (
              <button
                type="button"
                onClick={onOpenBiodiversite}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:border-primary/40"
              >
                🌿 {speciesCount} espèces déjà connues ici
              </button>
            )}
            <button
              type="button"
              onClick={onOpenApprendre}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground transition hover:border-primary/40"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Se préparer
            </button>
          </div>
        </div>
      </div>

      {/* Apprendre avant de marcher */}
      <div className="grid gap-2 sm:grid-cols-3">
        {prepCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="rounded-xl border border-border bg-card/60 p-3">
              <Icon className="mb-1.5 h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">{c.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{c.text}</p>
            </div>
          );
        })}
      </div>

      {/* Galerie d'anticipation — seulement si la marche n'a pas encore d'images */}
      {!hasOwnPhotos && (
        <AnticipationGallery eventType={eventType} excludeExplorationId={explorationId} />
      )}

      {/* Rattrapage éditorial (curateurs) */}
      {isAdmin && coverMissing && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <ImageOff className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] leading-snug text-amber-800 dark:text-amber-200">
            Cette marche n'a pas d'image de couverture : c'est pourtant le premier écran que voient
            les inscrits arrivés par le QR code. Ajoutez-en une dans la fiche de l'événement.
          </p>
        </div>
      )}
    </motion.section>
  );
};

export default AvantPremiereBanner;
