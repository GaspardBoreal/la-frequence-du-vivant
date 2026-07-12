import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
  color?: string;
  flip?: boolean;
}

/** Séparateur organique SVG (wave blob) qui se déforme légèrement au scroll. */
const OrganicDivider: React.FC<Props> = ({ color = '#0a0603', flip = false }) => {
  const { scrollYProgress } = useScroll();
  const morph = useTransform(scrollYProgress, [0, 1], [0, 20]);

  return (
    <div className={`relative w-full h-24 ${flip ? 'rotate-180' : ''}`} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <motion.path
          d="M0,64 C240,120 480,0 720,48 C960,96 1200,32 1440,72 L1440,120 L0,120 Z"
          fill={color}
          style={{ y: morph }}
        />
      </svg>
    </div>
  );
};

export default OrganicDivider;
