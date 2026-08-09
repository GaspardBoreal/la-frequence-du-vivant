import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSoilGuardAudit } from '@/hooks/propriete/useSoilGuardAudit';
import SoilGuardVerdictBanner, { type Verdict } from '@/components/admin/soil-audit/SoilGuardVerdictBanner';
import SoilGuardChecklist, { type GuardCheck } from '@/components/admin/soil-audit/SoilGuardChecklist';
import SoilWritePathsTable from '@/components/admin/soil-audit/SoilWritePathsTable';
import SoilHistoryPulse from '@/components/admin/soil-audit/SoilHistoryPulse';
import { SOIL_WRITE_PATHS } from '@/lib/propriete/soilWritePaths';

type DryRun =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'blocked'; message: string }
  | { state: 'breached'; message: string }
  | { state: 'skipped'; message: string }
  | { state: 'error'; message: string };

const Section: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({
  title, hint, children,
}) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
    {children}
  </section>
);

const AdminSoilRegistryAudit: React.FC = () => {
  const { audit, history } = useSoilGuardAudit();
  const [proprieteId, setProprieteId] = useState<string>('');
  const [dryRun, setDryRun] = useState<DryRun>({ state: 'idle' });

  const proprietes = useQuery({
    queryKey: ['soil-audit-proprietes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proprietes')
        .select('id, nom')
        .order('nom', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const checks: GuardCheck[] = useMemo(() => {
    const a = audit.data;
    if (!a) return [];
    const guard = a.triggers.find((t) => t.function === 'guard_propriete_soil_samples');
    const histTrigger = a.triggers.find((t) => t.function === 'log_propriete_soil_history');
    const fn = (n: string) => a.functions.find((f) => f.name === n);
    const move = fn('move_propriete_soil_sample');
    const upsert = fn('upsert_propriete_soil');
    const writePolicy = a.policies.find(
      (p) => p.table === 'propriete_soil_diagnostics' && p.name === 'soil_write',
    );

    return [
      {
        id: 'rls',
        label: 'Sécurité au niveau des lignes activée',
        detail: a.rls_enabled
          ? 'La table du registre est protégée par RLS.'
          : 'RLS désactivée : la table est exposée sans filtrage.',
        verdict: a.rls_enabled ? 'ok' : 'fail',
      },
      {
        id: 'guard',
        label: 'Garde-fou anti-effacement',
        detail: guard
          ? guard.enabled
            ? `Actif (${guard.name}) : toute écriture qui vide un champ rempli ou retire un prélèvement est rejetée.`
            : `Présent mais désactivé (${guard.name}).`
          : 'Absent : aucune protection serveur contre les écritures destructives.',
        verdict: guard ? (guard.enabled ? 'ok' : 'fail') : 'fail',
      },
      {
        id: 'history',
        label: 'Journal des versions',
        detail: a.history_table_exists
          ? `${a.history_count} version(s) archivée(s)${histTrigger ? ', alimentation automatique active' : ', alimentation automatique introuvable'}.`
          : "Table d'archive absente : aucune restauration possible.",
        verdict: a.history_table_exists ? (histTrigger ? 'ok' : 'warn') : 'fail',
      },
      {
        id: 'move-rpc',
        label: 'Déplacement chirurgical d\'un prélèvement',
        detail: move
          ? `Disponible${move.security_definer ? ', exécution contrôlée' : ''}${move.granted_to_authenticated ? ', accessible aux marcheurs connectés' : ', droits d\'exécution manquants'}.`
          : 'Fonction absente : les déplacements réécriraient tout le registre.',
        verdict: move ? (move.granted_to_authenticated ? 'ok' : 'warn') : 'fail',
      },
      {
        id: 'upsert-rpc',
        label: 'Enregistrement complet protégé',
        detail: upsert
          ? 'La saisie de « J\'analyse » passe par une fonction serveur contrôlée.'
          : 'Fonction d\'enregistrement introuvable.',
        verdict: upsert ? 'ok' : 'fail',
      },
      {
        id: 'policy-align',
        label: 'Cohérence des droits table / fonction',
        detail: writePolicy
          ? writePolicy.covers_attached_walkers
            ? 'La règle d\'accès à la table couvre les marcheurs rattachés, comme la fonction d\'enregistrement.'
            : 'La règle d\'accès à la table est plus restrictive que la fonction d\'enregistrement.'
          : 'Aucune règle d\'écriture trouvée sur la table.',
        verdict: writePolicy ? (writePolicy.covers_attached_walkers ? 'ok' : 'warn') : 'fail',
      },
      {
        id: 'paths',
        label: 'Points d\'entrée applicatifs déclarés',
        detail: `${SOIL_WRITE_PATHS.length} écrans recensés, dont ${SOIL_WRITE_PATHS.filter((p) => p.regime === 'unprotected').length} non protégé(s).`,
        verdict: SOIL_WRITE_PATHS.some((p) => p.regime === 'unprotected') ? 'fail' : 'ok',
      },
    ];
  }, [audit.data]);

  const globalVerdict: Verdict = checks.some((c) => c.verdict === 'fail')
    ? 'fail'
    : checks.some((c) => c.verdict === 'warn')
      ? 'warn'
      : 'ok';

  const runDryRun = async () => {
    if (!proprieteId) return;
    setDryRun({ state: 'running' });
    try {
      const { data, error } = await supabase
        .from('propriete_soil_diagnostics' as any)
        .select('*')
        .eq('propriete_id', proprieteId)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      const row = data as any;
      const samples: any[] = Array.isArray(row?.samples) ? row.samples : [];
      if (samples.length === 0) {
        setDryRun({
          state: 'skipped',
          message: 'Cette propriété n\'a aucun prélèvement : le test à blanc est sans objet.',
        });
        return;
      }
      const amputated = samples.slice(0, samples.length - 1);
      const { error: rpcError } = await supabase.rpc('upsert_propriete_soil' as any, {
        p_propriete_id: proprieteId,
        p_terrain_status: row.terrain_status ?? null,
        p_samples: amputated as any,
        p_structure: row.structure ?? null,
        p_texture: row.texture ?? null,
        p_boudin_shape: row.boudin_shape ?? null,
        p_ph: row.ph ?? null,
        p_life_signs: row.life_signs ?? [],
        p_synthesis: row.synthesis ?? null,
        p_completed: null,
        p_allow_destructive: false,
      });
      if (rpcError) {
        setDryRun({
          state: 'blocked',
          message: `Écriture destructive refusée par le serveur — ${rpcError.message}`,
        });
        return;
      }
      // Le verrou n'a pas joué : on restaure immédiatement le registre complet.
      await supabase.rpc('upsert_propriete_soil' as any, {
        p_propriete_id: proprieteId,
        p_terrain_status: row.terrain_status ?? null,
        p_samples: samples as any,
        p_structure: row.structure ?? null,
        p_texture: row.texture ?? null,
        p_boudin_shape: row.boudin_shape ?? null,
        p_ph: row.ph ?? null,
        p_life_signs: row.life_signs ?? [],
        p_synthesis: row.synthesis ?? null,
        p_completed: null,
        p_allow_destructive: false,
      });
      setDryRun({
        state: 'breached',
        message:
          'Le verrou n\'a pas rejeté l\'écriture destructive. Le registre a été restauré automatiquement, mais la protection est défaillante.',
      });
    } catch (e: any) {
      setDryRun({ state: 'error', message: e?.message ?? 'Erreur inconnue' });
    }
  };

  const loading = audit.isLoading || history.isLoading;
  const failure = (audit.error ?? history.error) as any;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/admin/outils">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Outils
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { audit.refetch(); history.refetch(); }}
            disabled={audit.isFetching || history.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${audit.isFetching ? 'animate-spin' : ''}`} />
            Revérifier
          </Button>
        </div>

        <header>
          <h1 className="text-3xl font-bold text-foreground">Coffre-fort du registre de sol</h1>
          <p className="text-muted-foreground mt-1">
            Vérification en direct des protections contre l'effacement des prélèvements.
          </p>
        </header>

        {failure && (
          <Card className="p-5 border-destructive/40 bg-destructive/5">
            <p className="font-medium text-destructive">Audit impossible</p>
            <p className="text-sm text-muted-foreground mt-1">{failure.message}</p>
          </Card>
        )}

        {loading && !failure && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        )}

        {!loading && !failure && audit.data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            <SoilGuardVerdictBanner
              verdict={globalVerdict}
              title={
                globalVerdict === 'ok'
                  ? 'Registre verrouillé'
                  : globalVerdict === 'warn'
                    ? 'Registre protégé, points à surveiller'
                    : 'Protection incomplète'
              }
              subtitle={`${audit.data.registers_count} registre(s) suivi(s) · vérifié le ${new Date(audit.data.checked_at).toLocaleString('fr-FR')}`}
            />

            <Section title="Verrous en base" hint="État réel observé dans la base de données.">
              <SoilGuardChecklist checks={checks} />
            </Section>

            <Section
              title="Points d'entrée applicatifs"
              hint="Chaque écran qui touche au registre et le régime qui s'y applique."
            >
              <SoilWritePathsTable />
            </Section>

            <Section
              title="Dernières écritures"
              hint="Une baisse du nombre de prélèvements est signalée en alerte."
            >
              <SoilHistoryPulse rows={history.data ?? []} />
            </Section>

            <Section
              title="Test à blanc"
              hint="Tente une écriture destructive volontaire. Le succès attendu est un refus."
            >
              <Card className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={proprieteId} onValueChange={setProprieteId}>
                    <SelectTrigger className="sm:flex-1">
                      <SelectValue placeholder="Choisir une propriété" />
                    </SelectTrigger>
                    <SelectContent>
                      {(proprietes.data ?? []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={runDryRun}
                    disabled={!proprieteId || dryRun.state === 'running'}
                    className="min-h-11"
                  >
                    {dryRun.state === 'running'
                      ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      : <FlaskConical className="h-4 w-4 mr-2" />}
                    Lancer le test
                  </Button>
                </div>

                {dryRun.state !== 'idle' && dryRun.state !== 'running' && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={
                      dryRun.state === 'blocked'
                        ? 'text-sm text-primary'
                        : dryRun.state === 'skipped'
                          ? 'text-sm text-muted-foreground'
                          : 'text-sm text-destructive'
                    }
                  >
                    {dryRun.state === 'blocked' && '✓ '}
                    {dryRun.message}
                  </motion.p>
                )}
              </Card>
            </Section>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminSoilRegistryAudit;
