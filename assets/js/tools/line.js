/* =============================================================================
 * tools/line.js  —  折线图（多系列 + 误差带 + 个体连线 + 逐点显著性）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '绘制多系列折线图：支持均值 ± 标准差/标准误/95% 置信区间误差带、个体连线（重复测量）、曲线平滑与逐时间点显著性标注，输出可直接用于投稿的矢量图。':
      'Draw multi-series line charts with mean ± SD / SEM / 95% CI error bands, per-subject lines (repeated measures), curve smoothing and per-time-point significance marks; the vector output is ready for submission.',
    '时间序列': 'Time series',
    '折线图': 'Line chart',
    '误差带': 'Error band',
    '重复测量': 'Repeated measures',
    '浓度/剂量': 'Concentration / dose',
    '绘制时间序列曲线（折线图）': 'Draw time-course curves (line chart)',
    '宽表：第一列 x，其余每列一个系列': 'Wide: first column = x, each other column = one series',
    ['<b>第一列是横轴取值（时间点、浓度、剂量…，可为数字或文字），其余每列一个系列</b>。' +
      '同一个横轴取值写成多行即为重复观测：按重复出现的顺序配对，可用于个体连线与误差带。' +
      '留空或 <code>NA</code> 表示该点缺失。']:
      '<b>The first column holds the x values (time point, concentration, dose…; numeric or text) and every other column is one series</b>. ' +
      'Repeating the same x value over several rows gives replicate observations, paired in the order they appear for individual lines and error bands. ' +
      'Leave a cell blank or write <code>NA</code> for missing points.',
    '长表：系列 + x + 值（支持重复）': 'Long: series + x + value (replicates allowed)',
    ['<b>三列：第一列系列名，第二列横轴取值，第三列数值</b>。同一（系列, 横轴）组合出现多次时按重复处理，' +
      '自动汇总为均值与离散度并绘制误差带。']:
      '<b>Three columns: series name, x value, numeric value</b>. When the same (series, x) combination occurs more than once the observations are treated as replicates, aggregated into a mean with a dispersion measure and drawn with an error band.',
    '绘图参数': 'Plot parameters',
    '误差带类型': 'Error band type',
    '无': 'None',
    '标准差（SD）': 'Standard deviation (SD)',
    '标准误（SEM）': 'Standard error (SEM)',
    '95% 置信区间': '95% confidence interval',
    '折线样式': 'Line style',
    '折线': 'Straight',
    '平滑曲线': 'Smoothed curve',
    '折线 + 平滑曲线': 'Line + smoothed',
    '显示数据标记': 'Show data markers',
    '显示个体连线（重复测量）': 'Show individual lines (repeated measures)',
    '显示逐点显著性标注': 'Show per-point significance marks',
    '纵轴为对数轴': 'Log-scaled y axis',
    '横轴为对数轴': 'Log-scaled x axis',
    ['误差带仅在存在重复（同一位置 ≥ 2 个观测）时绘制；逐点显著性以第一个系列为参照，' +
      '对各时间点做 Welch t 检验并统一做 BH 校正。']:
      'Error bands are drawn only where replicates exist (≥ 2 observations at the same position). Per-point significance compares every other series with the first one by Welch’s t-test at each time point, with a single BH correction across all tests.',
    '绘制折线图': 'Draw line chart',
    '系列数': 'Series',
    '横轴取值数': 'X positions',
    '重复数（最多）': 'Max replicates',
    '未解析到有效数据，请检查输入格式': 'No valid data were parsed; please check the input format',
    '至少需要 2 个横轴取值才能绘制折线图': 'At least two x positions are needed to draw a line chart',
    '横轴取值必须是数字才能使用对数轴': 'The x values must be numeric for a logarithmic x axis',
    '纵轴存在非正值，无法使用对数轴': 'The y axis cannot be logarithmic because non-positive values exist',
    '折线为各位置均值；': 'Lines connect the mean at each position; ',
    '误差带为均值 ± 标准差（SD）；': 'the band is the mean ± standard deviation (SD); ',
    '误差带为均值 ± 标准误（SEM）；': 'the band is the mean ± standard error (SEM); ',
    '误差带为均值的 95% 置信区间（均值 ± t(0.975, n−1) × 标准误）；': 'the band is the 95% confidence interval of the mean (mean ± t(0.975, n−1) × SEM); ',
    '本次未绘制误差带。': 'No error band was drawn. ',
    '个体连线为同一受试者在各位置的取值（按重复出现的顺序配对）。': 'Individual lines link the values of the same subject across positions (paired in the order the replicates appear). ',
    '显著性标注以第一个系列为参照：* P<0.05，** P<0.01，*** P<0.001（BH 校正后判定）。':
      'Significance marks compare each series with the first one: * P<0.05, ** P<0.01, *** P<0.001 after BH correction.',
    '逐时间点汇总与检验表': 'Per-position summary and test table',
    '位置': 'Position',
    '系列': 'Series',
    '均值': 'Mean',
    '标准差': 'SD',
    '标准误': 'SEM',
    '均值差（对比参照）': 'Mean difference (vs reference)',
    '显著性': 'Significance',
    '曲线特征表': 'Curve summary table',
    '峰值': 'Peak',
    '峰值位置': 'Peak position',
    '曲线下面积（梯形法）': 'Area under curve (trapezoid)',
    '参照系列': 'Reference series',
    '全部位置均无可用重复，已跳过显著性标注': 'No position has usable replicates, so significance marks were skipped'
  });

  var FORMATS = [
    {
      name: '宽表：第一列 x，其余每列一个系列',
      filename: 'line_wide_template.tsv',
      desc: '<b>第一列是横轴取值（时间点、浓度、剂量…，可为数字或文字），其余每列一个系列</b>。' +
        '同一个横轴取值写成多行即为重复观测：按重复出现的顺序配对，可用于个体连线与误差带。' +
        '留空或 <code>NA</code> 表示该点缺失。',
      sample: 'Time\tControl\tLowDose\tHighDose\n' +
        '0\t1.02\t1.05\t0.98\n' +
        '6\t1.44\t1.86\t2.41\n' +
        '12\t1.61\t2.55\t3.62\n' +
        '24\t1.73\t3.12\t4.88\n' +
        '48\t1.69\t3.44\t5.31'
    },
    {
      name: '长表：系列 + x + 值（支持重复）',
      filename: 'line_long_template.tsv',
      desc: '<b>三列：第一列系列名，第二列横轴取值，第三列数值</b>。同一（系列, 横轴）组合出现多次时按重复处理，' +
        '自动汇总为均值与离散度并绘制误差带。',
      sample: 'Group\tTime\tValue\n' +
        'Control\t0\t1.02\n' +
        'Control\t0\t0.97\n' +
        'Control\t0\t1.06\n' +
        'Control\t6\t1.44\n' +
        'Control\t6\t1.39\n' +
        'Control\t6\t1.51\n' +
        'Treated\t0\t1.01\n' +
        'Treated\t0\t0.95\n' +
        'Treated\t6\t1.98\n' +
        'Treated\t6\t2.11'
    }
  ];

  WB.register({
    id: 'line',
    name: '折线图',
    icon: '◹',
    color: '#b5651d',
    desc: '绘制多系列折线图：支持均值 ± 标准差/标准误/95% 置信区间误差带、个体连线（重复测量）、曲线平滑与逐时间点显著性标注，输出可直接用于投稿的矢量图。',
    tags: ['时间序列', '折线图', '误差带', '重复测量', '浓度/剂量'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('折线图') }),
        el('p', { text: T('绘制多系列折线图：支持均值 ± 标准差/标准误/95% 置信区间误差带、个体连线（重复测量）、曲线平滑与逐时间点显著性标注，输出可直接用于投稿的矢量图。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '绘制时间序列曲线（折线图）',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.lineText,
        placeholder: 'Time\tControl\tTreated\n0\t1.02\t1.01\n6\t1.44\t1.98\n...',
        paramsTitle: '绘图参数',
        params: [
          {
            key: 'bandType', label: '误差带类型', type: 'select', value: 'sd',
            options: [
              { value: 'none', label: '无' },
              { value: 'sd', label: '标准差（SD）' },
              { value: 'sem', label: '标准误（SEM）' },
              { value: 'ci', label: '95% 置信区间' }
            ]
          },
          {
            key: 'lineStyle', label: '折线样式', type: 'select', value: 'straight',
            options: [
              { value: 'straight', label: '折线' },
              { value: 'smooth', label: '平滑曲线' },
              { value: 'both', label: '折线 + 平滑曲线' }
            ]
          },
          { key: 'showMarks', label: '显示数据标记', type: 'checkbox', value: true },
          { key: 'showSpaghetti', label: '显示个体连线（重复测量）', type: 'checkbox', value: false },
          { key: 'showSig', label: '显示逐点显著性标注', type: 'checkbox', value: true },
          { key: 'yLog', label: '纵轴为对数轴', type: 'checkbox', value: false },
          { key: 'xLog', label: '横轴为对数轴', type: 'checkbox', value: false }
        ],
        runLabel: '绘制折线图',
        onRun: function (ctx) {
          var res = WB.$('#line-result');
          WB.clear(res);
          runPlot(res, ctx);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'line-result';
      main.appendChild(wrap);
      if (!WB._lineDemoLoaded) { WB._lineDemoLoaded = true; panel.setText(WB.demo.lineText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  function runPlot(res, ctx) {
    /* 首列是横轴取值（可能是文字），需关闭「首列作为行名」的自动处理 */
    var m = WB.parse.parseMatrix(ctx.text, { rowNames: false });
    if (!m.matrix.length || !m.colNames.length) throw new Error(T('未解析到有效数据，请检查输入格式'));

    var data = buildSeries(m);
    if (!data.series.length) throw new Error(T('未解析到有效数据，请检查输入格式'));
    if (data.xs.length < 2) throw new Error(T('至少需要 2 个横轴取值才能绘制折线图'));

    var opts = {
      bandType: ctx.values.bandType || 'sd',
      lineStyle: ctx.values.lineStyle || 'straight',
      showMarks: !!ctx.values.showMarks,
      showSpaghetti: !!ctx.values.showSpaghetti,
      showSig: !!ctx.values.showSig,
      yLog: !!ctx.values.yLog,
      xLog: !!ctx.values.xLog
    };
    if (opts.xLog && !data.xIsNum) throw new Error(T('横轴取值必须是数字才能使用对数轴'));

    var maxRep = 0;
    data.series.forEach(function (s) {
      s.pts.forEach(function (p) { if (p.length > maxRep) maxRep = p.length; });
    });

    /* 逐点检验（以第一个系列为参照，BH 校正） */
    var tests = [];
    if (opts.showSig && data.series.length >= 2) {
      data.series.forEach(function (s, si) {
        if (si === 0) return;
        s.pts.forEach(function (p, xi) {
          var ref = data.series[0].pts[xi];
          if (!ref || !p || ref.length < 2 || p.length < 2) return;
          var tt = WB.stats.welchTTest(ref, p);
          tests.push({ si: si, xi: xi, p: tt.p, t: tt.t, diff: WB.stats.mean(p) - WB.stats.mean(ref) });
        });
      });
      if (tests.length) {
        var qs = WB.stats.pAdjust(tests.map(function (t) { return t.p; }), 'BH');
        tests.forEach(function (t, k) { t.q = qs[k]; });
      }
    }

    res.appendChild(WB.ui.statBar([
      { label: T('系列数'), value: data.series.length },
      { label: T('横轴取值数'), value: data.xs.length },
      { label: T('重复数（最多）'), value: maxRep }
    ]));

    var card = WB.ui.resultCard(T('折线图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = drawLine(holder, data, opts, tests);
    if (svg) {
      WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'line' });
      var bandNote = opts.bandType === 'sd' ? T('误差带为均值 ± 标准差（SD）；')
        : opts.bandType === 'sem' ? T('误差带为均值 ± 标准误（SEM）；')
          : opts.bandType === 'ci' ? T('误差带为均值的 95% 置信区间（均值 ± t(0.975, n−1) × 标准误）；')
            : T('本次未绘制误差带。');
      body.appendChild(el('div.preview-note', {
        text: T('折线为各位置均值；') + bandNote +
          T('个体连线为同一受试者在各位置的取值（按重复出现的顺序配对）。') +
          T('显著性标注以第一个系列为参照：* P<0.05，** P<0.01，*** P<0.001（BH 校正后判定）。')
      }));
    }
    if (opts.showSig && !tests.length) {
      body.appendChild(el('div.preview-note', { text: T('全部位置均无可用重复，已跳过显著性标注') }));
    }

    /* 逐点汇总表 */
    var rows = [];
    data.series.forEach(function (s, si) {
      s.pts.forEach(function (p, xi) {
        if (!p.length) return;
        var q = null;
        for (var k = 0; k < tests.length; k++) {
          if (tests[k].si === si && tests[k].xi === xi) { q = tests[k]; break; }
        }
        rows.push({
          x: data.xs[xi], name: s.name, n: p.length,
          mean: WB.stats.mean(p),
          sd: p.length >= 2 ? WB.stats.stdev(p) : NaN,
          sem: p.length >= 2 ? WB.stats.stdev(p) / Math.sqrt(p.length) : NaN,
          q: q ? q.q : NaN,
          diff: q ? q.diff : NaN,
          isRef: si === 0
        });
      });
    });
    var tCard = WB.ui.resultCard(T('逐时间点汇总与检验表'));
    res.appendChild(tCard);
    WB.ui.dataTable(tCard.querySelector('.card-body'), [
      { key: 'x', label: T('位置'), width: 96 },
      { key: 'name', label: T('系列') },
      { key: 'n', label: 'n', align: 'right', width: 54 },
      { key: 'mean', label: T('均值'), align: 'right', width: 88, format: function (r) { return WB.formatNum(r.mean, 4); } },
      { key: 'sd', label: T('标准差'), align: 'right', width: 84, format: function (r) { return isFinite(r.sd) ? WB.formatNum(r.sd, 4) : '—'; } },
      { key: 'sem', label: T('标准误'), align: 'right', width: 84, format: function (r) { return isFinite(r.sem) ? WB.formatNum(r.sem, 4) : '—'; } },
      {
        key: 'diff', label: T('均值差（对比参照）'), align: 'right', width: 130,
        format: function (r) { return r.isRef || !isFinite(r.diff) ? '—' : WB.formatNum(r.diff, 4); }
      },
      {
        key: 'q', label: 'padj (BH)', align: 'right', width: 96,
        format: function (r) { return r.isRef || !isFinite(r.q) ? '—' : WB.pFormat(r.q); }
      },
      {
        key: 'sig', label: T('显著性'), width: 84,
        render: function (r) {
          if (r.isRef || !isFinite(r.q)) return el('span.tag-cat.tag-ns', { text: '—' });
          var st = WB.plot.sigStar(r.q);
          return el('span.tag-cat.' + (st ? 'tag-up' : 'tag-ns'), { text: st || T('common.ns') });
        }
      }
    ], rows, { pageSize: 30, exportName: 'line_points', rowClass: function (r) { return (!r.isRef && isFinite(r.q) && r.q <= 0.05) ? 'row-sig' : ''; } });

    /* 曲线特征表 */
    var cCard = WB.ui.resultCard(T('曲线特征表'));
    res.appendChild(cCard);
    WB.ui.dataTable(cCard.querySelector('.card-body'), [
      { key: 'name', label: T('系列') },
      { key: 'npos', label: T('横轴取值数'), align: 'right', width: 110 },
      {
        key: 'peak', label: T('峰值'), align: 'right', width: 96,
        format: function (r) { return WB.formatNum(r.peak, 4); }
      },
      { key: 'peakX', label: T('峰值位置'), align: 'right', width: 100 },
      {
        key: 'auc', label: T('曲线下面积（梯形法）'), align: 'right', width: 150,
        format: function (r) { return WB.formatNum(r.auc, 4); }
      }
    ], data.series.map(function (s, si) {
      var best = -Infinity, bestXi = 0, auc = 0;
      s.pts.forEach(function (p, xi) {
        if (!p.length) return;
        var mu = WB.stats.mean(p);
        if (mu > best) { best = mu; bestXi = xi; }
        var nx = xi + 1;
        while (nx < s.pts.length && !s.pts[nx].length) nx++;
        if (nx >= s.pts.length) return;
        var mu2 = WB.stats.mean(s.pts[nx]);
        var dx = data.xIsNum ? (data.xs[nx] - data.xs[xi]) : (nx - xi);
        auc += (mu + mu2) / 2 * dx;
      });
      return { name: s.name, npos: s.pts.filter(function (p) { return p.length; }).length, peak: best, peakX: String(data.xs[bestXi]), auc: auc, ref: si === 0 };
    }), { pageSize: 20, exportName: 'line_curves' });
  }

  /* --------------------------- 解析与汇总 ------------------------------- */

  /** 取单元格文本：数值列直接取数值，文字列回退到原始字符串 */
  function cellText(m, ri, ci) {
    var row = m.matrix[ri] || [];
    if (isFinite(row[ci])) return String(row[ci]);
    var raw = (m.raw[ri] || [])[ci];
    return String(raw === undefined || raw === null ? '' : raw).trim();
  }

  function buildSeries(m) {
    var nCol = m.colNames.length;
    var rows = m.matrix;

    /* 三列且（系列名或横轴取值）是文字 → 按长表解析 */
    var isLong = false;
    if (nCol === 3) {
      var c1num = rows.every(function (r) { return isFinite(r[1]); });
      var c0num = rows.every(function (r) { return isFinite(r[0]); });
      if (!c1num || !c0num) {
        var someX = rows.some(function (r) { return isFinite(r[1]); });
        if (someX) isLong = true;
      }
    }
    if (isLong) return buildLong(m);
    return buildWide(m);
  }

  function buildWide(m) {
    var rows = m.matrix;
    var xIsNum = rows.every(function (r) { return isFinite(r[0]); });
    var names = m.colNames.slice(1);
    var byX = {}, keyOrder = [];

    rows.forEach(function (r, ri) {
      var xRaw = cellText(m, ri, 0);
      if (!xRaw) return;
      var key = String(xIsNum ? r[0] : xRaw);
      if (!byX[key]) {
        byX[key] = { x: xIsNum ? r[0] : xRaw, cols: names.map(function () { return []; }) };
        keyOrder.push(key);
      }
      names.forEach(function (n, j) {
        var v = r[j + 1];
        if (isFinite(v)) byX[key].cols[j].push(v);
      });
    });

    var keys = keyOrder.slice().sort(function (a, b) {
      return xIsNum ? WB.parse.num(a) - WB.parse.num(b) : (a < b ? -1 : (a > b ? 1 : 0));
    });
    return {
      xs: keys.map(function (k) { return byX[k].x; }),
      keys: keys, xIsNum: xIsNum, xName: m.colNames[0] || '',
      series: names.map(function (n, j) {
        return { name: n, pts: keys.map(function (k) { return byX[k].cols[j].slice(); }) };
      })
    };
  }

  function buildLong(m) {
    var groups = {}, order = [], xKeys = [];
    m.matrix.forEach(function (r, ri) {
      var g = cellText(m, ri, 0);
      var xk = cellText(m, ri, 1);
      var v = r[2];
      if (!g || !xk || !isFinite(v)) return;
      if (!groups[g]) { groups[g] = { name: g, byX: {} }; order.push(g); }
      if (!groups[g].byX[xk]) {
        groups[g].byX[xk] = [];
        if (xKeys.indexOf(xk) < 0) xKeys.push(xk);
      }
      groups[g].byX[xk].push(v);
    });

    var xIsNum = xKeys.every(function (k) { return isFinite(WB.parse.num(k)); });
    var keys = xKeys.slice().sort(function (a, b) {
      return xIsNum ? WB.parse.num(a) - WB.parse.num(b) : (a < b ? -1 : (a > b ? 1 : 0));
    });
    return {
      xs: keys.map(function (k) { return xIsNum ? WB.parse.num(k) : k; }),
      keys: keys, xIsNum: xIsNum, xName: m.colNames[1] || '',
      series: order.map(function (g) {
        return {
          name: groups[g].name,
          pts: keys.map(function (k) { return groups[g].byX[k] ? groups[g].byX[k].slice() : []; })
        };
      })
    };
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function markerPath(kind, x, y, r) {
    if (kind === 1) return 'M' + (x - r) + ' ' + (y - r) + 'H' + (x + r) + 'V' + (y + r) + 'H' + (x - r) + 'Z';
    if (kind === 2) return 'M' + x + ' ' + (y - r * 1.15) + 'L' + (x + r * 1.1) + ' ' + (y + r * 0.75) + 'L' + (x - r * 1.1) + ' ' + (y + r * 0.75) + 'Z';
    if (kind === 3) return 'M' + x + ' ' + (y - r * 1.2) + 'L' + (x + r * 1.1) + ' ' + y + 'L' + x + ' ' + (y + r * 1.2) + 'L' + (x - r * 1.1) + ' ' + y + 'Z';
    return 'M' + (x - r) + ' ' + y + 'A' + r + ' ' + r + ' 0 1 0 ' + (x + r) + ' ' + y + 'A' + r + ' ' + r + ' 0 1 0 ' + (x - r) + ' ' + y + 'Z';
  }

  /** Catmull-Rom 插值转三次贝塞尔（tension = 0.5 为标准 Catmull-Rom） */
  function smoothPath(pts) {
    if (pts.length < 3) return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
    var d = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) + ',' + c2x.toFixed(2) + ' ' + c2y.toFixed(2) + ',' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
    }
    return d;
  }

  function drawLine(container, data, opts, tests) {
    var nS = data.series.length;
    var padL = 76, padR = 26, padT = 34, padB = 96;
    var W = Math.max(680, padL + padR + data.xs.length * 96 + nS * 26);
    var H = 480;

    /* 坐标范围（建画布前算好，供图例避让决策使用） */
    var ymin = Infinity, ymax = -Infinity;
    data.series.forEach(function (s) {
      s.pts.forEach(function (p) {
        p.forEach(function (v) { if (v < ymin) ymin = v; if (v > ymax) ymax = v; });
      });
    });
    var ys = data.series.map(function (s) {
      return s.pts.map(function (p) {
        return p.length ? { mean: WB.stats.mean(p), sd: p.length >= 2 ? WB.stats.stdev(p) : 0, n: p.length } : null;
      });
    });
    var half = { sd: function (a) { return a.sd; }, sem: function (a) { return a.sd / Math.sqrt(a.n); }, ci: function (a) { return a.n >= 2 ? WB.stats.invTDist(a.n - 1, 0.05) * a.sd / Math.sqrt(a.n) : 0; } };
    if (opts.bandType !== 'none') {
      ys.forEach(function (row) {
        row.forEach(function (a) {
          if (!a) return;
          var h = half[opts.bandType](a);
          if (a.mean - h < ymin) ymin = a.mean - h;
          if (a.mean + h > ymax) ymax = a.mean + h;
        });
      });
    }
    if (opts.yLog) {
      if (ymin <= 0) throw new Error(T('纵轴存在非正值，无法使用对数轴'));
    }

    /* 图例避让：先按默认版式给四个角落打分（均值折线段 / 标记 / 显著性星号），
       选零遮挡的角；四角都被压则把图例抬到绘图区上方（画布同步加高），任何曲线都不会被盖住 */
    var lgW = WB.clamp(Math.ceil(Math.max.apply(null, data.series.map(function (s) { return WB.plot.textW(s.name, 12); }))) + 56, 168, 320);
    var lgH = nS * 20 + 22;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var xmin, xmax;
    if (data.xIsNum) {
      var allX = data.xs;
      xmin = Math.min.apply(null, allX); xmax = Math.max.apply(null, allX);
      var padX = (xmax - xmin) * 0.04 || 0.5;
      xmin -= padX; xmax += padX;
    }
    var pxOf = function (xi) {
      if (!data.xIsNum) return padL + (xi + 0.5) * (plotW / data.xs.length);
      var v = data.xs[xi];
      return opts.xLog
        ? padL + (Math.log(v) / Math.LN10 - Math.log(xmin) / Math.LN10) / ((Math.log(xmax) - Math.log(xmin)) / Math.LN10) * plotW
        : padL + (v - xmin) / ((xmax - xmin) || 1) * plotW;
    };
    var pyOf = function (v) {
      return opts.yLog
        ? (H - padB) - (Math.log(v) / Math.LN10 - Math.log(ymin) / Math.LN10) / ((Math.log(ymax) - Math.log(ymin)) / Math.LN10) * plotH
        : (H - padB) - (v - ymin) / ((ymax - ymin) || 1) * plotH;
    };
    /** 线段是否与矩形相交（Liang–Barsky 裁剪判定） */
    var segHitsRect = function (x1, y1, x2, y2, rx0, ry0, rx1, ry1) {
      var t0 = 0, t1 = 1, dx = x2 - x1, dy = y2 - y1;
      var p = [-dx, dx, -dy, dy], q = [x1 - rx0, rx1 - x1, y1 - ry0, ry1 - y1];
      for (var i = 0; i < 4; i++) {
        if (p[i] === 0) { if (q[i] < 0) return false; }
        else {
          var r = q[i] / p[i];
          if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
          else { if (r < t0) return false; if (r < t1) t1 = r; }
        }
      }
      return true;
    };
    var hitsLg = function (x0, y0) {
      var k = 0, mg = 8;
      var rx0 = x0 - mg, ry0 = y0 - mg, rx1 = x0 + lgW + mg, ry1 = y0 + lgH + mg;
      data.series.forEach(function (s, si) {
        var prev = null;
        s.pts.forEach(function (p, xi) {
          if (!ys[si][xi]) { prev = null; return; }
          var px = pxOf(xi), py = pyOf(ys[si][xi].mean);
          if (px > rx0 && px < rx1 && py > ry0 && py < ry1) k++;
          if (prev && segHitsRect(prev[0], prev[1], px, py, rx0, ry0, rx1, ry1)) k++;
          prev = [px, py];
        });
      });
      /* 显著性星号画在最高系列上方，同样计入 */
      tests.forEach(function (t) {
        if (t.q > 0.05) return;
        var topY = Infinity;
        data.series.forEach(function (s, si) {
          var a = ys[si][t.xi];
          if (!a) return;
          var h = (opts.bandType !== 'none' && a.n >= 2) ? half[opts.bandType](a) : 0;
          var y = pyOf(a.mean + h);
          if (y < topY) topY = y;
        });
        if (!isFinite(topY)) return;
        var px = pxOf(t.xi);
        for (var lvl = 0; lvl < 3; lvl++) {
          var yy = topY - 12 - lvl * 13;
          if (px > rx0 && px < rx1 && yy > ry0 && yy < ry1) { k++; break; }
        }
      });
      return k;
    };
    var cands = [
      [Math.max(padL + 16, padL + plotW + 10 - lgW), padT + 8],
      [padL + 16, padT + 8],
      [Math.max(padL + 16, padL + plotW + 10 - lgW), padT + plotH - lgH - 8],
      [padL + 16, padT + plotH - lgH - 8]
    ];
    var best = 0;
    for (var bi = 1; bi < cands.length; bi++) {
      if (hitsLg(cands[bi][0], cands[bi][1]) < hitsLg(cands[best][0], cands[best][1])) best = bi;
    }
    var lgPos;
    if (hitsLg(cands[best][0], cands[best][1]) === 0) {
      lgPos = cands[best];
    } else {
      padT += lgH + 18; H += lgH + 18; plotH = H - padT - padB;
      lgPos = [Math.max(padL + 16, padL + plotW + 10 - lgW), 14]; /* 框顶绘制在 ly-12，留足画布内边距 */
    }

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var sx;
    if (data.xIsNum) {
      sx = opts.xLog ? logScale(xmin, xmax, padL, padL + plotW) : WB.plot.linearScale(xmin, xmax, padL, padL + plotW);
    } else {
      var step = plotW / data.xs.length;
      sx = function (i) { return padL + (i + 0.5) * step; };
    }
    var ys2 = opts.yLog ? logScale(ymin, ymax, padT + plotH, padT) : WB.plot.linearScale(ymin, ymax, padT + plotH, padT);
    var sy = ys2;

    /* 网格与轴 */
    var yTicks = opts.yLog ? yLogTicks(ymin, ymax) : sy.ticks(6);
    yTicks.forEach(function (t) {
      if (t < ymin || t > ymax) return;
      root.appendChild(S('line', { x1: padL, y1: sy(t), x2: padL + plotW, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(padL - 8, sy(t) + 3.5, WB.formatNum(t, 2), { 'text-anchor': 'end', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    root.appendChild(S('line', { x1: padL, y1: padT + plotH, x2: padL + plotW, y2: padT + plotH, stroke: WB.plot.AXIS }));
    root.appendChild(S('line', { x1: padL, y1: padT, x2: padL, y2: padT + plotH, stroke: WB.plot.AXIS }));

    var posAt = function (xi) { return data.xIsNum ? sx(data.xs[xi]) : sx(xi); };
    data.xs.forEach(function (x, xi) {
      var px = posAt(xi);
      root.appendChild(WB.plot.txt(px, padT + plotH + 22, String(x), {
        'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT,
        transform: String(x).length > 8 ? 'rotate(-28 ' + px + ' ' + (padT + plotH + 22) + ')' : ''
      }));
    });

    /* 个体连线：按重复出现的顺序把同一受试者的各位置取值连起来 */
    if (opts.showSpaghetti) {
      data.series.forEach(function (s, si) {
        var nRep = 0;
        s.pts.forEach(function (p) { if (p.length > nRep) nRep = p.length; });
        for (var ri = 0; ri < nRep; ri++) {
          var seg = [];
          s.pts.forEach(function (p, xi) {
            if (isFinite(p[ri])) seg.push([posAt(xi), sy(p[ri])]);
          });
          if (seg.length >= 2) {
            root.appendChild(S('path', {
              d: 'M' + seg.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'),
              fill: 'none', stroke: WB.plot.palette(si), 'stroke-width': 0.9, 'stroke-opacity': 0.42
            }));
          }
        }
      });
    }

    /* 误差带 + 折线 + 标记 */
    data.series.forEach(function (s, si) {
      var col = WB.plot.palette(si);
      var pts = [], up = [], dn = [];
      ys[si].forEach(function (a, xi) {
        if (!a) return;
        var px = posAt(xi), py = sy(a.mean);
        pts.push([px, py]);
        if (opts.bandType !== 'none' && a.n >= 2) {
          var h = half[opts.bandType](a);
          up.push([px, sy(a.mean + h)]);
          dn.push([px, sy(a.mean - h)]);
        }
      });
      if (pts.length < 2) return;

      if (up.length >= 2) {
        root.appendChild(S('polygon', {
          points: up.concat(dn.reverse()).map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '),
          fill: col, 'fill-opacity': 0.14, stroke: 'none'
        }));
      }

      var straight = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
      if (opts.lineStyle === 'smooth') {
        root.appendChild(S('path', { d: smoothPath(pts), fill: 'none', stroke: col, 'stroke-width': 2.1, 'stroke-linejoin': 'round' }));
      } else if (opts.lineStyle === 'both') {
        root.appendChild(S('path', { d: smoothPath(pts), fill: 'none', stroke: col, 'stroke-width': 1.2, 'stroke-opacity': 0.45, 'stroke-dasharray': '4 3' }));
        root.appendChild(S('path', { d: straight, fill: 'none', stroke: col, 'stroke-width': 2.1, 'stroke-linejoin': 'round' }));
      } else {
        root.appendChild(S('path', { d: straight, fill: 'none', stroke: col, 'stroke-width': 2.1, 'stroke-linejoin': 'round' }));
      }

      if (opts.showMarks) {
        pts.forEach(function (p) {
          root.appendChild(S('path', {
            d: markerPath(si % 4, p[0], p[1], 4.1),
            fill: '#ffffff', stroke: col, 'stroke-width': 1.6
          }));
        });
      }

      /* 悬停提示 */
      ys[si].forEach(function (a, xi) {
        if (!a) return;
        var px = posAt(xi);
        var hitW = Math.max(16, plotW / data.xs.length);
        var hit = S('rect', { x: Math.min(px - Math.max(8, hitW / 2), W - hitW - 1), y: sy(a.mean) - 9, width: hitW, height: 18, fill: 'transparent' });
        root.appendChild(hit);
        WB.plot.bindTip(hit, function () {
          return '<b>' + WB.esc(s.name) + '</b><br>' + T('位置') + ' = ' + WB.esc(String(data.xs[xi])) +
            '<br>n = ' + a.n +
            '<br>' + T('均值') + ' = ' + WB.formatNum(a.mean, 4) +
            (a.n >= 2 ? '<br>' + T('标准差') + ' = ' + WB.formatNum(a.sd, 4) : '');
        });
      });
    });

    /* 逐点显著性标注 */
    if (tests.length) {
      var byX = {};
      tests.forEach(function (t) {
        if (t.q > 0.05) return;
        byX[t.xi] = byX[t.xi] || [];
        byX[t.xi].push(t);
      });
      Object.keys(byX).forEach(function (xiStr) {
        var xi = Number(xiStr);
        var list = byX[xiStr].sort(function (a, b) { return a.q - b.q; });
        var px = posAt(xi);
        var topY = Infinity;
        data.series.forEach(function (s, si) {
          var a = ys[si][xi];
          if (!a) return;
          var h = (opts.bandType !== 'none' && a.n >= 2) ? half[opts.bandType](a) : 0;
          var y = sy(a.mean + h);
          if (y < topY) topY = y;
        });
        list.forEach(function (t, k) {
          var yy = topY - 12 - k * 13;
          if (yy < padT - 8) return;
          root.appendChild(WB.plot.txt(px, yy, WB.plot.sigStar(t.q) || '*', {
            'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#a8332b'
          }));
          var hit = S('rect', { x: px - 11, y: yy - 11, width: 22, height: 14, fill: 'transparent' });
          root.appendChild(hit);
          WB.plot.bindTip(hit, function () {
            return '<b>' + WB.esc(data.series[t.si].name) + ' vs ' + WB.esc(data.series[0].name) + '</b>' +
              '<br>' + T('位置') + ' = ' + WB.esc(String(data.xs[xi])) +
              '<br>' + T('均值差（对比参照）') + ' = ' + WB.formatNum(t.diff, 4) +
              '<br>t = ' + WB.formatNum(t.t, 4) +
              '<br>P = ' + WB.pFormat(t.p) +
              '<br>padj = ' + WB.pFormat(t.q);
          });
        });
      });
    }

    /* 轴标题 */
    var yl = WB.plot.txt(0, 0, T('common.value'), { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(padT + plotH / 2)); yl.setAttribute('y', 16);
    root.appendChild(yl);
    root.appendChild(WB.plot.txt(padL + plotW / 2, H - 10, data.xName || T('位置'), { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT }));

    /* 图内图例（位置已按避让策略提前选定：四角择优或抬到绘图区上方） */
    var lx = lgPos[0], ly = lgPos[1];
    var lg = WB.plot.g({});
    root.appendChild(lg);
    lg.appendChild(S('rect', {
      x: lx - 10, y: ly - 12, width: lgW, height: nS * 20 + 22, rx: 8,
      fill: '#ffffff', 'fill-opacity': 0.94, stroke: WB.plot.AXIS
    }));
    data.series.forEach(function (s, si) {
      var y = ly + si * 20;
      lg.appendChild(S('line', { x1: lx, y1: y + 4, x2: lx + 22, y2: y + 4, stroke: WB.plot.palette(si), 'stroke-width': 2.1 }));
      lg.appendChild(S('path', { d: markerPath(si % 4, lx + 11, y + 4, 3.6), fill: '#ffffff', stroke: WB.plot.palette(si), 'stroke-width': 1.4 }));
      lg.appendChild(WB.plot.txt(lx + 32, y + 8, WB.plot.truncateW(s.name, lgW - 46, 12), { 'font-size': 12, fill: WB.plot.TEXT }));
    });

    return canvas.svg;
  }

  /* 供自检使用的纯函数 */
  WB.line = { buildSeries: buildSeries, smoothPath: smoothPath };

  function logScale(d0, d1, r0, r1) {
    var l0 = Math.log(d0) / Math.LN10, l1 = Math.log(d1) / Math.LN10;
    var f = WB.plot.linearScale(l0, l1, r0, r1);
    var g = function (v) { return f(Math.log(v) / Math.LN10); };
    g.invert = function (p) { return Math.pow(10, f.invert ? f.invert(p) : l0 + (p - r0) / (r1 - r0) * (l1 - l0)); };
    return g;
  }

  function yLogTicks(lo, hi) {
    var a = Math.floor(Math.log(lo) / Math.LN10), b = Math.ceil(Math.log(hi) / Math.LN10);
    var out = [];
    for (var e = a; e <= b; e++) {
      var base = Math.pow(10, e);
      for (var k = 1; k <= 9; k++) {
        var v = base * k;
        if (v >= lo && v <= hi) out.push(v);
      }
    }
    if (out.length > 12) {
      out = out.filter(function (v) {
        var e2 = Math.round(Math.log(v) / Math.LN10);
        return Math.abs(v / Math.pow(10, e2) - 1) < 1e-9;
      });
    }
    return out;
  }
})(window);
