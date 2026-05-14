import React from 'react';
import { Footprints } from 'lucide-react';

interface Props {
  visible: boolean;
  onToggle: (visible: boolean) => void;
  /** 'top-right' positions absolute under the style toggle. */
  position?: 'top-right' | 'top-left' | 'inline';
  className?: string;
}

const POSITION_CLASSES = {
  'top-right': 'absolute top-16 right-4 z-[1000]',
  'top-left': 'absolute top-16 left-4 z-[1000]',
  inline: '',
} as const;

/**
 * Glassmorphism toggle aligned with MapStyleToggle to show/hide marche
 * numbered step markers. Reusable across any RichMap consumer.
 */
const MarcheRouteToggle: React.FC<Props> = ({
  visible,
  onToggle,
  position = 'top-right',
  className = '',
}) => {
  return (
    <div className={`${POSITION_CLASSES[position]} ${className}`}>
      <button
        onClick={() => onToggle(!visible)}
        aria-pressed={visible}
        title={visible ? 'Masquer les étapes de la marche' : 'Afficher les étapes de la marche'}
        className={`
          flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
          bg-black/50 backdrop-blur-xl border shadow-lg shadow-black/20
          transition-all duration-200
          ${visible
            ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/20'
            : 'border-white/15 text-white/70 hover:text-white/95 hover:bg-white/10'
          }
        `}
      >
        <Footprints className="w-4 h-4" />
        <span className="hidden sm:inline">Étapes</span>
      </button>
    </div>
  );
};

export default MarcheRouteToggle;
