import React from "react";
import { CheckCircle2, Clock, Flag, Play, Zap } from "lucide-react";
import { motion } from "motion/react";
import { type Task } from "../types";

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
  onSkip: (task: Task) => void;
}

const energyCount = {
  low: 1,
  medium: 2,
  high: 3,
};

const statusLabel: Record<Task["status"], string> = {
  suggested: "待开始",
  started: "开始了",
  partial: "做了一点",
  completed: "完成了",
  skipped: "已跳过",
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onStart, onSkip }) => {
  const energyIcons = Array.from({ length: energyCount[task.energy] }).map((_, index) => (
    <Zap key={index} size={12} className="fill-primary text-primary" />
  ));

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="apple-card p-5 flex flex-col gap-3"
    >
      <div className="flex justify-between items-center">
        <span className="secondary-label px-2.5 py-0.5 bg-black/5 dark:bg-white/10 rounded-full">
          {task.category}
        </span>
        <div className="flex gap-0.5 opacity-60">{energyIcons}</div>
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-semibold leading-snug">{task.title}</h3>
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-[13px] font-medium">
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="opacity-70" />
            {task.minutes} 分钟
          </span>
          <span className="flex items-center gap-1.5">
            <Flag size={14} className="opacity-70" />
            {statusLabel[task.status]}
          </span>
        </div>
      </div>

      {task.status === "completed" ? (
        <div className="mt-2 flex items-center justify-center gap-2 rounded-full bg-success/10 py-3 text-sm font-bold text-success">
          <CheckCircle2 size={16} />
          今天完成了
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <button
            onClick={() => onStart(task)}
            className="btn-system min-h-11 text-sm font-bold"
          >
            <Play size={16} fill="currentColor" />
            开始 {Math.min(task.minutes, 5)} 分钟
          </button>
          <button
            onClick={() => onSkip(task)}
            className="min-h-11 rounded-full bg-black/5 px-4 text-xs font-bold text-gray-500 transition-all active:scale-[0.96] dark:bg-white/10"
          >
            跳过
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;
