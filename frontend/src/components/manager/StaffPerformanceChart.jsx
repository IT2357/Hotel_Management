import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { Button } from "@/components/manager/ManagerButton";
import { TrendingUp } from "lucide-react";

const data = [
  { name: "Mon", efficiency: 85, workload: 12, satisfaction: 4.5 },
  { name: "Tue", efficiency: 88, workload: 15, satisfaction: 4.6 },
  { name: "Wed", efficiency: 92, workload: 14, satisfaction: 4.8 },
  { name: "Thu", efficiency: 87, workload: 16, satisfaction: 4.4 },
  { name: "Fri", efficiency: 94, workload: 13, satisfaction: 4.9 },
  { name: "Sat", efficiency: 91, workload: 18, satisfaction: 4.7 },
  { name: "Sun", efficiency: 89, workload: 11, satisfaction: 4.6 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 space-y-1">
        <p className="text-sm font-semibold text-foreground">{payload[0].payload.name}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}{entry.name === "Satisfaction" ? "/5" : "%"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const StaffPerformanceChart = () => {
  const [timeRange, setTimeRange] = useState("week");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Staff Performance</h3>
          <p className="text-sm text-muted-foreground">Efficiency & Guest Satisfaction Trends</p>
        </div>
        <div className="flex gap-2">
          {["Week", "Month", "Custom"].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range.toLowerCase() ? "default" : "outline"}
              onClick={() => setTimeRange(range.toLowerCase())}
              className={timeRange === range.toLowerCase() ? "gold-gradient text-background" : ""}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 bg-primary/5 border border-primary/30 rounded-xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">
            AI Insight: Staff efficiency increased by 8% this week
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="Efficiency"
            />
            <Line 
              type="monotone" 
              dataKey="workload" 
              stroke="hsl(var(--info))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--info))", r: 4 }}
              name="Workload"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[300px] w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="satisfaction" 
              fill="hsl(var(--success))"
              radius={[8, 8, 0, 0]}
              name="Satisfaction"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
