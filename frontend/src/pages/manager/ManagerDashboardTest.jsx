import React, { useState, useEffect } from 'react';
import { taskAPI, reportsAPI } from '../../services/taskManagementAPI';

const ManagerDashboardTest = () => {
  const [testResults, setTestResults] = useState({
    authentication: { status: 'pending', message: '', details: null },
    apiConnectivity: { status: 'pending', message: '', details: null },
    taskStats: { status: 'pending', message: '', details: null },
    taskListing: { status: 'pending', message: '', details: null },
    reports: { status: 'pending', message: '', details: null }
  });

  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (testName, status, message, details = null) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { status, message, details }
    }));
  };

  const runAllTests = async () => {
    setIsRunning(true);
    console.log('🧪 Starting comprehensive dashboard tests...');

    // Reset all test results
    setTestResults({
      authentication: { status: 'running', message: 'Checking authentication...', details: null },
      apiConnectivity: { status: 'pending', message: '', details: null },
      taskStats: { status: 'pending', message: '', details: null },
      taskListing: { status: 'pending', message: '', details: null },
      reports: { status: 'pending', message: '', details: null }
    });

    try {
      // Test 1: Authentication
      await testAuthentication();
      
      // Test 2: API Connectivity
      await testApiConnectivity();
      
      // Test 3: Task Stats
      await testTaskStats();
      
      // Test 4: Task Listing
      await testTaskListing();
      
      // Test 5: Reports
      await testReports();

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testAuthentication = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (!token) {
        updateTestResult('authentication', 'failed', 'No authentication token found', {
          hasToken: false,
          hasUser: !!user
        });
        return;
      }

      if (!user) {
        updateTestResult('authentication', 'failed', 'No user info found', {
          hasToken: true,
          hasUser: false
        });
        return;
      }

      const userInfo = JSON.parse(user);
      if (userInfo.role !== 'manager') {
        updateTestResult('authentication', 'failed', `Wrong role: ${userInfo.role}`, {
          hasToken: true,
          hasUser: true,
          role: userInfo.role
        });
        return;
      }

      updateTestResult('authentication', 'passed', 'Authentication verified', {
        hasToken: true,
        hasUser: true,
        role: userInfo.role,
        email: userInfo.email
      });

    } catch (error) {
      updateTestResult('authentication', 'failed', `Authentication error: ${error.message}`, error);
    }
  };

  const testApiConnectivity = async () => {
    updateTestResult('apiConnectivity', 'running', 'Testing API connectivity...');
    
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        const data = await response.json();
        updateTestResult('apiConnectivity', 'passed', 'Backend server is running', data);
      } else {
        updateTestResult('apiConnectivity', 'failed', `Server responded with status: ${response.status}`);
      }
    } catch (error) {
      updateTestResult('apiConnectivity', 'failed', `Cannot connect to backend: ${error.message}`, error);
    }
  };

  const testTaskStats = async () => {
    updateTestResult('taskStats', 'running', 'Testing task statistics API...');
    
    try {
      const response = await taskAPI.getTaskStats();
      updateTestResult('taskStats', 'passed', 'Task stats loaded successfully', response.data);
    } catch (error) {
      updateTestResult('taskStats', 'failed', `Task stats failed: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const testTaskListing = async () => {
    updateTestResult('taskListing', 'running', 'Testing task listing API...');
    
    try {
      const response = await taskAPI.getAllTasks({ limit: 5 });
      updateTestResult('taskListing', 'passed', `Loaded ${response.data.tasks?.length || 0} tasks`, response.data);
    } catch (error) {
      updateTestResult('taskListing', 'failed', `Task listing failed: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const testReports = async () => {
    updateTestResult('reports', 'running', 'Testing reports API...');
    
    try {
      const delayedTasks = await reportsAPI.getDelayedTasksReport();
      const workloadReport = await reportsAPI.getWorkloadReport();
      
      updateTestResult('reports', 'passed', 'Reports loaded successfully', {
        delayedTasks: delayedTasks.data,
        workloadReport: workloadReport.data
      });
    } catch (error) {
      updateTestResult('reports', 'failed', `Reports failed: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🧪 Manager Dashboard Test Suite
          </h1>
          
          <div className="mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isRunning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold capitalize">
                    {getStatusIcon(result.status)} {testName.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <span className={`font-medium ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-2">{result.message}</p>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              📋 Manual Testing Checklist
            </h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Check browser console for any JavaScript errors</li>
              <li>• Verify dashboard loads without page refresh loops</li>
              <li>• Test filtering by department and time range</li>
              <li>• Navigate to task assignment page</li>
              <li>• Try creating a new task</li>
              <li>• Check if task status updates work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboardTest;