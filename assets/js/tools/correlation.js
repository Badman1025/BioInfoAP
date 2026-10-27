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
      'If your data contains a grouping column (e.g. Group), remove it and retry.',

    /* 置信区间 / 预测区间 */
    '显示 95% 置信带（回归均值）': 'Show 95% confidence band (mean response)',
    '显示 95% 预测带（单个新观测）': 'Show 95% prediction band (single new observation)',
    '95% 置信带': '95% confidence band',
    '95% 预测带': '95% prediction band',
    '回归线': 'Regression line',
    ['灰色阴影为<b>回归均值的 95% 置信带</b>（真值回归线落在该带内的概率为 95%），浅色阴影为<b>单个新观测的 95% 预测带</b>' +
      '（未来一次观测落在该带内的概率为 95%，因此比置信带宽得多）。两者都由 OLS 标准误经 t(df = n − 2) 分位数给出。']:
      'The grey band is the <b>95% confidence band for the mean response</b> (95% probability that the true regression line lies within it) and the lighter band is the <b>95% prediction band for a single new observation</b> ' +
      '(95% probability that a future observation falls inside it, hence much wider). Both come from the OLS standard errors with the t(df = n − 2) quantile.',
    '可拖拽平移、滚轮缩放；点击「重置视图」回到适合导出的自适应比例。':
      'Drag to pan and scroll to zoom; press “Reset view” to return to the auto-fit scale used for export.',
    '重置视图': 'Reset view',
    ['画布尺寸按节点数自适应缩放，布局后整幅图等比「贴合」到绘图区，因此节点与标签不会溢出；' +
      '标签采用四方位贪心避让，确实无法避开的节点才省略标签（此时仍可通过悬停查看）。']:
      'The canvas scales with the number of nodes and the layout is then fitted to the drawing area, so neither nodes nor labels overflow. ' +
      'Labels are placed greedily among four candidate positions around their node; only labels that cannot be placed anywhere are omitted (still available on hover).',
    '另有 {n} 个变量与任何变量的相关系数都低于阈值，未在网络中显示。':
      'Another {n} variable(s) correlate below the cutoff with every other variable and are not shown.',
    '节点 / 连线': 'Nodes / edges'
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
          if (d2 < 1e-6) {
            /* 退化情形（完全重合）用确定性的微扰，保证每次出图一致 */
            dx = Math.cos(i * 2.399963) * 0.5; dy = Math.sin(i * 2.399963) * 0.5; d2 = 1e-3;
          }
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
          { key: 'minValid', label: '每个变量最少有效样本数', type: 'number', value: 3, min: 3, max: 1000, step: 1 },
          { key: 'showCI', label: '显示 95% 置信带（回归均值）', type: 'checkbox', value: true },
          { key: 'showPI', label: '显示 95% 预测带（单个新观测）', type: 'checkbox', value: true }
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
              sampleIds: m.rowNames,
              confidence: !!ctx.values.showCI,
              prediction: !!ctx.values.showPI
            });
          }
          selA.addEventListener('change', redrawScatter);
          selB.addEventListener('change', redrawScatter);
          redrawScatter();
          WB.plot.addToolbar(scBody, { getSvg: function () { return lastScSvg; }, basename: 'correlation_scatter' });
          scBody.appendChild(el('div.preview-note', {
            text: T('灰色阴影为<b>回归均值的 95% 置信带</b>（真值回归线落在该带内的概率为 95%），浅色阴影为<b>单个新观测的 95% 预测带</b>' +
              '（未来一次观测落在该带内的概率为 95%，因此比置信带宽得多）。两者都由 OLS 标准误经 t(df = n − 2) 分位数给出。')
          }));

          /* ---- 网络 ---- */
          var netCard = WB.ui.resultCard(T('相关性网络（|r| ≥ {t}）', { t: ctx.values.netThresh }));
          res.appendChild(netCard);
          var nBody = netCard.querySelector('.card-body');
          var edges = pairs.filter(function (p) { return Math.abs(p.r) >= Number(ctx.values.netThresh); });
          if (!edges.length) {
            WB.plot.emptyState(nBody, T('corr.noThreshold'));
          } else {
            var allNodes = cols.map(function (c) { return { name: c.name, deg: 0 }; });
            var idxOf = {};
            allNodes.forEach(function (nd, i) { idxOf[nd.name] = i; });
            var eList = edges.map(function (p) {
              return { a: idxOf[p.a], b: idxOf[p.b], r: p.r, w: Math.abs(p.r) };
            });
            eList.forEach(function (e) { allNodes[e.a].deg++; allNodes[e.b].deg++; });
            /* 只保留有连线的节点，孤立节点既不提供信息也会占用版面 */
            var keep = allNodes.filter(function (nd) { return nd.deg > 0; });
            var remap = {};
            keep.forEach(function (nd, i) { remap[nd.name] = i; });
            var nodes = keep.map(function (nd) { return { name: nd.name, deg: nd.deg }; });
            var drawn = eList.map(function (e) {
              return { a: remap[allNodes[e.a].name], b: remap[allNodes[e.b].name], r: e.r, w: Math.abs(e.r) };
            });
            var netHolder = el('div.plot-holder');
            nBody.appendChild(netHolder);
            var statN = WB.ui.statBar([
              { label: T('节点 / 连线'), value: nodes.length + ' / ' + drawn.length },
              { label: T('有效变量数'), value: cols.length }
            ]);
            nBody.insertBefore(statN, netHolder);
            var netSvg = drawNetwork(netHolder, nodes, drawn);
            WB.plot.addToolbar(nBody, { getSvg: function () { return netSvg; }, basename: 'correlation_network' });
            if (nodes.length < cols.length) {
              nBody.appendChild(el('div.preview-note', {
                text: T('另有 {n} 个变量与任何变量的相关系数都低于阈值，未在网络中显示。', { n: cols.length - nodes.length })
              }));
            }
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
    var W = 620, H = 460, m = { l: 66, r: 26, t: 24, b: 58 };
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var reg = WB.stats.linearRegression(xs, ys);
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
    var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
    var padx = (xmax - xmin) * 0.07 || 0.5, pady = (ymax - ymin) * 0.07 || 0.5;
    xmin -= padx; xmax += padx; ymin -= pady; ymax += pady;

    /* 统计信息框：先算内容尺寸，再从四个角落里选不压点的位置；四角都有点则整体抬到绘图区上方 */
    var slope = reg ? reg.slope : 0, inter = reg ? reg.intercept : NaN;
    if (!isFinite(inter)) inter = WB.stats.mean(ys);
    var showCI = !!cfg.confidence, showPI = !!cfg.prediction;
    var boxLines = [
      methodSymbol(cfg.method) + ' r = ' + WB.formatNum(cfg.r, 3),
      T('corr.pn', { p: WB.pFormat(cfg.p), n: pts.length }),
      'y = ' + WB.formatNum(slope, 3) + 'x + ' + WB.formatNum(inter, 3)
    ];
    if (reg) boxLines.push('R² = ' + WB.formatNum(reg.r2, 4));
    if (showCI) boxLines.push(T('95% 置信带'));
    if (showPI) boxLines.push(T('95% 预测带'));
    var boxW = 186, boxH = 18 + boxLines.length * 16, boxPad = 10;
    var hitsBox = function (x0, y0) {
      var k = 0;
      pts.forEach(function (p) {
        var px = m.l + (p.x - xmin) / ((xmax - xmin) || 1) * (W - m.l - m.r);
        var py = (H - m.b) - (p.y - ymin) / ((ymax - ymin) || 1) * (H - m.b - m.t);
        if (px > x0 - boxPad && px < x0 + boxW + boxPad && py > y0 - boxPad && py < y0 + boxH + boxPad) k++;
      });
      return k;
    };
    var cands = [
      [W - m.r - boxW - 6, m.t + 8],
      [m.l + 6, m.t + 8],
      [W - m.r - boxW - 6, H - m.b - boxH - 8],
      [m.l + 6, H - m.b - boxH - 8]
    ];
    var best = 0;
    for (var bi = 1; bi < cands.length; bi++) {
      if (hitsBox(cands[bi][0], cands[bi][1]) < hitsBox(cands[best][0], cands[best][1])) best = bi;
    }
    var boxX, boxY;
    if (hitsBox(cands[best][0], cands[best][1]) === 0) {
      boxX = cands[best][0]; boxY = cands[best][1];
    } else {
      /* 四角都有点：信息框放到绘图区上方（画布同步加高），任何点都不会被盖住 */
      var extraT = boxH + 16;
      m.t += extraT; H += extraT;
      boxX = W - m.r - boxW - 6; boxY = 8;
    }

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    /* 绘图区裁剪：置信带 / 预测带与回归线超出坐标范围的部分被切除，不再溢出方框 */
    var clipId = 'corrPlotClip' + (WB._clipSeq = (WB._clipSeq || 0) + 1);
    var defs = S('defs', {});
    var clip = S('clipPath', { id: clipId });
    clip.appendChild(S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }));
    defs.appendChild(clip);
    root.appendChild(defs);
    var sx = WB.plot.linearScale(xmin, xmax, m.l, W - m.r);
    var sy = WB.plot.linearScale(ymin, ymax, H - m.b, m.t);
    var X = function (v) { return sx(v); }, Y = function (v) { return sy(v); };

    sx.ticks(6).forEach(function (t) {
      if (t < xmin || t > xmax) return;
      root.appendChild(S('line', { x1: X(t), y1: m.t, x2: X(t), y2: H - m.b, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(X(t), H - m.b + 18, WB.formatNum(t, 3), { 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    sy.ticks(6).forEach(function (t) {
      if (t < ymin || t > ymax) return;
      root.appendChild(S('line', { x1: m.l, y1: Y(t), x2: W - m.r, y2: Y(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 7, Y(t) + 4, WB.formatNum(t, 3), { 'text-anchor': 'end', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    root.appendChild(S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: WB.plot.AXIS }));

    // 回归线与置信带 / 预测带（OLS + t 分布，df = n − 2）
    var lx1 = xmin, lx2 = xmax;
    var tCrit = 0;
    if (showCI || showPI) {
      tCrit = reg ? WB.stats.invTDist(reg.df, 0.05) : 0;
    }
    function bandPoints(seFn) {
      var up = [], lo = [], N = 140;
      for (var k = 0; k <= N; k++) {
        var xv = lx1 + (lx2 - lx1) * k / N;
        var yv = inter + slope * xv;
        var hw = tCrit * seFn(xv);
        up.push(X(xv).toFixed(1) + ',' + Y(yv + hw).toFixed(1));
        lo.push(X(xv).toFixed(1) + ',' + Y(yv - hw).toFixed(1));
      }
      return up.concat(lo.reverse()).join(' ');
    }
    if (showPI && reg && isFinite(reg.mse)) {
      root.appendChild(S('polygon', {
        points: bandPoints(reg.sePred), fill: '#2f6fb3', 'fill-opacity': 0.10, stroke: 'none',
        'clip-path': 'url(#' + clipId + ')'
      }));
    }
    if (showCI && reg && isFinite(reg.mse)) {
      root.appendChild(S('polygon', {
        points: bandPoints(reg.seFit), fill: '#5a6a76', 'fill-opacity': 0.20, stroke: 'none',
        'clip-path': 'url(#' + clipId + ')'
      }));
    }
    root.appendChild(S('line', {
      x1: X(lx1), y1: Y(inter + slope * lx1), x2: X(lx2), y2: Y(inter + slope * lx2),
      stroke: '#d6483f', 'stroke-width': 1.9,
      'clip-path': 'url(#' + clipId + ')'
    }));

    pts.forEach(function (p) {
      var c = S('circle', { cx: X(p.x), cy: Y(p.y), r: 4, fill: '#2f6fb3', 'fill-opacity': 0.55, stroke: '#2f6fb3', 'stroke-width': 1 });
      root.appendChild(c);
      WB.plot.bindTip(c, function () {
        return (p.id ? '<b>' + p.id + '</b><br>' : '') + cfg.xName + ' = ' + WB.formatNum(p.x, 4) +
          '<br>' + cfg.yName + ' = ' + WB.formatNum(p.y, 4);
      });
    });

    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 12, cfg.xName, { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, cfg.yName, { 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 18);
    root.appendChild(yl);

    /* boxLines / boxW / boxH / boxX / boxY 已在前面按避点策略计算并选定 */
    root.appendChild(S('rect', {
      x: boxX, y: boxY, width: boxW, height: boxH, rx: 7,
      fill: '#ffffff', stroke: WB.plot.AXIS, 'fill-opacity': 0.94
    }));
    boxLines.forEach(function (ln, i) {
      var swatch = null;
      if (ln === T('95% 置信带') || ln === T('95% 预测带')) {
        swatch = { fill: ln === T('95% 置信带') ? '#5a6a76' : '#2f6fb3', op: ln === T('95% 置信带') ? 0.28 : 0.14 };
      }
      var ty = boxY + 20 + i * 16;
      if (swatch) {
        root.appendChild(S('rect', { x: boxX + 6, y: ty - 8, width: 14, height: 10, rx: 2, fill: swatch.fill, 'fill-opacity': swatch.op, stroke: 'none' }));
      }
      root.appendChild(WB.plot.txt(boxX + (swatch ? 24 : 6), ty, ln, {
        'font-size': (i === 0 ? 12.5 : 11), 'font-weight': (i === 0 ? 700 : 400),
        fill: (i === 0 ? '#22303c' : WB.plot.MUTED)
      }));
    });
    return canvas.svg;
  }

  /**
   * 连通分量划分（edges 的 a/b 为节点下标）
   * @returns {number[][]} 每个分量的节点下标列表
   */
  function components(nodes, edges) {
    var parent = nodes.map(function (_, i) { return i; });
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    edges.forEach(function (e) {
      var ra = find(e.a), rb = find(e.b);
      if (ra !== rb) parent[ra] = rb;
    });
    var map = {};
    nodes.forEach(function (_, i) {
      var r = find(i);
      if (!map[r]) map[r] = [];
      map[r].push(i);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  /**
   * 整图布局：
   * ① 每个连通分量在自己的局部框里做力导向布局（互不干扰，避免大段空白）
   * ② 分量按面积降序做货架式排布，铺满画布
   * ③ 全局碰撞松弛：按节点半径把重叠的圆推开
   */
  function layoutGraph(nodes, edges, W, H) {
    var comps = components(nodes, edges);
    var total = nodes.length;
    comps.sort(function (a, b) { return b.length - a.length; });

    var gap = Math.max(28, Math.min(W, H) * 0.06);
    var cursorX = 0, cursorY = 0, rowH = 0;
    comps.forEach(function (comp) {
      var frac = Math.sqrt(comp.length / total);
      var bw = Math.max(80, (W - gap) * frac);
      var bh = Math.max(80, (H - gap) * frac);
      if (cursorX > 0 && cursorX + bw > W) { cursorX = 0; cursorY += rowH + gap; rowH = 0; }
      /* 局部布局 */
      var localIdx = {};
      var subNodes = comp.map(function (gi, li) { localIdx[gi] = li; return nodes[gi]; });
      var subEdges = [];
      edges.forEach(function (e) {
        if (localIdx[e.a] !== undefined && localIdx[e.b] !== undefined) {
          subEdges.push({ a: localIdx[e.a], b: localIdx[e.b], w: e.w, r: e.r });
        }
      });
      forceLayout(subNodes, subEdges, bw, bh, 420);
      subNodes.forEach(function (nd) { nd.x += cursorX; nd.y += cursorY; });
      cursorX += bw + gap;
      rowH = Math.max(rowH, bh);
    });

    /* 碰撞松弛：把重叠的圆（含 15% 标签余量）沿连线推开 */
    for (var it = 0; it < 80; it++) {
      var moved = false;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var minD = (a.rad + b.rad) * 1.15 + 2;
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1e-3;
          if (d < minD) {
            var push = (minD - d) / 2;
            var ux = dx / d, uy = dy / d;
            a.x -= ux * push; a.y -= uy * push;
            b.x += ux * push; b.y += uy * push;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    /* 收回到画布内 */
    nodes.forEach(function (nd) {
      nd.x = WB.clamp(nd.x, nd.rad + 4, W - nd.rad - 4);
      nd.y = WB.clamp(nd.y, nd.rad + 4, H - nd.rad - 4);
    });
  }

  /**
   * 相关性网络
   * · 画布尺寸按节点数自适应，布局后再等比贴合到绘图区 ⇒ 节点与标签不会溢出
   * · 连通分量分别布局并排布，避免不连通子图之间的大段空白
   * · 标签四方位贪心避让；确实放不下的省略（悬停仍可查看）
   * · 支持鼠标拖拽平移与滚轮缩放；「重置视图」回到适合导出的自适应比例
   */
  function drawNetwork(container, nodes, edges) {
    var n = nodes.length;
    if (!n) { WB.plot.emptyState(container, T('corr.noThreshold')); return null; }

    /* 1) 画布：面积随节点数增长，并限制在合理范围内 */
    var area = Math.max(660 * 480, n * n * 2600 + n * 5200);
    var aspect = 1.5;
    var H = Math.round(WB.clamp(Math.sqrt(area / aspect), 420, 1180));
    var W = Math.round(WB.clamp(H * aspect, 660, 1560));
    var m = { l: 40, r: 40, t: 34, b: 34 };

    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var scene = WB.plot.g({});
    root.appendChild(scene);

    /* 2) 布局（在贴合前的坐标系里进行） */
    var rMax = Math.max.apply(null, nodes.map(function (nd) { return nd.deg; })) || 1;
    var baseR = WB.clamp(560 / Math.sqrt(n + 8), 7, 17);
    nodes.forEach(function (nd) { nd.rad = baseR + baseR * 1.25 * Math.sqrt(nd.deg / rMax); });
    layoutGraph(nodes, edges, W - m.l - m.r, H - m.t - m.b);

    /* 3) 把整幅图等比贴合到绘图区（含标签预留区域） */
    var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    nodes.forEach(function (nd) {
      bx0 = Math.min(bx0, nd.x - nd.rad); bx1 = Math.max(bx1, nd.x + nd.rad);
      by0 = Math.min(by0, nd.y - nd.rad); by1 = Math.max(by1, nd.y + nd.rad);
    });
    var gw = Math.max(1, bx1 - bx0), gh = Math.max(1, by1 - by0);
    /* 水平方向额外预留标签宽度（约 8 个字符），垂直方向预留两行标签 */
    var labPadX = Math.min(120, 8 * 6.4), labPadY = 22;
    var availW = W - m.l - m.r - labPadX * 2, availH = H - m.t - m.b - labPadY * 2;
    var sc = Math.min(availW / gw, availH / gh);
    sc = WB.clamp(sc, 0.15, 3.2);
    var tx = m.l + labPadX + (availW - gw * sc) / 2 - bx0 * sc;
    var ty = m.t + labPadY + (availH - gh * sc) / 2 - by0 * sc;
    function px(x) { return x * sc + tx; }
    function py(y) { return y * sc + ty; }

    var f = WB.plot.ramp('redblue');
    var edgeGroup = WB.plot.g({});
    var nodeGroup = WB.plot.g({});
    scene.appendChild(edgeGroup);
    scene.appendChild(nodeGroup);

    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var ln = S('line', {
        x1: px(a.x), y1: py(a.y), x2: px(b.x), y2: py(b.y),
        stroke: f((e.r + 1) / 2), 'stroke-width': (1 + Math.abs(e.r) * 4.2) * Math.max(0.7, Math.sqrt(sc)),
        'stroke-opacity': 0.62, 'stroke-linecap': 'round'
      });
      edgeGroup.appendChild(ln);
      WB.plot.bindTip(ln, function () {
        return '<b>' + WB.esc(a.name) + ' × ' + WB.esc(b.name) + '</b><br>r = ' + WB.formatNum(e.r, 3) +
          '<br>' + strengthText(e.r);
      });
    });

    nodes.forEach(function (nd) {
      var cx = px(nd.x), cy = py(nd.y), rad = nd.rad * sc;
      var dd = Math.max(2.4, rad);
      var circle = S('circle', {
        cx: cx, cy: cy, r: dd,
        fill: '#2f6fb3', 'fill-opacity': Math.max(0.10, 0.16 * Math.min(1, sc)),
        stroke: '#2f6fb3', 'stroke-width': Math.max(1, 1.6 * Math.min(1.4, sc))
      });
      nodeGroup.appendChild(circle);
      nd._cx = cx; nd._cy = cy; nd._r = dd;
      WB.plot.bindTip(circle, function () {
        return '<b>' + WB.esc(nd.name) + '</b><br>' + T('common.members') + ' ' + nd.deg;
      });
    });

    /* 4) 标签避让：按度降序优先安放，四方位候选 */
    function textWidth(s, fs) {
      var w = 0;
      for (var i = 0; i < s.length; i++) w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(s[i]) ? fs : fs * 0.56;
      return w;
    }
    var fs = WB.clamp(11 * sc, 9.5, 13);
    var placed = [];
    function overlaps(x0, y0, x1, y1) {
      for (var i = 0; i < placed.length; i++) {
        var p = placed[i];
        if (x0 < p.x1 && x1 > p.x0 && y0 < p.y1 && y1 > p.y0) return true;
      }
      return false;
    }
    var labelGroup = WB.plot.g({});
    scene.appendChild(labelGroup);
    var hiddenLabels = 0;
    nodes.slice().sort(function (a, b) { return b.deg - a.deg; }).forEach(function (nd) {
      var raw = String(nd.name);
      var names = [
        raw.length > 14 ? raw.slice(0, 13) + '…' : raw,
        raw.length > 9 ? raw.slice(0, 8) + '…' : raw
      ];
      var done = false;
      for (var ti = 0; ti < names.length && !done; ti++) {
        var s = names[ti];
        var w = textWidth(s, fs), h = fs * 1.15;
        var cands = [
          { ax: 'middle', dx: 0, dy: -(nd._r + 4 + h) },
          { ax: 'middle', dx: 0, dy: (nd._r + 4 + h * 0.35) },
          { ax: 'start', dx: nd._r + 5, dy: h * 0.35 },
          { ax: 'end', dx: -(nd._r + 5), dy: h * 0.35 }
        ];
        for (var ci = 0; ci < cands.length; ci++) {
          var c = cands[ci];
          var x = nd._cx + c.dx, y = nd._cy + c.dy;
          var x0 = c.ax === 'middle' ? x - w / 2 : (c.ax === 'start' ? x : x - w);
          var x1 = x0 + w, y0 = y - h * 0.85, y1 = y + h * 0.25;
          if (x0 < 2 || x1 > W - 2 || y0 < 2 || y1 > H - 2) continue;
          if (overlaps(x0 - 1, y0 - 1, x1 + 1, y1 + 1)) continue;
          var lab = WB.plot.txt(x, y, s, {
            'text-anchor': c.ax, 'font-size': fs, 'font-weight': 600, fill: WB.plot.TEXT
          });
          lab.setAttribute('paint-order', 'stroke');
          lab.setAttribute('stroke', '#ffffff');
          lab.setAttribute('stroke-width', '3');
          labelGroup.appendChild(lab);
          placed.push({ x0: x0, y0: y0, x1: x1, y1: y1 });
          done = true;
          break;
        }
      }
      if (!done) hiddenLabels++;
    });

    /* 5) 图例画在图内右下角，导出时不丢失 */
    var lgItems = [{ color: '#c0392b', label: T('common.positive') }, { color: '#2f6fb3', label: T('common.negative') }];
    var lgW = 0;
    lgItems.forEach(function (it) { lgW = Math.max(lgW, textWidth(it.label, 10.5)); });
    lgW += 30;
    var lgH = lgItems.length * 16 + 10;
    var lgX = W - m.r - lgW - 4, lgY = H - m.b - lgH - 4;
    var lg = WB.plot.g({});
    root.appendChild(lg);
    lg.appendChild(S('rect', { x: lgX, y: lgY, width: lgW, height: lgH, rx: 6, fill: '#ffffff', 'fill-opacity': 0.9, stroke: WB.plot.AXIS }));
    lgItems.forEach(function (it, i) {
      var y = lgY + 14 + i * 16;
      lg.appendChild(S('line', { x1: lgX + 8, y1: y, x2: lgX + 24, y2: y, stroke: it.color, 'stroke-width': 2.6, 'stroke-linecap': 'round' }));
      lg.appendChild(WB.plot.txt(lgX + 28, y + 3.6, it.label, { 'font-size': 10.5, fill: WB.plot.TEXT }));
    });

    /* 6) 交互：拖拽平移 + 滚轮缩放（「重置视图」回到贴合比例） */
    var view = { k: 1, x: 0, y: 0 };
    function applyView() {
      scene.setAttribute('transform', 'translate(' + view.x.toFixed(2) + ',' + view.y.toFixed(2) + ') scale(' + view.k.toFixed(4) + ')');
    }
    function resetView() { view = { k: 1, x: 0, y: 0 }; applyView(); }
    applyView();
    var dragging = null;
    canvas.svg.addEventListener('mousedown', function (e) {
      dragging = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
      e.preventDefault();
    });
    window.addEventListener('mouseup', function () { dragging = null; });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var r = canvas.svg.getBoundingClientRect();
      var k2 = canvas.svg.viewBox.baseVal.width / r.width || 1;
      view.x = dragging.ox + (e.clientX - dragging.sx) * k2;
      view.y = dragging.oy + (e.clientY - dragging.sy) * k2;
      applyView();
    });
    canvas.svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = canvas.svg.getBoundingClientRect();
      var k2 = canvas.svg.viewBox.baseVal.width / r.width || 1;
      var mx = (e.clientX - r.left) * k2, my = (e.clientY - r.top) * k2;
      var factor = e.deltaY > 0 ? 0.9 : 1.1;
      var nk = WB.clamp(view.k * factor, 0.25, 12);
      view.x = mx - (mx - view.x) * (nk / view.k);
      view.y = my - (my - view.y) * (nk / view.k);
      view.k = nk;
      applyView();
    }, { passive: false });

    var bar = el('div.format-actions', [
      el('button.btn.btn-ghost.btn-xs', { text: T('重置视图'), onclick: resetView })
    ]);
    container.appendChild(bar);
    container.appendChild(el('div.preview-note', { text: T('corr.netNote') }));
    container.appendChild(el('div.preview-note', {
      text: T('画布尺寸按节点数自适应缩放，布局后整幅图等比「贴合」到绘图区，因此节点与标签不会溢出；' +
        '标签采用四方位贪心避让，确实无法避开的节点才省略标签（此时仍可通过悬停查看）。') +
        (hiddenLabels ? '（' + hiddenLabels + ' / ' + n + '）' : '') +
        ' ' + T('可拖拽平移、滚轮缩放；点击「重置视图」回到适合导出的自适应比例。')
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
