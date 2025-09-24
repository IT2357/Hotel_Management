import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthTest = () => {
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    hasToken: false,
    tokenValue: null,
    userInfo: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('user');
    
    console.log('🔍 Checking authentication...');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('User info:', userInfo);

    setAuthStatus({
      loading: false,
      hasToken: !!token,
      tokenValue: token,
      userInfo: userInfo ? JSON.parse(userInfo) : null
    });
  }, []);

  const testApiCall = async () => {
    try {
      console.log('🚀 Testing API call...');
      
      const response = await fetch('http://localhost:5000/api/task-management/tasks/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStatus.tokenValue}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        alert('✅ API call successful! Check console for details.');
      } else {
        alert(`❌ API call failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert(`❌ Network error: ${error.message}`);
    }
  };

  if (authStatus.loading) {
    return <div className="p-6">Checking authentication...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test</h1>
        
        <div className="space-y-6">
          {/* Auth Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className={`w-3 h-3 rounded-full ${authStatus.hasToken ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>Token: {authStatus.hasToken ? 'Present' : 'Missing'}</span>
              </div>
              
              {authStatus.hasToken && (
                <div className="ml-6 text-sm text-gray-600">
                  <p>Token preview: {authStatus.tokenValue.substring(0, 30)}...</p>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <span className={`w-3 h-3 rounded-full ${authStatus.userInfo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>User Info: {authStatus.userInfo ? 'Present' : 'Missing'}</span>
              </div>
              
              {authStatus.userInfo && (
                <div className="ml-6 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <pre>{JSON.stringify(authStatus.userInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-4">
              {!authStatus.hasToken ? (
                <div>
                  <p className="text-red-600 mb-4">❌ You are not logged in!</p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Login Page
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-green-600 mb-4">✅ You are logged in!</p>
                  <div className="space-x-4">
                    <button 
                      onClick={testApiCall}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Test API Call
                    </button>
                    <button 
                      onClick={() => navigate('/manager/tasks/dashboard')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Go to Real Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Server Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Server Status</h2>
            <p className="text-sm text-gray-600 mb-2">Backend should be running on: http://localhost:5000</p>
            <p className="text-sm text-gray-600">Frontend running on: {window.location.origin}</p>
            
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:5000/health');
                  const data = await response.json();
                  alert('✅ Server is running: ' + JSON.stringify(data));
                } catch (error) {
                  alert('❌ Server not responding: ' + error.message);
                }
              }}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Test Server Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;