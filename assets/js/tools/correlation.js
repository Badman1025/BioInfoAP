/* =============================================================================
 * tools/correlation.js  —  相关性分析（Pearson / Spearman / Kendall）
 * 输出：相关性热图（可聚类）、散点回归图、相关性网络、配对结果表
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t, lb = WB.lab;   // 图表文字多语言

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块与页面标题 */
    '相关性分析': 'Correlation analysis',
    '变量两两相关：Pearson / Spearman / Kendall 系数与 P 值、FDR 校正、聚类热图、散点回归与相关网络。':
      'Pairwise correlations: Pearson / Spearman / Kendall coefficients and P values, FDR correction, clustered heatmap, scatter regression and correlation network.',
    '计算变量两两之间的相关系数、显著性 P 值与 FDR，并以热图、散点图与网络三种方式呈现。':
      'Compute pairwise correlation coefficients, significance P values and FDR, presented as a heatmap, scatter plot and network.',

    /* 输入格式 */
    '宽表（推荐）': 'Wide table (recommended)',
    ['<b>第一列是样本/观测 ID，其余每列一个数值变量</b>（基因表达量、临床指标、丰度等）。' +
      '列名会作为热图与网络中的变量名。缺失值留空或写 <code>NA</code>（按成对完整观测计算）。']:
      '<b>The first column is the sample/observation ID; each remaining column is one numeric variable</b> ' +
      '(gene expression, clinical measures, abundance, etc.). Column names become the variable names in the heatmap and network. ' +
      'Leave missing values blank or write <code>NA</code> (computed on pairwise complete observations).',
    '长表（Sample / Variable / Value）': 'Long table (Sample / Variable / Value)',
    ['三列：样本 ID、变量名、数值。工具会自动透视成宽表再计算相关系数。' +
      '适合从数据库或 tidy 格式导出的数据。']:
      'Three columns: sample ID, variable name, value. The tool pivots it into a wide table before computing correlations. ' +
      'Suitable for data exported from databases or in tidy format.',

    /* 输入面板 */
    '输入数据矩阵': 'Input data matrix',
    '分析参数': 'Analysis parameters',
    '相关系数': 'Correlation coefficient',
    'Pearson（线性相关）': 'Pearson (linear)',
    'Spearman（秩相关，对离群值稳健）': 'Spearman (rank-based, robust to outliers)',
    '数据布局': 'Data layout',
    '宽表（样本 × 变量）': 'Wide (sample × variable)',
    '长表（样本/变量/数值）': 'Long (sample/variable/value)',
    '热图聚类': 'Heatmap clustering',
    '不聚类（按输入顺序）': 'No clustering (input order)',
    '层次聚类 · UPGMA 平均连接': 'Hierarchical · UPGMA average linkage',
    '层次聚类 · 完全连接': 'Hierarchical · complete linkage',
    '层次聚类 · 单连接': 'Hierarchical · single linkage',
    '层次聚类 · Ward.D2': 'Hierarchical · Ward.D2',
    '热图标注': 'Heatmap annotation',
    '显示相关系数': 'Show coefficients',
    '显示显著性星号 (* ** ***)': 'Show significance stars (* ** ***)',
    '数值 + 星号': 'Value + stars',
    '不显示': 'Hide',
    '仅显示下三角': 'Show lower triangle only',
    '网络连线阈值 |r| ≥': 'Network edge cutoff |r| ≥',
    '每个变量最少有效样本数': 'Min valid samples per variable',
    '计算相关性': 'Compute correlations',

    /* 统计与信息提示 */
    '有效变量数': 'Valid variables',
    '样本/观测数': 'Samples/observations',
    '配对比较数': 'Pairwise comparisons',
    'FDR ≤ 0.05': 'FDR ≤ 0.05',
    ['|r| ≥ {v}']: '|r| ≥ {v}',
    '相关系数：<b>{m}</b>；显著性用 {s}；FDR 采用 Benjamini–Hochberg。缺失值按<b>成对完整观测</b>处理。用时 {t} s。':
      'Coefficient: <b>{m}</b>; significance via {s}; FDR by Benjamini–Hochberg. ' +
      'Missing values are handled as <b>pairwise complete observations</b>. Elapsed {t} s.',
    '正态近似': 'normal approximation',
    't 近似 (df = n−2)': 't-approximation (df = n−2)',
    'Pearson 积矩相关': 'Pearson product-moment',
    'Spearman 秩相关': 'Spearman rank',
    '以下列因有效数值不足被忽略（可能是分组/文本列）：<b>{list}</b>':
      'The following columns were ignored for too few valid values (possibly grouping/text columns): <b>{list}</b>',

    /* 结果卡片 */
    '相关性热图': 'Correlation heatmap',
    '色标范围固定为 −1 ~ 1，红/蓝两端代表强正/负相关。':
      'Colour scale is fixed at −1 to 1; the red/blue ends denote strong positive/negative correlation.',
    '星号含义：* P<0.05，** P<0.01，*** P<0.001。': 'Stars: * P<0.05, ** P<0.01, *** P<0.001.',
    '<br>行列顺序由层次聚类决定（距离 = 1 − r）。':
      '<br>Row/column order is determined by hierarchical clustering (distance = 1 − r).',
    '星号含义：* P < 0.05，** P < 0.01，*** P < 0.001。': 'Stars: * P < 0.05, ** P < 0.01, *** P < 0.001.',
    '散点回归图': 'Scatter regression plot',
    'X 轴': 'X axis',
    'Y 轴': 'Y axis',
    '请选择两个不同的变量': 'Please select two different variables',
    '有效配对观测不足': 'Too few valid paired observations',
    '相关性网络（|r| ≥ {t}）': 'Correlation network (|r| ≥ {t})',
    '相关性结果表（{n} 对）': 'Correlation result table ({n} pairs)',

    /* 结果表 */
    '变量 1': 'Variable 1',
    '变量 2': 'Variable 2',
    '强度': 'Strength',
    'P 值': 'P value',
    '样本数': 'n',
    '方向': 'Direction',
    '按 |r| 降序排列，标红行为 FDR ≤ 0.05 的显著相关对。':
      'Sorted by |r| descending; highlighted rows are significant pairs with FDR ≤ 0.05.',
    '参考标准（仅作提示，需结合领域判断）：|r| < 0.3 弱、0.3–0.6 中等、> 0.6 强相关。':
      'Reference (for guidance only; use domain judgement): |r| < 0.3 weak, 0.3–0.6 moderate, > 0.6 strong.',

    /* 错误提示 */
    '未解析到有效数据，请检查输入格式': 'No valid data could be parsed — please check the input format.',
    '有效变量不足 2 个（每个变量至少需要 {n} 个数值）。若数据含分组列（如 Group），请删除该列后重试。':
      'Fewer than 2 valid variables (each variable needs at least {n} numeric values). ' +
      'If your data contains a grouping column (e.g. Group), remove it and retry.'
  });

  var FORMATS = [
    {
      name: '宽表（推荐）',
      filename: 'correlation_template_wide.tsv',
      desc: '<b>第一列是样本/观测 ID，其余每列一个数值变量</b>（基因表达量、临床指标、丰度等）。' +
        '列名会作为热图与网络中的变量名。缺失值留空或写 <code>NA</code>（按成对完整观测计算）。',
      sample: 'SampleID\tCD3D\tCD8A\tPDCD1\tIFNG\tMKI67\n' +
        'S001\t8.12\t7.44\t6.03\t6.88\t5.91\n' +
        'S002\t9.03\t8.21\t6.77\t7.42\t6.35\n' +
        'S003\t7.55\t6.98\t5.41\t6.02\t5.12\n' +
        'S004\t8.87\t8.02\t6.55\t7.10\t7.44\n' +
        '...'
    },
    {
      name: '长表（Sample / Variable / Value）',
      filename: 'correlation_template_long.tsv',
      desc: '三列：样本 ID、变量名、数值。工具会自动透视成宽表再计算相关系数。' +
        '适合从数据库或 tidy 格式导出的数据。',
      sample: 'SampleID\tVariable\tValue\n' +
        'S001\tCD3D\t8.12\n' +
        'S001\tCD8A\t7.44\n' +
        'S002\tCD3D\t9.03\n' +
        'S002\tCD8A\t8.21'
    }
  ];

  /* ---------------------------- 力导向布局 ------------------------------- */

  function forceLayout(nodes, edges, W, H, iters) {
    var n = nodes.length;
    if (!n) return;
    // 确定性初始位置：圆周
    nodes.forEach(function (nd, i) {
      var a = 2 * Math.PI * i / n - Math.PI / 2;
      nd.x = W / 2 + Math.cos(a) * Math.min(W, H) * 0.34;
      nd.y = H / 2 + Math.sin(a) * Math.min(W, H) * 0.34;
    });
    if (n === 1) { nodes[0].x = W / 2; nodes[0].y = H / 2; return; }
    var k = Math.sqrt((W * H) / n) * 0.55;
    iters = iters || 300;
    for (var it = 0; it < iters; it++) {
      var temp = Math.max(0.6, 10 * (1 - it / iters));
      // 斥力
      for (var i = 0; i < n; i++) {
        var fx = 0, fy = 0;
        for (var j = 0; j < n; j++) {
          if (i === j) continue;
          var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1e-6) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = 1e-3; }
          var d = Math.sqrt(d2);
          var rep = k * k / d;
          fx += dx / d * rep; fy += dy / d * rep;
        }
        // 引力
        edges.forEach(function (e) {
          if (e.a === i || e.b === i) {
            var o = e.a === i ? e.b : e.a;
            var ddx = nodes[i].x - nodes[o].x, ddy = nodes[i].y - nodes[o].y;
            var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1e-3;
            var att = dd * dd / k * Math.abs(e.w);
            fx -= ddx / dd * att; fy -= ddy / dd * att;
          }
        });
        // 向心
        fx += (W / 2 - nodes[i].x) * 0.02;
        fy += (H / 2 - nodes[i].y) * 0.02;
        var fl = Math.sqrt(fx * fx + fy * fy) || 1;
        nodes[i].x += fx / fl * Math.min(fl, temp);
        nodes[i].y += fy / fl * Math.min(fl, temp);
      }
      // 边界
      nodes.forEach(function (nd) {
        nd.x = WB.clamp(nd.x, 34, W - 34);
        nd.y = WB.clamp(nd.y, 24, H - 24);
      });
    }
  }

  /* ------------------------------ 模块 ---------------------------------- */

  WB.register({
    id: 'correlation',
    name: '相关性分析',
    icon: '⇄',
    color: '#e15759',
    desc: '变量两两相关：Pearson / Spearman / Kendall 系数与 P 值、FDR 校正、聚类热图、散点回归与相关网络。',
    tags: ['Pearson', 'Spearman', 'Kendall'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('相关性分析') }),
        el('p', { text: T('计算变量两两之间的相关系数、显著性 P 值与 FDR，并以热图、散点图与网络三种方式呈现。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入数据矩阵',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.corrText,
        placeholder: 'SampleID\tGeneA\tGeneB\tGeneC\nS001\t8.12\t7.44\t6.03\n...',
        paramsTitle: '分析参数',
        params: [
          {
            key: 'method', label: '相关系数', type: 'select', value: 'pearson',
            options: [
              { value: 'pearson', label: 'Pearson（线性相关）' },
              { value: 'spearman', label: 'Spearman（秩相关，对离群值稳健）' },
              { value: 'kendall', label: 'Kendall tau-b' }
            ]
          },
          {
            key: 'layout', label: '数据布局', type: 'select', value: 'wide',
            options: [{ value: 'wide', label: '宽表（样本 × 变量）' }, { value: 'long', label: '长表（样本/变量/数值）' }]
          },
          {
            key: 'cluster', label: '热图聚类', type: 'select', value: 'average',
            options: [
              { value: 'none', label: '不聚类（按输入顺序）' },
              { value: 'average', label: '层次聚类 · UPGMA 平均连接' },
              { value: 'complete', label: '层次聚类 · 完全连接' },
              { value: 'single', label: '层次聚类 · 单连接' },
              { value: 'ward', label: '层次聚类 · Ward.D2' }
            ]
          },
          {
            key: 'annotate', label: '热图标注', type: 'select', value: 'value',
            options: [
              { value: 'value', label: '显示相关系数' },
              { value: 'star', label: '显示显著性星号 (* ** ***)' },
              { value: 'both', label: '数值 + 星号' },
              { value: 'none', label: '不显示' }
            ]
          },
          {
            key: 'ramp', label: '配色', type: 'select', value: 'redblue',
            options: Object.keys(WB.plot.RAMP_LABELS).map(function (k) {
              return { value: k, label: WB.plot.RAMP_LABELS[k] };
            })
          },
          { key: 'lower', label: '仅显示下三角', type: 'checkbox', value: false },
          { key: 'netThresh', label: '网络连线阈值 |r| ≥', type: 'number', value: 0.6, min: 0.1, max: 0.99, step: 0.05 },
          { key: 'minValid', label: '每个变量最少有效样本数', type: 'number', value: 3, min: 3, max: 1000, step: 1 }
        ],
        runLabel: '计算相关性',
        onRun: function (ctx) {
          var res = WB.$('#correlation-result');
          WB.clear(res);
          var m;
          if (ctx.values.layout === 'long') {
            m = WB.parse.pivotLong(ctx.text);
          } else {
            m = WB.parse.parseMatrix(ctx.text, {});
          }
          if (!m.matrix.length || !m.colNames.length) throw new Error(T('未解析到有效数据，请检查输入格式'));

          var minValid = Math.max(3, Number(ctx.values.minValid) || 3);
          var dropped = [];
          var cols = [];
          m.colNames.forEach(function (name, j) {
            var vals = m.matrix.map(function (r) { return r[j]; });
            var ok = vals.filter(function (v) { return isFinite(v); }).length;
            if (ok >= minValid) cols.push({ name: name, values: vals });
            else dropped.push(name + '(' + ok + ')');
          });
          if (cols.length < 2) throw new Error(T('有效变量不足 2 个（每个变量至少需要 {n} 个数值）。若数据含分组列（如 Group），请删除该列后重试。', { n: minValid }));

          var method = ctx.values.method;
          var nRows = m.matrix.length;
          var t0 = performance.now();
          var cm = WB.stats.corrMatrix(cols, method);
          var dt = performance.now() - t0;

          /* 统计 */
          var pairs = [];
          var pv = [];
          for (var i = 0; i < cols.length; i++) {
            for (var j = i + 1; j < cols.length; j++) {
              var pair = {
                a: cols[i].name, b: cols[j].name,
                r: cm.R[i][j], p: cm.P[i][j], q: cm.Q[i][j],
                n: countPairs(cols[i].values, cols[j].values)
              };
              pairs.push(pair);
            }
          }
          pairs.sort(function (a, b) { return Math.abs(b.r) - Math.abs(a.r); });
          var sigQ = pairs.filter(function (p) { return p.q <= 0.05; }).length;
          var strong = pairs.filter(function (p) { return Math.abs(p.r) >= Number(ctx.values.netThresh); }).length;

          res.appendChild(WB.ui.statBar([
            { label: T('有效变量数'), value: cols.length },
            { label: T('样本/观测数'), value: nRows },
            { label: T('配对比较数'), value: pairs.length },
            { label: T('FDR ≤ 0.05'), value: sigQ, tone: sigQ ? 'red' : '' },
            { label: T('|r| ≥ {v}', { v: ctx.values.netThresh }), value: strong, tone: 'purple' }
          ]));
          res.appendChild(WB.ui.alertBox('info',
            T('相关系数：<b>{m}</b>；显著性用 {s}；FDR 采用 Benjamini–Hochberg。缺失值按<b>成对完整观测</b>处理。用时 {t} s。',
              {
                m: methodName(method),
                s: method === 'kendall' ? T('正态近似') : T('t 近似 (df = n−2)'),
                t: (dt / 1000).toFixed(2)
              })));
          if (dropped.length) {
            res.appendChild(WB.ui.alertBox('warn',
              T('以下列因有效数值不足被忽略（可能是分组/文本列）：<b>{list}</b>', { list: dropped.join('、') })));
          }

          /* ---- 热图 ---- */
          var heatCard = WB.ui.resultCard(T('相关性热图'));
          res.appendChild(heatCard);
          var hBody = heatCard.querySelector('.card-body');
          var holder = el('div.plot-holder');
          hBody.appendChild(holder);

          var useCluster = ctx.values.cluster !== 'none';
          var rowOrder = cols.map(function (_, k) { return k; });
          var colOrder = rowOrder.slice();
          var rowTree = null, colTree = null;
          if (useCluster) {
            // 距离 = 1 - r，缺失按无相关处理
            var dist = [];
            for (var a = 0; a < cols.length; a++) {
              dist.push(new Array(cols.length).fill(0));
            }
            for (var a2 = 0; a2 < cols.length; a2++) {
              for (var b2 = a2 + 1; b2 < cols.length; b2++) {
                var r0 = cm.R[a2][b2];
                var dd = isFinite(r0) ? 1 - r0 : 1;
                dist[a2][b2] = dist[b2][a2] = Math.max(0, dd);
              }
            }
            var hc = WB.stats.hclust(dist, { metric: 'euclidean', method: ctx.values.cluster });
            rowOrder = hc.order.slice();
            colOrder = hc.order.slice();
            rowTree = hc.tree; colTree = hc.tree;
          }

          var annotateMode = ctx.values.annotate;
          var lower = !!ctx.values.lower;
          var displayMat = cm.R.map(function (row, i) {
            return row.map(function (v, j) {
              if (lower && j > i) return NaN;
              return v;
            });
          });

          var hp = WB.plot.matrixHeatmap(holder, {
            matrix: displayMat, rowNames: cols.map(function (c) { return c.name; }),
            colNames: cols.map(function (c) { return c.name; }),
            rowOrder: rowOrder, colOrder: colOrder,
            rowTree: rowTree, colTree: colTree,
            showRowDendro: useCluster, showColDendro: useCluster,
            vmin: -1, vmax: 1, ramp: ctx.values.ramp, centerValue: 0,
            skipNaN: true,
            annotate: annotateMode === 'none' ? 'none' : 'value',
            textOf: function (v, i, j) {
              var rr = cm.R[i][j];
              var star = WB.plot.sigStar(cm.P[i][j]);
              if (annotateMode === 'star') return star;
              if (annotateMode === 'both') return WB.formatNum(rr, 2) + star;
              return WB.formatNum(rr, 2);
            },
            tooltip: function (v, i, j) {
              if (i === j) return '<b>' + cols[i].name + '</b>';
              return '<b>' + cols[i].name + ' × ' + cols[j].name + '</b><br>' +
                'r = ' + WB.formatNum(cm.R[i][j], 3) +
                (cm.P[i][j] < 0.001 ? '' : '') +
                '<br>P = ' + WB.pFormat(cm.P[i][j]) +
                '<br>FDR = ' + WB.pFormat(cm.Q[i][j]) +
                '<br>n = ' + countPairs(cols[i].values, cols[j].values) +
                '<br><span style="opacity:.8">' + strengthText(cm.R[i][j]) + '</span>';
            },
            legendLabel: T('corr.coef', { m: methodSymbol(method) })
          });
          if (hp) {
            hBody.appendChild(el('div.preview-note', {
              html: T('色标范围固定为 −1 ~ 1，红/蓝两端代表强正/负相关。') +
                (annotateMode === 'both' ? T('星号含义：* P<0.05，** P<0.01，*** P<0.001。') : '') +
                (useCluster ? T('<br>行列顺序由层次聚类决定（距离 = 1 − r）。') : '')
            }));
            if (annotateMode === 'both') {
              hBody.appendChild(el('div.preview-note', {
                text: T('星号含义：* P < 0.05，** P < 0.01，*** P < 0.001。')
              }));
            }
            WB.plot.addToolbar(hBody, { getSvg: function () { return hp.svg; }, basename: 'correlation_heatmap' });
          }

          /* ---- 散点图 ---- */
          var scCard = WB.ui.resultCard(T('散点回归图'));
          res.appendChild(scCard);
          var scBody = scCard.querySelector('.card-body');
          var selRow = el('div.table-bar');
          var selA = el('select.form-control.form-control-sm'), selB = el('select.form-control.form-control-sm');
          cols.forEach(function (c) { selA.appendChild(el('option', { value: c.name, text: c.name })); });
          cols.forEach(function (c) { selB.appendChild(el('option', { value: c.name, text: c.name })); });
          selA.value = cols[0].name;
          selB.value = cols[Math.min(1, cols.length - 1)].name;
          selRow.appendChild(el('span.table-count', { text: T('X 轴') })); selRow.appendChild(selA);
          selRow.appendChild(el('span.table-count', { text: T('Y 轴') })); selRow.appendChild(selB);
          scBody.appendChild(selRow);
          var scHolder = el('div.plot-holder');
          scBody.appendChild(scHolder);
          var lastScSvg = null;
          function redrawScatter() {
            var ia = cols.map(function (c) { return c.name; }).indexOf(selA.value);
            var ib = cols.map(function (c) { return c.name; }).indexOf(selB.value);
            if (ia < 0 || ib < 0 || ia === ib) {
              WB.plot.emptyState(scHolder, T('请选择两个不同的变量'));
              return;
            }
            var r = WB.stats.CORR_METHODS[method](cols[ia].values, cols[ib].values);
            lastScSvg = drawScatter(scHolder, {
              x: cols[ia].values, y: cols[ib].values,
              xName: cols[ia].name, yName: cols[ib].name,
              r: r.r, p: r.p, method: method,
              sampleIds: m.rowNames
            });
          }
          selA.addEventListener('change', redrawScatter);
          selB.addEventListener('change', redrawScatter);
          redrawScatter();
          WB.plot.addToolbar(scBody, { getSvg: function () { return lastScSvg; }, basename: 'correlation_scatter' });

          /* ---- 网络 ---- */
          var netCard = WB.ui.resultCard(T('相关性网络（|r| ≥ {t}）', { t: ctx.values.netThresh }));
          res.appendChild(netCard);
          var nBody = netCard.querySelector('.card-body');
          var edges = pairs.filter(function (p) { return Math.abs(p.r) >= Number(ctx.values.netThresh); });
          if (!edges.length) {
            WB.plot.emptyState(nBody, T('corr.noThreshold'));
          } else {
            var nodes = cols.map(function (c) { return { name: c.name, deg: 0 }; });
            var idxOf = {};
            nodes.forEach(function (nd, i) { idxOf[nd.name] = i; });
            var eList = edges.map(function (p) {
              return { a: idxOf[p.a], b: idxOf[p.b], r: p.r, w: Math.abs(p.r) };
            });
            eList.forEach(function (e) { nodes[e.a].deg++; nodes[e.b].deg++; });
            var netHolder = el('div.plot-holder');
            nBody.appendChild(netHolder);
            var netSvg = drawNetwork(netHolder, nodes, eList);
            WB.plot.addToolbar(nBody, { getSvg: function () { return netSvg; }, basename: 'correlation_network' });
          }

          /* ---- 结果表 ---- */
          var tCard = WB.ui.resultCard(T('相关性结果表（{n} 对）', { n: pairs.length }));
          res.appendChild(tCard);
          renderPairTable(tCard.querySelector('.card-body'), pairs, method);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'correlation-result';
      main.appendChild(wrap);
      if (!WB._corrDemoLoaded) { WB._corrDemoLoaded = true; panel.setText(WB.demo.corrText); }
    }
  });

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawScatter(container, cfg) {
    var pts = [];
    for (var i = 0; i < cfg.x.length; i++) {
      if (isFinite(cfg.x[i]) && isFinite(cfg.y[i])) pts.push({ x: cfg.x[i], y: cfg.y[i], id: cfg.sampleIds ? cfg.sampleIds[i] : '' });
    }
    if (pts.length < 2) { WB.plot.emptyState(container, T('有效配对观测不足')); return null; }
    var W = 560, H = 420, m = { l: 62, r: 24, t: 22, b: 54 };
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
    var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
    var padx = (xmax - xmin) * 0.07 || 0.5, pady = (ymax - ymin) * 0.07 || 0.5;
    xmin -= padx; xmax += padx; ymin -= pady; ymax += pady;

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var sx = WB.plot.linearScale(xmin, xmax, m.l, W - m.r);
    var sy = WB.plot.linearScale(ymin, ymax, H - m.b, m.t);
    var X = function (v) { return sx(v); }, Y = function (v) { return sy(v); };

    sx.ticks(6).forEach(function (t) {
      if (t < xmin || t > xmax) return;
      root.appendChild(S('line', { x1: X(t), y1: m.t, x2: X(t), y2: H - m.b, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(X(t), H - m.b + 16, WB.formatNum(t, 3), { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    sy.ticks(6).forEach(function (t) {
      if (t < ymin || t > ymax) return;
      root.appendChild(S('line', { x1: m.l, y1: Y(t), x2: W - m.r, y2: Y(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 7, Y(t) + 3.5, WB.formatNum(t, 3), { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    root.appendChild(S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: WB.plot.AXIS }));

    // 回归线
    var xm = WB.stats.mean(xs), ym = WB.stats.mean(ys);
    var sxy = 0, sxx = 0;
    pts.forEach(function (p) { sxy += (p.x - xm) * (p.y - ym); sxx += (p.x - xm) * (p.x - xm); });
    var slope = sxx ? sxy / sxx : 0, inter = ym - slope * xm;
    var lx1 = xmin, lx2 = xmax;
    root.appendChild(S('line', {
      x1: X(lx1), y1: Y(inter + slope * lx1), x2: X(lx2), y2: Y(inter + slope * lx2),
      stroke: '#d6483f', 'stroke-width': 1.8, 'stroke-dasharray': '6 4'
    }));

    pts.forEach(function (p) {
      var c = S('circle', { cx: X(p.x), cy: Y(p.y), r: 4, fill: '#2f6fb3', 'fill-opacity': 0.55, stroke: '#2f6fb3', 'stroke-width': 1 });
      root.appendChild(c);
      WB.plot.bindTip(c, function () {
        return (p.id ? '<b>' + p.id + '</b><br>' : '') + cfg.xName + ' = ' + WB.formatNum(p.x, 4) +
          '<br>' + cfg.yName + ' = ' + WB.formatNum(p.y, 4);
      });
    });

    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 14, cfg.xName, { 'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, cfg.yName, { 'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);

    var boxW = 176, boxH = 66;
    root.appendChild(S('rect', { x: W - m.r - boxW - 6, y: m.t + 8, width: boxW, height: boxH, rx: 7, fill: '#ffffff', stroke: WB.plot.AXIS, 'fill-opacity': 0.94 }));
    root.appendChild(WB.plot.txt(W - m.r - boxW + 4, m.t + 28, methodSymbol(cfg.method) + ' r = ' + WB.formatNum(cfg.r, 3), { 'font-size': 12.5, 'font-weight': 700, fill: '#22303c' }));
    root.appendChild(WB.plot.txt(W - m.r - boxW + 4, m.t + 45, T('corr.pn', { p: WB.pFormat(cfg.p), n: pts.length }), { 'font-size': 11.5, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(W - m.r - boxW + 4, m.t + 62, 'y = ' + WB.formatNum(slope, 3) + 'x + ' + WB.formatNum(inter, 3), { 'font-size': 11, fill: WB.plot.MUTED }));
    return canvas.svg;
  }

  function drawNetwork(container, nodes, edges) {
    var W = 660, H = 480;
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    forceLayout(nodes, edges, W, H, 320);

    var rampName = 'redblue';
    var f = WB.plot.ramp(rampName);
    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var t = (e.r + 1) / 2;
      var ln = S('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: f(t), 'stroke-width': 1 + Math.abs(e.r) * 4.2,
        'stroke-opacity': 0.62, 'stroke-linecap': 'round'
      });
      root.appendChild(ln);
      WB.plot.bindTip(ln, function () {
        return '<b>' + a.name + ' × ' + b.name + '</b><br>r = ' + WB.formatNum(e.r, 3) +
          '<br>' + strengthText(e.r, true);
      });
    });
    var rMax = Math.max.apply(null, nodes.map(function (n) { return n.deg; })) || 1;
    nodes.forEach(function (nd) {
      var rad = 9 + 13 * Math.sqrt(nd.deg / rMax);
      root.appendChild(S('circle', {
        cx: nd.x, cy: nd.y, r: rad,
        fill: '#2f6fb3', 'fill-opacity': 0.16, stroke: '#2f6fb3', 'stroke-width': 1.6
      }));
      var label = WB.plot.txt(nd.x, nd.y - rad - 6, nd.name, {
        'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 600, fill: WB.plot.TEXT
      });
      label.setAttribute('paint-order', 'stroke');
      label.setAttribute('stroke', '#ffffff');
      label.setAttribute('stroke-width', '3');
      root.appendChild(label);
    });
    container.appendChild(el('div.preview-note', {
      text: T('corr.netNote')
    }));
    return canvas.svg;
  }

  function renderPairTable(container, pairs, method) {
    WB.ui.dataTable(container, [
      { key: 'a', label: T('变量 1') },
      { key: 'b', label: T('变量 2') },
      {
        key: 'r', label: methodSymbol(method) + ' r', align: 'right', width: 90,
        format: function (r) { return WB.formatNum(r.r, 4); },
        render: null
      },
      {
        key: 'absr', label: '|r|', align: 'right', width: 74,
        format: function (r) { return WB.formatNum(Math.abs(r.r), 3); }
      },
      {
        key: 'strength', label: T('强度'), width: 110,
        format: function (r) { return strengthText(r.r); }
      },
      { key: 'p', label: T('P 值'), align: 'right', width: 92, format: function (r) { return WB.pFormat(r.p); } },
      {
        key: 'q', label: 'FDR', align: 'right', width: 92, format: function (r) { return WB.pFormat(r.q); },
        className: 'fdr-cell'
      },
      { key: 'n', label: T('样本数'), align: 'right', width: 70 },
      {
        key: 'dir', label: T('方向'), width: 74,
        format: function (r) { return r.r > 0 ? T('common.positive') : T('common.negative'); }
      }
    ], pairs, {
      pageSize: 25, exportName: 'correlation_pairs',
      sortKey: 'absr', sortDir: -1,
      rowClass: function (r) { return r.q <= 0.05 ? 'row-sig' : ''; }
    });
    container.appendChild(el('div.preview-note', {
      text: T('按 |r| 降序排列，标红行为 FDR ≤ 0.05 的显著相关对。') +
        T('参考标准（仅作提示，需结合领域判断）：|r| < 0.3 弱、0.3–0.6 中等、> 0.6 强相关。')
    }));
  }

  /* ------------------------------ 工具 ---------------------------------- */

  function countPairs(a, b) {
    var n = 0;
    for (var i = 0; i < Math.min(a.length, b.length); i++) if (isFinite(a[i]) && isFinite(b[i])) n++;
    return n;
  }
  function methodName(m) {
    return { pearson: T('Pearson 积矩相关'), spearman: T('Spearman 秩相关'), kendall: 'Kendall tau-b' }[m] || m;
  }
  function methodSymbol(m) { return { pearson: 'Pearson', spearman: 'Spearman', kendall: 'Kendall' }[m] || m; }
  function strengthText(r) {
    if (!isFinite(r)) return 'NA';
    var a = Math.abs(r);
    var key = a < 0.3 ? 'weak' : (a < 0.6 ? 'moderate' : (a < 0.8 ? 'strong' : 'veryStrong'));
    return T('common.' + key + (r > 0 ? 'Positive' : 'Negative'));
  }
})(window);
