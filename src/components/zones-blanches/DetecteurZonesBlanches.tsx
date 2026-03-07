import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Loader2, Compass } from 'lucide-react';
import { useDetecteurZonesBlanches, ZoneResult } from '@/hooks/useDetecteurZonesBlanches';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DetecteurZonesBlanches = () => {
  const [address, setAddress] = useState('');
  const { results, isLoading, remainingSearches, searchByGPS, searchByAddress } = useDetecteurZonesBlanches();

  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchByAddress(address);
  };

  const exhausted = remainingSearches <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="mt-10 rounded-2xl p-6 md:p-8"
      style={{
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(214,211,199,0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
          <Compass className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-crimson text-lg font-semibold" style={{ color: '#1a1a18' }}>
            Détecteur de zones blanches
          </h3>
          <p className="text-xs text-stone-500">Trouvez les territoires inexplorés près de vous</p>
        </div>
      </div>

      {exhausted ? (
        <div className="text-center py-6">
          <p className="font-crimson text-stone-600 text-base italic leading-relaxed">
            Vos trois explorations ont été lancées.<br />
            Les territoires silencieux vous attendent — revenez bientôt pour de nouvelles découvertes.
          </p>
        </div>
      ) : (
        <>
          {/* Search controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-2">
            <Button
              onClick={searchByGPS}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-700"
            >
              <MapPin className="w-4 h-4" />
              Ma position
            </Button>

            <form onSubmit={handleAddressSearch} className="flex-1 flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rue, ville..."
                disabled={isLoading}
                className="flex-1 border-stone-200 focus-visible:ring-emerald-500"
              />
              <Button type="submit" disabled={isLoading || !address.trim()} variant="outline" className="border-emerald-200 hover:bg-emerald-50 text-emerald-700">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          <p className="text-xs text-stone-400 mb-4">
            {remainingSearches === 1 ? 'Dernière recherche disponible' : `${remainingSearches} recherches restantes`}
          </p>
        </>
      )}

      {/* Loading */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-8"
          >
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            <span className="text-sm text-stone-500 font-crimson italic">Exploration des territoires en cours…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="border-t border-stone-200/60 pt-4 mt-2">
              <p className="text-sm text-stone-600 mb-3">
                <strong className="text-emerald-700">{results.blank_count}</strong> zone{results.blank_count > 1 ? 's' : ''} blanche{results.blank_count > 1 ? 's' : ''} détectée{results.blank_count > 1 ? 's' : ''} sur {results.total_scanned} points scannés
              </p>

              {results.blank_count === 0 ? (
                <p className="text-sm text-stone-500 italic font-crimson">
                  Bonne nouvelle : ce territoire est déjà documenté ! Essayez un autre lieu pour trouver des zones blanches.
                </p>
              ) : (
                <div className="space-y-2">
                  {results.zones.filter(z => z.is_blank).slice(0, 5).map((zone, i) => (
                    <ZoneRow key={`${zone.lat}-${zone.lng}`} zone={zone} index={i} />
                  ))}
                </div>
              )}

              {/* Show a few documented zones for context */}
              {results.zones.some(z => !z.is_blank && z.label) && (
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-2">Zones déjà documentées à proximité</p>
                  <div className="space-y-1">
                    {results.zones.filter(z => !z.is_blank && z.label).slice(0, 2).map((zone) => (
                      <div key={`${zone.lat}-${zone.lng}`} className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span>{zone.label}</span>
                        <span className="ml-auto">{zone.distance_km} km · {zone.observations} obs.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ZoneRow = ({ zone, index }: { zone: ZoneResult; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 }}
    className="flex items-center gap-3 rounded-xl px-4 py-3"
    style={{ background: 'rgba(254,243,199,0.3)', border: '1px solid rgba(251,191,36,0.2)' }}
  >
    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-stone-700 truncate">
        {zone.label || `${zone.lat.toFixed(3)}, ${zone.lng.toFixed(3)}`}
      </p>
      <p className="text-xs text-stone-400">Aucune observation recensée</p>
    </div>
    <span className="text-sm font-semibold text-amber-600 shrink-0">{zone.distance_km} km</span>
  </motion.div>
);

export default DetecteurZonesBlanches;
