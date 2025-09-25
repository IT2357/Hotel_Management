import React from 'react';

const TestViewReportPage = () => {
  console.log('TestViewReportPage component loaded!');
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test View Report Page</h1>
        <p className="text-gray-600">If you can see this, the routing is working!</p>
        <div className="mt-4">
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestViewReportPage;