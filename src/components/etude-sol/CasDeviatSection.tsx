import React from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Loader2, Beaker, Sprout, Ruler } from 'lucide-react';
import { useCaseDeviat } from '@/hooks/useCaseDeviat';
import { soilLiteFromState } from '@/lib/soilLiteFromState';
import { CountUp } from './CountUp';

const TEST_LABEL: Record<string, string> = {
  beche: 'Test de la bêche',
  stabilite: 'Test de stabilité',
  boudin: 'Test du boudin',
  sedimentation: 'Test de sédimentation',
  bandelette: 'Bandelette pH',
  phmetre: 'pHmètre',
  beche_vivante: 'Bêche vivante',
  vinaigre: 'Test du vinaigre',
  sachet: 'Sachet de thé',
  terrain: 'État du terrain',
};

const STRUCTURE_LABEL: Record<string, string> = {
  compacte: 'Compacte',
  grumeleuse: 'Grumeleuse',
  tres_meuble: 'Très meuble',
};

const TEXTURE_LABEL: Record<string, string> = {
  sable: 'Sableuse',
  limon: 'Limoneuse',
  argile: 'Argileuse',
};

/** `soilLiteFromState` renvoie des identifiants nuancés (limon_moyen…) : on garde la dominante. */
function textureLabel(value?: string | null): string {
  if (!value) return '—';
  const root = value.split('_')[0];
  return TEXTURE_LABEL[root] ?? TEXTURE_LABEL[value] ?? value;
}

export const CasDeviatSection: React.FC = () => {
  const { data, isLoading, isError } = useCaseDeviat();
  const soil = data?.soil ?? null;
  const lite = React.useMemo(() => soilLiteFromState(soil), [soil]);

  const samples = soil?.samples ?? [];
  const documented = samples.filter(
    (s: any) => s.texture_test || s.structure_test || s.ph_test || s.life_test,
  ).length;
  const phValues = samples
    .map((s: any) => (typeof s.ph_value === 'number' ? s.ph_value : null))
    .filter((v): v is number => v != null);
  const phAvg = phValues.length ? phValues.reduce((a, b) => a + b, 0) / phValues.length : null;

  const kpis = [
    { icon: MapPin, value: samples.length, label: 'Prélèvements géolocalisés', decimals: 0, suffix: '' },
    { icon: Beaker, value: documented, label: 'Points testés', decimals: 0, suffix: '' },
    {
      icon: Ruler,
      value: phAvg ?? 0,
      label: phAvg != null ? 'pH moyen relevé' : 'pH non relevé',
      decimals: 1,
      suffix: '',
    },
    { icon: Camera, value: data?.totalPhotos ?? 0, label: 'Preuves photo', decimals: 0, suffix: '' },
  ];

  const verdicts = [
    { label: 'Structure', value: lite.structure ? STRUCTURE_LABEL[lite.structure] ?? lite.structure : '—' },
    { label: 'Texture dominante', value: textureLabel(lite.texture) },
    { label: 'Acidité', value: phAvg != null ? `pH ${phAvg.toFixed(1).replace('.', ',')}` : '—' },
    {
      label: 'Indices de vie',
      value: soil?.life_signs?.length ? `${soil.life_signs.length} relevés` : '—',
    },
  ];

  return (
    <section
      id="cas-deviat"
      className="scroll-mt-16 border-t border-[hsl(var(--ds-forest))]/15 bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))] sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-cream))]/60">
          03 — Cas concret
        </p>
        <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">
          Jardin Monde DEVIAT, Dordogne
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[hsl(var(--ds-cream))]/80">
          Un parc en cours de renaturation, diagnostiqué carotte par carotte. Les chiffres ci-dessous
          sont lus en direct dans le registre de sol de la propriété.
        </p>

        {isLoading && (
          <div className="mt-10 flex items-center gap-2 text-[hsl(var(--ds-cream))]/70">
            <Loader2 className="h-4 w-4 animate-spin" /> Lecture du registre de sol…
          </div>
        )}

        {isError && (
          <p className="mt-10 rounded-2xl border border-[hsl(var(--ds-cream))]/20 bg-[hsl(var(--ds-cream))]/8 p-5 text-sm text-[hsl(var(--ds-cream))]/80">
            Les données du cas concret sont momentanément indisponibles.
          </p>
        )}

        {!isLoading && !isError && (
          <>
            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className="rounded-3xl border border-[hsl(var(--ds-cream))]/18 bg-[hsl(var(--ds-cream))]/[0.07] p-5"
                >
                  <k.icon className="h-5 w-5 text-[hsl(var(--ds-gold))]" />
                  <p className="mt-3 font-serif text-3xl">
                    <CountUp value={k.value} decimals={k.decimals} />
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--ds-cream))]/60">
                    {k.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Verdict du site */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {verdicts.map((v) => (
                <div
                  key={v.label}
                  className="rounded-2xl border border-[hsl(var(--ds-gold))]/35 bg-[hsl(var(--ds-gold))]/10 px-4 py-3.5"
                >
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--ds-cream))]/60">
                    {v.label}
                  </p>
                  <p className="mt-1 font-serif text-xl">{v.value}</p>
                </div>
              ))}
            </div>

            {/* Prélèvements */}
            {samples.length > 0 && (
              <div className="mt-12">
                <h3 className="font-serif text-2xl">Les carottes, une par une</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {samples.map((s: any) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4 }}
                      className="rounded-2xl border border-[hsl(var(--ds-cream))]/16 bg-[hsl(var(--ds-cream))]/[0.05] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--ds-cream))] text-[13px] font-bold text-[hsl(var(--ds-forest-deep))]">
                          {s.label ?? s.id}
                        </span>
                        <span className="text-[13.5px] font-medium text-[hsl(var(--ds-cream))]/85">
                          {s.location ?? 'Sans lieu-dit'}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1 text-[12.5px] text-[hsl(var(--ds-cream))]/70">
                        {s.texture_result && (
                          <li>Texture : {textureLabel(s.texture_result)}</li>
                        )}
                        {s.structure_result && (
                          <li>
                            Structure : {STRUCTURE_LABEL[s.structure_result] ?? s.structure_result}
                          </li>
                        )}
                        {typeof s.ph_value === 'number' && <li>pH : {s.ph_value}</li>}
                        {typeof s.worm_count === 'number' && <li>Vers comptés : {s.worm_count}</li>}
                        {Array.isArray(s.life_signs) && s.life_signs.length > 0 && (
                          <li>Indices de vie : {s.life_signs.length}</li>
                        )}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos de terrain */}
            {(data?.photos?.length ?? 0) > 0 && (
              <div className="mt-12">
                <h3 className="flex items-center gap-2 font-serif text-2xl">
                  <Camera className="h-5 w-5 text-[hsl(var(--ds-gold))]" /> Les preuves de terrain
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {data!.photos.map((p) => (
                    <motion.figure
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4 }}
                      className="group overflow-hidden rounded-2xl border border-[hsl(var(--ds-cream))]/16 bg-[hsl(var(--ds-cream))]/[0.05]"
                    >
                      <img
                        src={p.url}
                        alt={`${TEST_LABEL[p.testId] ?? 'Test de sol'} — prélèvement ${p.sampleLabel ?? ''} au Jardin Monde DEVIAT`}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <figcaption className="px-3 py-2.5 text-[11.5px] text-[hsl(var(--ds-cream))]/70">
                        <span className="font-semibold text-[hsl(var(--ds-cream))]">
                          {TEST_LABEL[p.testId] ?? p.testId}
                        </span>
                        {p.sampleLabel && <> · point {p.sampleLabel}</>}
                      </figcaption>
                    </motion.figure>
                  ))}
                </div>
              </div>
            )}

            {/* Synthèse */}
            <div className="mt-12 rounded-3xl border border-[hsl(var(--ds-cream))]/18 bg-[hsl(var(--ds-cream))]/[0.07] p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-serif text-2xl">
                <Sprout className="h-5 w-5 text-[hsl(var(--ds-gold))]" /> Ce que le sol a dit
              </h3>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[hsl(var(--ds-cream))]/82">
                Un sol limoneux dominant, à structure grumeleuse là où la vie s’installe, et une
                réaction franchement basique{phAvg != null ? ` (pH ${phAvg.toFixed(1).replace('.', ',')} en moyenne)` : ''}.
                Conséquence directe sur le projet : les acidophiles sont écartées de la palette, les
                zones tassées passent en priorité de décompactage, et les massifs méditerranéens sont
                confirmés sur les points les plus drainants.
              </p>
              <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-[hsl(var(--ds-cream))]/62">
                Chaque valeur reste rattachée à sa carotte et à sa photo : le diagnostic est
                réexaminable, contestable et reproductible saison après saison.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CasDeviatSection;
