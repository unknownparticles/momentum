import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Mascot from "./Mascot";
import { Footprints, Loader2, Moon, Send, Smile, Frown, Meh } from "lucide-react";
import { generateReflectionFeedback } from "../services/aiService";
import { type DailyLog, type ExerciseState, type MoodState, type SleepState, type UserSettings } from "../types";

interface LogViewProps {
  settings: UserSettings;
  onSaveLog: (log: DailyLog) => Promise<void>;
}

export default function LogView({ settings, onSaveLog }: LogViewProps) {
  const [mood, setMood] = useState<MoodState>("normal");
  const [sleep, setSleep] = useState<SleepState>("ok");
  const [exercise, setExercise] = useState<ExerciseState>("some");
  const [steps, setSteps] = useState("");
  const [reflection, setReflection] = useState("");
  const [tomorrowSmallStep, setTomorrowSmallStep] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const moods = [
    { label: "很累", icon: Frown, value: "low" as MoodState, color: "text-red-500" },
    { label: "一般", icon: Meh, value: "normal" as MoodState, color: "text-amber-500" },
    { label: "不错", icon: Smile, value: "good" as MoodState, color: "text-green-500" },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const log: DailyLog = {
      date: now.slice(0, 10),
      sleep,
      exercise,
      mood,
      steps: steps ? Number(steps) : undefined,
      reflection,
      tomorrowSmallStep,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const aiFeedback = await generateReflectionFeedback(settings, log);
      const logWithFeedback = { ...log, aiFeedback };
      await onSaveLog(logWithFeedback);
      setFeedback(aiFeedback);
    } catch {
      const fallback = "今天愿意记录下来，就已经是在重新点亮火苗了。明天只做最小一步也可以。";
      await onSaveLog({ ...log, aiFeedback: fallback });
      setFeedback(fallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-32 pt-4">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">每日复盘</h1>
        <p className="secondary-label">30 秒记录今天的小行动</p>
      </header>

      <section className="apple-card p-6 space-y-8">
        <div className="space-y-4">
          <label className="text-[15px] font-bold block px-1">今天状态怎么样？</label>
          <div className="flex justify-between gap-3">
            {moods.map((item) => {
              const Icon = item.icon;
              const isActive = mood === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setMood(item.value)}
                  className={`flex-1 min-h-20 py-4 rounded-2xl transition-all flex flex-col items-center gap-2 border ${
                    isActive
                      ? "bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20"
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <Icon className={isActive ? item.color : "text-gray-400"} size={28} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? "text-black dark:text-white" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[15px] font-bold flex items-center gap-2 px-1">
            <Moon size={16} className="text-indigo-500" /> 睡眠
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["poor", "睡得差"],
              ["ok", "一般"],
              ["good", "不错"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSleep(value as SleepState)}
                className={`min-h-11 rounded-full text-sm font-bold ${sleep === value ? "bg-primary text-white" : "bg-black/5 text-gray-500 dark:bg-white/10"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[15px] font-bold flex items-center gap-2 px-1">
            <Footprints size={16} className="text-green-500" /> 运动
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["none", "没运动"],
              ["some", "动了一点"],
              ["done", "完成运动"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setExercise(value as ExerciseState)}
                className={`min-h-11 rounded-full text-sm font-bold ${exercise === value ? "bg-success text-white" : "bg-black/5 text-gray-500 dark:bg-white/10"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
            inputMode="numeric"
            placeholder="步数，可不填"
            className="w-full rounded-2xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary dark:bg-white/5"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[15px] font-bold block px-1">今天做了一点什么？</label>
          <textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="哪怕只有一句话..."
            className="w-full h-28 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border-none focus:ring-1 focus:ring-primary outline-none text-[15px] resize-none placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[15px] font-bold block px-1">明天最小一步是什么？</label>
          <input
            value={tomorrowSmallStep}
            onChange={(event) => setTomorrowSmallStep(event.target.value)}
            placeholder="例如：打开项目看 5 分钟"
            className="w-full rounded-2xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary dark:bg-white/5"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-system w-full min-h-12 py-4 text-[15px] font-bold disabled:opacity-30"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? "正在生成明日建议..." : "保存复盘"}
        </button>
      </section>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="apple-card p-6 bg-primary/5 flex gap-4 items-start border-none"
          >
            <div className="shrink-0 mt-1">
              <Mascot size={40} status="happy" />
            </div>
            <p className="text-[14px] leading-relaxed font-medium">“{feedback}”</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
