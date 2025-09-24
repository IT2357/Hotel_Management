import React, { useState } from 'react';

const TestPage = () => {
  const [counter, setCounter] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🧪 Test Page - No Auto Refresh
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-4">
            This page should NOT automatically refresh.
          </p>
          <p className="text-lg font-semibold">
            Counter: <span className="text-blue-600">{counter}</span>
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setCounter(prev => prev + 1)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Increment
          </button>
          <button
            onClick={() => setCounter(0)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            If this page refreshes automatically, there's still an issue.
            If the counter stays when you click buttons, the issue is fixed!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;