# 慢慢来

慢慢来是一个手机优先的 PWA 自律启动器。它不做复杂任务管理，而是帮助用户把目标拆成 5 到 30 分钟的小行动，并通过 XP、等级、复盘和小狐狸房间强化“今天开始了一点点”的反馈。

## 技术栈

- React + Vite + TypeScript
- Tailwind CSS
- vite-plugin-pwa
- IndexedDB + Dexie
- motion + canvas-confetti
- OpenAI-compatible Chat Completions API

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000/
```

## AI 配置

第一版不读取构建时 API Key。用户在 PWA 的“设置”页自行填写 API Key，Key 只保存在当前浏览器本地。

内置 Provider：

- DeepSeek
- GLM
- MiniMax
- OpenAI Compatible API

所有 Provider 都按 `{baseUrl}/chat/completions` 调用。如果第三方 API 不允许浏览器直连，页面会提示失败，用户需要换用支持浏览器调用的兼容服务。

## 设计参考

UI 以本地 Aistudio 原型为基础：

```text
/Users/alun/Downloads/cozylauncher-pwa
```

实现时保留手机单列、底部悬浮 Dock、iOS 风格卡片、Mascot、成长页和复盘页的核心体验，并接入真实本地数据和多 Provider AI。
