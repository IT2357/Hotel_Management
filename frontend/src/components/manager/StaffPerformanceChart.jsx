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
      <div className="space-y-1 rounded-2xl border border-[#1b335f] bg-[#0e1f42] p-3 shadow-[0_12px_30px_rgba(8,14,29,0.55)]">
        <p className="text-sm font-semibold text-[#f5f7ff]">{payload[0].payload.name}</p>
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
      className="space-y-5 rounded-3xl border border-[#1b335f] bg-gradient-to-b from-[#14284d] via-[#112244] to-[#0b1c36] p-6 shadow-[0_22px_50px_rgba(8,14,29,0.6)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#f5f7ff]">Staff Performance</h3>
          <p className="text-sm text-[#8ba3d0]">Efficiency &amp; Guest Satisfaction Trends</p>
        </div>
        <div className="flex gap-2">
          {["Week", "Month", "Custom"].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range.toLowerCase() ? "default" : "outline"}
              onClick={() => setTimeRange(range.toLowerCase())}
              className={
                timeRange === range.toLowerCase()
                  ? "bg-[#facc15] text-[#0b1b3c] hover:bg-[#f9c513]"
                  : "border border-[#1b335f] bg-[#0f1f3d] text-[#d6e2ff] hover:bg-[#132b52]"
              }
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1b335f] bg-[#10213f] p-4 shadow-[0_16px_36px_rgba(8,14,29,0.45)]">
        <div className="flex items-center gap-2 text-[#d6e2ff]">
          <TrendingUp className="h-4 w-4 text-[#facc15]" />
          <p className="text-sm font-medium text-[#f5f7ff]">
            AI Insight: Staff efficiency increased by 8% this week
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full rounded-2xl border border-[#1b335f] bg-[#0b1c36] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2d54" opacity={0.4} />
            <XAxis
              dataKey="name"
              stroke="#6178b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#8ba3d0" }}
              axisLine={{ stroke: "#1b2d54" }}
            />
            <YAxis
              stroke="#6178b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#8ba3d0" }}
              axisLine={{ stroke: "#1b2d54" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1f355d", strokeWidth: 1 }} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#8ba3d0" }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#facc15"
              strokeWidth={3}
              dot={{ fill: "#facc15", r: 4 }}
              name="Efficiency"
            />
            <Line
              type="monotone"
              dataKey="workload"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ fill: "#38bdf8", r: 4 }}
              name="Workload"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 h-[300px] w-full rounded-2xl border border-[#1b335f] bg-[#0b1c36] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2d54" opacity={0.4} />
            <XAxis
              dataKey="name"
              stroke="#6178b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#8ba3d0" }}
              axisLine={{ stroke: "#1b2d54" }}
            />
            <YAxis
              stroke="#6178b8"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#8ba3d0" }}
              axisLine={{ stroke: "#1b2d54" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#8ba3d0" }}
              iconType="circle"
            />
            <Bar 
              dataKey="satisfaction" 
              fill="#34d399"
              radius={[8, 8, 0, 0]}
              name="Satisfaction"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
