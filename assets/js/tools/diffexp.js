/* =============================================================================
 * tools/diffexp.js  —  差异表达分析（分组比较）
 *   两组：Welch t 检验（参数法）/ Wilcoxon 秩和检验（非参数法）
 *   多组：单因素方差分析 ANOVA（参数法）/ Kruskal-Wallis（非参数法）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块元信息 */
    '按分组比较基因表达水平：两组用 Welch t 检验或 Wilcoxon 秩和检验，多组用单因素方差分析或 Kruskal-Wallis 检验；输出差异倍数、统计量、P 值与 FDR，并绘制分组箱线图。':
      'Compare gene expression across groups: Welch t-test or Wilcoxon rank-sum test for two groups, one-way ANOVA or Kruskal-Wallis test for multiple groups; reports fold change, test statistic, P value and FDR, with grouped box plots.',
    '差异表达': 'Differential expression',
    '分组检验': 'Group comparison',
    '非参数检验': 'Non-parametric test',
    'FDR 校正': 'FDR correction',
    '箱线图': 'Box plot',

    /* 输入格式 */
    '表达矩阵 + 分组注释': 'Expression matrix + group annotation',
    ['<b>表达矩阵</b>：第一行为样本名，第一列为基因名，其余单元格为表达量。' +
      '基因名重复时仅保留第一次出现的行。<b>分组信息在下方「样本分组」中单独填写</b>（每行「样本名 <TAB> 分组名」）。']:
      '<b>Expression matrix</b>: the first row holds sample names, the first column holds gene names, the remaining cells hold expression values. ' +
      'If a gene name appears more than once, only the first occurrence is kept. <b>Group information is entered separately in the “Sample groups” box below</b> (one “sample <TAB> group” pair per line).',
    '表达矩阵的每一行是一个基因、每一列是一个样本；请确保样本名与分组信息中的名称完全一致。':
      'Each row of the matrix is a gene and each column a sample; sample names must match those in the group annotation exactly.',
    '分组信息填写示例': 'Group annotation example',
    '样本分组（填入下方「样本分组」框）：': 'Sample groups (enter into the “Sample groups” box below):',
    '两组比较': 'Two-group comparison',

    /* 页头 */
    '差异表达分析': 'Differential expression analysis',
    '按分组比较基因表达：两组用 Welch t 检验 / Wilcoxon 秩和检验，多组用单因素方差分析 / Kruskal-Wallis 检验，结果包含差异倍数、P 值与 FDR。':
      'Compare gene expression between groups: Welch t-test / Wilcoxon rank-sum test for two groups, one-way ANOVA / Kruskal-Wallis test for multiple groups; results include fold change, P value and FDR.',

    /* 输入区 */
    '输入表达矩阵': 'Input expression matrix',
    '分析设置': 'Analysis settings',
    '比较模式': 'Comparison mode',
    '两组比较（推荐）': 'Two-group comparison (recommended)',
    '多组整体检验': 'Omnibus test across groups',
    '检验方法（决定显著性）': 'Test used for significance',
    '参数法（Welch t / 单因素 ANOVA）': 'Parametric (Welch t / one-way ANOVA)',
    '非参数法（Wilcoxon / Kruskal-Wallis）': 'Non-parametric (Wilcoxon / Kruskal-Wallis)',
    '对照组名称（留空自动取第一个组）': 'Control group (blank = first group)',
    '实验组名称（留空自动取第二个组）': 'Case group (blank = second group)',
    '数据尺度': 'Data scale',
    '已是 log 值（如 log2 表达量）': 'Already log-transformed (e.g. log2 expression)',
    '原始信号强度（先取 log2）': 'Raw signal intensity (log2 taken first)',
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
    '至少需要两个分组、且每组至少 2 个样本才能进行组间比较。当前分组：{list}':
      'At least two groups with ≥ 2 samples each are required. Current groups: {list}',

    /* 统计条与提示 */
    '基因数': 'Genes',
    '样本数': 'Samples',
    '分组数': 'Groups',
    '显著基因': 'Significant genes',
    '检验方法': 'Test',
    '对照组': 'Control',
    '实验组': 'Case',
    '数据已重复的基因名仅保留首次出现': 'Duplicate gene names: first occurrence kept',
    '设计：<b>{design}</b>；显著性检验采用 <b>{test}</b>；FDR 校正：<b>{adj}</b>；阈值 padj ≤ <b>{pc}</b>{fc}。':
      'Design: <b>{design}</b>; significance test: <b>{test}</b>; FDR correction: <b>{adj}</b>; thresholds padj ≤ <b>{pc}</b>{fc}.',
    '，且 |log2FC| ≥ <b>{f}</b>': ', and |log2FC| ≥ <b>{f}</b>',
    '：{a} vs {b}': ': {a} vs {b}',
    '：{k} 组整体检验': ': omnibus test across {k} groups',
    'Welch t 检验': 'Welch t-test',
    'Wilcoxon 秩和检验': 'Wilcoxon rank-sum test',
    '单因素方差分析（ANOVA）': 'One-way ANOVA',
    'Kruskal-Wallis 检验': 'Kruskal-Wallis test',
    'Benjamini-Hochberg（FDR）': 'Benjamini-Hochberg (FDR)',
    'Bonferroni 校正': 'Bonferroni',
    'Holm 校正': 'Holm',
    '未校正（原始 P 值）': 'None (raw P values)',

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
    '平均表达量': 'Mean expression',
    '均值': 'mean',
    '表中标红的行为通过阈值的显著差异基因（padj ≤ {pc}{fc}）。可分页查看，或点右上角「导出 TSV」保存全部结果；把显著基因名复制出来即可做富集分析。':
      'Highlighted rows pass the thresholds (padj ≤ {pc}{fc}). Page through the table, or use “Export TSV” at the top right to save all results; copy the significant gene names for enrichment analysis.',
    '数据量较大（{n} 个基因），箱线图仅按全部基因统计结果绘制最显著的部分；表格为全部基因。':
      'Large dataset ({n} genes): the box plot shows only the most significant genes, while the table contains all genes.',
    '平均值：': 'Mean: ',
    '中位数：': 'Median: ',
    '四分位距：': 'IQR: ',
    '样本数：': 'n = ',
    '对照组为 {a}，实验组为 {b}；log2FC = 实验组均值 − 对照组均值（数据取 log2 后相减）。若数据列为原始信号强度，则先对组均值取 log2 再相减。':
      'Control = {a}, case = {b}; log2FC = case mean − control mean on log2 scale. If the data column holds raw signal intensity, group means are log2-transformed before subtraction.',
    '箱线图：箱体为四分位距（Q1–Q3），中线为中位数，须延伸至 1.5 倍四分位距内的最远数据点，须外圆点为离群值；散点为单个样本（横向抖动以避免重叠）。':
      'Box plots: the box spans the interquartile range (Q1–Q3), the line is the median, whiskers extend to the most extreme data point within 1.5×IQR, and circles beyond the whiskers are outliers; dots are individual samples (jittered horizontally to avoid overlap).'
  });

  var FORMATS = [
    {
      name: '表达矩阵 + 分组注释',
      filename: 'diffexp_template.tsv',
      desc: '<b>表达矩阵</b>：第一行为样本名，第一列为基因名，其余单元格为表达量。' +
        '基因名重复时仅保留第一次出现的行。<b>分组信息在下方「样本分组」中单独填写</b>（每行「样本名 <TAB> 分组名」）。',
      sample: 'Gene\tC1\tC2\tC3\tT1\tT2\tT3\n' +
        'MKI67\t7.12\t7.44\t6.98\t9.85\t9.52\t10.11\n' +
        'CCNB1\t6.80\t7.05\t6.61\t8.92\t9.14\t8.73\n' +
        'CD8A\t9.24\t9.61\t9.02\t7.35\t7.12\t7.58\n' +
        'TP53\t8.10\t8.02\t8.24\t8.19\t8.05\t8.16'
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
    desc: '按分组比较基因表达水平：两组用 Welch t 检验或 Wilcoxon 秩和检验，多组用单因素方差分析或 Kruskal-Wallis 检验；输出差异倍数、统计量、P 值与 FDR，并绘制分组箱线图。',
    tags: ['差异表达', '分组检验', '非参数检验', 'FDR 校正'],

    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('差异表达分析') }),
        el('p', { text: T('按分组比较基因表达：两组用 Welch t 检验 / Wilcoxon 秩和检验，多组用单因素方差分析 / Kruskal-Wallis 检验，结果包含差异倍数、P 值与 FDR。') })
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
            key: 'mode', label: '比较模式', type: 'select', value: 'pair',
            options: [
              { value: 'pair', label: '两组比较（推荐）' },
              { value: 'multi', label: '多组整体检验' }
            ]
          },
          {
            key: 'primary', label: '检验方法（决定显著性）', type: 'select', value: 'parametric',
            options: [
              { value: 'parametric', label: '参数法（Welch t / 单因素 ANOVA）' },
              { value: 'nonparametric', label: '非参数法（Wilcoxon / Kruskal-Wallis）' }
            ]
          },
          { key: 'groupA', label: '对照组名称（留空自动取第一个组）', type: 'text', value: '' },
          { key: 'groupB', label: '实验组名称（留空自动取第二个组）', type: 'text', value: '' },
          {
            key: 'dataScale', label: '数据尺度', type: 'select', value: 'log',
            options: [
              { value: 'log', label: '已是 log 值（如 log2 表达量）' },
              { value: 'linear', label: '原始信号强度（先取 log2）' }
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
      }
    }
  });

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
    var groupNames = [], idxByGroup = {};
    samples.forEach(function (s, i) {
      var g = gmap[s];
      if (g === undefined || g === null || String(g).trim() === '') g = '';
      if (!g) return;
      if (!idxByGroup[g]) { idxByGroup[g] = []; groupNames.push(g); }
      idxByGroup[g].push(i);
    });
    var dropped = groupNames.filter(function (g) { return idxByGroup[g].length < 2; });
    groupNames = groupNames.filter(function (g) { return idxByGroup[g].length >= 2; });
    if (groupNames.length < 2) {
      throw new Error(T('至少需要两个分组、且每组至少 2 个样本才能进行组间比较。当前分组：{list}',
        { list: groupNames.concat(dropped).join(', ') || '—' }));
    }
    if (genes.length > 20000) throw new Error(T('基因数过多（{n}），请先按表达量或方差筛选后再分析（建议 ≤ 20000 个基因）。', { n: genes.length }));

    var mode = ctx.values.mode === 'multi' ? 'multi' : 'pair';
    var primary = ctx.values.primary === 'nonparametric' ? 'nonparametric' : 'parametric';
    var dataScale = ctx.values.dataScale === 'linear' ? 'linear' : 'log';
    var pCut = Number(ctx.values.pCut) || 0.05;
    var fcCut = Number(ctx.values.fcCut);
    if (!isFinite(fcCut)) fcCut = 1;

    var gA = String(ctx.values.groupA || '').trim();
    var gB = String(ctx.values.groupB || '').trim();
    if (groupNames.indexOf(gA) < 0) gA = groupNames[0];
    if (groupNames.indexOf(gB) < 0 || gB === gA) {
      gB = groupNames.filter(function (g) { return g !== gA; })[0] || gA;
    }
    if (mode === 'pair' && gA === gB) mode = 'multi';

    var storeRaw = genes.length <= 5000;
    var recs = [];
    var LN2 = Math.LN2;

    for (var gi = 0; gi < genes.length; gi++) {
      var row = mat[gi];
      var vals = {}, means = {};
      groupNames.forEach(function (g) {
        var arr = idxByGroup[g].map(function (i) { return row[i]; }).filter(isFinite);
        vals[g] = arr;
        means[g] = WB.stats.mean(arr);
      });

      var rec = { gene: genes[gi], means: means, values: storeRaw ? vals : null };

      if (mode === 'pair') {
        var A = vals[gA] || [], B = vals[gB] || [];
        var tt = WB.stats.welchTTest(A, B);
        var ww = WB.stats.wilcoxonRankSum(A, B);
        rec.statT = tt.t; rec.pT = tt.p;
        rec.statW = ww.U; rec.pW = ww.p;
        rec.stat = primary === 'nonparametric' ? ww.U : tt.t;
        rec.p = primary === 'nonparametric' ? ww.p : tt.p;
        rec.statLabel = primary === 'nonparametric' ? 'U' : 't';
        rec.meanA = means[gA]; rec.meanB = means[gB];
        var mA = means[gA], mB = means[gB];
        rec.log2FC = dataScale === 'log'
          ? (isFinite(mB) && isFinite(mA) ? mB - mA : NaN)
          : ((mA > 0 && mB > 0) ? Math.log(mB / mA) / LN2 : NaN);
      } else {
        var gs = groupNames.map(function (g) { return vals[g]; });
        var av = WB.stats.oneWayAnova(gs);
        var kw = WB.stats.kruskalWallis(gs);
        rec.statF = av.F; rec.pF = av.p;
        rec.statH = kw.H; rec.pH = kw.p;
        rec.stat = primary === 'nonparametric' ? kw.H : av.F;
        rec.p = primary === 'nonparametric' ? kw.p : av.p;
        rec.statLabel = primary === 'nonparametric' ? 'H' : 'F';
        var mx = -Infinity, mn = Infinity;
        groupNames.forEach(function (g) {
          var v = means[g];
          if (isFinite(v)) { if (v > mx) mx = v; if (v < mn) mn = v; }
        });
        rec.log2FC = dataScale === 'log'
          ? (isFinite(mx) && isFinite(mn) ? mx - mn : NaN)
          : ((mn > 0 && isFinite(mx)) ? Math.log(mx / mn) / LN2 : NaN);
      }
      recs.push(rec);
    }

    /* 多重检验校正 */
    var pvals = recs.map(function (r) { return r.p; });
    var adjMethod = { BH: 'BH', bonferroni: 'BONFERRONI', holm: 'HOLM', none: 'NONE' }[ctx.values.pMethod] || 'BH';
    var qs = WB.stats.pAdjust(pvals, adjMethod);
    recs.forEach(function (r, i) { r.padj = qs[i]; });

    /* 显著性判定 */
    var nSig = 0, nUp = 0, nDown = 0;
    recs.forEach(function (r) {
      r.sig = isFinite(r.padj) && r.padj <= pCut && isFinite(r.log2FC) && Math.abs(r.log2FC) >= fcCut;
      r.dir = isFinite(r.log2FC) ? (r.log2FC > 0 ? 'up' : 'down') : 'ns';
      r.category = T(r.sig ? (r.dir === 'up' ? '上调' : '下调') : '不显著');
      if (r.sig) { nSig++; if (r.dir === 'up') nUp++; else nDown++; }
    });

    /* 统计条 */
    var testName = mode === 'pair'
      ? (primary === 'nonparametric' ? 'Wilcoxon 秩和检验' : 'Welch t 检验')
      : (primary === 'nonparametric' ? 'Kruskal-Wallis 检验' : '单因素方差分析（ANOVA）');
    var adjName = { BH: 'Benjamini-Hochberg（FDR）', bonferroni: 'Bonferroni 校正', holm: 'Holm 校正', none: '未校正（原始 P 值）' }[ctx.values.pMethod] || 'Benjamini-Hochberg（FDR）';

    res.appendChild(WB.ui.statBar([
      { label: T('基因数'), value: genes.length },
      { label: T('样本数'), value: samples.length },
      { label: T('分组数'), value: groupNames.length },
      { label: T('显著基因'), value: nSig, tone: nSig ? 'red' : '' },
      { label: T('上调'), value: nUp, tone: 'red' },
      { label: T('下调'), value: nDown, tone: 'green' }
    ]));

    var designTxt = mode === 'pair'
      ? T('：{a} vs {b}', { a: gA, b: gB })
      : T('：{k} 组整体检验', { k: groupNames.length });
    res.appendChild(WB.ui.alertBox('info',
      T('设计：<b>{design}</b>；显著性检验采用 <b>{test}</b>；FDR 校正：<b>{adj}</b>；阈值 padj ≤ <b>{pc}</b>{fc}。', {
        design: T(mode === 'pair' ? '两组比较' : '多组整体检验') + designTxt,
        test: T(testName),
        adj: T(adjName),
        pc: pCut,
        fc: (fcCut > 0 ? T('，且 |log2FC| ≥ <b>{f}</b>', { f: fcCut }) : '')
      })));
    if (dupGenes > 0) {
      res.appendChild(WB.ui.alertBox('warn',
        T('数据已重复的基因名仅保留首次出现') + '（' + dupGenes + '）'));
    }
    if (!storeRaw) {
      res.appendChild(WB.ui.alertBox('warn', T('数据量较大（{n} 个基因），箱线图仅按全部基因统计结果绘制最显著的部分；表格为全部基因。', { n: genes.length })));
    }
    if (mode === 'pair') {
      res.appendChild(WB.ui.alertBox('info', T('对照组为 {a}，实验组为 {b}；log2FC = 实验组均值 − 对照组均值（数据取 log2 后相减）。若数据列为原始信号强度，则先对组均值取 log2 再相减。', { a: gA, b: gB })));
    }

    /* 排序：P 值升序 */
    var sorted = recs.slice().sort(function (a, b) {
      var pa = isFinite(a.padj) ? a.padj : Infinity, pb = isFinite(b.padj) ? b.padj : Infinity;
      return pa - pb;
    });

    /* 箱线图 */
    if (ctx.values.showBox && storeRaw) {
      var topN = Math.max(1, Number(ctx.values.topN) || 8);
      var plotRows = sorted.slice(0, Math.min(topN, sorted.length));
      var boxCard = WB.ui.resultCard(T('分组箱线图（最显著 {n} 个基因）', { n: plotRows.length }));
      res.appendChild(boxCard);
      var bBody = boxCard.querySelector('.card-body');
      var holder = el('div.plot-holder');
      bBody.appendChild(holder);
      var svg = drawBoxplot(holder, plotRows, groupNames, { yTitle: T('表达量') });
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
      { key: 'gene', label: T('基因') }
    ];
    groupNames.forEach(function (g) {
      cols.push({
        key: 'm_' + g, label: g + ' ' + T('均值'), align: 'right', width: 104,
        format: function (r) { return WB.formatNum(r.means[g], 3); }
      });
    });
    cols.push({ key: 'log2FC', label: 'log₂FC', align: 'right', width: 92, format: function (r) { return WB.formatNum(r.log2FC, 3); } });
    cols.push({ key: 'stat', label: T('统计量') + ' (' + (sorted[0] ? sorted[0].statLabel : 't') + ')', align: 'right', width: 96, format: function (r) { return WB.formatNum(r.stat, 3); } });
    cols.push({ key: 'p', label: T('P 值'), align: 'right', width: 100, format: function (r) { return WB.pFormat(r.p); } });
    cols.push({ key: 'padj', label: 'padj', align: 'right', width: 100, format: function (r) { return WB.pFormat(r.padj); } });
    cols.push({
      key: 'category', label: T('显著性'), width: 104,
      render: function (r) { return el('span.tag-cat.tag-' + r.dir, { text: r.category }); }
    });

    var tableRows = sorted.map(function (r, i) {
      var o = {
        rank: i + 1, gene: r.gene, log2FC: r.log2FC, stat: r.stat,
        p: r.p, padj: r.padj, dir: r.dir, sig: r.sig, category: r.category, means: r.means
      };
      groupNames.forEach(function (g) { o['m_' + g] = r.means[g]; });
      return o;
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

  /* --------------------------- 分组信息解析 ------------------------------ */

  /**
   * 解析样本分组，返回 { 样本名: 分组名 }
   * 版式 A：单行「表头 + 按列顺序的分组名」
   * 版式 B：两列「样本名 + 分组名」
   */
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

    var W = 820, H = 440, m = { l: 68, r: 18, t: 24, b: 104 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    /* y 轴范围（含全部要绘制的数据） */
    var vmin = Infinity, vmax = -Infinity;
    plotRows.forEach(function (r) {
      groupNames.forEach(function (g) {
        (r.values[g] || []).forEach(function (v) {
          if (v < vmin) vmin = v;
          if (v > vmax) vmax = v;
        });
      });
    });
    if (!isFinite(vmin)) { WB.plot.emptyState(container, T('common.noData')); return null; }
    var pad = (vmax - vmin) * 0.08 || 1;
    var sy = WB.plot.linearScale(vmin - pad, vmax + pad, H - m.b, m.t);

    var genes = plotRows.map(function (r) { return r.gene; });
    var sx = WB.plot.bandScale(genes, m.l, W - m.r, 0.24);
    var slot = sx.bandwidth() / groupNames.length;
    var boxW = Math.max(5, Math.min(26, slot * 0.78));

    /* 横向网格线与 y 轴刻度 */
    sy.ticks(6).forEach(function (t) {
      if (t < vmin - pad || t > vmax + pad) return;
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, WB.formatNum(t, 2),
        { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    var colorOf = function (j) { return WB.plot.palette(j); };

    plotRows.forEach(function (r, ri) {
      var bandX = sx(r.gene);
      groupNames.forEach(function (g, gj) {
        var arr = (r.values[g] || []).slice().sort(function (a, b) { return a - b; });
        if (!arr.length) return;
        var cx = bandX + (gj + 0.5) * slot + (sx.bandwidth() - slot * groupNames.length) / 2;
        var q1 = WB.stats.quantile(arr, 0.25);
        var med = WB.stats.quantile(arr, 0.5);
        var q3 = WB.stats.quantile(arr, 0.75);
        var iqr = q3 - q1;
        var wLo = q1, wHi = q3;
        for (var i = 0; i < arr.length; i++) { if (arr[i] >= q1 - 1.5 * iqr) { wLo = arr[i]; break; } }
        for (var k = arr.length - 1; k >= 0; k--) { if (arr[k] <= q3 + 1.5 * iqr) { wHi = arr[k]; break; } }
        var col = colorOf(gj);

        /* 须 */
        root.appendChild(S('line', { x1: cx, y1: sy(wLo), x2: cx, y2: sy(q1), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('line', { x1: cx, y1: sy(q3), x2: cx, y2: sy(wHi), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('line', { x1: cx - boxW * 0.35, y1: sy(wLo), x2: cx + boxW * 0.35, y2: sy(wLo), stroke: col, 'stroke-width': 1.2 }));
        root.appendChild(S('line', { x1: cx - boxW * 0.35, y1: sy(wHi), x2: cx + boxW * 0.35, y2: sy(wHi), stroke: col, 'stroke-width': 1.2 }));

        /* 箱体与中位数 */
        root.appendChild(S('rect', {
          x: cx - boxW / 2, y: sy(q3), width: boxW, height: Math.max(1, sy(q1) - sy(q3)),
          fill: col, 'fill-opacity': 0.34, stroke: col, 'stroke-width': 1
        }));
        root.appendChild(S('line', { x1: cx - boxW / 2, y1: sy(med), x2: cx + boxW / 2, y2: sy(med), stroke: col, 'stroke-width': 1.8 }));

        /* 单样本散点（横向抖动，固定抖动值保证可复现） */
        var jit = [-0.30, 0.30, -0.16, 0.16, -0.05, 0.05, -0.24, 0.24];
        arr.forEach(function (v, vi) {
          var off = jit[vi % jit.length] * boxW * 0.42;
          root.appendChild(S('circle', {
            cx: cx + off, cy: sy(v), r: Math.max(1.2, boxW * 0.075),
            fill: '#ffffff', stroke: col, 'stroke-width': 0.9, 'fill-opacity': 0.9
          }));
        });

        /* 悬停提示 */
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
      var lbl = WB.plot.txt(lx, H - m.b + 16, r.gene, {
        'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.TEXT,
        transform: 'rotate(-42 ' + lx + ' ' + (H - m.b + 16) + ')'
      });
      root.appendChild(lbl);
      if (star) {
        root.appendChild(WB.plot.txt(lx, H - m.b + 34, star, {
          'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#a8332b'
        }));
      }
    });

    /* 坐标轴与标题 */
    root.appendChild(S('rect', {
      x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b,
      fill: 'none', stroke: WB.plot.AXIS
    }));
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 16, T('基因'), {
      'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT
    }));
    var yl = WB.plot.txt(0, 0, cfg.yTitle || T('表达量'), {
      'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT, transform: 'rotate(-90)'
    });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);

    WB.plot.legendCategorical(container, groupNames.map(function (g, j) {
      return { color: colorOf(j), label: g };
    }));
    return canvas.svg;
  }
})(window);
