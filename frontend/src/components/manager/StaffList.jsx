import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/manager/ManagerAvatar";
import { ManagerBadge } from "@/components/manager/ManagerBadge";
import { useState } from "react";
import { Button } from "@/components/manager/ManagerButton";

const departments = ["All", "Housekeeping", "Front Desk", "Kitchen", "Maintenance"];

const staff = [
  { name: "Maria Rodriguez", role: "Housekeeping Lead", status: "online", avatar: "Maria", department: "Housekeeping" },
  { name: "John Smith", role: "Maintenance Tech", status: "online", avatar: "John", department: "Maintenance" },
  { name: "Lisa Chen", role: "Front Desk Manager", status: "online", avatar: "Lisa", department: "Front Desk" },
  { name: "Carlos Martinez", role: "Head Chef", status: "online", avatar: "Carlos", department: "Kitchen" },
  { name: "Sarah Williams", role: "Senior Housekeeper", status: "offline", avatar: "Sarah", department: "Housekeeping" },
  { name: "Mike Johnson", role: "Maintenance Lead", status: "online", avatar: "Mike", department: "Maintenance" },
  { name: "Emily Davis", role: "Receptionist", status: "online", avatar: "Emily", department: "Front Desk" },
  { name: "David Lee", role: "Sous Chef", status: "offline", avatar: "David", department: "Kitchen" },
];

export const StaffList = () => {
  const [selectedDept, setSelectedDept] = useState("All");

  const filteredStaff = selectedDept === "All" 
    ? staff 
    : staff.filter(s => s.department === selectedDept);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-5 rounded-3xl border border-white/12 bg-white/[0.05] p-6 text-white shadow-[0_28px_70px_rgba(8,14,29,0.5)] backdrop-blur-xl"
    >
      <div>
        <h3 className="mb-1 text-xl font-semibold text-white">Staff Availability</h3>
        <p className="text-sm text-white/70">Real-time staff status</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => (
          <Button
            key={dept}
            size="sm"
            variant={selectedDept === dept ? "default" : "outline"}
            onClick={() => setSelectedDept(dept)}
            className={
              selectedDept === dept
                ? "rounded-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 px-4 text-slate-900 shadow-[0_18px_45px_rgba(251,191,36,0.35)] transition-transform duration-300 hover:from-amber-200 hover:via-amber-300 hover:to-amber-200 hover:shadow-[0_22px_55px_rgba(251,191,36,0.45)] hover:-translate-y-0.5"
                : "rounded-full border border-white/15 bg-white/[0.08] px-4 text-white shadow-[0_14px_32px_rgba(8,14,29,0.35)] backdrop-blur-lg transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
            }
          >
            {dept}
          </Button>
        ))}
      </div>

      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-3">
        {filteredStaff.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-white shadow-[0_22px_50px_rgba(8,14,29,0.45)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_26px_60px_rgba(8,14,29,0.55)]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <motion.div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                    member.status === "online" ? "bg-success" : "bg-muted-foreground"
                  }`}
                  animate={
                    member.status === "online"
                      ? { scale: [1, 1.2, 1] }
                      : {}
                  }
                  transition={
                    member.status === "online"
                      ? { duration: 2, repeat: Infinity }
                      : {}
                  }
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{member.name}</p>
                <p className="text-xs text-white/70">{member.role}</p>
              </div>
              <ManagerBadge
                variant={member.status === "online" ? "default" : "secondary"}
                className={
                  member.status === "online"
                    ? "border-emerald-300/50 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100"
                    : "border-white/15 bg-white/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70"
                }
              >
                {member.status}
              </ManagerBadge>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
