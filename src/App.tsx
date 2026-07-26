
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
const MarchesDuVivant = lazy(() => import('./pages/MarchesDuVivant'));
const CarteMarchesDuVivant = lazy(() => import('./pages/CarteMarchesDuVivant'));
const PublicEventPage = lazy(() => import('./pages/PublicEventPage'));
const MarchesDuVivantConnexion = lazy(() => import('./pages/MarchesDuVivantConnexion'));
/* Layouts des routes imbriquées */
const ExplorationLayout = lazy(() => import('./layouts/ExplorationLayout'));
const CrmShell = lazy(() => import('./layouts/CrmShell'));

/* --- Chargées à la demande --- */
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminResetPassword = lazy(() => import('./pages/AdminResetPassword'));
const MarcheDetail = lazy(() => import('./pages/MarcheDetail'));
const MarcheDetailBio = lazy(() => import('./pages/MarcheDetailBio'));
const MarchesTechnoSensibles = lazy(() => import('./pages/MarchesTechnoSensibles'));
const BioacoustiquePoetique = lazy(() => import('./pages/BioacoustiquePoetique'));
const MigrationAdmin = lazy(() => import('./pages/MigrationAdmin'));
const MigrationExecution = lazy(() => import('./pages/MigrationExecution'));
const MarcheAdmin = lazy(() => import('./pages/MarcheAdmin'));
const AdminAccess = lazy(() => import('./pages/AdminAccess'));
const ExplorationsList = lazy(() => import('./pages/ExplorationsList'));
const ExplorationDetail = lazy(() => import('./pages/ExplorationDetail'));
const NarrativeLandscape = lazy(() => import('./pages/NarrativeLandscape'));
const ExplorationsAdmin = lazy(() => import('./pages/ExplorationsAdmin'));
const ExplorationFormPage = lazy(() => import('./pages/ExplorationFormPage'));
const ExplorationMarchesAdmin = lazy(() => import('./pages/ExplorationMarchesAdmin'));
const TestEbird = lazy(() => import('./pages/TestEbird'));
const FaviconTest = lazy(() => import('./pages/FaviconTest'));
const DataInsights = lazy(() => import('./pages/DataInsights'));
const ExplorationAnimatorRefactored = lazy(() => import('./pages/ExplorationAnimatorRefactored'));
const ExplorationExperience = lazy(() => import('./pages/ExplorationExperience'));
const ExplorationPodcast = lazy(() => import('./pages/ExplorationPodcast'));
const WeatherCalendar = lazy(() => import('./pages/WeatherCalendar'));
const ProjectPresentation = lazy(() => import('./pages/ProjectPresentation'));
const GalerieFleuvePage = lazy(() => import('./pages/GalerieFleuvePage'));
const GalerieFluveExploration = lazy(() => import('./pages/GalerieFluveExploration'));
const GalerieFluveExplorationLecteurs = lazy(() => import('./pages/GalerieFluveExplorationLecteurs'));
const ExplorationHistorique = lazy(() => import('./pages/ExplorationHistorique'));
const ExplorationEssais = lazy(() => import('./pages/ExplorationEssais'));
const ExperienceAudioContinue = lazy(() => import('./components/experience/ExperienceAudioContinue'));
const ExperienceLectureOptimisee = lazy(() => import('./components/reading/ExperienceLectureOptimisee'));
const OpusAdmin = lazy(() => import('./pages/OpusAdmin'));
const ExplorationPrefigurer = lazy(() => import('./pages/ExplorationPrefigurer'));
const ExplorationImports = lazy(() => import('./pages/ExplorationImports'));
const AtlasClimatique = lazy(() => import('./pages/AtlasClimatique'));
const ExportationsAdmin = lazy(() => import('./pages/ExportationsAdmin'));
const AutomationsAdmin = lazy(() => import('./pages/AutomationsAdmin'));
const ExplorationBiodiversite = lazy(() => import('./pages/ExplorationBiodiversite'));
const TraverseesLecteurs = lazy(() => import('./pages/TraverseesLecteurs'));
const IsegcomBordeaux = lazy(() => import('./pages/IsegcomBordeaux'));
const ExplorationsSensibles = lazy(() => import('./pages/ExplorationsSensibles'));
const MaterielPedagogique = lazy(() => import('./pages/MaterielPedagogique'));
const Dordonia = lazy(() => import('./pages/Dordonia'));
const PublicEpubDownload = lazy(() => import('./pages/PublicEpubDownload'));
const PublicLivreVivant = lazy(() => import('./pages/PublicLivreVivant'));
const OffreVdtMdv = lazy(() => import('./pages/OffreVdtMdv'));
const MarchesDuVivantEntreprises = lazy(() => import('./pages/MarchesDuVivantEntreprises'));
const MarchesDuVivantAgriculture = lazy(() => import('./pages/MarchesDuVivantAgriculture'));
const MarchesDuVivantPartenaires = lazy(() => import('./pages/MarchesDuVivantPartenaires'));
const MarchesDuVivantAssociation = lazy(() => import('./pages/MarchesDuVivantAssociation'));
const MarchesDuVivantExplorer = lazy(() => import('./pages/MarchesDuVivantExplorer'));
const CarnetsDeTerrainGalerie = lazy(() => import('./pages/CarnetsDeTerrainGalerie'));
const CarnetDeTerrain = lazy(() => import('./pages/CarnetDeTerrain'));
const CrmPipeline = lazy(() => import('./pages/CrmPipeline'));
const CrmAnnuaire = lazy(() => import('./pages/CrmAnnuaire'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const CrmHome = lazy(() => import('./pages/CrmHome'));
const CrmMarches = lazy(() => import('./pages/CrmMarches'));
const CrmIa = lazy(() => import('./pages/CrmIa'));
const CrmMissions = lazy(() => import('./pages/CrmMissions'));
const MarchesDuVivantMonEspace = lazy(() => import('./pages/MarchesDuVivantMonEspace'));
const MarchesDuVivantValiderPresence = lazy(() => import('./pages/MarchesDuVivantValiderPresence'));
const MarcheEventsAdmin = lazy(() => import('./pages/MarcheEventsAdmin'));
const MarcheEventDetail = lazy(() => import('./pages/MarcheEventDetail'));
const CommunityProfilesAdmin = lazy(() => import('./pages/CommunityProfilesAdmin'));
const OrganisateursAdmin = lazy(() => import('./pages/OrganisateursAdmin'));
const AdminProprietes = lazy(() => import('./pages/AdminProprietes'));
const ProprieteEspace = lazy(() => import('./pages/ProprieteEspace'));
const MarchesDuVivantExplorationMarcheur = lazy(() => import('./pages/MarchesDuVivantExplorationMarcheur'));
const AdminOutilsHub = lazy(() => import('./pages/AdminOutilsHub'));
const AdminFrequences = lazy(() => import('./pages/AdminFrequences'));
const CommunityAffiliateLanding = lazy(() => import('./pages/CommunityAffiliateLanding'));
const PartagePublic = lazy(() => import('./pages/PartagePublic'));
const CarnetMarcheur = lazy(() => import('./pages/CarnetMarcheur'));
const Adhesion = lazy(() => import('./pages/Adhesion'));
const AdhesionAdmin = lazy(() => import('./pages/AdhesionAdmin'));
const ApiMcpPublic = lazy(() => import('./pages/ApiMcpPublic'));
const AdminApiMcp = lazy(() => import('./pages/AdminApiMcp'));
const AdminTaxonomyCuration = lazy(() => import('./pages/AdminTaxonomyCuration'));
const AdminAuditFrugalHub = lazy(() => import('./pages/AdminAuditFrugalHub'));
const PublicAuditFrugal = lazy(() => import('./pages/PublicAuditFrugal'));
const AgentIA = lazy(() => import('./pages/AgentIA'));
const AgentIAFiche = lazy(() => import('./pages/AgentIAFiche'));
const InterregSudoeMdv = lazy(() => import('./pages/InterregSudoeMdv'));
const ApprendreMarchePage = lazy(() => import('./pages/ApprendreMarchePage'));
const ImmersiveGardenFiche = lazy(() => import('./pages/ImmersiveGardenFiche'));

/* Montages globaux : chargés à la demande, sans écran d'attente */
const AdminChatBotMount = lazy(() =>
  import('./components/chatbot/AdminChatBotMount').then((m) => ({ default: m.AdminChatBotMount })),
);
const CommunityChatBotMount = lazy(() =>
  import('./components/chatbot/CommunityChatBotMount').then((m) => ({ default: m.CommunityChatBotMount })),
);
const AdhesionFab = lazy(() => import('./components/adhesion/AdhesionFab'));

import { TrophicFullscreenProvider } from './components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenProvider';
import { DiscoverFullscreenProvider } from './components/biodiversity/discover/DiscoverFullscreenProvider';




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
            <Route path="/audit-frugal/:slug" element={<PublicAuditFrugal />} />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <AdminChatBotMount />
            <CommunityChatBotMount />
            <AdhesionFab />
          </Suspense>
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
