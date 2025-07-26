
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function TestRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  console.log('✅ TestRoute component loaded');
  console.log('📍 Current location:', location.pathname);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ PAGE DE TEST FONCTIONNE</h1>
        <p className="text-lg mb-2"><strong>URL actuelle:</strong> {location.pathname}</p>
        <p className="text-lg mb-8"><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
        
        <div className="bg-white border-2 border-gray-300 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">🧪 Test de Navigation</h2>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/admin/migration')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Aller vers /admin/migration
            </button>
            
            <button 
              onClick={() => navigate('/admin/migration/execute')}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Aller vers /admin/migration/execute
            </button>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">📋 Instructions de test:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Ouvrez la console développeur (F12)</li>
            <li>Cliquez sur les boutons ci-dessus</li>
            <li>Regardez les logs dans la console</li>
            <li>Si ça ne marche pas, tapez manuellement /admin/migration dans l'URL</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default TestRoute;
