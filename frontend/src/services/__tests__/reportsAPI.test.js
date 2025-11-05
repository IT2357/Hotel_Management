import { reportsAPI } from '../reportsAPI';
import api from '../api';

// Mock the api module
jest.mock('../api');

describe('reportsAPI', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getManagerOverview', () => {
    it('should call the manager overview endpoint with correct parameters', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: {} } };
      api.get.mockResolvedValue(mockResponse);
      const params = { startDate: '2023-01-01', endDate: '2023-01-31' };

      // Act
      await reportsAPI.getManagerOverview(params);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/reports/manager/overview', { params });
    });
  });

  describe('getFinancialReports', () => {
    it('should call the financial reports endpoint with correct parameters', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: {} } };
      api.get.mockResolvedValue(mockResponse);
      const params = { startDate: '2023-01-01', endDate: '2023-01-31' };

      // Act
      await reportsAPI.getFinancialReports(params);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/reports/finance', { params });
    });
  });

  describe('getBookingReports', () => {
    it('should call the booking reports endpoint with correct parameters', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: {} } };
      api.get.mockResolvedValue(mockResponse);
      const params = { startDate: '2023-01-01', endDate: '2023-01-31' };

      // Act
      await reportsAPI.getBookingReports(params);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/reports/bookings', { params });
    });
  });

  describe('exportReport', () => {
    it('should call the export endpoint with correct data', async () => {
      // Arrange
      const mockResponse = { data: { success: true, data: {} } };
      api.post.mockResolvedValue(mockResponse);
      const data = { reportType: 'financial', format: 'pdf' };

      // Act
      await reportsAPI.exportReport(data);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/reports/export', data);
    });
  });
});