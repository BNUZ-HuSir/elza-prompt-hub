# Changelog

## 0.2.0-alpha.18 — 2026-09-15

- 修复 `Elza Custom Prompt Join` 随机模式与 seed 脱节：每次 Queue 前生成新的运行 seed，并在 workflow 属性中保存。
- 随机语法统一使用本次运行 seed 的 `random.Random` 序列；节点上的 seed 显示本次实际执行使用的值。
- 兼容旧 workflow：没有运行 seed 的旧节点仍回退到系统随机源。

## 0.2.0-alpha.17 — 2026-09-15

- 修复 `Elza Custom Prompt Join`：随机模式下 seed 保持可见并改为只读显示，不再因 NumberWidget 的 disabled 状态清空显示值。
- 修复 seed 步进：显式设置 `step2: 1`，数字控件每次点击按 1 递增或递减。

## 0.2.0-alpha.16 — 2026-09-14

### Added

- 新增 `Elza Custom Prompt Join`：动态创建 1～20 个带自定义标签的多行 Prompt，支持 STRING 接线、可编辑分隔符、随机/固定模式、固定 seed 和四类随机语法；空结果自动跳过。
- Image Resolution 的常用尺寸模式新增 `scale_factor`，先缩放预设基准，再按宽高比计算并对齐到 8；自定义模式不受系数影响。

### Fixed

- Prompt Bank 手动切换词库时保留已选词条、顺序和权重；删除非当前词库不再清空当前选择。

## 0.2.0-alpha.15 — 2026-09-11

### Fixed

- Prompt Switch 从较多槽位更新为较少槽位时，会真正移除多余文本框、STRING 输入端口和 workflow 保存值，并按剩余内容缩短节点高度。
- Image Resolution 从“自定义”切回“常用尺寸”时改用 ComfyUI 原生可见性控制，避免尺寸控件使用负高度后重叠。
- Prompt Mixer 展开和收起时使用确定性的数据量公式计算高度，不再因反复切换而持续增高。
- Prompt Mixer 的内部滚动区域绑定实际可用高度，增加底部安全间距并拦截画布滚轮传播，确保末尾词条可以滚动和选择。

## 0.2.0-alpha.14 — 2026-09-10

### Changed

- Prompt Bank 主词库目录改为插件相对路径 `wordbanks/promptbank/`。
- Prompt Mixer 主词库目录改为插件相对路径 `wordbanks/promptmixer/`。
- 从旧 ComfyUI 用户数据目录首次复制现有 YAML 到插件目录；迁移不删除或修改旧文件，文件名冲突时保留双方。
- “打开文件夹”、增删查改、导入、导出和备份数据源统一使用新的插件相对目录。
- 发布包保留两个词库目录的空占位，不内置同名 YAML，避免覆盖更新时误伤用户词库。

## 0.2.0-alpha.13 — 2026-09-10

### Fixed

- Random Prompt 的大规模无放回概率分析会在枚举状态前判断复杂度；等权词条直接计算，避免大量词条阻塞 UI，并正确保持零权重词条概率为 0。
- Random Prompt 概率预览增加请求版本控制，快速连续输入时旧请求不再覆盖新结果。
- Image Resolution 切换显示模式时不再缩小用户手动调整的节点尺寸；新版自定义工作流也不会被旧版迁移逻辑误判并改写宽高。
- Bank 与 Mixer 在无词条 ID 模式下拒绝同级重名，避免仅靠名称恢复 workflow 时产生歧义。
- 删除 Bank/Mixer YAML 后立即刷新相关画布节点，并保留 workflow 中的中英文快照输出。
- Bank 切换词库前会提示未应用选择将被清空；“清空已选”增加一次撤销能力。

### Added

- Mixer 蓝图节点增加 YAML 词库选择器；词库丢失时显示明确状态，并可切换到其他可用词库。

## 0.2.0-alpha.12 — 2026-09-04

### Changed

- Mixer 初次载入按一级 Tag 数量设置节点高度，默认全部收起；展开后仅在节点内容区滚动，工作流中的折叠状态继续恢复。
- 分辨率节点在“常用尺寸 / 自定义”模式间切换时隐藏无关控件；常用模式宽高只读，自定义模式宽高可编辑。

## 0.2.0-alpha.11 — 2026-09-04

### Changed

- Mixer 首次加载按一级 Tag 数量计算固定高度，初次显示全部收起；用户之后的展开状态继续保存到 workflow。
- 分辨率节点改为“常用尺寸 / 自定义”双模式，移除无意义的当前比例显示和 `ratio` 输出。
- 分辨率节点的 `swap` 改为“交换宽高”按钮；常用尺寸模式切换比例方向，自定义模式直接交换宽高。
- 兼容迁移旧版分辨率节点的 `preset / aspect_ratio / swap` 工作流字段。

## 0.2.0-alpha.10 — 2026-09-04

### Fixed

- Mixer 节点首次加载不再沿用旧的超大高度；面板限制为可滚动的紧凑区域，并只在首次载入时适配一次。

### Added

- Bank 和 Mixer 管理窗口新增“打开文件夹”，直接打开当前 YAML 所在的数据目录。
- 分辨率节点已纳入插件注册，可在 `Elza/image` 分类中使用；只输出 `width` 和 `height`，交换宽高改为按钮动作。

## 0.2.0-alpha.9 — 2026-09-03

### Changed

- Mixer 蓝图节点首次加载和刷新时按内容高度布局，避免进入节点后固定拉成长面板。
- Bank 已选内容卡片精简为中文名、Prompt 和必要的失效提示；双击卡片可定位回来源二级 Tag。

### Added

- 新增 `Elza Image Resolution` 节点，支持常用尺寸、宽高比、自定义尺寸和横竖方向交换。

## 0.2.0-alpha.8 — 2026-09-03

### Fixed

- 修正 Mixer 蓝图节点首次加载时的空白占位与节点高度计算，词库加载完成后按实际内容调整尺寸。
- 移除 Bank 顶部二级 Tag 和 Mixer 二级混合项卡片上的 `···` 按钮，继续支持右键菜单。

### Added

- Bank 已选词条恢复单条权重输入，默认 `1` 原样输出，其他值输出为 `(词条:权重)`；节点 `final_weight` 仍可对完整结果再次加权。

## 0.2.0-alpha.7 — 2026-09-03

### Changed

- Bank 二级 Tag 导航增加明确层级标题，普通状态减少重复操作按钮和来源路径噪音。
- Bank 底部“取消”改为“关闭（不应用选择）”，区分节点选择与词库维护。
- Mixer 候选词组小窗改为按内容自适应高度，并增加中文名称/Prompt 搜索。
- Bank/Mixer 继续复用统一文件操作、状态反馈和自定义弹窗样式。

## 0.2.0-alpha.6 — 2026-09-03

### Changed

- Prompt Bank 改为一级 Tag 左栏、二级 Tag 顶部导航、词条主体和已选右栏的统一窗口。
- Bank 移除独立管理模式与单词条权重，已选词条支持拖动排序。
- Prompt Mixer 管理界面恢复二级混合项容器卡片；点击卡片后在小窗维护候选词组。
- Bank/Mixer 全部 CRUD 改为自定义小窗确认后立即原子保存，不再使用浏览器原生 `prompt` / `confirm`。
- 删除或改名后热刷新画布相关节点，无法匹配的选择保留为橙色工作流快照。
- 备份改为系统保存位置选择器另存 ZIP；不再向插件 `backups` 目录写文件。

### Added

- 新增词库文件管理：新建、YAML 导入、改名、单文件导出、全部 ZIP 备份和删除。
- 新增 Bank 二级 Tag 横向导航与“全部”可搜索选择器。
- 新增一级、二级和词条的 `···` 菜单及右键菜单。

## 0.2.0-alpha.5 — 2026-09-02

### Changed

- Prompt Mix 重构并更名为 Elza Prompt Mixer，移除随机模式、seed、随机概率、prefix 和 suffix。
- Mixer 蓝图节点按一级 Tag 折叠显示所有二级 Tag，每个二级 Tag 使用可搜索下拉框单选中文词条。
- Mixer 选择改为复制中英文快照到 workflow；YAML 无法匹配时保留输出并允许清除历史保存值。
- Bank/Mixer YAML v3 不再写任何 ID 字段；文件定位由 YAML 文件名承担。
- Mixer YAML v3 不再保存随机模式或概率字段。
- Prompt Bank 的分类和词条 YAML 同样不再生成嵌套稳定 ID。
- Prompt Bank 与 Mixer 增加最终权重，默认 1 原样输出，其他值输出 `((完整 Prompt):权重)`。

### Added

- Mixer 一级 Tag 的逐组折叠、全部展开、全部收起和 workflow 状态恢复。
- Mixer 词条中文显示、英文输出、下拉全量搜索及同二级 Tag 中文重名提示。

## 0.2.0-alpha.4 — 2026-09-02

### Added

- 新增 Elza Prompt Mix：分组启用、固定/随机候选、权重、seed 和实时预览。
- 新增 Elza Random Prompt：单个多行输入框与随机选项实时概率显示。
- 新增外部用户数据目录、稳定 ID、Schema v2、原子保存和冲突检测。
- Prompt Bank / Mix 节点新增手动备份按钮，可复制数据到插件 `backups` 目录。
- 新增旧 `wordbank*.yaml` 多文件非破坏迁移；示例文件跳过，原文件不会删除或覆盖。

### Changed

- Prompt Bank 重写为选择模式和管理模式，管理操作先进入草稿。
- Prompt Bank 支持多词库、跨分类搜索、来源路径、排序和注意力权重。
- Bank/Mix 复杂状态统一保存到 `node.properties`，节点不再动态重建。
- 随机概率预览和实际执行共用同一套 Python 语法解析规则。

### Security

- 移除 widget 的 `pop/unshift` 重排和用户文本 HTML 拼接。
- 数据文件只允许服务端校验后的稳定 ID，并使用临时文件原子替换。
- API 返回结构化错误，不向前端暴露原始异常详情。

## 0.2.0-alpha.3 — 2026-09-01

### Fixed

- 修复 Prompt socket 与多行输入框分离、顶部重复显示 `prompt_N` 的错误 UI。
- Prompt 改用 ComfyUI 原生 STRING multiline widget，并与对应 socket 绑定在同一行。
- 修复独立 DOM 编辑器导致的节点高度过大和重复标签问题。

### Changed

- `count` 只控制原生 Prompt 行的显示和对应输入端口。
- 已连接的原生 Prompt 行由 ComfyUI 锁定，上游 STRING 优先。
- 版本更新为 `0.2.0-alpha.3`。

### Removed

- 移除 `0.2.0-alpha.2` 的整块自绘 Prompt 编辑区域。

## 0.2.0-alpha.2 — 2026-09-01

### Added

- Prompt Switch 新增原生 `count` 数量输入，范围 1～99。
- Prompt Switch 在节点内部直接显示多行 Prompt 编辑区。
- 每个槽位显示本地/STRING 连接状态。
- 新增“更新”按钮，按 `count` 增减 Prompt 槽位和输入端口。

### Changed

- 本地 Prompt 改为输入时实时保存，不再通过弹窗确认。
- STRING 连接期间禁用对应本地文本框，断开后恢复原内容。
- 版本更新为 `0.2.0-alpha.2`。

### Removed

- 移除 Prompt Switch 的“编辑 Prompt”按钮和编辑弹窗。

### Compatibility

- 保留 `elza_prompt_switch`、`elza_prompts` 和旧 `widgets_values` 迁移。
- 保留连接值优先规则，包括连接空字符串。
- 不重建节点、不强制缩放，缩减数量时不删除已连接端口。

## 0.2.0-alpha.1 — 2026-09-01

### Added

- 新增独立的轻量随机 Prompt 解析器。
- 支持 `{a|b|c}` 随机单选。
- 支持 `{0.5::a|1.5::b}` 带权随机单选。
- 支持 `{2$$a|b|c}` 无重复随机多选。
- 保留 `{a|}` 合法空选项。
- Prompt Switch 新增事务式 `编辑 Prompt` 弹窗。
- Prompt Switch 支持 1～99 个动态原生 STRING 输入端口。
- 增加旧版 `widgets_values` 与 `elza_prompts` 状态迁移。
- 增加随机语法、后端状态和前端安全规则测试。

### Changed

- Prompt Switch 本地多行文本改存于 `node.properties.elza_prompt_switch`。
- 连接的 `prompt_N` STRING 优先于本地文本，包括空字符串。
- 多选结果按随机选择顺序使用 `, ` 拼接。
- 版本更新为 `0.2.0-alpha.1`。

### Removed

- 移除预声明并隐藏 99 个 Prompt widget 的旧实现。
- 移除 Prompt Switch 的 Canvas 标签绘制、强制 `computeSize/setSize` 和 widget 类型修改。

### Compatibility

- 旧工作流中的 `index / count / prompt_0...` 会在加载时迁移。
- 不重建节点，不主动改变节点 ID、位置、尺寸或已有连接。
- 已连接的高编号端口会阻止槽位缩减，避免静默断线。
