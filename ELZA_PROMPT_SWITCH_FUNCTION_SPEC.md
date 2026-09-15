# Elza Prompt Switch 功能说明（审查版）

版本：`0.2.0-alpha.4`  
日期：`2026-09-02`

## 1. 节点目标

Elza Prompt Switch 用一个从 0 开始的 `index`，在多组 Prompt 中选择当前输出。每个槽位既可以保存本地多行文本，也可以接收 ComfyUI 原生 STRING 连接。

本次重写遵循 Native-first 原则：不预创建或隐藏 99 个 widget，不绘制 Canvas 标签，不重建节点，也不通过 `computeSize/setSize` 覆盖用户调整后的节点尺寸。

## 2. 节点界面

节点上保留以下内容：

| 界面项 | 功能 | 操作方式 |
|---|---|---|
| `index` | 选择当前输出的槽位 | 输入 0 到当前槽位数减 1 |
| `count` | 设置目标槽位数量 | 输入 1～99，再点击“更新” |
| `更新` | 按 `count` 增减 Prompt 槽位 | 单击按钮 |
| `prompt_0...prompt_98` | 原生 STRING 输入端口 | 可连接任意 STRING 输出 |
| 节点内多行输入框 | 编辑每个槽位的本地 Prompt | 直接输入，实时保存 |

新节点默认创建 3 个槽位，最少 1 个，最多 99 个。

节点视觉顺序固定为：`index` → `count` → `更新` → 多个原生多行 Prompt 输入框。每个多行输入框均可转换或连接为 STRING 输入端口。

## 3. 节点内 Prompt 编辑区

Prompt 编辑区使用 ComfyUI 原生 STRING 多行 widget，不再打开弹窗，也不额外绘制第二套 Prompt 列表。每个槽位的文本框与 STRING socket 属于同一原生输入行。

- 本地文本：输入时实时写入 `node.properties.elza_prompt_switch`。
- `count`：只表示目标数量，修改后需点击“更新”才改变槽位。
- `更新`：同步本地文本数组与 STRING 输入端口数量。
- 增加槽位：在末尾补充空槽位和对应 STRING 输入端口。
- 减少槽位：只移除末尾未连接的输入端口。
- 如果高编号端口已有连接，最小槽位数会自动提高，防止连接被静默删除。
- 未连接时主要显示原生多行文本框；拖线、悬停或连接后，STRING socket 在该文本框对应位置显示。
- 某槽位连接 STRING 后，原生文本框锁定且上游值优先；断开后恢复本地文本。

界面文本使用 `textContent` 或表单 `.value` 写入，不把 Prompt 当作 HTML 插入页面。

## 4. 输出优先级

当 `index = N` 时：

1. 如果 `prompt_N` 有 STRING 连接，使用连接值。
2. 否则使用编辑器保存的本地 Prompt。
3. 如果该槽位为空，输出空字符串。
4. 最后展开允许的随机语法并输出 STRING。

连接值为空字符串时仍属于有效连接，会覆盖本地文本。这可以让上游节点明确清空当前输出。

## 5. 随机语法

随机语法根据 [adieyal/dynamicprompts](https://github.com/adieyal/dynamicprompts) `0.31.0` 的 Variant 行为核对，固定参考提交为 `2475e312150d07b07a7d3dec2abab737414a9e36`。插件采用独立轻量实现，不安装外部依赖。

| 语法 | 含义 | 示例 | 可能结果 |
|---|---|---|---|
| `{a|b|c}` | 随机单选 | `a {red|blue} car` | `a red car` |
| `{0.5::a|1.5::b}` | 带权随机单选 | `{0.5::day|1.5::night}` | `night` 概率约为 `day` 的 3 倍 |
| `{2$$a|b|c}` | 无重复随机多选 | `{2$$cat|dog|bird}` | `dog, cat` |
| `{a|}` | 合法空选项 | `portrait{, detailed|}` | `portrait, detailed` 或 `portrait` |

规则说明：

- 权重只影响选中概率，不出现在结果文本中。
- 多选不重复，并保持随机选中的顺序。
- 多选项使用 `, ` 拼接。
- 多选数量超过可用选项数时，自动限制为全部选项。
- 同一文本中可以有多个随机块。
- 不支持嵌套花括号。
- 不支持 wildcard、变量、Jinja、自定义分隔符、范围或 sampler。
- 未配对花括号、非法权重或非法多选前缀会给出明确执行错误。

完整第三方许可见 `THIRD_PARTY_NOTICES.md`。

## 6. 工作流保存与兼容

新状态保存在：

```text
node.properties.elza_prompt_switch
```

状态内容包含版本号、槽位数量和 Prompt 数组。空字符串槽位会原样保留。

加载旧工作流时按以下顺序迁移：

1. 新版 `elza_prompt_switch` 状态。
2. 旧版 `elza_prompts` 属性。
3. 旧版 `widgets_values = [index, count, prompt_0, ...]`。

迁移过程不创建替代节点，因此节点 ID、位置、用户尺寸和现有连接保持不变。迁移成功后使用新版状态继续保存。

## 7. 后端执行和缓存

- 后端通过 `extra_pnginfo` 查找当前节点的 properties。
- 动态 `prompt_N` 作为可选 STRING 输入接收。
- 因为结果包含随机选择，`IS_CHANGED` 返回 `NaN`，每次 Queue 都重新展开。
- `index` 的绝对范围为 0～98；实际槽位越界会在执行时给出错误。

## 8. 本版本审查重点

- 新建节点是否默认显示 3 个 STRING 端口。
- 节点内是否直接显示多行 Prompt 输入框，且不再出现编辑弹窗。
- 修改 `count` 并点击“更新”后，槽位数量是否正确变化。
- 接线圆点是否和对应多行文本框位于同一原生输入行，没有顶部重复的 `prompt_N` 列表。
- 连接 STRING 后是否锁定本地编辑，断开后是否恢复。
- 增减槽位后节点 ID、位置和手动尺寸是否保持。
- 已连接的端口是否不会被缩减操作删除。
- 连接值、本地文本、连接空字符串的优先级是否正确。
- 四类随机语法是否符合预期。
- 旧工作流的 Prompt 文本、空槽位、index 和连接是否保留。
