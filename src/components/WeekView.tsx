import { useState } from "react";
import { motion } from "motion/react";
import { Lightbulb, Loader2, Plus, Sparkles } from "lucide-react";
import { fallbackWeekPlan, generateWeekPlan } from "../services/aiService";
import { type AiTaskBreakdownResult, type UserSettings } from "../types";

interface WeekViewProps {
  settings: UserSettings;
  lastTheme?: string;
  onPlanCreated: (goals: string, result: AiTaskBreakdownResult) => Promise<void>;
}

const IDEAS = [
  "副业探索",
  "整理房间",
  "慢跑 15 分钟",
  "开发我的 App",
];

export default function WeekView({ settings, lastTheme, onPlanCreated }: WeekViewProps) {
  const [goals, setGoals] = useState(IDEAS.join("\n"));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!goals.trim()) {
      setMessage("先写下一个想慢慢推进的目标。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await generateWeekPlan(settings, goals);
      await onPlanCreated(goals, result);
      setMessage("已生成今天的 3 个小行动。");
    } catch (error) {
      const fallback = fallbackWeekPlan(goals);
      await onPlanCreated(goals, fallback);
      setMessage(error instanceof Error ? `${error.message} 已先用本地规则生成。` : "AI 暂时不可用，已先用本地规则生成。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-32 pt-4">
      <header className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">本周计划</h1>
        <div className="inline-block px-4 py-1.5 bg-warning/10 text-warning rounded-full text-[13px] font-bold">
          {lastTheme || "降低压力，恢复行动感"}
        </div>
      </header>

      <section className="apple-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">这周想慢慢做什么？</h2>
          <Sparkles size={20} className="text-primary" />
        </div>
        <textarea
          value={goals}
          onChange={(event) => setGoals(event.target.value)}
          className="h-40 w-full resize-none rounded-2xl bg-black/5 p-4 text-[15px] outline-none focus:ring-1 focus:ring-primary dark:bg-white/5"
          placeholder="每行写一个目标，例如：整理房间、开发 App、早睡早起"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-system min-h-12 w-full text-[15px] disabled:opacity-40"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading ? "正在拆成小行动..." : "生成今日小行动"}
        </button>
        {message && <p className="text-[12px] font-medium text-gray-500">{message}</p>}
      </section>

      <section className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold">灵感库</h2>
          <button
            onClick={() => setGoals((current) => `${current.trim()}\n`.trimStart())}
            className="w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/10 rounded-full"
            aria-label="添加目标"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {IDEAS.map((idea) => (
            <motion.button
              key={idea}
              whileTap={{ scale: 0.96 }}
              onClick={() => setGoals((current) => `${current.trim()}\n${idea}`.trim())}
              className="apple-card p-6 aspect-square flex items-center justify-center text-center shadow-none"
            >
              <span className="text-[15px] font-bold">{idea}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="apple-card p-5 bg-primary/5 border-none space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Lightbulb size={18} strokeWidth={2.5} />
          <span className="text-sm font-bold">建议</span>
        </div>
        <p className="text-[14px] leading-relaxed font-medium">
          这周不要安排太满。建议每天只完成 2~3 件小任务。保持专注比完成数量更重要。
        </p>
      </section>
    </div>
  );
}
