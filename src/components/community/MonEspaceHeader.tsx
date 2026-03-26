import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ArrowLeft } from 'lucide-react';
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
      <div className={`sticky top-0 z-40 bg-emerald-950/80 backdrop-blur-xl border-b border-white/10 ${ROLE_GLOW[role]}`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Top row: back + settings */}
          <div className="flex items-center justify-between mb-2">
            <Link to="/marches-du-vivant" className="text-emerald-200/50 hover:text-emerald-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button onClick={() => setSettingsOpen(true)} className="text-emerald-200/50 hover:text-emerald-100 transition-colors p-1">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Profile row */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-600/40 border border-emerald-400/30 flex items-center justify-center text-emerald-100 font-bold text-sm flex-shrink-0"
            >
              {initials}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white font-semibold text-base truncate">{prenom}</h1>
                <RoleBadge role={role} size="sm" darkMode />
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-white/50 text-xs truncate">
                  {kigoAccueil === 'parle_aux_arbres' ? '🌳 Parle aux arbres' :
                   kigoAccueil === 'transition_beton' ? '🏙️ En transition' :
                   kigoAccueil === 'curieux_vivant' ? '🔍 Curieux du vivant' :
                   kigoAccueil === 'expert_canape' ? '🛋️ Expert canapé' : '🌿 Marcheur'}
                </span>
              </div>
            </div>
            <motion.div
              key={totalFrequences}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-400/20 rounded-full px-3 py-1.5 flex-shrink-0"
            >
              <span className="text-amber-400 text-xs">★</span>
              <span className="text-emerald-200 text-sm font-bold">{totalFrequences}</span>
            </motion.div>
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
