/* =============================================================================
 * tools/scatter3d.js  —  三维散点图（SVG 伪三维投影 + 深度排序 + 可拖拽旋转）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '以三维坐标展示样本分布：支持按分组着色、95% 置信椭球、底面投影垂线与网格；可拖拽旋转、滚轮缩放，导出当前视角的矢量图。':
      'Display samples in three dimensions with group colours, 95% confidence ellipsoids, drop lines to the floor grid, drag-to-rotate and scroll-to-zoom; the current view is exported as a vector figure.',
    '三维': 'Three-dimensional',
    '散点图': 'Scatter plot',
    '三维散点图': '3D scatter plot',
    '0 为正交投影（各方向比例一致），1 为强透视。': '0 means an orthographic projection (identical scale in every direction), 1 a strong perspective.',
    '置信椭球': 'Confidence ellipsoid',
    '主坐标': 'Principal coordinates',
    '绘制三维散点图': 'Draw a three-dimensional scatter plot',
    '四列：ID + X + Y + Z（含表头）': 'Four columns: ID + X + Y + Z (with header)',
    ['<b>第一列是样本名，随后三列是 X / Y / Z 数值</b>（例如 PCA 或 t-SNE 的前三个坐标）。' +
      '若还有第五列且为文字，则作为分组用于着色。留空或 <code>NA</code> 的样本会被跳过。']:
      '<b>The first column is the sample name and the next three columns are the numeric X / Y / Z values</b> (for example the first three PCA or t-SNE coordinates). ' +
      'A fifth column containing text is used as the grouping variable for colours. Samples left blank or written as <code>NA</code> are skipped.',
    '三列：X + Y + Z（无样本名）': 'Three columns: X + Y + Z (no sample names)',
    '只有三列数值时，按 X / Y / Z 依次读取，样本名自动编号为 S1、S2…。': 'With only three numeric columns they are read as X / Y / Z and samples are numbered S1, S2…',
    '绘图参数': 'Plot parameters',
    '点大小': 'Point size',
    '透视强度（0 = 正交投影）': 'Perspective strength (0 = orthographic)',
    '各轴等比缩放': 'Equal scaling on all axes',
    '关闭后各轴独立缩放到满量程，便于观察量纲差异很大的数据。': 'When switched off, each axis is scaled independently to fill the box, which helps when the variables have very different units.',
    '显示 95% 置信椭球': 'Show 95% confidence ellipsoids',
    '显示底面投影垂线': 'Show drop lines to the floor',
    '显示底面网格': 'Show the floor grid',
    '显示样本标签': 'Show sample labels',
    '绘制三维散点图': 'Draw 3D scatter plot',
    '样本数': 'Samples',
    '分组数': 'Groups',
    '当前视角': 'Current view',
    '未解析到有效的三维坐标，请检查输入格式': 'No valid three-dimensional coordinates were parsed; please check the input format',
    '至少需要 4 个样本才能绘制三维散点图': 'At least four samples are needed to draw a three-dimensional scatter plot',
    '等轴测': 'Isometric',
    '俯视（X–Y 平面）': 'Top view (X–Y plane)',
    '正视（X–Z 平面）': 'Front view (X–Z plane)',
    '侧视（Y–Z 平面）': 'Side view (Y–Z plane)',
    '重置视角': 'Reset view',
    '切回默认的等轴测视角': 'Return to the default isometric view',
    '从上往下看 X–Y 平面': 'Look straight down onto the X–Y plane',
    '正对 X–Z 平面': 'Face the X–Z plane',
    '正对 Y–Z 平面': 'Face the Y–Z plane',
    ['三维投影：先绕纵轴旋转（偏航角）再俯仰，最后按深度排序绘制（画家算法）。' +
      '椭球为各组的 95% 置信区域（按 3 个自由度的卡方临界值 7.815 缩放），由协方差矩阵特征分解得到主轴。']:
      'Three-dimensional projection: the data are rotated about the vertical axis (yaw) and then tilted (pitch), and points are painted from far to near (painter’s algorithm). ' +
      'Ellipsoids are the 95% confidence regions of each group (scaled by the chi-square critical value 7.815 with 3 degrees of freedom), with principal axes from eigen-decomposition of the covariance matrix.',
    '拖拽旋转，滚轮缩放；点击上方按钮可切换到预设视角。': 'Drag to rotate and scroll to zoom; the buttons above switch to preset views.',
    '坐标数据': 'Coordinate data',
    '分组汇总': 'Group summary',
    '分组': 'Group',
    '椭球体积': 'Ellipsoid volume',
    '主轴长度': 'Principal axis lengths',
    '全部样本': 'All samples',
    '椭球需要每组至少 4 个样本': 'An ellipsoid needs at least 4 samples per group',
    '椭球：主轴 = √特征值 × √7.815；体积 = 4/3·π·abc。': 'Ellipsoid: semi-axes = √eigenvalue × √7.815; volume = 4/3·π·abc.'
  });

  var FORMATS = [
    {
      name: '四列：ID + X + Y + Z（含表头）',
      filename: 'scatter3d_template.tsv',
      desc: '<b>第一列是样本名，随后三列是 X / Y / Z 数值</b>（例如 PCA 或 t-SNE 的前三个坐标）。' +
        '若还有第五列且为文字，则作为分组用于着色。留空或 <code>NA</code> 的样本会被跳过。',
      sample: 'Sample\tPC1\tPC2\tPC3\tGroup\n' +
        'TCGA-01\t2.41\t-1.02\t0.55\tTumor\n' +
        'TCGA-02\t3.12\t-0.44\t1.21\tTumor\n' +
        'TCGA-03\t2.05\t-1.88\t-0.32\tTumor\n' +
        'TCGA-04\t-2.31\t1.44\t0.18\tNormal\n' +
        'TCGA-05\t-1.88\t2.02\t-0.66\tNormal\n' +
        'TCGA-06\t-2.74\t0.91\t1.05\tNormal'
    },
    {
      name: '三列：X + Y + Z（无样本名）',
      filename: 'scatter3d_3col_template.tsv',
      desc: '只有三列数值时，按 X / Y / Z 依次读取，样本名自动编号为 S1、S2…。',
      sample: 'PC1\tPC2\tPC3\n' +
        '2.41\t-1.02\t0.55\n' +
        '3.12\t-0.44\t1.21\n' +
        '2.05\t-1.88\t-0.32\n' +
        '-2.31\t1.44\t0.18\n' +
        '-1.88\t2.02\t-0.66\n' +
        '-2.74\t0.91\t1.05'
    }
  ];

  WB.register({
    id: 'scatter3d',
    name: '三维散点图',
    icon: '◈',
    color: '#3f7f9f',
    desc: '以三维坐标展示样本分布：支持按分组着色、95% 置信椭球、底面投影垂线与网格；可拖拽旋转、滚轮缩放，导出当前视角的矢量图。',
    tags: ['三维', '散点图', '置信椭球', '主坐标'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('三维散点图') }),
        el('p', { text: T('以三维坐标展示样本分布：支持按分组着色、95% 置信椭球、底面投影垂线与网格；可拖拽旋转、滚轮缩放，导出当前视角的矢量图。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '绘制三维散点图',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.scatter3dText,
        placeholder: 'Sample\tX\tY\tZ\tGroup\nS1\t2.41\t-1.02\t0.55\tA\nS2\t3.12\t-0.44\t1.21\tA\n...',
        paramsTitle: '绘图参数',
        params: [
          { key: 'pointSize', label: '点大小', type: 'number', value: 5, min: 2, max: 12, step: 0.5 },
          {
            key: 'persp', label: '透视强度（0 = 正交投影）', type: 'number', value: 0.35, min: 0, max: 1, step: 0.05,
            hint: '0 为正交投影（各方向比例一致），1 为强透视。'
          },
          {
            key: 'equalScale', label: '各轴等比缩放', type: 'checkbox', value: true,
            hint: '关闭后各轴独立缩放到满量程，便于观察量纲差异很大的数据。'
          },
          { key: 'showEllipsoid', label: '显示 95% 置信椭球', type: 'checkbox', value: true },
          { key: 'showDrop', label: '显示底面投影垂线', type: 'checkbox', value: false },
          { key: 'showGrid', label: '显示底面网格', type: 'checkbox', value: true },
          { key: 'showLabels', label: '显示样本标签', type: 'checkbox', value: false }
        ],
        runLabel: '绘制三维散点图',
        onRun: function (ctx) {
          var res = WB.$('#scatter3d-result');
          WB.clear(res);
          runPlot(res, ctx, panel);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'scatter3d-result';
      main.appendChild(wrap);
      if (!WB._scatter3dDemoLoaded) { WB._scatter3dDemoLoaded = true; panel.setText(WB.demo.scatter3dText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  function runPlot(res, ctx, panel) {
    /* 首列是样本名，需关闭「首列作为行名」的自动处理 */
    var m = WB.parse.parseMatrix(ctx.text, { rowNames: false });
    if (!m.matrix.length) throw new Error(T('未解析到有效的三维坐标，请检查输入格式'));

    var d = parseXYZ(m);
    if (d.points.length < 4) throw new Error(T('至少需要 4 个样本才能绘制三维散点图'));

    res.appendChild(WB.ui.statBar([
      { label: T('样本数'), value: d.points.length },
      { label: T('分组数'), value: d.groups.length || 1 },
      { label: T('当前视角'), value: '—' }
    ]));

    var card = WB.ui.resultCard(T('三维散点图'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');

    var state = { yaw: -0.62, pitch: 0.34, zoom: 1 };

    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var W = 780, H = 640;
    var canvas = WB.plot.createSVG(holder, W, H, {});
    var svg = canvas.svg;
    var scene = WB.plot.g({});
    canvas.root.appendChild(scene);

    var angleLabel = null;

    function paint() {
      WB.clear(scene);
      drawScene(scene, d, {
        yaw: state.yaw, pitch: state.pitch, zoom: state.zoom,
        W: W, H: H,
        pointSize: Number(panel.getParam('pointSize')) || 5,
        persp: WB.clamp(Number(panel.getParam('persp')) || 0, 0, 1),
        equalScale: panel.getParam('equalScale') !== false,
        showEllipsoid: panel.getParam('showEllipsoid') !== false,
        showDrop: panel.getParam('showDrop') === true,
        showGrid: panel.getParam('showGrid') !== false,
        showLabels: panel.getParam('showLabels') === true
      });
      if (angleLabel) {
        angleLabel.textContent = 'yaw ' + Math.round(state.yaw * 180 / Math.PI) + '°, pitch ' + Math.round(state.pitch * 180 / Math.PI) + '°';
      }
      var bars = res.querySelectorAll('.stat-value');
      if (bars.length >= 3) {
        bars[2].textContent = Math.round(state.yaw * 180 / Math.PI) + '° / ' + Math.round(state.pitch * 180 / Math.PI) + '°';
      }
    }

    var viewBtns = [
      { label: '等轴测', title: T('切回默认的等轴测视角'), v: { yaw: -0.62, pitch: 0.34, zoom: 1 } },
      { label: '俯视（X–Y 平面）', title: T('从上往下看 X–Y 平面'), v: { yaw: -0.62, pitch: 1.45, zoom: 1 } },
      { label: '正视（X–Z 平面）', title: T('正对 X–Z 平面'), v: { yaw: 0, pitch: 0, zoom: 1 } },
      { label: '侧视（Y–Z 平面）', title: T('正对 Y–Z 平面'), v: { yaw: -1.5708, pitch: 0, zoom: 1 } }
    ].map(function (b) {
      return {
        label: b.label, title: b.title,
        onClick: function () { state.yaw = b.v.yaw; state.pitch = b.v.pitch; state.zoom = b.v.zoom; paint(); }
      };
    });
    var bar = WB.plot.addToolbar(body, {
      getSvg: function () { return svg; }, basename: 'scatter3d', buttons: viewBtns
    });
    angleLabel = el('span.plot-toolbar-note', { text: '' });
    bar.appendChild(angleLabel);

    /* 拖拽旋转 + 滚轮缩放 */
    var dragging = false, lastX = 0, lastY = 0;
    svg.style.cursor = 'grab';
    svg.addEventListener('mousedown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      svg.style.cursor = 'grabbing';
      if (e.preventDefault) e.preventDefault();
    });
    svg.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var dx = (e.clientX || 0) - lastX, dy = (e.clientY || 0) - lastY;
      lastX = e.clientX; lastY = e.clientY;
      state.yaw -= dx * 0.008;
      state.pitch = WB.clamp(state.pitch + dy * 0.008, -1.5, 1.5);
      paint();
    });
    svg.addEventListener('mouseup', function () { dragging = false; svg.style.cursor = 'grab'; });
    svg.addEventListener('mouseleave', function () { dragging = false; svg.style.cursor = 'grab'; });
    svg.addEventListener('wheel', function (e) {
      var dy = (e && e.deltaY) || 0;
      state.zoom = WB.clamp(state.zoom * (dy > 0 ? 0.92 : 1.08), 0.4, 3);
      paint();
    });

    paint();
    body.appendChild(el('div.preview-note', {
      text: T('三维投影：先绕纵轴旋转（偏航角）再俯仰，最后按深度排序绘制（画家算法）。' +
        '椭球为各组的 95% 置信区域（按 3 个自由度的卡方临界值 7.815 缩放），由协方差矩阵特征分解得到主轴。')
    }));
    body.appendChild(el('div.preview-note', { text: T('拖拽旋转，滚轮缩放；点击上方按钮可切换到预设视角。') }));

    /* 坐标数据表 */
    var tCard = WB.ui.resultCard(T('坐标数据'));
    res.appendChild(tCard);
    WB.ui.dataTable(tCard.querySelector('.card-body'), [
      { key: 'id', label: 'ID' },
      { key: 'x', label: 'X', align: 'right', width: 90, format: function (r) { return WB.formatNum(r.x, 4); } },
      { key: 'y', label: 'Y', align: 'right', width: 90, format: function (r) { return WB.formatNum(r.y, 4); } },
      { key: 'z', label: 'Z', align: 'right', width: 90, format: function (r) { return WB.formatNum(r.z, 4); } },
      { key: 'g', label: T('分组'), width: 120, format: function (r) { return r.g ? r.g : '—'; } }
    ], d.points.map(function (p) { return { id: p.id, x: p.raw[0], y: p.raw[1], z: p.raw[2], g: p.g || '' }; }),
      { pageSize: 25, exportName: 'scatter3d_points' });

    /* 分组汇总 */
    var gCard = WB.ui.resultCard(T('分组汇总'));
    res.appendChild(gCard);
    var gRows = (d.groups.length ? d.groups : [{ name: T('全部样本'), pts: d.points }]).map(function (grp) {
      var pts = grp.pts;
      var stat = ['x', 'y', 'z'].map(function (k, ai) {
        var vals = pts.map(function (p) { return p.raw[ai]; });
        return { m: WB.stats.mean(vals), sd: WB.stats.stdev(vals) };
      });
      var ell = ellipsoid(pts);
      return {
        name: grp.name, n: pts.length,
        cx: stat[0].m, cy: stat[1].m, cz: stat[2].m,
        sx: stat[0].sd, sy: stat[1].sd, sz: stat[2].sd,
        vol: ell ? ell.vol : NaN,
        axes: ell ? ell.axes.map(function (a) { return WB.formatNum(a, 3); }).join(' / ') : '—'
      };
    });
    WB.ui.dataTable(gCard.querySelector('.card-body'), [
      { key: 'name', label: T('分组') },
      { key: 'n', label: 'n', align: 'right', width: 56 },
      { key: 'cx', label: 'X ' + T('均值'), align: 'right', width: 108, format: function (r) { return WB.formatNum(r.cx, 3) + ' ± ' + WB.formatNum(r.sx, 3); } },
      { key: 'cy', label: 'Y ' + T('均值'), align: 'right', width: 108, format: function (r) { return WB.formatNum(r.cy, 3) + ' ± ' + WB.formatNum(r.sy, 3); } },
      { key: 'cz', label: 'Z ' + T('均值'), align: 'right', width: 108, format: function (r) { return WB.formatNum(r.cz, 3) + ' ± ' + WB.formatNum(r.sz, 3); } },
      { key: 'axes', label: T('主轴长度'), align: 'right', width: 140 },
      { key: 'vol', label: T('椭球体积'), align: 'right', width: 104, format: function (r) { return isFinite(r.vol) ? WB.formatNum(r.vol, 3) : '—'; } }
    ], gRows, { pageSize: 20, exportName: 'scatter3d_groups' });
    gCard.querySelector('.card-body').appendChild(el('div.preview-note', { text: T('椭球：主轴 = √特征值 × √7.815；体积 = 4/3·π·abc。') }));
  }

  /* ------------------------------ 解析 ---------------------------------- */

  /** 取单元格文本：数值列直接取数值，文字列回退到原始字符串 */
  function cellText(m, ri, ci) {
    var row = m.matrix[ri] || [];
    if (isFinite(row[ci])) return String(row[ci]);
    var raw = (m.raw[ri] || [])[ci];
    return String(raw === undefined || raw === null ? '' : raw).trim();
  }

  function parseXYZ(m) {
    var rows = m.matrix;
    var cols = 0;
    rows.forEach(function (r) { if (r.length > cols) cols = r.length; });
    cols = Math.max(cols, m.colNames.length);

    /* 找到第一组连续三列全为数值的坐标列，其左侧为 ID、右侧为分组 */
    function allNum(j) {
      if (j < 0 || j >= cols) return false;
      return rows.every(function (r) { return isFinite(r[j]); });
    }
    var a = -1;
    for (var c = 0; c + 2 < cols; c++) {
      if (allNum(c) && allNum(c + 1) && allNum(c + 2)) { a = c; break; }
    }
    if (a < 0) throw new Error(T('未解析到有效的三维坐标，请检查输入格式'));
    var xi = a, yi = a + 1, zi = a + 2;
    var idCol = -1, gCol = -1;
    for (var k = a - 1; k >= 0; k--) { if (!allNum(k)) { idCol = k; break; } }
    for (var k2 = a + 3; k2 < cols; k2++) { if (!allNum(k2)) { gCol = k2; break; } }

    var names = m.colNames;
    var points = [];
    rows.forEach(function (r, i) {
      var x = r[xi], y = r[yi], z = r[zi];
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return;
      var id = idCol >= 0 ? cellText(m, i, idCol) : '';
      if (!id) id = 'S' + (i + 1);
      var g = gCol >= 0 ? cellText(m, i, gCol) : '';
      points.push({ id: id, raw: [x, y, z], g: g });
    });

    var gNames = [], groups = [];
    points.forEach(function (p) {
      if (!p.g) return;
      var idx = gNames.indexOf(p.g);
      if (idx < 0) { gNames.push(p.g); groups.push({ name: p.g, pts: [] }); idx = gNames.length - 1; }
      groups[idx].pts.push(p);
    });

    var mins = [0, 1, 2].map(function (a) { return Math.min.apply(null, points.map(function (p) { return p.raw[a]; })); });
    var maxs = [0, 1, 2].map(function (a) { return Math.max.apply(null, points.map(function (p) { return p.raw[a]; })); });

    return {
      points: points, groups: groups,
      axisNames: [names[xi] || 'X', names[yi] || 'Y', names[zi] || 'Z'],
      mins: mins, maxs: maxs,
      centers: [0, 1, 2].map(function (a) { return (mins[a] + maxs[a]) / 2; }),
      half: [0, 1, 2].map(function (a) { return (maxs[a] - mins[a]) / 2 || 1; })
    };
  }

  /* --------------------------- 椭球与凸包 -------------------------------- */

  /** 95% 置信椭球：协方差特征分解 + 卡方(3) 临界值 7.815 */
  function ellipsoid(pts) {
    var n = pts.length;
    if (n < 4) return null;
    var mean = [0, 1, 2].map(function (a) {
      return pts.reduce(function (s, p) { return s + p.raw[a]; }, 0) / n;
    });
    var cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    pts.forEach(function (p) {
      var d = [0, 1, 2].map(function (a) { return p.raw[a] - mean[a]; });
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) cov[i][j] += d[i] * d[j] / (n - 1);
    });
    var eg = WB.stats.jacobiEigen(cov, 100);
    var R = Math.sqrt(7.814727903251179);
    var axes = eg.values.map(function (v) { return Math.sqrt(Math.max(0, v)) * R; });
    if (!isFinite(axes[0]) || axes[0] <= 0) return null;
    /* 单位球采样（Fibonacci 格点，结果确定） */
    var u = [];
    var cnt = 160, ga = Math.PI * (3 - Math.sqrt(5));
    for (var k = 0; k < cnt; k++) {
      var yy = 1 - (2 * k + 1) / cnt;
      var rr = Math.sqrt(Math.max(0, 1 - yy * yy));
      var th = ga * k;
      u.push([Math.cos(th) * rr, yy, Math.sin(th) * rr]);
    }
    var surf = u.map(function (v) {
      return [0, 1, 2].map(function (a) {
        return mean[a] + axes[0] * v[0] * eg.vectors[0][a] + axes[1] * v[1] * eg.vectors[1][a] + axes[2] * v[2] * eg.vectors[2][a];
      });
    });
    return {
      mean: mean, axes: axes, vectors: eg.vectors, surface: surf,
      vol: 4 / 3 * Math.PI * axes[0] * axes[1] * axes[2]
    };
  }

  function convexHull(pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    if (p.length < 3) return p;
    function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lower = [], upper = [], i;
    for (i = 0; i < p.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p[i]) <= 0) lower.pop();
      lower.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop();
      upper.push(p[i]);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawScene(scene, d, o) {
    var ca = Math.cos(o.yaw), sa = Math.sin(o.yaw);
    var cb = Math.cos(o.pitch), sb = Math.sin(o.pitch);

    var mins = d.mins, maxs = d.maxs;
    var half = d.half;
    if (o.equalScale) {
      var hMax = Math.max(half[0], half[1], half[2]);
      half = [hMax, hMax, hMax];
    } else {
      half = half.map(function (h) { return h || 1; });
    }

    /** 数据 → 归一化 [-1,1] */
    function norm(raw) {
      return [0, 1, 2].map(function (a) { return (raw[a] - d.centers[a]) / half[a]; });
    }
    /** 单位立方体旋转后的归一化投影（尚未缩放），返回 [u, v, depth] */
    function projU(v) {
      var x = v[0], y = v[1], z = v[2];
      var x1 = x * ca + y * sa;
      var y1 = -x * sa + y * ca;
      var z1 = z;
      var y2 = y1 * cb - z1 * sb;
      var z2 = y1 * sb + z1 * cb;
      var k = 1 / (1 + y2 * o.persp * 0.42);
      return [x1 * k, -z2 * k, y2];
    }

    /* 按立方体八个顶点的投影范围自动缩放，保证任何视角都不出画布 */
    var corners = [];
    for (var ci = 0; ci < 8; ci++) {
      corners.push([(ci & 1) ? 1 : -1, (ci & 2) ? 1 : -1, (ci & 4) ? 1 : -1]);
    }
    var ps = corners.map(projU);
    var ux0 = Math.min.apply(null, ps.map(function (p) { return p[0]; }));
    var ux1 = Math.max.apply(null, ps.map(function (p) { return p[0]; }));
    var uy0 = Math.min.apply(null, ps.map(function (p) { return p[1]; }));
    var uy1 = Math.max.apply(null, ps.map(function (p) { return p[1]; }));

    var boxX0 = 46, boxX1 = o.W - (d.groups.length ? 196 : 46);
    var boxY0 = 46, boxY1 = o.H - 56;
    var fitW = (boxX1 - boxX0) / Math.max(1e-6, ux1 - ux0);
    var fitH = (boxY1 - boxY0) / Math.max(1e-6, uy1 - uy0);
    var sc = Math.min(fitW, fitH) * o.zoom;
    var ox = (boxX0 + boxX1) / 2 - sc * (ux0 + ux1) / 2;
    var oy = (boxY0 + boxY1) / 2 - sc * (uy0 + uy1) / 2;

    /** 归一化坐标 → 屏幕坐标（返回 [x, y, depth]） */
    function proj(v) {
      var u = projU(v);
      return [ox + u[0] * sc, oy + u[1] * sc, u[2]];
    }
    function projN(raw) { return proj(norm(raw)); }
    var cx = (boxX0 + boxX1) / 2, cy = (boxY0 + boxY1) / 2;

    /* ---- 底面网格 ---- */
    if (o.showGrid) {
      var g = WB.plot.g({});
      scene.appendChild(g);
      var tt = [-1, -0.5, 0, 0.5, 1];
      tt.forEach(function (tv) {
        var a1 = proj([-1, tv, -1]), a2 = proj([1, tv, -1]);
        g.appendChild(S('line', { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], stroke: WB.plot.GRID, 'stroke-width': 0.8 }));
        var b1 = proj([tv, -1, -1]), b2 = proj([tv, 1, -1]);
        g.appendChild(S('line', { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], stroke: WB.plot.GRID, 'stroke-width': 0.8 }));
      });
    }

    /* ---- 三条坐标轴（自下角出发） ---- */
    var axes = [
      { dir: 0, from: [-1, -1, -1], to: [1, -1, -1] },
      { dir: 1, from: [-1, -1, -1], to: [-1, 1, -1] },
      { dir: 2, from: [-1, -1, -1], to: [-1, -1, 1] }
    ];
    axes.forEach(function (ax) {
      var p1 = proj(ax.from), p2 = proj(ax.to);
      scene.appendChild(S('line', {
        x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: WB.plot.AXIS, 'stroke-width': 1.2
      }));
      /* 刻度 */
      var ts = [-1, -0.5, 0, 0.5, 1];
      var vx = (p2[0] - p1[0]), vy = (p2[1] - p1[1]);
      var len = Math.sqrt(vx * vx + vy * vy) || 1;
      var ux = vx / len, uy = vy / len;
      var px = -uy, py = ux;
      /* 让刻度朝外（远离画布中心） */
      if ((p1[0] - cx) * px + (p1[1] - cy) * py < 0) { px = -px; py = -py; }
      ts.forEach(function (tv) {
        var q = [
          p1[0] + (p2[0] - p1[0]) * (tv + 1) / 2,
          p1[1] + (p2[1] - p1[1]) * (tv + 1) / 2
        ];
        scene.appendChild(S('line', {
          x1: q[0], y1: q[1], x2: q[0] + px * 5, y2: q[1] + py * 5, stroke: WB.plot.AXIS, 'stroke-width': 1
        }));
        var val = d.centers[ax.dir] + tv * half[ax.dir];
        scene.appendChild(WB.plot.txt(q[0] + px * 9, q[1] + py * 9 + 3.5, WB.formatNum(val, 2), {
          'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: WB.plot.TICKTEXT
        }));
      });
      /* 轴标题 */
      var mid = [(p1[0] + p2[0]) / 2 + px * 22, (p1[1] + p2[1]) / 2 + py * 22];
      scene.appendChild(WB.plot.txt(mid[0], mid[1] + 3.5, d.axisNames[ax.dir], {
        'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 600, fill: WB.plot.TEXT
      }));
    });

    /* ---- 椭球（先画，位于点下方） ---- */
    if (o.showEllipsoid) {
      var sets = d.groups.length ? d.groups : [{ name: T('全部样本'), pts: d.points }];
      sets.forEach(function (grp, gi) {
        var e = ellipsoid(grp.pts);
        if (!e) return;
        var col = d.groups.length ? WB.plot.palette(gi) : '#5a6a76';
        var hull = convexHull(e.surface.map(projN));
        if (hull.length < 3) return;
        scene.appendChild(S('polygon', {
          points: hull.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '),
          fill: col, 'fill-opacity': 0.10, stroke: col, 'stroke-width': 1.1, 'stroke-opacity': 0.75
        }));
      });
    }

    /* ---- 垂线 ---- */
    if (o.showDrop) {
      var dg = WB.plot.g({});
      scene.appendChild(dg);
      d.points.forEach(function (p) {
        var a = projN(p.raw), b = proj([norm(p.raw)[0], norm(p.raw)[1], -1]);
        dg.appendChild(S('line', {
          x1: a[0], y1: a[1], x2: b[0], y2: b[1],
          stroke: '#9aa5b1', 'stroke-width': 0.7, 'stroke-opacity': 0.5
        }));
        dg.appendChild(S('circle', { cx: b[0], cy: b[1], r: 1.1, fill: '#9aa5b1', 'fill-opacity': 0.6 }));
      });
    }

    /* ---- 样本点（画家算法：由远及近） ---- */
    var drawn = d.points.map(function (p, i) {
      var gi = d.groups.length ? indexOfName(d.groups, p.g) : -1;
      var pr = projN(p.raw);
      return { p: p, pr: pr, gi: gi, i: i };
    });
    drawn.sort(function (a, b) { return b.pr[2] - a.pr[2]; });
    drawn.forEach(function (it) {
      var col = it.gi >= 0 ? WB.plot.palette(it.gi) : '#2f6fb3';
      var k = 1 / (1 + it.pr[2] * o.persp * 0.42);
      var r = Math.max(1.4, o.pointSize * 0.5 * k);
      var c = S('circle', {
        cx: it.pr[0], cy: it.pr[1], r: r,
        fill: col, 'fill-opacity': 0.82, stroke: '#ffffff', 'stroke-width': 0.7
      });
      scene.appendChild(c);
      WB.plot.bindTip(c, function () {
        return '<b>' + WB.esc(it.p.id) + '</b>' + (it.p.g ? '（' + WB.esc(it.p.g) + '）' : '') +
          '<br>' + WB.esc(d.axisNames[0]) + ' = ' + WB.formatNum(it.p.raw[0], 4) +
          '<br>' + WB.esc(d.axisNames[1]) + ' = ' + WB.formatNum(it.p.raw[1], 4) +
          '<br>' + WB.esc(d.axisNames[2]) + ' = ' + WB.formatNum(it.p.raw[2], 4);
      });
    });

    /* ---- 样本标签 ---- */
    if (o.showLabels && d.points.length <= 60) {
      drawn.forEach(function (it) {
        scene.appendChild(WB.plot.txt(it.pr[0] + 5, it.pr[1] + 3, WB.plot.ellipsis(it.p.id, 10), {
          'font-size': 10.5, 'font-weight': 600, fill: WB.plot.TICKTEXT
        }));
      });
    }

    /* ---- 图内图例 ---- */
    if (d.groups.length) {
      var lx = o.W - 170, ly = 26;
      var lg = WB.plot.g({});
      scene.appendChild(lg);
      lg.appendChild(S('rect', {
        x: lx - 12, y: ly - 14, width: 170, height: d.groups.length * 19 + 22, rx: 8,
        fill: '#ffffff', 'fill-opacity': 0.94, stroke: WB.plot.AXIS
      }));
      d.groups.forEach(function (grp, gi) {
        var y = ly + gi * 19;
        lg.appendChild(S('circle', { cx: lx + 2, cy: y + 4, r: 4.6, fill: WB.plot.palette(gi), stroke: '#ffffff', 'stroke-width': 0.7 }));
        lg.appendChild(WB.plot.txt(lx + 15, y + 8, WB.plot.ellipsis(grp.name + ' (n=' + grp.pts.length + ')', 19), { 'font-size': 12, fill: WB.plot.TEXT }));
      });
    }
  }

  /* 供自检使用的纯函数 */
  WB.scatter3d = { ellipsoid: ellipsoid, convexHull: convexHull, parseXYZ: parseXYZ };

  function indexOfName(groups, name) {
    for (var i = 0; i < groups.length; i++) { if (groups[i].name === name) return i; }
    return -1;
  }
})(window);
