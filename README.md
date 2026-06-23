# Elza Prompt Hub

Elza 的 ComfyUI 自定义节点集。

## 安装

从 [Releases](https://github.com/BNUZ-HuSir/elza-prompt-hub/releases) 下载 zip，解压到 `ComfyUI/custom_nodes/elza-prompt-hub/`。

## 节点

### Prompt Switch

多栏预设词切换器，从多组预设中选一组输出，支持随机词语法。

**参数**

| 参数 | 类型 | 范围 | 说明 |
|------|------|------|------|
| index | INT | 0 ~ count-1 | 选择第几组预设 |
| count | INT | 1 ~ 99 | 输入框数量 |
| prompt_0 ~ prompt_98 | STRING (multiline) | — | 预设词内容 |

**输出**

| 类型 | 名称 |
|------|------|
| STRING | text |

**使用**

1. 右键菜单 → `Elza/prompt` → `Elza Prompt Switch`
2. 设置 `count` 控制输入框数量
3. 在各框中填入预设词
4. 切换 `index` 选择当前生效的预设

## 随机词语法

以下语法适用于所有支持随机词的节点。

| 语法 | 说明 | 示例输入 | 可能输出 |
|------|------|----------|----------|
| `{a\|b}` | 随机选 1 个 | `{红\|蓝}` | `红` 或 `蓝` |
| `{N\$\$ a\|b\|c}` | 随机选 N 个 | `{2\$\$ 猫\|狗\|鸟}` | `猫,狗` 等 |
| 无语法 | 原样输出 | `hello world` | `hello world` |

> 支持混合：`{红\|蓝}色的{猫\|狗}` → `红色的狗` 等
> N 超过选项数时控制台输出警告并自动限制

## 依赖

Python 标准库（`re`、`random`），无需额外安装。

## License

MIT
