/* =============================================================================
 * tools/roc.js  —  ROC 曲线与 AUC（二分类判别能力评估）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块元信息 */
    'ROC 曲线与 AUC / ROC & AUC': 'ROC curves & AUC',
    '二分类判别能力评估：输入真实标签与一个或多个预测分数，绘制 ROC 曲线、计算 AUC（梯形积分）以及 Youden 指数最佳截断点对应的灵敏度、特异度、PPV、NPV 与准确率。':
      'Binary discrimination performance: given true labels and one or more prediction scores, draws ROC curves and reports the AUC (trapezoidal integration) plus sensitivity, specificity, PPV, NPV and accuracy at the Youden-optimal cut-off.',
    'ROC': 'ROC',
    'AUC': 'AUC',
    '最佳截断': 'Optimal cut-off',
    '判别能力': 'Discrimination',

    /* 输入格式 */
    '标签 + 打分列（可多列）': 'Label + score column(s)',
    ['<b>第一列为真实标签（两类）</b>，其后每列是一个标记物 / 模型的预测分数。' +
      '列名会自动识别标签列：<code>label / class / status / group / 标签 / 类别</code>。' +
      '其余数值列会被分别绘制一条 ROC 曲线。']:
      '<b>The first column holds the true labels (two classes)</b>; every following column is the prediction score of one marker or model. ' +
      'The label column is auto-detected by name: <code>label / class / status / group</code>. ' +
      'Each remaining numeric column is drawn as a separate ROC curve.',
    '标签可用 <code>0/1</code>、<code>Negative/Positive</code>、<code>Normal/Tumor</code> 等任意两种取值；打分列应为连续的置信度或浓度值。':
      'Labels may be any two values such as <code>0/1</code>, <code>Negative/Positive</code> or <code>Normal/Tumor</code>; score columns should be continuous confidence or concentration values.',
    '标签取值示例': 'Label value example',
    '标签也可以是 Normal / Tumor 等文字；工具会自动识别阳性类别，也可在参数中手动指定。':
      'Labels may also be words such as Normal / Tumor; the positive class is detected automatically and can also be set manually in the parameters.',

    /* 页头 */
    'ROC 曲线与 AUC 分析': 'ROC curve and AUC analysis',
    '评估标记物或模型的二分类判别能力：曲线越靠近左上角越好，AUC = 0.5 相当于随机猜测。':
      'Evaluate the binary discrimination of a marker or model: the closer the curve to the top-left corner the better, with AUC = 0.5 equivalent to chance.',

    /* 输入区 */
    '输入标签与打分': 'Input labels and scores',
    '分析设置': 'Analysis settings',
    '标签列': 'Label column',
    '阳性类别取值': 'Positive class value',
    '判别方向': 'Direction',
    '自动判断': 'Auto-detect',
    '分数越高越可能为阳性': 'Higher score → more likely positive',
    '分数越低越可能为阳性': 'Lower score → more likely positive',
    '参与分析的打分列（逗号分隔，留空 = 全部）': 'Score columns (comma-separated, blank = all)',
    '显示 AUC 的 95% 置信区间': 'Show 95% confidence interval for AUC',
    '运行 ROC 分析': 'Run ROC analysis',

    /* 报错与提示 */
    '数据为空': 'The data is empty',
    '未找到可用的数值打分列，请检查数据。': 'No usable numeric score column was found; please check the data.',
    '标签列必须包含恰好两类取值，当前为 {n} 类：{list}':
      'The label column must contain exactly two classes; found {n}: {list}',
    '找不到列「{c}」，请填写列名或列序号（从 1 开始）':
      'Column “{c}” was not found; enter a column name or a 1-based column index.',
    '自动识别：标签列 = 「{lab}」，阳性类别 = 「{pos}」，阴性类别 = 「{neg}」，判别方向 = {dir}。可在参数中手动调整。':
      'Auto-detected: label column = “{lab}”, positive class = “{pos}”, negative class = “{neg}”, direction = {dir}. Adjust manually in the parameters if needed.',
    '分数越大越可能为阳性': 'higher scores indicate positive',
    '分数越小越可能为阳性': 'lower scores indicate positive',
    '样本在三类取值上缺失，已跳过 {n} 行。': 'Rows with missing values were skipped ({n}).',
    '标注「{m}」的 ROC 曲线下方出现预警：阳性或阴性例数为 0，无法计算。':
      'Marker “{m}” could not be evaluated: one class has zero cases.',

    /* 统计条与结论 */
    '样本数': 'Samples',
    '阳性例数': 'Positive cases',
    '阴性例数': 'Negative cases',
    '标记物数': 'Markers',
    '判别能力（AUC）': 'Discrimination (AUC)',
    '优秀（AUC ≥ 0.90）': 'Excellent (AUC ≥ 0.90)',
    '良好（0.80 ≤ AUC < 0.90）': 'Good (0.80 ≤ AUC < 0.90)',
    '可接受（0.70 ≤ AUC < 0.80）': 'Fair (0.70 ≤ AUC < 0.80)',
    '较差（0.60 ≤ AUC < 0.70）': 'Poor (0.60 ≤ AUC < 0.70)',
    '接近随机（AUC < 0.60）': 'Close to chance (AUC < 0.60)',
    'AUC 采用梯形积分计算，等价于 Mann-Whitney U 统计量；AUC = 0.5 表示与随机猜测无异，1.0 表示完全区分。':
      'AUC is computed by trapezoidal integration and is equivalent to the Mann-Whitney U statistic; AUC = 0.5 means chance-level and 1.0 means perfect separation.',
    '最佳截断点由 Youden 指数（灵敏度 + 特异度 − 1）最大化确定，仅用于参考；实际阈值应结合临床或实验成本权衡。':
      'The optimal cut-off is the one maximising the Youden index (sensitivity + specificity − 1). It is provided for reference only; the practical threshold should weigh clinical or experimental costs.',

    /* 结果卡片 */
    'ROC 曲线': 'ROC curves',
    'AUC 汇总': 'AUC summary',
    '最佳截断点指标（{m}）': 'Metrics at the optimal cut-off ({m})',
    '混淆矩阵（{m}，截断 = {c}）': 'Confusion matrix ({m}, cut-off = {c})',
    '阈值明细（{m}，按 Youden 指数排序）': 'Threshold details ({m}, sorted by Youden index)',
    '标记物 / 模型': 'Marker / model',
    '95% 置信区间': '95% CI',
    '截断值': 'Cut-off',
    '灵敏度': 'Sensitivity',
    '特异度': 'Specificity',
    'Youden 指数': 'Youden index',
    '准确率': 'Accuracy',
    '阳性预测值': 'PPV',
    '阴性预测值': 'NPV',
    'F1 分数': 'F1 score',
    '约登指数': 'Youden index',
    '阈值': 'Threshold',
    '真阳性': 'True positive',
    '假阳性': 'False positive',
    '假阴性': 'False negative',
    '真阴性': 'True negative',
    '实际 \\ 预测': 'Actual \\ Predicted',
    '合计': 'Total',
    '曲线：横轴为 1 − 特异度（假阳性率），纵轴为灵敏度（真阳性率）；对角线为随机猜测参考线，曲线越靠近左上角判别能力越强。':
      'Curves: the x-axis is 1 − specificity (false-positive rate) and the y-axis is sensitivity (true-positive rate); the diagonal is the chance reference line, and the closer a curve to the top-left corner the stronger its discrimination.',
    '灵敏度 = TP / (TP + FN)，特异度 = TN / (TN + FP)，阳性预测值 = TP / (TP + FP)，阴性预测值 = TN / (TN + FN)。':
      'Sensitivity = TP / (TP + FN), specificity = TN / (TN + FP), PPV = TP / (TP + FP), NPV = TN / (TN + FN).',
    'AUC 的 95% 置信区间由 Hanley-McNeil 近似给出；样本量较小时区间较宽。':
      'The 95% confidence interval of the AUC uses the Hanley-McNeil approximation; it widens for small samples.',
    '在多标记物比较中，直接比较 AUC 存在抽样误差，必要时应做 DeLong 检验等正式统计比较。':
      'Comparing AUCs across markers is subject to sampling error; a formal test such as the DeLong test is advisable when a difference matters.',
    '无法确定': 'Undefined'
  });

  var FORMATS = [
    {
      name: '标签 + 打分列（可多列）',
      filename: 'roc_template.tsv',
      desc: '<b>第一列为真实标签（两类）</b>，其后每列是一个标记物 / 模型的预测分数。' +
        '列名会自动识别标签列：<code>label / class / status / group / 标签 / 类别</code>。' +
        '其余数值列会被分别绘制一条 ROC 曲线。',
      sample: 'Sample\tLabel\tMarker_A\tMarker_B\n' +
        'S001\tPositive\t1.842\t0.913\n' +
        'S002\tNegative\t-0.221\t0.104\n' +
        'S003\tPositive\t1.155\t1.402\n' +
        'S004\tNegative\t0.318\t-0.562\n' +
        'S005\tPositive\t2.301\t0.774'
    },
    {
      name: '标签取值示例',
      filename: 'roc_readme.txt',
      desc: '标签可用 <code>0/1</code>、<code>Negative/Positive</code>、<code>Normal/Tumor</code> 等任意两种取值；打分列应为连续的置信度或浓度值。',
      sample: 'Sample\tLabel\tMarker_A\tMarker_B\tMarker_C\n' +
        'S001\t1\t1.842\t0.913\t0.221\n' +
        'S002\t0\t-0.221\t0.104\t-0.318\n' +
        '...\n\n' +
        '标签也可以是 Normal / Tumor 等文字；工具会自动识别阳性类别，也可在参数中手动指定。'
    }
  ];

  WB.register({
    id: 'roc',
    name: 'ROC 曲线与 AUC / ROC & AUC',
    icon: '◠',
    color: '#3b6ea5',
    desc: '二分类判别能力评估：输入真实标签与一个或多个预测分数，绘制 ROC 曲线、计算 AUC（梯形积分）以及 Youden 指数最佳截断点对应的灵敏度、特异度、PPV、NPV 与准确率。',
    tags: ['ROC', 'AUC', '最佳截断', '判别能力'],

    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('ROC 曲线与 AUC 分析') }),
        el('p', { text: T('评估标记物或模型的二分类判别能力：曲线越靠近左上角越好，AUC = 0.5 相当于随机猜测。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入标签与打分',
        accept: '.txt,.tsv,.csv,.tab',
        formats: FORMATS,
        demoText: WB.demo.rocText,
        placeholder: 'Sample\tLabel\tMarker_A\tMarker_B\nS001\tPositive\t1.842\t0.913\nS002\tNegative\t-0.221\t0.104\n...',
        paramsTitle: '分析设置',
        params: [
          { key: 'labelCol', label: '标签列', type: 'text', value: '', placeholder: 'auto' },
          { key: 'posLabel', label: '阳性类别取值', type: 'text', value: '', placeholder: 'auto' },
          {
            key: 'direction', label: '判别方向', type: 'select', value: 'auto',
            options: [
              { value: 'auto', label: '自动判断' },
              { value: 'high', label: '分数越高越可能为阳性' },
              { value: 'low', label: '分数越低越可能为阳性' }
            ]
          },
          { key: 'scoreCols', label: '参与分析的打分列（逗号分隔，留空 = 全部）', type: 'text', value: '', placeholder: '' },
          { key: 'ci', label: '显示 AUC 的 95% 置信区间', type: 'checkbox', value: true }
        ],
        runLabel: '运行 ROC 分析',
        onRun: function (ctx) {
          var res = WB.$('#roc-result');
          WB.clear(res);
          runAnalysis(res, ctx);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'roc-result';
      main.appendChild(wrap);
      if (!WB._rocDemoLoaded) { WB._rocDemoLoaded = true; panel.setText(WB.demo.rocText); }
    }
  });

  /* ------------------------------ 主流程 -------------------------------- */

  var LABEL_PAT = /^(label|labels|class|classes|status|group|outcome|target|diagnosis|type|标签|类别|分组|诊断|结果)$/i;
  var POS_PAT = /^(1|1\.0|positive|pos|case|yes|y|true|t|tumor|tumour|cancer|disease|malignant|abnormal|死亡|阳性|病例|肿瘤|患病|异常)$/i;

  function runAnalysis(res, ctx) {
    var tb = WB.parse.parseTable(ctx.text, {});
    if (!tb.rows.length) throw new Error(T('数据为空'));
    var header = tb.header.map(function (h) { return String(h == null ? '' : h).trim(); });

    /* 标签列 */
    var labIdx = -1;
    var labSpec = String(ctx.values.labelCol == null ? '' : ctx.values.labelCol).trim();
    if (labSpec) {
      if (/^\d+$/.test(labSpec)) {
        var n = parseInt(labSpec, 10);
        if (n >= 1 && n <= header.length) labIdx = n - 1;
        else throw new Error(T('找不到列「{c}」，请填写列名或列序号（从 1 开始）', { c: labSpec }));
      } else {
        for (var i = 0; i < header.length; i++) if (header[i].toLowerCase() === labSpec.toLowerCase()) labIdx = i;
        if (labIdx < 0) throw new Error(T('找不到列「{c}」，请填写列名或列序号（从 1 开始）', { c: labSpec }));
      }
    } else {
      for (var j0 = 0; j0 < header.length; j0++) {
        if (LABEL_PAT.test(header[j0])) { labIdx = j0; break; }
      }
    }

    /* 打分列 */
    var scoreIdx = [];
    var scSpec = String(ctx.values.scoreCols == null ? '' : ctx.values.scoreCols).trim();
    if (scSpec) {
      scSpec.split(/[,，;]/).forEach(function (tok) {
        tok = tok.trim();
        if (!tok) return;
        if (/^\d+$/.test(tok)) {
          var k = parseInt(tok, 10) - 1;
          if (k >= 0 && k < header.length) scoreIdx.push(k);
          return;
        }
        for (var q = 0; q < header.length; q++) {
          if (header[q].toLowerCase() === tok.toLowerCase()) { scoreIdx.push(q); return; }
        }
      });
      if (!scoreIdx.length) throw new Error(T('未找到可用的数值打分列，请检查数据。'));
    } else {
      for (var c = 0; c < header.length; c++) {
        if (c === labIdx) continue;
        var numericCount = 0, total = 0;
        for (var r = 0; r < tb.rows.length && total < 40; r++) {
          var raw = tb.rows[r][c];
          if (raw === '' || raw === undefined || raw === null) continue;
          total++;
          if (isFinite(WB.parse.num(raw))) numericCount++;
        }
        if (total && numericCount / total >= 0.8) scoreIdx.push(c);
      }
      if (!scoreIdx.length) throw new Error(T('未找到可用的数值打分列，请检查数据。'));
    }

    if (labIdx < 0) labIdx = 0;
    scoreIdx = scoreIdx.filter(function (c) { return c !== labIdx; });
    if (!scoreIdx.length) throw new Error(T('未找到可用的数值打分列，请检查数据。'));

    /* 标签取值 */
    var labels = [], rawLabels = [];
    tb.rows.forEach(function (row) {
      var lv = String(row[labIdx] == null ? '' : row[labIdx]).trim();
      if (lv === '') return;
      if (rawLabels.indexOf(lv) < 0) rawLabels.push(lv);
      labels.push(lv);
    });
    if (rawLabels.length !== 2) {
      throw new Error(T('标签列必须包含恰好两类取值，当前为 {n} 类：{list}',
        { n: rawLabels.length, list: rawLabels.slice(0, 6).join(' / ') }));
    }

    /* 阳性类别 */
    var posLabel = String(ctx.values.posLabel == null ? '' : ctx.values.posLabel).trim();
    if (posLabel && rawLabels.indexOf(posLabel) < 0) posLabel = '';
    if (!posLabel) {
      for (var a = 0; a < rawLabels.length; a++) if (POS_PAT.test(rawLabels[a])) { posLabel = rawLabels[a]; break; }
    }
    if (!posLabel) {
      var n0 = WB.parse.num(rawLabels[0]), n1 = WB.parse.num(rawLabels[1]);
      if (isFinite(n0) && isFinite(n1)) posLabel = n1 > n0 ? rawLabels[1] : rawLabels[0];
      else posLabel = rawLabels.slice().sort()[1];
    }
    var negLabel = rawLabels[0] === posLabel ? rawLabels[1] : rawLabels[0];

    /* 方向自动判断：阳性组均值高于阴性组 → high */
    var y = [], X = [], skipped = 0;
    tb.rows.forEach(function (row) {
      var lv = String(row[labIdx] == null ? '' : row[labIdx]).trim();
      if (lv !== posLabel && lv !== negLabel) return;
      var vals = scoreIdx.map(function (c) { return WB.parse.num(row[c]); });
      var anyMissing = vals.some(function (v, k) {
        return !isFinite(v) && String(row[scoreIdx[k]] == null ? '' : row[scoreIdx[k]]).trim() !== '';
      });
      if (anyMissing) { skipped++; return; }
      y.push(lv === posLabel ? 1 : 0);
      X.push(vals);
    });
    if (!y.length) throw new Error(T('数据为空'));

    var direction = ctx.values.direction;
    if (direction !== 'high' && direction !== 'low') {
      var dHi = 0;
      for (var s = 0; s < scoreIdx.length; s++) {
        var mp = [], mn = [];
        for (var t = 0; t < y.length; t++) {
          var v = X[t][s];
          if (!isFinite(v)) continue;
          (y[t] === 1 ? mp : mn).push(v);
        }
        if (WB.stats.mean(mp) >= WB.stats.mean(mn)) dHi++; else dHi--;
      }
      direction = dHi >= 0 ? 'high' : 'low';
    }
    var positiveIsHigh = direction !== 'low';

    var P = y.filter(function (v) { return v === 1; }).length;
    var N = y.length - P;

    res.appendChild(WB.ui.statBar([
      { label: T('样本数'), value: y.length },
      { label: T('阳性例数'), value: P, tone: 'red' },
      { label: T('阴性例数'), value: N, tone: 'green' },
      { label: T('标记物数'), value: scoreIdx.length }
    ]));
    res.appendChild(WB.ui.alertBox('info',
      T('自动识别：标签列 = 「{lab}」，阳性类别 = 「{pos}」，阴性类别 = 「{neg}」，判别方向 = {dir}。可在参数中手动调整。', {
        lab: header[labIdx] || ('#' + (labIdx + 1)),
        pos: posLabel, neg: negLabel,
        dir: T(positiveIsHigh ? '分数越大越可能为阳性' : '分数越小越可能为阳性')
      })));
    res.appendChild(WB.ui.alertBox('info', T('AUC 采用梯形积分计算，等价于 Mann-Whitney U 统计量；AUC = 0.5 表示与随机猜测无异，1.0 表示完全区分。')));
    if (skipped > 0) res.appendChild(WB.ui.alertBox('warn', T('样本在三类取值上缺失，已跳过 {n} 行。', { n: skipped })));
    if (ctx.values.ci) res.appendChild(WB.ui.alertBox('info', T('AUC 的 95% 置信区间由 Hanley-McNeil 近似给出；样本量较小时区间较宽。')));
    res.appendChild(WB.ui.alertBox('info', T('最佳截断点由 Youden 指数（灵敏度 + 特异度 − 1）最大化确定，仅用于参考；实际阈值应结合临床或实验成本权衡。')));
    if (scoreIdx.length > 1) {
      res.appendChild(WB.ui.alertBox('warn', T('在多标记物比较中，直接比较 AUC 存在抽样误差，必要时应做 DeLong 检验等正式统计比较。')));
    }

    /* 逐标记物计算 */
    var results = [];
    scoreIdx.forEach(function (colIdx, si) {
      var scores = X.map(function (row) { return row[si]; });
      var good = [], gy = [];
      for (var i = 0; i < scores.length; i++) {
        if (isFinite(scores[i])) { good.push(scores[i]); gy.push(y[i]); }
      }
      var r = rocCurve(good, gy, positiveIsHigh);
      if (!r) return;
      r.name = header[colIdx] || ('#' + (colIdx + 1));
      r.se = (P > 0 && N > 0) ? aucSE(r.auc, P, N) : NaN;
      results.push(r);
    });
    if (!results.length) throw new Error(T('未找到可用的数值打分列，请检查数据。'));

    results.sort(function (a, b) { return b.auc - a.auc; });
    results.forEach(function (r) { r.grade = gradeOf(r.auc); });

    /* ROC 曲线图 */
    var card = WB.ui.resultCard(T('ROC 曲线'));
    res.appendChild(card);
    var body = card.querySelector('.card-body');
    var holder = el('div.plot-holder');
    body.appendChild(holder);
    var svg = drawROC(holder, results);
    if (svg) {
      WB.plot.addToolbar(body, { getSvg: function () { return svg; }, basename: 'roc_curves' });
      body.appendChild(el('div.preview-note', { text: T('曲线：横轴为 1 − 特异度（假阳性率），纵轴为灵敏度（真阳性率）；对角线为随机猜测参考线，曲线越靠近左上角判别能力越强。') }));
    }

    /* AUC 汇总表 */
    var sCard = WB.ui.resultCard(T('AUC 汇总'));
    res.appendChild(sCard);
    var sBody = sCard.querySelector('.card-body');
    var sRows = results.map(function (r) {
      var ciTxt = '—';
      if (isFinite(r.se)) {
        ciTxt = WB.formatNum(Math.max(0, r.auc - 1.96 * r.se), 3) + ' – ' +
          WB.formatNum(Math.min(1, r.auc + 1.96 * r.se), 3);
      }
      return {
        name: r.name,
        auc: r.auc,
        ci: ciTxt,
        cutoff: r.opt.thr,
        sens: r.opt.sens,
        spec: r.opt.spec,
        youden: r.opt.youden,
        acc: r.opt.acc,
        ppv: r.opt.ppv,
        npv: r.opt.npv,
        grade: r.grade
      };
    });
    WB.ui.dataTable(sBody, [
      { key: 'name', label: T('标记物 / 模型') },
      { key: 'auc', label: 'AUC', align: 'right', width: 84, format: function (r) { return WB.formatNum(r.auc, 3); } },
      { key: 'ci', label: T('95% 置信区间'), align: 'right', width: 132 },
      { key: 'cutoff', label: T('截断值'), align: 'right', width: 96, format: function (r) { return WB.formatNum(r.cutoff, 3); } },
      { key: 'sens', label: T('灵敏度'), align: 'right', width: 88, format: function (r) { return WB.formatNum(r.sens, 3); } },
      { key: 'spec', label: T('特异度'), align: 'right', width: 88, format: function (r) { return WB.formatNum(r.spec, 3); } },
      { key: 'youden', label: T('Youden 指数'), align: 'right', width: 104, format: function (r) { return WB.formatNum(r.youden, 3); } },
      { key: 'acc', label: T('准确率'), align: 'right', width: 88, format: function (r) { return WB.formatNum(r.acc, 3); } },
      { key: 'grade', label: T('判别能力（AUC）'), width: 168 }
    ], sRows, { exportName: 'roc_auc' });

    /* 最佳标记物的详细指标 */
    var best = results[0];
    var dCard = WB.ui.resultCard(T('最佳截断点指标（{m}）', { m: best.name }));
    res.appendChild(dCard);
    var dBody = dCard.querySelector('.card-body');
    dBody.appendChild(WB.ui.statBar([
      { label: 'AUC', value: WB.formatNum(best.auc, 3), tone: 'red' },
      { label: T('灵敏度'), value: WB.formatNum(best.opt.sens, 3) },
      { label: T('特异度'), value: WB.formatNum(best.opt.spec, 3) },
      { label: T('准确率'), value: WB.formatNum(best.opt.acc, 3) },
      { label: T('阳性预测值'), value: WB.formatNum(best.opt.ppv, 3) },
      { label: T('阴性预测值'), value: WB.formatNum(best.opt.npv, 3) },
      { label: T('F1 分数'), value: WB.formatNum(best.opt.f1, 3) }
    ]));
    dBody.appendChild(el('div.preview-note', {
      text: T('灵敏度 = TP / (TP + FN)，特异度 = TN / (TN + FP)，阳性预测值 = TP / (TP + FP)，阴性预测值 = TN / (TN + FN)。')
    }));

    /* 混淆矩阵 */
    var cCard = WB.ui.resultCard(T('混淆矩阵（{m}，截断 = {c}）', { m: best.name, c: WB.formatNum(best.opt.thr, 3) }));
    res.appendChild(cCard);
    var cBody = cCard.querySelector('.card-body');
    var o = best.opt;
    WB.ui.dataTable(cBody, [
      { key: 'actual', label: T('实际 \\ 预测') },
      { key: 'pos', label: posLabel, align: 'right', width: 110 },
      { key: 'neg', label: negLabel, align: 'right', width: 110 },
      { key: 'total', label: T('合计'), align: 'right', width: 96 }
    ], [
      { actual: posLabel, pos: o.tp, neg: o.fn, total: P },
      { actual: negLabel, pos: o.fp, neg: o.tn, total: N }
    ], { exportName: 'roc_confusion' });

    /* 阈值明细 */
    var tCard = WB.ui.resultCard(T('阈值明细（{m}，按 Youden 指数排序）', { m: best.name }));
    res.appendChild(tCard);
    var tBody = tCard.querySelector('.card-body');
    var pts = best.roc.slice(1).map(function (p) {
      var j = p.tpr - p.fpr;
      return { thr: p.thr, sens: p.tpr, spec: 1 - p.fpr, youden: j };
    }).sort(function (a, b) { return b.youden - a.youden; }).slice(0, 15);
    WB.ui.dataTable(tBody, [
      { key: 'rank', label: '#', align: 'right', width: 52 },
      { key: 'thr', label: T('阈值'), align: 'right', width: 110, format: function (r) { return WB.formatNum(r.thr, 3); } },
      { key: 'sens', label: T('灵敏度'), align: 'right', width: 100, format: function (r) { return WB.formatNum(r.sens, 3); } },
      { key: 'spec', label: T('特异度'), align: 'right', width: 100, format: function (r) { return WB.formatNum(r.spec, 3); } },
      { key: 'youden', label: T('约登指数'), align: 'right', width: 100, format: function (r) { return WB.formatNum(r.youden, 3); } }
    ], pts.map(function (p, i) { p.rank = i + 1; return p; }), { exportName: 'roc_thresholds' });
  }

  /* --------------------------- ROC 计算内核 ------------------------------ */

  function rocCurve(scores, labels, positiveIsHigh) {
    var pts = [];
    for (var i = 0; i < scores.length; i++) {
      if (isFinite(scores[i])) pts.push({ s: scores[i], y: labels[i] });
    }
    var P = 0, N = 0;
    pts.forEach(function (p) { if (p.y === 1) P++; else N++; });
    if (!P || !N) return null;

    /* 累积顺序：必须从「最可能为阳性」的一端开始。
       判别方向为 high 时，高分端最可能为阳性 → 按分数降序累积；
       判别方向为 low 时，低分端最可能为阳性 → 按分数升序累积。 */
    pts.sort(function (a, b) { return positiveIsHigh ? b.s - a.s : a.s - b.s; });

    // 从「最可能为阳性」的一端开始累积，得到 tpr / fpr 随阈值的变化
    var roc = [{ thr: positiveIsHigh ? Infinity : -Infinity, tpr: 0, fpr: 0 }];
    var tp = 0, fp = 0, i2 = 0;
    while (i2 < pts.length) {
      var j = i2;
      while (j + 1 < pts.length && pts[j + 1].s === pts[i2].s) j++;
      for (var k = i2; k <= j; k++) { if (pts[k].y === 1) tp++; else fp++; }
      roc.push({ thr: pts[i2].s, tpr: tp / P, fpr: fp / N });
      i2 = j + 1;
    }

    var auc = 0;
    for (var m = 1; m < roc.length; m++) {
      auc += (roc[m].fpr - roc[m - 1].fpr) * (roc[m].tpr + roc[m - 1].tpr) / 2;
    }

    // Youden 指数最大处即最佳截断
    var best = null;
    for (var n = 1; n < roc.length; n++) {
      var jIdx = roc[n].tpr - roc[n].fpr;
      if (!best || jIdx > best.youdenRaw) {
        best = { youdenRaw: jIdx, idx: n };
      }
    }
    var thr = roc[best.idx].thr;
    var cm = confusionAt(scores, labels, thr, positiveIsHigh);
    var sens = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : NaN;
    var spec = cm.tn + cm.fp > 0 ? cm.tn / (cm.tn + cm.fp) : NaN;
    var ppv = (cm.tp + cm.fp) > 0 ? cm.tp / (cm.tp + cm.fp) : NaN;
    var npv = (cm.tn + cm.fn) > 0 ? cm.tn / (cm.tn + cm.fn) : NaN;
    var acc = (cm.tp + cm.tn) / (cm.tp + cm.tn + cm.fp + cm.fn);
    var f1 = (2 * cm.tp) / (2 * cm.tp + cm.fp + cm.fn);

    return {
      roc: roc, auc: auc,
      opt: {
        thr: thr, tp: cm.tp, fp: cm.fp, fn: cm.fn, tn: cm.tn,
        sens: sens, spec: spec, ppv: ppv, npv: npv, acc: acc, f1: f1,
        youden: sens + spec - 1
      }
    };
  }

  function confusionAt(scores, labels, thr, positiveIsHigh) {
    var tp = 0, fp = 0, fn = 0, tn = 0;
    for (var i = 0; i < scores.length; i++) {
      if (!isFinite(scores[i])) continue;
      var pred = positiveIsHigh ? (scores[i] >= thr ? 1 : 0) : (scores[i] <= thr ? 1 : 0);
      if (labels[i] === 1) { if (pred) tp++; else fn++; }
      else { if (pred) fp++; else tn++; }
    }
    return { tp: tp, fp: fp, fn: fn, tn: tn };
  }

  /** Hanley-McNeil 近似：AUC 的标准误 */
  function aucSE(auc, n1, n2) {
    if (!(n1 > 0 && n2 > 0)) return NaN;
    var q1 = auc / (2 - auc);
    var q2 = 2 * auc * auc / (1 + auc);
    var v = (auc * (1 - auc) + (n1 - 1) * (q1 - auc * auc) + (n2 - 1) * (q2 - auc * auc)) / (n1 * n2);
    return v > 0 ? Math.sqrt(v) : NaN;
  }

  function gradeOf(auc) {
    if (!isFinite(auc)) return T('无法确定');
    if (auc >= 0.90) return T('优秀（AUC ≥ 0.90）');
    if (auc >= 0.80) return T('良好（0.80 ≤ AUC < 0.90）');
    if (auc >= 0.70) return T('可接受（0.70 ≤ AUC < 0.80）');
    if (auc >= 0.60) return T('较差（0.60 ≤ AUC < 0.70）');
    return T('接近随机（AUC < 0.60）');
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  function drawROC(container, results) {
    if (!results.length) { WB.plot.emptyState(container, T('common.noData')); return null; }

    var plot = 430, m = { l: 68, r: 28, t: 26, b: 64 };
    var W = m.l + plot + m.r, H = m.t + plot + m.b;
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var sx = WB.plot.linearScale(0, 1, m.l, m.l + plot);
    var sy = WB.plot.linearScale(0, 1, m.t + plot, m.t);

    /* 网格 */
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (t) {
      root.appendChild(S('line', { x1: sx(t), y1: m.t, x2: sx(t), y2: m.t + plot, stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(sx(t), m.t + plot + 17, t.toFixed(1),
        { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
      root.appendChild(S('line', { x1: m.l, y1: sy(t), x2: m.l + plot, y2: sy(t), stroke: WB.plot.GRID }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, t.toFixed(1),
        { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    /* 随机猜测参考线 */
    root.appendChild(S('line', {
      x1: sx(0), y1: sy(0), x2: sx(1), y2: sy(1),
      stroke: '#b6c2cc', 'stroke-dasharray': '6 4'
    }));

    /* 各标记物的曲线 */
    results.forEach(function (r, ri) {
      var col = WB.plot.palette(ri);
      var d = 'M' + sx(0).toFixed(1) + ',' + sy(0).toFixed(1);
      r.roc.forEach(function (p) {
        d += 'L' + sx(p.fpr).toFixed(1) + ',' + sy(p.tpr).toFixed(1);
      });
      root.appendChild(S('path', { d: d, fill: 'none', stroke: col, 'stroke-width': 2 }));

      /* 最佳截断点标记 */
      var bx = sx(r.opt.spec === 0 && r.opt.sens === 0 ? 0 : 1 - r.opt.spec);
      var by = sy(r.opt.sens);
      root.appendChild(S('circle', {
        cx: bx, cy: by, r: 3.4, fill: '#ffffff', stroke: col, 'stroke-width': 2
      }));
    });

    /* 坐标框与标题 */
    root.appendChild(S('rect', {
      x: m.l, y: m.t, width: plot, height: plot, fill: 'none', stroke: WB.plot.AXIS
    }));
    root.appendChild(WB.plot.txt(m.l + plot / 2, H - 18, '1 − ' + T('特异度'),
      { 'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT }));
    var yl = WB.plot.txt(0, 0, T('灵敏度'),
      { 'text-anchor': 'middle', 'font-size': 12.5, fill: WB.plot.TEXT, transform: 'rotate(-90)' });
    yl.setAttribute('x', -(m.t + plot / 2));
    yl.setAttribute('y', 16);
    root.appendChild(yl);

    /* 悬停：给出最近曲线点的阈值指标 */
    var hover = S('rect', { x: m.l, y: m.t, width: plot, height: plot, fill: 'transparent' });
    root.appendChild(hover);
    hover.addEventListener('mousemove', function (e) {
      var rect = canvas.svg.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      var my = (e.clientY - rect.top) * (H / rect.height);
      var bestR = null, bd = Infinity;
      results.forEach(function (r) {
        r.roc.forEach(function (p) {
          var dx = sx(p.fpr) - mx, dy = sy(p.tpr) - my;
          var d2 = dx * dx + dy * dy;
          if (d2 < bd) { bd = d2; bestR = { r: r, p: p }; }
        });
      });
      if (!bestR || bd > 400) { WB.plot.tipHide(); return; }
      WB.plot.tipShow('<b>' + WB.esc(bestR.r.name) + '</b><br>' +
        T('灵敏度') + ' = ' + WB.formatNum(bestR.p.tpr, 3) + '<br>' +
        T('特异度') + ' = ' + WB.formatNum(1 - bestR.p.fpr, 3) + '<br>' +
        T('阈值') + ' = ' + WB.formatNum(bestR.p.thr, 3) + '<br>' +
        'AUC = ' + WB.formatNum(bestR.r.auc, 3), e);
    });
    hover.addEventListener('mouseleave', function () { WB.plot.tipHide(); });

    WB.plot.legendCategorical(container, results.map(function (r, i) {
      return { color: WB.plot.palette(i), label: r.name + ' (AUC = ' + WB.formatNum(r.auc, 3) + ')' };
    }));
    return canvas.svg;
  }
})(window);
