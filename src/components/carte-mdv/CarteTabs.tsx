import React from 'react';
import { motion } from 'framer-motion';
import { Wind, Map as MapIcon, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CarteTabKey = 'souffle' | 'carte' | 'ensemble';

const TABS: { key: CarteTabKey; label: string; short: string; icon: React.ElementType }[] = [
  { key: 'souffle', label: 'Le Souffle du Vivant', short: 'Souffle', icon: Wind },
  { key: 'carte', label: 'Carte & Agenda', short: 'Carte', icon: MapIcon },
  { key: 'ensemble', label: 'Marcher Ensemble', short: 'Ensemble', icon: HeartHandshake },
];

interface Props {
  value: CarteTabKey;
  onChange: (v: CarteTabKey) => void;
}

const CarteTabs: React.FC<Props> = ({ value, onChange }) => (
  <div className="sticky top-14 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
    <div className="container mx-auto px-4">
      <div
        className="flex gap-1 overflow-x-auto snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >

        {TABS.map(({ key, label, short, icon: Icon }) => {
          const active = key === value;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                'relative snap-start shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="carte-tab-pill"
                  className="absolute inset-0 rounded-full bg-primary shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export default CarteTabs;
