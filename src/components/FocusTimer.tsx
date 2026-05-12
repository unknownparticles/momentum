import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { type Task } from "../types";

interface FocusTimerProps {
  task: Task;
  onBack: () => void;
  onPartial: (task: Task) => void;
  onComplete: (task: Task) => void;
}

export default function FocusTimer({ task, onBack, onPartial, onComplete }: FocusTimerProps) {
  const totalSeconds = useMemo(() => Math.max(60, Math.min(task.minutes, 30) * 60), [task.minutes]);
  const [seconds, setSeconds] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    const interval = window.setInterval(() => {
      setSeconds((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isActive, seconds]);

  useEffect(() => {
    if (seconds === 0) {
      setIsActive(false);
      onComplete(task);
    }
  }, [onComplete, seconds, task]);

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const remainingSeconds = value % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const progress = 1 - seconds / totalSeconds;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center"
    >
      <header className="w-full p-6 flex justify-between items-center max-w-md">
        <button onClick={onBack} className="secondary-label min-h-11 font-bold text-primary px-2 py-1">
          取消
        </button>
        <span className="font-bold">专注中</span>
        <div className="w-10" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 w-full max-w-md gap-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">{task.title}</h2>
          <p className="secondary-label">先做 {Math.min(task.minutes, 5)} 分钟也算开始。保持呼吸，慢慢来。</p>
        </div>

        <div className="relative w-72 h-72 flex items-center justify-center">
          <svg className="absolute inset-x-0 top-0 w-full h-full -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="138"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-100 dark:text-zinc-900"
            />
            <motion.circle
              cx="144"
              cy="144"
              r="138"
              fill="none"
              stroke="#007AFF"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={867}
              animate={{ strokeDashoffset: 867 * (1 - progress) }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </svg>
          <span className="text-7xl font-display font-medium tracking-tighter tabular-nums">
            {formatTime(seconds)}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsActive(!isActive)}
            className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center active:scale-95 transition-transform"
            aria-label={isActive ? "暂停" : "继续"}
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={() => onPartial(task)}
            className="min-h-11 px-6 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-full font-bold text-sm active:scale-95 transition-transform"
          >
            做了一点
          </button>
          <button
            onClick={() => onComplete(task)}
            className="min-h-11 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm active:scale-95 transition-transform"
          >
            完成了
          </button>
        </div>
      </main>
    </motion.div>
  );
}
