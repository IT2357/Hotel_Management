import { motion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";

const recentFeedback = [
  { guest: "Mr. Anderson", room: "307", rating: 5, comment: "Exceptional service! Room was spotless." },
  { guest: "Ms. Thompson", room: "512", rating: 4, comment: "Great stay, quick response to requests." },
  { guest: "Dr. Williams", room: "205", rating: 5, comment: "Staff was incredibly helpful and friendly." },
];

export const FeedbackSummary = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-5 rounded-3xl border border-[#1b335f] bg-gradient-to-b from-[#14284d] via-[#112244] to-[#0b1c36] p-6 shadow-[0_22px_50px_rgba(8,14,29,0.6)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-xl font-semibold text-[#f5f7ff]">Guest Feedback</h3>
          <p className="text-sm text-[#8ba3d0]">Latest guest reviews</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#facc15] px-4 py-2 text-[#0b1b3c] shadow-[0_12px_24px_rgba(250,204,21,0.35)]">
          <Star className="h-5 w-5 fill-[#0b1b3c] text-[#0b1b3c]" />
          <span className="text-2xl font-bold">4.8</span>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1b335f] bg-[#10213f] p-4 text-[#d6e2ff] shadow-[0_16px_36px_rgba(8,14,29,0.45)]">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#34d399]" />
          <p className="text-sm font-medium text-[#f5f7ff]">
            Guest satisfaction up 12% this month
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recentFeedback.map((feedback, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2 rounded-2xl border border-[#1b335f] bg-[#0f1f3d] p-4 text-[#d6e2ff] shadow-[0_16px_36px_rgba(8,14,29,0.45)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#f5f7ff]">{feedback.guest}</p>
                <p className="text-xs text-[#8ba3d0]">Room {feedback.room}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < feedback.rating
                        ? "fill-[#facc15] text-[#facc15]"
                        : "text-[#25335a]"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm italic text-[#8ba3d0]">"{feedback.comment}"</p>
          </motion.div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full rounded-2xl border border-[#1b335f] bg-[#0f1f3d] text-[#d6e2ff] transition-colors hover:bg-[#132b52]"
      >
        View All Feedback
      </Button>
    </motion.div>
  );
};
