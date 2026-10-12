/* =============================================================================
 * tools/pca.js  —  主成分分析（PCA）：碎石图 + 得分图 + 载荷表 + 分组置信椭圆
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t, lb = WB.lab;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    'PCA 主成分分析': 'PCA (Principal Component Analysis)',
    '降维观察样本整体结构：碎石图、PC 得分散点图（带分组置信椭圆）、变量载荷表。':
      'Explore overall sample structure by dimensionality reduction: scree plot, PC score scatter plot (with group confidence ellipses) and a variable loading table.',
    '降维': 'Dimensionality reduction',
    '分组椭圆': 'Group ellipse',
    '载荷': 'Loading',
    '样本 × 特征（可选分组列）': 'Samples × features (optional group column)',
    ['<b>第一列 = 样本 ID，第二列（可选）= 分组，其余列 = 数值特征</b>（基因表达、代谢物丰度等）。' +
      '若存在非数值列，会自动识别为分组并用于着色。请先选定纳入分析的特征列；样本数建议 ≥ 3×特征数。']:
      '<b>First column = sample ID, second column (optional) = group, remaining columns = numeric features</b> (gene expression, metabolite abundance, etc.). ' +
      'Non-numeric columns are auto-detected as groups and used for colouring. Select the feature columns to include first; at least 3× as many samples as features is recommended.',
    '样本 × 特征（无分组）': 'Samples × features (no group)',
    '只有样本 ID 与数值列，所有样本用同一种颜色绘制。':
      'Only a sample ID and numeric columns; all samples are drawn in the same colour.',
    '对样本 × 特征矩阵做中心化（可选标准化）后的特征分解，用于观察样本聚集、分组分离与离群样本。':
      'Eigen-decomposition of the centred (optionally standardised) sample × feature matrix, to inspect sample clustering, group separation and outliers.',
    '输入表达/特征矩阵': 'Input expression/feature matrix',
    '分析参数': 'Analysis parameters',
    '对特征做标准化（z-score）': 'Standardise features (z-score)',
    '各特征量纲/方差差异大时建议勾选': 'Recommended when features differ greatly in scale or variance',
    '先做 log2(x+1) 变换': 'Apply log2(x+1) transformation first',
    '自动（最大值 > 50 时执行）': 'Auto (applied when max > 50)',
    '总是执行': 'Always',
    '不执行': 'Never',
    '绘制分组 95% 置信椭圆': 'Draw 95% confidence ellipses per group',
    '显示样本名': 'Show sample labels',
    '叠加变量载荷箭头': 'Overlay variable loading arrows',
    '载荷表展示变量数': 'Variables shown in loading table',
    '运行 PCA': 'Run PCA',
    '数值特征列不足 2 列，无法做 PCA': 'Fewer than 2 numeric feature columns — cannot run PCA',
    '样本数不足 3 个': 'Fewer than 3 samples',
    '样本数': 'Samples',
    '特征数': 'Features',
    'PC1 解释方差': 'PC1 variance explained',
    'PC1+PC2': 'PC1+PC2',
    '前 3 个 PC': 'First 3 PCs',
    '标准化：<b>{v}</b>': 'Standardisation: <b>{v}</b>',
    '是（相关矩阵 PCA）': 'Yes (correlation-matrix PCA)',
    '否（协方差矩阵 PCA）': 'No (covariance-matrix PCA)',
    '已做 log2(x+1) 变换': 'log2(x+1) transformation applied',
    '有 {n} 个缺失值用该特征均值填补': '{n} missing values imputed with the feature mean',
    '分组列：<b>{name}</b>（{n} 组）': 'Group column: <b>{name}</b> ({n} groups)',
    '未检测到分组列，所有样本同色绘制': 'No group column detected; all samples are drawn in the same colour.',
    '已忽略的非数值列：{list}': 'Ignored non-numeric columns: {list}',
    '碎石图（各主成分解释方差）': 'Scree plot (variance explained by each PC)',
    'PC 得分图': 'PC score plot',
    '变量载荷（贡献度）': 'Variable loadings (contribution)',
    '特征': 'Feature',
    'PC1 载荷': 'PC1 loading',
    'PC2 载荷': 'PC2 loading',
    'PC3 载荷': 'PC3 loading',
    'PC1+PC2 贡献': 'PC1+PC2 contribution',
    '图示': 'Plot',
    ['载荷（loading）表示各特征对主成分的贡献方向与大小；本表按 PC1+PC2 的平方载荷（cos²）排序。' +
      '完整载荷可点表格右上角「导出 TSV」后查看全部。']:
      'Loadings give the direction and magnitude of each feature\'s contribution to a principal component; the table is sorted by squared loading (cos²) on PC1+PC2. ' +
      'Click “Export TSV” at the top right of the table to view all loadings.'
  });

  var FORMATS = [
    {
      name: '样本 × 特征（可选分组列）',
      filename: 'pca_template.tsv',
      desc: '<b>第一列 = 样本 ID，第二列（可选）= 分组，其余列 = 数值特征</b>（基因表达、代谢物丰度等）。' +
        '若存在非数值列，会自动识别为分组并用于着色。请先选定纳入分析的特征列；样本数建议 ≥ 3×特征数。',
      sample: 'SampleID\tGroup\tMKI67\tCCNB1\tCD8A\tPDCD1\tCOL1A1\tVIM\n' +
        'N01\tNormal\t7.82\t7.41\t9.02\t7.66\t6.88\t6.55\n' +
        'N02\tNormal\t8.04\t7.55\t8.87\t7.42\t7.02\t6.71\n' +
        'T01\tTumor\t10.31\t9.88\t8.02\t8.11\t8.55\t7.60\n' +
        'T02\tTumor\t10.02\t9.55\t7.88\t7.95\t8.31\t7.44'
    },
    {
      name: '样本 × 特征（无分组）',
      filename: 'pca_template_nogroup.tsv',
      desc: '只有样本 ID 与数值列，所有样本用同一种颜色绘制。',
      sample: 'SampleID\tPC_input_1\tPC_input_2\tPC_input_3\nS01\t7.82\t7.41\t9.02\nS02\t8.04\t7.55\t8.87\nS03\t10.31\t9.88\t8.02'
    }
  ];

  /* --------------------------- 分组置信椭圆 ------------------------------ */

  function confEllipse(pts, level) {
    // pts: [{x,y}] ; 返回 path d（95% 置信，卡方 2 自由度）
    var n = pts.length;
    if (n < 3) return null;
    var mx = 0, my = 0;
    pts.forEach(function (p) { mx += p.x; my += p.y; });
    mx /= n; my /= n;
    var a = 0, b = 0, c = 0;
    pts.forEach(function (p) {
      var dx = p.x - mx, dy = p.y - my;
      a += dx * dx; b += dx * dy; c += dy * dy;
    });
    a /= (n - 1); b /= (n - 1); c /= (n - 1);
    var tr = a + c, det = a * c - b * b;
    var disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    var l1 = tr / 2 + disc, l2 = Math.max(1e-12, tr / 2 - disc);
    var angle = 0.5 * Math.atan2(2 * b, a - c);
    var chi2 = level === 0.9 ? 4.605 : 5.991;
    var r1 = Math.sqrt(l1 * chi2), r2 = Math.sqrt(l2 * chi2);
    var d = '';
    for (var i = 0; i <= 60; i++) {
      var th = 2 * Math.PI * i / 60;
      var ex = r1 * Math.cos(th), ey = r2 * Math.sin(th);
      var px = mx + ex * Math.cos(angle) - ey * Math.sin(angle);
      var py = my + ex * Math.sin(angle) + ey * Math.cos(angle);
      d += (i === 0 ? 'M' : 'L') + px.toFixed(2) + ',' + py.toFixed(2);
    }
    d += 'Z';
    return d;
  }

  /* ------------------------------ 模块 ---------------------------------- */

  WB.register({
    id: 'pca',
    name: 'PCA 主成分分析',
    icon: '◈',
    color: '#59a14f',
    desc: '降维观察样本整体结构：碎石图、PC 得分散点图（带分组置信椭圆）、变量载荷表。',
    tags: ['降维', '分组椭圆', '载荷'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('PCA 主成分分析') }),
        el('p', { text: T('对样本 × 特征矩阵做中心化（可选标准化）后的特征分解，用于观察样本聚集、分组分离与离群样本。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入表达/特征矩阵',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.pcaText,
        placeholder: 'SampleID\tGroup\tGene1\tGene2\nS01\tNormal\t7.82\t7.41\n...',
        paramsTitle: '分析参数',
        params: [
          { key: 'scale', label: '对特征做标准化（z-score）', type: 'checkbox', value: true, hint: '各特征量纲/方差差异大时建议勾选' },
          {
            key: 'log', label: '先做 log2(x+1) 变换', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动（最大值 > 50 时执行）' },
              { value: 'yes', label: '总是执行' },
              { value: 'no', label: '不执行' }
            ]
          },
          { key: 'ellipse', label: '绘制分组 95% 置信椭圆', type: 'checkbox', value: true },
          { key: 'showLabels', label: '显示样本名', type: 'checkbox', value: false },
          { key: 'biplot', label: '叠加变量载荷箭头', type: 'checkbox', value: false },
          { key: 'topLoad', label: '载荷表展示变量数', type: 'number', value: 20, min: 5, max: 200, step: 5 }
        ],
        runLabel: '运行 PCA',
        onRun: function (ctx) {
          var res = WB.$('#pca-result');
          WB.clear(res);
          var st = WB.parse.splitNumericTable(ctx.text, {});
          if (st.features.length < 2) throw new Error(T('数值特征列不足 2 列，无法做 PCA'));
          if (st.nRows < 3) throw new Error(T('样本数不足 3 个'));

          var feats = st.features;
          var doLog = ctx.values.log === 'yes' ||
            (ctx.values.log === 'auto' && Math.max.apply(null, feats.map(function (f) {
              return Math.max.apply(null, f.values.filter(isFinite));
            })) > 50);
          if (doLog) {
            feats = feats.map(function (f) {
              return {
                name: f.name,
                values: f.values.map(function (v) { return isFinite(v) ? Math.log2(Math.max(0, v) + 1) : NaN; })
              };
            });
          }
          // 缺失值用该特征均值填补（并统计）
          var missing = 0;
          feats.forEach(function (f) {
            var ok = f.values.filter(isFinite), mu = WB.stats.mean(ok);
            f.values = f.values.map(function (v) { if (isFinite(v)) return v; missing++; return mu; });
          });

          var X = st.rowNames.map(function (_, i) {
            return feats.map(function (f) { return f.values[i]; });
          });
          var pr = WB.stats.pca(X, { center: true, scale: !!ctx.values.scale });

          var groups = [], groupNames = [];
          if (st.group) {
            groups = st.group.values;
            groupNames = WB.uniqueSorted(groups.filter(function (g) { return g !== ''; }));
          }
          var colors = groupNames.map(function (_, i) { return WB.plot.palette(i); });
          var colorOf = function (i) {
            var gi = groupNames.indexOf(groups[i]);
            return gi >= 0 ? colors[gi] : '#8fa0ae';
          };

          /* 统计 */
          var pcVar = pr.explained.slice(0, 6);
          res.appendChild(WB.ui.statBar([
            { label: T('样本数'), value: pr.n },
            { label: T('特征数'), value: pr.p },
            { label: T('PC1 解释方差'), value: (pr.explained[0] * 100).toFixed(1) + '%' },
            { label: T('PC1+PC2'), value: ((pr.explained[0] + (pr.explained[1] || 0)) * 100).toFixed(1) + '%' },
            {
              label: T('前 3 个 PC'),
              value: ((pr.explained.slice(0, 3).reduce(function (a, b) { return a + b; }, 0)) * 100).toFixed(1) + '%',
              tone: 'purple'
            }
          ]));
          var notes = [];
          notes.push(T('标准化：<b>{v}</b>', {
            v: ctx.values.scale ? T('是（相关矩阵 PCA）') : T('否（协方差矩阵 PCA）')
          }));
          if (doLog) notes.push(T('已做 log2(x+1) 变换'));
          if (missing) notes.push(T('有 {n} 个缺失值用该特征均值填补', { n: missing }));
          if (st.group) notes.push(T('分组列：<b>{name}</b>（{n} 组）', { name: st.group.name, n: groupNames.length }));
          else notes.push(T('未检测到分组列，所有样本同色绘制'));
          if (st.extra.length) notes.push(T('已忽略的非数值列：{list}', { list: st.extra.join(WB.pick('、', ', ')) }));
          res.appendChild(WB.ui.alertBox('info', notes.join(WB.pick('；', '; ')) + WB.pick('。', '.')));

          /* 碎石图 */
          var scCard = WB.ui.resultCard(T('碎石图（各主成分解释方差）'));
          res.appendChild(scCard);
          var scBody = scCard.querySelector('.card-body');
          var scHolder = el('div.plot-holder');
          scBody.appendChild(scHolder);
          var scSvg = drawScree(scHolder, pcVar);
          WB.plot.addToolbar(scBody, { getSvg: function () { return scSvg; }, basename: 'pca_scree' });

          /* 得分图 */
          var sCard = WB.ui.resultCard(T('PC 得分图'));
          res.appendChild(sCard);
          var sBody = sCard.querySelector('.card-body');
          if (groupNames.length && ctx.values.ellipse) {
            WB.plot.legendCategorical(sBody, groupNames.map(function (g, i) {
              return { color: colors[i], label: g };
            }));
          }
          var pHolder = el('div.plot-holder');
          sBody.appendChild(pHolder);
          var pSvg = drawScores(pHolder, pr, {
            rowNames: st.rowNames,
            groups: groups, groupNames: groupNames, colorOf: colorOf,
            showLabels: !!ctx.values.showLabels, ellipse: !!ctx.values.ellipse,
            biplot: !!ctx.values.biplot, features: feats
          });
          WB.plot.addToolbar(sBody, { getSvg: function () { return pSvg; }, basename: 'pca_scores' });

          /* 载荷表 */
          var lCard = WB.ui.resultCard(T('变量载荷（贡献度）'));
          res.appendChild(lCard);
          var lBody = lCard.querySelector('.card-body');
          var nShow = Math.min(Number(ctx.values.topLoad) || 20, feats.length);
          var loadRows = feats.map(function (f, j) {
            return {
              name: f.name,
              pc1: pr.loadings[0][j],
              pc2: pr.loadings[1] ? pr.loadings[1][j] : 0,
              pc3: pr.loadings[2] ? pr.loadings[2][j] : 0,
              contrib: pr.explained[0] * pr.loadings[0][j] * pr.loadings[0][j] * 100,
              cos2: pr.loadings[0][j] * pr.loadings[0][j] + (pr.loadings[1] ? pr.loadings[1][j] * pr.loadings[1][j] : 0)
            };
          });
          var loadTop = loadRows.slice().sort(function (a, b) { return b.cos2 - a.cos2; }).slice(0, nShow);
          WB.ui.dataTable(lBody, [
            { key: 'name', label: T('特征') },
            { key: 'pc1', label: T('PC1 载荷'), align: 'right', width: 110, format: function (r) { return WB.formatNum(r.pc1, 4); } },
            { key: 'pc2', label: T('PC2 载荷'), align: 'right', width: 110, format: function (r) { return WB.formatNum(r.pc2, 4); } },
            { key: 'pc3', label: T('PC3 载荷'), align: 'right', width: 110, format: function (r) { return WB.formatNum(r.pc3, 4); } },
            {
              key: 'cos2', label: T('PC1+PC2 贡献'), align: 'right', width: 130,
              format: function (r) { return (r.cos2 * 100).toFixed(2) + '%'; }
            },
            {
              key: 'bar', label: T('图示'), width: 150,
              render: function (r) {
                var pct = Math.min(1, r.cos2 / (loadTop[0] ? Math.max(1e-9, loadTop[0].cos2) : 1));
                var box = el('div.mini-bar');
                box.appendChild(el('i', { style: { width: Math.max(2, pct * 100) + '%', background: '#59a14f' } }));
                return box;
              }
            }
          ], loadTop, {
            pageSize: 25, exportName: 'pca_loadings',
            sortKey: 'cos2', sortDir: -1
          });
          lBody.appendChild(el('div.preview-note', {
            text: T('载荷（loading）表示各特征对主成分的贡献方向与大小；本表按 PC1+PC2 的平方载荷（cos²）排序。' +
              '完整载荷可点表格右上角「导出 TSV」后查看全部。')
          }));
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'pca-result';
      main.appendChild(wrap);
      if (!WB._pcaDemoLoaded) { WB._pcaDemoLoaded = true; panel.setText(WB.demo.pcaText); }
    }
  });

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawScree(container, explained) {
    var W = 620, H = 300, m = { l: 62, r: 52, t: 24, b: 52 };
    var n = explained.length;
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var band = WB.plot.bandScale(explained.map(function (_, i) { return i; }), m.l, W - m.r, 0.3);
    var y1 = WB.plot.linearScale(0, Math.max(0.05, explained[0] * 1.15), H - m.b, m.t);

    y1.ticks(5).forEach(function (t) {
      if (t < 0 || t > y1.domain()[1]) return;
      root.appendChild(S('line', { x1: m.l, y1: y1(t), x2: W - m.r, y2: y1(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, y1(t) + 3.5, (t * 100).toFixed(0) + '%', {
        'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED
      }));
    });

    var bw = band.bandwidth();
    explained.forEach(function (v, i) {
      var x = band(i), y = y1(v);
      var rect = S('rect', {
        x: x, y: y, width: bw, height: Math.max(1, H - m.b - y), rx: 3,
        fill: '#59a14f', 'fill-opacity': 0.85
      });
      root.appendChild(rect);
      WB.plot.bindTip(rect, function () {
        return '<b>PC' + (i + 1) + '</b><br>' + lb('common.explainedVar', (v * 100).toFixed(2) + '%');
      });
      root.appendChild(WB.plot.txt(x + bw / 2, y - 5, (v * 100).toFixed(1) + '%', {
        'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED
      }));
      root.appendChild(WB.plot.txt(x + bw / 2, H - m.b + 16, 'PC' + (i + 1), {
        'text-anchor': 'middle', 'font-size': 11, fill: WB.plot.TEXT
      }));
    });

    // 累积曲线
    var cum = [], acc = 0;
    explained.forEach(function (v) { acc += v; cum.push(acc); });
    var y2 = WB.plot.linearScale(0, 1, H - m.b, m.t);
    var d = '';
    cum.forEach(function (v, i) {
      var x = band(i) + bw / 2, y = y2(v);
      d += (i === 0 ? 'M' : 'L') + x + ',' + y;
    });
    root.appendChild(S('path', { d: d, fill: 'none', stroke: '#d98a1f', 'stroke-width': 1.8 }));
    cum.forEach(function (v, i) {
      var c = S('circle', { cx: band(i) + bw / 2, cy: y2(v), r: 3, fill: '#d98a1f' });
      root.appendChild(c);
      WB.plot.bindTip(c, function () {
        return T('pca.cumToPc', { n: i + 1 }) + '<b>' + (v * 100).toFixed(1) + '%</b>';
      });
      if (i === n - 1) {
        root.appendChild(WB.plot.txt(band(i) + bw / 2 + (i === 0 ? -6 : 6), y2(v) - 6,
          (v * 100).toFixed(0) + '%', {
          'text-anchor': i === 0 ? 'end' : 'start', 'font-size': 10, fill: '#b5761a'
        }));
      }
    });
    root.appendChild(WB.plot.txt(W - m.r + 8, m.t + 4, '100%', { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(W - m.r + 8, H - m.b, '0%', { 'font-size': 10, fill: WB.plot.MUTED }));

    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 16, T('pca.component'), {
      'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT
    }));
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, 14, T('pca.screeNote'), {
      'text-anchor': 'middle', 'font-size': 11, fill: WB.plot.MUTED
    }));
    return canvas.svg;
  }

  function drawScores(container, pr, cfg) {
    var pts = pr.scores.map(function (row, i) {
      return { x: row[0], y: row[1], i: i, name: (cfg.rowNames || [])[i] || '' };
    });
    var W = 620, H = 480, m = { l: 62, r: 26, t: 26, b: 56 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var xr = extentSymmetric(pts.map(function (p) { return p.x; }));
    var yr = extentSymmetric(pts.map(function (p) { return p.y; }));
    var sx = WB.plot.linearScale(xr[0], xr[1], m.l, W - m.r);
    var sy = WB.plot.linearScale(yr[0], yr[1], H - m.b, m.t);

    sx.ticks(6).forEach(function (t) {
      if (t < xr[0] || t > xr[1]) return;
      root.appendChild(S('line', { x1: sx(t), y1: m.t, x2: sx(t), y2: H - m.b, stroke: WB.plot.GRID }));
      if (t !== 0) root.appendChild(WB.plot.txt(sx(t), H - m.b + 16, WB.formatNum(t, 2), { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    sy.ticks(6).forEach(function (t) {
      if (t < yr[0] || t > yr[1]) return;
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      if (t !== 0) root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, WB.formatNum(t, 2), { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    // 零轴
    if (xr[0] < 0 && xr[1] > 0) root.appendChild(S('line', { x1: sx(0), y1: m.t, x2: sx(0), y2: H - m.b, stroke: '#cfdae3', 'stroke-dasharray': '4 3' }));
    if (yr[0] < 0 && yr[1] > 0) root.appendChild(S('line', { x1: m.l, y1: sy(0), x2: W - m.r, y2: sy(0), stroke: '#cfdae3', 'stroke-dasharray': '4 3' }));
    root.appendChild(S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'none', stroke: WB.plot.AXIS }));

    // 分组椭圆
    if (cfg.groupNames && cfg.groupNames.length && cfg.ellipse) {
      cfg.groupNames.forEach(function (g, gi) {
        var gp = pts.filter(function (p) { return cfg.groups[p.i] === g; }).map(function (p) { return { x: sx(p.x), y: sy(p.y) }; });
        var d = confEllipse(gp, 0.95);
        if (d) {
          root.appendChild(S('path', {
            d: d, fill: cfg.groupNames.length === 1 ? '#2f6fb3' : WB.plot.palette(gi),
            'fill-opacity': 0.11, stroke: WB.plot.palette(gi), 'stroke-width': 1.2, 'stroke-opacity': 0.75
          }));
        }
      });
    }

    // 载荷箭头
    if (cfg.biplot && cfg.features) {
      var maxLoad = 0;
      cfg.features.forEach(function (f, j) {
        maxLoad = Math.max(maxLoad, Math.hypot(pr.loadings[0][j], (pr.loadings[1] || [0])[j] || 0));
      });
      var scaleA = 0.42 * Math.min(W - m.l - m.r, H - m.t - m.b) / (maxLoad || 1);
      cfg.features.forEach(function (f, j) {
        var lx = pr.loadings[0][j], ly = (pr.loadings[1] || [0])[j] || 0;
        var len = Math.hypot(lx, ly);
        if (len < maxLoad * 0.55) return;
        var ex = sx(0) + lx * scaleA, ey = sy(0) - ly * scaleA;
        var ln = S('line', {
          x1: sx(0), y1: sy(0), x2: ex, y2: ey,
          stroke: '#9c755f', 'stroke-width': 1.4, 'marker-end': ''
        });
        root.appendChild(ln);
        var tEl = WB.plot.txt(ex + 3, ey - 2, WB.plot.ellipsis(f.name, 12), { 'font-size': 10, fill: '#8a6449' });
        root.appendChild(tEl);
        WB.plot.bindTip(ln, function () {
          return '<b>' + f.name + '</b><br>' + T('PC1 载荷') + ' ' + WB.formatNum(lx, 3) + '<br>' + T('PC2 载荷') + ' ' + WB.formatNum(ly, 3);
        });
      });
    }

    pts.forEach(function (p) {
      var col = cfg.colorOf ? cfg.colorOf(p.i) : '#2f6fb3';
      var c = S('circle', { cx: sx(p.x), cy: sy(p.y), r: 4.6, fill: col, 'fill-opacity': 0.78, stroke: '#ffffff', 'stroke-width': 1 });
      root.appendChild(c);
      WB.plot.bindTip(c, function () {
        return '<b>' + (cfg.rowNames ? cfg.rowNames[p.i] : T('common.sample') + ' ' + (p.i + 1)) + '</b>' +
          (cfg.groups && cfg.groups[p.i] ? '<br>' + lb('common.group', cfg.groups[p.i]) : '') +
          '<br>PC1 = ' + WB.formatNum(p.x, 3) + '<br>PC2 = ' + WB.formatNum(p.y, 3);
      });
      if (cfg.showLabels) {
        root.appendChild(WB.plot.txt(sx(p.x) + 6, sy(p.y) + 3.5, WB.plot.ellipsis(cfg.rowNames ? cfg.rowNames[p.i] : '', 10), {
          'font-size': 9.5, fill: WB.plot.MUTED
        }));
      }
    });

    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 20,
      T('pca.pcAxis', { n: 1, v: (pr.explained[0] * 100).toFixed(1) }), { 'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, T('pca.pcAxis', { n: 2, v: (pr.explained[1] * 100).toFixed(1) }),
      { 'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);
    return canvas.svg;
  }

  function extentSymmetric(vals) {
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var a = Math.max(Math.abs(lo), Math.abs(hi)) * 1.08 || 1;
    return [-a, a];
  }
})(window);
