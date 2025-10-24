import { motion } from "framer-motion";
import { Search, Filter, Star, X } from "lucide-react";

/**
 * Filters for searching and sorting feedback
 */
const FeedbackFilters = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  selectedRating,
  setSelectedRating,
  onClearFilters
}) => {
  const hasActiveFilters = searchQuery || selectedRating !== null;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="flex-1">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search feedback by guest name, room, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200 text-sm font-medium"
            />
          </div>
        </div>

        {/* Sort and Rating Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="recent">Recent First</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
            </select>
          </div>

          <div className="relative">
            <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 pointer-events-none fill-amber-500" />
            <select
              value={selectedRating || ''}
              onChange={(e) => setSelectedRating(e.target.value ? parseInt(e.target.value) : null)}
              className="pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars</option>
              <option value="3">⭐⭐⭐ 3 Stars</option>
              <option value="2">⭐⭐ 2 Stars</option>
              <option value="1">⭐ 1 Star</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="border-2 border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="text-gray-700 font-bold">Active filters:</span>
          {searchQuery && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-indigo-100 text-indigo-700 border-2 border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
          {selectedRating !== null && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-100 text-amber-700 border-2 border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
            >
              Rating: {selectedRating} ⭐
              <button onClick={() => setSelectedRating(null)} className="hover:text-amber-900 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackFilters;
