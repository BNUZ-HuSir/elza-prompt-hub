# Elza Prompt Hub

Elza 的 ComfyUI Prompt 管理与随机语法节点集。当前版本：`0.2.0`。

## 安装

从 [Releases](https://github.com/BNUZ-HuSir/elza-prompt-hub/releases) 下载 zip，解压到 `ComfyUI/custom_nodes/elza-prompt-hub/`。

首次使用时会在插件目录内自动创建以下主数据目录：

```text
elza-prompt-hub/wordbanks/promptbank/
elza-prompt-hub/wordbanks/promptmixer/
```

从 `0.2.0-alpha.13` 或更早版本升级时，插件会把旧 `ComfyUI/user/elza-prompt-hub/bank`、`mix` 数据首次复制到上述插件目录；旧文件不会删除。插件根目录中的旧 `wordbank*.yaml` 也会按原有规则迁移，`wordbank-example.yaml` 不参与迁移。Bank/Mixer 的“另存备份”会打开系统保存位置选择器，把全部词库打包成 ZIP，不在词库目录内创建备份。

覆盖安装或更新插件时，请保留整个 `wordbanks` 文件夹；删除插件前建议先使用“另存备份”。

## 节点

### Prompt Switch
多栏预设词切换器。从本地 Prompt 槽位或连接的 STRING 中选择一组输出，并展开随机词语法。


**输入**

| 参数 | 说明 | 限制 |
|------|------|------|
| index | 选择第几个 Prompt 槽位 | 0 ~ 当前槽位数-1 |
| count | 目标 Prompt 槽位数量，点击“更新”后生效 | 1 ~ 99 |
| prompt_0 ~ prompt_98 | 可连接的原生 STRING 输入端口 | 最多 99 个 |

每个 Prompt 使用 ComfyUI 原生 STRING 多行文本框，文本框和接线圆点属于同一行，不会重复显示两套 Prompt。连接到 `prompt_N` 的 STRING 始终优先于该槽位的本地文本；连接值为空字符串时也会覆盖本地文本。连接期间原生文本框会锁定，本地内容仍被保留，断开后继续生效。

**输出**

| 名称 | 说明 |
|------|------|
| text | 解析后的预设词文本 |

**使用**

1. 右键菜单 → `Elza/prompt` → `Elza Prompt Switch`
2. 直接在节点内填写各槽位的多行 Prompt
3. 修改 `count`，点击节点内的 `更新` 按钮增减槽位
4. 需要由其他节点提供文本时，连接对应的 `prompt_N` STRING 端口
5. 调整 `index` 选择当前生效的槽位
6. Queue 执行，输出选择并展开后的文本

本地文本输入时实时保存到工作流属性。若高编号端口已有连接，点击“更新”时不会缩减到会断开该连接的范围。

旧版工作流会自动迁移 `index / count / prompt_0...`，保留空槽位、节点 ID、位置、尺寸和已有连接。

---

### Custom Prompt Join

带自定义标签的多栏 Prompt 拼接节点。

**输入与控件**

| 参数 | 说明 | 限制 |
|------|------|------|
| count | 目标输入项数量，点击“更新”后真正增删 | 1～20 |
| separator | 各非空结果间的分隔符 | 默认 `, ` |
| random_mode | `随机`时每次执行重新抽取；`固定`时使用 seed 复现 | 默认“随机” |
| seed | 固定模式可编辑；随机模式显示本次 Queue 实际使用的运行 seed，并保持只读 | 默认 0 |
| 标签 1～20 | 标注对应输入框的含义，只保存为界面标签 | 不会变成端口 |
| text_0～text_19 | 本地多行 Prompt 或上游 STRING | 支持随机语法 |

每项先单独展开随机语法，再跳过空结果，最后用 `separator` 按顺序拼接。标签可以填写“人物”“镜头”“光照”等；STRING 接线只影响对应多行文本，标签仍可编辑。随机模式每次 Queue 前生成一个新的运行 seed，并把它显示在节点上；本次执行的所有随机语法共用该 seed，因此可以按节点上显示的 seed 复现本次结果。固定模式下相同 seed 可复现。本地文本、标签、分隔符、随机模式、固定 seed、最近一次运行 seed 和已应用的 count 都保存在 workflow 中。

---

### Prompt Bank

词库管理节点。通过弹窗浏览、选择、管理词条，与额外提示词拼接输出。
<img width="1082" height="447" alt="image" src="https://github.com/user-attachments/assets/ae1f3a58-5633-46ff-b385-3fae2412f629" />

<img width="2129" height="1111" alt="image" src="https://github.com/user-attachments/assets/9a60f14f-be93-40e6-9ee1-cf4d05d5cc6e" />

<img width="2129" height="1111" alt="image" src="https://github.com/user-attachments/assets/2d5b9d83-4fd1-45c7-bee7-a61f1af10941" />

**输入**

| 参数 | 说明 | 限制 |
|------|------|------|
| text_display | 已选词条展示（只读） | — |
| extra_prompt | 额外提示词（多行），支持随机语法 | — |
| final_weight | 完整输出的最终权重；默认 1 不增加括号 | 0～10 |

**输出**

| 名称 | 说明 |
|------|------|
| text | 已选词（可逐条设置权重）+ 额外提示词拼接，并应用最终权重 |

**使用**

1. 右键菜单 → `Elza/prompt` → `Elza Prompt Bank`
2. 点 `打开 Prompt Bank` 打开弹窗
3. 左侧选择一级 Tag，顶部选择二级 Tag，中栏点击词条选择
4. 确认后词条展示在节点上
5. 在 `extra_prompt` 中输入额外文本
6. Queue 执行 → 输出拼接结果

**弹窗功能**

| 功能 | 说明 |
|------|------|
| 分类管理 | 一级 Tag 在左、二级 Tag 在顶部；一级 Tag 可用 `···`/右键，二级 Tag 直接右键维护 |
| 词条管理 | 同一弹窗中用自定义小窗增删改，确定后立即原子保存 |
| 查重高亮 | 中栏已选词条高亮 |
| 节点选择 | 搜索、来源定位、多选和拖动排序；“应用到节点”只更新当前节点 |
| 文件管理 | 新建、导入、改名、导出、打开当前 YAML 所在文件夹、另存全部备份和删除词库 |
| 备份词库 | 通过系统保存位置选择器另存 ZIP；不写入插件目录 |

---

### Prompt Mixer

结构化 Prompt 组装节点。管理弹窗左侧显示一级分组，中间显示二级混合项容器卡片；点击卡片进入候选词组小窗。蓝图节点按一级分组折叠显示全部混合项，每项从可搜索下拉框中单选一个中文词组或选择“不使用”，实际输出 workflow 保存的英文快照。

**输入**

| 参数 | 说明 |
|------|------|
| final_weight | 完整 Prompt 的最终权重；默认 1 不增加括号 |

节点内提供全部展开、全部收起、刷新词库和管理词库。一级 Tag 折叠状态、中英文选择快照会随 workflow 保存；YAML 无法匹配时仍可继续输出并清除历史保存值。

---

### Random Prompt

单个可编辑多行 Prompt 节点。下方只读区域会实时显示每个随机选项的实际出现概率，执行时输出一次随机展开结果。

例如 `{0.5::day|1.5::night}` 会显示 `day 25%`、`night 75%`。

### Image Resolution

`Elza Image Resolution` 用于集中选择生成尺寸。选择“常用尺寸”时，从 `512级 / 768级 / 1024级 / 1280级 / 1536级 / 2048级` 中选择基准、宽高比和 `scale_factor` 系数；例如 `1024级 × 0.8` 的长边会按约 819 计算，并最终对齐到 8。选择“自定义”时直接填写 `width` 和 `height`，系数不参与计算。节点上的“交换宽高”按钮执行一次横竖交换，不作为工作流输入。输出只有 `width` 和 `height`，可直接连接到 `Empty Latent Image` 的宽高输入。旧版分辨率节点的字段会在加载工作流时自动迁移。

---

## 随机词语法

以下语法适用于所有支持随机词的节点。

| 语法 | 说明 | 示例输入 | 可能输出 |
|------|------|----------|----------|
| `{a\|b\|c}` | 随机单选 | `{红\|蓝\|绿}` | `红`、`蓝` 或 `绿` |
| `{0.5::a\|1.5::b}` | 按相对权重随机单选 | `{0.5::白天\|1.5::夜晚}` | `夜晚` 的概率约为 `白天` 的 3 倍 |
| `{2\$\$a\|b\|c}` | 无重复随机多选 | `{2\$\$猫\|狗\|鸟}` | `狗, 猫` 等 |
| `{a\|}` | 空字符串也是合法选项 | `前缀{细节\|}` | `前缀细节` 或 `前缀` |
| 无语法 | 原样输出 | `hello world` | `hello world` |

> 支持混合：`{红\|蓝}色的{猫\|狗}` → `红色的狗` 等
>
> 多选结果使用 `, ` 拼接；选择数量超过选项数时自动限制为全部选项。

当前只实现以上四类语法，不支持 wildcard、变量、Jinja、自定义分隔符、范围或 sampler。

随机语法依据 [adieyal/dynamicprompts](https://github.com/adieyal/dynamicprompts) 的 Variant 语法核对并独立实现，不依赖该 Python 包。固定参考提交和 MIT 许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## License

本项目基于 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可。

- ✅ 个人使用、学习、二次开发
- ✅ 修改和分发（需注明原作者）
- ❌ 商业用途
- ❌ 任何违反法律法规的使用
