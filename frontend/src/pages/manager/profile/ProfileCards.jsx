/**
 * Profile Cards Components
 * Contact Info, Permissions, Activity, and Quick Actions cards
 */

import { motion } from "framer-motion";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { User, Key, Clock, Settings, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { detailRows, permissions, quickActions } from "./constants";

export const ContactInfoCard = ({ profile }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}
    className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
  >
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-xl bg-indigo-100 p-2.5">
        <User className="h-5 w-5 text-indigo-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
    </div>
    <div className="space-y-3">
      {detailRows.map((row) => {
        const Icon = row.icon;
        return (
          <div
            key={row.key}
            className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100 hover:shadow-sm"
          >
            <div className="rounded-lg bg-white p-2.5 shadow-sm">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {row.label}
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {profile[row.key] || "Not provided"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
);

export const PermissionsCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
  >
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-xl bg-emerald-100 p-2.5">
        <Key className="h-5 w-5 text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Permissions</h2>
    </div>
    <div className="space-y-2.5">
      {permissions.map((permission) => (
        <div
          key={permission.id}
          className="flex items-center justify-between rounded-xl bg-gray-50 p-3.5 transition-all hover:bg-gray-100"
        >
          <span className="text-sm font-medium text-gray-700">{permission.name}</span>
          {permission.granted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

export const ActivityCard = ({ activityTimeline }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.4 }}
    className="rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
  >
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-100 p-2.5">
          <Clock className="h-5 w-5 text-cyan-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
      </div>
      <ManagerBadge className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
        Live
      </ManagerBadge>
    </div>
    <div className="space-y-3">
      {activityTimeline.length > 0 ? (
        activityTimeline.map((activity) => (
          <div
            key={activity.id}
            className="rounded-xl border-l-4 border-indigo-500 bg-gray-50 p-4 transition-all hover:bg-indigo-50 hover:shadow-sm"
          >
            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
            <p className="mt-1 text-xs text-gray-600">{activity.timestamp}</p>
            {activity.meta && <p className="mt-1 text-xs text-gray-500">{activity.meta}</p>}
          </div>
        ))
      ) : (
        <div className="rounded-xl bg-gray-50 p-10 text-center">
          <div className="mx-auto w-fit rounded-full bg-gray-100 p-4">
            <Clock className="h-10 w-10 text-gray-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">No recent activity</p>
        </div>
      )}
    </div>
  </motion.div>
);

export const QuickActionsCard = () => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
    emerald: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
    orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300",
  };
  
  const iconColors = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    emerald: "text-emerald-600",
    orange: "text-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8 rounded-2xl bg-white p-6 shadow-lg border border-gray-200"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-2.5">
          <Settings className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={`flex items-center gap-4 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md border-2 ${
                colorClasses[action.color]
              }`}
              onClick={() => toast.info(`${action.label} clicked`)}
            >
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <Icon className={`h-5 w-5 ${iconColors[action.color]}`} />
              </div>
              <span className="font-semibold text-gray-900">{action.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
