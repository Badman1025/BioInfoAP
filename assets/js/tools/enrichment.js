/* =============================================================================
 * tools/enrichment.js  —  富集分析（ORA：超几何检验 + BH 校正）
 * 基因集来源：内置示例库 / 本地 GMT / Enrichr 在线库
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块与页面标题 */
    '富集分析': 'Enrichment analysis',
    'GO / KEGG / Reactome 等基因集富集：超几何检验 + BH 校正，输出气泡图、条形图与结果表。':
      'Gene-set enrichment for GO / KEGG / Reactome etc.: hypergeometric test + BH correction, with dot plot, bar plot and result table.',
    'GMT 上传': 'GMT upload',
    '气泡图': 'Dot plot',
    '富集分析（ORA）': 'Enrichment analysis (ORA)',
    '输入差异基因列表，与基因集库做超几何检验（等价 Fisher 精确检验单侧），输出显著富集通路。':
      'Enter a differential gene list and run a hypergeometric test (equivalent to a one-sided Fisher exact test) against gene-set libraries to output significantly enriched pathways.',

    /* 输入格式 */
    '# 也可以这样写：': '# or simply write:',
    '# 或两列 long 表：': '# or a two-column long table:',
    '单列基因名（推荐）': 'Single-column gene names (recommended)',
    ['<b>一行一个基因名</b>，支持一次粘贴多列（会自动展平）。也识别逗号、分号、空格分隔。' +
      '若含表头（如 <code>gene</code> / <code>symbol</code>）会自动跳过。']:
      '<b>One gene name per line</b>; you can paste several columns at once (they are flattened automatically). ' +
      'Comma-, semicolon- and space-separated input is also recognised. A header row (e.g. <code>gene</code> / <code>symbol</code>) is skipped automatically.',
    '多列表（分组对比）': 'Multi-list table (group comparison)',
    ['每行一个基因列表，格式 <code>列表名: 基因1, 基因2, ...</code>；' +
      '或使用两列 long 表 <code>List &lt;TAB&gt; Gene</code>。适合「上调/下调分别富集」或不同分群的对比。']:
      'One gene list per line, as <code>listName: gene1, gene2, ...</code>; ' +
      'or a two-column long table <code>List &lt;TAB&gt; Gene</code>. Suitable for enriching up-/down-regulated genes separately or comparing different groups.',

    /* 输入面板 */
    '输入基因列表': 'Input gene list',
    '分析参数': 'Analysis parameters',
    '输入模式': 'Input mode',
    '单个基因列表': 'Single gene list',
    '多个列表（分组对比）': 'Multiple lists (group comparison)',
    '基因集最小基因数': 'Min genes per gene set',
    '基因集最大基因数': 'Max genes per gene set',
    '多重检验校正': 'Multiple-testing correction',
    '不校正（原始 P）': 'No correction (raw P)',
    '显著性阈值': 'Significance threshold',
    '显示前 N 个通路': 'Show top N terms',
    '气泡图 X 轴': 'Dot plot X axis',
    '富集倍数 (Fold enrichment)': 'Fold enrichment',
    'Rich factor (k/K)': 'Rich factor (k/K)',
    'Gene ratio (k/n)': 'Gene ratio (k/n)',
    '排序方式': 'Sort by',
    '按 P 值（最显著在前）': 'By P value (most significant first)',
    '按富集倍数': 'By fold enrichment',
    '按交集基因数': 'By overlap size',
    '背景基因集（可选，每行一个 / 逗号分隔）': 'Background gene set (optional; one per line / comma-separated)',
    '留空则以所选基因集库中的全部基因为背景。若实验仅检测了部分基因（如靶向 panel / 芯片），请务必填写真实背景。':
      'Leave blank to use all genes in the selected library as the background. If only a subset of genes was assayed (e.g. a targeted panel or microarray), be sure to provide the true background.',
    '开始富集分析': 'Run enrichment analysis',

    /* 统计概览与信息提示 */
    '基因集库': 'Gene-set libraries',
    '{n} 条': '{n} sets',
    '背景基因数 (N)': 'Background genes (N)',
    '基因列表数': 'Gene lists',
    '输入基因数 (n)': 'Input genes (n)',
    '未匹配到背景': 'Unmatched to background',
    '显著通路 (FDR ≤ {p})': 'Significant terms (FDR ≤ {p})',
    '基因集来源：<b>{src}</b>；检验方法：超几何检验（上尾，过表征），校正方法：<b>{adj}</b>；用时 {dt} s。':
      'Gene-set source: <b>{src}</b>; test: hypergeometric test (upper tail, over-representation); correction: <b>{adj}</b>; elapsed {dt} s.',
    '基因集来源：<b>{src}</b>；物种：<b>{sp}</b>；检验方法：超几何检验（上尾，过表征），校正方法：<b>{adj}</b>；用时 {dt} s。':
      'Gene-set source: <b>{src}</b>; species: <b>{sp}</b>; test: hypergeometric test (upper tail, over-representation); correction: <b>{adj}</b>; elapsed {dt} s.',
    '有 <b>{n}</b> 个输入基因不在背景基因集中，已自动忽略：':
      'Some <b>{n}</b> input genes are not in the background gene set and were ignored: ',

    /* 结果卡片与图表 */
    '富集结果对比图': 'Enrichment comparison plot',
    '富集结果图': 'Enrichment plot',
    '条形图': 'Bar plot',
    '棒棒糖图': 'Lollipop chart',
    '基因-通路网络': 'Gene–pathway network',
    '富集网络图': 'Enrichment map',
    '（基因过多，仅显示连接通路数最多的前 {n} 个）': '(Too many genes; showing only the top {n} connected to the most pathways)',
    ['棒棒糖图：横轴为富集倍数，棒长即富集倍数，圆点大小 = 交集基因数，颜色 = −log₁₀ FDR；与气泡图信息一致，但更容易读出具体数值。']:
      'Lollipop chart: the x axis is the fold enrichment; stem length = fold enrichment, dot size = number of overlapping genes, colour = −log₁₀ FDR. Same information as the dot plot but easier to read off exact values.',
    ['基因-通路网络：左侧为通路（颜色 = −log₁₀ FDR），右侧为基因节点；连线表示该基因在该通路的交集中。' +
      '一个基因连接多条通路时即为「共享基因」，往往是网络中的枢纽信号。']:
      'Gene–pathway network: pathways on the left (colour = −log₁₀ FDR) and genes on the right; a link means the gene is in that pathway’s overlap. ' +
      'A gene connected to several pathways is a “shared gene” and often the hub signal of the network.',
    ['富集网络图：节点为通路（大小 = 交集基因数，颜色 = −log₁₀ FDR），两个通路共享 ≥ 2 个基因时连线，粗细 = 共享基因的 Jaccard 相似度；' +
      '同一簇的通路通常具有一致的生物学主题。初始布局为确定性力导向算法；<b>可拖拽节点</b>分开拥挤的簇（相邻节点自动避让），悬停高亮相邻通路，双击空白处恢复初始布局。']:
      'Enrichment map: nodes are pathways (size = number of overlapping genes, colour = −log₁₀ FDR); two pathways are linked when they share ≥ 2 genes, with width = Jaccard similarity of the shared genes. ' +
      'Pathways in the same cluster usually share a coherent biological theme. The initial layout is a deterministic force-directed algorithm; <b>drag nodes</b> to untangle crowded clusters (neighbours give way automatically), hover to highlight the neighbouring pathways, and double-click the background to restore the initial layout.',
    '全部富集结果（{n} 行）': 'All enrichment results ({n} rows)',
    '全部富集结果（{n} 行，已按 P 值排序）': 'All enrichment results ({n} rows, sorted by P value)',
    '没有基因集通过筛选（基因集大小 {a}~{b}，且至少 1 个交集基因）。可放宽基因集大小范围后重试。':
      'No gene set passed the filter (set size {a}~{b}, with at least 1 overlapping gene). Try widening the gene-set size range.',

    /* 结果表 */
    '基因列表': 'Gene list',
    '通路 / 基因集': 'Term / gene set',
    '基因集大小': 'Set size',
    '交集': 'Overlap',
    '富集倍数': 'Fold enrichment',
    'P 值': 'P value',
    '交集基因': 'Overlapping genes',
    '导出': 'Export',
    '导出该通路的交集基因': 'Export overlapping genes of this term',
    'FDR 列已按 {n} 条基因集完成多重检验校正；标红行为 FDR ≤ {p} 的显著通路。每行「TSV」按钮可导出该通路的交集基因。':
      'The FDR column is corrected for multiple testing across {n} gene sets; highlighted rows are significant terms with FDR ≤ {p}. The “TSV” button on each row exports the overlapping genes of that term.',

    /* 基因集来源组件 */
    '基因集来源（富集分析的注释库）': 'Gene-set source (annotation library for enrichment)',
    '三种来源<b>单选</b>，分析时只用其中一种：内置示例（16 条）仅供演示流程；正式分析推荐「上传 GMT」或「在线获取 Enrichr 库」。无论选哪种，<b>输入基因都填在页面顶部的「输入基因列表」框</b>，并与所选来源的基因集求交集。':
      'The three sources are <b>mutually exclusive</b> — only one is used per run: the built-in example sets (16) demonstrate the workflow only; for formal analysis prefer “Upload GMT” or “Fetch Enrichr libraries online”. Whichever you choose, <b>the genes go into the “Input gene list” box at the top</b> and are intersected with the gene sets of that source.',
    '内置示例基因集': 'Built-in example gene sets',
    '16 条示例通路，<b>仅供功能演示</b>，不可用于正式分析':
      '16 example pathways, <b>for demonstration only</b>; not for formal analysis.',
    '上传 / 粘贴 GMT 文件': 'Upload / paste a GMT file',
    '推荐：来源与版本完全可控（MSigDB、GO、KEGG 官网下载的 .gmt）':
      'Recommended: source and version fully under your control (.gmt downloaded from MSigDB, GO or KEGG).',
    '在线获取 Enrichr 基因集库': 'Fetch Enrichr libraries online',
    '需联网；首次获取后缓存在浏览器本地，之后可离线复用':
      'Requires internet; after the first fetch it is cached in your browser for offline reuse.',
    '将使用内置的 <b>{n}</b> 条示例基因集（{list} 等）。示例基因列表在这套通路里会得到「细胞周期 / 有丝分裂」显著富集，可用于验证流程。':
      'Will use the built-in <b>{n}</b> example gene sets ({list} etc.). The example gene list yields significant enrichment for “cell cycle / mitosis” here, which can be used to validate the workflow.',
    '、': ', ',
    '尚未选择文件。': 'No file selected yet.',
    '选择 .gmt 文件': 'Choose .gmt file',
    '已加载 <b>{file}</b>：解析出 <b>{n}</b> 条基因集。': 'Loaded <b>{file}</b>: parsed <b>{n}</b> gene sets.',
    '例如：{list}': 'e.g. {list}',
    '未解析到基因集，请确认是标准 GMT（制表符分隔）':
      'No gene set parsed — please make sure it is a standard GMT (tab-separated).',
    '或直接粘贴 GMT 文本（每行：通路名 <TAB> 描述 <TAB> 基因1 <TAB> 基因2 …）':
      'Or paste GMT text directly (per line: term name <TAB> description <TAB> gene1 <TAB> gene2 …)',
    '已解析 <b>{n}</b> 条基因集。': 'Parsed <b>{n}</b> gene sets.',
    '尚未解析到基因集。': 'No gene sets parsed yet.',

    /* Enrichr 在线库交互 */
    '刷新可用基因集库列表': 'Refresh the available library list',
    '（列表获取中…）': '(fetching the list…)',
    '（先获取列表）': '(fetch the list first)',
    '获取所选基因集库': 'Fetch the selected library',
    ['点后会为该库取回 GMT 文本。多数情况下不必手动点：直接点页面底部的「开始富集分析」，' +
      '运行时若该库尚未下载会自动获取并完成富集。']:
      'This retrieves the GMT text of that library. Usually unnecessary: just click “Run enrichment analysis” at the bottom — the library is downloaded automatically if needed and the enrichment is completed in one step.',
    '在线模式需要联网。若网络受限，请改用「上传／粘贴 GMT 文件」。':
      'Online mode requires internet. If the network is restricted, use “Upload / paste a GMT file” instead.',
    ['基因请填在页面顶部的「输入基因列表」框（本处只选择用于注释的基因集库）：' +
      '一行一个基因名，也可用逗号 / 分号 / 空格分隔，或直接从 Excel 复制多列；' +
      '请使用与所选物种对应的<b>基因 Symbol</b>（大小写不影响匹配），例如人 <code>TP53</code>、小鼠 <code>Tp53</code>。' +
      '可点输入框右上角的「加载示例数据」查看格式。<br>' +
      '<b>用法</b>：先在顶部填入基因，再在这里选好物种与注释库，然后点页面底部的「开始富集分析」——' +
      '所选库会在分析开始时自动下载（首次数秒至数十秒，之后走本地缓存），并直接对这些输入基因完成富集，无需预先手动取库。']:
      'Enter the genes in the “Input gene list” box at the top of the page (this section only selects the annotation library): ' +
        'one gene per line, or separated by commas / semicolons / spaces, or paste multiple columns straight from Excel. ' +
        'Use the <b>gene symbols</b> of the selected species (case does not affect matching), e.g. human <code>TP53</code>, mouse <code>Tp53</code>. ' +
        'Click “Load example data” at the top right of the input box to see the format.<br>' +
        '<b>Steps</b>: fill in your genes at the top, choose the species and the annotation library here, then click “Run enrichment analysis” at the bottom — ' +
        'the selected library is downloaded automatically when the analysis starts (seconds to tens of seconds the first time, then served from the local cache) ' +
        'and your input genes are enriched against it immediately; no manual library download is required beforehand.',
    '正在获取 Enrichr 基因集库列表…': 'Fetching the Enrichr library list…',
    '（请从 {n} 个注释库中选一个）': '(pick one of the {n} libraries)',
    '（{n} 条通路）': ' ({n} terms)',
    '获取到 {n} 个基因集库': 'Fetched {n} gene-set libraries',
    ['共列出 <b>{n}</b> 个可选的注释库。<b>这是库的数量，与输入基因个数无关</b>——输入的基因始终保留在顶部输入框，' +
      '分析开始时会与所选库求交集。已自动选中推荐库，直接点「开始富集分析」即可。']:
      '<b>{n}</b> libraries are listed. <b>This is the number of libraries, not the number of input genes</b> — your genes stay in the input box at the top ' +
        'and will be intersected with the chosen library when the analysis starts. A recommended library has been selected automatically — just click “Run enrichment analysis”.',
    '（常用库）': ' (common)',
    ['<span style="color:#d6483f">无法访问 Enrichr：{msg}</span><br>常见原因：处于离线环境、单位网络或代理阻断了 <code>maayanlab.cloud</code>、或浏览器跨域限制（CORS）。' +
      '可直接用浏览器打开 <code>{url}</code> 测试连通性；若无法访问，请到 Enrichr 官网下载对应库的 <code>.gmt</code> 文件，再用「上传 / 粘贴 GMT 文件」方式。' +
      '下方已列出常用库名，也可重试获取。']:
      '<span style="color:#d6483f">Cannot reach Enrichr: {msg}</span><br>Common causes: being offline, an institutional network or proxy blocking <code>maayanlab.cloud</code>, or browser cross-origin (CORS) restrictions. ' +
      'Open <code>{url}</code> in your browser to test connectivity; if unreachable, download the <code>.gmt</code> file of the library from the Enrichr website and use “Upload / paste a GMT file” instead. ' +
      'Common library names are listed below and fetching can be retried.',
    '获取中…': 'Fetching…',
    '已获取 <b>{lib}</b>：{n} 条基因集，用时 {t} s': 'Fetched <b>{lib}</b>: {n} gene sets in {t} s',
    '（该库较大，未写入本地缓存）': ' (library too large; not cached locally)',
    '（已缓存到浏览器）': ' (cached in your browser)',
    '已获取 {n} 条基因集': 'Fetched {n} gene sets',
    '<span style="color:#d6483f">获取失败：{msg}</span><br>可改用 GMT 上传方式，或到 Enrichr 官网下载该库的 .gmt 文件。':
      '<span style="color:#d6483f">Fetch failed: {msg}</span><br>Use the GMT upload option instead, or download the .gmt file from the Enrichr website.',
    ['<span style="opacity:.8">库名说明：<code>GO_Biological_Process_2023</code> 生物学过程、' +
      '<code>KEGG_2021_Human</code> KEGG 通路、<code>Reactome_2022</code> Reactome、' +
      '<code>MSigDB_Hallmark_2020</code> Hallmark 基因集。</span>']:
      '<span style="opacity:.8">Library names: <code>GO_Biological_Process_2023</code> biological process, ' +
      '<code>KEGG_2021_Human</code> KEGG pathway, <code>Reactome_2022</code> Reactome, ' +
      '<code>MSigDB_Hallmark_2020</code> Hallmark gene sets.</span>',

    /* 结果与错误提示 */
    '内置示例基因集（16 条，仅供演示）': 'Built-in example gene sets (16, example only)',
    '本地 GMT': 'Local GMT',
    '（{n}）': ' ({n})',
    'Enrichr 在线库': 'Enrichr online library',
    '：{n}': ': {n}',
    '输入列表': 'Input list',
    '请求超时（{n} 秒）': 'Request timed out ({n} s)',
    '返回内容不是有效的 GMT': 'The response is not a valid GMT',
    '还没有可用的基因集。请选择「内置示例库」「上传 GMT」或「在线获取 Enrichr 库」。':
      'No gene sets available. Please choose “Built-in example sets”, “Upload GMT” or “Fetch Enrichr libraries online”.',
    '多列表模式未解析到数据，请用「列表名: 基因1, 基因2…」格式':
      'No data parsed in multi-list mode — use the format “listName: gene1, gene2…”.',
    '未解析到任何基因，请检查输入': 'No genes parsed — please check the input.',
    '输入基因与背景基因集没有任何交集，请检查基因命名（大小写/物种）与背景设置':
      'The input genes have no overlap with the background gene set — check the gene naming (case/species) and background settings.',

    /* 物种与基因符号归一 */
    '物种（同时决定可选基因集库与基因符号大小写）':
      'Species (determines both the available libraries and gene-symbol case)',
    '物种': 'Species',
    '人': 'Human',
    '小鼠': 'Mouse',
    '大鼠': 'Rat',
    '斑马鱼': 'Zebrafish',
    '果蝇': 'Fly',
    '线虫': 'Worm',
    '酵母': 'Yeast',
    '其他': 'Other',
    '人（Homo sapiens）': 'Human (Homo sapiens)',
    '小鼠（Mus musculus）': 'Mouse (Mus musculus)',
    '大鼠（Rattus norvegicus）': 'Rat (Rattus norvegicus)',
    '斑马鱼（Danio rerio）': 'Zebrafish (Danio rerio)',
    '果蝇（Drosophila melanogaster）': 'Fly (Drosophila melanogaster)',
    '线虫（Caenorhabditis elegans）': 'Worm (Caenorhabditis elegans)',
    '酵母（Saccharomyces cerevisiae）': 'Yeast (Saccharomyces cerevisiae)',
    '其他 / 不做大小写转换': 'Other / no case conversion',
    '仅显示该物种的基因集库': 'Show only libraries of this species',
    '匹配时已忽略大小写，并按所选物种规范符号大小写（如小鼠 Tp53）。基因集库只接受 <b>基因 Symbol</b>；若为 Ensembl / Entrez / 探针 ID，请先转换为 Symbol，否则会被判为未匹配。':
      'Case is ignored during matching, and symbols are normalised to the selected species (e.g. mouse Tp53). Gene-set libraries accept <b>gene symbols</b> only; Ensembl / Entrez / probe IDs must be converted to symbols first, otherwise they count as unmatched.',
    ['该物种匹配到 <b>{n}</b> 个注释库（共 {m} 个）。<b>数字指库的数量，与输入基因个数无关</b>；' +
      '输入的基因始终保留在顶部输入框，分析开始时会与所选库求交集。已自动选中推荐库，直接点「开始富集分析」即可。取消勾选可显示全部。']:
      '<b>{n}</b> libraries match this species (out of {m}). <b>The number refers to libraries, not to your input genes</b>; ' +
        'your genes stay in the input box at the top and are intersected with the selected library when the analysis starts. ' +
        'A recommended library has been selected automatically — simply click “Run enrichment analysis”. Clear the checkbox to show all.',
    '（该物种暂无常用库名，建议上传 GMT）': '(no common library name for this species; a GMT is recommended)',
    '该物种没有匹配到常用库，已显示全部 {n} 个库（可改选其它物种，或上传对应物种的 GMT）。':
      'No common library matches this species; showing all {n} libraries (change the species or upload a GMT for your organism).',
    ['注：Enrichr 的 <b>GO 系列全部是人源库</b>，没有小鼠 GO 库。小鼠可用 KEGG / WikiPathways / MGI 表型 / Mouse Gene Atlas 等；' +
      '若必须用小鼠 GO，请到 MGI 或 MSigDB 下载小鼠 GO 的 GMT，再用「上传 / 粘贴 GMT 文件」。']:
      'Note: Enrichr’s <b>GO libraries are human-only</b> — there is no mouse GO library. Mouse options are KEGG / WikiPathways / MGI phenotype / Mouse Gene Atlas; ' +
        'if mouse GO is required, download the mouse GO GMT from MGI or MSigDB and use “Upload / paste a GMT file”.',
    ['Enrichr 目前只提供<b>人源</b>与<b>小鼠</b>的注释库，{sp}暂无对应库；建议上传该物种的 GMT（如 GO / KEGG / MSigDB 官方 GMT），或改选人 / 小鼠做同源映射。']:
      'Enrichr currently provides annotation libraries for <b>human</b> and <b>mouse</b> only; there is none for {sp}. ' +
        'Upload a GMT for this organism (GO / KEGG / MSigDB official GMTs), or switch to human / mouse for an orthology-based analysis.',

    /* 运行前自动获取所选 Enrichr 库 */
    '正在获取基因集库 <b>{lib}</b>（首次需联网下载数秒至数十秒，之后复用本地缓存）…':
      'Fetching library <b>{lib}</b> (downloaded over the network for the first time, seconds to tens of seconds; cached locally afterwards)…',
    '尚未选择基因集库。请在下拉中选择一个注释库；若下拉为空，点「{btn}」重试，或改用「上传 / 粘贴 GMT 文件」。':
      'No library selected yet. Pick one from the dropdown; if the dropdown is empty, click “{btn}” to retry, or use “Upload / paste a GMT file” instead.',
    '无法获取 Enrichr 基因集库列表：{msg}':
      'Cannot fetch the Enrichr library list: {msg}',
    '请稍后重试，或改用「上传 / 粘贴 GMT 文件」方式。':
      'Please retry later, or use “Upload / paste a GMT file” instead.',
    '获取基因集库「{lib}」失败：{msg}。可换一个库，或改用「上传 / 粘贴 GMT 文件」方式。':
      'Failed to fetch library “{lib}”: {msg}. Try another library, or use “Upload / paste a GMT file” instead.',
    '已自动选中推荐库「{lib}」（若需更换请在上方下拉中选择）。':
      'Recommended library “{lib}” was selected automatically (change it from the dropdown above if needed).'
  });

  var ENRICHR_BASE = 'https://maayanlab.cloud/Enrichr/';
  var CACHE_PREFIX = 'wb_enrichr_gmt_';

  // 无法访问 Enrichr 时的兜底常用库名（人源；均为 Enrichr 上长期存在的库）
  var FALLBACK_LIBS = [
    'KEGG_2021_Human', 'GO_Biological_Process_2023', 'GO_Cellular_Component_2023',
    'GO_Molecular_Function_2023', 'Reactome_2022', 'MSigDB_Hallmark_2020',
    'WikiPathway_2023_Human', 'Human_Gene_Atlas'
  ];
  /* 其它物种在 Enrichr 上的常用库（仅列入确定存在的库名，缺失时建议上传 GMT） */
  var SPECIES_FALLBACK = {
    human: FALLBACK_LIBS,
    mouse: ['KEGG_2019_Mouse', 'WikiPathways_2024_Mouse', 'Mouse_Gene_Atlas'],
    rat: [], zebrafish: [], fly: [], worm: [], yeast: [], other: []
  };

  /* 各物种的默认推荐库（按 Enrichr 2026 官方清单核对；未列出的物种取候选列表首项）
   * 注：Enrichr 的 GO 系列库全部为人源，小鼠没有对应的 GO 库。 */
  var PREFERRED_LIBS = {
    human: ['GO_Biological_Process_2026', 'GO_Biological_Process_2025', 'GO_Biological_Process_2023',
      'KEGG_2021_Human', 'MSigDB_Hallmark_2020', 'Reactome_Pathways_2024', 'Reactome_2022',
      'WikiPathway_2023_Human', 'Human_Gene_Atlas'],
    mouse: ['KEGG_2019_Mouse', 'WikiPathways_2024_Mouse', 'MGI_Mammalian_Phenotype_Level_4_2024',
      'Mouse_Gene_Atlas', 'HDSigDB_Mouse_2021', 'KOMP2_Mouse_Phenotypes_2022'],
    rat: [], zebrafish: [], fly: [], worm: [], yeast: [], other: []
  };

  /**
   * 从候选库名中挑一个推荐库，使用户不必手动点「获取列表」也能直接运行。
   * 优先取该物种的推荐库，都不存在时退回候选列表首项。
   */
  function pickDefaultLibrary(names, species) {
    if (!names || !names.length) return '';
    var pref = PREFERRED_LIBS[species] || [];
    /* 该物种没有推荐库（如大鼠、斑马鱼：Enrichr 并无对应库）时不自动选中，
     * 避免把人/小鼠的库当成该物种的库静默套用 */
    if (!pref.length) return '';
    for (var i = 0; i < pref.length; i++) {
      if (names.indexOf(pref[i]) >= 0) return pref[i];
    }
    return names[0];
  }

  /** 在线模式在分析开始前是否需要先联网获取所选库（已拿到且仍是同一个库则不重复下载） */
  function needFetchOnline(state) {
    if (!state || state.mode !== 'online') return false;
    return !(state.libText && state.libKey && state.libKey === state.libName);
  }

  /* ------------------------------ 网络请求 ------------------------------- */

  function fetchWithTimeout(url, ms) {
    return new Promise(function (resolve, reject) {
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        reject(new Error(T('请求超时（{n} 秒）', { n: Math.round(ms / 1000) })));
      }, ms || 45000);
      fetch(url, { signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          clearTimeout(timer);
          if (!r.ok) return reject(new Error('HTTP ' + r.status));
          resolve(r.text());
        })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function loadLibraryList() {
    return fetchWithTimeout(ENRICHR_BASE + 'datasetStatistics', 30000).then(function (txt) {
      var j = JSON.parse(txt);
      var arr = (j.statistics || []).map(function (s) {
        return {
          name: s.libraryName,
          terms: Number(s.numTerms) || 0,
          genes: Number(s.geneCoverage) || 0,
          genesPerTerm: Number(s.genesPerTerm) || 0
        };
      }).filter(function (x) { return x.name; });
      arr.sort(function (a, b) { return a.name.localeCompare(b.name); });
      return arr;
    });
  }

  function gmtCacheKey(name) { return CACHE_PREFIX + name; }

  function fetchGMT(name) {
    var mem = WB._gmtMem = WB._gmtMem || {};
    if (mem[name]) return Promise.resolve(mem[name]);
    try {
      var cached = localStorage.getItem(gmtCacheKey(name));
      if (cached) { mem[name] = cached; return Promise.resolve(cached); }
    } catch (e) { /* localStorage 不可用 */ }
    return fetchWithTimeout(ENRICHR_BASE + 'geneSetLibrary?mode=text&libraryName=' + encodeURIComponent(name), 90000)
      .then(function (txt) {
        if (!txt || txt.indexOf('\t') < 0) throw new Error(T('返回内容不是有效的 GMT'));
        mem[name] = txt;
        if (txt.length < 3 * 1024 * 1024) {
          try { localStorage.setItem(gmtCacheKey(name), txt); } catch (e) { }
        }
        return txt;
      });
  }

  /* ------------------------- 物种与基因符号归一 -------------------------- */

  /* 物种：决定可选基因集库（Enrichr 库名带物种标记）与基因符号的规范大小写 */
  var SPECIES = [
    { key: 'human', zh: '人（Homo sapiens）', en: 'Human (Homo sapiens)', short: '人', style: 'upper' },
    { key: 'mouse', zh: '小鼠（Mus musculus）', en: 'Mouse (Mus musculus)', short: '小鼠', style: 'title' },
    { key: 'rat', zh: '大鼠（Rattus norvegicus）', en: 'Rat (Rattus norvegicus)', short: '大鼠', style: 'title' },
    { key: 'zebrafish', zh: '斑马鱼（Danio rerio）', en: 'Zebrafish (Danio rerio)', short: '斑马鱼', style: 'lower' },
    { key: 'fly', zh: '果蝇（Drosophila melanogaster）', en: 'Fly (Drosophila melanogaster)', short: '果蝇', style: 'lower' },
    { key: 'worm', zh: '线虫（Caenorhabditis elegans）', en: 'Worm (Caenorhabditis elegans)', short: '线虫', style: 'lower' },
    { key: 'yeast', zh: '酵母（Saccharomyces cerevisiae）', en: 'Yeast (Saccharomyces cerevisiae)', short: '酵母', style: 'upper' },
    { key: 'other', zh: '其他 / 不做大小写转换', en: 'Other / no case conversion', short: '其他', style: 'asis' }
  ];
  var SPECIES_STYLE = {};
  SPECIES.forEach(function (s) { SPECIES_STYLE[s.key] = s.style; });

  /** 物种短名（用于统计条与提示） */
  function speciesShort(sp) {
    for (var i = 0; i < SPECIES.length; i++) if (SPECIES[i].key === sp) return T(SPECIES[i].short);
    return String(sp || '');
  }

  /* Enrichr 库名中的物种标记（词边界匹配，避免 RAT 命中 GENERATE 之类） */
  var SPECIES_LIB_TAGS = {
    mouse: ['MOUSE', 'MURINE', 'MGI'],
    rat: ['RAT'],
    zebrafish: ['ZEBRAFISH', 'DANIO'],
    fly: ['FLY', 'DROSOPHILA'],
    worm: ['WORM', 'ELEGANS', 'CAENORHABDITIS', 'NEMATODE'],
    yeast: ['YEAST', 'SACCHAROMYCES']
  };

  /**
   * 把库名切成词元：先按非字母数字切开，再把驼峰连写切开
   * （PerturbAtlas_MouseGenePerturbationSigs → Perturb / Atlas / Mouse / Gene / …）。
   * 这样既能识别驼峰里的 Mouse，又不会把 Substrates / Curated 里的 rat 误判成物种标记。
   */
  function libTokens(name) {
    return String(name || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/[^A-Za-z0-9]+/)
      .filter(function (t) { return !!t; });
  }

  /** 库名中是否含有该物种标记（整词/驼峰词元匹配，忽略大小写） */
  function hasTag(name, tag) {
    var up = String(tag || '').toUpperCase();
    return libTokens(name).some(function (t) { return t.toUpperCase() === up; });
  }

  /** 该库是否属于指定物种（Enrichr 无物种标记的库按人源处理） */
  function libMatchesSpecies(name, sp) {
    if (sp === 'other') return true;
    if (sp === 'human') {
      var others = [];
      Object.keys(SPECIES_LIB_TAGS).forEach(function (s) { others = others.concat(SPECIES_LIB_TAGS[s]); });
      return !others.some(function (t) { return hasTag(name, t); });
    }
    var tags = SPECIES_LIB_TAGS[sp] || [];
    return tags.some(function (t) { return hasTag(name, t); });
  }

  /** 匹配键：去首尾空白与引号、统一大写 —— 大小写不敏感的匹配 */
  function foldKey(g) {
    return String(g === null || g === undefined ? '' : g).trim().replace(/^[\s"']+|[\s"']+$/g, '').toUpperCase();
  }

  /** 按物种规范基因符号的显示大小写（人 TP53 / 小鼠 Tp53 / 斑马鱼 tp53） */
  function styleSymbol(g, species) {
    var s = String(g === null || g === undefined ? '' : g).trim().replace(/^[\s"']+|[\s"']+$/g, '');
    if (!s) return '';
    switch (SPECIES_STYLE[species] || 'asis') {
      case 'upper': return s.toUpperCase();
      case 'lower': return s.toLowerCase();
      case 'title': return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
      default: return s;
    }
  }

  /* ------------------------------ 富集计算 ------------------------------- */

  /**
   * @param {string[]} inputGenes  输入基因
   * @param {Array} geneSets       [{term, description, genes:[]}]
   * @param {object} opt           {minSize,maxSize,minOverlap,padjust,background:[]|null,species}
   */
  function oraRun(inputGenes, geneSets, opt) {
    opt = opt || {};
    var minSize = opt.minSize === undefined ? 5 : opt.minSize;
    var maxSize = opt.maxSize === undefined ? 500 : opt.maxSize;
    var minOverlap = opt.minOverlap === undefined ? 1 : opt.minOverlap;
    var species = opt.species || 'human';

    /* 背景基因集：以折叠键索引（大小写无关），值保存按物种规范后的显示符号 */
    var universe = {};
    function addUniverse(g) {
      var k = foldKey(g);
      if (k && universe[k] === undefined) universe[k] = styleSymbol(g, species);
    }
    if (opt.background && opt.background.length) opt.background.forEach(addUniverse);
    else geneSets.forEach(function (gs) { gs.genes.forEach(addUniverse); });
    var N = Object.keys(universe).length;

    /* 输入基因：同样折叠后匹配，未命中背景的记入 unmapped */
    var mapped = {}, unmapped = [];
    Array.from(new Set(inputGenes)).forEach(function (g) {
      var k = foldKey(g);
      if (!k) return;
      if (universe[k] !== undefined) mapped[k] = styleSymbol(g, species);
      else unmapped.push(g);
    });
    var n = Object.keys(mapped).length;

    var rows = [], tested = 0, skippedSize = 0;
    geneSets.forEach(function (gs) {
      var seen = {}, inU = [];
      gs.genes.forEach(function (g) {
        var k = foldKey(g);
        if (!k || seen[k] || universe[k] === undefined) return;
        seen[k] = 1; inU.push(k);
      });
      var K = inU.length;
      if (K < minSize || K > maxSize || K > N) { skippedSize++; return; }
      var overlap = inU.filter(function (k) { return mapped[k] !== undefined; });
      var k = overlap.length;
      if (k < Math.max(1, minOverlap)) return;
      tested++;
      var t = WB.stats.hypergeomTest(k, K, N - K, n, 'greater');
      var expected = N > 0 ? n * K / N : 0;
      rows.push({
        term: gs.term,
        description: gs.description || '',
        setSize: K,
        overlap: k,
        overlapGenes: overlap.map(function (key) { return mapped[key] || universe[key]; }),
        expected: expected,
        foldEnrichment: (K > 0 && n > 0) ? (k / n) / (K / N) : NaN,
        richFactor: K > 0 ? k / K : NaN,
        geneRatio: n > 0 ? k / n : NaN,
        p: t.p,
        oddsRatio: t.oddsRatio
      });
    });

    if (!rows.length) {
      return {
        rows: [], stats: { N: N, n: n, unmapped: unmapped, tested: 0, skippedSize: skippedSize, sig: 0, minP: NaN }
      };
    }
    var pv = rows.map(function (r) { return r.p; });
    var adj = WB.stats.pAdjust(pv, opt.padjust || 'BH');
    rows.forEach(function (r, i) { r.padj = adj[i]; r.negLogP = -Math.log10(Math.max(r.padj, 1e-300)); });
    rows.sort(function (a, b) { return a.p - b.p || b.overlap - a.overlap; });

    var sig = rows.filter(function (r) { return r.padj <= (opt.pCut === undefined ? 0.05 : opt.pCut); }).length;
    return {
      rows: rows,
      stats: {
        N: N, n: n, unmapped: unmapped, tested: tested, skippedSize: skippedSize,
        sig: sig, minP: rows.length ? rows[0].p : NaN
      }
    };
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function termLabels(rows, maxUnits, maxLines) {
    return rows.map(function (r) {
      var t = r.description && r.description.length && r.description !== r.term
        ? r.term : r.term;
      return WB.plot.wrapText(t.replace(/_/g, ' '), maxUnits, maxLines || 2);
    });
  }

  function drawDotPlot(container, rows, opt) {
    var n = rows.length;
    if (!n) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var metric = opt.metric || 'fold';
    var metricLabel = { fold: T('enr.metricFold'), ratio: T('enr.metricRatio'), rich: T('enr.metricRich') }[metric];
    var valueOf = function (r) {
      return metric === 'ratio' ? r.geneRatio : (metric === 'rich' ? r.richFactor : r.foldEnrichment);
    };
    var vals = rows.map(valueOf).filter(function (v) { return isFinite(v); });
    var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    if (!isFinite(vmin)) { vmin = 0; vmax = 1; }
    if (vmin === vmax) { vmax = vmin + 1; }
    var pad = (vmax - vmin) * 0.06;
    vmin = Math.max(0, vmin - pad); vmax = vmax + pad;

    var labelW = opt.labelW || 268;
    var labelChars = Math.max(18, Math.floor((labelW - 18) / 6.6));
    var labels = termLabels(rows, labelChars, 2);
    var rowH = opt.rowH || 27;
    var lineH = 13;
    var maxLines = 1;
    labels.forEach(function (l) { maxLines = Math.max(maxLines, l.length); });
    if (maxLines > 1) rowH = Math.max(rowH, 12 + maxLines * lineH);
    var headerH = 14, footerH = 74;
    var width = opt.width || 720;
    var plotW = width - labelW - 204;   // 右侧预留图例区
    var height = headerH + n * rowH + footerH + 20;

    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var sc = WB.plot.linearScale(vmin, vmax, 0, plotW);
    var X = function (v) { return labelW + sc(v); };

    // 网格
    sc.ticks(6).forEach(function (t) {
      if (t < vmin || t > vmax) return;
      root.appendChild(S('line', {
        x1: X(t), y1: headerH - 4, x2: X(t), y2: headerH + n * rowH,
        stroke: '#eef3f7', 'shape-rendering': 'crispEdges'
      }));
    });
    // 行分隔
    for (var i = 0; i <= n; i++) {
      root.appendChild(S('line', {
        x1: labelW, y1: headerH + i * rowH, x2: labelW + plotW, y2: headerH + i * rowH,
        stroke: i === n ? '#c9d5df' : '#f5f9fc', 'shape-rendering': 'crispEdges'
      }));
    }

    var kMax = Math.max.apply(null, rows.map(function (d) { return d.overlap; }));
    var rMax = opt.rmax || 9.5, rMin = 3;
    var negMax = Math.max(1.5, Math.max.apply(null, rows.map(function (d) { return d.negLogP; })));
    var colF = WB.plot.ramp('orrd');
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;

    // Y 轴标签 + 点
    rows.forEach(function (r, i) {
      var cy = headerH + i * rowH + rowH / 2;
      var lines = labels[i];
      var startY = cy - (lines.length - 1) * lineH / 2 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * lineH, ln, {
          'text-anchor': 'end', 'font-size': 11.5,
          fill: r.padj <= pCut ? WB.plot.TEXT : '#8fa0ae'
        }));
      });
      var v = valueOf(r);
      var cx = X(isFinite(v) ? v : vmin);
      var rad = rMin + (rMax - rMin) * Math.sqrt(r.overlap / Math.max(1, kMax));
      var dot = S('circle', {
        cx: cx, cy: cy, r: rad,
        fill: colF(Math.min(1, r.negLogP / negMax)),
        stroke: '#ffffff', 'stroke-width': 1
      });
      root.appendChild(dot);
      WB.plot.bindTip(dot, function () {
        return '<b>' + r.term + '</b>' +
          (r.description && r.description !== r.term ? '<br><span style="opacity:.8">' + r.description + '</span>' : '') +
          '<br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
          '<br>' + T('enr.tipFold', { f: WB.formatNum(r.foldEnrichment, 2), r: WB.formatNum(r.richFactor, 3) }) +
          '<div style="margin-top:4px;max-width:300px;white-space:normal">' + r.overlapGenes.slice(0, 14).join(', ') +
          (r.overlapGenes.length > 14 ? ' …' : '') + '</div>';
      });
    });

    // X 轴
    var axisG = WB.plot.axisBottom(sc, plotW, { ticks: 6, format: function (v) { return WB.formatNum(v, 2); } });
    axisG.setAttribute('transform', 'translate(' + labelW + ',' + (headerH + n * rowH) + ')');
    root.appendChild(axisG);
    root.appendChild(WB.plot.txt(labelW + plotW / 2, headerH + n * rowH + 44, metricLabel, {
      'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT
    }));

    // 图例：颜色条
    var lx = width - 158, ly = headerH + 4;
    var nSeg = 40;
    for (var s2 = 0; s2 < nSeg; s2++) {
      root.appendChild(S('rect', {
        x: lx, y: ly + s2 * 5, width: 12, height: 5.2,
        fill: colF(1 - s2 / (nSeg - 1))
      }));
    }
    root.appendChild(WB.plot.txt(lx + 17, ly + 5, WB.formatNum(negMax, 1), { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5, '0', { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5 / 2 + 3, T('common.negLogFdr'), { 'font-size': 10, fill: WB.plot.TEXT }));
    // 0 刻度
    if (vmin <= 0 && vmax >= 0) {
      root.appendChild(S('line', {
        x1: X(0), y1: headerH - 4, x2: X(0), y2: headerH + n * rowH,
        stroke: '#dde6ed', 'shape-rendering': 'crispEdges'
      }));
    }

    // 点尺寸图例
    var sizes = [Math.max(1, Math.round(kMax * 0.25)), Math.max(2, Math.round(kMax * 0.6)), kMax];
    sizes = Array.from(new Set(sizes));
    var sizeTop = ly + nSeg * 5 + 24;
    sizes.forEach(function (sv, si) {
      var rad2 = rMin + (rMax - rMin) * Math.sqrt(sv / Math.max(1, kMax));
      var cy2 = sizeTop + 22 + si * 20;
      root.appendChild(S('circle', { cx: lx + 8, cy: cy2, r: rad2, fill: '#c8d3dd', stroke: '#fff', 'stroke-width': 1 }));
      root.appendChild(WB.plot.txt(lx + 24, cy2 + 3.5, T('common.geneUnit', { n: sv }), { 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    root.appendChild(WB.plot.txt(lx - 2, sizeTop + 4, T('enr.overlapGenes'), { 'font-size': 10.5, fill: WB.plot.TEXT }));

    container.appendChild(el('div.preview-note', {
      text: T('enr.dotNote')
    }));
    return canvas.svg;
  }

  function drawBarPlot(container, rows, opt) {
    var n = rows.length;
    if (!n) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var labelW = 268;
    var labelChars = Math.max(18, Math.floor((labelW - 18) / 6.6));
    var labels = termLabels(rows, labelChars, 2);
    var rowH = 24, lineH = 13;
    var width = opt.width || 720, plotW = width - labelW - 120;
    var height = 14 + n * rowH + 68;
    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var vals = rows.map(function (r) { return Math.min(50, r.negLogP); });
    var vmax = Math.max.apply(null, vals);
    var sc = WB.plot.linearScale(0, vmax * 1.02, 0, plotW);
    var X = function (v) { return labelW + sc(v); };
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;
    var colF = WB.plot.ramp('orrd');
    var negMax = Math.max.apply(null, rows.map(function (d) { return d.negLogP; })) || 1;

    rows.forEach(function (r, i) {
      var y = 14 + i * rowH, cy = y + rowH / 2;
      var lines = labels[i];
      var startY = cy - (lines.length - 1) * lineH / 2 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * lineH, ln, {
          'text-anchor': 'end', 'font-size': 11.5,
          fill: r.padj <= pCut ? WB.plot.TEXT : '#8fa0ae'
        }));
      });
      var bw = Math.max(1, X(Math.min(50, r.negLogP)) - labelW);
      var rect = S('rect', {
        x: labelW, y: y + 3, width: bw, height: rowH - 7, rx: 3,
        fill: colF(Math.min(1, r.negLogP / negMax))
      });
      root.appendChild(rect);
      WB.plot.bindTip(rect, function () {
        return '<b>' + r.term + '</b><br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) });
      });
      root.appendChild(WB.plot.txt(labelW + bw + 6, cy + 3.5, T('common.geneUnit', { n: r.overlap }), { 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    // 阈值线
    var xt = X(Math.min(50, -Math.log10(pCut)));
    root.appendChild(S('line', {
      x1: xt, y1: 6, x2: xt, y2: 14 + n * rowH, stroke: '#d6483f',
      'stroke-dasharray': '4 3', 'stroke-width': 1.2
    }));
    root.appendChild(WB.plot.txt(xt + 4, 12, T('enr.fdrThreshold', { v: pCut }), { 'font-size': 10, fill: '#d6483f' }));

    var axisG = WB.plot.axisBottom(sc, plotW, { ticks: 6, format: function (v) { return WB.formatNum(v, 1); } });
    axisG.setAttribute('transform', 'translate(' + labelW + ',' + (14 + n * rowH) + ')');
    root.appendChild(axisG);
    root.appendChild(WB.plot.txt(labelW + plotW / 2, 14 + n * rowH + 44, T('enr.negLogFdrCapped'), {
      'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT
    }));
    return canvas.svg;
  }

  /** 多基因列表对比点图：x = 列表, y = 通路 */
  /* ---------------- 棒棒糖图：富集倍数 + 交集基因数 + FDR 颜色 ---------------- */

  function drawLollipop(container, rows, opt) {
    var n = rows.length;
    if (!n) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var metric = opt.metric || 'fold';
    var metricLabel = { fold: T('enr.metricFold'), ratio: T('enr.metricRatio'), rich: T('enr.metricRich') }[metric];
    var valueOf = function (r) {
      return metric === 'ratio' ? r.geneRatio : (metric === 'rich' ? r.richFactor : r.foldEnrichment);
    };
    var vals = rows.map(valueOf).filter(isFinite);
    var vmax = Math.max.apply(null, vals);
    if (!isFinite(vmax) || vmax <= 0) vmax = 1;
    vmax = vmax * 1.08;

    var labelW = opt.labelW || 268;
    var labelChars = Math.max(18, Math.floor((labelW - 18) / 6.6));
    var labels = termLabels(rows, labelChars, 2);
    var rowH = opt.rowH || 27, lineH = 13, maxLines = 1;
    labels.forEach(function (l) { maxLines = Math.max(maxLines, l.length); });
    if (maxLines > 1) rowH = Math.max(rowH, 12 + maxLines * lineH);
    var headerH = 14, footerH = 96;
    var width = opt.width || 720;
    var plotW = width - labelW - 204;
    var height = headerH + n * rowH + footerH + 20;

    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var sc = WB.plot.linearScale(0, vmax, 0, plotW);
    var X = function (v) { return labelW + sc(v); };

    sc.ticks(6).forEach(function (t) {
      if (t <= 0 || t > vmax) return;
      root.appendChild(S('line', { x1: X(t), y1: headerH - 4, x2: X(t), y2: headerH + n * rowH, stroke: '#eef3f7', 'shape-rendering': 'crispEdges' }));
    });
    for (var i = 0; i <= n; i++) {
      root.appendChild(S('line', {
        x1: labelW, y1: headerH + i * rowH, x2: labelW + plotW, y2: headerH + i * rowH,
        stroke: i === n ? '#c9d5df' : '#f5f9fc', 'shape-rendering': 'crispEdges'
      }));
    }

    var kMax = Math.max.apply(null, rows.map(function (d) { return d.overlap; }));
    var rMax = 9.5, rMin = 3;
    var negMax = Math.max(1.5, Math.max.apply(null, rows.map(function (d) { return d.negLogP; })));
    var colF = WB.plot.ramp('orrd');
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;

    rows.forEach(function (r, i) {
      var cy = headerH + i * rowH + rowH / 2;
      var lines = labels[i];
      var startY = cy - (lines.length - 1) * lineH / 2 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * lineH, ln, {
          'text-anchor': 'end', 'font-size': 11.5,
          fill: r.padj <= pCut ? WB.plot.TEXT : '#8fa0ae'
        }));
      });
      var v = valueOf(r), cx = X(isFinite(v) ? v : 0);
      var rad = rMin + (rMax - rMin) * Math.sqrt(r.overlap / Math.max(1, kMax));
      root.appendChild(S('line', {
        x1: X(0), y1: cy, x2: cx, y2: cy,
        stroke: colF(Math.min(1, r.negLogP / negMax)), 'stroke-width': 2.2, 'stroke-opacity': 0.75, 'stroke-linecap': 'round'
      }));
      var dot = S('circle', {
        cx: cx, cy: cy, r: rad,
        fill: colF(Math.min(1, r.negLogP / negMax)), stroke: '#ffffff', 'stroke-width': 1
      });
      root.appendChild(dot);
      root.appendChild(WB.plot.txt(cx, cy - rad - 4, WB.formatNum(v, 2), {
        'text-anchor': 'middle', 'font-size': 9.8, fill: WB.plot.MUTED
      }));
      WB.plot.bindTip(dot, function () {
        return '<b>' + r.term + '</b>' +
          '<br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
          '<br>' + T('enr.tipFold', { f: WB.formatNum(r.foldEnrichment, 2), r: WB.formatNum(r.richFactor, 3) }) +
          '<div style="margin-top:4px;max-width:300px;white-space:normal">' + r.overlapGenes.slice(0, 14).join(', ') + (r.overlapGenes.length > 14 ? ' …' : '') + '</div>';
      });
    });

    var axisG = WB.plot.axisBottom(sc, plotW, { ticks: 6, format: function (v) { return WB.formatNum(v, 2); } });
    axisG.setAttribute('transform', 'translate(' + labelW + ',' + (headerH + n * rowH) + ')');
    root.appendChild(axisG);
    root.appendChild(WB.plot.txt(labelW + plotW / 2, headerH + n * rowH + 44, metricLabel, {
      'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT
    }));

    /* 图内图例：颜色条（−log₁₀ FDR）与点尺寸（交集基因数） */
    var lx = width - 158, ly = headerH + 4;
    var nSeg = 40;
    for (var s2 = 0; s2 < nSeg; s2++) {
      root.appendChild(S('rect', { x: lx, y: ly + s2 * 5, width: 12, height: 5.2, fill: colF(1 - s2 / (nSeg - 1)) }));
    }
    root.appendChild(WB.plot.txt(lx + 17, ly + 5, WB.formatNum(negMax, 1), { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5, '0', { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5 / 2 + 3, T('common.negLogFdr'), { 'font-size': 10, fill: WB.plot.TEXT }));
    var sizeTop = ly + nSeg * 5 + 24;
    [Math.max(1, Math.round(kMax * 0.25)), Math.max(2, Math.round(kMax * 0.6)), kMax]
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
      .forEach(function (sv, si) {
        var rad2 = rMin + (rMax - rMin) * Math.sqrt(sv / Math.max(1, kMax));
        var cy2 = sizeTop + 22 + si * 20;
        root.appendChild(S('circle', { cx: lx + 8, cy: cy2, r: rad2, fill: '#c8d3dd', stroke: '#fff', 'stroke-width': 1 }));
        root.appendChild(WB.plot.txt(lx + 24, cy2 + 3.5, T('common.geneUnit', { n: sv }), { 'font-size': 10.5, fill: WB.plot.MUTED }));
      });
    root.appendChild(WB.plot.txt(lx - 2, sizeTop + 4, T('enr.overlapGenes'), { 'font-size': 10.5, fill: WB.plot.TEXT }));

    container.appendChild(el('div.preview-note', {
      text: T('棒棒糖图：横轴为富集倍数，棒长即富集倍数，圆点大小 = 交集基因数，颜色 = −log₁₀ FDR；与气泡图信息一致，但更容易读出具体数值。')
    }));
    return canvas.svg;
  }

  /* ---------------- 基因-通路网络（二部图）：通路 ↔ 交集基因 ---------------- */

  function drawCnetPlot(container, rows, opt) {
    rows = rows.filter(function (r) { return r.overlapGenes && r.overlapGenes.length; });
    if (!rows.length) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var maxGenes = opt.maxGenes || 46;
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;

    /* 基因按出现次数（连接的通路数）排序，超出时保留高频者 */
    var geneCount = {};
    rows.forEach(function (r) {
      r.overlapGenes.forEach(function (g) { geneCount[g] = (geneCount[g] || 0) + 1; });
    });
    var genes = Object.keys(geneCount).sort(function (a, b) {
      return geneCount[b] - geneCount[a] || a.localeCompare(b);
    }).slice(0, maxGenes);
    var geneSet = {};
    genes.forEach(function (g) { geneSet[g] = 1; });

    var negMax = Math.max(1.5, Math.max.apply(null, rows.map(function (d) { return d.negLogP; })));
    var colF = WB.plot.ramp('orrd');
    var fs = 11, rowH = 22;
    var leftW = 250, rightW = 130, width = opt.width || 860;
    var nRow = Math.max(rows.length, genes.length);
    var height = Math.max(260, 46 + nRow * rowH + 30);

    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var termX = 236, geneX = width - rightW - 24;
    var yTerm = function (i) { return 40 + i * rowH + rowH / 2; };
    var yGene = function (i) { return 40 + i * rowH + rowH / 2; };

    /* 连线（贝塞尔），先画线后画节点 */
    rows.forEach(function (r, ti) {
      r.overlapGenes.forEach(function (g) {
        if (!geneSet[g]) return;
        var gi = genes.indexOf(g);
        var y1 = yTerm(ti), y2 = yGene(gi);
        var midX = (termX + geneX) / 2;
        root.appendChild(S('path', {
          d: 'M' + termX + ' ' + y1 + ' C' + midX + ' ' + y1 + ' ' + midX + ' ' + y2 + ' ' + geneX + ' ' + y2,
          fill: 'none', stroke: colF(Math.min(1, r.negLogP / negMax)),
          'stroke-width': 1 + Math.min(3.2, r.overlap * 0.45), 'stroke-opacity': 0.42
        }));
      });
    });

    /* 通路节点：色块 + 文本 */
    rows.forEach(function (r, ti) {
      var y = yTerm(ti);
      var fill = colF(Math.min(1, r.negLogP / negMax));
      root.appendChild(S('circle', {
        cx: termX, cy: y, r: 6.5 + Math.min(7, r.overlap * 0.8),
        fill: fill, stroke: '#ffffff', 'stroke-width': 1
      }));
      var name = r.term.replace(/_/g, ' ');
      var txt = WB.plot.ellipsis(name, 34);
      root.appendChild(WB.plot.txt(termX - 14, y + 4, txt, {
        'text-anchor': 'end', 'font-size': fs, 'font-weight': 600,
        fill: r.padj <= pCut ? WB.plot.TEXT : '#8fa0ae'
      }));
      WB.plot.bindTip(root.childNodes[root.childNodes.length - 1], function () {
        return '<b>' + r.term + '</b>' +
          '<br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
          '<br>' + r.overlapGenes.join(', ');
      });
    });

    /* 基因节点 */
    genes.forEach(function (g, gi) {
      var y = yGene(gi);
      var c = S('circle', { cx: geneX, cy: y, r: 3.2 + Math.min(3.6, geneCount[g] * 0.9), fill: '#4a6076', stroke: '#ffffff', 'stroke-width': 0.8 });
      root.appendChild(c);
      root.appendChild(WB.plot.txt(geneX + 10, y + 3.8, g, { 'font-size': 10.5, fill: WB.plot.TEXT }));
      WB.plot.bindTip(c, function () {
        return '<b>' + g + '</b><br>' + T('common.intersection') + ' ' + geneCount[g] + ' 条通路';
      });
    });

    /* 列标题 */
    root.appendChild(WB.plot.txt(termX - 14, 24, T('通路 / 基因集'), { 'text-anchor': 'end', 'font-size': 12, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(geneX + 10, 24, T('基因'), { 'font-size': 12, fill: WB.plot.MUTED }));

    container.appendChild(el('div.preview-note', {
      text: T('基因-通路网络：左侧为通路（颜色 = −log₁₀ FDR），右侧为基因节点；连线表示该基因在该通路的交集中。' +
        '一个基因连接多条通路时即为「共享基因」，往往是网络中的枢纽信号。') +
        (Object.keys(geneCount).length > genes.length
          ? ' ' + T('（基因过多，仅显示连接通路数最多的前 {n} 个）', { n: genes.length }) : '')
    }));
    return canvas.svg;
  }

  /* ---------------- 富集网络图（enrichment map）：通路重叠网络 ---------------- */

  function drawEnrichMap(container, rows, opt) {
    rows = rows.slice(0, opt.maxTerms || 20);
    if (rows.length < 2) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var minShare = opt.minShare === undefined ? 2 : opt.minShare;

    /* 共享基因矩阵 */
    var n = rows.length, i, j;
    var shares = [];
    for (i = 0; i < n; i++) shares.push(new Array(n).fill(0));
    var maxShare = 0;
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        var s = 0;
        rows[i].overlapGenes.forEach(function (g) { if (rows[j].overlapGenes.indexOf(g) >= 0) s++; });
        shares[i][j] = shares[j][i] = s;
        if (s > maxShare) maxShare = s;
      }
    }

    var W = opt.width || 820, H = 560;
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var svg = canvas.svg;   // 交互事件（拖拽/双击）绑在 svg 根元素上
    var kMax = Math.max.apply(null, rows.map(function (d) { return d.overlap; }));
    var negMax = Math.max(1.5, Math.max.apply(null, rows.map(function (d) { return d.negLogP; })));
    var colF = WB.plot.ramp('orrd');

    /* 确定性力导向布局（圆周初始化 + 斥力/引力/向心，LCG 无随机） */
    var seed = 20261022;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    var pos = rows.map(function (r, i2) {
      var a = 2 * Math.PI * i2 / n - Math.PI / 2;
      return { x: W / 2 + Math.cos(a) * W * 0.32, y: H / 2 + Math.sin(a) * H * 0.32 };
    });
    var k2 = Math.sqrt((W * H) / n) * 0.6;
    var iters = 420;
    for (var it = 0; it < iters; it++) {
      var temp = Math.max(0.5, 12 * (1 - it / iters));
      for (i = 0; i < n; i++) {
        var fx = 0, fy = 0;
        for (j = 0; j < n; j++) {
          if (i === j) continue;
          var dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1e-3;
          fx += dx / d * (k2 * k2 / d); fy += dy / d * (k2 * k2 / d);
        }
        for (j = 0; j < n; j++) {
          if (j === i || shares[i][j] < minShare) continue;
          var ddx = pos[i].x - pos[j].x, ddy = pos[i].y - pos[j].y;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1e-3;
          var att = dd * dd / k2 * (shares[i][j] / maxShare);
          fx -= ddx / dd * att; fy -= ddy / dd * att;
        }
        fx += (W / 2 - pos[i].x) * 0.02; fy += (H / 2 - pos[i].y) * 0.02;
        var fl = Math.sqrt(fx * fx + fy * fy) || 1;
        pos[i].x += fx / fl * Math.min(fl, temp);
        pos[i].y += fy / fl * Math.min(fl, temp);
      }
    }
    /* 碰撞松弛：推开重叠的节点圆，避免密集簇互相压盖 */
    for (var relax = 0; relax < 120; relax++) {
      var moved = false;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var ra = 8 + 16 * Math.sqrt(rows[i].overlap / Math.max(1, kMax));
          var rb = 8 + 16 * Math.sqrt(rows[j].overlap / Math.max(1, kMax));
          var minD = (ra + rb) * 1.12 + 3;
          var ddx2 = pos[j].x - pos[i].x, ddy2 = pos[j].y - pos[i].y;
          var dd2 = Math.sqrt(ddx2 * ddx2 + ddy2 * ddy2) || 1e-3;
          if (dd2 < minD) {
            var push2 = (minD - dd2) / 2, ux2 = ddx2 / dd2, uy2 = ddy2 / dd2;
            pos[i].x -= ux2 * push2; pos[i].y -= uy2 * push2;
            pos[j].x += ux2 * push2; pos[j].y += uy2 * push2;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    /* 贴合画布 */
    var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    pos.forEach(function (p) {
      bx0 = Math.min(bx0, p.x); bx1 = Math.max(bx1, p.x);
      by0 = Math.min(by0, p.y); by1 = Math.max(by1, p.y);
    });
    var gw = Math.max(1, bx1 - bx0), gh = Math.max(1, by1 - by0);
    var pad = 86;
    var scx = (W - pad * 2) / gw, scy = (H - pad * 2) / gh;
    var scl = Math.min(scx, scy);
    var ox = (W - gw * scl) / 2 - bx0 * scl, oy = (H - gh * scl) / 2 - by0 * scl;

    function radOf(r) { return 8 + 16 * Math.sqrt(r.overlap / Math.max(1, kMax)); }

    /* 当前坐标（屏幕系，可拖拽）与初始布局（双击恢复） */
    var cur = pos.map(function (p) { return { x: p.x * scl + ox, y: p.y * scl + oy }; });
    var base = cur.map(function (p) { return { x: p.x, y: p.y }; });

    /* 连线（保存引用以便拖拽时同步端点） */
    var edges = [];
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        if (shares[i][j] < minShare) continue;
        var jac = shares[i][j] /
          (rows[i].overlapGenes.length + rows[j].overlapGenes.length - shares[i][j]);
        var le = S('line', {
          x1: cur[i].x, y1: cur[i].y, x2: cur[j].x, y2: cur[j].y,
          stroke: '#8fa8bd', 'stroke-width': 0.8 + jac * 7, 'stroke-opacity': 0.45, 'stroke-linecap': 'round'
        });
        root.appendChild(le);
        edges.push({ el: le, i: i, j: j });
      }
    }

    /* 节点层与标签层（标签在节点之上，拖拽/重置时整体重排） */
    var nodeG = WB.plot.g({});
    root.appendChild(nodeG);
    var labelG = WB.plot.g({});
    root.appendChild(labelG);

    var nodes = [];
    rows.forEach(function (r, i2) {
      var rad = radOf(r);
      var c = S('circle', {
        cx: cur[i2].x, cy: cur[i2].y, r: rad,
        fill: colF(Math.min(1, r.negLogP / negMax)), stroke: '#ffffff', 'stroke-width': 1.4,
        'fill-opacity': 0.92, 'data-role': 'node'
      });
      nodeG.appendChild(c);
      WB.plot.bindTip(c, function () {
        return '<b>' + r.term + '</b>' +
          '<br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
          '<br>' + r.overlapGenes.slice(0, 12).join(', ') + (r.overlapGenes.length > 12 ? ' …' : '');
      });
      c.style.cursor = 'grab';
      nodes.push({ el: c, i: i2, rad: rad });
    });

    /* ---------- 标签（四方位贪心避让；可在拖拽后整体重排） ---------- */
    function textW(s2, fsz) {
      var w = 0;
      for (var q = 0; q < s2.length; q++) w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(s2[q]) ? fsz : fsz * 0.56;
      return w;
    }
    var labels = rows.map(function () { return null; });   // {el, dx, dy}
    function placeLabels() {
      labels.forEach(function (L) { if (L && L.el.parentNode) L.el.parentNode.removeChild(L.el); });
      labels = rows.map(function () { return null; });
      var placed2 = [];
      function hitsAny(x0, y0, x1, y1) {
        for (var q = 0; q < placed2.length; q++) {
          var p2 = placed2[q];
          if (x0 < p2.x1 && x1 > p2.x0 && y0 < p2.y1 && y1 > p2.y0) return true;
        }
        return false;
      }
      var fsz = 10.5;
      rows.forEach(function (r, i2) {
        var p = cur[i2], rad = radOf(r);
        var raw = r.term.replace(/_/g, ' ');
        var cand = [WB.plot.ellipsis(raw, 24), WB.plot.ellipsis(raw, 14)];
        for (var ci = 0; ci < cand.length; ci++) {
          var w = textW(cand[ci], fsz), h = fsz * 1.2;
          var spots = [
            { ax: 'middle', dx: 0, dy: rad + 13 },
            { ax: 'middle', dx: 0, dy: -(rad + 6) },
            { ax: 'start', dx: rad + 6, dy: 4 },
            { ax: 'end', dx: -(rad + 6), dy: 4 }
          ];
          for (var si2 = 0; si2 < spots.length; si2++) {
            var sp = spots[si2];
            var x = p.x + sp.dx, y = p.y + sp.dy;
            var x0 = sp.ax === 'middle' ? x - w / 2 : (sp.ax === 'start' ? x : x - w);
            var x1 = x0 + w, y0 = y - h * 0.85, y1 = y + h * 0.25;
            if (x0 < 4 || x1 > W - 4 || y0 < 4 || y1 > H - 4) continue;
            if (hitsAny(x0 - 1, y0 - 1, x1 + 1, y1 + 1)) continue;
            var t = WB.plot.txt(x, y, cand[ci], { 'text-anchor': sp.ax, 'font-size': fsz, fill: WB.plot.TEXT });
            t.setAttribute('paint-order', 'stroke');
            t.setAttribute('stroke', '#ffffff');
            t.setAttribute('stroke-width', '3');
            labelG.appendChild(t);
            labels[i2] = { el: t, dx: sp.dx, dy: sp.dy };
            placed2.push({ x0: x0, y0: y0, x1: x1, y1: y1 });
            ci = cand.length;
            break;
          }
        }
      });
    }
    placeLabels();

    /* ---------- 视图同步 ---------- */
    function updateVisuals() {
      nodes.forEach(function (nd) {
        nd.el.setAttribute('cx', cur[nd.i].x);
        nd.el.setAttribute('cy', cur[nd.i].y);
      });
      edges.forEach(function (e2) {
        e2.el.setAttribute('x1', cur[e2.i].x); e2.el.setAttribute('y1', cur[e2.i].y);
        e2.el.setAttribute('x2', cur[e2.j].x); e2.el.setAttribute('y2', cur[e2.j].y);
      });
      labels.forEach(function (L, i2) {
        if (!L) return;
        L.el.setAttribute('x', cur[i2].x + L.dx);
        L.el.setAttribute('y', cur[i2].y + L.dy);
      });
    }

    /* ---------- 悬停高亮（本通路 + 直接相连通路） ---------- */
    function highlight(i2) {
      if (drag) return;
      nodes.forEach(function (nd) {
        var on = nd.i === i2 || shares[i2][nd.i] >= minShare;
        nd.el.setAttribute('fill-opacity', on ? 0.95 : 0.22);
        nd.el.setAttribute('stroke-opacity', on ? 1 : 0.35);
      });
      edges.forEach(function (e2) {
        e2.el.setAttribute('stroke-opacity', (e2.i === i2 || e2.j === i2) ? 0.85 : 0.08);
      });
      labels.forEach(function (L, k3) {
        if (L) L.el.setAttribute('fill-opacity', (k3 === i2 || shares[i2][k3] >= minShare) ? 1 : 0.18);
      });
    }
    function clearHighlight() {
      nodes.forEach(function (nd) {
        nd.el.setAttribute('fill-opacity', 0.92);
        nd.el.setAttribute('stroke-opacity', 1);
      });
      edges.forEach(function (e2) { e2.el.setAttribute('stroke-opacity', 0.45); });
      labels.forEach(function (L) { if (L) L.el.setAttribute('fill-opacity', 1); });
    }

    /* ---------- 拖拽交互：被拖节点跟随指针，其余节点实时力学避让 ---------- */
    var drag = null;   // {i, dx, dy}
    function toSvgPt(evt) {
      var r = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null;
      var vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
      var vw = vb ? vb.width : W, vh = vb ? vb.height : H;
      if (!r || !r.width || !r.height) return { x: evt.clientX, y: evt.clientY };
      return { x: (evt.clientX - r.left) * vw / r.width, y: (evt.clientY - r.top) * vh / r.height };
    }
    function clampPt(p, rad) {
      return {
        x: Math.min(W - rad - 4, Math.max(rad + 4, p.x)),
        y: Math.min(H - rad - 4, Math.max(rad + 4, p.y))
      };
    }
    /** 拖动中的松弛：被拖节点固定，其余节点按斥力/引力/向心/碰撞移动 */
    function relaxDrag(pinned, temp) {
      var a, b, it;
      for (it = 0; it < 3; it++) {
        for (a = 0; a < n; a++) {
          if (a === pinned) continue;
          var fx = 0, fy = 0;
          for (b = 0; b < n; b++) {
            if (a === b) continue;
            var dx = cur[a].x - cur[b].x, dy = cur[a].y - cur[b].y;
            var d = Math.sqrt(dx * dx + dy * dy) || 1e-3;
            fx += dx / d * (k2 * k2 / d) * 0.35;
            fy += dy / d * (k2 * k2 / d) * 0.35;
            if (b !== pinned && shares[a][b] >= minShare) {
              var att = d * d / k2 * (shares[a][b] / maxShare) * 0.35;
              fx -= dx / d * att; fy -= dy / d * att;
            }
          }
          fx += (W / 2 - cur[a].x) * 0.01; fy += (H / 2 - cur[a].y) * 0.01;
          var fl = Math.sqrt(fx * fx + fy * fy) || 1;
          cur[a].x += fx / fl * Math.min(fl, temp);
          cur[a].y += fy / fl * Math.min(fl, temp);
        }
      }
      for (it = 0; it < 2; it++) {
        for (a = 0; a < n; a++) {
          for (b = a + 1; b < n; b++) {
            if (a === pinned || b === pinned) {
              var only = a === pinned ? b : a;
              if (only === pinned) continue;
              var ra0 = radOf(rows[a]), rb0 = radOf(rows[b]);
              var minD0 = (ra0 + rb0) * 1.12 + 3;
              var ex = cur[only].x - cur[pinned].x, ey = cur[only].y - cur[pinned].y;
              var de = Math.sqrt(ex * ex + ey * ey) || 1e-3;
              if (de < minD0) { cur[only].x += ex / de * (minD0 - de); cur[only].y += ey / de * (minD0 - de); }
              continue;
            }
            var ra = radOf(rows[a]), rb = radOf(rows[b]);
            var minD = (ra + rb) * 1.12 + 3;
            var ddx = cur[b].x - cur[a].x, ddy = cur[b].y - cur[a].y;
            var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1e-3;
            if (dd < minD) {
              var push = (minD - dd) / 2, ux = ddx / dd, uy = ddy / dd;
              cur[a].x -= ux * push; cur[a].y -= uy * push;
              cur[b].x += ux * push; cur[b].y += uy * push;
            }
          }
        }
      }
      for (a = 0; a < n; a++) {
        if (a === pinned) continue;
        cur[a] = clampPt(cur[a], radOf(rows[a]));
      }
    }
    nodes.forEach(function (nd) {
      nd.el.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        var pt = toSvgPt(e);
        drag = { i: nd.i, dx: cur[nd.i].x - pt.x, dy: cur[nd.i].y - pt.y };
        nd.el.style.cursor = 'grabbing';
        if (svg.setPointerCapture) { try { svg.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ } }
        e.preventDefault();
      });
      nd.el.addEventListener('pointerenter', function () { highlight(nd.i); });
      nd.el.addEventListener('pointerleave', function () {
        nd.el.style.cursor = 'grab';
        if (!drag) clearHighlight();
      });
    });
    svg.style.touchAction = 'none';
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var pt = toSvgPt(e);
      cur[drag.i] = clampPt({ x: pt.x + drag.dx, y: pt.y + drag.dy }, radOf(rows[drag.i]));
      relaxDrag(drag.i, 7);
      updateVisuals();
    });
    function endDrag() {
      if (!drag) return;
      drag = null;
      svg.style.cursor = '';
      updateVisuals();
      placeLabels();   // 拖完按最终位置重排全部标签
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('pointerleave', endDrag);
    /* 双击空白处恢复初始布局 */
    svg.addEventListener('dblclick', function (e) {
      var t = e.target;
      if (t && t !== svg && t.getAttribute && t.getAttribute('data-role') === 'node') return;
      cur.forEach(function (p, i2) { p.x = base[i2].x; p.y = base[i2].y; });
      updateVisuals();
      placeLabels();
    });

    /* 图内颜色条图例 */
    var lx = W - 130, ly = 18, nSeg = 40;
    var lg = WB.plot.g({});
    root.appendChild(lg);
    lg.appendChild(S('rect', { x: lx - 8, y: ly - 8, width: 96, height: nSeg * 5 + 46, rx: 6, fill: '#ffffff', 'fill-opacity': 0.92, stroke: '#dde6ed' }));
    for (var s3 = 0; s3 < nSeg; s3++) {
      lg.appendChild(S('rect', { x: lx, y: ly + s3 * 5, width: 12, height: 5.2, fill: colF(1 - s3 / (nSeg - 1)) }));
    }
    lg.appendChild(WB.plot.txt(lx + 17, ly + 5, WB.formatNum(negMax, 1), { 'font-size': 10, fill: WB.plot.MUTED }));
    lg.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5, '0', { 'font-size': 10, fill: WB.plot.MUTED }));
    lg.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5 / 2 + 3, T('common.negLogFdr'), { 'font-size': 10, fill: WB.plot.TEXT }));

    container.appendChild(el('div.preview-note', {
      html: T('富集网络图：节点为通路（大小 = 交集基因数，颜色 = −log₁₀ FDR），两个通路共享 ≥ 2 个基因时连线，粗细 = 共享基因的 Jaccard 相似度；' +
        '同一簇的通路通常具有一致的生物学主题。初始布局为确定性力导向算法；<b>可拖拽节点</b>分开拥挤的簇（相邻节点自动避让），悬停高亮相邻通路，双击空白处恢复初始布局。')
    }));
    return canvas.svg;
  }

  function drawCompareDotPlot(container, perList, opt) {
    // perList: [{name, rows}]
    var lists = perList.filter(function (p) { return p.rows.length; });
    if (!lists.length) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var topN = opt.topN || 10;
    var termSet = [];
    lists.forEach(function (p) { p.rows.slice(0, topN).forEach(function (r) { if (termSet.indexOf(r.term) < 0) termSet.push(r.term); }); });
    if (termSet.length > 44) termSet = termSet.slice(0, 44);
    // 按“显著次数”排序
    var counts = {};
    termSet.forEach(function (t) { counts[t] = 0; });
    lists.forEach(function (p) {
      p.rows.slice(0, topN).forEach(function (r) { if (counts[r.term] !== undefined) counts[r.term] += 1; });
    });
    termSet.sort(function (a, b) { return counts[b] - counts[a]; });

    var labelW = 268, colW = Math.max(64, Math.min(120, (opt.width - labelW - 160) / lists.length));
    var rowH = 26, headerH = 56;
    var width = labelW + colW * lists.length + 150;
    var height = headerH + termSet.length * rowH + 84;
    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;

    var lookup = lists.map(function (p) {
      var m = new Map(); p.rows.forEach(function (r) { m.set(r.term, r); }); return m;
    });
    var all = [];
    lists.forEach(function (p) { p.rows.slice(0, topN).forEach(function (r) { all.push(r); }); });
    var kMax = Math.max.apply(null, all.map(function (r) { return r.overlap; }));
    var negMax = Math.max(1.5, Math.max.apply(null, all.map(function (r) { return r.negLogP; })));
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;

    lists.forEach(function (p, j) {
      var cx = labelW + j * colW + colW / 2;
      root.appendChild(WB.plot.txt(cx, 22, WB.plot.ellipsis(p.name, 12), {
        'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: WB.plot.TEXT
      }));
      root.appendChild(WB.plot.txt(cx, 38, T('common.geneUnit', { n: p.stats.n }), { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    root.appendChild(S('line', {
      x1: labelW - 6, y1: headerH - 8, x2: width - 16, y2: headerH - 8,
      stroke: '#c9d5df', 'shape-rendering': 'crispEdges'
    }));

    var colF = WB.plot.ramp('orrd');
    termSet.forEach(function (t, i) {
      var cy = headerH + i * rowH + rowH / 2;
      var lines = WB.plot.wrapText(t.replace(/_/g, ' '), Math.floor((labelW - 18) / 6.6), 2);
      var startY = cy - (lines.length - 1) * 6.5 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * 13, ln, {
          'text-anchor': 'end', 'font-size': 11.5, fill: WB.plot.TEXT
        }));
      });
      if (i % 2 === 1) {
        root.appendChild(S('rect', {
          x: labelW - 4, y: headerH + i * rowH, width: colW * lists.length + 8, height: rowH,
          fill: '#fafcfe'
        }));
      }
      lists.forEach(function (p, j) {
        var r = lookup[j].get(t);
        var cx = labelW + j * colW + colW / 2;
        if (!r) {
          var g0 = S('circle', { cx: cx, cy: cy, r: 3, fill: '#eef2f6' });
          root.appendChild(g0);
          return;
        }
        var rad = 3 + 6.5 * Math.sqrt(r.overlap / Math.max(1, kMax));
        var dot = S('circle', {
          cx: cx, cy: cy, r: rad,
          fill: colF(Math.min(1, r.negLogP / negMax)),
          stroke: '#fff', 'stroke-width': 1,
          opacity: r.padj <= pCut ? 1 : 0.42
        });
        root.appendChild(dot);
        WB.plot.bindTip(dot, function () {
          return '<b>' + t + '</b><br><b>' + p.name + '</b><br>FDR = ' + WB.pFormat(r.padj) +
            '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
            '　' + T('enr.fold') + ' ' + WB.formatNum(r.foldEnrichment, 2);
        });
      });
    });

    // 图例
    var lx = width - 92, ly = headerH;
    var nSeg = 30;
    for (var s = 0; s < nSeg; s++) {
      root.appendChild(S('rect', { x: lx, y: ly + s * 4.6, width: 11, height: 4.7, fill: colF(1 - s / (nSeg - 1)) }));
    }
    root.appendChild(WB.plot.txt(lx + 15, ly + 6, WB.formatNum(negMax, 1), { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 15, ly + nSeg * 4.6, '0', { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx - 2, ly + nSeg * 4.6 + 24, T('common.negLogFdr'), { 'font-size': 10, fill: WB.plot.TEXT }));
    root.appendChild(WB.plot.txt(lx - 2, ly + nSeg * 4.6 + 38, T('enr.pointSizeLegend'), { 'font-size': 10, fill: WB.plot.MUTED }));
    container.appendChild(el('div.preview-note', {
      text: T('enr.compareNote', { n: topN, p: pCut })
    }));
    return canvas.svg;
  }

  /* ------------------------------ 界面 ---------------------------------- */

  // 暴露核心函数，便于脚本化调用与自检
  WB.enrichment = {
    oraRun: oraRun, loadLibraryList: loadLibraryList, fetchGMT: fetchGMT,
    drawDotPlot: drawDotPlot, drawBarPlot: drawBarPlot, drawCompareDotPlot: drawCompareDotPlot,
    drawEnrichMap: drawEnrichMap,
    ENRICHR_BASE: ENRICHR_BASE,
    foldKey: foldKey, styleSymbol: styleSymbol, libMatchesSpecies: libMatchesSpecies,
    SPECIES: SPECIES,
    pickDefaultLibrary: pickDefaultLibrary, needFetchOnline: needFetchOnline
  };

  var GENE_FORMATS = [
    {
      name: '单列基因名（推荐）',
      filename: 'gene_list_template.txt',
      desc: '<b>一行一个基因名</b>，支持一次粘贴多列（会自动展平）。也识别逗号、分号、空格分隔。' +
        '若含表头（如 <code>gene</code> / <code>symbol</code>）会自动跳过。',
      sample: 'TP53\nBRCA1\nMKI67\nCCNB1\nCDK1\n...\n\n# 也可以这样写：\nTP53, BRCA1, MKI67, CCNB1'
    },
    {
      name: '多列表（分组对比）',
      filename: 'gene_list_multi_template.txt',
      desc: '每行一个基因列表，格式 <code>列表名: 基因1, 基因2, ...</code>；' +
        '或使用两列 long 表 <code>List &lt;TAB&gt; Gene</code>。适合「上调/下调分别富集」或不同分群的对比。',
      sample: 'Up: TP53, MKI67, CCNB1, CDK1, AURKA\n' +
        'Down: BRCA1, ATM, CDKN1A, BAX\n\n' +
        '# 或两列 long 表：\n' +
        'List\tGene\nUp\tTP53\nUp\tMKI67\nDown\tBRCA1'
    }
  ];

  WB.register({
    id: 'enrichment',
    name: '富集分析',
    icon: '⬢',
    color: '#7d5bb8',
    desc: 'GO / KEGG / Reactome 等基因集富集：超几何检验 + BH 校正，输出气泡图、条形图与结果表。',
    tags: ['GO / KEGG', 'GMT 上传', '气泡图'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('富集分析（ORA）') }),
        el('p', { text: T('输入差异基因列表，与基因集库做超几何检验（等价 Fisher 精确检验单侧），输出显著富集通路。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入基因列表',
        accept: '.txt,.tsv,.csv,.list',
        formats: GENE_FORMATS,
        demoText: WB.demo.geneList,
        placeholder: 'TP53\nBRCA1\nMKI67\n...',
        paramsTitle: '分析参数',
        params: [
          {
            key: 'mode', label: '输入模式', type: 'select', value: 'single',
            options: [
              { value: 'single', label: '单个基因列表' },
              { value: 'multi', label: '多个列表（分组对比）' }
            ]
          },
          { key: 'minSize', label: '基因集最小基因数', type: 'number', value: 5, min: 1, max: 500, step: 1 },
          { key: 'maxSize', label: '基因集最大基因数', type: 'number', value: 500, min: 5, max: 5000, step: 10 },
          {
            key: 'padjust', label: '多重检验校正', type: 'select', value: 'BH',
            options: [
              { value: 'BH', label: 'Benjamini-Hochberg (FDR)' },
              { value: 'BONFERRONI', label: 'Bonferroni' },
              { value: 'HOLM', label: 'Holm' },
              { value: 'NONE', label: '不校正（原始 P）' }
            ]
          },
          { key: 'pCut', label: '显著性阈值', type: 'number', value: 0.05, min: 0.0001, max: 1, step: 0.01 },
          { key: 'topN', label: '显示前 N 个通路', type: 'number', value: 10, min: 3, max: 60, step: 1 },
          {
            key: 'metric', label: '气泡图 X 轴', type: 'select', value: 'fold',
            options: [
              { value: 'fold', label: '富集倍数 (Fold enrichment)' },
              { value: 'rich', label: 'Rich factor (k/K)' },
              { value: 'ratio', label: 'Gene ratio (k/n)' }
            ]
          },
          {
            key: 'sortBy', label: '排序方式', type: 'select', value: 'p',
            options: [
              { value: 'p', label: '按 P 值（最显著在前）' },
              { value: 'fold', label: '按富集倍数' },
              { value: 'overlap', label: '按交集基因数' }
            ]
          },
          {
            key: 'background', label: '背景基因集（可选，每行一个 / 逗号分隔）', type: 'textarea', rows: 3,
            width: 'full',
            hint: '留空则以所选基因集库中的全部基因为背景。若实验仅检测了部分基因（如靶向 panel / 芯片），请务必填写真实背景。'
          }
        ],
        runLabel: '开始富集分析',
        onRun: function (ctx) {
          var res = WB.$('#enrichment-result');
          WB.clear(res);

          var opt = {
            minSize: Number(ctx.values.minSize) || 1,
            maxSize: Number(ctx.values.maxSize) || 500,
            minOverlap: 1,
            padjust: ctx.values.padjust,
            pCut: Number(ctx.values.pCut) || 0.05,
            species: 'human'
          };
          if (ctx.values.background && ctx.values.background.trim()) {
            opt.background = WB.parse.parseGeneList(ctx.values.background);
          }

          /* 先解析输入基因：输入有误时立即提示，不必先联网取库 */
          var isMulti = ctx.values.mode === 'multi';
          var lists;
          if (isMulti) {
            lists = WB.parse.parseMultiGeneList(ctx.text);
            if (lists.length < 1) throw new Error(T('多列表模式未解析到数据，请用「列表名: 基因1, 基因2…」格式'));
          } else {
            var genes = WB.parse.parseGeneList(ctx.text);
            if (!genes.length) throw new Error(T('未解析到任何基因，请检查输入'));
            lists = [{ name: T('输入列表'), genes: genes }];
          }

          function renderAll(geneSource) {
            if (!geneSource.sets.length) {
              throw new Error(T('还没有可用的基因集。请选择「内置示例库」「上传 GMT」或「在线获取 Enrichr 库」。'));
            }
            opt.species = geneSource.species || 'human';

            var t0 = performance.now();
            var perList = lists.map(function (L) {
              var r = oraRun(L.genes, geneSource.sets, opt);
              return { name: L.name, genes: L.genes, rows: r.rows, stats: r.stats };
            });
            var dt = performance.now() - t0;

            /* 概览 */
            var first = perList[0];
            var totalInput = lists.reduce(function (a, l) { return a + l.genes.length; }, 0);
            var totalUnmapped = perList.reduce(function (a, p) { return a + p.stats.unmapped.length; }, 0);
            var totalSig = perList.reduce(function (a, p) { return a + p.stats.sig; }, 0);
            var spName = speciesShort(opt.species);
            res.appendChild(WB.ui.statBar([
              { label: T('基因集库'), value: T('{n} 条', { n: geneSource.sets.length }), },
              { label: T('物种'), value: spName },
              { label: T('背景基因数 (N)'), value: first.stats.N },
              { label: T(isMulti ? '基因列表数' : '输入基因数 (n)'), value: isMulti ? lists.length : first.stats.n },
              { label: T('未匹配到背景'), value: totalUnmapped, tone: totalUnmapped ? 'amber' : '' },
              { label: T('显著通路 (FDR ≤ {p})', { p: opt.pCut }), value: totalSig, tone: totalSig ? 'red' : '' }
            ]));

            res.appendChild(WB.ui.alertBox('info',
              T('基因集来源：<b>{src}</b>；物种：<b>{sp}</b>；检验方法：超几何检验（上尾，过表征），校正方法：<b>{adj}</b>；用时 {dt} s。',
                { src: geneSource.label, sp: spName, adj: opt.padjust, dt: (dt / 1000).toFixed(2) })));

            if (first.stats.unmapped.length) {
              res.appendChild(WB.ui.alertBox('warn',
                T('有 <b>{n}</b> 个输入基因不在背景基因集中，已自动忽略：', { n: first.stats.unmapped.length }) +
                '<span style="opacity:.8">' + first.stats.unmapped.slice(0, 25).join(', ') +
                (first.stats.unmapped.length > 25 ? ' …' : '') + '</span>'));
              res.appendChild(WB.ui.alertBox('info',
                T('匹配时已忽略大小写，并按所选物种规范符号大小写（如小鼠 Tp53）。基因集库只接受 <b>基因 Symbol</b>；若为 Ensembl / Entrez / 探针 ID，请先转换为 Symbol，否则会被判为未匹配。')));
            }
            if (!first.stats.n) throw new Error(T('输入基因与背景基因集没有任何交集，请检查基因命名（大小写/物种）与背景设置'));

            var topN = Number(ctx.values.topN) || 10;
            var sortKey = ctx.values.sortBy;
            function sortRows(rows) {
              var a = rows.slice();
              if (sortKey === 'fold') a.sort(function (x, y) { return (y.foldEnrichment || 0) - (x.foldEnrichment || 0) || x.p - y.p; });
              else if (sortKey === 'overlap') a.sort(function (x, y) { return y.overlap - x.overlap || x.p - y.p; });
              else a.sort(function (x, y) { return x.p - y.p; });
              return a;
            }

            /* 图形 */
            var plotCard = WB.ui.resultCard(T(isMulti ? '富集结果对比图' : '富集结果图'));
            res.appendChild(plotCard);
            var plotBody = plotCard.querySelector('.card-body');

            if (isMulti) {
              var unionRows = [];
              perList.forEach(function (p) {
                sortRows(p.rows).slice(0, topN).forEach(function (r) {
                  var found = unionRows.filter(function (u) { return u.term === r.term; })[0];
                  if (!found) unionRows.push({ term: r.term, negLogP: r.negLogP });
                  else found.negLogP = Math.max(found.negLogP, r.negLogP);
                });
              });
              unionRows.sort(function (a, b) { return b.negLogP - a.negLogP; });
              var holder2 = el('div.plot-holder');
              plotBody.appendChild(holder2);
              var svgC = drawCompareDotPlot(holder2, perList.map(function (p) {
                return { name: p.name, rows: sortRows(p.rows), stats: p.stats };
              }), { topN: topN, pCut: opt.pCut });
              if (svgC) WB.plot.addToolbar(plotBody, { getSvg: function () { return svgC; }, basename: 'enrichment_compare' });
            } else {
              var shown = sortRows(first.rows).slice(0, topN);
              var holderD = el('div.plot-holder');
              var holderB = el('div.plot-holder');
              var holderL = el('div.plot-holder');
              var holderC = el('div.plot-holder');
              var holderM = el('div.plot-holder');
              var svgD = drawDotPlot(holderD, shown, { metric: ctx.values.metric, pCut: opt.pCut });
              var svgB = drawBarPlot(holderB, shown, { pCut: opt.pCut });
              var svgL = drawLollipop(holderL, shown, { metric: ctx.values.metric, pCut: opt.pCut });
              var svgC = drawCnetPlot(holderC, shown.slice(0, Math.min(12, shown.length)), { pCut: opt.pCut });
              var svgM = drawEnrichMap(holderM, shown, { pCut: opt.pCut });
              var currentSvg = svgD;
              var tb = WB.ui.tabs([
                { label: T('气泡图'), content: holderD },
                { label: T('条形图'), content: holderB, onShow: function () { currentSvg = svgB; } },
                { label: T('棒棒糖图'), content: holderL, onShow: function () { currentSvg = svgL; } },
                { label: T('基因-通路网络'), content: holderC, onShow: function () { currentSvg = svgC; } },
                { label: T('富集网络图'), content: holderM, onShow: function () { currentSvg = svgM; } }
              ]);
              tb.tabs[0].onShow = function () { currentSvg = svgD; };
              plotBody.appendChild(tb.node);
              WB.plot.addToolbar(plotBody, {
                getSvg: function () { return currentSvg; },
                basename: 'enrichment'
              });
            }

            /* 表格 */
            if (isMulti) {
              var allRows = [];
              perList.forEach(function (p) {
                p.rows.forEach(function (r) {
                  allRows.push({
                    list: p.name, term: r.term, setSize: r.setSize, overlap: r.overlap,
                    foldEnrichment: r.foldEnrichment, p: r.p, padj: r.padj,
                    genes: r.overlapGenes, key: p.name + '||' + r.term
                  });
                });
              });
              allRows.sort(function (a, b) { return a.p - b.p; });
              var c2 = WB.ui.resultCard(T('全部富集结果（{n} 行）', { n: allRows.length }));
              res.appendChild(c2);
              renderTable(c2.querySelector('.card-body'), allRows, true, opt.pCut, geneSource.sets.length);
            } else {
              var rows1 = first.rows.map(function (r) {
                return {
                  term: r.term, description: r.description, setSize: r.setSize, overlap: r.overlap,
                  expected: r.expected, foldEnrichment: r.foldEnrichment, richFactor: r.richFactor,
                  geneRatio: r.geneRatio, p: r.p, padj: r.padj, genes: r.overlapGenes, key: r.term
                };
              });
              var c1 = WB.ui.resultCard(T('全部富集结果（{n} 行，已按 P 值排序）', { n: rows1.length }));
              res.appendChild(c1);
              renderTable(c1.querySelector('.card-body'), rows1, false, opt.pCut, geneSource.sets.length);
            }

            if (!first.rows.length) {
              res.appendChild(WB.ui.alertBox('warn',
                T('没有基因集通过筛选（基因集大小 {a}~{b}，且至少 1 个交集基因）。可放宽基因集大小范围后重试。',
                  { a: opt.minSize, b: opt.maxSize })));
            }
          }

          /* 在线模式：所选 Enrichr 库若尚未下载，此处自动下载后再对输入基因做富集 */
          var pending = gsrc.ensure();
          if (!pending) { renderAll(gsrc.collect()); return; }
          return pending.then(function (geneSource) { renderAll(geneSource); });
        }
      });

      /* ---------------- 基因集来源（附加区） ---------------- */
      var gsrc = buildGeneSetSource();
      panel.extraSlot.appendChild(gsrc.node);

      main.appendChild(panel.root);
      var resWrap = el('div.tool-grid');
      resWrap.id = 'enrichment-result';
      main.appendChild(resWrap);

      if (!WB._enrDemoLoaded) {
        WB._enrDemoLoaded = true;
        panel.setText(WB.demo.geneList);
      }

      function collectGeneSets() {
        return gsrc.collect();
      }
    }
  });

  /* --------------------------- 结果表渲染 -------------------------------- */

  function renderTable(container, rows, multi, pCut, libSize) {
    var cols = [];
    if (multi) cols.push({ key: 'list', label: T('基因列表'), width: 110 });
    cols = cols.concat([
      { key: 'term', label: T('通路 / 基因集') },
      { key: 'setSize', label: T('基因集大小'), align: 'right', width: 96 },
      { key: 'overlap', label: T('交集'), align: 'right', width: 64 },
      {
        key: 'foldEnrichment', label: T('富集倍数'), align: 'right', width: 90,
        format: function (r) { return WB.formatNum(r.foldEnrichment, 2); }
      },
      {
        key: 'p', label: T('P 值'), align: 'right', width: 96,
        format: function (r) { return WB.pFormat(r.p); }
      },
      {
        key: 'padj', label: 'FDR', align: 'right', width: 96,
        format: function (r) { return WB.pFormat(r.padj); },
        className: 'fdr-cell'
      },
      {
        key: 'genes', label: T('交集基因'), format: function (r) {
          return r.genes.slice(0, 12).join(', ') + (r.genes.length > 12 ? ' …(' + r.genes.length + ')' : '');
        }
      },
      {
        key: 'dl', label: T('导出'), width: 62,
        render: function (r) {
          return el('button.btn.btn-ghost.btn-xs', {
            text: 'TSV', title: T('导出该通路的交集基因'),
            onclick: function () {
              WB.downloadText(WB.toTSV(['Term', 'Gene'], [[r.term, r.genes.join(', ')]]),
                'term_genes.tsv', 'text/tab-separated-values');
            }
          });
        }
      }
    ]);
    WB.ui.dataTable(container, cols, rows, {
      pageSize: 25, exportName: 'enrichment_results',
      rowClass: function (r) { return r.padj <= pCut ? 'row-sig' : ''; }
    });
    container.appendChild(el('div.preview-note', {
      text: T('FDR 列已按 {n} 条基因集完成多重检验校正；标红行为 FDR ≤ {p} 的显著通路。每行「TSV」按钮可导出该通路的交集基因。',
        { n: libSize, p: pCut })
    }));
  }

  /* ------------------------- 基因集来源组件 ------------------------------ */

  function buildGeneSetSource() {
    var state = {
      mode: 'demo', species: 'human', gmtText: null, gmtName: null,
      libName: '', libText: null, libList: null, libKey: null, listPromise: null
    };
    var node = el('div.gsrc-box');
    node.appendChild(el('div.param-head', { text: T('基因集来源（富集分析的注释库）') }));
    node.appendChild(el('div.gsrc-status', {
      html: T('三种来源<b>单选</b>，分析时只用其中一种：内置示例（16 条）仅供演示流程；正式分析推荐「上传 GMT」或「在线获取 Enrichr 库」。无论选哪种，<b>输入基因都填在页面顶部的「输入基因列表」框</b>，并与所选来源的基因集求交集。')
    }));

    /* 物种：既决定在线库列表的筛选，也决定基因符号的规范大小写 */
    var spRow = el('div.gsrc-species');
    spRow.appendChild(el('span.gsrc-sp-label', { text: T('物种（同时决定可选基因集库与基因符号大小写）') }));
    var spSel = el('select.form-control.gsrc-sp-select');
    SPECIES.forEach(function (s) {
      spSel.appendChild(el('option', { value: s.key, text: T(s.zh) }));
    });
    spSel.value = 'human';
    spSel.addEventListener('change', function () {
      state.species = spSel.value;
      renderLibList();
    });
    spRow.appendChild(spSel);
    node.appendChild(spRow);

    var opts = el('div.gsrc-options');
    var radios = {};
    [
      ['demo', '内置示例基因集', '16 条示例通路，<b>仅供功能演示</b>，不可用于正式分析'],
      ['gmt', '上传 / 粘贴 GMT 文件', '推荐：来源与版本完全可控（MSigDB、GO、KEGG 官网下载的 .gmt）'],
      ['online', '在线获取 Enrichr 基因集库', '需联网；首次获取后缓存在浏览器本地，之后可离线复用']
    ].forEach(function (r) {
      var input = el('input', { type: 'radio', name: 'gsrc', value: r[0] });
      if (r[0] === 'demo') input.checked = true;
      input.addEventListener('change', function () {
        state.mode = r[0];
        updatePanes();
        /* 切到在线模式时自动取一次库列表，用户不必先手动点「获取列表」 */
        if (r[0] === 'online') loadListQuiet();
      });
      radios[r[0]] = input;
      opts.appendChild(el('label.gsrc-opt', [
        input,
        el('span.gsrc-opt-body', [
          el('span.gsrc-opt-title', { text: T(r[1]) }),
          el('span.gsrc-opt-desc', { html: T(r[2]) })
        ])
      ]));
    });
    node.appendChild(opts);

    /* demo 面板 */
    var paneDemo = el('div.gsrc-pane', { 'data-pane': 'demo' });
    paneDemo.appendChild(el('div.gsrc-status', {
      html: T('将使用内置的 <b>{n}</b> 条示例基因集（{list} 等）。示例基因列表在这套通路里会得到「细胞周期 / 有丝分裂」显著富集，可用于验证流程。',
        {
          n: WB.demo.gmtSets.length,
          list: WB.demo.gmtSets.map(function (s) { return s[0]; }).slice(0, 4).join(T('、'))
        })
    }));
    node.appendChild(paneDemo);

    /* GMT 面板 */
    var paneGmt = el('div.gsrc-pane', { 'data-pane': 'gmt' });
    var gmtInput = el('input', { type: 'file', accept: '.gmt,.txt,.tsv', multiple: false });
    var gmtBtn = el('button.btn.btn-ghost.btn-xs', { text: T('选择 .gmt 文件') });
    gmtBtn.addEventListener('click', function () { gmtInput.click(); });
    var gmtStatus = el('div.gsrc-status', { text: T('尚未选择文件。') });
    gmtInput.addEventListener('change', function () {
      if (!gmtInput.files.length) return;
      WB.readFileText(gmtInput.files[0]).then(function (t) {
        state.gmtText = t; state.gmtName = gmtInput.files[0].name;
        var sets = WB.parse.parseGMT(t);
        gmtStatus.innerHTML = T('已加载 <b>{file}</b>：解析出 <b>{n}</b> 条基因集。', { file: gmtInput.files[0].name, n: sets.length }) +
          (sets.length ? T('例如：{list}', { list: sets.slice(0, 3).map(function (s) { return s.term + '(' + s.genes.length + ')'; }).join(T('、')) }) : '');
        if (!sets.length) gmtStatus.innerHTML += ' <span style="color:#d6483f">' + T('未解析到基因集，请确认是标准 GMT（制表符分隔）') + '</span>';
      });
    });
    paneGmt.appendChild(el('div.format-actions', [gmtBtn, gmtInput]));
    var gmtTaLabel = el('div.paste-label', { text: T('或直接粘贴 GMT 文本（每行：通路名 <TAB> 描述 <TAB> 基因1 <TAB> 基因2 …）') });
    var gmtTa = el('textarea.paste-area', { rows: 4, placeholder: 'PATHWAY_NAME\tdescription\tGENE1\tGENE2\tGENE3' });
    gmtTa.style.minHeight = '90px';
    gmtTa.addEventListener('input', WB.debounce(function () {
      state.gmtText = gmtTa.value;
      var sets = WB.parse.parseGMT(gmtTa.value);
      gmtStatus.innerHTML = sets.length ? T('已解析 <b>{n}</b> 条基因集。', { n: sets.length }) : T('尚未解析到基因集。');
    }, 300));
    paneGmt.appendChild(gmtTaLabel);
    paneGmt.appendChild(gmtTa);
    paneGmt.appendChild(gmtStatus);
    node.appendChild(paneGmt);

    /* 在线面板 */
    var paneOnline = el('div.gsrc-pane', { 'data-pane': 'online' });
    paneOnline.appendChild(el('div.gsrc-status', {
      html: T('基因请填在页面顶部的「输入基因列表」框（本处只选择用于注释的基因集库）：' +
        '一行一个基因名，也可用逗号 / 分号 / 空格分隔，或直接从 Excel 复制多列；' +
        '请使用与所选物种对应的<b>基因 Symbol</b>（大小写不影响匹配），例如人 <code>TP53</code>、小鼠 <code>Tp53</code>。' +
        '可点输入框右上角的「加载示例数据」查看格式。<br>' +
        '<b>用法</b>：先在顶部填入基因，再在这里选好物种与注释库，然后点页面底部的「开始富集分析」——' +
        '所选库会在分析开始时自动下载（首次数秒至数十秒，之后走本地缓存），并直接对这些输入基因完成富集，无需预先手动取库。')
    }));
    var loadBtn = el('button.btn.btn-ghost.btn-xs', { text: T('刷新可用基因集库列表') });
    var libSelect = el('select.form-control', { style: { maxWidth: '340px', display: 'inline-block', marginLeft: '8px' } });
    libSelect.appendChild(el('option', { value: '', text: T('（列表获取中…）') }));
    var fetchBtn = el('button.btn.btn-ghost.btn-xs', { text: T('获取所选基因集库'), disabled: true });
    var onlineStatus = el('div.gsrc-status', { text: T('在线模式需要联网。若网络受限，请改用「上传／粘贴 GMT 文件」。') });
    var onlySpecies = el('input', { type: 'checkbox' });
    onlySpecies.checked = true;
    onlySpecies.addEventListener('change', renderLibList);

    /** 按当前物种（与「仅显示该物种」勾选）重建库下拉；必要时自动选中推荐库 */
    function renderLibList() {
      WB.clear(libSelect);
      var arr = state.libList;
      if (!arr) {
        libSelect.appendChild(el('option', {
          value: '', text: T(state.listPromise ? '（列表获取中…）' : '（先获取列表）')
        }));
        fetchBtn.disabled = true;
        return;
      }
      var shown = arr, hit = false, note;
      if (onlySpecies.checked) {
        var f = arr.filter(function (l) { return libMatchesSpecies(l.name, state.species); });
        if (f.length) { shown = f; hit = true; }
      }
      if (onlySpecies.checked && hit) {
        note = T('该物种匹配到 <b>{n}</b> 个注释库（共 {m} 个）。<b>数字指库的数量，与输入基因个数无关</b>；' +
          '输入的基因始终保留在顶部输入框，分析开始时会与所选库求交集。已自动选中推荐库，直接点「开始富集分析」即可。取消勾选可显示全部。',
          { n: shown.length, m: arr.length });
        if (state.species === 'mouse') {
          note += ' ' + T('注：Enrichr 的 <b>GO 系列全部是人源库</b>，没有小鼠 GO 库。小鼠可用 KEGG / WikiPathways / MGI 表型 / Mouse Gene Atlas 等；' +
            '若必须用小鼠 GO，请到 MGI 或 MSigDB 下载小鼠 GO 的 GMT，再用「上传 / 粘贴 GMT 文件」。');
        }
      } else if (onlySpecies.checked && !hit) {
        note = T('该物种没有匹配到常用库，已显示全部 {n} 个库（可改选其它物种，或上传对应物种的 GMT）。', { n: arr.length });
        if (state.species !== 'human') {
          note += ' ' + T('Enrichr 目前只提供<b>人源</b>与<b>小鼠</b>的注释库，{sp}暂无对应库；建议上传该物种的 GMT（如 GO / KEGG / MSigDB 官方 GMT），或改选人 / 小鼠做同源映射。',
            { sp: speciesShort(state.species) });
        }
      } else {
        note = T('共列出 <b>{n}</b> 个可选的注释库。<b>这是库的数量，与输入基因个数无关</b>——输入的基因始终保留在顶部输入框，' +
          '分析开始时会与所选库求交集。已自动选中推荐库，直接点「开始富集分析」即可。', { n: arr.length });
      }

      var names = shown.map(function (l) { return l.name; });
      /* 该物种在 Enrichr 没有对应库时既不自动选择、也不沿用上一次的选择，
       * 避免把人 / 小鼠的库静默套用到别的物种上 */
      var noHit = onlySpecies.checked && !hit;
      var picked = '';
      if (!noHit) {
        picked = (state.libName && names.indexOf(state.libName) >= 0) ? state.libName : '';
        if (!picked) {
          var def = pickDefaultLibrary(names, state.species);
          if (def) {
            picked = def;
            note += ' ' + T('已自动选中推荐库「{lib}」（若需更换请在上方下拉中选择）。', { lib: def });
          }
        }
      }

      libSelect.appendChild(el('option', { value: '', text: T('（请从 {n} 个注释库中选一个）', { n: shown.length }) }));
      shown.forEach(function (l) {
        libSelect.appendChild(el('option', {
          value: l.name,
          text: l.name + T('（{n} 条通路）', { n: l.terms })
        }));
      });
      state.libName = picked;
      libSelect.value = picked || '';
      onlineStatus.innerHTML = note;
      fetchBtn.disabled = !libSelect.value;
    }

    /** 拉取可用库列表（已加载则复用；force 用于手动刷新） */
    function loadListOnce(force) {
      if (state.libList && !force) return Promise.resolve(state.libList);
      if (state.listPromise) return state.listPromise;
      loadBtn.disabled = true;
      onlineStatus.innerHTML = T('正在获取 Enrichr 基因集库列表…');
      state.listPromise = loadLibraryList().then(function (arr) {
        state.listPromise = null;
        loadBtn.disabled = false;
        state.libList = arr;
        renderLibList();
        WB.toast(T('获取到 {n} 个基因集库', { n: arr.length }), 'ok');
        return arr;
      }, function (e) {
        state.listPromise = null;
        loadBtn.disabled = false;
        applyFallback(e);
        throw e;
      });
      return state.listPromise;
    }

    /** 静默触发列表加载（切换来源 / 自动流程），失败不抛出未捕获异常 */
    function loadListQuiet() {
      try { loadListOnce().catch(function () { /* 提示已由 applyFallback 展示 */ }); }
      catch (e) { /* 忽略 */ }
    }

    /** 列表取不到时的兜底：列出该物种的常用库名，仍可直接运行 */
    function applyFallback(e) {
      var fb = SPECIES_FALLBACK[state.species] || [];
      WB.clear(libSelect);
      if (fb.length) {
        fb.forEach(function (n) { libSelect.appendChild(el('option', { value: n, text: n + T('（常用库）') })); });
        state.libName = fb[0];
        libSelect.value = fb[0];
      } else {
        libSelect.appendChild(el('option', { value: '', text: T('（该物种暂无常用库名，建议上传 GMT）') }));
      }
      fetchBtn.disabled = !libSelect.value;
      onlineStatus.innerHTML = T('<span style="color:#d6483f">无法访问 Enrichr：{msg}</span><br>常见原因：处于离线环境、单位网络或代理阻断了 <code>maayanlab.cloud</code>、或浏览器跨域限制（CORS）。' +
        '可直接用浏览器打开 <code>{url}</code> 测试连通性；若无法访问，请到 Enrichr 官网下载对应库的 <code>.gmt</code> 文件，再用「上传 / 粘贴 GMT 文件」方式。' +
        '下方已列出常用库名，也可重试获取。', { msg: e.message, url: ENRICHR_BASE + 'datasetStatistics' });
    }

    /** 下载所选库的 GMT 文本并返回 geneSource */
    function fetchSelected(name) {
      name = name || state.libName;
      if (!name) {
        throw new Error(T('尚未选择基因集库。请在下拉中选择一个注释库；若下拉为空，点「{btn}」重试，或改用「上传 / 粘贴 GMT 文件」。',
          { btn: T('刷新可用基因集库列表') }));
      }
      fetchBtn.disabled = true;
      fetchBtn.innerHTML = T('获取中…');
      onlineStatus.innerHTML = T('正在获取基因集库 <b>{lib}</b>（首次需联网下载数秒至数十秒，之后复用本地缓存）…', { lib: name });
      var t0 = performance.now();
      return fetchGMT(name).then(function (txt) {
        fetchBtn.innerHTML = T('获取所选基因集库');
        fetchBtn.disabled = false;
        state.libText = txt; state.libName = name; state.libKey = name;
        var sets = WB.parse.parseGMT(txt);
        onlineStatus.innerHTML = T('已获取 <b>{lib}</b>：{n} 条基因集，用时 {t} s',
          { lib: name, n: sets.length, t: ((performance.now() - t0) / 1000).toFixed(1) }) +
          (txt.length > 3e6 ? T('（该库较大，未写入本地缓存）') : T('（已缓存到浏览器）'));
        WB.toast(T('已获取 {n} 条基因集', { n: sets.length }), 'ok');
        return collect();
      }, function (e) {
        fetchBtn.innerHTML = T('获取所选基因集库');
        fetchBtn.disabled = false;
        onlineStatus.innerHTML = T('<span style="color:#d6483f">获取失败：{msg}</span><br>可改用 GMT 上传方式，或到 Enrichr 官网下载该库的 .gmt 文件。', { msg: e.message });
        throw new Error(T('获取基因集库「{lib}」失败：{msg}。可换一个库，或改用「上传 / 粘贴 GMT 文件」方式。', { lib: name, msg: e.message }));
      });
    }

    /**
     * 分析开始前确保基因集已就绪。
     * 返回 null：可同步 collect()；返回 Promise：需先联网取库（点「开始富集分析」时自动完成）。
     */
    function ensure() {
      if (!needFetchOnline(state)) return null;
      /* 还没有选定库（例如尚未获取列表）→ 先取列表，再顶出一个推荐库 */
      var prep = state.libName ? Promise.resolve() :
        loadListOnce().catch(function () { /* 列表不可用；仍尝试用兜底库名下载，由 fetchSelected 给出结果 */ });
      return prep.then(function () { return fetchSelected(state.libName); });
    }

    loadBtn.addEventListener('click', function () {
      loadListOnce(true).catch(function () { /* 失败提示已展示 */ });
    });
    libSelect.addEventListener('change', function () {
      state.libName = libSelect.value;
      fetchBtn.disabled = !libSelect.value;
    });
    fetchBtn.addEventListener('click', function () {
      var name = libSelect.value;
      if (!name) return;
      fetchSelected(name).catch(function () { /* 失败提示已展示 */ });
    });
    paneOnline.appendChild(el('div.format-actions', [loadBtn, libSelect, fetchBtn]));
    paneOnline.appendChild(el('div.gsrc-status', {
      html: T('点后会为该库取回 GMT 文本。多数情况下不必手动点：直接点页面底部的「开始富集分析」，' +
        '运行时若该库尚未下载会自动获取并完成富集。')
    }));
    paneOnline.appendChild(el('label.gsrc-check', [onlySpecies, el('span', { text: T('仅显示该物种的基因集库') })]));
    paneOnline.appendChild(onlineStatus);
    paneOnline.appendChild(el('div.gsrc-status', {
      html: T('<span style="opacity:.8">库名说明：<code>GO_Biological_Process_2023</code> 生物学过程、' +
        '<code>KEGG_2021_Human</code> KEGG 通路、<code>Reactome_2022</code> Reactome、' +
        '<code>MSigDB_Hallmark_2020</code> Hallmark 基因集。</span>')
    }));
    node.appendChild(paneOnline);

    function updatePanes() {
      WB.$$('.gsrc-pane', node).forEach(function (p) {
        p.style.display = p.getAttribute('data-pane') === state.mode ? '' : 'none';
      });
    }
    updatePanes();

    function collect() {
      if (state.mode === 'demo') {
        return {
          sets: WB.parse.parseGMT(WB.demo.gmtText),
          label: T('内置示例基因集（16 条，仅供演示）'), species: state.species
        };
      }
      if (state.mode === 'gmt') {
        var txt = state.gmtText || '';
        return {
          sets: WB.parse.parseGMT(txt),
          label: T('本地 GMT') + (state.gmtName ? T('（{n}）', { n: state.gmtName }) : ''),
          species: state.species
        };
      }
      return {
        sets: state.libText ? WB.parse.parseGMT(state.libText) : [],
        label: T('Enrichr 在线库') + (state.libName ? T('：{n}', { n: state.libName }) : ''),
        species: state.species
      };
    }

    return { node: node, collect: collect, state: state, ensure: ensure };
  }
})(window);
