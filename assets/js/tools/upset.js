/* =============================================================================
 * tools/upset.js  —  UpSet 图（多集合交集可视化，集合数 ≥ 2）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t, lb = WB.lab;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '长表（推荐）': 'Long table (recommended)',
    '<b>两列</b>：第一列集合名，第二列元素名；一个元素属于多个集合就写多行。集合数量不限（建议 ≤ 8）。':
      '<b>Two columns</b>: the first is the set name, the second the element name; write one row per set an element belongs to. No limit on the number of sets (≤ 8 recommended).',
    '宽表（0/1 矩阵）': 'Wide table (0/1 matrix)',
    '第一列元素名，其余每列一个集合，值 <code>1/0</code>。':
      'The first column is the element name; each remaining column is one set, with values <code>1/0</code>.',
    '分列（每列一组）': 'Separate columns (one set per column)',
    '第一行集合名，每列下方为该集合成员，长度可不等。':
      'The first row holds set names; each column lists its members below, and columns may have different lengths.',
    'UpSet 图': 'UpSet plot',
    '集合数多于 4 个时展示交集的最佳方式：交集体量柱状图 + 成员点阵矩阵。':
      'Recommended for showing intersections when there are more than 4 sets: intersection-size bars plus a membership dot matrix.',
    '2-8 集合': '2–8 sets',
    '把每个交集画成一根柱子，柱子下方的点阵表示它由哪些集合相交而成。集合多、交集复杂时比韦恩图更清晰。':
      'Each intersection is drawn as a bar, and the dot matrix below shows which sets combine to form it. Clearer than a Venn diagram when there are many sets and complex overlaps.',
    '输入集合数据': 'Input set data',
    '绘图参数': 'Plot parameters',
    '数据格式': 'Data format',
    '自动识别': 'Auto-detect',
    '长表（集合 + 元素）': 'Long table (set + element)',
    '交集排序': 'Intersection sorting',
    '按交集大小（降序）': 'By intersection size (descending)',
    '按交集大小（升序）': 'By intersection size (ascending)',
    '按涉及集合数': 'By degree',
    '按集合组合顺序': 'By set combination order',
    '点阵行顺序': 'Dot-matrix row order',
    '按集合大小': 'By set size',
    '按输入顺序': 'By input order',
    '最多显示交集数': 'Max intersections shown',
    '最小交集大小': 'Min intersection size',
    '过滤小集合（< n 的集合不显示）': 'Filter small sets (hide sets with < n elements)',
    '开始分析': 'Run analysis',
    '至少需要 2 个集合（当前 {n} 个）': 'At least 2 sets are required (currently {n}).',
    '集合数过多（{n}），请先合并或筛选到 12 个以内': 'Too many sets ({n}); please merge or filter down to 12 or fewer.',
    '没有满足条件的交集（最小交集大小 = {n}），请放宽参数': 'No intersections match the criteria (min intersection size = {n}); please relax the parameters.',
    '集合数': 'Sets',
    '唯一元素数': 'Unique elements',
    '非空交集组合': 'Non-empty intersections',
    '仅属单一集合': 'Unique to one set',
    '当前展示': 'Showing',
    '满足条件的交集共 <b>{n}</b> 个，当前按「{sort}」展示前 <b>{topN}</b> 个。可调整「最多显示交集数」查看全部。':
      'There are <b>{n}</b> intersections matching the criteria; showing the top <b>{topN}</b> sorted by “{sort}”. Adjust “Max intersections shown” to view all.',
    '交集大小降序': 'intersection size (desc.)',
    '交集大小升序': 'intersection size (asc.)',
    '涉及集合数': 'degree',
    '集合组合顺序': 'set combination order',
    '交集元素：': 'Intersection elements: ',
    '{n} 个': '{n} elements',
    '复制': 'Copy',
    '导出 TSV': 'Export TSV',
    '交集统计表': 'Intersection statistics',
    '交集组合': 'Intersection',
    '交集大小': 'Intersection size',
    '占比': '% of all elements',
    '元素（前 30 项）': 'Elements (top 30)',
    '下载': 'Download',
    '导出该交集全部元素': 'Export all elements of this intersection'
  });

  var FORMATS = [
    {
      name: '长表（推荐）',
      filename: 'upset_template_long.tsv',
      desc: '<b>两列</b>：第一列集合名，第二列元素名；一个元素属于多个集合就写多行。集合数量不限（建议 ≤ 8）。',
      sample: 'Set\tElement\nControl_up\tTP53\nControl_up\tBRCA1\nTreat4h_up\tTP53\nTreat4h_up\tEGFR\nTreat24h_up\tTP53\nTreat24h_up\tMYC\nTreat24h_up\tEGFR'
    },
    {
      name: '宽表（0/1 矩阵）',
      filename: 'upset_template_wide.tsv',
      desc: '第一列元素名，其余每列一个集合，值 <code>1/0</code>。',
      sample: 'Element\tS1\tS2\tS3\nTP53\t1\t1\t1\nBRCA1\t1\t0\t0\nMYC\t0\t0\t1\nEGFR\t0\t1\t1'
    },
    {
      name: '分列（每列一组）',
      filename: 'upset_template_columns.tsv',
      desc: '第一行集合名，每列下方为该集合成员，长度可不等。',
      sample: 'S1\tS2\tS3\nTP53\tTP53\tTP53\nBRCA1\tEGFR\tMYC\nATM\tMYC\tEGFR'
    }
  ];

  function computeIntersections(sets) {
    var idx = new Map();
    sets.forEach(function (s, i) {
      s.elements.forEach(function (e) {
        idx.set(e, (idx.get(e) || 0) | (1 << i));
      });
    });
    var counts = new Map(), members = new Map();
    idx.forEach(function (mask, gene) {
      if (!counts.has(mask)) { counts.set(mask, 0); members.set(mask, []); }
      counts.set(mask, counts.get(mask) + 1);
      members.get(mask).push(gene);
    });
    return { counts: counts, members: members, universeSize: idx.size, memberIndex: idx };
  }

  function draw(container, sets, inter, opt, onPick) {
    var n = sets.length;
    var nameW = Math.min(150, Math.max.apply(null, sets.map(function (s) { return s.name.length * 7 + 14; })));
    nameW = WB.clamp(nameW, 70, 170);
    var setBarW = 86;
    var colW = inter.length <= 26 ? 30 : (inter.length <= 55 ? 20 : 15);
    var matrixW = colW * inter.length;
    var width = Math.max(640, nameW + setBarW + matrixW + 46);
    var topH = 138, gapTop = 12, rowH = 19, gapBot = 30;
    var matrixH = n * rowH;
    var height = topH + gapTop + matrixH + gapBot;
    var x0 = nameW + setBarW + 22;         // 点阵起点
    var yTop = topH;                        // 交集体量条基线
    var yMatrix = topH + gapTop;            // 点阵顶部

    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;

    var maxCount = Math.max.apply(null, inter.map(function (d) { return d.size; }));
    var rowOrder = opt.rowSort === 'input' ? sets.map(function (_, i) { return i; })
      : sets.map(function (_, i) { return i; }).sort(function (a, b) { return sets[b].elements.length - sets[a].elements.length; });
    var rowY = new Map();
    rowOrder.forEach(function (si, r) { rowY.set(si, yMatrix + r * rowH + rowH / 2); });
    var maxSetSize = Math.max.apply(null, sets.map(function (s) { return s.elements.length; }));

    /* ---- 左侧：集合名 + 集合大小条 ---- */
    var axisX = nameW;
    root.appendChild(S('line', {
      x1: axisX, y1: yMatrix - 4, x2: axisX, y2: yMatrix + matrixH + 2,
      stroke: '#c9d5df', 'shape-rendering': 'crispEdges'
    }));
    sets.forEach(function (s, i) {
      var y = rowY.get(i);
      var bw = maxSetSize ? setBarW * s.elements.length / maxSetSize : 0;
      root.appendChild(WB.plot.txt(nameW - 10, y + 4.5, WB.plot.ellipsis(s.name, 20), {
        'text-anchor': 'end', 'font-size': 12, fill: WB.plot.TEXT
      }));
      var rect = S('rect', {
        x: axisX, y: y - 7, width: Math.max(1.5, bw), height: 14, rx: 3,
        fill: WB.plot.palette(i), 'fill-opacity': 0.8
      });
      root.appendChild(rect);
      WB.plot.bindTip(rect, function () {
        return '<b>' + s.name + '</b><br>' + lb('upset.setSizeTip', s.elements.length) + ' ' + T('upset.elements');
      });
      var t = WB.plot.txt(axisX + bw + 6, y + 4.5, s.elements.length, {
        'font-size': 10.5, fill: WB.plot.MUTED
      });
      root.appendChild(t);
    });

    /* ---- 顶部：交集体量柱状图 ---- */
    var barH = 104;
    var yScale = function (v) { return yTop - (maxCount ? barH * v / maxCount : 0); };
    // y 轴刻度
    WB.niceTicks(0, maxCount, 4).forEach(function (tv) {
      if (tv > maxCount) return;
      var yy = yScale(tv);
      root.appendChild(S('line', { x1: axisX - 5, y1: yy, x2: axisX, y2: yy, stroke: '#c9d5df' }));
      root.appendChild(WB.plot.txt(axisX - 8, yy + 3.5, String(tv), { 'text-anchor': 'end', 'font-size': 10, fill: WB.plot.MUTED }));
    });
    root.appendChild(S('line', { x1: axisX, y1: yTop, x2: width - 28, y2: yTop, stroke: '#c9d5df', 'shape-rendering': 'crispEdges' }));

    var dots = [];
    inter.forEach(function (d, j) {
      var cx = x0 + j * colW + colW / 2;
      var bh = maxCount ? barH * d.size / maxCount : 0;
      var rect = S('rect', {
        x: cx - Math.max(2, colW * 0.33), y: yTop - bh, height: Math.max(1, bh),
        width: Math.max(4, colW * 0.66), rx: 2.5,
        fill: d.size ? WB.plot.palette(d.degree - 1) : '#e9eef3',
        'fill-opacity': 0.9
      });
      root.appendChild(rect);
      if (d.size) {
        var lab = WB.plot.txt(cx, yTop - bh - 5, String(d.size), {
          'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED
        });
        root.appendChild(lab);
      }
      var tipHtml = function () {
        var names = [];
        for (var i = 0; i < n; i++) if (d.mask & (1 << i)) names.push(sets[i].name);
        return '<b>' + names.join(' ∩ ') + '</b><br>' + lb('upset.interSizeTip', d.size) +
          '<br>' + T('upset.involvesSets', { n: d.degree }) +
          '<div style="margin-top:4px;max-width:280px;white-space:normal">' +
          (d.genes.slice(0, 15).join(', ') + (d.genes.length > 15 ? ' …' : '')) + '</div>' +
          '<div style="margin-top:4px;opacity:.75">' + T('upset.clickForAll') + '</div>';
      };
      WB.plot.bindTip(rect, tipHtml);

      /* 点阵列 */
      var colDots = [];
      rowOrder.forEach(function (si) {
        var on = !!(d.mask & (1 << si));
        var y = rowY.get(si);
        var c = S('circle', {
          cx: cx, cy: y, r: on ? 5.2 : 4.2,
          fill: on ? WB.plot.palette(si) : '#eef2f6',
          stroke: on ? 'none' : '#d5dee6', 'stroke-width': 1
        });
        root.appendChild(c);
        colDots.push({ node: c, on: on, y: y });
        if (on) WB.plot.bindTip(c, tipHtml);
      });
      // 连接线
      var ys = colDots.filter(function (d2) { return d2.on; }).map(function (d2) { return d2.y; });
      if (ys.length > 1) {
        var line = S('line', {
          x1: cx, y1: Math.min.apply(null, ys), x2: cx, y2: Math.max.apply(null, ys),
          stroke: '#9db1c2', 'stroke-width': 2.2
        });
        root.insertBefore(line, colDots[0].node);
      }
      dots.push({ cx: cx, col: colDots, bar: rect, data: d });

      // 点击查看该交集全部元素
      rect.addEventListener('click', function () { onPick(d); });
    });

    // 点阵行分隔参考线
    if (n > 1) {
      rowOrder.forEach(function (si) {
        root.appendChild(S('line', {
          x1: x0 - 6, y1: rowY.get(si), x2: width - 28, y2: rowY.get(si),
          stroke: '#f2f6f9', 'shape-rendering': 'crispEdges'
        }));
      });
    }
    return canvas.svg;
  }

  WB.register({
    id: 'upset',
    name: 'UpSet 图',
    icon: '≣',
    color: '#0f8f8f',
    desc: '集合数多于 4 个时展示交集的最佳方式：交集体量柱状图 + 成员点阵矩阵。',
    tags: ['2-8 集合', '交集排序', 'Top-N'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('UpSet 图') }),
        el('p', { text: T('把每个交集画成一根柱子，柱子下方的点阵表示它由哪些集合相交而成。集合多、交集复杂时比韦恩图更清晰。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入集合数据',
        multipleFiles: true,
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.vennLong,
        placeholder: 'Set\tElement\nS1\tTP53\nS1\tBRCA1\nS2\tTP53\n...',
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
          {
            key: 'sort', label: '交集排序', type: 'select', value: 'size',
            options: [
              { value: 'size', label: '按交集大小（降序）' },
              { value: 'sizeAsc', label: '按交集大小（升序）' },
              { value: 'degree', label: '按涉及集合数' },
              { value: 'mask', label: '按集合组合顺序' }
            ]
          },
          {
            key: 'rowSort', label: '点阵行顺序', type: 'select', value: 'size',
            options: [{ value: 'size', label: '按集合大小' }, { value: 'input', label: '按输入顺序' }]
          },
          { key: 'topN', label: '最多显示交集数', type: 'number', value: 25, min: 3, max: 200, step: 1 },
          { key: 'minSize', label: '最小交集大小', type: 'number', value: 1, min: 1, max: 10000, step: 1 },
          { key: 'minSetSize', label: '过滤小集合（< n 的集合不显示）', type: 'number', value: 0, min: 0, max: 100000, step: 1 }
        ],
        runLabel: '开始分析',
        onRun: function (ctx) {
          var res = WB.$('#upset-result');
          WB.clear(res);
          var sets;
          if (ctx.files && ctx.files.length >= 2) {
            sets = ctx.files.map(function (txt, i) {
              return {
                name: (ctx.fileNames[i] || ('S' + (i + 1))).replace(/\.[^.]+$/, ''),
                elements: WB.parse.parseGeneList(txt)
              };
            });
          } else {
            sets = WB.parse.parseSets(ctx.text, { format: ctx.values.format }).sets;
          }
          var minSetSize = Number(ctx.values.minSetSize) || 0;
          if (minSetSize > 0) sets = sets.filter(function (s) { return s.elements.length >= minSetSize; });
          if (sets.length < 2) throw new Error(T('至少需要 2 个集合（当前 {n} 个）', { n: sets.length }));
          if (sets.length > 12) throw new Error(T('集合数过多（{n}），请先合并或筛选到 12 个以内', { n: sets.length }));

          var ci = computeIntersections(sets);
          var minSize = Math.max(1, Number(ctx.values.minSize) || 1);
          var all = [];
          ci.counts.forEach(function (c, mask) {
            if (c < minSize) return;
            var d = popcount(mask), genes = ci.members.get(mask);
            all.push({
              mask: mask, size: c, degree: d, genes: genes,
              pct: ci.universeSize ? c / ci.universeSize : 0,
              setsList: (function () {
                var a = []; for (var i = 0; i < sets.length; i++) if (mask & (1 << i)) a.push(sets[i].name); return a;
              })()
            });
          });
          var sortMode = ctx.values.sort;
          all.sort(function (a, b) {
            if (sortMode === 'sizeAsc') return a.size - b.size || b.degree - a.degree;
            if (sortMode === 'degree') return b.degree - a.degree || b.size - a.size;
            if (sortMode === 'mask') return a.mask - b.mask;
            return b.size - a.size || b.degree - a.degree;
          });
          var filtered = all.length;
          var topN = Math.max(1, Number(ctx.values.topN) || 25);
          var shown = all.slice(0, topN);

          if (!shown.length) throw new Error(T('没有满足条件的交集（最小交集大小 = {n}），请放宽参数', { n: minSize }));

          /* 统计 */
          var single = 0;
          ci.counts.forEach(function (c, m) { if (popcount(m) === 1) single += c; });
          res.appendChild(WB.ui.statBar([
            { label: T('集合数'), value: sets.length },
            { label: T('唯一元素数'), value: ci.universeSize },
            { label: T('非空交集组合'), value: ci.counts.size },
            { label: T('仅属单一集合'), value: single, tone: 'purple' },
            { label: T('当前展示'), value: shown.length + ' / ' + filtered }
          ]));

          if (filtered > topN) {
            res.appendChild(WB.ui.alertBox('info',
              T('满足条件的交集共 <b>{n}</b> 个，当前按「{sort}」展示前 <b>{topN}</b> 个。可调整「最多显示交集数」查看全部。',
                { n: filtered, sort: labelOf(sortMode), topN: topN })));
          }

          var card = WB.ui.resultCard(T('UpSet 图'));
          res.appendChild(card);
          var body = card.querySelector('.card-body');
          var holder = el('div.plot-holder');
          body.appendChild(holder);

          var pickBox = el('div.pick-box');
          body.appendChild(pickBox);

          function onPick(d) {
            WB.clear(pickBox);
            pickBox.appendChild(el('div.pick-head', [
              el('span', { text: T('交集元素：') + d.setsList.join(' ∩ ') }),
              el('span.pick-count', { text: T('{n} 个', { n: d.size }) })
            ]));
            var ta = el('textarea.paste-area', { rows: 6, readonly: true });
            ta.value = d.genes.join('\n');
            ta.style.minHeight = '110px';
            pickBox.appendChild(ta);
            pickBox.appendChild(el('div.format-actions', [
              el('button.btn.btn-ghost.btn-xs', { text: T('复制'), onclick: function () { WB.copyText(d.genes.join('\n')); } }),
              el('button.btn.btn-ghost.btn-xs', {
                text: T('导出 TSV'), onclick: function () {
                  WB.downloadText(d.genes.join('\n'), 'upset_intersection_' + d.mask + '.tsv', 'text/tab-separated-values');
                }
              })
            ]));
          }

          var svg = draw(holder, sets, shown, {
            rowSort: ctx.values.rowSort
          }, onPick);
          WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'upset' });

          /* 结果表 */
          var tCard = WB.ui.resultCard(T('交集统计表'));
          res.appendChild(tCard);
          var tBody = tCard.querySelector('.card-body');
          var rows = all.map(function (d) {
            return {
              sets: d.setsList.join(' ∩ '), degree: d.degree, size: d.size,
              pct: d.pct, genes: d.genes, mask: d.mask
            };
          });
          var table = WB.ui.dataTable(tBody, [
            { key: 'sets', label: T('交集组合') },
            { key: 'degree', label: T('集合数'), align: 'right', width: 70 },
            { key: 'size', label: T('交集大小'), align: 'right', width: 80 },
            { key: 'pct', label: T('占比'), align: 'right', width: 100, format: function (r) { return (r.pct * 100).toFixed(2) + '%'; } },
            {
              key: 'genes', label: T('元素（前 30 项）'), format: function (r) {
                return r.genes.slice(0, 30).join(', ') + (r.genes.length > 30 ? ' …' : '');
              }
            },
            {
              key: 'dl', label: T('下载'), width: 66,
              render: function (r) {
                return el('button.btn.btn-ghost.btn-xs', {
                  text: 'TSV', title: T('导出该交集全部元素'),
                  onclick: function () {
                    WB.downloadText(r.genes.join('\n'), 'upset_intersection_' + r.mask + '.tsv', 'text/tab-separated-values');
                  }
                });
              }
            }
          ], rows, { pageSize: 25, exportName: 'upset_intersections' });
        }
      });

      main.appendChild(panel.root);
      var resWrap = el('div.tool-grid');
      resWrap.id = 'upset-result';
      main.appendChild(resWrap);
      if (!WB._upsetDemoLoaded) {
        WB._upsetDemoLoaded = true;
        panel.setText(WB.demo.vennLong);
      }
    }
  });

  function popcount(x) { var c = 0; while (x) { c += x & 1; x >>= 1; } return c; }
  function labelOf(v) {
    return { size: T('交集大小降序'), sizeAsc: T('交集大小升序'), degree: T('涉及集合数'), mask: T('集合组合顺序') }[v] || v;
  }
})(window);
