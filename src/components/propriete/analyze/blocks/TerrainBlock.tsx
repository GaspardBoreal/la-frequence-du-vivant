import React from 'react';
import { AnalyzeCard } from '../AnalyzeCard';
import { ChoiceButton } from '../ChoiceButton';
import {
  IconRemanie,
  IconRemblai,
  IconDecaissement,
  IconNaturel,
  IconInconnu,
  SoilHeroStrata,
} from '../SoilPictos';

const OPTIONS = [
  { value: 'remanie', label: 'Remanié', hint: 'terre déplacée', icon: <IconRemanie /> },
  { value: 'remblai', label: 'Remblai', hint: 'apport extérieur', icon: <IconRemblai /> },
  { value: 'decaissement', label: 'Décaissement', hint: 'terre retirée', icon: <IconDecaissement /> },
  { value: 'naturel', label: 'Naturel', hint: 'en place', icon: <IconNaturel /> },
  { value: 'inconnu', label: 'Inconnu', hint: 'à investiguer', icon: <IconInconnu /> },
];

export const TerrainBlock: React.FC<{
  value?: string | null;
  onChange: (v: string) => void;
  index?: number;
}> = ({ value, onChange, index = 0 }) => (
  <AnalyzeCard
    number={1}
    category="Étape 2 · État du terrain"
    title="Le terrain a-t-il été remanié ?"
    subtitle="Historique du site — indice majeur pour lire le sol."
    index={index}
    hero={
      <div className="aspect-[16/7]">
        <SoilHeroStrata variant="strata" />
      </div>
    }
  >
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
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
