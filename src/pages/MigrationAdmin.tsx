
import React from 'react';

const MigrationAdmin = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Migration Admin - Page de Test</h1>
      <p>Cette page fonctionne si vous la voyez !</p>
      <p>URL actuelle : /admin/migration</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>Test simple</h2>
        <p>Pas d'import complexe, pas de Tailwind, juste du HTML basique.</p>
      </div>
      <a href="/admin/migration/execute" style={{ 
        display: 'inline-block', 
        marginTop: '20px', 
        padding: '10px 20px', 
        backgroundColor: '#007bff', 
        color: 'white', 
        textDecoration: 'none',
        borderRadius: '4px'
      }}>
        Aller à la page d'exécution
      </a>
    </div>
  );
};

export default MigrationAdmin;
