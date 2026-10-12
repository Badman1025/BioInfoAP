/* =============================================================================
 * tools/volcano.js  —  火山图（差异表达可视化）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '基因 + log2FC + P 值': 'Gene + log2FC + P value',
    '基因 + log2FC + P（两列格式亦可）': 'Gene + log2FC + P (two columns also fine)',
    ['<b>至少三列：基因名、log2FC（差异倍数对数）、P 值</b>。列名会自动识别：' +
      '<code>gene/symbol/id</code>、<code>log2FoldChange/log2FC/foldchange</code>、' +
      '<code>pvalue/p.val</code> 或 <code>padj/FDR/qvalue</code>。含 <code>padj</code> 时优先用校正后 P 值。']:
      '<b>At least three columns: gene name, log2FC (log fold change), P value.</b> Column names are auto-detected: ' +
      '<code>gene/symbol/id</code>, <code>log2FoldChange/log2FC/foldchange</code>, ' +
      '<code>pvalue/p.val</code> or <code>padj/FDR/qvalue</code>. If <code>padj</code> is present, the adjusted P value is preferred.',
    '只有基因名、log2FC、P 值三列时同样可用；若第一列不是基因名，工具会按行号自动编号。':
      'Works with just gene name, log2FC and P value; if the first column is not a gene name, rows are numbered automatically.',
    '火山图 / Volcano': 'Volcano plot',
    '差异表达基因分布：log2FC 对 −log₁₀ P，自动标注显著上调/下调基因，可导出显著基因列表。':
      'Differential expression landscape: log2FC vs −log₁₀ P, with automatic labelling of significant up/down genes and export of the significant gene list.',
    '差异表达': 'Differential expression',
    '阈值标注': 'Threshold labels',
    '导出基因': 'Export genes',
    '火山图 / Volcano plot': 'Volcano plot',
    '横轴为 log₂ 差异倍数，纵轴为 −log₁₀ P 值；可自定义阈值并标注 Top 基因。':
      'X axis is log₂ fold change, Y axis is −log₁₀ P; you can set custom thresholds and label the top genes.',
    '输入差异分析结果': 'Input differential results',
    '绘图参数': 'Plot parameters',
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
      'Large dataset ({n} genes): for rendering performance, 1 in every {stride} points is drawn; SVG export and the table are unaffected (the table contains all rows). Adjust “Max plotted points”.'
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
    }
  ];

  WB.register({
    id: 'volcano',
    name: '火山图 / Volcano',
    icon: '▲',
    color: '#d6483f',
    desc: '差异表达基因分布：log2FC 对 −log₁₀ P，自动标注显著上调/下调基因，可导出显著基因列表。',
    tags: ['差异表达', '阈值标注', '导出基因'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('火山图 / Volcano plot') }),
        el('p', { text: T('横轴为 log₂ 差异倍数，纵轴为 −log₁₀ P 值；可自定义阈值并标注 Top 基因。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入差异分析结果',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.volcanoText,
        placeholder: 'gene\tlog2FoldChange\tpvalue\nTP53\t2.3410\t0.00012\n...',
        paramsTitle: '绘图参数',
        params: [
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
          { key: 'xCap', label: 'X 轴截断 |log₂FC| ≤', type: 'number', value: 8, min: 1, max: 30, step: 1 },
          { key: 'maxPoints', label: '最多绘制点数', type: 'number', value: 30000, min: 100, max: 200000, step: 100 },
          { key: 'showLegend', label: '显示图例', type: 'checkbox', value: true }
        ],
        runLabel: '绘制火山图',
        onRun: function (ctx) {
          var res = WB.$('#volcano-result');
          WB.clear(res);
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
            {
              label: T('P 值列'),
              value: usePadj ? 'padj' : 'P'
            }
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
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'volcano-result';
      main.appendChild(wrap);
      if (!WB._volDemoLoaded) { WB._volDemoLoaded = true; panel.setText(WB.demo.volcanoText); }
    }
  });

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawVolcano(container, rows, cfg) {
    if (!rows.length) { WB.plot.emptyState(container, T('common.noData')); return null; }
    var W = 660, H = 500, m = { l: 66, r: 26, t: 26, b: 62 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    // 纵轴上限（按分位数截断，防止个别极小 P 值压扁图形）
    var negLogs = rows.map(function (r) { return -Math.log10(Math.max(r.p, 1e-300)); });
    negLogs.sort(function (a, b) { return a - b; });
    var q = negLogs[Math.floor(negLogs.length * 0.995)];
    var yMax = Math.max(Math.min(q, 60), -Math.log10(cfg.pCut) * 1.6, 4);
    var xCap = cfg.xCap;

    var sx = WB.plot.linearScale(-xCap, xCap, m.l, W - m.r);
    var sy = WB.plot.linearScale(0, yMax, H - m.b, m.t);

    // 网格与坐标轴
    sx.ticks(8).forEach(function (t) {
      if (t < -xCap || t > xCap) return;
      root.appendChild(S('line', { x1: sx(t), y1: m.t, x2: sx(t), y2: H - m.b, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(sx(t), H - m.b + 17, WB.formatNum(t, 2),
        { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    sy.ticks(6).forEach(function (t) {
      if (t < 0 || t > yMax) return;
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, WB.formatNum(t, 1),
        { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    // 阈值线
    [cfg.fcCut, -cfg.fcCut].forEach(function (fc) {
      if (Math.abs(fc) <= xCap) {
        root.appendChild(S('line', {
          x1: sx(fc), y1: m.t, x2: sx(fc), y2: H - m.b,
          stroke: '#b6c2cc', 'stroke-dasharray': '5 4'
        }));
      }
    });
    var yCut = -Math.log10(cfg.pCut);
    var yCutClamped = Math.min(yCut, yMax);
    root.appendChild(S('line', {
      x1: m.l, y1: sy(yCutClamped), x2: W - m.r, y2: sy(yCutClamped),
      stroke: '#b6c2cc', 'stroke-dasharray': '5 4'
    }));
    root.appendChild(WB.plot.txt(W - m.r - 4, sy(yCutClamped) - 5,
      T('volcano.threshold', { v: (cfg.pCut < 0.001 ? cfg.pCut.toExponential(0) : cfg.pCut) }),
      { 'text-anchor': 'end', 'font-size': 10, fill: WB.plot.MUTED }));

    var COLOR = { up: '#d6483f', down: '#2f6fb3', ns: '#c3ccd5' };
    var pts = [];
    var stride = Math.max(1, Math.ceil(rows.length / cfg.maxPoints));
    for (var i = 0; i < rows.length; i += stride) {
      var r = rows[i];
      var xv = WB.clamp(r.log2FC, -xCap, xCap);
      var yv = Math.min(-Math.log10(Math.max(r.p, 1e-300)), yMax);
      var cat = r.up ? 'up' : (r.down ? 'down' : 'ns');
      pts.push({ x: sx(xv), y: sy(yv), r: r, cat: cat });
    }

    // 用 path 批量绘制（性能远优于成千上万个 circle）
    ['ns', 'down', 'up'].forEach(function (cat) {
      var rad = cat === 'ns' ? cfg.dotSize * 0.72 : cfg.dotSize;
      var d = '';
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        if (p.cat !== cat) continue;
        d += 'M' + p.x.toFixed(1) + ',' + p.y.toFixed(1) +
          'm' + (-rad).toFixed(1) + ',0a' + rad + ',' + rad + ' 0 1,0 ' + (rad * 2) + ',0a' + rad + ',' + rad + ' 0 1,0 ' + (-rad * 2) + ',0z';
      }
      if (d) {
        root.appendChild(S('path', {
          d: d, fill: COLOR[cat], 'fill-opacity': cat === 'ns' ? 0.55 : 0.8, stroke: 'none'
        }));
      }
    });

    root.appendChild(S('rect', {
      x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b,
      fill: 'none', stroke: WB.plot.AXIS
    }));

    /* 悬停提示（单点最近邻） */
    var flat = new Float32Array(pts.length * 2);
    pts.forEach(function (p, i) { flat[i * 2] = p.x; flat[i * 2 + 1] = p.y; });
    var hover = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
    root.appendChild(hover);
    hover.addEventListener('mousemove', function (e) {
      var rect = canvas.svg.getBoundingClientRect();
      var scaleX = W / rect.width, scaleY = H / rect.height;
      var mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
      var best = -1, bd = 1e9;
      for (var k = 0; k < pts.length; k++) {
        var dx = flat[k * 2] - mx, dy = flat[k * 2 + 1] - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = k; }
      }
      if (best < 0 || bd > 900) { WB.plot.tipHide(); return; }
      var pr = pts[best].r;
      WB.plot.tipShow('<b>' + pr.gene + '</b><br>log₂FC = ' + WB.formatNum(pr.log2FC, 3) +
        '<br>' + (pr.p < 0.001 ? 'P = ' + pr.p.toExponential(3) : 'P = ' + WB.formatNum(pr.p, 4)) +
        '<br>' + WB.lab('volcano.type', pr.category), e);
    });
    hover.addEventListener('mouseleave', function () { WB.plot.tipHide(); });

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
        if (placed.some(function (p) { return Math.abs(p.x - x) < 26 && Math.abs(p.y - y) < 11; })) return;
        placed.push({ x: x, y: y });
        var anchor = x > W - m.r - 80 ? 'end' : 'start';
        var tx = anchor === 'end' ? x - 7 : x + 7;
        y = Math.max(y, m.t + 14);
        var t = WB.plot.txt(tx, y - 6, r.gene, {
          'text-anchor': anchor, 'font-size': 10.5, 'font-weight': 600,
          fill: r.up ? '#a8332b' : (r.down ? '#245a93' : WB.plot.TEXT)
        });
        t.setAttribute('paint-order', 'stroke');
        t.setAttribute('stroke', '#ffffff');
        t.setAttribute('stroke-width', '3');
        root.appendChild(t);
        root.appendChild(S('line', {
          x1: x, y1: y - 3, x2: tx + (anchor === 'end' ? 2 : -2), y2: y - 5,
          stroke: '#c9d5df', 'stroke-width': 0.8
        }));
      });
    }

    // 轴标题
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 22, T('volcano.xAxis'),
      { 'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, T('volcano.yAxis'),
      { 'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);

    if (cfg.showLegend) {
      var counts = { up: 0, down: 0, ns: 0 };
      rows.forEach(function (r) { counts[r.up ? 'up' : (r.down ? 'down' : 'ns')]++; });
      WB.plot.legendCategorical(container, [
        { color: COLOR.up, label: T('volcano.up') + ' (' + counts.up + ')' },
        { color: COLOR.down, label: T('volcano.down') + ' (' + counts.down + ')' },
        { color: COLOR.ns, label: T('volcano.ns') + ' (' + counts.ns + ')' }
      ]);
    }
    if (stride > 1) {
      container.appendChild(el('div.preview-note', {
        text: T('数据量较大（{n} 个基因），为提升渲染性能，图中按每 {stride} 个点抽样 1 个绘制；' +
          '导出 SVG 与表格不受影响（表格为全部数据）。可调整「最多绘制点数」。',
          { n: rows.length, stride: stride })
      }));
    }
    return canvas.svg;
  }
})(window);
