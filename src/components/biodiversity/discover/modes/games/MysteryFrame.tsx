import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bird, Bug, Flower2, Leaf, PawPrint, Sprout } from 'lucide-react';
import type { BiodiversitySpecies } from '@/types/biodiversity';
import { photoUrl, displayName } from './gameUtils';

export type MysteryMode = 'blur' | 'keyhole' | 'silhouette' | 'blind';

/**
 * 0 = mystère total
 * 1..4 = paliers d'indices (dé-flou progressif généreux)
 * 5 = révélation totale (bonne/mauvaise réponse OU langue au chat)
 */
export type RevealLevel = 0 | 1 | 2 | 3 | 4 | 5;

interface Props {
  species: BiodiversitySpecies;
  photoBy: Map<string, string>;
  mode: MysteryMode;
  revealLevel: RevealLevel;
  onBlindFallback?: () => void;
}

function kingdomMeta(s: BiodiversitySpecies) {
  const k = (s.kingdom || '').toLowerCase();
  const fam = (s.family || '').toLowerCase();
  if (k === 'fungi') return { Icon: Sprout, label: 'Champignon', emoji: '🍄', tint: '#fef3c7' };
  if (k === 'plantae') return { Icon: Flower2, label: 'Plante', emoji: '🌿', tint: '#dcfce7' };
  if (fam.includes('aves')) return { Icon: Bird, label: 'Oiseau', emoji: '🐦', tint: '#dbeafe' };
  if (fam.includes('insecta')) return { Icon: Bug, label: 'Insecte', emoji: '🦋', tint: '#ffedd5' };
  if (k === 'animalia') return { Icon: PawPrint, label: 'Animal', emoji: '🐾', tint: '#fee2e2' };
  return { Icon: Leaf, label: 'Vivant', emoji: '✿', tint: '#f5f5f4' };
}

/**
 * Cadre mystère du jeu « Qui suis-je ? ».
 * Affiche la photo de l'espèce avec un effet visuel selon le mode,
 * progressivement révélé via revealLevel. Bascule en mode "blind" si l'image échoue.
 */
const MysteryFrame: React.FC<Props> = ({ species, photoBy, mode, revealLevel, onBlindFallback }) => {
  const url = photoUrl(species, photoBy);
  const [failed, setFailed] = useState(false);
  const meta = kingdomMeta(species);
  const effectiveMode: MysteryMode = !url || failed ? 'blind' : mode;

  useEffect(() => {
    if (effectiveMode === 'blind') onBlindFallback?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMode]);

  // --- Mode aveugle : pas d'image, on raconte avec des indices manuscrits
  if (effectiveMode === 'blind') {
    const initial = (displayName(species) || '?').charAt(0).toUpperCase();
    return (
      <div
        className="relative w-full h-full flex flex-col items-center justify-center text-center px-6"
        style={{ background: `radial-gradient(circle at 50% 35%, ${meta.tint}, #faf6ec)` }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl mb-2"
        >
          {meta.emoji}
        </motion.div>
        <p
          className="text-2xl text-[#3B2A1A]"
          style={{ fontFamily: '"Caveat", cursive', fontWeight: 700 }}
        >
          {meta.label}…
        </p>
        {revealLevel >= 1 && (
          <p
            className="mt-2 text-xl text-[#3B2A1A]/80"
            style={{ fontFamily: '"Patrick Hand", sans-serif' }}
          >
            commence par <span className="text-3xl text-amber-800">« {initial} »</span>
          </p>
        )}
        {revealLevel >= 2 && species.family && (
          <p
            className="mt-1 text-base text-[#3B2A1A]/60 italic"
            style={{ fontFamily: '"Patrick Hand", sans-serif' }}
          >
            famille : {species.family}
          </p>
        )}
      </div>
    );
  }

  // Effet visuel selon mode et revealLevel
  const blurPx =
    revealLevel >= 3 ? 0 :
    revealLevel === 2 ? 6 :
    revealLevel === 1 ? 14 :
    28;

  const keyholeRadius =
    revealLevel >= 3 ? 100 :
    revealLevel === 2 ? 65 :
    revealLevel === 1 ? 45 :
    32;

  const baseImg = (
    <img
      src={url}
      alt="espèce mystère"
      onError={() => setFailed(true)}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );

  if (effectiveMode === 'blur') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-amber-50">
        <motion.div
          animate={{ scale: revealLevel >= 3 ? 1 : 1.15 }}
          transition={{ duration: 8, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{
            filter: `blur(${blurPx}px) saturate(${revealLevel >= 3 ? 1 : 1.4})`,
            transition: 'filter 0.6s ease-out',
          }}
        >
          {baseImg}
        </motion.div>
      </div>
    );
  }

  if (effectiveMode === 'silhouette') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#faf6ec]">
        <div
          className="absolute inset-0"
          style={{
            filter:
              revealLevel >= 3
                ? 'none'
                : `contrast(${revealLevel === 0 ? 4 : 3}) brightness(${revealLevel === 0 ? 0.25 : 0.45}) saturate(0)`,
            transition: 'filter 0.6s ease-out',
          }}
        >
          {baseImg}
        </div>
      </div>
    );
  }

  // keyhole
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#e9dfc6' }}>
      {/* fond papier kraft */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(139,92,46,0.08) 0 6px, transparent 6px 14px)",
        }}
      />
      <motion.div
        animate={{ scale: revealLevel >= 3 ? 1 : 1.08 }}
        transition={{ duration: 6, ease: 'easeInOut' }}
        className="absolute inset-0"
        style={{
          WebkitMaskImage:
            revealLevel >= 3
              ? 'none'
              : `radial-gradient(circle at 50% 50%, black ${keyholeRadius}%, transparent ${keyholeRadius + 8}%)`,
          maskImage:
            revealLevel >= 3
              ? 'none'
              : `radial-gradient(circle at 50% 50%, black ${keyholeRadius}%, transparent ${keyholeRadius + 8}%)`,
          transition: 'all 0.6s ease-out',
        }}
      >
        {baseImg}
      </motion.div>
    </div>
  );
};

export default MysteryFrame;
