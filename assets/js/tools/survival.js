/* =============================================================================
 * tools/survival.js  —  生存分析（Kaplan-Meier 曲线 + log-rank 检验）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块元信息 */
    '生存分析': 'Survival analysis',
    'Kaplan-Meier 生存曲线、log-rank 检验、中位生存期与风险表；可按已有分组比较，也可对连续变量按中位数自动分组。':
      'Kaplan-Meier survival curves, log-rank test, median survival and a number-at-risk table; compare by an existing group column or split a continuous variable at its median.',
    'Kaplan-Meier': 'Kaplan-Meier',
    'log-rank 检验': 'log-rank test',
    '中位生存期': 'Median survival',
    '风险表': 'Number at risk',

    /* 输入格式 */
    '生存数据表（时间 / 状态 / 分组）': 'Survival table (time / status / group)',
    ['<b>至少两列：随访时间与事件状态</b>，可再加一列分组。列名会自动识别：' +
      '<code>time/month/days/生存时间</code>、<code>status/event/状态</code>、<code>group/risk/分组</code>。' +
      '<b>状态列</b>中 1 / Dead / Event / Yes / 进展 视为事件发生，0 / Alive / Censored 视为删失。']:
      '<b>At least two columns: follow-up time and event status</b>, plus an optional group column. Column names are auto-detected: ' +
      '<code>time/month/days</code>, <code>status/event</code>, <code>group/risk</code>. In the <b>status column</b>, ' +
      '1 / Dead / Event / Yes / Progressed counts as an event; 0 / Alive / Censored counts as censored.',
    '第一列通常是样本编号，其后依次是随访时间、事件状态、分组；状态用 1/0 或 Dead/Alive 均可。':
      'The first column is usually the sample ID, followed by follow-up time, event status and group; the status column accepts 1/0 or Dead/Alive.',
    '字段与分组填写示例': 'Fields and grouping example',
    '若没有分组列，可留空「分组列」，或在「连续变量」中填入一个数值列名，工具会按中位数自动分组。':
      'If there is no group column, leave “Group column” blank, or enter a numeric column name under “Continuous variable” and the tool will split groups at the median.',

    /* 页头 */
    '生存分析（Kaplan-Meier）': 'Survival analysis (Kaplan-Meier)',
    '绘制 Kaplan-Meier 生存曲线，计算中位生存期并做 log-rank 检验，用于比较不同分组的生存差异。':
      'Draw Kaplan-Meier survival curves, compute median survival and run the log-rank test to compare survival between groups.',

    /* 输入区 */
    '输入生存数据': 'Input survival data',
    '分析设置': 'Analysis settings',
    '时间列': 'Time column',
    '状态列': 'Status column',
    '分组列': 'Group column',
    '连续变量（按中位数分组，可选）': 'Continuous variable (median split, optional)',
    '事件取值（留空自动识别）': 'Event value (blank = auto-detect)',
    'X 轴上限（0 = 自动）': 'X-axis upper limit (0 = auto)',
    '显示 95% 置信区间': 'Show 95% confidence interval',
    '标注删失点': 'Mark censored observations',
    '显示风险表': 'Show number-at-risk table',
    '运行生存分析': 'Run survival analysis',

    /* 报错与提示 */
    '数据为空': 'The data is empty',
    '找不到列「{c}」，请填写列名或列序号（从 1 开始）':
      'Column “{c}” was not found; enter a column name or a 1-based column index.',
    '自动识别的列：时间 = {t}，状态 = {s}{g}。如不正确，请在参数中手动指定列名或列序号。':
      'Auto-detected columns: time = {t}, status = {s}{g}. If incorrect, specify the column name or index manually.',
    '，分组 = {g}': ', group = {g}',
    '根据「{v}」按中位数分组：{a} = {n} 例，{b} = {m} 例。':
      'Median split on “{v}”: {a} = {n} cases, {b} = {m} cases.',
    '低（≤ 中位数）': 'Low (≤ median)',
    '高（> 中位数）': 'High (> median)',
    '全部样本': 'All samples',
    '状态列取值：{list}；其中「{ev}」视为事件发生。':
      'Status values: {list}; “{ev}” is treated as an event.',
    '没有解析到有效的时间 / 状态数据，请检查列名或数据内容。':
      'No valid time / status data could be parsed; check the column names or the data.',
    '时间列存在非数值或负值，已跳过 {n} 行。': 'The time column contains non-numeric or negative values; {n} rows were skipped.',
    '至少需要 2 个样本才能计算生存曲线。': 'At least 2 samples are required to compute a survival curve.',

    /* 统计条与结论 */
    '样本数': 'Samples',
    '事件数': 'Events',
    '删失数': 'Censored',
    '分组数': 'Groups',
    'log-rank P 值': 'log-rank P',
    '总体': 'Overall',
    '未达到': 'Not reached',
    '中位生存期（{g}）': 'Median survival ({g})',
    '中位生存期未达到（随访期内生存概率始终高于 50%）。':
      'Median survival not reached (survival probability stays above 50% throughout follow-up).',
    'log-rank 检验：χ² = <b>{chi}</b>，自由度 = <b>{df}</b>，<b>P = {p}</b>。{verdict}':
      'log-rank test: χ² = <b>{chi}</b>, df = <b>{df}</b>, <b>P = {p}</b>. {verdict}',
    '各分组生存曲线差异具有统计学意义（P < 0.05）。':
      'The survival curves differ significantly between groups (P < 0.05).',
    '未检出各组生存曲线之间的显著差异（P ≥ 0.05）。':
      'No significant difference between the survival curves was detected (P ≥ 0.05).',
    '单一分组无法进行 log-rank 检验（该检验用于比较两组及以上）。':
      'The log-rank test compares two or more groups; a single group cannot be tested.',

    /* 结果卡片 */
    'Kaplan-Meier 生存曲线': 'Kaplan-Meier survival curves',
    '中位生存期汇总': 'Median survival summary',
    '风险表（各时点剩余例数）': 'Number at risk (per time point)',
    'log-rank 检验': 'log-rank test',
    '分组': 'Group',
    '时间': 'Time',
    '中位生存期': 'Median survival',
    '生存概率': 'Survival probability',
    '生存时间': 'Follow-up time',
    '删除例数': 'Censored',
    '观测事件数 (O)': 'Observed events (O)',
    '期望事件数 (E)': 'Expected events (E)',
    '组别': 'Group',
    '统计量 χ²': 'χ² statistic',
    '自由度': 'df',
    'P 值': 'P value',
    ['生存分析结果解读：曲线为 Kaplan-Meier 乘积极限估计（阶梯函数），纵轴为生存概率，横轴为随访时间；' +
      '中位生存期为生存概率首次降到 50% 对应的时间。注意：生存分析要求<b>删失与事件相互独立</b>，' +
      '且中位生存期只在随访期内生存概率降到 50% 以下时才有定义。']:
      'How to read this: the curves are Kaplan-Meier product-limit estimates (step functions), with survival probability on the y-axis and follow-up time on the x-axis; ' +
      'the median survival is the time at which the survival probability first drops to 50%. Note that survival analysis assumes <b>censoring is independent of the event</b>, ' +
      'and the median is defined only if the survival probability falls below 50% within the follow-up period.',
    '置信区间由 Greenwood 方差线性近似给出（±1.96·SE），随访后期样本量小时区间较宽。':
      'Confidence intervals use a linear approximation of Greenwood’s variance (±1.96·SE); they widen in the late follow-up when few subjects remain at risk.',
    '删失点在曲线上以短竖线标注。': 'Censored observations are marked with short vertical ticks on the curves.',
    '数据为空（未解析到有效行）': 'No valid rows were parsed'
  });

  var FORMATS = [
    {
      name: '生存数据表（时间 / 状态 / 分组）',
      filename: 'survival_template.tsv',
      desc: '<b>至少两列：随访时间与事件状态</b>，可再加一列分组。列名会自动识别：' +
        '<code>time/month/days/生存时间</code>、<code>status/event/状态</code>、<code>group/risk/分组</code>。' +
        '<b>状态列</b>中 1 / Dead / Event / Yes / 进展 视为事件发生，0 / Alive / Censored 视为删失。',
      sample: 'Sample\tTime\tStatus\tGroup\n' +
        'S001\t12.4\t1\tHigh risk\n' +
        'S002\t28.0\t1\tLow risk\n' +
        'S003\t41.5\t0\tLow risk\n' +
        'S004\t6.8\t1\tHigh risk\n' +
        'S005\t55.2\t0\tLow risk'
    },
    {
      name: '字段与分组填写示例',
      filename: 'survival_readme.txt',
      desc: '第一列通常是样本编号，其后依次是随访时间、事件状态、分组；状态用 1/0 或 Dead/Alive 均可。',
      sample: 'Sample\tTime\tStatus\tGroup\n' +
        'S001\t12.4\t1\tHigh risk\n' +
        'S002\t28.0\tDead\tLow risk\n' +
        'S003\t41.5\tAlive\tLow risk\n' +
        '...\n\n' +
        '若没有分组列，可留空「分组列」，或在「连续变量」中填入一个数值列名，工具会按中位数自动分组。'
    }
  ];

  WB.register({
    id: 'survival',
    name: '生存分析',
    icon: '⏱',
    color: '#2f8f5b',
    desc: 'Kaplan-Meier 生存曲线、log-rank 检验、中位生存期与风险表；可按已有分组比较，也可对连续变量按中位数自动分组。',
    tags: ['Kaplan-Meier', 'log-rank 检验', '中位生存期', '风险表'],

    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('生存分析（Kaplan-Meier）') }),
        el('p', { text: T('绘制 Kaplan-Meier 生存曲线，计算中位生存期并做 log-rank 检验，用于比较不同分组的生存差异。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入生存数据',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.survivalText,
        placeholder: 'Sample\tTime\tStatus\tGroup\nS001\t12.4\t1\tHigh risk\nS002\t28.0\t1\tLow risk\n...',
        paramsTitle: '分析设置',
        params: [
          { key: 'timeCol', label: '时间列', type: 'text', value: '', placeholder: 'auto' },
          { key: 'statusCol', label: '状态列', type: 'text', value: '', placeholder: 'auto' },
          { key: 'groupCol', label: '分组列', type: 'text', value: '', placeholder: 'auto' },
          { key: 'cutVar', label: '连续变量（按中位数分组，可选）', type: 'text', value: '', placeholder: '' },
          { key: 'eventValue', label: '事件取值（留空自动识别）', type: 'text', value: '', placeholder: 'auto' },
          { key: 'xMax', label: 'X 轴上限（0 = 自动）', type: 'number', value: 0, min: 0, max: 100000, step: 1 },
          { key: 'ci', label: '显示 95% 置信区间', type: 'checkbox', value: true },
          { key: 'censorMark', label: '标注删失点', type: 'checkbox', value: true },
          { key: 'showRisk', label: '显示风险表', type: 'checkbox', value: true }
        ],
        runLabel: '运行生存分析',
        onRun: function (ctx) {
          var res = WB.$('#survival-result');
          WB.clear(res);
          runAnalysis(res, ctx);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'survival-result';
      main.appendChild(wrap);
      if (!WB._svDemoLoaded) { WB._svDemoLoaded = true; panel.setText(WB.demo.survivalText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  var EVENT_RE = /^(1|1\.0|dead|death|deceased|event|yes|y|true|t|progress|progressed|progression|recur|recurrence|relapse|事件|死亡|进展|复发|有)$/i;
  var TIME_PAT = /^(time|times|os|os_?time|surv\w*|survival\w*|follow\w*|month\w*|day\w*|year\w*|时间|生存时间|随访时间|月|天)$/i;
  var STATUS_PAT = /^(status|event|os_?status|censor\w*|vital\w*|death|dead|state|状态|事件|结局|转归)$/i;
  var GROUP_PAT = /^(group|groups|arm|risk\w*|stratum|strata|cohort|class|label|分组|组别|风险组|亚组)$/i;

  function runAnalysis(res, ctx) {
    var tb = WB.parse.parseTable(ctx.text, {});
    if (!tb.rows.length) throw new Error(T('数据为空（未解析到有效行）'));
    var header = tb.header.map(function (h) { return String(h == null ? '' : h).trim(); });

    function resolveCol(spec, patterns, looseWords) {
      spec = String(spec == null ? '' : spec).trim();
      if (spec) {
        if (/^\d+$/.test(spec)) {
          var n = parseInt(spec, 10);
          if (n >= 1 && n <= header.length) return n - 1;
          throw new Error(T('找不到列「{c}」，请填写列名或列序号（从 1 开始）', { c: spec }));
        }
        for (var i = 0; i < header.length; i++) {
          if (header[i].toLowerCase() === spec.toLowerCase()) return i;
        }
        throw new Error(T('找不到列「{c}」，请填写列名或列序号（从 1 开始）', { c: spec }));
      }
      for (var p = 0; p < patterns.length; p++) {
        for (var j = 0; j < header.length; j++) if (patterns[p].test(header[j])) return j;
      }
      if (looseWords) {
        for (var q = 0; q < looseWords.length; q++) {
          for (var k = 0; k < header.length; k++) {
            if (header[k].toLowerCase().indexOf(looseWords[q]) >= 0) return k;
          }
        }
      }
      return -1;
    }

    var timeIdx = resolveCol(ctx.values.timeCol, [TIME_PAT], ['time', 'surv', 'month', 'day', '时间', '随访']);
    var statusIdx = resolveCol(ctx.values.statusCol, [STATUS_PAT], ['status', 'event', '状态', '事件']);
    var groupIdx = resolveCol(ctx.values.groupCol, [GROUP_PAT], ['group', 'risk', 'arm', '分组', '风险']);
    var cutIdx = resolveCol(ctx.values.cutVar, [], null);

    /* 兜底：假设布局为 [编号, 时间, 状态, 分组?] */
    if (timeIdx < 0 || statusIdx < 0) {
      if (header.length >= 3) {
        if (timeIdx < 0) timeIdx = 1;
        if (statusIdx < 0) statusIdx = 2;
      } else {
        if (timeIdx < 0) timeIdx = 0;
        if (statusIdx < 0) statusIdx = header.length - 1;
      }
    }
    if (timeIdx === statusIdx) throw new Error(T('没有解析到有效的时间 / 状态数据，请检查列名或数据内容。'));

    /* 提取数据行 */
    var recs = [], skipped = 0;
    tb.rows.forEach(function (r) {
      var tv = WB.parse.num(r[timeIdx]);
      if (!isFinite(tv) || tv < 0) { skipped++; return; }
      recs.push({
        time: tv,
        rawStatus: r[statusIdx],
        groupRaw: groupIdx >= 0 ? String(r[groupIdx] == null ? '' : r[groupIdx]).trim() : '',
        cutRaw: cutIdx >= 0 ? WB.parse.num(r[cutIdx]) : NaN
      });
    });
    if (recs.length < 2) throw new Error(T('至少需要 2 个样本才能计算生存曲线。'));

    /* 事件指示 */
    var evSpec = String(ctx.values.eventValue == null ? '' : ctx.values.eventValue).trim();
    var events = [], statusSeen = [];
    recs.forEach(function (r) {
      var v = String(r.rawStatus == null ? '' : r.rawStatus).trim();
      if (statusSeen.indexOf(v) < 0 && statusSeen.length < 8) statusSeen.push(v);
      if (evSpec) {
        var isEv = v.toLowerCase() === evSpec.toLowerCase();
        var numV = WB.parse.num(v), numS = WB.parse.num(evSpec);
        if (isFinite(numV) && isFinite(numS) && numV === numS) isEv = true;
        r.e = isEv ? 1 : 0;
      } else {
        var nv = WB.parse.num(v);
        if (isFinite(nv)) r.e = nv === 0 ? 0 : 1;
        else r.e = EVENT_RE.test(v) ? 1 : 0;
      }
      events.push(r.e);
    });
    var evLabel = evSpec || (function () {
      var found = '1';
      statusSeen.forEach(function (v) {
        if (EVENT_RE.test(v) && (found === '1' || String(v).trim() === '1')) found = v;
      });
      return found;
    })();

    /* 分组 */
    var groups = [];
    if (groupIdx >= 0) {
      var order = [], map = {};
      recs.forEach(function (r) {
        var g = r.groupRaw || T('全部样本');
        if (!map[g]) { map[g] = []; order.push(g); }
        map[g].push(r);
      });
      groups = order.map(function (g) { return { name: g, recs: map[g] }; });
    } else if (cutIdx >= 0) {
      var vals = recs.map(function (r) { return r.cutRaw; }).filter(isFinite);
      if (!vals.length) throw new Error(T('没有解析到有效的时间 / 状态数据，请检查列名或数据内容。'));
      var med = WB.stats.median(vals);
      var lo = [], hi = [];
      recs.forEach(function (r) {
        if (!isFinite(r.cutRaw)) return;
        (r.cutRaw <= med ? lo : hi).push(r);
      });
      groups = [
        { name: T('低（≤ 中位数）'), recs: lo },
        { name: T('高（> 中位数）'), recs: hi }
      ].filter(function (g) { return g.recs.length; });
      res.appendChild(WB.ui.alertBox('info',
        T('根据「{v}」按中位数分组：{a} = {n} 例，{b} = {m} 例。', {
          v: header[cutIdx], a: T('低（≤ 中位数）'), n: lo.length, b: T('高（> 中位数）'), m: hi.length
        })));
    } else {
      groups = [{ name: T('全部样本'), recs: recs }];
    }

    /* 逐组计算 KM */
    var kmByGroup = groups.map(function (g) {
      return WB.stats.kaplanMeier(g.recs.map(function (r) { return r.time; }),
        g.recs.map(function (r) { return r.e; }));
    });

    /* 风险表时点 */
    var allMax = 0;
    kmByGroup.forEach(function (km) { if (km.maxTime > allMax) allMax = km.maxTime; });
    var xMax = Number(ctx.values.xMax) > 0 ? Number(ctx.values.xMax) : allMax * 1.02;
    var riskTicks = WB.niceTicks(0, xMax, 6).filter(function (t) { return t <= xMax + 1e-9; });

    var nEvents = events.reduce(function (a, b) { return a + b; }, 0);

    /* 统计条 */
    var lr = groups.length >= 2 ? WB.stats.logRankTest(groups.map(function (g) {
      return { time: g.recs.map(function (r) { return r.time; }), event: g.recs.map(function (r) { return r.e; }) };
    })) : null;

    var bar = [
      { label: T('样本数'), value: recs.length },
      { label: T('事件数'), value: nEvents, tone: 'red' },
      { label: T('删失数'), value: recs.length - nEvents },
      { label: T('分组数'), value: groups.length }
    ];
    if (lr && isFinite(lr.p)) bar.push({ label: T('log-rank P 值'), value: WB.pFormat(lr.p), tone: lr.p < 0.05 ? 'red' : '' });
    res.appendChild(WB.ui.statBar(bar));

    /* 识别说明 */
    res.appendChild(WB.ui.alertBox('info',
      T('自动识别的列：时间 = {t}，状态 = {s}{g}。如不正确，请在参数中手动指定列名或列序号。', {
        t: header[timeIdx] || ('#' + (timeIdx + 1)),
        s: header[statusIdx] || ('#' + (statusIdx + 1)),
        g: groupIdx >= 0 ? T('，分组 = {g}', { g: header[groupIdx] || ('#' + (groupIdx + 1)) }) : ''
      })));
    res.appendChild(WB.ui.alertBox('info',
      T('状态列取值：{list}；其中「{ev}」视为事件发生。', { list: statusSeen.join(' / '), ev: evLabel })));
    if (skipped > 0) res.appendChild(WB.ui.alertBox('warn', T('时间列存在非数值或负值，已跳过 {n} 行。', { n: skipped })));

    /* KM 曲线 */
    var card = WB.ui.resultCard(T('Kaplan-Meier 生存曲线'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = drawKM(holder, groups, kmByGroup, {
      xMax: xMax, xTitle: T('生存时间'), yTitle: T('生存概率'),
      ci: !!ctx.values.ci, censorMark: !!ctx.values.censorMark
    });
    if (svg) {
      WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'km_curve' });
      body.appendChild(el('div.preview-note', { text: T('生存分析结果解读：曲线为 Kaplan-Meier 乘积极限估计（阶梯函数），纵轴为生存概率，横轴为随访时间；' +
        '中位生存期为生存概率首次降到 50% 对应的时间。注意：生存分析要求<b>删失与事件相互独立</b>，' +
        '且中位生存期只在随访期内生存概率降到 50% 以下时才有定义。') }));
      if (ctx.values.ci) body.appendChild(el('div.preview-note', { text: T('置信区间由 Greenwood 方差线性近似给出（±1.96·SE），随访后期样本量小时区间较宽。') }));
      if (ctx.values.censorMark) body.appendChild(el('div.preview-note', { text: T('删失点在曲线上以短竖线标注。') }));
    }

    /* 中位生存期汇总 */
    var mCard = WB.ui.resultCard(T('中位生存期汇总'));
    res.appendChild(mCard);
    var mBody = mCard.querySelector('.card-body');
    var mRows = groups.map(function (g, i) {
      var km = kmByGroup[i];
      var ne = g.recs.filter(function (r) { return r.e === 1; }).length;
      return {
        name: g.name, n: g.recs.length, events: ne,
        censored: g.recs.length - ne,
        median: km.median === null ? T('未达到') : WB.formatNum(km.median, 1)
      };
    });
    WB.ui.dataTable(mBody, [
      { key: 'name', label: T('分组') },
      { key: 'n', label: T('样本数'), align: 'right', width: 88 },
      { key: 'events', label: T('事件数'), align: 'right', width: 88 },
      { key: 'censored', label: T('删失数'), align: 'right', width: 88 },
      { key: 'median', label: T('中位生存期'), align: 'right', width: 120 }
    ], mRows, { exportName: 'km_median' });
    var anyNotReached = kmByGroup.some(function (km) { return km.median === null; });
    if (anyNotReached) {
      mBody.appendChild(el('div.preview-note', { text: T('中位生存期未达到（随访期内生存概率始终高于 50%）。') }));
    }

    /* 风险表 */
    if (ctx.values.showRisk && riskTicks.length) {
      var rCard = WB.ui.resultCard(T('风险表（各时点剩余例数）'));
      res.appendChild(rCard);
      var rBody = rCard.querySelector('.card-body');
      var rCols = [{ key: 'time', label: T('时间'), align: 'right', width: 90, format: function (r) { return WB.formatNum(r.time, 1); } }];
      groups.forEach(function (g, i) {
        rCols.push({
          key: 'g' + i, label: g.name, align: 'right', width: 96,
          format: function (r) { return r['g' + i]; }
        });
      });
      var rRows = riskTicks.map(function (t) {
        var o = { time: t };
        groups.forEach(function (g, i) {
          o['g' + i] = g.recs.filter(function (r) { return r.time >= t - 1e-9; }).length;
        });
        return o;
      });
      WB.ui.dataTable(rBody, rCols, rRows, { exportName: 'km_risk_table' });
    }

    /* log-rank */
    var lCard = WB.ui.resultCard(T('log-rank 检验'));
    res.appendChild(lCard);
    var lBody = lCard.querySelector('.card-body');
    if (!lr || !isFinite(lr.chi2)) {
      lBody.appendChild(el('div.preview-note', { text: T('单一分组无法进行 log-rank 检验（该检验用于比较两组及以上）。') }));
    } else {
      lBody.innerHTML = WB.t('log-rank 检验：χ² = <b>{chi}</b>，自由度 = <b>{df}</b>，<b>P = {p}</b>。{verdict}', {
        chi: WB.formatNum(lr.chi2, 3), df: lr.df, p: WB.pFormat(lr.p),
        verdict: lr.p < 0.05
          ? T('各分组生存曲线差异具有统计学意义（P < 0.05）。')
          : T('未检出各组生存曲线之间的显著差异（P ≥ 0.05）。')
      });
      var lRows = groups.map(function (g, i) {
        return {
          name: g.name,
          obs: WB.formatNum(lr.observed[i], 2),
          exp: WB.formatNum(lr.expected[i], 2)
        };
      });
      WB.ui.dataTable(lBody, [
        { key: 'name', label: T('组别') },
        { key: 'obs', label: T('观测事件数 (O)'), align: 'right', width: 140 },
        { key: 'exp', label: T('期望事件数 (E)'), align: 'right', width: 140 }
      ], lRows, { exportName: 'logrank' });
    }
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawKM(container, groups, kmByGroup, cfg) {
    if (!groups.length) { WB.plot.emptyState(container, T('common.noData')); return null; }

    var W = 760, H = 460, m = { l: 62, r: 26, t: 24, b: 70 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var sx = WB.plot.linearScale(0, cfg.xMax, m.l, W - m.r);
    var sy = WB.plot.linearScale(0, 1, H - m.b, m.t);

    /* 网格 */
    sx.ticks(7).forEach(function (t) {
      if (t < 0 || t > cfg.xMax) return;
      root.appendChild(S('line', { x1: sx(t), y1: m.t, x2: sx(t), y2: H - m.b, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(sx(t), H - m.b + 17, WB.formatNum(t, 1),
        { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, t.toFixed(2),
        { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    /* 50% 参考线 */
    root.appendChild(S('line', {
      x1: m.l, y1: sy(0.5), x2: W - m.r, y2: sy(0.5),
      stroke: '#b6c2cc', 'stroke-dasharray': '5 4'
    }));
    root.appendChild(WB.plot.txt(W - m.r - 4, sy(0.5) - 5, T('中位生存期'), {
      'text-anchor': 'end', 'font-size': 10, fill: WB.plot.MUTED
    }));

    var colorOf = function (j) { return WB.plot.palette(j); };

    groups.forEach(function (g, gi) {
      var km = kmByGroup[gi];
      var col = colorOf(gi);
      var curve = km.curve;

      /* 95% 置信区间（Greenwood 线性近似） */
      if (cfg.ci) {
        var loPts = [], hiPts = [], cumVar = 0;
        curve.forEach(function (p, i) {
          if (i > 0 && p.events > 0 && p.atRisk > 0 && (p.atRisk - p.events) > 0) {
            cumVar += p.events / (p.atRisk * (p.atRisk - p.events));
          }
          var se = p.surv * Math.sqrt(cumVar);
          var lo = Math.max(0, p.surv - 1.96 * se);
          var hi = Math.min(1, p.surv + 1.96 * se);
          loPts.push({ x: sx(p.time), y: sy(lo) });
          hiPts.push({ x: sx(p.time), y: sy(hi) });
        });
        /* 阶梯化折线（简化：直接用折线连接置信限） */
        var hiD = '', loD = '';
        for (var i = 0; i < hiPts.length; i++) {
          hiD += (i ? 'L' : 'M') + hiPts[i].x.toFixed(1) + ',' + hiPts[i].y.toFixed(1);
          loD += (i ? 'L' : 'M') + loPts[i].x.toFixed(1) + ',' + loPts[i].y.toFixed(1);
        }
        hiD += 'L' + sx(cfg.xMax).toFixed(1) + ',' + (hiPts.length ? hiPts[hiPts.length - 1].y.toFixed(1) : sy(1).toFixed(1));
        loD += 'L' + sx(cfg.xMax).toFixed(1) + ',' + (loPts.length ? loPts[loPts.length - 1].y.toFixed(1) : sy(1).toFixed(1));
        root.appendChild(S('path', {
          d: hiD, fill: 'none', stroke: col, 'stroke-width': 1,
          'stroke-dasharray': '3 3', 'stroke-opacity': 0.55
        }));
        root.appendChild(S('path', {
          d: loD, fill: 'none', stroke: col, 'stroke-width': 1,
          'stroke-dasharray': '3 3', 'stroke-opacity': 0.55
        }));
      }

      /* 阶梯曲线 */
      var d = 'M' + sx(0).toFixed(1) + ',' + sy(1).toFixed(1);
      var prevS = 1;
      for (var k = 1; k < curve.length; k++) {
        var p = curve[k];
        d += 'L' + sx(p.time).toFixed(1) + ',' + sy(prevS).toFixed(1);
        d += 'L' + sx(p.time).toFixed(1) + ',' + sy(p.surv).toFixed(1);
        prevS = p.surv;
      }
      d += 'L' + sx(cfg.xMax).toFixed(1) + ',' + sy(prevS).toFixed(1);
      root.appendChild(S('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 2 }));

      /* 删失标记 */
      if (cfg.censorMark) {
        var cens = [];
        for (var q = 0; q < curve.length; q++) {
          if (curve[q].censored > 0) cens.push(curve[q]);
        }
        cens.forEach(function (p) {
          var cx = sx(p.time), cy = sy(p.surv);
          var half = 3.5;
          root.appendChild(S('line', {
            x1: cx, y1: cy + half, x2: cx, y2: cy - half,
            stroke: col, 'stroke-width': 1.6
          }));
        });
      }
    });

    /* 坐标框与标题 */
    root.appendChild(S('rect', {
      x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b,
      fill: 'none', stroke: WB.plot.AXIS
    }));
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 16, cfg.xTitle,
      { 'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, cfg.yTitle,
      { 'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + (H - m.t - m.b) / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);

    /* 悬停提示（按 x 位置找最近的曲线点） */
    var hover = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
    root.appendChild(hover);
    hover.addEventListener('mousemove', function (e) {
      var rect = canvas.svg.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      var tHit = sx.invert(mx);
      var html = [];
      groups.forEach(function (g, gi) {
        var curve = kmByGroup[gi].curve, last = curve[0];
        for (var i = 1; i < curve.length; i++) {
          if (curve[i].time <= tHit) last = curve[i];
          else break;
        }
        html.push('<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' +
          colorOf(gi) + ';margin-right:5px"></span>' + WB.esc(g.name) + '：S = ' + WB.formatNum(last.surv, 3));
      });
      WB.plot.tipShow('<b>' + T('时间') + ' = ' + WB.formatNum(tHit, 1) + '</b><br>' + html.join('<br>'), e);
    });
    hover.addEventListener('mouseleave', function () { WB.plot.tipHide(); });

    WB.plot.legendCategorical(container, groups.map(function (g, j) {
      return { color: colorOf(j), label: g.name + ' (n = ' + g.recs.length + ')' };
    }));
    return canvas.svg;
  }
})(window);
