import { motion } from "framer-motion";
import { Clock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";

const priorityColors = {
	Low: "bg-info/20 text-info border-info/50",
	Normal: "bg-secondary/20 text-foreground border-border",
	High: "bg-warning/20 text-warning border-warning/50",
	Urgent: "bg-destructive/20 text-destructive border-destructive/50",
};

export const TaskCard = ({ task, onClick }) => {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			whileHover={{ scale: 1.02 }}
			className="glass-card p-4 space-y-3 cursor-pointer hover:border-primary/50 transition-all duration-300"
			onClick={onClick}
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h4 className="font-semibold text-foreground mb-1">{task.title}</h4>
					<p className="text-xs text-muted-foreground">{task.department}</p>
					{task.room && <p className="text-xs text-primary font-medium mt-1">Room {task.room}</p>}
				</div>
				<ManagerBadge className={`${priorityColors[task.priority]} text-xs`}>
					{task.priority}
				</ManagerBadge>
			</div>

			<div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
				<Sparkles className="w-4 h-4 text-primary" />
				<div className="flex-1">
					<p className="text-xs font-medium text-foreground">AI Suggested</p>
					<p className="text-xs text-muted-foreground">{task.suggestedStaff}</p>
				</div>
				<span className="text-xs font-bold text-primary">{task.aiMatch}%</span>
			</div>

			<div className="flex gap-2">
						<Button
					size="sm"
					className="flex-1 bg-primary hover:bg-primary/90 text-background"
					onClick={(e) => {
						e.stopPropagation();
						onClick?.();
					}}
				>
					<User className="w-3 h-3 mr-1" />
					Assign
						</Button>
						<Button
					size="sm"
					variant="outline"
					className="flex-1 border-border/50 hover:bg-secondary/80"
					onClick={(e) => {
						e.stopPropagation();
						onClick?.();
					}}
				>
					<Clock className="w-3 h-3 mr-1" />
					Details
						</Button>
			</div>
		</motion.div>
	);
};
