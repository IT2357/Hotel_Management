// ✨ Modern Light & Clean Style - Matching Dashboard Design
// Based on the clean, professional dashboard with teal sidebar and lime accents

// 🎨 Color Palette
export const COLORS = {
  // Primary Colors
  primary: {
    teal: '#2C3E50',      // Dark teal for sidebar
    lime: '#D4E157',      // Lime accent for active states
    emerald: '#10B981',   // Success/positive metrics
  },
  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray500: '#6B7280',
    gray700: '#374151',
    gray900: '#111827',
  },
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
};

// 🎯 Base Layout Classes
export const MANAGER_CONTENT_CLASS = "min-h-screen bg-gray-50";
export const MANAGER_PAGE_CONTAINER_CLASS = "mx-auto w-full max-w-[1440px] px-6 py-8";

// 📦 Section & Card Classes
export const MANAGER_SECTION_CLASS = "rounded-xl bg-white p-6 shadow-sm border border-gray-200";
export const MANAGER_CARD_CLASS = "rounded-2xl bg-white p-6 shadow-sm border border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-300";
export const MANAGER_CARD_SURFACE_CLASS = "rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200";

// 🎴 Stats Card Variants - Clean minimal style
export const MANAGER_STATS_CARD = "rounded-2xl bg-white p-6 shadow-sm border border-gray-300 transition-all duration-300 hover:shadow-md hover:border-gray-400";
export const MANAGER_STATS_VARIANTS = {
  primary: "bg-white border-gray-300",
  success: "bg-white border-gray-300",
  warning: "bg-white border-gray-300",
  info: "bg-white border-gray-300",
  neutral: "bg-white border-gray-300",
};

// 🎨 Badge & Status Classes
export const MANAGER_BADGE_BASE = "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium";
export const MANAGER_BADGE_VARIANTS = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  neutral: "bg-gray-100 text-gray-800",
  lime: "bg-lime-100 text-lime-800",
};

// 🔘 Button Variants
export const MANAGER_BUTTON_BASE = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200";
export const MANAGER_BUTTON_VARIANTS = {
  primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow-md",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  lime: "bg-lime-400 text-gray-900 hover:bg-lime-500 shadow-sm",
};

// 📊 Chart & Graph Colors
export const MANAGER_CHART_COLORS = {
  primary: ['#2C3E50', '#34495E', '#526A7F'],
  success: ['#10B981', '#34D399', '#6EE7B7'],
  multi: ['#2C3E50', '#10B981', '#F59E0B', '#3B82F6', '#D4E157'],
};

// 🎯 Special Effects
export const MANAGER_RING_CLASS = "ring-2 ring-inset ring-lime-300";
export const MANAGER_HOVER_LIFT = "hover:-translate-y-1 hover:shadow-lg transition-all duration-200";
export const MANAGER_ACTIVE_STATE = "bg-lime-300 text-gray-900";

// 📋 Table Classes
export const MANAGER_TABLE_CLASS = "w-full border-collapse";
export const MANAGER_TABLE_HEADER = "border-b border-gray-200 bg-gray-50";
export const MANAGER_TABLE_ROW = "border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150";
export const MANAGER_TABLE_CELL = "px-4 py-3 text-sm text-gray-700";

// 🎭 Icon Container Classes
export const MANAGER_ICON_WRAPPER = "inline-flex items-center justify-center rounded-lg p-3";
export const MANAGER_ICON_VARIANTS = {
  primary: "bg-teal-100 text-teal-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  lime: "bg-lime-100 text-lime-700",
};

// 🌈 Gradient Backgrounds
export const MANAGER_GRADIENT_OVERLAY = "bg-gradient-to-br from-white via-gray-50 to-white";
export const MANAGER_SECTION_GRADIENT = "bg-gradient-to-br from-white to-gray-50";
