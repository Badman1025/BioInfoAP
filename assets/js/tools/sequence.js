/* =============================================================================
 * tools/sequence.js  —  序列与蛋白工具（核酸 / 蛋白序列分析）
 *   核酸：反向互补、GC 含量、碱基组成、六框翻译、ORF 查找、密码子使用、Tm 估算
 *   蛋白：分子量、等电点 pI、GRAVY、芳香性、氨基酸组成、疏水性滑动窗口
 * 全部为纯字符串 / 数值运算，零外部依赖。
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB, el = WB.el, S = WB.plot.s;
  var T = WB.t;   // 统一语言层（界面 + 图表）

  /* ------------------------- 界面文案（中 → 英） -------------------------- */
  WB.i18n.regUI({
    /* 模块本身 */
    '序列与蛋白工具 / Sequence toolkit': 'Sequence toolkit',
    '序列与蛋白工具': 'Sequence toolkit',
    '核酸与蛋白序列分析：反向互补、GC 含量、碱基组成、六框翻译、ORF 查找、密码子使用、Tm；蛋白分子量与等电点。':
      'Nucleic-acid and protein sequence analysis: reverse complement, GC content, base composition, six-frame translation, ORF finding, codon usage and Tm; protein molecular weight and isoelectric point.',
    '序列': 'Sequence',
    '翻译': 'Translation',
    'ORF': 'ORF',
    '蛋白理化': 'Protein properties',
    '输入 FASTA 或纯序列文本，自动识别核酸 / 蛋白，并给出组成、反向互补、翻译与理化性质。':
      'Enter FASTA or plain sequence text; nucleic acid / protein is auto-detected and the composition, reverse complement, translation and physicochemical properties are reported.',

    /* 输入区（由核心层自动翻译，此处仅登记） */
    '输入核酸或蛋白序列': 'Input nucleic-acid or protein sequences',
    '分析序列': 'Analyse sequences',
    'FASTA 序列': 'FASTA sequences',
    '纯序列文本（多行自动拼接）': 'Plain sequence text (lines joined)',
    ['<b>FASTA 格式：以 <code>&gt;</code> 开头的标题行 + 序列行</b>，可包含多条记录：<br>' +
      '<code>&gt;seq1 描述</code><br><code>ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG</code><br><br>' +
      '也接受不含标题行的纯序列；多条序列之间用空行分隔。大小写不限，换行与空白会被自动忽略。']:
      '<b>FASTA format: a header line starting with <code>&gt;</code> followed by sequence lines</b>; multiple records are allowed:<br>' +
      '<code>&gt;seq1 description</code><br><code>ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG</code><br><br>' +
      'Plain sequences without a header line are also accepted; separate multiple sequences with a blank line. Case is ignored and line breaks / whitespace are removed automatically.',
    '纯序列文本': 'Plain sequence text',
    '不含标题行时，每个空行分隔的文本块视为一条序列。只含 A/C/G/T/U/N 的判为核酸，否则判为蛋白。':
      'Without a header line, each blank-line-separated block is treated as one sequence. Sequences containing only A/C/G/T/U/N are treated as nucleic acids, otherwise as proteins.',
    '>seq1 示例序列': '>seq1 example sequence',
    '支持 FASTA / 纯文本（.fasta / .fa / .txt / .seq），可直接粘贴到下方文本框':
      'Supports FASTA / plain text (.fasta / .fa / .txt / .seq); you can also paste directly into the box below',

    /* 参数 */
    'ORF 最短长度（氨基酸）': 'Minimum ORF length (amino acids)',
    '用于筛选 ORF 的最短长度（氨基酸，不含终止密码子）': 'Minimum ORF length used for filtering (amino acids, excluding the stop codon)',
    '翻译方向': 'Translation frames',
    '六框翻译（正向 + 反向互补）': 'All six frames (forward + reverse complement)',
    '正向三框': 'Forward three frames',
    '反向互补后三框': 'Reverse-complement three frames',
    '密码子表': 'Codon table',
    '标准遗传密码（细菌/真核通用）': 'Standard genetic code (bacteria / eukaryotes)',
    '脊椎动物线粒体': 'Vertebrate mitochondrial',
    '显示碱基 / 氨基酸组成图': 'Show base / amino-acid composition chart',
    '密码子使用表行数': 'Codon-usage table rows',

    /* 结果标题与分区 */
    '核酸序列分析': 'Nucleic-acid analysis',
    '蛋白序列分析': 'Protein analysis',
    '序列 {id}': 'Sequence {id}',
    '长度 (nt)': 'Length (nt)',
    '长度 (aa)': 'Length (aa)',
    'GC 含量': 'GC content',
    '类型': 'Type',
    '碱基组成': 'Base composition',
    '碱基': 'Base',
    '氨基酸组成': 'Amino-acid composition',
    '反向互补序列': 'Reverse complement',
    '六框翻译': 'Six-frame translation',
    'ORF 查找结果': 'ORF finding results',
    '密码子使用': 'Codon usage',
    'Tm 估算': 'Tm estimate',
    '分子量 (Da)': 'Molecular weight (Da)',
    '等电点 pI': 'Isoelectric point (pI)',
    'GRAVY（平均疏水性）': 'GRAVY (mean hydropathy)',
    '芳香性': 'Aromaticity',
    '疏水性滑动窗口': 'Hydropathy sliding window',
    '疏水性（Kyte–Doolittle）': 'Hydropathy (Kyte–Doolittle)',
    '残基位置': 'Residue position',
    '位置': 'Position',

    /* statBar 标签 */
    '记录数': 'Records',
    '总长度': 'Total length',
    '平均 GC 含量': 'Mean GC content',
    '平均长度': 'Mean length',
    '平均分子量': 'Mean molecular weight',
    '平均 pI': 'Mean pI',

    /* 表格列 */
    '序号': 'No.',
    '方向': 'Strand',
    '框': 'Frame',
    '起始位置': 'Start',
    '终止位置': 'End',
    '长度 (nt / aa)': 'Length (nt / aa)',
    '起始密码子': 'Start codon',
    '终止密码子': 'Stop codon',
    '氨基酸序列': 'Amino-acid sequence',
    '密码子': 'Codon',
    '氨基酸': 'Amino acid',
    '计数': 'Count',
    '频率（每千密码子）': 'Frequency (per 1,000 codons)',
    '单字母': 'Code',
    '百分比': 'Percentage',
    '数量': 'Count',
    '占比': 'Percentage',
    '其他': 'Other',
    '复制': 'Copy',

    /* 说明与提示 */
    '请先输入序列': 'Please enter a sequence first',
    '未解析到有效序列': 'No valid sequence parsed',
    '已识别 {n} 条核酸序列、{m} 条蛋白序列。': 'Detected {n} nucleic-acid sequence(s) and {m} protein sequence(s).',
    'GC 含量 = (G + C) / 序列全长 × 100%。': 'GC content = (G + C) / full length × 100%.',
    '密码子表：<b>{t}</b>；翻译方向：<b>{m}</b>；ORF 最短长度 {n} aa。':
      'Codon table: <b>{t}</b>; frames: <b>{m}</b>; minimum ORF length {n} aa.',
    '包含 {n} 个非 A/C/G/T/U 字符（如 N），已按未识别字符处理。':
      '{n} non-A/C/G/T/U characters (e.g. N) were treated as unrecognised.',
    'Tm 为粗估值（≤ 14 nt 用 Wallace 规则，> 14 nt 用 GC 近似公式）；精确定量请使用最近邻热力学模型并考虑盐浓度与 Mg²⁺。':
      'Tm is a rough estimate (Wallace rule for ≤ 14 nt; GC-based approximation for > 14 nt). For accurate values use a nearest-neighbour thermodynamic model with salt and Mg²⁺ corrections.',
    '密码子使用统计基于正向三框的全部密码子。': 'Codon usage is counted over all codons in the three forward frames.',
    'ORF 筛选长度 ≥ {n} 氨基酸（不含终止密码子）。': 'ORFs are filtered to ≥ {n} amino acids (excluding the stop codon).',
    '未找到满足条件的 ORF，可调低「ORF 最短长度」。': 'No ORF met the criteria — try lowering the minimum ORF length.',
    '蛋白分子量 = 各残基平均质量之和 + 18.0153 Da（一个水分子）。':
      'Protein molecular weight = sum of average residue masses + 18.0153 Da (one water molecule).',
    '等电点按给定 pKa 表对 pH 0–14 二分搜索净电荷零点（精度 0.01）。':
      'pI is located by bisecting the net charge over pH 0–14 using the given pKa set (precision 0.01).',
    '序列含 {n} 个非标准残基，已从分子量、GRAVY 与组成统计中忽略。':
      '{n} non-standard residues were ignored in molecular weight, GRAVY and composition.',
    '滑动窗口：窗口 {w} 个残基，纵轴为 Kyte–Doolittle 疏水性均值（正值偏疏水）。':
      'Sliding window: {w} residues; the y-axis is the mean Kyte–Doolittle hydropathy (positive = hydrophobic).'
  });

  /* ------------------------------ 常量表 --------------------------------- */

  /* 平均氨基酸残基质量（Da） */
  var MASS = {
    A: 71.0788, R: 156.1875, N: 114.1038, D: 115.0886, C: 103.1388,
    E: 129.1155, Q: 128.1307, G: 57.0519, H: 137.1411, I: 113.1594,
    L: 113.1594, K: 128.1741, M: 131.1926, F: 147.1766, P: 97.1167,
    S: 87.0782, T: 101.1051, W: 186.2132, Y: 163.1760, V: 99.1326
  };
  var WATER = 18.0153;

  /* Kyte–Doolittle 疏水性标度（正值 = 疏水） */
  var KD = {
    A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4,
    H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8,
    T: -0.7, W: -0.9, Y: -1.3, V: 4.2
  };

  /* 20 种标准氨基酸，固定顺序 */
  var ORDER = ['A', 'R', 'N', 'D', 'C', 'Q', 'E', 'G', 'H', 'I',
    'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'];
  var AA3 = {
    A: 'Ala', R: 'Arg', N: 'Asn', D: 'Asp', C: 'Cys', Q: 'Gln', E: 'Glu', G: 'Gly',
    H: 'His', I: 'Ile', L: 'Leu', K: 'Lys', M: 'Met', F: 'Phe', P: 'Pro', S: 'Ser',
    T: 'Thr', W: 'Trp', Y: 'Tyr', V: 'Val'
  };

  /* 遗传密码：由「密码子 氨基酸」对构造查找表 */
  function makeCodonMap(str) {
    var map = {}, tok = str.split(/\s+/);
    for (var i = 0; i + 1 < tok.length; i += 2) map[tok[i]] = tok[i + 1];
    return map;
  }
  var CODON_STD = makeCodonMap(
    'TTT F TTC F TTA L TTG L CTT L CTC L CTA L CTG L ATT I ATC I ATA I ATG M ' +
    'GTT V GTC V GTA V GTG V TCT S TCC S TCA S TCG S CCT P CCC P CCA P CCG P ' +
    'ACT T ACC T ACA T ACG T GCT A GCC A GCA A GCG A TAT Y TAC Y TAA * TAG * ' +
    'CAT H CAC H CAA Q CAG Q AAT N AAC N AAA K AAG K GAT D GAC D GAA E GAG E ' +
    'TGT C TGC C TGA * TGG W CGT R CGC R CGA R CGG R AGT S AGC S AGA R AGG R ' +
    'GGT G GGC G GGA G GGG G');
  /* 脊椎动物线粒体：TGA=W、ATA=M、AGA/AGG=终止 */
  var CODON_MITO = (function () {
    var m = {};
    Object.keys(CODON_STD).forEach(function (k) { m[k] = CODON_STD[k]; });
    m.TGA = 'W'; m.ATA = 'M'; m.AGA = '*'; m.AGG = '*';
    return m;
  })();
  var CODON_TABLES = {
    standard: {
      map: CODON_STD, start: ['ATG'], stop: ['TAA', 'TAG', 'TGA'],
      label: '标准遗传密码（细菌/真核通用）'
    },
    mito: {
      map: CODON_MITO, start: ['ATA', 'ATG', 'ATT', 'ATC', 'GTG'],
      stop: ['TAA', 'TAG', 'AGA', 'AGG'],
      label: '脊椎动物线粒体'
    }
  };

  var FRAME_LABEL = {
    all: '六框翻译（正向 + 反向互补）',
    forward: '正向三框',
    revcomp: '反向互补后三框'
  };

  var FORMATS = [
    {
      name: 'FASTA 序列',
      filename: 'sequence_template.fasta',
      desc: '<b>FASTA 格式：以 <code>&gt;</code> 开头的标题行 + 序列行</b>，可包含多条记录：<br>' +
        '<code>&gt;seq1 描述</code><br><code>ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG</code><br><br>' +
        '也接受不含标题行的纯序列；多条序列之间用空行分隔。大小写不限，换行与空白会被自动忽略。',
      sample: '>seq1 示例序列\nATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG\n\n>seq2\nATGAAACCCGGGTTTAAAGGGCCCTTT...'
    },
    {
      name: '纯序列文本（多行自动拼接）',
      filename: 'sequence_template.txt',
      desc: '不含标题行时，每个空行分隔的文本块视为一条序列。只含 A/C/G/T/U/N 的判为核酸，否则判为蛋白。',
      sample: 'ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG'
    }
  ];

  /* ------------------------------ 模块 ---------------------------------- */

  WB.register({
    id: 'sequence',
    name: '序列与蛋白工具 / Sequence toolkit',
    icon: '≋',
    color: '#0f9b93',
    desc: '核酸与蛋白序列分析：反向互补、GC 含量、碱基组成、六框翻译、ORF 查找、密码子使用、Tm；蛋白分子量与等电点。',
    tags: ['序列', '翻译', 'ORF', '蛋白理化'],
    render: function (main) {
      main.appendChild(el('div.page-head', [
        el('h1', { text: T('序列与蛋白工具') }),
        el('p', { text: T('输入 FASTA 或纯序列文本，自动识别核酸 / 蛋白，并给出组成、反向互补、翻译与理化性质。') })
      ]));

      var panel = WB.ui.inputPanel({
        title: '输入核酸或蛋白序列',
        accept: '.fasta,.fa,.fas,.seq,.txt,.fna,.faa',
        formats: FORMATS,
        demoText: WB.demo.sequenceText,
        placeholder: '>seq1 示例序列\nATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG\n\n>seq2\nATGAAACCCGGGTTTAAAGGGCCCTTT...',
        acceptHint: '支持 FASTA / 纯文本（.fasta / .fa / .txt / .seq），可直接粘贴到下方文本框',
        paramsTitle: '分析参数',
        params: [
          {
            key: 'minOrf', label: 'ORF 最短长度（氨基酸）', type: 'number', value: 30,
            min: 0, max: 10000, step: 1, hint: '用于筛选 ORF 的最短长度（氨基酸，不含终止密码子）'
          },
          {
            key: 'frameMode', label: '翻译方向', type: 'select', value: 'all',
            options: [
              { value: 'all', label: '六框翻译（正向 + 反向互补）' },
              { value: 'forward', label: '正向三框' },
              { value: 'revcomp', label: '反向互补后三框' }
            ]
          },
          {
            key: 'codonTable', label: '密码子表', type: 'select', value: 'standard',
            options: [
              { value: 'standard', label: '标准遗传密码（细菌/真核通用）' },
              { value: 'mito', label: '脊椎动物线粒体' }
            ]
          },
          { key: 'showComp', label: '显示碱基 / 氨基酸组成图', type: 'checkbox', value: true },
          { key: 'topCodons', label: '密码子使用表行数', type: 'number', value: 20, min: 1, max: 64, step: 1 }
        ],
        runLabel: '分析序列',
        onRun: function (ctx) {
          var res = WB.$('#sequence-result');
          WB.clear(res);

          var text = String(ctx.text || '');
          if (!text.trim()) throw new Error(T('请先输入序列'));

          var recs = parseSequences(text);
          if (!recs.length) throw new Error(T('未解析到有效序列'));

          var vals = ctx.values;
          var nucleic = [], protein = [];
          recs.forEach(function (r) {
            if (/^[ACGTUN]+$/.test(r.seq)) nucleic.push(r); else protein.push(r);
          });

          res.appendChild(WB.ui.alertBox('info',
            T('已识别 {n} 条核酸序列、{m} 条蛋白序列。', { n: nucleic.length, m: protein.length })));

          if (nucleic.length) renderNucleicGroup(res, nucleic, vals);
          if (protein.length) renderProteinGroup(res, protein, vals);
        }
      });

      main.appendChild(panel.root);
      var wrap = el('div.tool-grid');
      wrap.id = 'sequence-result';
      main.appendChild(wrap);
      if (!WB._seqDemoLoaded && WB.demo.sequenceText) {
        WB._seqDemoLoaded = true;
        panel.setText(WB.demo.sequenceText);
      }
    }
  });

  /* ---------------------------- 序列解析 --------------------------------- */

  /** 解析 FASTA 或纯序列，返回 [{id, desc, seq}]（序列统一大写、去除非字母字符） */
  function parseSequences(text) {
    var lines = String(text).split(/\r?\n/);
    var recs = [], cur = null, sawHeader = false;

    lines.forEach(function (raw) {
      var line = raw.trim();
      if (line.charAt(0) === '>') {
        sawHeader = true;
        var rest = line.slice(1).trim();
        var sp = rest.indexOf(' ');
        var tab = rest.indexOf('\t');
        if (tab >= 0 && (sp < 0 || tab < sp)) sp = tab;
        var id = sp >= 0 ? rest.slice(0, sp) : rest;
        var desc = sp >= 0 ? rest.slice(sp + 1).trim() : '';
        cur = { id: id || ('seq' + (recs.length + 1)), desc: desc, parts: [] };
        recs.push(cur);
      } else if (cur && line) {
        cur.parts.push(line.replace(/\s/g, ''));
      }
    });

    if (sawHeader) {
      return recs.map(function (r) {
        return { id: r.id, desc: r.desc, seq: cleanSeq(r.parts.join('')) };
      }).filter(function (r) { return r.seq.length; });
    }

    // 纯序列：按空行分块，每块一条序列
    var blocks = [], block = [];
    lines.forEach(function (raw) {
      if (!raw.trim()) {
        if (block.length) { blocks.push(block.join('')); block = []; }
      } else {
        block.push(raw.replace(/\s/g, ''));
      }
    });
    if (block.length) blocks.push(block.join(''));

    var out = [];
    blocks.forEach(function (b, i) {
      var s = cleanSeq(b);
      if (s) out.push({ id: 'seq' + (i + 1), desc: '', seq: s });
    });
    return out;
  }

  function cleanSeq(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
  }
  function safeId(id) {
    return String(id || 'seq').replace(/[^\w.-]+/g, '_').slice(0, 40);
  }

  /* ---------------------------- 核酸分析 --------------------------------- */

  var BASE_COLOR = {
    A: '#4E79A7', C: '#59A14F', G: '#E15759', T: '#F28E2B', U: '#F28E2B',
    N: '#BAB0AC', other: '#9C755F'
  };

  function analyzeNucleic(rec) {
    var seq = rec.seq;
    var isRNA = seq.indexOf('U') >= 0 && seq.indexOf('T') < 0;
    var counts = { A: 0, C: 0, G: 0, T: 0, U: 0, N: 0, other: 0 };
    for (var i = 0; i < seq.length; i++) {
      var c = seq.charAt(i);
      if (counts[c] !== undefined) counts[c]++; else counts.other++;
    }
    var gc = (counts.G + counts.C) / seq.length * 100;
    var tseq = seq.replace(/U/g, 'T');                 // 密码子查找用 T
    var revcomp = revComplement(seq, isRNA);
    var rtseq = revcomp.replace(/U/g, 'T');
    var tm = calcTm(counts, seq.length);
    return {
      rec: rec, isRNA: isRNA, counts: counts, gc: gc,
      tseq: tseq, rtseq: rtseq, revcomp: revcomp, tm: tm
    };
  }

  /** 互补链：A↔T/U、C↔G；非 ATCGU 字符原样保留并转小写 */
  function complement(seq, isRNA) {
    var map = isRNA ? { A: 'U', U: 'A', C: 'G', G: 'C' } : { A: 'T', T: 'A', C: 'G', G: 'C' };
    var out = '';
    for (var i = 0; i < seq.length; i++) {
      var up = seq.charAt(i).toUpperCase();
      out += map[up] ? map[up] : up.toLowerCase();
    }
    return out;
  }
  function revComplement(seq, isRNA) {
    return complement(seq, isRNA).split('').reverse().join('');
  }

  /** 按指定阅读框翻译（输入已用 T 表示） */
  function translateFrame(strandSeq, frame, map) {
    var out = '';
    for (var i = frame; i + 3 <= strandSeq.length; i += 3) {
      out += (map[strandSeq.slice(i, i + 3)] || 'X');
    }
    return out;
  }

  /** 在一条链的一个阅读框内扫描 ORF */
  function scanOrfs(strandSeq, frame, tbl) {
    var out = [], startIdx = -1, startCodon = '';
    for (var i = frame; i + 3 <= strandSeq.length; i += 3) {
      var codon = strandSeq.slice(i, i + 3);
      if (startIdx < 0) {
        if (tbl.start.indexOf(codon) >= 0) { startIdx = i; startCodon = codon; }
      } else if (tbl.stop.indexOf(codon) >= 0) {
        out.push({ s: startIdx, e: i + 3, startCodon: startCodon, stopCodon: codon });
        startIdx = -1; startCodon = '';
      }
    }
    if (startIdx >= 0) {
      // 无终止密码子：截到最后一个完整密码子的末位，保证长度为 3 的整数倍
      var endFull = startIdx + 3 * Math.floor((strandSeq.length - startIdx) / 3);
      if (endFull > startIdx) out.push({ s: startIdx, e: endFull, startCodon: startCodon, stopCodon: '' });
    }
    return out;
  }

  /** 汇总各方向 / 各框的 ORF，返回按氨基酸长度降序的行 */
  function collectOrfs(a, tbl, minOrf, frameMode) {
    var list = [], L = a.rec.seq.length;

    function push(strandSeq, o, dir, frame) {
      var nt = o.e - o.s;
      var aa = nt / 3 - (o.stopCodon ? 1 : 0);
      if (aa < minOrf) return;
      var aaSeq = translateFrame(strandSeq.slice(o.s, o.e), 0, tbl.map);
      if (aaSeq.charAt(aaSeq.length - 1) === '*') aaSeq = aaSeq.slice(0, -1);
      list.push({
        dir: dir, frame: frame,
        start: dir === '+' ? o.s + 1 : L - o.s,
        end: dir === '+' ? o.e : L - o.e + 1,
        nt: nt, aa: aa, startCodon: o.startCodon, stopCodon: o.stopCodon, aaSeq: aaSeq
      });
    }

    if (frameMode !== 'revcomp') {
      for (var f = 0; f < 3; f++) {
        scanOrfs(a.tseq, f, tbl).forEach(function (o) { push(a.tseq, o, '+', f + 1); });
      }
    }
    if (frameMode !== 'forward') {
      for (var f2 = 0; f2 < 3; f2++) {
        scanOrfs(a.rtseq, f2, tbl).forEach(function (o) { push(a.rtseq, o, '−', f2 + 1); });
      }
    }

    list.sort(function (x, y) { return y.aa - x.aa; });
    list.forEach(function (r, i) { r.no = i + 1; r.len = r.nt + ' / ' + r.aa; });
    return list;
  }

  /** 密码子使用（正向三框全部密码子） */
  function codonUsage(a, tbl, topN) {
    var counts = {}, total = 0;
    for (var f = 0; f < 3; f++) {
      for (var i = f; i + 3 <= a.tseq.length; i += 3) {
        var codon = a.tseq.slice(i, i + 3);
        if (!/^[ACGT]{3}$/.test(codon)) continue;
        counts[codon] = (counts[codon] || 0) + 1;
        total++;
      }
    }
    var rows = Object.keys(counts).map(function (c) {
      return { codon: c, aa: tbl.map[c] || 'X', count: counts[c], freq: counts[c] / (total || 1) * 1000 };
    });
    rows.sort(function (x, y) { return y.count - x.count; });
    return { rows: rows.slice(0, topN), total: total };
  }

  /** Tm：≤ 14 nt 用 Wallace，> 14 nt 用 GC 近似公式 */
  function calcTm(counts, len) {
    var at = counts.A + counts.T + counts.U;
    var gc = counts.G + counts.C;
    if (len <= 14) return 2 * at + 4 * gc;
    return 64.9 + 41 * (gc - 16.4) / len;
  }

  /* ---------------------------- 蛋白分析 --------------------------------- */

  function analyzeProtein(rec) {
    var seq = rec.seq;
    var counts = {};
    ORDER.forEach(function (aa) { counts[aa] = 0; });
    var unknown = 0, mw = WATER, kdSum = 0, kdN = 0, arom = 0;

    for (var i = 0; i < seq.length; i++) {
      var c = seq.charAt(i);
      if (counts[c] !== undefined) {
        counts[c]++;
        mw += MASS[c];
        if (KD[c] !== undefined) { kdSum += KD[c]; kdN++; }
        if (c === 'F' || c === 'W' || c === 'Y') arom++;
      } else {
        unknown++;
      }
    }

    var stdLen = 0;
    ORDER.forEach(function (aa) { stdLen += counts[aa]; });

    return {
      rec: rec, counts: counts, unknown: unknown, stdLen: stdLen,
      mw: mw, pi: calcPI(counts),
      gravy: kdN ? kdSum / kdN : 0,
      aromaticity: seq.length ? arom / seq.length : 0
    };
  }

  /** 二分搜索净电荷为零的 pH（0–14，精度 0.01） */
  function calcPI(counts) {
    function charge(pH) {
      var pos = 1 / (1 + Math.pow(10, pH - 9.69));           // 氨基端
      var neg = 1 / (1 + Math.pow(10, 2.34 - pH));           // 羧基端
      pos += counts.K / (1 + Math.pow(10, pH - 10.5));
      pos += counts.R / (1 + Math.pow(10, pH - 12.4));
      pos += counts.H / (1 + Math.pow(10, pH - 6.0));
      neg += counts.D / (1 + Math.pow(10, 3.86 - pH));
      neg += counts.E / (1 + Math.pow(10, 4.25 - pH));
      neg += counts.C / (1 + Math.pow(10, 8.33 - pH));
      neg += counts.Y / (1 + Math.pow(10, 10.07 - pH));
      return pos - neg;
    }
    var lo = 0, hi = 14;
    for (var i = 0; i < 60 && (hi - lo) > 0.005; i++) {
      var mid = (lo + hi) / 2;
      if (charge(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* --------------------------- 结果渲染：核酸 ---------------------------- */

  function renderNucleicGroup(res, recs, vals) {
    res.appendChild(WB.ui.sectionTitle(T('核酸序列分析'), T('GC 含量 = (G + C) / 序列全长 × 100%。')));

    var totalLen = 0, gcSum = 0;
    var analyzed = recs.map(function (r) {
      var a = analyzeNucleic(r);
      totalLen += r.seq.length;
      gcSum += a.gc;
      return a;
    });

    res.appendChild(WB.ui.statBar([
      { label: T('记录数'), value: recs.length },
      { label: T('总长度'), value: totalLen },
      { label: T('平均 GC 含量'), value: (gcSum / recs.length).toFixed(1) + '%' },
      { label: T('平均长度'), value: Math.round(totalLen / recs.length) }
    ]));

    var tbl = CODON_TABLES[vals.codonTable] || CODON_TABLES.standard;
    var frameMode = vals.frameMode || 'all';
    var minOrf = Number(vals.minOrf) || 0;
    res.appendChild(WB.ui.alertBox('info',
      T('密码子表：<b>{t}</b>；翻译方向：<b>{m}</b>；ORF 最短长度 {n} aa。',
        { t: T(tbl.label), m: T(FRAME_LABEL[frameMode] || FRAME_LABEL.all), n: minOrf })));

    analyzed.forEach(function (a) { renderNucleicCard(res, a, vals, tbl, frameMode, minOrf); });
  }

  function renderNucleicCard(res, a, vals, tbl, frameMode, minOrf) {
    var rec = a.rec;
    var card = WB.ui.resultCard(T('序列 {id}', { id: rec.id }));
    res.appendChild(card);
    var body = card.querySelector('.card-body');

    body.appendChild(WB.ui.statBar([
      { label: T('类型'), value: a.isRNA ? 'RNA' : 'DNA' },
      { label: T('长度 (nt)'), value: rec.seq.length, tone: 'purple' },
      { label: T('GC 含量'), value: a.gc.toFixed(2) + '%', tone: 'green' }
    ]));
    if (rec.desc) body.appendChild(el('div.preview-note', { text: rec.desc }));

    /* 碱基组成（计数 + 百分比） */
    var comp = [];
    ['A', 'C', 'G', 'T', 'U', 'N'].forEach(function (b) {
      if (!a.counts[b]) return;
      comp.push(b + ' ' + a.counts[b] + ' (' + (a.counts[b] / rec.seq.length * 100).toFixed(1) + '%)');
    });
    if (a.counts.other) {
      comp.push(T('其他') + ' ' + a.counts.other + ' (' + (a.counts.other / rec.seq.length * 100).toFixed(1) + '%)');
    }
    body.appendChild(el('div.param-head', { text: T('碱基组成') }));
    body.appendChild(el('div.mono', { text: comp.join('   '), style: { wordBreak: 'break-all' } }));
    if (a.counts.other) {
      body.appendChild(el('div.preview-note', {
        text: T('包含 {n} 个非 A/C/G/T/U 字符（如 N），已按未识别字符处理。', { n: a.counts.other })
      }));
    }

    /* 组成条形图 */
    if (vals.showComp) {
      var items = [];
      ['A', 'C', 'G', 'T', 'U', 'N'].forEach(function (b) {
        if (a.counts[b]) items.push({ label: b, value: a.counts[b], color: BASE_COLOR[b], pct: a.counts[b] / rec.seq.length * 100 });
      });
      if (a.counts.other) {
        items.push({ label: T('其他'), value: a.counts.other, color: BASE_COLOR.other, pct: a.counts.other / rec.seq.length * 100 });
      }
      var chartBox = el('div');
      body.appendChild(chartBox);
      var holder = el('div.plot-holder');
      chartBox.appendChild(holder);
      var svg = drawBars(holder, items, { xLabel: T('碱基') });
      WB.plot.addToolbar(chartBox, { getSvg: function () { return svg; }, basename: 'sequence_composition_' + safeId(rec.id) });
    }

    /* 反向互补序列 */
    body.appendChild(el('div.param-head', { text: T('反向互补序列') }));
    body.appendChild(el('div.mono', { text: a.revcomp, style: { wordBreak: 'break-all' } }));
    body.appendChild(el('div.format-actions', [
      el('button.btn.btn-ghost.btn-xs', {
        text: T('复制'), title: T('反向互补序列'),
        onclick: function () { WB.copyText(a.revcomp); }
      })
    ]));

    /* 六框翻译 */
    body.appendChild(el('div.param-head', { text: T('六框翻译') }));
    var frames = [];
    if (frameMode !== 'revcomp') {
      for (var f = 0; f < 3; f++) frames.push({ label: '+' + (f + 1), aa: translateFrame(a.tseq, f, tbl.map) });
    }
    if (frameMode !== 'forward') {
      for (var f2 = 0; f2 < 3; f2++) frames.push({ label: '−' + (f2 + 1), aa: translateFrame(a.rtseq, f2, tbl.map) });
    }
    frames.forEach(function (fr) {
      var line = el('div.mono', { style: { wordBreak: 'break-all' } });
      line.appendChild(el('b', { text: fr.label + '  ' }));
      line.appendChild(document.createTextNode(fr.aa || '—'));
      body.appendChild(line);
    });

    /* Tm 估算 */
    body.appendChild(el('div.param-head', { text: T('Tm 估算') }));
    body.appendChild(el('div', { text: 'Tm ≈ ' + a.tm.toFixed(1) + ' °C' }));
    body.appendChild(el('div.preview-note', {
      text: T('Tm 为粗估值（≤ 14 nt 用 Wallace 规则，> 14 nt 用 GC 近似公式）；精确定量请使用最近邻热力学模型并考虑盐浓度与 Mg²⁺。')
    }));

    /* ORF 表 */
    body.appendChild(el('div.param-head', { text: T('ORF 查找结果') }));
    var orfRows = collectOrfs(a, tbl, minOrf, frameMode);
    var orfBox = el('div');
    body.appendChild(orfBox);
    if (orfRows.length) {
      WB.ui.dataTable(orfBox, [
        { key: 'no', label: T('序号'), align: 'right', width: 56 },
        { key: 'dir', label: T('方向'), align: 'center', width: 56 },
        { key: 'frame', label: T('框'), align: 'right', width: 56 },
        { key: 'start', label: T('起始位置'), align: 'right', width: 88 },
        { key: 'end', label: T('终止位置'), align: 'right', width: 88 },
        { key: 'len', label: T('长度 (nt / aa)'), align: 'right', width: 120 },
        { key: 'startCodon', label: T('起始密码子'), align: 'center', width: 100 },
        { key: 'stopCodon', label: T('终止密码子'), align: 'center', width: 100, format: function (r) { return r.stopCodon || '—'; } },
        {
          key: 'aaSeq', label: T('氨基酸序列'), className: 'mono',
          format: function (r) { return WB.plot.ellipsis(r.aaSeq, 48); }
        }
      ], orfRows, { pageSize: 15, exportName: 'sequence_orfs_' + safeId(rec.id) });
      orfBox.appendChild(el('div.preview-note', {
        text: T('ORF 筛选长度 ≥ {n} 氨基酸（不含终止密码子）。', { n: minOrf })
      }));
    } else {
      orfBox.appendChild(el('div.preview-note', {
        text: T('未找到满足条件的 ORF，可调低「ORF 最短长度」。')
      }));
    }

    /* 密码子使用表 */
    body.appendChild(el('div.param-head', { text: T('密码子使用') }));
    body.appendChild(el('div.preview-note', { text: T('密码子使用统计基于正向三框的全部密码子。') }));
    var codBox = el('div');
    body.appendChild(codBox);
    var cu = codonUsage(a, tbl, Math.max(1, Number(vals.topCodons) || 20));
    WB.ui.dataTable(codBox, [
      { key: 'codon', label: T('密码子'), className: 'mono', width: 100 },
      { key: 'aa', label: T('氨基酸'), align: 'center', width: 88 },
      { key: 'count', label: T('计数'), align: 'right', width: 88 },
      { key: 'freq', label: T('频率（每千密码子）'), align: 'right', width: 160, format: function (r) { return r.freq.toFixed(2); } }
    ], cu.rows, { pageSize: 25, exportName: 'sequence_codons_' + safeId(rec.id), sortable: true });
  }

  /* --------------------------- 结果渲染：蛋白 ---------------------------- */

  function renderProteinGroup(res, recs, vals) {
    res.appendChild(WB.ui.sectionTitle(T('蛋白序列分析'), T('蛋白分子量 = 各残基平均质量之和 + 18.0153 Da（一个水分子）。')));

    var totalLen = 0, mwSum = 0, piSum = 0;
    var analyzed = recs.map(function (r) {
      var a = analyzeProtein(r);
      totalLen += r.seq.length;
      mwSum += a.mw;
      piSum += a.pi;
      return a;
    });

    res.appendChild(WB.ui.statBar([
      { label: T('记录数'), value: recs.length },
      { label: T('总长度'), value: totalLen },
      { label: T('平均分子量'), value: WB.formatNum(mwSum / recs.length, 1) + ' Da', tone: 'purple' },
      { label: T('平均 pI'), value: (piSum / recs.length).toFixed(2), tone: 'green' }
    ]));

    analyzed.forEach(function (a) { renderProteinCard(res, a, vals); });
  }

  function renderProteinCard(res, a, vals) {
    var rec = a.rec;
    var card = WB.ui.resultCard(T('序列 {id}', { id: rec.id }));
    res.appendChild(card);
    var body = card.querySelector('.card-body');

    body.appendChild(WB.ui.statBar([
      { label: T('长度 (aa)'), value: rec.seq.length },
      { label: T('分子量 (Da)'), value: WB.formatNum(a.mw, 1), tone: 'purple' },
      { label: T('等电点 pI'), value: a.pi.toFixed(2), tone: 'green' },
      { label: T('GRAVY（平均疏水性）'), value: WB.formatNum(a.gravy, 3), tone: a.gravy > 0 ? 'red' : '' },
      { label: T('芳香性'), value: (a.aromaticity * 100).toFixed(1) + '%' }
    ]));
    if (rec.desc) body.appendChild(el('div.preview-note', { text: rec.desc }));

    var notes = [T('蛋白分子量 = 各残基平均质量之和 + 18.0153 Da（一个水分子）。'),
      T('等电点按给定 pKa 表对 pH 0–14 二分搜索净电荷零点（精度 0.01）。')];
    if (a.unknown) notes.push(T('序列含 {n} 个非标准残基，已从分子量、GRAVY 与组成统计中忽略。', { n: a.unknown }));
    body.appendChild(WB.ui.alertBox('info', notes.join('  ')));

    /* 氨基酸组成条形图 */
    if (vals.showComp) {
      var items = ORDER.map(function (aa) {
        return { label: aa, value: a.counts[aa], color: WB.plot.palette(ORDER.indexOf(aa)) };
      }).filter(function (it) { return it.value > 0; })
        .sort(function (x, y) { return y.value - x.value; });
      items.forEach(function (it) { it.pct = a.stdLen ? it.value / a.stdLen * 100 : 0; });

      var chartBox = el('div');
      body.appendChild(chartBox);
      var holder = el('div.plot-holder');
      chartBox.appendChild(holder);
      var svg = drawBars(holder, items, { xLabel: T('氨基酸') });
      WB.plot.addToolbar(chartBox, { getSvg: function () { return svg; }, basename: 'protein_composition_' + safeId(rec.id) });
    }

    /* 氨基酸组成表 */
    body.appendChild(el('div.param-head', { text: T('氨基酸组成') }));
    var tBox = el('div');
    body.appendChild(tBox);
    var rows = ORDER.map(function (aa) {
      return {
        aa3: AA3[aa], one: aa, count: a.counts[aa],
        pct: a.stdLen ? a.counts[aa] / a.stdLen * 100 : 0
      };
    }).sort(function (x, y) { return y.count - x.count; });
    WB.ui.dataTable(tBox, [
      { key: 'aa3', label: T('氨基酸'), width: 120 },
      { key: 'one', label: T('单字母'), align: 'center', width: 88, className: 'mono' },
      { key: 'count', label: T('计数'), align: 'right', width: 88 },
      { key: 'pct', label: T('百分比'), align: 'right', width: 120, format: function (r) { return r.pct.toFixed(2) + '%'; } }
    ], rows, { pageSize: 25, exportName: 'protein_composition_' + safeId(rec.id) });

    /* 疏水性滑动窗口（长度 ≥ 20） */
    if (rec.seq.length >= 20) {
      body.appendChild(el('div.param-head', { text: T('疏水性滑动窗口') }));
      body.appendChild(el('div.preview-note', {
        text: T('滑动窗口：窗口 {w} 个残基，纵轴为 Kyte–Doolittle 疏水性均值（正值偏疏水）。', { w: 9 })
      }));
      var hBox = el('div');
      body.appendChild(hBox);
      var hHolder = el('div.plot-holder');
      hBox.appendChild(hHolder);
      var hsvg = drawHydro(hHolder, rec.seq, 9);
      WB.plot.addToolbar(hBox, { getSvg: function () { return hsvg; }, basename: 'protein_hydropathy_' + safeId(rec.id) });
    }
  }

  /* ------------------------------ 绘图 ---------------------------------- */

  /** 通用纵向条形图：items = [{label, value, color?, pct?}] */
  function drawBars(container, items, opts) {
    opts = opts || {};
    if (!items || !items.length) { WB.plot.emptyState(container, T('common.noData')); return null; }
    var W = 640, H = opts.height || 300, m = { l: 58, r: 18, t: 22, b: 46 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;

    var maxV = 0;
    items.forEach(function (it) { if (it.value > maxV) maxV = it.value; });
    if (!(maxV > 0)) maxV = 1;

    var band = WB.plot.bandScale(items.map(function (it) { return it.label; }), m.l, W - m.r, 0.3);
    var sy = WB.plot.linearScale(0, maxV, H - m.b, m.t);

    sy.ticks(5).forEach(function (t) {
      if (t < 0) return;
      root.appendChild(S('line', {
        x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t),
        stroke: WB.plot.GRID, 'shape-rendering': 'crispEdges'
      }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, WB.formatNum(t, 0),
        { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    var bw = band.bandwidth();
    items.forEach(function (it, i) {
      var x = band(it.label), y = sy(it.value), h = Math.max(1, H - m.b - y);
      var color = it.color || WB.plot.palette(i);
      var rect = S('rect', { x: x, y: y, width: bw, height: h, rx: 3, fill: color, 'fill-opacity': 0.9 });
      root.appendChild(rect);
      WB.plot.bindTip(rect, function () {
        return '<b>' + it.label + '</b><br>' + WB.lab('common.count', it.value) +
          (it.pct !== undefined ? '<br>' + T('占比') + WB.pick('：', ': ') + it.pct.toFixed(1) + '%' : '');
      });
      root.appendChild(WB.plot.txt(x + bw / 2, y - 5, String(it.value),
        { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
      root.appendChild(WB.plot.txt(x + bw / 2, H - m.b + 15, it.label,
        { 'text-anchor': 'middle', 'font-size': 11, fill: WB.plot.TEXT }));
    });

    root.appendChild(S('line', {
      x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b,
      stroke: WB.plot.AXIS, 'shape-rendering': 'crispEdges'
    }));
    if (opts.xLabel) {
      root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 14, opts.xLabel,
        { 'text-anchor': 'middle', 'font-size': 11.5, fill: WB.plot.TEXT }));
    }
    return canvas.svg;
  }

  /** 疏水性滑动窗口曲线（Kyte–Doolittle 均值） */
  function drawHydro(container, seq, win) {
    win = win || 9;
    var W = 660, H = 260, m = { l: 58, r: 18, t: 24, b: 46 };
    var canvas = WB.plot.createSVG(container, W, H, {});
    var root = canvas.root;
    var half = Math.floor(win / 2);

    var xs = [], ys = [];
    for (var i = 0; i < seq.length; i++) {
      var lo = Math.max(0, i - half), hi = Math.min(seq.length, i + half + 1);
      var s = 0, n = 0;
      for (var j = lo; j < hi; j++) {
        var v = KD[seq.charAt(j)];
        if (v !== undefined) { s += v; n++; }
      }
      xs.push(i + 1);
      ys.push(n ? s / n : 0);
    }

    var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys);
    yMin = Math.min(yMin, 0) - 0.3;
    yMax = Math.max(yMax, 0) + 0.3;
    if (yMax - yMin < 1) yMax = yMin + 1;

    var sx = WB.plot.linearScale(1, seq.length, m.l, W - m.r);
    var sy = WB.plot.linearScale(yMin, yMax, H - m.b, m.t);

    sy.ticks(5).forEach(function (t) {
      if (t < yMin || t > yMax) return;
      root.appendChild(S('line', {
        x1: m.l, y1: sy(t), x2: W - m.r, y2: sy(t),
        stroke: t === 0 ? '#cfdae3' : WB.plot.GRID
      }));
      root.appendChild(WB.plot.txt(m.l - 8, sy(t) + 3.5, WB.formatNum(t, 1),
        { 'text-anchor': 'end', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });
    sx.ticks(6).forEach(function (t) {
      if (t < 1 || t > seq.length) return;
      root.appendChild(WB.plot.txt(sx(t), H - m.b + 16, String(Math.round(t)),
        { 'text-anchor': 'middle', 'font-size': 10.5, fill: WB.plot.MUTED }));
    });

    var dArea = 'M' + sx(xs[0]) + ',' + sy(0), dLine = '';
    xs.forEach(function (x, k) {
      dArea += 'L' + sx(x) + ',' + sy(ys[k]);
      dLine += (k === 0 ? 'M' : 'L') + sx(x) + ',' + sy(ys[k]);
    });
    dArea += 'L' + sx(xs[xs.length - 1]) + ',' + sy(0) + 'Z';
    root.appendChild(S('path', { d: dArea, fill: '#0f9b93', 'fill-opacity': 0.14, stroke: 'none' }));
    root.appendChild(S('path', { d: dLine, fill: 'none', stroke: '#0f9b93', 'stroke-width': 1.6 }));

    var hover = S('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' });
    root.appendChild(hover);
    hover.addEventListener('mousemove', function (e) {
      var rect = canvas.svg.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      var idx = Math.round(sx.invert(mx)) - 1;
      if (idx < 0 || idx >= xs.length) { WB.plot.tipHide(); return; }
      WB.plot.tipShow('<b>' + T('位置') + ' ' + xs[idx] + '</b><br>' +
        T('疏水性（Kyte–Doolittle）') + ' = ' + WB.formatNum(ys[idx], 2), e);
    });
    hover.addEventListener('mouseleave', function () { WB.plot.tipHide(); });

    root.appendChild(S('rect', {
      x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b,
      fill: 'none', stroke: WB.plot.AXIS
    }));
    root.appendChild(WB.plot.txt(m.l + (W - m.l - m.r) / 2, H - 14, T('残基位置'),
      { 'text-anchor': 'middle', 'font-size': 11.5, fill: WB.plot.TEXT }));
    return canvas.svg;
  }
})(window);
