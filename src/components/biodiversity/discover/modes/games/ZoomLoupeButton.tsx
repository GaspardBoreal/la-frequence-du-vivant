import React from 'react';
import { ZoomIn } from 'lucide-react';

interface Props {
  onActivate: () => void;
  /** Position du bouton dans le parent (parent doit être relative). */
  position?: 'bottom-right' | 'top-right' | 'top-left' | 'bottom-left';
  /** Affiche en permanence (sinon visible au hover via group-hover sur le parent). */
  alwaysVisible?: boolean;
  label?: string;
  className?: string;
}

const POS: Record<NonNullable<Props['position']>, string> = {
  'bottom-right': 'bottom-2 right-2',
  'top-right': 'top-2 right-2',
  'top-left': 'top-2 left-2',
  'bottom-left': 'bottom-2 left-2',
};

/**
 * Loupe discrète à placer en overlay sur une image de jeu.
 * - N'utilise PAS de <button> (souvent imbriqué dans un parent button/draggable).
 * - Stoppe la propagation des events pour ne pas déclencher les mécaniques du jeu
 *   (flip Memory, drag dnd-kit, click option).
 */
const ZoomLoupeButton: React.FC<Props> = ({
  onActivate,
  position = 'bottom-right',
  alwaysVisible = false,
  label = 'Agrandir la photo',
  className = '',
}) => {
  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const handle = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    stop(e);
    onActivate();
  };
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      data-no-dnd="true"
      onPointerUp={handle}
      onPointerDown={stop}
      onMouseDown={stop}
      onMouseUp={stop}
      onTouchStart={stop}
      onTouchEnd={stop}
      onClick={stop}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onActivate(); }
      }}
      className={`absolute ${POS[position]} z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/75 hover:bg-white text-[#3B2A1A] backdrop-blur shadow-md border border-white/70 cursor-zoom-in transition ${
        alwaysVisible
          ? 'opacity-90'
          : 'opacity-0 group-hover:opacity-95 [@media(hover:none)]:opacity-90'
      } ${className}`}
    >
      <ZoomIn className="h-4 w-4" />
    </span>
  );
};

export default ZoomLoupeButton;
