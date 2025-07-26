
import React from 'react';

const MigrationExecution = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Migration Execution - Test</h1>
        <p className="text-lg mb-4">Cette page fonctionne aussi !</p>
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-2">Test de base</h2>
            <p>Si vous voyez cette page, l'exécution est accessible.</p>
          </div>
          <a 
            href="/admin/migration"
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Retour à l'admin
          </a>
        </div>
      </div>
    </div>
  );
};

export default MigrationExecution;
