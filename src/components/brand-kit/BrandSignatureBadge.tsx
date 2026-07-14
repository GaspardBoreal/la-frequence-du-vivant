import React from 'react';
import { motion } from 'framer-motion';
import { useBrandKit } from './BrandKitProvider';

/**
 * Rondelle flottante en haut-gauche : logotype scripté du partenaire + tagline,
 * clic → site du partenaire. Signature visible sans envahir.
 */
export const BrandSignatureBadge: React.FC = () => {
  const kit = useBrandKit();
  if (!kit) return null;
  const href = kit.socials?.website ?? '#';
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bk-signature-badge"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      title={`Site officiel — ${kit.partner}`}
    >
      <span className="bk-signature-badge__mark">{kit.partner.split(' ').slice(-1)[0]}</span>
      {kit.tagline && <span className="bk-signature-badge__tagline">{kit.tagline}</span>}
    </motion.a>
  );
};
