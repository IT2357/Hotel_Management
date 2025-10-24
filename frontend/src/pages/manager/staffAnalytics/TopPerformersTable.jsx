import { motion } from "framer-motion";
import { Award } from "lucide-react";

/**
 * Top Performers Table Component
 * Displays staff members with highest completion rates and quality scores
 */
export const TopPerformersTable = ({ topPerformers = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
    >
      <div className="mb-5">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Award className="h-6 w-6 text-amber-500" />
          Top Performers
        </h2>
        <p className="text-sm text-gray-600 font-medium mt-1">
          Highest completion rate and quality scores
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-y-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Team member</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Role</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Tasks</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Rate</th>
              <th className="px-4 py-3 text-left font-bold text-gray-700">Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {topPerformers.map((member, index) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-bold text-gray-900">{member.name}</td>
                <td className="px-4 py-3 text-gray-600 font-medium">{member.role || "-"}</td>
                <td className="px-4 py-3 text-gray-900 font-semibold">{member.tasksCompleted}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    {member.completionRate}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {member.avgQualityScore?.toFixed?.(1) ?? member.avgQualityScore ?? "-"}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {topPerformers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm font-medium">No performance data available yet</p>
            <p className="text-xs mt-1">Top performers will appear as staff complete tasks</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
