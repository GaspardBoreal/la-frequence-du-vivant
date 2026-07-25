import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  Plus,
  Target,
  CloudSun,
  ChevronDown,
  Check,
  X,
  MapPin,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

export type WeatherMode = 'off' | 'on_with_parcels' | 'on_only';

export interface CadastreOptionsState {
  showRadii: boolean;
  radiiKm: number; // 0.05 → 1
  weatherMode: WeatherMode;
  weatherRadiusKm: number;
}

interface Props {
  canCurate: boolean;
  addMode: boolean;
  onToggleAddMode: () => void;
  state: CadastreOptionsState;
  onChange: (patch: Partial<CadastreOptionsState>) => void;
  className?: string;
}

const WEATHER_OPTIONS: { value: WeatherMode; label: string; description: string }[] = [
  { value: 'off', label: 'Désactivé', description: 'Aucune station affichée' },
  { value: 'on_with_parcels', label: 'Avec parcelles', description: 'Stations + parcelles visibles' },
  { value: 'on_only', label: 'Focus météo', description: 'Stations seules' },
];

const BADGES: Record<WeatherMode, { label: string; cls: string }> = {
  off: { label: 'OFF', cls: 'bg-white/10 text-white/60 border-white/15' },
  on_with_parcels: { label: 'ON', cls: 'bg-sky-500/20 text-sky-200 border-sky-400/40' },
  on_only: { label: 'FOCUS', cls: 'bg-sky-500/30 text-sky-100 border-sky-300/60' },
};

const activeCount = (s: CadastreOptionsState, addMode: boolean) =>
  (addMode ? 1 : 0) + (s.showRadii ? 1 : 0) + (s.weatherMode !== 'off' ? 1 : 0);

const haptic = () => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
  } catch {}
};

const CadastreOptionsMenu: React.FC<Props> = ({
  canCurate,
  addMode,
  onToggleAddMode,
  state,
  onChange,
  className = 'absolute bottom-4 left-4 z-[1000]',
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const badges = activeCount(state, addMode);

  const Trigger = (
    <button
      type="button"
      aria-label="Options de la carte"
      aria-expanded={open}
      onClick={() => {
        haptic();
        setOpen((v) => !v);
      }}
      className="relative h-11 w-11 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center shadow-lg hover:bg-black/70 transition-all duration-200 active:scale-95"
    >
      <motion.span
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="flex"
      >
        <SlidersHorizontal className="w-5 h-5" strokeWidth={2.2} />
      </motion.span>
      {badges > 0 && !open && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 border border-black/40 text-[10px] font-bold text-white flex items-center justify-center shadow-md">
          {badges}
        </span>
      )}
    </button>
  );

  const Content = (
    <div className="space-y-5">
      {canCurate && (
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-2 px-1">
            Ajouter
          </h3>
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <button
              onClick={() => {
                haptic();
                onToggleAddMode();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left ${
                addMode ? 'bg-amber-500/10' : ''
              }`}
            >
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                  addMode
                    ? 'bg-amber-400/30 border-amber-300/60 text-amber-50'
                    : 'bg-amber-500/20 border-amber-400/30 text-amber-200'
                }`}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-white/90">Parcelle cadastrale</span>
                <span className="block text-[11px] text-white/50 truncate">
                  {addMode ? 'Cliquez sur la carte…' : 'Ajouter une parcelle à la propriété'}
                </span>
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${
                  addMode
                    ? 'bg-amber-500/30 text-amber-100 border-amber-400/50'
                    : 'bg-white/10 text-white/50 border-white/15'
                }`}
              >
                {addMode ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-2 px-1">
          Afficher
        </h3>
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5">
          {/* Rayons observation */}
          <div>
            <label className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/5 transition">
              <span className="w-8 h-8 rounded-lg border bg-emerald-500/20 border-emerald-400/30 text-emerald-200 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-white/90">Rayons d'observation</span>
                <span className="block text-[11px] text-white/50 truncate">
                  {state.showRadii
                    ? `Halo de ${(state.radiiKm * 1000).toFixed(0)} m autour des parcelles`
                    : 'Halos masqués (carte épurée)'}
                </span>
              </span>
              <Switch
                checked={state.showRadii}
                onCheckedChange={() => {
                  haptic();
                  onChange({ showRadii: !state.showRadii });
                }}
              />
            </label>
            {state.showRadii && (
              <div className="px-3 pb-3 pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">
                    Rayon
                  </span>
                  <span className="text-[12px] font-mono text-emerald-200">
                    {state.radiiKm < 1
                      ? `${(state.radiiKm * 1000).toFixed(0)} m`
                      : `${state.radiiKm.toFixed(1)} km`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={state.radiiKm}
                  onChange={(e) => onChange({ radiiKm: Number(e.target.value) })}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/15 accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-white/40 mt-1 font-mono">
                  <span>50m</span>
                  <span>250m</span>
                  <span>500m</span>
                  <span>1km</span>
                </div>
              </div>
            )}
          </div>

          {/* Weather stations */}
          <WeatherRow
            mode={state.weatherMode}
            radiusKm={state.weatherRadiusKm}
            onChange={(m) => {
              haptic();
              onChange({ weatherMode: m });
            }}
            onRadiusChange={(r) => onChange({ weatherRadiusKm: r })}
          />
        </div>
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className={className}>{Trigger}</div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="bg-black/85 backdrop-blur-2xl border-t border-white/15 text-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="mx-auto w-10 h-1 rounded-full bg-white/25 -mt-2 mb-3" />
            <SheetHeader className="text-left mb-3">
              <SheetTitle className="text-white text-base font-semibold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
                Options carte
              </SheetTitle>
            </SheetHeader>
            {Content}
            <div className="h-2" />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          className="w-[320px] bg-black/85 backdrop-blur-2xl border border-white/15 text-white rounded-2xl p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
              Options carte
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          {Content}
        </PopoverContent>
      </Popover>
    </div>
  );
};

const WeatherRow: React.FC<{
  mode: WeatherMode;
  radiusKm: number;
  onChange: (m: WeatherMode) => void;
  onRadiusChange: (r: number) => void;
}> = ({ mode, radiusKm, onChange, onRadiusChange }) => {
  const [expanded, setExpanded] = useState(mode !== 'off');
  const badge = BADGES[mode];
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition text-left"
      >
        <span className="w-8 h-8 rounded-lg border bg-sky-500/20 border-sky-400/30 text-sky-200 flex items-center justify-center shrink-0">
          <CloudSun className="w-4 h-4" strokeWidth={2.5} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-white/90">Stations météo</span>
          <span className="block text-[11px] text-white/50 truncate">Plus proches de la propriété</span>
        </span>
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${badge.cls}`}>
          {badge.label}
        </span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-white/50">
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1">
              {WEATHER_OPTIONS.map((opt) => {
                const selected = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition min-h-[44px] ${
                      selected ? 'bg-sky-500/15 border border-sky-400/40' : 'bg-white/[0.03] border border-white/5 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-sky-300 bg-sky-400' : 'border-white/30'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[13px] font-medium ${selected ? 'text-sky-100' : 'text-white/85'}`}>
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-white/50">{opt.description}</span>
                    </span>
                  </button>
                );
              })}
              {mode !== 'off' && (
                <div className="mt-2 px-2.5 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">
                      Rayon de recherche
                    </span>
                    <span className="text-[12px] font-mono text-sky-200">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={10}
                    value={radiusKm}
                    onChange={(e) => onRadiusChange(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/15 accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-white/40 mt-1 font-mono">
                    <span>40</span>
                    <span>60</span>
                    <span>80</span>
                    <span>100</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CadastreOptionsMenu;
