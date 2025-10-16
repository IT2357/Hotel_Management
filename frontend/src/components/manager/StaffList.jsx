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
      className="glass-card p-6 space-y-4"
    >
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Staff Availability</h3>
        <p className="text-sm text-muted-foreground">Real-time staff status</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {departments.map((dept) => (
          <Button
            key={dept}
            size="sm"
            variant={selectedDept === dept ? "default" : "outline"}
            onClick={() => setSelectedDept(dept)}
            className={selectedDept === dept ? "gold-gradient text-background" : ""}
          >
            {dept}
          </Button>
        ))}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {filteredStaff.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card p-3 hover:border-primary/50 transition-all duration-300"
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
                <p className="font-medium text-sm text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
              <ManagerBadge 
                variant={member.status === "online" ? "default" : "secondary"}
                className={member.status === "online" ? "bg-success/20 text-success border-success/50" : ""}
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
