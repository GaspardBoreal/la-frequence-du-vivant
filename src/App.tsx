
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DebugTest from './pages/DebugTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/debug-test" element={<DebugTest />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
