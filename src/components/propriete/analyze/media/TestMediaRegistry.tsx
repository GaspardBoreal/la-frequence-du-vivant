import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Filter, Images, LayoutGrid, MapPin, Video } from 'lucide-react';
import { AnalyzeCard } from '../AnalyzeCard';
import { SOIL_TESTS, soilTestAccent, soilTestLabel } from './soilTestCatalog';
import { TestMediaViewer } from './TestMediaViewer';
import type { TestMedia } from '@/hooks/propriete/usePropertyTestMedias';

type GroupMode = 'chrono' | 'test' | 'sample';

const dayOf = (iso: string) => iso.slice(0, 10);

export const TestMediaRegistry: React.FC<{
  medias: TestMedia[];
  index?: number;
}> = ({ medias, index = 0 }) => {
  const [test, setTest] = React.useState<string>('all');
  const [sample, setSample] = React.useState<string>('all');
  const [kind, setKind] = React.useState<'all' | 'photo' | 'video'>('all');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [group, setGroup] = React.useState<GroupMode>('chrono');
  const [viewer, setViewer] = React.useState<number | null>(null);

  const samples = React.useMemo(() => {
    const map = new Map<string, string>();
    medias.forEach((m) =>
      map.set(m.sample_id, (m.sample_location || m.sample_label || m.sample_id) as string)
    );
    return Array.from(map.entries());
  }, [medias]);

  const usedTests = React.useMemo(
    () => SOIL_TESTS.filter((t) => medias.some((m) => m.test_id === t.id)),
    [medias]
  );

  const filtered = React.useMemo(() => {
    return medias
      .filter((m) => (test === 'all' ? true : m.test_id === test))
      .filter((m) => (sample === 'all' ? true : m.sample_id === sample))
      .filter((m) => (kind === 'all' ? true : m.media_type === kind))
      .filter((m) => (from ? dayOf(m.created_at) >= from : true))
      .filter((m) => (to ? dayOf(m.created_at) <= to : true))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [medias, test, sample, kind, from, to]);

  const groups = React.useMemo(() => {
    if (group === 'chrono') return [{ key: 'all', label: '', items: filtered }];
    const map = new Map<string, TestMedia[]>();
    filtered.forEach((m) => {
      const k = group === 'test' ? m.test_id : m.sample_id;
      const arr = map.get(k) ?? [];
      arr.push(m);
      map.set(k, arr);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label:
        group === 'test'
          ? soilTestLabel(key)
          : (items[0]?.sample_location || items[0]?.sample_label || key) as string,
      items,
    }));
  }, [filtered, group]);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-[11px] font-semibold border transition ${
      active
        ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
        : 'bg-[hsl(var(--ds-cream))] text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-forest))]/25 hover:bg-[hsl(var(--ds-forest))]/8'
    }`;

  const testCount = new Set(filtered.map((m) => m.test_id)).size;
  const sampleCount = new Set(filtered.map((m) => m.sample_id)).size;

  return (
    <AnalyzeCard
      number={7}
      category="Étape 2 · Registre visuel"
      title="Toutes les preuves de terrain"
      subtitle="Chaque photo ou vidéo, rattachée à son prélèvement, à son test et à sa date."
      index={index}
    >
      <div className="space-y-4">
        {/* Compteurs */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[hsl(var(--ds-forest-deep))]/75">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))]/10 px-3 py-1 font-semibold">
            <Images className="w-3.5 h-3.5" /> {filtered.length} preuve{filtered.length > 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-gold))]/15 px-3 py-1 font-semibold">
            <MapPin className="w-3.5 h-3.5" /> {sampleCount} emplacement{sampleCount > 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest))]/8 px-3 py-1 font-semibold">
            <LayoutGrid className="w-3.5 h-3.5" /> {testCount} test{testCount > 1 ? 's' : ''}
          </span>
        </div>

        {/* Filtres */}
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest))]/70">
            <Filter className="w-3 h-3" /> Filtrer
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button className={chip(test === 'all')} onClick={() => setTest('all')}>
              Tous les tests
            </button>
            {usedTests.map((t) => (
              <button
                key={t.id}
                className={chip(test === t.id)}
                style={
                  test === t.id
                    ? { background: `hsl(${soilTestAccent(t.id)})`, borderColor: `hsl(${soilTestAccent(t.id)})` }
                    : undefined
                }
                onClick={() => setTest(t.id)}
              >
                {t.short}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button className={chip(sample === 'all')} onClick={() => setSample('all')}>
              Tous les emplacements
            </button>
            {samples.map(([id, label]) => (
              <button key={id} className={chip(sample === id)} onClick={() => setSample(id)}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1.5">
              {(['all', 'photo', 'video'] as const).map((k) => (
                <button key={k} className={chip(kind === k)} onClick={() => setKind(k)}>
                  {k === 'all' ? 'Tout' : k === 'photo' ? 'Photos' : 'Vidéos'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--ds-forest-deep))]/70">
              <span>du</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-[hsl(var(--ds-forest))]/25 bg-white px-2 py-1 text-[11px]"
              />
              <span>au</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-[hsl(var(--ds-forest))]/25 bg-white px-2 py-1 text-[11px]"
              />
            </div>
            <div className="ml-auto flex gap-1.5">
              {(['chrono', 'test', 'sample'] as GroupMode[]).map((g) => (
                <button key={g} className={chip(group === g)} onClick={() => setGroup(g)}>
                  {g === 'chrono' ? 'Chronologie' : g === 'test' ? 'Par test' : 'Par emplacement'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mosaïque */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-forest))]/30 p-8 text-center text-[12.5px] text-[hsl(var(--ds-forest-deep))]/70">
            Aucune preuve visuelle ne correspond à ces filtres.
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.key}>
                {g.label && (
                  <div className="mb-2 text-[10px] font-bold tracking-[0.18em] uppercase text-[hsl(var(--ds-forest))]/70">
                    {g.label} · {g.items.length}
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {g.items.map((m) => {
                    const globalIndex = filtered.findIndex((x) => x.id === m.id);
                    return (
                      <motion.button
                        key={m.id}
                        layout
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setViewer(globalIndex)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-forest))]/8"
                      >
                        {m.media_type === 'video' ? (
                          <span className="w-full h-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-[hsl(var(--ds-forest))]/60" />
                          </span>
                        ) : (
                          <img src={m.url} alt={m.caption ?? ''} loading="lazy" className="w-full h-full object-cover" />
                        )}
                        <span
                          className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[8.5px] font-semibold text-white truncate"
                          style={{ background: `hsl(${soilTestAccent(m.test_id)} / 0.85)` }}
                        >
                          {new Date(m.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10.5px] text-[hsl(var(--ds-forest-deep))]/55">
          <Camera className="w-3 h-3" /> Les médias sont visibles par toutes les personnes ayant accès
          à cette propriété.
        </div>
      </div>

      <TestMediaViewer
        medias={filtered}
        index={viewer}
        onClose={() => setViewer(null)}
        onNavigate={setViewer}
      />
    </AnalyzeCard>
  );
};
