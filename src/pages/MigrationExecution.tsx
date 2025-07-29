
import React from 'react';
import MigrationControlPanel from '../components/MigrationControlPanel';

function MigrationExecution() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚡ Exécution Migration</h1>
        <MigrationControlPanel />
      </div>
    </div>
  );
}

export default MigrationExecution;
