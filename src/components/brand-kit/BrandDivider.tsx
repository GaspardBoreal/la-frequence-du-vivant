import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useBrandKit } from './BrandKitProvider';

/**
 * Divider signature : bandeau dégradé ambre→or avec vague SVG animée au scroll.
 * Rappelle les transitions du site chateauboutinet.fr.
 */
export const BrandDivider: React.FC<{ flip?: boolean }> = ({ flip }) => {
  const kit = useBrandKit();
  const { scrollYProgress } = useScroll();
  const morph = useTransform(scrollYProgress, [0, 1], [0, 18]);
  if (!kit || kit.divider === 'none') return null;

  return (
    <div className={`bk-divider ${flip ? 'rotate-180' : ''}`} aria-hidden>
      <svg viewBox="0 0 1440 88" preserveAspectRatio="none">
        <motion.path
          d="M0,44 C240,88 480,0 720,32 C960,64 1200,16 1440,48 L1440,88 L0,88 Z"
          fill="hsl(var(--bk-bg))"
          style={{ y: morph }}
        />
      </svg>
    </div>
  );
};
