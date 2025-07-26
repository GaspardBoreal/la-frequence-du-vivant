
import React from 'react';

const DebugTest = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">🎯 DEBUG TEST RÉUSSI !</h1>
        <p className="text-lg">La route /debug-test fonctionne parfaitement</p>
        <p className="text-sm text-gray-600 mt-2">Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DebugTest;
