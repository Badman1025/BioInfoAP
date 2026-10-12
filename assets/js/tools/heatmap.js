/* =============================================================================
 * tools/heatmap.js  —  表达热图（Z-score + 行列层次聚类 + 树状图 + 分组注释）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '聚类热图': 'Clustered heatmap',
    '表达矩阵热图：Z-score 标准化、行列层次聚类、树状图、样本分组色条，并可导出聚类后矩阵。':
      'Expression-matrix heatmap: Z-score standardisation, hierarchical clustering of rows and columns, dendrograms and sample group colour bars, with export of the clustered matrix.',
    '层次聚类': 'Hierarchical clustering',
    '树状图': 'Dendrogram',
    '把表达矩阵画成热图，可对基因/样本做层次聚类并展示树状图，用于观察共表达模式与样本分群。':
      'Draw an expression matrix as a heatmap with optional hierarchical clustering of genes/samples and dendrograms, to reveal co-expression patterns and sample grouping.',

    /* 输入格式 */
    '基因 × 样本 矩阵': 'Gene × sample matrix',
    ['<b>第一行 = 样本名，第一列 = 基因/特征名，其余为数值</b>（表达量、丰度、Z-score 均可）。' +
      '缺失值留空或写 <code>NA</code>。行数建议 ≤ 500（聚类复杂度随行数增长）。']:
      '<b>First row = sample names, first column = gene/feature names, remaining cells = values</b> (expression, abundance or Z-score). ' +
      'Leave missing values blank or write <code>NA</code>. Keep rows ≤ 500 (clustering complexity grows with the number of rows).',
    '样本 × 基因（自动转置）': 'Sample × gene (auto-transpose)',
    ['若矩阵为「样本为行、基因为列」，本工具亦可处理：勾选下方参数中的「按行输入」，' +
      '或者直接在 Excel 中转置后再粘贴。']:
      'If your matrix has samples as rows and genes as columns, the tool handles it too: tick “Transpose (my data is samples × genes)” in the parameters below, ' +
      'or transpose it in Excel before pasting.',

    /* 输入面板与参数 */
    '输入表达矩阵': 'Input expression matrix',
    '绘图与聚类参数': 'Plot & clustering parameters',
    '绘制热图': 'Draw heatmap',
    '标准化方式': 'Standardisation',
    '按行 Z-score（推荐，比较基因相对表达模式）': 'Row-wise Z-score (recommended, relative gene patterns)',
    '按列 Z-score（比较样本间相对差异）': 'Column-wise Z-score (relative differences between samples)',
    '不标准化（直接用原值）': 'No standardisation (use raw values)',
    '转置（我的数据是样本 × 基因）': 'Transpose (my data is samples × genes)',
    '行聚类': 'Row clustering',
    '不聚类': 'No clustering',
    '平均连接 (UPGMA)': 'Average linkage (UPGMA)',
    '完全连接': 'Complete linkage',
    '单连接': 'Single linkage',
    '列聚类': 'Column clustering',
    '距离度量': 'Distance metric',
    '欧氏距离': 'Euclidean distance',
    '1 − 相关系数（基于表达模式相似度）': '1 − correlation (expression-pattern similarity)',
    '曼哈顿距离': 'Manhattan distance',
    '最大距离': 'Maximum distance',
    '余弦距离': 'Cosine distance',
    '配色': 'Colour scheme',
    '单元格标注': 'Cell annotation',
    '不标注': 'None',
    '显示数值（单元格较大时）': 'Show values (large cells)',
    '显示行名（基因）': 'Show row names (genes)',
    '显示列名（样本）': 'Show column names (samples)',

    /* 分组注释区 */
    '样本分组注释（可选，用于热图上方色条）': 'Sample group annotation (optional; colour bar above the heatmap)',
    ['每行「样本名 <TAB> 分组名」\nN1\tNormal\nN2\tNormal\nT1\tTumor\nT2\tTumor\n\n' +
      '也可以是单个表头行，按列顺序给出分组名：\nGroup\tNormal\tNormal\tNormal\tTumor\tTumor\tTumor']:
      'One “sample <TAB> group” pair per line\nN1\tNormal\nN2\tNormal\nT1\tTumor\nT2\tTumor\n\n' +
      'Or a single header row giving groups in column order:\nGroup\tNormal\tNormal\tNormal\tTumor\tTumor\tTumor',
    '填写后热图上方会出现分组色条。示例数据的分组为：N1–N6 = Normal，T1–T6 = Tumor，M1–M6 = Metastasis。':
      'Once filled in, a group colour bar appears above the heatmap. In the example data: N1–N6 = Normal, T1–T6 = Tumor, M1–M6 = Metastasis.',
    '插入示例分组': 'Insert example groups',
    '已插入示例分组信息': 'Example group information inserted',

    /* 结果 */
    '行（特征）数': 'Rows (features)',
    '列（样本）数': 'Columns (samples)',
    '数值范围': 'Value range',
    '缺失值': 'Missing values',
    '聚类耗时': 'Clustering time',
    '标准化：<b>{norm}</b>{sd}；距离：<b>{metric}</b>；行聚类 {rc}，列聚类 {cc}。':
      'Standardisation: <b>{norm}</b>{sd}; distance: <b>{metric}</b>; row clustering {rc}, column clustering {cc}.',
    '（每行均值为 0、标准差为 1）': ' (each row mean 0, SD 1)',
    '按行 Z-score': 'Row Z-score',
    '按列 Z-score': 'Column Z-score',
    '不标准化': 'No standardisation',
    '1 − 相关系数': '1 − correlation',
    '关闭': 'Off',
    '平均连接': 'Average linkage',
    '热图{tree}': 'Heatmap{tree}',
    '（含层次聚类树状图）': ' (with hierarchical clustering dendrogram)',
    '导出聚类后矩阵': 'Export clustered matrix',
    '按当前的聚类顺序导出矩阵（含标准化值）': 'Export the matrix in the current clustering order (with standardised values)',

    /* 报错 */
    '未解析到有效数据': 'No valid data parsed',
    '矩阵至少需要 2 行 2 列': 'The matrix needs at least 2 rows and 2 columns',
    '数据行数过多（{n}），聚类与渲染将显著变慢；请先筛选至 500 行左右再试。':
      'Too many rows ({n}); clustering and rendering will be considerably slower. Please filter down to about 500 rows first.'
  });

  var FORMATS = [
    {
      name: '基因 × 样本 矩阵',
      filename: 'heatmap_template.tsv',
      desc: '<b>第一行 = 样本名，第一列 = 基因/特征名，其余为数值</b>（表达量、丰度、Z-score 均可）。' +
        '缺失值留空或写 <code>NA</code>。行数建议 ≤ 500（聚类复杂度随行数增长）。',
      sample: 'Gene\tN1\tN2\tN3\tT1\tT2\tT3\n' +
        'MKI67\t7.82\t7.41\t7.66\t10.31\t10.02\t9.88\n' +
        'CCNB1\t7.55\t7.62\t7.48\t9.55\t9.71\t9.42\n' +
        'CD8A\t9.02\t8.87\t9.11\t8.02\t7.88\t8.15\n' +
        'COL1A1\t6.88\t7.02\t6.95\t8.55\t8.31\t8.44'
    },
    {
      name: '样本 × 基因（自动转置）',
      filename: 'heatmap_template_transposed.tsv',
      desc: '若矩阵为「样本为行、基因为列」，本工具亦可处理：勾选下方参数中的「按行输入」，' +
        '或者直接在 Excel 中转置后再粘贴。',
      sample: 'Sample\tMKI67\tCCNB1\tCD8A\nN1\t7.82\t7.55\t9.02\nT1\t10.31\t9.55\t8.02'
    }
  ];

  WB.register({
    id: 'heatmap',
    name: '聚类热图',
    icon: '▦',
    color: '#d98a1f',
    desc: '表达矩阵热图：Z-score 标准化、行列层次聚类、树状图、样本分组色条，并可导出聚类后矩阵。',
    tags: ['Z-score', '层次聚类', '树状图'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('聚类热图') }),
        el('p', { text: T('把表达矩阵画成热图，可对基因/样本做层次聚类并展示树状图，用于观察共表达模式与样本分群。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入表达矩阵',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.heatmapText,
        placeholder: 'Gene\tS1\tS2\tS3\nMKI67\t7.82\t7.41\t7.66\n...',
        paramsTitle: '绘图与聚类参数',
        params: [
          {
            key: 'normalize', label: '标准化方式', type: 'select', value: 'row',
            options: [
              { value: 'row', label: '按行 Z-score（推荐，比较基因相对表达模式）' },
              { value: 'col', label: '按列 Z-score（比较样本间相对差异）' },
              { value: 'none', label: '不标准化（直接用原值）' }
            ]
          },
          { key: 'transpose', label: '转置（我的数据是样本 × 基因）', type: 'checkbox', value: false },
          {
            key: 'rowCluster', label: '行聚类', type: 'select', value: 'average',
            options: [
              { value: 'none', label: '不聚类' },
              { value: 'average', label: '平均连接 (UPGMA)' },
              { value: 'complete', label: '完全连接' },
              { value: 'single', label: '单连接' },
              { value: 'ward', label: 'Ward.D2' }
            ]
          },
          {
            key: 'colCluster', label: '列聚类', type: 'select', value: 'average',
            options: [
              { value: 'none', label: '不聚类' },
              { value: 'average', label: '平均连接 (UPGMA)' },
              { value: 'complete', label: '完全连接' },
              { value: 'single', label: '单连接' },
              { value: 'ward', label: 'Ward.D2' }
            ]
          },
          {
            key: 'metric', label: '距离度量', type: 'select', value: 'euclidean',
            options: [
              { value: 'euclidean', label: '欧氏距离' },
              { value: 'correlation', label: '1 − 相关系数（基于表达模式相似度）' },
              { value: 'manhattan', label: '曼哈顿距离' },
              { value: 'maximum', label: '最大距离' },
              { value: 'cosine', label: '余弦距离' }
            ]
          },
          {
            key: 'ramp', label: '配色', type: 'select', value: 'redblue',
            options: Object.keys(WB.plot.RAMP_LABELS).map(function (k) {
              return { value: k, label: WB.plot.RAMP_LABELS[k] };
            })
          },
          {
            key: 'annotate', label: '单元格标注', type: 'select', value: 'none',
            options: [
              { value: 'none', label: '不标注' },
              { value: 'value', label: '显示数值（单元格较大时）' }
            ]
          },
          { key: 'rowLabels', label: '显示行名（基因）', type: 'checkbox', value: true },
          { key: 'colLabels', label: '显示列名（样本）', type: 'checkbox', value: true }
        ],
        extraValues: function () { return { groups: gTa ? gTa.value : '' }; },
        extraState: {
          ready: function () { return !!gTa; },
          get: function () { return gTa ? gTa.value : ''; },
          set: function (v) { if (gTa) gTa.value = v || ''; }
        },
        runLabel: '绘制热图',
        onRun: function (ctx) {
          var res = WB.$('#heatmap-result');
          WB.clear(res);
          var m = WB.parse.parseMatrix(ctx.text, {});
          if (!m.matrix.length || !m.colNames.length) throw new Error(T('未解析到有效数据'));

          var mat = m.matrix.map(function (r) { return r.slice(); });
          var rowNames = m.rowNames.slice();
          var colNames = m.colNames.slice();
          if (ctx.values.transpose) {
            var t = WB.stats.matT(mat);
            var tmp = rowNames; rowNames = colNames; colNames = tmp;
            mat = t;
          }

          var nRow = mat.length, nCol = mat[0].length;
          var missing = 0;
          mat.forEach(function (r) { r.forEach(function (v) { if (!isFinite(v)) missing++; }); });
          if (nRow < 2 || nCol < 2) throw new Error(T('矩阵至少需要 2 行 2 列'));
          if (nRow > 800) throw new Error(T('数据行数过多（{n}），聚类与渲染将显著变慢；请先筛选至 500 行左右再试。', { n: nRow }));

          // 标准化（缺失值先按行/列均值填补）
          var normLabel = { row: '按行 Z-score', col: '按列 Z-score', none: '不标准化' }[ctx.values.normalize];
          if (ctx.values.normalize === 'row') {
            mat = mat.map(function (row) {
              var ok = row.filter(isFinite), mu = WB.stats.mean(ok);
              var filled = row.map(function (v) { return isFinite(v) ? v : mu; });
              var sd = WB.stats.stdev(filled) || 1;
              return filled.map(function (v) { return (v - mu) / sd; });
            });
          } else if (ctx.values.normalize === 'col') {
            for (var j = 0; j < nCol; j++) {
              var col = mat.map(function (r) { return r[j]; }).filter(isFinite);
              var mu2 = WB.stats.mean(col), sd2 = WB.stats.stdev(col) || 1;
              for (var i = 0; i < nRow; i++) {
                var v = mat[i][j];
                mat[i][j] = isFinite(v) ? (v - mu2) / sd2 : 0;
              }
            }
          }

          /* 聚类 */
          var rowOrder = mat.map(function (_, i) { return i; });
          var colOrder = mat[0].map(function (_, j) { return j; });
          var rowTree = null, colTree = null;
          var t0 = performance.now();
          if (ctx.values.rowCluster !== 'none') {
            var hc = WB.stats.hclust(mat, { metric: ctx.values.metric, method: ctx.values.rowCluster });
            rowOrder = hc.order; rowTree = hc.tree;
          }
          if (ctx.values.colCluster !== 'none') {
            var hc2 = WB.stats.hclust(WB.stats.matT(mat), { metric: ctx.values.metric, method: ctx.values.colCluster });
            colOrder = hc2.order; colTree = hc2.tree;
          }
          var dt = performance.now() - t0;

          /* 分组注释 */
          var gspec = parseGroupSpec(ctx.values.groups || '', colNames);
          var colBar = null, groupLegend = null;
          if (gspec) {
            colBar = { colors: gspec.colors };
            groupLegend = gspec.legend;
          }

          var vmin = Infinity, vmax = -Infinity;
          mat.forEach(function (r) { r.forEach(function (v) { if (isFinite(v)) { if (v < vmin) vmin = v; if (v > vmax) vmax = v; } }); });

          res.appendChild(WB.ui.statBar([
            { label: T('行（特征）数'), value: nRow },
            { label: T('列（样本）数'), value: nCol },
            { label: T('数值范围'), value: WB.formatNum(vmin, 2) + ' ~ ' + WB.formatNum(vmax, 2) },
            { label: T('缺失值'), value: missing, tone: missing ? 'amber' : '' },
            { label: T('聚类耗时'), value: (dt / 1000).toFixed(2) + ' s' }
          ]));
          res.appendChild(WB.ui.alertBox('info',
            T('标准化：<b>{norm}</b>{sd}；距离：<b>{metric}</b>；行聚类 {rc}，列聚类 {cc}。', {
              norm: T(normLabel),
              sd: ctx.values.normalize === 'row' ? T('（每行均值为 0、标准差为 1）') : '',
              metric: T(metricName(ctx.values.metric)),
              rc: T(clusterName(ctx.values.rowCluster)),
              cc: T(clusterName(ctx.values.colCluster))
            })));

          var card = WB.ui.resultCard(T('热图{tree}', { tree: (rowTree || colTree) ? T('（含层次聚类树状图）') : '' }));
          res.appendChild(card);
          var body = card.querySelector('.card-body');
          if (groupLegend) {
            WB.plot.legendCategorical(body, groupLegend.map(function (g) {
              return { color: g.color, label: g.name + ' (' + g.n + ')' };
            }));
          }
          var holder = el('div.plot-holder');
          body.appendChild(holder);

          var cellSize = WB.clamp(Math.min(34, 900 / nCol, 640 / nRow), 8, 34);
          var hp = WB.plot.matrixHeatmap(holder, {
            matrix: mat, rowNames: rowNames, colNames: colNames,
            rowOrder: rowOrder, colOrder: colOrder,
            rowTree: rowTree, colTree: colTree,
            showRowDendro: !!rowTree, showColDendro: !!colTree,
            vmin: vmin, vmax: vmax, ramp: ctx.values.ramp,
            rowColorBar: colBar, colColorBar: colBar,
            cellW: cellSize, cellH: cellSize,
            showRowLabels: ctx.values.rowLabels !== false,
            showColLabels: ctx.values.colLabels !== false,
            annotate: ctx.values.annotate === 'value' ? 'value' : 'none',
            skipNaN: false,
            tooltip: function (v, i, j) {
              var orig = originalValue(m, ctx.values.transpose, rowNames[i], colNames[j]);
              return '<b>' + rowNames[i] + '</b> × <b>' + colNames[j] + '</b>' +
                (ctx.values.normalize !== 'none' ? '<br>' + WB.lab('heat.normValue', WB.formatNum(v, 3)) : '') +
                (orig !== null ? '<br>' + WB.lab('heat.rawValue', WB.formatNum(orig, 4)) : '');
            },
            legendLabel: normLabel.indexOf('Z-score') >= 0 ? T('heat.zscore') : T('heat.value')
          });
          if (hp) {
            WB.plot.addToolbar(body, {
              getSvg: function () { return hp.svg; }, basename: 'heatmap',
              buttons: [{
                label: '导出聚类后矩阵',
                title: '按当前的聚类顺序导出矩阵（含标准化值）',
                onClick: function () {
                  var head = ['Feature'].concat(colOrder.map(function (j) { return colNames[j]; }));
                  var rows = rowOrder.map(function (i) {
                    return [rowNames[i]].concat(colOrder.map(function (j) { return WB.formatNum(mat[i][j], 4); }));
                  });
                  WB.downloadText(WB.toTSV(head, rows), 'heatmap_clustered.tsv', 'text/tab-separated-values');
                }
              }]
            });
          }
        }
      });

      /* 分组信息附加区 */
      var groupBox = el('div.param-box');
      groupBox.appendChild(el('div.param-head', { text: T('样本分组注释（可选，用于热图上方色条）') }));
      var gTa = el('textarea.paste-area', {
        rows: 3,
        placeholder: T('每行「样本名 <TAB> 分组名」\nN1\tNormal\nN2\tNormal\nT1\tTumor\nT2\tTumor\n\n也可以是单个表头行，按列顺序给出分组名：\nGroup\tNormal\tNormal\tNormal\tTumor\tTumor\tTumor')
      });
      gTa.style.minHeight = '80px';
      groupBox.appendChild(gTa);
      groupBox.appendChild(el('div.field-hint', {
        text: T('填写后热图上方会出现分组色条。示例数据的分组为：N1–N6 = Normal，T1–T6 = Tumor，M1–M6 = Metastasis。')
      }));
      var demoGroupBtn = el('button.btn.btn-ghost.btn-xs', {
        text: T('插入示例分组'),
        onclick: function () {
          gTa.value = WB.demo.heatmapSamples.map(function (s, i) {
            return s + '\t' + WB.demo.heatmapGroups[i];
          }).join('\n');
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
      wrap.id = 'heatmap-result';
      main.appendChild(wrap);
      if (!WB._heatDemoLoaded) {
        WB._heatDemoLoaded = true;
        panel.setText(WB.demo.heatmapText);
      }
    }
  });

  /* ------------------------------ 辅助 ---------------------------------- */

  function metricName(m) {
    return {
      euclidean: '欧氏距离', correlation: '1 − 相关系数', manhattan: '曼哈顿距离',
      maximum: '最大距离', cosine: '余弦距离'
    }[m] || m;
  }
  function clusterName(c) {
    return { none: '关闭', average: '平均连接', complete: '完全连接', single: '单连接', ward: 'Ward.D2' }[c] || c;
  }

  /** 取回原始（未标准化、未转置）矩阵中的数值 */
  function originalValue(m, transposed, rowName, colName) {
    if (!m || !m.matrix || !m.matrix.length) return null;
    var rIdx, cIdx;
    if (!transposed) {
      rIdx = m.rowNames.indexOf(rowName);
      cIdx = m.colNames.indexOf(colName);
    } else {
      rIdx = m.rowNames.indexOf(colName);
      cIdx = m.colNames.indexOf(rowName);
    }
    if (rIdx < 0 || cIdx < 0) return null;
    var row = m.matrix[rIdx];
    var v = row ? row[cIdx] : null;
    return (v === undefined || !isFinite(v)) ? null : v;
  }

  /**
   * 解析分组信息，返回与列名对齐的颜色与图例
   * 支持：单行「表头 + 分组名」（按列顺序）或 两列「样本名 + 分组名」
   */
  function parseGroupSpec(text, colNames) {
    if (!text || !text.trim()) return null;
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return null;
    var labels = null;
    var first = lines[0].split(/[\t,;]/).map(function (s) { return s.trim(); });
    if (lines.length === 1 && first.length >= colNames.length) {
      var toks = first.slice();
      if (toks.length === colNames.length + 1 && /^(group|分组|group_name|condition)$/i.test(toks[0])) toks.shift();
      labels = toks.slice(0, colNames.length);
    } else {
      var map = {};
      lines.forEach(function (l) {
        var p = l.split(/[\t,;]/).map(function (s) { return s.trim(); });
        if (p.length >= 2 && p[0]) map[p[0]] = p[1];
      });
      labels = colNames.map(function (c) { return map[c] || ''; });
    }
    if (labels.every(function (l) { return !l; })) return null;
    var names = [], counts = {};
    labels.forEach(function (l) {
      var v = l || T('heat.ungrouped');
      if (names.indexOf(v) < 0) { names.push(v); counts[v] = 0; }
      counts[v]++;
    });
    var map2 = {};
    names.forEach(function (n, i) { map2[n] = WB.plot.palette(i); });
    return {
      labels: labels,
      colors: labels.map(function (l) { return map2[l || T('heat.ungrouped')]; }),
      legend: names.map(function (n) { return { name: n, color: map2[n], n: counts[n] }; })
    };
  }
})(window);
