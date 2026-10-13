/* =============================================================================
 * tools/unique.js  —  去重与唯一化（去重 / 按关键列去重 / 聚合 / 提取唯一值）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el;
  var T = WB.t;   // 统一语言层（界面）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块元信息 */
    '去除重复行、按关键列去重、对重复条目聚合取值（如多个探针映射到同一基因时取均值），或提取某一列的唯一值列表。':
      'Remove duplicate rows, deduplicate by key columns, aggregate values of repeated entries (e.g. average multiple probes mapping to the same gene), or extract the unique values of a column.',
    '数据清洗': 'Data cleaning',
    '去重': 'Deduplication',
    '唯一值': 'Unique values',
    '基因ID合并': 'Gene ID merging',

    /* 页面标题 */
    '去重与唯一化': 'Deduplicate & uniquify',
    '去除重复行、按关键列去重、按关键列聚合重复条目，或提取某一列的唯一值列表。':
      'Remove duplicate rows, deduplicate by key columns, aggregate repeated entries, or extract the unique values of a column.',

    /* 输入面板 */
    '输入表格数据': 'Input table data',
    '去重参数': 'Deduplication parameters',
    '执行去重': 'Run deduplication',

    /* 输入格式说明 */
    '单列基因列表': 'Single-column gene list',
    ['<b>只有一列</b>（基因名 / 探针 ID 等）：删除重复项，并给出唯一值列表与出现次数。']:
      '<b>A single column</b> (gene names / probe IDs): duplicates are removed and a unique-value list with occurrence counts is produced.',
    '带注释的表格（多列）': 'Annotated table (multiple columns)',
    ['<b>多列注释表</b>（如 探针 × 基因 × 表达值）：可按关键列去重，或将同一基因的多行数值取均值等合并为一行。']:
      '<b>Multi-column annotated table</b> (e.g. probe × gene × expression): deduplicate by a key column, or merge the rows of the same gene into one by averaging the values.',

    /* 参数 */
    '操作模式': 'Operation mode',
    '去除完全重复的行': 'Remove fully duplicated rows',
    '按关键列去重': 'Deduplicate by key column(s)',
    '按关键列聚合': 'Aggregate by key column(s)',
    '提取唯一值列表': 'Extract unique values',
    '关键列（逗号分隔：列名或列序号，从 1 开始）': 'Key column(s) (comma-separated names or 1-based indices)',
    '留空时「去除完全重复的行」模式不需要；其余模式默认取第 1 列':
      'Not needed for “Remove fully duplicated rows”; other modes default to column 1.',
    '保留哪一行（按关键列去重）': 'Which row to keep (deduplicate by key)',
    '保留首次出现': 'Keep first occurrence',
    '保留最后出现': 'Keep last occurrence',
    '数值列聚合方式': 'Numeric aggregation',
    '均值': 'Mean',
    '最大值': 'Maximum',
    '最小值': 'Minimum',
    '求和': 'Sum',
    '取首个非空值': 'First non-empty',
    '计数': 'Count',
    '忽略大小写': 'Ignore case',
    '忽略首尾空白': 'Trim whitespace',

    /* 参数补充说明片段 */
    '，忽略大小写': ', case-insensitive',
    '，忽略首尾空白': ', trim leading/trailing whitespace',
    '首次': 'first',
    '最后': 'last',

    /* 报错 */
    '请先输入数据': 'Please input the data first',
    '未识别到关键列「{col}」，请检查列名或序号。': 'Key column “{col}” was not recognised; please check the column name or index.',

    /* 操作说明（alertBox） */
    '操作：去除整行完全一致的数据行{opts}。': 'Operation: remove rows that are identical across all columns{opts}.',
    '操作：按关键列去重（关键列：<b>{cols}</b>；保留<b>{keep}</b>出现的一行）{opts}。':
      'Operation: deduplicate by key column(s) (key: <b>{cols}</b>; keep the <b>{keep}</b> occurrence){opts}.',
    '操作：按关键列聚合（关键列：<b>{cols}</b>；数值列聚合方式：<b>{agg}</b>；非数值列取首个非空值）{opts}。':
      'Operation: aggregate by key column(s) (key: <b>{cols}</b>; numeric aggregation: <b>{agg}</b>; non-numeric columns take the first non-empty value){opts}.',
    '操作：提取列「<b>{col}</b>」的唯一值列表，按出现次数降序排列{opts}。':
      'Operation: extract the unique values of column “<b>{col}</b>”, sorted by descending count{opts}.',

    /* 统计条 */
    '输入行数': 'Input rows',
    '输出行数': 'Output rows',
    '移除行数': 'Rows removed',
    '重复率': 'Duplication rate',

    /* 结果卡片与表格列名 */
    '去重结果（完整表格）': 'Deduplicated table (all columns)',
    '唯一值列表（按出现次数降序）': 'Unique values (descending count)',
    '聚合明细（关键值 / 命中行数）': 'Aggregation detail (key value / rows matched)',
    '值': 'Value',
    '出现次数': 'Count',
    '关键值': 'Key value',
    '命中行数': 'Rows matched',

    /* 结果说明 */
    '已按整行完全一致判定重复；保留首次出现的行。': 'Duplicates are judged by a fully identical row; the first occurrence is kept.',
    '已按关键列的取值判定重复行；其余列原样保留。': 'Duplicate rows are judged by the key-column value; other columns are kept as is.',
    '已对数值列（<b>{cols}</b>）按「{agg}」聚合，非数值列取组内首个非空值；「聚合明细」表给出每个关键值命中的原始行数。':
      'Numeric columns (<b>{cols}</b>) were aggregated by “{agg}”; non-numeric columns take the first non-empty value in the group. The “aggregation detail” table lists the number of original rows matched by each key value.',
    '未检测到数值列，所有列均取组内首个非空值；「聚合明细」表给出每个关键值命中的原始行数。':
      'No numeric column was detected; all columns take the first non-empty value in the group. The “aggregation detail” table lists the number of original rows matched by each key value.',
    '空白值已跳过；「出现次数」为该值在所选列中出现的次数。':
      'Blank values are skipped; “Count” is the number of times the value appears in the selected column.',
    '仅展示前 8 列，导出 TSV 为全部列。': 'Only the first 8 columns are shown; the TSV export contains all columns.',
    '导出全部列（{n} 列）': 'Export all columns ({n} columns)'
  });

  var FORMATS = [
    {
      name: '单列基因列表',
      filename: 'unique_template_single.tsv',
      desc: '<b>只有一列</b>（基因名 / 探针 ID 等）：删除重复项，并给出唯一值列表与出现次数。',
      sample: 'gene\nTP53\nBRCA1\nTP53\nEGFR\nBRCA1\nTP53\nMYC'
    },
    {
      name: '带注释的表格（多列）',
      filename: 'unique_template_annotated.tsv',
      desc: '<b>多列注释表</b>（如 探针 × 基因 × 表达值）：可按关键列去重，或将同一基因的多行数值取均值等合并为一行。',
      sample: 'probe\tgene\tlog2FC\tpvalue\n' +
        'A_23_P1\tTP53\t2.34\t0.0012\n' +
        'A_23_P2\tTP53\t2.10\t0.0045\n' +
        'A_23_P3\tBRCA1\t-1.85\t0.0210\n' +
        'A_23_P4\tEGFR\t1.42\t0.0330\n' +
        'A_23_P5\tEGFR\t1.60\t0.0100'
    }
  ];

  WB.register({
    id: 'unique',
    name: '去重与唯一化',
    icon: '⧉',
    color: '#7a5cd8',
    desc: '去除重复行、按关键列去重、对重复条目聚合取值（如多个探针映射到同一基因时取均值），或提取某一列的唯一值列表。',
    tags: ['数据清洗', '去重', '唯一值', '基因ID合并'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('去重与唯一化') }),
        el('p', { text: T('去除重复行、按关键列去重、按关键列聚合重复条目，或提取某一列的唯一值列表。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入表格数据',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.uniqueText,
        placeholder: 'probe\tgene\tlog2FC\tpvalue\nA_23_P1\tTP53\t2.34\t0.0012\nA_23_P2\tTP53\t2.10\t0.0045\n...',
        paramsTitle: '去重参数',
        params: [
          {
            key: 'mode', label: '操作模式', type: 'select', value: 'rows',
            options: [
              { value: 'rows', label: '去除完全重复的行' },
              { value: 'key', label: '按关键列去重' },
              { value: 'agg', label: '按关键列聚合' },
              { value: 'extract', label: '提取唯一值列表' }
            ]
          },
          {
            key: 'keyCols', label: '关键列（逗号分隔：列名或列序号，从 1 开始）', type: 'text', value: '',
            hint: '留空时「去除完全重复的行」模式不需要；其余模式默认取第 1 列'
          },
          {
            key: 'keep', label: '保留哪一行（按关键列去重）', type: 'select', value: 'first',
            options: [
              { value: 'first', label: '保留首次出现' },
              { value: 'last', label: '保留最后出现' }
            ]
          },
          {
            key: 'aggregate', label: '数值列聚合方式', type: 'select', value: 'mean',
            options: [
              { value: 'mean', label: '均值' },
              { value: 'max', label: '最大值' },
              { value: 'min', label: '最小值' },
              { value: 'sum', label: '求和' },
              { value: 'first', label: '取首个非空值' },
              { value: 'count', label: '计数' }
            ]
          },
          { key: 'ignoreCase', label: '忽略大小写', type: 'checkbox', value: false },
          { key: 'trim', label: '忽略首尾空白', type: 'checkbox', value: true }
        ],
        runLabel: '执行去重',
        onRun: function (ctx) {
          var res = WB.$('#unique-result');
          WB.clear(res);

          /* 解析表格（第一行 = 列名，制表符/逗号等分隔符自动探测） */
          var tbl = WB.parse.parseTable(ctx.text);
          var header = tbl.header || [];
          var ncol = tbl.ncol;
          var dataRows = tbl.rows;
          if (!ncol || !dataRows.length) throw new Error(T('请先输入数据'));

          var v = ctx.values || {};
          var mode = v.mode || 'rows';
          var opt = { ignoreCase: !!v.ignoreCase, trim: v.trim !== false };

          /* 关键列解析：列名或从 1 开始的列序号 */
          var keySpec = String(v.keyCols || '').trim();
          var keyIdx = resolveCols(keySpec, header, ncol);
          if (mode !== 'rows' && !keyIdx.length) {
            if (keySpec) throw new Error(T('未识别到关键列「{col}」，请检查列名或序号。', { col: keySpec }));
            keyIdx = [0];
          }
          var colsLabel = keyIdx.map(function (ci) { return colLabel(header[ci], ci); }).join(', ');
          var optSuffix = (opt.ignoreCase ? T('，忽略大小写') : '') + (opt.trim ? T('，忽略首尾空白') : '');

          var inputRows = dataRows.length;
          var kept = [];        /* rows/key/agg：输出的数据行（数组形式） */
          var extractRows = []; /* extract：数值列表 */
          var detailRows = [];  /* agg：聚合明细 */
          var noteText = '';
          var alertText = '';

          if (mode === 'rows') {
            /* 去除整行完全一致的重复行（保留首次出现） */
            var seen = {};
            dataRows.forEach(function (r) {
              var key = normRow(r, ncol, opt);
              if (seen[key]) return;
              seen[key] = true;
              kept.push(r);
            });
            alertText = T('操作：去除整行完全一致的数据行{opts}。', { opts: optSuffix });
            noteText = T('已按整行完全一致判定重复；保留首次出现的行。');

          } else if (mode === 'key') {
            /* 按关键列去重：首次出现顺序输出，保留首/末次出现的一行 */
            var keepLast = (v.keep === 'last');
            var order = [], map = {};
            dataRows.forEach(function (r) {
              var key = keyOf(r, keyIdx, opt);
              if (map[key] === undefined) { order.push(key); map[key] = r; }
              else if (keepLast) { map[key] = r; }
            });
            kept = order.map(function (k) { return map[k]; });
            alertText = T('操作：按关键列去重（关键列：<b>{cols}</b>；保留<b>{keep}</b>出现的一行）{opts}。', {
              cols: colsLabel, keep: T(v.keep === 'last' ? '最后' : '首次'), opts: optSuffix
            });
            noteText = T('已按关键列的取值判定重复行；其余列原样保留。');

          } else if (mode === 'agg') {
            /* 按关键列聚合：数值列套用聚合函数，非数值列取组内首个非空值 */
            var numeric = [];
            for (var c = 0; c < ncol; c++) numeric.push(isNumericColumn(dataRows, c));

            var groups = {}, gOrder = [];
            dataRows.forEach(function (r) {
              var key = keyOf(r, keyIdx, opt);
              if (!groups[key]) { groups[key] = []; gOrder.push(key); }
              groups[key].push(r);
            });

            var aggName = v.aggregate || 'mean';
            var aggZh = { mean: '均值', max: '最大值', min: '最小值', sum: '求和', first: '取首个非空值', count: '计数' }[aggName] || '均值';
            var aggColLabels = [];

            gOrder.forEach(function (key) {
              var g = groups[key];
              var out = [];
              for (var ci = 0; ci < ncol; ci++) {
                if (keyIdx.indexOf(ci) >= 0) { out.push(g[0][ci]); continue; } /* 关键列原样输出 */
                if (!numeric[ci] || aggName === 'first') {
                  out.push(firstNonEmpty(g, ci));           /* 非数值列 / 取首个非空值 */
                } else if (aggName === 'count') {
                  out.push(String(numericValues(g, ci).length)); /* 计数：组内有效数值个数 */
                } else {
                  out.push(aggValues(numericValues(g, ci), aggName)); /* mean/max/min/sum */
                }
              }
              kept.push(out);
              detailRows.push({ key: keyDisplay(g[0], keyIdx), n: g.length });
            });

            /* 汇总被聚合的数值列（用于结果说明，便于看清聚合了哪些列） */
            for (var ac = 0; ac < ncol; ac++) {
              if (keyIdx.indexOf(ac) < 0 && numeric[ac]) aggColLabels.push(colLabel(header[ac], ac));
            }
            alertText = T('操作：按关键列聚合（关键列：<b>{cols}</b>；数值列聚合方式：<b>{agg}</b>；非数值列取首个非空值）{opts}。', {
              cols: colsLabel, agg: T(aggZh), opts: optSuffix
            });
            noteText = aggColLabels.length
              ? T('已对数值列（<b>{cols}</b>）按「{agg}」聚合，非数值列取组内首个非空值；「聚合明细」表给出每个关键值命中的原始行数。',
                { cols: aggColLabels.join(WB.pick('、', ', ')), agg: T(aggZh) })
              : T('未检测到数值列，所有列均取组内首个非空值；「聚合明细」表给出每个关键值命中的原始行数。');

          } else {
            /* 提取所选列的唯一值列表（按出现次数降序） */
            var exCol = keyIdx[0];
            var counts = {}, rawOf = {}, exOrder = [];
            dataRows.forEach(function (r) {
              var nv = normVal(r[exCol], opt);
              if (nv === '') return;                       /* 跳过空白值 */
              if (counts[nv] === undefined) {
                counts[nv] = 0; exOrder.push(nv);
                rawOf[nv] = opt.trim ? String(r[exCol]).trim() : r[exCol];
              }
              counts[nv]++;
            });
            extractRows = exOrder.map(function (k) { return { value: rawOf[k], count: counts[k] }; });
            extractRows.sort(function (a, b) {
              if (b.count !== a.count) return b.count - a.count;
              return String(a.value).localeCompare(String(b.value), 'zh');
            });
            alertText = T('操作：提取列「<b>{col}</b>」的唯一值列表，按出现次数降序排列{opts}。', {
              col: colLabel(header[exCol], exCol), opts: optSuffix
            });
            noteText = T('空白值已跳过；「出现次数」为该值在所选列中出现的次数。');
          }

          /* ---------------- 统计条 ---------------- */
          var outputRows = (mode === 'extract') ? extractRows.length : kept.length;
          var removed = inputRows - outputRows;
          var rate = inputRows ? (removed / inputRows * 100) : 0;
          res.appendChild(WB.ui.statBar([
            { label: T('输入行数'), value: inputRows },
            { label: T('输出行数'), value: outputRows },
            { label: T('移除行数'), value: removed, tone: removed ? 'amber' : '' },
            { label: T('重复率'), value: rate.toFixed(1) + ' %' }
          ]));

          res.appendChild(WB.ui.alertBox('info', alertText));

          if (mode === 'extract') {
            /* ---------------- 唯一值列表 ---------------- */
            var card = WB.ui.resultCard(T('唯一值列表（按出现次数降序）'));
            res.appendChild(card);
            var body = card.querySelector('.card-body');
            WB.ui.dataTable(body, [
              { key: 'value', label: T('值') },
              { key: 'count', label: T('出现次数'), align: 'right', width: 110 }
            ], extractRows, { pageSize: 25, exportName: 'unique_values' });
            body.appendChild(el('div.preview-note', { text: noteText }));
            return;
          }

          /* ---------------- 完整表格（列 = 原表所有列） ---------------- */
          var allCols = [];
          for (var i = 0; i < ncol; i++) allCols.push({ key: 'c' + i, label: colLabel(header[i], i) });
          var outObjs = kept.map(function (row) {
            var o = {};
            for (var j = 0; j < ncol; j++) o['c' + j] = row[j];
            return o;
          });

          var limited = ncol > 8;
          var tCard;
          if (limited) {
            /* 列数 > 8：只展示前 8 列；导出仍用全部列（自建按钮） */
            var exportBtn = el('button.btn.btn-ghost.btn-xs', {
              text: T('导出 TSV'),
              title: T('导出全部列（{n} 列）', { n: ncol }),
              onclick: function () {
                var head = allCols.map(function (cc) { return cc.label; });
                var bd = kept.map(function (row) {
                  var a = [];
                  for (var k = 0; k < ncol; k++) a.push(row[k] === null || row[k] === undefined ? '' : row[k]);
                  return a;
                });
                WB.downloadText(WB.toTSV(head, bd), 'dedup_result.tsv', 'text/tab-separated-values');
              }
            });
            tCard = WB.ui.resultCard(T('去重结果（完整表格）'), [exportBtn]);
            res.appendChild(tCard);
            var tb1 = tCard.querySelector('.card-body');
            WB.ui.dataTable(tb1, allCols.slice(0, 8), outObjs, { pageSize: 25 });
            tb1.appendChild(el('div.preview-note', { text: noteText }));
            tb1.appendChild(el('div.preview-note', { text: T('仅展示前 8 列，导出 TSV 为全部列。') }));
          } else {
            tCard = WB.ui.resultCard(T('去重结果（完整表格）'));
            res.appendChild(tCard);
            var tb2 = tCard.querySelector('.card-body');
            WB.ui.dataTable(tb2, allCols, outObjs, { pageSize: 25, exportName: 'dedup_result' });
            tb2.appendChild(el('div.preview-note', { text: noteText }));
          }

          /* ---------------- 聚合明细（仅 agg 模式） ---------------- */
          if (mode === 'agg') {
            var dCard = WB.ui.resultCard(T('聚合明细（关键值 / 命中行数）'));
            res.appendChild(dCard);
            var dBody = dCard.querySelector('.card-body');
            WB.ui.dataTable(dBody, [
              { key: 'key', label: T('关键值') },
              { key: 'n', label: T('命中行数'), align: 'right', width: 110 }
            ], detailRows, { pageSize: 25, exportName: 'aggregate_detail' });
          }
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'unique-result';
      main.appendChild(wrap);
      if (!WB._uniqDemoLoaded && WB.demo && WB.demo.uniqueText) {
        WB._uniqDemoLoaded = true;
        panel.setText(WB.demo.uniqueText);
      }
    }
  });

  /* ------------------------------ 辅助 ---------------------------------- */

  /** 列名显示：优先用原列名，空列名回退为 V1、V2…（来自用户数据，不翻译） */
  function colLabel(name, i) {
    var s = (name === undefined || name === null) ? '' : String(name).trim();
    return s || ('V' + (i + 1));
  }

  /** 解析关键列：支持列名或从 1 开始的列序号，返回去重后的 0 基列索引 */
  function resolveCols(spec, header, ncol) {
    var out = [];
    if (!spec) return out;
    spec.split(/[,;，；]/).forEach(function (tok) {
      tok = tok.trim();
      if (!tok) return;
      var idx = -1;
      if (/^\d+$/.test(tok)) {
        var n = parseInt(tok, 10) - 1;
        if (n >= 0 && n < ncol) idx = n;
      } else {
        for (var i = 0; i < ncol; i++) {
          if (String(header[i] === undefined ? '' : header[i]).trim() === tok) { idx = i; break; }
        }
      }
      if (idx >= 0 && out.indexOf(idx) < 0) out.push(idx);
    });
    return out;
  }

  /** 按忽略大小写/首尾空白规则归一化单元格 */
  function normVal(x, opt) {
    var s = (x === undefined || x === null) ? '' : String(x);
    if (opt.trim) s = s.trim();
    if (opt.ignoreCase) s = s.toLowerCase();
    return s;
  }

  /** 关键列组成的比较键 */
  function keyOf(row, idx, opt) {
    var parts = [];
    for (var i = 0; i < idx.length; i++) parts.push(normVal(row[idx[i]], opt));
    return parts.join('\u0001');
  }

  /** 整行组成的比较键（用于判定完全重复的行） */
  function normRow(row, ncol, opt) {
    var parts = [];
    for (var i = 0; i < ncol; i++) parts.push(normVal(row[i], opt));
    return parts.join('\u0001');
  }

  /** 判断某列是否为数值列（非空单元格中 ≥ 90% 可解析为数值） */
  function isNumericColumn(rows, ci) {
    var total = 0, ok = 0;
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i][ci];
      if (v === '' || v === undefined || v === null) continue;
      total++;
      if (WB.parse.isNumericCell(v)) ok++;
    }
    return total > 0 && (ok / total) >= 0.9;
  }

  /** 收集某列的可解析数值 */
  function numericValues(rows, ci) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i][ci];
      if (WB.parse.isNumericCell(v)) out.push(WB.parse.num(v));
    }
    return out;
  }

  /** 取该列首个非空值 */
  function firstNonEmpty(rows, ci) {
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i][ci];
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
    return '';
  }

  /** 数值列的聚合计算（mean/max/min/sum），无有效数值时返回空字符串 */
  function aggValues(nums, fn) {
    if (!nums.length) return '';
    var s = 0, k;
    if (fn === 'sum') {
      for (k = 0; k < nums.length; k++) s += nums[k];
      return WB.formatNum(s, 4);
    }
    if (fn === 'mean') {
      for (k = 0; k < nums.length; k++) s += nums[k];
      return WB.formatNum(s / nums.length, 4);
    }
    s = nums[0];
    for (k = 1; k < nums.length; k++) {
      if (fn === 'max' && nums[k] > s) s = nums[k];
      if (fn === 'min' && nums[k] < s) s = nums[k];
    }
    return WB.formatNum(s, 4);
  }

  /** 聚合明细中的关键值展示（多列时用 | 连接） */
  function keyDisplay(row, idx) {
    var parts = [];
    for (var i = 0; i < idx.length; i++) parts.push(row[idx[i]] === undefined ? '' : row[idx[i]]);
    return parts.join(' | ');
  }
})(window);
