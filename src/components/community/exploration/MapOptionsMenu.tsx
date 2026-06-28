import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  Plus,
  Sparkles,
  RotateCw,
  CloudSun,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Target,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

import type { MapLayersState, WeatherStationsMode } from '@/hooks/useMapLayers';

interface MapOptionsMenuProps {
  userCanCreate: boolean;
  marcheEventId?: string | null;
  explorationId: string;
  isLoop: boolean;
  isLoopPending?: boolean;
  isCreatingWaypoint: boolean;
  layers: MapLayersState;
  activeBadgeCount: number;
  waypointsCount?: number;
  onToggleLoop: () => void;
  onStartCreateMarche: () => void;
  onToggleCreateWaypoint: () => void;
  onToggleLayer: (key: keyof MapLayersState) => void;
  onSetWeatherStationsMode: (mode: WeatherStationsMode) => void;
  onSetWeatherStationsRadius: (radiusKm: number) => void;
}

const MapOptionsMenu: React.FC<MapOptionsMenuProps> = ({
  userCanCreate,
  marcheEventId,
  isLoop,
  isLoopPending,
  isCreatingWaypoint,
  layers,
  activeBadgeCount,
  waypointsCount = 0,
  onToggleLoop,
  onStartCreateMarche,
  onToggleCreateWaypoint,
  onToggleLayer,
  onSetWeatherStationsMode,
  onSetWeatherStationsRadius,
}) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const haptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    }
  };

  const handleAction = (fn: () => void) => {
    fn();
    haptic();
    setTimeout(() => setOpen(false), 220);
  };



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
      {activeBadgeCount > 0 && !open && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 border border-black/40 text-[10px] font-bold text-white flex items-center justify-center shadow-md">
          {activeBadgeCount}
        </span>
      )}
    </button>
  );

  const Content = (
    <div className="space-y-5">
      {userCanCreate && (
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-2 px-1">
            Ajouter
          </h3>
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5">
            <button
              onClick={() => handleAction(onStartCreateMarche)}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="flex-1 text-sm font-medium text-white/90">Point de marche</span>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </button>
            {marcheEventId && (
              <button
                onClick={() => handleAction(onToggleCreateWaypoint)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
              >
                <span
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                    isCreatingWaypoint
                      ? 'bg-amber-400/30 border-amber-300/60 text-amber-50'
                      : 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <span className="flex-1 text-sm font-medium text-white/90">
                  {isCreatingWaypoint ? 'Cliquez sur la carte…' : 'Point intermédiaire'}
                </span>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-2 px-1">
          Afficher
        </h3>
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/5">
          <LayerRow
            icon={<RotateCw className="w-4 h-4" strokeWidth={2.5} />}
            iconClass="bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
            label="Boucle fermée"
            description={isLoop ? 'Tracé fermé sur lui-même' : 'Tracé ouvert (aller simple)'}
            checked={isLoop}
            disabled={isLoopPending}
            onCheckedChange={() => {
              haptic();
              onToggleLoop();
            }}
          />
          <LayerRow
            icon={<Sparkles className="w-4 h-4" strokeWidth={2.5} />}
            iconClass="bg-amber-500/15 border-amber-400/30 text-amber-200"
            label="Points intermédiaires"
            description={
              layers.showWaypoints
                ? `${waypointsCount} point${waypointsCount > 1 ? 's' : ''} affiché${waypointsCount > 1 ? 's' : ''} sur le tracé`
                : 'Tracé épuré (points masqués)'
            }
            checked={layers.showWaypoints}
            onCheckedChange={() => {
              haptic();
              onToggleLayer('showWaypoints');
            }}
          />
          <LayerRow
            icon={<Target className="w-4 h-4" strokeWidth={2.5} />}
            iconClass="bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
            label="Rayons d'observation"
            description={layers.showObservationRadii
              ? "Zone d'écoute de la biodiversité"
              : 'Halos masqués (carte épurée)'}
            checked={layers.showObservationRadii}
            onCheckedChange={() => {
              haptic();
              onToggleLayer('showObservationRadii');
            }}
          />
          <WeatherStationsRow
            mode={layers.weatherStations}
            radiusKm={layers.weatherStationsRadius}
            onChange={(m) => {
              haptic();
              onSetWeatherStationsMode(m);
            }}
            onRadiusChange={(r) => {
              haptic();
              onSetWeatherStationsRadius(r);
            }}
          />
        </div>
      </section>
    </div>
  );


  if (isMobile) {
    return (
      <>
        {Trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="bg-black/85 backdrop-blur-2xl border-t border-white/15 text-white rounded-t-2xl max-h-[75vh] overflow-y-auto"
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
  );
};

interface LayerRowProps {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: () => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  icon,
  iconClass,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}) => (
  <label
    className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-white/5 transition-colors ${
      disabled ? 'opacity-60 pointer-events-none' : ''
    }`}
  >
    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconClass}`}>
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-medium text-white/90">{label}</span>
      {description && (
        <span className="block text-[11px] text-white/50 truncate">{description}</span>
      )}
    </span>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </label>
);

const WEATHER_OPTIONS: {
  value: WeatherStationsMode;
  label: string;
  description: string;
}[] = [
  { value: 'off', label: 'Désactivé', description: 'Aucune station affichée' },
  { value: 'on_with_marches', label: 'Avec points de marche', description: 'Stations + points visibles' },
  { value: 'on_only', label: 'Focus météo', description: 'Stations seules (points masqués)' },
];

const BADGE_STYLES: Record<WeatherStationsMode, { label: string; cls: string }> = {
  off: { label: 'OFF', cls: 'bg-white/10 text-white/60 border-white/15' },
  on_with_marches: { label: 'ON', cls: 'bg-sky-500/20 text-sky-200 border-sky-400/40' },
  on_only: { label: 'FOCUS', cls: 'bg-sky-500/30 text-sky-100 border-sky-300/60' },
};

interface WeatherStationsRowProps {
  mode: WeatherStationsMode;
  radiusKm: number;
  onChange: (mode: WeatherStationsMode) => void;
  onRadiusChange: (radiusKm: number) => void;
}

const WeatherStationsRow: React.FC<WeatherStationsRowProps> = ({
  mode,
  radiusKm,
  onChange,
  onRadiusChange,
}) => {
  const [expanded, setExpanded] = useState(mode !== 'off');
  const badge = BADGE_STYLES[mode];

  return (
    <div className="bg-transparent">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors text-left"
        aria-expanded={expanded}
      >
        <span className="w-8 h-8 rounded-lg border bg-sky-500/20 border-sky-400/30 text-sky-200 flex items-center justify-center shrink-0">
          <CloudSun className="w-4 h-4" strokeWidth={2.5} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-white/90">Stations météo</span>
          <span className="block text-[11px] text-white/50 truncate">
            Plus proches des points de marche
          </span>
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badge.cls}`}
        >
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
                    className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition-colors min-h-[44px] ${
                      selected
                        ? 'bg-sky-500/15 border border-sky-400/40'
                        : 'bg-white/[0.03] border border-white/5 hover:bg-white/5'
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? 'border-sky-300 bg-sky-400' : 'border-white/30'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-[13px] font-medium ${
                          selected ? 'text-sky-100' : 'text-white/85'
                        }`}
                      >
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
                    aria-label="Rayon de recherche des stations météo"
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

export default MapOptionsMenu;
