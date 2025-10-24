import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Calendar, MessageCircle, Reply, Star, ThumbsUp, Trash2, Users, 
  Search, Filter, ChevronDown, X, TrendingUp, TrendingDown, 
  CheckCircle, Clock, AlertCircle, Archive, Send
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import guestFeedbackAPI from "@/services/guestFeedbackAPI";
import { MANAGER_CONTENT_CLASS, MANAGER_PAGE_CONTAINER_CLASS, MANAGER_SECTION_CLASS, MANAGER_CARD_SURFACE_CLASS } from "./managerStyles";

const mockGuestFeedback = [
  {
    id: 1,
    guestName: "Mr. Anderson",
    roomTitle: "Deluxe Ocean View Suite",
    roomNumber: "501",
    stayDate: "2025-01-15",
    rating: 5,
    title: "Exceptional Stay",
    comment:
      "Absolutely loved our stay! The ocean view suite was breathtaking, and the service was impeccable. The staff went above and beyond to make our anniversary special.",
    highlights: ["Ocean view", "Personalized welcome", "Attentive housekeeping", "Seamless check-in"],
    concerns: [],
    helpful: 18,
    status: "published",
    sentiment: "positive",
    response: {
      hasResponse: true,
      message:
        "Thank you for choosing us for your anniversary, Mr. Anderson! We have shared your feedback with the housekeeping and concierge teams.",
      respondedAt: "2025-01-18",
      respondedBy: "Ms. Perera",
    },
  },
  {
    id: 2,
    guestName: "Ms. Thompson",
    roomTitle: "Executive Business Room",
    roomNumber: "301",
    stayDate: "2025-01-08",
    rating: 4,
    title: "Productive Business Trip",
    comment:
      "Great location and business amenities. Meeting room access was a bonus. WiFi dipped during peak hours, but staff quickly offered a mobile hotspot.",
    highlights: ["Co-working lounge", "Express laundry", "Executive breakfast"],
    concerns: ["Peak hour WiFi slow"],
    helpful: 9,
    status: "published",
    sentiment: "neutral",
    response: null,
  },
  {
    id: 3,
    guestName: "Dr. Williams",
    roomTitle: "Garden Villa",
    roomNumber: "GV-01",
    stayDate: "2024-12-20",
    rating: 5,
    title: "Peaceful Retreat",
    comment:
      "The private garden setting was a dream. Sri Lankan high-tea experience was unforgettable. Would love to see more yoga session slots in the morning.",
    highlights: ["Garden ambience", "High-tea experience", "Attentive butler"],
    concerns: ["Limited yoga slots"],
    helpful: 21,
    status: "pending",
    sentiment: "positive",
    response: null,
  },
  {
    id: 4,
    guestName: "Mrs. Johnson",
    roomTitle: "Standard Room",
    roomNumber: "205",
    stayDate: "2025-01-10",
    rating: 2,
    title: "Poor Experience",
    comment:
      "Room was not clean, AC was not working properly, and the staff was unhelpful. Very disappointed with the service.",
    highlights: [],
    concerns: ["Dirty room", "AC not working", "Unhelpful staff"],
    helpful: 3,
    status: "pending",
    sentiment: "negative",
    response: null,
  },
  {
    id: 5,
    guestName: "Mr. Chen",
    roomTitle: "Family Suite",
    roomNumber: "405",
    stayDate: "2025-01-12",
    rating: 4,
    title: "Great Family Stay",
    comment:
      "Perfect for families with kids. Spacious rooms and great amenities. Minor issue with room service timing but overall great experience.",
    highlights: ["Family-friendly", "Spacious rooms", "Good amenities"],
    concerns: ["Room service timing"],
    helpful: 12,
    status: "published",
    sentiment: "positive",
    response: {
      hasResponse: true,
      message: "Thank you for your feedback, Mr. Chen! We'll work on improving our room service timing.",
      respondedAt: "2025-01-13",
      respondedBy: "Ms. Perera",
    },
  },
];

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getStatusBadge = (status) => {
  switch (status) {
    case "published":
      return { variant: "success", label: "Published" };
    case "pending":
      return { variant: "warning", label: "Pending response" };
    default:
      return { variant: "secondary", label: status };
  }
};

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
  const [showFilters, setShowFilters] = useState(false);

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
        // Fallback to mock data if API fails
        setFeedback(mockGuestFeedback);
      }
    } catch (err) {
      console.error("Failed to load guest feedback", err);
      setError("We couldn't load guest feedback. Please try again in a moment.");
      // Use mock data as fallback
      setFeedback(mockGuestFeedback);
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

  const publishedCount = useMemo(
    () => feedback.filter((entry) => entry.status === "published").length,
    [feedback],
  );

  const respondedCount = useMemo(
    () => feedback.filter((entry) => entry.response?.hasResponse).length,
    [feedback],
  );

  const helpfulTotal = useMemo(
    () => feedback.reduce((total, entry) => total + entry.helpful, 0),
    [feedback],
  );

  const averageRating = useMemo(() => {
    if (!feedback.length) return 0;
    const total = feedback.reduce((sum, entry) => sum + entry.rating, 0);
    return (total / feedback.length).toFixed(1);
  }, [feedback]);

  // Sentiment analysis
  const sentimentStats = useMemo(() => {
    const stats = { positive: 0, neutral: 0, negative: 0 };
    feedback.forEach(entry => {
      if (entry.sentiment) stats[entry.sentiment]++;
    });
    const total = feedback.length || 1;
    return {
      positive: { count: stats.positive, percent: ((stats.positive / total) * 100).toFixed(0) },
      neutral: { count: stats.neutral, percent: ((stats.neutral / total) * 100).toFixed(0) },
      negative: { count: stats.negative, percent: ((stats.negative / total) * 100).toFixed(0) },
    };
  }, [feedback]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedback.forEach(entry => {
      if (entry.rating >= 1 && entry.rating <= 5) {
        dist[entry.rating]++;
      }
    });
    return dist;
  }, [feedback]);

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
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-200"
            >
              Refresh Data
            </Button>
            <Button
              onClick={() => toast("Export coming soon")}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200"
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }} 
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-5 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{feedback.length}</p>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Total Reviews</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }} 
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-5 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{publishableCount}</p>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Pending</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }} 
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 p-5 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{respondedCount}</p>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Responded</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -2 }} 
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-5 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{averageRating}</p>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">Avg Rating</p>
          </motion.div>
        </div>

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

  const renderFilters = () => (
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
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-2 border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
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

  const renderAnalytics = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Sentiment Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
      >
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          Sentiment Analysis
        </h3>
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">😊</span>
              <span className="text-emerald-700 font-bold text-lg">Positive</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-black text-2xl">{sentimentStats.positive.count}</p>
              <p className="text-sm text-emerald-600 font-bold">{sentimentStats.positive.percent}%</p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border-2 border-amber-200 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">😐</span>
              <span className="text-amber-700 font-bold text-lg">Neutral</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-black text-2xl">{sentimentStats.neutral.count}</p>
              <p className="text-sm text-amber-600 font-bold">{sentimentStats.neutral.percent}%</p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 rounded-xl bg-red-50 border-2 border-red-200 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">😢</span>
              <span className="text-red-700 font-bold text-lg">Negative</span>
            </div>
            <div className="text-right">
              <p className="text-gray-900 font-black text-2xl">{sentimentStats.negative.count}</p>
              <p className="text-sm text-red-600 font-bold">{sentimentStats.negative.percent}%</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Rating Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6"
      >
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Star className="h-6 w-6 text-white fill-white" />
          </div>
          Rating Distribution
        </h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = ratingDistribution[rating];
            const percent = feedback.length > 0 ? ((count / feedback.length) * 100).toFixed(0) : 0;
            
            // Color scheme based on rating
            const colorScheme = rating >= 4 
              ? { bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'from-emerald-400 to-green-500', text: 'text-emerald-700' }
              : rating === 3
              ? { bg: 'bg-amber-50', border: 'border-amber-200', bar: 'from-amber-400 to-orange-500', text: 'text-amber-700' }
              : { bg: 'bg-red-50', border: 'border-red-200', bar: 'from-red-400 to-rose-500', text: 'text-red-700' };
            
            return (
              <motion.div
                key={rating}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: rating * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className={`${colorScheme.bg} border-2 ${colorScheme.border} rounded-xl p-4 transition-all duration-300 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${idx < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-bold uppercase ${colorScheme.text}`}>
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${colorScheme.text}`}>{count}</span>
                    <span className="text-xs font-bold text-gray-600">({percent}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, delay: rating * 0.1, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${colorScheme.bar}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );

  const renderFeedbackList = () => (
    <div className="space-y-6">
      {filteredFeedback.length === 0 ? (
        <Card className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 border-2 border-gray-200">
            <Search className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">No feedback found</h3>
          <p className="text-base text-gray-600 mb-6 font-medium">
            {hasActiveFilters ? "Try adjusting your filters to see more results." : "No feedback matches your criteria."}
          </p>
          {hasActiveFilters && (
            <Button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        filteredFeedback.map((entry) => {
          const badge = getStatusBadge(entry.status);
          const sentimentConfig = {
            positive: { icon: '😊', color: 'green', label: 'Positive' },
            neutral: { icon: '😐', color: 'yellow', label: 'Neutral' },
            negative: { icon: '😢', color: 'red', label: 'Negative' },
          };
          const sentiment = sentimentConfig[entry.sentiment] || sentimentConfig.neutral;
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Header Section with subtle background */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b-2 border-gray-200">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h2 className="text-lg font-black text-gray-900">
                          {entry.roomTitle} · Room {entry.roomNumber}
                        </h2>
                      <Badge
                        variant={badge.variant}
                        className={`px-2.5 py-1 font-bold text-xs uppercase tracking-wider rounded-lg ${
                          badge.variant === 'success'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-amber-100 text-amber-700 border border-amber-300'
                        }`}
                      >
                        {badge.label}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                          sentiment.color === 'green' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : sentiment.color === 'red'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-amber-100 text-amber-700 border border-amber-300'
                        }`}
                      >
                        {sentiment.icon} {sentiment.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="h-4 w-4 text-gray-500" />
                        {entry.guestName}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(entry.stayDate)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <ThumbsUp className="h-4 w-4 text-gray-500" />
                        {entry.helpful}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`h-5 w-5 ${index < entry.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                      />
                    ))}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="mb-5 space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">{entry.title}</h3>
                    <p className="leading-relaxed text-gray-700 text-sm font-medium">{entry.comment}</p>
                  </div>

                {(entry.highlights.length > 0 || entry.concerns.length > 0) && (
                  <div className="mb-5 grid gap-4 lg:grid-cols-2">
                    {entry.highlights.length > 0 && (
                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5">
                        <h4 className="text-sm font-black text-emerald-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <span className="text-lg">✨</span>
                          HIGHLIGHTS
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {entry.highlights.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700 font-medium">
                              <span className="text-emerald-600 font-black mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {entry.concerns.length > 0 && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                        <h4 className="text-sm font-black text-red-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <span className="text-lg">⚠️</span>
                          NEEDS ATTENTION
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {entry.concerns.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700 font-medium">
                              <span className="text-red-600 font-black mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t-2 border-gray-200 pt-5">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkHelpful(entry.id)}
                      className="border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 font-bold shadow-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Helpful
                    </Button>
                  </motion.div>
                  {entry.status === "pending" && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRespond(entry)}
                        className="border-2 border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100 font-bold shadow-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <Reply className="h-4 w-4" />
                        Respond
                      </Button>
                    </motion.div>
                  )}
                  {entry.status === "pending" && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublish(entry)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 font-bold shadow-md transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Publish
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 hover:bg-gray-100 font-bold shadow-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2"
                      onClick={() => handleArchive(entry)}
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  </motion.div>
                </div>

                {entry.response?.hasResponse && (
                  <div className="mt-5 border-2 border-emerald-200 bg-emerald-50 p-5 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-emerald-700 text-sm">
                          Response from {entry.response.respondedBy}
                        </span>
                        <span className="text-gray-600 text-xs ml-2 font-medium">• {formatDate(entry.response.respondedAt)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 pl-8 text-sm leading-relaxed font-medium">{entry.response.message}</p>
                  </div>
                )}
                </div>
              </Card>
            </motion.div>
          );
        })
      )}
    </div>
  );

  const renderResponseModal = () => (
    <AnimatePresence>
      {showResponseModal && selectedFeedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setShowResponseModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 border-2 border-orange-500/40 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-10 border-b-2 border-orange-500/30 bg-gradient-to-r from-orange-900/30 to-red-900/30">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300">Respond to {selectedFeedback.guestName}</h2>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="p-3 hover:bg-orange-500/20 rounded-2xl transition-all duration-500 hover:scale-110"
                >
                  <X className="h-8 w-8 text-orange-300" />
                </button>
              </div>
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-800/70 to-gray-900/70 rounded-2xl border-2 border-orange-500/40 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-yellow-300 font-black text-2xl">{selectedFeedback.rating}</span>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${i < selectedFeedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-200 text-lg leading-relaxed">{selectedFeedback.comment}</p>
              </div>
            </div>
            <div className="p-10">
              <label className="block text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-red-300 mb-4">Your Response</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                rows={8}
                className="w-full px-6 py-5 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all duration-300 shadow-sm text-base font-medium"
              />
              <div className="flex justify-end gap-6 mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedFeedback(null);
                    setResponseText('');
                  }}
                  className="border-2 border-gray-500 text-gray-300 hover:border-gray-400 hover:bg-gray-700/50 px-8 py-4 rounded-2xl font-black transition-all duration-500"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendResponse}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400 font-black px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/30 transition-all duration-500"
                >
                  <Send className="mr-3 h-6 w-6" />
                  Send Response
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
                <Button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Try Again
                </Button>
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
          <Card className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No feedback yet</h3>
            <p className="mt-2 text-gray-600 font-medium">
              Once guests start sharing their experiences, you will see them here.
            </p>
            <Button
              className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
              onClick={handleRefresh}
            >
              Refresh now
            </Button>
          </Card>
        ) : (
          <>
            {renderFilters()}
            {renderAnalytics()}
            {renderFeedbackList()}
          </>
        )}
      </div>

      {renderResponseModal()}
    </ManagerLayout>
  );
};

export default ManagerFeedbackPage;
