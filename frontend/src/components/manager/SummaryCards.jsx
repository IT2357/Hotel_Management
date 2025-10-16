import { motion } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";

const cards = [
  { icon: ClipboardList, label: "Total Tasks", value: 48, color: "text-info" },
  { icon: Clock, label: "In Progress", value: 24, color: "text-warning" },
  { icon: CheckCircle2, label: "Completed", value: 18, color: "text-success" },
  { icon: Star, label: "Avg Rating", value: 4.8, color: "text-primary", suffix: "/5" },
  { icon: Users, label: "Staff Online", value: 18, color: "text-success" },
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

export const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="glass-card p-6 hover:glow-effect transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-secondary/50 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground">
              <AnimatedNumber value={card.value} suffix={card.suffix} />
            </p>
            <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
          </div>

          <motion.div
            className="mt-4 h-1 bg-gradient-to-r from-primary/20 to-primary rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
          />
        </motion.div>
      ))}
    </div>
  );
};
