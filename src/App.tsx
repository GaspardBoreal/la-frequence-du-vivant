
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import { AudioProvider } from './contexts/AudioContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AdminAuth from './components/AdminAuth';
import AdminLogin from './pages/AdminLogin';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import MarcheDetail from './pages/MarcheDetail';
import MarcheDetailBio from './pages/MarcheDetailBio';
import MarchesTechnoSensibles from './pages/MarchesTechnoSensibles';
import BioacoustiquePoetique from './pages/BioacoustiquePoetique';
import MigrationAdmin from './pages/MigrationAdmin';
import MigrationExecution from './pages/MigrationExecution';
import MarcheAdmin from './pages/MarcheAdmin';
import AdminAccess from './pages/AdminAccess';
import ExplorationsList from './pages/ExplorationsList';
import ExplorationDetail from './pages/ExplorationDetail';
import NarrativeLandscape from './pages/NarrativeLandscape';
import ExplorationsAdmin from './pages/ExplorationsAdmin';
import ExplorationFormPage from './pages/ExplorationFormPage';
import ExplorationMarchesAdmin from './pages/ExplorationMarchesAdmin';
import TestEbird from './pages/TestEbird';
import FaviconTest from './pages/FaviconTest';
import DataInsights from './pages/DataInsights';
import ExplorationAnimatorRefactored from './pages/ExplorationAnimatorRefactored';
import ExplorationExperience from './pages/ExplorationExperience';
import ExplorationPodcast from './pages/ExplorationPodcast';
import ExplorationPodcastDordogne from './pages/ExplorationPodcastDordogne';
import WeatherCalendar from './pages/WeatherCalendar';
import ProjectPresentation from './pages/ProjectPresentation';
import GalerieFleuvePage from './pages/GalerieFleuvePage';
import GalerieFluveExploration from './pages/GalerieFluveExploration';
import GalerieFluveExplorationLecteurs from './pages/GalerieFluveExplorationLecteurs';
import ExplorationHistorique from './pages/ExplorationHistorique';
import ExplorationEssais from './pages/ExplorationEssais';
import ExperienceAudioContinue from './components/experience/ExperienceAudioContinue';
import ExperienceLectureOptimisee from './components/reading/ExperienceLectureOptimisee';
import OpusAdmin from './pages/OpusAdmin';
import ExplorationPrefigurer from './pages/ExplorationPrefigurer';
import ExplorationImports from './pages/ExplorationImports';
import AtlasClimatique from './pages/AtlasClimatique';
import ExportationsAdmin from './pages/ExportationsAdmin';
import AutomationsAdmin from './pages/AutomationsAdmin';
import ExplorationLayout from './layouts/ExplorationLayout';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AudioProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marches-techno-sensibles" element={<MarchesTechnoSensibles />} />
            <Route path="/marche/:slug" element={<MarcheDetail />} />
            
            {/* Nouvelles routes bioacoustiques */}
            <Route path="/bioacoustique-poetique" element={<BioacoustiquePoetique />} />
            <Route path="/bioacoustique/:slug" element={<MarcheDetailBio />} />
            
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
            </Route>
            
            {/* Route lecteurs avec ExplorationLayout */}
            <Route path="/lecteurs/exploration/:slug" element={<ExplorationLayout />}>
              <Route index element={<GalerieFluveExplorationLecteurs />} />
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
            <Route path="/meteo-historique" element={<WeatherCalendar />} />
            <Route path="/atlas-climatique" element={<AtlasClimatique />} />
            <Route path="/presentation" element={<ProjectPresentation />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" />
          </BrowserRouter>
        </AudioProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
