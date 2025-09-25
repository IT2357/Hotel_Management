import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const SimpleViewReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get report type from URL params
  const reportType = searchParams.get('type') || 'dashboard';
  
  console.log('SimpleViewReportPage loaded with reportType:', reportType);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/manager/reports')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">View Report Page</h1>
                  <p className="text-gray-600">Report Type: {reportType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Success! View Report Page is working
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Report type received: <strong>{reportType}</strong></p>
                <p>URL parameters: {searchParams.toString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Test */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Navigation Test</h3>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/manager/reports/view?type=booking')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Booking Report
            </button>
            <button
              onClick={() => navigate('/manager/reports/view?type=financial')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Financial Report
            </button>
            <button
              onClick={() => navigate('/manager/reports/view?type=kpi')}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test KPI Report
            </button>
            <button
              onClick={() => navigate('/manager/reports')}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Reports Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleViewReportPage;