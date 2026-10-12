/* =============================================================================
 * core/ui.js  —  共享界面组件：输入面板 / 参数表单 / 结果表格 / 统计条
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};
  var el = WB.el, $ = WB.$;

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    '搜索…': 'Search…',
    '{n} / {m} 行': '{n} / {m} rows',
    '导出 TSV': 'Export TSV',
    '导出 CSV': 'Export CSV',
    '‹ 上一页': '‹ Prev',
    '下一页 ›': 'Next ›',
    '第 {a} / {b} 页': 'Page {a} / {b}',
    '（无数据）': '(no data)',
    '共 {n} 行 × {c} 列': '{n} rows × {c} columns',
    '共 {n} 行 × {c} 列，仅显示前 {m} 行': '{n} rows × {c} columns (showing first {m})',
    '解析失败：{msg}': 'Parse error: {msg}',
    '输入数据': 'Input data',
    '加载示例数据': 'Load example data',
    '插入一份可立即运行的示例数据': 'Insert a runnable example dataset',
    '示例数据已加载，点击「开始分析」即可执行': 'Example data loaded — click “Run analysis” to run.',
    '下载模板': 'Download template',
    '下载当前格式的示例文件': 'Download a sample file in the current format',
    '清空': 'Clear',
    '输入数据格式': 'Data input format',
    '请按下列任一格式准备数据，可直接粘贴或上传文件': 'Prepare the data in any of the formats below; paste it or upload a file.',
    '复制示例': 'Copy sample',
    '点击选择文件，或将多个文件拖放到此区域（每个文件 = 一个集合）': 'Click to select files, or drag and drop several here (each file is treated as one set)',
    '点击选择文件，或将文件拖放到此区域': 'Click to select a file, or drag and drop it here',
    '支持 .txt / .tsv / .csv / .gmt，可直接用 Excel 复制粘贴到下方文本框': 'Supports .txt / .tsv / .csv / .gmt; you can also paste from Excel below',
    '移除': 'Remove',
    '共 {n} 个文件': '{n} files',
    '文件读取失败：{msg}': 'Failed to read file: {msg}',
    '或直接粘贴文本（多文件模式下将以文本框内容作为数据）': 'Or paste text directly (in multi-file mode the text box is used as data)',
    '或直接把表格粘贴到这里（支持 Excel / 文本编辑器）': 'Or paste your table here (Excel / text editor supported)',
    '在此粘贴数据…': 'Paste data here…',
    '数据预览': 'Data preview',
    '待输入数据…': 'Awaiting input…',
    '尚未输入数据。可点击右上角「加载示例数据」插入示例数据。': 'No data yet. Use “Load example data” in the top-right corner to insert a sample dataset.',
    '已解析 {n} 行数据': '{n} data rows parsed',
    '分析参数': 'Parameters',
    '开始分析': 'Run analysis',
    '请先输入数据或加载示例数据': 'Please enter data or load the example data first',
    '需要先提供数据': 'Input data is required',
    '完成，用时 {t}': 'Completed in {t}',
    '出错：{msg}': 'Error: {msg}',
    '分析失败：{msg}': 'Analysis failed: {msg}'
  });

  /* ------------------------------ 卡片 / 分栏 ---------------------------- */

  function card(title, extra) {
    var head = el('div.card-head', [el('h3.card-title', { text: title })]);
    if (extra) head.appendChild(el('div.card-actions', extra));
    return el('section.card', [head, el('div.card-body')]);
  }

  function sectionTitle(text, sub) {
    return el('div.sec-title', [
      el('h2', { text: text }),
      sub ? el('p.sec-sub', { text: sub }) : null
    ]);
  }

  /* ---------------------------- 参数表单 -------------------------------- */

  /**
   * @param {Array} defs [{key,label,type,value,options,min,max,step,hint,width}]
   * @returns {{node, getValues}}
   */
  function paramsForm(defs, onChange) {
    var node = el('div.params-grid');
    var fields = {};
    defs.forEach(function (d) {
      var id = WB.uid('p');
      var input;
      if (d.type === 'select') {
        input = el('select.form-control', { id: id });
        (d.options || []).forEach(function (o) {
          var val = typeof o === 'object' ? o.value : o;
          var lab = typeof o === 'object' ? o.label : String(o);
          input.appendChild(el('option', { value: val, text: WB.t(lab) }));
        });
        input.value = d.value !== undefined ? d.value : '';
      } else if (d.type === 'checkbox') {
        input = el('input', { type: 'checkbox', id: id });
        input.checked = !!d.value;
      } else if (d.type === 'textarea') {
        input = el('textarea.form-control', { id: id, rows: d.rows || 3 });
        input.value = d.value || '';
      } else {
        input = el('input.form-control', {
          type: d.type === 'number' ? 'number' : 'text',
          id: id,
          min: d.min, max: d.max, step: d.step, placeholder: WB.t(d.placeholder)
        });
        if (d.value !== undefined && d.value !== null) input.value = d.value;
      }
      var wrap;
      if (d.type === 'checkbox') {
        wrap = el('label.check-wrap', [input, el('span', { text: WB.t(d.label) })]);
      } else {
        wrap = el('div.field', [
          el('label.field-label', { text: WB.t(d.label), for: id }),
          input,
          d.hint ? el('div.field-hint', { text: WB.t(d.hint) }) : null
        ]);
      }
      if (d.width === 'full') wrap.classList.add('full');
      if (onChange) {
        input.addEventListener('change', function () { onChange(d.key, getVal(input, d)); });
        if (d.type === 'text' || d.type === 'number' || d.type === 'textarea') {
          input.addEventListener('input', WB.debounce(function () { onChange(d.key, getVal(input, d)); }, 350));
        }
      }
      fields[d.key] = { def: d, input: input };
      node.appendChild(wrap);
    });
    function getVal(input, d) {
      if (d.type === 'checkbox') return input.checked;
      if (d.type === 'number') return input.value === '' ? null : Number(input.value);
      return input.value;
    }
    function getValues() {
      var out = {};
      Object.keys(fields).forEach(function (k) { out[k] = getVal(fields[k].input, fields[k].def); });
      return out;
    }
    function setValues(vals) {
      Object.keys(vals).forEach(function (k) {
        var f = fields[k]; if (!f) return;
        if (f.def.type === 'checkbox') f.input.checked = !!vals[k];
        else f.input.value = vals[k];
      });
    }
    return { node: node, getValues: getValues, setValues: setValues, fields: fields };
  }

  /* ----------------------------- 消息条 ---------------------------------- */

  function alertBox(type, msg) {
    return el('div.alert.alert-' + type, [el('span.alert-dot'), el('span', { html: msg })]);
  }

  /* ----------------------------- 结果表格 -------------------------------- */

  /**
   * @param {Array} cols [{key,label,align,format(row),width,html}]
   * @param {Array} rows
   * @param {object} opt {pageSize, searchable, sortable, exportName, maxHeight}
   */
  function dataTable(container, cols, rows, opt) {
    opt = opt || {};
    WB.clear(container);
    var state = { page: 0, pageSize: opt.pageSize || 25, q: '', sortKey: opt.sortKey || null, sortDir: 1 };
    var filtered = rows.slice();

    function apply() {
      filtered = rows.filter(function (r) {
        if (!state.q) return true;
        var q = state.q.toLowerCase();
        return cols.some(function (c) {
          var v = c.format ? c.format(r) : r[c.key];
          return String(v === undefined || v === null ? '' : v).toLowerCase().indexOf(q) >= 0;
        });
      });
      if (state.sortKey) {
        var col = cols.filter(function (c) { return c.key === state.sortKey; })[0];
        filtered.sort(function (a, b) {
          var va = a[state.sortKey], vb = b[state.sortKey];
          var na = parseFloat(va), nb = parseFloat(vb);
          if (isFinite(na) && isFinite(nb)) return (na - nb) * state.sortDir;
          return String(va).localeCompare(String(vb), 'zh') * state.sortDir;
        });
      }
    }

    function render() {
      apply();
      WB.clear(container);
      var bar = el('div.table-bar');
      if (opt.searchable !== false) {
        var search = el('input.form-control.form-control-sm', { type: 'search', placeholder: WB.t('搜索…') });
        search.value = state.q;
        search.addEventListener('input', WB.debounce(function () { state.q = search.value; state.page = 0; render(); }, 200));
        bar.appendChild(search);
      }
      bar.appendChild(el('span.table-count', { text: WB.t('{n} / {m} 行', { n: filtered.length, m: rows.length }) }));
      var spacer = el('span.grow'); bar.appendChild(spacer);
      if (opt.exportName) {
        bar.appendChild(el('button.btn.btn-ghost.btn-xs', {
          text: WB.t('导出 TSV'), onclick: function () {
            var head = cols.map(function (c) { return c.label; });
            var body = filtered.map(function (r) {
              return cols.map(function (c) {
                var v = r[c.key];
                return (v === null || v === undefined) ? '' : v;
              });
            });
            WB.downloadText(WB.toTSV(head, body), opt.exportName + '.tsv', 'text/tab-separated-values');
          }
        }));
        bar.appendChild(el('button.btn.btn-ghost.btn-xs', {
          text: WB.t('导出 CSV'), onclick: function () {
            var head = cols.map(function (c) { return c.label; });
            var body = filtered.map(function (r) { return cols.map(function (c) { return r[c.key]; }); });
            WB.downloadText(WB.toCSV(head, body), opt.exportName + '.csv', 'text/csv');
          }
        }));
      }
      container.appendChild(bar);

      var table = el('table.data-table');
      var thead = el('thead');
      var tr = el('tr');
      cols.forEach(function (c) {
        var th = el('th', { text: c.label });
        if (c.align) th.style.textAlign = c.align;
        if (c.width) th.style.width = typeof c.width === 'number' ? c.width + 'px' : c.width;
        if (opt.sortable !== false) {
          th.classList.add('sortable');
          if (state.sortKey === c.key) th.classList.add(state.sortDir > 0 ? 'asc' : 'desc');
          th.addEventListener('click', function () {
            if (state.sortKey === c.key) state.sortDir *= -1;
            else { state.sortKey = c.key; state.sortDir = 1; }
            render();
          });
        }
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);

      var tbody = el('tbody');
      var start = state.page * state.pageSize;
      filtered.slice(start, start + state.pageSize).forEach(function (r) {
        var tr2 = el('tr');
        if (opt.rowClass) {
          var cl = opt.rowClass(r);
          if (cl) tr2.className = cl;
        }
        cols.forEach(function (c) {
          var td = el('td');
          if (c.render) {
            var node = c.render(r);
            if (node) td.appendChild(node);
          } else {
            var val = c.format ? c.format(r) : r[c.key];
            if (c.html) td.innerHTML = val === undefined || val === null ? '' : val;
            else td.textContent = val === undefined || val === null ? '' : val;
          }
          if (c.align) td.style.textAlign = c.align;
          if (c.className) td.classList.add(c.className);
          tr2.appendChild(td);
        });
        tbody.appendChild(tr2);
      });
      table.appendChild(tbody);
      var wrap = el('div.table-wrap');
      if (opt.maxHeight) wrap.style.maxHeight = opt.maxHeight;
      wrap.appendChild(table);
      container.appendChild(wrap);

      if (filtered.length > state.pageSize) {
        var pages = Math.ceil(filtered.length / state.pageSize);
        var pag = el('div.pager');
        pag.appendChild(el('button.btn.btn-ghost.btn-xs', {
          text: WB.t('‹ 上一页'), disabled: state.page === 0,
          onclick: function () { state.page--; render(); }
        }));
        pag.appendChild(el('span', { text: WB.t('第 {a} / {b} 页', { a: state.page + 1, b: pages }) }));
        pag.appendChild(el('button.btn.btn-ghost.btn-xs', {
          text: WB.t('下一页 ›'), disabled: state.page >= pages - 1,
          onclick: function () { state.page++; render(); }
        }));
        container.appendChild(pag);
      }
    }
    render();
    return { render: render, getFiltered: function () { return filtered; } };
  }

  /* ---------------------------- 数据预览表 -------------------------------- */

  function previewTable(container, text, maxRows) {
    maxRows = maxRows || 6;
    WB.clear(container);
    try {
      var t = WB.parse.parseTable(text);
      if (!t.rows.length) { container.appendChild(el('div.preview-empty', { text: WB.t('（无数据）') })); return; }
      var cols = t.header || [];
      var ncol = Math.max(t.ncol, cols.length);
      var table = el('table.data-table.preview-table');
      if (cols.length) {
        var tr = el('tr');
        for (var i = 0; i < ncol; i++) tr.appendChild(el('th', { text: cols[i] || ('V' + i) }));
        table.appendChild(el('thead', [tr]));
      }
      var tb = el('tbody');
      t.rows.slice(0, maxRows).forEach(function (r) {
        var tr2 = el('tr');
        for (var j = 0; j < ncol; j++) {
          var v = r[j] === undefined ? '' : r[j];
          tr2.appendChild(el('td', { text: v.length > 28 ? v.slice(0, 27) + '…' : v }));
        }
        tb.appendChild(tr2);
      });
      table.appendChild(tb);
      var wrap = el('div.table-wrap');
      wrap.appendChild(table);
      container.appendChild(wrap);
      var extra = t.rows.length - maxRows;
      container.appendChild(el('div.preview-note', {
        text: extra > 0
          ? WB.t('共 {n} 行 × {c} 列，仅显示前 {m} 行', { n: t.rows.length, c: ncol, m: maxRows })
          : WB.t('共 {n} 行 × {c} 列', { n: t.rows.length, c: ncol })
      }));
    } catch (e) {
      container.appendChild(el('div.preview-empty', { text: WB.t('解析失败：{msg}', { msg: e.message }) }));
    }
  }

  /* ---------------------------- 输入面板 ---------------------------------- */

  /**
   * 统一的数据输入面板
   * cfg = {
   *   formats: [{name, desc, sample, filename}],   // 输入格式说明（平铺展示）
   *   placeholder,
   *   multipleFiles: false,                        // 多文件模式（每个文件=一个集合）
   *   demoText: '...',                             // 「加载示例数据」
   *   help: 'html',
   *   onRun: function(ctx) { ctx.text / ctx.files / ctx.fileNames / ctx.values }
   *   params: [...],
   *   runLabel
   * }
   */
  function inputPanel(cfg) {
    var root = el('section.card.card-input');
    var formats = cfg.formats || [];
    var state = { fmtIndex: 0, fileTexts: null };
    var pkey = cfg.persist || cfg.title || 'default';
    WB._inputState = WB._inputState || {};
    var saved = WB._inputState[pkey] || null;

    /** 记住用户输入，切换模块后回来不丢数据 */
    function saveState() {
      if (WB._suppressSave) return;
      WB._inputState[pkey] = {
        text: textarea.value,
        files: state.fileTexts ? state.fileTexts.slice() : null,
        values: pf ? pf.getValues() : null,
        extra: cfg.extraState ? cfg.extraState.get() : null,
        fmtIndex: state.fmtIndex
      };
    }

    /* ---- 头部 ---- */
    var head = el('div.card-head', [
      el('h3.card-title', [el('span.card-title-icon', { text: '⌸' }), el('span', { text: WB.t(cfg.title || '输入数据') })]),
      el('div.card-actions')
    ]);
    var btnWrap = head.querySelector('.card-actions');

    var demoBtn = null, tplBtn = null;
    if (cfg.demoText) {
      demoBtn = el('button.btn.btn-ghost.btn-xs', {
        text: WB.t('加载示例数据'), title: WB.t('插入一份可立即运行的示例数据'),
        onclick: function () {
          textarea.value = cfg.demoText;
          state.fileTexts = null; renderFileChips();
          updatePreview(); saveState();
          if (cfg.onChange) cfg.onChange(collect());
          WB.toast(WB.t('示例数据已加载，点击「开始分析」即可执行'), 'ok');
        }
      });
      btnWrap.appendChild(demoBtn);
    }
    tplBtn = el('button.btn.btn-ghost.btn-xs', {
      text: WB.t('下载模板'), title: WB.t('下载当前格式的示例文件'),
      onclick: function () {
        var f = formats[state.fmtIndex];
        if (!f) return;
        WB.downloadText(f.sample, f.filename || 'template.tsv', 'text/tab-separated-values');
      }
    });
    if (formats.length) btnWrap.appendChild(tplBtn);
    var clearBtn = el('button.btn.btn-ghost.btn-xs', {
      text: WB.t('清空'), onclick: function () {
        textarea.value = ''; state.fileTexts = null; renderFileChips(); updatePreview(); saveState();
        if (cfg.onChange) cfg.onChange(collect());
      }
    });
    btnWrap.appendChild(clearBtn);
    root.appendChild(head);

    var body = el('div.card-body');
    root.appendChild(body);

    /* ---- 格式说明区（始终可见） ---- */
    var fmtBox = null, samplePre = null, descDiv = null, tabsDiv = null;
    if (formats.length) {
      fmtBox = el('div.format-box');
      var fmtHead = el('div.format-head', [
        el('span.format-label', { text: WB.t('输入数据格式') }),
        el('span.format-tip', { text: WB.t('请按下列任一格式准备数据，可直接粘贴或上传文件') })
      ]);
      tabsDiv = el('div.fmt-tabs');
      formats.forEach(function (f, i) {
        var tab = el('button.fmt-tab' + (i === 0 ? '.active' : ''), { text: WB.t(f.name) });
        tab.addEventListener('click', function () {
          state.fmtIndex = i;
          WB.$$('.fmt-tab', tabsDiv).forEach(function (t, j) { t.classList.toggle('active', j === i); });
          renderFormat();
        });
        tabsDiv.appendChild(tab);
      });
      if (formats.length > 1) fmtHead.appendChild(tabsDiv);
      fmtBox.appendChild(fmtHead);

      samplePre = el('pre.format-sample');
      descDiv = el('div.format-desc');
      fmtBox.appendChild(descDiv);
      fmtBox.appendChild(samplePre);
      var actRow = el('div.format-actions');
      actRow.appendChild(el('button.btn.btn-ghost.btn-xs', {
        text: WB.t('复制示例'), onclick: function () { WB.copyText(formats[state.fmtIndex].sample); }
      }));
      fmtBox.appendChild(actRow);
      body.appendChild(fmtBox);
    }
    function renderFormat() {
      var f = formats[state.fmtIndex];
      if (!f) return;
      // 表格化渲染示例，制表符对齐；示例中的中文注释行按语言翻译（数据行原样保留）
      samplePre.textContent = trSample(f.sample);
      descDiv.innerHTML = WB.t(f.desc || '');
    }
    /** 示例文本：仅对含中文的行做翻译，其余（数据）行原样保留 */
    function trSample(s) {
      if (!/[\u4e00-\u9fff]/.test(s)) return s;
      return s.split('\n').map(function (ln) {
        return /[\u4e00-\u9fff]/.test(ln) ? WB.t(ln) : ln;
      }).join('\n');
    }

    /* ---- 文件拖放 ---- */
    var drop = el('div.drop-zone', [
      el('div.drop-icon', { text: '⤓' }),
      el('div.drop-main', { text: WB.t(cfg.multipleFiles ? '点击选择文件，或将多个文件拖放到此区域（每个文件 = 一个集合）' : '点击选择文件，或将文件拖放到此区域') }),
      el('div.drop-sub', { text: WB.t(cfg.acceptHint || '支持 .txt / .tsv / .csv / .gmt，可直接用 Excel 复制粘贴到下方文本框') })
    ]);
    var fileInput = el('input', { type: 'file', style: { display: 'none' }, accept: cfg.accept || '.txt,.tsv,.csv,.gmt,.tab' });
    if (cfg.multipleFiles) fileInput.setAttribute('multiple', '');
    drop.addEventListener('click', function () { fileInput.click(); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', function () { if (fileInput.files.length) handleFiles(fileInput.files); });
    body.appendChild(drop);
    body.appendChild(fileInput);

    var fileChips = el('div.file-chips');
    body.appendChild(fileChips);
    function renderFileChips() {
      WB.clear(fileChips);
      if (!state.fileTexts) return;
      state.fileTexts.forEach(function (f) {
        fileChips.appendChild(el('span.file-chip', [
          el('span', { text: f.name }),
          el('span.chip-x', {
            text: '×', title: WB.t('移除'),
            onclick: function () {
              state.fileTexts = state.fileTexts.filter(function (x) { return x !== f; });
              if (!state.fileTexts.length) state.fileTexts = null;
              renderFileChips(); updatePreview(); saveState();
              if (cfg.onChange) cfg.onChange(collect());
            }
          })
        ]));
      });
      if (state.fileTexts) {
        fileChips.appendChild(el('span.chip-total', { text: WB.t('共 {n} 个文件', { n: state.fileTexts.length }) }));
      }
    }

    function handleFiles(files) {
      WB.readFilesText(files).then(function (res) {
        if (cfg.multipleFiles) {
          state.fileTexts = (state.fileTexts || []).concat(res);
          renderFileChips(); updatePreview();
        } else {
          state.fileTexts = [res[0]];
          renderFileChips();
          textarea.value = res[0].text;
          updatePreview();
        }
        saveState();
        if (cfg.onChange) cfg.onChange(collect());
      }).catch(function (e) { WB.toast(WB.t('文件读取失败：{msg}', { msg: e.message }), 'warn'); });
    }

    /* ---- 粘贴区 ---- */
    var taWrap = el('div.paste-wrap');
    taWrap.appendChild(el('div.paste-label', {
      text: WB.t(cfg.multipleFiles ? '或直接粘贴文本（多文件模式下将以文本框内容作为数据）' : '或直接把表格粘贴到这里（支持 Excel / 文本编辑器）')
    }));
    var textarea = el('textarea.paste-area', { placeholder: WB.t(cfg.placeholder || '在此粘贴数据…'), spellcheck: 'false' });
    textarea.addEventListener('input', WB.debounce(function () {
      updatePreview(); saveState();
      if (cfg.onChange) cfg.onChange(collect());
    }, 250));
    taWrap.appendChild(textarea);
    body.appendChild(taWrap);

    /* ---- 预览 ---- */
    var previewBox = el('div.preview-box');
    var previewHead = el('div.preview-head', [
      el('span', { text: WB.t('数据预览') }),
      el('span.preview-status')
    ]);
    var previewBody = el('div.preview-body');
    previewBox.appendChild(previewHead); previewBox.appendChild(previewBody);
    body.appendChild(previewBox);
    function updatePreview() {
      var txt = textarea.value;
      if (!txt.trim() && state.fileTexts && state.fileTexts.length) txt = state.fileTexts[0].text;
      if (!txt.trim()) {
        WB.clear(previewBody);
        previewBox.querySelector('.preview-status').textContent = WB.t('待输入数据…');
        previewBody.appendChild(el('div.preview-empty', { text: WB.t('尚未输入数据。可点击右上角「加载示例数据」插入示例数据。') }));
        return;
      }
      previewTable(previewBody, txt, cfg.previewRows || 6);
      var lines = txt.split(/\r?\n/).filter(function (l) { return l.trim(); }).length;
      previewBox.querySelector('.preview-status').textContent = WB.t('已解析 {n} 行数据', { n: Math.max(0, lines - 1) });
    }

    /* ---- 参数 ---- */
    var pf = null;
    if (cfg.params && cfg.params.length) {
      var pbox = el('div.param-box');
      pbox.appendChild(el('div.param-head', { text: WB.t(cfg.paramsTitle || '分析参数') }));
      pf = paramsForm(cfg.params, function () { saveState(); });
      pbox.appendChild(pf.node);
      body.appendChild(pbox);
    }

    /* ---- 额外内容槽 ---- */
    var extraSlot = el('div.extra-slot');
    body.appendChild(extraSlot);

    /* ---- 运行按钮 ---- */
    var foot = el('div.card-foot');
    var runBtn = el('button.btn.btn-primary', { text: WB.t(cfg.runLabel || '开始分析') });
    var msgSpan = el('span.foot-msg');
    runBtn.addEventListener('click', function () {
      var ctx = collect();
      saveState();
      if (!ctx.text.trim() && !(ctx.files && ctx.files.length)) {
        WB.toast(WB.t('请先输入数据或加载示例数据'), 'warn');
        msgSpan.textContent = WB.t('需要先提供数据');
        return;
      }
      msgSpan.textContent = '';
      try {
        var t0 = performance.now();
        cfg.onRun(ctx);
        var dt = performance.now() - t0;
        msgSpan.textContent = WB.t('完成，用时 {t}', { t: dt < 1000 ? dt.toFixed(0) + ' ms' : (dt / 1000).toFixed(2) + ' s' });
        // 记录本次运行，供「界面语言」切换后自动用新语言重绘
        WB._lastRunFn = function () { try { cfg.onRun(collect()); } catch (e2) { console.error(e2); } };
      } catch (e) {
        console.error(e);
        msgSpan.textContent = WB.t('出错：{msg}', { msg: e.message });
        WB.toast(WB.t('分析失败：{msg}', { msg: e.message }), 'error', 5200);
        WB._lastRunFn = null;
      }
    });
    foot.appendChild(runBtn);
    foot.appendChild(msgSpan);
    root.appendChild(foot);

    function collect() {
      var vals = pf ? pf.getValues() : {};
      if (cfg.extraValues) {
        try {
          var extra = cfg.extraValues();
          if (extra) Object.keys(extra).forEach(function (k) { vals[k] = extra[k]; });
        } catch (e) { /* 忽略附加取值异常 */ }
      }
      return {
        text: textarea.value,
        files: state.fileTexts ? state.fileTexts.map(function (f) { return f.text; }) : null,
        fileNames: state.fileTexts ? state.fileTexts.map(function (f) { return f.name; }) : null,
        values: vals,
        setValue: function (k, v) {
          if (!pf) return;
          if (pf.fields[k]) {
            if (pf.fields[k].def.type === 'checkbox') pf.fields[k].input.checked = !!v;
            else pf.fields[k].input.value = v;
          }
        },
        textarea: textarea
      };
    }

    /* ---- 恢复上次输入 ---- */
    WB._suppressSave = true;
    if (saved) {
      if (saved.text) textarea.value = saved.text;
      if (saved.files && saved.files.length) state.fileTexts = saved.files;
      if (saved.values && pf) pf.setValues(saved.values);
      if (saved.fmtIndex !== undefined && formats[saved.fmtIndex]) {
        state.fmtIndex = saved.fmtIndex;
        if (tabsDiv) {
          WB.$$('.fmt-tab', tabsDiv).forEach(function (t, j) { t.classList.toggle('active', j === state.fmtIndex); });
        }
      }
      if (saved.extra && cfg.extraState && cfg.extraState.set && typeof cfg.extraState.ready === 'function' && cfg.extraState.ready()) {
        cfg.extraState.set(saved.extra);
      }
    }
    WB._suppressSave = false;
    renderFileChips();
    renderFormat();
    updatePreview();

    return {
      root: root, collect: collect, body: body, extraSlot: extraSlot,
      setText: function (t) { textarea.value = t; updatePreview(); saveState(); },
      setParam: function (k, v) {
        if (!pf || !pf.fields[k]) return;
        var f = pf.fields[k];
        if (f.def.type === 'checkbox') f.input.checked = !!v; else f.input.value = v;
        saveState();
      },
      getParam: function (k) {
        if (!pf || !pf.fields[k]) return undefined;
        var f = pf.fields[k];
        return f.def.type === 'checkbox' ? f.input.checked : f.input.value;
      },
      refresh: function () { updatePreview(); saveState(); if (cfg.onChange) cfg.onChange(collect()); },
      save: saveState,
      restoreExtra: function () {
        if (saved && saved.extra && cfg.extraState && cfg.extraState.set) cfg.extraState.set(saved.extra);
      },
      formats: formats
    };
  }

  /* ---------------------------- 结果容器 ---------------------------------- */

  function resultCard(title, actions) {
    var head = el('div.card-head', [
      el('h3.card-title', [el('span.card-title-icon', { text: '▤' }), el('span', { text: title })])
    ]);
    if (actions) head.appendChild(el('div.card-actions', actions));
    return el('section.card.card-result', [head, el('div.card-body')]);
  }

  function statBar(items) {
    var bar = el('div.stat-bar');
    items.forEach(function (it) {
      bar.appendChild(el('div.stat-item' + (it.tone ? '.tone-' + it.tone : ''), [
        el('span.stat-value', { text: it.value }),
        el('span.stat-label', { text: it.label })
      ]));
    });
    return bar;
  }

  function tabs(defs) {
    var head = el('div.tabs-head');
    var body = el('div.tabs-body');
    var tabsArr = [];
    defs.forEach(function (d, i) {
      var btn = el('button.tab' + (i === 0 ? '.active' : ''), { text: d.label });
      btn.addEventListener('click', function () {
        tabsArr.forEach(function (t, j) {
          t.btn.classList.toggle('active', j === i);
          t.pane.style.display = j === i ? '' : 'none';
        });
        if (d.onShow) d.onShow();
      });
      head.appendChild(btn);
      var pane = el('div.tab-pane', { style: { display: i === 0 ? '' : 'none' } });
      if (d.content) pane.appendChild(d.content);
      body.appendChild(pane);
      tabsArr.push({ btn: btn, pane: pane, def: d });
    });
    return { node: el('div.tabs', [head, body]), tabs: tabsArr };
  }

  WB.ui = {
    card: card, sectionTitle: sectionTitle, paramsForm: paramsForm, alertBox: alertBox,
    dataTable: dataTable, previewTable: previewTable, inputPanel: inputPanel,
    resultCard: resultCard, statBar: statBar, tabs: tabs
  };
})(window);
