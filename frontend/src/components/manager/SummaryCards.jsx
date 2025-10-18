import { motion } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";

const defaultCards = [
  { icon: ClipboardList, label: "Total Tasks", value: 48, iconColor: "#38bdf8" },
  { icon: Clock, label: "In Progress", value: 24, iconColor: "#facc15" },
  { icon: CheckCircle2, label: "Completed", value: 18, iconColor: "#22c55e" },
  { icon: Star, label: "Avg Rating", value: 4.8, iconColor: "#facc15", suffix: "/5" },
  { icon: Users, label: "Staff Online", value: 18, iconColor: "#22c55e" },
];

const AnimatedNumber = ({ value, suffix = "" }) => {
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
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
};

export const SummaryCards = ({ cards = defaultCards }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="group cursor-pointer rounded-2xl border border-[#162a52] bg-[#0e1f42] p-6 shadow-[0_18px_40px_rgba(8,14,29,0.55)] transition-all duration-300 hover:shadow-[0_25px_50px_rgba(10,20,48,0.65)]"
        >
          <div className="mb-4 flex items-start justify-between">
            <div
              className="rounded-xl bg-[#10234f] p-3 transition-transform duration-300 group-hover:scale-110"
              style={{ color: card.iconColor }}
            >
              <card.icon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold text-[#f5f7ff]">
              <AnimatedNumber value={card.value} suffix={card.suffix} />
            </p>
            <p className="text-sm font-medium text-[#8ba3d0]">{card.label}</p>
          </div>

          <motion.div
            className="mt-4 h-1 rounded-full bg-gradient-to-r from-[#facc1533] via-[#facc15] to-[#facc1533]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
          />
        </motion.div>
      ))}
    </div>
  );
};
