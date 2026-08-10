import React from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Plus, HeartPulse, Leaf, BookOpen } from 'lucide-react';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { usePropertySoil } from '@/hooks/propriete/usePropertySoil';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import { soilLiteFromState } from '@/lib/soilLiteFromState';
import { useParcelWeather, summarizeWeather } from '@/components/cadastre/useParcelWeather';
import { computeGardenRisk } from '@/lib/gardenRisk';
import {
  useConsultations, usePathogenKb, useCliniqueOverview,
  type Consultation, type ConsultationStatus,
} from '@/hooks/propriete/useGardenClinique';
import { computeGardenHealth } from '@/lib/gardenHealth';
import HealthBanner from '@/components/propriete/clinique/HealthBanner';
import SensorPanel from '@/components/propriete/clinique/SensorPanel';
import NewConsultationDialog from '@/components/propriete/clinique/NewConsultationDialog';
import ConsultationDrawer from '@/components/propriete/clinique/ConsultationDrawer';


const STATUS_TONE: Record<string, string> = {
  observation: 'bg-[hsl(var(--ds-gold))]/25 text-[hsl(var(--ds-forest-deep))]',
  traitement: 'bg-[hsl(28_78%_48%)]/20 text-[hsl(var(--ds-forest-deep))]',
  gueri: 'bg-[hsl(var(--ds-forest))]/18 text-[hsl(var(--ds-forest-deep))]',
  perdu: 'bg-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest))]',
};
const STATUS_LABEL: Record<string, string> = {
  observation: 'En observation',
  traitement: 'En traitement',
  gueri: 'Rétabli',
  perdu: 'Sujet perdu',
};

export const TabClinique: React.FC<{
  proprieteId: string;
  proprieteNom: string;
  proprieteVille?: string | null;
  proprieteCenter?: [number, number] | null;
}> = ({ proprieteId, proprieteNom, proprieteVille, proprieteCenter }) => {
  const { state: soilState } = usePropertySoil(proprieteId, { readOnly: true });
  const { species } = usePropertySpeciesPool(proprieteId);
  const { data: kb } = usePathogenKb();
  const { data: consultations } = useConsultations(proprieteId);

  const lat = proprieteCenter?.[0] ?? null;
  const lng = proprieteCenter?.[1] ?? null;
  const { data: weatherRaw } = useParcelWeather(lat, lng, !!lat && !!lng);
  const weather = React.useMemo(() => (weatherRaw ? summarizeWeather(weatherRaw) : null), [weatherRaw]);

  const soil = React.useMemo(() => soilLiteFromState(soilState), [soilState]);

  const plantNames = React.useMemo(
    () => (species || [])
      .filter((s: any) => s.kingdom === 'Plantae')
      .map((s: any) => s.commonName || s.scientificName)
      .filter(Boolean) as string[],
    [species],
  );

  const risk = React.useMemo(
    () => computeGardenRisk(weather, kb, plantNames),
    [weather, kb, plantNames],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [openConsultation, setOpenConsultation] = React.useState<Consultation | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<ConsultationStatus | null>(null);

  const list = consultations ?? [];
  const consultationIds = React.useMemo(() => list.map((c) => c.id), [list]);
  const { data: overview } = useCliniqueOverview(proprieteId, consultationIds);
  const health = React.useMemo(
    () => computeGardenHealth(list, overview ?? undefined),
    [list, overview],
  );

  const activeAll = list.filter((c) => c.status === 'observation' || c.status === 'traitement');
  const active = statusFilter
    ? activeAll.filter((c) => c.status === statusFilter)
    : activeAll;
  const healedAll = list.filter((c) => c.status === 'gueri');
  const healed = statusFilter && statusFilter !== 'gueri' ? [] : healedAll;
  const lost = statusFilter === 'perdu' ? list.filter((c) => c.status === 'perdu') : [];


  const speciesOptions = React.useMemo(
    () => (species || []).map((s: any) => ({
      scientificName: s.scientificName as string,
      commonName: (s.commonName || s.scientificName) as string,
    })),
    [species],
  );

  return (
    <div className="space-y-6">
      <StepHeader
        current={5}
        title="La Clinique du jardin"
        meta={`${proprieteNom}${proprieteVille ? ` · ${proprieteVille}` : ''}`}
        subtitle={
          <>
            Le médecin préventif et curatif du lieu : on regarde, on croise le sol, la météo et les
            Observations, puis on soigne du geste le plus doux au plus fort.
            <span className="italic"> Anticiper · Identifier · Soigner.</span>
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--ds-forest-deep))] px-3.5 py-2 text-xs font-medium text-[hsl(var(--ds-cream))] transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" /> Ouvrir une consultation
          </button>
        }
      />

      <HealthBanner
        health={health}
        risk={risk}
        weather={weather}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
      />


      {/* Consultations */}
      <section>
        <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
          <HeartPulse className="h-3 w-3" /> Consultations en cours
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className="ml-1 rounded-full border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-0.5 text-[9px] normal-case tracking-normal text-[hsl(var(--ds-forest-deep))] hover:bg-white"
            >
              Filtre : {STATUS_LABEL[statusFilter]} — tout voir
            </button>
          )}
        </h3>


        {active.length === 0 ? (
          <div className="mt-2 rounded-3xl border border-dashed border-[hsl(var(--ds-forest))]/35 bg-[hsl(var(--ds-cream))] p-8 text-center">
            <Stethoscope className="mx-auto h-6 w-6 text-[hsl(var(--ds-forest))]/60" />
            <p className="mt-2 font-serif italic text-lg text-[hsl(var(--ds-forest-deep))]">
              Aucun sujet en soin aujourd'hui
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-[hsl(var(--ds-forest))]/75">
              Une feuille tachée, une écorce qui suinte, un fruit momifié : ouvrez une consultation,
              le jardin vous répondra avec ce qu'il sait déjà de son sol et de son ciel.
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--ds-gold))]/70 bg-[hsl(var(--ds-forest-deep))] px-4 py-2 text-xs font-medium text-[hsl(var(--ds-cream))] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5 text-[hsl(var(--ds-gold))]" /> Ouvrir une consultation
            </button>
          </div>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {active.map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => setOpenConsultation(c)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-4 text-left shadow-[0_2px_18px_-12px_rgba(60,80,60,0.25)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-[hsl(var(--ds-forest-deep))]">{c.subject_label}</p>
                    {c.subject_scientific_name && (
                      <p className="truncate text-[11px] italic text-[hsl(var(--ds-forest))]/70">
                        {c.subject_scientific_name}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${STATUS_TONE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[hsl(var(--ds-forest))]/75">
                  <Leaf className="h-3 w-3" />
                  {c.organ || 'organe non précisé'} · ouverte le{' '}
                  {new Date(c.opened_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="mt-2 flex gap-1" aria-label={`Étendue ${c.severity} sur 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 flex-1 rounded-full ${
                        n <= c.severity ? 'bg-[hsl(var(--ds-gold))]' : 'bg-[hsl(var(--ds-line))]'
                      }`}
                    />
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {healed.length > 0 && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
            Rétablissements
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {healed.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenConsultation(c)}
                className="rounded-full border border-[hsl(var(--ds-forest))]/40 bg-white/60 px-3 py-1 text-[11px] text-[hsl(var(--ds-forest-deep))] hover:bg-white"
              >
                {c.subject_label}
              </button>
            ))}
          </div>
        </section>
      )}

      <SensorPanel proprieteId={proprieteId} />

      {/* Base de connaissance */}
      {!!kb?.length && (
        <section className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5">
          <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[hsl(var(--ds-forest))]">
            <BookOpen className="h-3 w-3" /> Ce que la maison sait déjà
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {kb.map((p) => (
              <details key={p.id} className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/55 p-3">
                <summary className="cursor-pointer text-sm font-medium text-[hsl(var(--ds-forest-deep))]">
                  {p.common_name}
                  <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-60">{p.kind}</span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--ds-forest))]/85">{p.signs}</p>
                {p.confusions && (
                  <p className="mt-1.5 text-[11px] text-[hsl(var(--ds-forest))]/70">
                    <span className="font-semibold">À ne pas confondre — </span>{p.confusions}
                  </p>
                )}
                {!!p.hosts?.length && (
                  <p className="mt-1.5 text-[11px] italic text-[hsl(var(--ds-forest))]/70">
                    Hôtes : {p.hosts.join(', ')}
                  </p>
                )}
                {Array.isArray(p.eco_actions) && p.eco_actions.length > 0 && (
                  <ol className="mt-2 space-y-1">
                    {p.eco_actions.map((a, i) => (
                      <li key={i} className="text-[11px] text-[hsl(var(--ds-forest))]/85">
                        <span className="mr-1 rounded-full bg-[hsl(var(--ds-forest))]/12 px-1.5 py-0.5 text-[9px]">
                          {a.intensity ?? i + 1}
                        </span>
                        {a.label}
                      </li>
                    ))}
                  </ol>
                )}
                {p.source && (
                  <p className="mt-2 text-[10px] italic opacity-55">Source : {p.source}</p>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      <NewConsultationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        proprieteId={proprieteId}
        speciesOptions={speciesOptions}
        soil={soil as unknown as Record<string, unknown>}
        weather={weather}
        kb={kb ?? []}
        onCreated={(id) => {
          const found = (consultations ?? []).find((c) => c.id === id);
          if (found) setOpenConsultation(found);
        }}
      />

      <ConsultationDrawer
        consultation={openConsultation}
        proprieteId={proprieteId}
        onClose={() => setOpenConsultation(null)}
      />
    </div>
  );
};

export default TabClinique;
