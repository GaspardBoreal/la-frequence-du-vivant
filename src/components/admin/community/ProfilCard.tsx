import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ageBracketLabel, computeAgeBracket, cspShortLabel, genderLabel,
} from '@/lib/communityProfileTaxonomy';
import type { EditableProfile } from './MarcheurEditSheet';

interface Props {
  profile: EditableProfile & { marches_count?: number };
  onEdit: (p: EditableProfile) => void;
}

const ROLE_LABELS: Record<string, string> = {
  marcheur_en_devenir: 'En devenir',
  marcheur: 'Marcheur',
  eclaireur: 'Éclaireur',
  ambassadeur: 'Ambassadeur',
  sentinelle: 'Sentinelle',
};

export const ProfilCard: React.FC<Props> = ({ profile, onEdit }) => {
  const initials = `${profile.prenom?.[0] || ''}${profile.nom?.[0] || ''}`.toUpperCase();
  const bracket = computeAgeBracket(profile.date_naissance);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group"
    >
      <Card className="relative overflow-hidden h-full p-4 backdrop-blur bg-card/80 border-border/60 hover:border-primary/40 hover:shadow-lg transition-all">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />

        <div className="relative flex items-start gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold">
              {initials || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{profile.prenom} {profile.nom}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role] || profile.role}</p>
          </div>
        </div>

        <div className="relative mt-3 space-y-1.5 text-xs">
          {profile.ville && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3" /> {profile.ville}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {ageBracketLabel(bracket)}
            </span>
            {profile.genre && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-300">
                {genderLabel(profile.genre)}
              </span>
            )}
            {profile.csp && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {cspShortLabel(profile.csp)}
              </span>
            )}
          </div>
          {profile.csp_precision && (
            <p className="text-[11px] text-muted-foreground italic mt-1 truncate">« {profile.csp_precision} »</p>
          )}
          {profile.kigo_accueil && (
            <p className="text-[11px] text-foreground/80 italic flex items-start gap-1 mt-2">
              <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary/70" />
              <span className="line-clamp-2">{profile.kigo_accueil}</span>
            </p>
          )}
        </div>

        <div className="relative mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {profile.marches_count ?? 0} marche{(profile.marches_count ?? 0) > 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="ghost" onClick={() => onEdit(profile)} className="h-7 px-2">
            <Pencil className="h-3 w-3 mr-1" /> Éditer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default ProfilCard;
