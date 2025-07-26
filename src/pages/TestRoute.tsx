
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function TestRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  console.log('✅ TestRoute component loaded');
  console.log('📍 Current location:', location.pathname);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ PAGE DE TEST FONCTIONNE</h1>
      <p><strong>URL actuelle:</strong> {location.pathname}</p>
      <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
      
      <div style={{ marginTop: '30px', border: '2px solid #ccc', padding: '15px' }}>
        <h2>🧪 Test de Navigation</h2>
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={() => navigate('/admin/migration')}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              marginRight: '10px',
              cursor: 'pointer'
            }}
          >
            Aller vers /admin/migration
          </button>
          
          <button 
            onClick={() => navigate('/admin/migration/execute')}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Aller vers /admin/migration/execute
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>📋 Instructions de test:</h3>
        <ol>
          <li>Ouvrez la console développeur (F12)</li>
          <li>Cliquez sur les boutons ci-dessus</li>
          <li>Regardez les logs dans la console</li>
          <li>Si ça ne marche pas, tapez manuellement /admin/migration dans l'URL</li>
        </ol>
      </div>
    </div>
  );
}

export default TestRoute;
