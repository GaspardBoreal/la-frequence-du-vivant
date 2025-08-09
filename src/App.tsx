
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
import TestEbird from './pages/TestEbird';
import SimpleTest from './pages/SimpleTest';
import DebugTest from './pages/DebugTest';
import TestRoute from './pages/TestRoute';
import FaviconTest from './pages/FaviconTest';
import CartesVisite from './pages/CartesVisite';
import Kakemono from './pages/Kakemono';
import MarquePage from './pages/MarquePage';


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
          
          {/* Routes de test */}
          <Route path="/simple-test" element={<SimpleTest />} />
          <Route path="/debug-test" element={<DebugTest />} />
          <Route path="/test" element={<TestRoute />} />
          <Route path="/favicon-test" element={<FaviconTest />} />
          <Route path="/cartes-visite" element={<CartesVisite />} />
          <Route path="/kakemono" element={<Kakemono />} />
          <Route path="/marque-page" element={<MarquePage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
