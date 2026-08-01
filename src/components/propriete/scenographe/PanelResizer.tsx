import React from 'react';

interface Props {
  width: number;
  min?: number;
  max?: number;
  onChange: (w: number) => void;
  onReset: () => void;
}

/**
 * Poignée d'élargissement de l'herbier : on tire le filet doré pour donner
 * plus de place aux vignettes, double-clic pour revenir à la largeur juste.
 */
export const PanelResizer: React.FC<Props> = ({ width, min = 240, max = 640, onChange, onReset }) => {
  const dragging = React.useRef(false);

  React.useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      onChange(Math.max(min, Math.min(max, e.clientX)));
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [min, max, onChange]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Élargir l’herbier"
      title="Glisser pour élargir · double-clic pour réinitialiser"
      onMouseDown={(e) => {
        e.preventDefault();
        dragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }}
      onDoubleClick={onReset}
      className="group relative hidden w-1.5 shrink-0 cursor-col-resize bg-[hsl(var(--ds-forest-deep))] md:block"
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10 transition-colors group-hover:bg-[#c8a24a]" />
      <span className="absolute left-1/2 top-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/15 transition-colors group-hover:bg-[#c8a24a]" />
    </div>
  );
};

export default PanelResizer;
