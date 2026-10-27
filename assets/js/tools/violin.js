/* =============================================================================
 * tools/violin.js  —  小提琴图（核密度分布 + 内嵌箱线 + 散点 + 成对显著性）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '按列比较数值分布：每列一个变量/分组，绘制核密度小提琴并内嵌箱线图与单样本散点；可选做两两比较并标注显著性。':
      'Compare value distributions by column: each column becomes one violin with an embedded box plot and per-sample points; optional pairwise tests with significance brackets.',
    '分布比较': 'Distribution comparison',
    '小提琴图': 'Violin plot',
    '核密度估计': 'KDE',
    '显著性标注': 'Significance brackets',
    '非参数检验': 'Non-parametric test',
    '比较分布（小提琴图）': 'Compare distributions (violin plot)',
    '每个变量一列': 'One column per variable',
    ['<b>第一列是样本/观测 ID，其余每列一个数值变量（或一个分组）</b>，每列绘制一个小提琴。' +
      '缺失值留空或写 <code>NA</code>。样本数 ≥ 3 的列才会参与统计比较。']:
      '<b>The first column is the sample/observation ID; each remaining column is one numeric variable (or group)</b>, drawn as one violin. ' +
      'Leave missing values blank or write <code>NA</code>. Only columns with ≥ 3 valid values take part in the statistical comparison.',
    '只有一列数值时也可绘制单组分布。': 'A single numeric column is also fine (one violin).',
    '绘图参数': 'Plot parameters',
    '绘图风格': 'Plot style',
    '科研配色（推荐）': 'Scientific palette (recommended)',
    '色盲友好配色（Okabe–Ito）': 'Colour-blind-safe palette (Okabe–Ito)',
    '雨云图（Raincloud）': 'Raincloud plot',
    '期刊单色（灰度印刷）': 'Journal monochrome (greyscale print)',
    ['科研配色采用 Nature 系列期刊常用的低饱和色板；色盲友好配色采用 Nature 推荐的 Okabe–Ito 色板；' +
      '雨云图为「半小提琴 + 箱线 + 抖动散点」；期刊单色不着色，便于灰度印刷。']:
      'The scientific palette is the low-saturation set commonly used by the Nature family of journals; the Okabe–Ito set is the colour-blind-safe palette; ' +
      'the raincloud style combines a half violin, a box plot and jittered points; the journal style is uncoloured for greyscale printing.',
    '雨云图：右侧半小提琴为核密度（「云」），左侧散点为单个样本（「雨」），中间为箱线（Q1–Q3、中位数横线、均值菱形）。':
      'Raincloud: the right half violin is the kernel density (“cloud”), the left dots are individual samples (“rain”), and the box in the middle shows the IQR with the median line and the mean diamond.',
    '显示内嵌箱线图': 'Show embedded box plot',
    '显示单样本散点': 'Show sample points',
    '显示成对比较（显著性括线）': 'Show pairwise comparisons (significance brackets)',
    '最多比较对数': 'Max pairs shown',
    '核密度带宽系数': 'KDE bandwidth factor',
    '带宽自动按 Silverman 经验法则计算，再乘以该系数；<1 更贴近数据，>1 更平滑。':
      'The bandwidth follows Silverman’s rule of thumb, multiplied by this factor; < 1 follows the data more closely, > 1 smooths more.',
    '绘制小提琴图': 'Draw violin plot',
    '变量数': 'Variables',
    '样本数（最小列）': 'Min column n',
    '有效变量不足 2 个（每个变量至少需要 3 个数值）。若数据含分组列（如 Group），请删除该列后重试。':
      'Fewer than 2 valid variables (each needs at least 3 numeric values). If the data contain a grouping column (e.g. Group), remove it and retry.',
    '有效配对观测不足': 'Too few valid paired observations',
    '小提琴（最宽处 = 该组密度峰值）': 'Violin (widest = density peak)',
    ['小提琴 = 高斯核密度估计（Silverman 带宽 × 系数），镜像对称，只绘制密度显著的主体；内嵌箱线为四分位距（Q1–Q3）、中位数（横线）与均值（菱形），须为 1.5×IQR；' +
      '散点为单个样本（横向抖动）。显著性括线：* P<0.05，** P<0.01，*** P<0.001（Welch t 检验，括线上方标注；BH 校正后判定）。']:
      'Violin = Gaussian kernel density estimate (Silverman bandwidth × factor), mirrored, drawn only where the density is appreciable; the embedded box spans the IQR (Q1–Q3) with the median line and the mean as a diamond, whiskers at 1.5×IQR; ' +
      'dots are individual samples (horizontally jittered). Significance brackets: * P<0.05, ** P<0.01, *** P<0.001 from Welch’s t-test (judged after BH correction).',
    '成对比较结果表（BH 校正）': 'Pairwise comparison table (BH corrected)',
    '变量 1': 'Variable 1',
    '变量 2': 'Variable 2',
    'P 值': 'P value',
    '均值差': 'Mean difference',
    'Cohen\'s d': 'Cohen’s d',
    '显著性': 'Significance',
    '全部比较均不显著': 'No pairwise comparison reached significance'
  });

  var FORMATS = [
    {
      name: '每个变量一列',
      filename: 'violin_template.tsv',
      desc: '<b>第一列是样本/观测 ID，其余每列一个数值变量（或一个分组）</b>，每列绘制一个小提琴。' +
        '缺失值留空或写 <code>NA</code>。样本数 ≥ 3 的列才会参与统计比较。',
      sample: 'SampleID\tControl\tTreated\tRescue\n' +
        'S01\t7.12\t9.85\t8.02\n' +
        'S02\t8.03\t10.21\t8.44\n' +
        'S03\t6.55\t9.41\t7.58\n' +
        'S04\t7.87\t9.98\t8.16\n' +
        'S05\t6.98\t10.44\t7.90\n' +
        'S06\t7.55\t9.52\t8.31'
    }
  ];

  WB.register({
    id: 'violin',
    name: '小提琴图',
    icon: '⋈',
    color: '#59823c',
    desc: '按列比较数值分布：每列一个变量/分组，绘制核密度小提琴并内嵌箱线图与单样本散点；可选做两两比较并标注显著性。',
    tags: ['分布比较', '小提琴图', '核密度估计', '显著性标注'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('小提琴图') }),
        el('p', { text: T('按列比较数值分布：每列一个变量/分组，绘制核密度小提琴并内嵌箱线图与单样本散点；可选做两两比较并标注显著性。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '比较分布（小提琴图）',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.violinText,
        placeholder: 'SampleID\tControl\tTreated\nS01\t7.12\t9.85\nS02\t8.03\t10.21\n...',
        paramsTitle: '绘图参数',
        params: [
          {
            key: 'style', label: '绘图风格', type: 'select', value: 'sci',
            options: [
              { value: 'sci', label: '科研配色（推荐）' },
              { value: 'okabe', label: '色盲友好配色（Okabe–Ito）' },
              { value: 'raincloud', label: '雨云图（Raincloud）' },
              { value: 'journal', label: '期刊单色（灰度印刷）' }
            ],
            hint: '科研配色采用 Nature 系列期刊常用的低饱和色板；色盲友好配色采用 Nature 推荐的 Okabe–Ito 色板；' +
              '雨云图为「半小提琴 + 箱线 + 抖动散点」；期刊单色不着色，便于灰度印刷。'
          },
          { key: 'showBox', label: '显示内嵌箱线图', type: 'checkbox', value: true },
          { key: 'showDots', label: '显示单样本散点', type: 'checkbox', value: true },
          { key: 'showPairs', label: '显示成对比较（显著性括线）', type: 'checkbox', value: true },
          { key: 'maxPairs', label: '最多比较对数', type: 'number', value: 6, min: 1, max: 15, step: 1 },
          {
            key: 'bwFactor', label: '核密度带宽系数', type: 'number', value: 1, min: 0.2, max: 3, step: 0.05,
            hint: '带宽自动按 Silverman 经验法则计算，再乘以该系数；<1 更贴近数据，>1 更平滑。'
          }
        ],
        runLabel: '绘制小提琴图',
        onRun: function (ctx) {
          var res = WB.$('#violin-result');
          WB.clear(res);
          runPlot(res, ctx);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'violin-result';
      main.appendChild(wrap);
      if (!WB._violinDemoLoaded) { WB._violinDemoLoaded = true; panel.setText(WB.demo.violinText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  function runPlot(res, ctx) {
    var m = WB.parse.parseMatrix(ctx.text, {});
    if (!m.matrix.length || !m.colNames.length) throw new Error(T('未解析到有效数据，请检查输入格式'));

    var cols = [];
    m.colNames.forEach(function (name, j) {
      var vals = m.matrix.map(function (r) { return r[j]; }).filter(isFinite);
      if (vals.length >= 3) cols.push({ name: name, values: vals });
    });
    if (!cols.length) {
      throw new Error(T('有效变量不足 2 个（每个变量至少需要 3 个数值）。若数据含分组列（如 Group），请删除该列后重试。'));
    }

    var bwFactor = WB.clamp(Number(ctx.values.bwFactor) || 1, 0.2, 3);
    var pCut = 0.05;

    /* 成对比较（Welch t + BH） */
    var pairs = [];
    if (cols.length >= 2) {
      for (var i = 0; i < cols.length; i++) {
        for (var j = i + 1; j < cols.length; j++) {
          var tt = WB.stats.welchTTest(cols[i].values, cols[j].values);
          var d = cohensD(cols[i].values, cols[j].values);
          pairs.push({ a: i, b: j, p: tt.p, meanDiff: WB.stats.mean(cols[j].values) - WB.stats.mean(cols[i].values), d: d });
        }
      }
      var qs = WB.stats.pAdjust(pairs.map(function (p) { return p.p; }), 'BH');
      pairs.forEach(function (p, k) { p.q = qs[k]; });
    }

    var nMin = Math.min.apply(null, cols.map(function (c) { return c.values.length; }));
    res.appendChild(WB.ui.statBar([
      { label: T('变量数'), value: cols.length },
      { label: T('样本数（最小列）'), value: nMin },
      { label: T('成对比较结果表（BH 校正）'), value: pairs.length }
    ]));

    /* 绘图 */
    var card = WB.ui.resultCard(T('小提琴图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = drawViolin(holder, cols, {
      style: ctx.values.style || 'sci',
      showBox: !!ctx.values.showBox,
      showDots: !!ctx.values.showDots,
      showPairs: !!ctx.values.showPairs && pairs.length > 0,
      maxPairs: Math.max(1, Number(ctx.values.maxPairs) || 6),
      bwFactor: bwFactor,
      pairs: pairs
    });
    if (svg) {
      WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'violin' });
      body.appendChild(el('div.preview-note', {
        text: T('小提琴 = 高斯核密度估计（Silverman 带宽 × 系数），镜像对称，只绘制密度显著的主体；内嵌箱线为四分位距（Q1–Q3）、中位数（横线）与均值（菱形），须为 1.5×IQR；' +
          '散点为单个样本（横向抖动）。显著性括线：* P<0.05，** P<0.01，*** P<0.001（Welch t 检验，括线上方标注；BH 校正后判定）。')
      }));
      if ((ctx.values.style || 'sci') === 'raincloud') {
        body.appendChild(el('div.preview-note', {
          text: T('雨云图：右侧半小提琴为核密度（「云」），左侧散点为单个样本（「雨」），中间为箱线（Q1–Q3、中位数横线、均值菱形）。')
        }));
      }
    }

    /* 成对比较表 */
    if (pairs.length) {
      var tCard = WB.ui.resultCard(T('成对比较结果表（BH 校正）'));
      res.appendChild(tCard);
      var sorted = pairs.slice().sort(function (a, b) { return a.q - b.q; }).map(function (p, k) {
        return {
          rank: k + 1,
          a: cols[p.a].name, b: cols[p.b].name,
          p: p.p, q: p.q, meanDiff: p.meanDiff, d: p.d,
          sig: p.q <= pCut
        };
      });
      WB.ui.dataTable(tCard.querySelector('.card-body'), [
        { key: 'rank', label: '#', align: 'right', width: 52 },
        { key: 'a', label: T('变量 1') },
        { key: 'b', label: T('变量 2') },
        { key: 'meanDiff', label: T('均值差'), align: 'right', width: 100, format: function (r) { return WB.formatNum(r.meanDiff, 4); } },
        { key: 'd', label: T('Cohen\'s d'), align: 'right', width: 96, format: function (r) { return WB.formatNum(r.d, 3); } },
        { key: 'p', label: T('P 值'), align: 'right', width: 96, format: function (r) { return WB.pFormat(r.p); } },
        { key: 'q', label: 'padj (BH)', align: 'right', width: 100, format: function (r) { return WB.pFormat(r.q); } },
        {
          key: 'sig', label: T('显著性'), width: 90,
          format: function (r) { return r.sig ? (WB.plot.sigStar(r.q) || T('common.ns')) : T('common.ns'); },
          render: function (r) {
            return el('span.tag-cat.' + (r.sig ? 'tag-up' : 'tag-ns'), { text: r.sig ? (WB.plot.sigStar(r.q) || T('common.ns')) : T('common.ns') });
          }
        }
      ], sorted, { pageSize: 20, exportName: 'violin_pairs', rowClass: function (r) { return r.sig ? 'row-sig' : ''; } });
    }
  }

  /* 供自检使用的纯函数 */
  WB.violin = { kde: kde, silvermanBw: silvermanBw, cohensD: cohensD };

  /** Cohen's d（合并标准差） */
  function cohensD(a, b) {
    var n1 = a.length, n2 = b.length;
    if (n1 < 2 || n2 < 2) return NaN;
    var sp = Math.sqrt(((n1 - 1) * WB.stats.variance(a) + (n2 - 1) * WB.stats.variance(b)) / (n1 + n2 - 2));
    return sp > 0 ? (WB.stats.mean(a) - WB.stats.mean(b)) / sp : NaN;
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  /** Silverman 经验法则带宽（× 系数） */
  function silvermanBw(values, bwFactor) {
    var n = values.length;
    var sd = WB.stats.stdev(values);
    var q1 = WB.stats.quantile(values, 0.25), q3 = WB.stats.quantile(values, 0.75);
    var sigma = Math.min(sd, (q3 - q1) / 1.349);
    if (!(sigma > 0)) sigma = sd > 0 ? sd : 1;
    return 0.9 * sigma * Math.pow(n, -0.2) * (bwFactor || 1);
  }

  /** 高斯核密度估计（Silverman 带宽） */
  function kde(values, grid, bwFactor) {
    var n = values.length;
    var bw = silvermanBw(values, bwFactor);
    var out = grid.map(function (x) {
      var s = 0;
      for (var i = 0; i < n; i++) {
        var u = (x - values[i]) / bw;
        s += Math.exp(-0.5 * u * u);
      }
      return s / (n * bw * Math.sqrt(2 * Math.PI));
    });
    return { y: out, bw: bw };
  }

  /* ---------------------------- 发表级配色 -------------------------------- */

  /** 科研配色（Nature 系列期刊常用的低饱和色板，ggsci npg） */
  var SCI = ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4', '#91D1C2', '#DC0000'];
  /** Okabe–Ito 色盲友好配色（Nature 系列期刊推荐） */
  var OKABE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442', '#333333'];

  /**
   * 某一组的配色 / 线型规范。
   * sci（默认）：科研配色上色的小提琴，白色内嵌箱线，印刷与屏幕都清晰；
   * okabe：Okabe–Ito 色盲友好配色；
   * raincloud：雨云图——右侧半小提琴为「云」，左侧抖动散点为「雨」，中间为箱线；
   * journal：期刊单色版面（浅灰填充 + 深色细描边），灰度印刷友好。
   */
  function styleOf(kind, i) {
    if (kind === 'raincloud') {
      var c = SCI[i % SCI.length];
      return {
        violin: c, violinStroke: c, violinOpacity: 0.32, violinLine: 1.2,
        boxFill: '#ffffff', boxStroke: '#2b3a45', boxLine: 1.1, med: '#111827', medLine: 2,
        mean: '#2b3a45', dotFill: c, dotStroke: c, dotStrokeW: 0.6, dotOpacity: 0.6, dotR: 2,
        rain: true
      };
    }
    if (kind === 'okabe') {
      var c2 = OKABE[i % OKABE.length];
      return {
        violin: c2, violinStroke: c2, violinOpacity: 0.45, violinLine: 1.2,
        boxFill: '#ffffff', boxStroke: c2, boxLine: 1.3, med: c2, medLine: 2.2,
        mean: c2, dotFill: '#ffffff', dotStroke: c2, dotStrokeW: 0.9, dotOpacity: 0.85, dotR: 2.2
      };
    }
    if (kind === 'journal') {
      return {
        violin: '#e9eef2', violinStroke: '#2b3a45', violinOpacity: 1, violinLine: 1.15,
        boxFill: '#ffffff', boxStroke: '#2b3a45', boxLine: 1.15, med: '#111827', medLine: 2.2,
        mean: '#2b3a45', dotFill: '#3a4652', dotStroke: 'none', dotStrokeW: 0, dotOpacity: 0.55, dotR: 2.1
      };
    }
    /* 科研配色（默认） */
    var c3 = SCI[i % SCI.length];
    return {
      violin: c3, violinStroke: c3, violinOpacity: 0.5, violinLine: 1.25,
      boxFill: '#ffffff', boxStroke: c3, boxLine: 1.3, med: c3, medLine: 2.2,
      mean: c3, dotFill: '#ffffff', dotStroke: c3, dotStrokeW: 0.9, dotOpacity: 0.9, dotR: 2.2
    };
  }

  function drawViolin(container, cols, cfg) {
    var n = cols.length;
    var kind = cfg.style || 'sci';
    var journal = kind === 'journal';
    var padL = 84, padR = 22, padT = 32, padB = 108;
    /* 底部留白给成对括线：只有存在显著比较时才预留，避免下方大片空白 */
    var sigN = (cfg.showPairs && cfg.pairs || []).filter(function (p) { return p.q <= 0.05; }).length;
    var bracketH = sigN > 0 ? Math.min(120, Math.max(52, Math.min(cfg.maxPairs, sigN) * 26)) : 0;
    /* 组间空隙随分组数自适应：每组槽宽按组数收窄/放宽，组少不稀疏、组多不拥挤 */
    var slotW = WB.clamp(Math.round(760 / n), 92, 168) * (kind === 'raincloud' ? 1.3 : 1);
    var W = Math.max(480, Math.round(padL + padR + n * slotW));
    var H = 470 + bracketH;
    var plotW = W - padL - padR, plotH = H - padT - padB - bracketH;

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var vmin = Infinity, vmax = -Infinity;
    cols.forEach(function (c) {
      c.values.forEach(function (v) {
        if (v < vmin) vmin = v;
        if (v > vmax) vmax = v;
      });
    });
    var span = (vmax - vmin) || 1;
    vmin -= span * 0.06; vmax += span * 0.06;
    var sy = WB.plot.linearScale(vmin, vmax, padT + plotH, padT);

    /* 期刊风格不画网格线，只保留坐标轴线与刻度；其余风格保留极浅横向网格 */
    sy.ticks(6).forEach(function (t) {
      if (t < vmin || t > vmax) return;
      if (!journal) root.appendChild(S('line', { x1: padL, y1: sy(t), x2: W - padR, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(S('line', { x1: padL - 4, y1: sy(t), x2: padL, y2: sy(t), stroke: WB.plot.AXIS, 'stroke-width': 1 }));
      root.appendChild(WB.plot.txt(padL - 8, sy(t) + 3.5, WB.formatNum(t, 2), {
        'text-anchor': 'end', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT
      }));
    });
    root.appendChild(S('line', { x1: padL, y1: padT, x2: padL, y2: padT + plotH, stroke: WB.plot.AXIS, 'stroke-width': 1 }));
    root.appendChild(S('line', { x1: padL, y1: padT + plotH, x2: W - padR, y2: padT + plotH, stroke: WB.plot.AXIS, 'stroke-width': 1 }));

    var slot = plotW / n;
    var halfMax = Math.min(slot * 0.42, 62);
    var gridN = 96;

    cols.forEach(function (c, i) {
      var cx = padL + (i + 0.5) * slot;
      var st = styleOf(kind, i);
      /* 网格只覆盖数据范围附近（±0.9 带宽），避免在远离数据的区域画出针状长尾 */
      var dmin = Math.min.apply(null, c.values), dmax = Math.max.apply(null, c.values);
      var bwG = silvermanBw(c.values, cfg.bwFactor);
      var lo = Math.max(vmin, dmin - 0.9 * bwG), hi = Math.min(vmax, dmax + 0.9 * bwG);
      var grid = [];
      for (var k = 0; k <= gridN; k++) grid.push(lo + (hi - lo) * k / gridN);
      var d = kde(c.values, grid, cfg.bwFactor);
      var dMax = Math.max.apply(null, d.y) || 1;
      /* 只绘制密度 ≥ 2% 峰值的主体，两端自然收口 */
      var thr = dMax * 0.02;
      var i0 = 0; while (i0 < gridN && d.y[i0] < thr) i0++;
      var i1 = gridN; while (i1 > i0 && d.y[i1] < thr) i1--;
      if (i1 - i0 < 2) { i0 = 0; i1 = gridN; }
      var half = function (di) { return d.y[di] / dMax * halfMax; };

      /* 订购 ÷ 雨云图：右侧半小提琴（云），平边落在 cx */
      if (st.rain) {
        var cloud = [];
        for (var kr = i0; kr <= i1; kr++) cloud.push((cx + half(kr)).toFixed(1) + ',' + sy(grid[kr]).toFixed(1));
        cloud.push(cx.toFixed(1) + ',' + sy(grid[i1]).toFixed(1));
        cloud.push(cx.toFixed(1) + ',' + sy(grid[i0]).toFixed(1));
        root.appendChild(S('polygon', {
          points: cloud.join(' '),
          fill: st.violin, 'fill-opacity': st.violinOpacity,
          stroke: st.violinStroke, 'stroke-width': st.violinLine
        }));
      } else {
        var right = [], left = [];
        for (var k2 = i0; k2 <= i1; k2++) {
          right.push((cx + half(k2)).toFixed(1) + ',' + sy(grid[k2]).toFixed(1));
          left.push((cx - half(k2)).toFixed(1) + ',' + sy(grid[k2]).toFixed(1));
        }
        root.appendChild(S('polygon', {
          points: right.concat(left.reverse()).join(' '),
          fill: st.violin, 'fill-opacity': st.violinOpacity,
          stroke: st.violinStroke, 'stroke-width': st.violinLine
        }));
      }

      /* 散点：雨云图落在左侧「雨」区，其余风格随当地小提琴宽度收窄（蜂群式） */
      if (cfg.showDots) {
        var capJit = Math.min(halfMax * 0.55, 26);
        c.values.forEach(function (v, vi) {
          var gi = Math.round((v - lo) / ((hi - lo) || 1) * gridN);
          gi = WB.clamp(gi, i0, i1);
          var dx, dy = 0;
          if (st.rain) {
            var rainW = Math.min(30, halfMax * 0.55) * (0.45 + 0.55 * (half(gi) / halfMax));
            dx = -(10 + ((vi * 0.61803398875) % 1) * rainW);
            dy = ((vi * 0.38196601) % 1 - 0.5) * 1.6;
          } else {
            dx = ((vi * 0.61803398875) % 1 - 0.5) * 2 * Math.min(half(gi) * 0.62, capJit);
          }
          root.appendChild(S('circle', {
            cx: cx + dx, cy: sy(v) + dy, r: st.dotR,
            fill: st.dotFill, 'fill-opacity': st.dotOpacity,
            stroke: st.dotStroke, 'stroke-width': st.dotStrokeW
          }));
        });
      }

      /* 箱线（四分位距 + 中位数；雨云图为窄条，其余为常规宽度） */
      if (cfg.showBox) {
        var arr = c.values.slice().sort(function (a, b) { return a - b; });
        var q1 = WB.stats.quantile(arr, 0.25), med = WB.stats.quantile(arr, 0.5), q3 = WB.stats.quantile(arr, 0.75);
        var iqr = q3 - q1, wLo = q1, wHi = q3, zi;
        for (zi = 0; zi < arr.length; zi++) { if (arr[zi] >= q1 - 1.5 * iqr) { wLo = arr[zi]; break; } }
        for (zi = arr.length - 1; zi >= 0; zi--) { if (arr[zi] <= q3 + 1.5 * iqr) { wHi = arr[zi]; break; } }
        var bw = st.rain ? 9 : Math.min(22, halfMax * 0.5);
        root.appendChild(S('line', { x1: cx, y1: sy(wLo), x2: cx, y2: sy(q1), stroke: st.boxStroke, 'stroke-width': st.boxLine }));
        root.appendChild(S('line', { x1: cx, y1: sy(q3), x2: cx, y2: sy(wHi), stroke: st.boxStroke, 'stroke-width': st.boxLine }));
        root.appendChild(S('rect', {
          x: cx - bw / 2, y: sy(q3), width: bw, height: Math.max(1, sy(q1) - sy(q3)),
          fill: st.boxFill, 'fill-opacity': 0.92, stroke: st.boxStroke, 'stroke-width': st.boxLine
        }));
        root.appendChild(S('line', { x1: cx - bw / 2, y1: sy(med), x2: cx + bw / 2, y2: sy(med), stroke: st.med, 'stroke-width': st.medLine }));
        /* 均值（菱形） */
        var mv = WB.stats.mean(c.values);
        root.appendChild(S('path', {
          d: 'M' + cx + ' ' + (sy(mv) - 3.4) + ' L' + (cx + 3.4) + ' ' + sy(mv) +
            ' L' + cx + ' ' + (sy(mv) + 3.4) + ' L' + (cx - 3.4) + ' ' + sy(mv) + ' Z',
          fill: st.mean, stroke: '#ffffff', 'stroke-width': 1
        }));
      }

      /* 组名与 n（长名按槽宽自动换行成两行，保持居中，不旋转不溢出） */
      var nameChars = Math.max(7, Math.min(18, Math.floor((slot - 12) / 7.6)));
      var nameLines = WB.plot.wrapText(c.name, nameChars, 2);
      nameLines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(cx, padT + plotH + 22 + li * 16, ln, {
          'text-anchor': 'middle', 'font-size': 13, 'font-weight': 600, fill: WB.plot.TEXT
        }));
      });
      /* n 标签统一按两行组名高度取基线，各组对齐 */
      root.appendChild(WB.plot.txt(cx, padT + plotH + 22 + 2 * 16 + 6, 'n = ' + c.values.length, {
        'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 600, fill: WB.plot.TICKTEXT
      }));
      var hit = S('rect', { x: cx - slot / 2, y: padT, width: slot, height: plotH, fill: 'transparent' });
      root.appendChild(hit);
      WB.plot.bindTip(hit, function () {
        var arr = c.values.slice().sort(function (a, b) { return a - b; });
        return '<b>' + WB.esc(c.name) + '</b><br>n = ' + c.values.length +
          '<br>' + T('平均值：') + WB.formatNum(WB.stats.mean(arr), 3) +
          '<br>' + T('中位数：') + WB.formatNum(WB.stats.median(arr), 3) +
          '<br>' + T('四分位距：') + WB.formatNum(WB.stats.quantile(arr, 0.75) - WB.stats.quantile(arr, 0.25), 3) +
          '<br>bandwidth = ' + WB.formatNum(d.bw, 3);
      });
    });

    /* 成对显著性括线（按 q 升序取前 maxPairs） */
    if (cfg.showPairs && cfg.pairs.length) {
      var sig = cfg.pairs.slice().sort(function (a, b) { return a.q - b.q; })
        .filter(function (p) { return p.q <= 0.05; })
        .slice(0, cfg.maxPairs);
      if (!sig.length) {
        container.appendChild(el('div.preview-note', { text: T('全部比较均不显著') }));
      }
      sig.forEach(function (p, bi) {
        var yBase = padT + plotH + 72 + bi * 26;
        if (yBase > H - 12) return;
        var x1 = padL + (p.a + 0.5) * slot;
        var x2 = padL + (p.b + 0.5) * slot;
        var star = WB.plot.sigStar(p.q);
        root.appendChild(S('path', {
          d: 'M' + x1 + ' ' + (yBase - 6) + ' V' + yBase + ' H' + x2 + ' V' + (yBase - 6),
          fill: 'none', stroke: journal ? '#2b3a45' : '#5a6a76', 'stroke-width': 1.1
        }));
        root.appendChild(WB.plot.txt((x1 + x2) / 2, yBase + 12, star || 'ns', {
          'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700,
          fill: star ? (journal ? '#111827' : '#a8332b') : WB.plot.MUTED
        }));
      });
    }

    /* y 轴标题 */
    var yl = WB.plot.txt(0, 0, T('common.value'), {
      'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)'
    });
    yl.setAttribute('x', -(padT + plotH / 2));
    yl.setAttribute('y', 18);
    root.appendChild(yl);
    return canvas.svg;
  }
})(window);
