import { motion } from "framer-motion";
import { Clock, User, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";

const priorityStyles = {
	Low: "bg-gradient-to-r from-teal-500/25 to-cyan-500/20 text-teal-100 border border-teal-400/50 shadow-md shadow-teal-400/25",
	Normal: "bg-gradient-to-r from-slate-500/25 to-gray-500/20 text-slate-100 border border-slate-400/50 shadow-md",
	High: "bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-amber-100 border border-amber-400/50 shadow-md shadow-amber-400/25",
	Urgent: "bg-gradient-to-r from-rose-500/30 to-red-500/25 text-rose-100 border border-rose-400/60 shadow-md shadow-rose-400/30",
};

export const TaskCard = ({ task, onClick }) => {
	const resolvePriorityKey = (priority) => {
		if (!priority) return "Normal";
		const normalized = String(priority).toLowerCase();
		if (normalized === "low") return "Low";
		if (normalized === "medium" || normalized === "normal") return "Normal";
		if (normalized === "high") return "High";
		if (normalized === "urgent" || normalized === "critical") return "Urgent";
		return "Normal";
	};

	const priorityKey = resolvePriorityKey(task?.priority || task?.priorityLabel);
	const suggestedStaff = task?.suggestedStaff || task?.assignedStaffName || "Awaiting assignment";
	const aiMatch = Number.isFinite(task?.aiMatch) ? task.aiMatch : task?.matchScore || 0;
	const locationLabel = task?.room || task?.locationLabel;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.96, y: 10 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: -10 }}
			whileHover={{ scale: 1.02, y: -3 }}
			transition={{ duration: 0.2 }}
			className="group cursor-pointer space-y-3.5 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/85 via-slate-850/80 to-slate-900/85 backdrop-blur-sm p-4 shadow-lg hover:border-slate-600/60 hover:shadow-xl transition-all duration-200"
			onClick={onClick}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex-1 min-w-0">
					<h4 className="mb-2 font-bold text-white text-sm leading-snug line-clamp-2">
						{task?.title || "Untitled Task"}
					</h4>
					<div className="flex items-center gap-2 flex-wrap text-xs">
						<span className="px-2.5 py-1 rounded-md bg-slate-700/50 text-slate-200 border border-slate-600/40 font-medium">
							{task?.department || "General"}
						</span>
						{locationLabel && (
							<span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-violet-600/30 to-purple-600/25 text-violet-200 border border-violet-500/50 font-medium">
								<MapPin className="h-3 w-3" />
								{locationLabel}
							</span>
						)}
					</div>
				</div>
				<ManagerBadge className={`${priorityStyles[priorityKey] || priorityStyles.Normal} text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap`}>
					{task?.priorityLabel || task?.priority || "Normal"}
				</ManagerBadge>
			</div>

			{/* AI Suggestion */}
			<div className="rounded-lg border border-indigo-500/40 bg-gradient-to-br from-indigo-950/50 via-purple-950/45 to-violet-950/50 p-3 shadow-md">
				<div className="flex items-center gap-2.5">
					<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/25 flex items-center justify-center border border-indigo-400/40">
						<Sparkles className="h-3.5 w-3.5 text-indigo-200" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-[10px] text-indigo-200 font-bold mb-0.5 uppercase tracking-wider">AI Match</p>
						<p className="text-xs text-slate-100 truncate font-medium">{suggestedStaff}</p>
					</div>
					<span className="text-sm font-bold text-indigo-200">{aiMatch ? `${aiMatch}%` : "--"}</span>
				</div>
			</div>

			{/* Buttons */}
			<div className="flex gap-2 pt-0.5">
				<Button
						size="sm"
						className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all text-xs font-bold h-8 shadow-md shadow-indigo-500/25"
						onClick={(e) => {
							e.stopPropagation();
							onClick?.();
						}}
				>
					<User className="mr-1 h-3.5 w-3.5" />
					Assign
				</Button>
				<Button
						size="sm"
						variant="outline"
						className="flex-1 border border-slate-600/60 bg-slate-700/40 text-slate-200 hover:bg-slate-600/50 hover:border-slate-500/70 transition-all text-xs font-bold h-8"
						onClick={(e) => {
							e.stopPropagation();
							onClick?.();
						}}
				>
					<Clock className="mr-1 h-3.5 w-3.5" />
					Details
				</Button>
			</div>
		</motion.div>
	);
};
