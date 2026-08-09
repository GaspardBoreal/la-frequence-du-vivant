import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Sun, Plus, Radio } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSensorReadings, useAddSensorReading } from '@/hooks/propriete/useGardenClinique';

const METRICS = [
  { key: 'temperature', label: 'Température', unit: '°C', icon: Thermometer },
  { key: 'humidite', label: 'Humidité du sol', unit: '%', icon: Droplets },
  { key: 'luminosite', label: 'Luminosité', unit: 'lux', icon: Sun },
] as const;

/**
 * Le poste d'écoute : accueille dès aujourd'hui les relevés saisis à la main,
 * et demain ceux des sondes (température, humidité, luminosité).
 */
export const SensorPanel: React.FC<{ proprieteId: string }> = ({ proprieteId }) => {
  const { data: readings } = useSensorReadings(proprieteId);
  const add = useAddSensorReading(proprieteId);
  const [metric, setMetric] = React.useState<string>('temperature');
  const [value, setValue] = React.useState('');

  const unit = METRICS.find((m) => m.key === metric)?.unit ?? '';

  const last = React.useMemo(() => {
    const map = new Map<string, { value: number; unit: string | null; measured_at: string }>();
    (readings || []).forEach((r) => {
      if (!map.has(r.metric)) map.set(r.metric, { value: r.value, unit: r.unit, measured_at: r.measured_at });
    });
    return map;
  }, [readings]);

  const submit = () => {
    const v = Number(value.replace(',', '.'));
    if (!Number.isFinite(v)) return;
    add.mutate({ metric, value: v, unit });
    setValue('');
  };

  return (
    <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.18)]">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
        <Radio className="h-3 w-3" /> Poste d'écoute du jardin
      </div>
      <p className="mt-1 text-xs text-[hsl(var(--ds-forest))]/75">
        Saisissez vos relevés à la main : les sondes viendront s'y brancher sans rien changer à la lecture.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {METRICS.map((m, i) => {
          const r = last.get(m.key);
          const Icon = m.icon;
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[hsl(var(--ds-forest))]/70">
                <Icon className="h-3 w-3" /> {m.label}
              </div>
              <div className="mt-1 font-serif text-2xl text-[hsl(var(--ds-forest-deep))]">
                {r ? `${r.value} ${r.unit ?? m.unit}` : '—'}
              </div>
              <div className="text-[10px] text-[hsl(var(--ds-forest))]/60">
                {r ? new Date(r.measured_at).toLocaleString('fr-FR') : 'Aucun relevé'}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-3 py-1.5 text-xs text-[hsl(var(--ds-forest-deep))]"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={`Valeur en ${unit}`}
          className="h-9 w-36 bg-white/70"
          inputMode="decimal"
        />
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3 py-1.5 text-xs text-[hsl(var(--ds-cream))] transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" /> Enregistrer le relevé
        </button>
      </div>
    </div>
  );
};

export default SensorPanel;
