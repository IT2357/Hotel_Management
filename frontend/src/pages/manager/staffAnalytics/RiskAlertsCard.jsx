import { motion } from "framer-motion";
import { AlertTriangle, Award } from "lucide-react";

/**
 * Risk Alerts Card Component
 * Displays risk alerts and issues requiring intervention
 */
export const RiskAlertsCard = ({ riskAlerts = [] }) => {
  const severityConfig = {
    high: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", icon: "text-red-600" },
    medium: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", icon: "text-amber-600" },
    low: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", icon: "text-blue-600" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
            Risk & Readiness
          </h2>
          <p className="text-sm text-gray-600 font-medium mt-1">
            Items that may need intervention this week
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {riskAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex flex-col items-center gap-2">
              <Award className="h-8 w-8 text-green-600" />
              <p className="text-sm font-bold text-green-700">All systems operational!</p>
              <p className="text-xs text-green-600">No risk alerts at this time</p>
            </div>
          </div>
        ) : (
          riskAlerts.map((alert, index) => {
            const config = severityConfig[alert.severity] || severityConfig.medium;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl ${config.bg} border-2 ${config.border} px-4 py-3 text-sm hover:shadow-md transition-all duration-300`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className={`h-4 w-4 ${config.icon}`} />
                  <span className={config.text}>{alert.title}</span>
                </div>
                <p className={`mt-1.5 text-xs ${config.text} font-medium`}>{alert.detail}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
