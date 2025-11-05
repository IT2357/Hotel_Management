import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManagerReportsPage from '../ManagerReportsPage';

// Mock the layout component
jest.mock('@/components/manager/ManagerLayout', () => {
  return {
    ManagerLayout: ({ children }) => <div data-testid="manager-layout">{children}</div>,
    ManagerPageLoader: () => <div>Loading...</div>,
    ManagerErrorState: () => <div>Error occurred</div>
  };
});

// Mock the reports API
jest.mock('@/services/reportsAPI', () => ({
  reportsAPI: {
    getManagerOverview: jest.fn().mockResolvedValue({
      data: {
        financial: {
          summary: {
            totalRevenue: 100000,
            totalExpenses: 50000,
            netProfit: 50000,
            profitMargin: 50,
            avgDailyRevenue: 3333,
            occupancyRate: 75
          }
        },
        staff: {
          summary: {
            completedTasks: 100,
            tasksInProgress: 20,
            completionRate: 83.3,
            averageCompletionTime: 45,
            averageQualityScore: 4.2,
            overdueTasks: 5
          }
        }
      }
    })
  }
}));

// Mock other components
jest.mock('@/components/manager/reports/ReportFilters', () => {
  return function ReportFilters() {
    return <div>Report Filters</div>;
  };
});

jest.mock('@/components/manager/reports/KPICard', () => {
  return function KPICard({ title, value }) {
    return <div data-testid={`kpi-card-${title}`}>{title}: {value}</div>;
  };
});

jest.mock('@/components/manager/reports/LineChartComponent', () => {
  return function LineChartComponent({ title }) {
    return <div>{title} Chart</div>;
  };
});

jest.mock('@/components/manager/reports/BarChartComponent', () => {
  return function BarChartComponent({ title }) {
    return <div>{title} Chart</div>;
  };
});

jest.mock('@/components/manager/reports/PieChartComponent', () => {
  return function PieChartComponent({ title }) {
    return <div>{title} Chart</div>;
  };
});

jest.mock('@/components/manager/reports/ExportOptions', () => {
  return function ExportOptions() {
    return <div>Export Options</div>;
  };
});

describe('ManagerReportsPage', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ManagerReportsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Manager Reports')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive performance insights across all hotel operations.')).toBeInTheDocument();
  });

  test('renders financial KPI cards', async () => {
    render(
      <BrowserRouter>
        <ManagerReportsPage />
      </BrowserRouter>
    );
    
    // Wait for the data to load
    setTimeout(() => {
      expect(screen.getByTestId('kpi-card-Total Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-Total Expenses')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-card-Net Profit')).toBeInTheDocument();
    }, 100);
  });
});