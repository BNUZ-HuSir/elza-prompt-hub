# Elza Prompt Hub 开发计划

> 状态：0.2.0-alpha.18 开发完成，等待 ComfyUI 人工 UI 验收 | 最后更新：2026-09-15

## 全局设计约定

→ 详见 [docs/conventions.md](docs/conventions.md)

| 约定 | 说明 |
|------|------|
| 原生优先 | 节点本体优先使用 ComfyUI 原生 widget 和 socket，复杂编辑放入弹窗 |
| 核心先行 | 先稳定数据、状态、存储和输出契约，再完善 UI |
| 插件相对词库 | Bank/Mixer 主数据固定在 `wordbanks/promptbank` 与 `wordbanks/promptmixer`；更新插件时必须保留这两个目录 |
| 选择即复制 | Bank/Mixer 选中后把中英文快照保存进 workflow，不依赖词条 ID 回查 YAML |
| 即时保存 | 词库 CRUD 在自定义小窗确认后立即原子保存；节点选择由“应用到节点”提交 |

## 模块地图

| # | 模块 | 规格文档 | 优先级 | 状态 |
|---|------|---------|--------|------|
| 1 | Prompt Switch | [ELZA_PROMPT_SWITCH_FUNCTION_SPEC.md](ELZA_PROMPT_SWITCH_FUNCTION_SPEC.md) | P0 | 🧪 待 UI 验收 |
| 2 | Prompt 公共核心层 | [prompt-core.md](docs/specs/prompt-core.md) | P0 | 🧪 待集成验收 |
| 3 | Prompt Bank | [prompt-bank.md](docs/specs/prompt-bank.md) | P1 | 🧪 待 UI 验收 |
| 4 | Prompt Mixer | [prompt-mix.md](docs/specs/prompt-mix.md) | P1 | 🧪 待 UI 验收 |
| 5 | Random Prompt | [random-prompt.md](docs/specs/random-prompt.md) | P1 | 🧪 待 UI 验收 |
| 6 | Image Resolution | [README.md](README.md#image-resolution) | P1 | 🧪 待 UI 验收 |

## 状态说明

| 状态 | 含义 |
|------|------|
| 💬 讨论中 | 正在探讨方案，尚未定稿 |
| 📋 方案已确认 | 设计方案已定稿，等待开发 |
| 🔨 开发中 | 正在编码实现 |
| 🧪 待测试 | 开发完成，等待测试验收 |
| ✅ 已完成 | 测试通过，已部署 |
| ⏸️ 暂缓 | 暂时搁置 |

## 已知问题

| # | 问题 | 严重度 | 状态 |
|---|------|--------|------|
| 1 | Bank/Mixer 尚未在真实 ComfyUI 中完成弹窗尺寸、折叠、刷新和连线验收 | 中 | 待人工截图验证 |
| 2 | 系统文件选择器在不支持 File System Access API 的浏览器中会回退为下载 | 低 | 已提供兼容回退 |
