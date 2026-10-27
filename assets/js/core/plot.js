/* =============================================================================
 * core/plot.js  —  SVG 绘图脚手架：配色 / 坐标轴 / 图例 / 提示框 / 导出条
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '蓝-白 (Blues)': 'Blue–White (Blues)',
    '青绿 (GnBu)': 'Green–Blue (GnBu)',
    '橙红 (OrRd)': 'Orange–Red (OrRd)',
    '蓝紫 (PuBu)': 'Purple–Blue (PuBu)',
    '红-蓝 (RdBu)': 'Red–Blue (RdBu)',
    '彩虹 (RdYlBu)': 'Rainbow (RdYlBu)',
    '光谱 (Spectral)': 'Spectral (Spectral)',
    '灰度 (Greys)': 'Greyscale (Greys)',
    '冷暖 (CoolWarm)': 'Cool–Warm (CoolWarm)',
    '导出矢量图': 'Export vector graphic',
    '导出位图（2×）': 'Export bitmap (2×)',
    '导出文件名（可修改，SVG 与 PNG 共用）': 'Export file name (editable; shared by SVG and PNG)',
    '暂无结果': 'No results',
    '没有可绘制的数据': 'No data to plot'
  });

  var SVGNS = 'http://www.w3.org/2000/svg';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function formatNum(v, d) { return WB.formatNum(v, d); }

  /** 创建 SVG 元素 */
  function s(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v);
      });
    }
    return n;
  }
  function g(attrs, children) {
    var n = s('g', attrs);
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function txt(x, y, content, attrs) {
    var a = Object.assign({ x: x, y: y, 'font-size': 12, fill: WB.plot.TEXT, 'font-family': WB.plot.FONT }, attrs || {});
    return s('text', Object.assign(a, { text: content }));
  }

  var FONT = '"Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
  var TEXT = '#22303c';
  var MUTED = '#6b7c8a';
  /** 轴刻度文字色：接近墨色，配合 600 字重，导出后仍然清晰（用户反馈浅灰小字看不清） */
  var TICKTEXT = '#222d37';
  var AXIS = '#b6c2cc';
  var GRID = '#eaeff3';

  /* ------------------------------- 配色 --------------------------------- */

  var PALETTE = [
    '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7',
    '#9C755F', '#BAB0AC', '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B',
    '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF', '#AEC7E8', '#FFBB78', '#98DF8A', '#FF9896',
    '#C5B0D5', '#C49C94', '#F7B6D2', '#C7C7C7', '#DBDB8D', '#9EDAE5'
  ];
  function palette(i) { return PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]; }

  var RAMPS = {
    viridis: ['#440154', '#472d7b', '#3b528b', '#2c728e', '#21918c', '#28ae80', '#5ec962', '#addc30', '#fde725'],
    magma: ['#000004', '#1f0c48', '#550f6d', '#88226a', '#b5367a', '#de4968', '#f57d5a', '#fbbd7a', '#fcfdbf'],
    inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#fcffa4'],
    plasma: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
    turbo: ['#30123b', '#4145ab', '#4675ed', '#39a2fc', '#1bcfd4', '#24eca6', '#61fc6c', '#a4fc3b', '#d1e834', '#f3c63a', '#fe9b2d', '#f36315', '#d93806', '#b11901', '#7a0402'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    redblue: ['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f'],
    redyellowblue: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
    spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    orrd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    gnbu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
    pubu: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
    greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
    heat: ['#3b4cc0', '#6788ee', '#9abbff', '#c9d7f0', '#edd1c2', '#f7a889', '#e26952', '#b40426']
  };
  var RAMP_LABELS = {
    viridis: 'Viridis', magma: 'Magma', inferno: 'Inferno', plasma: 'Plasma', turbo: 'Turbo',
    blues: '蓝-白 (Blues)', gnbu: '青绿 (GnBu)', orrd: '橙红 (OrRd)', pubu: '蓝紫 (PuBu)',
    redblue: '红-蓝 (RdBu)', redyellowblue: '彩虹 (RdYlBu)', spectral: '光谱 (Spectral)',
    greys: '灰度 (Greys)', heat: '冷暖 (CoolWarm)'
  };

  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(r, g, b) {
    function f(v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }
    return '#' + f(r) + f(g) + f(b);
  }
  /** 返回 t∈[0,1] → hex 的插值函数 */
  function ramp(name) {
    var stops = (RAMPS[name] || RAMPS.viridis).map(hex2rgb);
    return function (t) {
      if (!isFinite(t)) return '#ffffff';
      t = Math.max(0, Math.min(1, t));
      var p = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(p)), f = p - i;
      var a = stops[i], b = stops[i + 1];
      return rgb2hex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    };
  }
  function rampColors(name, n) {
    var f = ramp(name), out = [];
    for (var i = 0; i < n; i++) out.push(f(n === 1 ? 0.5 : i / (n - 1)));
    return out;
  }

  /* ------------------------------ SVG 画布 ------------------------------- */

  /**
   * 在容器里新建 SVG
   * @returns {{svg, root, width, height, defs}}
   */
  function createSVG(container, width, height, opt) {
    opt = opt || {};
    WB.clear(container);
    var svg = s('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      width: '100%',
      style: 'max-width:' + width + 'px;height:auto;display:block;margin:0 auto;',
      xmlns: SVGNS
    });
    var defs = s('defs');
    svg.appendChild(defs);
    if (opt.title) svg.appendChild(txt(width / 2, 20, opt.title, { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600 }));
    if (opt.background) {
      svg.appendChild(s('rect', { x: 0, y: 0, width: width, height: height, fill: opt.background === true ? '#fff' : opt.background }));
    }
    var root = g({});
    svg.appendChild(root);
    container.appendChild(svg);
    return { svg: svg, root: root, width: width, height: height, defs: defs };
  }

  /* ------------------------------- 坐标轴 -------------------------------- */

  function axisBottom(scale, length, opt) {
    opt = opt || {};
    var node = g({ class: 'axis axis-x' });
    var ticks = scale.ticks ? scale.ticks(opt.ticks || 6) : scale.domain();
    var tickSize = opt.tickSize === undefined ? 5 : opt.tickSize;
    node.appendChild(s('line', { x1: 0, y1: 0, x2: length, y2: 0, stroke: AXIS, 'shape-rendering': 'crispEdges' }));
    ticks.forEach(function (t) {
      var x = scale(t);
      if (x < -1 || x > length + 1) return;
      node.appendChild(s('line', { x1: x, y1: 0, x2: x, y2: tickSize, stroke: AXIS, 'shape-rendering': 'crispEdges' }));
      node.appendChild(txt(x, tickSize + 12, opt.format ? opt.format(t) : String(t), { 'text-anchor': 'middle', 'font-size': 11, fill: MUTED }));
    });
    if (opt.label) node.appendChild(txt(length / 2, tickSize + 32, opt.label, { 'text-anchor': 'middle', 'font-size': 12, fill: TEXT }));
    return node;
  }
  function axisLeft(scale, length, opt) {
    opt = opt || {};
    var node = g({ class: 'axis axis-y' });
    var ticks = scale.ticks ? scale.ticks(opt.ticks || 6) : scale.domain();
    var tickSize = opt.tickSize === undefined ? 5 : opt.tickSize;
    node.appendChild(s('line', { x1: 0, y1: 0, x2: 0, y2: -length, stroke: AXIS, 'shape-rendering': 'crispEdges' }));
    ticks.forEach(function (t) {
      var y = -scale(t);
      if (y > 1 || y < -length - 1) return;
      node.appendChild(s('line', { x1: -tickSize, y1: y, x2: 0, y2: y, stroke: AXIS, 'shape-rendering': 'crispEdges' }));
      node.appendChild(txt(-tickSize - 4, y + 3.5, opt.format ? opt.format(t) : String(t), { 'text-anchor': 'end', 'font-size': 11, fill: MUTED }));
    });
    if (opt.label) {
      var t2 = txt(0, 0, opt.label, { 'text-anchor': 'middle', 'font-size': 12, fill: TEXT });
      t2.setAttribute('transform', 'rotate(-90)');
      t2.setAttribute('x', -length / 2);
      t2.setAttribute('y', -(opt.labelOffset || 46));
      node.appendChild(t2);
    }
    return node;
  }
  /** 纵向网格线 */
  function gridX(scale, length, opt) {
    var node = g({});
    var ticks = scale.ticks ? scale.ticks(opt.ticks || 6) : scale.domain();
    ticks.forEach(function (t) {
      node.appendChild(s('line', { x1: scale(t), y1: 0, x2: scale(t), y2: -length, stroke: GRID, 'shape-rendering': 'crispEdges' }));
    });
    return node;
  }
  function gridY(scale, length, opt) {
    var node = g({});
    var ticks = scale.ticks ? scale.ticks(opt.ticks || 6) : scale.domain();
    ticks.forEach(function (t) {
      node.appendChild(s('line', { x1: 0, y1: -scale(t), x2: length, y2: -scale(t), stroke: GRID, 'shape-rendering': 'crispEdges' }));
    });
    return node;
  }

  /* ------------------------------- 提示框 -------------------------------- */

  var tipEl = null;
  function tipShow(html, evt) {
    if (!tipEl) {
      tipEl = WB.el('div.chart-tip');
      document.body.appendChild(tipEl);
    }
    tipEl.innerHTML = html;
    tipEl.style.display = 'block';
    tipMove(evt);
  }
  function tipMove(evt) {
    if (!tipEl || tipEl.style.display === 'none') return;
    var e = evt.touches ? evt.touches[0] : evt;
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - 14;
    tipEl.style.left = Math.max(4, x) + 'px';
    tipEl.style.top = Math.max(4, y) + 'px';
  }
  function tipHide() { if (tipEl) tipEl.style.display = 'none'; }
  function bindTip(node, htmlFn) {
    node.addEventListener('mousemove', function (e) { tipShow(htmlFn(), e); });
    node.addEventListener('mouseleave', tipHide);
    node.style.cursor = 'pointer';
  }

  /* ------------------------------- 图例 ---------------------------------- */

  function legendCategorical(container, items, opt) {
    opt = opt || {};
    var box = WB.el('div.legend-cat' + (opt.vertical ? '.vertical' : ''));
    items.forEach(function (it) {
      box.appendChild(WB.el('span.legend-item', [
        WB.el('i.swatch', { style: { background: it.color } }),
        WB.el('span', { text: it.label })
      ]));
    });
    container.appendChild(box);
    return box;
  }

  function legendContinuous(container, cfg) {
    var w = cfg.width || 200, h = 12;
    var wrap = WB.el('div.legend-cont');
    var svg = s('svg', { viewBox: '0 0 ' + w + ' ' + (h + 30), width: w, height: h + 30, style: 'display:block' });
    var f = ramp(cfg.ramp);
    var n = 60;
    for (var i = 0; i < n; i++) {
      svg.appendChild(s('rect', { x: i * w / n, y: 0, width: w / n + 0.6, height: h, fill: f(i / (n - 1)) }));
    }
    svg.appendChild(txt(0, h + 14, cfg.format ? cfg.format(cfg.min) : WB.formatNum(cfg.min), { 'font-size': 10, fill: MUTED }));
    svg.appendChild(txt(w, h + 14, cfg.format ? cfg.format(cfg.max) : WB.formatNum(cfg.max), { 'text-anchor': 'end', 'font-size': 10, fill: MUTED }));
    svg.appendChild(txt(w / 2, h + 26, cfg.label || '', { 'text-anchor': 'middle', 'font-size': 11, fill: TEXT }));
    wrap.appendChild(svg);
    container.appendChild(wrap);
    return wrap;
  }

  /* --------------------------- 图表导出工具条 ----------------------------- */

  /**
   * 在容器顶部插入「导出 SVG / PNG / 数据」按钮条。
   * 文件名取自工具条上的输入框（默认「图类型名_时间戳」，可编辑）；
   * 其余自定义按钮可通过返回值 bar.fileName(ext) 复用同一文件名。
   */
  function addToolbar(container, cfg) {
    var bar = WB.el('div.plot-toolbar');
    if (cfg.getSvg) {
      var nameInput = WB.el('input.plot-toolbar-name', {
        type: 'text', value: (cfg.basename || 'plot') + '_' + exportStamp(),
        title: WB.t('导出文件名（可修改，SVG 与 PNG 共用）'),
        'aria-label': WB.t('导出文件名（可修改，SVG 与 PNG 共用）'),
        spellcheck: 'false'
      });
      /** 以输入框内容命名：去除扩展名与文件系统非法字符，超长截断 */
      var fname = function (ext) {
        var v = String(nameInput.value || '').trim()
          .replace(/[\\/:*?"<>|#%&{}$!`'@+=\s]+/g, '_')
          .replace(/\.(svg|png|pdf|jpe?g)$/i, '');
        if (v.length > 96) v = v.slice(0, 96);
        return (v || 'plot') + ext;
      };
      bar.fileName = fname;
      bar.appendChild(nameInput);
      bar.appendChild(WB.el('button.btn.btn-ghost.btn-xs', {
        text: 'SVG', title: WB.t('导出矢量图'),
        onclick: function () { WB.downloadSVG(cfg.getSvg(), fname('.svg')); }
      }));
      bar.appendChild(WB.el('button.btn.btn-ghost.btn-xs', {
        text: 'PNG', title: WB.t('导出位图（2×）'),
        onclick: function () { WB.downloadPNG(cfg.getSvg(), fname('.png'), cfg.scale || 2); }
      }));
    }
    (cfg.buttons || []).forEach(function (b) {
      bar.appendChild(WB.el('button.btn.btn-ghost.btn-xs', { text: WB.t(b.label), title: WB.t(b.title), onclick: b.onClick }));
    });
    container.insertBefore(bar, container.firstChild);
    return bar;
  }

  /** 导出文件名默认后缀（本地时间，形如 20261027_093715），保证多次导出互不覆盖 */
  function exportStamp() {
    var d = new Date();
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '_' +
      p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
  }

  /* ---------------------------- 文本换行 --------------------------------- */

  function ellipsis(str, max) {
    str = String(str);
    return str.length > max ? str.slice(0, Math.max(1, max - 1)) + '…' : str;
  }

  /** 估算字符串像素宽（中文/全角按 1em，大写与数字 0.66em，窄标点 0.32em，其余 0.54em） */
  function textW(str, fs) {
    fs = fs || 12;
    str = String(str);
    var w = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(ch)) w += fs;
      else if (/[MWmw@%&]/.test(ch)) w += fs * 0.85;
      else if (/[A-Z0-9]/.test(ch)) w += fs * 0.66;
      else if (/[iljI|.,'`:;!\[\]()]/.test(ch)) w += fs * 0.32;
      else w += fs * 0.54;
    }
    return w;
  }

  /** 按像素预算截断（超预算时收缩并加省略号；预算内原样返回） */
  function truncateW(str, maxPx, fs) {
    str = String(str);
    if (!(maxPx > 0) || textW(str, fs) <= maxPx) return str;
    var out = str;
    while (out.length > 1 && textW(out + '…', fs) > maxPx) out = out.slice(0, -1);
    return out + '…';
  }
  /** 依据字符宽度近似换行（中文按 2 计） */
  function wrapText(str, maxUnits, maxLines) {
    str = String(str);
    var units = function (ch) { return /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 2 : 1; };
    var lines = [], cur = '', w = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], u = units(ch);
      if (/[\s_\-]/.test(ch) && w > maxUnits * 0.6) { /* 允许断点 */ }
      if (w + u > maxUnits) { lines.push(cur); cur = ''; w = 0; }
      cur += ch; w += u;
      if (maxLines && lines.length >= maxLines) break;
    }
    if (cur) lines.push(cur);
    if (maxLines && lines.length > maxLines) lines = lines.slice(0, maxLines);
    return lines;
  }

  /* ------------------------------ 通用面板 ------------------------------- */

  function emptyState(container, msg) {
    WB.clear(container);
    container.appendChild(WB.el('div.empty-state', [
      WB.el('div.empty-icon', { text: '◌' }),
      WB.el('div', { text: msg || WB.t('暂无结果') })
    ]));
  }

  /* ------------------------------ 比例尺 -------------------------------- */

  /** 线性比例尺：调用即映射，附带 .ticks() 与 .invert() */
  function linearScale(d0, d1, r0, r1) {
    var span = (d1 - d0) || 1;
    var f = function (v) { return r0 + (r1 - r0) * ((v - d0) / span); };
    f.ticks = function (n) { return WB.niceTicks(d0, d1, n || 6); };
    f.invert = function (p) { return d0 + (p - r0) * span / ((r1 - r0) || 1); };
    f.domain = function () { return [d0, d1]; };
    f.range = function () { return [r0, r1]; };
    f.nice = function () { return f; };
    return f;
  }
  /** 分类比例尺：domain 为数组，返回带宽起点 */
  function bandScale(domain, r0, r1, padRatio) {
    var n = domain.length || 1;
    var step = (r1 - r0) / n;
    var pad = step * (padRatio === undefined ? 0.08 : padRatio);
    var map = new Map();
    domain.forEach(function (d, i) { map.set(d, r0 + i * step + pad / 2); });
    var f = function (v) { return map.has(v) ? map.get(v) : r0; };
    f.bandwidth = function () { return step - pad; };
    f.step = function () { return step; };
    f.centers = function () {
      return domain.map(function (d) { return map.get(d) + (step - pad) / 2; });
    };
    return f;
  }

  /* ------------------------------ 树状图 -------------------------------- */

  /**
   * 生成树状图（正交折线）
   * @param {object} tree  hclust 返回的树
   * @param {number[]} order 叶序
   * @param {number} cellSize 单个叶占用的像素
   * @param {number} thickness 树状图厚度（像素）
   * @param {'top'|'left'} orient
   * @param {number} [lineWidth] 线宽（叶数很多时调细）
   */
  function dendrogram(tree, order, cellSize, thickness, orient, lineWidth) {
    var pos = new Map();
    order.forEach(function (leaf, i) { pos.set(leaf, i + 0.5); });
    var maxH = 0;
    (function scan(nd) {
      if (!nd || nd.leaf !== undefined) return;
      if (nd.height > maxH) maxH = nd.height;
      scan(nd.left); scan(nd.right);
    })(tree);
    if (!(maxH > 0)) maxH = 1;
    var hs = (thickness - 6) / maxH;
    var lw = lineWidth === undefined ? 1.1 : lineWidth;
    var gEl = g({});
    var line = function (p1, h1, p2, h2) {
      var a = orient === 'top' ? [p1 * cellSize, -h1 * hs] : [-h1 * hs, p1 * cellSize];
      var b = orient === 'top' ? [p2 * cellSize, -h2 * hs] : [-h2 * hs, p2 * cellSize];
      gEl.appendChild(s('line', {
        x1: a[0], y1: a[1], x2: b[0], y2: b[1],
        stroke: '#9aa9b6', 'stroke-width': lw, 'stroke-linecap': 'round'
      }));
    };
    (function rec(nd) {
      if (!nd || nd.leaf !== undefined) return { p: pos.get(nd ? nd.leaf : 0), h: 0 };
      var L = rec(nd.left), R = rec(nd.right);
      line(L.p, L.h, L.p, nd.height);
      line(R.p, R.h, R.p, nd.height);
      line(L.p, nd.height, R.p, nd.height);
      return { p: (L.p + R.p) / 2, h: nd.height };
    })(tree);
    return gEl;
  }

  function lum(hex) {
    var c = hex2rgb(hex);
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  }

  /* ---------------------------- 聚类热图 -------------------------------- */

  /**
   * 通用矩阵热图（可选行/列树状图、数值标注、色条、注释条）
   * cfg: {
   *   matrix, rowNames, colNames,
   *   rowOrder, colOrder, rowTree, colTree,
   *   vmin, vmax, ramp, centerValue,
   *   cellW, cellH,
   *   annotate: 'none'|'auto'|'value'|'star',
   *   textOf: fn(value,i,j)->string,
   *   tooltip: fn(value,i,j)->html,
   *   rowLabelOf: fn(i,name)->{text,color},
   *   colLabelOf: fn(j,name)->{text,color},
   *   rowColorBar: {colors:[],label}, colColorBar: {colors:[],label},
   *   legendLabel, legendFormat
   * }
   */
  function matrixHeatmap(container, cfg) {
    var M = cfg.matrix, nRow = M.length;
    if (!nRow) { emptyState(container, WB.t('没有可绘制的数据')); return null; }
    var nCol = M[0].length;
    var rowOrder = cfg.rowOrder || M.map(function (_, i) { return i; });
    var colOrder = cfg.colOrder || (M[0] || []).map(function (_, j) { return j; });
    var cellW = cfg.cellW || clamp(Math.min(38, 560 / Math.max(1, nCol), 460 / Math.max(1, nRow)), 7, 38);
    var cellH = cfg.cellH || cellW;

    // 极值
    var vmin = cfg.vmin, vmax = cfg.vmax;
    if (vmin === undefined || vmax === undefined) {
      var lo = Infinity, hi = -Infinity;
      M.forEach(function (row) {
        row.forEach(function (v) {
          if (!isFinite(v)) return;
          if (v < lo) lo = v; if (v > hi) hi = v;
        });
      });
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      if (cfg.centerValue !== undefined) {
        var a = Math.max(Math.abs(lo - cfg.centerValue), Math.abs(hi - cfg.centerValue)) || 1;
        vmin = cfg.centerValue - a; vmax = cfg.centerValue + a;
      } else {
        if (lo === hi) { hi = lo + 1; }
        vmin = lo; vmax = hi;
      }
    }
    var f = ramp(cfg.ramp || 'rdbu');
    var tOf = function (v) { return (v - vmin) / ((vmax - vmin) || 1); };

    // 标签宽度（估宽系数与截断阈值一致，保证最长标签不被省略）
    var rowLabelOf = cfg.rowLabelOf || function (i, name) { return { text: name }; };
    var colLabelOf = cfg.colLabelOf || function (j, name) { return { text: name }; };
    var ROW_CHAR_W = 7.4;   /* 行标签字号上限 12px 时的单字符估宽（大写字母 + 数字） */
    var maxRowLabelUnits = 0;
    rowOrder.forEach(function (i) {
      var t = rowLabelOf(i, cfg.rowNames ? cfg.rowNames[i] : '') || {};
      maxRowLabelUnits = Math.max(maxRowLabelUnits, String(t.text || '').replace(/[\u4e00-\u9fa5]/g, 'xx').length);
    });
    var rowLabelW = cfg.showRowLabels === false ? 0 : clamp(8 + maxRowLabelUnits * ROW_CHAR_W, 36, 360);
    var rotateColLabels = cfg.rotateColLabels !== false && (nCol > 1 || nRow > 1);

    var leftDendroW = cfg.showRowDendro && cfg.rowTree ? 66 : 0;
    var topDendroH = cfg.showColDendro && cfg.colTree ? 56 : 0;
    var rowBarW = cfg.rowColorBar ? 11 : 0;
    var colBarH = cfg.colColorBar ? 10 : 0;
    var maxColLabelLen = 0;
    colOrder.forEach(function (j) {
      var t = colLabelOf(j, cfg.colNames ? cfg.colNames[j] : '') || {};
      maxColLabelLen = Math.max(maxColLabelLen, String(t.text || '').length);
    });
    var bottomLabelH = cfg.showColLabels === false ? 10
      : (rotateColLabels ? clamp(26 + maxColLabelLen * 5.6, 36, 150) : 24);
    var legendW = cfg.legend === false ? 10 : 118;

    var offX = rowLabelW + leftDendroW + rowBarW;
    var offY = topDendroH + colBarH;
    var width = offX + cellW * nCol + legendW;
    var height = offY + cellH * nRow + bottomLabelH + (cfg.legendBottom !== false ? 0 : 0);

    var canvas = createSVG(container, width, height, {});
    var root = canvas.root;

    // 树状图
    if (leftDendroW && cfg.rowTree) {
      var dg = dendrogram(cfg.rowTree, rowOrder, cellH, leftDendroW, 'left');
      dg.setAttribute('transform', 'translate(' + (rowLabelW + rowBarW + leftDendroW) + ',' + offY + ')');
      root.appendChild(dg);
    }
    if (topDendroH && cfg.colTree) {
      var dg2 = dendrogram(cfg.colTree, colOrder, cellW, topDendroH, 'top');
      dg2.setAttribute('transform', 'translate(' + offX + ',' + (offY) + ')');
      root.appendChild(dg2);
    }

    // 单元格
    for (var ri = 0; ri < nRow; ri++) {
      var i = rowOrder[ri];
      for (var cj = 0; cj < nCol; cj++) {
        var j = colOrder[cj];
        var v = M[i] ? M[i][j] : NaN;
        if (!isFinite(v) && cfg.skipNaN) continue;
        var x = offX + cj * cellW, y = offY + ri * cellH;
        var fill = isFinite(v) ? f(clamp(tOf(v), 0, 1)) : '#f4f7fa';
        var rect = s('rect', {
          x: x, y: y, width: cellW, height: cellH,
          fill: fill, stroke: cellW >= 12 ? '#ffffff' : '#f7fafc',
          'stroke-width': cellW >= 12 ? 1 : 0.5, 'shape-rendering': 'crispEdges'
        });
        root.appendChild(rect);
        if (cfg.tooltip) {
          (function (rr, cc, vv, node) {
            bindTip(node, function () { return cfg.tooltip(vv, rr, cc, ri, cj); });
          })(i, j, v, rect);
        }
        // 标注
        var ann = cfg.annotate || 'none';
        if (isFinite(v) && ann !== 'none' && cellW >= 22 && cellH >= 16) {
          var txtStr;
          if (cfg.textOf) txtStr = cfg.textOf(v, i, j);
          else if (ann === 'star') txtStr = sigStar(v);
          else txtStr = formatNum(v, cellW >= 34 ? 2 : 1);
          if (txtStr) {
            var tcol = lum(fill) > 0.58 ? '#22303c' : '#ffffff';
            var tEl = txt(x + cellW / 2, y + cellH / 2 + Math.min(4, cellH * 0.22), txtStr, {
              'text-anchor': 'middle', 'font-size': clamp(cellW * 0.4, 8, 11.5),
              fill: tcol, 'pointer-events': 'none'
            });
            root.appendChild(tEl);
          }
        }
      }
    }

    // 行标签
    if (rowLabelW) {
      for (var ri2 = 0; ri2 < nRow; ri2++) {
        var i2 = rowOrder[ri2];
        var rl = rowLabelOf(i2, cfg.rowNames ? cfg.rowNames[i2] : '') || {};
        var tEl2 = txt(rowLabelW + rowBarW + leftDendroW - 8, offY + ri2 * cellH + cellH / 2 + 3.6,
          ellipsis(rl.text, Math.max(2, Math.floor((rowLabelW - 8) / ROW_CHAR_W))), {
          'text-anchor': 'end', 'font-size': clamp(cellH * 0.62, 9, 12), fill: rl.color || TEXT
        });
        if (cfg.rowTooltip) bindTip(tEl2, (function (ii) { return function () { return cfg.rowTooltip(ii); }; })(i2));
        root.appendChild(tEl2);
      }
    }

    // 列标签
    if (cfg.showColLabels !== false) {
      for (var cj2 = 0; cj2 < nCol; cj2++) {
        var j2 = colOrder[cj2];
        var cl = colLabelOf(j2, cfg.colNames ? cfg.colNames[j2] : '') || {};
        var cx = offX + cj2 * cellW + cellW / 2;
        var cy = offY + cellH * nRow + (rotateColLabels ? 10 : 14);
        if (rotateColLabels) {
          var maxChars = Math.floor(bottomLabelH / 6.0);
          root.appendChild(txt(0, 0, ellipsis(cl.text, maxChars), {
            'text-anchor': 'start', 'font-size': 11, fill: cl.color || TEXT,
            transform: 'translate(' + cx + ',' + (cy + 2) + ') rotate(48)'
          }));
        } else {
          root.appendChild(txt(cx, cy, ellipsis(String(cl.text), Math.max(2, Math.floor(cellW / 6.4))), {
            'text-anchor': 'middle', 'font-size': 11, fill: cl.color || TEXT
          }));
        }
      }
    }

    // 行注释色条
    if (cfg.rowColorBar) {
      var rb = cfg.rowColorBar;
      for (var ri3 = 0; ri3 < nRow; ri3++) {
        var i3 = rowOrder[ri3];
        root.appendChild(s('rect', {
          x: rowLabelW, y: offY + ri3 * cellH, width: 8, height: cellH,
          fill: rb.colors[i3] || '#e6ecf2'
        }));
      }
      (rb.label ? [rb.label] : []).forEach(function (t) {
        root.appendChild(txt(4, offY + cellH * nRow + 14, t, { 'font-size': 10, fill: MUTED }));
      });
    }
    // 列注释色条
    if (cfg.colColorBar) {
      var cb = cfg.colColorBar;
      for (var cj3 = 0; cj3 < nCol; cj3++) {
        var j3 = colOrder[cj3];
        root.appendChild(s('rect', {
          x: offX + cj3 * cellW, y: topDendroH, width: cellW, height: 7,
          fill: cb.colors[j3] || '#e6ecf2'
        }));
      }
    }

    // 图例
    if (cfg.legend !== false) {
      var lx = width - legendW + 6, ly = offY + 6;
      var nSeg = Math.max(20, Math.min(60, Math.round(cellH * nRow / 8)));
      for (var sIdx = 0; sIdx < nSeg; sIdx++) {
        root.appendChild(s('rect', {
          x: lx, y: ly + sIdx * 5, width: 12, height: 5.2,
          fill: f(1 - sIdx / (nSeg - 1))
        }));
      }
      var fmt = cfg.legendFormat || function (v) { return formatNum(v, 2); };
      root.appendChild(txt(lx + 16, ly + 6, fmt(vmax), { 'font-size': 10, fill: MUTED }));
      root.appendChild(txt(lx + 16, ly + nSeg * 5, fmt(vmin), { 'font-size': 10, fill: MUTED }));
      root.appendChild(txt(lx - 2, ly + nSeg * 5 + 22, cfg.legendLabel || '', { 'font-size': 10.5, fill: TEXT }));
    }

    return { svg: canvas.svg, cellW: cellW, cellH: cellH, width: width, height: height, offX: offX, offY: offY };
  }

  function sigStar(p) {
    if (!isFinite(p)) return '';
    if (p < 0.001) return '***';
    if (p < 0.01) return '**';
    if (p < 0.05) return '*';
    return '';
  }

  WB.plot = {
    s: s, g: g, txt: txt, SVGNS: SVGNS,
    FONT: FONT, TEXT: TEXT, MUTED: MUTED, TICKTEXT: TICKTEXT, AXIS: AXIS, GRID: GRID,
    PALETTE: PALETTE, palette: palette, RAMPS: RAMPS, RAMP_LABELS: RAMP_LABELS,
    ramp: ramp, rampColors: rampColors, hex2rgb: hex2rgb, rgb2hex: rgb2hex, lum: lum,
    linearScale: linearScale, bandScale: bandScale,
    createSVG: createSVG, axisBottom: axisBottom, axisLeft: axisLeft, gridX: gridX, gridY: gridY,
    tipShow: tipShow, tipMove: tipMove, tipHide: tipHide, bindTip: bindTip,
    legendCategorical: legendCategorical, legendContinuous: legendContinuous,
    addToolbar: addToolbar, ellipsis: ellipsis, textW: textW, truncateW: truncateW, wrapText: wrapText, emptyState: emptyState,
    dendrogram: dendrogram, matrixHeatmap: matrixHeatmap, sigStar: sigStar
  };
})(window);
