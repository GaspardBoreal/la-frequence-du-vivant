import React, { useState } from 'react';
import { AnalyzeCard } from '../AnalyzeCard';
import { ChoiceButton } from '../ChoiceButton';
import { IconCompacte, IconGrumeleuse, IconParticulaire } from '../SoilPictos';
import { StructureCrossSection } from '../StructureCrossSection';
import { StructureChoiceTooltip } from '../StructureChoiceTooltip';

const OPTIONS = [
  { value: 'compacte', label: 'Compacte', hint: 'motte massive', icon: <IconCompacte /> },
  { value: 'grumeleuse', label: 'Grumeleuse', hint: 'agrégats souples', icon: <IconGrumeleuse /> },
  { value: 'particulaire', label: 'Particulaire', hint: 'grains libres', icon: <IconParticulaire /> },
] as const;

export const StructureBlock: React.FC<{
  value?: string | null;
  onChange: (v: string) => void;
  index?: number;
}> = ({ value, onChange, index = 0 }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <AnalyzeCard
      number={3}
      category="Étape 2 · Structure du sol"
      title="Comment se tient une motte ?"
      subtitle="Cassez une motte à la main : lecture des agrégats."
      index={index}
      hero={
        <div className="aspect-[16/7]">
          <StructureCrossSection value={value as any} />
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-3 items-stretch">
        {OPTIONS.map((o, i) => {
          const tooltipId = `structure-tip-${o.value}`;
          const align = i === 0 ? 'left' : i === OPTIONS.length - 1 ? 'right' : 'center';
          return (
            <div
              key={o.value}
              className="relative w-full"
              onMouseEnter={() => setHovered(o.value)}
              onMouseLeave={() => setHovered((h) => (h === o.value ? null : h))}
              onFocus={() => setHovered(o.value)}
              onBlur={() => setHovered((h) => (h === o.value ? null : h))}
            >
              <div aria-describedby={hovered === o.value ? tooltipId : undefined} className="w-full h-full">
                <ChoiceButton
                  label={o.label}
                  hint={o.hint}
                  icon={o.icon}
                  selected={value === o.value}
                  onSelect={() => onChange(o.value)}
                />
              </div>
              <StructureChoiceTooltip
                variant={hovered === o.value ? (o.value as any) : null}
                id={tooltipId}
                align={align}
              />
            </div>
          );
        })}
      </div>
    </AnalyzeCard>
  );
};
