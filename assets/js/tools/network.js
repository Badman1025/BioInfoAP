/* =============================================================================
 * tools/network.js  —  网络图（发表级）
 *
 *   输入：边列表 / 邻接矩阵 / 表达矩阵（按相关性自动建网）
 *   布局：力导向（Fruchterman–Reingold，确定性）/ 分组力导向 / 环形 / 网格
 *   映射：节点大小 ← 度或加权度；节点颜色 ← 分组；连线粗细 ← |权重|
 *   输出：图内自带标题、图例、节点与连线数据表；SVG（可编辑）与 4× PNG
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块元信息 */
    '网络图': 'Network plot',
    '网络图绘制': 'Network plot',
    '力导向布局': 'Force-directed layout',
    '节点度': 'Node degree',
    '发表级': 'Publication-grade',
    '按「来源—目标—权重」的边列表、邻接矩阵或表达矩阵构建网络，支持力导向/分组/环形/网格布局，节点大小与颜色、连线粗细均可映射，图内自带标题与图例，可导出 SVG 与高分辨率 PNG。':
      'Build a network from a source–target–weight edge list, an adjacency matrix or an expression matrix; force-directed, grouped, circular and grid layouts are available, node size/colour and edge width can be mapped to data, and the figure carries its own title and legends, exportable as SVG or high-resolution PNG.',
    '从边列表、邻接矩阵或表达矩阵构建网络图，节点大小映射连接数或权重、颜色映射分组，连线粗细映射权重，输出可直接用于投稿的矢量图。':
      'Build a network from an edge list, adjacency matrix or expression matrix; map node size to degree or weight and colour to group, scale edge width by weight, and export a submission-ready vector figure.',

    /* 输入格式 */
    '边列表（推荐）': 'Edge list (recommended)',
    '邻接矩阵': 'Adjacency matrix',
    '表达矩阵（按相关性建网）': 'Expression matrix (correlation network)',
    ['三列或四列：<b>来源</b>、<b>目标</b>、<b>权重</b>（可省略，默认 1）、<b>类型</b>（positive / negative，可省略）。' +
      '列名可用 Source/Target/Weight/Type 或 From/To/Weight/Sign；无列名时按列顺序读取。权重为相关系数时可直接填 −1 ~ 1。']:
      'Three or four columns: <b>source</b>, <b>target</b>, <b>weight</b> (optional, default 1) and <b>type</b> (positive / negative, optional). ' +
      'Column names may be Source/Target/Weight/Type or From/To/Weight/Sign; without a header row the columns are read in order. Correlation coefficients can be used directly as weights (−1 to 1).',
    ['方形矩阵：第一行与第一列为节点名，单元格为权重（0 表示无边）。按<b>无向</b>处理，只读取上三角，对角线忽略。']:
      'Square matrix: the first row and first column hold node names and the cells hold weights (0 means no edge). Treated as <b>undirected</b>: only the upper triangle is read and the diagonal is ignored.',
    ['行是基因（节点）、列是样本的表达矩阵；程序两两计算相关系数，|r| 达到阈值（可选 FDR 过滤）的基因对连边，' +
      '适合展示共表达模块。基因数建议 ≤ 400，否则组合数过多。']:
      'An expression matrix with genes (nodes) in rows and samples in columns; pairwise correlations are computed and gene pairs with |r| above the cutoff (optionally FDR-filtered) are connected, ' +
      'which is convenient for co-expression modules. We suggest ≤ 400 genes, otherwise the number of pairs becomes large.',

    /* 输入面板 */
    '输入网络数据': 'Input network data',
    '绘图参数': 'Figure settings',
    '输入类型': 'Input type',
    '布局算法': 'Layout',
    '力导向（推荐）': 'Force-directed (recommended)',
    '力导向 · 按分组聚集': 'Force-directed · grouped',
    '环形': 'Circular',
    '网格': 'Grid',
    '节点大小映射': 'Node size mapped to',
    '连接数（度）': 'Degree',
    '加权度（权重之和）': 'Weighted degree',
    '统一大小': 'Uniform',
    '节点颜色映射': 'Node colour mapped to',
    '分组（需填写节点属性）': 'Group (requires node attributes)',
    '连接数（渐变色）': 'Degree (continuous)',
    '单一颜色': 'Single colour',
    '基因标签': 'Node labels',
    '自动（节点多时只标连接数高的）': 'Auto (only highly connected nodes when crowded)',
    '全部显示': 'Show all',
    '不显示': 'Hide',
    '连线权重阈值 |w| ≥': 'Edge weight cutoff |w| ≥',
    '按正负相关着色连线': 'Colour edges by sign',
    '图题（可留空）': 'Figure title (optional)',
    '相关系数': 'Correlation coefficient',
    'Pearson（线性相关）': 'Pearson (linear)',
    'Spearman（秩相关）': 'Spearman (rank-based)',
    '连边相关性阈值 |r| ≥': 'Edge cutoff |r| ≥',
    '连边 FDR 过滤': 'Edge FDR filter',
    '不过滤': 'No filter',
    '绘制网络图': 'Draw network',

    /* 节点属性附加区 */
    '节点属性（可选）': 'Node attributes (optional)',
    '可给出每个节点的分组与自定义大小，用于颜色与大小映射；每行「节点名 <TAB> 分组名 [<TAB> 大小]」，可带表头。':
      'Optionally give each node a group and a custom size for colour/size mapping; one “node <TAB> group [<TAB> size]” row per line, a header row is allowed.',
    '插入示例属性': 'Insert example attributes',
    '已插入示例节点属性': 'Example node attributes inserted',

    /* 统计条与提示 */
    '节点数': 'Nodes',
    '连线数': 'Edges',
    '平均度': 'Mean degree',
    '最大度': 'Max degree',
    '连通分量': 'Components',
    '网络密度': 'Density',
    '未解析到有效的网络数据': 'No valid network data was parsed',
    '未解析到任何可用的连线': 'No usable edges were parsed',
    '节点数过多（{n}），请先筛选核心网络（建议 ≤ 400 个节点）。':
      'Too many nodes ({n}); please reduce to a core network first (we suggest ≤ 400 nodes).',
    '连线数过多（{n}），请提高权重阈值（建议 ≤ 4000 条连线）。':
      'Too many edges ({n}); raise the weight cutoff (we suggest ≤ 4000 edges).',
    '未指定节点属性，「节点颜色」已回退为单一颜色。':
      'No node attributes were provided, so “Node colour” fell back to a single colour.',
    '未指定节点属性，分组布局已回退为普通力导向布局。':
      'No node attributes were provided, so the grouped layout fell back to a plain force-directed layout.',
    '当前输入为边列表/邻接矩阵，「相关系数」「连边阈值」参数不参与计算。':
      'The input is an edge list or adjacency matrix, so the correlation parameters are not used.',
    '按相关性建网：共检验 {n} 个基因对，|r| ≥ {c} 且通过 FDR 过滤后保留 {k} 条连线。':
      'Correlation network: {n} gene pairs tested; {k} edges kept with |r| ≥ {c} after FDR filtering.',
    '节点大小映射为连接数；连线粗细映射 |权重|；颜色表示分组，红/蓝连线分别表示正/负相关。布局为确定性力导向，重复运行结果一致。':
      'Node size maps to degree; edge width maps to |weight|; colour denotes group and red/blue edges denote positive/negative correlation. The force-directed layout is deterministic, so repeated runs give the same figure.',
    '节点大小映射为加权度（相连权重之和）。': 'Node size maps to the weighted degree (sum of connected weights).',
    '导出 SVG 可在 Illustrator / Inkscape 中编辑文字与颜色；PNG 4× 适用于 300 dpi 投稿。':
      'Export SVG to edit text and colours in Illustrator / Inkscape; PNG at 4× is suitable for 300-dpi submission.',
    '{n} 个节点 · {m} 条连线': '{n} nodes · {m} edges',
    'PNG 4×': 'PNG 4×',
    '导出 4 倍分辨率位图': 'Export 4× bitmap',

    /* 结果卡片 */
    '网络图（{n} 个节点，{m} 条连线）': 'Network ({n} nodes, {m} edges)',
    '节点表': 'Node table',
    '边表': 'Edge table',
    '节点': 'Node',
    '分组': 'Group',
    '度': 'Degree',
    '加权度': 'Weighted degree',
    '来源': 'Source',
    '目标': 'Target',
    '权重': 'Weight',
    '方向': 'Direction',
    '正相关': 'Positive',
    '负相关': 'Negative',
    '节点大小': 'Node size',
    '连线粗细': 'Edge width',
    '权重：': 'Weight: ',
    '分组：': 'Group: ',
    '度：': 'Degree: ',
    '加权度：': 'Weighted degree: '
  });

  var FORMATS = [
    {
      name: '边列表（推荐）',
      filename: 'network_edges.tsv',
      desc: '三列或四列：<b>来源</b>、<b>目标</b>、<b>权重</b>（可省略，默认 1）、<b>类型</b>（positive / negative，可省略）。' +
        '列名可用 Source/Target/Weight/Type 或 From/To/Weight/Sign；无列名时按列顺序读取。权重为相关系数时可直接填 −1 ~ 1。',
      sample: 'Source\tTarget\tWeight\tType\n' +
        'MKI67\tCCNB1\t0.86\tpositive\n' +
        'MKI67\tTOP2A\t0.78\tpositive\n' +
        'CCNB1\tCDK1\t0.91\tpositive\n' +
        'CD3D\tCD8A\t0.88\tpositive\n' +
        'PDCD1\tLAG3\t0.72\tpositive\n' +
        'MKI67\tCD3D\t-0.61\tnegative'
    },
    {
      name: '邻接矩阵',
      filename: 'network_adjacency.tsv',
      desc: '方形矩阵：第一行与第一列为节点名，单元格为权重（0 表示无边）。按<b>无向</b>处理，只读取上三角，对角线忽略。',
      sample: '\tMKI67\tCCNB1\tCDK1\tCD3D\tCD8A\n' +
        'MKI67\t0\t0.86\t0.74\t-0.61\t-0.55\n' +
        'CCNB1\t0.86\t0\t0.91\t-0.42\t-0.38\n' +
        'CDK1\t0.74\t0.91\t0\t-0.35\t-0.31\n' +
        'CD3D\t-0.61\t-0.42\t-0.35\t0\t0.88\n' +
        'CD8A\t-0.55\t-0.38\t-0.31\t0.88\t0'
    },
    {
      name: '表达矩阵（按相关性建网）',
      filename: 'network_expression.tsv',
      desc: '行是基因（节点）、列是样本的表达矩阵；程序两两计算相关系数，|r| 达到阈值（可选 FDR 过滤）的基因对连边，' +
        '适合展示共表达模块。基因数建议 ≤ 400，否则组合数过多。',
      sample: 'Gene\tS1\tS2\tS3\tS4\tS5\tS6\n' +
        'MKI67\t7.8\t8.1\t7.5\t9.2\t9.0\t9.4\n' +
        'CCNB1\t7.5\t7.9\t7.2\t8.9\t9.1\t9.0\n' +
        'CD3D\t9.2\t8.9\t9.4\t7.4\t7.1\t7.6\n' +
        'CD8A\t9.0\t8.8\t9.3\t7.2\t7.0\t7.5'
    }
  ];

  /* ============================ 输入解析 ================================ */

  function findCol(header, res) {
    for (var i = 0; i < header.length; i++) {
      for (var j = 0; j < res.length; j++) if (res[j].test(header[i])) return i;
    }
    return -1;
  }

  function signOfToken(s) {
    s = String(s || '').trim().toLowerCase();
    if (!s) return 0;
    if (/^(neg|negative|inhibit|inhibitory|repress|repressor|down|downreg|down-regulated|-1|−1|no|false)$/.test(s)) return -1;
    if (/^(pos|positive|activate|activation|up|upreg|up-regulated|1|\+1|yes|true)$/.test(s)) return 1;
    if (s === '-' || s === '−') return -1;
    if (s === '+' || s === '＋') return 1;
    return 0;
  }

  function parseEdgeList(text) {
    var t = WB.parse.parseTable(text, {});
    var header = (t.header || []).map(function (h) { return String(h || '').trim().toLowerCase(); });
    var rows = t.rows.slice();
    var iS = findCol(header, [/^(source|from|node1|gene1|regulator|mirna|tf|node_a|a)$/]),
      iT = findCol(header, [/^(target|to|node2|gene2|target_gene|node_b|b)$/]),
      iW = findCol(header, [/^(weight|w|corr|correlation|r|value|strength|score|coef|coefficient)$/]),
      iD = findCol(header, [/^(type|sign|direction|edge_type|relation|reg)$/]);

    /* 无表头（首行即数据）：把表头行当作第一条数据 */
    var noHeader = iS < 0 && iT < 0;
    if (noHeader) {
      if (t.header && t.header.length >= 2) rows = [t.header].concat(t.rows);
      iS = 0; iT = 1; iW = 2; iD = -1;
    }
    if (iS < 0) iS = 0;
    if (iT < 0) iT = 1;

    var edges = [], nodes = {}, order = [];
    rows.forEach(function (r) {
      var a = String(r[iS] || '').trim(), b = String(r[iT] || '').trim();
      if (!a || !b || a === b) return;
      var w = iW >= 0 ? WB.parse.num(r[iW]) : 1;
      if (!isFinite(w)) w = 1;
      var dir = iD >= 0 ? signOfToken(r[iD]) : 0;
      if (!dir) dir = w < 0 ? -1 : 1;
      var mag = Math.abs(w);
      if (!(mag > 0)) mag = 1;
      edges.push({ a: a, b: b, w: mag * dir, mag: mag, sign: dir });
      [a, b].forEach(function (nm) {
        if (!nodes[nm]) { nodes[nm] = 1; order.push(nm); }
      });
    });
    return { edges: edges, names: order };
  }

  function parseAdjacency(text) {
    var t = WB.parse.parseTable(text, {});
    var header = (t.header || []).map(function (h) { return String(h || '').trim(); });
    if (!t.rows.length || header.length < 2) return { edges: [], names: [] };

    var rowNames, colNames, mat;
    var firstColNumeric = t.rows.every(function (r) {
      return isFinite(WB.parse.num(r[0])) || String(r[0] || '').trim() === '';
    });
    if (!header[0] || !firstColNumeric) {
      /* 标准方形矩阵：第一行与第一列为节点名（左上角可为空，也可写 Node） */
      colNames = header.slice(1);
      rowNames = [];
      mat = t.rows.map(function (r) {
        rowNames.push(String(r[0] || '').trim());
        return colNames.map(function (_, j) { return WB.parse.num(r[j + 1]); });
      });
    } else {
      /* 没有行名列：第一行即全部节点名，要求方阵 */
      colNames = header.slice();
      rowNames = colNames.slice();
      mat = t.rows.map(function (r) {
        return colNames.map(function (_, j) { return WB.parse.num(r[j]); });
      });
    }

    var names = rowNames.slice();
    colNames.forEach(function (c) { if (c && names.indexOf(c) < 0) names.push(c); });

    var edges = [];
    for (var i = 0; i < mat.length; i++) {
      for (var j = 0; j < mat[i].length; j++) {
        if (j <= i) continue;                       // 只取上三角
        var w = mat[i][j];
        if (!isFinite(w) || w === 0) continue;
        var rn = rowNames[i], cn = colNames[j];
        if (!rn || !cn || rn === cn) continue;
        edges.push({ a: rn, b: cn, w: w, mag: Math.abs(w), sign: w < 0 ? -1 : 1 });
      }
    }
    return { edges: edges, names: names };
  }

  function parseExpression(text, opt) {
    var m = WB.parse.parseMatrix(text, {});
    if (!m.matrix.length || !m.colNames.length) return { edges: [], names: [], tested: 0 };
    var genes = m.rowNames.map(function (g) { return String(g).trim(); });
    if (genes.length > 400) {
      throw new Error(T('节点数过多（{n}），请先筛选核心网络（建议 ≤ 400 个节点）。', { n: genes.length }));
    }
    var fn = WB.stats.CORR_METHODS[opt.method] || WB.stats.CORR_METHODS.pearson;
    var cand = [], pv = [];
    for (var i = 0; i < m.matrix.length; i++) {
      for (var j = i + 1; j < m.matrix.length; j++) {
        var x = m.matrix[i], y = m.matrix[j];
        var n = 0;
        for (var k = 0; k < x.length; k++) if (isFinite(x[k]) && isFinite(y[k])) n++;
        if (n < 3) continue;
        var r = fn(x, y);
        if (!isFinite(r.r)) continue;
        cand.push({ i: i, j: j, r: r.r, p: r.p });
        pv.push(isFinite(r.p) ? r.p : 1);
      }
    }
    var q = WB.stats.pAdjust(pv, 'BH');
    var cut = Math.abs(Number(opt.cut));
    if (!isFinite(cut)) cut = 0.8;
    var fdr = Number(opt.fdr) || 0;
    var edges = [];
    cand.forEach(function (c, ci) {
      if (Math.abs(c.r) < cut) return;
      if (fdr > 0 && !(q[ci] <= fdr)) return;
      edges.push({
        a: genes[c.i], b: genes[c.j], w: c.r, mag: Math.abs(c.r),
        sign: c.r < 0 ? -1 : 1, p: c.p, q: q[ci]
      });
    });
    return { edges: edges, names: genes, tested: cand.length };
  }

  /** 节点属性：「节点 / 分组 / 大小」 */
  function parseNodeAttrs(text) {
    var out = {};
    if (!text || !text.trim()) return out;
    var t = WB.parse.parseTable(text, {});
    var rows = t.rows.slice();
    var header = (t.header || []).map(function (h) { return String(h || '').trim().toLowerCase(); });
    var hasHeader = /^(node|gene|name|id|节点|基因)$/.test(header[0] || '');
    if (!hasHeader && t.header) rows = [t.header].concat(t.rows);
    rows.forEach(function (r) {
      var name = String(r[0] || '').trim();
      if (!name) return;
      var grp = String(r[1] || '').trim();
      var size = WB.parse.num(r[2]);
      out[name] = { group: grp || '', size: isFinite(size) ? size : null };
    });
    return out;
  }

  /* ============================ 图结构 ================================== */

  function buildGraph(raw, attrs, minW) {
    var nameSet = {}, order = [];
    raw.names.forEach(function (n) { if (n !== undefined && n !== null && !nameSet[n]) { nameSet[n] = 1; order.push(n); } });
    var nodes = order.map(function (n) {
      var a = attrs[n] || {};
      return {
        id: n, label: String(n), group: a.group || '', sizeAttr: a.size,
        deg: 0, wdeg: 0, x: 0, y: 0, r: 8
      };
    });
    var idx = {};
    nodes.forEach(function (n, i) { idx[n.id] = i; });
    var edges = [];
    raw.edges.forEach(function (e) {
      var ia = idx[e.a], ib = idx[e.b];
      if (ia === undefined || ib === undefined || ia === ib) return;
      if (!isFinite(e.mag) || e.mag < minW) return;
      edges.push({ a: ia, b: ib, w: e.w, mag: e.mag, sign: e.sign });
      nodes[ia].deg++; nodes[ib].deg++;
      nodes[ia].wdeg += e.mag; nodes[ib].wdeg += e.mag;
    });
    return { nodes: nodes, edges: edges };
  }

  function components(nodes, edges) {
    var parent = nodes.map(function (_, i) { return i; });
    function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
    edges.forEach(function (e) {
      var ra = find(e.a), rb = find(e.b);
      if (ra !== rb) parent[ra] = rb;
    });
    var seen = {}, n = 0;
    nodes.forEach(function (_, i) { var r = find(i); if (!seen[r]) { seen[r] = 1; n++; } });
    return n;
  }

  /* ============================ 布局 ==================================== */

  /** 确定性伪随机（可复现） */
  function lcg(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function forceLayout(nodes, edges, W, H, opt) {
    opt = opt || {};
    var n = nodes.length;
    if (!n) return;
    var rnd = lcg(20261022);
    var i, j;

    /* 分组锚点 */
    var groups = [], gidx = {};
    if (opt.grouped) {
      nodes.forEach(function (nd) {
        var g = nd.group || '—';
        if (gidx[g] === undefined) { gidx[g] = groups.length; groups.push(g); }
      });
    }
    var anchors = groups.map(function (_, k) {
      var ang = 2 * Math.PI * k / Math.max(1, groups.length) - Math.PI / 2;
      return { x: W / 2 + Math.cos(ang) * W * 0.3, y: H / 2 + Math.sin(ang) * H * 0.3 };
    });

    /* 初始位置：圆周 + 微扰（同组相邻） */
    var ordered = nodes.slice().sort(function (a, b) {
      if (opt.grouped && a.group !== b.group) return groups.indexOf(a.group || '—') - groups.indexOf(b.group || '—');
      return String(a.id).localeCompare(String(b.id));
    });
    ordered.forEach(function (nd, k) {
      var ang = 2 * Math.PI * k / n - Math.PI / 2;
      nd.x = W / 2 + Math.cos(ang) * Math.min(W, H) * 0.36 + (rnd() - 0.5) * 6;
      nd.y = H / 2 + Math.sin(ang) * Math.min(W, H) * 0.36 + (rnd() - 0.5) * 6;
    });
    if (n === 1) { nodes[0].x = W / 2; nodes[0].y = H / 2; return; }

    var k0 = Math.sqrt((W * H) / n) * 0.62;
    var iters = n <= 80 ? 420 : (n <= 200 ? 300 : 180);

    for (var it = 0; it < iters; it++) {
      var temp = Math.min(W, H) * 0.10 * (1 - it / iters) + 0.4;
      /* 斥力 */
      for (i = 0; i < n; i++) {
        var fx = 0, fy = 0, ni = nodes[i];
        for (j = 0; j < n; j++) {
          if (i === j) continue;
          var nj = nodes[j];
          var dx = ni.x - nj.x, dy = ni.y - nj.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1e-6) { dx = rnd() - 0.5; dy = rnd() - 0.5; d2 = 0.5; }
          var d = Math.sqrt(d2);
          var rep = k0 * k0 / d;
          fx += dx / d * rep; fy += dy / d * rep;
        }
        /* 引力（沿边） */
        for (var e = 0; e < edges.length; e++) {
          var ed = edges[e];
          if (ed.a !== i && ed.b !== i) continue;
          var o = nodes[ed.a === i ? ed.b : ed.a];
          var ex = ni.x - o.x, ey = ni.y - o.y;
          var el2 = Math.sqrt(ex * ex + ey * ey) || 0.5;
          var att = el2 * el2 / k0;
          fx -= ex / el2 * att; fy -= ey / el2 * att;
        }
        /* 向心 + 分组锚点 */
        fx += (W / 2 - ni.x) * 0.045;
        fy += (H / 2 - ni.y) * 0.045;
        if (opt.grouped && groups.length > 1) {
          var an = anchors[gidx[ni.group || '—'] || 0];
          fx += (an.x - ni.x) * 0.16;
          fy += (an.y - ni.y) * 0.16;
        }
        var fl = Math.sqrt(fx * fx + fy * fy) || 1;
        var step = Math.min(fl, temp) / fl;
        ni.x += fx * step; ni.y += fy * step;
      }
      /* 边界 */
      nodes.forEach(function (nd) {
        nd.x = WB.clamp(nd.x, 20, W - 20);
        nd.y = WB.clamp(nd.y, 16, H - 16);
      });
    }
    fitToBox(nodes, W, H, 28);
  }

  function layoutCircle(nodes, edges, W, H, opt) {
    var ordered = nodes.slice().sort(function (a, b) {
      if (opt && opt.grouped && a.group !== b.group) {
        return String(a.group || '—').localeCompare(String(b.group || '—'));
      }
      return String(a.id).localeCompare(String(b.id));
    });
    var n = ordered.length;
    var rx = W / 2 - 46, ry = H / 2 - 34;
    ordered.forEach(function (nd, i) {
      var ang = 2 * Math.PI * i / Math.max(1, n) - Math.PI / 2;
      nd.x = W / 2 + Math.cos(ang) * rx;
      nd.y = H / 2 + Math.sin(ang) * ry * 0.92;
    });
  }

  function layoutGrid(nodes, W, H) {
    var ordered = nodes.slice().sort(function (a, b) { return b.deg - a.deg; });
    var n = ordered.length;
    var cols = Math.max(1, Math.ceil(Math.sqrt(n * (W / H))));
    var rows = Math.ceil(n / cols);
    var cw = (W - 60) / cols, ch = (H - 50) / rows;
    ordered.forEach(function (nd, i) {
      var c = i % cols, r = Math.floor(i / cols);
      nd.x = 30 + cw * (c + 0.5);
      nd.y = 24 + ch * (r + 0.5);
    });
  }

  /** 平移缩放至画布（保持纵横比） */
  function fitToBox(nodes, W, H, pad) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    nodes.forEach(function (nd) {
      if (nd.x < x0) x0 = nd.x; if (nd.x > x1) x1 = nd.x;
      if (nd.y < y0) y0 = nd.y; if (nd.y > y1) y1 = nd.y;
    });
    if (!isFinite(x0)) return;
    var sw = (x1 - x0) || 1, sh = (y1 - y0) || 1;
    var scale = Math.min((W - pad * 2) / sw, (H - pad * 2) / sh);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    var ox = (W - sw * scale) / 2, oy = (H - sh * scale) / 2;
    nodes.forEach(function (nd) {
      nd.x = ox + (nd.x - x0) * scale;
      nd.y = oy + (nd.y - y0) * scale;
    });
  }

  /* ============================ 绘制 ==================================== */

  var EDGE_POS = '#c0392b', EDGE_NEG = '#2f6fb3', EDGE_GREY = '#8a97a3';

  function drawNetwork(container, graph, cfg) {
    var nodes = graph.nodes, edges = graph.edges;
    var W = 900, H = 660;
    var padL = 40, padR = 40, padT = cfg.title ? 68 : 40, padB = 128;
    var PW = W - padL - padR, PH = H - padT - padB;

    var canvas = WB.plot.createSVG(container, W, H, { background: '#ffffff' });
    var root = canvas.root;

    /* 背景（保证导出为白底） */
    root.appendChild(S('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff' }));

    /* 标题与副标题 */
    if (cfg.title) {
      root.appendChild(WB.plot.txt(W / 2, 30, cfg.title, {
        'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700, fill: WB.plot.TEXT
      }));
    }
    root.appendChild(WB.plot.txt(W / 2, cfg.title ? 50 : 24,
      T('{n} 个节点 · {m} 条连线', { n: nodes.length, m: edges.length }), {
      'text-anchor': 'middle', 'font-size': 11, fill: WB.plot.MUTED
    }));

    /* 布局 */
    var g = WB.plot.g({ transform: 'translate(' + padL + ',' + padT + ')' });
    root.appendChild(g);
    var opts = { grouped: cfg.layout === 'cluster' };
    if (cfg.layout === 'circle') layoutCircle(nodes, edges, PW, PH, opts);
    else if (cfg.layout === 'grid') layoutGrid(nodes, PW, PH);
    else forceLayout(nodes, edges, PW, PH, opts);

    /* 节点大小 */
    var sizeVal = function (nd) {
      if (cfg.nodeSize === 'uniform') return 1;
      if (cfg.nodeSize === 'weight') return nd.wdeg;
      return nd.deg;
    };
    var vals = nodes.map(sizeVal);
    var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    if (cfg.nodeSize === 'uniform') { vmin = 0; vmax = 1; }
    var rMin = 5, rMax = nodes.length > 150 ? 15 : 19;
    nodes.forEach(function (nd) {
      var v = sizeVal(nd);
      var t = (vmax - vmin) > 0 ? (v - vmin) / (vmax - vmin) : 0.5;
      nd.r = rMin + (rMax - rMin) * Math.sqrt(Math.max(0, t));
    });

    /* 节点颜色 */
    var groups = [], gcount = {};
    nodes.forEach(function (nd) {
      var key = nd.group || '';
      if (!key) return;
      if (gcount[key] === undefined) { gcount[key] = 0; groups.push(key); }
      gcount[key]++;
    });
    var colorOf;
    if (cfg.nodeColor === 'group' && groups.length) {
      colorOf = function (nd) {
        var i = groups.indexOf(nd.group || '');
        return i < 0 ? EDGE_GREY : WB.plot.palette(i);
      };
    } else if (cfg.nodeColor === 'degree') {
      var ramp = WB.plot.ramp('blues');
      colorOf = function (nd) {
        var t = (vmax - vmin) > 0 ? (sizeVal(nd) - vmin) / (vmax - vmin) : 0.5;
        return ramp(0.25 + 0.7 * t);
      };
    } else {
      colorOf = function () { return '#3a6ea5'; };
    }
    var hasColorLegend = cfg.nodeColor === 'group' && groups.length > 1;

    /* 连线 */
    var maxMag = 0;
    edges.forEach(function (e) { if (e.mag > maxMag) maxMag = e.mag; });
    if (!(maxMag > 0)) maxMag = 1;
    var edgeG = WB.plot.g({});
    g.appendChild(edgeG);
    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var col = cfg.edgeSign ? (e.w < 0 ? EDGE_NEG : EDGE_POS) : EDGE_GREY;
      var wdt = 0.5 + 3.4 * (e.mag / maxMag);
      var ln = S('line', {
        x1: a.x, y1: a.y, x2: b.x, y2: b.y,
        stroke: col, 'stroke-width': wdt,
        'stroke-opacity': 0.5, 'stroke-linecap': 'round'
      });
      edgeG.appendChild(ln);
      WB.plot.bindTip(ln, function () {
        return '<b>' + WB.esc(a.id) + ' — ' + WB.esc(b.id) + '</b><br>' +
          T('权重：') + WB.formatNum(e.w, 3) + '<br>' +
          (e.sign < 0 ? T('负相关') : T('正相关'));
      });
    });

    /* 节点 */
    var nodeG = WB.plot.g({});
    g.appendChild(nodeG);
    nodes.forEach(function (nd) {
      var c = S('circle', {
        cx: nd.x, cy: nd.y, r: nd.r,
        fill: colorOf(nd), 'fill-opacity': 0.88,
        stroke: '#ffffff', 'stroke-width': 1.6
      });
      nodeG.appendChild(c);
      WB.plot.bindTip(c, function () {
        return '<b>' + WB.esc(nd.label) + '</b>' +
          (nd.group ? '<br>' + T('分组：') + WB.esc(nd.group) : '') +
          '<br>' + T('度：') + nd.deg +
          '<br>' + T('加权度：') + WB.formatNum(nd.wdeg, 3);
      });
    });

    /* 标签 */
    var labelMode = cfg.labels;
    var showAll = labelMode === 'all' || (labelMode === 'auto' && nodes.length <= 70);
    var labelList = nodes.slice();
    if (!showAll && labelMode !== 'none') {
      labelList = nodes.slice().sort(function (a, b) { return b.deg - a.deg; })
        .slice(0, Math.min(40, nodes.length));
    } else if (labelMode === 'none') {
      labelList = [];
    }
    var fs = nodes.length > 120 ? 8.5 : (nodes.length > 60 ? 9.5 : 10.5);
    labelList.forEach(function (nd) {
      var text = WB.plot.ellipsis(nd.label, 22);
      var t = WB.plot.txt(nd.x, nd.y - nd.r - 4, text, {
        'text-anchor': 'middle', 'font-size': fs, fill: WB.plot.TEXT, 'font-weight': 600
      });
      t.setAttribute('paint-order', 'stroke');
      t.setAttribute('stroke', '#ffffff');
      t.setAttribute('stroke-width', '3');
      t.setAttribute('stroke-linejoin', 'round');
      t.setAttribute('pointer-events', 'none');
      nodeG.appendChild(t);
    });

    /* ---------------- 图内图例 ---------------- */
    var lg = WB.plot.g({});
    root.appendChild(lg);
    var legY = H - padB + 22;
    lg.appendChild(S('line', {
      x1: 40, y1: legY - 14, x2: W - 40, y2: legY - 14,
      stroke: '#e4e6e9', 'stroke-width': 1
    }));

    var colX = 44;
    /* 节点颜色（分组） */
    if (hasColorLegend) {
      var perCol = Math.min(6, Math.ceil(groups.length / 2));
      groups.forEach(function (gp, i) {
        var cx = colX + Math.floor(i / perCol) * 132;
        var cy = legY + (i % perCol) * 15;
        lg.appendChild(S('circle', { cx: cx + 5, cy: cy - 3, r: 5, fill: WB.plot.palette(i), 'fill-opacity': 0.88, stroke: '#ffffff' }));
        lg.appendChild(WB.plot.txt(cx + 15, cy + 0.5, WB.plot.ellipsis(gp, 15), { 'font-size': 11.5, 'font-weight': 600, fill: WB.plot.TEXT }));
      });
    } else if (cfg.nodeColor === 'degree') {
      var nSeg = 26, segW = 5;
      for (var si = 0; si < nSeg; si++) {
        lg.appendChild(S('rect', {
          x: colX + si * segW, y: legY - 10, width: segW + 0.5, height: 9,
          fill: WB.plot.ramp('blues')(0.25 + 0.7 * (1 - si / (nSeg - 1)))
        }));
      }
      lg.appendChild(WB.plot.txt(colX, legY + 10, T('节点颜色映射'), { 'font-size': 10.5, fill: WB.plot.MUTED }));
      lg.appendChild(WB.plot.txt(colX + nSeg * segW + 4, legY - 2, WB.formatNum(vmax, 2), { 'font-size': 10.5, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    } else {
      lg.appendChild(S('circle', { cx: colX + 5, cy: legY - 3, r: 5, fill: '#3a6ea5', 'fill-opacity': 0.88, stroke: '#ffffff' }));
      lg.appendChild(WB.plot.txt(colX + 15, legY + 0.5, T('节点'), { 'font-size': 11.5, 'font-weight': 600, fill: WB.plot.TEXT }));
    }

    /* 节点大小图例 */
    var szX = W - 300;
    var levels = [vmin, (vmin + vmax) / 2, vmax];
    if (cfg.nodeSize === 'uniform') levels = [1];
    lg.appendChild(WB.plot.txt(szX, legY - 16, T('节点大小'), { 'font-size': 10.5, fill: WB.plot.MUTED }));
    levels.forEach(function (lv, i) {
      var t = (vmax - vmin) > 0 ? (lv - vmin) / (vmax - vmin) : 0.5;
      var rr = rMin + (rMax - rMin) * Math.sqrt(Math.max(0, t));
      var cx = szX + 12 + i * 58;
      lg.appendChild(S('circle', { cx: cx, cy: legY, r: rr, fill: '#3a6ea5', 'fill-opacity': 0.35, stroke: '#3a6ea5', 'stroke-width': 1 }));
      lg.appendChild(WB.plot.txt(cx, legY + rMax + 12, WB.formatNum(lv, 0), { 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });

    /* 连线粗细 / 颜色图例 */
    var ewX = W - 130;
    lg.appendChild(WB.plot.txt(ewX, legY - 16, T('连线粗细'), { 'font-size': 10.5, fill: WB.plot.MUTED }));
    var widths = [maxMag * 0.25, maxMag * 0.6, maxMag];
    widths.forEach(function (ww, i) {
      var y = legY - 4 + i * 9;
      lg.appendChild(S('line', {
        x1: ewX, y1: y, x2: ewX + 34, y2: y,
        stroke: cfg.edgeSign ? EDGE_POS : EDGE_GREY, 'stroke-opacity': 0.65,
        'stroke-width': 0.5 + 3.4 * (ww / maxMag), 'stroke-linecap': 'round'
      }));
      lg.appendChild(WB.plot.txt(ewX + 40, y + 3.2, WB.formatNum(ww, 2), { 'font-size': 10, 'font-weight': 600, fill: WB.plot.TICKTEXT }));
    });
    if (cfg.edgeSign) {
      var ly2 = legY + 26;
      lg.appendChild(S('line', { x1: ewX, y1: ly2, x2: ewX + 34, y2: ly2, stroke: EDGE_POS, 'stroke-width': 2, 'stroke-opacity': 0.65 }));
      lg.appendChild(WB.plot.txt(ewX + 40, ly2 + 3.4, T('正相关'), { 'font-size': 10, fill: WB.plot.TEXT }));
      lg.appendChild(S('line', { x1: ewX, y1: ly2 + 13, x2: ewX + 34, y2: ly2 + 13, stroke: EDGE_NEG, 'stroke-width': 2, 'stroke-opacity': 0.65 }));
      lg.appendChild(WB.plot.txt(ewX + 40, ly2 + 16.4, T('负相关'), { 'font-size': 10, fill: WB.plot.TEXT }));
    }

    return canvas.svg;
  }

  /* ============================ 模块 ==================================== */

  WB.register({
    id: 'network',
    name: '网络图',
    icon: '⌗',
    color: '#2f6f8f',
    desc: '按「来源—目标—权重」的边列表、邻接矩阵或表达矩阵构建网络，支持力导向/分组/环形/网格布局，节点大小与颜色、连线粗细均可映射，图内自带标题与图例，可导出 SVG 与高分辨率 PNG。',
    tags: ['网络图', '力导向布局', '节点度', '发表级'],

    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('网络图绘制') }),
        el('p', { text: T('从边列表、邻接矩阵或表达矩阵构建网络图，节点大小映射连接数或权重、颜色映射分组，连线粗细映射权重，输出可直接用于投稿的矢量图。') })
      ]));

      var aTa = null;
      var panel = WB.ui.inputPanel({
        title: '输入网络数据',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.networkEdges,
        placeholder: 'Source\tTarget\tWeight\tType\nMKI67\tCCNB1\t0.86\tpositive\n...',
        paramsTitle: '绘图参数',
        params: [
          {
            key: 'inputType', label: '输入类型', type: 'select', value: 'edge',
            options: [
              { value: 'edge', label: '边列表（推荐）' },
              { value: 'adjacency', label: '邻接矩阵' },
              { value: 'expr', label: '表达矩阵（按相关性建网）' }
            ]
          },
          {
            key: 'layout', label: '布局算法', type: 'select', value: 'force',
            options: [
              { value: 'force', label: '力导向（推荐）' },
              { value: 'cluster', label: '力导向 · 按分组聚集' },
              { value: 'circle', label: '环形' },
              { value: 'grid', label: '网格' }
            ]
          },
          {
            key: 'nodeSize', label: '节点大小映射', type: 'select', value: 'degree',
            options: [
              { value: 'degree', label: '连接数（度）' },
              { value: 'weight', label: '加权度（权重之和）' },
              { value: 'uniform', label: '统一大小' }
            ]
          },
          {
            key: 'nodeColor', label: '节点颜色映射', type: 'select', value: 'group',
            options: [
              { value: 'group', label: '分组（需填写节点属性）' },
              { value: 'degree', label: '连接数（渐变色）' },
              { value: 'single', label: '单一颜色' }
            ]
          },
          {
            key: 'labels', label: '基因标签', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动（节点多时只标连接数高的）' },
              { value: 'all', label: '全部显示' },
              { value: 'none', label: '不显示' }
            ]
          },
          { key: 'minW', label: '连线权重阈值 |w| ≥', type: 'number', value: 0, min: 0, max: 1, step: 0.05 },
          { key: 'edgeSign', label: '按正负相关着色连线', type: 'checkbox', value: true },
          { key: 'title', label: '图题（可留空）', type: 'text', value: '', width: 'full' },
          {
            key: 'corrMethod', label: '相关系数', type: 'select', value: 'pearson',
            options: [
              { value: 'pearson', label: 'Pearson（线性相关）' },
              { value: 'spearman', label: 'Spearman（秩相关）' }
            ]
          },
          { key: 'corrCut', label: '连边相关性阈值 |r| ≥', type: 'number', value: 0.8, min: 0.1, max: 0.99, step: 0.05 },
          {
            key: 'corrFdr', label: '连边 FDR 过滤', type: 'select', value: '0',
            options: [
              { value: '0', label: '不过滤' },
              { value: '0.05', label: 'FDR ≤ 0.05' },
              { value: '0.01', label: 'FDR ≤ 0.01' }
            ]
          }
        ],
        extraValues: function () { return { attrs: aTa ? aTa.value : '' }; },
        extraState: {
          ready: function () { return !!aTa; },
          get: function () { return aTa ? aTa.value : ''; },
          set: function (v) { if (aTa) aTa.value = v || ''; }
        },
        runLabel: '绘制网络图',
        onRun: function (ctx) {
          var res = WB.$('#network-result');
          WB.clear(res);
          runDraw(res, ctx);
        }
      });

      var attrBox = el('div.param-box');
      attrBox.appendChild(el('div.param-head', { text: T('节点属性（可选）') }));
      aTa = el('textarea.paste-area', {
        rows: 4,
        placeholder: 'Node\tGroup\tSize\nMKI67\tCell cycle\t\nCD3D\tImmune\t\nCOL1A1\tECM\t'
      });
      aTa.style.minHeight = '88px';
      attrBox.appendChild(aTa);
      attrBox.appendChild(el('div.field-hint', {
        text: T('可给出每个节点的分组与自定义大小，用于颜色与大小映射；每行「节点名 <TAB> 分组名 [<TAB> 大小]」，可带表头。')
      }));
      attrBox.appendChild(el('div.format-actions', [
        el('button.btn.btn-ghost.btn-xs', {
          text: T('插入示例属性'),
          onclick: function () {
            aTa.value = WB.demo.networkNodes;
            panel.save();
            WB.toast(T('已插入示例节点属性'), 'ok');
          }
        })
      ]));
      aTa.addEventListener('input', WB.debounce(function () { panel.save(); }, 300));
      panel.extraSlot.appendChild(attrBox);
      panel.restoreExtra();

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'network-result';
      main.appendChild(wrap);
      if (!WB._netDemoLoaded) {
        WB._netDemoLoaded = true;
        panel.setText(WB.demo.networkEdges);
        aTa.value = WB.demo.networkNodes;
        panel.save();
      }
    }
  });

  function runDraw(res, ctx) {
    var v = ctx.values;
    var attrs = parseNodeAttrs(v.attrs || '');
    var type = v.inputType || 'edge';
    var raw, tested = 0;

    if (type === 'adjacency') raw = parseAdjacency(ctx.text);
    else if (type === 'expr') {
      raw = parseExpression(ctx.text, { method: v.corrMethod, cut: v.corrCut, fdr: v.corrFdr });
      tested = raw.tested || 0;
    } else raw = parseEdgeList(ctx.text);

    if (!raw.names.length) throw new Error(T('未解析到有效的网络数据'));

    var minW = Number(v.minW);
    if (!isFinite(minW) || minW < 0) minW = 0;
    var graph = buildGraph(raw, attrs, minW);
    if (!graph.edges.length) throw new Error(T('未解析到任何可用的连线'));
    if (graph.nodes.length > 400) {
      throw new Error(T('节点数过多（{n}），请先筛选核心网络（建议 ≤ 400 个节点）。', { n: graph.nodes.length }));
    }
    if (graph.edges.length > 4000) {
      throw new Error(T('连线数过多（{n}），请提高权重阈值（建议 ≤ 4000 条连线）。', { n: graph.edges.length }));
    }

    var layout = v.layout;
    if (layout === 'cluster' && !Object.keys(attrs).length) {
      layout = 'force';
      res.appendChild(WB.ui.alertBox('warn', T('未指定节点属性，分组布局已回退为普通力导向布局。')));
    }
    var nodeColor = v.nodeColor;
    if (nodeColor === 'group' && !Object.keys(attrs).length) {
      nodeColor = 'single';
      res.appendChild(WB.ui.alertBox('warn', T('未指定节点属性，「节点颜色」已回退为单一颜色。')));
    }

    /* 统计 */
    var degSum = 0, degMax = 0;
    graph.nodes.forEach(function (n) { degSum += n.deg; if (n.deg > degMax) degMax = n.deg; });
    var nN = graph.nodes.length, nE = graph.edges.length;
    var density = nN > 1 ? 2 * nE / (nN * (nN - 1)) : 0;
    var nComp = components(graph.nodes, graph.edges);

    res.appendChild(WB.ui.statBar([
      { label: T('节点数'), value: nN },
      { label: T('连线数'), value: nE },
      { label: T('平均度'), value: WB.formatNum(degSum / Math.max(1, nN), 2) },
      { label: T('最大度'), value: degMax, tone: degMax ? 'purple' : '' },
      { label: T('连通分量'), value: nComp },
      { label: T('网络密度'), value: WB.formatNum(density, 3) }
    ]));

    if (type === 'expr' && tested) {
      res.appendChild(WB.ui.alertBox('info',
        T('按相关性建网：共检验 {n} 个基因对，|r| ≥ {c} 且通过 FDR 过滤后保留 {k} 条连线。',
          { n: tested, c: v.corrCut, k: nE })));
    } else {
      res.appendChild(WB.ui.alertBox('info', T('当前输入为边列表/邻接矩阵，「相关系数」「连边阈值」参数不参与计算。')));
    }

    /* 图 */
    var card = WB.ui.resultCard(T('网络图（{n} 个节点，{m} 条连线）', { n: nN, m: nE }));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = drawNetwork(holder, graph, {
      layout: layout, nodeSize: v.nodeSize, nodeColor: nodeColor,
      labels: v.labels, edgeSign: !!v.edgeSign, title: String(v.title || '').trim()
    });
    var bar = WB.plot.addToolbar(body, {
      getSvg: function () { return svg; }, basename: 'network',
      buttons: [{
        label: 'PNG 4×', title: '导出 4 倍分辨率位图',
        onClick: function () { WB.downloadPNG(svg, bar.fileName('.png').replace(/\.png$/, '_4x.png'), 4); }
      }]
    });
    body.appendChild(el('div.preview-note', {
      text: v.nodeSize === 'weight'
        ? T('节点大小映射为加权度（相连权重之和）。') + T('导出 SVG 可在 Illustrator / Inkscape 中编辑文字与颜色；PNG 4× 适用于 300 dpi 投稿。')
        : T('节点大小映射为连接数；连线粗细映射 |权重|；颜色表示分组，红/蓝连线分别表示正/负相关。布局为确定性力导向，重复运行结果一致。') +
        T('导出 SVG 可在 Illustrator / Inkscape 中编辑文字与颜色；PNG 4× 适用于 300 dpi 投稿。')
    }));

    /* 数据表 */
    var tCard = WB.ui.resultCard(T('节点表') + ' / ' + T('边表'));
    res.appendChild(tCard);
    var tBody = tCard.querySelector('.card-body');

    var nodePane = el('div');
    WB.ui.dataTable(nodePane, [
      { key: 'id', label: T('节点') },
      { key: 'group', label: T('分组') },
      { key: 'deg', label: T('度'), align: 'right', width: 80 },
      { key: 'wdeg', label: T('加权度'), align: 'right', width: 96, format: function (r) { return WB.formatNum(r.wdeg, 3); } }
    ], graph.nodes.map(function (n) {
      return { id: n.id, group: n.group || '—', deg: n.deg, wdeg: n.wdeg };
    }), { pageSize: 20, exportName: 'network_nodes', sortKey: 'deg', sortDir: -1 });

    var edgePane = el('div');
    WB.ui.dataTable(edgePane, [
      { key: 'a', label: T('来源') },
      { key: 'b', label: T('目标') },
      { key: 'w', label: T('权重'), align: 'right', width: 96, format: function (r) { return WB.formatNum(r.w, 4); } },
      {
        key: 'sign', label: T('方向'), width: 80,
        format: function (r) { return r.sign < 0 ? T('负相关') : T('正相关'); }
      }
    ], graph.edges.map(function (e) {
      return { a: graph.nodes[e.a].id, b: graph.nodes[e.b].id, w: e.w, sign: e.sign };
    }), { pageSize: 20, exportName: 'network_edges' });

    var tabs = WB.ui.tabs([
      { label: T('节点表'), content: nodePane },
      { label: T('边表'), content: edgePane }
    ]);
    tBody.appendChild(tabs.node);
  }

  /* 供自检使用 */
  WB.network = {
    parseEdgeList: parseEdgeList,
    parseAdjacency: parseAdjacency,
    parseNodeAttrs: parseNodeAttrs,
    buildGraph: buildGraph,
    components: components,
    parseExpression: parseExpression
  };
})(window);
