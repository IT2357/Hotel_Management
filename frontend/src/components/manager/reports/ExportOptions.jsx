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
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
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
    <div className={`rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 shadow-2xl border-0 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-green-300/20 backdrop-blur-sm">
          <Download className="w-5 h-5 text-green-200" />
        </div>
        <h3 className="text-xl font-black text-white tracking-tight">Export Report</h3>
      </div>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-xs font-black text-emerald-200 mb-3 uppercase tracking-widest">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {formats.map(format => {
              const Icon = format.icon;
              return (
                <label
                  key={format.value}
                  className={`flex items-center p-3 border-0 rounded-2xl cursor-pointer transition-all ${
                    exportOptions.format === format.value
                      ? 'bg-white/20 backdrop-blur-sm shadow-lg scale-105'
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/15'
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
                  <Icon className="w-5 h-5 mr-2 text-white" />
                  <span className="text-sm font-bold text-white">{format.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-xs font-black text-emerald-200 mb-3 uppercase tracking-widest">
            Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center bg-white/10 backdrop-blur-sm p-3 rounded-2xl hover:bg-white/15 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="mr-3 rounded-md border-white/30 bg-white/10 text-green-400 focus:ring-green-400 focus:ring-offset-0 w-4 h-4"
              />
              <span className="text-sm font-semibold text-white">Include charts and visualizations</span>
            </label>
          </div>
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div className={`p-4 rounded-2xl backdrop-blur-sm ${
            exportStatus.type === 'success' ? 'bg-green-400/20 border-2 border-green-300/50' : 'bg-red-400/20 border-2 border-red-300/50'
          }`}>
            <div className="flex items-center gap-2">
              {exportStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-200" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-200" />
              )}
              <span className={`text-sm font-bold ${
                exportStatus.type === 'success' ? 'text-white' : 'text-white'
              }`}>
                {exportStatus.message}
              </span>
            </div>
            
            {exportStatus.type === 'success' && exportStatus.downloadUrl && (
              <button
                onClick={handleDownload}
                className="mt-3 px-4 py-2 bg-white/20 text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-all hover:scale-105"
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
          className={`w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl text-white font-black transition-all ${
            disabled || isExporting
              ? 'bg-white/10 cursor-not-allowed opacity-50'
              : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm hover:scale-105 hover:shadow-xl'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportOptions;