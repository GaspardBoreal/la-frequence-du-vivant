
import React from 'react';
import { Link } from 'react-router-dom';

const MigrationAdmin = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Migration Admin - Test</h1>
        <p className="text-lg mb-4">Cette page fonctionne !</p>
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Test de base</h2>
            <p>Si vous voyez cette page, les routes d'administration fonctionnent.</p>
          </div>
          <Link 
            to="/admin/migration/execute"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Aller à la page d'exécution
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MigrationAdmin;
