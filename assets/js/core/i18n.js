/* =============================================================================
 * core/i18n.js  —  全局中英文语言层（界面 + 图表）
 *
 * 目的：整个页面（导航、标题、按钮、参数、说明、结果卡片）与图形内文字，
 *       都能在中文 / 英文之间直接切换。
 *
 *   图表文案：用「键」查表      WB.t('venn.members')
 *   界面文案：直接用中文原文    WB.t('开始分析')          （英文模式下查界面词典）
 *   插值：                     WB.t('共 {n} 行', {n: 12})
 *   二元选择：                 WB.pick('中文', 'English')
 *   切换：WB.i18n.setLang('en')  → 派发 window 'wb:lang' 事件，main.js 重绘当前页
 *
 * 各模块用 WB.i18n.regUI({ '中文原文': 'English text', ... }) 注册自己的界面词典。
 * 来自用户数据的文字（基因名、样本名、分组名、通路名）始终不翻译。
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};

  var DICT = {
    /* ============================= 中文 ============================= */
    zh: {
      /* --- 通用 --- */
      'common.gene': '基因',
      'common.genes': '个基因',
      'common.geneUnit': '{n} 个基因',
      'common.count': '数量',
      'common.size': '大小',
      'common.members': '成员数',
      'common.setSize': '集合大小',
      'common.intersection': '交集',
      'common.intersectionSize': '交集大小',
      'common.noOverlap': '无交集',
      'common.andMore': '… 等 {n} 个',
      'common.elements': '个元素',
      'common.explainedVar': '解释方差',
      'common.cumExplained': '累计解释方差',
      'common.sample': '样本',
      'common.group': '分组',
      'common.value': '数值',
      'common.positive': '正相关',
      'common.negative': '负相关',
      'common.weakPositive': '弱正相关',
      'common.weakNegative': '弱负相关',
      'common.moderatePositive': '中等正相关',
      'common.moderateNegative': '中等负相关',
      'common.strongPositive': '强正相关',
      'common.strongNegative': '强负相关',
      'common.veryStrongPositive': '极强正相关',
      'common.veryStrongNegative': '极强负相关',
      'common.up': '上调',
      'common.down': '下调',
      'common.ns': '不显著',
      'common.noData': '没有可绘制的数据',
      'common.negLogFdr': '−log₁₀ FDR',
      'enr.tipStats': 'P = {p}　FDR = {q}',
      'enr.tipOverlap': '交集 {k} / 基因集 {K}（预期 {e}）',
      'enr.tipFold': '富集倍数 {f}　Rich factor {r}',
      'enr.compareNote': '灰点表示该通路在该基因列表中未进入前 {n} 名；半透明点表示 FDR > {p}。',

      /* --- 韦恩图 --- */
      'venn.memberCount': '成员数',
      'venn.setCount': '个数',
      'venn.pctOfAllSets': '占比',
      'venn.singleSet': '集合大小',
      'venn.overlapOf': '交集',
      'venn.pairNote': '对角线为集合大小，其余为两两交集元素数；颜色越深表示重合比例越高。',
      'venn.tooMany': '集合数 > 4，已跳过绘图。请使用 UpSet 图模块。',
      'venn.vennTitle': '韦恩图',

      /* --- UpSet --- */
      'upset.setSizeTip': '集合大小',
      'upset.elements': '个元素',
      'upset.interSizeTip': '交集大小',
      'upset.involvesSets': '涉及 {n} 个集合',
      'upset.clickForAll': '点击查看全部',

      /* --- 富集分析 --- */
      'enr.metricFold': '富集倍数 (Fold enrichment)',
      'enr.metricRatio': '基因比例 (Gene Ratio, k/n)',
      'enr.metricRich': 'Rich factor (k/K)',
      'enr.overlapGenes': '交集基因数',
      'enr.negLogFdrCapped': '−log₁₀ FDR（上限按 50 截断）',
      'enr.fdrThreshold': 'FDR = {v}',
      'enr.overlap': '交集',
      'enr.set': '基因集',
      'enr.expected': '预期',
      'enr.fold': '富集倍数',
      'enr.pointSizeLegend': '点尺寸 = 交集基因数',
      'enr.dotNote': '纵轴为富集通路（按 P 值排序，越靠上越显著），点的大小 = 交集基因数，颜色 = −log₁₀ FDR。',
      'enr.emptyPlot': '没有可展示的富集结果',

      /* --- PCA --- */
      'pca.component': '主成分',
      'pca.screeNote': '柱 = 各 PC 解释方差　黄线 = 累计解释方差',
      'pca.cumToPc': '累计解释方差至 PC{n}：',
      'pca.pcAxis': 'PC{n} ({v}%)',

      /* --- 相关性 --- */
      'corr.coef': '{m} 相关系数',
      'corr.netNote': '节点尺寸 = 连接数（度），连线粗细 = |r|，颜色表示相关方向（红 = 正相关，蓝 = 负相关）。',
      'corr.noThreshold': '没有达到阈值的变量对，可调低「网络连线阈值」。',
      'corr.rValue': 'r = {v}',
      'corr.pn': 'P = {p}　n = {n}',
      'corr.nValue': 'n = {v}',

      /* --- 火山图 --- */
      'volcano.threshold': '{v} 阈值',
      'volcano.xAxis': 'log₂ 差异倍数',
      'volcano.yAxis': '−log₁₀ P',
      'volcano.up': '显著上调',
      'volcano.down': '显著下调',
      'volcano.ns': '不显著',
      'volcano.type': '类型',

      /* --- 热图 --- */
      'heat.zscore': 'Z-score',
      'heat.value': '数值',
      'heat.normValue': '标准化值',
      'heat.rawValue': '原始值',
      'heat.ungrouped': '未分组'
    },

    /* ============================= English ============================ */
    en: {
      /* --- common --- */
      'common.gene': 'Gene',
      'common.genes': 'genes',
      'common.geneUnit': '{n} genes',
      'common.count': 'Count',
      'common.size': 'Size',
      'common.members': 'Members',
      'common.setSize': 'Set size',
      'common.intersection': 'Intersection',
      'common.intersectionSize': 'Intersection size',
      'common.noOverlap': 'No overlap',
      'common.andMore': '… and {n} more',
      'common.elements': 'elements',
      'common.pctOfTotal': '% of total',
      'common.explainedVar': 'Explained variance',
      'common.cumExplained': 'Cumulative variance',
      'common.sample': 'Sample',
      'common.group': 'Group',
      'common.value': 'Value',
      'common.positive': 'Positive',
      'common.negative': 'Negative',
      'common.weakPositive': 'Weak positive',
      'common.weakNegative': 'Weak negative',
      'common.moderatePositive': 'Moderate positive',
      'common.moderateNegative': 'Moderate negative',
      'common.strongPositive': 'Strong positive',
      'common.strongNegative': 'Strong negative',
      'common.veryStrongPositive': 'Very strong positive',
      'common.veryStrongNegative': 'Very strong negative',
      'common.up': 'Up',
      'common.down': 'Down',
      'common.ns': 'Not significant',
      'common.noData': 'No data to plot',
      'common.negLogFdr': '−log₁₀ FDR',
      'enr.tipStats': 'P = {p} · FDR = {q}',
      'enr.tipOverlap': 'Overlap {k} / set size {K} (expected {e})',
      'enr.tipFold': 'Fold enrichment {f} · Rich factor {r}',
      'enr.compareNote': 'Grey dots: the term is not in the top {n} of that list. Translucent dots: FDR > {p}.',

      /* --- Venn --- */
      'venn.memberCount': 'Members',
      'venn.setCount': 'Count',
      'venn.pctOfAllSets': '% of all elements',
      'venn.singleSet': 'Set size',
      'venn.overlapOf': 'Intersection',
      'venn.pairNote': 'Diagonal = set size; off-diagonal = pairwise intersection size. Darker colour means higher overlap.',
      'venn.tooMany': 'More than 4 sets — plotting skipped. Please use the UpSet module.',
      'venn.vennTitle': 'Venn diagram',

      /* --- UpSet --- */
      'upset.setSizeTip': 'Set size',
      'upset.elements': ' elements',
      'upset.interSizeTip': 'Intersection size',
      'upset.involvesSets': 'in {n} sets',
      'upset.clickForAll': 'Click to view all',

      /* --- Enrichment --- */
      'enr.metricFold': 'Fold enrichment',
      'enr.metricRatio': 'Gene ratio (k/n)',
      'enr.metricRich': 'Rich factor (k/K)',
      'enr.overlapGenes': 'Overlapping genes',
      'enr.negLogFdrCapped': '−log₁₀ FDR (capped at 50)',
      'enr.fdrThreshold': 'FDR = {v}',
      'enr.overlap': 'Overlap',
      'enr.set': 'Set size',
      'enr.expected': 'expected',
      'enr.fold': 'Fold enrichment',
      'enr.pointSizeLegend': 'Dot size = overlapping genes',
      'enr.dotNote': 'Terms are ordered by P value (most significant on top). Dot size = number of overlapping genes; colour = −log₁₀ FDR.',
      'enr.emptyPlot': 'No enrichment result to display',

      /* --- PCA --- */
      'pca.component': 'Principal component',
      'pca.screeNote': 'Bars = variance explained by each PC; line = cumulative variance',
      'pca.cumToPc': 'Cumulative variance up to PC{n}: ',
      'pca.pcAxis': 'PC{n} ({v}%)',

      /* --- Correlation --- */
      'corr.coef': '{m} correlation',
      'corr.netNote': 'Node size = degree; edge width = |r|; colour indicates direction (red = positive, blue = negative).',
      'corr.noThreshold': 'No variable pair reached the threshold — try lowering the network cutoff.',
      'corr.rValue': 'r = {v}',
      'corr.pn': 'P = {p} · n = {n}',
      'corr.nValue': 'n = {v}',

      /* --- Volcano --- */
      'volcano.threshold': 'cutoff {v}',
      'volcano.xAxis': 'log₂ fold change',
      'volcano.yAxis': '−log₁₀ P',
      'volcano.up': 'Up-regulated',
      'volcano.down': 'Down-regulated',
      'volcano.ns': 'Not significant',
      'volcano.type': 'Category',

      /* --- Heatmap --- */
      'heat.zscore': 'Z-score',
      'heat.value': 'Value',
      'heat.normValue': 'Standardised value',
      'heat.rawValue': 'Raw value',
      'heat.ungrouped': 'Ungrouped'
    }
  };

  /* ============ 全局界面词典（中文原文 → 英文译文，由各模块注册） ============ */
  var UI_EN = {};

  /** 各模块调用：WB.i18n.regUI({ '中文原文': 'English', ... }) */
  function regUI(map) {
    if (!map) return;
    Object.keys(map).forEach(function (k) {
      var v = map[k];
      /* 防御：多行词条误写成数组字面量（['...' + '...']）时按拼接字符串处理，
         避免英文模式下 T() 返回数组、interpolate 对其调 split 抛错导致整个组件失效 */
      UI_EN[k] = Array.isArray(v) ? v.join('') : v;
    });
  }

  var LANG_KEY = 'wb_chart_lang';
  var lang = 'zh';
  try {
    var saved = global.localStorage && global.localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'zh') lang = saved;
  } catch (e) { /* 隐私模式等场景忽略 */ }

  function interpolate(s, vars) {
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  /**
   * 取当前语言下的文案。三路查找：
   *   1) 图表键（如 'venn.set'）
   *   2) 界面中文原文（如 '开始分析'）——英文模式下查界面词典
   *   3) 兜底：返回传入的字符串本身
   */
  function t(key, vars) {
    var v;
    if (lang === 'en') {
      v = DICT.en[key];
      if (v === undefined) v = UI_EN[key];
      if (v === undefined) v = DICT.zh[key];
    } else {
      v = DICT.zh[key];   // 中文模式：界面文案的中文原文即 key 本身
    }
    if (v === undefined) v = key;
    return interpolate(v, vars);
  }

  /** 二元选择：中文取 zh、英文取 en，未提供英文时退回中文 */
  function pick(zh, en) {
    if (lang === 'en') return en === undefined || en === null ? zh : en;
    return zh;
  }

  function getLang() { return lang; }

  function setLang(next) {
    if (next !== 'zh' && next !== 'en') return;
    if (next === lang) return;
    lang = next;
    try { if (global.localStorage) global.localStorage.setItem(LANG_KEY, lang); } catch (e) { }
    try {
      global.dispatchEvent(new CustomEvent('wb:lang', { detail: { lang: lang } }));
    } catch (e) { /* 老浏览器忽略 */ }
  }

  /** 标签与数值之间的分隔符（中文全角冒号 / 英文半角冒号） */
  function sep() { return lang === 'en' ? ': ' : '：'; }
  /** 「标签：数值」的常用拼装 */
  function label(key, val) { return t(key) + sep() + val; }
  /** 数字 + 单位：「12 个基因」/「12 genes」 */
  function unitN(n, unitKey) { return String(n) + ' ' + t(unitKey); }

  WB.t = t;
  WB.pick = pick;
  WB.sep = sep;
  WB.lab = label;
  WB.unitN = unitN;
  WB.i18n = {
    t: t, pick: pick, sep: sep, label: label, unitN: unitN,
    regUI: regUI, uiText: t, uiMap: UI_EN,
    setLang: setLang, getLang: getLang, dict: DICT, LANGS: ['zh', 'en']
  };
})(window);
