/**
 * Tab Navigation Component
 * Modern glassmorphism tab navigation for reports
 */

export const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl p-6 shadow-xl border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/30" />
      <div className="relative flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105"
                  : "bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-md hover:scale-102"
              }`}
            >
              {/* Active gradient overlay */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-600/20" />
              )}

              <div className="relative flex items-center gap-2">
                <Icon
                  className={`w-4 h-4 transition-all duration-300 ${
                    isActive ? "text-white" : "text-gray-600 group-hover:text-indigo-600"
                  }`}
                />
                <span
                  className={`transition-all duration-300 ${
                    isActive ? "text-white" : "text-gray-700 group-hover:text-indigo-700"
                  }`}
                >
                  {tab.label}
                </span>
              </div>

              {/* Hover shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
