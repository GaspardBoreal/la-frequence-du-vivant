import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DEMO_CSS } from '@/components/partenaires/chambre-agri/DemoFrame';
import { RegularNightDemo } from '@/components/partenaires/chambre-agri/RegularNightDemo';
import { SoilSpongeDemo } from '@/components/partenaires/chambre-agri/SoilSpongeDemo';
import { PollinatorWindowDemo } from '@/components/partenaires/chambre-agri/PollinatorWindowDemo';
import { PlanActionLfdv } from '@/components/partenaires/chambre-agri/PlanActionLfdv';
import { Printer, Radio, Leaf, Grape, Footprints, Database, Sparkles, CheckCircle2, ChartNoAxesCombined } from 'lucide-react';

type Vertical = { id: string; titre: string; icon: React.ElementType; resume: string; fonctions: string[] };

const VERTICALS: Vertical[] = [
  {
    id: 'marches', titre: 'Marches du Vivant', icon: Footprints,
    resume: 'Inventaires participatifs de terrain, sciences citoyennes et restitution publique.',
    fonctions: [
      'Organisation d’événements (agroécologique, éco-poétique, éco-tourisme) avec inscriptions et validation de présence',
      'Collecte biodiversité automatique (iNaturalist, GBIF, eBird) dans un rayon paramétrable par marche',
      'Observations des marcheurs : photos géolocalisées, sons, textes, rattachement iNaturalist automatique',
      'Classification écologique en 12 fonctions (mellifère, fixateur d’azote, auxiliaire…) assistée par IA et validée',
      'Cartes enrichies, synthèses, empreinte biodiversité par événement, pages publiques /m/:slug',
      'Pack Vivant : export ZIP PDF + Excel + CSV + GeoJSON + KML',
      'Assistant conversationnel qui voit l’écran filtré et les données réelles',
    ],
  },
  {
    id: 'jardin', titre: 'Fréquence Jardin', icon: Leaf,
    resume: 'Jumeau numérique d’une propriété : sol, végétal, chantiers, suivi dans le temps.',
    fonctions: [
      'Onboarding autonome (création / rattachement / invitation par code) et carte collective des jardins',
      'Portrait de la propriété, entretien fondateur, intentions à 6 mois',
      'Registre de sol protégé : pH, texture, tests terrain par emplacement, historique des versions',
      'Atelier du jardin : dessin précis (polygone, rectangle, orthogonal, hexagone), ouvrages, calques, cadastre',
      'Chantiers avant / après : ICG (indice) avant, projeté, constaté ; photos et vidéos par phase ; rapport A4',
      'Herbier du moment (Flore / Faune / Autres), palette végétale, clinique du jardin',
      'Assistant « IA de Jardin » cadré sur la propriété, ses lignes rouges et ses mesures',
    ],
  },
  {
    id: 'vignoble', titre: 'Fréquence Vignoble', icon: Grape,
    resume: 'Déclinaison viticole : biodiversité des parcelles, verdicts agronomiques, marque partenaire.',
    fonctions: [
      'Diagnostic parcellaire (cadastre, météo parcelle, biodiversité locale)',
      'Verdicts vignoble et lecture écologique de l’enherbement et des haies',
      'Kits de marque partenaire (ex. Château Boutinet) et configurateur d’offre',
      'Rapports imprimables et feuilles de route partenaires',
    ],
  },
  {
    id: 'iot', titre: 'Couche IoT (en production)', icon: Radio,
    resume: 'Mesure physique continue : sondes de sol BRAD TECHNOLOGY et stations météo virtuelles WEENAT.',
    fonctions: [
      'BRAD TECHNOLOGY : webhook signé HMAC-SHA256, sondes de sol multi-profondeurs (5/15, 5/30, 30/60 cm)',
      'WEENAT : collecte horaire automatique, Station Météo Virtuelle (T°, humidité, pluie, ETP, point de rosée, rayonnement)',
      'Unités normalisées SI, déduplication, import d’historique, contrôle de fiabilité des lectures',
      'Poste de contrôle : livraisons en direct, frise de vitalité 48 h, carte du parc, test de remontée',
      'Espaces partenaires fabricants (/partenaire-iot/:slug) et rapport de confiance',
      'Assistant télémétrie : santé réseau, séries agrégées, lecture croisée sol × mesures',
    ],
  },
  {
    id: 'data', titre: 'Patrimoine data & ouverture', icon: Database,
    resume: 'Données consolidées, traçables et réutilisables par les partenaires.',
    fonctions: [
      'Snapshots biodiversité historisés avec garde-fou anti-régression',
      'Base de connaissance sourcée (fiches à sources obligatoires)',
      'API / serveur MCP pour brancher des outils tiers et des assistants IA',
      'Exports standards (CSV, GeoJSON, KML, PDF, Excel), sécurité par rôles et RLS',
    ],
  },
];

const OBSERVATOIRE_USAGE = {
  titre: 'Observatoire des pratiques et des usages',
  icon: ChartNoAxesCombined,
  resume: 'Analyse segmentable pour révéler les besoins de publics très précis : territoire, type et surface de propriété, pratiques du sol et de l’eau, choix végétaux, usages IA ...',
};

const OBJECTIFS = [
  { id: 'pollinisateurs', label: 'Favoriser les pollinisateurs / auxiliaires', modules: ['marches', 'jardin', 'data'] },
  { id: 'sol', label: 'Santé des sols et gestion de l’eau', modules: ['iot', 'jardin'] },
  { id: 'climat', label: 'Adaptation climatique / irrigation', modules: ['iot', 'data'] },
  { id: 'invasives', label: 'Suivi des espèces invasives', modules: ['marches', 'data'] },
  { id: 'filiere', label: 'Démonstrateurs viticoles / filière', modules: ['vignoble', 'iot'] },
  { id: 'animation', label: 'Animation territoriale et sensibilisation', modules: ['marches'] },
];

const LIVRABLES = ['Tableau de bord', 'Rapport PDF', 'Données ouvertes', 'Cartographie', 'Formation / animation'];
const TYPES_STRUCTURE = ['Chambre d’agriculture / réseau agricole', 'Coopérative ou négoce', 'Collectivité', 'Exploitation agricole ou viticole', 'Entreprise', 'Particulier'];
const PRODUCTIONS = ['Grandes cultures', 'Polyculture-élevage / prairies', 'Vigne', 'Arboriculture', 'Maraîchage', 'Jardins / espaces verts'];

export default function PartenaireChambreAgriPdl() {
  const [nom, setNom] = useState('');
  const [projet, setProjet] = useState('');
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [livrables, setLivrables] = useState<string[]>([]);
  const [sites, setSites] = useState(5);
  const [difficulte, setDifficulte] = useState('');
  const [typeStructure, setTypeStructure] = useState('');
  const [territoire, setTerritoire] = useState('');
  const [productions, setProductions] = useState<string[]>([]);
  const [demarrage, setDemarrage] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const typeRef = useRef<HTMLSelectElement>(null);
  const territoireRef = useRef<HTMLInputElement>(null);
  const productionsRef = useRef<HTMLDivElement>(null);
  const demarrageRef = useRef<HTMLInputElement>(null);
  const nomRef = useRef<HTMLInputElement>(null);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  /** Un clic sur une hypothèse préremplit le champ correspondant et y place le focus. */
  const appliquerHypothese = (champ: string, valeur: string) => {
    const focus = (el: HTMLElement | null) => { el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus(); };
    if (champ === 'typeStructure') {
      const t = TYPES_STRUCTURE.find((x) => x.toLowerCase() === valeur.toLowerCase()) ?? TYPES_STRUCTURE.find((x) => valeur.toLowerCase().includes(x.split(' ')[0].toLowerCase()));
      if (t) setTypeStructure(t);
      focus(typeRef.current);
    } else if (champ === 'territoire') { if (valeur) setTerritoire(valeur); focus(territoireRef.current); }
    else if (champ === 'productions') {
      const sel = PRODUCTIONS.filter((p) => valeur.toLowerCase().includes(p.toLowerCase().split(' ')[0]));
      if (sel.length) setProductions(sel);
      productionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (champ === 'demarrage') { if (/^\d{4}-\d{2}$/.test(valeur)) setDemarrage(valeur); focus(demarrageRef.current); }
    else if (champ === 'nom') { if (valeur) setNom(valeur); focus(nomRef.current); }
  };

  const reponse = useMemo(() => {
    const score: Record<string, number> = {};
    objectifs.forEach((o) => OBJECTIFS.find((x) => x.id === o)?.modules.forEach((m) => (score[m] = (score[m] ?? 0) + 1)));
    if (livrables.includes('Données ouvertes')) score.data = (score.data ?? 0) + 1;
    if (livrables.includes('Formation / animation')) score.marches = (score.marches ?? 0) + 1;
    const modules = Object.entries(score).sort((a, b) => b[1] - a[1]).map(([id]) => VERTICALS.find((v) => v.id === id)!);
    const semaines = Math.max(4, Math.round(3 + modules.length * 1.5 + Math.log2(Math.max(1, sites)) * 1.5));
    const avecIot = modules.some((m) => m.id === 'iot');
    return { modules, semaines, avecIot };
  }, [objectifs, livrables, sites]);

  React.useEffect(() => { document.title = 'LFDV × Chambre d’agriculture Pays de la Loire'; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">

      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-xs uppercase tracking-widest text-primary">Dossier partenaire · Confidentiel</p>
          <h1 className="font-serif text-3xl md:text-4xl mt-2">La Fréquence du Vivant × Chambre d’agriculture Pays de la Loire</h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">
            Une plateforme en production qui relie l’observation du vivant, la mesure physique des sols et du climat,
            et un patrimoine de données consolidé, au service de projets agricoles et territoriaux.
          </p>
          <Button onClick={() => window.print()} className="mt-6 print:hidden"><Printer className="w-4 h-4 mr-2" />Exporter en PDF</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-14">
        <section>
          <h2 className="font-serif text-2xl mb-4">En synthèse</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VERTICALS.map((v) => (
              <div key={v.id} className="rounded-lg border border-border bg-card p-4 break-inside-avoid">
                <div className="flex items-center gap-2 font-medium"><v.icon className="w-4 h-4 text-primary" />{v.titre}</div>
                <p className="text-sm text-muted-foreground mt-1">{v.resume}</p>
              </div>
            ))}
            <div className="rounded-lg border border-border bg-card p-4 break-inside-avoid">
              <div className="flex items-center gap-2 font-medium">
                <OBSERVATOIRE_USAGE.icon className="w-4 h-4 text-primary" />
                {OBSERVATOIRE_USAGE.titre}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{OBSERVATOIRE_USAGE.resume}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">En détail, par vertical</h2>
          <div className="space-y-6">
            {VERTICALS.map((v) => (
              <div key={v.id} className="break-inside-avoid">
                <h3 className="flex items-center gap-2 text-lg font-medium"><v.icon className="w-5 h-5 text-primary" />{v.titre}</h3>
                <ul className="mt-2 space-y-1.5">
                  {v.fonctions.map((f) => (
                    <li key={f} className="flex gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <style>{DEMO_CSS}</style>
          <h2 className="font-serif text-2xl mb-1">Animation que l’on produire pour vous</h2>
          <p className="text-muted-foreground mb-5">Trois chantiers, trois démonstrations vivantes.</p>
          <div className="space-y-6">
            <RegularNightDemo />
            <SoilSpongeDemo />
            <PollinatorWindowDemo />
          </div>
        </section>


        <section className="break-before-page">
          <h2 className="font-serif text-2xl mb-1">Décrivez votre projet</h2>
          <p className="text-sm text-muted-foreground mb-5 print:hidden">Quelques questions, puis l’IA LFDV rédige un plan d’action daté et dimensionné.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 print:hidden">
              <input ref={nomRef} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Structure / entreprise" value={nom} onChange={(e) => setNom(e.target.value)} />
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Votre projet en deux phrases" value={projet} onChange={(e) => setProjet(e.target.value)} />
              <div>
                <p className="text-sm font-medium mb-2">Objectifs</p>
                <div className="flex flex-wrap gap-2">
                  {OBJECTIFS.map((o) => (
                    <button key={o.id} type="button" onClick={() => toggle(objectifs, setObjectifs, o.id)} aria-pressed={objectifs.includes(o.id)}
                      className={`text-xs rounded-full border px-3 py-1.5 ${objectifs.includes(o.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Livrables attendus</p>
                <div className="flex flex-wrap gap-2">
                  {LIVRABLES.map((l) => (
                    <button key={l} type="button" onClick={() => toggle(livrables, setLivrables, l)} aria-pressed={livrables.includes(l)}
                      className={`text-xs rounded-full border px-3 py-1.5 ${livrables.includes(l) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <label className="block text-sm font-medium">Nombre de sites / exploitations : {sites}
                <input type="range" min={1} max={100} value={sites} onChange={(e) => setSites(+e.target.value)} className="w-full mt-2" />
              </label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} placeholder="Principale difficulté à relever" value={difficulte} onChange={(e) => setDifficulte(e.target.value)} />
              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs text-muted-foreground">Facultatif : précisez pour un plan plus juste.</p>
                <select ref={typeRef} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={typeStructure} onChange={(e) => setTypeStructure(e.target.value)} aria-label="Type de structure">
                  <option value="">Type de structure</option>
                  {TYPES_STRUCTURE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input ref={territoireRef} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Territoire (ex. Vendée, Marais breton)" value={territoire} onChange={(e) => setTerritoire(e.target.value)} />
                <div ref={productionsRef}>
                  <p className="text-sm font-medium mb-2">Productions dominantes</p>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCTIONS.map((p) => (
                      <button key={p} type="button" onClick={() => toggle(productions, setProductions, p)} aria-pressed={productions.includes(p)}
                        className={`text-xs rounded-full border px-3 py-1.5 ${productions.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm font-medium">Démarrage souhaité
                  <input ref={demarrageRef} type="month" className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" value={demarrage} onChange={(e) => setDemarrage(e.target.value)} />
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-primary/40 bg-card p-5 md:col-span-2 print:col-span-2">
              <div className="flex items-center gap-2 font-medium mb-4"><Sparkles className="w-4 h-4 text-primary" />Plan d’action LFDV{nom && ` pour ${nom}`}</div>
              <PlanActionLfdv
                input={{ nom, projet, objectifs: objectifs.map((o) => OBJECTIFS.find((x) => x.id === o)?.label ?? o), livrables, sites, difficulte, typeStructure, territoire, productions, demarrage }}
                onHypothese={appliquerHypothese}
                fallback={
                <div className="space-y-4 text-sm">
                  {projet && <p className="italic text-muted-foreground">« {projet} »</p>}
                  {reponse.modules.length > 0 && <div>
                    <p className="font-medium">Modules mobilisés</p>
                    <ul className="mt-1 space-y-2">
                      {reponse.modules.map((m) => (
                        <li key={m.id}><span className="font-medium">{m.titre}</span> — {m.fonctions[0]}.</li>
                      ))}
                    </ul>
                  </div>}
                  <p><span className="font-medium">Déploiement indicatif :</span> {reponse.semaines} semaines pour {sites} site{sites > 1 ? 's' : ''}, sur une plateforme déjà en production (pas de développement à partir de zéro).</p>
                  {reponse.avecIot && <p><span className="font-medium">Mesure continue :</span> sondes BRAD et stations WEENAT raccordables dès le premier site, données remontées automatiquement.</p>}
                  {livrables.length > 0 && <p><span className="font-medium">Livrables :</span> {livrables.join(', ')} — générés depuis les données réelles.</p>}
                  {difficulte && <p><span className="font-medium">Votre difficulté :</span> « {difficulte} » — la traçabilité des données et l’assistant contextualisé permettent d’objectiver et de suivre ce point dans le temps.</p>}
                  <Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Exporter cette réponse</Button>
                </div>
                }
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">La Fréquence du Vivant · la-frequence-du-vivant.com</footer>
    </div>
  );
}
