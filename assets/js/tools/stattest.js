/* =============================================================================
 * tools/stattest.js  —  样本统计检验面板（两组及以上，含前提诊断与事后比较）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '对实验数据做统计检验：自动完成正态性与方差齐性诊断并推荐检验方法，支持两组与多组的独立或重复测量设计、两两事后比较，并输出发表级箱线图与效应量。':
      'Run statistical tests on experimental data: normality and homogeneity-of-variance diagnostics with an automatic test recommendation, independent or repeated-measures designs with two or more groups, pairwise post-hoc comparisons, publication-ready box plots and effect sizes.',
    '统计检验': 'Statistical tests',
    '假设检验': 'Hypothesis testing',
    '效应量': 'Effect size',
    '事后比较': 'Post-hoc comparison',
    '方差齐性': 'Homogeneity of variance',
    '正态性': 'Normality',
    '正态性检验（Shapiro–Wilk）': 'Normality test (Shapiro–Wilk)',
    '方差齐性检验（Levene，中位数）': 'Homogeneity of variance test (Levene, median)',
    '样本统计检验': 'Sample statistical tests',
    '宽表：第一列受试者编号，其余每列一个分组': 'Wide: first column = subject ID, each other column = one group',
    ['<b>第一列是受试者编号（文字或数字均可，没有编号时删掉该列），其余每列一个分组</b>。' +
      '同一行表示同一个受试者，可用于配对或重复测量设计。留空或 <code>NA</code> 表示缺失。']:
      '<b>The first column is the subject ID (text or numeric; delete the column if you have none) and every other column is one group</b>. ' +
      'The same row means the same subject, which enables paired or repeated-measures designs. Leave a cell blank or write <code>NA</code> for missing values.',
    '长表：受试者 + 分组 + 数值': 'Long: subject + group + value',
    ['<b>三列：受试者编号、分组名、数值</b>。同一受试者在多个分组出现时按配对处理；' +
      '同一（受试者, 分组）重复出现时取均值。']:
      '<b>Three columns: subject ID, group name, value</b>. A subject appearing in several groups is treated as paired; repeated (subject, group) records are averaged.',
    '列联表（计数，用于卡方 / Fisher）': 'Contingency table (counts, for chi-square / Fisher)',
    ['<b>每格一个频数</b>：行与列各代表一个分类变量，可用第一列放行名（文字）。' +
      '2×2 表同时给出 Fisher 精确检验；期望频数 < 5 时会给出提示。']:
      '<b>One frequency per cell</b>: rows and columns each represent one categorical variable, and the first column may hold row names (text). ' +
      'A 2×2 table also reports Fisher’s exact test; a warning is issued when any expected frequency is below 5.',
    '输入类型': 'Input type',
    '自动识别': 'Auto-detect',
    '宽表': 'Wide',
    '长表': 'Long',
    '列联表': 'Contingency table',
    '检验设定': 'Test settings',
    '实验设计': 'Experimental design',
    '自动（长表有受试者重复时按配对）': 'Auto (paired when subjects repeat in the long format)',
    '独立样本': 'Independent samples',
    '配对 / 重复测量': 'Paired / repeated measures',
    '检验方法': 'Test method',
    '自动推荐': 'Auto-recommended',
    '事后比较方法': 'Post-hoc method',
    '单样本比较的理论值 μ': 'Reference value μ for the one-sample test',
    '2×2 表使用 Yates 连续性校正': 'Use Yates continuity correction for 2×2 tables',
    '按检验方法自动选择': 'Chosen automatically for the test',
    '不做事后比较': 'No post-hoc comparison',
    'Tukey HSD': 'Tukey HSD',
    'Dunn 检验': 'Dunn test',
    '成对 t 检验（BH 校正）': 'Pairwise t-tests (BH corrected)',
    '成对 Wilcoxon 符号秩检验（BH 校正）': 'Pairwise Wilcoxon signed-rank tests (BH corrected)',
    '绘图参数': 'Plot parameters',
    '显示单样本散点': 'Show individual points',
    '显示显著性括线': 'Show significance brackets',
    '最多显示比较对数': 'Max pairs shown',
    '执行统计检验': 'Run statistical tests',
    '分组数': 'Groups',
    '样本总数': 'Total samples',
    '推荐方法': 'Recommended method',
    '未解析到有效数据，请检查输入格式': 'No valid data were parsed; please check the input format',
    '至少需要 2 个分组才能做组间检验；单组请改用「单样本比较的理论值 μ」':
      'At least two groups are needed for a between-group test; with a single group use the reference value μ instead',
    '长表需要三列（受试者 + 分组 + 数值）': 'The long format needs three columns (subject + group + value)',
    '列联表至少需要 2 行 × 2 列': 'A contingency table needs at least 2 rows × 2 columns',
    '当前设定下无法完成检验，请检查分组数与实验设计': 'The test cannot be run with the current settings; check the number of groups and the design',
    '描述统计': 'Descriptive statistics',
    '分组': 'Group',
    '均值': 'Mean',
    '标准差': 'SD',
    '标准误': 'SEM',
    '中位数': 'Median',
    '四分位距': 'IQR',
    '正态性 P（Shapiro–Wilk）': 'Normality P (Shapiro–Wilk)',
    '缺失': 'Missing',
    '前提诊断': 'Assumption checks',
    '检查项': 'Check',
    '方法': 'Method',
    '统计量': 'Statistic',
    'P 值': 'P value',
    '结论': 'Conclusion',
    '满足': 'Satisfied',
    '不满足': 'Violated',
    '全部分组均满足正态性（Shapiro–Wilk，P ≥ 0.05）': 'All groups pass the normality check (Shapiro–Wilk, P ≥ 0.05)',
    '方差齐性满足（Levene 检验，P ≥ 0.05）': 'Homogeneity of variance holds (Levene test, P ≥ 0.05)',
    '检验结果': 'Test result',
    '检验方法': 'Method',
    '自由度': 'Degrees of freedom',
    '95% 置信区间': '95% confidence interval',
    '效应量解释': 'Effect size interpretation',
    '可忽略': 'Negligible',
    '小': 'Small',
    '中': 'Medium',
    '大': 'Large',
    '差异有统计学意义（P < 0.05）': 'Statistically significant (P < 0.05)',
    '差异无统计学意义（P ≥ 0.05）': 'Not statistically significant (P ≥ 0.05)',
    '两两比较': 'Pairwise comparisons',
    '均值差': 'Mean difference',
    '显著性': 'Significance',
    ' omnibus 检验不显著，事后比较仅供参考': 'The omnibus test is not significant, so post-hoc results are indicative only',
    '单样本 t 检验': 'One-sample t-test',
    '单样本 Wilcoxon 符号秩检验': 'One-sample Wilcoxon signed-rank test',
    'Student t 检验（假定等方差）': 'Student’s t-test (equal variances assumed)',
    'Welch t 检验（不假定等方差）': 'Welch’s t-test (equal variances not assumed)',
    'Mann–Whitney U 检验': 'Mann–Whitney U test',
    '配对 t 检验': 'Paired t-test',
    '配对 Wilcoxon 符号秩检验': 'Paired Wilcoxon signed-rank test',
    '单因素方差分析（ANOVA）': 'One-way ANOVA',
    'Kruskal–Wallis 检验': 'Kruskal–Wallis test',
    '重复测量方差分析': 'Repeated-measures ANOVA',
    'Friedman 检验': 'Friedman test',
    '卡方独立性检验': 'Chi-square test of independence',
    'Fisher 精确检验': 'Fisher’s exact test',
    '组别效应：η² = 组间平方和 / 总平方和；ε² 与 Kendall’s W 为对应的非参数效应量；Cohen’s d 为两组标准化均值差。':
      'Group effect: η² = SS(between) / SS(total); ε² and Kendall’s W are the corresponding non-parametric effect sizes; Cohen’s d is the standardised mean difference for two groups.',
    '箱线图：箱体为四分位距（Q1–Q3），中线为中位数，须为 1.5×IQR；点为单个样本。':
      'Box plot: the box spans the interquartile range (Q1–Q3) with the median line and 1.5×IQR whiskers; dots are individual samples.',
    ['推荐依据：先做 Shapiro–Wilk 正态性检验与 Levene 方差齐性检验，再按「组数 + 设计 + 前提是否满足」选择检验；' +
      '不满足正态性时改用秩检验，方差不齐时改用 Welch 校正。']:
      'Recommendation rule: Shapiro–Wilk normality and Levene homogeneity tests are run first, then the test is chosen from the number of groups, the design and whether the assumptions hold; rank-based tests are used when normality fails and Welch correction when variances differ.',
    '数据满足前提，使用参数检验。': 'Assumptions are satisfied, so a parametric test is used.',
    '正态性不满足，改用秩检验。': 'Normality is violated, so a rank-based test is used.',
    '方差不齐，改用不假定等方差的方法。': 'Variances differ, so a method without the equal-variance assumption is used.',
    '配对 / 重复测量设计，使用被试内检验。': 'A paired / repeated-measures design, so a within-subject test is used.',
    '列联表标准化残差图': 'Standardised residual plot for the contingency table',
    '标准化残差 = （观测频数 − 期望频数）/ √期望频数；正值（红）表示观测多于期望，负值（蓝）表示少于期望。':
      'Standardised residual = (observed − expected) / √expected; positive values (red) mean more observations than expected and negative values (blue) fewer.',
    '列联表明细': 'Contingency table detail',
    '行': 'Row',
    '列': 'Column',
    '观测频数': 'Observed',
    '期望频数': 'Expected',
    '标准化残差': 'Standardised residual',
    '存在期望频数 < 5 的单元格，卡方近似不可靠，建议参考 Fisher 精确检验或合并类别。':
      'Some cells have expected frequencies below 5, so the chi-square approximation is unreliable; consider Fisher’s exact test or merging categories.',
    '优势比（OR）': 'Odds ratio (OR)',
    '建议至少每组 3 个样本才能做正态性诊断': 'At least 3 samples per group are recommended for the normality check'
  });

  var FORMATS = [
    {
      name: '宽表：第一列受试者编号，其余每列一个分组',
      filename: 'stattest_wide_template.tsv',
      desc: '<b>第一列是受试者编号（文字或数字均可，没有编号时删掉该列），其余每列一个分组</b>。' +
        '同一行表示同一个受试者，可用于配对或重复测量设计。留空或 <code>NA</code> 表示缺失。',
      sample: 'Subject\tControl\tTreated\tRescue\n' +
        'P01\t12.4\t18.2\t14.1\n' +
        'P02\t11.8\t17.4\t13.6\n' +
        'P03\t13.1\t19.6\t14.8\n' +
        'P04\t12.2\t18.9\t13.9\n' +
        'P05\t12.9\t17.8\t14.4\n' +
        'P06\t11.5\t18.5\t13.2'
    },
    {
      name: '长表：受试者 + 分组 + 数值',
      filename: 'stattest_long_template.tsv',
      desc: '<b>三列：受试者编号、分组名、数值</b>。同一受试者在多个分组出现时按配对处理；' +
        '同一（受试者, 分组）重复出现时取均值。',
      sample: 'Subject\tGroup\tValue\n' +
        'P01\tControl\t12.4\n' +
        'P01\tTreated\t18.2\n' +
        'P01\tRescue\t14.1\n' +
        'P02\tControl\t11.8\n' +
        'P02\tTreated\t17.4\n' +
        'P02\tRescue\t13.6'
    },
    {
      name: '列联表（计数，用于卡方 / Fisher）',
      filename: 'stattest_table_template.tsv',
      desc: '<b>每格一个频数</b>：行与列各代表一个分类变量，可用第一列放行名（文字）。' +
        '2×2 表同时给出 Fisher 精确检验；期望频数 < 5 时会给出提示。',
      sample: '\tMutant\tWildtype\n' +
        'Responder\t28\t12\n' +
        'Non-responder\t9\t31'
    }
  ];

  var TEST_LABELS = {
    oneSampleT: '单样本 t 检验',
    oneSampleWilcoxon: '单样本 Wilcoxon 符号秩检验',
    studentT: 'Student t 检验（假定等方差）',
    welchT: 'Welch t 检验（不假定等方差）',
    mannWhitney: 'Mann–Whitney U 检验',
    pairedT: '配对 t 检验',
    wilcoxonSigned: '配对 Wilcoxon 符号秩检验',
    anova: '单因素方差分析（ANOVA）',
    kruskal: 'Kruskal–Wallis 检验',
    rmAnova: '重复测量方差分析',
    friedman: 'Friedman 检验',
    chi2: '卡方独立性检验',
    fisher: 'Fisher 精确检验'
  };

  WB.register({
    id: 'stattest',
    name: '统计检验',
    icon: '∑',
    color: '#2f6fb3',
    desc: '对实验数据做统计检验：自动完成正态性与方差齐性诊断并推荐检验方法，支持两组与多组的独立或重复测量设计、两两事后比较，并输出发表级箱线图与效应量。',
    tags: ['统计检验', '假设检验', '效应量', '事后比较'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('统计检验') }),
        el('p', { text: T('对实验数据做统计检验：自动完成正态性与方差齐性诊断并推荐检验方法，支持两组与多组的独立或重复测量设计、两两事后比较，并输出发表级箱线图与效应量。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '样本统计检验',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.stattestText,
        placeholder: 'Subject\tControl\tTreated\nP01\t12.4\t18.2\nP02\t11.8\t17.4\n...',
        paramsTitle: '检验设定',
        params: [
          {
            key: 'inputKind', label: '输入类型', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动识别' },
              { value: 'wide', label: '宽表' },
              { value: 'long', label: '长表' },
              { value: 'table', label: '列联表' }
            ]
          },
          {
            key: 'design', label: '实验设计', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动（长表有受试者重复时按配对）' },
              { value: 'independent', label: '独立样本' },
              { value: 'paired', label: '配对 / 重复测量' }
            ]
          },
          {
            key: 'method', label: '检验方法', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动推荐' },
              { value: 'oneSampleT', label: TEST_LABELS.oneSampleT },
              { value: 'welchT', label: TEST_LABELS.welchT },
              { value: 'studentT', label: TEST_LABELS.studentT },
              { value: 'mannWhitney', label: TEST_LABELS.mannWhitney },
              { value: 'pairedT', label: TEST_LABELS.pairedT },
              { value: 'wilcoxonSigned', label: TEST_LABELS.wilcoxonSigned },
              { value: 'anova', label: TEST_LABELS.anova },
              { value: 'kruskal', label: TEST_LABELS.kruskal },
              { value: 'rmAnova', label: TEST_LABELS.rmAnova },
              { value: 'friedman', label: TEST_LABELS.friedman }
            ]
          },
          {
            key: 'posthoc', label: '事后比较方法', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '按检验方法自动选择' },
              { value: 'none', label: '不做事后比较' },
              { value: 'tukey', label: 'Tukey HSD' },
              { value: 'dunn', label: 'Dunn 检验' },
              { value: 'pairwiseT', label: '成对 t 检验（BH 校正）' },
              { value: 'pairwiseWilcoxon', label: '成对 Wilcoxon 符号秩检验（BH 校正）' }
            ]
          },
          { key: 'mu', label: '单样本比较的理论值 μ', type: 'number', value: 0, step: 0.1 },
          { key: 'yates', label: '2×2 表使用 Yates 连续性校正', type: 'checkbox', value: true },
          { key: 'showPoints', label: '显示单样本散点', type: 'checkbox', value: true },
          { key: 'showBrackets', label: '显示显著性括线', type: 'checkbox', value: true },
          { key: 'maxPairs', label: '最多显示比较对数', type: 'number', value: 6, min: 1, max: 15, step: 1 }
        ],
        runLabel: '执行统计检验',
        onRun: function (ctx) {
          var res = WB.$('#stattest-result');
          WB.clear(res);
          runAnalyse(res, ctx);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'stattest-result';
      main.appendChild(wrap);
      if (!WB._stattestDemoLoaded) { WB._stattestDemoLoaded = true; panel.setText(WB.demo.stattestText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  function runAnalyse(res, ctx) {
    var v = ctx.values;
    /* 首列可能是受试者编号 / 行名，需关闭「首列作为行名」的自动处理 */
    var m = WB.parse.parseMatrix(ctx.text, { rowNames: false });
    if (!m.matrix.length) throw new Error(T('未解析到有效数据，请检查输入格式'));

    var kind = v.inputKind || 'auto';
    if (kind === 'auto') kind = detectKind(m);

    if (kind === 'table') { runContingency(res, m, v); return; }

    var groups = kind === 'long' ? parseLong(m) : parseWide(m);
    groups = groups.filter(function (g) { return g.values.length; });
    if (!groups.length) throw new Error(T('未解析到有效数据，请检查输入格式'));

    var design = v.design || 'auto';
    if (design === 'auto') design = detectPaired(groups) ? 'paired' : 'independent';

    var mu = Number(v.mu); if (!isFinite(mu)) mu = 0;
    var method = v.method || 'auto';

    /* 前提诊断 */
    var diag = [];
    var normPass = true;
    groups.forEach(function (g) {
      if (g.values.length < 3) { diag.push({ kind: 'norm', name: g.name, W: NaN, p: NaN, ok: true, note: true }); return; }
      var sw = WB.stats.shapiroWilk(g.values);
      var ok = !(sw.p < 0.05);
      if (!ok) normPass = false;
      diag.push({ kind: 'norm', name: g.name, W: sw.W, p: sw.p, ok: ok });
    });
    var varPass = true, lev = null, bar = null;
    if (groups.length >= 2 && design === 'independent') {
      lev = WB.stats.leveneTest(groups.map(function (g) { return g.values; }), 'median');
      bar = WB.stats.bartlettTest(groups.map(function (g) { return g.values; }));
      varPass = !(isFinite(lev.p) && lev.p < 0.05);
      diag.push({ kind: 'var', name: T('全部分组'), W: lev.F, p: lev.p, ok: varPass });
    }

    if (method === 'auto') method = recommend(groups, design, normPass, varPass);

    res.appendChild(WB.ui.statBar([
      { label: T('分组数'), value: groups.length },
      { label: T('样本总数'), value: groups.reduce(function (a, g) { return a + g.values.length; }, 0) },
      { label: T('推荐方法'), value: T(TEST_LABELS[method] || '—') }
    ]));

    /* 描述统计 */
    var dCard = WB.ui.resultCard(T('描述统计'));
    res.appendChild(dCard);
    WB.ui.dataTable(dCard.querySelector('.card-body'), [
      { key: 'name', label: T('分组') },
      { key: 'n', label: 'n', align: 'right', width: 56 },
      { key: 'mean', label: T('均值'), align: 'right', width: 92, format: function (r) { return WB.formatNum(r.mean, 4); } },
      { key: 'sd', label: T('标准差'), align: 'right', width: 88, format: function (r) { return isFinite(r.sd) ? WB.formatNum(r.sd, 4) : '—'; } },
      { key: 'sem', label: T('标准误'), align: 'right', width: 88, format: function (r) { return isFinite(r.sem) ? WB.formatNum(r.sem, 4) : '—'; } },
      { key: 'median', label: T('中位数'), align: 'right', width: 88, format: function (r) { return WB.formatNum(r.median, 4); } },
      { key: 'iqr', label: T('四分位距'), align: 'right', width: 88, format: function (r) { return WB.formatNum(r.iqr, 4); } }
    ], groups.map(function (g) {
      var arr = g.values;
      var q1 = WB.stats.quantile(arr, 0.25), q3 = WB.stats.quantile(arr, 0.75);
      return {
        name: g.name, n: arr.length,
        mean: WB.stats.mean(arr), sd: arr.length >= 2 ? WB.stats.stdev(arr) : NaN,
        sem: arr.length >= 2 ? WB.stats.stdev(arr) / Math.sqrt(arr.length) : NaN,
        median: WB.stats.median(arr), iqr: q3 - q1
      };
    }), { pageSize: 20, exportName: 'stattest_describe' });

    /* 前提诊断 */
    var aCard = WB.ui.resultCard(T('前提诊断'));
    res.appendChild(aCard);
    var aBody = aCard.querySelector('.card-body');
    WB.ui.dataTable(aBody, [
      { key: 'item', label: T('检查项') },
      { key: 'method', label: T('方法'), width: 190 },
      { key: 'stat', label: T('统计量'), align: 'right', width: 100, format: function (r) { return isFinite(r.stat) ? WB.formatNum(r.stat, 4) : '—'; } },
      { key: 'p', label: T('P 值'), align: 'right', width: 96, format: function (r) { return isFinite(r.p) ? WB.pFormat(r.p) : '—'; } },
      {
        key: 'ok', label: T('结论'), width: 96,
        render: function (r) {
          if (r.note) return el('span.tag-cat.tag-ns', { text: '—' });
          return el('span.tag-cat.' + (r.ok ? 'tag-up' : 'tag-down'), { text: r.ok ? T('满足') : T('不满足') });
        }
      }
    ], diag.map(function (d) {
      return {
        item: d.kind === 'norm' ? T('正态性检验（Shapiro–Wilk）') + ' — ' + d.name : T('方差齐性检验（Levene，中位数）'),
        method: d.kind === 'norm' ? 'Shapiro–Wilk' : (bar && isFinite(bar.p) ? 'Levene / Bartlett' : 'Levene'),
        stat: d.kind === 'norm' ? d.W : d.W,
        p: d.p, ok: d.ok, note: !!d.note
      };
    }), { pageSize: 20, exportName: 'stattest_assumptions' });
    aBody.appendChild(WB.ui.alertBox('info', T('推荐依据：先做 Shapiro–Wilk 正态性检验与 Levene 方差齐性检验，再按「组数 + 设计 + 前提是否满足」选择检验；' +
      '不满足正态性时改用秩检验，方差不齐时改用 Welch 校正。')));
    aBody.appendChild(WB.ui.alertBox(normPass ? 'ok' : 'warn',
      normPass ? T('全部分组均满足正态性（Shapiro–Wilk，P ≥ 0.05）') : T('正态性不满足，改用秩检验。')));
    if (groups.length >= 2 && design === 'independent') {
      aBody.appendChild(WB.ui.alertBox(varPass ? 'ok' : 'warn',
        varPass ? T('方差齐性满足（Levene 检验，P ≥ 0.05）') : T('方差不齐，改用不假定等方差的方法。')));
    }
    if (design === 'paired') aBody.appendChild(WB.ui.alertBox('info', T('配对 / 重复测量设计，使用被试内检验。')));

    /* 主检验 */
    var main = runMainTest(method, groups, design, mu);
    if (!main) throw new Error(T('当前设定下无法完成检验，请检查分组数与实验设计'));

    var mCard = WB.ui.resultCard(T('检验结果'));
    res.appendChild(mCard);
    var mBody = mCard.querySelector('.card-body');
    WB.ui.dataTable(mBody, [
      { key: 'test', label: T('检验方法') },
      { key: 'stat', label: T('统计量'), align: 'right', width: 100, format: function (r) { return WB.formatNum(r.stat, 4); } },
      { key: 'df', label: T('自由度'), align: 'right', width: 90, format: function (r) { return isFinite(r.df) ? WB.formatNum(r.df, 2) : '—'; } },
      { key: 'p', label: T('P 值'), align: 'right', width: 100, format: function (r) { return WB.pFormat(r.p); } },
      { key: 'eff', label: T('效应量'), align: 'right', width: 110, format: function (r) { return isFinite(r.eff) ? r.effName + ' = ' + WB.formatNum(r.eff, 4) : '—'; } },
      { key: 'effNote', label: T('效应量解释'), width: 100, format: function (r) { return r.effNote || '—'; } },
      { key: 'ci', label: T('95% 置信区间'), align: 'right', width: 150, format: function (r) { return r.ci || '—'; } },
      {
        key: 'sig', label: T('结论'), width: 150,
        render: function (r) {
          return el('span.tag-cat.' + (r.p <= 0.05 ? 'tag-up' : 'tag-ns'), {
            text: r.p <= 0.05 ? T('差异有统计学意义（P < 0.05）') : T('差异无统计学意义（P ≥ 0.05）')
          });
        }
      }
    ], [main], { pageSize: 5, exportName: 'stattest_main' });
    mBody.appendChild(el('div.preview-note', {
      text: T('组别效应：η² = 组间平方和 / 总平方和；ε² 与 Kendall’s W 为对应的非参数效应量；Cohen’s d 为两组标准化均值差。')
    }));

    /* 事后比较 */
    var phKey = v.posthoc || 'auto';
    if (phKey === 'auto') {
      phKey = (method === 'anova') ? 'tukey'
        : (method === 'kruskal') ? 'dunn'
          : (method === 'rmAnova') ? 'pairwiseT'
            : (method === 'friedman') ? 'pairwiseWilcoxon' : 'none';
    }
    var pairs = [];
    if (phKey !== 'none' && groups.length >= 2) pairs = runPostHoc(phKey, groups);
    if (groups.length === 2 && !pairs.length) {
      pairs = [{ a: 0, b: 1, p: main.p, q: main.p, diff: main.diff, ci: main.ci }];
    }

    if (pairs.length) {
      var pCard = WB.ui.resultCard(T('两两比较'));
      res.appendChild(pCard);
      var pBody = pCard.querySelector('.card-body');
      WB.ui.dataTable(pBody, [
        { key: 'a', label: T('分组') + ' 1' },
        { key: 'b', label: T('分组') + ' 2' },
        { key: 'diff', label: T('均值差'), align: 'right', width: 110, format: function (r) { return isFinite(r.diff) ? WB.formatNum(r.diff, 4) : '—'; } },
        { key: 'ci', label: T('95% 置信区间'), align: 'right', width: 150, format: function (r) { return r.ci || '—'; } },
        { key: 'p', label: T('P 值'), align: 'right', width: 96, format: function (r) { return WB.pFormat(r.p); } },
        { key: 'q', label: 'padj', align: 'right', width: 96, format: function (r) { return isFinite(r.q) ? WB.pFormat(r.q) : '—'; } },
        {
          key: 'sig', label: T('显著性'), width: 96,
          render: function (r) {
            var st = WB.plot.sigStar(r.q);
            return el('span.tag-cat.' + (r.q <= 0.05 ? 'tag-up' : 'tag-ns'), { text: st || T('common.ns') });
          }
        }
      ], pairs.map(function (p) {
        return {
          a: groups[p.a].name, b: groups[p.b].name, diff: p.diff, ci: p.ci || '',
          p: p.p, q: isFinite(p.q) ? p.q : p.p, raw: p
        };
      }), { pageSize: 25, exportName: 'stattest_posthoc', rowClass: function (r) { return r.q <= 0.05 ? 'row-sig' : ''; } });
      if (main.p > 0.05) {
        pBody.appendChild(WB.ui.alertBox('warn', T(' omnibus 检验不显著，事后比较仅供参考')));
      }
    }

    /* 图 */
    var gCard = WB.ui.resultCard(T('箱线图'));
    res.appendChild(gCard);
    var gb = gCard.querySelector('.card-body');
    var holder = el('div.plot-holder');
    gb.appendChild(holder);
    var svg = drawGroups(holder, groups, {
      paired: design === 'paired',
      showPoints: v.showPoints !== false,
      showBrackets: v.showBrackets !== false,
      maxPairs: Math.max(1, Number(v.maxPairs) || 6),
      pairs: pairs
    });
    WB.plot.addToolbar(gb, { getSvg: function () { return svg; }, basename: 'stattest_box' });
    gb.appendChild(el('div.preview-note', {
      text: T('箱线图：箱体为四分位距（Q1–Q3），中线为中位数，须为 1.5×IQR；点为单个样本。')
    }));
  }

  /* ------------------------------ 解析 ---------------------------------- */

  /** 取单元格文本：数值列直接取数值，文字列回退到原始字符串 */
  function cellText(m, ri, ci) {
    var row = m.matrix[ri] || [];
    if (isFinite(row[ci])) return String(row[ci]);
    var raw = (m.raw[ri] || [])[ci];
    return String(raw === undefined || raw === null ? '' : raw).trim();
  }

  function colAllNum(rows, j) {
    return rows.every(function (r) { return isFinite(r[j]); });
  }

  function detectKind(m) {
    var rows = m.matrix, n = m.colNames.length;
    /* 三列且第二列是文字（分组名）→ 长表；其余按宽表处理 */
    if (n === 3 && !colAllNum(rows, 1)) return 'long';
    return 'wide';
  }

  function parseWide(m) {
    var rows = m.matrix;
    var hasId = !colAllNum(rows, 0);
    var names = m.colNames.slice(hasId ? 1 : 0);
    var groups = names.map(function (nm) { return { name: nm, values: [], keys: [] }; });
    rows.forEach(function (r, ri) {
      var key = cellText(m, ri, 0) || 'R' + (ri + 1);
      groups.forEach(function (g, j) {
        var v = r[hasId ? j + 1 : j];
        if (isFinite(v)) { g.values.push(v); g.keys.push(key); }
      });
    });
    return groups;
  }

  function parseLong(m) {
    var rows = m.matrix;
    if (m.colNames.length < 3) throw new Error(T('长表需要三列（受试者 + 分组 + 数值）'));
    var names = [], groups = [];
    var byKey = {};
    rows.forEach(function (r, ri) {
      var key = cellText(m, ri, 0) || 'R' + (ri + 1);
      var gname = cellText(m, ri, 1);
      var v = r[2];
      if (!gname || !isFinite(v)) return;
      var gi = names.indexOf(gname);
      if (gi < 0) { names.push(gname); groups.push({ name: gname, values: [], keys: [] }); gi = names.length - 1; }
      var kk = key + '\u0000' + gname;
      if (byKey[kk] === undefined) {
        byKey[kk] = groups[gi].values.length;
        groups[gi].values.push(v);
        groups[gi].keys.push(key);
      } else {
        groups[gi].values[byKey[kk]] = (groups[gi].values[byKey[kk]] + v) / 2;
      }
    });
    return groups;
  }

  /** 是否存在同一受试者出现在多个分组（可配对） */
  function detectPaired(groups) {
    if (groups.length < 2) return false;
    var cnt = {};
    groups.forEach(function (g) { g.keys.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; }); });
    var shared = 0;
    Object.keys(cnt).forEach(function (k) { if (cnt[k] > 1) shared++; });
    return shared >= 2;
  }

  /* --------------------------- 检验选择与执行 ---------------------------- */

  function recommend(groups, design, normPass, varPass) {
    var k = groups.length;
    if (k === 1) return normPass ? 'oneSampleT' : 'oneSampleWilcoxon';
    if (k === 2) {
      if (design === 'paired') return normPass ? 'pairedT' : 'wilcoxonSigned';
      if (!normPass) return 'mannWhitney';
      return varPass ? 'studentT' : 'welchT';
    }
    if (design === 'paired') return normPass ? 'rmAnova' : 'friedman';
    if (normPass && varPass) return 'anova';
    return 'kruskal';
  }

  function effNoteD(d) {
    var a = Math.abs(d);
    if (a < 0.2) return T('可忽略');
    if (a < 0.5) return T('小');
    if (a < 0.8) return T('中');
    return T('大');
  }

  function cohensD(a, b) {
    var n1 = a.length, n2 = b.length;
    if (n1 < 2 || n2 < 2) return NaN;
    var sp = Math.sqrt(((n1 - 1) * WB.stats.variance(a) + (n2 - 1) * WB.stats.variance(b)) / (n1 + n2 - 2));
    return sp > 0 ? (WB.stats.mean(a) - WB.stats.mean(b)) / sp : NaN;
  }

  function hedgesG(a, b) {
    var d = cohensD(a, b);
    if (!isFinite(d)) return NaN;
    var n = a.length + b.length;
    return d * (1 - 3 / (4 * n - 9));
  }

  function ciStr(lo, hi) {
    return (isFinite(lo) && isFinite(hi)) ? '[' + WB.formatNum(lo, 3) + ', ' + WB.formatNum(hi, 3) + ']' : '';
  }

  function runMainTest(method, groups, design, mu) {
    var k = groups.length;
    var vals = groups.map(function (g) { return g.values; });

    if (method === 'oneSampleT') {
      var a = vals[0];
      var r = WB.stats.oneSampleTTest(a, mu);
      if (!isFinite(r.p)) return null;
      var d1 = (WB.stats.mean(a) - mu) / (isFinite(WB.stats.stdev(a)) ? WB.stats.stdev(a) : NaN);
      var se = r.se;
      return {
        test: T(TEST_LABELS.oneSampleT), stat: r.t, df: r.df, p: r.p,
        eff: d1, effName: "Cohen's d", effNote: effNoteD(d1),
        ci: ciStr(r.mean - WB.stats.invTDist(r.df, 0.05) * se, r.mean + WB.stats.invTDist(r.df, 0.05) * se)
      };
    }
    if (method === 'oneSampleWilcoxon') {
      var a2 = vals[0];
      var z = a2.map(function (v) { return v - mu; });
      var zero = z.map(function () { return 0; });
      var w = WB.stats.wilcoxonSignedRank(z, zero);
      if (!isFinite(w.p)) return null;
      return {
        test: T(TEST_LABELS.oneSampleWilcoxon), stat: w.W, df: NaN, p: w.p,
        eff: NaN, effName: '', effNote: '', ci: ''
      };
    }
    if (k < 2) return null;

    if (method === 'studentT' || method === 'welchT' || method === 'mannWhitney') {
      var g1 = vals[0], g2 = vals[1];
      if (method === 'mannWhitney') {
        var mw = WB.stats.wilcoxonRankSum(g1, g2);
        var rr = rankBiserial(mw);
        return {
          test: T(TEST_LABELS.mannWhitney), stat: mw.U, df: NaN, p: mw.p,
          eff: rr, effName: 'r', effNote: effNoteD(rr * 2), ci: ''
        };
      }
      var tt = method === 'studentT' ? WB.stats.studentTTest(g1, g2) : WB.stats.welchTTest(g1, g2);
      var dd = cohensD(g1, g2);
      var diff = WB.stats.mean(g1) - WB.stats.mean(g2);
      var vv1 = WB.stats.variance(g1), vv2 = WB.stats.variance(g2);
      var seD = method === 'studentT'
        ? Math.sqrt(((g1.length - 1) * vv1 + (g2.length - 1) * vv2) / (g1.length + g2.length - 2) * (1 / g1.length + 1 / g2.length))
        : Math.sqrt(vv1 / g1.length + vv2 / g2.length);
      var tc = WB.stats.invTDist(tt.df, 0.05);
      return {
        test: T(TEST_LABELS[method]), stat: tt.t, df: tt.df, p: tt.p,
        eff: dd, effName: "Cohen's d", effNote: effNoteD(dd),
        ci: ciStr(diff - tc * seD, diff + tc * seD), diff: diff
      };
    }

    if (method === 'pairedT' || method === 'wilcoxonSigned') {
      var pa = pairedVecs(groups, 0, 1);
      if (!pa) return null;
      if (method === 'wilcoxonSigned') {
        var ws = WB.stats.wilcoxonSignedRank(pa.a2, pa.b2);
        var dz = pairedEffect(pa.a2, pa.b2);
        return {
          test: T(TEST_LABELS.wilcoxonSigned), stat: ws.W, df: NaN, p: ws.p,
          eff: dz, effName: "Cohen's d_z", effNote: effNoteD(dz), ci: ''
        };
      }
      var pt = WB.stats.pairedTTest(pa.a2, pa.b2);
      var dz2 = pt.sdDiff > 0 ? pt.meanDiff / pt.sdDiff : NaN;
      return {
        test: T(TEST_LABELS.pairedT), stat: pt.t, df: pt.df, p: pt.p,
        eff: dz2, effName: "Cohen's d_z", effNote: effNoteD(dz2),
        ci: ciStr(pt.ciLow, pt.ciHigh), diff: pt.meanDiff
      };
    }

    if (method === 'anova') {
      var an = WB.stats.oneWayAnova(vals);
      if (!isFinite(an.p)) return null;
      var eta = an.ssb / (an.ssb + an.ssw);
      return {
        test: T(TEST_LABELS.anova), stat: an.F, df: an.df1, p: an.p,
        eff: eta, effName: 'η²', effNote: etaNote(eta), ci: ''
      };
    }
    if (method === 'kruskal') {
      var kw = WB.stats.kruskalWallis(vals);
      if (!isFinite(kw.p)) return null;
      var N = vals.reduce(function (s, a) { return s + a.length; }, 0);
      var eps = (kw.H - k + 1) / (N - k);
      return {
        test: T(TEST_LABELS.kruskal), stat: kw.H, df: kw.df, p: kw.p,
        eff: eps, effName: 'ε²', effNote: etaNote(eps), ci: ''
      };
    }
    if (method === 'rmAnova' || method === 'friedman') {
      var rows = subjectsMatrix(groups);
      if (rows.length < 2) return null;
      if (method === 'rmAnova') {
        var rm = WB.stats.rmAnova(rows);
        if (!isFinite(rm.p)) return null;
        var eta2 = rm.ssCond / rm.ssTot;
        return {
          test: T(TEST_LABELS.rmAnova), stat: rm.F, df: rm.df1, p: rm.p,
          eff: eta2, effName: 'η²', effNote: etaNote(eta2), ci: ''
        };
      }
      var fr = WB.stats.friedmanTest(rows);
      if (!isFinite(fr.p)) return null;
      var W = fr.chi2 / (fr.nSub * (k - 1));
      return {
        test: T(TEST_LABELS.friedman), stat: fr.chi2, df: fr.df, p: fr.p,
        eff: W, effName: "Kendall's W", effNote: etaNote(W), ci: ''
      };
    }
    return null;
  }

  function etaNote(v) {
    var a = Math.abs(v);
    if (a < 0.06) return T('可忽略');
    if (a < 0.14) return T('小');
    if (a < 0.26) return T('中');
    return T('大');
  }

  function rankBiserial(mw) {
    /* r = 1 - 2U1/(n1*n2) → 方向取均值差；此处按 U 与期望值给出 */
    var n1 = mw.n1, n2 = mw.n2;
    if (!n1 || !n2) return NaN;
    return 1 - 2 * mw.U1 / (n1 * n2);
  }

  function pairedEffect(a, b) {
    var d = [];
    for (var i = 0; i < a.length; i++) if (isFinite(a[i]) && isFinite(b[i])) d.push(a[i] - b[i]);
    if (d.length < 2) return NaN;
    var sd = WB.stats.stdev(d);
    return sd > 0 ? WB.stats.mean(d) / sd : NaN;
  }

  /** 取两组按受试者配对的向量（无配对信息时按下标对齐） */
  function pairedVecs(groups, i, j) {
    var A = groups[i], B = groups[j];
    var mapB = {};
    B.keys.forEach(function (k, bi) { mapB[k] = B.values[bi]; });
    var a = [], b = [];
    A.keys.forEach(function (k, ai) {
      if (mapB[k] !== undefined) { a.push(A.values[ai]); b.push(mapB[k]); }
    });
    if (a.length >= 2) return { a2: a, b2: b };
    var n = Math.min(A.values.length, B.values.length);
    if (n < 2) return null;
    return { a2: A.values.slice(0, n), b2: B.values.slice(0, n) };
  }

  /** 受试者 × 条件 矩阵（缺失为 NaN，含缺失的行会被 rmAnova / friedmanTest 自动剔除） */
  function subjectsMatrix(groups) {
    var keys = [];
    groups.forEach(function (g) {
      g.keys.forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    });
    var out = [];
    keys.forEach(function (k) {
      var row = groups.map(function (g) {
        var idx = g.keys.indexOf(k);
        return idx >= 0 ? g.values[idx] : NaN;
      });
      out.push(row);
    });
    return out;
  }

  function runPostHoc(kind, groups) {
    var out = [];
    var vals = groups.map(function (g) { return g.values; });

    if (kind === 'tukey') {
      var th = WB.stats.tukeyHSD(vals, 0.05);
      th.forEach(function (t) {
        out.push({
          a: t.i, b: t.j, p: t.p, q: t.p,
          diff: groups[t.i] && groups[t.j] ? WB.stats.mean(vals[t.i]) - WB.stats.mean(vals[t.j]) : t.diff,
          ci: ciStr(t.ciLow, t.ciHigh)
        });
      });
      return out;
    }
    if (kind === 'dunn') {
      var dn = WB.stats.dunnTest(vals);
      var ps = dn.map(function (d) { return d.p; });
      var qs = WB.stats.pAdjust(ps, 'BH');
      dn.forEach(function (d, i) {
        out.push({
          a: d.i, b: d.j, p: d.p, q: qs[i],
          diff: WB.stats.mean(vals[d.i]) - WB.stats.mean(vals[d.j]), ci: ''
        });
      });
      return out;
    }
    if (kind === 'pairwiseT' || kind === 'pairwiseWilcoxon') {
      var ps2 = [];
      for (var i = 0; i < groups.length; i++) {
        for (var j = i + 1; j < groups.length; j++) {
          var pv = pairedVecs(groups, i, j);
          if (!pv) continue;
          if (kind === 'pairwiseT') {
            var pt = WB.stats.pairedTTest(pv.a2, pv.b2);
            ps2.push({ a: i, b: j, p: pt.p, diff: pt.meanDiff, ci: ciStr(pt.ciLow, pt.ciHigh) });
          } else {
            var ws = WB.stats.wilcoxonSignedRank(pv.a2, pv.b2);
            var md = WB.stats.mean(pv.a2) - WB.stats.mean(pv.b2);
            ps2.push({ a: i, b: j, p: ws.p, diff: md, ci: '' });
          }
        }
      }
      var qs2 = WB.stats.pAdjust(ps2.map(function (r) { return r.p; }), 'BH');
      ps2.forEach(function (r, k) {
        out.push({ a: r.a, b: r.b, p: r.p, q: qs2[k], diff: r.diff, ci: r.ci });
      });
      return out;
    }
    return out;
  }

  /* --------------------------- 列联表分析 -------------------------------- */

  function runContingency(res, m, v) {
    var rows = m.matrix;
    var hasName = !colAllNum(rows, 0);
    var cnames = m.colNames.slice(hasName ? 1 : 0);
    var table = [], rnames = [];
    rows.forEach(function (r, ri) {
      var row = [];
      for (var j = hasName ? 1 : 0; j < r.length; j++) {
        var x = r[j];
        row.push(isFinite(x) && x >= 0 ? x : 0);
      }
      var nm = hasName ? cellText(m, ri, 0) : 'R' + (ri + 1);
      rnames.push(nm || 'R' + (ri + 1));
      table.push(row);
    });
    if (table.length < 2 || table[0].length < 2) throw new Error(T('列联表至少需要 2 行 × 2 列'));
    var nc = table[0].length;
    table.forEach(function (r) { while (r.length < nc) r.push(0); });
    while (cnames.length < nc) cnames.push('C' + (cnames.length + 1));

    var cs = WB.stats.chiSquareIndependence(table, v.yates !== false && table.length === 2 && nc === 2);
    var N = cs.n;
    var nMinus = Math.min(table.length - 1, nc - 1);
    var cramers = nMinus > 0 ? Math.sqrt(cs.chi2 / (N * nMinus)) : NaN;

    res.appendChild(WB.ui.statBar([
      { label: T('行'), value: table.length },
      { label: T('列'), value: nc },
      { label: T('样本总数'), value: N }
    ]));

    var rowsOut = [];
    var is2 = table.length === 2 && nc === 2;
    if (is2) {
      var fe = WB.stats.fisherExact(table[0][0], table[0][1], table[1][0], table[1][1], 'two.sided');
      var or = (table[0][0] * table[1][1]) / (table[0][1] * table[1][0] || NaN);
      rowsOut.push({
        test: T(TEST_LABELS.fisher), stat: NaN, df: NaN, p: fe.p,
        eff: or, effName: T('优势比（OR）'), effNote: '', ci: ''
      });
    }
    rowsOut.push({
      test: T(TEST_LABELS.chi2), stat: cs.chi2, df: cs.df, p: cs.p,
      eff: cramers, effName: "Cramér's V", effNote: etaNote(cramers), ci: ''
    });

    var mCard = WB.ui.resultCard(T('检验结果'));
    res.appendChild(mCard);
    var mBody = mCard.querySelector('.card-body');
    WB.ui.dataTable(mBody, [
      { key: 'test', label: T('检验方法') },
      { key: 'stat', label: T('统计量'), align: 'right', width: 100, format: function (r) { return isFinite(r.stat) ? WB.formatNum(r.stat, 4) : '—'; } },
      { key: 'df', label: T('自由度'), align: 'right', width: 84, format: function (r) { return isFinite(r.df) ? WB.formatNum(r.df, 0) : '—'; } },
      { key: 'p', label: T('P 值'), align: 'right', width: 100, format: function (r) { return WB.pFormat(r.p); } },
      { key: 'eff', label: T('效应量'), align: 'right', width: 150, format: function (r) { return isFinite(r.eff) ? r.effName + ' = ' + WB.formatNum(r.eff, 4) : '—'; } },
      {
        key: 'sig', label: T('结论'), width: 170,
        render: function (r) {
          return el('span.tag-cat.' + (r.p <= 0.05 ? 'tag-up' : 'tag-ns'), {
            text: r.p <= 0.05 ? T('差异有统计学意义（P < 0.05）') : T('差异无统计学意义（P ≥ 0.05）')
          });
        }
      }
    ], rowsOut, { pageSize: 5, exportName: 'stattest_contingency' });
    if (cs.minExpected < 5) {
      mBody.appendChild(WB.ui.alertBox('warn', T('存在期望频数 < 5 的单元格，卡方近似不可靠，建议参考 Fisher 精确检验或合并类别。')));
    }

    /* 残差图 */
    var gCard = WB.ui.resultCard(T('列联表标准化残差图'));
    res.appendChild(gCard);
    var gb = gCard.querySelector('.card-body');
    var holder = el('div.plot-holder');
    gb.appendChild(holder);
    var svg = drawResidual(holder, table, rnames, cnames);
    WB.plot.addToolbar(gb, { getSvg: function () { return svg; }, basename: 'stattest_residual' });
    gb.appendChild(el('div.preview-note', {
      text: T('标准化残差 = （观测频数 − 期望频数）/ √期望频数；正值（红）表示观测多于期望，负值（蓝）表示少于期望。')
    }));

    /* 明细表 */
    var tCard = WB.ui.resultCard(T('列联表明细'));
    res.appendChild(tCard);
    var rs = [], cs2 = 0;
    table.forEach(function (row, ri) {
      row.forEach(function (obs, ci) {
        var e = expected(table, ri, ci);
        rs.push({
          row: rnames[ri], col: cnames[ci], obs: obs, exp: e,
          resid: e > 0 ? (obs - e) / Math.sqrt(e) : NaN
        });
        cs2++;
      });
    });
    WB.ui.dataTable(tCard.querySelector('.card-body'), [
      { key: 'row', label: T('行') },
      { key: 'col', label: T('列') },
      { key: 'obs', label: T('观测频数'), align: 'right', width: 100 },
      { key: 'exp', label: T('期望频数'), align: 'right', width: 100, format: function (r) { return WB.formatNum(r.exp, 3); } },
      { key: 'resid', label: T('标准化残差'), align: 'right', width: 120, format: function (r) { return isFinite(r.resid) ? WB.formatNum(r.resid, 3) : '—'; } }
    ], rs, { pageSize: 30, exportName: 'stattest_contingency_detail' });
  }

  function expected(table, r, c) {
    var N = 0, rs = 0, cs = 0;
    for (var i = 0; i < table.length; i++) {
      for (var j = 0; j < table[i].length; j++) {
        N += table[i][j];
        if (i === r) rs += table[i][j];
        if (j === c) cs += table[i][j];
      }
    }
    return N > 0 ? rs * cs / N : NaN;
  }

  /* 供自检使用的纯函数 */
  WB.stattest = { recommend: recommend, cohensD: cohensD, subjectsMatrix: subjectsMatrix, expected: expected };

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawGroups(container, groups, cfg) {
    var n = groups.length;
    var padL = 74, padR = 24, padT = 30, padB = 100;
    var bracketH = cfg.showBrackets ? Math.min(120, Math.max(46, cfg.maxPairs * 26)) : 0;
    var W = Math.max(560, 200 + n * 150);
    var H = 430 + bracketH;
    var plotW = W - padL - padR, plotH = H - padT - padB - bracketH;

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var vmin = Infinity, vmax = -Infinity;
    groups.forEach(function (g) {
      g.values.forEach(function (v) { if (v < vmin) vmin = v; if (v > vmax) vmax = v; });
    });
    var span = (vmax - vmin) || 1;
    vmin -= span * 0.08; vmax += span * 0.08;
    var sy = WB.plot.linearScale(vmin, vmax, padT + plotH, padT);
    sy.ticks(6).forEach(function (t) {
      if (t < vmin || t > vmax) return;
      root.appendChild(S('line', { x1: padL, y1: sy(t), x2: W - padR, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(padL - 8, sy(t) + 4, WB.formatNum(t, 2), { 'text-anchor': 'end', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });

    var slot = plotW / n;
    var boxW = Math.min(76, slot * 0.52);

    /* 配对连线 */
    if (cfg.paired) {
      var keys = [];
      groups.forEach(function (g) { g.keys.forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
      keys.forEach(function (k) {
        var seg = [];
        groups.forEach(function (g, gi) {
          var idx = g.keys.indexOf(k);
          if (idx >= 0) seg.push([padL + (gi + 0.5) * slot, sy(g.values[idx])]);
        });
        if (seg.length >= 2) {
          root.appendChild(S('path', {
            d: 'M' + seg.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'),
            fill: 'none', stroke: '#9aa5b1', 'stroke-width': 0.9, 'stroke-opacity': 0.5
          }));
        }
      });
    }

    groups.forEach(function (g, gi) {
      var cx = padL + (gi + 0.5) * slot;
      var arr = g.values.slice().sort(function (a, b) { return a - b; });
      var q1 = WB.stats.quantile(arr, 0.25), med = WB.stats.quantile(arr, 0.5), q3 = WB.stats.quantile(arr, 0.75);
      var iqr = q3 - q1, wLo = q1, wHi = q3, zi;
      for (zi = 0; zi < arr.length; zi++) { if (arr[zi] >= q1 - 1.5 * iqr) { wLo = arr[zi]; break; } }
      for (zi = arr.length - 1; zi >= 0; zi--) { if (arr[zi] <= q3 + 1.5 * iqr) { wHi = arr[zi]; break; } }
      var col = WB.plot.palette(gi);

      root.appendChild(S('line', { x1: cx, y1: sy(wLo), x2: cx, y2: sy(q1), stroke: col, 'stroke-width': 1.3 }));
      root.appendChild(S('line', { x1: cx, y1: sy(q3), x2: cx, y2: sy(wHi), stroke: col, 'stroke-width': 1.3 }));
      root.appendChild(S('rect', {
        x: cx - boxW / 2, y: sy(q3), width: boxW, height: Math.max(1, sy(q1) - sy(q3)),
        fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-width': 1.4
      }));
      root.appendChild(S('line', { x1: cx - boxW / 2, y1: sy(med), x2: cx + boxW / 2, y2: sy(med), stroke: col, 'stroke-width': 2.2 }));

      if (cfg.showPoints) {
        var jit = [-0.28, 0.28, -0.14, 0.14, 0, -0.21, 0.21, -0.07, 0.07];
        g.values.forEach(function (v, vi) {
          var off = jit[vi % jit.length] * boxW * 0.45;
          root.appendChild(S('circle', {
            cx: cx + off, cy: sy(v), r: 2.6,
            fill: '#ffffff', stroke: col, 'stroke-width': 1, 'fill-opacity': 0.9
          }));
        });
      }

      root.appendChild(WB.plot.txt(cx, padT + plotH + 20, g.name, {
        'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT,
        transform: g.name.length > 12 ? 'rotate(-24 ' + cx + ' ' + (padT + plotH + 20) + ')' : ''
      }));
      root.appendChild(WB.plot.txt(cx, padT + plotH + 37, 'n = ' + g.values.length, {
        'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: WB.plot.TICKTEXT
      }));

      var hit = S('rect', { x: cx - slot / 2, y: padT, width: slot, height: plotH, fill: 'transparent' });
      root.appendChild(hit);
      WB.plot.bindTip(hit, function () {
        return '<b>' + WB.esc(g.name) + '</b><br>n = ' + g.values.length +
          '<br>' + T('均值') + ' = ' + WB.formatNum(WB.stats.mean(g.values), 4) +
          '<br>' + T('中位数') + ' = ' + WB.formatNum(med, 4) +
          '<br>' + T('四分位距') + ' = ' + WB.formatNum(iqr, 4);
      });
    });

    /* 显著性括线 */
    if (cfg.showBrackets && cfg.pairs && cfg.pairs.length) {
      var sig = cfg.pairs.slice()
        .filter(function (p) { return isFinite(p.q) && p.q <= 0.05; })
        .sort(function (a, b) { return a.q - b.q; })
        .slice(0, cfg.maxPairs);
      sig.forEach(function (p, bi) {
        var yBase = padT + plotH + 52 + bi * 24;
        if (yBase > H - 12) return;
        var x1 = padL + (p.a + 0.5) * slot, x2 = padL + (p.b + 0.5) * slot;
        var star = WB.plot.sigStar(p.q);
        root.appendChild(S('path', {
          d: 'M' + x1 + ' ' + (yBase - 6) + ' V' + yBase + ' H' + x2 + ' V' + (yBase - 6),
          fill: 'none', stroke: '#5a6a76', 'stroke-width': 1.1
        }));
        root.appendChild(WB.plot.txt((x1 + x2) / 2, yBase + 12, star || T('common.ns'), {
          'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 700,
          fill: star ? '#a8332b' : WB.plot.MUTED
        }));
      });
    }

    var yl = WB.plot.txt(0, 0, T('common.value'), { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(padT + plotH / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);
    return canvas.svg;
  }

  function drawResidual(container, table, rnames, cnames) {
    var R = table.length, C = table[0].length;
    var padL = 108, padT = 74, padB = 56, padR = 132;
    var cell = 58;
    var W = padL + padR + C * cell;
    var H = padT + padB + R * cell;

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var N = 0;
    table.forEach(function (r) { r.forEach(function (v) { N += v; }); });

    var maxAbs = 0;
    table.forEach(function (r, ri) {
      r.forEach(function (obs, ci) {
        var e = expected(table, ri, ci);
        var z = e > 0 ? (obs - e) / Math.sqrt(e) : 0;
        if (Math.abs(z) > maxAbs) maxAbs = Math.abs(z);
      });
    });
    maxAbs = Math.max(1, maxAbs);

    cnames.forEach(function (cn, ci) {
      var x = padL + (ci + 0.5) * cell;
      root.appendChild(WB.plot.txt(x, padT - 12, WB.plot.ellipsis(cn, 9), { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    rnames.forEach(function (rn, ri) {
      var y = padT + (ri + 0.5) * cell;
      root.appendChild(WB.plot.txt(padL - 10, y + 4, WB.plot.ellipsis(rn, 12), { 'text-anchor': 'end', 'font-size': 12, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });

    table.forEach(function (row, ri) {
      row.forEach(function (obs, ci) {
        var e = expected(table, ri, ci);
        var z = e > 0 ? (obs - e) / Math.sqrt(e) : 0;
        var x = padL + ci * cell, y = padT + ri * cell;
        var t = Math.max(-1, Math.min(1, z / maxAbs));
        var fill = t >= 0 ? mix('#ffffff', '#a8332b', t) : mix('#ffffff', '#2f6fb3', -t);
        var rect = S('rect', {
          x: x + 1, y: y + 1, width: cell - 2, height: cell - 2,
          fill: fill, stroke: WB.plot.AXIS, 'stroke-width': 0.8
        });
        root.appendChild(rect);
        root.appendChild(WB.plot.txt(x + cell / 2, y + cell / 2 - 3, String(obs), {
          'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600,
          fill: Math.abs(t) > 0.55 ? '#ffffff' : WB.plot.TEXT
        }));
        root.appendChild(WB.plot.txt(x + cell / 2, y + cell / 2 + 12, (z >= 0 ? '+' : '') + WB.formatNum(z, 2), {
          'text-anchor': 'middle', 'font-size': 9.5,
          fill: Math.abs(t) > 0.55 ? '#ffffff' : WB.plot.MUTED
        }));
        WB.plot.bindTip(rect, function () {
          return '<b>' + WB.esc(rnames[ri]) + ' × ' + WB.esc(cnames[ci]) + '</b><br>' +
            T('观测频数') + ' = ' + WB.formatNum(obs, 0) +
            '<br>' + T('期望频数') + ' = ' + WB.formatNum(e, 3) +
            '<br>' + T('标准化残差') + ' = ' + WB.formatNum(z, 3);
        });
      });
    });

    /* 图内颜色条图例 */
    var lx = W - padR + 18, ly = padT + 8, bw = 16, bh = Math.min(150, R * cell - 16);
    var lg = WB.plot.g({});
    root.appendChild(lg);
    var steps = 24;
    for (var s = 0; s < steps; s++) {
      var tt = 1 - 2 * (s + 0.5) / steps;
      var c2 = tt >= 0 ? mix('#ffffff', '#a8332b', tt) : mix('#ffffff', '#2f6fb3', -tt);
      lg.appendChild(S('rect', { x: lx, y: ly + s * (bh / steps), width: bw, height: bh / steps + 0.6, fill: c2 }));
    }
    lg.appendChild(S('rect', { x: lx, y: ly, width: bw, height: bh, fill: 'none', stroke: WB.plot.AXIS }));
    lg.appendChild(WB.plot.txt(lx + bw + 5, ly + 10, '+' + WB.formatNum(maxAbs, 2), { 'font-size': 11, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    lg.appendChild(WB.plot.txt(lx + bw + 5, ly + bh / 2 + 4, '0', { 'font-size': 11, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    lg.appendChild(WB.plot.txt(lx + bw + 5, ly + bh - 2, '-' + WB.formatNum(maxAbs, 2), { 'font-size': 11, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    lg.appendChild(WB.plot.txt(lx, ly - 8, T('标准化残差'), { 'font-size': 12, 'font-weight': 600, fill: WB.plot.TEXT }));

    return canvas.svg;
  }

  function mix(c1, c2, t) {
    var a = WB.plot.hex2rgb(c1), b = WB.plot.hex2rgb(c2);
    return WB.plot.rgb2hex(
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    );
  }
})(window);
