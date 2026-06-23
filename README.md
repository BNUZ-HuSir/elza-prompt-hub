# Elza Prompt Hub

ComfyUI 自定义节点 — 多栏预设词切换器，支持随机词语法。

## 功能

- **多栏预设**：最多 99 组预设词，通过 `count` 控制数量，`index` 切换当前生效的预设
- **随机词语法**：
  - `{a|b}` → 从选项中随机选 1 个
  - `{N$$ a|b|c}` → 从选项中随机选 N 个
- **无语法透传**：不含 `{...}` 时原样输出

## 安装

```bash
cd ComfyUI/custom_nodes/
git clone https://github.com/<your-username>/elza-prompt-hub.git
```

或手动下载解压到 `ComfyUI/custom_nodes/elza-prompt-hub/`。

## 使用

1. 在节点菜单 `Elza/prompt` 下找到 **Elza Prompt Switch**
2. 设置 `count` 控制输入框数量
3. 在各输入框中填入预设词
4. 切换 `index` 选择当前生效的预设

### 语法示例

| 输入 | 可能输出 |
|------|----------|
| `{红\|蓝}` | `红` 或 `蓝` |
| `{2$$ 猫\|狗\|鸟}` | `猫,狗` 或 `猫,鸟` 或 `狗,鸟` |
| `{红\|蓝}色的{猫\|狗}` | `红色的猫` 等 |
| `hello world` | `hello world` |

## 依赖

无额外依赖，仅使用 Python 标准库（`re`, `random`）。

## 许可

MIT
