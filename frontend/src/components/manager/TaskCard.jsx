import { motion } from "framer-motion";
import { Clock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/manager/ManagerButton";
import { ManagerBadge } from "@/components/manager/ManagerBadge";

const priorityStyles = {
	Low: "border-[#38bdf8]/40 bg-[#102a46] text-[#38bdf8]",
	Normal: "border-[#1b335f] bg-[#132b4f] text-[#f5f7ff]",
	High: "border-[#facc15]/45 bg-[#2a230d] text-[#facc15]",
	Urgent: "border-[#f87171]/45 bg-[#35131f] text-[#f87171]",
};

export const TaskCard = ({ task, onClick }) => {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			whileHover={{ scale: 1.02 }}
			className="cursor-pointer space-y-3 rounded-2xl border border-[#1b335f] bg-[#0e1f42] p-4 text-[#f5f7ff] shadow-[0_16px_40px_rgba(8,14,29,0.55)] transition-all duration-300 hover:shadow-[0_24px_48px_rgba(10,20,48,0.65)]"
			onClick={onClick}
		>
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h4 className="mb-1 font-semibold text-[#f5f7ff]">{task.title}</h4>
					<p className="text-xs text-[#8ba3d0]">{task.department}</p>
					{task.room && <p className="mt-1 text-xs font-medium text-[#facc15]">Room {task.room}</p>}
				</div>
				<ManagerBadge className={`${priorityStyles[task.priority] || priorityStyles.Normal} text-xs`}>
					{task.priority}
				</ManagerBadge>
			</div>

			<div className="flex items-center gap-2 rounded-xl border border-[#2b4174] bg-gradient-to-r from-[#14284c] via-[#13254a] to-[#102140] p-3">
				<Sparkles className="h-4 w-4 text-[#facc15]" />
				<div className="flex-1">
					<p className="text-xs font-medium text-[#f5f7ff]">AI Suggested</p>
					<p className="text-xs text-[#8ba3d0]">{task.suggestedStaff}</p>
				</div>
				<span className="text-xs font-bold text-[#facc15]">{task.aiMatch}%</span>
			</div>

			<div className="flex gap-2">
				<Button
						size="sm"
						className="flex-1 bg-[#facc15] text-[#0b1b3c] hover:bg-[#f9c513]"
						onClick={(e) => {
							e.stopPropagation();
							onClick?.();
						}}
				>
					<User className="mr-1 h-3 w-3" />
					Assign
				</Button>
				<Button
						size="sm"
						variant="outline"
						className="flex-1 border border-[#1b335f] bg-[#10234f] text-[#d6e2ff] transition-colors hover:bg-[#132b5f]"
						onClick={(e) => {
							e.stopPropagation();
							onClick?.();
						}}
				>
					<Clock className="mr-1 h-3 w-3" />
					Details
				</Button>
			</div>
		</motion.div>
	);
};
