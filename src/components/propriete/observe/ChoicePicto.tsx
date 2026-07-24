import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const ChoicePicto: React.FC<{
  label: string;
  icon?: string;
  selected: boolean;
  onToggle: () => void;
}> = ({ label, icon, selected, onToggle }) => {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      whileTap={{ scale: 0.96 }}
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all min-h-[92px] ${
        selected
          ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[inset_0_2px_10px_rgba(47,93,58,0.10),0_4px_12px_-4px_rgba(47,93,58,0.25)]'
          : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 hover:border-[hsl(var(--ds-forest))]/50 hover:bg-[hsl(var(--ds-cream))]'
      }`}
    >
      <span
        className={`text-2xl leading-none transition-transform ${
          selected ? 'scale-110' : 'group-hover:scale-105'
        }`}
        aria-hidden
      >
        {icon ?? '•'}
      </span>
      <span
        className={`text-[11px] font-semibold leading-tight ${
          selected ? 'text-[hsl(var(--ds-forest-deep))]' : 'text-[hsl(var(--ds-forest-deep))]/85'
        }`}
      >
        {label}
      </span>

      <span
        className={`absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
          selected
            ? 'bg-[hsl(var(--ds-forest))] border-[hsl(var(--ds-forest))]'
            : 'bg-transparent border-[hsl(var(--ds-line))]'
        }`}
      >
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.18 }}
          >
            <Check className="w-3 h-3 text-[hsl(var(--ds-cream))]" strokeWidth={3} />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
};
