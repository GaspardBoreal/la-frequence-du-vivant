import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GardenType {
  id: string;
  slug: string;
  titre: string;
  sous_titre: string | null;
  image_url: string | null;
  personas: string[] | null;
  position: number;
  visible: boolean;
  /** Identifiant stable issu du lot JSON (ex. « jardin_nourricier »). */
  stable_id?: string | null;
  baseline?: string | null;
  locale?: string | null;
  climate_scope?: string | null;
  image_spec?: Record<string, unknown> | null;
  generation_logic?: Record<string, unknown> | null;
}

export interface GardenExample {
  id: string;
  type_id: string;
  titre: string;
  sous_titre: string | null;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  position: number;
  publie: boolean;
  /** Identifiant stable issu du lot JSON (ex. « potager_en_carres »). */
  stable_id?: string | null;
  thumbnail_url?: string | null;
  image_alt?: string | null;
  user_intent?: string | null;
  keywords?: string[] | null;
  ai_profile?: Record<string, unknown> | null;
}

type Loose = {
  from: (table: string) => any;
};

const client = () => supabase as unknown as Loose;

/**
 * Galerie de l'onboarding : types de jardins et exemples.
 * Tant que les tables ne sont pas créées dans la base partagée, `available`
 * reste faux et l'app continue de tourner sur le registre livré en code.
 */
export const useOnboardingGallery = () => {
  const [types, setTypes] = useState<GardenType[]>([]);
  const [examples, setExamples] = useState<GardenExample[]>([]);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const t = await client().from('onboarding_garden_types').select('*').order('position', { ascending: true });
    if (t.error) {
      setAvailable(false);
      setLoading(false);
      return;
    }
    const e = await client().from('onboarding_garden_examples').select('*').order('position', { ascending: true });
    setTypes((t.data ?? []) as GardenType[]);
    setExamples((e.data ?? []) as GardenExample[]);
    setAvailable(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { types, examples, available, loading, reload };
};

export const saveGardenType = async (payload: Partial<GardenType>) => {
  if (payload.id) {
    const { id, ...rest } = payload;
    return client().from('onboarding_garden_types').update(rest).eq('id', id);
  }
  return client().from('onboarding_garden_types').insert(payload);
};

export const deleteGardenType = async (id: string) =>
  client().from('onboarding_garden_types').delete().eq('id', id);

export const saveGardenExample = async (payload: Partial<GardenExample>) => {
  if (payload.id) {
    const { id, ...rest } = payload;
    return client().from('onboarding_garden_examples').update(rest).eq('id', id);
  }
  return client().from('onboarding_garden_examples').insert(payload);
};

export const deleteGardenExample = async (id: string) =>
  client().from('onboarding_garden_examples').delete().eq('id', id);
