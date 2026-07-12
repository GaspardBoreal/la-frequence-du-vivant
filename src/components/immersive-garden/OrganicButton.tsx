import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'gold' | 'emerald' | 'ghost';
  className?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const VARIANTS: Record<string, string> = {
  gold: 'bg-gradient-to-br from-[#e8c66a] via-[#c9a24a] to-[#8f6b1f] text-[#1a1408] shadow-[0_18px_45px_-10px_rgba(201,162,74,0.55)]',
  emerald: 'bg-gradient-to-br from-[#3f8f6b] via-[#1f5d43] to-[#0f2d20] text-[#f4ecd4] shadow-[0_18px_45px_-10px_rgba(31,93,67,0.55)]',
  ghost: 'bg-white/10 text-white backdrop-blur-md border border-white/25',
};

// SVG blob mask — organic squircle
const BLOB_PATH =
  "M40,10 C60,4 88,8 108,22 C126,34 138,58 132,82 C126,106 100,120 74,120 C48,120 22,110 12,86 C2,62 20,16 40,10 Z";

const OrganicButton: React.FC<Props> = ({
  children, onClick, href, variant = 'gold', className = '', icon, pulse,
}) => {
  const inner = (
    <motion.span
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex items-center justify-center gap-3 px-9 py-4 font-serif text-base tracking-wide ${VARIANTS[variant]} ${className}`}
      style={{
        WebkitMaskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 130' preserveAspectRatio='none'><path d='${BLOB_PATH}' fill='black'/></svg>")`,
        maskImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 130' preserveAspectRatio='none'><path d='${BLOB_PATH}' fill='black'/></svg>")`,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      }}
    >
      {pulse && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 70%)' }}
          animate={{ opacity: [0.4, 0.15, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10 whitespace-nowrap">{children}</span>
    </motion.span>
  );

  if (href) {
    return <Link to={href} className="inline-block no-underline">{inner}</Link>;
  }
  return <button type="button" onClick={onClick} className="inline-block bg-transparent border-0 p-0">{inner}</button>;
};

export default OrganicButton;
