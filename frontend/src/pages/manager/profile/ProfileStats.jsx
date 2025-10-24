/**
 * Profile Stats Component
 * Displays performance statistics cards
 */

import { motion } from "framer-motion";
import { Award, Clock, TrendingUp, Bell } from "lucide-react";

export const ProfileStats = ({ stats }) => {
  const statCards = [
    {
      value: stats.tasksCompleted,
      label: "Tasks Completed",
      icon: Award,
      color: "blue",
      gradient: "from-blue-400 to-blue-600",
      bg: "from-white via-blue-50/30 to-blue-100/30",
      border: "border-blue-200/50",
      hoverBorder: "hover:border-blue-400/70",
      shadow: "hover:shadow-blue-500/30",
      iconBg: "bg-blue-100",
      textGradient: "from-blue-700 to-cyan-700",
    },
    {
      value: stats.onTimeRate,
      label: "On-Time Rate",
      icon: Clock,
      color: "emerald",
      gradient: "from-emerald-400 to-emerald-600",
      bg: "from-white via-emerald-50/30 to-emerald-100/30",
      border: "border-emerald-200/50",
      hoverBorder: "hover:border-emerald-400/70",
      shadow: "hover:shadow-emerald-500/30",
      iconBg: "bg-emerald-100",
      textGradient: "from-emerald-700 to-green-700",
    },
    {
      value: stats.satisfaction,
      label: "Satisfaction Score",
      icon: TrendingUp,
      color: "purple",
      gradient: "from-purple-400 to-purple-600",
      bg: "from-white via-purple-50/30 to-purple-100/30",
      border: "border-purple-200/50",
      hoverBorder: "hover:border-purple-400/70",
      shadow: "hover:shadow-purple-500/30",
      iconBg: "bg-purple-100",
      textGradient: "from-purple-700 to-fuchsia-700",
    },
    {
      value: stats.notifications || 0,
      label: "Active Notifications",
      icon: Bell,
      color: "amber",
      gradient: "from-amber-400 to-orange-600",
      bg: "from-white via-amber-50/30 to-orange-100/30",
      border: "border-amber-200/50",
      hoverBorder: "hover:border-amber-400/70",
      shadow: "hover:shadow-amber-500/30",
      iconBg: "bg-amber-100",
      textGradient: "from-amber-700 to-orange-800",
      badge: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 grid gap-5 md:grid-cols-4"
    >
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`group rounded-2xl bg-gradient-to-br ${card.bg} p-6 shadow-xl border-2 ${card.border} ${card.hoverBorder} ${card.shadow} hover:shadow-2xl transition-all backdrop-blur-sm relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-${card.color}-500/5 via-${card.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-${card.color}-300/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-xl bg-gradient-to-br ${card.gradient} p-3.5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {card.badge ? (
                  <span className="rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
                    NEW
                  </span>
                ) : (
                  <div className={`rounded-full ${card.iconBg} p-2 shadow-md`}>
                    <TrendingUp className={`h-4 w-4 text-${card.color}-600`} />
                  </div>
                )}
              </div>
              <p className={`text-3xl font-bold bg-gradient-to-r ${card.textGradient} bg-clip-text text-transparent`}>
                {card.value}
              </p>
              <p className="mt-2 text-sm font-bold text-gray-700">{card.label}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
