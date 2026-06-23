# Elza Prompt Hub

Elza 的 ComfyUI 自定义节点集。

## 安装

从 [Releases](https://github.com/BNUZ-HuSir/elza-prompt-hub/releases) 下载 zip，解压到 `ComfyUI/custom_nodes/elza-prompt-hub/`。

## 节点

### Prompt Switch
多栏预设词切换器，从多组预设中选一组输出，支持随机词语法。

<img width="864" height="544" alt="image" src="https://github.com/user-attachments/assets/334a078a-5a98-43fb-a9fe-07e5c85dec30" />


**输入**

| 参数 | 说明 | 限制 |
|------|------|------|
| index | 选择第几组预设 | 0 ~ count-1 |
| count | 输入框数量 | 1 ~ 99 |
| prompt_0 ~ prompt_98 | 预设词内容（多行文本） | — |

**输出**

| 名称 | 说明 |
|------|------|
| text | 解析后的预设词文本 |

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

本项目基于 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可。

- ✅ 个人使用、学习、二次开发
- ✅ 修改和分发（需注明原作者）
- ❌ 商业用途
- ❌ 任何违反法律法规的使用
