/* =============================================================================
 * tools/enrichment.js  —  富集分析（ORA：超几何检验 + BH 校正）
 * 基因集来源：内置示例库 / 本地 GMT / Enrichr 在线库
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块与页面标题 */
    '富集分析 / ORA': 'Enrichment analysis / ORA',
    'GO / KEGG / Reactome 等基因集富集：超几何检验 + BH 校正，输出气泡图、条形图与结果表。':
      'Gene-set enrichment for GO / KEGG / Reactome etc.: hypergeometric test + BH correction, with dot plot, bar plot and result table.',
    'GMT 上传': 'GMT upload',
    '气泡图': 'Dot plot',
    '富集分析（ORA）': 'Enrichment analysis (ORA)',
    '输入差异基因列表，与基因集库做超几何检验（等价 Fisher 精确检验单侧），输出显著富集通路。':
      'Enter a differential gene list and run a hypergeometric test (equivalent to a one-sided Fisher exact test) against gene-set libraries to output significantly enriched pathways.',

    /* 输入格式 */
    '# 也可以这样写：': '# or simply write:',
    '# 或两列 long 表：': '# or a two-column long table:',
    '单列基因名（推荐）': 'Single-column gene names (recommended)',
    ['<b>一行一个基因名</b>，支持一次粘贴多列（会自动展平）。也识别逗号、分号、空格分隔。' +
      '若含表头（如 <code>gene</code> / <code>symbol</code>）会自动跳过。']:
      '<b>One gene name per line</b>; you can paste several columns at once (they are flattened automatically). ' +
      'Comma-, semicolon- and space-separated input is also recognised. A header row (e.g. <code>gene</code> / <code>symbol</code>) is skipped automatically.',
    '多列表（分组对比）': 'Multi-list table (group comparison)',
    ['每行一个基因列表，格式 <code>列表名: 基因1, 基因2, ...</code>；' +
      '或使用两列 long 表 <code>List &lt;TAB&gt; Gene</code>。适合「上调/下调分别富集」或不同分群的对比。']:
      'One gene list per line, as <code>listName: gene1, gene2, ...</code>; ' +
      'or a two-column long table <code>List &lt;TAB&gt; Gene</code>. Suitable for enriching up-/down-regulated genes separately or comparing different groups.',

    /* 输入面板 */
    '输入基因列表': 'Input gene list',
    '分析参数': 'Analysis parameters',
    '输入模式': 'Input mode',
    '单个基因列表': 'Single gene list',
    '多个列表（分组对比）': 'Multiple lists (group comparison)',
    '基因集最小基因数': 'Min genes per gene set',
    '基因集最大基因数': 'Max genes per gene set',
    '多重检验校正': 'Multiple-testing correction',
    '不校正（原始 P）': 'No correction (raw P)',
    '显著性阈值': 'Significance threshold',
    '显示前 N 个通路': 'Show top N terms',
    '气泡图 X 轴': 'Dot plot X axis',
    '富集倍数 (Fold enrichment)': 'Fold enrichment',
    'Rich factor (k/K)': 'Rich factor (k/K)',
    'Gene ratio (k/n)': 'Gene ratio (k/n)',
    '排序方式': 'Sort by',
    '按 P 值（最显著在前）': 'By P value (most significant first)',
    '按富集倍数': 'By fold enrichment',
    '按交集基因数': 'By overlap size',
    '背景基因集（可选，每行一个 / 逗号分隔）': 'Background gene set (optional; one per line / comma-separated)',
    '留空则以所选基因集库中的全部基因为背景。若实验仅检测了部分基因（如靶向 panel / 芯片），请务必填写真实背景。':
      'Leave blank to use all genes in the selected library as the background. If only a subset of genes was assayed (e.g. a targeted panel or microarray), be sure to provide the true background.',
    '开始富集分析': 'Run enrichment analysis',

    /* 统计概览与信息提示 */
    '基因集库': 'Gene-set libraries',
    '{n} 条': '{n} sets',
    '背景基因数 (N)': 'Background genes (N)',
    '基因列表数': 'Gene lists',
    '输入基因数 (n)': 'Input genes (n)',
    '未匹配到背景': 'Unmatched to background',
    '显著通路 (FDR ≤ {p})': 'Significant terms (FDR ≤ {p})',
    '基因集来源：<b>{src}</b>；检验方法：超几何检验（上尾，过表征），校正方法：<b>{adj}</b>；用时 {dt} s。':
      'Gene-set source: <b>{src}</b>; test: hypergeometric test (upper tail, over-representation); correction: <b>{adj}</b>; elapsed {dt} s.',
    '有 <b>{n}</b> 个输入基因不在背景基因集中，已自动忽略：':
      'Some <b>{n}</b> input genes are not in the background gene set and were ignored: ',

    /* 结果卡片与图表 */
    '富集结果对比图': 'Enrichment comparison plot',
    '富集结果图': 'Enrichment plot',
    '条形图': 'Bar plot',
    '全部富集结果（{n} 行）': 'All enrichment results ({n} rows)',
    '全部富集结果（{n} 行，已按 P 值排序）': 'All enrichment results ({n} rows, sorted by P value)',
    '没有基因集通过筛选（基因集大小 {a}~{b}，且至少 1 个交集基因）。可放宽基因集大小范围后重试。':
      'No gene set passed the filter (set size {a}~{b}, with at least 1 overlapping gene). Try widening the gene-set size range.',

    /* 结果表 */
    '基因列表': 'Gene list',
    '通路 / 基因集': 'Term / gene set',
    '基因集大小': 'Set size',
    '交集': 'Overlap',
    '富集倍数': 'Fold enrichment',
    'P 值': 'P value',
    '交集基因': 'Overlapping genes',
    '导出': 'Export',
    '导出该通路的交集基因': 'Export overlapping genes of this term',
    'FDR 列已按 {n} 条基因集完成多重检验校正；标红行为 FDR ≤ {p} 的显著通路。每行「TSV」按钮可导出该通路的交集基因。':
      'The FDR column is corrected for multiple testing across {n} gene sets; highlighted rows are significant terms with FDR ≤ {p}. The “TSV” button on each row exports the overlapping genes of that term.',

    /* 基因集来源组件 */
    '基因集来源（富集分析的注释库）': 'Gene-set source (annotation library for enrichment)',
    '内置示例基因集': 'Built-in example gene sets',
    '16 条示例通路，<b>仅供功能演示</b>，不可用于正式分析':
      '16 example pathways, <b>for demonstration only</b>; not for formal analysis.',
    '上传 / 粘贴 GMT 文件': 'Upload / paste a GMT file',
    '推荐：来源与版本完全可控（MSigDB、GO、KEGG 官网下载的 .gmt）':
      'Recommended: source and version fully under your control (.gmt downloaded from MSigDB, GO or KEGG).',
    '在线获取 Enrichr 基因集库': 'Fetch Enrichr libraries online',
    '需联网；首次获取后缓存在浏览器本地，之后可离线复用':
      'Requires internet; after the first fetch it is cached in your browser for offline reuse.',
    '将使用内置的 <b>{n}</b> 条示例基因集（{list} 等）。示例基因列表在这套通路里会得到「细胞周期 / 有丝分裂」显著富集，可用于验证流程。':
      'Will use the built-in <b>{n}</b> example gene sets ({list} etc.). The example gene list yields significant enrichment for “cell cycle / mitosis” here, which can be used to validate the workflow.',
    '、': ', ',
    '尚未选择文件。': 'No file selected yet.',
    '选择 .gmt 文件': 'Choose .gmt file',
    '已加载 <b>{file}</b>：解析出 <b>{n}</b> 条基因集。': 'Loaded <b>{file}</b>: parsed <b>{n}</b> gene sets.',
    '例如：{list}': 'e.g. {list}',
    '未解析到基因集，请确认是标准 GMT（制表符分隔）':
      'No gene set parsed — please make sure it is a standard GMT (tab-separated).',
    '或直接粘贴 GMT 文本（每行：通路名 <TAB> 描述 <TAB> 基因1 <TAB> 基因2 …）':
      'Or paste GMT text directly (per line: term name <TAB> description <TAB> gene1 <TAB> gene2 …)',
    '已解析 <b>{n}</b> 条基因集。': 'Parsed <b>{n}</b> gene sets.',
    '尚未解析到基因集。': 'No gene sets parsed yet.',

    /* Enrichr 在线库交互 */
    '① 获取可用基因集库列表': '① Fetch available library list',
    '（先获取列表）': '(fetch the list first)',
    '② 获取所选基因集库': '② Fetch the selected library',
    '在线模式需要联网。若网络受限，请改用「上传／粘贴 GMT 文件」。':
      'Online mode requires internet. If the network is restricted, use “Upload / paste a GMT file” instead.',
    '正在获取 Enrichr 基因集库列表…': 'Fetching the Enrichr library list…',
    '（请选择基因集库，共 {n} 个）': '(select a library — {n} available)',
    '（{n} 条通路）': ' ({n} terms)',
    '获取到 {n} 个基因集库': 'Fetched {n} gene-set libraries',
    '共 <b>{n}</b> 个基因集库可选。选择后点「获取」。':
      '<b>{n}</b> gene-set libraries available. Pick one, then click “Fetch”.',
    '（常用库）': ' (common)',
    '<span style="color:#d6483f">无法访问 Enrichr：{msg}</span><br>已列出常用库名供选择，但获取仍需联网。离线使用请改用 GMT 上传。':
      '<span style="color:#d6483f">Cannot reach Enrichr: {msg}</span><br>Common library names are listed for selection, but fetching still needs internet. For offline use, upload a GMT instead.',
    '获取中…': 'Fetching…',
    '已获取 <b>{lib}</b>：{n} 条基因集，用时 {t} s': 'Fetched <b>{lib}</b>: {n} gene sets in {t} s',
    '（该库较大，未写入本地缓存）': ' (library too large; not cached locally)',
    '（已缓存到浏览器）': ' (cached in your browser)',
    '已获取 {n} 条基因集': 'Fetched {n} gene sets',
    '<span style="color:#d6483f">获取失败：{msg}</span><br>可改用 GMT 上传方式，或到 Enrichr 官网下载该库的 .gmt 文件。':
      '<span style="color:#d6483f">Fetch failed: {msg}</span><br>Use the GMT upload option instead, or download the .gmt file from the Enrichr website.',
    ['<span style="opacity:.8">库名说明：<code>GO_Biological_Process_2023</code> 生物学过程、' +
      '<code>KEGG_2021_Human</code> KEGG 通路、<code>Reactome_2022</code> Reactome、' +
      '<code>MSigDB_Hallmark_2020</code> Hallmark 基因集。</span>']:
      '<span style="opacity:.8">Library names: <code>GO_Biological_Process_2023</code> biological process, ' +
      '<code>KEGG_2021_Human</code> KEGG pathway, <code>Reactome_2022</code> Reactome, ' +
      '<code>MSigDB_Hallmark_2020</code> Hallmark gene sets.</span>',

    /* 结果与错误提示 */
    '内置示例基因集（16 条，仅供演示）': 'Built-in example gene sets (16, example only)',
    '本地 GMT': 'Local GMT',
    '（{n}）': ' ({n})',
    'Enrichr 在线库': 'Enrichr online library',
    '：{n}': ': {n}',
    '输入列表': 'Input list',
    '请求超时（{n} 秒）': 'Request timed out ({n} s)',
    '返回内容不是有效的 GMT': 'The response is not a valid GMT',
    '还没有可用的基因集。请选择「内置示例库」「上传 GMT」或「在线获取 Enrichr 库」。':
      'No gene sets available. Please choose “Built-in example sets”, “Upload GMT” or “Fetch Enrichr libraries online”.',
    '多列表模式未解析到数据，请用「列表名: 基因1, 基因2…」格式':
      'No data parsed in multi-list mode — use the format “listName: gene1, gene2…”.',
    '未解析到任何基因，请检查输入': 'No genes parsed — please check the input.',
    '输入基因与背景基因集没有任何交集，请检查基因命名（大小写/物种）与背景设置':
      'The input genes have no overlap with the background gene set — check the gene naming (case/species) and background settings.'
  });

  var ENRICHR_BASE = 'https://maayanlab.cloud/Enrichr/';
  var CACHE_PREFIX = 'wb_enrichr_gmt_';

  // 联网不可用时的兜底常用库（均为 Enrichr 上长期存在的库名）
  var FALLBACK_LIBS = [
    'KEGG_2021_Human', 'GO_Biological_Process_2023', 'GO_Cellular_Component_2023',
    'GO_Molecular_Function_2023', 'Reactome_2022', 'MSigDB_Hallmark_2020',
    'WikiPathway_2023_Human', 'Human_Gene_Atlas'
  ];

  /* ------------------------------ 网络请求 ------------------------------- */

  function fetchWithTimeout(url, ms) {
    return new Promise(function (resolve, reject) {
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        reject(new Error(T('请求超时（{n} 秒）', { n: Math.round(ms / 1000) })));
      }, ms || 45000);
      fetch(url, { signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          clearTimeout(timer);
          if (!r.ok) return reject(new Error('HTTP ' + r.status));
          resolve(r.text());
        })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function loadLibraryList() {
    return fetchWithTimeout(ENRICHR_BASE + 'datasetStatistics', 30000).then(function (txt) {
      var j = JSON.parse(txt);
      var arr = (j.statistics || []).map(function (s) {
        return {
          name: s.libraryName,
          terms: Number(s.numTerms) || 0,
          genes: Number(s.geneCoverage) || 0,
          genesPerTerm: Number(s.genesPerTerm) || 0
        };
      }).filter(function (x) { return x.name; });
      arr.sort(function (a, b) { return a.name.localeCompare(b.name); });
      return arr;
    });
  }

  function gmtCacheKey(name) { return CACHE_PREFIX + name; }

  function fetchGMT(name) {
    var mem = WB._gmtMem = WB._gmtMem || {};
    if (mem[name]) return Promise.resolve(mem[name]);
    try {
      var cached = localStorage.getItem(gmtCacheKey(name));
      if (cached) { mem[name] = cached; return Promise.resolve(cached); }
    } catch (e) { /* localStorage 不可用 */ }
    return fetchWithTimeout(ENRICHR_BASE + 'geneSetLibrary?mode=text&libraryName=' + encodeURIComponent(name), 90000)
      .then(function (txt) {
        if (!txt || txt.indexOf('\t') < 0) throw new Error(T('返回内容不是有效的 GMT'));
        mem[name] = txt;
        if (txt.length < 3 * 1024 * 1024) {
          try { localStorage.setItem(gmtCacheKey(name), txt); } catch (e) { }
        }
        return txt;
      });
  }

  /* ------------------------------ 富集计算 ------------------------------- */

  /**
   * @param {string[]} inputGenes  输入基因
   * @param {Array} geneSets       [{term, description, genes:[]}]
   * @param {object} opt           {minSize,maxSize,minOverlap,padjust,background:[]|null}
   */
  function oraRun(inputGenes, geneSets, opt) {
    opt = opt || {};
    var minSize = opt.minSize === undefined ? 5 : opt.minSize;
    var maxSize = opt.maxSize === undefined ? 500 : opt.maxSize;
    var minOverlap = opt.minOverlap === undefined ? 1 : opt.minOverlap;

    var universeSet;
    if (opt.background && opt.background.length) universeSet = new Set(opt.background);
    else {
      universeSet = new Set();
      geneSets.forEach(function (gs) { gs.genes.forEach(function (g) { universeSet.add(g); }); });
    }
    var N = universeSet.size;

    var mapped = [], unmapped = [];
    Array.from(new Set(inputGenes)).forEach(function (g) {
      if (universeSet.has(g)) mapped.push(g); else unmapped.push(g);
    });
    var n = mapped.length;
    var inputSet = new Set(mapped);

    var rows = [], tested = 0, skippedSize = 0;
    geneSets.forEach(function (gs) {
      var inU = gs.genes.filter(function (g) { return universeSet.has(g); });
      var K = inU.length;
      if (K < minSize || K > maxSize || K > N) { skippedSize++; return; }
      var overlap = inU.filter(function (g) { return inputSet.has(g); });
      var k = overlap.length;
      if (k < Math.max(1, minOverlap)) return;
      tested++;
      var t = WB.stats.hypergeomTest(k, K, N - K, n, 'greater');
      var expected = N > 0 ? n * K / N : 0;
      rows.push({
        term: gs.term,
        description: gs.description || '',
        setSize: K,
        overlap: k,
        overlapGenes: overlap,
        expected: expected,
        foldEnrichment: (K > 0 && n > 0) ? (k / n) / (K / N) : NaN,
        richFactor: K > 0 ? k / K : NaN,
        geneRatio: n > 0 ? k / n : NaN,
        p: t.p,
        oddsRatio: t.oddsRatio
      });
    });

    if (!rows.length) {
      return {
        rows: [], stats: { N: N, n: n, unmapped: unmapped, tested: 0, skippedSize: skippedSize, sig: 0, minP: NaN }
      };
    }
    var pv = rows.map(function (r) { return r.p; });
    var adj = WB.stats.pAdjust(pv, opt.padjust || 'BH');
    rows.forEach(function (r, i) { r.padj = adj[i]; r.negLogP = -Math.log10(Math.max(r.padj, 1e-300)); });
    rows.sort(function (a, b) { return a.p - b.p || b.overlap - a.overlap; });

    var sig = rows.filter(function (r) { return r.padj <= (opt.pCut === undefined ? 0.05 : opt.pCut); }).length;
    return {
      rows: rows,
      stats: {
        N: N, n: n, unmapped: unmapped, tested: tested, skippedSize: skippedSize,
        sig: sig, minP: rows.length ? rows[0].p : NaN
      }
    };
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function termLabels(rows, maxUnits, maxLines) {
    return rows.map(function (r) {
      var t = r.description && r.description.length && r.description !== r.term
        ? r.term : r.term;
      return WB.plot.wrapText(t.replace(/_/g, ' '), maxUnits, maxLines || 2);
    });
  }

  function drawDotPlot(container, rows, opt) {
    var n = rows.length;
    if (!n) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var metric = opt.metric || 'fold';
    var metricLabel = { fold: T('enr.metricFold'), ratio: T('enr.metricRatio'), rich: T('enr.metricRich') }[metric];
    var valueOf = function (r) {
      return metric === 'ratio' ? r.geneRatio : (metric === 'rich' ? r.richFactor : r.foldEnrichment);
    };
    var vals = rows.map(valueOf).filter(function (v) { return isFinite(v); });
    var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    if (!isFinite(vmin)) { vmin = 0; vmax = 1; }
    if (vmin === vmax) { vmax = vmin + 1; }
    var pad = (vmax - vmin) * 0.06;
    vmin = Math.max(0, vmin - pad); vmax = vmax + pad;

    var labelW = opt.labelW || 268;
    var labelChars = Math.max(18, Math.floor((labelW - 18) / 6.6));
    var labels = termLabels(rows, labelChars, 2);
    var rowH = opt.rowH || 27;
    var lineH = 13;
    var maxLines = 1;
    labels.forEach(function (l) { maxLines = Math.max(maxLines, l.length); });
    if (maxLines > 1) rowH = Math.max(rowH, 12 + maxLines * lineH);
    var headerH = 14, footerH = 74;
    var width = opt.width || 720;
    var plotW = width - labelW - 204;   // 右侧预留图例区
    var height = headerH + n * rowH + footerH + 20;

    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var sc = WB.plot.linearScale(vmin, vmax, 0, plotW);
    var X = function (v) { return labelW + sc(v); };

    // 网格
    sc.ticks(6).forEach(function (t) {
      if (t < vmin || t > vmax) return;
      root.appendChild(S('line', {
        x1: X(t), y1: headerH - 4, x2: X(t), y2: headerH + n * rowH,
        stroke: '#eef3f7', 'shape-rendering': 'crispEdges'
      }));
    });
    // 行分隔
    for (var i = 0; i <= n; i++) {
      root.appendChild(S('line', {
        x1: labelW, y1: headerH + i * rowH, x2: labelW + plotW, y2: headerH + i * rowH,
        stroke: i === n ? '#c9d5df' : '#f5f9fc', 'shape-rendering': 'crispEdges'
      }));
    }

    var kMax = Math.max.apply(null, rows.map(function (d) { return d.overlap; }));
    var rMax = opt.rmax || 9.5, rMin = 3;
    var negMax = Math.max(1.5, Math.max.apply(null, rows.map(function (d) { return d.negLogP; })));
    var colF = WB.plot.ramp('orrd');
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;

    // Y 轴标签 + 点
    rows.forEach(function (r, i) {
      var cy = headerH + i * rowH + rowH / 2;
      var lines = labels[i];
      var startY = cy - (lines.length - 1) * lineH / 2 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * lineH, ln, {
          'text-anchor': 'end', 'font-size': 11.5,
          fill: r.padj <= pCut ? WB.plot.TEXT : '#8fa0ae'
        }));
      });
      var v = valueOf(r);
      var cx = X(isFinite(v) ? v : vmin);
      var rad = rMin + (rMax - rMin) * Math.sqrt(r.overlap / Math.max(1, kMax));
      var dot = S('circle', {
        cx: cx, cy: cy, r: rad,
        fill: colF(Math.min(1, r.negLogP / negMax)),
        stroke: '#ffffff', 'stroke-width': 1
      });
      root.appendChild(dot);
      WB.plot.bindTip(dot, function () {
        return '<b>' + r.term + '</b>' +
          (r.description && r.description !== r.term ? '<br><span style="opacity:.8">' + r.description + '</span>' : '') +
          '<br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
          '<br>' + T('enr.tipFold', { f: WB.formatNum(r.foldEnrichment, 2), r: WB.formatNum(r.richFactor, 3) }) +
          '<div style="margin-top:4px;max-width:300px;white-space:normal">' + r.overlapGenes.slice(0, 14).join(', ') +
          (r.overlapGenes.length > 14 ? ' …' : '') + '</div>';
      });
    });

    // X 轴
    var axisG = WB.plot.axisBottom(sc, plotW, { ticks: 6, format: function (v) { return WB.formatNum(v, 2); } });
    axisG.setAttribute('transform', 'translate(' + labelW + ',' + (headerH + n * rowH) + ')');
    root.appendChild(axisG);
    root.appendChild(WB.plot.txt(labelW + plotW / 2, headerH + n * rowH + 44, metricLabel, {
      'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT
    }));

    // 图例：颜色条
    var lx = width - 158, ly = headerH + 4;
    var nSeg = 40;
    for (var s2 = 0; s2 < nSeg; s2++) {
      root.appendChild(S('rect', {
        x: lx, y: ly + s2 * 5, width: 12, height: 5.2,
        fill: colF(1 - s2 / (nSeg - 1))
      }));
    }
    root.appendChild(WB.plot.txt(lx + 17, ly + 5, WB.formatNum(negMax, 1), { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5, '0', { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 17, ly + nSeg * 5 / 2 + 3, T('common.negLogFdr'), { 'font-size': 10, fill: WB.plot.TEXT }));
    // 0 刻度
    if (vmin <= 0 && vmax >= 0) {
      root.appendChild(S('line', {
        x1: X(0), y1: headerH - 4, x2: X(0), y2: headerH + n * rowH,
        stroke: '#dde6ed', 'shape-rendering': 'crispEdges'
      }));
    }

    // 点尺寸图例
    var sizes = [Math.max(1, Math.round(kMax * 0.25)), Math.max(2, Math.round(kMax * 0.6)), kMax];
    sizes = Array.from(new Set(sizes));
    var sizeTop = ly + nSeg * 5 + 24;
    sizes.forEach(function (sv, si) {
      var rad2 = rMin + (rMax - rMin) * Math.sqrt(sv / Math.max(1, kMax));
      var cy2 = sizeTop + 22 + si * 20;
      root.appendChild(S('circle', { cx: lx + 8, cy: cy2, r: rad2, fill: '#c8d3dd', stroke: '#fff', 'stroke-width': 1 }));
      root.appendChild(WB.plot.txt(lx + 24, cy2 + 3.5, T('common.geneUnit', { n: sv }), { 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    root.appendChild(WB.plot.txt(lx - 2, sizeTop + 4, T('enr.overlapGenes'), { 'font-size': 10.5, fill: WB.plot.TEXT }));

    container.appendChild(el('div.preview-note', {
      text: T('enr.dotNote')
    }));
    return canvas.svg;
  }

  function drawBarPlot(container, rows, opt) {
    var n = rows.length;
    if (!n) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var labelW = 268;
    var labelChars = Math.max(18, Math.floor((labelW - 18) / 6.6));
    var labels = termLabels(rows, labelChars, 2);
    var rowH = 24, lineH = 13;
    var width = opt.width || 720, plotW = width - labelW - 120;
    var height = 14 + n * rowH + 68;
    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;
    var vals = rows.map(function (r) { return Math.min(50, r.negLogP); });
    var vmax = Math.max.apply(null, vals);
    var sc = WB.plot.linearScale(0, vmax * 1.02, 0, plotW);
    var X = function (v) { return labelW + sc(v); };
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;
    var colF = WB.plot.ramp('orrd');
    var negMax = Math.max.apply(null, rows.map(function (d) { return d.negLogP; })) || 1;

    rows.forEach(function (r, i) {
      var y = 14 + i * rowH, cy = y + rowH / 2;
      var lines = labels[i];
      var startY = cy - (lines.length - 1) * lineH / 2 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * lineH, ln, {
          'text-anchor': 'end', 'font-size': 11.5,
          fill: r.padj <= pCut ? WB.plot.TEXT : '#8fa0ae'
        }));
      });
      var bw = Math.max(1, X(Math.min(50, r.negLogP)) - labelW);
      var rect = S('rect', {
        x: labelW, y: y + 3, width: bw, height: rowH - 7, rx: 3,
        fill: colF(Math.min(1, r.negLogP / negMax))
      });
      root.appendChild(rect);
      WB.plot.bindTip(rect, function () {
        return '<b>' + r.term + '</b><br>' + T('enr.tipStats', { p: WB.pFormat(r.p), q: WB.pFormat(r.padj) }) +
          '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) });
      });
      root.appendChild(WB.plot.txt(labelW + bw + 6, cy + 3.5, T('common.geneUnit', { n: r.overlap }), { 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    // 阈值线
    var xt = X(Math.min(50, -Math.log10(pCut)));
    root.appendChild(S('line', {
      x1: xt, y1: 6, x2: xt, y2: 14 + n * rowH, stroke: '#d6483f',
      'stroke-dasharray': '4 3', 'stroke-width': 1.2
    }));
    root.appendChild(WB.plot.txt(xt + 4, 12, T('enr.fdrThreshold', { v: pCut }), { 'font-size': 10, fill: '#d6483f' }));

    var axisG = WB.plot.axisBottom(sc, plotW, { ticks: 6, format: function (v) { return WB.formatNum(v, 1); } });
    axisG.setAttribute('transform', 'translate(' + labelW + ',' + (14 + n * rowH) + ')');
    root.appendChild(axisG);
    root.appendChild(WB.plot.txt(labelW + plotW / 2, 14 + n * rowH + 44, T('enr.negLogFdrCapped'), {
      'text-anchor': 'middle', 'font-size': 12, fill: WB.plot.TEXT
    }));
    return canvas.svg;
  }

  /** 多基因列表对比点图：x = 列表, y = 通路 */
  function drawCompareDotPlot(container, perList, opt) {
    // perList: [{name, rows}]
    var lists = perList.filter(function (p) { return p.rows.length; });
    if (!lists.length) { WB.plot.emptyState(container, T('enr.emptyPlot')); return null; }
    var topN = opt.topN || 15;
    var termSet = [];
    lists.forEach(function (p) { p.rows.slice(0, topN).forEach(function (r) { if (termSet.indexOf(r.term) < 0) termSet.push(r.term); }); });
    if (termSet.length > 44) termSet = termSet.slice(0, 44);
    // 按“显著次数”排序
    var counts = {};
    termSet.forEach(function (t) { counts[t] = 0; });
    lists.forEach(function (p) {
      p.rows.slice(0, topN).forEach(function (r) { if (counts[r.term] !== undefined) counts[r.term] += 1; });
    });
    termSet.sort(function (a, b) { return counts[b] - counts[a]; });

    var labelW = 268, colW = Math.max(64, Math.min(120, (opt.width - labelW - 160) / lists.length));
    var rowH = 26, headerH = 56;
    var width = labelW + colW * lists.length + 150;
    var height = headerH + termSet.length * rowH + 84;
    var canvas = WB.plot.createSVG(container, width, height, {});
    var root = canvas.root;

    var lookup = lists.map(function (p) {
      var m = new Map(); p.rows.forEach(function (r) { m.set(r.term, r); }); return m;
    });
    var all = [];
    lists.forEach(function (p) { p.rows.slice(0, topN).forEach(function (r) { all.push(r); }); });
    var kMax = Math.max.apply(null, all.map(function (r) { return r.overlap; }));
    var negMax = Math.max(1.5, Math.max.apply(null, all.map(function (r) { return r.negLogP; })));
    var pCut = opt.pCut === undefined ? 0.05 : opt.pCut;

    lists.forEach(function (p, j) {
      var cx = labelW + j * colW + colW / 2;
      root.appendChild(WB.plot.txt(cx, 22, WB.plot.ellipsis(p.name, 12), {
        'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: WB.plot.TEXT
      }));
      root.appendChild(WB.plot.txt(cx, 38, T('common.geneUnit', { n: p.stats.n }), { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    root.appendChild(S('line', {
      x1: labelW - 6, y1: headerH - 8, x2: width - 16, y2: headerH - 8,
      stroke: '#c9d5df', 'shape-rendering': 'crispEdges'
    }));

    var colF = WB.plot.ramp('orrd');
    termSet.forEach(function (t, i) {
      var cy = headerH + i * rowH + rowH / 2;
      var lines = WB.plot.wrapText(t.replace(/_/g, ' '), Math.floor((labelW - 18) / 6.6), 2);
      var startY = cy - (lines.length - 1) * 6.5 + 3.5;
      lines.forEach(function (ln, li) {
        root.appendChild(WB.plot.txt(labelW - 12, startY + li * 13, ln, {
          'text-anchor': 'end', 'font-size': 11.5, fill: WB.plot.TEXT
        }));
      });
      if (i % 2 === 1) {
        root.appendChild(S('rect', {
          x: labelW - 4, y: headerH + i * rowH, width: colW * lists.length + 8, height: rowH,
          fill: '#fafcfe'
        }));
      }
      lists.forEach(function (p, j) {
        var r = lookup[j].get(t);
        var cx = labelW + j * colW + colW / 2;
        if (!r) {
          var g0 = S('circle', { cx: cx, cy: cy, r: 3, fill: '#eef2f6' });
          root.appendChild(g0);
          return;
        }
        var rad = 3 + 6.5 * Math.sqrt(r.overlap / Math.max(1, kMax));
        var dot = S('circle', {
          cx: cx, cy: cy, r: rad,
          fill: colF(Math.min(1, r.negLogP / negMax)),
          stroke: '#fff', 'stroke-width': 1,
          opacity: r.padj <= pCut ? 1 : 0.42
        });
        root.appendChild(dot);
        WB.plot.bindTip(dot, function () {
          return '<b>' + t + '</b><br><b>' + p.name + '</b><br>FDR = ' + WB.pFormat(r.padj) +
            '<br>' + T('enr.tipOverlap', { k: r.overlap, K: r.setSize, e: r.expected.toFixed(1) }) +
            '　' + T('enr.fold') + ' ' + WB.formatNum(r.foldEnrichment, 2);
        });
      });
    });

    // 图例
    var lx = width - 92, ly = headerH;
    var nSeg = 30;
    for (var s = 0; s < nSeg; s++) {
      root.appendChild(S('rect', { x: lx, y: ly + s * 4.6, width: 11, height: 4.7, fill: colF(1 - s / (nSeg - 1)) }));
    }
    root.appendChild(WB.plot.txt(lx + 15, ly + 6, WB.formatNum(negMax, 1), { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx + 15, ly + nSeg * 4.6, '0', { 'font-size': 10, fill: WB.plot.MUTED }));
    root.appendChild(WB.plot.txt(lx - 2, ly + nSeg * 4.6 + 24, T('common.negLogFdr'), { 'font-size': 10, fill: WB.plot.TEXT }));
    root.appendChild(WB.plot.txt(lx - 2, ly + nSeg * 4.6 + 38, T('enr.pointSizeLegend'), { 'font-size': 10, fill: WB.plot.MUTED }));
    container.appendChild(el('div.preview-note', {
      text: T('enr.compareNote', { n: topN, p: pCut })
    }));
    return canvas.svg;
  }

  /* ------------------------------ 界面 ---------------------------------- */

  // 暴露核心函数，便于脚本化调用与自检
  WB.enrichment = {
    oraRun: oraRun, loadLibraryList: loadLibraryList, fetchGMT: fetchGMT,
    drawDotPlot: drawDotPlot, drawBarPlot: drawBarPlot, drawCompareDotPlot: drawCompareDotPlot,
    ENRICHR_BASE: ENRICHR_BASE
  };

  var GENE_FORMATS = [
    {
      name: '单列基因名（推荐）',
      filename: 'gene_list_template.txt',
      desc: '<b>一行一个基因名</b>，支持一次粘贴多列（会自动展平）。也识别逗号、分号、空格分隔。' +
        '若含表头（如 <code>gene</code> / <code>symbol</code>）会自动跳过。',
      sample: 'TP53\nBRCA1\nMKI67\nCCNB1\nCDK1\n...\n\n# 也可以这样写：\nTP53, BRCA1, MKI67, CCNB1'
    },
    {
      name: '多列表（分组对比）',
      filename: 'gene_list_multi_template.txt',
      desc: '每行一个基因列表，格式 <code>列表名: 基因1, 基因2, ...</code>；' +
        '或使用两列 long 表 <code>List &lt;TAB&gt; Gene</code>。适合「上调/下调分别富集」或不同分群的对比。',
      sample: 'Up: TP53, MKI67, CCNB1, CDK1, AURKA\n' +
        'Down: BRCA1, ATM, CDKN1A, BAX\n\n' +
        '# 或两列 long 表：\n' +
        'List\tGene\nUp\tTP53\nUp\tMKI67\nDown\tBRCA1'
    }
  ];

  WB.register({
    id: 'enrichment',
    name: '富集分析 / ORA',
    icon: '⬢',
    color: '#7d5bb8',
    desc: 'GO / KEGG / Reactome 等基因集富集：超几何检验 + BH 校正，输出气泡图、条形图与结果表。',
    tags: ['GO / KEGG', 'GMT 上传', '气泡图'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('富集分析（ORA）') }),
        el('p', { text: T('输入差异基因列表，与基因集库做超几何检验（等价 Fisher 精确检验单侧），输出显著富集通路。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入基因列表',
        accept: '.txt,.tsv,.csv,.list',
        formats: GENE_FORMATS,
        demoText: WB.demo.geneList,
        placeholder: 'TP53\nBRCA1\nMKI67\n...',
        paramsTitle: '分析参数',
        params: [
          {
            key: 'mode', label: '输入模式', type: 'select', value: 'single',
            options: [
              { value: 'single', label: '单个基因列表' },
              { value: 'multi', label: '多个列表（分组对比）' }
            ]
          },
          { key: 'minSize', label: '基因集最小基因数', type: 'number', value: 5, min: 1, max: 500, step: 1 },
          { key: 'maxSize', label: '基因集最大基因数', type: 'number', value: 500, min: 5, max: 5000, step: 10 },
          {
            key: 'padjust', label: '多重检验校正', type: 'select', value: 'BH',
            options: [
              { value: 'BH', label: 'Benjamini-Hochberg (FDR)' },
              { value: 'BONFERRONI', label: 'Bonferroni' },
              { value: 'HOLM', label: 'Holm' },
              { value: 'NONE', label: '不校正（原始 P）' }
            ]
          },
          { key: 'pCut', label: '显著性阈值', type: 'number', value: 0.05, min: 0.0001, max: 1, step: 0.01 },
          { key: 'topN', label: '显示前 N 个通路', type: 'number', value: 20, min: 3, max: 60, step: 1 },
          {
            key: 'metric', label: '气泡图 X 轴', type: 'select', value: 'fold',
            options: [
              { value: 'fold', label: '富集倍数 (Fold enrichment)' },
              { value: 'rich', label: 'Rich factor (k/K)' },
              { value: 'ratio', label: 'Gene ratio (k/n)' }
            ]
          },
          {
            key: 'sortBy', label: '排序方式', type: 'select', value: 'p',
            options: [
              { value: 'p', label: '按 P 值（最显著在前）' },
              { value: 'fold', label: '按富集倍数' },
              { value: 'overlap', label: '按交集基因数' }
            ]
          },
          {
            key: 'background', label: '背景基因集（可选，每行一个 / 逗号分隔）', type: 'textarea', rows: 3,
            width: 'full',
            hint: '留空则以所选基因集库中的全部基因为背景。若实验仅检测了部分基因（如靶向 panel / 芯片），请务必填写真实背景。'
          }
        ],
        runLabel: '开始富集分析',
        onRun: function (ctx) {
          var res = WB.$('#enrichment-result');
          WB.clear(res);
          var geneSource = collectGeneSets();
          if (!geneSource.sets.length) {
            throw new Error(T('还没有可用的基因集。请选择「内置示例库」「上传 GMT」或「在线获取 Enrichr 库」。'));
          }

          var opt = {
            minSize: Number(ctx.values.minSize) || 1,
            maxSize: Number(ctx.values.maxSize) || 500,
            minOverlap: 1,
            padjust: ctx.values.padjust,
            pCut: Number(ctx.values.pCut) || 0.05
          };
          if (ctx.values.background && ctx.values.background.trim()) {
            opt.background = WB.parse.parseGeneList(ctx.values.background);
          }

          var isMulti = ctx.values.mode === 'multi';
          var lists;
          if (isMulti) {
            lists = WB.parse.parseMultiGeneList(ctx.text);
            if (lists.length < 1) throw new Error(T('多列表模式未解析到数据，请用「列表名: 基因1, 基因2…」格式'));
          } else {
            var genes = WB.parse.parseGeneList(ctx.text);
            if (!genes.length) throw new Error(T('未解析到任何基因，请检查输入'));
            lists = [{ name: T('输入列表'), genes: genes }];
          }

          var t0 = performance.now();
          var perList = lists.map(function (L) {
            var r = oraRun(L.genes, geneSource.sets, opt);
            return { name: L.name, genes: L.genes, rows: r.rows, stats: r.stats };
          });
          var dt = performance.now() - t0;

          /* 概览 */
          var first = perList[0];
          var totalInput = lists.reduce(function (a, l) { return a + l.genes.length; }, 0);
          var totalUnmapped = perList.reduce(function (a, p) { return a + p.stats.unmapped.length; }, 0);
          var totalSig = perList.reduce(function (a, p) { return a + p.stats.sig; }, 0);
          res.appendChild(WB.ui.statBar([
            { label: T('基因集库'), value: T('{n} 条', { n: geneSource.sets.length }), },
            { label: T('背景基因数 (N)'), value: first.stats.N },
            { label: T(isMulti ? '基因列表数' : '输入基因数 (n)'), value: isMulti ? lists.length : first.stats.n },
            { label: T('未匹配到背景'), value: totalUnmapped, tone: totalUnmapped ? 'amber' : '' },
            { label: T('显著通路 (FDR ≤ {p})', { p: opt.pCut }), value: totalSig, tone: totalSig ? 'red' : '' }
          ]));

          res.appendChild(WB.ui.alertBox('info',
            T('基因集来源：<b>{src}</b>；检验方法：超几何检验（上尾，过表征），校正方法：<b>{adj}</b>；用时 {dt} s。',
              { src: geneSource.label, adj: opt.padjust, dt: (dt / 1000).toFixed(2) })));

          if (first.stats.unmapped.length) {
            res.appendChild(WB.ui.alertBox('warn',
              T('有 <b>{n}</b> 个输入基因不在背景基因集中，已自动忽略：', { n: first.stats.unmapped.length }) +
              '<span style="opacity:.8">' + first.stats.unmapped.slice(0, 25).join(', ') +
              (first.stats.unmapped.length > 25 ? ' …' : '') + '</span>'));
          }
          if (!first.stats.n) throw new Error(T('输入基因与背景基因集没有任何交集，请检查基因命名（大小写/物种）与背景设置'));

          var topN = Number(ctx.values.topN) || 20;
          var sortKey = ctx.values.sortBy;
          function sortRows(rows) {
            var a = rows.slice();
            if (sortKey === 'fold') a.sort(function (x, y) { return (y.foldEnrichment || 0) - (x.foldEnrichment || 0) || x.p - y.p; });
            else if (sortKey === 'overlap') a.sort(function (x, y) { return y.overlap - x.overlap || x.p - y.p; });
            else a.sort(function (x, y) { return x.p - y.p; });
            return a;
          }

          /* 图形 */
          var plotCard = WB.ui.resultCard(T(isMulti ? '富集结果对比图' : '富集结果图'));
          res.appendChild(plotCard);
          var plotBody = plotCard.querySelector('.card-body');

          if (isMulti) {
            var unionRows = [];
            perList.forEach(function (p) {
              sortRows(p.rows).slice(0, topN).forEach(function (r) {
                var found = unionRows.filter(function (u) { return u.term === r.term; })[0];
                if (!found) unionRows.push({ term: r.term, negLogP: r.negLogP });
                else found.negLogP = Math.max(found.negLogP, r.negLogP);
              });
            });
            unionRows.sort(function (a, b) { return b.negLogP - a.negLogP; });
            var holder2 = el('div.plot-holder');
            plotBody.appendChild(holder2);
            var svgC = drawCompareDotPlot(holder2, perList.map(function (p) {
              return { name: p.name, rows: sortRows(p.rows), stats: p.stats };
            }), { topN: topN, pCut: opt.pCut });
            if (svgC) WB.plot.addToolbar(plotBody, { getSvg: function () { return svgC; }, basename: 'enrichment_compare' });
          } else {
            var shown = sortRows(first.rows).slice(0, topN);
            var tabsDefs = [];
            var holderD = el('div.plot-holder');
            var holderB = el('div.plot-holder');
            var svgD = drawDotPlot(holderD, shown, { metric: ctx.values.metric, pCut: opt.pCut });
            var svgB = drawBarPlot(holderB, shown, { pCut: opt.pCut });
            var currentSvg = svgD;
            var tb = WB.ui.tabs([
              { label: T('气泡图'), content: holderD },
              { label: T('条形图'), content: holderB, onShow: function () { currentSvg = svgB; } }
            ]);
            tb.tabs[0].onShow = function () { currentSvg = svgD; };
            plotBody.appendChild(tb.node);
            WB.plot.addToolbar(plotBody, {
              getSvg: function () { return currentSvg; },
              basename: 'enrichment'
            });
          }

          /* 表格 */
          if (isMulti) {
            var allRows = [];
            perList.forEach(function (p) {
              p.rows.forEach(function (r) {
                allRows.push({
                  list: p.name, term: r.term, setSize: r.setSize, overlap: r.overlap,
                  foldEnrichment: r.foldEnrichment, p: r.p, padj: r.padj,
                  genes: r.overlapGenes, key: p.name + '||' + r.term
                });
              });
            });
            allRows.sort(function (a, b) { return a.p - b.p; });
            var c2 = WB.ui.resultCard(T('全部富集结果（{n} 行）', { n: allRows.length }));
            res.appendChild(c2);
            renderTable(c2.querySelector('.card-body'), allRows, true, opt.pCut, geneSource.sets.length);
          } else {
            var rows1 = first.rows.map(function (r) {
              return {
                term: r.term, description: r.description, setSize: r.setSize, overlap: r.overlap,
                expected: r.expected, foldEnrichment: r.foldEnrichment, richFactor: r.richFactor,
                geneRatio: r.geneRatio, p: r.p, padj: r.padj, genes: r.overlapGenes, key: r.term
              };
            });
            var c1 = WB.ui.resultCard(T('全部富集结果（{n} 行，已按 P 值排序）', { n: rows1.length }));
            res.appendChild(c1);
            renderTable(c1.querySelector('.card-body'), rows1, false, opt.pCut, geneSource.sets.length);
          }

          if (!first.rows.length) {
            res.appendChild(WB.ui.alertBox('warn',
              T('没有基因集通过筛选（基因集大小 {a}~{b}，且至少 1 个交集基因）。可放宽基因集大小范围后重试。',
                { a: opt.minSize, b: opt.maxSize })));
          }
        }
      });

      /* ---------------- 基因集来源（附加区） ---------------- */
      var gsrc = buildGeneSetSource();
      panel.extraSlot.appendChild(gsrc.node);

      main.appendChild(panel.root);
      var resWrap = el('div.tool-grid');
      resWrap.id = 'enrichment-result';
      main.appendChild(resWrap);

      if (!WB._enrDemoLoaded) {
        WB._enrDemoLoaded = true;
        panel.setText(WB.demo.geneList);
      }

      function collectGeneSets() {
        return gsrc.collect();
      }
    }
  });

  /* --------------------------- 结果表渲染 -------------------------------- */

  function renderTable(container, rows, multi, pCut, libSize) {
    var cols = [];
    if (multi) cols.push({ key: 'list', label: T('基因列表'), width: 110 });
    cols = cols.concat([
      { key: 'term', label: T('通路 / 基因集') },
      { key: 'setSize', label: T('基因集大小'), align: 'right', width: 96 },
      { key: 'overlap', label: T('交集'), align: 'right', width: 64 },
      {
        key: 'foldEnrichment', label: T('富集倍数'), align: 'right', width: 90,
        format: function (r) { return WB.formatNum(r.foldEnrichment, 2); }
      },
      {
        key: 'p', label: T('P 值'), align: 'right', width: 96,
        format: function (r) { return WB.pFormat(r.p); }
      },
      {
        key: 'padj', label: 'FDR', align: 'right', width: 96,
        format: function (r) { return WB.pFormat(r.padj); },
        className: 'fdr-cell'
      },
      {
        key: 'genes', label: T('交集基因'), format: function (r) {
          return r.genes.slice(0, 12).join(', ') + (r.genes.length > 12 ? ' …(' + r.genes.length + ')' : '');
        }
      },
      {
        key: 'dl', label: T('导出'), width: 62,
        render: function (r) {
          return el('button.btn.btn-ghost.btn-xs', {
            text: 'TSV', title: T('导出该通路的交集基因'),
            onclick: function () {
              WB.downloadText(WB.toTSV(['Term', 'Gene'], [[r.term, r.genes.join(', ')]]),
                'term_genes.tsv', 'text/tab-separated-values');
            }
          });
        }
      }
    ]);
    WB.ui.dataTable(container, cols, rows, {
      pageSize: 25, exportName: 'enrichment_results',
      rowClass: function (r) { return r.padj <= pCut ? 'row-sig' : ''; }
    });
    container.appendChild(el('div.preview-note', {
      text: T('FDR 列已按 {n} 条基因集完成多重检验校正；标红行为 FDR ≤ {p} 的显著通路。每行「TSV」按钮可导出该通路的交集基因。',
        { n: libSize, p: pCut })
    }));
  }

  /* ------------------------- 基因集来源组件 ------------------------------ */

  function buildGeneSetSource() {
    var state = { mode: 'demo', gmtText: null, gmtName: null, libName: '', libText: null, libList: null };
    var node = el('div.gsrc-box');
    node.appendChild(el('div.param-head', { text: T('基因集来源（富集分析的注释库）') }));

    var opts = el('div.gsrc-options');
    var radios = {};
    [
      ['demo', '内置示例基因集', '16 条示例通路，<b>仅供功能演示</b>，不可用于正式分析'],
      ['gmt', '上传 / 粘贴 GMT 文件', '推荐：来源与版本完全可控（MSigDB、GO、KEGG 官网下载的 .gmt）'],
      ['online', '在线获取 Enrichr 基因集库', '需联网；首次获取后缓存在浏览器本地，之后可离线复用']
    ].forEach(function (r) {
      var input = el('input', { type: 'radio', name: 'gsrc', value: r[0] });
      if (r[0] === 'demo') input.checked = true;
      input.addEventListener('change', function () { state.mode = r[0]; updatePanes(); });
      radios[r[0]] = input;
      opts.appendChild(el('label.gsrc-opt', [
        input,
        el('span.gsrc-opt-body', [
          el('span.gsrc-opt-title', { text: T(r[1]) }),
          el('span.gsrc-opt-desc', { html: T(r[2]) })
        ])
      ]));
    });
    node.appendChild(opts);

    /* demo 面板 */
    var paneDemo = el('div.gsrc-pane', { 'data-pane': 'demo' });
    paneDemo.appendChild(el('div.gsrc-status', {
      html: T('将使用内置的 <b>{n}</b> 条示例基因集（{list} 等）。示例基因列表在这套通路里会得到「细胞周期 / 有丝分裂」显著富集，可用于验证流程。',
        {
          n: WB.demo.gmtSets.length,
          list: WB.demo.gmtSets.map(function (s) { return s[0]; }).slice(0, 4).join(T('、'))
        })
    }));
    node.appendChild(paneDemo);

    /* GMT 面板 */
    var paneGmt = el('div.gsrc-pane', { 'data-pane': 'gmt' });
    var gmtInput = el('input', { type: 'file', accept: '.gmt,.txt,.tsv', multiple: false });
    var gmtBtn = el('button.btn.btn-ghost.btn-xs', { text: T('选择 .gmt 文件') });
    gmtBtn.addEventListener('click', function () { gmtInput.click(); });
    var gmtStatus = el('div.gsrc-status', { text: T('尚未选择文件。') });
    gmtInput.addEventListener('change', function () {
      if (!gmtInput.files.length) return;
      WB.readFileText(gmtInput.files[0]).then(function (t) {
        state.gmtText = t; state.gmtName = gmtInput.files[0].name;
        var sets = WB.parse.parseGMT(t);
        gmtStatus.innerHTML = T('已加载 <b>{file}</b>：解析出 <b>{n}</b> 条基因集。', { file: gmtInput.files[0].name, n: sets.length }) +
          (sets.length ? T('例如：{list}', { list: sets.slice(0, 3).map(function (s) { return s.term + '(' + s.genes.length + ')'; }).join(T('、')) }) : '');
        if (!sets.length) gmtStatus.innerHTML += ' <span style="color:#d6483f">' + T('未解析到基因集，请确认是标准 GMT（制表符分隔）') + '</span>';
      });
    });
    paneGmt.appendChild(el('div.format-actions', [gmtBtn, gmtInput]));
    var gmtTaLabel = el('div.paste-label', { text: T('或直接粘贴 GMT 文本（每行：通路名 <TAB> 描述 <TAB> 基因1 <TAB> 基因2 …）') });
    var gmtTa = el('textarea.paste-area', { rows: 4, placeholder: 'PATHWAY_NAME\tdescription\tGENE1\tGENE2\tGENE3' });
    gmtTa.style.minHeight = '90px';
    gmtTa.addEventListener('input', WB.debounce(function () {
      state.gmtText = gmtTa.value;
      var sets = WB.parse.parseGMT(gmtTa.value);
      gmtStatus.innerHTML = sets.length ? T('已解析 <b>{n}</b> 条基因集。', { n: sets.length }) : T('尚未解析到基因集。');
    }, 300));
    paneGmt.appendChild(gmtTaLabel);
    paneGmt.appendChild(gmtTa);
    paneGmt.appendChild(gmtStatus);
    node.appendChild(paneGmt);

    /* 在线面板 */
    var paneOnline = el('div.gsrc-pane', { 'data-pane': 'online' });
    var loadBtn = el('button.btn.btn-ghost.btn-xs', { text: T('① 获取可用基因集库列表') });
    var libSelect = el('select.form-control', { style: { maxWidth: '340px', display: 'inline-block', marginLeft: '8px' } });
    libSelect.appendChild(el('option', { value: '', text: T('（先获取列表）') }));
    var fetchBtn = el('button.btn.btn-ghost.btn-xs', { text: T('② 获取所选基因集库'), disabled: true });
    var onlineStatus = el('div.gsrc-status', { text: T('在线模式需要联网。若网络受限，请改用「上传／粘贴 GMT 文件」。') });
    loadBtn.addEventListener('click', function () {
      loadBtn.disabled = true;
      onlineStatus.innerHTML = T('正在获取 Enrichr 基因集库列表…');
      loadLibraryList().then(function (arr) {
        state.libList = arr;
        WB.clear(libSelect);
        libSelect.appendChild(el('option', { value: '', text: T('（请选择基因集库，共 {n} 个）', { n: arr.length }) }));
        arr.forEach(function (l) {
          libSelect.appendChild(el('option', {
            value: l.name,
            text: l.name + T('（{n} 条通路）', { n: l.terms })
          }));
        });
        WB.toast(T('获取到 {n} 个基因集库', { n: arr.length }), 'ok');
        onlineStatus.innerHTML = T('共 <b>{n}</b> 个基因集库可选。选择后点「获取」。', { n: arr.length });
        loadBtn.disabled = false;
      }).catch(function (e) {
        loadBtn.disabled = false;
        WB.clear(libSelect);
        FALLBACK_LIBS.forEach(function (n) {
          libSelect.appendChild(el('option', { value: n, text: n + T('（常用库）') }));
        });
        onlineStatus.innerHTML = T('<span style="color:#d6483f">无法访问 Enrichr：{msg}</span><br>已列出常用库名供选择，但获取仍需联网。离线使用请改用 GMT 上传。', { msg: e.message });
      });
    });
    libSelect.addEventListener('change', function () {
      fetchBtn.disabled = !libSelect.value;
      state.libName = libSelect.value;
    });
    fetchBtn.addEventListener('click', function () {
      var name = libSelect.value;
      if (!name) return;
      fetchBtn.disabled = true;
      fetchBtn.innerHTML = T('获取中…');
      var t0 = performance.now();
      fetchGMT(name).then(function (txt) {
        state.libText = txt; state.libName = name;
        var sets = WB.parse.parseGMT(txt);
        onlineStatus.innerHTML = T('已获取 <b>{lib}</b>：{n} 条基因集，用时 {t} s', { lib: name, n: sets.length, t: ((performance.now() - t0) / 1000).toFixed(1) }) +
          (txt.length > 3e6 ? T('（该库较大，未写入本地缓存）') : T('（已缓存到浏览器）'));
        fetchBtn.innerHTML = T('② 获取所选基因集库');
        fetchBtn.disabled = false;
        WB.toast(T('已获取 {n} 条基因集', { n: sets.length }), 'ok');
      }).catch(function (e) {
        fetchBtn.innerHTML = T('② 获取所选基因集库');
        fetchBtn.disabled = false;
        onlineStatus.innerHTML = T('<span style="color:#d6483f">获取失败：{msg}</span><br>可改用 GMT 上传方式，或到 Enrichr 官网下载该库的 .gmt 文件。', { msg: e.message });
      });
    });
    paneOnline.appendChild(el('div.format-actions', [loadBtn, libSelect, fetchBtn]));
    paneOnline.appendChild(onlineStatus);
    paneOnline.appendChild(el('div.gsrc-status', {
      html: T('<span style="opacity:.8">库名说明：<code>GO_Biological_Process_2023</code> 生物学过程、' +
        '<code>KEGG_2021_Human</code> KEGG 通路、<code>Reactome_2022</code> Reactome、' +
        '<code>MSigDB_Hallmark_2020</code> Hallmark 基因集。</span>')
    }));
    node.appendChild(paneOnline);

    function updatePanes() {
      WB.$$('.gsrc-pane', node).forEach(function (p) {
        p.style.display = p.getAttribute('data-pane') === state.mode ? '' : 'none';
      });
    }
    updatePanes();

    function collect() {
      if (state.mode === 'demo') {
        return { sets: WB.parse.parseGMT(WB.demo.gmtText), label: T('内置示例基因集（16 条，仅供演示）') };
      }
      if (state.mode === 'gmt') {
        var txt = state.gmtText || '';
        return {
          sets: WB.parse.parseGMT(txt),
          label: T('本地 GMT') + (state.gmtName ? T('（{n}）', { n: state.gmtName }) : '')
        };
      }
      return {
        sets: state.libText ? WB.parse.parseGMT(state.libText) : [],
        label: T('Enrichr 在线库') + (state.libName ? T('：{n}', { n: state.libName }) : '')
      };
    }

    return { node: node, collect: collect, state: state };
  }
})(window);
