import { motion } from "framer-motion";
import { Star } from "lucide-react";

/**
 * Workforce Snapshot Component
 * Displays department breakdown with task completion and satisfaction metrics
 */
export const WorkforceSnapshot = ({ departmentBreakdown = [] }) => {
  const colors = [
    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", bar: "from-blue-400 to-cyan-400" },
    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bar: "from-purple-400 to-pink-400" },
    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "from-emerald-400 to-green-400" },
    { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", bar: "from-orange-400 to-amber-400" },
    { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", bar: "from-pink-400 to-rose-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900">Workforce Snapshot</h2>
          <p className="text-sm text-gray-600 font-medium mt-1">Coverage by department and current load</p>
        </div>
        <div className="space-y-3">
          {departmentBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm font-medium">No department data available</p>
              <p className="text-xs mt-1">Data will appear once tasks are assigned</p>
            </div>
          ) : (
            departmentBreakdown.map((dept, index) => {
              const completionPct = Math.min(100, Math.round((dept.completed / (dept.totalTasks || 1)) * 100));
              const color = colors[index % colors.length];
              
              return (
                <motion.div
                  key={dept.department}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${color.bg} ${color.border} border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={`text-sm font-bold ${color.text}`}>{dept.department}</p>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        {dept.completed} / {dept.totalTasks} tasks completed
                      </p>
                    </div>
                    <span className={`text-lg font-black ${color.text}`}>{completionPct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 border border-gray-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color.bar} transition-all duration-500`}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="h-3.5 w-3.5 text-amber-500" fill="#f59e0b" />
                    <p className="text-xs text-gray-700 font-bold">
                      Satisfaction: {dept.satisfaction ?? "-"}/5
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};
