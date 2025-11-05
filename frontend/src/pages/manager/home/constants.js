/**
 * Home Page Constants
 * Styling constants and configuration
 */

import { MANAGER_SECTION_CLASS } from "../managerStyles";

export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const SECTION_BASE_CLASS = `${MANAGER_SECTION_CLASS}`;

export const SECTION_VARIANTS = {
  insights: "bg-gradient-to-br from-white to-amber-50 border-amber-200",
  actions: "bg-gradient-to-br from-white to-emerald-50 border-emerald-200",
  workforce: "bg-gradient-to-br from-white to-teal-50 border-teal-200",
  trends: "bg-gradient-to-br from-white to-blue-50 border-blue-200",
  team: "bg-gradient-to-br from-white to-purple-50 border-purple-200",
  sentiment: "bg-gradient-to-br from-white to-cyan-50 border-cyan-200",
};

export const SECTION_GLOW = {
  insights: "bg-amber-100/50",
  actions: "bg-emerald-100/50",
  workforce: "bg-teal-100/50",
  trends: "bg-blue-100/50",
  team: "bg-purple-100/50",
  sentiment: "bg-cyan-100/50",
};

export const STAT_CARD_CLASS =
  "rounded-xl border p-5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 backdrop-blur-sm";

export const STAT_CARD_VARIANTS = {
  neutral: "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300",
  actions: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 hover:border-emerald-300",
  workforce: "border-teal-200 bg-gradient-to-br from-white to-teal-50 hover:border-teal-300",
  trends: "border-blue-200 bg-gradient-to-br from-white to-blue-50 hover:border-blue-300",
  team: "border-purple-200 bg-gradient-to-br from-white to-purple-50 hover:border-purple-300",
  sentiment: "border-cyan-200 bg-gradient-to-br from-white to-cyan-50 hover:border-cyan-300",
};
