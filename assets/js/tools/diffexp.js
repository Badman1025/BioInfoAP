/* =============================================================================
 * tools/diffexp.js  —  差异表达分析（两组之间比较）
 *
 *   检验：Welch t 检验（参数法，不假定方差相等）/ Wilcoxon 秩和检验（非参数法）
 *   多组矩阵：先明确选定「对照组」与「实验组」两个分组，其余分组的样本不参与统计
 *   数据尺度：log2 值 / 原始信号强度（逐值 log2(x+1)）/
 *             RNA-seq 原始计数（CPM 归一化后取 log2）/ 自动识别
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块元信息 */
    '比较两组之间的基因表达水平：Welch t 检验（参数法）或 Wilcoxon 秩和检验（非参数法）；支持自动识别 / log2 值 / 原始信号强度 / RNA-seq 原始计数四种数据尺度；输出差异倍数、统计量、P 值与 FDR，并绘制分组箱线图。':
      'Compare gene expression between two groups: Welch t-test (parametric) or Wilcoxon rank-sum test (non-parametric). Four data scales are supported — auto-detect / log2 values / raw signal intensity / raw RNA-seq counts. Outputs fold change, test statistic, P value and FDR, plus grouped box plots.',
    '差异表达': 'Differential expression',
    '两组比较': 'Two-group comparison',
    '非参数检验': 'Non-parametric test',
    'FDR 校正': 'FDR correction',
    '箱线图': 'Box plot',

    /* 输入格式 */
    '表达矩阵 + 分组注释': 'Expression matrix + group annotation',
    '计数矩阵（RNA-seq 原始计数）': 'Count matrix (RNA-seq raw counts)',
    ['<b>表达矩阵</b>：第一行为样本名，第一列为基因名，其余单元格为表达量；行是基因、列是样本。' +
      '基因名重复时仅保留第一次出现的行。<b>分组信息在下方「样本分组」中单独填写</b>（每行「样本名 <TAB> 分组名」）。']:
      '<b>Expression matrix</b>: the first row holds sample names, the first column holds gene names and the remaining cells hold expression values; rows are genes and columns are samples. ' +
      'If a gene name appears more than once, only the first occurrence is kept. <b>Group information is entered separately in the “Sample groups” box below</b> (one “sample <TAB> group” pair per line).',
    ['第一行为样本名、第一列为基因名，单元格为<b>非负整数计数</b>（如 featureCounts / HTSeq / RSEM 的 expected_count）。' +
      '计数矩阵请把「数据尺度」设为<b>RNA-seq 原始计数</b>：程序先按样本文库大小归一化为 CPM，再取 log2(CPM+1) 后做检验，避免测序深度差异造成的假阳性。']:
      'The first row holds sample names, the first column holds gene names and the cells hold <b>non-negative integer counts</b> (e.g. featureCounts / HTSeq / RSEM expected_count). ' +
      'For count matrices set “Data scale” to <b>RNA-seq raw counts</b>: values are normalised to CPM per library, log2(CPM+1)-transformed, and then tested, which avoids false positives caused by differences in sequencing depth.',
    '表达矩阵的每一行是一个基因、每一列是一个样本；请确保样本名与分组信息中的名称完全一致。':
      'Each row of the matrix is a gene and each column a sample; sample names must match those in the group annotation exactly.',
    '分组信息填写示例': 'Group annotation example',
    '样本分组（填入下方「样本分组」框）：': 'Sample groups (enter into the “Sample groups” box below):',

    /* 页头 */
    '差异表达分析': 'Differential expression analysis',
    '比较选定的两个分组之间的基因表达：默认用 Welch t 检验（不假定方差相等），也可改用 Wilcoxon 秩和检验；结果包含 log₂FC、统计量、P 值与 FDR，并给出分组箱线图。':
      'Compares gene expression between the two selected groups: the Welch t-test (unequal variances) is used by default, switchable to the Wilcoxon rank-sum test; results include log₂FC, test statistic, P value and FDR, together with grouped box plots.',
    '本模块只做两组之间的比较。若矩阵含多个分组，请在「对照组 / 实验组」中明确指出要比较的两个分组，其余分组的样本会被排除。':
      'This module compares two groups only. If the matrix contains more than two groups, name the two groups to compare in “Control group” / “Case group”; samples of the remaining groups are excluded.',

    /* 输入区 */
    '输入表达矩阵': 'Input expression matrix',
    '分析设置': 'Analysis settings',
    '检验方法（决定显著性）': 'Test used for significance',
    '参数法（Welch t 检验）': 'Parametric (Welch t-test)',
    '非参数法（Wilcoxon 秩和检验）': 'Non-parametric (Wilcoxon rank-sum test)',
    '对照组名称（必填）': 'Control group (required)',
    '实验组名称（必填）': 'Case group (required)',
    '请填写矩阵中已存在的分组名，例如 Control / Treatment；留空时自动依次取第 1、2 个分组。':
      'Give a group name that exists in the annotation, e.g. Control / Treatment; if left blank, the first and second detected groups are used.',
    '数据尺度': 'Data scale',
    '自动识别（推荐）': 'Auto-detect (recommended)',
    '已是 log 值（如 log2 表达量）': 'Already log-transformed (e.g. log2 expression)',
    '原始信号强度（逐值取 log2(x+1)）': 'Raw signal intensity (log2(x+1) per value)',
    'RNA-seq 原始计数（CPM 归一化后取 log2）': 'RNA-seq raw counts (CPM-normalised, then log2)',
    '多重检验校正': 'Multiple-testing correction',
    'Benjamini-Hochberg (FDR)': 'Benjamini-Hochberg (FDR)',
    'Bonferroni': 'Bonferroni',
    'Holm': 'Holm',
    '不校正': 'No correction',
    'P 值阈值': 'P-value threshold',
    '|log2FC| 阈值': '|log2FC| threshold',
    '箱线图展示基因数（最显著）': 'Genes shown in box plot (most significant)',
    '绘制箱线图': 'Draw box plots',
    '运行差异分析': 'Run differential analysis',

    /* 额外输入区 */
    '样本分组（必填）': 'Sample groups (required)',
    '样本名与矩阵列名必须完全一致；每行一组「样本名 <TAB> 分组名」，也可只写一行表头按列顺序给出分组名。':
      'Sample names must match the matrix column names exactly; write one “sample <TAB> group” pair per line, or a single header row giving group names in column order.',
    ['每行「样本名 <TAB> 分组名」：\nC1\tControl\nC2\tControl\nT1\tTreatment\nT2\tTreatment\n\n也可以只写一行，按矩阵的列顺序给出分组名：\nGroup\tControl\tControl\tControl\tTreatment\tTreatment\tTreatment']:
      'One “sample <TAB> group” pair per line:\nC1\tControl\nC2\tControl\nT1\tTreatment\nT2\tTreatment\n\nAlternatively, write a single row giving group names in matrix column order:\nGroup\tControl\tControl\tControl\tTreatment\tTreatment\tTreatment',
    '插入示例分组': 'Insert example groups',
    '已插入示例分组信息': 'Example group annotation inserted',
    '未解析到有效的表达矩阵': 'No valid expression matrix was parsed',
    '请提供样本分组信息（每行「样本名 <TAB> 分组名」）':
      'Please provide sample group information (one “sample <TAB> group” pair per line)',
    '以下样本在分组信息中缺失：{list}': 'These samples are missing from the group annotation: {list}',
    '基因数过多（{n}），请先按表达量或方差筛选后再分析（建议 ≤ 20000 个基因）。':
      'Too many genes ({n}); filter by expression or variance first (we suggest ≤ 20000 genes).',
    '需要至少两个可用分组、且每组至少 2 个样本。当前可用分组：{list}':
      'At least two usable groups with ≥ 2 samples each are required. Usable groups: {list}',
    '对照组「{a}」与实验组「{b}」不能相同。': 'The control group “{a}” and the case group “{b}” must differ.',
    '分组 {list} 的样本数不足 2 个，已排除。': 'Groups {list} have fewer than 2 samples and were excluded.',
    '计数矩阵中出现了负值，请确认「数据尺度」是否选错。':
      'Negative values found in a count matrix — please check the “Data scale” setting.',
    '某个样本的计数总和为 0，无法做 CPM 归一化，请检查该样本列。':
      'The total count of one sample is 0, so CPM normalisation is impossible — please check that column.',

    /* 统计条与提示 */
    '基因数': 'Genes',
    '参与比较的样本数': 'Samples compared',
    '检出分组数': 'Groups detected',
    '显著基因': 'Significant genes',
    '检验方法': 'Test',
    '对照组': 'Control',
    '实验组': 'Case',
    '数据已重复的基因名仅保留首次出现': 'Duplicate gene names: first occurrence kept',
    '设计：<b>{design}</b>；显著性检验采用 <b>{test}</b>；多重检验校正：<b>{adj}</b>；阈值 padj ≤ <b>{pc}</b>{fc}。':
      'Design: <b>{design}</b>; significance test: <b>{test}</b>; multiple-testing correction: <b>{adj}</b>; thresholds padj ≤ <b>{pc}</b>{fc}.',
    '，且 |log2FC| ≥ <b>{f}</b>': ', and |log2FC| ≥ <b>{f}</b>',
    '：{a} vs {b}': ': {a} vs {b}',
    'Welch t 检验': 'Welch t-test',
    'Wilcoxon 秩和检验': 'Wilcoxon rank-sum test',
    'Benjamini-Hochberg（FDR）': 'Benjamini-Hochberg (FDR)',
    'Bonferroni 校正': 'Bonferroni',
    'Holm 校正': 'Holm',
    '未校正（原始 P 值）': 'None (raw P values)',
    '矩阵共识别出 {all} 个分组（{names}），本次仅比较其中两组；未参与比较的 {drop} 个样本已被排除。':
      'The annotation defines {all} groups ({names}); only two of them are compared here, so {drop} sample(s) outside these groups were excluded.',
    '名称为「{u}」的分组不存在，已改按分组信息中出现的顺序选取：对照组 = {a}，实验组 = {b}。':
      'The group “{u}” does not exist; the first two groups in the annotation were used instead: control = {a}, case = {b}.',

    /* 数据尺度说明 */
    '数据尺度：<b>{scale}</b>。':
      'Data scale: <b>{scale}</b>.',
    '已按样本文库大小归一化为 CPM，并取 log₂(CPM+1) 后再做统计；log₂FC = 组间均值差。':
      'Values were normalised to CPM per library and log₂(CPM+1)-transformed before testing; log₂FC = difference of group means on this scale.',
    '已逐值取 log₂(x+1) 后再做统计（检验与差异倍数使用同一尺度）。':
      'Each value was log₂(x+1)-transformed before testing (test and fold change use the same scale).',
    '数据按 log₂ 尺度直接使用，未做任何变换；请确认输入确为对数化后的数值。':
      'Values were used directly on the log₂ scale without further transformation; please confirm the input is already log-transformed.',
    '计数矩阵的组间比较在 log₂-CPM 尺度上用 t 检验，相当于 limma-trend 的近似；若需负二项模型的精确检验，建议再用 DESeq2 / edgeR 复核。':
      'Count data are compared with a t-test on the log₂-CPM scale, which approximates limma-trend; for an exact negative-binomial test, cross-check with DESeq2 / edgeR.',
    '自动识别的依据：所有数值均为非负整数，最大值 {mx}。如判断有误，请手动指定「数据尺度」。':
      'Auto-detection: all values are non-negative integers, maximum {mx}. If this is wrong, set “Data scale” manually.',
    '自动识别：数据不是全为非负整数，更接近对数化后的数值，因此按 log₂ 值直接使用；若原始数据为荧光强度等线性尺度，请手动改为「原始信号强度」。':
      'Auto-detection: the values are not all non-negative integers and look log-transformed, so they are used on the log₂ scale directly; if the data are linear-scale intensities, set “Raw signal intensity” manually.',
    'log₂(信号强度+1)': 'log₂(signal intensity+1)',
    '各样本文库大小差异较大（最大 / 最小 = {r} 倍），已用 CPM 归一化校正测序深度。':
      'Library sizes differ substantially between samples (max / min = {r}×); CPM normalisation corrected for sequencing depth.',
    '数据形如非负整数（可能是计数矩阵），但当前「数据尺度」按 log₂ 值处理。若这是 RNA-seq 原始计数，请改为「RNA-seq 原始计数」。':
      'The values look like non-negative integers (possibly a count matrix) but the current data scale treats them as log₂ values. If these are raw RNA-seq counts, choose “RNA-seq raw counts”.',

    /* 结果卡片 */
    '分组箱线图（最显著 {n} 个基因）': 'Grouped box plots (top {n} genes)',
    '差异表达结果表（按 P 值排序）': 'Differential expression table (sorted by P)',
    '基因': 'Gene',
    '统计量': 'Statistic',
    'P 值': 'P value',
    '显著性': 'Significance',
    '上调': 'Up',
    '下调': 'Down',
    '不显著': 'Not significant',
    '表达量': 'Expression',
    '均值': 'mean',
    '表中标红的行为通过阈值的显著差异基因（padj ≤ {pc}{fc}）。可分页查看，或点右上角「导出 TSV」保存全部结果；把显著基因名复制出来即可做富集分析。':
      'Highlighted rows pass the thresholds (padj ≤ {pc}{fc}). Page through the table, or use “Export TSV” at the top right to save all results; copy the significant gene names for enrichment analysis.',
    '数据量较大（{n} 个基因），箱线图仅按全部基因统计结果绘制最显著的部分；表格为全部基因。':
      'Large dataset ({n} genes): the box plot shows only the most significant genes, while the table contains all genes.',
    '平均值：': 'Mean: ',
    '中位数：': 'Median: ',
    '四分位距：': 'IQR: ',
    '样本数：': 'n = ',
    '对照组为 {a}（n = {na}），实验组为 {b}（n = {nb}）；log₂FC = 实验组均值 − 对照组均值，检验与差异倍数都在同一变换后的尺度上计算。':
      'Control = {a} (n = {na}), case = {b} (n = {nb}); log₂FC = case mean − control mean, and both the test and the fold change use the same transformed scale.',
    '箱线图：箱体为四分位距（Q1–Q3），中线为中位数，须延伸至 1.5 倍四分位距内的最远数据点，须外圆点为离群值；散点为单个样本（横向抖动以避免重叠）。':
      'Box plots: the box spans the interquartile range (Q1–Q3), the line is the median, whiskers extend to the most extreme data point within 1.5×IQR, and circles beyond the whiskers are outliers; dots are individual samples (jittered horizontally to avoid overlap).'
  });

  var FORMATS = [
    {
      name: '表达矩阵 + 分组注释',
      filename: 'diffexp_template.tsv',
      desc: '<b>表达矩阵</b>：第一行为样本名，第一列为基因名，其余单元格为表达量；行是基因、列是样本。' +
        '基因名重复时仅保留第一次出现的行。<b>分组信息在下方「样本分组」中单独填写</b>（每行「样本名 <TAB> 分组名」）。',
      sample: 'Gene\tC1\tC2\tC3\tT1\tT2\tT3\n' +
        'MKI67\t7.12\t7.44\t6.98\t9.85\t9.52\t10.11\n' +
        'CCNB1\t6.80\t7.05\t6.61\t8.92\t9.14\t8.73\n' +
        'CD8A\t9.24\t9.61\t9.02\t7.35\t7.12\t7.58\n' +
        'TP53\t8.10\t8.02\t8.24\t8.19\t8.05\t8.16'
    },
    {
      name: '计数矩阵（RNA-seq 原始计数）',
      filename: 'diffexp_counts_template.tsv',
      desc: '第一行为样本名、第一列为基因名，单元格为<b>非负整数计数</b>（如 featureCounts / HTSeq / RSEM 的 expected_count）。' +
        '计数矩阵请把「数据尺度」设为<b>RNA-seq 原始计数</b>：程序先按样本文库大小归一化为 CPM，再取 log2(CPM+1) 后做检验，避免测序深度差异造成的假阳性。',
      sample: 'Gene\tC1\tC2\tC3\tT1\tT2\tT3\n' +
        'MKI67\t142\t168\t131\t812\t903\t877\n' +
        'CCNB1\t96\t118\t88\t640\t702\t668\n' +
        'CD8A\t1205\t1320\t1148\t302\t278\t331\n' +
        'TP53\t488\t512\t470\t495\t506\t482'
    },
    {
      name: '分组信息填写示例',
      filename: 'diffexp_readme.txt',
      desc: '表达矩阵的每一行是一个基因、每一列是一个样本；请确保样本名与分组信息中的名称完全一致。',
      sample: 'Gene\tS1\tS2\tS3\tS4\tS5\tS6\n' +
        'MKI67\t7.12\t7.44\t6.98\t9.85\t9.52\t10.11\n' +
        '...\n\n' +
        '样本分组（填入下方「样本分组」框）：\n' +
        'Sample\tGroup\n' +
        'S1\tControl\nS2\tControl\nS3\tControl\n' +
        'S4\tTreatment\nS5\tTreatment\nS6\tTreatment'
    }
  ];

  WB.register({
    id: 'diffexp',
    name: '差异表达分析',
    icon: '⇅',
    color: '#c8862a',
    desc: '比较两组之间的基因表达水平：Welch t 检验（参数法）或 Wilcoxon 秩和检验（非参数法）；支持自动识别 / log2 值 / 原始信号强度 / RNA-seq 原始计数四种数据尺度；输出差异倍数、统计量、P 值与 FDR，并绘制分组箱线图。',
    tags: ['差异表达', '两组比较', '非参数检验', 'FDR 校正'],

    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('差异表达分析') }),
        el('p', { text: T('比较选定的两个分组之间的基因表达：默认用 Welch t 检验（不假定方差相等），也可改用 Wilcoxon 秩和检验；结果包含 log₂FC、统计量、P 值与 FDR，并给出分组箱线图。') })
      ]));

      var gTa = null;
      var panel = WB.ui.inputPanel({
        title: '输入表达矩阵',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.diffexpText,
        placeholder: 'Gene\tC1\tC2\tC3\tT1\tT2\tT3\nMKI67\t7.12\t7.44\t6.98\t9.85\t9.52\t10.11\n...',
        paramsTitle: '分析设置',
        params: [
          {
            key: 'primary', label: '检验方法（决定显著性）', type: 'select', value: 'parametric',
            options: [
              { value: 'parametric', label: '参数法（Welch t 检验）' },
              { value: 'nonparametric', label: '非参数法（Wilcoxon 秩和检验）' }
            ]
          },
          {
            key: 'groupA', label: '对照组名称（必填）', type: 'text', value: '', width: 'full',
            hint: '请填写矩阵中已存在的分组名，例如 Control / Treatment；留空时自动依次取第 1、2 个分组。'
          },
          {
            key: 'groupB', label: '实验组名称（必填）', type: 'text', value: '', width: 'full',
            hint: '请填写矩阵中已存在的分组名，例如 Control / Treatment；留空时自动依次取第 1、2 个分组。'
          },
          {
            key: 'dataScale', label: '数据尺度', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动识别（推荐）' },
              { value: 'log', label: '已是 log 值（如 log2 表达量）' },
              { value: 'linear', label: '原始信号强度（逐值取 log2(x+1)）' },
              { value: 'count', label: 'RNA-seq 原始计数（CPM 归一化后取 log2）' }
            ]
          },
          {
            key: 'pMethod', label: '多重检验校正', type: 'select', value: 'BH',
            options: [
              { value: 'BH', label: 'Benjamini-Hochberg (FDR)' },
              { value: 'bonferroni', label: 'Bonferroni' },
              { value: 'holm', label: 'Holm' },
              { value: 'none', label: '不校正' }
            ]
          },
          { key: 'pCut', label: 'P 值阈值', type: 'number', value: 0.05, min: 0.000001, max: 1, step: 0.005 },
          { key: 'fcCut', label: '|log2FC| 阈值', type: 'number', value: 1, min: 0, max: 10, step: 0.1 },
          { key: 'topN', label: '箱线图展示基因数（最显著）', type: 'number', value: 8, min: 1, max: 30, step: 1 },
          { key: 'showBox', label: '绘制箱线图', type: 'checkbox', value: true }
        ],
        extraValues: function () { return { groups: gTa ? gTa.value : '' }; },
        extraState: {
          ready: function () { return !!gTa; },
          get: function () { return gTa ? gTa.value : ''; },
          set: function (v) { if (gTa) gTa.value = v || ''; }
        },
        runLabel: '运行差异分析',
        onRun: function (ctx) {
          var res = WB.$('#diffexp-result');
          WB.clear(res);
          runAnalysis(res, ctx);
        }
      });

      /* 分组注释附加区 */
      var groupBox = el('div.param-box');
      groupBox.appendChild(el('div.param-head', { text: T('样本分组（必填）') }));
      gTa = el('textarea.paste-area', {
        rows: 4,
        placeholder: T('每行「样本名 <TAB> 分组名」：\nC1\tControl\nC2\tControl\nT1\tTreatment\nT2\tTreatment\n\n也可以只写一行，按矩阵的列顺序给出分组名：\nGroup\tControl\tControl\tControl\tTreatment\tTreatment\tTreatment')
      });
      gTa.style.minHeight = '96px';
      groupBox.appendChild(gTa);
      groupBox.appendChild(el('div.field-hint', {
        text: T('样本名与矩阵列名必须完全一致；每行一组「样本名 <TAB> 分组名」，也可只写一行表头按列顺序给出分组名。')
      }));
      var demoGroupBtn = el('button.btn.btn-ghost.btn-xs', {
        text: T('插入示例分组'),
        onclick: function () {
          gTa.value = WB.demo.diffexpGroups;
          panel.save();
          WB.toast(T('已插入示例分组信息'), 'ok');
        }
      });
      groupBox.appendChild(el('div.format-actions', [demoGroupBtn]));
      gTa.addEventListener('input', WB.debounce(function () { panel.save(); }, 300));
      panel.extraSlot.appendChild(groupBox);
      panel.restoreExtra();

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'diffexp-result';
      main.appendChild(wrap);
      if (!WB._deDemoLoaded) {
        WB._deDemoLoaded = true;
        panel.setText(WB.demo.diffexpText);
        gTa.value = WB.demo.diffexpGroups;
        panel.save();
      }
    }
  });

  /* =========================== 数据尺度处理 ============================== */

  /**
   * 识别数据尺度（仅区分 count 与 log；原始信号强度无法与 log 值区分，需用户指定）
   * @returns {'count'|'log'}
   */
  function detectScale(matrix) {
    var n = 0, nInt = 0, nz = 0, mn = Infinity, mx = -Infinity;
    for (var i = 0; i < matrix.length; i++) {
      var row = matrix[i];
      for (var j = 0; j < row.length; j++) {
        var v = row[j];
        if (!isFinite(v)) continue;
        n++;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
        if (v === 0) nz++;
        if (Math.abs(v - Math.round(v)) < 1e-9) nInt++;
      }
    }
    if (!n || mn < 0) return 'log';
    if (nInt !== n) return 'log';
    // 全为非负整数：计数矩阵通常数值较大或含较多零
    if (mx >= 20 || nz / n >= 0.15) return 'count';
    return 'log';
  }

  /**
   * 按尺度变换矩阵
   *   log    → 原样
   *   linear → 逐值 log2(x+1)
   *   count  → 逐样本 CPM 归一化后 log2(CPM+1)
   * @returns {{data:number[][], lib:number[], libRatio:number}}
   */
  function preprocessMatrix(matrix, scale) {
    var nRow = matrix.length, nCol = nRow ? matrix[0].length : 0, i, j;
    if (scale === 'linear') {
      return {
        data: matrix.map(function (r) {
          return r.map(function (v) { return isFinite(v) ? Math.log2(Math.max(0, v) + 1) : NaN; });
        }),
        lib: null, libRatio: 1
      };
    }
    if (scale === 'count') {
      var lib = new Array(nCol).fill(0);
      for (i = 0; i < nRow; i++) {
        for (j = 0; j < nCol; j++) {
          var v = matrix[i][j];
          if (!isFinite(v)) continue;
          if (v < 0) throw new Error(T('计数矩阵中出现了负值，请确认「数据尺度」是否选错。'));
          lib[j] += v;
        }
      }
      var lo = Infinity, hi = 0;
      lib.forEach(function (s) {
        if (s > 0 && s < lo) lo = s;
        if (s > hi) hi = s;
      });
      if (!(hi > 0)) throw new Error(T('某个样本的计数总和为 0，无法做 CPM 归一化，请检查该样本列。'));
      var out = matrix.map(function (r) {
        return r.map(function (v, j2) {
          if (!isFinite(v)) return NaN;
          var cpm = lib[j2] > 0 ? v / lib[j2] * 1e6 : NaN;
          return isFinite(cpm) ? Math.log2(cpm + 1) : NaN;
        });
      });
      return { data: out, lib: lib, libRatio: (isFinite(lo) && lo > 0) ? hi / lo : 1 };
    }
    return { data: matrix.map(function (r) { return r.slice(); }), lib: null, libRatio: 1 };
  }

  /* ------------------------------ 主流程 -------------------------------- */

  function runAnalysis(res, ctx) {
    var m = WB.parse.parseMatrix(ctx.text, {});
    if (!m.matrix.length || !m.colNames.length) throw new Error(T('未解析到有效的表达矩阵'));

    /* 基因名去重（保留首次出现） */
    var genes = [], mat = [], dupGenes = 0, seen = {};
    m.rowNames.forEach(function (g, i) {
      var key = String(g).trim();
      if (seen[key]) { dupGenes++; return; }
      seen[key] = 1;
      genes.push(key);
      mat.push(m.matrix[i]);
    });
    var samples = m.colNames;
    var gmap = parseGroups(ctx.values.groups || '', samples);

    /* 分组 → 样本列索引 */
    var groupRaw = [], idxByGroup = {};
    samples.forEach(function (s, i) {
      var g = gmap[s];
      if (g === undefined || g === null || String(g).trim() === '') g = '';
      if (!g) return;
      if (!idxByGroup[g]) { idxByGroup[g] = []; groupRaw.push(g); }
      idxByGroup[g].push(i);
    });
    var dropped = groupRaw.filter(function (g) { return idxByGroup[g].length < 2; });
    var groupNames = groupRaw.filter(function (g) { return idxByGroup[g].length >= 2; });
    if (groupNames.length < 2) {
      throw new Error(T('需要至少两个可用分组、且每组至少 2 个样本。当前可用分组：{list}',
        { list: groupNames.concat(dropped).join(', ') || '—' }));
    }
    if (genes.length > 20000) throw new Error(T('基因数过多（{n}），请先按表达量或方差筛选后再分析（建议 ≤ 20000 个基因）。', { n: genes.length }));

    /* ---- 确定要比较的两个分组 ---- */
    var wantA = String(ctx.values.groupA || '').trim();
    var wantB = String(ctx.values.groupB || '').trim();
    var gA = '', gB = '', missing = null;
    if (wantA && groupNames.indexOf(wantA) < 0) { missing = wantA; }
    else if (wantB && groupNames.indexOf(wantB) < 0) { missing = wantB; }
    if (missing === null) {
      gA = wantA || groupNames[0];
      gB = wantB || groupNames.filter(function (g) { return g !== gA; })[0];
    } else {
      gA = groupNames[0];
      gB = groupNames[1];
    }
    if (!gA || !gB || gA === gB) {
      throw new Error(T('对照组「{a}」与实验组「{b}」不能相同。', { a: gA || '—', b: gB || '—' }));
    }

    var usedCols = idxByGroup[gA].concat(idxByGroup[gB]);
    var nExcluded = samples.length - usedCols.length;

    var primary = ctx.values.primary === 'nonparametric' ? 'nonparametric' : 'parametric';
    var pCut = Number(ctx.values.pCut) || 0.05;
    var fcCut = Number(ctx.values.fcCut);
    if (!isFinite(fcCut) || fcCut < 0) fcCut = 1;

    /* ---- 数据尺度 ---- */
    var scaleSel = ctx.values.dataScale || 'auto';
    var looksCount = detectScale(mat) === 'count';
    var rawMax = maxOf(mat);
    var scale = scaleSel === 'auto' ? (looksCount ? 'count' : 'log') : scaleSel;
    var prep = preprocessMatrix(mat, scale);
    mat = prep.data;

    /* ---- 逐基因检验 ---- */
    var storeRaw = genes.length <= 5000;
    var recs = [];
    for (var gi = 0; gi < genes.length; gi++) {
      var row = mat[gi];
      var A = idxByGroup[gA].map(function (i) { return row[i]; }).filter(isFinite);
      var B = idxByGroup[gB].map(function (i) { return row[i]; }).filter(isFinite);
      var tt = WB.stats.welchTTest(A, B);
      var ww = WB.stats.wilcoxonRankSum(A, B);
      var meanA = WB.stats.mean(A), meanB = WB.stats.mean(B);
      recs.push({
        gene: genes[gi],
        values: storeRaw ? { A: A, B: B } : null,
        meanA: meanA, meanB: meanB,
        statT: tt.t, pT: tt.p, dfT: tt.df,
        statW: ww.U, pW: ww.p,
        stat: primary === 'nonparametric' ? ww.U : tt.t,
        p: primary === 'nonparametric' ? ww.p : tt.p,
        statLabel: primary === 'nonparametric' ? 'U' : 't',
        log2FC: (isFinite(meanB) && isFinite(meanA)) ? meanB - meanA : NaN
      });
    }

    /* ---- 多重检验校正 ---- */
    var adjMethod = { BH: 'BH', bonferroni: 'BONFERRONI', holm: 'HOLM', none: 'NONE' }[ctx.values.pMethod] || 'BH';
    var pvals = recs.map(function (r) { return isFinite(r.p) ? r.p : 1; });
    var qs = WB.stats.pAdjust(pvals, adjMethod);
    recs.forEach(function (r, i) { r.padj = qs[i]; });

    /* ---- 方向分类 ---- */
    var nSig = 0, nUp = 0, nDown = 0;
    recs.forEach(function (r) {
      var significant = isFinite(r.padj) && r.padj <= pCut;
      r.trend = !isFinite(r.log2FC) ? 'ns' : (r.log2FC > 0 ? 'up' : 'down');
      r.sig = significant && isFinite(r.log2FC) && Math.abs(r.log2FC) >= fcCut;
      r.dir = r.sig ? (r.log2FC > 0 ? 'up' : 'down') : 'ns';
      r.category = T(r.sig ? (r.log2FC > 0 ? '上调' : '下调') : '不显著');
      if (r.sig) { nSig++; if (r.log2FC > 0) nUp++; else nDown++; }
    });

    /* ---- 统计条 ---- */
    var testName = primary === 'nonparametric' ? 'Wilcoxon 秩和检验' : 'Welch t 检验';
    var adjName = { BH: 'Benjamini-Hochberg（FDR）', bonferroni: 'Bonferroni 校正', holm: 'Holm 校正', none: '未校正（原始 P 值）' }[ctx.values.pMethod] || 'Benjamini-Hochberg（FDR）';

    res.appendChild(WB.ui.statBar([
      { label: T('基因数'), value: genes.length },
      { label: T('参与比较的样本数'), value: usedCols.length },
      { label: T('检出分组数'), value: groupNames.length },
      { label: T('对照组'), value: gA + ' (n=' + idxByGroup[gA].length + ')' },
      { label: T('实验组'), value: gB + ' (n=' + idxByGroup[gB].length + ')' },
      { label: T('显著基因'), value: nSig, tone: nSig ? 'red' : '' },
      { label: T('上调'), value: nUp, tone: 'red' },
      { label: T('下调'), value: nDown, tone: 'green' }
    ]));

    res.appendChild(WB.ui.alertBox('info',
      T('设计：<b>{design}</b>；显著性检验采用 <b>{test}</b>；多重检验校正：<b>{adj}</b>；阈值 padj ≤ <b>{pc}</b>{fc}。', {
        design: T('两组比较') + T('：{a} vs {b}', { a: gA, b: gB }),
        test: T(testName),
        adj: T(adjName),
        pc: pCut,
        fc: (fcCut > 0 ? T('，且 |log2FC| ≥ <b>{f}</b>', { f: fcCut }) : '')
      })));
    res.appendChild(WB.ui.alertBox('info',
      T('对照组为 {a}（n = {na}），实验组为 {b}（n = {nb}）；log₂FC = 实验组均值 − 对照组均值，检验与差异倍数都在同一变换后的尺度上计算。',
        { a: gA, na: idxByGroup[gA].length, b: gB, nb: idxByGroup[gB].length })));

    if (missing !== null) {
      res.appendChild(WB.ui.alertBox('warn',
        T('名称为「{u}」的分组不存在，已改按分组信息中出现的顺序选取：对照组 = {a}，实验组 = {b}。',
          { u: missing, a: gA, b: gB })));
    }
    if (groupNames.length > 2 || nExcluded > 0) {
      res.appendChild(WB.ui.alertBox('info',
        T('矩阵共识别出 {all} 个分组（{names}），本次仅比较其中两组；未参与比较的 {drop} 个样本已被排除。', {
          all: groupNames.length, names: groupNames.join('、'), drop: nExcluded
        })));
    }
    if (dropped.length) {
      res.appendChild(WB.ui.alertBox('warn',
        T('分组 {list} 的样本数不足 2 个，已排除。', { list: dropped.join('、') })));
    }

    /* ---- 数据尺度说明 ---- */
    var scaleName = {
      log: T('已是 log 值（如 log2 表达量）'),
      linear: T('原始信号强度（逐值取 log2(x+1)）'),
      count: T('RNA-seq 原始计数（CPM 归一化后取 log2）')
    }[scale];
    var scaleHow = {
      log: T('数据按 log₂ 尺度直接使用，未做任何变换；请确认输入确为对数化后的数值。'),
      linear: T('已逐值取 log₂(x+1) 后再做统计（检验与差异倍数使用同一尺度）。'),
      count: T('已按样本文库大小归一化为 CPM，并取 log₂(CPM+1) 后再做统计；log₂FC = 组间均值差。')
    }[scale];
    var scaleDetail = T('数据尺度：<b>{scale}</b>。', { scale: scaleName }) + scaleHow;
    if (scaleSel === 'auto') {
      if (scale === 'count') {
        scaleDetail += T('自动识别的依据：所有数值均为非负整数，最大值 {mx}。如判断有误，请手动指定「数据尺度」。',
          { mx: WB.formatNum(rawMax, 0) });
      } else {
        scaleDetail += T('自动识别：数据不是全为非负整数，更接近对数化后的数值，因此按 log₂ 值直接使用；若原始数据为荧光强度等线性尺度，请手动改为「原始信号强度」。');
      }
    }
    res.appendChild(WB.ui.alertBox('info', scaleDetail));
    if (scale === 'count') {
      res.appendChild(WB.ui.alertBox('warn',
        T('计数矩阵的组间比较在 log₂-CPM 尺度上用 t 检验，相当于 limma-trend 的近似；若需负二项模型的精确检验，建议再用 DESeq2 / edgeR 复核。')));
      if (prep.libRatio > 3) {
        res.appendChild(WB.ui.alertBox('warn',
          T('各样本文库大小差异较大（最大 / 最小 = {r} 倍），已用 CPM 归一化校正测序深度。', { r: WB.formatNum(prep.libRatio, 1) })));
      }
    } else if (looksCount && scaleSel === 'log') {
      res.appendChild(WB.ui.alertBox('warn', T('数据形如非负整数（可能是计数矩阵），但当前「数据尺度」按 log₂ 值处理。若这是 RNA-seq 原始计数，请改为「RNA-seq 原始计数」。')));
    }
    if (dupGenes > 0) {
      res.appendChild(WB.ui.alertBox('warn',
        T('数据已重复的基因名仅保留首次出现') + '（' + dupGenes + '）'));
    }
    if (!storeRaw) {
      res.appendChild(WB.ui.alertBox('warn', T('数据量较大（{n} 个基因），箱线图仅按全部基因统计结果绘制最显著的部分；表格为全部基因。', { n: genes.length })));
    }

    /* 排序：P 值升序 */
    var sorted = recs.slice().sort(function (a, b) {
      var pa = isFinite(a.padj) ? a.padj : Infinity, pb = isFinite(b.padj) ? b.padj : Infinity;
      return pa - pb;
    });

    var yTitle = { count: 'log₂(CPM+1)', linear: T('log₂(信号强度+1)'), log: T('表达量') }[scale];

    /* 箱线图 */
    if (ctx.values.showBox && storeRaw) {
      var topN = Math.max(1, Number(ctx.values.topN) || 8);
      var plotRows = sorted.slice(0, Math.min(topN, sorted.length));
      var boxCard = WB.ui.resultCard(T('分组箱线图（最显著 {n} 个基因）', { n: plotRows.length }));
      res.appendChild(boxCard);
      var bBody = boxCard.querySelector('.card-body');
      var holder = el('div.plot-holder');
      bBody.appendChild(holder);
      var svg = drawBoxplot(holder, plotRows, [gA, gB], { yTitle: yTitle });
      if (svg) {
        WB.plot.addToolbar(bBody, { getSvg: function () { return svg; }, basename: 'diffexp_boxplot' });
        bBody.appendChild(el('div.preview-note', {
          text: T('箱线图：箱体为四分位距（Q1–Q3），中线为中位数，须延伸至 1.5 倍四分位距内的最远数据点，须外圆点为离群值；散点为单个样本（横向抖动以避免重叠）。')
        }));
      }
    }

    /* 结果表 */
    var tCard = WB.ui.resultCard(T('差异表达结果表（按 P 值排序）'));
    res.appendChild(tCard);
    var tBody = tCard.querySelector('.card-body');
    var cols = [
      { key: 'rank', label: '#', align: 'right', width: 52 },
      { key: 'gene', label: T('基因') },
      { key: 'mA', label: gA + ' ' + T('均值'), align: 'right', width: 104, format: function (r) { return WB.formatNum(r.meanA, 3); } },
      { key: 'mB', label: gB + ' ' + T('均值'), align: 'right', width: 104, format: function (r) { return WB.formatNum(r.meanB, 3); } },
      { key: 'log2FC', label: 'log₂FC', align: 'right', width: 88, format: function (r) { return fmtFC(r.log2FC); } },
      { key: 'stat', label: T('统计量') + ' (' + (sorted[0] ? sorted[0].statLabel : 't') + ')', align: 'right', width: 96, format: function (r) { return WB.formatNum(r.stat, 3); } },
      { key: 'p', label: T('P 值'), align: 'right', width: 100, format: function (r) { return WB.pFormat(r.p); } },
      { key: 'padj', label: 'padj', align: 'right', width: 100, format: function (r) { return WB.pFormat(r.padj); } },
      {
        key: 'category', label: T('显著性'), width: 132,
        render: function (r) { return el('span.tag-cat.tag-' + r.dir, { text: r.category }); }
      }
    ];

    var tableRows = sorted.map(function (r, i) {
      return {
        rank: i + 1, gene: r.gene, meanA: r.meanA, meanB: r.meanB,
        log2FC: r.log2FC, stat: r.stat, p: r.p, padj: r.padj,
        dir: r.dir, sig: r.sig, category: r.category
      };
    });
    WB.ui.dataTable(tBody, cols, tableRows, {
      pageSize: 25, exportName: 'diffexp_results',
      rowClass: function (r) { return r.sig ? 'row-sig' : ''; }
    });
    tBody.appendChild(el('div.preview-note', {
      text: T('表中标红的行为通过阈值的显著差异基因（padj ≤ {pc}{fc}）。可分页查看，或点右上角「导出 TSV」保存全部结果；把显著基因名复制出来即可做富集分析。', {
        pc: pCut, fc: fcCut > 0 ? '，|log2FC| ≥ ' + fcCut : ''
      })
    }));
  }

  function maxOf(mat) {
    var mx = -Infinity;
    mat.forEach(function (r) { r.forEach(function (v) { if (isFinite(v) && v > mx) mx = v; }); });
    return isFinite(mx) ? mx : 0;
  }

  /** 差异倍数格式化：把浮点噪声（|v| < 1e-12）显示为 0 */
  function fmtFC(v) {
    if (!isFinite(v)) return WB.formatNum(v, 3);
    return WB.formatNum(Math.abs(v) < 1e-12 ? 0 : v, 3);
  }

  /* --------------------------- 分组信息解析 ------------------------------ */

  function parseGroups(text, samples) {
    if (!text || !text.trim()) {
      throw new Error(T('请提供样本分组信息（每行「样本名 <TAB> 分组名」）'));
    }
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) {
      throw new Error(T('请提供样本分组信息（每行「样本名 <TAB> 分组名」）'));
    }
    var map = {};
    var first = lines[0].split(/[\t,;]+/).map(function (s) { return s.trim(); });

    if (lines.length === 1 && first.length >= samples.length) {
      var toks = first.slice();
      if (toks.length === samples.length + 1 &&
        /^(group|group_name|condition|class|分组|组别|样本分组)$/i.test(toks[0])) toks.shift();
      samples.forEach(function (s, i) { map[s] = toks[i] || ''; });
    } else {
      var start = 0;
      if (first.length >= 2 && /^(sample|sample_id|sampleid|样本|样本名)$/i.test(first[0])) start = 1;
      for (var i = start; i < lines.length; i++) {
        var p = lines[i].split(/[\t,;]+/).map(function (s) { return s.trim(); });
        if (p.length >= 2 && p[0]) map[p[0]] = p[1];
      }
    }

    var missing = samples.filter(function (s) { return !map[s]; });
    if (missing.length) {
      throw new Error(T('以下样本在分组信息中缺失：{list}', {
        list: missing.slice(0, 6).join('、') + (missing.length > 6 ? ' 等 ' + missing.length + ' 个' : '')
      }));
    }
    return map;
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawBoxplot(container, plotRows, groupNames, cfg) {
    if (!plotRows.length) { WB.plot.emptyState(container, T('common.noData')); return null; }

    var W = 760, H = 420, m = { l: 68, r: 18, t: 24, b: 112 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var valuesOf = function (r, g) {
      return groupNames[0] === g ? (r.values.A || []) : (r.values.B || []);
    };

    /* y 轴范围 */
    var vmin = Infinity, vmax = -Infinity;
    plotRows.forEach(function (r) {
      groupNames.forEach(function (g) {
        valuesOf(r, g).forEach(function (v) {
          if (v < vmin) vmin = v;
          if (v > vmax) vmax = v;
        });
      });
    });
    if (!isFinite(vmin)) { WB.plot.emptyState(container, T('common.noData')); return null; }
    var pad = (vmax - vmin) * 0.08 || 1;
    var sy = WB.plot.linearScale(vmin - pad, vmax + pad, H - m.b, m.t);

    var geneList = plotRows.map(function (r) { return r.gene; });
    var sx = WB.plot.bandScale(geneList, m.l, W - m.r, 0.24);
    var slot = sx.bandwidth() / groupNames.length;
    var boxW = Math.max(5, Math.min(30, slot * 0.78));

    sy.ticks(6).forEach(function (t) {
      if (t < vmin - pad || t > vmax + pad) return;
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 4, WB.formatNum(t, 2),
        { 'text-anchor': 'end', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });

    var colorOf = function (j) { return WB.plot.palette(j); };

    plotRows.forEach(function (r, ri) {
      var bandX = sx(r.gene);
      groupNames.forEach(function (g, gj) {
        var arr = valuesOf(r, g).slice().sort(function (a, b) { return a - b; });
        if (!arr.length) return;
        var cx = bandX + (gj + 0.5) * slot + (sx.bandwidth() - slot * groupNames.length) / 2;
        var q1 = WB.stats.quantile(arr, 0.25);
        var med = WB.stats.quantile(arr, 0.5);
        var q3 = WB.stats.quantile(arr, 0.75);
        var iqr = q3 - q1;
        var wLo = q1, wHi = q3, i;
        for (i = 0; i < arr.length; i++) { if (arr[i] >= q1 - 1.5 * iqr) { wLo = arr[i]; break; } }
        for (i = arr.length - 1; i >= 0; i--) { if (arr[i] <= q3 + 1.5 * iqr) { wHi = arr[i]; break; } }
        var col = colorOf(gj);

        root.appendChild(S('line', { x1: cx, y1: sy(wLo), x2: cx, y2: sy(q1), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('line', { x1: cx, y1: sy(q3), x2: cx, y2: sy(wHi), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('line', { x1: cx - boxW * 0.35, y1: sy(wLo), x2: cx + boxW * 0.35, y2: sy(wLo), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('line', { x1: cx - boxW * 0.35, y1: sy(wHi), x2: cx + boxW * 0.35, y2: sy(wHi), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('rect', {
          x: cx - boxW / 2, y: sy(q3), width: boxW, height: Math.max(1, sy(q1) - sy(q3)),
          fill: col, 'fill-opacity': 0.34, stroke: col, 'stroke-width': 1
        }));
        root.appendChild(S('line', { x1: cx - boxW / 2, y1: sy(med), x2: cx + boxW / 2, y2: sy(med), stroke: col, 'stroke-width': 1.8 }));

        /* 单样本散点（固定抖动序列，保证每次出图一致） */
        var jit = [-0.30, 0.30, -0.16, 0.16, -0.05, 0.05, -0.24, 0.24];
        arr.forEach(function (v, vi) {
          var off = jit[vi % jit.length] * boxW * 0.42;
          root.appendChild(S('circle', {
            cx: cx + off, cy: sy(v), r: Math.max(1.2, boxW * 0.075),
            fill: '#ffffff', stroke: col, 'stroke-width': 0.9, 'fill-opacity': 0.9
          }));
        });

        var hit = S('rect', {
          x: cx - boxW / 2 - 1, y: m.t, width: boxW + 2, height: H - m.t - m.b,
          fill: 'transparent', style: 'cursor:crosshair'
        });
        WB.plot.bindTip(hit, function () {
          return '<b>' + WB.esc(r.gene) + '</b><br>' + WB.esc(g) + '<br>' +
            T('样本数：') + arr.length + '<br>' +
            T('平均值：') + WB.formatNum(WB.stats.mean(arr), 3) + '<br>' +
            T('中位数：') + WB.formatNum(med, 3) + '<br>' +
            T('四分位距：') + WB.formatNum(iqr, 3);
        });
        root.appendChild(hit);
      });

      /* 基因名与显著性标记 */
      var star = WB.plot.sigStar(r.padj);
      var lx = bandX + sx.bandwidth() / 2;
      root.appendChild(WB.plot.txt(lx, H - m.b + 16, r.gene, {
        'text-anchor': 'end', 'font-size': 12, 'font-weight': 600, fill: WB.plot.TICKTEXT,
        transform: 'rotate(-42 ' + lx + ' ' + (H - m.b + 16) + ')'
      }));
      if (star) {
        root.appendChild(WB.plot.txt(lx, H - m.b + 34, star, {
          'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#a8332b'
        }));
      }
    });

    root.appendChild(S('rect', {
      x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b,
      fill: 'none', stroke: WB.plot.AXIS
    }));
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 16, T('基因'), {
      'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT
    }));
    var yl = WB.plot.txt(0, 0, cfg.yTitle || T('表达量'), {
      'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)'
    });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);

    WB.plot.legendCategorical(container, groupNames.map(function (g, j) {
      return { color: colorOf(j), label: g };
    }));
    return canvas.svg;
  }

  /* 暴露内部纯函数，供自检调用 */
  WB.diffexp = {
    detectScale: detectScale,
    preprocessMatrix: preprocessMatrix
  };
})(window);
