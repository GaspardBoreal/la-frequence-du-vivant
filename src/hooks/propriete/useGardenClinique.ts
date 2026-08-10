import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─────────────────────────── Types ─────────────────────────── */

export type ConsultationStatus = 'observation' | 'traitement' | 'gueri' | 'perdu';
export type ActionVolet = 'curatif' | 'preventif';

export interface Consultation {
  id: string;
  propriete_id: string;
  subject_label: string;
  subject_scientific_name: string | null;
  subject_source: string;
  organ: string | null;
  aspect: string | null;
  onset: string | null;
  lat: number | null;
  lng: number | null;
  severity: number;
  status: ConsultationStatus;
  retained_hypothesis_id: string | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hypothesis {
  id: string;
  consultation_id: string;
  rank: number;
  common_name: string;
  scientific_name: string | null;
  kind: string | null;
  confidence: number;
  what_you_see: string | null;
  confusions: string | null;
  gravity: string | null;
  terrain_reading: string | null;
  created_at: string;
}

export interface CareAction {
  id: string;
  consultation_id: string;
  volet: ActionVolet;
  intensity: number;
  label: string;
  detail: string | null;
  window_start: string | null;
  window_end: string | null;
  frequency: string | null;
  weather_caution: string | null;
  done: boolean;
  done_at: string | null;
  order_index: number;
  created_at: string;
}

export interface ConsultationMedia {
  id: string;
  consultation_id: string;
  media_type: 'photo' | 'video' | 'audio';
  url: string;
  storage_path: string | null;
  caption: string | null;
  severity_at_capture: number | null;
  taken_at: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface SensorReading {
  id: string;
  propriete_id: string;
  sensor_label: string | null;
  metric: 'temperature' | 'humidite' | 'luminosite' | string;
  value: number;
  unit: string | null;
  measured_at: string;
  source: string;
  created_at: string;
}

export interface PathogenKbEntry {
  id: string;
  common_name: string;
  scientific_name: string | null;
  kind: string;
  hosts: string[];
  organs: string[];
  signs: string | null;
  confusions: string | null;
  gravity: string | null;
  favouring_conditions: string | null;
  eco_actions: Array<{ intensity?: number; label?: string }>;
  prevention: Array<{ label?: string }>;
  risk_months: number[];
  source: string | null;
}

export const CLINIQUE_BUCKET = 'propriete-clinique';

/* ─────────────────────────── Lectures ─────────────────────────── */

export function useConsultations(proprieteId?: string) {
  return useQuery({
    queryKey: ['clinique-consultations', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<Consultation[]> => {
      const { data, error } = await supabase
        .from('propriete_consultations' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .order('opened_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) as Consultation[];
    },
  });
}

export function useConsultationDetail(consultationId?: string) {
  return useQuery({
    queryKey: ['clinique-consultation-detail', consultationId],
    enabled: !!consultationId,
    queryFn: async () => {
      const [h, a, m] = await Promise.all([
        supabase
          .from('propriete_consultation_hypotheses' as any)
          .select('*')
          .eq('consultation_id', consultationId!)
          .order('rank', { ascending: true }),
        supabase
          .from('propriete_consultation_actions' as any)
          .select('*')
          .eq('consultation_id', consultationId!)
          .order('intensity', { ascending: true }),
        supabase
          .from('propriete_consultation_medias' as any)
          .select('*')
          .eq('consultation_id', consultationId!)
          .order('taken_at', { ascending: true }),
      ]);
      if (h.error) throw h.error;
      if (a.error) throw a.error;
      if (m.error) throw m.error;
      return {
        hypotheses: ((h.data as any[]) || []) as Hypothesis[],
        actions: ((a.data as any[]) || []) as CareAction[],
        medias: ((m.data as any[]) || []) as ConsultationMedia[],
      };
    },
  });
}

/**
 * Agrégat clinique de toute la propriété : hypothèses, gestes de soin et
 * dernière photo de suivi, en trois requêtes seulement.
 */
export function useCliniqueOverview(proprieteId?: string, consultationIds: string[] = []) {
  const key = consultationIds.slice().sort().join(',');
  return useQuery({
    queryKey: ['clinique-overview', proprieteId, key],
    enabled: !!proprieteId && consultationIds.length > 0,
    queryFn: async () => {
      const [h, a, m] = await Promise.all([
        supabase
          .from('propriete_consultation_hypotheses' as any)
          .select('consultation_id, common_name')
          .in('consultation_id', consultationIds),
        supabase
          .from('propriete_consultation_actions' as any)
          .select('consultation_id, done')
          .in('consultation_id', consultationIds),
        supabase
          .from('propriete_consultation_medias' as any)
          .select('taken_at, created_at')
          .in('consultation_id', consultationIds)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);
      if (h.error) throw h.error;
      if (a.error) throw a.error;
      if (m.error) throw m.error;

      const hypothesesByConsultation: Record<string, string[]> = {};
      ((h.data as any[]) || []).forEach((row) => {
        (hypothesesByConsultation[row.consultation_id] ||= []).push(row.common_name);
      });
      const actions = ((a.data as any[]) || []);
      const lastRow = ((m.data as any[]) || [])[0];

      return {
        hypothesesByConsultation,
        actionsTotal: actions.length,
        actionsDone: actions.filter((x) => x.done).length,
        lastMediaAt: (lastRow?.taken_at || lastRow?.created_at || null) as string | null,
      };
    },
  });
}

export function usePathogenKb() {

  return useQuery({
    queryKey: ['garden-pathogens-kb'],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<PathogenKbEntry[]> => {
      const { data, error } = await supabase
        .from('garden_pathogens_kb' as any)
        .select('*')
        .order('common_name');
      if (error) throw error;
      return (data as any[]) as PathogenKbEntry[];
    },
  });
}

export function useSensorReadings(proprieteId?: string) {
  return useQuery({
    queryKey: ['clinique-sensor-readings', proprieteId],
    enabled: !!proprieteId,
    queryFn: async (): Promise<SensorReading[]> => {
      const { data, error } = await supabase
        .from('propriete_sensor_readings' as any)
        .select('*')
        .eq('propriete_id', proprieteId!)
        .order('measured_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any[]) as SensorReading[];
    },
  });
}

/* ─────────────────────────── Écritures ─────────────────────────── */

const invalidate = (qc: ReturnType<typeof useQueryClient>, proprieteId?: string, consultationId?: string) => {
  qc.invalidateQueries({ queryKey: ['clinique-consultations', proprieteId] });
  if (consultationId) qc.invalidateQueries({ queryKey: ['clinique-consultation-detail', consultationId] });
  // Le bandeau « État sanitaire du jardin » agrège gestes, hypothèses et médias :
  // il doit se recalculer à chaque écriture (ajout / suppression / réalisation).
  qc.invalidateQueries({ queryKey: ['clinique-overview'] });
  // La carte des foyers (Atelier du jardin) lit les mêmes gestes et preuves.
  qc.invalidateQueries({ queryKey: ['clinique-map'] });
};


export function useCreateConsultation(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Consultation>): Promise<Consultation> => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('propriete_consultations' as any)
        .insert({ ...payload, propriete_id: proprieteId, created_by: auth.user?.id ?? null } as any)
        .select('*')
        .single();
      if (error) throw error;
      return data as any as Consultation;
    },
    onSuccess: () => invalidate(qc, proprieteId),
    onError: (e: any) => toast.error(e.message || 'Consultation non ouverte'),
  });
}

export function useUpdateConsultation(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Consultation> }) => {
      const { error } = await supabase
        .from('propriete_consultations' as any)
        .update(patch as any)
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => invalidate(qc, proprieteId, id),
    onError: (e: any) => toast.error(e.message || 'Mise à jour impossible'),
  });
}

export function useDeleteConsultation(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('propriete_consultations' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      invalidate(qc, proprieteId, id);
      toast.success('Consultation refermée et effacée du registre');
    },
    onError: (e: any) => toast.error(e.message || 'Suppression impossible'),
  });
}



export function useSaveDiagnostic(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consultationId,
      hypotheses,
      actions,
    }: {
      consultationId: string;
      hypotheses: Array<Partial<Hypothesis>>;
      actions: Array<Partial<CareAction>>;
    }) => {
      if (hypotheses.length) {
        const { error } = await supabase.from('propriete_consultation_hypotheses' as any).insert(
          hypotheses.map((h, i) => ({ ...h, consultation_id: consultationId, rank: i + 1 })) as any,
        );
        if (error) throw error;
      }
      if (actions.length) {
        const { error } = await supabase.from('propriete_consultation_actions' as any).insert(
          actions.map((a, i) => ({ ...a, consultation_id: consultationId, order_index: i })) as any,
        );
        if (error) throw error;
      }
      return consultationId;
    },
    onSuccess: (id) => invalidate(qc, proprieteId, id),
    onError: (e: any) => toast.error(e.message || 'Diagnostic non enregistré'),
  });
}

export function useToggleAction(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      action,
      consultationId,
    }: {
      action: CareAction;
      consultationId: string;
    }) => {
      const next = !action.done;
      const { error } = await supabase
        .from('propriete_consultation_actions' as any)
        .update({ done: next, done_at: next ? new Date().toISOString() : null } as any)
        .eq('id', action.id);
      if (error) throw error;
      return consultationId;
    },
    onSuccess: (id) => invalidate(qc, proprieteId, id),
  });
}

export function useAddConsultationMedia(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      consultationId,
      file,
      mediaType,
      caption,
      severity,
    }: {
      consultationId: string;
      file: File;
      mediaType: 'photo' | 'video' | 'audio';
      caption?: string;
      severity?: number;
    }) => {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `${proprieteId}/${consultationId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(CLINIQUE_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage
        .from(CLINIQUE_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('propriete_consultation_medias' as any).insert({
        consultation_id: consultationId,
        media_type: mediaType,
        url: signed?.signedUrl ?? '',
        storage_path: path,
        caption: caption ?? null,
        severity_at_capture: severity ?? null,
        taken_at: new Date().toISOString(),
        uploaded_by: auth.user?.id ?? null,
      } as any);
      if (error) throw error;
      return consultationId;
    },
    onSuccess: (id) => invalidate(qc, proprieteId, id),
    onError: (e: any) => toast.error(e.message || 'Média non enregistré'),
  });
}

export function useAddSensorReading(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { metric: string; value: number; unit: string; sensor_label?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('propriete_sensor_readings' as any).insert({
        propriete_id: proprieteId,
        metric: payload.metric,
        value: payload.value,
        unit: payload.unit,
        sensor_label: payload.sensor_label ?? 'Relevé manuel',
        source: 'manuelle',
        created_by: auth.user?.id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinique-sensor-readings', proprieteId] });
      toast.success('Relevé enregistré');
    },
    onError: (e: any) => toast.error(e.message || 'Relevé non enregistré'),
  });
}

/** Appelle le médecin du jardin (vision + sol + météo + base de connaissance). */
export function useDiagnoseDisease() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('diagnose-garden-disease', {
        body: payload,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as {
        verdict: string;
        hypotheses: Array<Partial<Hypothesis>>;
        actions: Array<Partial<CareAction> & { window_label?: string }>;
      };
    },
    onError: (e: any) => toast.error(e.message || 'Diagnostic indisponible'),
  });
}

/* ───────────────── Lecture cartographique (Atelier du jardin) ───────────────── */

export interface CliniqueMapRow {
  consultationId: string;
  /** Hypothèse retenue, sinon la mieux classée. */
  pathogen: string | null;
  kind: string | null;
  actionsTotal: number;
  actionsDone: number;
  /** Prochain geste à faire, du plus doux au plus intense. */
  nextAction: { id: string; label: string; volet: ActionVolet; window: string | null } | null;
  lastPhotoUrl: string | null;
  lastPhotoAt: string | null;
}

/**
 * Agrégat spatial : ce qu'il faut savoir d'un foyer sans ouvrir sa fiche —
 * le mal nommé, les gestes restants, la dernière preuve photo.
 */
export function useCliniqueMapData(proprieteId?: string, consultations: Consultation[] = []) {
  const ids = consultations.map((c) => c.id);
  const key = ids.slice().sort().join(',');
  const retained = consultations
    .map((c) => c.retained_hypothesis_id)
    .filter(Boolean)
    .join(',');

  return useQuery({
    queryKey: ['clinique-map', proprieteId, key, retained],
    enabled: !!proprieteId && ids.length > 0,
    queryFn: async (): Promise<Record<string, CliniqueMapRow>> => {
      const [h, a, m] = await Promise.all([
        supabase
          .from('propriete_consultation_hypotheses' as any)
          .select('id, consultation_id, common_name, kind, rank')
          .in('consultation_id', ids)
          .order('rank', { ascending: true }),
        supabase
          .from('propriete_consultation_actions' as any)
          .select('id, consultation_id, label, volet, done, intensity, window_start, window_end, frequency')
          .in('consultation_id', ids)
          .order('intensity', { ascending: true }),
        supabase
          .from('propriete_consultation_medias' as any)
          .select('consultation_id, url, media_type, taken_at, created_at')
          .in('consultation_id', ids)
          .order('created_at', { ascending: true }),
      ]);
      if (h.error) throw h.error;
      if (a.error) throw a.error;
      if (m.error) throw m.error;

      const out: Record<string, CliniqueMapRow> = {};
      consultations.forEach((c) => {
        out[c.id] = {
          consultationId: c.id,
          pathogen: null,
          kind: null,
          actionsTotal: 0,
          actionsDone: 0,
          nextAction: null,
          lastPhotoUrl: null,
          lastPhotoAt: null,
        };
      });

      ((h.data as any[]) || []).forEach((row) => {
        const r = out[row.consultation_id];
        if (!r) return;
        const c = consultations.find((x) => x.id === row.consultation_id);
        const isRetained = c?.retained_hypothesis_id === row.id;
        if (isRetained || !r.pathogen) {
          if (isRetained || !c?.retained_hypothesis_id) {
            r.pathogen = row.common_name ?? null;
            r.kind = row.kind ?? null;
          }
        }
      });

      ((a.data as any[]) || []).forEach((row) => {
        const r = out[row.consultation_id];
        if (!r) return;
        r.actionsTotal += 1;
        if (row.done) r.actionsDone += 1;
        else if (!r.nextAction) {
          r.nextAction = {
            id: row.id,
            label: row.label,
            volet: row.volet,
            window: row.frequency || row.window_start || null,
          };
        }
      });

      ((m.data as any[]) || []).forEach((row) => {
        const r = out[row.consultation_id];
        if (!r || row.media_type !== 'photo') return;
        r.lastPhotoUrl = row.url;
        r.lastPhotoAt = row.taken_at || row.created_at || null;
      });

      return out;
    },
  });
}

/**
 * Écriture chirurgicale de la position d'une consultation : seules `lat`/`lng`
 * partent en base, le reste du dossier clinique n'est jamais réécrit.
 */
export function useMoveConsultation(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; lat: number | null; lng: number | null }) => {
      const { error } = await supabase
        .from('propriete_consultations' as any)
        .update({ lat: input.lat, lng: input.lng } as any)
        .eq('id', input.id);
      if (error) throw error;
      return input;
    },
    onMutate: async (input) => {
      const key = ['clinique-consultations', proprieteId];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Consultation[]>(key);
      if (prev) {
        qc.setQueryData<Consultation[]>(
          key,
          prev.map((c) => (c.id === input.id ? { ...c, lat: input.lat, lng: input.lng } : c)),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['clinique-consultations', proprieteId], ctx.prev);
      toast.error('Position non enregistrée');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['clinique-consultations', proprieteId] });
    },
  });
}

/** Marque un geste comme réalisé depuis la carte, sans ouvrir la fiche. */
export function useMarkActionDone(proprieteId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { actionId: string; consultationId: string }) => {
      const { error } = await supabase
        .from('propriete_consultation_actions' as any)
        .update({ done: true, done_at: new Date().toISOString() } as any)
        .eq('id', input.actionId);
      if (error) throw error;
      return input.consultationId;
    },
    onSuccess: (id) => {
      invalidate(qc, proprieteId, id);
      toast.success('Geste noté comme réalisé');
    },
    onError: (e: any) => toast.error(e.message || 'Geste non enregistré'),
  });
}
