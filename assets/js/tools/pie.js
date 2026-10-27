/* =============================================================================
 * tools/pie.js  —  组分占比图（饼图 / 环形图 / 旭日图）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '展示各组分占比：饼图、环形图与两层旭日图；自动计算百分比并绘制引出线标签与图内图例。':
      'Show composition shares: pie, doughnut and two-level sunburst charts, with automatic percentages, leader-line labels and an in-figure legend.',
    '组分占比': 'Composition',
    '饼图': 'Pie chart',
    '环形图': 'Doughnut chart',
    '旭日图': 'Sunburst chart',
    '占比': 'Share',
    '类别占比（饼图）': 'Category shares (pie)',
    '两列（类别 + 数值）': 'Two columns (category + value)',
    ['<b>第一列是类别名，第二列是数值</b>（频数、丰度、金额等，须为非负）。数值列缺失或非数值的行会被忽略；' +
      '占比 = 该类数值 / 全部数值之和。']:
      '<b>The first column is the category name and the second column the value</b> (count, abundance, amount…, non-negative). ' +
      'Rows with missing or non-numeric values are ignored; share = value / sum of all values.',
    '单列类别（自动计数）': 'Single category column (auto-count)',
    '只有一列时，按类别出现次数计数后绘图。': 'With a single column, each category is counted by occurrence.',
    '三列（一级 + 二级 + 数值，旭日图）': 'Three columns (level-1 + level-2 + value, sunburst)',
    ['<b>第一列是一级类别，第二列是二级类别，第三列是数值</b>：绘制两层旭日图，内圈为一级、外圈为二级。' +
      '同名二级类别在不同一级类别下按各自父类分别展示。']:
      '<b>The first column is the level-1 category, the second the level-2 category and the third the value</b>: a two-level sunburst is drawn (inner ring = level 1, outer ring = level 2). ' +
      'The same level-2 name under different parents is drawn separately within each parent.',
    '图表类型': 'Chart type',
    '起始角（度）': 'Start angle (degrees)',
    '顺时针': 'Clockwise',
    '显示百分比标签': 'Show percentage labels',
    '小扇区引出线（占比 < 4%）': 'Leader lines for small slices (share < 4%)',
    '显示图内图例': 'Show in-figure legend',
    '环宽（环形图）': 'Ring width (doughnut)',
    '绘制占比图': 'Draw composition chart',
    '类别数': 'Categories',
    '总计': 'Total',
    '最大类别': 'Largest category',
    '未解析到有效的数值（第二列须为非负数值）': 'No valid values were parsed (the second column must hold non-negative numbers)',
    '旭日图需要三列输入（一级 + 二级 + 数值）': 'The sunburst chart needs three columns (level-1 + level-2 + value)',
    '数值出现了负值或全部为 0': 'Values must be non-negative and cannot all be 0',
    '饼图：扇区角度 = 数值占比，从「起始角」开始顺时针绘制；标签为百分比，小于 4% 的扇区用引出线标注以免重叠。':
      'Pie: slice angles equal the value shares, drawn clockwise from the start angle; labels are percentages, and slices below 4% are annotated with leader lines to avoid overlap.',
    '旭日图：内圈为一级类别，外圈为二级类别（角度在父类扇区内再分配），便于同时展示两级构成。':
      'Sunburst: the inner ring holds level-1 categories and the outer ring level-2 categories (angles re-allocated inside each parent), showing two levels of composition at once.',
    '类别': 'Category',
    '数量': 'Count',
    '组成明细表': 'Composition detail table',
    '一级类别': 'Level-1 category',
    '二级类别': 'Level-2 category',
    '其他（过多类别合并）': 'Others (merged small categories)',
    '最大扇区数（其余合并为「其他」）': 'Maximum slices (the rest merged into “Others”)'
  });

  var FORMATS = [
    {
      name: '两列（类别 + 数值）',
      filename: 'pie_template.tsv',
      desc: '<b>第一列是类别名，第二列是数值</b>（频数、丰度、金额等，须为非负）。数值列缺失或非数值的行会被忽略；占比 = 该类数值 / 全部数值之和。',
      sample: 'Category\tCount\n' +
        'T cells\t412\n' +
        'B cells\t168\n' +
        'Macrophages\t233\n' +
        'Fibroblasts\t120\n' +
        'Endothelial\t67\n' +
        'NK cells\t31'
    },
    {
      name: '单列类别（自动计数）',
      filename: 'pie_template_1col.tsv',
      desc: '只有一列时，按类别出现次数计数后绘图。',
      sample: 'CellType\nT cells\nT cells\nB cells\nMacrophages\nT cells\nFibroblasts'
    },
    {
      name: '三列（一级 + 二级 + 数值，旭日图）',
      filename: 'sunburst_template.tsv',
      desc: '<b>第一列是一级类别，第二列是二级类别，第三列是数值</b>：绘制两层旭日图，内圈为一级、外圈为二级。同名二级类别在不同一级类别下按各自父类分别展示。',
      sample: 'Level1\tLevel2\tCount\n' +
        'Immune\tT cells\t412\n' +
        'Immune\tB cells\t168\n' +
        'Immune\tMacrophages\t233\n' +
        'Immune\tNK cells\t31\n' +
        'Stromal\tFibroblasts\t120\n' +
        'Stromal\tEndothelial\t67'
    }
  ];

  WB.register({
    id: 'pie',
    name: '饼图',
    icon: '◕',
    color: '#8a6fb8',
    desc: '展示各组分占比：饼图、环形图与两层旭日图；自动计算百分比并绘制引出线标签与图内图例。',
    tags: ['组分占比', '饼图', '环形图', '旭日图'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('饼图') }),
        el('p', { text: T('展示各组分占比：饼图、环形图与两层旭日图；自动计算百分比并绘制引出线标签与图内图例。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '类别占比（饼图）',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.pieText,
        placeholder: 'Category\tCount\nT cells\t412\nB cells\t168\n...',
        paramsTitle: '绘图参数',
        params: [
          {
            key: 'chartType', label: '图表类型', type: 'select', value: 'pie',
            options: [
              { value: 'pie', label: '饼图' },
              { value: 'donut', label: '环形图' },
              { value: 'sunburst', label: '旭日图' }
            ]
          },
          { key: 'startAngle', label: '起始角（度）', type: 'number', value: 90, min: 0, max: 360, step: 5 },
          { key: 'clockwise', label: '顺时针', type: 'checkbox', value: true },
          { key: 'showPct', label: '显示百分比标签', type: 'checkbox', value: true },
          { key: 'leader', label: '小扇区引出线（占比 < 4%）', type: 'checkbox', value: true },
          { key: 'showLegend', label: '显示图内图例', type: 'checkbox', value: true },
          { key: 'ringWidth', label: '环宽（环形图）', type: 'number', value: 0.42, min: 0.15, max: 0.8, step: 0.02 },
          { key: 'maxSlices', label: '最大扇区数（其余合并为「其他」）', type: 'number', value: 12, min: 3, max: 30, step: 1 }
        ],
        runLabel: '绘制占比图',
        onRun: function (ctx) {
          var res = WB.$('#pie-result');
          WB.clear(res);
          runPlot(res, ctx);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'pie-result';
      main.appendChild(wrap);
      if (!WB._pieDemoLoaded) { WB._pieDemoLoaded = true; panel.setText(WB.demo.pieText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  /** 取单元格文本：数值列直接取数值，文字列回退到原始字符串 */
  function cellText(m, ri, ci) {
    var row = m.matrix[ri] || [];
    if (isFinite(row[ci])) return String(row[ci]);
    var raw = (m.raw[ri] || [])[ci];
    return String(raw === undefined || raw === null ? '' : raw).trim();
  }

  function runPlot(res, ctx) {
    /* 首列是类别名（文字），需关闭「首列作为行名」的自动处理 */
    var m = WB.parse.parseMatrix(ctx.text, { rowNames: false });
    if (!m.matrix.length) throw new Error(T('未解析到有效数据，请检查输入格式'));
    var nCol = m.colNames.length || m.matrix[0].length;
    var type = ctx.values.chartType;
    if (type === 'sunburst' && nCol < 3) throw new Error(T('旭日图需要三列输入（一级 + 二级 + 数值）'));

    var items;   /* [{name, value}] 或旭日 {parent, name, value} */
    if (type === 'sunburst') {
      items = [];
      var pTotals = {};
      m.matrix.forEach(function (r, ri) {
        var p = cellText(m, ri, 0);
        var c = cellText(m, ri, 1);
        var v = r[2];
        if (!p || !c || !isFinite(v) || v < 0) return;
        items.push({ parent: p, name: c, value: v });
        pTotals[p] = (pTotals[p] || 0) + v;
      });
      if (!items.length) throw new Error(T('未解析到有效的数值（第二列须为非负数值）'));
      drawSunburst(res, items, ctx.values, pTotals);
      return;
    }

    var counts = {};
    if (nCol < 2) {
      m.matrix.forEach(function (r, ri) {
        var k = cellText(m, ri, 0);
        if (k) counts[k] = (counts[k] || 0) + 1;
      });
    } else {
      m.matrix.forEach(function (r, ri) {
        var k = cellText(m, ri, 0);
        var v = r[1];
        if (k && isFinite(v) && v > 0) counts[k] = (counts[k] || 0) + v;
      });
    }
    items = Object.keys(counts).map(function (k) { return { name: k, value: counts[k] }; })
      .filter(function (d) { return d.value > 0; });
    if (!items.length) throw new Error(T('未解析到有效的数值（第二列须为非负数值）'));

    var total = items.reduce(function (a, d) { return a + d.value; }, 0);
    if (!(total > 0)) throw new Error(T('数值出现了负值或全部为 0'));

    /* 小类别合并为「其他」 */
    var maxSlices = Math.max(3, Number(ctx.values.maxSlices) || 12);
    items.sort(function (a, b) { return b.value - a.value; });
    if (items.length > maxSlices) {
      var head = items.slice(0, maxSlices - 1);
      var rest = items.slice(maxSlices - 1);
      head.push({
        name: T('其他（过多类别合并）'),
        value: rest.reduce(function (a, d) { return a + d.value; }, 0),
        merged: rest.length
      });
      items = head;
    }

    var largest = items[0];
    res.appendChild(WB.ui.statBar([
      { label: T('类别数'), value: items.length },
      { label: T('总计'), value: WB.formatNum(total, 2) },
      { label: T('最大类别'), value: largest.name + ' (' + WB.formatNum(largest.value / total * 100, 1) + '%)' }
    ]));

    var card = WB.ui.resultCard(T('饼图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = type === 'donut'
      ? drawPie(holder, items, total, ctx.values, true)
      : drawPie(holder, items, total, ctx.values, false);
    WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'pie' });
    body.appendChild(el('div.preview-note', {
      text: T('饼图：扇区角度 = 数值占比，从「起始角」开始顺时针绘制；标签为百分比，小于 4% 的扇区用引出线标注以免重叠。')
    }));

    /* 明细表 */
    var tCard = WB.ui.resultCard(T('组成明细表'));
    res.appendChild(tCard);
    WB.ui.dataTable(tCard.querySelector('.card-body'), [
      { key: 'rank', label: '#', align: 'right', width: 52 },
      { key: 'name', label: T('类别') },
      { key: 'value', label: T('数量'), align: 'right', width: 110, format: function (r) { return WB.formatNum(r.value, 2); } },
      { key: 'pct', label: T('占比'), align: 'right', width: 90, format: function (r) { return WB.formatNum(r.value / total * 100, 2) + '%'; } }
    ], items.map(function (d, i) { return { rank: i + 1, name: d.name, value: d.value }; }),
      { pageSize: 20, exportName: 'pie_detail' });
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function arcPath(cx, cy, r0, r1, a0, a1) {
    var large = (a1 - a0) > Math.PI ? 1 : 0;
    var x0 = cx + r1 * Math.cos(a0), y0 = cy + r1 * Math.sin(a0);
    var x1 = cx + r1 * Math.cos(a1), y1 = cy + r1 * Math.sin(a1);
    if (r0 <= 0.01) {
      return 'M' + cx + ',' + cy + ' L' + x0.toFixed(2) + ',' + y0.toFixed(2) +
        ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' Z';
    }
    var xi1 = cx + r0 * Math.cos(a1), yi1 = cy + r0 * Math.sin(a1);
    var xi0 = cx + r0 * Math.cos(a0), yi0 = cy + r0 * Math.sin(a0);
    return 'M' + x0.toFixed(2) + ',' + y0.toFixed(2) +
      ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) +
      ' L' + xi1.toFixed(2) + ',' + yi1.toFixed(2) +
      ' A' + r0 + ',' + r0 + ' 0 ' + large + ' 0 ' + xi0.toFixed(2) + ',' + yi0.toFixed(2) + ' Z';
  }

  function drawPie(container, items, total, opt, donut) {
    /* 图例宽度随最长标签自适应（超出 300px 才收缩），画布随之加宽，避免标签截断 */
    var legendLabels = items.map(function (d) {
      var pct = total ? d.value / total * 100 : 0;
      return d.name + ' — ' + WB.formatNum(pct, 1) + '% (' + WB.formatNum(d.value, 0) + ')';
    });
    var legendW = 0;
    if (opt.showLegend !== false) {
      var maxLgW = Math.max.apply(null, legendLabels.map(function (l) { return WB.plot.textW(l, 12); }));
      legendW = WB.clamp(Math.ceil(maxLgW) + 36, 148, 320);
    }
    var W = Math.max(760, Math.ceil(608 + legendW + 14));
    var H = 540;
    var cx = 340, cy = H / 2 - 6;
    var R = Math.min(210, H / 2 - 60);
    var r0 = donut ? R * WB.clamp(1 - (Number(opt.ringWidth) || 0.42), 0.12, 0.85) : 0;
    var a0 = (Number(opt.startAngle) || 90) * Math.PI / 180;
    var dir = opt.clockwise === false ? -1 : 1;

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var ang = a0;
    var legendItems = [];

    items.forEach(function (d, i) {
      var frac = d.value / total;
      var sweep = frac * 2 * Math.PI * dir;
      var a1 = ang + sweep;
      var lo = Math.min(ang, a1), hi = Math.max(ang, a1);
      var col = WB.plot.palette(i);
      var mid = (lo + hi) / 2;
      var path = S('path', {
        d: arcPath(cx, cy, r0, R, lo, hi),
        fill: col, stroke: '#ffffff', 'stroke-width': 1.4
      });
      root.appendChild(path);
      var pct = (frac * 100);
      var showPct = opt.showPct && frac >= 0.04;
      if (showPct) {
        var rm = (r0 + R) / 2;
        root.appendChild(WB.plot.txt(cx + rm * Math.cos(mid), cy + rm * Math.sin(mid) + 3.5,
          WB.formatNum(pct, 1) + '%', {
            'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600,
            fill: WB.plot.lum(col) > 0.6 ? '#22303c' : '#ffffff'
          }));
      } else if (opt.leader && frac < 0.04 && frac >= 0.004) {
        var rl = R + 14;
        var xr = cx + rl * Math.cos(mid), yr = cy + rl * Math.sin(mid);
        var flip = Math.cos(mid) < 0;
        var xl = xr + (flip ? -26 : 26);
        root.appendChild(S('line', {
          x1: cx + (R + 4) * Math.cos(mid), y1: cy + (R + 4) * Math.sin(mid),
          x2: xr, y2: yr, stroke: '#9aa5b1', 'stroke-width': 0.9
        }));
        root.appendChild(S('line', { x1: xr, y1: yr, x2: xl, y2: yr, stroke: '#9aa5b1', 'stroke-width': 0.9 }));
        /* 引线标签按剩余像素预算显示（右侧不超过图例框，左侧不出画布） */
        var lbl = d.name + ' ' + WB.formatNum(pct, 1) + '%';
        var budget = flip ? (xl - 4 - 6) : (Math.min(W - 8, 620 - 20) - (xl + 4));
        root.appendChild(WB.plot.txt(xl + (flip ? -4 : 4), yr + 4,
          WB.plot.truncateW(lbl, budget, 11.5), {
            'text-anchor': flip ? 'end' : 'start', 'font-size': 11.5, 'font-weight': 600, fill: WB.plot.TEXT
          }));
      }
      legendItems.push({ color: col, label: d.name + ' — ' + WB.formatNum(pct, 1) + '% (' + WB.formatNum(d.value, 0) + ')' });
      WB.plot.bindTip(path, function () {
        return '<b>' + WB.esc(d.name) + '</b><br>' + T('数量') + ' = ' + WB.formatNum(d.value, 2) +
          '<br>' + T('占比') + ' = ' + WB.formatNum(pct, 2) + '%';
      });
      ang = a1;
    });

    if (donut) {
      root.appendChild(WB.plot.txt(cx, cy - 6, T('总计'), { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
      root.appendChild(WB.plot.txt(cx, cy + 14, WB.formatNum(total, 0), { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: WB.plot.TEXT }));
    }

    if (opt.showLegend) {
      var lx = 620, ly = Math.max(40, (H - legendItems.length * 19) / 2);
      var lg = WB.plot.g({});
      root.appendChild(lg);
      lg.appendChild(S('rect', {
        x: lx - 12, y: ly - 16, width: legendW, height: legendItems.length * 19 + 26, rx: 8,
        fill: '#ffffff', 'fill-opacity': 0.94, stroke: WB.plot.AXIS
      }));
      legendItems.forEach(function (it, i) {
        var y = ly + i * 19;
        lg.appendChild(S('rect', { x: lx - 4, y: y - 7, width: 11, height: 11, rx: 2, fill: it.color }));
        lg.appendChild(WB.plot.txt(lx + 13, y + 3, WB.plot.truncateW(it.label, legendW - 32, 12), { 'font-size': 12, fill: WB.plot.TEXT }));
      });
    }
    return canvas.svg;
  }

  function drawSunburst(res, items, opt, pTotals) {
    var parents = Object.keys(pTotals).sort(function (a, b) { return pTotals[b] - pTotals[a]; });
    var total = 0;
    parents.forEach(function (p) { total += pTotals[p]; });
    if (!(total > 0)) throw new Error(T('数值出现了负值或全部为 0'));

    var W0 = 760, H = 620;
    /* 图例宽度随最长标签自适应，画布随之加宽 */
    var sunLgW = 0;
    if (opt.showLegend !== false) {
      var lgProbe = parents.map(function (p) {
        var pct = pTotals[p] / (Object.keys(pTotals).reduce(function (a, k) { return a + pTotals[k]; }, 0) || 1) * 100;
        return p + ' — ' + WB.formatNum(pct, 1) + '%';
      });
      var maxLgW2 = Math.max.apply(null, lgProbe.map(function (l) { return WB.plot.textW(l, 12); }));
      sunLgW = WB.clamp(Math.ceil(maxLgW2) + 36, 158, 320);
    }
    var W = Math.max(W0, Math.ceil(608 + sunLgW + 14));
    var cx = 340, cy = H / 2;
    var R = 250, rMid = 132;
    var a0 = (Number(opt.startAngle) || 90) * Math.PI / 180;
    var dir = opt.clockwise === false ? -1 : 1;

    res.appendChild(WB.ui.statBar([
      { label: T('一级类别'), value: parents.length },
      { label: T('二级类别'), value: items.length },
      { label: T('总计'), value: WB.formatNum(total, 2) }
    ]));

    var card = WB.ui.resultCard(T('旭日图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var canvas = WB.plot.createSVG(holder, W, H, {});
    var root = canvas.root;
    var legendItems = [];
    var parentColor = {};
    parents.forEach(function (p, i) { parentColor[p] = WB.plot.palette(i); });

    var ang = a0;
    parents.forEach(function (p) {
      var pFrac = pTotals[p] / total;
      var pSweep = pFrac * 2 * Math.PI * dir;
      var pLo = Math.min(ang, ang + pSweep), pHi = Math.max(ang, ang + pSweep);
      var col = parentColor[p];
      var pPath = S('path', {
        d: arcPath(cx, cy, rMid - 42, rMid + 42, pLo, pHi),
        fill: col, 'fill-opacity': 0.85, stroke: '#ffffff', 'stroke-width': 1.4
      });
      root.appendChild(pPath);
      var pmid = (pLo + pHi) / 2;
      var pct = pFrac * 100;
      if (opt.showPct && pct >= 4) {
        root.appendChild(WB.plot.txt(cx + rMid * Math.cos(pmid), cy + rMid * Math.sin(pmid) + 3.5,
          WB.formatNum(pct, 1) + '%', {
            'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 600,
            fill: WB.plot.lum(col) > 0.6 ? '#22303c' : '#ffffff'
          }));
      }
      legendItems.push({ color: col, label: p + ' — ' + WB.formatNum(pct, 1) + '%' });
      WB.plot.bindTip(pPath, function () {
        return '<b>' + WB.esc(p) + '</b><br>' + T('占比') + ' = ' + WB.formatNum(pct, 2) + '%';
      });

      /* 子扇区 */
      var sub = items.filter(function (d) { return d.parent === p; })
        .sort(function (a, b) { return b.value - a.value; });
      var sa = ang;
      sub.forEach(function (d, si) {
        var sw = (d.value / pTotals[p]) * pSweep;
        var lo = Math.min(sa, sa + sw), hi = Math.max(sa, sa + sw);
        var shade = WB.plot.rgb2hex ?
          WB.plot.rgb2hex.apply(null, WB.plot.hex2rgb(col).map(function (v) {
            return Math.round(v * (0.62 + 0.38 * (si + 1) / Math.max(1, sub.length)));
          })) : col;
        var path = S('path', {
          d: arcPath(cx, cy, rMid + 46, R, lo, hi),
          fill: shade, stroke: '#ffffff', 'stroke-width': 1.1
        });
        root.appendChild(path);
        var mid = (lo + hi) / 2;
        var subPct = d.value / total * 100;
        if (opt.showPct && subPct >= 2.4) {
          var rm = (rMid + 46 + R) / 2;
          var lab = WB.plot.ellipsis(d.name, 12);
          root.appendChild(WB.plot.txt(cx + rm * Math.cos(mid), cy + rm * Math.sin(mid) + 3.5, lab, {
            'text-anchor': Math.cos(mid) < -0.15 ? 'end' : (Math.cos(mid) > 0.15 ? 'start' : 'middle'),
            'font-size': 10, fill: '#22303c'
          }));
        }
        WB.plot.bindTip(path, function () {
          return '<b>' + WB.esc(p) + ' → ' + WB.esc(d.name) + '</b><br>' +
            T('数量') + ' = ' + WB.formatNum(d.value, 2) +
            '<br>' + T('占比') + ' = ' + WB.formatNum(subPct, 2) + '%（' + WB.formatNum(d.value / pTotals[p] * 100, 1) + '% of ' + WB.esc(p) + '）';
        });
        sa += sw;
      });
      ang += pSweep;
    });

    root.appendChild(WB.plot.txt(cx, cy - 6, T('总计'), { 'text-anchor': 'middle', 'font-size': 11.5, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(cx, cy + 14, WB.formatNum(total, 0), { 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: WB.plot.TEXT }));

    if (opt.showLegend) {
      var lx = 620, ly = Math.max(40, (H - legendItems.length * 19) / 2);
      var lg = WB.plot.g({});
      root.appendChild(lg);
      lg.appendChild(S('rect', {
        x: lx - 12, y: ly - 16, width: sunLgW, height: legendItems.length * 19 + 26, rx: 8,
        fill: '#ffffff', 'fill-opacity': 0.94, stroke: WB.plot.AXIS
      }));
      legendItems.forEach(function (it, i) {
        var y = ly + i * 19;
        lg.appendChild(S('rect', { x: lx - 4, y: y - 7, width: 11, height: 11, rx: 2, fill: it.color }));
        lg.appendChild(WB.plot.txt(lx + 13, y + 3, WB.plot.truncateW(it.label, sunLgW - 32, 12), { 'font-size': 12, fill: WB.plot.TEXT }));
      });
    }

    WB.plot.addToolbar(body, { getSvg: function () { return canvas.svg; }, basename: 'sunburst' });
    body.appendChild(el('div.preview-note', {
      text: T('旭日图：内圈为一级类别，外圈为二级类别（角度在父类扇区内再分配），便于同时展示两级构成。')
    }));

    /* 明细表 */
    var rows = items.map(function (d) {
      return { l1: d.parent, l2: d.name, value: d.value, pct: d.value / total * 100 };
    }).sort(function (a, b) { return a.l1.localeCompare(b.l1) || b.value - a.value; });
    var tCard = WB.ui.resultCard(T('组成明细表'));
    res.appendChild(tCard);
    WB.ui.dataTable(tCard.querySelector('.card-body'), [
      { key: 'l1', label: T('一级类别') },
      { key: 'l2', label: T('二级类别') },
      { key: 'value', label: T('数量'), align: 'right', width: 110, format: function (r) { return WB.formatNum(r.value, 2); } },
      { key: 'pct', label: T('占比'), align: 'right', width: 90, format: function (r) { return WB.formatNum(r.pct, 2) + '%'; } }
    ], rows, { pageSize: 20, exportName: 'sunburst_detail' });
  }
})(window);
