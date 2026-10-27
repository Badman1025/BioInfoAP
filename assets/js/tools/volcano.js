/* =============================================================================
 * tools/volcano.js  —  火山图（差异表达可视化）
 *
 *   模式 A（结果表）：基因 + log2FC + P 值（可含 padj）
 *   模式 B（表达矩阵）：多组样本矩阵 + 分组注释 → 自动做两两比较，
 *         支持层叠（同一坐标系按比较着色）与分面（小多图）两种排版
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* --------------------------- 科研出版配色方案 --------------------------- */
  /* 每种方案给出「上调 / 下调 / 不显著」三色，取自 ggsci 等发表级色板 */
  var SCHEMES = {
    classic: { up: '#d6483f', down: '#2f6fb3', ns: '#c3ccd5' },
    npg: { up: '#E64B35', down: '#4DBBD5', ns: '#BCC4CE' },
    lancet: { up: '#ED0000', down: '#00468B', ns: '#C9CDD2' },
    jama: { up: '#DF8F44', down: '#00A1D5', ns: '#C6CCD1' },
    nejm: { up: '#BC3C29', down: '#0072B5', ns: '#C5CBCF' },
    okabe: { up: '#D55E00', down: '#0072B2', ns: '#BBBBBB' },
    mono: { up: '#333333', down: '#9AA3AB', ns: '#DFE3E7' }
  };
  function schemeOf(key) { return SCHEMES[key] || SCHEMES.classic; }

  /** 按比例压暗十六进制颜色（0~1）：基因标注文字取同色系深调，避免浅色过淡 */
  function shade(hex, k) {
    var h = String(hex || '').replace('#', '');
    if (h.length !== 6) return hex;
    var out = '#';
    for (var i = 0; i < 6; i += 2) {
      var v = Math.round(parseInt(h.substr(i, 2), 16) * k);
      out += ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2);
    }
    return out;
  }

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '基因 + log2FC + P 值': 'Gene + log2FC + P value',
    '基因 + log2FC + P（两列格式亦可）': 'Gene + log2FC + P (two columns also fine)',
    '表达矩阵（多组两两对比）': 'Expression matrix (all pairwise contrasts)',
    ['<b>至少三列：基因名、log2FC（差异倍数对数）、P 值</b>。列名会自动识别：' +
      '<code>gene/symbol/id</code>、<code>log2FoldChange/log2FC/foldchange</code>、' +
      '<code>pvalue/p.val</code> 或 <code>padj/FDR/qvalue</code>。含 <code>padj</code> 时优先用校正后 P 值。']:
      '<b>At least three columns: gene name, log2FC (log fold change), P value.</b> Column names are auto-detected: ' +
      '<code>gene/symbol/id</code>, <code>log2FoldChange/log2FC/foldchange</code>, ' +
      '<code>pvalue/p.val</code> or <code>padj/FDR/qvalue</code>. If <code>padj</code> is present, the adjusted P value is preferred.',
    '只有基因名、log2FC、P 值三列时同样可用；若第一列不是基因名，工具会按行号自动编号。':
      'Works with just gene name, log2FC and P value; if the first column is not a gene name, rows are numbered automatically.',
    ['第一行为样本名、第一列为基因名。<b>分组信息在下方「样本分组」中单独填写</b>（每行「样本名 <TAB> 分组名」）。' +
      '程序会对所有分组两两组合分别做 Welch t 检验并计算 log₂FC，再逐一绘制火山图；' +
      '比较组合较多时建议用「仅比较这些组合」指定需要的对比（如 <code>Control:Treatment</code>）。']:
      'The first row holds sample names and the first column gene names. <b>Group information is entered separately in the “Sample groups” box below</b> (one “sample <TAB> group” pair per line). ' +
      'All pairs of groups are tested with Welch’s t-test and their log₂FC computed, then each contrast is drawn as a volcano plot; ' +
      'with many groups, restrict the contrasts via “Only these contrasts” (e.g. <code>Control:Treatment</code>).',
    '差异表达基因分布：log2FC 对 −log₁₀ P，自动标注显著上调/下调基因，可导出显著基因列表；支持表达矩阵输入并对多组做两两比较（层叠 / 分面排版）。':
      'Differential expression landscape: log2FC vs −log₁₀ P, with automatic labelling of significant up/down genes and export of the significant gene list. Also accepts an expression matrix and runs all pairwise contrasts (stacked / faceted layouts).',
    '多组对比': 'Multi-group contrasts',
    '差异表达': 'Differential expression',
    '阈值标注': 'Threshold labels',
    '导出基因': 'Export genes',
    '横轴为 log₂ 差异倍数，纵轴为 −log₁₀ P 值；可自定义阈值并标注 Top 基因。':
      'X axis is log₂ fold change, Y axis is −log₁₀ P; you can set custom thresholds and label the top genes.',
    '输入差异分析结果': 'Input differential results',
    '绘图参数': 'Plot parameters',
    '输入模式': 'Input mode',
    '差异分析结果表（基因 + log2FC + P）': 'DE result table (gene + log2FC + P)',
    '表达矩阵（自动两两比较）': 'Expression matrix (pairwise contrasts)',
    '数据尺度': 'Data scale',
    '自动识别（推荐）': 'Auto-detect (recommended)',
    '已是 log 值（如 log2 表达量）': 'Already log-transformed (e.g. log2 expression)',
    '原始信号强度（逐值取 log2(x+1)）': 'Raw signal intensity (log2(x+1) per value)',
    'RNA-seq 原始计数（CPM 归一化后取 log2）': 'RNA-seq raw counts (CPM-normalised, then log2)',
    '多组排版方式': 'Multi-group layout',
    '层叠（同一坐标系按比较着色）': 'Stacked (one panel, coloured by contrast)',
    '分面（每个比较一个子图）': 'Faceted (one subplot per contrast)',
    '仅比较这些组合（可选）': 'Only these contrasts (optional)',
    '格式「A:B」，逗号或分号分隔；留空则对所有分组两两组合（组数 ≤ 6）。示例：Control:Treat24h, Control:Treat72h':
      'Format “A:B”, separated by commas or semicolons; blank = all pairs (when there are ≤ 6 groups). Example: Control:Treat24h, Control:Treat72h',
    '|log₂FC| 阈值': '|log₂FC| threshold',
    'P 值阈值': 'P-value threshold',
    'P 值列': 'P-value column',
    '自动（优先 padj）': 'Auto (prefer padj)',
    '使用原始 pvalue': 'Use raw pvalue',
    '标注基因数（最显著）': 'Label top-N genes',
    '点尺寸': 'Point size',
    'X 轴截断 |log₂FC| ≤': 'X-axis clamp |log₂FC| ≤',
    '最多绘制点数': 'Max plotted points',
    '显示图例': 'Show legend',
    '配色方案': 'Colour scheme',
    '经典红蓝灰（默认）': 'Classic red / blue / grey (default)',
    'Nature 出版配色': 'Nature-style palette',
    'Lancet 配色': 'Lancet palette',
    'JAMA 配色': 'JAMA palette',
    'NEJM 配色': 'NEJM palette',
    'Okabe–Ito 色盲友好': 'Okabe–Ito colour-blind safe',
    '单色灰阶（黑白印刷）': 'Monochrome grey (for B/W print)',
    '绘制火山图': 'Draw volcano plot',
    '输入数据中没有校正后 P 值列（padj/FDR），将使用原始 P 值。':
      'The input has no adjusted P-value column (padj/FDR); raw P values will be used.',
    '基因总数': 'Total genes',
    '显著上调': 'Significant up',
    '显著下调': 'Significant down',
    '不显著': 'Not significant',
    '阈值：|log₂FC| ≥ <b>{fc}</b> 且 {ptype} ≤ <b>{pc}</b>。注意：请根据实验设计选择合适的 P 值类型（原始 P 值易假阳性，校正后 P 值更保守）。':
      'Thresholds: |log₂FC| ≥ <b>{fc}</b> and {ptype} ≤ <b>{pc}</b>. Note: choose the P-value type appropriate for your design (raw P is prone to false positives; adjusted P is more conservative).',
    '火山图': 'Volcano plot',
    '差异基因结果表（按 P 值排序）': 'Differential gene table (sorted by P)',
    '基因': 'Gene',
    'P 值': 'P value',
    '表中标红的行为达到阈值的显著差异基因。可点右上角「导出 TSV」保存全部结果，或复制显著基因名去做富集分析。':
      'Highlighted rows are genes passing the thresholds. Use “Export TSV” at the top right to save all results, or copy the significant gene names for enrichment analysis.',
    '数据量较大（{n} 个基因），为提升渲染性能，图中按每 {stride} 个点抽样 1 个绘制；导出 SVG 与表格不受影响（表格为全部数据）。可调整「最多绘制点数」。':
      'Large dataset ({n} genes): for rendering performance, 1 in every {stride} points is drawn; SVG export and the table are unaffected (the table contains all rows). Adjust “Max plotted points”.',

    /* 多组模式 */
    '↑{u} / ↓{d}': '↑{u} / ↓{d}',
    '样本分组（必填）': 'Sample groups (required)',
    '样本名与矩阵列名必须完全一致；每行一组「样本名 <TAB> 分组名」，也可只写一行表头按列顺序给出分组名。':
      'Sample names must match the matrix column names exactly; write one “sample <TAB> group” pair per line, or a single header row giving group names in column order.',
    '插入示例分组': 'Insert example groups',
    '已插入示例分组信息': 'Example group annotation inserted',
    '未解析到有效的表达矩阵': 'No valid expression matrix was parsed',
    '请提供样本分组信息（每行「样本名 <TAB> 分组名」）':
      'Please provide sample group information (one “sample <TAB> group” pair per line)',
    '以下样本在分组信息中缺失：{list}': 'These samples are missing from the group annotation: {list}',
    '需要至少两个可用分组、且每组至少 2 个样本。当前可用分组：{list}':
      'At least two usable groups with ≥ 2 samples each are required. Usable groups: {list}',
    '两两比较共 {n} 个（{pairs}）；每组样本数不足 2 的分组已跳过。':
      '{n} pairwise contrasts were tested ({pairs}); groups with fewer than 2 samples were skipped.',
    '矩阵共有 {n} 个分组，已按你的指定只绘制 {m} 个比较。':
      'The annotation defines {n} groups; only the {m} contrast(s) you specified are drawn.',
    '比较组合超过 {m} 个，仅绘制前 {m} 个（可用「仅比较这些组合」指定）。':
      'More than {m} contrasts; only the first {m} are drawn (restrict via “Only these contrasts”).',
    '层叠模式说明：每个比较一种颜色，阈值线共用；适合比较数 ≤ 4 的概览。需要精确展示单一比较时请用分面模式。':
      'Stacked mode: one colour per contrast with shared threshold lines; suited to overviews of ≤ 4 contrasts. Use the faceted mode to present a single contrast precisely.',
    '分面模式说明：每个比较一个子图，坐标轴范围统一（便于跨图比较），子图标题 = 比较名称。':
      'Faceted mode: one subplot per contrast with shared axis limits (for comparability across panels); subplot titles are the contrast names.',
    '对比': 'Contrast',
    '各比较的显著基因数': 'Significant genes per contrast',
    '基因数过多（{n}），请先按表达量或方差筛选后再分析（建议 ≤ 20000 个基因）。':
      'Too many genes ({n}); filter by expression or variance first (we suggest ≤ 20000 genes).'
  });

  var FORMATS = [
    {
      name: '基因 + log2FC + P 值',
      filename: 'volcano_template.tsv',
      desc: '<b>至少三列：基因名、log2FC（差异倍数对数）、P 值</b>。列名会自动识别：' +
        '<code>gene/symbol/id</code>、<code>log2FoldChange/log2FC/foldchange</code>、' +
        '<code>pvalue/p.val</code> 或 <code>padj/FDR/qvalue</code>。含 <code>padj</code> 时优先用校正后 P 值。',
      sample: 'gene\tlog2FoldChange\tpvalue\tpadj\n' +
        'TP53\t2.3410\t0.00012\t0.0031\n' +
        'BRCA1\t-1.8820\t0.00431\t0.0412\n' +
        'MKI67\t3.1200\t0.00000041\t0.00012\n' +
        'MYC\t1.2200\t0.21000\t0.53200\n' +
        'CDK1\t2.8800\t0.0000310\t0.0011'
    },
    {
      name: '基因 + log2FC + P（两列格式亦可）',
      filename: 'volcano_template_2col.tsv',
      desc: '只有基因名、log2FC、P 值三列时同样可用；若第一列不是基因名，工具会按行号自动编号。',
      sample: 'gene\tlog2FoldChange\tpvalue\nA1BG\t0.21\t0.62\nA2M\t-1.44\t0.0087\nAURKA\t2.05\t0.00021'
    },
    {
      name: '表达矩阵（多组两两对比）',
      filename: 'volcano_matrix_template.tsv',
      desc: '第一行为样本名、第一列为基因名。<b>分组信息在下方「样本分组」中单独填写</b>（每行「样本名 <TAB> 分组名」）。' +
        '程序会对所有分组两两组合分别做 Welch t 检验并计算 log₂FC，再逐一绘制火山图；' +
        '比较组合较多时建议用「仅比较这些组合」指定需要的对比（如 <code>Control:Treatment</code>）。',
      sample: 'Gene\tC1\tC2\tC3\tT1\tT2\tT3\n' +
        'MKI67\t7.12\t7.44\t6.98\t9.85\t9.52\t10.11\n' +
        'CD8A\t9.24\t9.61\t9.02\t7.35\t7.12\t7.58\n' +
        'TP53\t8.10\t8.02\t8.24\t8.19\t8.05\t8.16'
    }
  ];

  WB.register({
    id: 'volcano',
    name: '火山图',
    icon: '▲',
    color: '#d6483f',
    desc: '差异表达基因分布：log2FC 对 −log₁₀ P，自动标注显著上调/下调基因，可导出显著基因列表；支持表达矩阵输入并对多组做两两比较（层叠 / 分面排版）。',
    tags: ['差异表达', '阈值标注', '导出基因', '多组对比'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('火山图') }),
        el('p', { text: T('横轴为 log₂ 差异倍数，纵轴为 −log₁₀ P 值；可自定义阈值并标注 Top 基因。') })
      ]));

      var gTa = null;
      var panel = WB.ui.inputPanel({
        title: '输入差异分析结果',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.volcanoText,
        placeholder: 'gene\tlog2FoldChange\tpvalue\nTP53\t2.3410\t0.00012\n...',
        paramsTitle: '绘图参数',
        params: [
          {
            key: 'inputMode', label: '输入模式', type: 'select', value: 'table',
            options: [
              { value: 'table', label: '差异分析结果表（基因 + log2FC + P）' },
              { value: 'matrix', label: '表达矩阵（自动两两比较）' }
            ]
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
            key: 'multiLayout', label: '多组排版方式', type: 'select', value: 'facet',
            options: [
              { value: 'facet', label: '分面（每个比较一个子图）' },
              { value: 'stacked', label: '层叠（同一坐标系按比较着色）' }
            ]
          },
          {
            key: 'onlyPairs', label: '仅比较这些组合（可选）', type: 'text', value: '', width: 'full',
            hint: '格式「A:B」，逗号或分号分隔；留空则对所有分组两两组合（组数 ≤ 6）。示例：Control:Treat24h, Control:Treat72h'
          },
          { key: 'fcCut', label: '|log₂FC| 阈值', type: 'number', value: 1, min: 0, max: 10, step: 0.1 },
          { key: 'pCut', label: 'P 值阈值', type: 'number', value: 0.05, min: 0.000001, max: 1, step: 0.001 },
          {
            key: 'pType', label: 'P 值列', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动（优先 padj）' },
              { value: 'pvalue', label: '使用原始 pvalue' }
            ]
          },
          { key: 'topN', label: '标注基因数（最显著）', type: 'number', value: 12, min: 0, max: 60, step: 1 },
          { key: 'dotSize', label: '点尺寸', type: 'number', value: 2.4, min: 0.8, max: 6, step: 0.2 },
          {
            key: 'palette', label: '配色方案', type: 'select', value: 'classic',
            options: [
              { value: 'classic', label: '经典红蓝灰（默认）' },
              { value: 'npg', label: 'Nature 出版配色' },
              { value: 'lancet', label: 'Lancet 配色' },
              { value: 'jama', label: 'JAMA 配色' },
              { value: 'nejm', label: 'NEJM 配色' },
              { value: 'okabe', label: 'Okabe–Ito 色盲友好' },
              { value: 'mono', label: '单色灰阶（黑白印刷）' }
            ]
          },
          { key: 'xCap', label: 'X 轴截断 |log₂FC| ≤', type: 'number', value: 8, min: 1, max: 30, step: 1 },
          { key: 'maxPoints', label: '最多绘制点数', type: 'number', value: 30000, min: 100, max: 200000, step: 100 },
          { key: 'showLegend', label: '显示图例', type: 'checkbox', value: true }
        ],
        extraValues: function () { return { groups: gTa ? gTa.value : '' }; },
        extraState: {
          ready: function () { return !!gTa; },
          get: function () { return gTa ? gTa.value : ''; },
          set: function (v) { if (gTa) gTa.value = v || ''; }
        },
        runLabel: '绘制火山图',
        onRun: function (ctx) {
          var res = WB.$('#volcano-result');
          WB.clear(res);
          if (ctx.values.inputMode === 'matrix') runMatrixMode(res, ctx);
          else runTableMode(res, ctx);
        }
      });

      /* 分组注释附加区（矩阵模式使用） */
      var groupBox = el('div.param-box');
      groupBox.appendChild(el('div.param-head', { text: T('样本分组（必填）') }));
      gTa = el('textarea.paste-area', {
        rows: 4,
        placeholder: 'Sample\tGroup\nC1\tControl\nC2\tControl\nT1\tTreatment\nT2\tTreatment'
      });
      gTa.style.minHeight = '84px';
      groupBox.appendChild(gTa);
      groupBox.appendChild(el('div.field-hint', {
        text: T('样本名与矩阵列名必须完全一致；每行一组「样本名 <TAB> 分组名」，也可只写一行表头按列顺序给出分组名。')
      }));
      groupBox.appendChild(el('div.format-actions', [
        el('button.btn.btn-ghost.btn-xs', {
          text: T('插入示例分组'),
          onclick: function () {
            gTa.value = WB.demo.diffexpGroups;
            panel.save();
            WB.toast(T('已插入示例分组信息'), 'ok');
          }
        })
      ]));
      gTa.addEventListener('input', WB.debounce(function () { panel.save(); }, 300));
      panel.extraSlot.appendChild(groupBox);
      panel.restoreExtra();

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'volcano-result';
      main.appendChild(wrap);
      if (!WB._volDemoLoaded) { WB._volDemoLoaded = true; panel.setText(WB.demo.volcanoText); }
    }
  });

  /* ============================ 模式 A：结果表 ============================ */

  function runTableMode(res, ctx) {
    var pv = WB.parse.parseVolcano(ctx.text, {});
    var usePadj = ctx.values.pType === 'auto' && pv.hasPadj;
    if (!usePadj && !pv.hasPadj && ctx.values.pType === 'pvalue') {
      res.appendChild(WB.ui.alertBox('warn', T('输入数据中没有校正后 P 值列（padj/FDR），将使用原始 P 值。')));
    }
    var rows = pv.rows;
    var fcCut = Number(ctx.values.fcCut) || 0;
    var pCut = Number(ctx.values.pCut) || 0.05;

    rows.forEach(function (r) {
      r.sig = (r.p <= pCut);
      r.up = r.log2FC >= fcCut && r.sig;
      r.down = r.log2FC <= -fcCut && r.sig;
      r.cat = r.up ? 'up' : (r.down ? 'down' : 'ns');
      r.category = T(r.cat === 'up' ? 'common.up' : (r.cat === 'down' ? 'common.down' : 'common.ns'));
      r.score = Math.abs(r.log2FC) * -Math.log10(Math.max(r.p, 1e-300));
    });

    var up = rows.filter(function (r) { return r.up; });
    var down = rows.filter(function (r) { return r.down; });
    var ns = rows.length - up.length - down.length;

    res.appendChild(WB.ui.statBar([
      { label: T('基因总数'), value: rows.length },
      { label: T('显著上调'), value: up.length, tone: 'red' },
      { label: T('显著下调'), value: down.length, tone: 'green' },
      { label: T('不显著'), value: ns },
      { label: T('P 值列'), value: usePadj ? 'padj' : 'P' }
    ]));
    res.appendChild(WB.ui.alertBox('info',
      T('阈值：|log₂FC| ≥ <b>{fc}</b> 且 {ptype} ≤ <b>{pc}</b>。注意：请根据实验设计选择合适的 P 值类型（原始 P 值易假阳性，校正后 P 值更保守）。',
        { fc: fcCut, ptype: usePadj ? 'padj' : 'P', pc: pCut })));

    var card = WB.ui.resultCard(T('火山图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = drawVolcano(holder, rows, {
      fcCut: fcCut, pCut: pCut, topN: Number(ctx.values.topN) || 0,
      dotSize: Number(ctx.values.dotSize) || 2.4,
      palette: schemeOf(ctx.values.palette),
      xCap: Number(ctx.values.xCap) || 8,
      maxPoints: Number(ctx.values.maxPoints) || 30000,
      showLegend: !!ctx.values.showLegend
    });
    WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'volcano' });

    /* 结果表 */
    var tCard = WB.ui.resultCard(T('差异基因结果表（按 P 值排序）'));
    res.appendChild(tCard);
    var tBody = tCard.querySelector('.card-body');
    var sorted = rows.slice().sort(function (a, b) { return a.p - b.p; }).map(function (r, i) {
      return { gene: r.gene, log2FC: r.log2FC, p: r.p, category: r.category, rank: i + 1, sig: r.sig };
    });
    WB.ui.dataTable(tBody, [
      { key: 'rank', label: '#', align: 'right', width: 56 },
      { key: 'gene', label: T('基因') },
      { key: 'log2FC', label: 'log₂FC', align: 'right', width: 90, format: function (r) { return WB.formatNum(r.log2FC, 4); } },
      { key: 'p', label: usePadj ? 'padj' : T('P 值'), align: 'right', width: 110, format: function (r) { return WB.pFormat(r.p); } },
      {
        key: 'category', label: T('volcano.type'), width: 96,
        format: function (r) { return r.category; },
        render: function (r) {
          return el('span.tag-cat.tag-' + r.cat, { text: r.category });
        }
      }
    ], sorted, {
      pageSize: 25, exportName: 'volcano_results',
      rowClass: function (r) { return r.sig ? 'row-sig' : ''; }
    });
    tBody.appendChild(el('div.preview-note', {
      text: T('表中标红的行为达到阈值的显著差异基因。可点右上角「导出 TSV」保存全部结果，或复制显著基因名去做富集分析。')
    }));
  }

  /* ======================= 模式 B：表达矩阵多组对比 ======================= */

  function runMatrixMode(res, ctx) {
    var m = WB.parse.parseMatrix(ctx.text, {});
    if (!m.matrix.length || !m.colNames.length) throw new Error(T('未解析到有效的表达矩阵'));

    /* 基因名去重 */
    var genes = [], mat = [], seen = {};
    m.rowNames.forEach(function (g, i) {
      var key = String(g).trim();
      if (seen[key]) return;
      seen[key] = 1;
      genes.push(key);
      mat.push(m.matrix[i]);
    });
    if (genes.length > 20000) throw new Error(T('基因数过多（{n}），请先按表达量或方差筛选后再分析（建议 ≤ 20000 个基因）。', { n: genes.length }));

    var samples = m.colNames;
    var gmap = parseGroups(ctx.values.groups || '', samples);
    var idxByGroup = {}, groupNames = [];
    samples.forEach(function (s, i) {
      var g = String(gmap[s] || '').trim();
      if (!g) return;
      if (!idxByGroup[g]) { idxByGroup[g] = []; groupNames.push(g); }
      idxByGroup[g].push(i);
    });
    var usable = groupNames.filter(function (g) { return idxByGroup[g].length >= 2; });
    if (usable.length < 2) {
      throw new Error(T('需要至少两个可用分组、且每组至少 2 个样本。当前可用分组：{list}',
        { list: usable.join(', ') || '—' }));
    }

    /* 比较列表 */
    var wanted = [];
    String(ctx.values.onlyPairs || '').split(/[,;，；]+/).forEach(function (tok) {
      var p = tok.trim().split(/[:：]/);
      if (p.length === 2 && usable.indexOf(p[0].trim()) >= 0 && usable.indexOf(p[1].trim()) >= 0) {
        wanted.push([p[0].trim(), p[1].trim()]);
      }
    });
    var MAXC = 8, pairNote = '';
    var comps = [];
    if (wanted.length) {
      comps = wanted;
      if (usable.length > 2) {
        pairNote = T('矩阵共有 {n} 个分组，已按你的指定只绘制 {m} 个比较。', { n: usable.length, m: comps.length });
      }
    } else {
      for (var i = 0; i < usable.length; i++) {
        for (var j = i + 1; j < usable.length; j++) comps.push([usable[i], usable[j]]);
      }
      if (comps.length > MAXC) {
        pairNote = T('比较组合超过 {m} 个，仅绘制前 {m} 个（可用「仅比较这些组合」指定）。', { m: MAXC });
        comps = comps.slice(0, MAXC);
      }
    }
    if (!comps.length) throw new Error(T('需要至少两个可用分组、且每组至少 2 个样本。当前可用分组：{list}', { list: usable.join(', ') }));

    /* 数据尺度（与差异表达模块同一套口径） */
    var scaleSel = ctx.values.dataScale || 'auto';
    var scale = scaleSel === 'auto' ? (WB.diffexp.detectScale(mat) === 'count' ? 'count' : 'log') : scaleSel;
    var prep = WB.diffexp.preprocessMatrix(mat, scale);
    mat = prep.data;

    var fcCut = Number(ctx.values.fcCut) || 0;
    var pCut = Number(ctx.values.pCut) || 0.05;
    var topN = Number(ctx.values.topN) || 0;
    var cfgCommon = {
      fcCut: fcCut, pCut: pCut, topN: topN,
      dotSize: Number(ctx.values.dotSize) || 2.4,
      palette: schemeOf(ctx.values.palette),
      xCap: Number(ctx.values.xCap) || 8,
      maxPoints: Math.max(500, Math.floor((Number(ctx.values.maxPoints) || 30000) / comps.length)),
      showLegend: false
    };

    /* 逐比较检验 */
    var results = comps.map(function (pair, ci) {
      var ia = idxByGroup[pair[0]], ib = idxByGroup[pair[1]];
      var rows = genes.map(function (g, gi) {
        var A = ia.map(function (k) { return mat[gi][k]; }).filter(isFinite);
        var B = ib.map(function (k) { return mat[gi][k]; }).filter(isFinite);
        var tt = WB.stats.welchTTest(A, B);
        var lfc = WB.stats.mean(B) - WB.stats.mean(A);
        return { gene: g, log2FC: lfc, p: tt.p };
      });
      rows.forEach(function (r) {
        r.sig = r.p <= pCut;
        r.up = r.log2FC >= fcCut && r.sig;
        r.down = r.log2FC <= -fcCut && r.sig;
        r.score = Math.abs(r.log2FC) * -Math.log10(Math.max(r.p, 1e-300));
      });
      return {
        name: pair[0] + ' vs ' + pair[1],
        rows: rows,
        color: WB.plot.palette(ci)
      };
    });

    res.appendChild(WB.ui.alertBox('info',
      T('两两比较共 {n} 个（{pairs}）；每组样本数不足 2 的分组已跳过。', {
        n: comps.length, pairs: comps.map(function (p) { return p[0] + ':' + p[1]; }).join('、')
      })));
    if (pairNote) res.appendChild(WB.ui.alertBox('warn', pairNote));
    if (scale === 'count') {
      res.appendChild(WB.ui.alertBox('warn',
        T('计数矩阵的组间比较在 log₂-CPM 尺度上用 t 检验，相当于 limma-trend 的近似；若需负二项模型的精确检验，建议再用 DESeq2 / edgeR 复核。')));
    }

    /* 比较汇总条 */
    var sumRows = results.map(function (r, i) {
      var upN = r.rows.filter(function (x) { return x.up; }).length;
      var dnN = r.rows.filter(function (x) { return x.down; }).length;
      return { rank: i + 1, name: r.name, color: r.color, genes: r.rows.length, up: upN, down: dnN };
    });
    res.appendChild(WB.ui.statBar(sumRows.map(function (r) {
      return { label: r.name, value: T('↑{u} / ↓{d}', { u: r.up, d: r.down }), tone: (r.up + r.down) ? 'red' : '' };
    })));

    /* 绘图 */
    var stacked = ctx.values.multiLayout === 'stacked';
    var card = WB.ui.resultCard(T('火山图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = stacked
      ? drawVolcanoStacked(holder, results, cfgCommon)
      : drawVolcanoFacet(holder, results, cfgCommon);
    WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'volcano_multi' });
    body.appendChild(el('div.preview-note', {
      text: stacked
        ? T('层叠模式说明：每个比较一种颜色，阈值线共用；适合比较数 ≤ 4 的概览。需要精确展示单一比较时请用分面模式。')
        : T('分面模式说明：每个比较一个子图，坐标轴范围统一（便于跨图比较），子图标题 = 比较名称。')
    }));

    /* 各比较显著基因表 */
    var allRows = [];
    results.forEach(function (r) {
      r.rows.forEach(function (x) {
        if (x.sig) allRows.push({ comp: r.name, gene: x.gene, log2FC: x.log2FC, p: x.p });
      });
    });
    allRows.sort(function (a, b) { return a.p - b.p; });
    var tCard = WB.ui.resultCard(T('差异基因结果表（按 P 值排序）'));
    res.appendChild(tCard);
    WB.ui.dataTable(tCard.querySelector('.card-body'), [
      { key: 'comp', label: T('对比') },
      { key: 'gene', label: T('基因') },
      { key: 'log2FC', label: 'log₂FC', align: 'right', width: 90, format: function (r) { return WB.formatNum(r.log2FC, 4); } },
      { key: 'p', label: T('P 值'), align: 'right', width: 100, format: function (r) { return WB.pFormat(r.p); } }
    ], allRows, { pageSize: 25, exportName: 'volcano_multi_results' });
    tCard.querySelector('.card-body').appendChild(el('div.preview-note', {
      text: T('表中标红的行为达到阈值的显著差异基因。可点右上角「导出 TSV」保存全部结果，或复制显著基因名去做富集分析。')
    }));
  }

  /** 简化版分组解析（与差异表达模块同一约定） */
  function parseGroups(text, samples) {
    if (!text || !text.trim()) {
      throw new Error(T('请提供样本分组信息（每行「样本名 <TAB> 分组名」）'));
    }
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
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

  /** 单个火山图（写入给定容器） */
  function drawVolcano(container, rows, cfg) {
    if (!rows.length) { WB.plot.emptyState(container, T('common.noData')); return null; }
    var W = 660, H = 500;
    var canvas = WB.plot.createSVG(container, W, H, {});
    drawPanel(canvas.root, rows, cfg, { x: 0, y: 0, w: W, h: H }, { title: null, legend: cfg.showLegend, container: container });
    return canvas.svg;
  }

  /**
   * 火山图核心：在 box 指定的矩形内绘图
   * @returns {{sx, sy, yMax, xCap, stride, pts}} 供层叠模式复用
   */
  function drawPanel(root, rows, cfg, box, opt) {
    var xCap = cfg.xCap;
    var pal = cfg.palette || SCHEMES.classic;
    var fs = WB.clamp(box.w / 660, 0.62, 1.05);
    /* 轴字体规范：刻度 12.5px（分面小图不低于 11px）、轴标题 13.5px，近墨色 + 600 字重 */
    var tfs = Math.max(11, 12.5 * fs);
    var afs = Math.max(12, 13.5 * fs);
    var negLogs = rows.map(function (r) { return -Math.log10(Math.max(r.p, 1e-300)); });
    negLogs.sort(function (a, b) { return a - b; });
    var q = negLogs[Math.floor(negLogs.length * 0.995)];
    var yMax = opt.fixedYMax || Math.max(Math.min(q, 60), -Math.log10(cfg.pCut) * 1.6, 4);
    /* 左边距按 y 轴刻度文字实际宽度自适应：放大字号后刻度与轴标题不会互相挤压 */
    var yLabW = Math.max(WB.plot.textW(WB.formatNum(yMax, 1), tfs), WB.plot.textW('0.0', tfs));
    var m = {
      l: Math.max(56 * box.w / 660, yLabW + 30),
      r: 24 * box.w / 660,
      t: (opt.title ? 40 : 26) * box.h / 500,
      b: 56 * box.h / 500
    };
    var sx = WB.plot.linearScale(-xCap, xCap, box.x + m.l, box.x + box.w - m.r);
    var sy = WB.plot.linearScale(0, yMax, box.y + box.h - m.b, box.y + m.t);

    sx.ticks(8).forEach(function (t) {
      if (t < -xCap || t > xCap) return;
      root.appendChild(S('line', { x1: sx(t), y1: box.y + m.t, x2: sx(t), y2: box.y + box.h - m.b, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(sx(t), box.y + box.h - m.b + Math.max(14, 15 * fs), WB.formatNum(t, 2),
        { 'text-anchor': 'middle', 'font-size': tfs, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    sy.ticks(6).forEach(function (t) {
      if (t < 0 || t > yMax) return;
      root.appendChild(S('line', { x1: box.x + m.l, y1: sy(t), x2: box.x + box.w - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(box.x + m.l - 7, sy(t) + tfs * 0.28, WB.formatNum(t, 1),
        { 'text-anchor': 'end', 'font-size': tfs, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });

    [cfg.fcCut, -cfg.fcCut].forEach(function (fc) {
      if (Math.abs(fc) <= xCap) {
        root.appendChild(S('line', {
          x1: sx(fc), y1: box.y + m.t, x2: sx(fc), y2: box.y + box.h - m.b,
          stroke: '#b6c2cc', 'stroke-dasharray': '5 4'
        }));
      }
    });
    var yCut = Math.min(-Math.log10(cfg.pCut), yMax);
    root.appendChild(S('line', {
      x1: box.x + m.l, y1: sy(yCut), x2: box.x + box.w - m.r, y2: sy(yCut),
      stroke: '#b6c2cc', 'stroke-dasharray': '5 4'
    }));

    var stride = Math.max(1, Math.ceil(rows.length / cfg.maxPoints));
    var pts = [];
    for (var i = 0; i < rows.length; i += stride) {
      var r = rows[i];
      pts.push({
        x: sx(WB.clamp(r.log2FC, -xCap, xCap)),
        y: sy(Math.min(-Math.log10(Math.max(r.p, 1e-300)), yMax)),
        r: r
      });
    }
    ['ns', 'down', 'up'].forEach(function (cat) {
      var rad = (cat === 'ns' ? cfg.dotSize * 0.72 : cfg.dotSize) * fs;
      var d = '';
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        var isCat = cat === 'up' ? p.r.up : (cat === 'down' ? p.r.down : !p.r.up && !p.r.down);
        if (!isCat) continue;
        d += 'M' + p.x.toFixed(1) + ',' + p.y.toFixed(1) +
          'm' + (-rad).toFixed(1) + ',0a' + rad + ',' + rad + ' 0 1,0 ' + (rad * 2) + ',0a' + rad + ',' + rad + ' 0 1,0 ' + (-rad * 2) + ',0z';
      }
      if (d) root.appendChild(S('path', { d: d, fill: cfg.color || pal[cat], 'fill-opacity': cat === 'ns' ? 0.55 : 0.8 }));
    });

    root.appendChild(S('rect', {
      x: box.x + m.l, y: box.y + m.t, width: box.w - m.l - m.r, height: box.h - m.t - m.b,
      fill: 'none', stroke: WB.plot.AXIS
    }));

    /* 轴标题 */
    root.appendChild(WB.plot.txt(box.x + m.l + (box.w - m.l - m.r) / 2, box.y + box.h - Math.max(16, 18 * fs), T('volcano.xAxis'),
      { 'text-anchor': 'middle', 'font-size': afs, 'font-weight': 600, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, T('volcano.yAxis'),
      { 'text-anchor': 'middle', 'font-size': afs, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(box.y + m.t + (box.h - m.t - m.b) / 2));
    yl.setAttribute('y', box.x + 13);
    root.appendChild(yl);

    /* 顶部基因标注 */
    if (cfg.topN > 0) {
      var cand = rows.filter(function (r) { return r.sig; })
        .sort(function (a, b) { return b.score - a.score; }).slice(0, cfg.topN);
      if (!cand.length) {
        cand = rows.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, Math.min(cfg.topN, 6));
      }
      var placed = [];
      cand.forEach(function (r) {
        var x = sx(WB.clamp(r.log2FC, -xCap, xCap));
        var y = sy(Math.min(-Math.log10(Math.max(r.p, 1e-300)), yMax));
        if (placed.some(function (p) { return Math.abs(p.x - x) < 24 * fs && Math.abs(p.y - y) < 10 * fs; })) return;
        placed.push({ x: x, y: y });
        var anchor = x > box.x + box.w - m.r - 74 * fs ? 'end' : 'start';
        var tx = anchor === 'end' ? x - 6 : x + 6;
        y = Math.max(y, box.y + m.t + 12 * fs);
        var t = WB.plot.txt(tx, y - 5, r.gene, {
          'text-anchor': anchor, 'font-size': 10.5 * fs, 'font-weight': 600,
          fill: r.up ? shade(pal.up, 0.78) : (r.down ? shade(pal.down, 0.78) : WB.plot.TEXT)
        });
        t.setAttribute('paint-order', 'stroke');
        t.setAttribute('stroke', '#ffffff');
        t.setAttribute('stroke-width', '2.6');
        root.appendChild(t);
        root.appendChild(S('line', {
          x1: x, y1: y - 3, x2: tx + (anchor === 'end' ? 2 : -2), y2: y - 4.5,
          stroke: '#c9d5df', 'stroke-width': 0.7
        }));
      });
    }

    if (opt.title) {
      root.appendChild(WB.plot.txt(box.x + m.l + (box.w - m.l - m.r) / 2, box.y + 22, opt.title, {
        'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700, fill: WB.plot.TEXT
      }));
    }
    if (opt.legend && opt.container) {
      var counts = { up: 0, down: 0, ns: 0 };
      rows.forEach(function (r) { counts[r.up ? 'up' : (r.down ? 'down' : 'ns')]++; });
      WB.plot.legendCategorical(opt.container, [
        { color: pal.up, label: T('volcano.up') + ' (' + counts.up + ')' },
        { color: pal.down, label: T('volcano.down') + ' (' + counts.down + ')' },
        { color: pal.ns, label: T('volcano.ns') + ' (' + counts.ns + ')' }
      ]);
    }
    if (stride > 1 && opt.container && !opt.noStrideNote) {
      opt.container.appendChild(el('div.preview-note', {
        text: T('数据量较大（{n} 个基因），为提升渲染性能，图中按每 {stride} 个点抽样 1 个绘制；导出 SVG 与表格不受影响（表格为全部数据）。可调整「最多绘制点数」。',
          { n: rows.length, stride: stride })
      }));
    }
    return { sx: sx, sy: sy, yMax: yMax, xCap: xCap, stride: stride, pts: pts };
  }

  /** 层叠：每个比较一种颜色，共用坐标系 */
  function drawVolcanoStacked(container, results, cfg) {
    var W = 760, H = 540;
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    /* 先统计统一的坐标范围 */
    var all = [];
    results.forEach(function (r) { all = all.concat(r.rows); });
    var xCap = cfg.xCap;
    var negLogs = all.map(function (r) { return -Math.log10(Math.max(r.p, 1e-300)); }).sort(function (a, b) { return a - b; });
    var yMax = Math.max(Math.min(negLogs[Math.floor(negLogs.length * 0.995)], 60), -Math.log10(cfg.pCut) * 1.6, 4);
    var box = { x: 0, y: 0, w: W, h: H };

    /* 阈值线 */
    var mL = Math.max(62, WB.plot.textW(WB.formatNum(yMax, 1), 12.5) + 30);
    var m = { l: mL, r: 26, t: 26, b: 56 };
    var sx = WB.plot.linearScale(-xCap, xCap, m.l, W - m.r);
    var sy = WB.plot.linearScale(0, yMax, H - m.b, m.t);
    [cfg.fcCut, -cfg.fcCut].forEach(function (fc) {
      if (Math.abs(fc) <= xCap) {
        root.appendChild(S('line', { x1: sx(fc), y1: m.t, x2: sx(fc), y2: H - m.b, stroke: '#b6c2cc', 'stroke-dasharray': '5 4' }));
      }
    });
    root.appendChild(S('line', {
      x1: m.l, y1: sy(Math.min(-Math.log10(cfg.pCut), yMax)), x2: W - m.r, y2: sy(Math.min(-Math.log10(cfg.pCut), yMax)),
      stroke: '#b6c2cc', 'stroke-dasharray': '5 4'
    }));
    root.appendChild(S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: WB.plot.AXIS }));
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 18, T('volcano.xAxis'), { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, T('volcano.yAxis'), { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 13);
    root.appendChild(yl);
    sx.ticks(8).forEach(function (t) {
      if (t < -xCap || t > xCap) return;
      root.appendChild(S('line', { x1: sx(t), y1: m.t, x2: sx(t), y2: H - m.b, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(sx(t), H - m.b + 16, WB.formatNum(t, 2), { 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    sy.ticks(6).forEach(function (t) {
      if (t < 0 || t > yMax) return;
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, WB.formatNum(t, 1), { 'text-anchor': 'end', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });

    /* 逐比较绘制点 */
    results.forEach(function (res) {
      var per = Math.max(500, Math.floor(cfg.maxPoints / results.length));
      var stride = Math.max(1, Math.ceil(res.rows.length / per));
      ['ns', 'down', 'up'].forEach(function (cat) {
        var d = '';
        for (var i = 0; i < res.rows.length; i += stride) {
          var r = res.rows[i];
          var isCat = cat === 'up' ? r.up : (cat === 'down' ? r.down : !r.up && !r.down);
          if (!isCat) continue;
          d += 'M' + sx(WB.clamp(r.log2FC, -xCap, xCap)).toFixed(1) + ',' +
            sy(Math.min(-Math.log10(Math.max(r.p, 1e-300)), yMax)).toFixed(1) +
            'm-2.2,0a2.2,2.2 0 1,0 4.4,0a2.2,2.2 0 1,0 -4.4,0z';
        }
        if (d) {
          root.appendChild(S('path', {
            d: d, fill: res.color,
            'fill-opacity': cat === 'ns' ? 0.30 : 0.72
          }));
        }
      });
    });

    /* 图内图例（宽度随比较名长度自适应，超长按像素预算截断，不越出画布） */
    if (cfg.showLegend !== false) {
      var maxLn = 0;
      results.forEach(function (res) { maxLn = Math.max(maxLn, WB.plot.textW(res.name, 12)); });
      var lgW = Math.min(Math.max(Math.ceil(maxLn) + 34, 152), W - m.l - m.r - 20);
      var lx = W - m.r - lgW - 4, ly = m.t + 8;
      var lg = WB.plot.g({});
      root.appendChild(lg);
      lg.appendChild(S('rect', { x: lx - 6, y: ly - 6, width: lgW, height: results.length * 19 + 14, rx: 6, fill: '#ffffff', 'fill-opacity': 0.92, stroke: WB.plot.AXIS }));
      results.forEach(function (res, i) {
        var y = ly + 9 + i * 19;
        lg.appendChild(S('circle', { cx: lx + 6, cy: y, r: 3.4, fill: res.color, 'fill-opacity': 0.85 }));
        lg.appendChild(WB.plot.txt(lx + 15, y + 4, WB.plot.truncateW(res.name, lgW - 24, 12), { 'font-size': 12, fill: WB.plot.TEXT }));
      });
    }
    return canvas.svg;
  }

  /** 分面：每个比较一个子图，坐标范围统一 */
  function drawVolcanoFacet(container, results, cfg) {
    var k = results.length;
    var cols = Math.ceil(Math.sqrt(k));
    var rowsN = Math.ceil(k / cols);
    var PW = 480, PH = 400;
    var W = cols * PW, H = rowsN * PH;
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    /* 统一坐标范围 */
    var all = [];
    results.forEach(function (r) { all = all.concat(r.rows); });
    var negLogs = all.map(function (r) { return -Math.log10(Math.max(r.p, 1e-300)); }).sort(function (a, b) { return a - b; });
    var uniCfg = Object.assign({}, cfg, {
      maxPoints: Math.max(500, Math.floor(cfg.maxPoints)),
      xCap: cfg.xCap
    });
    var xCap = uniCfg.xCap;
    var yMax = Math.max(Math.min(negLogs[Math.floor(negLogs.length * 0.995)], 60), -Math.log10(cfg.pCut) * 1.6, 4);

    results.forEach(function (res, i) {
      var cx = (i % cols) * PW, cy = Math.floor(i / cols) * PH;
      drawPanel(root, res.rows, uniCfg, { x: cx, y: cy, w: PW, h: PH }, {
        title: res.name, legend: false, container: null,
        color: null, noStrideNote: true, fixedYMax: yMax
      });
    });
    return canvas.svg;
  }
})(window);
