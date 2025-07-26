
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SimpleTest from './pages/SimpleTest';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/simple-test" element={<SimpleTest />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
