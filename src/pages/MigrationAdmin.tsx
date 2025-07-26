
import React from 'react';

function MigrationAdmin() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Administration Migration</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-lg text-green-600 mb-4">✅ La page /admin/migration fonctionne !</p>
          <p className="text-gray-700 mb-4">
            Cette page devrait contenir le composant MigrationAdminPanel pour gérer la migration des données Google Sheets vers Supabase.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Étapes de migration :</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Migrer les données (Google Sheets → Supabase)</li>
              <li>Migrer les médias (Google Drive → Supabase Storage)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MigrationAdmin;
