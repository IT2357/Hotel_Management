// Example usage of the Reports API

import { reportsAPI } from '@/services/reportsAPI';

// Example 1: Fetch manager overview report
async function fetchManagerOverview() {
  try {
    const filters = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      period: 'monthly',
      departments: ['Kitchen', 'Services']
    };
    
    const response = await reportsAPI.getManagerOverview(filters);
    console.log('Manager Overview:', response);
    return response;
  } catch (error) {
    console.error('Error fetching manager overview:', error);
  }
}

// Example 2: Fetch financial reports
async function fetchFinancialReports() {
  try {
    const filters = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      period: 'monthly'
    };
    
    const response = await reportsAPI.getFinancialReports(filters);
    console.log('Financial Reports:', response);
    return response;
  } catch (error) {
    console.error('Error fetching financial reports:', error);
  }
}

// Example 3: Export a report
async function exportReport() {
  try {
    const exportData = {
      reportType: 'financial',
      format: 'pdf',
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      includeCharts: true
    };
    
    const response = await reportsAPI.exportReport(exportData);
    console.log('Export Response:', response);
    return response;
  } catch (error) {
    console.error('Error exporting report:', error);
  }
}

// Example 4: Fetch KPI dashboard
async function fetchKPIDashboard() {
  try {
    const filters = {
      period: 'monthly'
    };
    
    const response = await reportsAPI.getKPIDashboard(filters);
    console.log('KPI Dashboard:', response);
    return response;
  } catch (error) {
    console.error('Error fetching KPI dashboard:', error);
  }
}

// Example 5: Fetch task reports
async function fetchTaskReports() {
  try {
    const filters = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      department: 'Kitchen',
      reportType: 'overview'
    };
    
    const response = await reportsAPI.getTaskReports(filters);
    console.log('Task Reports:', response);
    return response;
  } catch (error) {
    console.error('Error fetching task reports:', error);
  }
}

// Export all functions
export {
  fetchManagerOverview,
  fetchFinancialReports,
  exportReport,
  fetchKPIDashboard,
  fetchTaskReports
};