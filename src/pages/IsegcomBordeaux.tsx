import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sparkles,
  Brain,
  Network,
  Target,
  ExternalLink,
  Leaf,
  Eye,
  Microscope,
  BookOpenText,
  Mail,
  ChevronDown,
  Award,
  Layers,
  HeartHandshake,
  Bird,
  TreePine,
  Bug,
  Radio,
} from "lucide-react";
import { ISEGCOM_PROJECTS } from "@/data/isegcomProjects";
import { useExplorationSpeciesCount } from "@/hooks/useExplorationSpeciesCount";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

import formation01 from "@/assets/isegcom/Formation_a_l_IA_SCIENCE_PARTICIPATIVE_01.jpeg.asset.json";
import formation02 from "@/assets/isegcom/Formation_a_l_IA_SCIENCE_PARTICIPATIVE_02.jpeg.asset.json";
import eleves01 from "@/assets/isegcom/Eleves_et_professeur_01.jpeg.asset.json";
import eleves02 from "@/assets/isegcom/Eleves_et_professeur_02.jpeg.asset.json";
import patio01 from "@/assets/isegcom/Patio_vegetalise_01.jpeg.asset.json";
import patio02 from "@/assets/isegcom/Patio_vegetalise_02.jpeg.asset.json";
import patio03 from "@/assets/isegcom/Patio_vegetalise_03.jpeg.asset.json";
import patio04 from "@/assets/isegcom/Patio_vegetalise_04.jpeg.asset.json";
import patio05 from "@/assets/isegcom/Patio_vegetalise_05.jpeg.asset.json";
import biodiv01 from "@/assets/isegcom/Mesure_Biodiv_01.jpeg.asset.json";

const HERO_IMAGES = [formation01.url, formation02.url, eleves01.url, eleves02.url];
const BIODIV_IMAGES = [
  { url: patio01.url, label: "Patio végétalisé · vue 1" },
  { url: patio02.url, label: "Patio végétalisé · vue 2" },
  { url: patio03.url, label: "Patio végétalisé · vue 3" },
  { url: patio04.url, label: "Patio végétalisé · vue 4" },
  { url: patio05.url, label: "Patio végétalisé · vue 5" },
  { url: biodiv01.url, label: "Mesure biodiversité sur site" },
];

const screenshotFor = (url: string) =>
  `https://image.thum.io/get/width/900/crop/600/noanimate/${url}`;

const COURSE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Formation IA Générative & Prompt Engineering — ISEGCOM Bordeaux",
  description:
    "Formation IA Générative animée par Laurent Tripied auprès des MBA Communication Globale & Stratégies d'Influence et MBA Communication & Événementiel de l'ISEGCOM Bordeaux, sur le thème à impact Les Marches du Vivant.",
  provider: {
    "@type": "EducationalOrganization",
    name: "ISEGCOM Bordeaux",
  },
  instructor: { "@type": "Person", name: "Laurent Tripied" },
};

export default function IsegcomBordeaux() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Formation IA Générative × Impact — ISEGCOM Bordeaux × Laurent Tripied</title>
        <meta
          name="description"
          content="13 projets livrés par les MBA ISEGCOM Bordeaux lors d'une formation IA Générative & Prompt Engineering animée par Laurent Tripied autour des Marches du Vivant."
        />
        <link rel="canonical" href="/formations/isegcom-bordeaux" />
        <meta property="og:title" content="Formation IA Générative × Impact — ISEGCOM Bordeaux" />
        <meta property="og:description" content="Quand une promo prompt-e le Vivant : 13 projets, 2 MBA, 1 thème à impact." />
        <meta property="og:image" content={HERO_IMAGES[0]} />
        <script type="application/ld+json">{JSON.stringify(COURSE_JSONLD)}</script>
      </Helmet>

      <Hero onScroll={() => document.getElementById("isegcom-tabs")?.scrollIntoView({ behavior: "smooth" })} />

      <section id="isegcom-tabs" className="container mx-auto px-4 py-16">
        <Tabs defaultValue="galerie" className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-center gap-2 bg-secondary/60 p-2 mb-10">
            <TabsTrigger value="galerie" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Galerie des 13 projets
            </TabsTrigger>
            <TabsTrigger value="formation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Formation
            </TabsTrigger>
            <TabsTrigger value="biodiv" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Expérience Mesure Biodiversité
            </TabsTrigger>
            <TabsTrigger value="pourquoi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Pourquoi nous
            </TabsTrigger>
          </TabsList>

          <TabsContent value="galerie">
            <Gallery />
          </TabsContent>

          <TabsContent value="formation">
            <FormationSection onOpen={setLightbox} />
          </TabsContent>

          <TabsContent value="biodiv">
            <BiodivSection onOpen={setLightbox} />
          </TabsContent>

          <TabsContent value="pourquoi">
            <PourquoiNous />
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-5xl bg-background p-2">
          {lightbox && <img src={lightbox} alt="Aperçu" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------- HERO ----------------------------- */
function Hero({ onScroll }: { onScroll: () => void }) {
  return (
    <header className="relative min-h-screen w-full flex items-center justify-center bg-[#fdfbf7] overflow-hidden selection:bg-[#c9a961]/30">
      {/* Halos décoratifs globaux */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#c9a961]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-[#0d6b58]/5 blur-3xl" />

      <div className="relative max-w-7xl w-full px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Colonne texte */}
          <div className="lg:col-span-7 flex flex-col space-y-9 animate-fade-in">
            <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full border border-[#0d6b58]/10 bg-white shadow-sm w-fit">
              <span className="flex h-2 w-2 rounded-full bg-[#c9a961]" />
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#0d6b58]/80">
                ISEGCOM Bordeaux × Les Marches du Vivant
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="font-crimson text-5xl md:text-7xl lg:text-8xl font-bold text-[#0d6b58] leading-[1.05] tracking-tight">
                Quand une promo
                <br />
                <span className="text-[#c9a961] italic font-normal underline decoration-[#c9a961]/30 underline-offset-8">
                  prompt-e
                </span>{" "}
                le Vivant
              </h1>
              <p className="text-lg md:text-xl text-[#0d6b58]/70 font-medium leading-relaxed max-w-2xl">
                MBA Communication Globale &amp; Stratégies d'Influence
                <br className="hidden md:block" />
                · MBA Communication &amp; Événementiel
              </p>
            </div>

            <div className="p-6 rounded-2xl border-l-4 border-[#c9a961] bg-[#0d6b58]/5 max-w-xl">
              <p className="text-[#0d6b58]/85 leading-relaxed">
                Une formation{" "}
                <span className="font-semibold text-[#0d6b58]">
                  IA Générative &amp; Prompt Engineering
                </span>{" "}
                animée par <span className="text-[#0d6b58] font-medium">Laurent Tripied</span> sur un{" "}
                <span className="text-[#0d6b58] font-medium">thème à impact</span> réel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-10 pt-2">
              <button
                onClick={onScroll}
                className="group inline-flex items-center px-9 py-4 bg-[#0d6b58] text-white font-semibold rounded-full transition-all duration-300 hover:bg-[#0a5243] hover:-translate-y-0.5 shadow-xl shadow-[#0d6b58]/20"
              >
                Découvrir les 13 projets
                <ChevronDown className="ml-2 h-5 w-5 transition-transform group-hover:translate-y-0.5" />
              </button>

              <div className="flex space-x-8 border-l border-[#0d6b58]/15 pl-8">
                {[
                  { v: "13", l: "Projets", gold: false },
                  { v: "02", l: "MBA", gold: false },
                  { v: "01", l: "Thème", gold: true },
                ].map((s) => (
                  <div key={s.l} className="flex flex-col">
                    <span
                      className={`font-crimson text-3xl font-bold ${
                        s.gold ? "text-[#c9a961]" : "text-[#0d6b58]"
                      }`}
                    >
                      {s.v}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#0d6b58]/50 font-bold">
                      {s.l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne image */}
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-4 border border-[#c9a961]/25 rounded-[2rem] -rotate-1 transition-transform duration-500 group-hover:rotate-0" />
            <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden shadow-2xl bg-[#0d6b58]/10">
              <img
                src={eleves01.url}
                alt="Formation IA Générative ISEGCOM Bordeaux animée par Laurent Tripied"
                className="absolute inset-0 w-full h-full object-cover animate-[kenburns_22s_ease-in-out_infinite_alternate]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d6b58]/55 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-6 left-6 right-6 p-5 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl">
                <p className="text-white text-sm font-medium leading-relaxed">
                  « L'impact réel naît de la rencontre entre l'IA et l'engagement collectif. »
                </p>
              </div>
            </div>

            <div className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 bg-[#c9a961]/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 bg-[#0d6b58]/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0,0); }
          100% { transform: scale(1.12) translate(-2%, -2%); }
        }
      `}</style>
    </header>
  );
}

/* --------------------------- GALERIE --------------------------- */
function Gallery() {
  return (
    <div>
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-crimson text-4xl md:text-5xl mb-4">13 projets, 1 mission</h2>
        <p className="text-muted-foreground text-lg">
          Chaque équipe a transformé un brief réel en une production publiée, opérationnelle, utile à
          l'écosystème Les Marches du Vivant.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ISEGCOM_PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: (typeof ISEGCOM_PROJECTS)[number] }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = project.title
    .split(" ")
    .slice(0, 3)
    .map((w) => w[0])
    .join("");

  return (
    <Card className="group relative overflow-hidden flex flex-col bg-card border-2 border-transparent hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-[#C9A961]/20">
        {!imgFailed ? (
          <img
            src={screenshotFor(project.url)}
            alt={`Aperçu du projet ${project.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-crimson text-6xl text-primary/40">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <Badge variant="outline" className="self-start text-xs border-primary/30 text-primary">
          MBA {project.mba}
        </Badge>
        <h3 className="font-crimson text-2xl leading-tight">{project.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {project.highlights.map((h) => (
            <span
              key={h}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
            >
              {h}
            </span>
          ))}
        </div>

        <Button
          asChild
          className="mt-auto w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            Ouvrir en grand <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------- FORMATION ------------------------- */
function FormationSection({ onOpen }: { onOpen: (url: string) => void }) {
  const pillars = [
    { icon: Brain, title: "Prompt Engineering", text: "Cadrer, itérer, raffiner — la nouvelle grammaire créative." },
    { icon: Sparkles, title: "IA Générative multimodale", text: "Texte, image, code, voix : composer avec plusieurs modèles." },
    { icon: Network, title: "Pensée systémique", text: "Penser produit, usage, écosystème — pas juste un livrable." },
    { icon: Target, title: "Livrable client réel", text: "Un commanditaire, un cahier des charges, une publication publique." },
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-10 items-start">
      <div className="grid grid-cols-2 gap-3">
        {HERO_IMAGES.map((src, i) => (
          <button
            key={i}
            onClick={() => onOpen(src)}
            className="overflow-hidden rounded-lg aspect-square group"
          >
            <img
              src={src}
              alt={`Formation ISEGCOM ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <div>
        <h2 className="font-crimson text-4xl md:text-5xl mb-4">Une pédagogie qui assume l'IA</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          L'IA générative n'est pas un sujet à côté. Elle devient l'outil principal pour produire
          vite, bien, et juste — à condition d'apprendre à <em>prompt-er</em>.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {pillars.map((p) => (
            <Card key={p.title} className="p-5 border-primary/20 hover:border-primary/50 transition-colors">
              <p.icon className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-semibold mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.text}</p>
            </Card>
          ))}
        </div>
        <blockquote className="mt-8 border-l-4 border-primary/60 pl-5 italic text-muted-foreground">
          « Former une promo à l'IA générative sur un thème à impact, c'est leur donner deux fois
          plus de raisons d'oser. »
          <footer className="not-italic mt-2 text-sm">— Laurent Tripied</footer>
        </blockquote>
      </div>
    </div>
  );
}

/* ------------------------- BIODIV ------------------------- */
function BiodivSection({ onOpen }: { onOpen: (url: string) => void }) {
  const steps = [
    { icon: Eye, title: "Observer", text: "Le patio végétalisé devient laboratoire à ciel ouvert." },
    { icon: Microscope, title: "Identifier", text: "iNaturalist, clés de détermination, science participative." },
    { icon: BookOpenText, title: "Restituer", text: "Données + récit : le vivant raconté autant que mesuré." },
  ];
  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Sortir du prompt</Badge>
        <h2 className="font-crimson text-4xl md:text-5xl mb-4">
          Mesurer le vivant dans le patio ISEGCOM
        </h2>
        <p className="text-muted-foreground text-lg">
          Entre deux sprints d'IA, la promo descend dans le patio végétalisé de l'école pour
          observer, identifier et documenter la biodiversité locale.
        </p>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [&>*]:mb-4">
        {BIODIV_IMAGES.map((img, i) => (
          <button
            key={i}
            onClick={() => onOpen(img.url)}
            className="block w-full overflow-hidden rounded-lg group break-inside-avoid"
          >
            <img
              src={img.url}
              alt={img.label}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s) => (
          <Card key={s.title} className="p-6 text-center border-primary/20">
            <s.icon className="h-9 w-9 text-primary mx-auto mb-3" />
            <h3 className="font-crimson text-2xl mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Link to="/mon-espace">
            <Leaf className="mr-2 h-4 w-4" /> Voir l'expérience biodiversité dans l'app
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------- POURQUOI ------------------------- */
function PourquoiNous() {
  const args = [
    { icon: HeartHandshake, title: "Un cas client réel", text: "Pas d'exercice théorique : un commanditaire engagé, un cahier des charges, des livrables publiés." },
    { icon: Layers, title: "Livrables publiés en ligne", text: "Chaque projet finit sur une URL publique partageable — portfolio immédiat pour les étudiants." },
    { icon: Sparkles, title: "IA + thème à impact", text: "L'IA générative au service d'un sujet qui compte : la biodiversité et le vivant." },
    { icon: Award, title: "Mesure terrain", text: "Une expérience de mesure de biodiversité dans le patio de l'école : du concret, pas que du prompt." },
  ];
  return (
    <div className="space-y-10">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="font-crimson text-4xl md:text-5xl mb-4">
          Pourquoi confier cette formation à votre école
        </h2>
        <p className="text-muted-foreground text-lg">
          Un format reproductible, transposable à d'autres établissements et à d'autres thèmes à impact.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {args.map((a) => (
          <Card key={a.title} className="p-6 border-primary/20 hover:shadow-lg transition-shadow">
            <a.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-crimson text-2xl mb-2">{a.title}</h3>
            <p className="text-muted-foreground">{a.text}</p>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <a href="mailto:laurent.tripied@gmail.com?subject=Organiser%20la%20formation%20IA%20%C3%97%20Impact%20chez%20nous">
            <Mail className="mr-2 h-5 w-5" /> Organiser cette formation chez vous
          </a>
        </Button>
      </div>
    </div>
  );
}
