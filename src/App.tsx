import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from "recharts";
import { AlertCircle, Ghost, PieChart as PieChartIcon, Star, TrendingUp } from "lucide-react";
import { AppView, TaskCategory, type AiTaskBreakdownResult, type DailyLog, type RewardState, type Task, type UserSettings, type WeekPlan } from "./types";
import FloatingNav from "./components/FloatingNav";
import Mascot from "./components/Mascot";
import TaskCard from "./components/TaskCard";
import FocusTimer from "./components/FocusTimer";
import LogView from "./components/LogView";
import WeekView from "./components/WeekView";
import SettingsView from "./components/SettingsView";
import { createId, db, loadSettings, loadSnapshot, resetLocalData, saveSettings, seedFirstRunTasks } from "./storage";
import { activeDaysInPastWeek, applyReviewReward, applyTaskReward, titleForLevel } from "./rewards";

function taskStatusRank(status: Task["status"]) {
  const ranks: Record<Task["status"], number> = {
    suggested: 0,
    skipped: 0,
    started: 1,
    partial: 2,
    completed: 3,
  };
  return ranks[status];
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>(AppView.TODAY);
  const [showFocus, setShowFocus] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [reward, setReward] = useState<RewardState | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const refreshSnapshot = useCallback(async () => {
    const snapshot = await loadSnapshot();
    setTasks(snapshot.tasks);
    setWeekPlans(snapshot.weekPlans);
    setLogs(snapshot.logs);
    setReward(snapshot.reward);
  }, []);

  useEffect(() => {
    async function load() {
      await seedFirstRunTasks();
      await refreshSnapshot();
      setIsLoaded(true);
    }

    load();
  }, [refreshSnapshot]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTasks = useMemo(
    () => tasks.filter((task) => task.date === todayStr && task.status !== "skipped"),
    [tasks, todayStr],
  );
  const carryOverTasks = useMemo(
    () => tasks.filter((task) => task.date !== todayStr && task.status !== "completed" && task.status !== "skipped").slice(0, 2),
    [tasks, todayStr],
  );
  const openTodayTasks = todayTasks.filter((task) => task.status !== "completed");
  const totalCompleted = useMemo(() => tasks.filter((task) => task.status === "completed").length, [tasks]);
  const activeDays = reward ? activeDaysInPastWeek(reward.activeDates, new Date()) : 0;
  const latestWeekPlan = weekPlans.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const categoryRadarData = useMemo(() => {
    return Object.values(TaskCategory).map((category) => ({
      subject: category,
      A: tasks.filter((task) => task.category === category && task.status === "completed").length * 10,
      fullMark: 100,
    }));
  }, [tasks]);

  const historyData = useMemo(() => {
    return Object.entries(
      tasks.reduce((acc, task) => {
        if (!acc[task.date]) acc[task.date] = [];
        acc[task.date].push(task);
        return acc;
      }, {} as Record<string, Task[]>),
    ).sort((a, b) => b[0].localeCompare(a[0]));
  }, [tasks]);

  const showReward = useCallback((xp: number, fullScreen = false) => {
    if (xp <= 0) return;

    setXpGained(xp);
    setShowCelebration(true);

    if (fullScreen) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#007AFF", "#34C759", "#FF9500"],
      });
    }

    if (settings.vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate(fullScreen ? [30, 30, 50] : 20);
    }

    window.setTimeout(() => setShowCelebration(false), 2200);
  }, [settings.vibrationEnabled]);

  const updateTaskStatus = useCallback(async (task: Task, nextStatus: Task["status"]) => {
    if (!reward) return undefined;

    const now = new Date().toISOString();
    const action = nextStatus === "started" || nextStatus === "partial" || nextStatus === "completed" ? nextStatus : null;
    const rewardResult = action ? applyTaskReward(reward, task, action) : { reward, xpAdded: 0 };
    const nextTask: Task = {
      ...task,
      status: taskStatusRank(nextStatus) > taskStatusRank(task.status) ? nextStatus : task.status,
      xp: task.xp + rewardResult.xpAdded,
      awardedActions: action && !task.awardedActions.includes(action) ? [...task.awardedActions, action] : task.awardedActions,
      updatedAt: now,
    };

    await db.transaction("rw", db.tasks, db.rewards, async () => {
      await db.tasks.put(nextTask);
      await db.rewards.put(rewardResult.reward);
    });

    setTasks((current) => current.map((item) => (item.id === task.id ? nextTask : item)));
    setReward(rewardResult.reward);
    showReward(rewardResult.xpAdded, nextStatus === "completed");
    return nextTask;
  }, [reward, showReward]);

  const handleStartTask = async (task: Task) => {
    const nextTask = await updateTaskStatus(task, "started");
    setShowFocus(nextTask || { ...task, status: "started" });
  };

  const handleSkipTask = async (task: Task) => {
    const reason = window.prompt("跳过也没关系，简单记一下原因：");
    if (reason === null) return;

    const nextTask = {
      ...task,
      status: "skipped" as const,
      skipReason: reason.trim() || "今天先放过自己",
      updatedAt: new Date().toISOString(),
    };
    await db.tasks.put(nextTask);
    setTasks((current) => current.map((item) => (item.id === task.id ? nextTask : item)));
  };

  const handlePlanCreated = async (goals: string, result: AiTaskBreakdownResult) => {
    const now = new Date().toISOString();
    const weekId = createId("week");
    const plan: WeekPlan = {
      id: weekId,
      startDate: todayStr,
      rawGoals: goals,
      theme: result.theme,
      projects: result.projects.map((project) => ({
        ...project,
        id: createId("project"),
        tasks: project.tasks.map((task) => ({ ...task, id: createId("planned") })),
      })),
      encouragement: result.encouragement,
      createdAt: now,
      updatedAt: now,
    };

    const todayTasksToAdd: Task[] = result.today.slice(0, settings.dailyCapacity).map((task) => ({
      id: createId("task"),
      date: todayStr,
      weekId,
      title: task.title,
      category: task.category,
      minutes: task.minutes,
      energy: task.energy,
      status: "suggested",
      xp: 0,
      awardedActions: [],
      createdAt: now,
      updatedAt: now,
    }));

    await db.transaction("rw", db.weekPlans, db.tasks, async () => {
      await db.weekPlans.put(plan);
      await db.tasks.bulkPut(todayTasksToAdd);
    });

    await refreshSnapshot();
    setActiveView(AppView.TODAY);
  };

  const handleSaveLog = async (log: DailyLog) => {
    if (!reward) return;

    const existing = await db.dailyLogs.get(log.date);
    const rewardResult = applyReviewReward(reward, log, Boolean(existing?.reflection));

    await db.transaction("rw", db.dailyLogs, db.rewards, async () => {
      await db.dailyLogs.put(log);
      await db.rewards.put(rewardResult.reward);
    });

    setLogs((current) => [log, ...current.filter((item) => item.date !== log.date)]);
    setReward(rewardResult.reward);
    showReward(rewardResult.xpAdded);
  };

  const handleSaveSettings = (nextSettings: UserSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleExportData = async () => {
    const snapshot = await loadSnapshot();
    const blob = new Blob([JSON.stringify({ ...snapshot, settings }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `manmanlai-${todayStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    await resetLocalData();
    await seedFirstRunTasks();
    await refreshSnapshot();
  };

  const renderToday = () => (
    <div className="space-y-10 pb-32 pt-4">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[13px] font-bold text-primary uppercase tracking-wider">
            {format(new Date(), "M月d日 EEEE", { locale: zhCN })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">慢慢来</h1>
          <p className="secondary-label underline-offset-4 decoration-primary/20 decoration-2">
            今天不需要做到完美，只需要开始一点点。
          </p>
        </div>
        <div className="shrink-0 pt-4">
          <Mascot size={56} status={todayTasks.some((task) => task.status === "completed") ? "happy" : "tired"} />
        </div>
      </header>

      {carryOverTasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-danger">
            <AlertCircle size={18} />
            <h2 className="text-sm font-bold uppercase tracking-tight">之前还没做完</h2>
          </div>
          <div className="flex flex-col gap-3">
            {carryOverTasks.map((task) => (
              <TaskCard key={task.id} task={task} onStart={handleStartTask} onSkip={handleSkipTask} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold">今日建议</h2>
          <span className="secondary-label bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full">
            {openTodayTasks.length} 待办
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {openTodayTasks.map((task) => (
            <TaskCard key={task.id} task={task} onStart={handleStartTask} onSkip={handleSkipTask} />
          ))}
          {openTodayTasks.length === 0 && (
            <div className="apple-card p-10 text-center space-y-3 opacity-70">
              <p className="font-bold">今天已经有行动了</p>
              <p className="text-xs">不用加码，慢慢来就好。</p>
            </div>
          )}
        </div>
      </section>

      <div className="apple-card p-5 flex items-center gap-4 bg-primary/5 border-none shadow-none">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
          <Star size={20} className="text-primary fill-primary" />
        </div>
        <p className="text-[13px] font-medium leading-snug">
          “过去 7 天有 {activeDays} 天点亮了火苗，今天也可以只做最小一步。”
        </p>
      </div>
    </div>
  );

  const renderGrowth = () => {
    if (!reward) return null;

    return (
      <div className="space-y-10 pb-32 pt-4">
        <header className="text-center space-y-3">
          <div className="inline-flex flex-col items-center">
            <span className="text-4xl font-bold font-display tracking-tight">Lv {reward.level}</span>
            <span className="secondary-label font-bold tracking-wider uppercase text-primary mt-1">{titleForLevel(reward.level)}</span>
          </div>

          <div className="max-w-[280px] mx-auto space-y-2">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (reward.xp % 100) || 3)}%` }}
                transition={{ duration: 1, ease: [0.32, 1, 0.2, 1] }}
              />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{reward.xp} XP</p>
          </div>
        </header>

        <section className="apple-card p-6 space-y-6">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary" /> 完成度分析
          </h2>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryRadarData}>
                <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600 }} />
                <Radar name="行动力" dataKey="A" stroke="#007AFF" fill="#007AFF" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="apple-card p-6 space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" /> 28日行动足迹
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, index) => {
              const date = subDays(new Date(), 27 - index);
              const dateStr = format(date, "yyyy-MM-dd");
              const dayTasks = tasks.filter((task) => task.date === dateStr);
              const intensity = dayTasks.length > 0 ? dayTasks.filter((task) => task.status === "completed").length / dayTasks.length : 0;

              return (
                <div
                  key={dateStr}
                  title={dateStr}
                  className={`aspect-square rounded-[4px] transition-colors ${
                    intensity >= 1 ? "bg-primary" :
                      intensity >= 0.5 ? "bg-primary/50" :
                        intensity > 0 ? "bg-primary/20" : "bg-gray-100 dark:bg-zinc-800"
                  }`}
                />
              );
            })}
          </div>
        </section>

        <section className="apple-card p-6 space-y-4">
          <h2 className="text-[17px] font-bold">历程记录</h2>
          <div className="space-y-4 overflow-y-auto max-h-60 pr-2">
            {historyData.map(([date, dayTasks]) => (
              <div key={date} className="space-y-2">
                <p className="text-[11px] font-bold text-gray-400 sticky top-0 bg-transparent py-1 uppercase tracking-widest">{date}</p>
                <div className="space-y-1.5">
                  {dayTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${task.status === "completed" ? "bg-success" : "bg-gray-300"}`} />
                        <span className={`truncate text-sm ${task.status === "completed" ? "" : "text-gray-500 opacity-70"}`}>{task.title}</span>
                      </div>
                      <span className="ml-2 shrink-0 text-[10px] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full opacity-60">{task.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="apple-card p-6 border-none overflow-hidden flex flex-col gap-4">
          <h2 className="text-[17px] font-bold">小狐狸的房间</h2>
          <div className="h-56 bg-zinc-50 dark:bg-zinc-900 rounded-2xl relative overflow-hidden flex items-center justify-center border border-black/5 dark:border-white/5">
            <div className="absolute inset-0" style={{ background: `rgba(255, 255, 255, ${reward.roomState.light / 160})` }} />
            <Mascot size={110} status={totalCompleted > 2 ? "happy" : "thinking"} />
            <Ghost className="absolute top-8 right-8 text-primary/10" size={32} />
            {reward.roomState.plants > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-8 right-8 text-2xl">🪴</motion.div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-[10%] bg-zinc-200/40 dark:bg-white/5" />
          </div>
          <p className="secondary-label text-center">现实行动会让这里一点点亮起来。</p>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark safe-areas max-w-md mx-auto p-6 md:p-8 overflow-x-hidden">
      {!isLoaded ? (
        <div className="h-screen flex items-center justify-center">
          <Mascot size={80} status="thinking" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeView === AppView.TODAY && (
            <motion.div key="today" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {renderToday()}
            </motion.div>
          )}
          {activeView === AppView.REWARDS && (
            <motion.div key="rewards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {renderGrowth()}
            </motion.div>
          )}
          {activeView === AppView.WEEK && (
            <motion.div key="week" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
              <WeekView settings={settings} lastTheme={latestWeekPlan?.theme} onPlanCreated={handlePlanCreated} />
            </motion.div>
          )}
          {activeView === AppView.LOG && (
            <motion.div key="log" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <LogView settings={settings} onSaveLog={handleSaveLog} />
            </motion.div>
          )}
          {activeView === AppView.SETTINGS && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsView settings={settings} onSaveSettings={handleSaveSettings} onExportData={handleExportData} onResetData={handleResetData} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <FloatingNav activeView={activeView} onViewChange={setActiveView} />

      <AnimatePresence>
        {showFocus && (
          <FocusTimer
            task={showFocus}
            onBack={() => setShowFocus(null)}
            onPartial={async (task) => {
              await updateTaskStatus(task, "partial");
              setShowFocus(null);
            }}
            onComplete={async (task) => {
              await updateTaskStatus(task, "completed");
              setShowFocus(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 backdrop-blur-sm bg-black/10 pointer-events-none"
          >
            <div className="apple-card bg-white dark:bg-zinc-900 p-10 text-center space-y-5 shadow-2xl flex flex-col items-center max-w-[320px]">
              <Mascot status="excited" size={140} />
              <div className="space-y-1">
                <h2 className="text-4xl font-bold tracking-tighter text-primary">+{xpGained} XP</h2>
                <p className="text-[17px] font-semibold">你已经开始行动了</p>
              </div>
              <p className="secondary-label leading-relaxed text-center">
                今天已经比昨天更进一步啦。<br />保持这个节奏就很好。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
