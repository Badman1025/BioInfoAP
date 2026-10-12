/* =============================================================================
 * core/utils.js  —  DOM / 文件 / 导出 工具
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};

  /* ------------------------------- DOM ---------------------------------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /** 创建元素: el('div.cls#id', {attr}, [children]) */
  function el(spec, attrs, children) {
    var m = /^([a-zA-Z0-9\-]+)?((?:[.#][\w\-]+)*)$/.exec(spec) || [];
    var tag = m[1] || 'div';
    var node = document.createElement(tag);
    var rest = m[2] || '';
    rest.replace(/([.#])([\w\-]+)/g, function (_, p, v) {
      if (p === '.') node.classList.add(v); else node.id = v;
      return '';
    });
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) {
      children = attrs; attrs = null;
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k === 'class') node.className = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    append(node, children);
    return node;
  }
  function append(node, children) {
    if (children === null || children === undefined) return node;
    if (Array.isArray(children)) { children.forEach(function (c) { append(node, c); }); return node; }
    if (children.nodeType) { node.appendChild(children); return node; }
    node.appendChild(document.createTextNode(String(children)));
    return node;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------- 下载 --------------------------------- */

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename || 'download';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 200);
  }
  function downloadText(text, filename, mime) {
    var blob = new Blob(['\ufeff' + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    downloadBlob(blob, filename);
  }
  function toTSV(header, rows) {
    var out = [];
    if (header) out.push(header.join('\t'));
    rows.forEach(function (r) {
      out.push(r.map(function (v) {
        if (v === null || v === undefined) return '';
        if (typeof v === 'number') return formatNum(v);
        return String(v).replace(/\t/g, ' ');
      }).join('\t'));
    });
    return out.join('\n');
  }
  function toCSV(header, rows) {
    function cell(v) {
      var s = (v === null || v === undefined) ? '' : (typeof v === 'number' ? formatNum(v) : String(v));
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var out = [];
    if (header) out.push(header.map(cell).join(','));
    rows.forEach(function (r) { out.push(r.map(cell).join(',')); });
    return out.join('\n');
  }
  function formatNum(v, digits) {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v !== 'number') return String(v);
    if (!isFinite(v)) return v > 0 ? 'Inf' : (v < 0 ? '-Inf' : 'NaN');
    var a = Math.abs(v);
    if (a === 0) return '0';
    digits = digits === undefined ? 4 : digits;
    if (a < 1e-4 || a >= 1e6) return v.toExponential(3).replace('e', 'e');
    var s = v.toFixed(digits);
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s;
  }
  function pFormat(p) {
    if (p === null || p === undefined || isNaN(p)) return 'NA';
    if (p < 1e-300) return '<1e-300';
    if (p < 0.001) return p.toExponential(2);
    return p.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  /* ------------------------- SVG → PNG / 导出 ---------------------------- */

  function svgToString(svg) {
    var clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    // 内联必要的样式（字体、颜色）
    var st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    st.textContent = WB.svgInlineCSS || '';
    clone.insertBefore(st, clone.firstChild);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      new XMLSerializer().serializeToString(clone);
  }
  function downloadSVG(svg, filename) {
    downloadText(svgToString(svg), filename || 'plot.svg', 'image/svg+xml');
  }
  function downloadPNG(svg, filename, scale) {
    scale = scale || 2;
    var w = svg.viewBox.baseVal.width || svg.clientWidth || 600;
    var h = svg.viewBox.baseVal.height || svg.clientHeight || 400;
    var str = svgToString(svg);
    var img = new Image();
    var svgBlob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(svgBlob);
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) {
        if (blob) downloadBlob(blob, filename || 'plot.png');
        else WB.toast('PNG 导出失败，请改用 SVG', 'warn');
      }, 'image/png');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      WB.toast('PNG 导出失败，请改用 SVG', 'warn');
    };
    img.src = url;
  }

  /* ------------------------------ 文件读取 ------------------------------- */

  function readFileText(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).replace(/^\ufeff/, '')); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsText(file, 'utf-8');
    });
  }
  function readFilesText(files) {
    return Promise.all(Array.prototype.slice.call(files).map(function (f) {
      return readFileText(f).then(function (t) { return { name: f.name, text: t }; });
    }));
  }

  /* ------------------------------- Toast -------------------------------- */

  var toastBox = null;
  function toast(msg, type, ms) {
    if (!toastBox) {
      toastBox = el('div.toast-box');
      document.body.appendChild(toastBox);
    }
    var item = el('div.toast' + (type ? '.' + type : ''), { text: msg });
    toastBox.appendChild(item);
    setTimeout(function () { item.classList.add('out'); }, (ms || 2400));
    setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, (ms || 2400) + 420);
  }

  /* ----------------------------- 剪贴板 ---------------------------------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('已复制到剪贴板', 'ok'); })
        .catch(function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = el('textarea', { style: { position: 'fixed', top: '-1000px' } });
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制到剪贴板', 'ok'); }
    catch (e) { toast('复制失败，请手动选择', 'warn'); }
    ta.remove();
  }

  /* ------------------------------ 其他 ---------------------------------- */

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
    };
  }
  function uid(p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); }
  function uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort(function (a, b) {
      return String(a).localeCompare(String(b), 'zh');
    });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function niceTicks(min, max, count) {
    count = count || 5;
    if (!isFinite(min) || !isFinite(max)) return [0];
    if (min === max) { min -= 1; max += 1; }
    var span = max - min;
    var step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = (span / count) / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var start = Math.ceil(min / step) * step, ticks = [];
    for (var v = start; v <= max + step * 1e-9; v += step) {
      ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    }
    return ticks;
  }

  /* --------------------------- 模块注册表 -------------------------------- */
  /* 放在核心层最早加载，保证各分析模块在加载时即可注册（main.js 只负责渲染） */

  WB.tools = WB.tools || {};
  WB.toolOrder = WB.toolOrder || [];
  WB.register = function (tool) {
    if (!tool || !tool.id) return;
    if (WB.toolOrder.indexOf(tool.id) < 0) WB.toolOrder.push(tool.id);
    WB.tools[tool.id] = tool;
  };

  WB.$ = $; WB.$$ = $$; WB.el = el; WB.append = append; WB.clear = clear; WB.esc = esc;
  WB.downloadBlob = downloadBlob; WB.downloadText = downloadText;
  WB.toTSV = toTSV; WB.toCSV = toCSV; WB.formatNum = formatNum; WB.pFormat = pFormat;
  WB.downloadSVG = downloadSVG; WB.downloadPNG = downloadPNG; WB.svgToString = svgToString;
  WB.readFileText = readFileText; WB.readFilesText = readFilesText;
  WB.toast = toast; WB.copyText = copyText; WB.debounce = debounce; WB.uid = uid;
  WB.uniqueSorted = uniqueSorted; WB.clamp = clamp; WB.niceTicks = niceTicks;
})(window);
