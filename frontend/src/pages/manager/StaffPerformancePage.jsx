import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText,
  Star,
  Clock,
  CheckCircle,
  TrendingUp,
  Mail,
  Phone,
  Award,
  BarChart3
} from "lucide-react";
import { fetchStaff } from "../../services/managerService";

const StaffPerformancePage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Mock data for now - you can replace with real API data
  const mockStaffData = [
    {
      id: 1,
      name: 'Carol Davis',
      department: 'Maintenance',
      role: 'maintenance',
      email: 'carol@hotel.com',
      phone: '+1-555-0103',
      avatar: '',
      rating: 4.9,
      completionRate: 98,
      avgTime: '25m',
      tasksCompleted: 87,
      isOnline: true,
      performance: 'Excellent',
      initials: 'CD',
      rank: 1
    },
    {
      id: 2,
      name: 'Alice Johnson',
      department: 'Kitchen',
      role: 'kitchen',
      email: 'alice@hotel.com',
      phone: '+1-555-0101',
      avatar: '',
      rating: 4.8,
      completionRate: 95,
      avgTime: '25m',
      tasksCompleted: 148,
      isOnline: true,
      performance: 'Excellent',
      initials: 'AJ',
      rank: 2
    },
    {
      id: 3,
      name: 'David Wilson',
      department: 'Server',
      role: 'server',
      email: 'david@hotel.com',
      phone: '+1-555-0104',
      avatar: '',
      rating: 4.7,
      completionRate: 96,
      avgTime: '30m',
      tasksCompleted: 171,
      isOnline: true,
      performance: 'Good',
      initials: 'DW',
      rank: 3
    },
    {
      id: 4,
      name: 'Bob Smith',
      department: 'Housekeeping',
      role: 'housekeeping',
      email: 'bob@hotel.com',
      phone: '+1-555-0102',
      avatar: '',
      rating: 4.6,
      completionRate: 96,
      avgTime: '35m',
      tasksCompleted: 195,
      isOnline: true,
      performance: 'Good',
      initials: 'BS',
      rank: 4
    },
    {
      id: 5,
      name: 'Eva Brown',
      department: 'Housekeeping',
      role: 'housekeeping',
      email: 'eva@hotel.com',
      phone: '+1-555-0105',
      avatar: '',
      rating: 4.5,
      completionRate: 95,
      avgTime: '32m',
      tasksCompleted: 127,
      isOnline: true,
      performance: 'Good',
      initials: 'EB',
      rank: 5
    },
    {
      id: 6,
      name: 'Michael Chen',
      department: 'Security',
      role: 'security',
      email: 'michael@hotel.com',
      phone: '+1-555-0106',
      avatar: '',
      rating: 4.4,
      completionRate: 92,
      avgTime: '40m',
      tasksCompleted: 89,
      isOnline: true,
      performance: 'Good',
      initials: 'MC',
      rank: 6
    },
    {
      id: 7,
      name: 'Sarah Martinez',
      department: 'Reception',
      role: 'receptionist',
      email: 'sarah@hotel.com',
      phone: '+1-555-0107',
      avatar: '',
      rating: 4.3,
      completionRate: 89,
      avgTime: '28m',
      tasksCompleted: 156,
      isOnline: false,
      performance: 'Good',
      initials: 'SM',
      rank: 7
    },
    {
      id: 8,
      name: 'James Rodriguez',
      department: 'Kitchen',
      role: 'chef',
      email: 'james@hotel.com',
      phone: '+1-555-0108',
      avatar: '',
      rating: 4.6,
      completionRate: 94,
      avgTime: '45m',
      tasksCompleted: 112,
      isOnline: true,
      performance: 'Good',
      initials: 'JR',
      rank: 8
    },
    {
      id: 9,
      name: 'Lisa Wang',
      department: 'Laundry',
      role: 'laundry',
      email: 'lisa@hotel.com',
      phone: '+1-555-0109',
      avatar: '',
      rating: 4.2,
      completionRate: 87,
      avgTime: '35m',
      tasksCompleted: 134,
      isOnline: true,
      performance: 'Average',
      initials: 'LW',
      rank: 9
    },
    {
      id: 10,
      name: 'Tom Anderson',
      department: 'Maintenance',
      role: 'technician',
      email: 'tom@hotel.com',
      phone: '+1-555-0110',
      avatar: '',
      rating: 4.1,
      completionRate: 85,
      avgTime: '50m',
      tasksCompleted: 98,
      isOnline: false,
      performance: 'Average',
      initials: 'TA',
      rank: 10
    },
    {
      id: 11,
      name: 'Emma Thompson',
      department: 'Concierge',
      role: 'concierge',
      email: 'emma@hotel.com',
      phone: '+1-555-0111',
      avatar: '',
      rating: 4.4,
      completionRate: 91,
      avgTime: '22m',
      tasksCompleted: 143,
      isOnline: true,
      performance: 'Good',
      initials: 'ET',
      rank: 11
    },
    {
      id: 12,
      name: 'Ryan Lee',
      department: 'Valet',
      role: 'valet',
      email: 'ryan@hotel.com',
      phone: '+1-555-0112',
      avatar: '',
      rating: 4.0,
      completionRate: 83,
      avgTime: '18m',
      tasksCompleted: 176,
      isOnline: true,
      performance: 'Average',
      initials: 'RL',
      rank: 12
    }
  ];

  useEffect(() => {
    setStaff(mockStaffData);
    setLoading(false);
  }, []);

  const topPerformers = staff.slice(0, 3);
  
  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-yellow-600';
      case 'Average': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-orange-500';
      case 2: return 'bg-blue-500'; 
      case 3: return 'bg-orange-400';
      default: return 'bg-gray-500';
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || member.department.toLowerCase() === filterDepartment.toLowerCase();
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Performance</h1>
            <p className="text-gray-600">Monitor and evaluate staff performance metrics</p>
          </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tasks, staff, or guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">Filter Staff</option>
              <option value="maintenance">Maintenance</option>
              <option value="kitchen">Kitchen</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="server">Server</option>
              <option value="security">Security</option>
              <option value="reception">Reception</option>
              <option value="laundry">Laundry</option>
              <option value="concierge">Concierge</option>
              <option value="valet">Valet</option>
            </select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
            />
          </div>
          
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Report
          </button>
        </div>
      </div>

      {/* Top 3 Performers Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Top 3 Performers This Month</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPerformers.map((performer) => (
            <div key={performer.id} className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              {/* Rank Badge */}
              <div className={`absolute top-4 right-4 w-8 h-8 ${getRankBadgeColor(performer.rank)} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                {performer.rank}
              </div>
              
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">{performer.initials}</span>
                </div>
              </div>
              
              {/* Name and Department */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">{performer.name}</h3>
                <p className="text-blue-100 capitalize">{performer.department}</p>
              </div>
              
              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{performer.rating}</span>
              </div>
              
              {/* Completion Rate */}
              <div className="text-center">
                <p className="text-blue-100 text-sm">{performer.completionRate}% completion rate</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Staff Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            {/* Header with Avatar and Basic Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">{member.initials}</span>
                </div>
                
                {/* Name and Department */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-gray-600 capitalize">{member.department}</p>
                </div>
              </div>
              
              {/* Rank Badge and Online Status */}
              <div className="flex items-center gap-2">
                {member.rank <= 3 && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                    member.rank === 1 ? 'bg-orange-500' : 
                    member.rank === 2 ? 'bg-blue-500' : 'bg-orange-400'
                  }`}>
                    Top {member.rank}
                  </div>
                )}
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Performance Rating */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Performance</span>
                <span className={`text-sm font-medium ${getPerformanceColor(member.performance)}`}>
                  {member.performance}
                </span>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Completion Rate */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-lg font-semibold text-gray-900">{member.completionRate}%</div>
                <div className="text-xs text-gray-500">Completion</div>
              </div>
              
              {/* Average Time */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-lg font-semibold text-gray-900">{member.avgTime}</div>
                <div className="text-xs text-gray-500">Avg Time</div>
              </div>
              
              {/* Tasks Completed */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-lg font-semibold text-gray-900">{member.tasksCompleted}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{member.phone}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                View Details
              </button>
              <button className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                Assign Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
  );
};

export default StaffPerformancePage;