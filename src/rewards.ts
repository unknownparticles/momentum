import { differenceInCalendarDays, parseISO } from "date-fns";
import { type DailyLog, type RewardState, TaskCategory, type Task, type TaskStatus } from "./types";

export const XP_BY_ACTION: Record<"started" | "partial" | "completed" | "review", number> = {
  started: 3,
  partial: 5,
  completed: 10,
  review: 8,
};

export function levelFromXp(totalXp: number) {
  return Math.floor(Math.sqrt(totalXp / 40)) + 1;
}

export function titleForLevel(level: number) {
  if (level >= 20) return "Momentum Master";
  if (level >= 10) return "不靠鸡血的人";
  if (level >= 5) return "稳定推进者";
  if (level >= 2) return "小步行动者";
  return "刚刚开始";
}

export function isActiveTaskStatus(status: TaskStatus) {
  return status === "started" || status === "partial" || status === "completed";
}

export function activeDaysInPastWeek(activeDates: string[], today: Date) {
  return activeDates.filter((date) => {
    const diff = differenceInCalendarDays(today, parseISO(date));
    return diff >= 0 && diff < 7;
  }).length;
}

export function applyTaskReward(reward: RewardState, task: Task, action: "started" | "partial" | "completed") {
  if (task.awardedActions.includes(action)) {
    return { reward, xpAdded: 0 };
  }

  const xpAdded = XP_BY_ACTION[action];
  const nextXp = reward.xp + xpAdded;
  const activeDates = Array.from(new Set([...reward.activeDates, task.date]));
  const tidyBoost = task.category === TaskCategory.LIFE && action === "completed" ? 10 : 0;
  const plantBoost = task.category === TaskCategory.HEALTH && action === "completed" ? 1 : 0;

  return {
    xpAdded,
    reward: {
      ...reward,
      xp: nextXp,
      level: levelFromXp(nextXp),
      activeDates,
      roomState: {
        light: Math.min(100, reward.roomState.light + 8),
        tidy: Math.min(100, reward.roomState.tidy + tidyBoost),
        plants: reward.roomState.plants + plantBoost,
      },
    },
  };
}

export function applyReviewReward(reward: RewardState, log: DailyLog, alreadyRewarded: boolean) {
  if (alreadyRewarded) return { reward, xpAdded: 0 };

  const nextXp = reward.xp + XP_BY_ACTION.review;
  const activeDates = Array.from(new Set([...reward.activeDates, log.date]));

  return {
    xpAdded: XP_BY_ACTION.review,
    reward: {
      ...reward,
      xp: nextXp,
      level: levelFromXp(nextXp),
      activeDates,
      roomState: {
        ...reward.roomState,
        light: Math.min(100, reward.roomState.light + 6),
      },
    },
  };
}
