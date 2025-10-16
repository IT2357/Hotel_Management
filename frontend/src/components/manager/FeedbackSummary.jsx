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
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-1">Guest Feedback</h3>
          <p className="text-sm text-muted-foreground">Latest guest reviews</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient">
          <Star className="w-5 h-5 text-background fill-background" />
          <span className="text-2xl font-bold text-background">4.8</span>
        </div>
      </div>

      <div className="glass-card p-4 bg-success/5 border border-success/30 rounded-xl">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <p className="text-sm font-medium text-foreground">
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
            className="glass-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{feedback.guest}</p>
                <p className="text-xs text-muted-foreground">Room {feedback.room}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < feedback.rating
                        ? "text-primary fill-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">"{feedback.comment}"</p>
          </motion.div>
        ))}
      </div>

      <Button variant="outline" className="w-full border-border/50 hover:bg-secondary/80">
        View All Feedback
      </Button>
    </motion.div>
  );
};
