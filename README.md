# MAP7E Reader

手机优先的私人阅读空间。保留 React 18 + TypeScript + Vite、原生 CSS 和轻量 hash 导航，没有新增运行时依赖、Router、后端或完整电子书引擎。

## 运行与验证

```sh
npm ci
npm run dev
npm run build
npm run test:ui
```

`build` 顺序执行 `tsc -b`、`vite build`。`test:ui` 构建后执行 75 项 DOM 交互回归、14 项文件／IndexedDB 边界检查、11 项位置／分页／CSS 静态检查。jsdom、fake-indexeddb 只用于开发测试，不进入网站运行包。测试文件是明确标注的原创夹具，不是教材正文。

## 页面与分页阅读

- Home：MAP7E Reader、「你好，枫」、天空远景与轻量环境光，只保留继续阅读／我的书库／阅读记录／设置四个半透明气泡入口。首页不再显示书架，以一个 `100dvh` 场景为目标；很矮的视口仍允许内容自然增长，避免裁切入口。
- Library：37 本原有演示藏书加《普通心理学》第6版，分类及书名／作者／版次／标签搜索。继续使用原生横向滚动、scroll-snap、transform 和 opacity；当前封面聚焦，书名在滚动稳定后切换。
- Book Detail：封面、作者、版次、分类、学习阶段、个人学习寄语、阅读状态和目录框架，以及私人文件替换／移除。未导入正文的主按钮为「导入书籍开始学习」。Library 和详情等内页共用返回／页名／设置导航，不混入 Home 内容。
- Reader：固定视口分页，首页「继续阅读」直接恢复最近阅读书籍的内容锚点；点击书库封面仍先进入详情。没有实际阅读位置时，气泡引导进入第一本学习书的详情。

保留 `100dvh`、`viewport-fit=cover`、四边 safe-area 和 reduced-motion。Library／详情可正常纵向滚动，Reader 正文不再用 scrollTop。没有新增粒子、视频或 Canvas 动画。

### 分页与位置

- CSS multi-column 根据正文窗口的实际宽高、字体、字号、行距及左右边距完成排版。DOM Range 读取字符矩形，将列边界映射回原段落和字符偏移；没有按固定字数切页。每次只排当前章节。
- 原正文区域接收点击，没有覆盖文字的透明按钮层：左 25% 上一页、中间 50% 显示／隐藏控件、右 25% 下一页。Pointer Events 支持横向 swipe，区分纵向移动、取消手势、长按和已有文字选区；同时支持方向键／PageUp／PageDown。物理触屏选择与手势仍需真机验证。
- 翻页为 180ms translateX，跨章轻量 opacity；系统 reduced-motion 或关闭动态效果后停用。工具层展开不改变正文窗口尺寸；底部常驻细进度条、百分比和工具入口，预留底部安全区。
- `ReadingPosition` 保存 `chapterId / paragraphIndex / characterOffset / contentRevision / updatedAt`，可选 `completed`。字符偏移采用 DOM 使用的 UTF-16 单位，并避免落入代理对中间；页码不持久化。
- 调整字号、字体、行距、边距，窗口／横竖屏变化或字体加载完成后重新测量。找到包含原锚点的列，不把锚点反复改成新页起点，以减少多次重排漂移。旧的章节＋滚动比例只能近似迁移为正文偏移，无法精确还原旧滚动像素。
- 进度＝锚点之前的原正文字符数／全书正文字符数，按章节文本长度加权；最后一页再向后翻标记读完。标题和页码不参与进度计算。

## 书籍与内容结构

```text
src/types/book.ts                       Book / BookContent / Chapter / ReadingPosition
src/data/catalog.ts                     目录适配与内容注册
src/data/books/demo.ts                   明确标记的原创演示内容
src/data/books/psychology-general/
  metadata.ts                           第一本文献的独立元数据
  chapters.ts                           正式目录待补充，目前为空
  index.ts                              书籍入口
src/services/importBook.ts              TXT 解码与分段、导入预览数据接口
src/services/privateBooks.ts            IndexedDB 事务与文件版本隔离
src/services/readingPosition.ts         内容锚点、旧位置迁移与进度
src/services/pagination.ts              DOM Range 列边界与锚点查找
src/hooks/usePagination.ts              正文测量、重排与运行时页码
src/hooks/usePrivateLibrary.ts          私人内容加载与保存状态
src/hooks/useReaderState.ts             小型设置与同步位置检查点
src/hooks/usePage.ts                    原有 hash 导航
src/components/reader/                  页面、书架、导入面板与缺少正文状态
```

`Book` 是元数据，包含 `id/title/author/edition/category/description/cover/readingProgress/sourceType/availability/chapters`，并预留 `learningStage/tags/notesCount/learningStatus`。`BookContent` 通过 `bookId` 关联书籍，正文属于各自的 `Chapter`，不再由 Reader 共享 sampleChapters。稳定内容锚点与运行时分页相互独立；替换文件时原位置一并重置，旧标签页不能写入新文件的 IndexedDB 位置。

增加下一本书只需提供元数据和内容注册／私人文件记录，无需修改 Reader 核心组件。演示书保持独立的 demo 内容映射；私人书籍没有任何演示正文回退。

## 《普通心理学》第6版

- ID：`general-psychology-6`
- 作者：彭聃龄、陈宝国；分类：心理学 · 基础。
- 学习定位：心理学专业学习 · 第一阶段；第一本 · 心理学基础。
- 书目信息来自本次用户提供的信息；简介是个人学习寄语。
- 封面由 MAP7E Reader 用 CSS 和文字自制，不使用未经授权的原版高清封面。
- **仓库没有本书正文，也没有经过核对的第6版正式目录。初始章节数组为空，Reader 明确显示「正文文件尚未导入」。没有下载或编造教材正文。**
- 文件导入后的目录来自该私人文件的标题；自动阅读分段不代表经过校对的教材正式目录。

其余 37 本书仍是原有 mockLibrary 演示书目；程序化封面和原创三章演示文本不代表各书原著。阅读记录只包含实际进入过正文的书籍，学习状态字段不等于完整统计／笔记系统。

## 私人文件导入

从详情或缺少正文的 Reader 打开「导入私人书籍文件」，选择并预览后确认。文件只保存在当前浏览器，应用没有上传正文的网络接口。

- **TXT**：实际可读。支持 UTF-8、GB18030 / GBK、UTF-16LE；编码需用户选择。识别常见中文章节标题与 `Chapter N`，保留序言；没有标题时生成阅读分段。长正文自动限制段落和分段长度，避免单章无限增长。原文按纯文本渲染，不执行 HTML。
- **EPUB**：接受选择并保存原始 Blob；仅检查基本 ZIP 文件头，没有完整 EPUB 校验或解析。明确显示「EPUB 已保存，但当前尚未解析，不能阅读」。
- **PDF**：暂不支持，不做解析或 OCR。
- 单文件上限 20 MB。拒绝空文件、明显二进制 TXT、只有标题没有正文的 TXT、非法编码和不支持的格式。超过 3000 个阅读分段会提示拒绝。
- IndexedDB 数据库 `map7e-private-library` 的 `books` 保存 Blob、正文、元数据与版本；`positions` 保存阅读位置。选择→解析→预览→确认后才保存；确认前取消不修改旧数据。替换文件与重置进度在同一事务内，失败时保留旧 Blob、正文和位置。
- 详情中的「移除已导入文件」必须二次确认。单次事务删除该书的私人 Blob、解析正文和 IndexedDB 位置，成功后清理本地小型检查点；保留内置书目元数据，恢复缺少正文状态。失败时回滚，其他书籍不受影响；不会删除设备上的原始文件。
- localStorage 仅保存原有 Reader 设置和小型位置检查点，用于关闭页面时同步落盘；**不保存正文或 Blob**。异步位置同时保存在 IndexedDB。
- 加载、重试、空间不足／存储不可用和替换确认都有明确状态。清理站点数据、更换设备或浏览器会失去本机文件，请保留自己的原始文件；本轮没有云同步或导出备份工具。

## 回归与已知限制

本轮续作：TypeScript／Vite 构建通过，100 项自动检查通过（75 UI＋14 存储／导入＋11 分页／位置／静态）；`npm run dev` 输出 ready，同一进程环境内请求开发页面得到 HTTP 200。

本轮新增覆盖：首页无书架、左右点击、中央控件切换、模拟 swipe／纵向／取消手势、真实 DOM 选区前置条件、字号／字体／行距／边距重排、360／375／390／430px 与横屏的合成尺寸变化、锚点所在列验证、退出和刷新恢复、删除二次确认／取消／失败／成功、替换第二项请求失败的原子回滚及其他书籍隔离。

**本轮没有真实浏览器视觉验收，也没有 iPhone Safari 验证。** `dom-layout-fixture.cjs` 仅为 JSDOM 提供可重复的合成矩形；测试夹具的近似排版不能证明浏览器实际换行、无横向溢出、刘海／地址栏安全区、物理触屏选择／swipe、动画效果或 60fps。CSS 静态检查仅证明相关规则存在。多栏分页在实际 Safari 上仍需重点验收；长 TXT 的解析仍在主线程进行。

以下为上一轮纵向阅读器的历史验收记录，**不能用作本轮分页版本的浏览器验证结果**：

第二轮修改前，25 项原有 DOM 检查及 TypeScript / Vite 构建通过，开发服务成功启动并返回 HTTP 200。

第二轮自动检查覆盖：四个主页面、详情入口、直接继续阅读、章节／滚动恢复、目录、字号／字体／主题、搜索／分类、返回、刷新、异常 URL、损坏或不可用存储；真实书目占位、TXT 预览及安全渲染、仅从 IndexedDB 恢复正文和位置、替换重置、EPUB 无伪造正文、存储失败、文件编码／大小／Unicode、真实 Blob 持久化及事务失败保留旧文件。

第二轮公开站点 Chromium 验收结果：

- 360 / 375 / 390 / 430px × Home、Library、Book Detail、未导入 Reader，共 16 组无页面横向溢出；另外四种宽度的导入面板和导入后实际正文，8 组也无页面横向溢出。部分 iframe 使用桌面滚动条，占用 15px 可用宽度。
- 原创两章测试 TXT 通过真实文件选择器导入；目录跳到第二章，21px／无衬线／夜读生效。章节内滚动到 1100px，离开后首页继续阅读直接恢复到第二章 1100px；刷新后再次恢复同一位置、字号和主题。
- 原生横向滚轮使书架从 scrollLeft 374 移到 561 并稳定吸附，中心书和书名切换到《完美世界》，点击进入详情。心理学分类＋彭聃龄搜索返回一本书，书目及导入后目录显示正确。
- 这些操作发生在隔离的测试浏览器；测试 TXT 不进入仓库，不会为其他用户预置正文。

`/mobile-check.html` 是独立 QA 页面，不在产品导航中，可检查 360 / 375 / 390 / 430 / 768 / 1280px 视口。

**DOM 检查没有浏览器布局引擎；Chromium iframe 也不等于 iPhone 真机。Safari 地址栏、刘海安全区、物理触屏惯性和 60fps 尚需实机验证。**

旧 `ShelfWall`、`ShelfRow`、`BookSpine`、`ReadingPortal`、`useSpatialState` 已确认没有新版或测试依赖后删除。保留原 mockLibrary 数据源，没有进行无关清理。

执行环境可能输出 npm `http-proxy` 配置警告、jsdom 传递依赖 `whatwg-encoding` 弃用提示；它们不是 TypeScript / Vite 编译错误。

下一轮优先：用用户合法提供的实际 TXT 校对目录与段落、iPhone 真机阅读与滑动体验、在独立内容接口上实现经过验证的 EPUB 解析。
