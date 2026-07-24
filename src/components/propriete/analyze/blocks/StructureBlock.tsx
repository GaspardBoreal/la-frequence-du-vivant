import React from 'react';
import { AnalyzeCard } from '../AnalyzeCard';
import { ChoiceButton } from '../ChoiceButton';
import { IconCompacte, IconGrumeleuse, IconParticulaire, SoilHeroStrata } from '../SoilPictos';

const OPTIONS = [
  { value: 'compacte', label: 'Compacte', hint: 'motte massive', icon: <IconCompacte /> },
  { value: 'grumeleuse', label: 'Grumeleuse', hint: 'agrégats souples', icon: <IconGrumeleuse /> },
  { value: 'particulaire', label: 'Particulaire', hint: 'grains libres', icon: <IconParticulaire /> },
];

export const StructureBlock: React.FC<{
  value?: string | null;
  onChange: (v: string) => void;
  index?: number;
}> = ({ value, onChange, index = 0 }) => (
  <AnalyzeCard
    number={3}
    category="Étape 2 · Structure"
    title="Comment se tient une motte ?"
    subtitle="Cassez une motte à la main : lecture des agrégats."
    index={index}
    hero={
      <div className="aspect-[16/7]">
        <SoilHeroStrata variant="cross" />
      </div>
    }
  >
    <div className="grid grid-cols-3 gap-2.5">
      {OPTIONS.map((o) => (
        <ChoiceButton
          key={o.value}
          label={o.label}
          hint={o.hint}
          icon={o.icon}
          selected={value === o.value}
          onSelect={() => onChange(o.value)}
        />
      ))}
    </div>
  </AnalyzeCard>
);
