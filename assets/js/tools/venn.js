/* =============================================================================
 * tools/venn.js  —  韦恩图（2~4 集合，支持任意集合数的交集明细表）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t, lb = WB.lab;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 数据格式（FORMATS，由核心层自动翻译） */
    '长表（推荐）': 'Long table (recommended)',
    ['<b>两列，一行一个成员关系</b>：第一列是集合名，第二列是元素（基因）名。<br>' +
      '同一个元素出现在多个集合中时，写多行即可（<code>Element</code> 列会重复）。' +
      '这是最通用的格式，集合数量不限。']:
      '<b>Two columns, one membership per row</b>: the first column is the set name, the second is the element (gene) name.<br>' +
      'If an element belongs to several sets, simply write multiple rows (the <code>Element</code> column repeats). ' +
      'This is the most general format and allows any number of sets.',
    '宽表（0/1 矩阵）': 'Wide table (0/1 matrix)',
    ['<b>第一列是元素名，其余每列一个集合</b>，值为 <code>1/0</code>（也识别 TRUE/FALSE、yes/no、是/否）。' +
      '适合从 Excel 透视表或 R/Python 导出的 membership 矩阵。']:
      '<b>The first column is the element name and each remaining column is one set</b>, with values <code>1/0</code> (TRUE/FALSE and yes/no are also recognised). ' +
      'Suitable for membership matrices exported from an Excel pivot table or R/Python.',
    '分列（每列一组）': 'Separate columns (one set per column)',
    ['<b>第一行是集合名，每列下方是该集合的成员列表</b>，各列长度可以不一样（空单元格会被忽略）。' +
      '适用于将 Excel 中多个基因列表并排粘贴的情形。']:
      '<b>The first row holds the set names and each column lists that set’s members below</b>; columns may have different lengths (empty cells are ignored). ' +
      'Suitable for pasting several gene lists side by side directly from Excel.',

    /* 工具注册信息（name/desc/tags，由核心层自动翻译） */
    '韦恩图': 'Venn diagram',
    '2~4 个基因/元素集合的重叠关系，自动计算每个区域的交集，并可导出交集基因列表。':
      'Overlap among 2–4 gene/element sets, with automatic intersection counts per region and export of intersection gene lists.',
    '2-4 集合': '2–4 sets',
    '交集明细': 'Intersection details',
    'SVG 导出': 'SVG export',

    /* 页面标题 */
    '输入若干集合的成员列表，自动计算并绘制交集区域；支持每个文件作为一个集合。':
      'Enter the member lists of several sets; intersection regions are computed and drawn automatically. Each file can count as one set.',

    /* 输入面板（inputPanel 配置，由核心层自动翻译） */
    '输入集合数据': 'Input set data',
    'Set\tElement\nControl_up\tTP53\n...\n\n或直接把 Excel 中两列数据粘贴到这里':
      'Set\tElement\nControl_up\tTP53\n...\n\nor paste two columns straight from Excel here',
    '绘图参数': 'Plot parameters',
    '数据格式': 'Data format',
    '自动识别': 'Auto-detect',
    '长表（集合 + 元素）': 'Long table (set + element)',
    '显示数量为 0 的区域': 'Show zero-count regions',
    '显示交集明细表': 'Show intersection detail table',
    '图像宽度 (px)': 'Image width (px)',
    '开始分析': 'Run analysis',

    /* 运行提示与统计 */
    '来自 {n} 个上传文件（每个文件 = 一个集合）': 'From {n} uploaded files (each file = one set)',
    '格式识别为：{fmt}': 'Detected format: {fmt}',
    '长表': 'Long table',
    '宽表（0/1）': 'Wide table (0/1)',
    '分列': 'Separate columns',
    '至少需要 2 个集合（当前识别到 {n} 个），请检查输入格式':
      'At least 2 sets are required (currently {n}); please check the input format.',
    '识别到 {n} 个集合。韦恩图最多清晰展示 4 个集合，<b>建议改用 UpSet 图</b>（左侧导航「UpSet 图」）来展示多集合交集。以下是交集明细表。':
      'Detected {n} sets. A Venn diagram can clearly show at most 4 sets; <b>consider using the UpSet plot instead</b> (left navigation “UpSet plot”) to show multi-set intersections. The intersection detail table is given below.',
    '识别到 {n} 个集合，超过 4 个后韦恩图区域无法准确呈现（这是几何限制）。<b>建议改用 UpSet 图</b>。以下仅给出交集明细表。':
      'Detected {n} sets; beyond 4, a Venn diagram can no longer show the regions accurately (a geometric limitation). <b>Consider using the UpSet plot instead</b>. Only the intersection detail table is given below.',
    '集合数': 'Sets',
    '唯一元素数': 'Unique elements',
    '非空交集区域': 'Non-empty regions',
    '出现在 ≥2 个集合': 'In ≥2 sets',

    /* 结果卡片与表格 */
    '各集合成员数': 'Members per set',
    '交集明细（可导出基因列表）': 'Intersection details (gene lists exportable)',
    '交集区域': 'Intersection region',
    '元素数': 'Elements',
    '占比': '% of total',
    '元素列表（前 30 项）': 'Elements (top 30)',
    '下载': 'Download',
    '导出该区域的全部元素': 'Export all elements of this region',
    '「下载」按钮导出该区域的全部元素；表格右上角可导出全部区域汇总。':
      'The “Download” button exports all elements of that region; the table’s top-right export saves a summary of all regions.',
    '两两交集矩阵': 'Pairwise intersection matrix'
  });

  /* --------------------------- 几何布局定义 ------------------------------ */

  // 归一化坐标（0~1，y 向下），在包围盒内绘制后缩放到画布
  function layout2() {
    return {
      shapes: [
        { type: 'circle', cx: 0.40, cy: 0.50, r: 0.30, rot: 0 },
        { type: 'circle', cx: 0.60, cy: 0.50, r: 0.30, rot: 0 }
      ]
    };
  }
  function layout3() {
    var d = 0.195, r = 0.285;
    var ang = [-90, 30, 150].map(function (a) { return a * Math.PI / 180; });
    return {
      shapes: ang.map(function (a) {
        return { type: 'circle', cx: 0.5 + Math.cos(a) * d, cy: 0.5 + Math.sin(a) * d, r: r };
      })
    };
  }
  // 经典 4 集合布局：4 个椭圆（VennDiagram 参数体系）
  function layout4() {
    return {
      shapes: [
        { type: 'ellipse', cx: 0.655, cy: 0.455, a: 0.345, b: 0.185, rot: 45 },
        { type: 'ellipse', cx: 0.345, cy: 0.455, a: 0.345, b: 0.185, rot: -45 },
        { type: 'ellipse', cx: 0.500, cy: 0.555, a: 0.330, b: 0.155, rot: 45 },
        { type: 'ellipse', cx: 0.500, cy: 0.555, a: 0.330, b: 0.155, rot: -45 }
      ]
    };
  }

  function contains(shape, x, y) {
    if (shape.type === 'circle') {
      var dx = x - shape.cx, dy = y - shape.cy;
      return dx * dx + dy * dy <= shape.r * shape.r;
    }
    var th = -shape.rot * Math.PI / 180;
    var ux = x - shape.cx, uy = y - shape.cy;
    var rx = ux * Math.cos(th) - uy * Math.sin(th);
    var ry = ux * Math.sin(th) + uy * Math.cos(th);
    return (rx * rx) / (shape.a * shape.a) + (ry * ry) / (shape.b * shape.b) <= 1;
  }

  /** 网格采样 → 每个 membership mask 的几何质心（与数据无关） */
  function regionCentroids(shapes, N) {
    var out = new Map();
    for (var i = 0; i < N; i++) {
      var x = (i + 0.5) / N;
      for (var j = 0; j < N; j++) {
        var y = (j + 0.5) / N;
        var mask = 0;
        for (var k = 0; k < shapes.length; k++) if (contains(shapes[k], x, y)) mask |= (1 << k);
        if (mask === 0) continue;
        var cur = out.get(mask);
        if (!cur) { cur = { sx: 0, sy: 0, n: 0 }; out.set(mask, cur); }
        cur.sx += x; cur.sy += y; cur.n++;
      }
    }
    var res = new Map();
    out.forEach(function (v, k) { res.set(k, { x: v.sx / v.n, y: v.sy / v.n, area: v.n }); });
    return res;
  }

  function shapePath(shape, scale, offX, offY) {
    var cx = offX + shape.cx * scale, cy = offY + shape.cy * scale;
    if (shape.type === 'circle') {
      return { tag: 'circle', attrs: { cx: cx, cy: cy, r: shape.r * scale } };
    }
    return {
      tag: 'ellipse',
      attrs: {
        cx: cx, cy: cy, rx: shape.a * scale, ry: shape.b * scale,
        transform: 'rotate(' + shape.rot + ' ' + cx + ' ' + cy + ')'
      }
    };
  }

  /** 集合名标签位置：从独有区域质心向外延伸，直到离开所有形状之外 */
  function outwardLabelPos(shapeIdx, centroid, shapes) {
    var dx = centroid.x - 0.5, dy = centroid.y - 0.5;
    var L = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= L; dy /= L;
    var t = 0, best = { x: centroid.x, y: centroid.y, dx: dx, dy: dy };
    for (var s = 0; s < 90; s++) {
      t += 0.008;
      var nx = centroid.x + dx * t, ny = centroid.y + dy * t;
      var inside = false;
      for (var k = 0; k < shapes.length; k++) if (contains(shapes[k], nx, ny)) { inside = true; break; }
      best = { x: nx, y: ny, dx: dx, dy: dy };
      if (!inside) { best.x = nx + dx * 0.018; best.y = ny + dy * 0.018; break; }
    }
    return best;
  }

  /* ----------------------------- 数据计算 -------------------------------- */

  function computeRegions(sets) {
    var idx = new Map();
    sets.forEach(function (s2, i) {
      s2.elements.forEach(function (e) {
        if (!idx.has(e)) idx.set(e, 0);
        idx.set(e, idx.get(e) | (1 << i));
      });
    });
    var regions = new Map();
    idx.forEach(function (mask, gene) {
      if (!regions.has(mask)) regions.set(mask, []);
      regions.get(mask).push(gene);
    });
    return { regions: regions, universe: idx };
  }

  function maskLabel(mask, names) {
    var parts = [];
    for (var i = 0; i < names.length; i++) if (mask & (1 << i)) parts.push(names[i]);
    return parts.join(' ∩ ');
  }

  /* ------------------------------- 绘图 --------------------------------- */

  function drawVenn(container, sets, regionMap, opt) {
    var n = sets.length;
    var width = opt.width || 660;
    var height = opt.height || (n === 4 ? 470 : 400);
    var scale = Math.min(width - 60, height - 70);
    var offX = (width - scale) / 2, offY = (height - scale) / 2 + 6;
    var colors = sets.map(function (_, i) { return WB.plot.palette(i); });
    var shapes = (n === 2 ? layout2() : n === 3 ? layout3() : layout4()).shapes;

    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var px = function (v) { return offX + v * scale; };
    var py = function (v) { return offY + v * scale; };

    // 形状
    shapes.forEach(function (sp, i) {
      var p = shapePath(sp, scale, offX, offY);
      p.attrs.fill = colors[i];
      p.attrs['fill-opacity'] = n === 2 ? 0.30 : 0.22;
      p.attrs.stroke = colors[i];
      p.attrs['stroke-width'] = 1.8;
      root.appendChild(S(p.tag, p.attrs));
    });

    var centroids = regionCentroids(shapes, n === 4 ? 340 : 280);

    // 集合名（置于形状外，带引线）
    shapes.forEach(function (sp, i) {
      var c = centroids.get(1 << i) || { x: sp.cx, y: sp.cy };
      var lp = outwardLabelPos(i, c, shapes);
      var lx = px(lp.x), ly = py(lp.y);
      var anchor = lp.dx > 0.25 ? 'start' : (lp.dx < -0.25 ? 'end' : 'middle');
      var tx = anchor === 'start' ? lx + 3 : (anchor === 'end' ? lx - 3 : lx);
      var ty = ly + (Math.abs(lp.dx) > 0.25 ? 4 : (lp.dy > 0 ? 15 : -5));
      tx = WB.clamp(tx, anchor === 'start' ? 6 : (anchor === 'end' ? 6 : 8), width - 6);
      ty = WB.clamp(ty, 14, height - 6);
      // 引线
      root.appendChild(S('line', {
        x1: px(c.x), y1: py(c.y), x2: lx, y2: ly,
        stroke: colors[i], 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.8
      }));
      root.appendChild(S('circle', { cx: lx, cy: ly, r: 3.2, fill: colors[i] }));
      var nameTxt = WB.plot.txt(tx, ty, WB.plot.ellipsis(sets[i].name, 18), {
        'text-anchor': anchor, 'font-size': 12.5, 'font-weight': 700, fill: colors[i]
      });
      root.appendChild(nameTxt);
      WB.plot.bindTip(nameTxt, function () {
        return '<b>' + sets[i].name + '</b><br>' + lb('venn.memberCount', sets[i].elements.length);
      });
    });

    // 各区域计数
    var showAll = opt.showEmpty !== false;
    var placed = [];
    for (var m = 1; m < (1 << n); m++) {
      var c2 = centroids.get(m);
      if (!c2) continue;
      var genes = regionMap.get(m) || [];
      if (!genes.length && !showAll) continue;
      var x = px(c2.x), y = py(c2.y);
      var guard = 0;
      while (guard < 14 && placed.some(function (p2) {
        return Math.abs(p2.x - x) < 21 && Math.abs(p2.y - y) < 13;
      })) { y += 11; guard++; }
      placed.push({ x: x, y: y });

      var t = WB.plot.txt(x, y + 4, String(genes.length), {
        'text-anchor': 'middle', 'font-size': 13.5,
        'font-weight': genes.length ? 700 : 400,
        fill: genes.length ? '#22303c' : '#b9c5cf'
      });
      root.appendChild(t);
      WB.plot.bindTip(t, function () {
        var title = maskLabel(m, sets.map(function (s3) { return s3.name; }));
        var body = genes.length
          ? '<div style="margin-top:4px">' + genes.slice(0, 12).join(', ') +
          (genes.length > 12 ? ' ' + T('common.andMore', { n: genes.length }) : '') + '</div>'
          : '<div style="margin-top:4px;opacity:.7">' + T('common.noOverlap') + '</div>';
        return '<b>' + title + '</b><br>' + lb('common.count', genes.length) + body;
      });
    }

    // 底部图例
    WB.plot.legendCategorical(container, sets.map(function (s4, i) {
      return { color: colors[i], label: s4.name + ' (' + s4.elements.length + ')' };
    }));
    return canvas.svg;
  }

  /* ------------------------------ 模块入口 ------------------------------- */

  var FORMATS = [
    {
      name: '长表（推荐）',
      filename: 'venn_template_long.tsv',
      desc: '<b>两列，一行一个成员关系</b>：第一列是集合名，第二列是元素（基因）名。<br>' +
        '同一个元素出现在多个集合中时，写多行即可（<code>Element</code> 列会重复）。' +
        '这是最通用的格式，集合数量不限。',
      sample: 'Set\tElement\nControl_up\tTP53\nControl_up\tBRCA1\nTreat24h_up\tTP53\nTreat24h_up\tMYC\nTreat24h_up\tEGFR'
    },
    {
      name: '宽表（0/1 矩阵）',
      filename: 'venn_template_wide.tsv',
      desc: '<b>第一列是元素名，其余每列一个集合</b>，值为 <code>1/0</code>（也识别 TRUE/FALSE、yes/no、是/否）。' +
        '适合从 Excel 透视表或 R/Python 导出的 membership 矩阵。',
      sample: 'Element\tControl_up\tTreat4h_up\tTreat24h_up\nTP53\t1\t1\t1\nBRCA1\t1\t0\t0\nMYC\t0\t0\t1\nEGFR\t0\t1\t1'
    },
    {
      name: '分列（每列一组）',
      filename: 'venn_template_columns.tsv',
      desc: '<b>第一行是集合名，每列下方是该集合的成员列表</b>，各列长度可以不一样（空单元格会被忽略）。' +
        '适用于将 Excel 中多个基因列表并排粘贴的情形。',
      sample: 'Control_up\tTreat4h_up\tTreat24h_up\nTP53\tTP53\tMYC\nBRCA1\tEGFR\tEGFR\nATM\tMYC\tCDK1\nRAD51\tCDK1\tAURKA'
    }
  ];

  WB.register({
    id: 'venn',
    name: '韦恩图',
    icon: '◉',
    color: '#2f6fb3',
    desc: '2~4 个基因/元素集合的重叠关系，自动计算每个区域的交集，并可导出交集基因列表。',
    tags: ['2-4 集合', '交集明细', 'SVG 导出'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('韦恩图') }),
        el('p', { text: T('输入若干集合的成员列表，自动计算并绘制交集区域；支持每个文件作为一个集合。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入集合数据',
        multipleFiles: true,
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.vennLong,
        placeholder: 'Set\tElement\nControl_up\tTP53\n...\n\n或直接把 Excel 中两列数据粘贴到这里',
        paramsTitle: '绘图参数',
        params: [
          {
            key: 'format', label: '数据格式', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动识别' },
              { value: 'long', label: '长表（集合 + 元素）' },
              { value: 'wide', label: '宽表（0/1 矩阵）' },
              { value: 'columns', label: '分列（每列一组）' }
            ]
          },
          { key: 'showEmpty', label: '显示数量为 0 的区域', type: 'checkbox', value: true },
          { key: 'showTable', label: '显示交集明细表', type: 'checkbox', value: true },
          { key: 'width', label: '图像宽度 (px)', type: 'number', value: 660, min: 360, max: 1400, step: 20 }
        ],
        runLabel: '开始分析',
        onRun: function (ctx) {
          var res = WB.$('#venn-result');
          WB.clear(res);
          var sets, srcNote;

          if (ctx.files && ctx.files.length >= 2) {
            sets = ctx.files.map(function (txt, i) {
              var name = (ctx.fileNames[i] || ('Set' + (i + 1))).replace(/\.[^.]+$/, '');
              return { name: name, elements: WB.parse.parseGeneList(txt) };
            }).filter(function (s) { return s.elements.length; });
            srcNote = T('来自 {n} 个上传文件（每个文件 = 一个集合）', { n: sets.length });
          } else {
            var parsed = WB.parse.parseSets(ctx.text, { format: ctx.values.format });
            sets = parsed.sets;
            srcNote = T('格式识别为：{fmt}', { fmt: T({ long: '长表', wide: '宽表（0/1）', columns: '分列' }[parsed.format] || parsed.format) });
          }

          if (sets.length < 2) throw new Error(T('至少需要 2 个集合（当前识别到 {n} 个），请检查输入格式', { n: sets.length }));
          if (sets.length > 6) {
            res.appendChild(WB.ui.alertBox('warn',
              T('识别到 {n} 个集合。韦恩图最多清晰展示 4 个集合，<b>建议改用 UpSet 图</b>（左侧导航「UpSet 图」）来展示多集合交集。以下是交集明细表。',
                { n: sets.length })));
          } else if (sets.length > 4) {
            res.appendChild(WB.ui.alertBox('warn',
              T('识别到 {n} 个集合，超过 4 个后韦恩图区域无法准确呈现（这是几何限制）。<b>建议改用 UpSet 图</b>。以下仅给出交集明细表。',
                { n: sets.length })));
          }

          var names = sets.map(function (s) { return s.name; });
          var cr = computeRegions(sets);

          /* 统计条 */
          var all = [];
          cr.universe.forEach(function (_, g) { all.push(g); });
          res.appendChild(WB.ui.statBar([
            { label: T('集合数'), value: sets.length },
            { label: T('唯一元素数'), value: all.length },
            { label: T('非空交集区域'), value: cr.regions.size },
            { label: T('出现在 ≥2 个集合'), value: Array.from(cr.regions.keys()).filter(function (m) { return popcount(m) >= 2; }).length, tone: 'purple' }
          ]));

          /* 图形 */
          var figCard = WB.ui.resultCard(T('韦恩图'), []);
          res.appendChild(figCard);
          var figBody = figCard.querySelector('.card-body');
          figBody.appendChild(el('div.src-note', { text: srcNote }));
          var holder = el('div.plot-holder');
          figBody.appendChild(holder);

          if (sets.length <= 4) {
            var svg = drawVenn(holder, sets, cr.regions, {
              showEmpty: ctx.values.showEmpty, width: Number(ctx.values.width) || 660
            });
            WB.plot.addToolbar(figBody, {
              getSvg: function () { return svg; }, basename: 'venn'
            });
          } else {
            WB.plot.emptyState(holder, T('venn.tooMany'));
          }

          /* 集合大小条形（横向） */
          var barCard = WB.ui.resultCard(T('各集合成员数'));
          res.appendChild(barCard);
          drawSetBars(barCard.querySelector('.card-body'), sets, all.length);

          /* 交集明细表 */
          if (ctx.values.showTable !== false) {
            var tCard = WB.ui.resultCard(T('交集明细（可导出基因列表）'));
            res.appendChild(tCard);
            var tBody = tCard.querySelector('.card-body');
            var rows = [];
            cr.regions.forEach(function (genes, mask) {
              rows.push({
                region: maskLabel(mask, names),
                degree: popcount(mask),
                count: genes.length,
                genes: genes,
                pct: all.length ? genes.length / all.length : 0,
                mask: mask
              });
            });
            rows.sort(function (a, b) { return b.count - a.count || a.degree - b.degree; });
            // 补上空的区域（单集合为空不列）
            var cols = [
              { key: 'region', label: T('交集区域') },
              { key: 'degree', label: T('集合数'), align: 'right', width: 70 },
              { key: 'count', label: T('元素数'), align: 'right', width: 80 },
              { key: 'pct', label: T('占比'), align: 'right', width: 80, format: function (r) { return (r.pct * 100).toFixed(2) + '%'; } },
              {
                key: 'genes', label: T('元素列表（前 30 项）'), format: function (r) {
                  return r.genes.slice(0, 30).join(', ') + (r.genes.length > 30 ? ' …' : '');
                }
              },
              {
                key: 'dl', label: T('下载'), width: 66,
                render: function (r) {
                  return el('button.btn.btn-ghost.btn-xs', {
                    text: 'TSV', title: T('导出该区域的全部元素'),
                    onclick: function () {
                      WB.downloadText(r.genes.join('\n'), 'venn_region_' + r.mask + '.tsv', 'text/tab-separated-values');
                    }
                  });
                }
              }
            ];
            WB.ui.dataTable(tBody, cols, rows, { pageSize: 30, exportName: 'venn_regions' });
            tBody.appendChild(el('div.preview-note', {
              text: T('「下载」按钮导出该区域的全部元素；表格右上角可导出全部区域汇总。')
            }));
          }

          /* 两两交集矩阵 */
          if (sets.length >= 3) {
            var pCard = WB.ui.resultCard(T('两两交集矩阵'));
            res.appendChild(pCard);
            drawPairMatrix(pCard.querySelector('.card-body'), sets);
          }
        }
      });

      main.appendChild(panel.root);

      var resWrap = el('div.tool-grid');
      resWrap.id = 'venn-result';
      main.appendChild(resWrap);

      // 初始化时自动载入示例数据，便于直接查看输出效果
      if (!WB._vennDemoLoaded) {
        WB._vennDemoLoaded = true;
        panel.setText(WB.demo.vennLong);
      }
    }
  });

  function popcount(x) { var c = 0; while (x) { c += x & 1; x >>= 1; } return c; }

  // 供几何自检使用
  WB._vennGeom = {
    layout2: layout2, layout3: layout3, layout4: layout4,
    contains: contains, regionCentroids: regionCentroids
  };

  /* --------------------------- 辅助图形 ---------------------------------- */

  function drawSetBars(container, sets, total) {
    WB.clear(container);
    var w = 640, barH = 22, gap = 10;
    var h = sets.length * (barH + gap) + 46;
    var c = WB.plot.createSVG(container, w, h, {});
    var labelW = 128, rightW = 62;
    var maxV = Math.max.apply(null, sets.map(function (s) { return s.elements.length; }));
    var innerW = w - labelW - rightW - 30;
    sets.forEach(function (s, i) {
      var y = 16 + i * (barH + gap);
      var bw = maxV ? innerW * s.elements.length / maxV : 0;
      c.root.appendChild(WB.plot.txt(labelW - 10, y + 15, WB.plot.ellipsis(s.name, 18), {
        'text-anchor': 'end', 'font-size': 12.5, fill: WB.plot.TEXT
      }));
      c.root.appendChild(S('rect', {
        x: labelW, y: y, width: innerW, height: barH, rx: 3, fill: '#f0f4f8'
      }));
      var r = S('rect', { x: labelW, y: y, width: bw, height: barH, rx: 3, fill: WB.plot.palette(i), 'fill-opacity': 0.85 });
      c.root.appendChild(r);
      WB.plot.bindTip(r, function () {
        return '<b>' + s.name + '</b><br>' + lb('venn.memberCount', s.elements.length) + '<br>' +
          lb('venn.pctOfAllSets', (total ? (s.elements.length / total * 100).toFixed(1) : 0) + '%');
      });
      c.root.appendChild(WB.plot.txt(labelW + innerW + 8, y + 15, s.elements.length, {
        'font-size': 12, fill: WB.plot.MUTED
      }));
    });
  }

  function drawPairMatrix(container, sets) {
    WB.clear(container);
    var n = sets.length;
    var cell = 62, labelW = 118, topH = 64;
    var w = labelW + n * cell + 24, h = topH + n * cell + 14;
    var c = WB.plot.createSVG(container, w, h, {});
    var map = new Map();
    sets.forEach(function (s, i) { s.elements.forEach(function (g) { map.set(g + '|' + i, 1); }); });
    var setsIdx = sets.map(function (s) { return new Set(s.elements); });
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var val;
        if (i === j) val = sets[i].elements.length;
        else {
          val = 0;
          setsIdx[i].forEach(function (g) { if (setsIdx[j].has(g)) val++; });
        }
        var maxInter = Math.min(sets[i].elements.length, sets[j].elements.length) || 1;
        var t = i === j ? 1 : val / maxInter;
        var f = WB.plot.ramp('blues');
        var x = labelW + j * cell, y = topH + i * cell;
        var rect = S('rect', {
          x: x + 1, y: y + 1, width: cell - 2, height: cell - 2, rx: 4,
          fill: i === j ? '#e8eef4' : f(0.18 + 0.82 * t), stroke: '#fff'
        });
        c.root.appendChild(rect);
        c.root.appendChild(WB.plot.txt(x + cell / 2, y + cell / 2 + 4, val, {
          'text-anchor': 'middle', 'font-size': 12.5,
          fill: (!i === !j) ? WB.plot.TEXT : (t > 0.5 ? '#fff' : WB.plot.TEXT)
        }));
        WB.plot.bindTip(rect, function () {
          return '<b>' + sets[i].name + (i === j ? '' : ' ∩ ' + sets[j].name) + '</b><br>' +
            (i === j ? lb('venn.singleSet', val) : lb('venn.overlapOf', val)) + ' ' + T('common.elements');
        });
      }
    }
    for (var k = 0; k < n; k++) {
      var t1 = WB.plot.txt(labelW + k * cell + cell / 2, topH - 10, WB.plot.ellipsis(sets[k].name, 9), {
        'text-anchor': 'start', 'font-size': 11.5, fill: WB.plot.TEXT,
        transform: 'rotate(-42 ' + (labelW + k * cell + cell / 2) + ' ' + (topH - 10) + ')'
      });
      c.root.appendChild(t1);
      c.root.appendChild(WB.plot.txt(labelW - 10, topH + k * cell + cell / 2 + 4, WB.plot.ellipsis(sets[k].name, 16), {
        'text-anchor': 'end', 'font-size': 11.5, fill: WB.plot.TEXT
      }));
    }
    container.appendChild(el('div.preview-note', { text: T('venn.pairNote') }));
  }
})(window);
