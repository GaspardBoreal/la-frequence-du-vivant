
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Index from './pages/Index';
import MarchesTechnoSensibles from './pages/MarchesTechnoSensibles';
import MarcheDetail from './pages/MarcheDetail';
import NotFound from './pages/NotFound';
import NavigationMenu from './components/NavigationMenu';
import MigrationAdmin from './pages/MigrationAdmin';
import MigrationExecution from './pages/MigrationExecution';
import TestRoute from './pages/TestRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Composant pour logger la route actuelle
function RouteLogger() {
  const location = useLocation();
  console.log('🔍 ROUTE ACTUELLE:', location.pathname);
  console.log('🔍 SEARCH:', location.search);
  console.log('🔍 HASH:', location.hash);
  return null;
}

function App() {
  console.log('🚀 APP COMPONENT LOADED');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RouteLogger />
        <div className="min-h-screen bg-background">
          <NavigationMenu />
          <Routes>
            <Route path="/" element={
              <>
                {console.log('📍 Route / matched')}
                <Index />
              </>
            } />
            <Route path="/test" element={
              <>
                {console.log('📍 Route /test matched')}
                <TestRoute />
              </>
            } />
            <Route path="/marches-techno-sensibles" element={
              <>
                {console.log('📍 Route /marches-techno-sensibles matched')}
                <MarchesTechnoSensibles />
              </>
            } />
            <Route path="/marche/:slug" element={
              <>
                {console.log('📍 Route /marche/:slug matched')}
                <MarcheDetail />
              </>
            } />
            <Route path="/admin/migration" element={
              <>
                {console.log('📍 Route /admin/migration matched')}
                <MigrationAdmin />
              </>
            } />
            <Route path="/admin/migration/execute" element={
              <>
                {console.log('📍 Route /admin/migration/execute matched')}
                <MigrationExecution />
              </>
            } />
            <Route path="*" element={
              <>
                {console.log('📍 Route * (404) matched')}
                <NotFound />
              </>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
