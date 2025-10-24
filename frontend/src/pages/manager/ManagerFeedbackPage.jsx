import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, AlertCircle, MessageCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
import Spinner from "@/components/ui/Spinner";
import guestFeedbackAPI from "@/services/guestFeedbackAPI";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS } from "./managerStyles";
import { 
  FeedbackStatsCards, 
  FeedbackFilters, 
  FeedbackAnalytics, 
  FeedbackCard, 
  FeedbackResponseModal 
} from "@/components/manager/feedback";
import { 
  calculateSentimentStats, 
  calculateRatingDistribution, 
  calculateAverageRating 
} from "@/utils/feedbackUtils";

const ManagerFeedbackPage = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and UI state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedRating, setSelectedRating] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await guestFeedbackAPI.getAllFeedback({
        status: activeTab === 'all' ? undefined : activeTab,
        rating: selectedRating,
        search: searchQuery,
        sortBy: sortBy,
      });
      
      if (response.success && response.data) {
        setFeedback(response.data);
      } else {
        setFeedback([]);
        setError("Unable to load feedback data. Please try again.");
      }
    } catch (err) {
      console.error("Failed to load guest feedback", err);
      setError(err.response?.data?.message || "We couldn't load guest feedback. Please try again in a moment.");
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedRating, searchQuery, sortBy]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleSidebarToggle = useCallback((isCollapsed) => {
    toast.info(isCollapsed ? "Sidebar collapsed" : "Sidebar expanded", { duration: 1500 });
  }, []);

  const handleMenuItemSelect = useCallback((item) => {
    if (item.id === "feedback") {
      toast.success("Already viewing guest feedback", { duration: 1500 });
      return false;
    }

    if (item.id === "dashboard" || item.id === "tasks" || item.id === "staff" || item.id === "profile" || item.id === "reports") {
      return undefined;
    }

    toast.info(`${item.label} is coming soon`, {
      description: "We are still wiring up this area for managers.",
      duration: 1800,
    });
    return false;
  }, []);

  // Computed stats
  const publishableCount = useMemo(
    () => feedback.filter((entry) => entry.status === "pending").length,
    [feedback],
  );

  const respondedCount = useMemo(
    () => feedback.filter((entry) => entry.response?.hasResponse).length,
    [feedback],
  );

  const averageRating = useMemo(() => calculateAverageRating(feedback), [feedback]);
  const sentimentStats = useMemo(() => calculateSentimentStats(feedback), [feedback]);
  const ratingDistribution = useMemo(() => calculateRatingDistribution(feedback), [feedback]);

  // Filtered and sorted feedback
  const filteredFeedback = useMemo(() => {
    let filtered = [...feedback];

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(entry => entry.status === 'pending');
    } else if (activeTab === 'responded') {
      filtered = filtered.filter(entry => entry.response?.hasResponse);
    } else if (activeTab === 'archived') {
      filtered = filtered.filter(entry => entry.status === 'archived');
    }

    // Filter by rating
    if (selectedRating !== null) {
      filtered = filtered.filter(entry => entry.rating === selectedRating);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.guestName.toLowerCase().includes(query) ||
        entry.roomTitle.toLowerCase().includes(query) ||
        entry.roomNumber.toLowerCase().includes(query) ||
        entry.title.toLowerCase().includes(query) ||
        entry.comment.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.stayDate) - new Date(a.stayDate));
    } else if (sortBy === 'rating-high') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-low') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    return filtered;
  }, [feedback, activeTab, selectedRating, searchQuery, sortBy]);

  const handleRefresh = async () => {
    await fetchFeedback();
    toast.success("Feedback refreshed", { duration: 1200 });
  };

  const handleRespond = (entry) => {
    setSelectedFeedback(entry);
    setResponseText('');
    setShowResponseModal(true);
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      toast.error("Please enter a response message");
      return;
    }

    try {
      const response = await guestFeedbackAPI.respondToFeedback(selectedFeedback._id || selectedFeedback.id, responseText);
      
      if (response.success) {
        setFeedback((prev) =>
          prev.map((entry) =>
            (entry._id || entry.id) === (selectedFeedback._id || selectedFeedback.id)
              ? response.data
              : entry,
          ),
        );

        toast.success(`Response sent to ${selectedFeedback.guestName}`, {
          description: "Feedback has been published",
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error("Failed to send response", {
        description: error.message,
        duration: 2000,
      });
    }

    setShowResponseModal(false);
    setSelectedFeedback(null);
    setResponseText('');
  };

  const handleArchive = async (entry) => {
    try {
      const response = await guestFeedbackAPI.archiveFeedback(entry._id || entry.id);
      
      if (response.success) {
        setFeedback((prev) =>
          prev.map((item) =>
            (item._id || item.id) === (entry._id || entry.id) ? response.data : item,
          ),
        );
        toast.success(`Archived feedback from ${entry.guestName}`, {
          description: "You can restore it from the archived tab.",
          duration: 1800,
        });
      }
    } catch (error) {
      toast.error("Failed to archive feedback", {
        description: error.message,
        duration: 1800,
      });
    }
  };

  const handleMarkHelpful = async (entryId) => {
    try {
      const response = await guestFeedbackAPI.markFeedbackHelpful(entryId);
      
      if (response.success) {
        setFeedback((prev) =>
          prev.map((entry) =>
            (entry._id || entry.id) === entryId ? response.data : entry,
          ),
        );
        toast.success("Marked as helpful", { duration: 1200 });
      }
    } catch (error) {
      toast.error("Failed to mark as helpful", {
        description: error.message,
        duration: 1200,
      });
    }
  };

  const handlePublish = async (entry) => {
    try {
      const response = await guestFeedbackAPI.publishFeedback(entry._id || entry.id);
      
      if (response.success) {
        setFeedback((prev) =>
          prev.map((item) =>
            (item._id || item.id) === (entry._id || entry.id) ? response.data : item,
          ),
        );
        toast.success("Feedback published", { duration: 1500 });
      }
    } catch (error) {
      toast.error("Failed to publish feedback", {
        description: error.message,
        duration: 1500,
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRating(null);
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery || selectedRating !== null;

  const renderHeader = () => (
    <div className={`${MANAGER_SECTION_CLASS} relative overflow-hidden p-6 bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-lg border border-gray-200`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-100/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-gradient-to-tl from-gray-200/30 to-gray-100/20 blur-2xl" />
        <div className="absolute top-1/4 right-1/4 h-24 w-24 rounded-full bg-gradient-to-r from-gray-100/20 to-gray-200/20 blur-xl" />
        <div className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-gradient-to-tr from-gray-200/15 to-gray-100/15 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Guest Feedback Management
            </h1>
            <p className="text-gray-600 text-sm font-medium max-w-2xl">
              Welcome back, <span className="text-gray-900 font-bold">{user?.fullName || user?.name || "Manager"}</span>! 
              Manage and respond to guest feedback efficiently.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh Data
            </button>
            <button
              onClick={() => toast("Export coming soon")}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards - Using extracted component */}
        <FeedbackStatsCards
          totalCount={feedback.length}
          pendingCount={publishableCount}
          respondedCount={respondedCount}
          averageRating={averageRating}
        />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b-2 border-gray-200 pb-3">
          {[
            { id: 'all', label: 'All Reviews', count: feedback.length },
            { id: 'pending', label: 'Pending', count: publishableCount },
            { id: 'responded', label: 'Responded', count: respondedCount },
            { id: 'archived', label: 'Archived', count: feedback.filter(f => f.status === 'archived').length },
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeedbackList = () => (
    <div className="space-y-6">
      {filteredFeedback.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 border-2 border-gray-200">
            <Search className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">No feedback found</h3>
          <p className="text-base text-gray-600 mb-6 font-medium">
            {hasActiveFilters ? "Try adjusting your filters to see more results." : "No feedback matches your criteria."}
          </p>
          {hasActiveFilters && (
            <button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        filteredFeedback.map((entry) => (
          <FeedbackCard
            key={entry._id || entry.id}
            entry={entry}
            onMarkHelpful={handleMarkHelpful}
            onRespond={handleRespond}
            onPublish={handlePublish}
            onArchive={handleArchive}
          />
        ))
      )}
    </div>
  );

  return (
    <ManagerLayout
      activeItem="feedback"
      onSidebarToggle={handleSidebarToggle}
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={`${MANAGER_CONTENT_CLASS} py-8`}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} max-w-6xl space-y-6`}>
        {renderHeader()}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-red-900 mb-1">
                  Unable to Load Feedback
                </h3>
                <p className="text-sm text-red-700 font-medium mb-4">
                  {error}
                </p>
                <button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600 font-medium">Loading feedback...</p>
            </div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No feedback yet</h3>
            <p className="mt-2 text-gray-600 font-medium">
              Once guests start sharing their experiences, you will see them here.
            </p>
            <button
              className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
              onClick={handleRefresh}
            >
              Refresh now
            </button>
          </div>
        ) : (
          <>
            <FeedbackFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              onClearFilters={clearFilters}
            />
            <FeedbackAnalytics
              sentimentStats={sentimentStats}
              ratingDistribution={ratingDistribution}
              feedbackCount={feedback.length}
            />
            {renderFeedbackList()}
          </>
        )}
      </div>

      <FeedbackResponseModal
        isOpen={showResponseModal}
        selectedFeedback={selectedFeedback}
        responseText={responseText}
        setResponseText={setResponseText}
        onSendResponse={handleSendResponse}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedFeedback(null);
          setResponseText('');
        }}
      />
    </ManagerLayout>
  );
};

export default ManagerFeedbackPage;
