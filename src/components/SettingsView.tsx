import React, { useState } from "react";
import { Download, Key, ShieldCheck, Trash2, Database, Volume2, Smartphone } from "lucide-react";
import { providerDefaults } from "../services/aiService";
import { type UserSettings } from "../types";

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onExportData: () => Promise<void>;
  onResetData: () => Promise<void>;
}

const providers: Array<{ value: UserSettings["modelProvider"]; label: string }> = [
  { value: "deepseek", label: "DeepSeek" },
  { value: "glm", label: "GLM" },
  { value: "minimax", label: "MiniMax" },
  { value: "openai-compatible", label: "OpenAI Compatible" },
];

export default function SettingsView({ settings, onSaveSettings, onExportData, onResetData }: SettingsViewProps) {
  const [draft, setDraft] = useState(settings);
  const [isEditingKey, setIsEditingKey] = useState(false);

  const updateDraft = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (key !== "apiKey" || isEditingKey) onSaveSettings(next);
  };

  const handleProviderChange = (provider: UserSettings["modelProvider"]) => {
    const defaults = providerDefaults(provider);
    const next = {
      ...draft,
      modelProvider: provider,
      baseUrl: defaults.baseUrl,
      modelName: defaults.modelName,
    };
    setDraft(next);
    onSaveSettings(next);
  };

  const handleSaveKey = () => {
    if (isEditingKey) onSaveSettings(draft);
    setIsEditingKey(!isEditingKey);
  };

  const handleClearKey = () => {
    const next = { ...draft, apiKey: "" };
    setDraft(next);
    onSaveSettings(next);
  };

  const handleResetAll = async () => {
    if (confirm("确定要清除所有本地数据吗？此操作不可撤销。")) {
      await onResetData();
    }
  };

  return (
    <div className="space-y-10 pb-32 pt-4">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="secondary-label">API Key 只保存在当前浏览器本地</p>
      </header>

      <div className="space-y-6">
        <section className="apple-card p-6 space-y-5">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Key size={18} className="text-primary" /> AI 配置
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {providers.map((provider) => (
              <button
                key={provider.value}
                onClick={() => handleProviderChange(provider.value)}
                className={`min-h-11 rounded-2xl text-xs font-bold ${draft.modelProvider === provider.value ? "bg-primary text-white" : "bg-black/5 text-gray-500 dark:bg-white/10"}`}
              >
                {provider.label}
              </button>
            ))}
          </div>

          <label className="space-y-2 block">
            <span className="text-[13px] font-bold text-gray-500">Base URL</span>
            <input
              value={draft.baseUrl}
              onChange={(event) => updateDraft("baseUrl", event.target.value)}
              placeholder="https://api.example.com"
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary dark:bg-white/5"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-[13px] font-bold text-gray-500">模型名称</span>
            <input
              value={draft.modelName}
              onChange={(event) => updateDraft("modelName", event.target.value)}
              placeholder="deepseek-chat"
              className="w-full rounded-xl bg-black/5 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary dark:bg-white/5"
            />
          </label>

          <div className="space-y-3">
            <p className="text-[13px] font-bold text-gray-500">API Key</p>
            <div className="flex gap-2">
              <input
                type={isEditingKey ? "text" : "password"}
                value={draft.apiKey}
                placeholder={isEditingKey ? "输入你的 API Key" : "••••••••••••••••"}
                onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
                disabled={!isEditingKey}
                className="min-w-0 flex-1 bg-black/5 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSaveKey}
                className="min-h-11 px-4 bg-black/5 dark:bg-white/10 rounded-xl text-xs font-bold"
              >
                {isEditingKey ? "保存" : "修改"}
              </button>
            </div>
            <button onClick={handleClearKey} className="text-[12px] font-bold text-danger">
              删除 API Key
            </button>
          </div>
        </section>

        <section className="apple-card p-6 space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Smartphone size={18} className="text-primary" /> 体验
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-bold">每日任务容量</span>
              <select
                value={draft.dailyCapacity}
                onChange={(event) => updateDraft("dailyCapacity", Number(event.target.value) as 1 | 2 | 3)}
                className="rounded-xl bg-black/5 px-3 py-2 text-sm font-bold outline-none dark:bg-white/10"
              >
                <option value={1}>1 个</option>
                <option value={2}>2 个</option>
                <option value={3}>3 个</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Volume2 size={16} /> 声音反馈
              </span>
              <input
                type="checkbox"
                checked={draft.soundEnabled}
                onChange={(event) => updateDraft("soundEnabled", event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-bold">震动反馈</span>
              <input
                type="checkbox"
                checked={draft.vibrationEnabled}
                onChange={(event) => updateDraft("vibrationEnabled", event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>
          </div>
        </section>

        <section className="apple-card p-6 space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <Database size={18} className="text-primary" /> 数据管理
          </h2>
          <button
            onClick={onExportData}
            className="flex min-h-20 w-full items-center justify-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <Download size={20} className="text-primary" />
            <span className="text-sm font-bold">导出本地数据</span>
          </button>
          <button
            onClick={handleResetAll}
            className="w-full min-h-11 flex items-center justify-center gap-2 py-3 text-danger text-xs font-bold bg-danger/5 rounded-xl"
          >
            <Trash2 size={14} /> 清除所有本地数据
          </button>
        </section>

        <section className="apple-card p-6 space-y-4">
          <h2 className="text-[17px] font-bold flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" /> 关于与隐私
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">产品</span>
              <span className="font-medium">慢慢来</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-black/5 dark:border-white/5 pt-4">
              <span className="text-gray-500">数据存储</span>
              <span className="font-medium text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">本地浏览器</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
