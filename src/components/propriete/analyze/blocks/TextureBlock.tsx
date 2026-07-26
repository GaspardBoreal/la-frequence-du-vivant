import React from 'react';
import { AnalyzeCard } from '../AnalyzeCard';
import { ChoiceButton } from '../ChoiceButton';
import { IconBoudinSable, IconBoudinLimon, IconBoudinArgile, SoilHeroStrata } from '../SoilPictos';

const BOUDIN = [
  {
    value: 'sable',
    label: 'Sableux',
    hint: "ne fait pas de boudin",
    texture: 'sablo-limoneux',
    icon: <IconBoudinSable />,
  },
  {
    value: 'limon',
    label: 'Limoneux',
    hint: 'boudin qui casse',
    texture: 'limoneux',
    icon: <IconBoudinLimon />,
  },
  {
    value: 'argile',
    label: 'Argileux',
    hint: 'boudin qui plie',
    texture: 'argilo-limoneux',
    icon: <IconBoudinArgile />,
  },
];

export const TextureBlock: React.FC<{
  boudinShape?: string | null;
  texture?: string | null;
  onChangeBoudin: (v: string) => void;
  onChangeTexture: (v: string) => void;
  index?: number;
}> = ({ boudinShape, texture, onChangeBoudin, onChangeTexture, index = 0 }) => (
  <AnalyzeCard
    number={4}
    category="Étape 2 · Texture du sol · Test du boudin"
    title="Sable, limon ou argile ?"
    subtitle="Humidifiez, roulez un boudin de 3 mm : sa tenue révèle la texture."
    index={index}
    hero={
      <div className="aspect-[16/7]">
        <SoilHeroStrata variant="strata" />
      </div>
    }
  >
    <div className="grid grid-cols-3 gap-2.5">
      {BOUDIN.map((o) => (
        <ChoiceButton
          key={o.value}
          label={o.label}
          hint={o.hint}
          icon={o.icon}
          selected={boudinShape === o.value}
          onSelect={() => {
            onChangeBoudin(o.value);
            onChangeTexture(o.texture);
          }}
        />
      ))}
    </div>

    {texture && (
      <div className="mt-4 rounded-xl bg-[hsl(var(--ds-forest))]/8 border border-[hsl(var(--ds-forest))]/20 px-3.5 py-2.5 text-sm text-[hsl(var(--ds-forest-deep))]">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[hsl(var(--ds-forest))]/75 mr-2">
          Texture retenue
        </span>
        <span className="font-serif italic text-base">{texture}</span>
      </div>
    )}
  </AnalyzeCard>
);
