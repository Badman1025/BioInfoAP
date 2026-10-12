/* =============================================================================
 * core/parse.js  —  表格 / 基因集 / 矩阵 解析
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '长表至少需要 3 列：样本ID / 变量名 / 数值': 'A long table needs at least 3 columns: sample ID / variable / value',
    '数据为空': 'The data is empty',
    '未能解析出有效的 log2FC / p 值列，请检查列名与数据': 'Could not parse valid log2FC / p-value columns — check the column names and data'
  });

  /* --------------------------- 基础表格解析 ------------------------------ */

  function detectDelimiter(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() && l[0] !== '#'; }).slice(0, 30);
    if (!lines.length) return '\t';
    var cands = ['\t', ',', ';', ' ', '|'];
    var best = '\t', bestScore = -1;
    cands.forEach(function (d) {
      var counts = lines.map(function (l) { return l.split(d).length - 1; });
      var positive = counts.filter(function (c) { return c > 0; }).length;
      if (positive < lines.length * 0.8) return;
      var mn = Math.min.apply(null, counts), mx = Math.max.apply(null, counts);
      var score = (mn > 0 ? 1000 : 0) + mn * 10 - (mx - mn);
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }

  function splitLine(line, delim) {
    if (delim === ' ') return line.trim().split(/\s+/);
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
        } else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === delim) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }

  /**
   * 通用表格解析
   * @returns {{header:string[], rows:string[][], delim:string, ncol:number}}
   */
  function parseTable(text, opt) {
    opt = opt || {};
    var delim = opt.delim && opt.delim !== 'auto' ? opt.delim : detectDelimiter(text);
    var raw = text.split(/\r?\n/);
    var rows = [];
    for (var i = 0; i < raw.length; i++) {
      var line = raw[i];
      if (!line.trim()) continue;
      if (/^\s*[#%]/.test(line) && !(opt.keepComments)) continue;
      rows.push(splitLine(line, delim));
    }
    if (!rows.length) return { header: [], rows: [], delim: delim, ncol: 0 };
    var header = opt.header === false ? null : rows.shift();
    var ncol = Math.max.apply(null, rows.concat(header ? [header] : []).map(function (r) { return r.length; }));
    // 补齐短行
    rows.forEach(function (r) { while (r.length < ncol) r.push(''); });
    if (header) { while (header.length < ncol) header.push(''); }
    return { header: header, rows: rows, delim: delim, ncol: ncol };
  }

  function isNumericCell(s) {
    if (s === '' || s === null || s === undefined) return false;
    s = String(s).trim();
    if (!s) return false;
    if (/^(na|nan|null|none|-|\.|\?)$/i.test(s)) return false;
    return isFinite(Number(s));
  }
  function num(s) {
    if (typeof s === 'number') return s;
    if (!isNumericCell(s)) return NaN;
    return Number(String(s).trim());
  }

  var BINARY_TRUE = /^(1|true|t|yes|y|present|p|in|是|有|\+|\+1)$/i;
  var BINARY_FALSE = /^(0|false|f|no|n|absent|a|out|否|无|-1|)$/i;
  function parseBinary(s) {
    s = String(s || '').trim();
    if (BINARY_TRUE.test(s)) return 1;
    if (BINARY_FALSE.test(s)) return 0;
    if (isNumericCell(s)) return Number(s) !== 0 ? 1 : 0;
    return null;
  }

  /* ---------------------------- 基因集解析 ------------------------------- */

  function splitElements(cell, fileDelim) {
    cell = String(cell || '').trim();
    if (!cell) return [];
    var pattern = fileDelim === ',' ? /[;；、\s]+/ : /[,;，；、\s]+/;
    return cell.split(pattern).map(function (s) { return s.trim(); })
      .filter(function (s) { return s; });
  }

  /** 首行是否像"表头行"（列名）而不是数据 */
  var HEADER_WORDS = /^(set|sets|group|cluster|term|pathway|category|class|type|condition|list|listname|module|collection|gene|genes|symbol|gene_id|geneid|element|elements|member|members|id|name|feature|集合|分组|列表|通路|类别|模块|基因|基因名|元素|成员|名称|注释)$/i;
  function looksLikeHeaderRow(cells) {
    if (!cells || !cells.length) return false;
    var hits = cells.filter(function (c) { return HEADER_WORDS.test(String(c || '').trim()); }).length;
    if (!hits) return false;
    // 全部单元格都是"列名词"才算表头；只要有一个不是，就认为是数据行
    return hits >= Math.min(2, cells.length) && cells.every(function (c) {
      return HEADER_WORDS.test(String(c || '').trim());
    });
  }

  /**
   * 集合数据解析，返回 {sets:[{name, elements:[]}], format, ncol, delim, preview}
   * 支持三种格式：
   *   long     长表：Set <delim> Element（一元素一行，可重复出现）
   *   wide     宽表：Element, Set1, Set2, ...  值为 0/1
   *   columns  分列：第一行是集合名，每列下方是该集合的成员（长度可不等）
   */
  function parseSets(text, opt) {
    opt = opt || {};
    var t = parseTable(text, opt);
    var header = t.header || [];
    var headerLike = looksLikeHeaderRow(header);
    // 两列数据时，首行可能是数据而非表头（无表头的长表）
    var headerIsData = header.length > 0 && !headerLike && t.ncol <= 2;
    var fmt = opt.format && opt.format !== 'auto' ? opt.format : detectSetFormat(t, headerIsData);
    var rowsAll = (fmt === 'long' && headerIsData) ? [header].concat(t.rows) : t.rows;
    var sets = [];

    if (fmt === 'long') {
      var map = new Map();
      rowsAll.forEach(function (r) {
        var name = r[0];
        if (!name) return;
        if (!map.has(name)) map.set(name, []);
        splitElements(r[1], t.delim).forEach(function (e) { map.get(name).push(e); });
      });
      map.forEach(function (v, k) { sets.push({ name: k, elements: v }); });

    } else if (fmt === 'wide') {
      for (var c = 1; c < t.ncol; c++) {
        var nm = header[c] || ('Set' + c);
        var arr = [];
        t.rows.forEach(function (r) {
          var v = parseBinary(r[c]);
          if (v === 1 && r[0]) arr.push(r[0]);
        });
        sets.push({ name: nm, elements: arr });
      }

    } else { // columns
      for (var c2 = 0; c2 < t.ncol; c2++) {
        var nm2 = (header[c2] || ('Set' + (c2 + 1))).trim() || ('Set' + (c2 + 1));
        var arr2 = [];
        t.rows.forEach(function (r) {
          var cell = r[c2];
          if (cell === '' || cell === undefined) return;
          splitElements(cell, t.delim).forEach(function (e) { arr2.push(e); });
        });
        if (arr2.length) sets.push({ name: nm2, elements: arr2 });
      }
    }

    // 去重 + 去空 + 丢空集合
    sets = sets.map(function (s) {
      return { name: String(s.name).trim(), elements: Array.from(new Set(s.elements.map(function (x) { return String(x).trim(); }).filter(Boolean))) };
    }).filter(function (s) { return s.elements.length > 0; });

    return {
      sets: sets, format: fmt, delim: t.delim, ncol: t.ncol,
      header: header, rows: rowsAll, headerIsData: headerIsData
    };
  }

  function detectSetFormat(t, headerIsData) {
    if (!t.ncol) return 'long';
    var header = t.header || [];
    var headerLike = looksLikeHeaderRow(header);

    if (t.ncol <= 2) {
      if (headerLike) return 'long';
      // 两列且首行不像表头：用首列唯一值比例判断
      // 集合名会大量重复 → 长表；两列都是元素名（基本唯一）→ 分列
      var col0 = (headerIsData ? [header[0]] : []).concat(t.rows.map(function (r) { return r[0]; }));
      col0 = col0.map(function (v) { return String(v === undefined ? '' : v).trim(); }).filter(Boolean);
      if (!col0.length) return 'long';
      var uniq = new Set(col0).size;
      return (uniq / col0.length) <= 0.65 ? 'long' : 'columns';
    }
    if (headerLike) return 'long';

    // 判断除首列外的单元格是否都是二值
    var binaryCols = 0, totalCols = t.ncol - 1;
    for (var c = 1; c < t.ncol; c++) {
      var vals = t.rows.map(function (r) { return r[c]; }).filter(function (v) { return v !== '' && v !== undefined; });
      if (!vals.length) continue;
      var ok = vals.filter(function (v) { return parseBinary(v) !== null; }).length / vals.length;
      if (ok >= 0.95) binaryCols++;
    }
    if (totalCols > 0 && binaryCols === totalCols) return 'wide';
    return 'columns';
  }

  /* ------------------------------ GMT 解析 ------------------------------ */

  /**
   * GMT 基因集文件：每行 term <TAB> description <TAB> gene1 <TAB> gene2 ...
   * 返回 [{term, description, genes:[]}]
   */
  function parseGMT(text) {
    var out = [];
    text.split(/\r?\n/).forEach(function (line) {
      line = line.replace(/\ufeff/g, '');
      if (!line.trim() || line[0] === '#') return;
      var parts = line.split('\t');
      if (parts.length < 3) parts = line.split(/\s{2,}|\s+/);
      if (parts.length < 3) return;
      var term = parts[0].trim(), desc = (parts[1] || '').trim();
      var genes = parts.slice(2).map(function (g) { return g.trim(); }).filter(Boolean);
      if (!term || !genes.length) return;
      out.push({ term: term, description: desc, genes: Array.from(new Set(genes)) });
    });
    return out;
  }

  /* ---------------------------- 基因列表解析 ----------------------------- */

  /** 从自由文本中提取基因名（自动识别制表符/逗号/分号/换行/空格分隔，忽略表头） */
  function parseGeneList(text, opt) {
    opt = opt || {};
    var genes = [];
    text.split(/\r?\n/).forEach(function (line, li) {
      if (!line.trim() || /^\s*[#%]/.test(line)) return;
      var parts = line.split(/[\t,;，；、\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      parts.forEach(function (g) {
        if (/^(gene|symbol|id|name|基因|基因名|list|listname)$/i.test(g)) return; // 跳过表头
        genes.push(g);
      });
    });
    return Array.from(new Set(genes));
  }

  /**
   * 多基因列表解析，两种输入：
   *   "A: TP53, BRCA1, ..."  （每行一个列表，冒号分隔）
   *   两列 long 格式：List <TAB> Gene
   */
  function parseMultiGeneList(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() && !/^\s*[#%]/.test(l); });
    if (!lines.length) return [];
    var groups = new Map();
    if (lines.some(function (l) { return /[:：]/.test(l); })) {
      lines.forEach(function (l) {
        var m = /^\s*(.+?)\s*[:：]\s*(.*)$/.exec(l);
        if (!m) return;
        var name = m[1].trim(), genes = m[2].split(/[\t,;，；、\s]+/).filter(Boolean);
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push.apply(groups.get(name), genes);
      });
    } else {
      lines.forEach(function (l) {
        var p = l.split(/[\t,;，；]/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (p.length < 2) return;
        var name = p[0];
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(p[1]);
      });
    }
    var out = [];
    groups.forEach(function (g, k) { out.push({ name: k, genes: Array.from(new Set(g)) }); });
    return out;
  }

  /* ---------------------------- 数值矩阵解析 ----------------------------- */

  /**
   * 宽表 → 数值矩阵
   * 首列为行名（可选），首行为列名（可选）；缺失值记为 NaN
   * @returns {{rowNames:string[], colNames:string[], matrix:number[][], raw:string[][]}}
   */
  function parseMatrix(text, opt) {
    opt = opt || {};
    var t = parseTable(text, opt);
    var rows = t.rows.slice(), header = t.header ? t.header.slice() : null;
    var hasRowNames = opt.rowNames !== undefined ? !!opt.rowNames
      : (header && header.length > 1 && !isNumericCell(header[0]) && header[0] !== '');
    if (!header) {
      header = [];
      for (var i = 0; i < t.ncol; i++) header.push(hasRowNames && i === 0 ? 'ID' : 'V' + i);
    }
    var rowNames = [], colNames = [], matrix = [], raw = [];
    var c0 = hasRowNames ? 1 : 0;
    for (var c = c0; c < header.length; c++) colNames.push((header[c] || ('V' + c)).trim());
    rows.forEach(function (r, ri) {
      if (opt.maxRows && ri >= opt.maxRows) return;
      rowNames.push(hasRowNames ? (r[0] || ('row' + (ri + 1))) : ('row' + (ri + 1)));
      var vals = [];
      for (var c2 = c0; c2 < header.length; c2++) vals.push(num(r[c2]));
      matrix.push(vals);
      raw.push(r.slice());
    });
    return { rowNames: rowNames, colNames: colNames, matrix: matrix, raw: raw, delim: t.delim };
  }

  /** 长表 (id, variable, value) → 宽矩阵 */
  function pivotLong(text, opt) {
    var t = parseTable(text, opt);
    if (t.ncol < 3) throw new Error(WB.t('长表至少需要 3 列：样本ID / 变量名 / 数值'));
    var idIdx = 0, varIdx = 1, valIdx = 2;
    var hdr = (t.header || []).join(',').toLowerCase();
    if (/value|数值|表达|expr/.test(hdr)) {
      var parts = (t.header || []).map(function (h) { return String(h).toLowerCase(); });
      parts.forEach(function (h, i) {
        if (/^(sample|id|样本|gene|geneid)/.test(h)) idIdx = i;
        else if (/^(variable|feature|gene|变量|指标)/.test(h)) varIdx = i;
        else if (/^(value|数值|expr|expression|count)/.test(h)) valIdx = i;
      });
    }
    var ids = [], vars = [], dict = new Map();
    t.rows.forEach(function (r) {
      var id = r[idIdx], v = r[varIdx];
      if (id === '' || v === '') return;
      if (!dict.has(id)) { dict.set(id, new Map()); ids.push(id); }
      dict.get(id).set(v, num(r[valIdx]));
      if (vars.indexOf(v) < 0) vars.push(v);
    });
    var matrix = ids.map(function (id) {
      return vars.map(function (v) { var m = dict.get(id); return m.has(v) ? m.get(v) : NaN; });
    });
    return { rowNames: ids, colNames: vars, matrix: matrix, raw: [] };
  }

  /** 相关/绘图用的列对象转换 */
  function matrixToCols(m, minValid) {
    minValid = minValid || 3;
    return m.colNames.map(function (name, j) {
      var values = m.matrix.map(function (r) { return r[j]; });
      return { name: name, values: values };
    }).filter(function (c) {
      return c.values.filter(function (v) { return isFinite(v); }).length >= minValid;
    });
  }

  /* ---------------------------- 火山图数据 ------------------------------- */

  /**
   * 期望列：gene/id  |  log2FC  |  pvalue(/padj)
   * 也接受只有 fc + p 的两列数据
   */
  function parseVolcano(text, opt) {
    var t = parseTable(text, opt);
    var header = (t.header || []).map(function (h) { return String(h).toLowerCase().trim(); });
    if (!t.rows.length) throw new Error(WB.t('数据为空'));
    var iGene = 0, iFC = 1, iP = 2, hasPadj = false;
    header.forEach(function (h, i) {
      if (/^(gene|symbol|id|name|gene_id|基因|基因名)$/.test(h)) iGene = i;
      else if (/log2?fc|log2_?fold|foldchange|fold_change|差异倍数|log2foldchange/.test(h)) iFC = i;
      else if (/padj|adj\.?p|fdr|qvalue|q_value|adjust/.test(h)) { iP = i; hasPadj = true; }
      else if (/^p(\.?value|_?val)?$|pval|p_value|pvalue/.test(h) && !hasPadj) iP = i;
    });
    if (!header.length) { iGene = -1; iFC = 0; iP = 1; }
    var rows = [];
    t.rows.forEach(function (r, i) {
      var fc = num(r[iFC]), p = num(r[iP]);
      if (!isFinite(fc) || !isFinite(p)) return;
      rows.push({ gene: iGene >= 0 ? (r[iGene] || ('gene' + (i + 1))) : ('gene' + (i + 1)), log2FC: fc, p: p });
    });
    if (!rows.length) throw new Error(WB.t('未能解析出有效的 log2FC / p 值列，请检查列名与数据'));
    return { rows: rows, hasPadj: hasPadj, pLabel: hasPadj ? 'padj' : 'pvalue' };
  }

  /**
   * 智能拆分「ID 列 / 分组列 / 数值列」
   * 规则：首列若非数值 → 视为行名（样本/基因 ID）；其余列中数值列作为特征，
   *       第一个非数值列作为分组（若 opt.groupColumn 指定列名则以其为准）
   * @returns {{rowNames, features:[{name,values,index}], group:{name,values}|null, extra:[], nRows, delim}}
   */
  function splitNumericTable(text, opt) {
    opt = opt || {};
    var t = parseTable(text, opt);
    var header = t.header || [];
    var rows = t.rows;
    if (!rows.length) throw new Error(WB.t('数据为空'));
    var ncol = header.length || t.ncol;

    function colNumericRatio(c) {
      var vals = rows.map(function (r) { return r[c]; }).filter(function (v) { return v !== '' && v !== undefined; });
      if (!vals.length) return 0;
      var ok = vals.filter(function (v) { return isNumericCell(v); }).length;
      return ok / vals.length;
    }
    var isNum = [];
    for (var c = 0; c < ncol; c++) isNum.push(colNumericRatio(c) >= 0.9);

    var start = 0, rowNames = null;
    if (!isNum[0] && ncol > 1) {
      rowNames = rows.map(function (r, i) { return r[0] || ('row' + (i + 1)); });
      start = 1;
    } else {
      rowNames = rows.map(function (_, i) { return 'row' + (i + 1); });
    }

    var features = [], group = null, extra = [];
    var allowExtra = !!opt.allowExtra;
    for (var c2 = start; c2 < ncol; c2++) {
      var name = (header[c2] === undefined || header[c2] === '') ? ('V' + c2) : String(header[c2]);
      if (isNum[c2]) {
        features.push({
          name: name, index: c2,
          values: rows.map(function (r) { return num(r[c2]); })
        });
      } else if (!group) {
        group = { name: name, values: rows.map(function (r) { return (r[c2] === undefined ? '' : String(r[c2]).trim()); }) };
      } else if (allowExtra) {
        extra.push(name);
      } else {
        extra.push(name);
      }
    }
    return {
      rowNames: rowNames, features: features, group: group, extra: extra,
      nRows: rows.length, nCol: ncol, delim: t.delim, table: t
    };
  }

  WB.parse = {
    detectDelimiter: detectDelimiter, parseTable: parseTable, splitLine: splitLine,
    isNumericCell: isNumericCell, num: num,
    parseSets: parseSets, detectSetFormat: detectSetFormat, splitElements: splitElements,
    parseGMT: parseGMT, parseGeneList: parseGeneList, parseMultiGeneList: parseMultiGeneList,
    parseMatrix: parseMatrix, matrixToCols: matrixToCols, pivotLong: pivotLong,
    parseVolcano: parseVolcano, splitNumericTable: splitNumericTable
  };
})(window);
