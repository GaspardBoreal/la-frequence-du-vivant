// Central registry for marche page models
// Keep models small and declarative so we can add new ones easily

export type MarcheModel = {
  id: string;            // unique id stored in DB (exploration_narrative_settings.marche_view_model)
  name: string;          // display name in UI
  description: string;   // short description
  examplePath: string;   // example path pattern to help authors understand the route
  buildPath: (slug: string) => string; // build a route from a marche slug
};

export const marcheModels: MarcheModel[] = [
  {
    id: 'simple',
    name: 'Classique — Poème · Visuel · Audio',
    description: "Modèle léger, sans données open data.",
    examplePath: '/marche/:slug',
    buildPath: (slug: string) => `/marche/${slug}`,
  },
  {
    id: 'elabore',
    name: 'Bioacoustique — Open Data + Création',
    description: 'Modèle complet avec données ouvertes, visuels, audio et poésie.',
    examplePath: '/bioacoustique/:slug',
    buildPath: (slug: string) => `/bioacoustique/${slug}`,
  },
];

export const getMarcheModel = (id?: string): MarcheModel => {
  const fallback = marcheModels.find(m => m.id === 'elabore')!;
  if (!id) return fallback;
  return marcheModels.find(m => m.id === id) || fallback;
};
