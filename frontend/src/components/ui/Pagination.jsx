import React, { useEffect } from "react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  loading = false, // optional prop to disable buttons during fetch
  pageSize, // optional: current page size
  pageSizeOptions = [10, 20, 50, 100], // optional: available sizes
  onPageSizeChange, // optional: handler for page size change
}) {
  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  // Keyboard navigation with arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, loading]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxVisiblePages) {
      const half = Math.floor(maxVisiblePages / 2);
      startPage = Math.max(currentPage - half, 1);
      endPage = Math.min(currentPage + half, totalPages);

      if (currentPage <= half + 1) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - half) {
        startPage = totalPages - maxVisiblePages + 1;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className}`}>
      {/* Left: Navigation Buttons & Page Numbers */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold text-sm transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-indigo-900/20 dark:hover:border-indigo-500"
          aria-label="Previous page (Left Arrow)"
          title="Previous page (Left Arrow ←)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="hidden md:flex items-center gap-1.5">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={loading}
              className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200 ${
                page === currentPage
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-600 shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              }`}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold text-sm transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-indigo-900/20 dark:hover:border-indigo-500"
          aria-label="Next page (Right Arrow)"
          title="Next page (Right Arrow →)"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Right: Per-Page Selector & Page Info */}
      <div className="flex items-center gap-4 flex-wrap justify-between md:justify-end">
        {typeof pageSize !== 'undefined' && onPageSizeChange && (
          <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <span>Show</span>
            <select
              className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold text-sm transition-all duration-200 hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
              aria-label="Items per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt} items</option>
              ))}
            </select>
            <span>per page</span>
          </label>
        )}

        {/* Page Info Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-700">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">Page</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{currentPage}</span>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{totalPages}</span>
        </div>

        {/* Keyboard Hint */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <kbd className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 font-semibold">←</kbd>
          <span>/</span>
          <kbd className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 font-semibold">→</kbd>
          <span>to navigate</span>
        </div>
      </div>
    </div>
  );
}
