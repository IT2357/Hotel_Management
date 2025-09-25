import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import useAuth from "../../hooks/useAuth";
import { sendMessage, getMessages } from "../../services/messageService";
import staffService from "../../services/staffService";

// Module-scope department normalizer so all components can use it
function normalizeDepartment(value) {
  const key = String(value || "").toLowerCase().trim();
  const map = {
    chef: "kitchen",
    cheff: "kitchen",
    kitchen: "kitchen",
    maintenence: "maintenance",
    service: "service",
    cleaning: "cleaning",
    housekeeping: "cleaning",
  };
  return map[key] || key || "service";
}

// Simple icon components as fallbacks
const Bell = () => <span className="text-xl">🔔</span>;
const Clock = () => <span className="text-xl">⏰</span>;
const CheckCircle = () => <span className="text-xl">✅</span>;
const AlertTriangle = () => <span className="text-xl">⚠️</span>;
const Users = () => <span className="text-xl">👥</span>;
const Calendar = () => <span className="text-xl">📅</span>;
const Settings = () => <span className="text-xl">⚙️</span>;

export default function StaffDashboardPage() {
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [urgentAlerts, setUrgentAlerts] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Open tab from query string if provided (e.g., /staff/dashboard?tab=tasks)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  // Enhanced department mapping with debugging
  const roleDeptMap = {
    // Kitchen staff
    'chef': 'kitchen',
    'sous chef': 'kitchen',
    'cook': 'kitchen',
    'kitchen staff': 'kitchen',
    'kitchen': 'kitchen',
    
    // Maintenance staff
    'maintenance': 'maintenance',
    'maintenance staff': 'maintenance',
    'technician': 'maintenance',
    'engineer': 'maintenance',
    'handyman': 'maintenance',
    
    // Service staff
    'waiter': 'service',
    'waitress': 'service',
    'server': 'service',
    'host': 'service',
    'hostess': 'service',
    'front desk': 'service',
    'receptionist': 'service',
    'concierge': 'service',
    'service': 'service',
    
    // Cleaning staff
    'housekeeper': 'cleaning',
    'housekeeping': 'cleaning',
    'cleaner': 'cleaning',
    'maid': 'cleaning',
    'room attendant': 'cleaning',
    'cleaning': 'cleaning'
  };
  
  // Debug logging
  console.log('User:', user);
  console.log('User role:', user?.role);
  console.log('Staff profile position:', user?.staffProfile?.position);
  
  // Determine department based on user's email
  const getDepartmentFromEmail = (email) => {
    if (!email) return 'service'; // Default fallback
    
    if (email.includes('kitchen') || email === 'chefanoji@gmail.com') {
      return 'kitchen';
    } else if (email.includes('maintenance') || email === 'maintanenceanoji@gmail.com') {
      return 'maintenance';
    } else if (email.includes('cleaning') || email.includes('housekeeping')) {
      return 'cleaning';
    } else if (email.includes('service') || email.includes('reception') || email.includes('frontdesk')) {
      return 'service';
    }
    return 'service'; // Default fallback
  };
  
  // Get department from email first, then fall back to other methods
  const departmentFromEmail = getDepartmentFromEmail(user?.email || '');
  const position = (user?.staffProfile?.position || user?.role || '').toLowerCase().trim();
  const inferredDept = roleDeptMap[position] || departmentFromEmail || 'service';
  
  const department = (user?.staffProfile?.department?.toLowerCase()?.trim() || 
                     user?.department?.toLowerCase()?.trim() || 
                     inferredDept).toLowerCase();
  
  console.log('Department detection:', {
    email: user?.email,
    position: position,
    departmentFromEmail: departmentFromEmail,
    finalDepartment: department
  });

  // Department configuration with background images
  const departmentConfig = {
    maintenance: {
      name: "Maintenance",
      color: "blue",
      icon: "🔧",
      description: "Equipment repair, facility maintenance, and technical support",
      backgroundImage: "/images/maintanence-bg.jpg",
      backgroundStyle: {
        backgroundImage: 'url("/images/maintanence-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    },
    kitchen: {
      name: "Kitchen",
      color: "orange",
      icon: "👨‍🍳",
      description: "Food preparation, cooking, and kitchen operations",
      backgroundImage: "/images/kitchen-bg.jpg",
      backgroundStyle: {
        backgroundImage: 'url("/images/kitchen-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    },
    service: {
      name: "Service",
      color: "green",
      icon: "👔",
      description: "Guest services, concierge, and customer support",
      backgroundImage: "/images/service-bg.avif",
      backgroundStyle: {
        backgroundImage: 'url("/images/service-bg.avif")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    },
    cleaning: {
      name: "Cleaning",
      color: "purple",
      icon: "🧹",
      description: "Room cleaning, laundry, and facility maintenance",
      backgroundImage: "/images/cleaning-bg.webp",
      backgroundStyle: {
        backgroundImage: 'url("/images/cleaning-bg.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }
    }
  };

  // Ensure we have a valid department configuration
  const currentDept = departmentConfig[department] || departmentConfig.service;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Force re-render when user changes (important for switching between staff members)
  useEffect(() => {
    if (user) {
      console.log("User changed:", user);
      console.log("Staff Profile:", user.staffProfile);
      console.log("Department:", department);
    }
  }, [user, department]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch notifications, alerts, and stats
      // This would be implemented with your API calls
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "tasks", label: "My Tasks", icon: "📋" },
    { id: "contact", label: "Contact Manager", icon: "💬" },
    { id: "notifications", label: "Notifications", icon: "🔔" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Enhanced debug logging
  console.group('🚀 Department Debug Info');
  console.log('🔍 User:', user);
  console.log('👤 User Role:', user?.role);
  console.log('👔 Staff Position:', user?.staffProfile?.position);
  console.log('🏢 Department from Profile:', user?.staffProfile?.department || user?.department);
  console.log('🎯 Final Department:', department);
  console.log('🖼️  Current Dept Config:', currentDept);
  console.log('🖼️  Background Image Path:', currentDept.backgroundImage);
  console.log('🔄 Current URL:', window.location.href);
  console.groupEnd();
  
  // Check if background image exists
  const img = new Image();
  img.src = currentDept.backgroundImage;
  img.onload = () => console.log('✅ Background image loaded successfully:', currentDept.backgroundImage);
  img.onerror = () => console.error('❌ Failed to load background image:', currentDept.backgroundImage);
  
  // Log the full image path for debugging
  console.log('🔍 Full image URL:', new URL(currentDept.backgroundImage, window.location.origin).href);

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200 relative">
      {/* Background Image with Overlay - Using inline style for debugging */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${currentDept.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          border: '1px solid red' // Temporary border to make the background div visible
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Header */}
      <header className="relative overflow-hidden shadow-lg border-b border-white/20 h-56 md:h-64">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"></div>
        <div className="absolute inset-0 bg-white/10 dark:bg-gray-900/30 backdrop-blur-[1px]"></div>

        {/* Top Right Corner Icons */}
        <div className="absolute top-4 right-4 z-30 flex items-center space-x-3">
          {/* Bell Icon */}
          <div className="relative group">
            <button className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-110">
              <Bell />
            </button>
            {urgentAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                {urgentAlerts.length}
              </span>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="group relative px-6 py-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white rounded-2xl shadow-2xl hover:shadow-red-500/25 transform hover:scale-110 hover:-translate-y-1 transition-all duration-500 font-bold overflow-hidden border border-red-400/30 backdrop-blur-sm"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></span>
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl animate-pulse"></span>
            <span className="relative flex items-center space-x-2">
              <span className="text-lg animate-bounce">🚪</span>
              <span>Logout</span>
            </span>
          </button>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="flex items-center space-x-5">
            <div className={`p-4 rounded-2xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/30 shadow-2xl` }>
              <span className="text-4xl filter drop-shadow-lg">{currentDept.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl">
                Valdor Hotel - {currentDept.name} Department
              </h1>
              <p className="text-white/90 dark:text-gray-200 text-base md:text-lg font-medium drop-shadow-lg">
                Welcome back! Here's what's happening in {currentDept.name.toLowerCase()} today.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-white/30 dark:border-gray-800/50 h-screen px-6 py-6 shadow-xl overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                  {user?.name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.staffProfile?.position}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-left transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-indigo-400"
                    : "text-gray-700 hover:bg-white/60 dark:text-gray-200 dark:hover:bg-gray-800/60 backdrop-blur-sm border border-transparent hover:border-white/40 hover:shadow-md"
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-white/20 shadow-inner"
                    : "bg-gray-100/50 dark:bg-gray-700/50 group-hover:bg-white/70 dark:group-hover:bg-gray-600/70"
                }`}>
                  <span className="text-xl">{tab.icon}</span>
                </div>
                <span className="font-semibold text-base">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen container mx-auto px-4 py-8 relative z-10 overflow-y-auto">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 dark:border-gray-800/50 p-6 min-h-[calc(100vh-12rem)]">
            {activeTab === "overview" && <OverviewTab user={user} department={department} setActiveTab={setActiveTab} />}
            {activeTab === "tasks" && <TasksTab user={user} department={department} />}
            {activeTab === "contact" && <ContactManagerTab user={user} department={department} />}
            {activeTab === "notifications" && <NotificationsTab user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ user, department, setActiveTab }) {
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskStats();
  }, [department]);

  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      // Fetch task statistics for the department via API client (baseURL=/api/v1)
      const data = await staffService.getTaskStats({ department });
      setTaskStats(data?.data || data || {});
      setLoading(false);
    } catch (error) {
      console.error("Error fetching task stats:", error);
      // Fallback to mock data
      setTaskStats({
        totalTasks: 10,
        pendingTasks: 8,
        completedTasks: 2,
        urgentTasks: 3
      });
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Tasks",
      value: taskStats.totalTasks || "10",
      change: "+2",
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Pending Tasks",
      value: taskStats.pendingTasks || "8",
      change: "-1",
      icon: Clock,
      color: "yellow"
    },
    {
      title: "Urgent Tasks",
      value: taskStats.urgentTasks || "3",
      change: "+1",
      icon: AlertTriangle,
      color: "red"
    },
    {
      title: "Completed Today",
      value: taskStats.completedTasks || "2",
      change: "+2",
      icon: CheckCircle,
      color: "blue"
    }
  ];

  return (
    <div className="space-y-8 relative">
      {/* Clean background (removed neon gradients) */}

      {/* Clean Welcome Header */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h2>
            <div className="text-2xl">👋</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              {department} Department Active
            </p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg font-medium">
          {`Here's what's happening in ${String(department).toLowerCase()} today.` }
        </p>
      </div>

      {/* Stats Grid - dark rounded cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="relative"
            style={{ animationDelay: `${index * 150}ms`  }}
          >
            <div className="relative rounded-2xl bg-gray-900/80 dark:bg-gray-800 text-gray-100 border border-gray-700 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">{stat.title}</p>
                  <p className="text-4xl font-extrabold tracking-tight">{stat.value}</p>
                </div>
                <div className="shrink-0 rounded-xl bg-gray-700/70 p-3">
                  <stat.icon />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-gray-700/70 px-2.5 py-0.5 text-xs font-semibold text-gray-200">
                  {stat.change}
                </span>
                <span className="text-xs text-gray-400">from yesterday</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700/40 overflow-hidden">
            <div className="relative bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6 border-b border-white/20 dark:border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-50 animate-pulse"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <span className="text-2xl filter drop-shadow-sm">⚡</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Navigate to key sections</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <button onClick={() => setActiveTab("tasks")} className="group w-full text-left p-5 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 hover:border-blue-400/50 hover:shadow-2xl backdrop-blur-sm transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-30 animate-pulse"></div>
                    <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                      <span className="text-2xl filter drop-shadow-sm">📋</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">View My Tasks</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Manage your assignments</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
                    <span className="text-2xl text-blue-500 animate-bounce">→</span>
                  </div>
                </div>
              </button>

              <button onClick={() => setActiveTab("contact")} className="group w-full text-left p-5 rounded-2xl border-2 border-transparent bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 hover:border-green-400/50 hover:shadow-2xl backdrop-blur-sm transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur opacity-30 animate-pulse"></div>
                    <div className="relative p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                      <span className="text-2xl filter drop-shadow-sm">💬</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">Contact Manager</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Send messages & requests</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
                    <span className="text-2xl text-green-500 animate-bounce">→</span>
                  </div>
                </div>
              </button>

              <button onClick={() => setActiveTab("notifications")} className="group w-full text-left p-5 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/30 dark:to-pink-900/30 hover:border-purple-400/50 hover:shadow-2xl backdrop-blur-sm transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-30 animate-pulse"></div>
                    <div className="relative p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl group-hover:rotate-12 transition-transform duration-500">
                      <span className="text-2xl filter drop-shadow-sm">🔔</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">Check Notifications</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">View updates & alerts</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
                    <span className="text-2xl text-purple-500 animate-bounce">→</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-teal-600 to-green-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700/40 overflow-hidden">
            <div className="relative bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-green-500/10 p-6 border-b border-white/20 dark:border-gray-700/30">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl blur opacity-50 animate-pulse"></div>
                  <div className="relative p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                    <span className="text-2xl filter drop-shadow-sm">📈</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Latest updates</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="group flex items-center space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Task "Fix Room 205 AC" completed</span>
                  <span className="block text-xs text-gray-400 font-medium">2 hours ago</span>
                </div>
              </div>
              <div className="group flex items-center space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></div>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">New task assigned: "Kitchen equipment maintenance"</span>
                  <span className="block text-xs text-gray-400 font-medium">4 hours ago</span>
                </div>
              </div>
              <div className="group flex items-center space-x-4 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-amber-50/50 dark:hover:from-yellow-900/20 dark:hover:to-amber-900/20 transition-all duration-300">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-30"></div>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Schedule updated for next week</span>
                  <span className="block text-xs text-gray-400 font-medium">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tasks Tab Component
function TasksTab({ user, department }) {
  const [activeTaskView, setActiveTaskView] = useState("total");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasksFromApi();
  }, [department, user]);

  const fetchTasksFromApi = async () => {
    try {
      setLoading(true);
      // Load tasks for the current department; backend route: GET /api/v1/staff/tasks
      const normalized = normalizeDepartment(department);
      // Prefer fetching tasks assigned to the current user. Backend route: GET /api/v1/staff/tasks/my
      // Include department as a filter if your backend supports it; otherwise it will be ignored safely.
      const data = await staffService.getMyTasks({ department: normalized });
      let received = data?.data?.tasks || data?.tasks || (Array.isArray(data) ? data : []);
      // Ensure minimum fields exist for rendering (createdAt used in TaskCard)
      if (Array.isArray(received)) {
        received = received.map((t) => ({
          ...t,
          createdAt: t?.createdAt || t?.dueDate || new Date().toISOString(),
        }));
      }
      console.debug("[TasksTab] API tasks received:", Array.isArray(received) ? received.length : typeof received);
      if (!received || received.length === 0) {
        // Attempt department-wide tasks as a fallback in case assignments don't match the current user
        try {
          const deptData = await staffService.getTasks({ department: normalized });
          let deptTasks = deptData?.data?.tasks || deptData?.tasks || (Array.isArray(deptData) ? deptData : []);
          if (Array.isArray(deptTasks)) {
            deptTasks = deptTasks.map((t) => ({
              ...t,
              createdAt: t?.createdAt || t?.dueDate || new Date().toISOString(),
            }));
          }
          if (deptTasks && deptTasks.length > 0) {
            console.debug("[TasksTab] using department tasks fallback");
            setTasks(deptTasks);
            return;
          }
        } catch (innerErr) {
          console.warn("[TasksTab] department tasks fallback failed:", innerErr);
        }
        // Fallback to department-specific sample tasks
        const samples = generateSampleTasks(normalized, user);
        console.debug("[TasksTab] using fallback sample tasks:", samples.length);
        setTasks(samples);
      } else {
        console.debug("[TasksTab] using API tasks");
        setTasks(received);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      // Fallback to department-specific sample tasks on error
      const dept = normalizeDepartment(department);
      const samples = generateSampleTasks(dept, user);
      console.debug("[TasksTab] error fallback sample tasks:", samples.length);
      setTasks(samples);
    } finally {
      console.debug("[TasksTab] loading complete");
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    switch (activeTaskView) {
      case "pending":
        return tasks.filter(task => task.status === "pending" || task.status === "process");
      case "urgent":
        return tasks.filter(task => task.priority === "urgent" || task.isUrgent);
      case "total":
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const pendingTasks = tasks.filter(task => task.status === "pending" || task.status === "process");
  const urgentTasks = tasks.filter(task => task.priority === "urgent" || task.isUrgent);

  const taskViews = [
    { id: "total", label: "Total Tasks", count: tasks.length, icon: "📋", color: "blue" },
    { id: "pending", label: "Pending Tasks", count: pendingTasks.length, icon: "⏳", color: "yellow" },
    { id: "urgent", label: "Urgent Tasks", count: urgentTasks.length, icon: "🚨", color: "red" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Clean Header */}
      <div className="relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              My Tasks
            </h2>
            <div>📋</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">View and manage your assigned tasks</p>
          </div>
        </div>
      </div>

      {/* Task Summary Cards - clean style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {taskViews.map((view, index) => (
          <div
            key={view.id}
            onClick={() => setActiveTaskView(view.id)}
            className="relative cursor-pointer"
            style={{ animationDelay: `${index * 150}ms`  }}
          >
            <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ${
              activeTaskView === view.id ? 'ring-2 ring-indigo-500' : ''
            }`}>
              <div className="relative p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700">
                      <span className="text-xs">{view.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">{view.label}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {view.count}
                      </p>
                    </div>
                  </div>
                  {activeTaskView === view.id && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">ACTIVE</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task List - clean style */}
      <div className="relative">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px]">
          <div className="relative p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {taskViews.find(v => v.id === activeTaskView)?.label}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {filteredTasks.length} tasks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No {activeTaskView} tasks available at the moment.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredTasks.map((task, index) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    onStatusChange={(taskId, newStatus) => {
                      setTasks(prevTasks =>
                        prevTasks.map(t =>
                          t._id === taskId ? { ...t, status: newStatus } : t
                        )
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Manager Tab Component
function ContactManagerTab({ user, department }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Load existing messages/conversations
    loadMessages();

    // Set up polling to check for new messages every 30 seconds
    const intervalId = setInterval(loadMessages, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages();
      // Handle different response structures
      const messagesData = response.data || response;

      if (!Array.isArray(messagesData)) {
        console.error('Expected array of messages, got:', messagesData);
        setMessages([]);
        setError('Invalid response format from server');
        return;
      }

      // Transform backend data to match frontend format
      const transformedMessages = messagesData.map(msg => ({
        id: msg._id,
        type: msg.type,
        priority: msg.priority,
        subject: msg.subject,
        message: msg.message,
        timestamp: new Date(msg.createdAt),
        status: msg.status,
        department: msg.department,
        response: msg.response ? {
          message: msg.response.message,
          timestamp: new Date(msg.response.respondedAt)
        } : null
      }));

      // Filter messages by department if needed
      const filteredMessages = transformedMessages.filter(msg =>
        msg.department === department || msg.department === 'all'
      );

      setMessages(filteredMessages);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const messageData = {
        type: messageType,
        priority: priority,
        subject: getSubjectFromType(messageType),
        message: newMessage,
        department: normalizeDepartment(department)
      };

      // Send message to backend
      const response = await sendMessage(messageData);

      // Handle different response structures
      const messageDataResponse = response.data || response;

      if (!messageDataResponse || !messageDataResponse._id) {
        console.error('Invalid response from sendMessage:', messageDataResponse);
        throw new Error('Invalid response format from server');
      }

      // Transform backend response to match frontend format
      const newMsg = {
        id: messageDataResponse._id,
        type: messageDataResponse.type,
        priority: messageDataResponse.priority,
        subject: messageDataResponse.subject,
        message: messageDataResponse.message,
        timestamp: new Date(messageDataResponse.createdAt),
        status: messageDataResponse.status,
        department: messageDataResponse.department,
        response: null
      };

      // Add to messages
      setMessages(prev => [newMsg, ...prev]);

      // Show success message
      setSuccess('Message sent successfully!');

      // Clear form
      setNewMessage("");
      setMessageType("general");
      setPriority("medium");

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectFromType = (type) => {
    const subjects = {
      general: "General Inquiry",
      request: "Resource Request",
      complaint: "Issue Report",
      schedule: "Schedule Request",
      emergency: "Emergency Alert"
    };
    return subjects[type] || "Message";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>

      {/* Header with animated title */}
      <div className="relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 animate-pulse"></div>
              <h2 className="relative text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Contact Manager
              </h2>
            </div>
            <div className="animate-bounce">💬</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Connected to Management</p>
          </div>
        </div>
      </div>

      {/* Enhanced New Message Form */}
      <div className="group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700/40 overflow-hidden">
          <div className="relative bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-6 border-b border-white/20 dark:border-gray-700/30">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur opacity-50 animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <span className="text-2xl filter drop-shadow-sm">✉️</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Compose Message
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Send a message to your manager</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
                <p>{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                  <span>🏷️</span>
                  <span>Message Type</span>
                </label>
                <div className="relative">
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-transparent bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-700/90 dark:to-gray-800/90 backdrop-blur-sm rounded-2xl text-gray-900 dark:text-gray-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all duration-300 hover:shadow-lg appearance-none cursor-pointer font-bold"
                  >
                    <option value="general" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">💬 General Inquiry</option>
                    <option value="request" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">📋 Resource Request</option>
                    <option value="complaint" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">⚠️ Issue Report</option>
                    <option value="schedule" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">📅 Schedule Request</option>
                    <option value="emergency" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">🚨 Emergency Alert</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">▼</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Priority Level</span>
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-transparent bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-700/90 dark:to-gray-800/90 backdrop-blur-sm rounded-2xl text-gray-900 dark:text-gray-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all duration-300 hover:shadow-lg appearance-none cursor-pointer font-bold"
                  >
                    <option value="low" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">🟢 Low Priority</option>
                    <option value="medium" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">🟡 Medium Priority</option>
                    <option value="high" className="text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800">🔴 High Priority</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">▼</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
                <span>✍️</span>
                <span>Your Message</span>
              </label>
              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here... Be specific and clear about your request."
                  rows={5}
                  className="w-full px-5 py-4 border-2 border-transparent bg-gradient-to-br from-white/80 via-gray-50/80 to-white/80 dark:from-gray-800/80 dark:via-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm rounded-2xl text-gray-900 dark:text-gray-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all duration-300 hover:shadow-lg resize-none font-medium placeholder-gray-500 dark:placeholder-gray-400"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                  {newMessage.length}/500
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim()}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 font-bold overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[160px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <span className="relative flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl animate-bounce">🚀</span>
                      <span>Send Message</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Message History */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl blur opacity-20"></div>
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-gray-700/40 overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6 border-b border-white/20 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-50 animate-pulse"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <span className="text-2xl filter drop-shadow-sm">📨</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Message History
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {messages.length} conversations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative text-gray-400 text-6xl mb-4 animate-bounce">💬</div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No messages yet</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Send your first message to your manager using the form above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/30 dark:divide-gray-700/50">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="group p-6 hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/60 dark:hover:from-gray-700/60 dark:hover:to-gray-800/60 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-lg"
                    style={{ animationDelay: `${index * 100}ms`  }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur opacity-30 animate-pulse"></div>
                          <div className="relative p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                            <span className="text-lg filter drop-shadow-sm">{getTypeIcon(message.type)}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{message.subject}</h4>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${getPriorityGradient(message.priority)} text-white shadow-lg` }>
                              {message.priority.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${getStatusGradient(message.status)} text-white shadow-lg animate-pulse` }>
                              {message.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {message.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
                        <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                          {message.message}
                        </p>
                      </div>
                    </div>

                    {message.response && (
                      <div className="mt-6 relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-emerald-400/30 rounded-2xl blur opacity-50 animate-pulse"></div>
                        <div className="relative pl-6 border-l-4 border-gradient-to-b from-green-400 to-emerald-500">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                              <span className="text-lg filter drop-shadow-sm">👨‍💼</span>
                            </div>
                            <div>
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">Manager Response</span>
                              <span className="block text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {message.response.timestamp.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl blur"></div>
                            <div className="relative bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/40 dark:to-emerald-900/40 backdrop-blur-sm p-4 rounded-2xl border border-green-200/50 dark:border-green-700/50 shadow-inner">
                              <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                {message.response.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for ContactManagerTab
const getTypeIcon = (type) => {
  const icons = {
    general: "💬",
    request: "📋",
    complaint: "⚠️",
    schedule: "📅",
    emergency: "🚨"
  };
  return icons[type] || "💬";
};

const getPriorityGradient = (priority) => {
  switch (priority) {
    case "high":
      return "from-red-400 via-red-500 to-red-600";
    case "medium":
      return "from-amber-400 via-orange-500 to-yellow-600";
    case "low":
      return "from-emerald-400 via-green-500 to-teal-600";
    default:
      return "from-gray-400 via-gray-500 to-gray-600";
  }
};

const getStatusGradient = (status) => {
  switch (status) {
    case "pending":
      return "from-amber-400 to-orange-500";
    case "responded":
      return "from-emerald-400 to-green-500";
    case "closed":
      return "from-gray-400 to-gray-500";
    default:
      return "from-blue-400 to-indigo-500";
  }
};

// Notifications Tab Component
function NotificationsTab({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <button className="group relative px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold overflow-hidden">
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center space-x-2">
            <span>✓</span>
            <span>Mark all as read</span>
          </span>
        </button>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/30">
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center py-8">
            Notification system will be implemented here with real-time updates.
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Task Card Component for displaying individual tasks
function TaskCard({ task, onStatusChange, index = 0 }) {
  // Initialize state with task status or default to 'pending'
  const [selectedStatus, setSelectedStatus] = useState(task?.status || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(task?.timeRemaining || 0);

  // Update selectedStatus when task prop changes
  useEffect(() => {
    if (task?.status) {
      setSelectedStatus(task.status);
    }
  }, [task?.status]);

  // Update time remaining for completed tasks
  useEffect(() => {
    let interval;
    if (selectedStatus === 'completed' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedStatus, timeRemaining]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "process":
        return "🔄";
      case "completed":
        return "✅";
      default:
        return "⏳";
    }
  };

  const getStatusGradient = (status) => {
    switch (status) {
      case "pending":
        return "from-amber-400 to-yellow-500";
      case "process":
        return "from-blue-400 to-indigo-500";
      case "completed":
        return "from-emerald-400 to-green-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "pending":
        return "text-amber-600 dark:text-amber-400";
      case "process":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
        return "text-emerald-600 dark:text-emerald-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityGradient = (priority) => {
    switch (priority) {
      case "urgent":
        return "from-red-500 via-red-600 to-rose-600";
      case "high":
        return "from-orange-500 via-amber-600 to-yellow-600";
      case "medium":
        return "from-blue-500 via-indigo-600 to-purple-600";
      case "low":
        return "from-emerald-500 via-green-600 to-teal-600";
      default:
        return "from-gray-500 via-slate-600 to-zinc-600";
    }
  };

  const getLocationIcon = (location) => {
    switch (location) {
      case "room":
        return "🏠";
      case "lobby":
        return "🏛️";
      case "kitchen":
        return "👨‍🍳";
      case "pool":
        return "🏊‍♂️";
      case "gym":
        return "💪";
      default:
        return "📍";
    }
  };

  const handleStatusChange = async (newStatus) => {
    console.log('handleStatusChange called with status:', newStatus);

    if (!task?._id) {
      const errorMsg = 'Task ID is missing';
      console.error(errorMsg, { task });
      alert(errorMsg);
      return false;
    }

    // Don't do anything if status hasn't changed or if already updating
    if (newStatus === task.status || isUpdating) {
      console.log('Status unchanged or already updating, skipping update');
      return true;
    }

    setIsUpdating(true);

    try {
      // Optimistically update the UI
      setSelectedStatus(newStatus);
      if (onStatusChange) {
        onStatusChange(task._id, newStatus);
      }

      // If marking as completed, start the grace period timer
      if (newStatus === 'completed') {
        setTimeRemaining(900); // 15 minutes in seconds
      }

      // Check if this is a mock task (timestamp-based ID) - skip backend call for demo
      const isMockTask = /^\d{13}$/.test(task._id); // 13-digit timestamp ID
      if (isMockTask) {
        console.log('Mock task detected, skipping backend call for demo purposes');
        // Simulate successful response for mock tasks
        setTimeout(() => {
          console.log('Mock task status updated successfully');
        }, 500);
        return true;
      }

      // Send to backend for real tasks
      console.log('Sending status update to backend', {
        taskId: task._id,
        newStatus,
        previousStatus: task.status
      });

      const response = await staffService.updateTaskStatus(task._id, { status: newStatus });
      console.log('Backend response:', response);

      if (!response?.success) {
        const errorMsg = response?.message || 'Failed to update task status';
        console.error('Backend error:', errorMsg, { response });
        throw new Error(errorMsg);
      }

      console.log('Task status updated successfully');

      return true;
    } catch (error) {
      console.error('Error updating task status:', error);

      // Revert optimistic update on error
      setSelectedStatus(task.status);
      if (onStatusChange) {
        onStatusChange(task._id, task.status);
      }

      // Show error to user
      alert(`Failed to update status: ${error.message || 'Please try again'}`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="group relative p-6 hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/60 dark:hover:from-gray-700/60 dark:hover:to-gray-800/60 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-xl"
      style={{ animationDelay: `${index * 100}ms`  }}
    >
      {/* Animated border gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-r-full"></div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className={`absolute inset-0 rounded-xl blur opacity-30 animate-pulse bg-gradient-to-r ${getStatusGradient(selectedStatus)}` }></div>
              <div className={`relative p-2 rounded-xl shadow-lg bg-gradient-to-r ${getStatusGradient(selectedStatus)} group-hover:rotate-6 transition-transform duration-300` }>
                <span className="text-lg filter drop-shadow-sm">{getStatusIcon(selectedStatus)}</span>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                {task.title}
              </h4>
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <span className={`px-4 py-2 text-xs font-bold rounded-full text-white shadow-lg bg-gradient-to-r ${getPriorityGradient(task.priority)} transform group-hover:scale-110 transition-all duration-300 animate-pulse` }>
                  {task.priority.toUpperCase()}
                </span>
                <span className={`px-4 py-2 text-xs font-bold rounded-full text-white shadow-lg bg-gradient-to-r ${getStatusGradient(selectedStatus)} transform group-hover:scale-110 transition-all duration-300` }>
                  {selectedStatus.toUpperCase()}
                </span>
                {task.isUrgent && (
                  <span className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white rounded-full shadow-xl animate-bounce border-2 border-red-300 transform group-hover:scale-110 transition-all duration-300">
                    🚨 URGENT
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
              <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{task.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50 group-hover:shadow-lg transition-all duration-300">
              <span className="text-lg">{getLocationIcon(task.location)}</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{task.location}</span>
            </div>
            {task.roomNumber && (
              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/50 group-hover:shadow-lg transition-all duration-300">
                <span className="text-lg">🏠</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Room {task.roomNumber}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200/50 dark:border-green-700/50 group-hover:shadow-lg transition-all duration-300">
              <span className="text-lg">📂</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{task.category}</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl border border-orange-200/50 dark:border-orange-700/50 group-hover:shadow-lg transition-all duration-300">
              <span className="text-lg">⏱️</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{task.estimatedDuration} min</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-xl border border-cyan-200/50 dark:border-cyan-700/50 group-hover:shadow-lg transition-all duration-300">
              <span className="text-lg">📅</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-start space-x-4">
            <div className="relative group/select">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl blur opacity-0 group-hover/select:opacity-30 transition-opacity duration-300"></div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="relative appearance-none px-5 py-3 pr-10 text-sm font-bold border-2 border-transparent bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-2xl text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-indigo-400/20 focus:border-indigo-400 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              >
               <option value="pending" style={{color: 'black'}}>⏳ Pending</option>
              <option value="process" style={{color: 'black'}}>🔄 In Progress</option>
              <option value="completed" style={{color: 'black'}}>✅ Completed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">▼</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleStatusChange(selectedStatus)}
              disabled={selectedStatus === task.status || isUpdating}
              className={`group relative px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 font-semibold ${
                selectedStatus === task.status || isUpdating
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl'
              }`}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
              <span className="relative flex items-center space-x-2">
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Timer display below status button */}
          {selectedStatus === 'completed' && timeRemaining > 0 && (
            <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
              <span className="text-lg">⏰</span>
              <span>Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function generateSampleTasks(department, user) {
  const baseId = Date.now();

  const taskTemplates = {
    maintenance: [
      {
        title: "Fix AC in Room 205",
        description: "Guest reported AC not working properly. Need to check and repair the cooling system.",
        category: "hvac",
        priority: "high",
        status: "pending",
        location: "room",
        roomNumber: "205",
        estimatedDuration: 45,
        isUrgent: false
      },
      {
        title: "Replace light bulbs in lobby",
        description: "Several light bulbs in the main lobby area need replacement.",
        category: "electrical",
        priority: "medium",
        status: "process",
        location: "lobby",
        estimatedDuration: 30,
        isUrgent: false
      },
      {
        title: "Fix leaking faucet in Room 312",
        description: "Guest reported a leaking bathroom faucet that needs immediate attention.",
        category: "plumbing",
        priority: "urgent",
        status: "pending",
        location: "room",
        roomNumber: "312",
        estimatedDuration: 60,
        isUrgent: true
      },
      {
        title: "Elevator maintenance check",
        description: "Monthly elevator safety and maintenance inspection.",
        category: "general",
        priority: "medium",
        status: "completed",
        location: "other",
        estimatedDuration: 90,
        isUrgent: false
      },
      {
        title: "Pool filtration system repair",
        description: "Pool filtration system showing error codes, needs diagnostic and repair.",
        category: "general",
        priority: "high",
        status: "pending",
        location: "pool",
        estimatedDuration: 120,
        isUrgent: false
      }
    ],
    kitchen: [
      {
        title: "Prepare breakfast buffet",
        description: "Set up and prepare breakfast buffet for hotel guests.",
        category: "food_preparation",
        priority: "high",
        status: "completed",
        location: "kitchen",
        estimatedDuration: 60,
        isUrgent: false
      },
      {
        title: "Clean and sanitize prep area",
        description: "Deep clean and sanitize all food preparation surfaces and equipment.",
        category: "cleaning",
        priority: "medium",
        status: "process",
        location: "kitchen",
        estimatedDuration: 45,
        isUrgent: false
      },
      {
        title: "Inventory check - dairy products",
        description: "Check expiration dates and stock levels for all dairy products.",
        category: "inventory",
        priority: "medium",
        status: "pending",
        location: "kitchen",
        estimatedDuration: 30,
        isUrgent: false
      },
      {
        title: "Fix commercial oven temperature",
        description: "Oven not reaching proper temperature, affecting cooking times.",
        category: "equipment",
        priority: "urgent",
        status: "pending",
        location: "kitchen",
        estimatedDuration: 90,
        isUrgent: true
      },
      {
        title: "Prepare special dietary meals",
        description: "Prepare gluten-free and vegan options for guests with dietary restrictions.",
        category: "cooking",
        priority: "high",
        status: "process",
        location: "kitchen",
        estimatedDuration: 75,
        isUrgent: false
      }
    ],
    service: [
      {
        title: "Guest transportation request",
        description: "Guest in Room 301 needs transportation to airport at 2 PM.",
        category: "transportation",
        priority: "medium",
        status: "pending",
        location: "lobby",
        roomNumber: "301",
        estimatedDuration: 20,
        isUrgent: false
      },
      {
        title: "VIP guest welcome setup",
        description: "Prepare welcome amenities and room setup for VIP guest arrival.",
        category: "guest_request",
        priority: "high",
        status: "process",
        location: "room",
        roomNumber: "501",
        estimatedDuration: 40,
        isUrgent: false
      },
      {
        title: "Handle guest complaint",
        description: "Guest complaint about noise levels, needs immediate attention and resolution.",
        category: "guest_request",
        priority: "urgent",
        status: "pending",
        location: "room",
        roomNumber: "203",
        estimatedDuration: 30,
        isUrgent: true
      },
      {
        title: "Concierge tour booking",
        description: "Arrange city tour bookings for group of 8 guests.",
        category: "concierge",
        priority: "medium",
        status: "completed",
        location: "lobby",
        estimatedDuration: 25,
        isUrgent: false
      },
      {
        title: "Room service delivery",
        description: "Deliver dinner order to Room 408 - special dietary requirements.",
        category: "room_service",
        priority: "high",
        status: "pending",
        location: "room",
        roomNumber: "408",
        estimatedDuration: 15,
        isUrgent: false
      }
    ],
    cleaning: [
      {
        title: "Deep clean Room 102",
        description: "Guest checked out. Room needs deep cleaning and sanitization.",
        category: "deep_cleaning",
        priority: "high",
        status: "pending",
        location: "room",
        roomNumber: "102",
        estimatedDuration: 90,
        isUrgent: false
      },
      {
        title: "Laundry - bed linens",
        description: "Process and clean bed linens from checkout rooms.",
        category: "laundry",
        priority: "medium",
        status: "process",
        location: "other",
        estimatedDuration: 120,
        isUrgent: false
      },
      {
        title: "Restock housekeeping supplies",
        description: "Restock cleaning supplies and amenities on floors 2 and 3.",
        category: "restocking",
        priority: "medium",
        status: "completed",
        location: "other",
        estimatedDuration: 45,
        isUrgent: false
      },
      {
        title: "Emergency spill cleanup",
        description: "Large spill in main corridor needs immediate cleanup and safety measures.",
        category: "cleaning",
        priority: "urgent",
        status: "pending",
        location: "other",
        estimatedDuration: 20,
        isUrgent: true
      },
      {
        title: "Gym equipment sanitization",
        description: "Daily sanitization of all gym equipment and surfaces.",
        category: "cleaning",
        priority: "high",
        status: "process",
        location: "gym",
        estimatedDuration: 60,
        isUrgent: false
      }
    ]
  };

  const templates = taskTemplates[department] || taskTemplates.service;

  return templates.map((template, index) => ({
    ...template,
    _id: `${baseId + index}`,
    assignedTo: {
      id: user?.id || 'user1',
      name: user?.name || 'Current User'
    },
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random date within last week
  }));
}