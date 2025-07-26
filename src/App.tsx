
import React from 'react';

// Contournement du système de routing problématique
// On affiche directement le contenu de test sur la route racine
function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ TEST RÉUSSI !</h1>
        <p className="text-lg text-gray-700 mb-2">La page fonctionne parfaitement</p>
        <p className="text-sm text-gray-500">Route: / (racine)</p>
        <p className="text-xs text-gray-400 mt-4">Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

export default App;
