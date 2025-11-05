import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/manager/ManagerButton";
import { Users, Circle, ChefHat, Wrench, Home, UserCircle, Loader2, AlertCircle } from "lucide-react";
import { fetchStaff } from "@/services/managerService";
import { toast } from "sonner";

const departments = ["All", "Housekeeping", "Maintenance", "Kitchen", "Service"];

const normalizeDepartmentName = (dept) => {
  const mapping = {
    cleaning: "Housekeeping",
    Maintenance: "Maintenance",
    Kitchen: "Kitchen",
    service: "Service",
  };
  return mapping[dept] || dept;
};

const getDepartmentConfig = (dept) => {
  const configs = {
    "All": { icon: Users, color: "from-indigo-400 to-purple-500", bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
    "Housekeeping": { icon: Home, color: "from-blue-400 to-cyan-500", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    "Service": { icon: UserCircle, color: "from-purple-400 to-pink-500", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    "Kitchen": { icon: ChefHat, color: "from-orange-400 to-red-500", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
    "Maintenance": { icon: Wrench, color: "from-emerald-400 to-green-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  };
  return configs[dept] || configs["All"];
};

export const StaffList = () => {
  const [selectedDept, setSelectedDept] = useState("All");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchStaff();
      const staffData = response?.data?.staff || response?.staff || response || [];
      
      // Transform staff data
      const transformedStaff = staffData.map((member) => {
        const isOnline = member.status === 'active' || member.isOnline || false;
        return {
          _id: member._id,
          name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
          role: member.role || member.position || 'Staff Member',
          status: isOnline ? 'online' : 'offline',
          avatar: member.name || member.email || 'user',
          department: normalizeDepartmentName(member.department || 'service'),
          email: member.email,
        };
      });

      setStaff(transformedStaff);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setError(err.message || 'Failed to load staff');
      toast.error('Failed to load staff data', {
        description: 'Unable to fetch staff information',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = selectedDept === "All" 
    ? staff 
    : staff.filter(s => s.department === selectedDept || s.department.toLowerCase() === selectedDept.toLowerCase());

  const onlineCount = filteredStaff.filter(s => s.status === "online").length;
  const offlineCount = filteredStaff.filter(s => s.status === "offline").length;

  if (error && staff.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-12"
      >
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">Failed to Load Staff</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button
            onClick={loadStaff}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold"
          >
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
    >
      <div className="mb-5">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-500" />
          Staff Availability
        </h3>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-gray-600 font-medium">Real-time staff status</p>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">{onlineCount} Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
              <span className="text-xs font-bold text-gray-600">{offlineCount} Offline</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {departments.map((dept) => {
          const isSelected = selectedDept === dept;
          const config = getDepartmentConfig(dept);
          const Icon = config.icon;
          return (
            <Button
              key={dept}
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => setSelectedDept(dept)}
              className={
                isSelected
                  ? `rounded-xl bg-gradient-to-r ${config.color} text-white px-4 py-2 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border-0`
                  : "rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              }
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {dept}
            </Button>
          );
        })}
      </div>

      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading staff members...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No staff members in this department</p>
          </div>
        ) : (
          filteredStaff.map((member, index) => {
            const deptConfig = getDepartmentConfig(member.department);
            return (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold">
                        {member.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        member.status === "online" ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                      animate={
                        member.status === "online"
                          ? { scale: [1, 1.15, 1] }
                          : {}
                      }
                      transition={
                        member.status === "online"
                          ? { duration: 2, repeat: Infinity }
                          : {}
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">{member.role}</p>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${deptConfig.bg} ${deptConfig.text} border ${deptConfig.border}`}>
                        <Circle className="h-2 w-2" fill="currentColor" />
                        {member.department}
                      </span>
                    </div>
                  </div>
                  <ManagerBadge
                    variant={member.status === "online" ? "default" : "secondary"}
                    className={
                      member.status === "online"
                        ? "bg-emerald-100 border-2 border-emerald-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 shadow-sm"
                        : "bg-gray-100 border-2 border-gray-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-gray-600 shadow-sm"
                    }
                  >
                    {member.status}
                  </ManagerBadge>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
