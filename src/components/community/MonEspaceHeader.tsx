import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';
import RoleBadge from './RoleBadge';
import { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import MonEspaceSettings from './MonEspaceSettings';

interface MonEspaceHeaderProps {
  prenom: string;
  nom: string;
  email: string;
  ville: string | null;
  role: CommunityRoleKey;
  totalFrequences: number;
  kigoAccueil: string | null;
  onSignOut: () => void;
}

const ROLE_GLOW: Record<CommunityRoleKey, string> = {
  marcheur_en_devenir: 'shadow-[0_1px_0_0_rgba(110,231,183,0.3)]',
  marcheur: 'shadow-[0_1px_0_0_rgba(52,211,153,0.4)]',
  eclaireur: 'shadow-[0_1px_0_0_rgba(45,212,191,0.4)]',
  ambassadeur: 'shadow-[0_1px_0_0_rgba(56,189,248,0.4)]',
  sentinelle: 'shadow-[0_1px_0_0_rgba(251,191,36,0.4)]',
};

const MonEspaceHeader: React.FC<MonEspaceHeaderProps> = ({
  prenom, nom, email, ville, role, totalFrequences, kigoAccueil, onSignOut,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const initials = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();

  return (
    <>
      <div className={`sticky top-0 z-40 bg-white/95 dark:bg-background/80 backdrop-blur-xl border-b border-border/40 dark:border-border/30 ${ROLE_GLOW[role]}`}>
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <Link to="/marches-du-vivant" className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border border-primary/30 flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0"
            >
              {initials}
            </motion.div>
            <div className="flex-1 min-w-0">
              <RoleBadge role={role} size="sm" darkMode />
            </div>
            <motion.div
              key={totalFrequences}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-secondary border border-border rounded-full px-2 py-1 flex-shrink-0"
            >
              <span className="text-amber-500 dark:text-amber-400 text-[10px]">★</span>
              <span className="text-foreground text-xs font-bold">{totalFrequences}</span>
            </motion.div>
            <ThemeToggle />
            <button onClick={() => setSettingsOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1 flex-shrink-0">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <MonEspaceSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        prenom={prenom}
        nom={nom}
        email={email}
        ville={ville}
        role={role}
        onSignOut={onSignOut}
      />
    </>
  );
};

export default MonEspaceHeader;
