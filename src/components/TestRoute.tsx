
import React from 'react';

const TestRoute: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Test Route - Administration
        </h1>
        <p className="text-muted-foreground">
          Si vous voyez cette page, les routes d'administration fonctionnent !
        </p>
        <div className="space-x-4">
          <a href="/admin/migration" className="text-blue-600 hover:underline">
            Page Migration
          </a>
          <a href="/admin/migration/execute" className="text-green-600 hover:underline">
            Page Exécution
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestRoute;
