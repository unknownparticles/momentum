import { TaskCategory, type AiTaskBreakdownResult, type DailyLog, type UserSettings } from "../types";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const CATEGORY_VALUES = new Set(Object.values(TaskCategory));
const ENERGY_VALUES = new Set(["low", "medium", "high"]);

export function providerDefaults(provider: UserSettings["modelProvider"]) {
  switch (provider) {
    case "deepseek":
      return { baseUrl: "https://api.deepseek.com", modelName: "deepseek-chat" };
    case "glm":
      return { baseUrl: "https://open.bigmodel.cn/api/paas/v4", modelName: "glm-4-flash" };
    case "minimax":
      return { baseUrl: "", modelName: "" };
    case "openai-compatible":
      return { baseUrl: "", modelName: "" };
  }
}

async function requestChat(settings: UserSettings, messages: ChatMessage[]) {
  if (!settings.apiKey.trim()) {
    throw new Error("请先在设置中填写 API Key。");
  }

  if (!settings.baseUrl.trim() || !settings.modelName.trim()) {
    throw new Error("请先补全 Base URL 和模型名称。");
  }

  const response = await fetch(`${settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.modelName.trim(),
      messages,
      temperature: 0.5,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("API Key 无效或没有权限。");
    }
    if (response.status === 429) {
      throw new Error("请求过快，请稍后再试。");
    }
    throw new Error(`AI 请求失败：${response.status}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 没有返回可用内容。");
  return content;
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("AI 返回内容不是 JSON。");
    return JSON.parse(text.slice(start, end + 1));
  }
}

function normalizeTask(raw: any) {
  const minutes = Number(raw.minutes);
  const category = CATEGORY_VALUES.has(raw.category) ? raw.category : TaskCategory.GROWTH;
  const energy = ENERGY_VALUES.has(raw.energy) ? raw.energy : "low";

  if (!raw.title || !Number.isFinite(minutes)) return null;

  return {
    title: String(raw.title).slice(0, 40),
    nextAction: String(raw.nextAction || raw.title).slice(0, 50),
    category,
    minutes: Math.min(30, Math.max(5, Math.round(minutes))),
    energy,
  };
}

export function parseTaskBreakdown(text: string): AiTaskBreakdownResult {
  const raw = parseJsonObject(text);
  const projects = Array.isArray(raw.projects) ? raw.projects : [];
  const today = Array.isArray(raw.today) ? raw.today : [];

  const normalizedProjects = projects.map((project: any, index: number) => ({
    goal: String(project.goal || `目标 ${index + 1}`),
    title: String(project.title || `项目 ${index + 1}`),
    tasks: (Array.isArray(project.tasks) ? project.tasks : []).map(normalizeTask).filter(Boolean),
  }));

  const normalizedToday = today.map(normalizeTask).filter(Boolean).slice(0, 3);
  if (normalizedToday.length === 0) {
    throw new Error("AI 没有返回可执行的今日任务。");
  }

  return {
    theme: String(raw.theme || "慢慢恢复行动感"),
    projects: normalizedProjects,
    today: normalizedToday,
    encouragement: String(raw.encouragement || "今天只要开始一点点就很好。"),
  };
}

export async function generateWeekPlan(settings: UserSettings, goals: string) {
  const content = await requestChat(settings, [
    {
      role: "system",
      content:
        "你是一个温柔但务实的行动教练。只返回 JSON，不要 Markdown。任务必须 5~30 分钟、动作明确、失败成本低。",
    },
    {
      role: "user",
      content: `请把这些本周目标拆成低阻力行动：${goals}

返回 JSON 格式：
{
  "theme": "本周主题",
  "projects": [
    {
      "goal": "原始目标",
      "title": "项目名",
      "tasks": [
        {"title": "任务标题", "nextAction": "下一步动作", "category": "成长|生活|健康", "minutes": 5, "energy": "low|medium|high"}
      ]
    }
  ],
  "today": [
    {"title": "今日下一步动作", "category": "成长|生活|健康", "minutes": 5, "energy": "low|medium|high"}
  ],
  "encouragement": "一句简短鼓励"
}

约束：today 最多 3 个，第一个任务必须极小；分类尽量覆盖成长、生活、健康。`,
    },
  ]);

  return parseTaskBreakdown(content);
}

export async function generateReflectionFeedback(settings: UserSettings, log: DailyLog) {
  const content = await requestChat(settings, [
    {
      role: "system",
      content: "你是“慢慢来”的小狐狸陪跑角色。只返回 JSON，不要 Markdown。语气温柔、简短、具体。",
    },
    {
      role: "user",
      content: `用户今日状态：
睡眠：${log.sleep}
运动：${log.exercise}
心情：${log.mood}
复盘：${log.reflection || "未填写"}
明天最小一步：${log.tomorrowSmallStep || "未填写"}

返回 JSON：{"feedback":"1 到 2 句鼓励，不要鸡血"}。`,
    },
  ]);

  const parsed = parseJsonObject(content);
  return String(parsed.feedback || "今天已经比没开始更进一步了，慢慢来就好。");
}

export function fallbackWeekPlan(goals: string): AiTaskBreakdownResult {
  const firstGoal = goals.split(/\n|，|,|、/).map((item) => item.trim()).find(Boolean) || "恢复行动感";

  return {
    theme: "先把行动阻力降下来",
    projects: [
      {
        goal: firstGoal,
        title: "从最小一步开始",
        tasks: [
          { title: "打开相关资料 5 分钟", nextAction: "打开一个相关页面", category: TaskCategory.GROWTH, minutes: 5, energy: "low" },
          { title: "整理身边一个小区域", nextAction: "扔掉一个不需要的东西", category: TaskCategory.LIFE, minutes: 10, energy: "low" },
          { title: "出门走一小圈", nextAction: "换鞋站到门口", category: TaskCategory.HEALTH, minutes: 10, energy: "low" },
        ],
      },
    ],
    today: [
      { title: "打开相关资料 5 分钟", category: TaskCategory.GROWTH, minutes: 5, energy: "low" },
      { title: "整理桌面 10 分钟", category: TaskCategory.LIFE, minutes: 10, energy: "low" },
      { title: "出门走 10 分钟", category: TaskCategory.HEALTH, minutes: 10, energy: "low" },
    ],
    encouragement: "先做最小的一步，今天就已经开始了。",
  };
}
