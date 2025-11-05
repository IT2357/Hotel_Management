import React, { useState } from 'react';
import { Download, FileText, Table, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const ExportOptions = ({ 
  onExport, 
  reportType = 'booking',
  className = '',
  disabled = false 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    format: 'pdf',
    includeCharts: true,
    dateRange: 'current'
  });

  const formats = [
    { value: 'pdf', label: 'PDF Report', icon: FileText },
    { value: 'excel', label: 'Excel Spreadsheet', icon: Table }
  ];

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    setExportStatus(null);

    try {
      const result = await onExport({
        reportType,
        format: exportOptions.format,
        includeCharts: exportOptions.includeCharts
      });

      console.log('ExportOptions - received result:', result);

      // Check if result has the required properties
      if (result && result.downloadUrl && result.fileName) {
        console.log('ExportOptions - Setting status with:', {
          downloadUrl: result.downloadUrl,
          fileName: result.fileName
        });
        setExportStatus({
          type: 'success',
          message: 'Export completed successfully!',
          downloadUrl: result.downloadUrl,
          fileName: result.fileName
        });
      } else {
        console.warn('ExportOptions - Missing downloadUrl or fileName:', result);
        // Fallback if structure is different
        setExportStatus({
          type: 'success',
          message: 'Export completed successfully!',
          downloadUrl: result?.downloadUrl || null,
          fileName: result?.fileName || 'report'
        });
      }
    } catch (error) {
      console.error('ExportOptions - Export error:', error);
      setExportStatus({
        type: 'error',
        message: error.message || 'Export failed. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (exportStatus?.downloadUrl) {
      try {
        console.log('Starting download for:', exportStatus.downloadUrl);
        
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Make authenticated request to download file
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        // Remove /api from baseURL if downloadUrl already includes it
        const cleanBaseURL = baseURL.replace('/api', '');
        const downloadURL = `${cleanBaseURL}${exportStatus.downloadUrl}`;
        
        console.log('Download URL:', downloadURL);
        
        const response = await fetch(downloadURL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Download failed:', response.status, errorText);
          throw new Error(`Download failed: ${response.statusText}`);
        }

        // Convert response to blob and download
        const blob = await response.blob();
        console.log('Blob size:', blob.size, 'type:', blob.type);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportStatus.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Download initiated successfully');
      } catch (error) {
        console.error('Download error:', error);
        setExportStatus({
          type: 'error',
          message: `Download failed: ${error.message}`
        });
      }
    } else {
      console.error('No download URL available');
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white shadow-lg border border-gray-100 p-6 ${className}`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center rounded-xl p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Export Report</h3>
            <p className="text-xs text-gray-500 font-medium">Download as PDF or Excel</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formats.map(format => {
                const Icon = format.icon;
                const isSelected = exportOptions.format === format.value;
                return (
                  <label
                    key={format.value}
                    className={`group relative overflow-hidden flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md scale-105'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={format.value}
                      checked={isSelected}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg mb-2 transition-colors ${
                      isSelected 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-bold text-center transition-colors ${
                      isSelected ? 'text-indigo-700' : 'text-gray-700 group-hover:text-indigo-600'
                    }`}>
                      {format.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
              Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer group">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="w-5 h-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">Include charts and visualizations</span>
                  <p className="text-xs text-gray-500 mt-0.5">Add graphs and charts to your export</p>
                </div>
                <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </label>
            </div>
          </div>

          {/* Export Status */}
          {exportStatus && (
            <div className={`p-4 rounded-2xl border-2 transition-all ${
              exportStatus.type === 'success' 
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' 
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {exportStatus.type === 'success' ? (
                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-red-100">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${
                    exportStatus.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {exportStatus.message}
                  </p>
                  {exportStatus.type === 'success' && exportStatus.fileName && (
                    <p className="text-xs text-emerald-700 mt-1 font-medium">
                      {exportStatus.fileName}
                    </p>
                  )}
                </div>
              </div>
              
              {exportStatus.type === 'success' && exportStatus.downloadUrl && (
                <button
                  onClick={handleDownload}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              )}
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={disabled || isExporting}
            className={`w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl font-black transition-all duration-300 ${
              disabled || isExporting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-transparent'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptions;