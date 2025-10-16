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
      className="space-y-5 rounded-3xl border border-[#1b335f] bg-gradient-to-b from-[#14284d] via-[#112244] to-[#0b1c36] p-6 shadow-[0_22px_50px_rgba(8,14,29,0.6)]"
    >
      <div>
        <h3 className="mb-1 text-xl font-semibold text-[#f5f7ff]">Staff Availability</h3>
        <p className="text-sm text-[#8ba3d0]">Real-time staff status</p>
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
                ? "rounded-full bg-[#facc15] px-4 text-[#0b1b3c] hover:bg-[#f9c513]"
                : "rounded-full border border-[#1b335f] bg-[#0f1f3d] px-4 text-[#d6e2ff] hover:bg-[#132b52]"
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
            className="rounded-2xl border border-[#1b335f] bg-[#0f1f3d] p-3 text-[#d6e2ff] shadow-[0_16px_36px_rgba(8,14,29,0.45)] transition-all duration-300 hover:shadow-[0_22px_44px_rgba(8,14,29,0.55)]"
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
                <p className="text-sm font-medium text-[#f5f7ff]">{member.name}</p>
                <p className="text-xs text-[#8ba3d0]">{member.role}</p>
              </div>
              <ManagerBadge
                variant={member.status === "online" ? "default" : "secondary"}
                className={
                  member.status === "online"
                    ? "border-[#22c55e]/50 bg-[#0f3a32] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#34d399]"
                    : "border-[#33456f] bg-[#1a2744] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9ca9cf]"
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
