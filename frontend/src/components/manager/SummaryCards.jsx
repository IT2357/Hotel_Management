import { motion } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, Star, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const defaultCards = [
  { 
    icon: ClipboardList, 
    label: "Total Tasks", 
    value: 0, 
    iconColor: "#3B82F6", 
    iconBg: "bg-gradient-to-br from-blue-50 to-blue-100",
  },
  { 
    icon: Clock, 
    label: "In Progress", 
    value: 0, 
    iconColor: "#F59E0B", 
    iconBg: "bg-gradient-to-br from-amber-50 to-amber-100",
  },
  { 
    icon: CheckCircle2, 
    label: "Completed", 
    value: 0, 
    iconColor: "#10B981", 
    iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
  },
  { 
    icon: Star, 
    label: "Avg Rating", 
    value: 0, 
    iconColor: "#F59E0B", 
    iconBg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    suffix: "/5",
    decimals: 1,
  },
  { 
    icon: Users, 
    label: "Staff Online", 
    value: 0, 
    iconColor: "#8B5CF6", 
    iconBg: "bg-gradient-to-br from-purple-50 to-purple-100",
  },
  { 
    icon: AlertTriangle, 
    label: "Backlog", 
    value: 0, 
    iconColor: "#EF4444", 
    iconBg: "bg-gradient-to-br from-red-50 to-red-100",
  },
  { 
    icon: TrendingUp, 
    label: "Completion", 
    value: 0, 
    iconColor: "#06B6D4", 
    iconBg: "bg-gradient-to-br from-cyan-50 to-cyan-100",
    suffix: "%",
  },
];

const AnimatedNumber = ({ value, suffix = "", decimals = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const displayValue = decimals > 0 ? count.toFixed(decimals) : Math.floor(count);
  return <span>{displayValue}{suffix}</span>;
};

export const SummaryCards = ({ cards = defaultCards }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            delay: index * 0.08,
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          whileHover={{ 
            y: -8, 
            scale: 1.02,
            transition: { duration: 0.3, type: "spring", stiffness: 300 }
          }}
          className="group relative cursor-pointer rounded-3xl bg-gradient-to-br from-white via-white to-gray-50 p-7 shadow-lg shadow-gray-200/50 ring-1 ring-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-300/60 hover:ring-gray-300"
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-transparent to-gray-100/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Icon with enhanced styling */}
            <div className="mb-6 flex items-start justify-between">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={`rounded-2xl ${card.iconBg} p-4 shadow-md ring-1 ring-white/50 transition-all duration-300 group-hover:shadow-lg`}
                style={{ color: card.iconColor }}
              >
                <card.icon className="h-6 w-6" strokeWidth={2.5} />
              </motion.div>
              
              {/* Trend indicator badge */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 + 0.2 }}
                className="rounded-full bg-emerald-100 px-3 py-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <span className="text-xs font-bold text-emerald-700">↗</span>
              </motion.div>
            </div>
            
            {/* Value and Label with enhanced styling */}
            <div className="mb-6 space-y-3">
              <motion.p 
                className="text-5xl font-extrabold tracking-tighter text-gray-900"
                style={{
                  background: `linear-gradient(135deg, ${card.iconColor} 0%, #1f2937 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <AnimatedNumber value={card.value} suffix={card.suffix} decimals={card.decimals} />
              </motion.p>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">{card.label}</p>
            </div>

            {/* Enhanced progress bar */}
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r shadow-sm"
                style={{
                  background: `linear-gradient(90deg, ${card.iconColor} 0%, ${card.iconColor}dd 100%)`
                }}
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ delay: index * 0.08 + 0.4, duration: 1, ease: "easeOut" }}
              />
            </div>

            {/* Subtle bottom accent */}
            <motion.div
              className="mt-5 h-1 rounded-full bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.08 + 0.5, duration: 0.8 }}
            />
          </div>

          {/* Animated corner accent */}
          <motion.div
            className="absolute -right-2 -top-2 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
            style={{ backgroundColor: card.iconColor }}
          />
        </motion.div>
      ))}
    </div>
  );
};
