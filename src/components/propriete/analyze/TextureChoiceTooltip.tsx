import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Sparkles, Fingerprint } from 'lucide-react';
import { IconTextureSable, IconTextureLimon, IconTextureArgile } from './TexturePictos';
import { TEXTURE_LABELS, TEXTURE_VERB, type TextureResultId } from './textureTests';

type Bullet = { icon: React.ReactNode; text: string };

const DATA: Record<TextureResultId, { icon: React.ReactNode; bullets: Bullet[] }> = {
  sable: {
    icon: <IconTextureSable />,
    bullets: [
      { icon: <Hand className="w-3.5 h-3.5" />, text: 'Modelage difficile.' },
      { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Boudin très grossier et peu formé, ne tient pas.' },
      {
        icon: <Fingerprint className="w-3.5 h-3.5" />,
        text: 'Ne colle pas, granuleuse, ne salit pas les mains une fois sèche.',
      },
    ],
  },
  limon: {
    icon: <IconTextureLimon />,
    bullets: [
      { icon: <Hand className="w-3.5 h-3.5" />, text: 'Modelage possible.' },
      { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Petit boudin ou ensemble de boudins colmatés.' },
      { icon: <Fingerprint className="w-3.5 h-3.5" />, text: 'Peu collante, peu granuleuse et salit les mains.' },
    ],
  },
  argile: {
    icon: <IconTextureArgile />,
    bullets: [
      { icon: <Hand className="w-3.5 h-3.5" />, text: 'Modelage facile à très facile.' },
      { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Boudin bien dessiné, qui peut être mis en cercle.' },
      { icon: <Fingerprint className="w-3.5 h-3.5" />, text: 'Collante, douce, ne salit pas ou peu les mains.' },
    ],
  },
};

export const TextureChoiceTooltip: React.FC<{
  variant: TextureResultId | null;
  id?: string;
  align?: 'left' | 'center' | 'right';
  clamp?: boolean;
}> = ({ variant, id, align = 'center', clamp = false }) => {
  const posClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const arrowClass =
    align === 'left' ? 'left-6' : align === 'right' ? 'right-6' : 'left-1/2 -translate-x-1/2';

  return (
    <AnimatePresence>
      {variant && (
        <motion.div
          key={variant}
          role="tooltip"
          id={id}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute ${posClass} bottom-full mb-3 z-40 ${
            clamp ? 'w-[252px]' : 'w-[284px]'
          } max-w-[calc(100vw-2rem)]`}
        >
          <div className="relative rounded-2xl border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-cream))] shadow-[0_12px_32px_-8px_rgba(47,93,58,0.28),0_2px_8px_rgba(212,163,63,0.18)] overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[hsl(var(--ds-gold))]/0 via-[hsl(var(--ds-gold))] to-[hsl(var(--ds-gold))]/0" />

            <div className="p-3.5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="shrink-0 [&_svg]:w-8 [&_svg]:h-8">{DATA[variant].icon}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-[hsl(var(--ds-forest-deep))] leading-tight">
                    {TEXTURE_LABELS[variant]}
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))] mt-0.5">
                    {TEXTURE_VERB[variant]}
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-[hsl(var(--ds-forest))]/15 mb-2.5" />

              <ul className="space-y-1.5">
                {DATA[variant].bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11.5px] leading-snug text-[hsl(var(--ds-forest-deep))]/85"
                  >
                    <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--ds-forest))]/10 text-[hsl(var(--ds-forest))]">
                      {b.icon}
                    </span>
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <svg className={`absolute ${arrowClass} -bottom-[7px]`} width="14" height="8" viewBox="0 0 14 8" aria-hidden>
              <path d="M0 0 L7 8 L14 0 Z" fill="hsl(var(--ds-cream))" stroke="hsl(var(--ds-forest) / 0.4)" strokeWidth="1" />
              <path d="M1 0 L13 0" stroke="hsl(var(--ds-cream))" strokeWidth="1.5" />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
