import React, { useState } from 'react';
import { Download, FileText, Table, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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

      setExportStatus({
        type: 'success',
        message: 'Export completed successfully!',
        downloadUrl: result.downloadUrl,
        fileName: result.fileName
      });
    } catch (error) {
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
        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Make authenticated request to download file
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';
        // Remove /api from baseURL if downloadUrl already includes it
        const cleanBaseURL = baseURL.replace('/api', '');
        const response = await fetch(`${cleanBaseURL}${exportStatus.downloadUrl}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }

        // Convert response to blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportStatus.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
        setExportStatus({
          type: 'error',
          message: `Download failed: ${error.message}`
        });
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow border p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Export Report</h3>
      </div>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {formats.map(format => {
              const Icon = format.icon;
              return (
                <label
                  key={format.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={exportOptions.format === format.value}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                    className="sr-only"
                  />
                  <Icon className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">{format.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Include charts and visualizations</span>
            </label>
          </div>
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div className={`p-3 rounded-lg ${
            exportStatus.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {exportStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {exportStatus.message}
              </span>
            </div>
            
            {exportStatus.type === 'success' && exportStatus.downloadUrl && (
              <button
                onClick={handleDownload}
                className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Download File
              </button>
            )}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={disabled || isExporting}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
            disabled || isExporting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportOptions;