import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Calendar, MessageCircle, Reply, Star, ThumbsUp, Trash2, Users } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { ManagerLayout } from "@/components/manager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
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
    response: null,
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

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setFeedback(mockGuestFeedback);
    } catch (err) {
      console.error("Failed to load guest feedback", err);
      setError("We couldn't load guest feedback. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const publishableCount = useMemo(
    () => feedback.filter((entry) => entry.status === "pending").length,
    [feedback],
  );

  const publishedCount = useMemo(
    () => feedback.filter((entry) => entry.status === "published").length,
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

  const handleRefresh = async () => {
    await fetchFeedback();
    toast.success("Feedback refreshed", { duration: 1200 });
  };

  const handleRespond = (entry) => {
    toast.info(`Respond to ${entry.guestName}`, {
      description: "Open the CRM to send a personalized reply.",
      duration: 2000,
    });
  };

  const handleArchive = (entry) => {
    toast.warning(`Archived feedback from ${entry.guestName}`, {
      description: "You can restore it from the feedback history view.",
      duration: 1800,
    });
  };

  const handleMarkHelpful = (entryId) => {
    setFeedback((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, helpful: entry.helpful + 1 } : entry,
      ),
    );
  };

  const renderHeader = () => (
    <div className={`${MANAGER_SECTION_CLASS} relative overflow-hidden p-8`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-12%] right-[-10%] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_55%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08)_0%,rgba(15,23,42,0)_40%,rgba(255,255,255,0.05)_70%)] opacity-70" />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Guest Feedback</h1>
            <p className="text-white/70">
              {user?.fullName || user?.name || "Manager"}, review guest sentiment and close the loop on open feedback.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="border-white/20 bg-white/[0.08] text-white shadow-[0_18px_40px_rgba(8,14,29,0.35)] backdrop-blur-lg transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="primary"
              onClick={() => toast("Export coming soon")}
              className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 text-slate-900 shadow-[0_24px_60px_rgba(251,191,36,0.32)] transition-transform duration-300 hover:from-amber-200 hover:via-amber-300 hover:to-amber-200 hover:shadow-[0_28px_70px_rgba(251,191,36,0.4)] hover:-translate-y-0.5"
            >
              Export report
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={`${MANAGER_CARD_SURFACE_CLASS} p-6 text-center text-white`}>
            <p className="text-2xl font-semibold text-white">{feedback.length}</p>
            <p className="text-sm text-white/60">Total reviews</p>
          </Card>
          <Card className={`${MANAGER_CARD_SURFACE_CLASS} p-6 text-center text-white`}>
            <p className="text-2xl font-semibold text-emerald-200">{publishedCount}</p>
            <p className="text-sm text-white/60">Published</p>
          </Card>
          <Card className={`${MANAGER_CARD_SURFACE_CLASS} p-6 text-center text-white`}>
            <p className="text-2xl font-semibold text-amber-200">{publishableCount}</p>
            <p className="text-sm text-white/60">Awaiting response</p>
          </Card>
          <Card className={`${MANAGER_CARD_SURFACE_CLASS} p-6 text-center text-white`}>
            <div className="flex items-center justify-center gap-2 text-amber-200">
              <Star className="h-5 w-5 fill-amber-200 text-amber-200" />
              <p className="text-2xl font-semibold text-white">{averageRating}</p>
            </div>
            <p className="text-sm text-white/60">Average rating</p>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderFeedbackList = () => (
    <div className="space-y-6">
      {feedback.map((entry) => {
        const badge = getStatusBadge(entry.status);
        return (
          <Card
            key={entry.id}
            className={`${MANAGER_SECTION_CLASS} text-white transition-shadow duration-300 hover:shadow-[0_32px_75px_rgba(8,14,29,0.5)]`}
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">
                    {entry.roomTitle} · Room {entry.roomNumber}
                  </h2>
                  <Badge
                    variant={badge.variant}
                    className="border border-white/10 bg-white/[0.08] text-white/80"
                  >
                    {badge.label}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {entry.guestName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Stayed {formatDate(entry.stayDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {entry.helpful} found helpful
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${index < entry.rating ? "fill-amber-200 text-amber-200" : "text-white/20"}`}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <h3 className="text-lg font-medium text-white">{entry.title}</h3>
              <p className="leading-relaxed text-white/70">{entry.comment}</p>
            </div>

            {(entry.highlights.length > 0 || entry.concerns.length > 0) && (
              <div className="mb-4 grid gap-4 lg:grid-cols-2">
                {entry.highlights.length > 0 && (
                  <div className={`${MANAGER_CARD_SURFACE_CLASS} border border-sky-300/20 bg-sky-400/10 p-4`}>
                    <h4 className="text-sm font-semibold text-sky-200">Highlights</h4>
                    <ul className="mt-2 space-y-1 text-sm text-sky-100">
                      {entry.highlights.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {entry.concerns.length > 0 && (
                  <div className={`${MANAGER_CARD_SURFACE_CLASS} border border-rose-300/20 bg-rose-500/10 p-4`}>
                    <h4 className="text-sm font-semibold text-rose-200">Follow-up needed</h4>
                    <ul className="mt-2 space-y-1 text-sm text-rose-100">
                      {entry.concerns.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkHelpful(entry.id)}
                  className="border-white/20 bg-white/[0.08] text-white transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Mark helpful ({entry.helpful})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRespond(entry)}
                  className="border-white/20 bg-white/[0.08] text-white transition-transform duration-300 hover:border-white/25 hover:bg-white/[0.12] hover:-translate-y-0.5"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Respond
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {entry.status === "pending" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setFeedback((prev) =>
                        prev.map((item) =>
                          item.id === entry.id ? { ...item, status: "published" } : item,
                        ),
                      );
                      toast.success("Feedback published", { duration: 1500 });
                    }}
                    className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 text-slate-900 shadow-[0_18px_45px_rgba(52,211,153,0.35)] transition-transform duration-300 hover:from-emerald-200 hover:via-emerald-300 hover:to-emerald-200 hover:shadow-[0_22px_55px_rgba(52,211,153,0.45)] hover:-translate-y-0.5"
                  >
                    Publish
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-400/30 bg-rose-500/10 text-rose-100 transition-transform duration-300 hover:border-rose-300/40 hover:bg-rose-500/15 hover:-translate-y-0.5"
                  onClick={() => handleArchive(entry)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </div>
            </div>

            {entry.response?.hasResponse && (
              <div className={`${MANAGER_CARD_SURFACE_CLASS} mt-4 border border-white/10 p-4`}>
                <div className="flex flex-col gap-1 text-sm text-white/70">
                  <span className="font-semibold text-white">
                    Response from {entry.response.respondedBy}
                  </span>
                  <span className="text-white/60">Sent {formatDate(entry.response.respondedAt)}</span>
                  <p className="text-white/75">{entry.response.message}</p>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <ManagerLayout
      activeItem="feedback"
      onSidebarToggle={handleSidebarToggle}
      onMenuItemSelect={handleMenuItemSelect}
      contentClassName={`${MANAGER_CONTENT_CLASS} py-8`}
    >
      <div className={`${MANAGER_PAGE_CONTAINER_CLASS} max-w-6xl space-y-8`}>
        {renderHeader()}

        {error && (
          <Card className={`${MANAGER_SECTION_CLASS} border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100`}>
            {error}
          </Card>
        )}

        {loading ? (
            <div className={`${MANAGER_SECTION_CLASS} flex min-h-[300px] items-center justify-center`}>
            <Spinner size="lg" />
          </div>
        ) : feedback.length === 0 ? (
          <Card className={`${MANAGER_SECTION_CLASS} p-12 text-center text-white`}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/[0.08]">
              <MessageCircle className="h-8 w-8 text-amber-200" />
            </div>
            <h3 className="text-xl font-semibold text-white">No feedback yet</h3>
            <p className="mt-2 text-white/70">
              Once guests start sharing their experiences, you will see them here.
            </p>
            <Button
              className="mt-6 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 text-slate-900 shadow-[0_24px_60px_rgba(251,191,36,0.32)] transition-transform duration-300 hover:from-amber-200 hover:via-amber-300 hover:to-amber-200 hover:shadow-[0_28px_70px_rgba(251,191,36,0.4)] hover:-translate-y-0.5"
              onClick={handleRefresh}
            >
              Refresh now
            </Button>
          </Card>
        ) : (
          renderFeedbackList()
        )}

        {!loading && feedback.length > 0 && (
          <Card className={`${MANAGER_SECTION_CLASS} p-6 text-white`}>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-white/60">Average rating</p>
                <p className="mt-1 text-2xl font-bold text-white">{averageRating} / 5</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/60">Responses sent</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {feedback.filter((entry) => entry.response?.hasResponse).length}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/60">Total helpful votes</p>
                <p className="mt-1 text-2xl font-bold text-white">{helpfulTotal}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerFeedbackPage;
