/**
 * Profile Page Constants
 * Static data for profile sections
 */

import {
  Mail,
  Phone,
  Briefcase,
  Shield,
  Building2,
  FileText,
  TrendingUp,
  User,
  Settings,
} from "lucide-react";

export const detailRows = [
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "department", label: "Department", icon: Briefcase },
  { key: "role", label: "Role", icon: Shield },
  { key: "hotel", label: "Hotel", icon: Building2 },
];

export const permissions = [
  { id: 1, name: "Manage Staff", granted: true },
  { id: 2, name: "Assign Tasks", granted: true },
  { id: 3, name: "View Reports", granted: true },
  { id: 4, name: "Approve Bookings", granted: true },
  { id: 5, name: "Manage Inventory", granted: false },
  { id: 6, name: "Financial Access", granted: false },
];

export const quickActions = [
  { id: 1, label: "Create Task", icon: FileText, color: "blue" },
  { id: 2, label: "View Reports", icon: TrendingUp, color: "purple" },
  { id: 3, label: "Manage Staff", icon: User, color: "emerald" },
  { id: 4, label: "Settings", icon: Settings, color: "orange" },
];
