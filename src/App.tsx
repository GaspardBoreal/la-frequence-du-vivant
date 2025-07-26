
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/queryClient';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import MarcheDetail from './pages/MarcheDetail';
import MarchesTechnoSensibles from './pages/MarchesTechnoSensibles';
import MigrationAdmin from './pages/MigrationAdmin';
import MigrationExecution from './pages/MigrationExecution';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/marches-techno-sensibles" element={<MarchesTechnoSensibles />} />
          <Route path="/marche/:slug" element={<MarcheDetail />} />
          <Route path="/admin/migration" element={<MigrationAdmin />} />
          <Route path="/admin/migration/execute" element={<MigrationExecution />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
