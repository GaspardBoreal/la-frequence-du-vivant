import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import Index from './pages/Index';
import MarchesTechnoSensibles from './pages/MarchesTechnoSensibles';
import MarcheDetail from './pages/MarcheDetail';
import NotFound from './pages/NotFound';
import NavigationMenu from './components/NavigationMenu';
import MigrationAdmin from './pages/MigrationAdmin';
import MigrationExecution from './pages/MigrationExecution';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <NavigationMenu />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marches-techno-sensibles" element={<MarchesTechnoSensibles />} />
            <Route path="/marche/:slug" element={<MarcheDetail />} />
            <Route path="/admin/migration" element={<MigrationAdmin />} />
            <Route path="/admin/migration/execute" element={<MigrationExecution />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
