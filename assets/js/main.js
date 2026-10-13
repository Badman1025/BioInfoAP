/* =============================================================================
 * main.js  —  模块注册、侧栏导航、界面语言切换、路由
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB;
  var el = WB.el;

  // 注册表在 core/utils.js 中已初始化（保证模块先于 main.js 加载时也能注册成功）
  WB.tools = WB.tools || {};
  WB.toolOrder = WB.toolOrder || [];

  /* 导出 SVG 时内联样式 */
  WB.svgInlineCSS =
    'text{font-family:"Helvetica Neue",Helvetica,"PingFang SC","Microsoft YaHei",Arial,sans-serif;}' +
    '.axis line{stroke:#b6c2cc;}';

  /* ------------------------- 界面文案（中 → 英） -------------------------- */

  /** 注册一条界面文案：中文原文 → 英文译文 */
  function reg(zh, en) { var o = {}; o[zh] = en; WB.i18n.regUI(o); }

  // 导航与通用
  reg('首页 / 概览', 'Home / Overview');
  reg('使用说明', 'User guide');
  reg('集合分析', 'Set analysis');
  reg('功能富集', 'Enrichment');
  reg('关系与降维', 'Correlation & dimension');
  reg('差异分析', 'Differential analysis');
  reg('差异与统计', 'Differential & statistics');
  reg('序列与数据', 'Sequence & data');
  reg('说明', 'Help');
  reg('该模块尚未实现', 'This module is not implemented yet.');

  // 首页
  reg('生物信息学在线分析平台', 'Bioinformatics Studio');
  reg('Bioinformatics Studio', 'Bioinformatics Studio');
  reg('极速导入，便捷分析', 'Fast import, easy analysis');
  reg('界面语言', 'Interface language');
  reg('界面与图表文字的中英文切换', 'Switch the interface and figures between Chinese and English');
  reg('集合 / 富集 / 相关性 / 降维 / 差异 / 聚类 / 统计检验 / 生存分析 / 序列常用分析工具；全部计算在浏览器本地完成，数据不上传，无需联网即可使用。',
    'Common bioinformatics analyses — set / enrichment / correlation / dimensionality reduction / differential / clustering / statistical testing / survival / sequence. All computation runs locally in your browser; no data is uploaded and no network connection is required.');
  reg('使用步骤', 'Getting started');

  reg('<li>左侧选择需要的分析模块，例如「韦恩图」或「聚类热图」。</li>' +
    '<li>页面顶部会给出<b>输入数据格式示例</b>，按示例格式整理数据即可；可点<b>下载模板</b>、<b>加载示例数据</b>，或直接把 Excel 里的表格复制粘贴到输入框。</li>' +
    '<li>设置参数后点<b>开始分析</b>，结果图与结果表均可导出 SVG / PNG / TSV。</li>' +
    '<li>左下角可切换<b>界面语言</b>（中文 / English）——界面文字与图内文字会一起切换，便于直接用于中英文论文投稿。</li>',
    '<li>Select a module from the left, e.g. “Venn diagram” or “Clustered heatmap”.</li>' +
    '<li>Each page shows <b>input format examples</b> at the top; arrange your data accordingly. Use <b>Download template</b>, <b>Load example data</b>, or paste a table copied from Excel.</li>' +
    '<li>Set the parameters and click <b>Run analysis</b>; figures and tables can be exported as SVG / PNG / TSV.</li>' +
    '<li>The bottom-left switch changes the <b>interface language</b> (Chinese / English) — UI text and figure text switch together, suitable for Chinese- or English-language manuscripts.</li>');

  reg('<span class="alert-dot"></span><span>所有计算均在浏览器本地完成，数据不会离开本机。' +
    '把整个文件夹复制到任意电脑、双击 <code>index.html</code> 即可离线使用（所有脚本均已本地内置，零外部依赖）。</span>',
    '<span class="alert-dot"></span><span>All computation runs in your browser; your data never leaves this machine. ' +
    'Copy the folder to any computer and double-click <code>index.html</code> to use it offline (all scripts are bundled locally, zero external dependencies).</span>');

  // 使用说明
  reg('数据格式、算法口径与注意事项。', 'Data formats, algorithms and caveats.');
  reg('界面语言（中文 / English）', 'Language (Chinese / English)');
  reg('通用输入方式', 'General input');
  reg('算法口径', 'Algorithms');
  reg('注意事项', 'Notes & caveats');
  reg('性能与限制', 'Performance & limits');
  reg('自检', 'Self-test');

  reg('<p>左侧栏底部提供<b>界面语言</b>切换，切换后整个页面（导航、标题、按钮、参数、说明）与图形内的坐标轴标题、图例、点标注、提示文字都会在中文与英文之间同步切换，' +
    '无需手动修改文字，导出的 SVG / PNG 可以直接放进中文或英文稿件。</p>' +
    '<ul>' +
    '<li>只翻译<b>固定的界面与图表文字</b>；基因名、样本名、分组名、通路名等来自数据的文字不会被改动。</li>' +
    '<li>切换语言时输入的数据会保留，并且会自动按新语言重算一次刚才的分析。</li>' +
    '<li>选择会被记住（浏览器本地存储），下次打开仍是上次的语言。</li>' +
    '</ul>',
    '<p>The bottom of the sidebar provides an <b>interface language</b> switch. It changes the whole page (navigation, titles, buttons, parameters, help text) and all figure text — axis titles, legends, point labels and tooltips — between Chinese and English together, ' +
    'so exported SVG / PNG files can be placed directly into Chinese- or English-language manuscripts.</p>' +
    '<ul>' +
    '<li>Only <b>fixed interface and figure text</b> is translated; gene names, sample names, group names and pathway names from your data are never changed.</li>' +
    '<li>Your input data is preserved when switching, and the last analysis is re-run automatically in the new language.</li>' +
    '<li>Your choice is remembered (browser local storage), so the next visit keeps the same language.</li>' +
    '</ul>');

  reg('<p>每个模块都支持三种输入方式，任选其一：</p>' +
    '<ul>' +
    '<li><b>粘贴</b>：从 Excel 直接选中区域复制，粘贴到文本框（制表符分隔会被自动识别）。</li>' +
    '<li><b>上传文件</b>：<code>.txt / .tsv / .csv / .gmt</code>，分隔符（Tab、逗号、分号、空格、竖线）会自动探测。</li>' +
    '<li><b>示例数据</b>：点右上角「加载示例数据」，可先用示例数据验证分析流程，再替换为自己的数据。</li>' +
    '</ul>' +
    '<p>表格要求：<b>第一行是列名</b>；以 <code>#</code> 或 <code>%</code> 开头的行会被当作注释跳过；缺失值可写 <code>NA / NaN / 空</code>。</p>',
    '<p>Every module accepts three input methods — use any one of them:</p>' +
    '<ul>' +
    '<li><b>Paste</b>: select a range in Excel and paste it into the text box (tab-delimited is detected automatically).</li>' +
    '<li><b>Upload</b>: <code>.txt / .tsv / .csv / .gmt</code>; the delimiter (tab, comma, semicolon, space, pipe) is detected automatically.</li>' +
    '<li><b>Demo data</b>: click “Load example data” at the top right to try the workflow before using your own data.</li>' +
    '</ul>' +
    '<p>Table requirements: <b>the first row holds column names</b>; lines starting with <code>#</code> or <code>%</code> are treated as comments; missing values may be written as <code>NA / NaN / empty</code>.</p>');

  reg('<ul>' +
    '<li><b>富集分析</b>：过表征分析（ORA），超几何检验（等价于 Fisher 精确检验单侧上尾）；<br>' +
    '　P 值 = P(X ≥ k)，其中 N=背景基因数、K=该基因集在背景中的基因数、n=输入基因数、k=交集基因数；<br>' +
    '　Fold enrichment（富集倍数）= (k/n) / (K/N)；Rich factor = k/K；Gene ratio = k/n；<br>' +
    '　多重检验校正默认 Benjamini–Hochberg（FDR），可选 Bonferroni / Holm / 不校正。</li>' +
    '<li><b>相关性</b>：Pearson（线性）、Spearman（秩）、Kendall tau-b（含并列校正）；<br>' +
    '　Pearson / Spearman 的 P 值用 t 近似（df = n−2）；Kendall 用正态近似；成对删失（pairwise complete）。</li>' +
    '<li><b>PCA</b>：对中心化（可选标准化）后的数据做协方差矩阵特征分解；样本数远小于变量数时建议勾选标准化。</li>' +
    '<li><b>聚类热图</b>：Z-score 标准化可选按行/按列；层次聚类支持 single / complete / average(UPGMA) / Ward.D2，距离支持欧氏、曼哈顿、最大距离、余弦、1−相关系数。</li>' +
    '<li><b>火山图</b>：阈值默认 |log2FC| ≥ 1、P ≤ 0.05；请使用原始 P 值还是校正后 padj 由你决定。</li>' +
    '<li><b>差异表达分析</b>：两组用 Welch t 检验（不假定方差相等）与 Wilcoxon 秩和检验（正态近似 + 并列校正 + 连续性校正）；' +
    '多组用单因素方差分析（F 检验）与 Kruskal-Wallis 检验（卡方近似）；<br>' +
    '　log2FC = 实验组均值 − 对照组均值（数据已取 log）；若为原始信号强度，则先对组均值取 log2 再相减；' +
    '多重检验校正可选 BH(FDR) / Bonferroni / Holm。</li>' +
    '<li><b>生存分析</b>：Kaplan-Meier 乘积极限估计；log-rank 检验统计量 X² = (O−E)′V⁻¹(O−E)，自由度 = 组数 − 1；<br>' +
    '　中位生存期 = 生存概率首次 ≤ 50% 的时间；95% 置信区间由 Greenwood 方差线性近似（±1.96·SE）。</li>' +
    '<li><b>ROC 与 AUC</b>：AUC 由 ROC 曲线梯形积分得到（等价于 Mann-Whitney U 统计量）；' +
    '最佳截断点取 Youden 指数（灵敏度 + 特异度 − 1）最大处；AUC 的 95% 置信区间由 Hanley-McNeil 近似给出。</li>' +
    '<li><b>序列与蛋白工具</b>：核酸侧给出反向互补、GC 含量、碱基组成、六框翻译、ORF（起始 ATG，终止 TAA/TAG/TGA）、密码子使用与 Tm；<br>' +
    '　蛋白侧给出分子量（平均残基质量 + 1 个水分子）、等电点（pKa 表 + 二分搜索）、氨基酸组成与 GRAVY（Kyte-Doolittle 标度）。</li>' +
    '<li><b>去重与唯一化</b>：支持整行去重、按关键列去重（保留首/末次出现）、按键列聚合（数值列取均值/最大/最小/求和/首值/计数）与提取唯一值列表。</li>' +
    '</ul>',
    '<ul>' +
    '<li><b>Enrichment</b>: over-representation analysis (ORA) with the hypergeometric test (equivalent to the one-sided upper tail of Fisher’s exact test);<br>' +
    '　P = P(X ≥ k), where N = background size, K = genes of the set in the background, n = input genes, k = overlap;<br>' +
    '　Fold enrichment = (k/n) / (K/N); Rich factor = k/K; Gene ratio = k/n;<br>' +
    '　Multiple-testing correction defaults to Benjamini–Hochberg (FDR); Bonferroni / Holm / none are also available.</li>' +
    '<li><b>Correlation</b>: Pearson (linear), Spearman (rank), Kendall tau-b (with tie correction);<br>' +
    '　Pearson / Spearman P values use a t approximation (df = n−2); Kendall uses a normal approximation; pairwise complete deletion.</li>' +
    '<li><b>PCA</b>: eigen-decomposition of the covariance matrix of centred (optionally standardised) data; standardisation is recommended when samples ≪ variables.</li>' +
    '<li><b>Clustered heatmap</b>: Z-score standardisation by row/column; hierarchical clustering supports single / complete / average (UPGMA) / Ward.D2, with Euclidean, Manhattan, maximum, cosine and 1 − correlation distances.</li>' +
    '<li><b>Volcano plot</b>: default thresholds |log2FC| ≥ 1 and P ≤ 0.05; use raw P or adjusted padj as you prefer.</li>' +
    '<li><b>Differential expression</b>: Welch t-test (unequal variances) and Wilcoxon rank-sum test (normal approximation with tie and continuity correction) for two groups; ' +
    'one-way ANOVA (F test) and Kruskal-Wallis test (chi-square approximation) for multiple groups;<br>' +
    '　log2FC = case mean − control mean on the log scale; for raw signal intensity the group means are log2-transformed first; ' +
    'multiple-testing correction options are BH (FDR) / Bonferroni / Holm.</li>' +
    '<li><b>Survival</b>: Kaplan-Meier product-limit estimator; the log-rank statistic is X² = (O−E)′V⁻¹(O−E) with df = number of groups − 1;<br>' +
    '　median survival is the first time the survival probability drops to ≤ 50%; 95% confidence intervals use a linear Greenwood approximation (±1.96·SE).</li>' +
    '<li><b>ROC &amp; AUC</b>: AUC is obtained by trapezoidal integration of the ROC curve (equivalent to the Mann-Whitney U statistic); ' +
    'the optimal cut-off maximises the Youden index (sensitivity + specificity − 1); the 95% CI of the AUC uses the Hanley-McNeil approximation.</li>' +
    '<li><b>Sequence toolkit</b>: for nucleic acids — reverse complement, GC content, base composition, six-frame translation, ORFs (ATG start, TAA/TAG/TGA stop), codon usage and Tm;<br>' +
    '　for proteins — molecular weight (average residue masses + one water molecule), isoelectric point (pKa table + bisection), amino-acid composition and GRAVY (Kyte-Doolittle scale).</li>' +
    '<li><b>Deduplicate &amp; unique</b>: remove identical rows, deduplicate by key columns (keep first/last), aggregate by key columns (mean/max/min/sum/first/count on numeric columns), or extract the unique values of one column.</li>' +
    '</ul>');

  reg('<ul>' +
    '<li><b>基因集来源</b>：富集分析需要基因集注释。<br>' +
    '　① 上传本地 <code>.gmt</code> 文件（推荐，来源与版本完全可控）；<br>' +
    '　② 在线获取 Enrichr 基因集库（需联网，会缓存到浏览器本地）；<br>' +
    '　③ 使用内置示例基因集——<b>仅为功能演示</b>，不是完整通路库，不可用于正式分析。</li>' +
    '<li><b>背景基因集</b>：不填时默认用所选基因集库的全部基因为背景。若实验仅检测了部分基因（如靶向 panel），请填写真实背景，否则 P 值会偏小。</li>' +
    '<li><b>统计显著 ≠ 生物学显著</b>：请结合效应量（富集倍数、相关系数）与实验设计综合判断。</li>' +
    '<li>结果图建议导出 <b>SVG</b> 后到 Illustrator / Inkscape 中排版；PNG 导出为 2 倍分辨率。</li>' +
    '<li><b>差异表达的信噪比</b>：每组样本数过少（如每组 2–3 例）时 t 检验与 Wilcoxon 的检验效能都很低；建议每组至少 3 例，并优先报告效应量（log2FC）而不只看 P 值。</li>' +
    '<li><b>生存分析的前提</b>：要求删失与事件相互独立（非信息性删失）；若失访与预后相关，KM 曲线会有偏倚。中位生存期只在随访期内生存概率降到 50% 以下时才有定义。</li>' +
    '<li><b>ROC 的判别方向</b>：请确认分数越高还是越低代表阳性，方向设反会使 AUC 变为 1 − AUC。多个标记物的 AUC 直接比较存在抽样误差，必要时做 DeLong 检验。</li>' +
    '<li><b>序列工具的适用范围</b>：Tm 为经验公式粗估，未考虑盐浓度与最近邻热力学参数，不能替代引物设计软件；等电点基于常用 pKa 表，不同算法结果可能有差异。</li>' +
    '</ul>',
    '<ul>' +
    '<li><b>Gene-set source</b>: enrichment needs gene-set annotations.<br>' +
    '　① Upload a local <code>.gmt</code> file (recommended — full control over source and version);<br>' +
    '　② Fetch an Enrichr library online (requires internet; cached locally in the browser);<br>' +
    '　③ Use the built-in example gene sets — <b>for demonstration only</b>, not a complete pathway library; do not use for real analysis.</li>' +
    '<li><b>Background gene set</b>: if left blank, all genes in the chosen library are used as background. If your assay only measured a subset of genes (e.g. a targeted panel), provide the true background, otherwise P values will be too small.</li>' +
    '<li><b>Statistical significance ≠ biological significance</b>: judge together with effect size (fold enrichment, correlation) and the experimental design.</li>' +
    '<li>Export figures as <b>SVG</b> for layout in Illustrator / Inkscape; PNG export is at 2× resolution.</li>' +
    '<li><b>Signal-to-noise in differential expression</b>: with very small groups (e.g. 2–3 samples each) both the t-test and Wilcoxon have low power; we suggest at least 3 per group and reporting effect sizes (log2FC) rather than P values alone.</li>' +
    '<li><b>Assumptions of survival analysis</b>: censoring must be independent of the event (non-informative censoring); if dropout is related to prognosis the KM curves are biased. The median is defined only if survival falls below 50% within follow-up.</li>' +
    '<li><b>Direction in ROC</b>: confirm whether higher or lower scores indicate positivity — reversing the direction turns the AUC into 1 − AUC. Comparing AUCs across markers is subject to sampling error; use a DeLong test when it matters.</li>' +
    '<li><b>Scope of the sequence toolkit</b>: Tm is a rough empirical estimate that ignores salt concentration and nearest-neighbour thermodynamics and does not replace primer-design software; the isoelectric point uses a common pKa table and may differ between implementations.</li>' +
    '</ul>');

  reg('<ul>' +
    '<li>UpSet 图会枚举全部非空交集组合，集合数建议 ≤ 8、单个集合元素数 ≤ 5000。</li>' +
    '<li>聚类热图对行列数敏感，行数建议 ≤ 500（复杂度约 O(n³)）。</li>' +
    '<li>相关性矩阵为 O(p²·n)，变量数建议 ≤ 60。</li>' +
    '<li>浏览器内存有限，单个文件建议 &lt; 20 MB；超大表格请先预处理。</li>' +
    '<li>差异表达分析对每个基因同时计算参数与非参数检验，基因数建议 ≤ 20000；超过 5000 个基因时不绘制箱线图以节省内存。</li>' +
    '<li>ROC 分析的计算量与「样本数 × 标记物数」成正比，标记物建议 ≤ 50 个。</li>' +
    '<li>序列工具可一次处理数百条序列；超长序列（&gt; 10 Mb）请先切分。</li>' +
    '</ul>',
    '<ul>' +
    '<li>The UpSet plot enumerates all non-empty intersection combinations; we suggest ≤ 8 sets and ≤ 5000 elements per set.</li>' +
    '<li>The clustered heatmap is sensitive to the number of rows/columns; we suggest ≤ 500 rows (complexity ≈ O(n³)).</li>' +
    '<li>The correlation matrix is O(p²·n); we suggest ≤ 60 variables.</li>' +
    '<li>Browser memory is limited; keep individual files &lt; 20 MB and pre-process very large tables.</li>' +
    '<li>Differential expression runs both a parametric and a non-parametric test per gene; we suggest ≤ 20000 genes. Above 5000 genes the box plot is skipped to save memory.</li>' +
    '<li>ROC analysis scales with (samples × markers); we suggest ≤ 50 markers.</li>' +
    '<li>The sequence toolkit handles hundreds of sequences at once; split very long sequences (&gt; 10 Mb) first.</li>' +
    '</ul>');

  reg('<p>页面内置了一套自动化自检（统计内核数值验证、数据解析、十二个模块端到端运行）。' +
    '如果你修改过代码或怀疑浏览器兼容问题，可打开 <code><a href="selftest.html" target="_blank">selftest.html</a></code> 查看结果：' +
    '标题栏会显示 <code>pass / fail / err</code> 计数，全部通过时应为 <code>fail=0 err=0</code>。</p>',
    '<p>The page ships with an automated self-test (numerical checks of the statistics core, data parsing, and end-to-end runs of all twelve modules). ' +
    'If you have modified the code or suspect a browser-compatibility issue, open <code><a href="selftest.html" target="_blank">selftest.html</a></code> to see the result: ' +
    'the title bar shows the <code>pass / fail / err</code> counts, which should read <code>fail=0 err=0</code> when everything passes.</p>');

  /* ------------------------- 静态元素（index.html） ----------------------- */

  /** 把带 data-i18n 的元素按当前语言重写文本，首次运行时缓存中文原文 */
  function applyStaticI18n() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.hasAttribute('data-zh')) n.setAttribute('data-zh', n.textContent.trim());
      var zh = n.getAttribute('data-zh');
      n.textContent = WB.t(zh);
    }
    document.documentElement.setAttribute('lang', WB.i18n.getLang() === 'en' ? 'en' : 'zh-CN');
    document.title = WB.i18n.getLang() === 'en'
      ? 'Bioinformatics Studio · Venn / Enrichment / UpSet / Correlation / PCA / Volcano / Heatmap / DiffExp / Survival / ROC / Sequence'
      : '生物信息学在线分析平台 · Venn / 富集 / UpSet / 相关性 / PCA / 火山图 / 热图 / 差异 / 生存 / ROC / 序列';
  }

  /* ------------------------------- 导航 --------------------------------- */

  var GROUPS = [
    { name: '集合分析', ids: ['venn', 'upset'] },
    { name: '功能富集', ids: ['enrichment'] },
    { name: '关系与降维', ids: ['correlation', 'pca', 'heatmap'] },
    { name: '差异与统计', ids: ['volcano', 'diffexp', 'survival', 'roc'] },
    { name: '序列与数据', ids: ['sequence', 'unique'] }
  ];

  function buildNav() {
    var nav = WB.$('#nav');
    WB.clear(nav);
    nav.appendChild(navItem({ id: 'home', name: WB.t('首页 / 概览'), icon: '⌂' }));
    GROUPS.forEach(function (grp) {
      nav.appendChild(el('div.nav-group', { text: WB.t(grp.name) }));
      grp.ids.forEach(function (id) {
        var t = WB.tools[id];
        if (t) nav.appendChild(navItem({ id: id, name: WB.t(t.name), icon: t.icon || '◇' }));
      });
    });
    nav.appendChild(el('div.nav-group', { text: WB.t('说明') }));
    nav.appendChild(navItem({ id: 'about', name: WB.t('使用说明'), icon: '?' }));
  }

  function navItem(cfg) {
    var node = el('div.nav-item', { 'data-id': cfg.id }, [
      el('span', { text: cfg.name })
    ]);
    node.addEventListener('click', function () { location.hash = '#/' + cfg.id; });
    return node;
  }

  function setActive(id) {
    WB.$$('.nav-item').forEach(function (n) {
      n.classList.toggle('active', n.getAttribute('data-id') === id);
    });
  }

  /* -------------------------- 界面语言切换 ------------------------------- */

  function initLangSwitch() {
    var box = WB.$('#lang-switch');
    if (!box) return;

    function sync() {
      var cur = WB.i18n.getLang();
      WB.$$('button', box).forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-lang') === cur);
      });
    }
    box.addEventListener('click', function (e) {
      var b = e.target;
      while (b && b !== box && !b.getAttribute('data-lang')) b = b.parentNode;
      if (!b || b === box) return;
      WB.i18n.setLang(b.getAttribute('data-lang'));
    });
    sync();

    // 切换语言后：保持输入数据不动，重绘导航与当前页面；若刚才出过图则自动重算一次
    window.addEventListener('wb:lang', function () {
      sync();
      applyStaticI18n();
      buildNav();
      var rerun = WB._lastRunFn;
      route();
      if (rerun) {
        WB._lastRunFn = rerun;
        try { rerun(); } catch (e) { /* 重绘失败不影响切换 */ }
      }
    });
  }

  /* ------------------------------- 首页 --------------------------------- */

  function renderHome(main) {
    main.appendChild(el('div.page-head.home-head', [
      el('img.home-logo', { src: 'assets/img/logo-mark.png', alt: 'Bioinformatics Studio' }),
      el('div.home-head-text', [
        el('h1', { text: WB.t('生物信息学在线分析平台') }),
        el('p', { text: WB.t('集合 / 富集 / 相关性 / 降维 / 差异 / 聚类 / 统计检验 / 生存分析 / 序列常用分析工具；全部计算在浏览器本地完成，数据不上传，无需联网即可使用。') })
      ])
    ]));

    var cards = el('div.home-grid');
    (WB.toolOrder || []).forEach(function (id) {
      var t = WB.tools[id];
      var c = el('div.home-card', [
        el('h3', { text: WB.t(t.name) }),
        el('p', { text: WB.t(t.desc) }),
        el('div.hc-tags', (t.tags || []).map(function (tg) { return el('span.tag', { text: WB.t(tg) }); }))
      ]);
      c.addEventListener('click', function () { location.hash = '#/' + id; });
      cards.appendChild(c);
    });
    main.appendChild(cards);

    var info = WB.ui.card(WB.t('使用步骤'));
    var body = info.querySelector('.card-body');
    body.appendChild(el('ol.steps', {
      html: WB.t('<li>左侧选择需要的分析模块，例如「韦恩图」或「聚类热图」。</li>' +
        '<li>页面顶部会给出<b>输入数据格式示例</b>，按示例格式整理数据即可；可点<b>下载模板</b>、<b>加载示例数据</b>，或直接把 Excel 里的表格复制粘贴到输入框。</li>' +
        '<li>设置参数后点<b>开始分析</b>，结果图与结果表均可导出 SVG / PNG / TSV。</li>' +
        '<li>左下角可切换<b>界面语言</b>（中文 / English）——界面文字与图内文字会一起切换，便于直接用于中英文论文投稿。</li>')
    }));
    body.appendChild(el('div.alert.alert-info', {
      html: WB.t('<span class="alert-dot"></span><span>所有计算均在浏览器本地完成，数据不会离开本机。' +
        '把整个文件夹复制到任意电脑、双击 <code>index.html</code> 即可离线使用（所有脚本均已本地内置，零外部依赖）。</span>')
    }));
    main.appendChild(info);
  }

  /* ------------------------------ 使用说明 ------------------------------- */

  function renderAbout(main) {
    main.appendChild(el('div.page-head', [
      el('h1', { text: WB.t('使用说明') }),
      el('p', { text: WB.t('数据格式、算法口径与注意事项。') })
    ]));

    function doc(zhHtml) {
      var d = el('div.doc');
      d.innerHTML = WB.t(zhHtml);
      return d;
    }

    var c0 = WB.ui.card(WB.t('界面语言（中文 / English）'));
    c0.querySelector('.card-body').appendChild(doc(
      '<p>左侧栏底部提供<b>界面语言</b>切换，切换后整个页面（导航、标题、按钮、参数、说明）与图形内的坐标轴标题、图例、点标注、提示文字都会在中文与英文之间同步切换，' +
      '无需手动修改文字，导出的 SVG / PNG 可以直接放进中文或英文稿件。</p>' +
      '<ul>' +
      '<li>只翻译<b>固定的界面与图表文字</b>；基因名、样本名、分组名、通路名等来自数据的文字不会被改动。</li>' +
      '<li>切换语言时输入的数据会保留，并且会自动按新语言重算一次刚才的分析。</li>' +
      '<li>选择会被记住（浏览器本地存储），下次打开仍是上次的语言。</li>' +
      '</ul>'));
    main.appendChild(c0);

    var c1 = WB.ui.card(WB.t('通用输入方式'));
    c1.querySelector('.card-body').appendChild(doc(
      '<p>每个模块都支持三种输入方式，任选其一：</p>' +
      '<ul>' +
      '<li><b>粘贴</b>：从 Excel 直接选中区域复制，粘贴到文本框（制表符分隔会被自动识别）。</li>' +
      '<li><b>上传文件</b>：<code>.txt / .tsv / .csv / .gmt</code>，分隔符（Tab、逗号、分号、空格、竖线）会自动探测。</li>' +
      '<li><b>示例数据</b>：点右上角「加载示例数据」，可先用示例数据验证分析流程，再替换为自己的数据。</li>' +
      '</ul>' +
      '<p>表格要求：<b>第一行是列名</b>；以 <code>#</code> 或 <code>%</code> 开头的行会被当作注释跳过；缺失值可写 <code>NA / NaN / 空</code>。</p>'));
    main.appendChild(c1);

    var c2 = WB.ui.card(WB.t('算法口径'));
    c2.querySelector('.card-body').appendChild(doc(
      '<ul>' +
      '<li><b>富集分析</b>：过表征分析（ORA），超几何检验（等价于 Fisher 精确检验单侧上尾）；<br>' +
      '　P 值 = P(X ≥ k)，其中 N=背景基因数、K=该基因集在背景中的基因数、n=输入基因数、k=交集基因数；<br>' +
      '　Fold enrichment（富集倍数）= (k/n) / (K/N)；Rich factor = k/K；Gene ratio = k/n；<br>' +
      '　多重检验校正默认 Benjamini–Hochberg（FDR），可选 Bonferroni / Holm / 不校正。</li>' +
      '<li><b>相关性</b>：Pearson（线性）、Spearman（秩）、Kendall tau-b（含并列校正）；<br>' +
      '　Pearson / Spearman 的 P 值用 t 近似（df = n−2）；Kendall 用正态近似；成对删失（pairwise complete）。</li>' +
      '<li><b>PCA</b>：对中心化（可选标准化）后的数据做协方差矩阵特征分解；样本数远小于变量数时建议勾选标准化。</li>' +
      '<li><b>聚类热图</b>：Z-score 标准化可选按行/按列；层次聚类支持 single / complete / average(UPGMA) / Ward.D2，距离支持欧氏、曼哈顿、最大距离、余弦、1−相关系数。</li>' +
      '<li><b>火山图</b>：阈值默认 |log2FC| ≥ 1、P ≤ 0.05；请使用原始 P 值还是校正后 padj 由你决定。</li>' +
      '<li><b>差异表达分析</b>：两组用 Welch t 检验（不假定方差相等）与 Wilcoxon 秩和检验（正态近似 + 并列校正 + 连续性校正）；' +
      '多组用单因素方差分析（F 检验）与 Kruskal-Wallis 检验（卡方近似）；<br>' +
      '　log2FC = 实验组均值 − 对照组均值（数据已取 log）；若为原始信号强度，则先对组均值取 log2 再相减；' +
      '多重检验校正可选 BH(FDR) / Bonferroni / Holm。</li>' +
      '<li><b>生存分析</b>：Kaplan-Meier 乘积极限估计；log-rank 检验统计量 X² = (O−E)′V⁻¹(O−E)，自由度 = 组数 − 1；<br>' +
      '　中位生存期 = 生存概率首次 ≤ 50% 的时间；95% 置信区间由 Greenwood 方差线性近似（±1.96·SE）。</li>' +
      '<li><b>ROC 与 AUC</b>：AUC 由 ROC 曲线梯形积分得到（等价于 Mann-Whitney U 统计量）；' +
      '最佳截断点取 Youden 指数（灵敏度 + 特异度 − 1）最大处；AUC 的 95% 置信区间由 Hanley-McNeil 近似给出。</li>' +
      '<li><b>序列与蛋白工具</b>：核酸侧给出反向互补、GC 含量、碱基组成、六框翻译、ORF（起始 ATG，终止 TAA/TAG/TGA）、密码子使用与 Tm；<br>' +
      '　蛋白侧给出分子量（平均残基质量 + 1 个水分子）、等电点（pKa 表 + 二分搜索）、氨基酸组成与 GRAVY（Kyte-Doolittle 标度）。</li>' +
      '<li><b>去重与唯一化</b>：支持整行去重、按关键列去重（保留首/末次出现）、按键列聚合（数值列取均值/最大/最小/求和/首值/计数）与提取唯一值列表。</li>' +
      '</ul>'));
    main.appendChild(c2);

    var c3 = WB.ui.card(WB.t('注意事项'));
    c3.querySelector('.card-body').appendChild(doc(
      '<ul>' +
      '<li><b>基因集来源</b>：富集分析需要基因集注释。<br>' +
      '　① 上传本地 <code>.gmt</code> 文件（推荐，来源与版本完全可控）；<br>' +
      '　② 在线获取 Enrichr 基因集库（需联网，会缓存到浏览器本地）；<br>' +
      '　③ 使用内置示例基因集——<b>仅为功能演示</b>，不是完整通路库，不可用于正式分析。</li>' +
      '<li><b>背景基因集</b>：不填时默认用所选基因集库的全部基因为背景。若实验仅检测了部分基因（如靶向 panel），请填写真实背景，否则 P 值会偏小。</li>' +
      '<li><b>统计显著 ≠ 生物学显著</b>：请结合效应量（富集倍数、相关系数）与实验设计综合判断。</li>' +
      '<li>结果图建议导出 <b>SVG</b> 后到 Illustrator / Inkscape 中排版；PNG 导出为 2 倍分辨率。</li>' +
      '<li><b>差异表达的信噪比</b>：每组样本数过少（如每组 2–3 例）时 t 检验与 Wilcoxon 的检验效能都很低；建议每组至少 3 例，并优先报告效应量（log2FC）而不只看 P 值。</li>' +
      '<li><b>生存分析的前提</b>：要求删失与事件相互独立（非信息性删失）；若失访与预后相关，KM 曲线会有偏倚。中位生存期只在随访期内生存概率降到 50% 以下时才有定义。</li>' +
      '<li><b>ROC 的判别方向</b>：请确认分数越高还是越低代表阳性，方向设反会使 AUC 变为 1 − AUC。多个标记物的 AUC 直接比较存在抽样误差，必要时做 DeLong 检验。</li>' +
      '<li><b>序列工具的适用范围</b>：Tm 为经验公式粗估，未考虑盐浓度与最近邻热力学参数，不能替代引物设计软件；等电点基于常用 pKa 表，不同算法结果可能有差异。</li>' +
      '</ul>'));
    main.appendChild(c3);

    var c4 = WB.ui.card(WB.t('性能与限制'));
    c4.querySelector('.card-body').appendChild(doc(
      '<ul>' +
      '<li>UpSet 图会枚举全部非空交集组合，集合数建议 ≤ 8、单个集合元素数 ≤ 5000。</li>' +
      '<li>聚类热图对行列数敏感，行数建议 ≤ 500（复杂度约 O(n³)）。</li>' +
      '<li>相关性矩阵为 O(p²·n)，变量数建议 ≤ 60。</li>' +
      '<li>浏览器内存有限，单个文件建议 &lt; 20 MB；超大表格请先预处理。</li>' +
      '<li>差异表达分析对每个基因同时计算参数与非参数检验，基因数建议 ≤ 20000；超过 5000 个基因时不绘制箱线图以节省内存。</li>' +
      '<li>ROC 分析的计算量与「样本数 × 标记物数」成正比，标记物建议 ≤ 50 个。</li>' +
      '<li>序列工具可一次处理数百条序列；超长序列（&gt; 10 Mb）请先切分。</li>' +
      '</ul>'));
    main.appendChild(c4);

    var c5 = WB.ui.card(WB.t('自检'));
    c5.querySelector('.card-body').appendChild(doc(
      '<p>页面内置了一套自动化自检（统计内核数值验证、数据解析、十二个模块端到端运行）。' +
      '如果你修改过代码或怀疑浏览器兼容问题，可打开 <code><a href="selftest.html" target="_blank">selftest.html</a></code> 查看结果：' +
      '标题栏会显示 <code>pass / fail / err</code> 计数，全部通过时应为 <code>fail=0 err=0</code>。</p>'));
    main.appendChild(c5);
  }

  /* ------------------------------- 路由 --------------------------------- */

  function route() {
    var hash = (location.hash || '').replace(/^#\/?/, '') || 'home';
    var main = WB.$('#main');
    WB.clear(main);
    WB.plot.tipHide();
    WB._lastRunFn = null;
    var tool = WB.tools[hash];
    if (hash === 'home' || hash === '') { setActive('home'); renderHome(main); }
    else if (hash === 'about') { setActive('about'); renderAbout(main); }
    else if (tool) {
      setActive(hash);
      if (tool.render) tool.render(main);
      else main.appendChild(el('div.empty-state', { text: WB.t('该模块尚未实现') }));
    } else {
      setActive('home'); renderHome(main);
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  window.addEventListener('hashchange', route);
  WB.route = route;
  /** 跳转到某模块（若 hash 未变化则主动触发一次渲染，避免双重渲染） */
  WB.go = function (id) {
    var target = '#/' + id;
    if (location.hash === target) route();
    else location.hash = target;
  };
  document.addEventListener('DOMContentLoaded', function () {
    applyStaticI18n(); buildNav(); initLangSwitch(); route();
  });
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    applyStaticI18n(); buildNav(); initLangSwitch(); route();
  }
})(window);
