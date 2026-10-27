/* =============================================================================
 * data/demo.js  —  示例数据（真实基因符号 + 固定随机种子，结果可复现）
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};

  /* --------------------------- 可复现随机数 ------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    var r = mulberry32(seed);
    return {
      u: r,
      n: function (mu, sd) { // Box-Muller
        var u1 = Math.max(1e-12, r()), u2 = r();
        return mu + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      },
      int: function (a, b) { return a + Math.floor(r() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(r() * arr.length)]; },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      }
    };
  }

  /* ------------------------------ 基因池 -------------------------------- */

  var GENES = ('TP53 BRCA1 BRCA2 ATM CHEK2 PALB2 RAD51 PTEN RB1 CDKN2A MDM2 CDK1 CDK2 CDK4 CDK6 ' +
    'CCNA2 CCNB1 CCNB2 CCND1 CCNE1 CDKN1A CDKN1B CDKN3 CDC20 CDC25A CDC25C CDC6 CDC45 MKI67 BUB1 ' +
    'BUB1B AURKA AURKB PLK1 TOP2A CENPF NDC80 NUF2 KIF11 KIF2C ANLN SPC25 PTTG1 UBE2C BIRC5 ESPL1 ' +
    'MAD2L1 RRM2 TYMS MCM2 MCM3 MCM4 MCM5 MCM6 MCM7 PCNA RFC1 RFC4 RPA1 RPA2 POLA1 POLD1 POLE ' +
    'FEN1 LIG1 PRIM1 GINS1 CDT1 ORC1 ORC6 WEE1 PKMYT1 TTK BUB3 ZW10 NDC80 SMC2 SMC4 NCAPG NCAPH ' +
    'EGFR ERBB2 ERBB3 MET KRAS NRAS HRAS BRAF RAF1 MAP2K1 MAP2K2 MAPK1 MAPK3 MAPK8 MAPK14 ARAF ' +
    'PIK3CA PIK3CB PIK3R1 AKT1 AKT2 MTOR RPTOR RICTOR PTEN TSC1 TSC2 RHEB RPS6KB1 EIF4EBP1 GSK3B ' +
    'FOXO1 FOXO3 MYC MYCN CCND2 JUN JUNB FOS FOSB EGR1 ATF3 NFKB1 RELA RELB NFKBIA TNF IL6 IL1B ' +
    'CXCL8 CCL2 CXCL10 IFNG IFNB1 STAT1 STAT3 STAT5A JAK1 JAK2 IRF1 IRF3 IRF7 TLR4 MYD88 CD274 ' +
    'PDCD1 CD8A CD4 CD3D CD3E CD19 MS4A1 FOXP3 GZMB PRF1 NKG7 KLRD1 LAMP3 CD69 IL2RA CTLA4 LAG3 ' +
    'HAVCR2 TIGIT CD80 CD86 CD28 ICOS BATF IRF4 PRDM1 XBP1 BLIMP1 SDC1 MZB1 JCHAIN ' +
    'COL1A1 COL1A2 COL3A1 COL4A1 COL5A1 FN1 FBN1 LUM DCN SPARC VIM CDH1 CDH2 ZEB1 ZEB2 SNAI1 SNAI2 ' +
    'TWIST1 TWIST2 TGFB1 TGFB2 TGFBR1 SMAD2 SMAD3 SMAD4 ACTA2 TAGLN MMP2 MMP9 TIMP1 TIMP2 LOX ' +
    'HK2 PFKM PFKL ALDOA GAPDH PGK1 PKM LDHA ENO1 ENO2 SLC2A1 SLC2A3 PDK1 PDK3 G6PD TALDO1 TKT ' +
    'NDUFA1 NDUFA2 NDUFA4 NDUFB2 NDUFS1 NDUFV1 SDHA SDHB SDHC SDHD UQCRC1 UQCRC2 CYC1 COX4I1 ' +
    'COX5A COX6A1 ATP5F1A ATP5F1B ATP5MC1 ATP5PB VDAC1 VDAC2 ANT1 ' +
    'RPS3 RPS6 RPS12 RPL3 RPL10 RPL13A RPLP0 RPS19 RPS24 RPL34 RPL41 EIF3A EIF3B EIF4A1 EIF4E ' +
    'HSPA1A HSPA5 HSP90AA1 HSP90AB1 HSPB1 DNAJB1 DNAJA1 BAG3 ' +
    'BAX BAK1 BID BAD BBC3 PMAIP1 PUMA CASP3 CASP7 CASP8 CASP9 CASP10 APAF1 CYCS DIABLO XIAP ' +
    'BCL2 BCL2L1 BCL2L11 MCL1 BIRC2 BIRC3 CFLAR FADD FAS TNFRSF10A TNFRSF10B ' +
    'SOD1 SOD2 CAT GPX1 GPX4 TXN TXNRD1 NFE2L2 KEAP1 HMOX1 NQO1 GCLM GCLC ' +
    'VEGFA VEGFB VEGFC FLT1 KDR FLT4 ANGPT1 ANGPT2 TEK PDGFRA PDGFRB FGF2 FGFR1 HGF HIF1A ' +
    'EPAS1 ARNT VHL EGLN1 CA9 SLC16A1 SLC16A3 ' +
    'MSH2 MSH6 MLH1 PMS2 MSH3 EXO1 PCNA POLD3 LIG3 XRCC1 PARP1 PARP2 BRCA1 RAD50 MRE11A NBN ' +
    'ABCB1 ABCG2 ABCC1 SLC7A11 SLC3A2 GCLM GSR TXNRD1 ' +
    'ACTB GAPDH TUBB TUBA1B ACTN1 ACTN4 VCL TLN1 FLNA MYH9 MYH10 CFL1 PFN1 ARPC2 WASF2 ' +
    'YWHAZ YWHAE YWHAB PPP1CA PPP2CA PPP2R1A PPM1A UBC SUMO1 SUMO2 APP PSEN1 BACE1 MAPT ' +
    'SREBF1 SREBF2 HMGCR LDLR INS IGF1 IGF1R IRS1 IRS2 LEP LEPR ADIPOQ PPARG CEBPA CEBPB ' +
    'NR3C1 ESR1 PGR AR ESR2 GATA3 FOXA1 KRT18 KRT8 EPCAM KRT19 MUC1').split(/\s+/)
    .filter(function (g, i, a) { return g && a.indexOf(g) === i; });

  /* ---------------------- 1. 集合数据（Venn / UpSet） --------------------- */

  function buildSets() {
    var rng = makeRng(20261009);
    var pool = rng.shuffle(GENES).slice(0, 520);
    var defs = [
      { name: 'Control_up', n: 210, bias: 1.0 },
      { name: 'Treat4h_up', n: 185, bias: 1.0 },
      { name: 'Treat24h_up', n: 240, bias: 1.0 },
      { name: 'Treat72h_up', n: 160, bias: 1.0 }
    ];
    // 让某些基因倾向同时出现在多个集合中（生物学上合理：共享通路）
    var shared = pool.slice(0, 90);
    var pairs = pool.slice(90, 150);
    var sets = defs.map(function (d, i) {
      var picked = [];
      shared.forEach(function (g) { if (rng.u() < 0.55) picked.push(g); });
      if (pairs.length) {
        pairs.forEach(function (g, k) { if (k % 4 === i && rng.u() < 0.8) picked.push(g); });
      }
      var rest = rng.shuffle(pool).filter(function (g) { return picked.indexOf(g) < 0; });
      while (picked.length < d.n && rest.length) picked.push(rest.pop());
      return { name: d.name, elements: Array.from(new Set(picked)).slice(0, d.n) };
    });
    return sets;
  }

  function setsToLong(sets) {
    var out = ['Set\tElement'];
    sets.forEach(function (s) {
      s.elements.forEach(function (e) { out.push(s.name + '\t' + e); });
    });
    return out.join('\n');
  }
  function setsToWide(sets) {
    var all = [];
    sets.forEach(function (s) { s.elements.forEach(function (e) { if (all.indexOf(e) < 0) all.push(e); }); });
    var out = ['Element\t' + sets.map(function (s) { return s.name; }).join('\t')];
    all.forEach(function (g) {
      out.push([g].concat(sets.map(function (s) { return s.elements.indexOf(g) >= 0 ? 1 : 0; })).join('\t'));
    });
    return out.join('\n');
  }
  function setsToColumns(sets) {
    var maxLen = Math.max.apply(null, sets.map(function (s) { return s.elements.length; }));
    var head = sets.map(function (s) { return s.name; }).join('\t');
    var lines = [head];
    for (var i = 0; i < maxLen; i++) {
      lines.push(sets.map(function (s) { return s.elements[i] || ''; }).join('\t'));
    }
    return lines.join('\n');
  }

  var SETS = buildSets();

  /* ------------------------ 2. 相关性分析示例 ---------------------------- */

  var CORR_GENES = ['CD3D', 'CD8A', 'PDCD1', 'CD274', 'IFNG', 'GZMB', 'FOXP3', 'TGFB1', 'MKI67', 'VIM'];

  function buildCorr() {
    var rng = makeRng(777001), n = 42;
    // 潜在因子：免疫浸润度 / 增殖度 / 纤维化度
    var rows = [['SampleID'].concat(CORR_GENES).join('\t')];
    for (var i = 0; i < n; i++) {
      var immune = rng.n(0, 1), prolif = rng.n(0, 1), fibro = rng.n(0, 1), noise = function () { return rng.n(0, 0.5); };
      var v = {
        CD3D: 8 + immune * 1.6 + noise(),
        CD8A: 7.5 + immune * 1.5 + noise(),
        PDCD1: 6 + immune * 1.4 + noise(),
        CD274: 5 + immune * 1.0 + noise() * 1.4,
        IFNG: 6.5 + immune * 1.3 + noise(),
        GZMB: 7 + immune * 1.2 + noise(),
        FOXP3: 5.5 + immune * 1.1 + noise() * 1.2,
        TGFB1: 9 + fibro * 1.5 + noise(),
        MKI67: 6 + prolif * 1.8 + noise() * 0.8,
        VIM: 10 + fibro * 1.2 + noise()
      };
      rows.push(['S' + String(i + 1).padStart(3, '0')].concat(CORR_GENES.map(function (g) {
        return v[g].toFixed(3);
      })).join('\t'));
    }
    return rows.join('\n');
  }

  /* --------------------------- 3. PCA 示例 ------------------------------ */

  var PCA_GENES = ['MKI67', 'CCNB1', 'BUB1', 'TOP2A', 'CD8A', 'PDCD1', 'IFNG', 'GZMB',
    'COL1A1', 'COL3A1', 'VIM', 'ACTA2', 'HK2', 'LDHA', 'SLC2A1', 'PKM'];

  function buildPCA() {
    var rng = makeRng(31337);
    var groups = ['Normal', 'Tumor', 'Metastasis'];
    var nPer = 22;
    var rows = [['SampleID', 'Group'].concat(PCA_GENES).join('\t')];
    groups.forEach(function (grp, gi) {
      for (var i = 0; i < nPer; i++) {
        var base = [8, 10.5, 11.5][gi];
        var vals = PCA_GENES.map(function (g, j) {
          var pathway = j < 4 ? 0 : (j < 8 ? 1 : (j < 12 ? 2 : 3)); // 增殖/免疫/纤维/糖酵解
          var shift = (pathway === 0 && gi > 0) ? 2.2 + gi * 0.7
            : (pathway === 1 && gi === 0) ? 1.6
              : (pathway === 2 && gi > 0) ? 1.4 + gi * 0.5
                : (pathway === 3 && gi > 0) ? 1.8 + gi * 0.6 : 0;
          return (base + shift + rng.n(0, 0.55)).toFixed(3);
        });
        rows.push(['P' + grp.slice(0, 2).toUpperCase() + String(i + 1).padStart(2, '0'), grp].concat(vals).join('\t'));
      }
    });
    return rows.join('\n');
  }

  /* -------------------------- 4. 火山图示例 ----------------------------- */

  function buildVolcano() {
    var rng = makeRng(90210);
    var pool = rng.shuffle(GENES);
    var rows = ['gene\tlog2FoldChange\tpvalue\tpadj'];
    var n = 1600;
    for (var i = 0; i < n; i++) {
      var g = pool[i % pool.length] + (i >= pool.length ? '_' + Math.floor(i / pool.length) : '');
      var fc = rng.n(0, 1.15);
      var isSig = rng.u() < 0.13;
      if (isSig) fc = (rng.u() < 0.5 ? -1 : 1) * (0.9 + Math.abs(rng.n(0.6, 0.7)));
      var p;
      if (Math.abs(fc) > 1 && rng.u() < 0.82) p = Math.pow(10, -Math.abs(rng.n(2.6, 1.1)) - 0.3);
      else p = Math.pow(10, -Math.abs(rng.n(0.5, 0.55)));
      p = Math.min(1, Math.max(1e-12, p));
      rows.push([g, fc.toFixed(4), p.toPrecision(4), Math.min(1, p * (n / (i + 1))).toPrecision(4)].join('\t'));
    }
    return rows.join('\n');
  }

  /* --------------------------- 5. 热图示例 ------------------------------ */

  var HEAT_GENES = ['MKI67', 'CCNB1', 'BUB1', 'TOP2A', 'AURKA', 'PLK1', 'CD8A', 'PDCD1', 'IFNG',
    'GZMB', 'PRF1', 'NKG7', 'COL1A1', 'COL3A1', 'FN1', 'VIM', 'ACTA2', 'TGFB1', 'HK2', 'LDHA',
    'SLC2A1', 'PKM', 'ENO1', 'GAPDH', 'TP53', 'BRCA1', 'PTEN', 'MYC', 'EGFR', 'KRAS'];

  function buildHeatmap() {
    var rng = makeRng(555777);
    var samples = [];
    var groups = [];
    for (var g = 0; g < 3; g++) {
      var gname = ['Normal', 'Tumor', 'Metastasis'][g];
      for (var i = 0; i < 6; i++) {
        samples.push(gname.slice(0, 2).toUpperCase() + (i + 1));
        groups.push(gname);
      }
    }
    var rows = [['Gene'].concat(samples).join('\t')];
    HEAT_GENES.forEach(function (g, j) {
      var mod = j % 6, base = 6 + (j % 5) * 0.4;
      var vals = samples.map(function (s, si) {
        var gi = Math.floor(si / 6);
        var eff = (mod === 0 || mod === 1) && gi > 0 ? 2.4 + gi * 0.8
          : (mod === 2) && gi === 0 ? 2.0
            : (mod === 3) && gi > 0 ? 1.5 + gi * 0.6
              : (mod === 4) && gi === 2 ? 1.7 : 0;
        return (base + eff + rng.n(0, 0.45)).toFixed(3);
      });
      rows.push([g].concat(vals).join('\t'));
    });
    return { text: rows.join('\n'), groups: groups, samples: samples };
  }

  /* ------------------------- 6. 富集分析示例 ----------------------------- */

  // 一份"肿瘤增殖型"差异基因示例：以细胞周期为主，混有少量 DNA 损伤/凋亡/免疫/代谢基因
  var DEMO_GENE_LIST = ('CDK1 CCNB1 CCNB2 CCNA2 CDK2 CCNE1 MKI67 BUB1 BUB1B AURKA AURKB PLK1 TOP2A ' +
    'CENPF NDC80 NUF2 KIF11 ANLN PTTG1 UBE2C BIRC5 ESPL1 MAD2L1 RRM2 TYMS CDKN3 CDC20 CDC25C ' +
    'MCM2 MCM3 MCM4 MCM5 MCM6 MCM7 PCNA RFC4 RPA2 FEN1 LIG1 PRIM1 GINS1 CDT1 ORC1 WEE1 TTK ' +
    'SMC2 SMC4 NCAPG NCAPH KIF2C SPC25 ZW10 BUB3 CENPE KIF23 KNL1 SGOL1 NDC1 SKA1 HAUS8 TACC3 ' +
    'ATM ATR CHEK1 MDC1 RAD50 MRE11A NBN RAD51C FANCD2 FANCA CDKN1A GADD45A DDB2 ' +
    'BAX BAK1 CASP3 CASP9 APAF1 CYCS BCL2 MCL1 BID PMAIP1 ' +
    'COL1A1 COL3A1 FN1 VIM ACTA2 MMP2 LOX POSTN ' +
    'HK2 LDHA PKM SLC2A1 ENO1 PGK1 HIF1A PFKFB3 ' +
    'CD8A PDCD1 IFNG GZMB NKG7 TIGIT').split(/\s+/);

  // 内置示例基因集（真实成员基因，但仅为小型示例，非完整通路注释库）
  var DEMO_GMT_SETS = [
    ['CELL_CYCLE_MITOTIC', '有丝分裂与细胞周期进程（示例）',
      'CDK1 CCNB1 CCNB2 CCNA2 CDK2 CCNE1 MKI67 BUB1 BUB1B AURKA AURKB PLK1 TOP2A CENPF NDC80 NUF2 KIF11 ANLN PTTG1 UBE2C BIRC5 ESPL1 MAD2L1 CDKN3 CDC20 CDC25C SMC2 SMC4 NCAPG NCAPH KIF2C SPC25 ZW10 BUB3 CENPE KIF23 KNL1 SGOL1 SKA1 HAUS8 TACC3 TTK WEE1 CHEK2'],
    ['DNA_REPLICATION', 'DNA 复制与修复（示例）',
      'MCM2 MCM3 MCM4 MCM5 MCM6 MCM7 PCNA RFC1 RFC4 RPA1 RPA2 POLA1 POLD1 POLE FEN1 LIG1 PRIM1 GINS1 CDT1 ORC1 ORC6 MSH2 MSH6 MLH1 PMS2 EXO1 PARP1 RAD51 BRCA1 BRCA2 ATM CHEK2 RAD50 MRE11A NBN'],
    ['P53_SIGNALING', 'p53 信号通路（示例）',
      'TP53 MDM2 CDKN1A CDKN2A BAX BBC3 PMAIP1 CASP3 CASP9 APAF1 CYCS BCL2 BCL2L1 BID BAD ATM CHEK2 GADD45A PCNA RRM2 TYMS SFN ZMAT3 TIGAR DDB2'],
    ['APOPTOSIS', '细胞凋亡（示例）',
      'BAX BAK1 BID BAD BBC3 PMAIP1 CASP3 CASP7 CASP8 CASP9 CASP10 APAF1 CYCS DIABLO XIAP BCL2 BCL2L1 BCL2L11 MCL1 BIRC2 BIRC3 CFLAR FADD FAS TNFRSF10A TNFRSF10B TNF'],
    ['GLYCOLYSIS', '糖酵解（示例）',
      'HK2 PFKM PFKL ALDOA GAPDH PGK1 PKM LDHA ENO1 ENO2 SLC2A1 SLC2A3 PDK1 PDK3 G6PD TALDO1 TKT HIF1A SLC16A1 SLC16A3 PFKFB3 PGAM1 TPI1'],
    ['OXIDATIVE_PHOSPHORYLATION', '氧化磷酸化（示例）',
      'NDUFA1 NDUFA2 NDUFA4 NDUFB2 NDUFS1 NDUFV1 SDHA SDHB SDHC SDHD UQCRC1 UQCRC2 CYC1 COX4I1 COX5A COX6A1 ATP5F1A ATP5F1B ATP5MC1 ATP5PB VDAC1 VDAC2 ANT1'],
    ['ECM_REMODELING', '细胞外基质重塑（示例）',
      'COL1A1 COL1A2 COL3A1 COL4A1 COL5A1 FN1 FBN1 LUM DCN SPARC LOX MMP2 MMP9 TIMP1 TIMP2 TGFB1 ITGB1 ITGA5 THBS1 CTGF POSTN'],
    ['EMT', '上皮-间质转化（示例）',
      'CDH1 CDH2 ZEB1 ZEB2 SNAI1 SNAI2 TWIST1 TWIST2 TGFB1 TGFB2 TGFBR1 SMAD2 SMAD3 SMAD4 VIM ACTA2 TAGLN FN1 MMP2 MMP9 COL1A1'],
    ['INFLAMMATORY_RESPONSE', '炎症反应（示例）',
      'TNF IL6 IL1B CXCL8 CCL2 CXCL10 NFKB1 RELA RELB NFKBIA TLR4 MYD88 STAT1 STAT3 IRF1 IRF3 JAK1 JAK2 IFNG IFNB1 PTGS2 NLRP3'],
    ['T_CELL_EXHAUSTION', 'T 细胞耗竭（示例）',
      'PDCD1 CD274 CTLA4 LAG3 HAVCR2 TIGIT CD8A CD4 CD3D CD3E IFNG GZMB PRF1 NKG7 KLRD1 TOX BATF IRF4 EOMES TBX21'],
    ['PI3K_AKT_MTOR', 'PI3K-Akt-mTOR 通路（示例）',
      'PIK3CA PIK3CB PIK3R1 AKT1 AKT2 MTOR RPTOR RICTOR PTEN TSC1 TSC2 RHEB RPS6KB1 EIF4EBP1 GSK3B FOXO1 FOXO3 EGFR ERBB2 IGF1R IRS1'],
    ['MAPK_SIGNALING', 'MAPK 信号通路（示例）',
      'KRAS NRAS HRAS BRAF RAF1 MAP2K1 MAP2K2 MAPK1 MAPK3 MAPK8 MAPK14 ARAF EGFR ERBB2 MET FGF2 FGFR1 JUN FOS MYC EGR1'],
    ['MYC_TARGETS', 'MYC 靶基因（示例）',
      'MYC MYCN CCND2 CDK4 CDKN2A LDHA PKM ENO1 HK2 ODC1 NCL NPM1 EIF4E SRM RRM2 TYMS CAD'],
    ['HALLMARK_HYPOXIA', '缺氧应答（示例）',
      'HIF1A EPAS1 ARNT VHL EGLN1 CA9 VEGFA SLC2A1 SLC2A3 LDHA PDK1 PGK1 ENO1 SLC16A1 SLC16A3 HK2 PFKFB3 ANGPT2'],
    ['IMMUNE_CHECKPOINT', '免疫检查点（示例）',
      'PDCD1 CD274 CTLA4 LAG3 HAVCR2 TIGIT CD80 CD86 CD28 ICOS IDO1 CD276 VSIR LGALS9'],
    ['DNA_DAMAGE_RESPONSE', 'DNA 损伤应答（示例）',
      'ATM ATR CHEK1 CHEK2 TP53 H2AFX MDC1 RAD50 MRE11A NBN BRCA1 BRCA2 PALB2 RAD51 RAD51C FANCD2 FANCA H2AX CDKN1A GADD45A']
  ];

  function buildGMT() {
    return DEMO_GMT_SETS.map(function (s) {
      return [s[0], s[1]].concat(s[2].split(/\s+/)).join('\t');
    }).join('\n');
  }

  /* --------------------- 7. 差异表达分析示例（矩阵 + 分组） --------------- */

  // 已知真实效应的基因，便于验证统计结果是否落在预期方向
  var DE_UP = ('MKI67 CCNB1 CCNB2 CCNA2 CDK1 AURKA BUB1 TOP2A RRM2 TYMS MCM2 PLK1').split(/\s+/);
  var DE_DOWN = ('CD3D CD8A PDCD1 IFNG GZMB NKG7 LAG3 TIGIT').split(/\s+/);

  function buildDiffexp() {
    var rng = makeRng(20261201);
    var groups = ['Control', 'Treat24h', 'Treat72h'];
    var nPer = 6;

    // 无效应基因（阴性对照）：从基因池中取，排除已知效应基因
    var used = {};
    DE_UP.concat(DE_DOWN).forEach(function (g) { used[g] = 1; });
    var nullGenes = rng.shuffle(GENES.filter(function (g) {
      return !used[g];
    })).slice(0, 26);

    var samples = [], sampleGroups = [];
    groups.forEach(function (grp) {
      var p = { Control: 'C', Treat24h: 'T24_', Treat72h: 'T72_' }[grp];
      for (var i = 0; i < nPer; i++) {
        samples.push(p + String(i + 1));
        sampleGroups.push(grp);
      }
    });

    // 处理效应：24 h 中等、72 h 更强；阴性基因恒为 0
    var effByGroup = { Control: 0, Treat24h: 1, Treat72h: 2 };
    var rows = [['Gene'].concat(samples).join('\t')];
    var meta = [];
    DE_UP.forEach(function (g) { meta.push({ g: g, kind: 'up', base: 7.4 + rng.u() * 1.6 }); });
    DE_DOWN.forEach(function (g) { meta.push({ g: g, kind: 'down', base: 8.6 + rng.u() * 1.4 }); });
    nullGenes.forEach(function (g) { meta.push({ g: g, kind: 'null', base: 7.8 + rng.u() * 2.4 }); });

    meta.forEach(function (mt) {
      var vals = samples.map(function (s, si) {
        var gi = effByGroup[sampleGroups[si]];
        var eff = mt.kind === 'up' ? [0, 1.35, 2.55][gi]
          : mt.kind === 'down' ? [0, -1.05, -1.95][gi] : 0;
        return (mt.base + eff + rng.n(0, 0.42)).toFixed(3);
      });
      rows.push([mt.g].concat(vals).join('\t'));
    });

    var ann = ['Sample\tGroup'].concat(samples.map(function (s, i) {
      return s + '\t' + sampleGroups[i];
    })).join('\n');

    return { text: rows.join('\n'), groups: ann };
  }

  var DIFFEXP = buildDiffexp();

  /* ------------------------- 8. 网络图示例（共表达模块） ---------------- */

  function buildNetwork() {
    var rng = makeRng(90210);
    var mods = [
      { name: 'Cell cycle', genes: 'MKI67 CCNB1 CCNA2 CDK1 AURKA BUB1 TOP2A PLK1 RRM2 TYMS'.split(' ') },
      { name: 'Immune', genes: 'CD3D CD8A PDCD1 LAG3 TIGIT IFNG GZMB NKG7'.split(' ') },
      { name: 'ECM', genes: 'COL1A1 COL3A1 FN1 VIM TWIST1 SNAI1 ZEB1'.split(' ') }
    ];
    var edges = ['Source\tTarget\tWeight\tType'];
    mods.forEach(function (m) {
      for (var i = 0; i < m.genes.length; i++) {
        for (var j = i + 1; j < m.genes.length; j++) {
          if (rng.u() < 0.55) {
            var w = 0.62 + rng.u() * 0.33;
            edges.push([m.genes[i], m.genes[j], w.toFixed(3), 'positive'].join('\t'));
          }
        }
      }
    });
    /* 模块之间的负相关（细胞周期 vs 免疫、免疫 vs ECM 等） */
    [['MKI67', 'CD3D'], ['TOP2A', 'CD8A'], ['PLK1', 'IFNG'],
      ['CD3D', 'COL1A1'], ['CD8A', 'VIM'], ['FN1', 'CCNB1'], ['VIM', 'AURKA'], ['TWIST1', 'NKG7']
    ].forEach(function (p) {
      edges.push([p[0], p[1], (-(0.48 + rng.u() * 0.2)).toFixed(3), 'negative'].join('\t'));
    });
    var nodes = ['Node\tGroup'];
    mods.forEach(function (m) {
      m.genes.forEach(function (g) { nodes.push(g + '\t' + m.name); });
    });
    return { edges: edges.join('\n'), nodes: nodes.join('\n') };
  }

  var NETWORK = buildNetwork();

  /* ------------------------- 9. 生存分析示例 ---------------------------- */

  function buildSurvival() {
    var rng = makeRng(31415926);
    var rows = ['Sample\tTime\tStatus\tGroup'];
    // 高风险组中位生存期短、低风险组长；两组差异应能被 log-rank 检出
    var defs = [
      { name: 'High risk', prefix: 'HR', lam: 1 / 16, n: 45 },
      { name: 'Low risk', prefix: 'LR', lam: 1 / 44, n: 45 }
    ];
    var maxFollow = 72;   // 最长随访 72 个月（行政删失）
    defs.forEach(function (d) {
      for (var i = 0; i < d.n; i++) {
        var eventT = -Math.log(Math.max(1e-12, rng.u())) / d.lam;      // 指数分布生存时间
        var lossT = -Math.log(Math.max(1e-12, rng.u())) * 55 + 4;      // 随机失访
        var obs = Math.min(eventT, lossT, maxFollow);
        var status = (eventT <= lossT && eventT <= maxFollow) ? 1 : 0;
        rows.push([d.prefix + String(i + 1).padStart(2, '0'),
          obs.toFixed(1), String(status), d.name].join('\t'));
      }
    });
    return rows.join('\n');
  }

  /* ---------------------- 10. 序列与蛋白工具示例 ------------------------- */

  function wrapSeq(s, w) {
    var out = [];
    for (var i = 0; i < s.length; i += w) out.push(s.slice(i, i + w));
    return out.join('\n');
  }

  function buildSequence() {
    var rng = makeRng(27182818);
    var bases = ['A', 'C', 'G', 'T'];
    function randSeq(n) {
      var s = '';
      for (var i = 0; i < n; i++) s += bases[Math.floor(rng.u() * 4)];
      return s;
    }
    // 构造一段 306 bp 的编码序列：ATG 起始、以 TAA 终止、内部不含终止密码子
    var stops = { TAA: 1, TAG: 1, TGA: 1 };
    var cds = 'ATG';
    while (cds.length < 300) {
      var c = bases[Math.floor(rng.u() * 4)] + bases[Math.floor(rng.u() * 4)] + bases[Math.floor(rng.u() * 4)];
      if (stops[c]) continue;
      cds += c;
    }
    cds += 'TAA';
    var utr = randSeq(180);
    // 示例蛋白序列（393 aa，人源 p53 型序列）
    var prot = 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD';
    return [
      '>example_CDS_1 example coding sequence (306 bp, complete ORF)',
      wrapSeq(cds, 60),
      '>example_noncoding_1 example non-coding sequence (180 bp)',
      wrapSeq(utr, 60),
      '>example_protein_1 example protein sequence (393 aa)',
      wrapSeq(prot, 60)
    ].join('\n');
  }

  /* -------------------------- 11. ROC 分析示例 -------------------------- */

  function buildROC() {
    var rng = makeRng(60606060);
    var nPer = 60;
    var labels = [];
    for (var i = 0; i < nPer; i++) { labels.push(1); labels.push(0); }
    labels = rng.shuffle(labels);
    // 三个标记物的判别能力依次降低（效应量 d ≈ 1.6 / 0.9 / 0.25）
    var rows = ['Sample\tLabel\tMarker_A\tMarker_B\tMarker_C'];
    labels.forEach(function (y, i) {
      var a = rng.n(y ? 1.6 : 0, 1);
      var b = rng.n(y ? 0.9 : 0, 1);
      var c = rng.n(y ? 0.25 : 0, 1);
      rows.push(['S' + String(i + 1).padStart(3, '0'), y ? 'Positive' : 'Negative',
        a.toFixed(3), b.toFixed(3), c.toFixed(3)].join('\t'));
    });
    return rows.join('\n');
  }

  /* --------------------- 12. 去重与唯一化示例 --------------------------- */

  function buildUnique() {
    // 刻意包含三类常见问题：完全重复行、同一基因对应多个探针、大小写/空白不一致
    var data = [
      ['A_23_P1001', 'TP53', '8.42', '17'],
      ['A_23_P1001', 'TP53', '8.42', '17'],      // 整行完全重复
      ['A_23_P1002', 'tp53 ', '8.05', '17'],     // 同一基因，大小写与首尾空白不一致
      ['A_23_P1003', 'TP53', '7.88', '17'],      // 同一基因，不同探针
      ['A_23_P1004', 'MKI67', '11.20', '10'],
      ['A_23_P1004', 'MKI67', '11.20', '10'],    // 整行完全重复
      ['A_23_P1005', 'MKI67', '10.85', '10'],
      ['A_23_P1006', ' MKI67', '11.02', '10'],
      ['A_23_P1007', 'CD8A', '6.30', '2'],
      ['A_23_P1008', 'CD8A', '6.55', '2'],
      ['A_23_P1009', 'CD8A', '6.30', '2'],
      ['A_23_P1010', 'COL1A1', '9.10', '17'],
      ['A_23_P1011', 'COL1A1', '9.10', '17'],
      ['A_23_P1011', 'COL1A1', '9.10', '17'],    // 整行完全重复
      ['A_23_P1012', 'VIM', '12.40', '10'],
      ['A_23_P1013', 'VIM', '12.10', '10'],
      ['A_23_P1014', 'HK2', '8.75', '2'],
      ['A_23_P1015', 'LDHA', '9.60', '11'],
      ['A_23_P1016', 'LDHA', '9.60', '11'],
      ['A_23_P1017', 'EGFR', '7.20', '7'],
      ['A_23_P1018', 'KRAS', '7.95', '12'],
      ['A_23_P1019', 'MYC', '10.40', '8'],
      ['A_23_P1020', 'MYC', '10.40', '8'],
      ['A_23_P1020', 'MYC', '10.40', '8'],       // 整行完全重复
      ['A_23_P1021', 'PTEN', '6.80', '10'],
      ['A_23_P1022', 'BRCA1', '7.05', '17'],
      ['A_23_P1023', 'BRCA1', '7.05', '17'],
      ['A_23_P1024', 'CCNB1', '9.90', '5'],
      ['A_23_P1025', 'CCNB1', '9.35', '5']
    ];
    return ['ProbeID\tGene\tExpression\tChromosome']
      .concat(data.map(function (r) { return r.join('\t'); })).join('\n');
  }

  /* ----------------- 13. 小提琴图示例（三列，每列 24 个观测） -------------- */

  function buildViolin() {
    var rng = makeRng(70707070);
    var mus = [7.20, 10.00, 8.20], sds = [0.55, 0.62, 0.48];
    var n = 24;
    var cols = mus.map(function (mu, gi) {
      var out = [];
      for (var i = 0; i < n; i++) out.push(rng.n(mus[gi], sds[gi]));
      return out;
    });
    var rows = ['SampleID\tControl\tTreated\tRescue'];
    for (var i2 = 0; i2 < n; i2++) {
      rows.push('S' + String(i2 + 1).padStart(2, '0') + '\t' +
        cols[0][i2].toFixed(3) + '\t' + cols[1][i2].toFixed(3) + '\t' + cols[2][i2].toFixed(3));
    }
    return rows.join('\n');
  }

  /* --------------------- 14. 组分占比示例（饼图 / 旭日图） ---------------- */

  function buildPie() {
    return ['CellType\tCount',
      'T cells\t412',
      'B cells\t168',
      'Macrophages\t233',
      'Fibroblasts\t120',
      'Endothelial\t67',
      'NK cells\t31',
      'Neutrophils\t54'].join('\n');
  }

  function buildPieSunburst() {
    return ['Lineage\tCellType\tCount',
      'Immune\tT cells\t412',
      'Immune\tB cells\t168',
      'Immune\tMacrophages\t233',
      'Immune\tNK cells\t31',
      'Stromal\tFibroblasts\t120',
      'Stromal\tEndothelial\t67',
      'Other\tNeutrophils\t54'].join('\n');
  }

  /* ----------- 15. 折线图示例（宽表，每个时间点 6 个重复） ---------------- */

  function buildLine() {
    var rng = makeRng(80808080);
    var times = [0, 6, 12, 24, 48];
    var amps = [0.80, 2.20, 3.60], taus = [12, 18, 20];
    var nRep = 6;
    var rows = ['Time\tControl\tLowDose\tHighDose'];
    times.forEach(function (t) {
      for (var r = 0; r < nRep; r++) {
        var vals = amps.map(function (amp, gi) {
          return 1 + amp * (1 - Math.exp(-t / taus[gi])) + rng.n(0, 0.07);
        });
        rows.push(String(t) + '\t' + vals.map(function (v) { return v.toFixed(3); }).join('\t'));
      }
    });
    return rows.join('\n');
  }

  /* ------------- 16. 三维散点图示例（三组，每组 14 个样本） ---------------- */

  function buildScatter3D() {
    var rng = makeRng(90909090);
    var groups = [
      { name: 'Tumor', c: [2.60, -1.20, 0.40] },
      { name: 'Normal', c: [-2.40, 1.30, -0.30] },
      { name: 'Border', c: [0.10, 0.10, 1.60] }
    ];
    var rows = ['Sample\tPC1\tPC2\tPC3\tGroup'];
    var id = 0;
    groups.forEach(function (g) {
      for (var i = 0; i < 14; i++) {
        id++;
        rows.push(['S' + String(id).padStart(3, '0'),
          (g.c[0] + rng.n(0, 0.72)).toFixed(4),
          (g.c[1] + rng.n(0, 0.72)).toFixed(4),
          (g.c[2] + rng.n(0, 0.72)).toFixed(4),
          g.name].join('\t'));
      }
    });
    return rows.join('\n');
  }

  /* ----- 17. 统计检验示例（宽表，10 名受试者 × 3 组，重复测量设计） ------- */

  function buildStatTest() {
    var rng = makeRng(12121212);
    var n = 10;
    var base = [12.40, 17.80, 14.00];
    var rows = ['Subject\tControl\tTreated\tRescue'];
    for (var i = 0; i < n; i++) {
      var subj = rng.n(0, 1.10);            // 受试者随机效应（形成配对结构）
      var vals = base.map(function (b) { return b + subj * 0.80 + rng.n(0, 0.50); });
      rows.push('P' + String(i + 1).padStart(2, '0') + '\t' +
        vals.map(function (v) { return v.toFixed(2); }).join('\t'));
    }
    return rows.join('\n');
  }

  WB.demo = {
    rng: makeRng, GENES: GENES,
    sets: SETS,
    vennLong: setsToLong(SETS),
    vennWide: setsToWide(SETS),
    vennColumns: setsToColumns(SETS),
    corrText: buildCorr(),
    corrGenes: CORR_GENES,
    pcaText: buildPCA(),
    pcaGenes: PCA_GENES,
    volcanoText: buildVolcano(),
    heatmapText: buildHeatmap().text,
    heatmapGroups: buildHeatmap().groups,
    heatmapSamples: buildHeatmap().samples,
    heatGenes: HEAT_GENES,
    geneList: DEMO_GENE_LIST.join('\n'),
    gmtText: buildGMT(),
    gmtSets: DEMO_GMT_SETS,
    diffexpText: DIFFEXP.text,
    diffexpGroups: DIFFEXP.groups,
    diffexpTrueUp: DE_UP,
    diffexpTrueDown: DE_DOWN,
    networkEdges: NETWORK.edges,
    networkNodes: NETWORK.nodes,
    survivalText: buildSurvival(),
    sequenceText: buildSequence(),
    rocText: buildROC(),
    uniqueText: buildUnique(),
    violinText: buildViolin(),
    pieText: buildPie(),
    pieSunburstText: buildPieSunburst(),
    lineText: buildLine(),
    scatter3dText: buildScatter3D(),
    stattestText: buildStatTest()
  };
})(window);
