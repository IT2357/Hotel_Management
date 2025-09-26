import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../../services/taskManagementAPI';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  User,
  Mail,
  Briefcase
} from 'lucide-react';

const StaffWorkloadPage = () => {
  const [workloadData, setWorkloadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    department: 'all'
  });

  useEffect(() => {
    fetchWorkloadData();
  }, [filters]);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      const params = filters.department !== 'all' ? { department: filters.department } : {};
      const response = await reportsAPI.getWorkloadReport(params);
      setWorkloadData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch workload data');
      console.error('Workload data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWorkloadColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getWorkloadLabel = (score) => {
    if (score >= 80) return 'Overloaded';
    if (score >= 60) return 'Moderate';
    return 'Light';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff workload data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchWorkloadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/manager/tasks" 
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Staff Workload Report</h1>
                <p className="text-gray-600 mt-1">Monitor staff task distribution and workload balance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Services">Services</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Cleaning">Housekeeping</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {workloadData?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {workloadData.summary.totalStaff}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Workload</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.round(workloadData.summary.averageWorkload || 0)}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overloaded Staff</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    workloadData.summary.overloadedStaff > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {workloadData.summary.overloadedStaff}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  workloadData.summary.overloadedStaff > 0 ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <AlertCircle className={`w-6 h-6 ${
                    workloadData.summary.overloadedStaff > 0 ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Staff Workload Details</h2>
          </div>
          
          <div className="p-6">
            {workloadData?.staff?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workloadData.staff.map((staff) => (
                  <div key={staff.staffId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                          <p className="text-sm text-gray-600">{staff.position}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkloadColor(staff.workloadScore)}`}>
                        {getWorkloadLabel(staff.workloadScore)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        <span>{staff.department}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Tasks</p>
                        <p className="font-semibold text-gray-900">{staff.totalTasks}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="font-semibold text-green-600">{staff.completed}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">In Progress</p>
                        <p className="font-semibold text-blue-600">{staff.inProgress}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Pending</p>
                        <p className="font-semibold text-orange-600">{staff.pending}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Workload Score</span>
                        <span className={`font-bold ${getWorkloadColor(staff.workloadScore).split(' ')[0]}`}>
                          {Math.round(staff.workloadScore)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            staff.workloadScore >= 80 ? 'bg-red-500' :
                            staff.workloadScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(staff.workloadScore, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No staff data available</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffWorkloadPage;