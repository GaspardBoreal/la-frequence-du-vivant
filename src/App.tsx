
import { lazyWithRetry } from './lib/lazyWithRetry';
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { AudioProvider } from './contexts/AudioContext';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import RouteFallback from './components/RouteFallback';

/* --- Chargées immédiatement : accueil + garde admin (léger) --- */
import AdminAuth from './components/AdminAuth';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

/* Portes d'entrée publiques — chunk dédié, chargé dès la navigation */
const MarchesDuVivant = lazyWithRetry(() => import('./pages/MarchesDuVivant'));
const CarteMarchesDuVivant = lazyWithRetry(() => import('./pages/CarteMarchesDuVivant'));
const PublicEventPage = lazyWithRetry(() => import('./pages/PublicEventPage'));
const MarchesDuVivantConnexion = lazyWithRetry(() => import('./pages/MarchesDuVivantConnexion'));
/* Layouts des routes imbriquées */
const ExplorationLayout = lazyWithRetry(() => import('./layouts/ExplorationLayout'));
const CrmShell = lazyWithRetry(() => import('./layouts/CrmShell'));

/* --- Chargées à la demande --- */
const AdminLogin = lazyWithRetry(() => import('./pages/AdminLogin'));
const OAuthConsent = lazyWithRetry(() => import('./pages/OAuthConsent'));
const AdminResetPassword = lazyWithRetry(() => import('./pages/AdminResetPassword'));
const MarcheDetail = lazyWithRetry(() => import('./pages/MarcheDetail'));
const MarcheDetailBio = lazyWithRetry(() => import('./pages/MarcheDetailBio'));
const MarchesTechnoSensibles = lazyWithRetry(() => import('./pages/MarchesTechnoSensibles'));
const BioacoustiquePoetique = lazyWithRetry(() => import('./pages/BioacoustiquePoetique'));
const MigrationAdmin = lazyWithRetry(() => import('./pages/MigrationAdmin'));
const MigrationExecution = lazyWithRetry(() => import('./pages/MigrationExecution'));
const MarcheAdmin = lazyWithRetry(() => import('./pages/MarcheAdmin'));
const AdminAccess = lazyWithRetry(() => import('./pages/AdminAccess'));
const ExplorationsList = lazyWithRetry(() => import('./pages/ExplorationsList'));
const ExplorationDetail = lazyWithRetry(() => import('./pages/ExplorationDetail'));
const NarrativeLandscape = lazyWithRetry(() => import('./pages/NarrativeLandscape'));
const ExplorationsAdmin = lazyWithRetry(() => import('./pages/ExplorationsAdmin'));
const ExplorationFormPage = lazyWithRetry(() => import('./pages/ExplorationFormPage'));
const ExplorationMarchesAdmin = lazyWithRetry(() => import('./pages/ExplorationMarchesAdmin'));
const TestEbird = lazyWithRetry(() => import('./pages/TestEbird'));
const FaviconTest = lazyWithRetry(() => import('./pages/FaviconTest'));
const DataInsights = lazyWithRetry(() => import('./pages/DataInsights'));
const ExplorationAnimatorRefactored = lazyWithRetry(() => import('./pages/ExplorationAnimatorRefactored'));
const ExplorationExperience = lazyWithRetry(() => import('./pages/ExplorationExperience'));
const ExplorationPodcast = lazyWithRetry(() => import('./pages/ExplorationPodcast'));
const WeatherCalendar = lazyWithRetry(() => import('./pages/WeatherCalendar'));
const ProjectPresentation = lazyWithRetry(() => import('./pages/ProjectPresentation'));
const GalerieFleuvePage = lazyWithRetry(() => import('./pages/GalerieFleuvePage'));
const GalerieFluveExploration = lazyWithRetry(() => import('./pages/GalerieFluveExploration'));
const GalerieFluveExplorationLecteurs = lazyWithRetry(() => import('./pages/GalerieFluveExplorationLecteurs'));
const ExplorationHistorique = lazyWithRetry(() => import('./pages/ExplorationHistorique'));
const ExplorationEssais = lazyWithRetry(() => import('./pages/ExplorationEssais'));
const ExperienceAudioContinue = lazyWithRetry(() => import('./components/experience/ExperienceAudioContinue'));
const ExperienceLectureOptimisee = lazyWithRetry(() => import('./components/reading/ExperienceLectureOptimisee'));
const OpusAdmin = lazyWithRetry(() => import('./pages/OpusAdmin'));
const ExplorationPrefigurer = lazyWithRetry(() => import('./pages/ExplorationPrefigurer'));
const ExplorationImports = lazyWithRetry(() => import('./pages/ExplorationImports'));
const AtlasClimatique = lazyWithRetry(() => import('./pages/AtlasClimatique'));
const ExportationsAdmin = lazyWithRetry(() => import('./pages/ExportationsAdmin'));
const AutomationsAdmin = lazyWithRetry(() => import('./pages/AutomationsAdmin'));
const ExplorationBiodiversite = lazyWithRetry(() => import('./pages/ExplorationBiodiversite'));
const TraverseesLecteurs = lazyWithRetry(() => import('./pages/TraverseesLecteurs'));
const IsegcomBordeaux = lazyWithRetry(() => import('./pages/IsegcomBordeaux'));
const ExplorationsSensibles = lazyWithRetry(() => import('./pages/ExplorationsSensibles'));
const MaterielPedagogique = lazyWithRetry(() => import('./pages/MaterielPedagogique'));
const Dordonia = lazyWithRetry(() => import('./pages/Dordonia'));
const PublicEpubDownload = lazyWithRetry(() => import('./pages/PublicEpubDownload'));
const PublicLivreVivant = lazyWithRetry(() => import('./pages/PublicLivreVivant'));
const OffreVdtMdv = lazyWithRetry(() => import('./pages/OffreVdtMdv'));
const MarchesDuVivantEntreprises = lazyWithRetry(() => import('./pages/MarchesDuVivantEntreprises'));
const MarchesDuVivantAgriculture = lazyWithRetry(() => import('./pages/MarchesDuVivantAgriculture'));
const MarchesDuVivantPartenaires = lazyWithRetry(() => import('./pages/MarchesDuVivantPartenaires'));
const MarchesDuVivantAssociation = lazyWithRetry(() => import('./pages/MarchesDuVivantAssociation'));
const MarchesDuVivantExplorer = lazyWithRetry(() => import('./pages/MarchesDuVivantExplorer'));
const CarnetsDeTerrainGalerie = lazyWithRetry(() => import('./pages/CarnetsDeTerrainGalerie'));
const CarnetDeTerrain = lazyWithRetry(() => import('./pages/CarnetDeTerrain'));
const CrmPipeline = lazyWithRetry(() => import('./pages/CrmPipeline'));
const CrmAnnuaire = lazyWithRetry(() => import('./pages/CrmAnnuaire'));
const CrmCampagnes = lazyWithRetry(() => import('./pages/CrmCampagnes'));
const CrmCampagneDetail = lazyWithRetry(() => import('./pages/CrmCampagneDetail'));
const TeamManagement = lazyWithRetry(() => import('./pages/TeamManagement'));
const CrmHome = lazyWithRetry(() => import('./pages/CrmHome'));
const CrmMarches = lazyWithRetry(() => import('./pages/CrmMarches'));
const CrmIa = lazyWithRetry(() => import('./pages/CrmIa'));
const CrmMissions = lazyWithRetry(() => import('./pages/CrmMissions'));
const MarchesDuVivantMonEspace = lazyWithRetry(() => import('./pages/MarchesDuVivantMonEspace'));
const MarchesDuVivantValiderPresence = lazyWithRetry(() => import('./pages/MarchesDuVivantValiderPresence'));
const MarcheEventsAdmin = lazyWithRetry(() => import('./pages/MarcheEventsAdmin'));
const MarcheEventDetail = lazyWithRetry(() => import('./pages/MarcheEventDetail'));
const CommunityProfilesAdmin = lazyWithRetry(() => import('./pages/CommunityProfilesAdmin'));
const OrganisateursAdmin = lazyWithRetry(() => import('./pages/OrganisateursAdmin'));
const AdminProprietes = lazyWithRetry(() => import('./pages/AdminProprietes'));
const AdminIot = lazyWithRetry(() => import('./pages/AdminIot'));
const AdminRoadmap = lazyWithRetry(() => import('./pages/AdminRoadmap'));
const RoadmapPublic = lazyWithRetry(() => import('./pages/RoadmapPublic'));
const RoadmapWeekPage = lazyWithRetry(() => import('./pages/RoadmapWeekPage'));
const FrequenceJardinFiche = lazyWithRetry(() => import('./pages/FrequenceJardinFiche'));
const FrequenceJardinLogo = lazyWithRetry(() => import('./pages/FrequenceJardinLogo'));
const EtudeDeSolPublique = lazyWithRetry(() => import('./pages/EtudeDeSolPublique'));
const ProprieteEspace = lazyWithRetry(() => import('./pages/ProprieteEspace'));
const JardinDemarrer = lazyWithRetry(() => import('./pages/JardinDemarrer'));
const MarchesDuVivantExplorationMarcheur = lazyWithRetry(() => import('./pages/MarchesDuVivantExplorationMarcheur'));
const AdminOutilsHub = lazyWithRetry(() => import('./pages/AdminOutilsHub'));
const AdminGpsControl = lazyWithRetry(() => import('./pages/AdminGpsControl'));
const AdminSoilRegistryAudit = lazyWithRetry(() => import('./pages/AdminSoilRegistryAudit'));

const AdminFrequences = lazyWithRetry(() => import('./pages/AdminFrequences'));
const CommunityAffiliateLanding = lazyWithRetry(() => import('./pages/CommunityAffiliateLanding'));
const PartagePublic = lazyWithRetry(() => import('./pages/PartagePublic'));
const CarnetMarcheur = lazyWithRetry(() => import('./pages/CarnetMarcheur'));
const Adhesion = lazyWithRetry(() => import('./pages/Adhesion'));
const AdhesionAdmin = lazyWithRetry(() => import('./pages/AdhesionAdmin'));
const ApiMcpPublic = lazyWithRetry(() => import('./pages/ApiMcpPublic'));
const AdminApiMcp = lazyWithRetry(() => import('./pages/AdminApiMcp'));
const AdminTaxonomyCuration = lazyWithRetry(() => import('./pages/AdminTaxonomyCuration'));
const AdminAuditFrugalHub = lazyWithRetry(() => import('./pages/AdminAuditFrugalHub'));
const PublicAuditFrugal = lazyWithRetry(() => import('./pages/PublicAuditFrugal'));
const PartenaireAudit = lazyWithRetry(() => import('./pages/PartenaireAudit'));
const PartenaireOffre = lazyWithRetry(() => import('./pages/PartenaireOffre'));
const PartenaireFeuilleDeRoute = lazyWithRetry(() => import('./pages/PartenaireFeuilleDeRoute'));
const TrustInFrequenceVivant = lazyWithRetry(() => import('./pages/TrustInFrequenceVivant'));
const PartenaireIot = lazyWithRetry(() => import('./pages/PartenaireIot'));
const TrustTableRonde = lazyWithRetry(() => import('./pages/TrustTableRonde'));

const AgentIA = lazyWithRetry(() => import('./pages/AgentIA'));
const AgentIAFiche = lazyWithRetry(() => import('./pages/AgentIAFiche'));
const InterregSudoeMdv = lazyWithRetry(() => import('./pages/InterregSudoeMdv'));
const ApprendreMarchePage = lazyWithRetry(() => import('./pages/ApprendreMarchePage'));
const ImmersiveGardenFiche = lazyWithRetry(() => import('./pages/ImmersiveGardenFiche'));

/* Montages globaux : chargés à la demande, sans écran d'attente */
const AdminChatBotMount = lazyWithRetry(() =>
  import('./components/chatbot/AdminChatBotMount').then((m) => ({ default: m.AdminChatBotMount })),
);
const CommunityChatBotMount = lazyWithRetry(() =>
  import('./components/chatbot/CommunityChatBotMount').then((m) => ({ default: m.CommunityChatBotMount })),
);
const AdhesionFab = lazyWithRetry(() => import('./components/adhesion/AdhesionFab'));

import { TrophicFullscreenProvider } from './components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenProvider';
import { DiscoverFullscreenProvider } from './components/biodiversity/discover/DiscoverFullscreenProvider';




function GlobalMounts() {
  const location = useLocation();
  const isOAuthRoute = location.pathname === '/.lovable/oauth/consent' || location.pathname === '/oauth/consent';

  if (isOAuthRoute) return null;

  return (
    <Suspense fallback={null}>
      <AdminChatBotMount />
      <CommunityChatBotMount />
      <AdhesionFab />
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
        <LanguageProvider>
          <AudioProvider>
            <BrowserRouter>
            <TrophicFullscreenProvider>
            <DiscoverFullscreenProvider>
          <Suspense fallback={<RouteFallback />}>
          <Routes>

            <Route path="/" element={<Index />} />
            <Route path="/agent-ia" element={<AgentIA />} />
            <Route path="/agent-ia/fiche" element={<AgentIAFiche />} />
            <Route path="/interreg-sudoe-mdv" element={<InterregSudoeMdv />} />
            <Route path="/offre-VDT-MDV" element={<OffreVdtMdv />} />
            <Route path="/offre-vdt-mdv" element={<OffreVdtMdv />} />

            <Route path="/marches-techno-sensibles" element={<MarchesTechnoSensibles />} />
            <Route path="/marche/:slug" element={<MarcheDetail />} />
            <Route path="/m/:slug" element={<PublicEventPage />} />
            <Route path="/jardin/:slug" element={<ImmersiveGardenFiche />} />
            <Route path="/apprendre/:slug" element={<ApprendreMarchePage />} />
            
            {/* Nouvelles routes bioacoustiques */}
            <Route path="/bioacoustique-poetique" element={<BioacoustiquePoetique />} />
            <Route path="/bioacoustique/:slug" element={<MarcheDetailBio />} />
            <Route path="/explorations-sensibles" element={<ExplorationsSensibles />} />
            <Route path="/materiel-pedagogique" element={<MaterielPedagogique />} />
            <Route path="/dordonia" element={<Dordonia />} />
            
            {/* Routes Les Marches du Vivant */}
            <Route path="/marches-du-vivant" element={<MarchesDuVivant />} />
            <Route path="/marches-du-vivant/entreprises" element={<MarchesDuVivantEntreprises />} />
            <Route path="/marches-du-vivant/agriculture" element={<MarchesDuVivantAgriculture />} />
            <Route path="/marches-du-vivant/partenaires" element={<MarchesDuVivantPartenaires />} />
            <Route path="/marches-du-vivant/association" element={<MarchesDuVivantAssociation />} />
            <Route path="/marches-du-vivant/explorer" element={<MarchesDuVivantExplorer />} />
            <Route path="/marches-du-vivant/carte-marches-du-vivant" element={<CarteMarchesDuVivant />} />
            <Route path="/marches-du-vivant/carnets-de-terrain" element={<CarnetsDeTerrainGalerie />} />
            <Route path="/marches-du-vivant/carnets-de-terrain/:slug" element={<CarnetDeTerrain />} />
            <Route path="/marches-du-vivant/connexion" element={<MarchesDuVivantConnexion />} />
            <Route path="/marches-du-vivant/rejoindre/:token" element={<CommunityAffiliateLanding />} />
            <Route path="/marches-du-vivant/mon-espace" element={<MarchesDuVivantMonEspace />} />
            <Route path="/marches-du-vivant/mon-espace/exploration/:explorationId" element={<MarchesDuVivantExplorationMarcheur />} />
            <Route path="/marches-du-vivant/valider-presence/:qrCode" element={<MarchesDuVivantValiderPresence />} />

            {/* Routes explorations */}
            <Route path="/explorations" element={<ExplorationsList />} />
            <Route path="/galerie-fleuve" element={<GalerieFleuvePage />} />
            
            {/* Routes avec ExplorationLayout (Murmuria intégré pour l'exploration Dordogne) */}
            <Route path="/galerie-fleuve/exploration/:slug" element={<ExplorationLayout />}>
              <Route index element={<GalerieFluveExploration />} />
              <Route path="ecouter" element={<ExperienceAudioContinue />} />
              <Route path="lire" element={<ExperienceLectureOptimisee />} />
              <Route path="lire/:textId" element={<ExperienceLectureOptimisee />} />
              <Route path="prefigurer" element={<ExplorationPrefigurer />} />
              <Route path="historique" element={<ExplorationHistorique />} />
              <Route path="essais" element={<ExplorationEssais />} />
              <Route path="biodiversite" element={<ExplorationBiodiversite />} />
            </Route>
            
            {/* Route lecteurs avec ExplorationLayout */}
            <Route path="/lecteurs/exploration/:slug" element={<ExplorationLayout />}>
              <Route index element={<GalerieFluveExplorationLecteurs />} />
              <Route path="traversees" element={<TraverseesLecteurs />} />
            </Route>
            
            <Route path="/explorations/:slug" element={<ExplorationDetail />} />
            <Route path="/explorations/:slug/animer" element={<ExplorationDetail />} />
            <Route path="/explorations/:slug/experience/audio" element={<ExperienceAudioContinue />} />
            <Route path="/explorations/:slug/experience/lire" element={<ExperienceLectureOptimisee />} />
            <Route path="/explorations/:slug/lire" element={<ExperienceLectureOptimisee />} />
            <Route path="/explorations/:slug/lire/:textId" element={<ExperienceLectureOptimisee />} />
            <Route path="/explorations/:slug/experience/:sessionId" element={<ExplorationExperience />} />
            <Route path="/explorations/:slug/experience/:sessionId/podcast" element={<ExplorationPodcast />} />
            <Route path="/explorations/:slug/:narrativeSlug" element={<NarrativeLandscape />} />

            {/* Routes d'administration */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            
            {/* Routes d'administration protégées */}
            <Route path="/admin/migration" element={
              <AdminAuth>
                <MigrationAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/migration/execute" element={
              <AdminAuth>
                <MigrationExecution />
              </AdminAuth>
            } />
            <Route path="/admin/marches" element={
              <AdminAuth>
                <MarcheAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/explorations" element={
              <AdminAuth>
                <ExplorationsAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/explorations/new" element={
              <AdminAuth>
                <ExplorationFormPage />
              </AdminAuth>
            } />
            <Route path="/admin/explorations/:id/edit" element={
              <AdminAuth>
                <ExplorationFormPage />
              </AdminAuth>
            } />
            <Route path="/admin/explorations/:id/marches" element={
              <AdminAuth>
                <ExplorationMarchesAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/explorations/:slug/animer" element={
              <AdminAuth>
                <ExplorationAnimatorRefactored />
              </AdminAuth>
            } />
            <Route path="/admin/explorations/:slug/imports" element={
              <AdminAuth>
                <ExplorationImports />
              </AdminAuth>
            } />
            <Route path="/admin/exportations" element={
              <AdminAuth>
                <ExportationsAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/automations" element={
              <AdminAuth>
                <AutomationsAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/opus/:slug" element={
              <AdminAuth>
                <OpusAdmin />
              </AdminAuth>
            } />
            {/* CRM Routes — unified shell with sidebar */}
            <Route path="/admin/crm" element={<AdminAuth><CrmShell /></AdminAuth>}>
              <Route index element={<CrmHome />} />
              <Route path="annuaire" element={<CrmAnnuaire />} />
              <Route path="campagnes" element={<CrmCampagnes />} />
              <Route path="campagnes/:id" element={<CrmCampagneDetail />} />
              <Route path="pipeline" element={<CrmPipeline />} />
              <Route path="missions" element={<CrmMissions />} />
              <Route path="marches" element={<CrmMarches />} />
              <Route path="equipe" element={<TeamManagement />} />
              <Route path="ia" element={<CrmIa />} />
            </Route>
            <Route path="/admin/marche-events" element={
              <AdminAuth>
                <MarcheEventsAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/marche-events/:id" element={
              <AdminAuth>
                <MarcheEventDetail />
              </AdminAuth>
            } />
            <Route path="/admin/community" element={
              <AdminAuth>
                <CommunityProfilesAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/organisateurs" element={
              <AdminAuth>
                <OrganisateursAdmin />
              </AdminAuth>
            } />
            <Route path="/admin/proprietes" element={
              <AdminAuth>
                <AdminProprietes />
              </AdminAuth>
            } />
            <Route path="/admin/iot" element={
              <AdminAuth>
                <AdminIot />
              </AdminAuth>
            } />
            <Route path="/admin/roadmap" element={
              <AdminAuth>
                <AdminRoadmap />
              </AdminAuth>
            } />
            <Route path="/roadmap" element={<RoadmapPublic />} />
            <Route path="/roadmap/semaine/:year/:week" element={<RoadmapWeekPage />} />
            <Route path="/roadmap/frequence-jardin" element={<FrequenceJardinFiche />} />
            <Route path="/roadmap/frequence-jardin/logo/:slug" element={<FrequenceJardinLogo />} />
            <Route path="/etude-de-sol" element={<EtudeDeSolPublique />} />
            <Route path="/roadmap/:audience" element={<RoadmapPublic />} />

            <Route path="/propriete/:slug" element={<ProprieteEspace />} />

            <Route path="/admin/outils" element={
              <AdminAuth>
                <AdminOutilsHub />
              </AdminAuth>
            } />
            <Route path="/admin/outils/frequences" element={
              <AdminAuth>
                <AdminFrequences />
              </AdminAuth>
            } />
            <Route path="/admin/outils/api-mcp" element={
              <AdminAuth>
                <AdminApiMcp />
              </AdminAuth>
            } />
            <Route path="/admin/outils/audit-frugal" element={
              <AdminAuth>
                <AdminAuditFrugalHub />
              </AdminAuth>
            } />
            <Route path="/admin/outils/taxonomie" element={
              <AdminAuth>
                <AdminTaxonomyCuration />
              </AdminAuth>
            } />
            <Route path="/admin/outils/gps" element={
              <AdminAuth>
                <AdminGpsControl />
              </AdminAuth>
            } />
            <Route path="/admin/outils/registre-sol" element={
              <AdminAuth>
                <AdminSoilRegistryAudit />
              </AdminAuth>
            } />


            <Route path="/audit-frugal/:slug" element={<PublicAuditFrugal />} />
            <Route path="/trust-in-frequence-vivant" element={<TrustInFrequenceVivant />} />
            <Route path="/partenaire-iot/:slug" element={<PartenaireIot />} />
            <Route path="/trust-in-frequence-vivant/table-ronde" element={<TrustTableRonde />} />
            <Route path="/partenaires/:slug/offre" element={<PartenaireOffre />} />
            <Route path="/partenaires/:slug/:date" element={<PartenaireFeuilleDeRoute />} />
            <Route path="/partenaires/:slug" element={<PartenaireAudit />} />


            <Route path="/api-mcp" element={<ApiMcpPublic />} />
            <Route path="/admin" element={
              <AdminAuth>
                <AdminAccess />
              </AdminAuth>
            } />
            <Route path="/admin/data-insights" element={
              <AdminAuth>
                <DataInsights />
              </AdminAuth>
            } />
            <Route path="/access-admin-gb2025" element={
              <AdminAuth>
                <AdminAccess />
              </AdminAuth>
            } />
            <Route path="/test-ebird" element={
              <AdminAuth>
                <TestEbird />
              </AdminAuth>
            } />
            <Route path="/favicon-test" element={<FaviconTest />} />
            <Route path="/epub/:slug/lire" element={<PublicLivreVivant />} />
            <Route path="/epub/:slug" element={<PublicEpubDownload />} />
            <Route path="/meteo-historique" element={<WeatherCalendar />} />
            <Route path="/atlas-climatique" element={<AtlasClimatique />} />
            <Route path="/presentation" element={<ProjectPresentation />} />
            <Route path="/partage/:id" element={<PartagePublic />} />
            <Route path="/marcheur/:slug/carnet" element={<CarnetMarcheur />} />

            {/* Adhésion association */}
            <Route path="/adhesion" element={<Adhesion />} />
            <Route path="/admin/adhesions" element={<AdminAuth><AdhesionAdmin /></AdminAuth>} />

            {/* Formations */}
            <Route path="/formations/isegcom-bordeaux" element={<IsegcomBordeaux />} />

            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/oauth/consent" element={<OAuthConsent />} />
            <Route path="*" element={<NotFound />} />

          </Routes>
          </Suspense>
          <GlobalMounts />
          <Toaster position="top-right" />

            </DiscoverFullscreenProvider>
            </TrophicFullscreenProvider>
            </BrowserRouter>
          </AudioProvider>

        </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
