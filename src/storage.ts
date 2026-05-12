import Dexie, { type Table } from "dexie";
import { format } from "date-fns";
import {
  type AppSnapshot,
  type DailyLog,
  type RewardState,
  TaskCategory,
  type Task,
  type UserSettings,
  type WeekPlan,
} from "./types";

const SETTINGS_KEY = "manmanlai-settings";

export const DEFAULT_SETTINGS: UserSettings = {
  modelProvider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  modelName: "deepseek-chat",
  apiKey: "",
  soundEnabled: true,
  vibrationEnabled: true,
  dailyCapacity: 3,
};

export const DEFAULT_REWARD: RewardState = {
  id: "default",
  xp: 0,
  level: 1,
  badges: [],
  activeDates: [],
  roomState: {
    light: 20,
    tidy: 10,
    plants: 0,
  },
};

class MomentumDatabase extends Dexie {
  tasks!: Table<Task, string>;
  weekPlans!: Table<WeekPlan, string>;
  dailyLogs!: Table<DailyLog, string>;
  rewards!: Table<RewardState, string>;

  constructor() {
    super("manmanlai-db");

    // Keep indexes simple so future migrations can add fields without reshaping all records.
    this.version(1).stores({
      tasks: "id, date, weekId, status, category",
      weekPlans: "id, startDate, createdAt",
      dailyLogs: "date",
      rewards: "id",
    });
  }
}

export const db = new MomentumDatabase();

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearSettings() {
  localStorage.removeItem(SETTINGS_KEY);
}

export async function ensureRewardState() {
  const existing = await db.rewards.get("default");
  if (existing) return existing;
  await db.rewards.put(DEFAULT_REWARD);
  return DEFAULT_REWARD;
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const [tasks, weekPlans, logs, reward] = await Promise.all([
    db.tasks.toArray(),
    db.weekPlans.toArray(),
    db.dailyLogs.toArray(),
    ensureRewardState(),
  ]);

  return { tasks, weekPlans, logs, reward };
}

export async function seedFirstRunTasks() {
  const count = await db.tasks.count();
  if (count > 0) return;

  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date().toISOString();
  const tasks: Task[] = [
    {
      id: createId("task"),
      date: today,
      weekId: "seed",
      title: "清理桌面 10 分钟",
      category: TaskCategory.LIFE,
      minutes: 10,
      energy: "low",
      status: "suggested",
      xp: 0,
      awardedActions: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("task"),
      date: today,
      weekId: "seed",
      title: "打开项目看 5 分钟",
      category: TaskCategory.GROWTH,
      minutes: 5,
      energy: "low",
      status: "suggested",
      xp: 0,
      awardedActions: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: createId("task"),
      date: today,
      weekId: "seed",
      title: "出去走 10 分钟",
      category: TaskCategory.HEALTH,
      minutes: 10,
      energy: "low",
      status: "suggested",
      xp: 0,
      awardedActions: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.tasks.bulkAdd(tasks);
}

export async function resetLocalData() {
  await db.transaction("rw", db.tasks, db.weekPlans, db.dailyLogs, db.rewards, async () => {
    await Promise.all([
      db.tasks.clear(),
      db.weekPlans.clear(),
      db.dailyLogs.clear(),
      db.rewards.clear(),
    ]);
    await db.rewards.put(DEFAULT_REWARD);
  });
}
