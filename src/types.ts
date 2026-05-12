export enum AppView {
  TODAY = "Today",
  WEEK = "Week",
  REWARDS = "Rewards",
  LOG = "Log",
  SETTINGS = "Settings",
}

export enum TaskCategory {
  GROWTH = "成长",
  LIFE = "生活",
  HEALTH = "健康",
}

export type TaskStatus = "suggested" | "started" | "partial" | "completed" | "skipped";
export type EnergyLevel = "low" | "medium" | "high";
export type SleepState = "poor" | "ok" | "good";
export type ExerciseState = "none" | "some" | "done";
export type MoodState = "low" | "normal" | "good";
export type ModelProvider = "deepseek" | "glm" | "minimax" | "openai-compatible";

export interface UserSettings {
  modelProvider: ModelProvider;
  baseUrl: string;
  modelName: string;
  apiKey: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  dailyCapacity: 1 | 2 | 3;
}

export interface Task {
  id: string;
  date: string;
  weekId: string;
  title: string;
  category: TaskCategory;
  minutes: number;
  energy: EnergyLevel;
  status: TaskStatus;
  xp: number;
  skipReason?: string;
  awardedActions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlannedTask {
  id: string;
  title: string;
  nextAction: string;
  category: TaskCategory;
  minutes: number;
  energy: EnergyLevel;
}

export interface ProjectPlan {
  id: string;
  goal: string;
  title: string;
  tasks: PlannedTask[];
}

export interface WeekPlan {
  id: string;
  startDate: string;
  rawGoals: string;
  theme: string;
  projects: ProjectPlan[];
  encouragement: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  date: string;
  sleep: SleepState;
  exercise: ExerciseState;
  mood: MoodState;
  steps?: number;
  reflection?: string;
  tomorrowSmallStep?: string;
  aiFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardState {
  id: "default";
  xp: number;
  level: number;
  badges: string[];
  activeDates: string[];
  roomState: {
    light: number;
    tidy: number;
    plants: number;
  };
}

export interface AiTaskBreakdownResult {
  theme: string;
  projects: Array<{
    goal: string;
    title: string;
    tasks: Array<{
      title: string;
      nextAction: string;
      category: TaskCategory;
      minutes: number;
      energy: EnergyLevel;
    }>;
  }>;
  today: Array<{
    title: string;
    category: TaskCategory;
    minutes: number;
    energy: EnergyLevel;
  }>;
  encouragement: string;
}

export interface AppSnapshot {
  tasks: Task[];
  weekPlans: WeekPlan[];
  logs: DailyLog[];
  reward: RewardState;
}
