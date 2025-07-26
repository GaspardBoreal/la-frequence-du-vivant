
import React from 'react';

const TestRoute = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">✅ TEST RÉUSSI !</h1>
        <p className="text-lg">La route /test fonctionne parfaitement</p>
        <p className="text-sm text-gray-600 mt-2">Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TestRoute;
