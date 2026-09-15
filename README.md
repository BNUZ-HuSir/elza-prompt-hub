# Elza Prompt Hub

Elza Prompt Hub 是一组用于整理、选择、组合 Prompt 和管理生成尺寸的 ComfyUI 节点。当前版本：`v0.2.0`。

[下载最新版本](https://github.com/BNUZ-HuSir/elza-prompt-hub/releases/latest) · [查看更新记录](CHANGELOG.md)

| 节点 | 适合做什么 |
|------|------------|
| Elza Prompt Switch | 在多套完整 Prompt 之间快速切换 |
| Elza Custom Prompt Join | 把“人物、服装、镜头、光照”等输入框按顺序拼接 |
| Elza Prompt Bank | 从分级词库中自由多选词条，并调整顺序和权重 |
| Elza Prompt Mixer | 每个二级分类只选择一个词组，组成结构化 Prompt |
| Elza Random Prompt | 编写随机语法，并实时查看每个选项的出现概率 |
| Elza Image Resolution | 选择常用尺寸、宽高比和缩放系数，输出宽高 |

## 安装

1. 从 [Releases](https://github.com/BNUZ-HuSir/elza-prompt-hub/releases) 下载 `elza-prompt-hub-v0.2.0.zip`。
2. 解压到 `ComfyUI/custom_nodes/`。
3. 确认最终目录是：

   ```text
   ComfyUI/custom_nodes/elza-prompt-hub/__init__.py
   ```

   不要出现 `elza-prompt-hub/elza-prompt-hub/__init__.py` 这样的双层目录。
4. 重新启动 ComfyUI。
5. 在节点搜索中输入 `Elza`；Prompt 节点位于 `Elza/prompt`，分辨率节点位于 `Elza/image`。

如果启动日志提示缺少 `yaml`，请在 ComfyUI 使用的 Python 环境中安装：

```text
pip install -r ComfyUI/custom_nodes/elza-prompt-hub/requirements.txt
```

首次使用时会在插件目录内自动创建以下主数据目录：

```text
elza-prompt-hub/wordbanks/promptbank/
elza-prompt-hub/wordbanks/promptmixer/
```

从 `0.2.0-alpha.13` 或更早版本升级时，插件会把旧 `ComfyUI/user/elza-prompt-hub/bank`、`mix` 数据首次复制到上述插件目录；旧文件不会删除。插件根目录中的旧 `wordbank*.yaml` 也会按原有规则迁移，`wordbank-example.yaml` 不参与迁移。Bank/Mixer 的“另存备份”会打开系统保存位置选择器，把全部词库打包成 ZIP，不在词库目录内创建备份。

覆盖安装或更新插件时，请保留整个 `wordbanks` 文件夹；删除插件前建议先使用“另存备份”。

## 五分钟上手

先用 `Elza Random Prompt` 验证插件是否安装成功：

1. 添加 `Elza Random Prompt`。
2. 在 `prompt` 输入框中填写：

   ```text
   portrait of a {cat|dog}, {sunny|rainy} day
   ```

3. 把节点的 `text` 输出连接到正向提示词输入，例如 `CLIP Text Encode` 的 `text`。
4. 点击 Queue。
5. 输出会随机得到类似 `portrait of a cat, rainy day` 的文本；下方概率区域会显示每个选项约为 `50%`。

如果这个例子可以运行，说明 Python 节点、前端 UI 和随机语法都已正常加载。

## 节点教程

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

**示例教程**

1. 添加 `Elza Custom Prompt Join`。
2. 把 `count` 设为 `3`，点击 `更新`。
3. 把三个标签分别改为“人物”“服装”“镜头”。
4. 分别填写：

   ```text
   1girl, {black hair|blonde hair}
   red dress
   close-up
   ```

5. 保持 `separator` 为英文逗号加空格 `, `。
6. Queue 后会输出类似：

   ```text
   1girl, black hair, red dress, close-up
   ```

修改 `count` 后必须点击 `更新` 才会真正增删输入项。上游 STRING 接入 `text_N` 后，对应多行输入框会自动进入只读状态；断开连接后，本地内容继续保留。

---

### Prompt Bank

词库管理节点。通过弹窗浏览、选择、管理词条，与额外提示词拼接输出。

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
2. 点 `打开 Prompt Bank` 打开弹窗。
3. 第一次使用时，进入 `文件管理` 新建一个词库；也可以导入已有 YAML。
4. 左侧用 `＋` 新建一级 Tag，在顶部新建或选择二级 Tag。
5. 在中间区域新建词条，分别填写中文名称和实际输出的英文 Prompt。
6. 点击词条加入右侧“已选内容”。右侧可以拖动排序、删除或修改单条权重。
7. 点击 `应用到节点`，本次选择才会写入当前蓝图节点。
8. 可在 `extra_prompt` 中补充自由文本，然后 Queue 输出拼接结果。

右侧已选卡片可以双击，界面会跳回该词条所在的一级/二级 Tag。词库增删改会立即保存到 YAML；关闭弹窗不会撤销词库修改，但没有点击“应用到节点”的选择不会覆盖当前节点。

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

**第一次建立 Mixer 词库**

1. 添加 `Elza Prompt Mixer`，点击 `管理词库`。
2. 在 `文件管理` 中新建一个 Mixer 词库。
3. 左侧点击 `＋` 新建一级分组，例如“人物”。
4. 点击 `＋ 新建混合项` 创建二级项，例如“发色”。
5. 点击“发色”卡片，添加候选词组，例如：

   ```text
   黑色长发 | long black hair
   金色短发 | short blonde hair
   ```

6. 关闭管理弹窗，回到蓝图节点并点击 `刷新词库`。
7. 展开“人物”，点击“发色”右侧选择框，选择一个中文词组；选择“不使用”则该项不输出。

Bank 是自由多选；Mixer 的核心规则是“每个二级混合项最多选择一个候选词组”。新节点第一次加载时所有一级分组默认收起，之后的展开状态会保存到 workflow。

---

### Random Prompt

单个可编辑多行 Prompt 节点。下方只读区域会实时显示每个随机选项的实际出现概率，执行时输出一次随机展开结果。

例如 `{0.5::day|1.5::night}` 会显示 `day 25%`、`night 75%`。

**使用**

1. 在 `prompt` 中输入普通文本和随机语法。
2. 查看只读的 `probability_display`，确认概率是否符合预期。
3. 把 `text` 输出连接到后续文本节点。
4. 每次 Queue 都会重新随机展开；该节点当前不提供固定 seed。

### Image Resolution

`Elza Image Resolution` 用于集中选择生成尺寸。选择“常用尺寸”时，从 `512级 / 768级 / 1024级 / 1280级 / 1536级 / 2048级` 中选择基准、宽高比和 `scale_factor` 系数；例如 `1024级 × 0.8` 的长边会按约 819 计算，并最终对齐到 8。选择“自定义”时直接填写 `width` 和 `height`，系数不参与计算。节点上的“交换宽高”按钮执行一次横竖交换，不作为工作流输入。输出只有 `width` 和 `height`，可直接连接到 `Empty Latent Image` 的宽高输入。旧版分辨率节点的字段会在加载工作流时自动迁移。

**常用尺寸示例**

| 设置 | 输出 |
|------|------|
| `1024级`、`1:1`、系数 `1` | `1024 × 1024` |
| `1024级`、`16:9`、系数 `1` | `1024 × 576` |
| `1024级`、`16:9`、系数 `0.8` | `816 × 464` |

把 `width`、`height` 分别连接到 `Empty Latent Image` 或其他图像尺寸输入。自定义模式只使用手动填写的宽高，所有结果自动对齐到 8。

---

## 随机词语法

以下语法适用于 `Prompt Switch`、`Custom Prompt Join`、`Prompt Bank` 和 `Random Prompt`。`Prompt Mixer` 当前只负责选择并拼接保存的词组，不会再次解析随机语法。

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

## 权重怎么用

Prompt Bank 支持单条词条权重，Bank 和 Mixer 还支持节点级 `final_weight`：

| 设置 | 输出形式 |
|------|----------|
| 单条权重 `1` | `A` |
| Bank 单条权重 `1.1` | `(A:1.1)` |
| 最终权重 `1` | 完整 Prompt 保持原样 |
| 最终权重 `1.1` | `((完整 Prompt):1.1)` |

## 词库存在哪里

Bank 和 Mixer 的 YAML 都保存在插件相对路径：

```text
ComfyUI/custom_nodes/elza-prompt-hub/wordbanks/promptbank/
ComfyUI/custom_nodes/elza-prompt-hub/wordbanks/promptmixer/
```

节点选择时会把中文名称和英文 Prompt 快照保存到 workflow，不使用 YAML 内的稳定 ID。词条后来被删除或改名时，旧 workflow 仍可以显示和输出保存值，并允许用户手动清除。

建议在覆盖升级、移动插件或分享词库前，使用 Bank/Mixer 中的 `另存备份`，在自己选择的位置生成 ZIP。

## 常见问题

### 搜索不到 Elza 节点

- 确认目录不是双层嵌套。
- 查看 ComfyUI 启动日志是否有红色报错。
- 确认 `pyyaml` 已安装。
- 重启 ComfyUI 后，在节点搜索中输入完整名称，例如 `Elza Prompt Bank`。

### 更新后还是旧 UI

先确认新文件已覆盖到正确插件目录，然后重新启动 ComfyUI，并在浏览器中执行一次强制刷新（通常是 `Ctrl + F5`）。

### 更新插件会不会丢词库

只覆盖源码文件，不要删除或覆盖整个 `wordbanks` 文件夹。更新前使用“另存备份”最稳妥。

### 随机模式连续两次结果相同

不同 seed 仍可能偶然抽到相同选项，这是正常概率现象。`Custom Prompt Join` 随机模式下可以观察 seed：每次 Queue 的 seed 应当变化；固定模式下相同 seed 与相同文本应得到相同结果。

## License

本项目基于 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可。

- ✅ 个人使用、学习、二次开发
- ✅ 修改和分发（需注明原作者）
- ❌ 商业用途
- ❌ 任何违反法律法规的使用
