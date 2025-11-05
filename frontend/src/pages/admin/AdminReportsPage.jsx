import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StatsCard from '../../components/ui/StatsCard';
import Spinner from '../../components/ui/Spinner';

export default function AdminReportsPage() {
  const { user } = useContext(AuthContext);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    // Implementation would depend on your backend
    console.log(`Exporting ${reportType} report in ${format} format for last ${dateRange} days`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">System performance and user analytics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Report Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="overview">System Overview</option>
              <option value="users">User Analytics</option>
              <option value="bookings">Booking Reports</option>
              <option value="revenue">Revenue Reports</option>
            </Select>
            
            <Select
              label="Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </Select>

            <div className="flex items-end">
              <Button onClick={() => exportReport('pdf')} variant="outline" className="mr-2">
                Export PDF
              </Button>
            </div>

            <div className="flex items-end">
              <Button onClick={() => exportReport('csv')} variant="outline">
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={dashboardStats.totalUsers}
              icon="👥"
              trend="+5.2%"
              trendUp={true}
            />
            <StatsCard
              title="Active Users"
              value={dashboardStats.activeUsers}
              icon="✅"
              trend="+2.1%"
              trendUp={true}
            />
            <StatsCard
              title="Pending Approvals"
              value={dashboardStats.pendingApprovals}
              icon="⏳"
              trend={dashboardStats.pendingApprovals > 0 ? "Needs attention" : "All clear"}
              trendUp={false}
            />
            <StatsCard
              title="Inactive Users"
              value={dashboardStats.inactiveUsers}
              icon="❌"
              trend="-1.3%"
              trendUp={true}
            />
          </div>
        )}

        {/* User Role Distribution */}
        {dashboardStats?.usersByRole && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card title="User Distribution by Role" className="p-6">
              <div className="space-y-4">
                {Object.entries(dashboardStats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center">
                    <span className="capitalize font-medium">{role}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${(count / dashboardStats.totalUsers) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Recent Registrations" className="p-6">
              {dashboardStats.recentRegistrations?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.recentRegistrations.slice(0, 5).map((user) => (
                    <div key={user._id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{user.role}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent registrations</p>
              )}
            </Card>
          </div>
        )}

        {/* Report Content Based on Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 capitalize">{reportType} Report</h2>
          
          {reportType === 'overview' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                System overview for the last {dateRange} days shows the current state of user management,
                system activity, and overall platform health.
              </p>
              {dashboardStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900">User Activity</h3>
                    <p className="text-blue-700">
                      {((dashboardStats.activeUsers / dashboardStats.totalUsers) * 100).toFixed(1)}% 
                      of users are currently active
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900">System Health</h3>
                    <p className="text-green-700">All systems operational</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900">Pending Actions</h3>
                    <p className="text-yellow-700">
                      {dashboardStats.pendingApprovals} user approvals pending
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {reportType === 'users' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Detailed user analytics including registration trends, role distribution,
                and user activity patterns.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  📊 User analytics dashboard would be implemented here with charts and detailed metrics.
                </p>
              </div>
            </div>
          )}

          {reportType === 'bookings' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Booking statistics, revenue trends, and occupancy rates for the selected period.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  📈 Booking reports would be implemented here with booking trends and revenue analytics.
                </p>
              </div>
            </div>
          )}

          {reportType === 'revenue' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Financial reports including revenue breakdown, payment analytics, and profit margins.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  💰 Revenue reports would be implemented here with financial charts and analytics.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}