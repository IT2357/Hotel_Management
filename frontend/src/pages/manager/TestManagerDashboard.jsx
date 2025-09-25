import React, { useState, useEffect } from 'react';
import { taskAPI } from '../../services/taskManagementAPI';

const TestManagerDashboard = () => {
  const [data, setData] = useState({
    loading: true,
    error: null,
    stats: null
  });

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        console.log('🚀 Starting test API call...');
        console.log('🔑 Token from localStorage:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
        
        const response = await taskAPI.getTaskStats();
        console.log('✅ API call successful:', response);
        
        setData({
          loading: false,
          error: null,
          stats: response.data
        });
      } catch (error) {
        console.error('❌ API call failed:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        setData({
          loading: false,
          error: error.message,
          stats: null
        });
      }
    };

    fetchTestData();
  }, []);

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
            <p className="mt-2 text-sm text-gray-500">Check browser console for details</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Dashboard Error</h2>
            <p className="text-red-700 mb-4">{data.error}</p>
            <div className="text-sm text-red-600">
              <p>Check the browser console for detailed error information.</p>
              <p>Make sure you are logged in as a manager.</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Manager Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Test Results</h2>
          
          {data.stats ? (
            <div>
              <p className="text-green-600 font-medium mb-4">✅ API call successful!</p>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(data.stats, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-gray-600">No data received</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestManagerDashboard;