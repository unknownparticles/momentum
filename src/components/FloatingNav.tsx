import { Home, Calendar, Trophy, MessageSquare, Settings } from "lucide-react";
import { AppView } from "../types";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export default function FloatingNav({ activeView, onViewChange }: NavProps) {
  const items = [
    { view: AppView.TODAY, icon: Home, label: "今日" },
    { view: AppView.WEEK, icon: Calendar, label: "本周" },
    { view: AppView.REWARDS, icon: Trophy, label: "成长" },
    { view: AppView.LOG, icon: MessageSquare, label: "复盘" },
    { view: AppView.SETTINGS, icon: Settings, label: "设置" },
  ];

  return (
    <nav className="dock space-x-1">
      {items.map((item) => {
        const isActive = activeView === item.view;
        const Icon = item.icon;
        
        return (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            aria-label={item.label}
            className="group relative flex flex-col items-center justify-center w-14 h-14"
          >
            {isActive && (
              <motion.div
                layoutId="dock-indicator"
                className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon 
              size={24} 
              strokeWidth={isActive ? 2.5 : 2}
              className={cn(
                "transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-gray-400 group-hover:text-gray-600"
              )}
            />
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
