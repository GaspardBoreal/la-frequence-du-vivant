import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Crosshair, X, MapPin } from 'lucide-react';
import type { IotCapteur } from '@/hooks/iot/useIot';
import { sensorHealth, HEALTH_COLOR } from '@/lib/iot/grandeurs';

interface Props {
  capteurs: IotCapteur[];
  placingId: string | null;
  onPlacing: (id: string | null) => void;
  onOpen: (c: IotCapteur) => void;
}

/** Bandeau de terrain des capteurs : ce qui est posé, ce qui reste à situer. */
export const IotDock: React.FC<Props> = ({ capteurs, placingId, onPlacing, onOpen }) => {
  const toPlace = capteurs.filter((c) => c.lat == null || c.lng == null);
  const placed = capteurs.filter((c) => c.lat != null && c.lng != null);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[1100] flex flex-col items-start gap-2 sm:right-auto sm:max-w-[330px]">
      <AnimatePresence>
        {placingId && (
          <motion.div
            key="placing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto flex w-full items-center gap-2 rounded-2xl border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest-deep))] px-3 py-2 text-[hsl(var(--ds-cream))] shadow-lg"
          >
            <Crosshair className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" />
            <p className="flex-1 text-[11px] leading-snug">Cliquez sur le plan à l'emplacement exact du capteur.</p>
            <button type="button" onClick={() => onPlacing(null)} className="rounded-full border border-[hsl(var(--ds-cream))]/35 p-1" aria-label="Annuler">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto w-full rounded-2xl border border-[hsl(var(--ds-forest))]/25 bg-[hsl(var(--ds-cream))]/95 p-3 text-[hsl(var(--ds-forest-deep))] shadow-[0_14px_38px_-16px_rgba(20,30,15,.6)] backdrop-blur"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-[hsl(var(--ds-forest))]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--ds-forest))]/80">
            Capteurs et sondes · {placed.length} posés
          </span>
        </div>

        {toPlace.length > 0 && (
          <>
            <p className="mb-1 text-[10px] italic opacity-70">À situer sur le plan :</p>
            <div className="flex flex-wrap gap-1.5">
              {toPlace.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPlacing(placingId === c.id ? null : c.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] transition ${
                    placingId === c.id
                      ? 'border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-gold))]/25'
                      : 'border-[hsl(var(--ds-forest))]/30 hover:bg-[hsl(var(--ds-forest))]/10'
                  }`}
                >
                  <MapPin className="h-3 w-3" /> {c.nom}
                </button>
              ))}
            </div>
          </>
        )}

        {placed.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {placed.map((c) => {
              const h = sensorHealth(c);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onOpen(c)}
                  className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-forest))]/20 bg-white/60 px-2 py-1 text-[10px]"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: HEALTH_COLOR[h.status] }} />
                  {c.nom}
                </button>
              );
            })}
          </div>
        )}

        {capteurs.length === 0 && (
          <p className="text-[10px] italic opacity-60">
            Aucun capteur déclaré. Ajoutez-en depuis « Capteurs et sondes ».
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default IotDock;
