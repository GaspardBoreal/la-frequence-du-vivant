
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import AdminAuth from './components/AdminAuth';
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
import ExplorationAnimatorRefactored from './pages/ExplorationAnimatorRefactored';
import ExplorationExperience from './pages/ExplorationExperience';
import ExplorationPodcast from './pages/ExplorationPodcast';
import ExplorationPodcastDordogne from './pages/ExplorationPodcastDordogne';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="/explorations/:slug" element={<ExplorationDetail />} />
          <Route path="/explorations/:slug/animer" element={<ExplorationAnimatorRefactored />} />
          <Route path="/explorations/:slug/experience/:sessionId" element={<ExplorationExperience />} />
          <Route path="/explorations/remontee-dordogne-atlas-eaux-vivantes-2050-2100/experience/:sessionId/podcast" element={<ExplorationPodcastDordogne />} />
          <Route path="/explorations/:slug/experience/:sessionId/podcast" element={<ExplorationPodcast />} />
          <Route path="/explorations/:slug/:narrativeSlug" element={<NarrativeLandscape />} />

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
          
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
