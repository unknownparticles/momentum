# 慢慢来 MVP 开发设计文档

## 1. 目标和边界

慢慢来的第一版目标不是做完整任务管理工具，而是帮助用户更容易开始行动。产品每天只给用户少量、明确、低阻力的下一步动作，并通过即时奖励、柔性连续机制和轻量复盘降低失败感。

产品名称：

```text
慢慢来
```

第一版必须始终按手机优先的 PWA 设计。桌面浏览器和 iPad 只是兼容场景，不应该反过来影响移动端信息密度、导航方式和触控尺寸。

第一版范围包含：

- 手机优先 PWA 基础应用，可部署到 GitHub Pages。
- 本周目标输入和 AI 真实拆解。
- 今日最多 3 个下一步动作。
- 任务状态：开始了、做了一点、完成了、跳过但记录原因。
- XP、等级、过去 7 天行动 5 天的柔性连续机制。
- 健康和复盘的手动输入。
- AI Provider 配置，支持 DeepSeek、GLM、MiniMax、OpenAI Compatible API。
- API Key 由用户自行输入，只保存在浏览器本地，可随时删除。

第一版暂不包含：

- Capacitor 和 iOS 打包。
- Apple HealthKit 自动读取。
- 多端同步和开发者服务器。
- 社交、排行榜、复杂项目管理、多人协作。

## 2. 技术架构

项目使用 React、Vite、TypeScript、Tailwind CSS 构建。PWA 由 vite-plugin-pwa 生成 manifest 和 service worker。业务数据使用 Dexie.js 写入 IndexedDB，用户的模型配置和 API Key 使用 localStorage 保存。

UI 参考来源：

```text
/Users/alun/Downloads/cozylauncher-pwa
```

该目录是 Aistudio 生成的 React/Vite UI 原型。后续实现应把它作为视觉和交互基线，而不是从零重新设计。可以复用其中的页面结构和交互思路，但需要按本仓库的数据层、AI 接入和可维护性要求重构代码。

推荐目录结构：

```text
src/
  app/
    App.tsx
    routes.tsx
  components/
    layout/
    task/
    reward/
    form/
  db/
    schema.ts
    repositories.ts
  ai/
    providers.ts
    client.ts
    prompts.ts
    parser.ts
  features/
    today/
    week/
    rewards/
    log/
    settings/
  lib/
    date.ts
    xp.ts
    level.ts
    vibration.ts
  styles/
    index.css
```

设计原则：

- 页面组件只负责展示和交互，不直接拼 AI 请求。
- AI 相关逻辑集中在 `src/ai`，便于后续替换 Provider 或增加代理模式。
- IndexedDB 只保存长期业务数据，localStorage 只保存轻量设置和敏感 Key。
- 奖励计算使用纯函数，避免页面间重复实现 XP 和等级规则。

## 3. 页面和导航

第一版使用 5 个主页面：

```text
/today     今日行动
/week      本周目标
/rewards   奖励和房间
/log       健康输入和晚间复盘
/settings  AI 和体验设置
```

手机端使用底部悬浮 Dock 导航，桌面端仍保持手机宽度的居中应用壳，不单独改成复杂后台式布局。默认打开 `/today`。如果用户还没有设置 API Key 或还没有输入本周目标，`/today` 顶部显示简洁引导入口，但不要做成阻塞式新手流程。

`/today` 是核心页面，只展示今天建议的下一步动作。每张任务卡包含标题、分类、预计时间、能量要求、状态按钮和跳过原因入口。按钮文案优先使用“开始 5 分钟”“做了一点”“今天完成了”，避免使用带压力的“必须完成”。

`/week` 用于输入本周目标和触发 AI 拆解。目标可以是多行文本，用户点击生成后，AI 返回本周主题、项目、任务池和每日建议。

`/rewards` 展示 XP、等级、过去 7 天行动情况和虚拟房间状态。第一版房间可以先用 CSS 插画式状态实现，不需要复杂 3D。

`/log` 提供睡眠、运动、精神状态和 30 秒复盘。表单使用按钮、分段控制和滑块，不做复杂长表单。

`/settings` 提供 Provider、Base URL、模型名、API Key、声音、震动、每日容量设置。

## 3.1 手机优先 UI 约束

第一版 UI 以 `/Users/alun/Downloads/cozylauncher-pwa` 为参考，保留它的核心气质：

- 单列手机壳布局，桌面端最大宽度约等于手机宽度，居中展示。
- 底部悬浮 Dock 导航，使用图标承载主导航，不把顶部做成复杂 Tab 或侧边栏。
- iOS 风格浅色背景、半透明卡片、柔和阴影和清晰留白。
- 首页顶部展示问候语、低压力鼓励语和 Mascot。
- 今日任务使用大触控卡片，主按钮文案优先表达“开始”，而不是“完成”。
- 成长页保留等级、XP 进度、行动足迹和“小房间”区域。
- 复盘页使用心情按钮、滑块、短文本输入和 AI 反馈气泡。
- 页面切换使用轻量 motion 动画，但不能影响低端手机流畅度。

移动端细节要求：

- 关键按钮高度不低于 44px。
- 底部 Dock 需要避开 iOS safe area。
- 页面底部要预留 Dock 高度，避免内容被遮挡。
- 任务卡、复盘控件和设置表单不能依赖 hover。
- 文案尽量短，避免在窄屏中换行后压缩主要操作。
- 图标优先使用 lucide-react；参考 UI 中已有 Home、Calendar、Trophy、MessageSquare、Settings、Clock、Zap、Moon 等图标。

参考 UI 中的 `Mascot` 可以作为第一版默认陪跑角色方向，但实现时需要把 SVG 组件整理成可维护组件，并补充必要注释说明不同状态的用途。

## 4. 数据模型

Dexie 数据表建议：

```ts
export type TaskStatus = 'suggested' | 'started' | 'partial' | 'completed' | 'skipped';

export type TaskCategory = 'growth' | 'life' | 'health';

export interface Task {
  id: string;
  date: string;
  weekId: string;
  title: string;
  category: TaskCategory;
  minutes: number;
  energy: 'low' | 'medium' | 'high';
  status: TaskStatus;
  xp: number;
  skipReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekPlan {
  id: string;
  startDate: string;
  rawGoals: string;
  theme: string;
  projects: ProjectPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPlan {
  id: string;
  goal: string;
  title: string;
  tasks: PlannedTask[];
}

export interface PlannedTask {
  id: string;
  title: string;
  nextAction: string;
  category: TaskCategory;
  minutes: number;
  energy: 'low' | 'medium' | 'high';
}

export interface DailyLog {
  date: string;
  sleep: 'poor' | 'ok' | 'good';
  exercise: 'none' | 'some' | 'done';
  mood: 'low' | 'normal' | 'good';
  steps?: number;
  reflection?: string;
  tomorrowSmallStep?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardState {
  id: 'default';
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
```

localStorage 建议：

```ts
export interface UserSettings {
  modelProvider: 'deepseek' | 'glm' | 'minimax' | 'openai-compatible';
  baseUrl: string;
  modelName: string;
  apiKey: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  dailyCapacity: 1 | 2 | 3;
}
```

API Key 不进入 IndexedDB，便于用户在设置页一键删除，也降低误导用户以为数据会被同步的风险。前端仍然无法保证绝对安全，所以设置页需要明确说明 Key 只保存在当前浏览器本地。

## 5. AI 接入设计

第一版直接从浏览器调用用户配置的模型 API。所有 Provider 统一适配为 OpenAI Chat Completions 风格：

```ts
interface AiProviderConfig {
  provider: UserSettings['modelProvider'];
  baseUrl: string;
  modelName: string;
  apiKey: string;
}

interface AiTaskBreakdownResult {
  theme: string;
  projects: Array<{
    goal: string;
    title: string;
    tasks: Array<{
      title: string;
      nextAction: string;
      category: TaskCategory;
      minutes: number;
      energy: 'low' | 'medium' | 'high';
    }>;
  }>;
  today: Array<{
    title: string;
    category: TaskCategory;
    minutes: number;
    energy: 'low' | 'medium' | 'high';
  }>;
  encouragement: string;
}
```

Provider 默认值：

```text
DeepSeek: https://api.deepseek.com
GLM: https://open.bigmodel.cn/api/paas/v4
MiniMax: 用户手动配置 Base URL
OpenAI Compatible API: 用户手动配置 Base URL
```

请求路径统一拼成：

```text
{baseUrl}/chat/completions
```

如果某个 Provider 的实际路径不兼容，设置页允许用户修改 Base URL。不要在第一版为每个厂商写太多特殊逻辑，避免维护成本过高。

AI Prompt 需要强约束：

- 只返回 JSON，不返回 Markdown。
- 每个任务 5 到 30 分钟。
- 今日任务最多 3 个。
- 必须平衡成长、生活、健康。
- 第一个任务必须极小，适合低状态用户启动。
- `nextAction` 必须是可立即执行的动作，不是抽象目标。

JSON 解析失败时，页面不应该空白。兜底策略：

1. 尝试从文本中提取第一个 JSON 对象。
2. 校验字段，不合法则丢弃该条任务。
3. 如果无法解析，展示错误，并给用户“重试”和“使用本地规则生成”两个按钮。

真实 API 调用的失败类型：

- 未配置 API Key：引导到设置页。
- 401 或 403：提示 Key 无效或权限不足。
- 429：提示请求过快，建议稍后重试。
- 网络失败：提示浏览器无法访问该 API，用户可检查跨域、网络或 Base URL。
- JSON 不合规：提示模型输出格式异常，可重试。

由于浏览器直连第三方 API 可能遇到 CORS 限制，第一版需要在设置页说明：如果某个 Provider 不允许浏览器直连，用户需要选择支持浏览器调用的 OpenAI Compatible 服务。后续如果要保证稳定，可以再增加“用户自建代理”模式，但第一版不引入开发者服务器。

## 6. 今日任务生成规则

AI 生成结果进入任务池后，系统每天从任务池选择最多 3 个任务。选择规则：

- 用户设置的 `dailyCapacity` 是硬上限。
- 如果昨天复盘状态低或睡眠差，优先选择低能量任务。
- 每天至少一个任务必须是 5 到 10 分钟的最小行动。
- 尽量覆盖成长、生活、健康，但不要为了凑分类超过 3 个。
- 已完成或跳过的任务当天不重复出现。

状态变化规则：

```text
suggested -> started    +3 XP
started   -> partial    +5 XP
partial   -> completed  +10 XP
suggested -> completed  +10 XP
any       -> skipped    +0 XP，必须记录原因
```

同一任务同一状态只奖励一次。这个规则需要用事件或状态字段记录，避免用户反复点击刷 XP。第一版可以在 Task 上增加 `awardedActions: string[]`，后续再抽成 RewardEvent 表。

## 7. 奖励系统

XP 规则：

```text
开始任务 +3
做了一点 +5
完成任务 +10
完成今日三件事 +30
晚间复盘 +8
```

等级建议用简单可解释公式：

```text
level = floor(sqrt(totalXp / 40)) + 1
```

这样前期升级较快，后期不会过于频繁。等级称号：

```text
Lv1 刚刚开始
Lv2 小步行动者
Lv5 稳定推进者
Lv10 不靠鸡血的人
Lv20 Momentum Master
```

柔性连续机制计算过去 7 天中有行动的天数。有行动定义为：

- 至少一个任务进入 started、partial 或 completed。
- 或完成一次每日复盘。
- 或填写健康状态。

文案避免“断签”“失败”“归零”，使用“火苗变弱”“重新点亮”“今天也算恢复”。

动画第一版分层实现：

- 状态点击后 0.3 秒内显示 XP 飘字。
- 完成任务触发 canvas-confetti。
- 升级时显示全屏弹层。
- 如果设备支持，按设置触发 `navigator.vibrate`。

音效可以先设计开关和调用入口，实际音频资源后续补充。不要让缺少音频资源阻塞第一版。

## 8. 虚拟房间

第一版虚拟房间不追求复杂美术，重点是让现实行动影响空间状态。

房间状态由 `RewardState.roomState` 控制：

- `light`：今日有行动时增加，低活跃时缓慢下降。
- `tidy`：完成生活整理任务时增加。
- `plants`：完成健康任务或连续复盘奖励时增加。

视觉可以用 Tailwind 和少量 CSS 实现：

- 低 light：房间偏暗。
- 高 light：窗户和背景变亮。
- tidy 提升：杂物数量减少。
- plants 提升：植物数量增加。

这部分必须保持轻量，不要在 MVP 阶段引入重型游戏系统。它的目的只是增加情绪价值，而不是变成独立养成游戏。

## 9. 复盘和健康输入

每日复盘只问三件事：

```text
今天做了一点什么？
今天状态如何？
明天最小一步是什么？
```

健康输入使用简单控件：

- 睡眠：睡得差 / 一般 / 不错。
- 运动：没运动 / 动了一点 / 完成运动。
- 精神状态：状态低 / 正常 / 很好。
- 步数：可选数字输入。

复盘提交后：

- 写入 DailyLog。
- 奖励 +8 XP，每天最多一次。
- 调用 AI 生成明日建议。如果 AI 失败，不影响复盘保存。

明日建议只作为任务生成时的参考，不直接覆盖用户已有任务。这样可以避免 AI 输出不稳定导致用户数据被破坏。

## 10. 错误处理和数据安全

所有数据库写入都需要失败提示，但不需要复杂错误页面。关键原则：

- 用户操作失败时保留输入内容。
- AI 失败时保留原始目标。
- 奖励失败不能导致任务状态回滚，除非数据库事务整体失败。
- 删除 API Key 前二次确认。
- 清空本地数据前二次确认。

IndexedDB 版本升级时只做向前迁移。第一版 schema 设计要留出字段，不依赖数组索引或隐式枚举顺序。

## 11. 测试策略

第一版重点测试纯逻辑和关键交互：

- XP 奖励不能重复发放。
- 等级计算正确。
- 过去 7 天行动天数计算正确。
- AI JSON 解析能处理正常 JSON、带多余文本的 JSON、缺字段数据。
- 今日任务最多 3 个。
- 睡眠差时优先低能量任务。

按照当前仓库要求，如果临时生成 test 类验证逻辑，验证后需要删除测试类。更适合的做法是把核心逻辑写成纯函数，再用临时测试或手动脚本验证，确认后删除临时验证文件。

## 12. 开发顺序

建议分 5 个阶段：

1. 项目基础设施：Vite、React、TypeScript、Tailwind、PWA、路由、基础布局。
2. 本地数据层：Dexie schema、Repository、设置存储、种子数据。
3. 核心任务闭环：本周目标、AI 拆解、今日三件事、状态切换。
4. 奖励闭环：XP、等级、柔性连续、动画、虚拟房间。
5. 复盘和健康：每日输入、晚间复盘、AI 明日建议、错误兜底。

每一阶段都应该保持应用可运行，避免一次性堆太多功能后难以定位问题。

## 13. 待确认问题

实现前建议确认：

- GitHub Pages 部署路径是根路径，还是仓库路径 `/momentum/`。
- MiniMax 的 OpenAI Compatible Base URL 是否由用户手动填写，不内置默认值。
- 第一版是否需要英文界面，还是只做中文界面。
- 虚拟角色第一版是否沿用 Aistudio 原型里的小狐狸作为默认角色，还是提供猫咪、机器人、史莱姆等选择。

已确认输入：

- 产品中文名使用“慢慢来”。
- 第一版始终按手机优先 PWA 设计。
- UI 参考原型位于 `/Users/alun/Downloads/cozylauncher-pwa`。
