import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Droplets, Thermometer, Gauge, Sun, CloudRain, Activity } from 'lucide-react';
import type { IotMesure } from '@/hooks/iot/useIot';
import { grandeurMeta, fmtMesure, fmtProfondeur, moistureVerdict } from '@/lib/iot/grandeurs';

const ICONS: Record<string, React.ElementType> = {
  soil_moisture: Droplets,
  air_humidity: Droplets,
  soil_temperature: Thermometer,
  air_temperature: Thermometer,
  dew_point: Thermometer,
  pressure: Gauge,
  luminosity: Sun,
  infrared: Sun,
  uv_index: Sun,
  rainfall: CloudRain,
};

/** Une mesure = une petite carte lisible d'un coup d'œil. */
export const MesureTile: React.FC<{ m: IotMesure; index?: number }> = ({ m, index = 0 }) => {
  const meta = grandeurMeta(m.grandeur);
  const Icon = ICONS[m.grandeur] ?? Activity;
  const verdict = m.grandeur === 'soil_moisture' ? moistureVerdict(m.valeur) : null;
  const prof = fmtProfondeur(m.profondeur_m);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/70 p-3"
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/70">
        <Icon className="h-3 w-3" style={{ color: meta.color }} />
        <span className="truncate">{meta.label}</span>
        {prof && <span className="ml-auto shrink-0 rounded-full bg-[hsl(var(--ds-forest))]/10 px-1.5 py-0.5">{prof}</span>}
      </div>
      <div className="mt-1 font-serif text-2xl text-[hsl(var(--ds-forest-deep))]">
        {fmtMesure(m.valeur, m.grandeur, m.unite)}
      </div>
      {verdict && (
        <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `${verdict.color}1f`, color: verdict.color }}>
          <Radio className="h-2.5 w-2.5" /> {verdict.label}
        </div>
      )}
    </motion.div>
  );
};

export default MesureTile;
