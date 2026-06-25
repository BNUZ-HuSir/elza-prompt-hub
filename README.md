# Elza Prompt Hub

Elza 的 ComfyUI 自定义节点集。

## 安装

从 [Releases](https://github.com/BNUZ-HuSir/elza-prompt-hub/releases) 下载 zip，解压到 `ComfyUI/custom_nodes/elza-prompt-hub/`。

将 `wordbank-example.yaml` 复制一份并改名为 `wordbank.yaml`，然后重启 ComfyUI。

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

---

### Prompt Bank

词库管理节点。通过弹窗浏览、选择、管理词条，与额外提示词拼接输出。
<img width="1082" height="447" alt="image" src="https://github.com/user-attachments/assets/ae1f3a58-5633-46ff-b385-3fae2412f629" />

<img width="2129" height="1111" alt="image" src="https://github.com/user-attachments/assets/9a60f14f-be93-40e6-9ee1-cf4d05d5cc6e" />

<img width="2129" height="1111" alt="image" src="https://github.com/user-attachments/assets/2d5b9d83-4fd1-45c7-bee7-a61f1af10941" />

> 使用前需将 `wordbank-example.yaml` 复制为 `wordbank.yaml`。

**输入**

| 参数 | 说明 | 限制 |
|------|------|------|
| text_display | 已选词条展示（只读） | — |
| extra_prompt | 额外提示词（多行），支持随机语法 | — |

**输出**

| 名称 | 说明 |
|------|------|
| text | 已选词 + 额外提示词拼接 |

**使用**

1. 右键菜单 → `Elza/prompt` → `Elza Prompt Bank`
2. 点 `📋 打开词库` 打开弹窗
3. 左侧分类树浏览，中栏点击词条选择
4. 确认后词条展示在节点上
5. 在 `extra_prompt` 中输入额外文本
6. Queue 执行 → 输出拼接结果

**弹窗功能**

| 功能 | 说明 |
|------|------|
| 分类管理 | 一/二级分类，增删改 |
| 词条管理 | 中英文词条，增删改 |
| 查重高亮 | 中栏已选词条高亮 |
| 即时入库 | CRUD 操作立即写入 YAML |

---

## 随机词语法

以下语法适用于所有支持随机词的节点。

| 语法 | 说明 | 示例输入 | 可能输出 |
|------|------|----------|----------|
| `{a\|b}` | 随机选 1 个 | `{红\|蓝}` | `红` 或 `蓝` |
| `{N\$\$ a\|b\|c}` | 随机选 N 个 | `{2\$\$ 猫\|狗\|鸟}` | `猫,狗` 等 |
| 无语法 | 原样输出 | `hello world` | `hello world` |

> 支持混合：`{红\|蓝}色的{猫\|狗}` → `红色的狗` 等
> N 超过选项数时控制台输出警告并自动限制

## License

本项目基于 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可。

- ✅ 个人使用、学习、二次开发
- ✅ 修改和分发（需注明原作者）
- ❌ 商业用途
- ❌ 任何违反法律法规的使用
