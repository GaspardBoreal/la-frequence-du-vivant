import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  Plus,
  Sparkles,
  RotateCw,
  CloudSun,
  LandPlot,
  Leaf,
  ChevronRight,
  X,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import type { MapLayersState } from '@/hooks/useMapLayers';

interface MapOptionsMenuProps {
  userCanCreate: boolean;
  marcheEventId?: string | null;
  explorationId: string;
  isLoop: boolean;
  isLoopPending?: boolean;
  isCreatingWaypoint: boolean;
  layers: MapLayersState;
  activeBadgeCount: number;
  onToggleLoop: () => void;
  onStartCreateMarche: () => void;
  onToggleCreateWaypoint: () => void;
  onToggleLayer: (key: keyof MapLayersState) => void;
}

const MapOptionsMenu: React.FC<MapOptionsMenuProps> = ({
  userCanCreate,
  marcheEventId,
  isLoop,
  isLoopPending,
  isCreatingWaypoint,
  layers,
  activeBadgeCount,
  onToggleLoop,
  onStartCreateMarche,
  onToggleCreateWaypoint,
  onToggleLayer,
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

  const handleLayer = (key: keyof MapLayersState, soon = false) => {
    haptic();
    onToggleLayer(key);
    if (soon) {
      toast.info('Bientôt disponible', {
        description: 'Cette couche sera bientôt branchée sur les données réelles.',
      });
    }
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
            icon={<CloudSun className="w-4 h-4" strokeWidth={2.5} />}
            iconClass="bg-sky-500/20 border-sky-400/30 text-sky-200"
            label="Stations météo"
            description="Stations les plus proches des points"
            checked={layers.weatherStations}
            onCheckedChange={() => handleLayer('weatherStations', true)}
          />
          <LayerRow
            icon={<LandPlot className="w-4 h-4" strokeWidth={2.5} />}
            iconClass="bg-orange-500/20 border-orange-400/30 text-orange-200"
            label="Cadastre détaillé"
            description="Parcelles autour du tracé"
            checked={layers.cadastreDetail}
            onCheckedChange={() => handleLayer('cadastreDetail', true)}
          />
          <LayerRow
            icon={<Leaf className="w-4 h-4" strokeWidth={2.5} />}
            iconClass="bg-lime-500/20 border-lime-400/30 text-lime-200"
            label="Espèces récentes"
            description="Observations des 30 derniers jours"
            checked={layers.recentSpecies}
            onCheckedChange={() => handleLayer('recentSpecies', true)}
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
        className="w-[300px] bg-black/85 backdrop-blur-2xl border border-white/15 text-white rounded-2xl p-4 shadow-2xl"
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

export default MapOptionsMenu;
