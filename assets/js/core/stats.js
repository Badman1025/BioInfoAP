/* =============================================================================
 * core/stats.js  —  纯 JS 统计内核（无外部依赖）
 * 包含：特殊函数 / 假设检验 / 多重检验校正 / 相关系数 / 线性代数 / PCA / 层次聚类
 * ========================================================================== */
(function (global) {
  'use strict';
  var WB = global.WB = global.WB || {};

  /* ----------------------------- 特殊函数 -------------------------------- */

  // Lanczos 近似 log(gamma(x))，x > 0
  var LANCZOS_G = 7;
  var LANCZOS_C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  function gammaln(x) {
    if (x < 0.5) {
      // 反射公式
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - gammaln(1 - x);
    }
    x -= 1;
    var a = LANCZOS_C[0], t = x + LANCZOS_G + 0.5;
    for (var i = 1; i < LANCZOS_C.length; i++) a += LANCZOS_C[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  // log(C(n,k))
  function logChoose(n, k) {
    if (k < 0 || k > n) return -Infinity;
    return gammaln(n + 1) - gammaln(k + 1) - gammaln(n - k + 1);
  }
  function choose(n, k) { return Math.exp(logChoose(n, k)); }

  // 连续分数（Numerical Recipes）
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  // 正则化不完全 Beta 函数 I_x(a,b)
  function betai(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) +
      a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  // 标准正态分布 CDF
  function pnorm(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
      a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var t = 1 / (1 + p * x);
    var y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return s * y;
  }

  /* --------------------------- 分布函数 / p 值 ---------------------------- */

  // 超几何分布概率质量函数: P(X = k)
  function dhyper(k, m, n, K) {
    // m: 白球数(某基因集大小)  n: 黑球数(N-m)  K: 抽样数(输入基因数)
    return Math.exp(dhyperLog(k, m, n, K));
  }
  function dhyperLog(k, m, n, K) {
    var N = m + n;
    if (k < 0 || k > m || K - k < 0 || K - k > n) return -Infinity;
    return logChoose(m, k) + logChoose(n, K - k) - logChoose(N, K);
  }
  function dhyperLower(k, m, n, K) {
    if (k < 0) return 0;
    var hi = Math.min(m, K), s = 0;
    for (var i = 0; i <= Math.min(k, hi); i++) s += Math.exp(dhyperLog(i, m, n, K));
    return Math.min(1, s);
  }
  // 富集分析主用：上尾 P(X >= k)
  // 策略：比较上下两尾的项数，取项数少的一侧求和，另一侧用 1 减去，避免大范围求和
  function hypergeomSf(k, m, n, K) {
    var hi = Math.min(m, K), lo = Math.max(0, K - n);
    if (k <= lo) return 1;
    if (k > hi) return 0;
    var nUpper = hi - k + 1, nLower = k - lo;
    if (nUpper <= nLower) return sumRangeLog(k, hi, m, n, K);
    return Math.max(0, 1 - sumRangeLog(lo, k - 1, m, n, K));
  }
  function sumRangeLog(a, b, m, n, K) {
    if (b < a) return 0;
    var mx = -Infinity, i, l;
    for (i = a; i <= b; i++) { l = dhyperLog(i, m, n, K); if (l > mx) mx = l; }
    if (mx === -Infinity) return 0;
    var s = 0;
    for (i = a; i <= b; i++) s += Math.exp(dhyperLog(i, m, n, K) - mx);
    return Math.min(1, Math.exp(mx) * s);
  }
  // 超几何检验完整结果：greater(过表征，默认) / less / two-sided
  function hypergeomTest(k, m, n, K, alternative) {
    alternative = alternative || 'greater';
    var p;
    if (alternative === 'greater') {
      p = hypergeomSf(k, m, n, K);
    } else if (alternative === 'less') {
      p = dhyperLower(k, m, n, K);
    } else { // two-sided: 概率不超过观测概率的所有取值之和
      var hi = Math.min(m, K), pobs = Math.exp(dhyperLog(k, m, n, K)), s = 0;
      for (var i = Math.max(0, K - n); i <= hi; i++) {
        var pi = Math.exp(dhyperLog(i, m, n, K));
        if (pi <= pobs * (1 + 1e-9)) s += pi;
      }
      p = Math.min(1, s);
    }
    // 优势比 OR = (k/(K-k)) / ((m-k)/(n-K+k))
    var a = k, b = K - k, c = m - k, d = n - (K - k);
    var or = (a * d) / (b * c);
    if (!isFinite(or)) or = (a > 0 && b === 0) ? Infinity : ((a === 0) ? 0 : or);
    return { p: p, oddsRatio: or };
  }

  // Student t 双侧 p 值
  function tTestP(t, df) {
    if (!isFinite(t) || df <= 0) return NaN;
    return betai(df / 2, 0.5, df / (df + t * t));
  }

  /* --------------------------- 多重检验校正 ------------------------------ */

  function pAdjust(pvals, method) {
    method = (method || 'BH').toUpperCase();
    var n = pvals.length, out = new Array(n);
    if (n === 0) return out;
    if (method === 'NONE' || method === 'NOMINAL') return pvals.slice();
    if (method === 'BONFERRONI' || method === 'BONF') {
      for (var i = 0; i < n; i++) out[i] = Math.min(1, pvals[i] * n);
      return out;
    }
    if (method === 'HOLM') {
      var idxH = pvals.map(function (p, i) { return i; })
        .sort(function (a, b) { return pvals[a] - pvals[b]; });
      var run = 0;
      for (var r = 0; r < n; r++) {
        var v = (n - r) * pvals[idxH[r]];
        run = Math.max(run, v);
        out[idxH[r]] = Math.min(1, run);
      }
      return out;
    }
    // Benjamini-Hochberg
    var idx = pvals.map(function (p, i) { return i; })
      .sort(function (a, b) { return pvals[a] - pvals[b]; });
    var prev = 1;
    for (var r2 = n - 1; r2 >= 0; r2--) {
      var q = pvals[idx[r2]] * n / (r2 + 1);
      prev = Math.min(prev, q);
      out[idx[r2]] = Math.min(1, prev);
    }
    return out;
  }

  /* ------------------------------ 描述统计 ------------------------------- */

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { return a.length ? sum(a) / a.length : NaN; }
  function variance(a) {
    var n = a.length; if (n < 2) return NaN;
    var m = mean(a), s = 0;
    for (var i = 0; i < n; i++) { var d = a[i] - m; s += d * d; }
    return s / (n - 1);
  }
  function stdev(a) { return Math.sqrt(variance(a)); }
  function median(a) { return quantile(a, 0.5); }
  function quantile(a, q) {
    if (!a.length) return NaN;
    var b = a.slice().sort(function (x, y) { return x - y; });
    var pos = (b.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    if (lo === hi) return b[lo];
    return b[lo] + (b[hi] - b[lo]) * (pos - lo);
  }
  function min(a) { return Math.min.apply(null, a); }
  function max(a) { return Math.max.apply(null, a); }
  function range(a) { return max(a) - min(a); }

  // 平均秩（并列取平均）
  function rank(arr) {
    var n = arr.length;
    var idx = arr.map(function (v, i) { return { v: v, i: i }; })
      .sort(function (a, b) { return a.v - b.v; });
    var out = new Array(n), i = 0;
    while (i < n) {
      var j = i;
      while (j + 1 < n && idx[j + 1].v === idx[i].v) j++;
      var avg = (i + j) / 2 + 1;
      for (var k = i; k <= j; k++) out[idx[k].i] = avg;
      i = j + 1;
    }
    return out;
  }

  /* ---------------------------- 相关系数 -------------------------------- */

  function pearson(x, y) {
    var n = Math.min(x.length, y.length);
    if (n < 3) return { r: NaN, p: NaN, n: n, df: n - 2 };
    var mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
    mx /= n; my /= n;
    var sxy = 0, sxx = 0, syy = 0;
    for (i = 0; i < n; i++) {
      var dx = x[i] - mx, dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    if (sxx === 0 || syy === 0) return { r: NaN, p: NaN, n: n, df: n - 2 };
    var r = sxy / Math.sqrt(sxx * syy);
    r = Math.max(-1, Math.min(1, r));
    var t = r * Math.sqrt((n - 2) / Math.max(1e-300, 1 - r * r));
    return { r: r, p: tTestP(t, n - 2), t: t, n: n, df: n - 2 };
  }

  function spearman(x, y) {
    var n = Math.min(x.length, y.length);
    if (n < 3) return { r: NaN, p: NaN, n: n, df: n - 2 };
    var res = pearson(rank(x.slice(0, n)), rank(y.slice(0, n)));
    res.n = n; res.df = n - 2;
    return res;
  }

  // Kendall tau-b（含并列校正）+ 正态近似 p 值
  function kendallTauB(x, y) {
    var n = Math.min(x.length, y.length);
    if (n < 3) return { r: NaN, p: NaN, n: n };
    var conc = 0, disc = 0, tx = {}, ty = {}, i, j;
    for (i = 0; i < n; i++) {
      tx[x[i]] = (tx[x[i]] || 0) + 1;
      ty[y[i]] = (ty[y[i]] || 0) + 1;
    }
    for (i = 0; i < n - 1; i++) {
      for (j = i + 1; j < n; j++) {
        var a = x[i] - x[j], b = y[i] - y[j];
        if (a === 0 || b === 0) continue;
        if ((a > 0) === (b > 0)) conc++; else disc++;
      }
    }
    var n0 = n * (n - 1) / 2, n1 = 0, n2 = 0;
    Object.keys(tx).forEach(function (k) { var t = tx[k]; n1 += t * (t - 1) / 2; });
    Object.keys(ty).forEach(function (k) { var t = ty[k]; n2 += t * (t - 1) / 2; });
    var denom = Math.sqrt((n0 - n1) * (n0 - n2));
    var tau = denom === 0 ? NaN : (conc - disc) / denom;
    var p = NaN;
    if (isFinite(tau)) {
      var v = 2 * (2 * n + 5) / (9 * n * (n - 1));
      var z = tau / Math.sqrt(v);
      p = 2 * (1 - pnorm(Math.abs(z)));
    }
    return { r: tau, p: p, n: n, conc: conc, disc: disc, tieX: n1, tieY: n2, method: 'kendall' };
  }

  var CORR_METHODS = {
    pearson: function (x, y) { var o = pearson(x, y); o.method = 'pearson'; return o; },
    spearman: function (x, y) { var o = spearman(x, y); o.method = 'spearman'; return o; },
    kendall: function (x, y) { return kendallTauB(x, y); }
  };

  // 相关矩阵（含 p 值与 FDR）
  function corrMatrix(cols, method) {
    var fn = CORR_METHODS[method] || CORR_METHODS.pearson;
    var p = cols.length;
    var R = [], P = [], pv = [];
    for (var i = 0; i < p; i++) {
      R.push(new Array(p)); P.push(new Array(p));
      for (var j = 0; j < p; j++) {
        if (i === j) { R[i][j] = 1; P[i][j] = 0; }
        else if (j < i) { R[i][j] = R[j][i]; P[i][j] = P[j][i]; }
        else {
          var r = fn(cols[i].values, cols[j].values);
          R[i][j] = r.r; P[i][j] = r.p; pv.push(r.p);
        }
      }
    }
    var q = pAdjust(pv, 'BH'), c = 0;
    for (var a = 0; a < p; a++) for (var b = a + 1; b < p; b++) { P[a][b] = P[a][b]; }
    // 回填 FDR
    var Q = [];
    for (var i2 = 0; i2 < p; i2++) Q.push(new Array(p).fill(0));
    for (var a2 = 0; a2 < p; a2++) for (var b2 = a2 + 1; b2 < p; b2++) {
      Q[a2][b2] = Q[b2][a2] = q[c]; c++;
    }
    return { R: R, P: P, Q: Q, cols: cols, method: method };
  }

  /* ---------------------------- 线性代数 -------------------------------- */

  function matT(A) {
    var r = A.length, c = A[0].length, B = [];
    for (var j = 0; j < c; j++) { var row = new Array(r); for (var i = 0; i < r; i++) row[i] = A[i][j]; B.push(row); }
    return B;
  }
  function matMul(A, B) {
    var n = A.length, m = B[0].length, k = B.length;
    var C = [];
    for (var i = 0; i < n; i++) {
      var row = new Array(m).fill(0);
      for (var t = 0; t < k; t++) {
        var a = A[i][t]; if (a === 0) continue;
        var bt = B[t];
        for (var j = 0; j < m; j++) row[j] += a * bt[j];
      }
      C.push(row);
    }
    return C;
  }
  function identity(n) {
    var I = [];
    for (var i = 0; i < n; i++) { var r = new Array(n).fill(0); r[i] = 1; I.push(r); }
    return I;
  }

  // 对称矩阵 Jacobi 特征分解，返回 {values: 降序, vectors: [列向量]}
  function jacobiEigen(Ain, maxSweeps) {
    var n = Ain.length;
    if (n === 1) return { values: [Ain[0][0]], vectors: [[1]] };
    var a = Ain.map(function (r) { return r.slice(); });
    var v = identity(n);
    maxSweeps = maxSweeps || 100;
    for (var sweep = 0; sweep < maxSweeps; sweep++) {
      var off = 0;
      for (var p = 0; p < n - 1; p++) {
        for (var q = p + 1; q < n; q++) {
          var apq = a[p][q];
          if (Math.abs(apq) < 1e-14) continue;
          off += apq * apq;
          var theta = (a[q][q] - a[p][p]) / (2 * apq);
          var t = theta >= 0
            ? 1 / (theta + Math.sqrt(theta * theta + 1))
            : -1 / (-theta + Math.sqrt(theta * theta + 1));
          var c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (var i = 0; i < n; i++) {
            var aip = a[i][p], aiq = a[i][q];
            a[i][p] = c * aip - s * aiq;
            a[i][q] = s * aip + c * aiq;
          }
          for (var i2 = 0; i2 < n; i2++) {
            var api = a[p][i2], aqi = a[q][i2];
            a[p][i2] = c * api - s * aqi;
            a[q][i2] = s * api + c * aqi;
          }
          for (var i3 = 0; i3 < n; i3++) {
            var vip = v[i3][p], viq = v[i3][q];
            v[i3][p] = c * vip - s * viq;
            v[i3][q] = s * vip + c * viq;
          }
        }
      }
      if (off < 1e-20) break;
    }
    var ev = [];
    for (var d = 0; d < n; d++) ev.push({ val: a[d][d], idx: d });
    ev.sort(function (x, y) { return y.val - x.val; });
    var values = ev.map(function (e) { return e.val; });
    var vectors = [];
    for (var col = 0; col < n; col++) {
      var vec = new Array(n);
      for (var row = 0; row < n; row++) vec[row] = v[row][ev[col].idx];
      vectors.push(vec);
    }
    return { values: values, vectors: vectors };
  }

  /* -------------------------------- PCA --------------------------------- */

  /**
   * @param {number[][]} X  n 样本 × p 变量
   * @param {object} opt {scale:boolean, center:boolean}
   */
  function pca(X, opt) {
    opt = opt || {};
    var n = X.length, p = X[0].length;
    var center = opt.center !== false, scale = opt.scale === true;
    var colMean = new Array(p).fill(0), colSd = new Array(p).fill(1);
    var i, j;
    if (center) {
      for (i = 0; i < p; i++) {
        var s = 0; for (j = 0; j < n; j++) s += X[j][i];
        colMean[i] = s / n;
      }
    }
    if (scale) {
      for (i = 0; i < p; i++) {
        var ss = 0;
        for (j = 0; j < n; j++) { var d = X[j][i] - colMean[i]; ss += d * d; }
        colSd[i] = Math.sqrt(ss / Math.max(1, n - 1)) || 1;
      }
    }
    var Z = [];
    for (j = 0; j < n; j++) {
      var row = new Array(p);
      for (i = 0; i < p; i++) {
        row[i] = (X[j][i] - (center ? colMean[i] : 0)) / (scale ? colSd[i] : 1);
      }
      Z.push(row);
    }
    // 协方差（或相关）矩阵
    var C = [];
    for (i = 0; i < p; i++) C.push(new Array(p).fill(0));
    for (var a = 0; a < p; a++) {
      for (var b = a; b < p; b++) {
        var s2 = 0;
        for (j = 0; j < n; j++) s2 += Z[j][a] * Z[j][b];
        var val = s2 / Math.max(1, n - 1);
        C[a][b] = val; C[b][a] = val;
      }
    }
    var eig = jacobiEigen(C);
    var total = 0;
    for (i = 0; i < eig.values.length; i++) total += Math.max(0, eig.values[i]);
    var explained = eig.values.map(function (v) { return total > 0 ? Math.max(0, v) / total : 0; });
    var scores = matMul(Z, matT(eig.vectors)); // n × p
    return {
      scores: scores, loadings: eig.vectors, eigenvalues: eig.values,
      explained: explained, colMean: colMean, colSd: colSd, Z: Z, n: n, p: p
    };
  }

  /* ---------------------------- 距离与聚类 ------------------------------ */

  var METRICS = {
    euclidean: function (a, b) {
      var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; } return Math.sqrt(s);
    },
    manhattan: function (a, b) {
      var s = 0; for (var i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s;
    },
    maximum: function (a, b) {
      var s = 0; for (var i = 0; i < a.length; i++) { var v = Math.abs(a[i] - b[i]); if (v > s) s = v; } return s;
    },
    cosine: function (a, b) {
      var s = 0, na = 0, nb = 0;
      for (var i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
      if (na === 0 || nb === 0) return 1;
      return 1 - s / (Math.sqrt(na) * Math.sqrt(nb));
    },
    correlation: function (a, b) {
      var n = a.length, ma = 0, mb = 0, i;
      for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
      ma /= n; mb /= n;
      var sxy = 0, sxx = 0, syy = 0;
      for (i = 0; i < n; i++) {
        var da = a[i] - ma, db = b[i] - mb;
        sxy += da * db; sxx += da * da; syy += db * db;
      }
      if (sxx === 0 || syy === 0) return 1;
      return 1 - sxy / Math.sqrt(sxx * syy);
    }
  };

  /**
   * 层次聚类（Lance-Williams 通用更新）
   * @param {number[][]} data 每个元素是一个观测（行）
   * @param {object} opt {metric, method: single|complete|average|ward, distance:(i,j)=>number}
   *   distance：可选，直接给出第 i、j 个观测的距离（如 1−TOM），此时忽略 metric
   * @returns {{tree:object, order:number[], heights:number[]}}
   */
  function hclust(data, opt) {
    opt = opt || {};
    var metric = METRICS[opt.metric] || METRICS.euclidean;
    var method = (opt.method || 'average').toLowerCase();
    var n = data.length;
    if (n === 0) return { tree: null, order: [], heights: [] };
    if (n === 1) return { tree: leafNode(0), order: [0], heights: [] };

    var pairDist = opt.distance
      ? function (i, j) { return opt.distance(i, j); }
      : function (i, j) { return metric(data[i], data[j]); };

    var D = [], i, j;
    for (i = 0; i < n; i++) { D.push(new Array(n).fill(Infinity)); D[i][i] = 0; }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) D[i][j] = D[j][i] = pairDist(i, j);

    var clusters = [], heights = [];
    for (i = 0; i < n; i++) clusters.push({ id: i, size: 1, members: [i], node: leafNode(i), active: true });

    var activeIds = clusters.map(function (c) { return c.id; });
    var nextId = n;

    function lw(dik, djk, dij, ni, nj, nk) {
      switch (method) {
        case 'single': return Math.min(dik, djk);
        case 'complete': return Math.max(dik, djk);
        case 'ward':
          return Math.sqrt(Math.max(0,
            ((ni + nk) * dik * dik + (nj + nk) * djk * djk - nk * dij * dij) / (ni + nj + nk)));
        case 'average':
        default: return (ni * dik + nj * djk) / (ni + nj);
      }
    }

    while (activeIds.length > 1) {
      var bi = -1, bj = -1, bd = Infinity;
      for (var a = 0; a < activeIds.length - 1; a++) {
        for (var b = a + 1; b < activeIds.length; b++) {
          var d = D[activeIds[a]][activeIds[b]];
          if (d < bd) { bd = d; bi = activeIds[a]; bj = activeIds[b]; }
        }
      }
      if (bi < 0) break;
      var ci = clusters[bi], cj = clusters[bj];
      var newCluster = {
        id: nextId, size: ci.size + cj.size,
        members: ci.members.concat(cj.members), active: true,
        node: { height: bd, left: ci.node, right: cj.node, size: ci.size + cj.size }
      };
      clusters.push(newCluster);
      D.push(new Array(nextId + 1).fill(Infinity));
      for (i = 0; i < nextId + 1; i++) D[i][nextId] = D[nextId][i] = Infinity;
      D[nextId][nextId] = 0;

      activeIds.forEach(function (k) {
        if (k === bi || k === bj) return;
        var nk = clusters[k].size;
        var dNew = lw(D[bi][k], D[bj][k], bd, ci.size, cj.size, nk);
        D[nextId][k] = D[k][nextId] = dNew;
      });
      ci.active = false; cj.active = false;
      activeIds = activeIds.filter(function (k) { return k !== bi && k !== bj; });
      activeIds.push(nextId);
      heights.push(bd);
      nextId++;
    }

    var root = activeIds.length === 1 ? clusters[activeIds[0]].node : null;
    return { tree: root, order: root ? leafOrder(root) : [], heights: heights, method: method, metric: opt.metric || 'euclidean' };
  }

  function leafNode(i) { return { height: 0, leaf: i, size: 1 }; }
  function leafOrder(node) {
    var out = [];
    (function rec(nd) {
      if (!nd) return;
      if (nd.leaf !== undefined) { out.push(nd.leaf); return; }
      rec(nd.left); rec(nd.right);
    })(node);
    return out;
  }

  /* --------------------- 卡方分布 / 非参数检验 --------------------------- */

  // 正则化不完全 gamma 函数 P(a, x)（Numerical Recipes：级数 + 连分式）
  function gammaP(a, x) {
    if (x <= 0) return 0;
    var FPMIN = 1e-300;
    if (x < a + 1) {
      // 级数展开
      var ap = a, sv = 1 / a, del = sv;
      for (var n = 1; n <= 300; n++) {
        ap += 1; del *= x / ap; sv += del;
        if (Math.abs(del) < Math.abs(sv) * 1e-15) break;
      }
      return sv * Math.exp(-x + a * Math.log(x) - gammaln(a));
    }
    // 连分式展开求 Q(a,x) = 1 - P(a,x)
    var b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i <= 300; i++) {
      var an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var dl = d * c; h *= dl;
      if (Math.abs(dl - 1) < 1e-15) break;
    }
    var q = Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
    return 1 - q;
  }

  // 卡方分布上尾概率 P(X ≥ x)
  function chi2Sf(x, df) {
    if (df <= 0) return NaN;
    if (x <= 0) return 1;
    if (!isFinite(x)) return 0;
    return Math.max(0, Math.min(1, 1 - gammaP(df / 2, x / 2)));
  }

  // F 分布上尾概率 P(F ≥ f) = I_{df2/(df2+df1·f)}(df2/2, df1/2)
  function fTestP(f, df1, df2) {
    if (df1 <= 0 || df2 <= 0 || !isFinite(f)) return NaN;
    if (f <= 0) return 1;
    return betai(df2 / 2, df1 / 2, df2 / (df2 + df1 * f));
  }

  /**
   * Mann-Whitney U / Wilcoxon 秩和检验（双侧）
   * 正态近似 + 并列校正 + 连续性校正
   */
  function wilcoxonRankSum(x, y) {
    var n1 = x.length, n2 = y.length;
    if (n1 < 1 || n2 < 1) return { U: NaN, z: NaN, p: NaN, n1: n1, n2: n2 };
    var all = x.concat(y), n = all.length;
    var r = rank(all);
    var R1 = 0, i;
    for (i = 0; i < n1; i++) R1 += r[i];
    var U1 = R1 - n1 * (n1 + 1) / 2;
    var U = Math.min(U1, n1 * n2 - U1);
    var mu = n1 * n2 / 2;
    // 并列（相同值）校正
    var counts = {}, tieSum = 0;
    all.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    Object.keys(counts).forEach(function (key) { var t = counts[key]; tieSum += t * t * t - t; });
    var varU = (n1 * n2 / 12) * ((n + 1) - tieSum / (n * (n - 1)));
    var sd = Math.sqrt(varU);
    var z = sd > 0 ? (Math.max(0, Math.abs(U1 - mu) - 0.5)) / sd : 0;
    return {
      U: U, U1: U1, z: z, p: 2 * (1 - pnorm(z)),
      n1: n1, n2: n2, rankSum1: R1, expected: mu, sdU: sd
    };
  }

  /** 独立两样本 t 检验（Welch，不假定方差相等，推荐） */
  function welchTTest(x, y) {
    var n1 = x.length, n2 = y.length;
    var m1 = mean(x), m2 = mean(y);
    if (n1 < 2 || n2 < 2) return { t: NaN, df: NaN, p: NaN, mean1: m1, mean2: m2 };
    var v1 = variance(x), v2 = variance(y);
    var a = v1 / n1, b = v2 / n2;
    var se = Math.sqrt(a + b);
    var t = se === 0 ? 0 : (m1 - m2) / se;
    var df = (a + b) * (a + b) / (a * a / (n1 - 1) + b * b / (n2 - 1));
    return {
      t: t, df: df, p: tTestP(t, df),
      mean1: m1, mean2: m2, sd1: Math.sqrt(v1), sd2: Math.sqrt(v2), n1: n1, n2: n2
    };
  }

  /** 独立两样本 t 检验（Student，假定方差相等） */
  function studentTTest(x, y) {
    var n1 = x.length, n2 = y.length;
    if (n1 < 2 || n2 < 2) return { t: NaN, df: NaN, p: NaN };
    var m1 = mean(x), m2 = mean(y);
    var v1 = variance(x), v2 = variance(y);
    var sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
    var se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
    var t = se === 0 ? 0 : (m1 - m2) / se;
    return { t: t, df: n1 + n2 - 2, p: tTestP(t, n1 + n2 - 2), mean1: m1, mean2: m2 };
  }

  /** 单因素方差分析（one-way ANOVA，F 检验） */
  function oneWayAnova(groups) {
    var k = groups.length, N = 0, allSum = 0;
    groups.forEach(function (g) { N += g.length; allSum += sum(g); });
    if (k < 2 || N <= k) return { F: NaN, p: NaN, df1: k - 1, df2: N - k };
    var grand = allSum / N, ssb = 0, ssw = 0;
    groups.forEach(function (g) {
      var m = mean(g);
      ssb += g.length * (m - grand) * (m - grand);
      for (var q = 0; q < g.length; q++) { var d = g[q] - m; ssw += d * d; }
    });
    var df1 = k - 1, df2 = N - k;
    var msb = ssb / df1, msw = ssw / df2;
    var F = msw === 0 ? Infinity : msb / msw;
    return {
      F: F, p: isFinite(F) ? fTestP(F, df1, df2) : 0,
      df1: df1, df2: df2, ssb: ssb, ssw: ssw, grand: grand
    };
  }

  /** Kruskal-Wallis 秩和检验（k 组，含并列校正，卡方近似） */
  function kruskalWallis(groups) {
    var k = groups.length, all = [];
    groups.forEach(function (g) { g.forEach(function (v) { all.push(v); }); });
    var N = all.length;
    if (k < 2 || N < 3) return { H: NaN, p: NaN, df: k - 1 };
    var r = rank(all), off = 0, rankSum = [];
    groups.forEach(function (g) {
      var s = 0;
      for (var i = 0; i < g.length; i++) s += r[off + i];
      rankSum.push(s);
      off += g.length;
    });
    var H = 0;
    groups.forEach(function (g, gi) { H += rankSum[gi] * rankSum[gi] / g.length; });
    H = 12 / (N * (N + 1)) * H - 3 * (N + 1);
    var counts = {}, tieSum = 0;
    all.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    Object.keys(counts).forEach(function (key) { var t = counts[key]; tieSum += t * t * t - t; });
    var corr = 1 - tieSum / (N * N * N - N);
    if (corr > 0) H = H / corr;
    var df = k - 1;
    return { H: H, p: chi2Sf(H, df), df: df, rankSum: rankSum };
  }

  /* ----------------------------- 生存分析 -------------------------------- */

  /**
   * Kaplan-Meier 乘积极限估计
   * @param {number[]} time  随访时间
   * @param {number[]} event 事件指示（1 = 事件发生，0 = 删失）
   */
  function kaplanMeier(time, event) {
    var recs = [], i;
    for (i = 0; i < time.length; i++) {
      if (isFinite(time[i])) recs.push({ t: time[i], e: event[i] ? 1 : 0 });
    }
    recs.sort(function (a, b) { return a.t - b.t; });
    var N = recs.length;
    var curve = [{ time: 0, surv: 1, atRisk: N, events: 0, censored: 0 }];
    var s = 1, atRisk = N, idx = 0;
    var totalEvents = 0, totalCens = 0, median = null;
    while (idx < recs.length) {
      var t = recs[idx].t, d = 0, c = 0;
      while (idx < recs.length && recs[idx].t === t) {
        if (recs[idx].e === 1) d++; else c++;
        idx++;
      }
      var nRisk = atRisk;
      if (d > 0) { s = s * (1 - d / nRisk); totalEvents += d; }
      totalCens += c;
      atRisk = nRisk - d - c;
      if (median === null && s <= 0.5) median = t;
      curve.push({ time: t, surv: s, atRisk: nRisk, events: d, censored: c });
    }
    return {
      curve: curve, n: N, nEvents: totalEvents, nCensored: totalCens,
      median: median, maxTime: N ? recs[N - 1].t : 0, minTime: N ? recs[0].t : 0
    };
  }

  /** Gauss-Jordan 求逆（含列主元选取）；奇异矩阵返回 null */
  function invertMatrix(A) {
    var n = A.length, M = [], I = [], i, j;
    for (i = 0; i < n; i++) {
      M.push(A[i].slice());
      var row = new Array(n).fill(0); row[i] = 1; I.push(row);
    }
    for (var col = 0; col < n; col++) {
      var piv = col, best = Math.abs(M[col][col]);
      for (var r = col + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > best) { best = Math.abs(M[r][col]); piv = r; }
      }
      if (best < 1e-12) return null;
      if (piv !== col) {
        var t1 = M[piv]; M[piv] = M[col]; M[col] = t1;
        var t2 = I[piv]; I[piv] = I[col]; I[col] = t2;
      }
      var pv = M[col][col];
      for (var c = 0; c < n; c++) { M[col][c] /= pv; I[col][c] /= pv; }
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === col) continue;
        var f = M[r2][col];
        if (f === 0) continue;
        for (var c2 = 0; c2 < n; c2++) {
          M[r2][c2] -= f * M[col][c2];
          I[r2][c2] -= f * I[col][c2];
        }
      }
    }
    return I;
  }

  /**
   * 对数秩检验（log-rank test，k 组）
   * @param {Array} groups [{ time: [], event: [], name }]
   * 统计量 X² = (O−E)′ V⁻¹ (O−E)，取前 k−1 组为对比，自由度 k−1
   */
  function logRankTest(groups) {
    var k = groups.length;
    if (k < 2) return { chi2: NaN, p: NaN, df: 0 };
    var recs = groups.map(function (g) {
      var a = [];
      for (var i = 0; i < g.time.length; i++) {
        if (isFinite(g.time[i])) a.push({ t: g.time[i], e: g.event[i] ? 1 : 0 });
      }
      a.sort(function (p, q) { return p.t - q.t; });
      return a;
    });

    // 全部事件时间
    var timeSet = {};
    recs.forEach(function (a) { a.forEach(function (r) { if (r.e === 1) timeSet[r.t] = 1; }); });
    var times = Object.keys(timeSet).map(Number).sort(function (a, b) { return a - b; });

    var O = new Array(k).fill(0), E = new Array(k).fill(0);
    var V = [];
    for (var a1 = 0; a1 < k; a1++) V.push(new Array(k).fill(0));

    times.forEach(function (t) {
      var n = new Array(k).fill(0), d = new Array(k).fill(0);
      for (var gi = 0; gi < k; gi++) {
        var arr = recs[gi];
        for (var i = 0; i < arr.length; i++) {
          if (arr[i].t >= t) n[gi]++;                       // 风险集：时间 ≥ t
          if (arr[i].t === t && arr[i].e === 1) d[gi]++;
        }
      }
      var nTot = sum(n), dTot = sum(d);
      if (dTot === 0 || nTot <= 1) return;
      var fac = dTot * (nTot - dTot) / (nTot - 1);
      for (var g2 = 0; g2 < k; g2++) {
        O[g2] += d[g2];
        E[g2] += dTot * n[g2] / nTot;
      }
      for (var i1 = 0; i1 < k; i1++) {
        for (var j1 = 0; j1 < k; j1++) {
          var pij = n[i1] / nTot;
          V[i1][j1] += fac * pij * ((i1 === j1 ? 1 : 0) - n[j1] / nTot);
        }
      }
    });

    var m = k - 1, OE = [], Vm = [];
    for (var i2 = 0; i2 < m; i2++) {
      OE.push(O[i2] - E[i2]);
      var row = [];
      for (var j2 = 0; j2 < m; j2++) row.push(V[i2][j2]);
      Vm.push(row);
    }
    var inv = invertMatrix(Vm);
    if (!inv) return { chi2: NaN, p: NaN, df: m, observed: O, expected: E };
    var chi2 = 0;
    for (var i3 = 0; i3 < m; i3++) {
      for (var j3 = 0; j3 < m; j3++) chi2 += OE[i3] * inv[i3][j3] * OE[j3];
    }
    if (!(chi2 >= 0)) chi2 = 0;
    return {
      chi2: chi2, p: chi2Sf(chi2, m), df: m,
      observed: O, expected: E, V: V
    };
  }

  /* ------------------------------ 导出 ---------------------------------- */

  /* ====================== 扩展检验：置信区间与 post hoc ==================== */

  /**
   * t 分布分位数（双侧）
   * @param {number} df   自由度
   * @param {number} tail 双侧尾概率（如 0.05 对应 95% 置信区间）
   * @returns {number} |t|
   */
  function invTDist(df, tail) {
    if (!isFinite(df) || df <= 0) return NaN;
    tail = Math.min(Math.max(tail, 1e-14), 0.999999);
    var lo = 0, hi = 1e3;
    for (var i = 0; i < 160; i++) {
      var mid = (lo + hi) / 2;
      if (tTestP(mid, df) > tail) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * 简单线性回归：ŷ = intercept + slope·x（OLS）
   * @returns {{n:number, slope:number, intercept:number, seSlope:number, seIntercept:number,
   *            df:number, mse:number, xMean:number, sxx:number, r:number, r2:number,
   *            fit:function, seFit:function, sePred:function}}
   */
  function linearRegression(x, y) {
    var px = [], py = [], i;
    for (i = 0; i < x.length; i++) {
      if (isFinite(x[i]) && isFinite(y[i])) { px.push(x[i]); py.push(y[i]); }
    }
    var n = px.length;
    if (n < 3) return null;
    var xm = mean(px), ym = mean(py), sxx = 0, sxy = 0, syy = 0;
    for (i = 0; i < n; i++) {
      var dx = px[i] - xm, dy = py[i] - ym;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    if (sxx <= 0 || syy <= 0) return null;
    var slope = sxy / sxx, intercept = ym - slope * xm;
    var ssRes = Math.max(0, syy - slope * sxy);
    var df = n - 2, mse = df > 0 ? ssRes / df : NaN;
    var seSlope = Math.sqrt(mse / sxx);
    var seIntercept = Math.sqrt(mse * (1 / n + xm * xm / sxx));
    var r = sxy / Math.sqrt(sxx * syy);
    var out = {
      n: n, slope: slope, intercept: intercept, seSlope: seSlope, seIntercept: seIntercept,
      df: df, mse: mse, xMean: xm, sxx: sxx, r: r, r2: r * r, slopeSE: seSlope,
      fit: function (x0) { return intercept + slope * x0; },
      seFit: function (x0) { return Math.sqrt(mse * (1 / n + (x0 - xm) * (x0 - xm) / sxx)); },
      sePred: function (x0) { return Math.sqrt(mse * (1 + 1 / n + (x0 - xm) * (x0 - xm) / sxx)); }
    };
    out.p = tTestP(slope / seSlope, df);
    return out;
  }

  /** 单样本 t 检验（与 mu0 比较） */
  function oneSampleTTest(a, mu0) {
    var n = a.length;
    if (n < 2) return { t: NaN, df: NaN, p: NaN };
    var m = mean(a), sd = stdev(a), se = sd / Math.sqrt(n);
    var t = (m - mu0) / se;
    return { t: t, df: n - 1, p: tTestP(t, n - 1), mean: m, sd: sd, se: se, n: n };
  }

  /** 配对样本 t 检验（差值的单样本 t 检验） */
  function pairedTTest(a, b) {
    var d = [], i;
    for (i = 0; i < a.length; i++) {
      if (isFinite(a[i]) && isFinite(b[i])) d.push(a[i] - b[i]);
    }
    var n = d.length;
    if (n < 2) return { t: NaN, df: NaN, p: NaN, n: n, meanDiff: NaN };
    var m = mean(d), sd = stdev(d), se = sd / Math.sqrt(n);
    var t = m / se, df = n - 1;
    return {
      t: t, df: df, p: tTestP(t, df), n: n, meanDiff: m, sdDiff: sd, se: se,
      ciLow: m - invTDist(df, 0.05) * se, ciHigh: m + invTDist(df, 0.05) * se
    };
  }

  /** Wilcoxon 符号秩检验（配对 Design；正态近似 + 并列校正 + 连续性校正） */
  function wilcoxonSignedRank(a, b) {
    var d = [], i;
    for (i = 0; i < a.length; i++) {
      if (isFinite(a[i]) && isFinite(b[i])) d.push(a[i] - b[i]);
    }
    var nz = d.filter(function (v) { return v !== 0; });
    var n = nz.length;
    if (!n) return { W: NaN, z: NaN, p: NaN, n: 0 };
    var abs = nz.map(function (v) { return Math.abs(v); });
    var rk = rank(abs), Wp = 0, Wm = 0;
    for (i = 0; i < n; i++) {
      if (nz[i] > 0) Wp += rk[i]; else Wm += rk[i];
    }
    var W = Math.min(Wp, Wm);
    var mu = n * (n + 1) / 4;
    var counts = {}, tieSum = 0;
    abs.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    Object.keys(counts).forEach(function (k) { var t = counts[k]; tieSum += t * t * t - t; });
    var sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - tieSum / 48);
    var z = sigma > 0 ? (Math.abs(Wp - mu) - 0.5) / sigma : 0;
    return { W: W, Wp: Wp, Wm: Wm, z: z, p: 2 * (1 - pnorm(z)), n: n, expected: mu, sd: sigma };
  }

  /**
   * Shapiro-Wilk 正态性检验
   * 系数按 Royston (1992) 的 Moschopoulos 近似计算（σ=Blom 正态分位期望值，
   * 端点系数由 u = n^(−1/2) 的多项式给出）；P 值用 Royston 的三参数对数正态转换。
   * 说明：与 R shapiro.test 在 3 ≤ n ≤ 50 使用精确系数表可能有细微差异。
   */
  function shapiroWilk(a) {
    var x = a.filter(isFinite).slice().sort(function (p, q) { return p - q; });
    var n = x.length;
    if (n < 3) return { W: NaN, p: NaN, n: n };
    var m = [], i;
    for (i = 0; i < n; i++) m.push(invNorm((i + 1 - 0.375) / (n + 0.25)));
    var mm = 0;
    for (i = 0; i < n; i++) mm += m[i] * m[i];
    var sqmm = Math.sqrt(mm);
    var u = 1 / Math.sqrt(n);
    var c = m.map(function (v) { return v / sqmm; });   // 归一化后 Σc² = 1
    /* 两端系数（Royston 1992 的 u 多项式） */
    var p1 = c[n - 1] + 0.221157 * u - 0.147981 * u * u - 2.071190 * Math.pow(u, 3)
      + 4.434685 * Math.pow(u, 4) - 2.706056 * Math.pow(u, 5);
    var p2 = c[n - 2] + 0.042981 * u - 0.293762 * u * u - 1.752461 * Math.pow(u, 3)
      + 5.682633 * Math.pow(u, 4) - 3.582633 * Math.pow(u, 5);
    var phi = (1 - 2 * c[n - 1] * c[n - 1] - 2 * c[n - 2] * c[n - 2]) /
      (1 - 2 * p1 * p1 - 2 * p2 * p2);
    var coef = c.map(function (v) { return phi > 0 ? v / Math.sqrt(phi) : 0; });
    coef[n - 1] = p1; coef[n - 2] = p2; coef[0] = -p1;
    var xb = mean(x), ss = 0;
    for (i = 0; i < n; i++) ss += (x[i] - xb) * (x[i] - xb);
    var lin = 0;
    for (i = 0; i < n; i++) lin += coef[i] * x[i];
    var W = ss > 0 ? (lin * lin) / ss : NaN;
    var p = NaN;
    if (isFinite(W) && W < 1) {
      var ln = Math.log(n);
      var mu = -1.5861 - 0.31082 * ln - 0.083751 * ln * ln + 0.0038915 * ln * ln * ln;
      var sd = Math.exp(-0.4803 - 0.082676 * ln + 0.0030302 * ln * ln);
      var z = (Math.log(1 - W) - mu) / sd;
      p = 1 - pnorm(z);
      p = Math.min(1, Math.max(0, p));
    }
    return { W: W, p: p, n: n };
  }

  /**
   * 标准正态分位数
   * 实现为对 pnorm 的二分反解（pnorm 基于 erf，绝对精度约 1e-7），
   * 避免引入额外的有理逼近常数表；需求场景（Shapiro-Wilk 期望次序统计量）足够精确。
   */
  function invNorm(p) {
    if (!(p > 0) || !(p < 1)) return p <= 0 ? -8.2 : 8.2;
    var lo = -8.2, hi = 8.2;
    for (var i = 0; i < 100; i++) {
      var mid = (lo + hi) / 2;
      if (pnorm(mid) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /** D'Agostino-Pearson 综合正态性检验（偏度 Zs + 峰度 Zk，K² ~ χ²(2)）；建议 n ≥ 20 */
  function dagostinoPearson(a) {
    var x = a.filter(isFinite);
    var n = x.length;
    if (n < 8) return { K2: NaN, p: NaN, skewZ: NaN, kurtZ: NaN, skew: NaN, kurt: NaN, n: n };
    var xb = mean(x), m2 = 0, m3 = 0, m4 = 0, i;
    for (i = 0; i < n; i++) {
      var d0 = x[i] - xb;
      m2 += d0 * d0; m3 += d0 * d0 * d0; m4 += d0 * d0 * d0 * d0;
    }
    m2 /= n; m3 /= n; m4 /= n;
    var b1 = m2 > 0 ? (m3 * m3) / (m2 * m2 * m2) : 0;
    var g1 = Math.sign(m3) * Math.sqrt(b1);
    var b2 = m2 > 0 ? m4 / (m2 * m2) : NaN;
    /* 偏度检验（D'Agostino 1970） */
    var Y = g1 * Math.sqrt((n + 1) * (n + 3) / (6 * (n - 2)));
    var beta2 = 3 * (n * n + 27 * n - 70) * (n + 1) * (n + 3) /
      ((n - 2) * (n + 5) * (n + 7) * (n + 9));
    var W2 = -1 + Math.sqrt(2 * (beta2 - 1));
    var delta = 1 / Math.sqrt(Math.log(Math.sqrt(W2)));
    var alphaS = Math.sqrt(2 / (W2 - 1));
    var t = Y / alphaS;
    var Zs = delta * Math.log(t + Math.sqrt(t * t + 1));
    /* 峰度检验（Anscombe-Glynn 1983） */
    var Ek = 3 * (n - 1) / (n + 1);
    var varb2 = 24 * n * (n - 2) * (n - 3) / ((n + 1) * (n + 1) * (n + 3) * (n + 5));
    var xx = (b2 - Ek) / Math.sqrt(varb2);
    var sqrtb1 = 6 * (n * n - 5 * n + 2) / ((n + 7) * (n + 9)) *
      Math.sqrt(6 * (n + 3) * (n + 5) / (n * (n - 2) * (n - 3)));
    var A = 6 + 8 / sqrtb1 * (2 / sqrtb1 + Math.sqrt(1 + 4 / (sqrtb1 * sqrtb1)));
    var term1 = 1 - 2 / (9 * A);
    var denom = 1 + xx * Math.sqrt(2 / (A - 4));
    var Zk = (term1 - (1 - 2 / A) / Math.pow(denom, 1 / 3)) / Math.sqrt(2 / (9 * A));
    var K2 = Zs * Zs + Zk * Zk;
    return { K2: K2, p: chi2Sf(K2, 2), skewZ: Zs, kurtZ: Zk, skew: g1, kurt: b2, n: n };
  }

  /**
   * Levene 方差齐性检验（默认 Brown-Forsythe 中位数版，对非正态更稳健）
   * @param {number[][]} groups
   * @param {string} center 'median' | 'mean'
   */
  function leveneTest(groups, center) {
    center = center || 'median';
    var g = groups.filter(function (a) { return a && a.length >= 2; });
    if (g.length < 2) return { F: NaN, p: NaN, df1: NaN, df2: NaN };
    var z = g.map(function (arr) {
      var c = center === 'mean' ? mean(arr) : median(arr);
      return arr.map(function (v) { return Math.abs(v - c); });
    });
    var an = oneWayAnova(z);
    return { F: an.F, p: an.p, df1: an.df1, df2: an.df2, center: center };
  }

  /** Bartlett 方差齐性检验（假定正态） */
  function bartlettTest(groups) {
    var g = groups.filter(function (a) { return a && a.length >= 2; });
    var k = g.length;
    if (k < 2) return { chi2: NaN, p: NaN, df: NaN };
    var N = 0, i;
    var cnt = [], sp2 = [];
    for (i = 0; i < k; i++) { cnt.push(g[i].length); sp2.push(variance(g[i])); N += g[i].length; }
    for (i = 0; i < k; i++) if (sp2[i] <= 0) return { chi2: NaN, p: NaN, df: NaN };
    var num = 0, den = 0;
    for (i = 0; i < k; i++) {
      num += (N - k) * Math.log(sp2[i]) * (cnt[i] - 1) / (N - k);
      den += 1 / (cnt[i] - 1);
    }
    var s2 = 0;
    for (i = 0; i < k; i++) s2 += (cnt[i] - 1) * sp2[i];
    s2 /= (N - k);
    var chi2 = ((N - k) * Math.log(s2) - num) / (1 + (den - 1 / (N - k)) / (3 * (k - 1)));
    return { chi2: chi2, p: chi2Sf(chi2, k - 1), df: k - 1 };
  }

  /**
   * 单因素重复测量方差分析
   * @param {number[][]} rows 每个受试者一行，各列为一个处理条件（须完整，无缺失）
   */
  function rmAnova(rows) {
    var m = rows.filter(function (r) {
      return r && r.length >= 2 && r.every(function (v) { return isFinite(v); });
    });
    var k = rows.length ? rows[0].length : 0;
    m = m.filter(function (r) { return r.length === k; });
    var nSub = m.length;
    if (nSub < 2 || k < 2) return { F: NaN, p: NaN, df1: k - 1, df2: NaN, nSub: nSub, k: k };
    var grand = 0, N = nSub * k, i, j;
    for (i = 0; i < nSub; i++) for (j = 0; j < k; j++) grand += m[i][j];
    grand /= N;
    var ssCond = 0, ssSub = 0, ssTot = 0;
    var condMean = new Array(k).fill(0), subMean = new Array(nSub).fill(0);
    for (i = 0; i < nSub; i++) {
      for (j = 0; j < k; j++) {
        ssTot += (m[i][j] - grand) * (m[i][j] - grand);
        condMean[j] += m[i][j];
        subMean[i] += m[i][j];
      }
      subMean[i] /= k;
    }
    for (j = 0; j < k; j++) { condMean[j] /= nSub; ssCond += nSub * (condMean[j] - grand) * (condMean[j] - grand); }
    for (i = 0; i < nSub; i++) ssSub += k * (subMean[i] - grand) * (subMean[i] - grand);
    var ssErr = ssTot - ssCond - ssSub;
    var df1 = k - 1, df2 = (nSub - 1) * (k - 1);
    var msC = ssCond / df1, msE = ssErr / df2;
    var F = msE > 0 ? msC / msE : NaN;
    return {
      F: F, p: isFinite(F) ? fTestP(F, df1, df2) : NaN,
      df1: df1, df2: df2, nSub: nSub, k: k,
      condMean: condMean, msErr: msE, ssCond: ssCond, ssSub: ssSub, ssErr: ssErr, ssTot: ssTot
    };
  }

  /** Friedman 检验（重复测量的非参数替代） */
  function friedmanTest(rows) {
    var k = rows.length ? rows[0].length : 0;
    var m = rows.filter(function (r) {
      return r && r.length === k && r.every(function (v) { return isFinite(v); });
    });
    var nSub = m.length;
    if (nSub < 2 || k < 2) return { chi2: NaN, p: NaN, df: k - 1, nSub: nSub };
    var rs = new Array(k).fill(0), i, j;
    for (i = 0; i < nSub; i++) {
      var rk = rank(m[i].slice());
      for (j = 0; j < k; j++) rs[j] += rk[j];
    }
    var chi2 = 0;
    for (j = 0; j < k; j++) chi2 += rs[j] * rs[j];
    chi2 = 12 / (nSub * k * (k + 1)) * chi2 - 3 * nSub * (k + 1);
    return { chi2: chi2, p: chi2Sf(chi2, k - 1), df: k - 1, nSub: nSub, rankSum: rs };
  }

  /**
   * Dunn 事后检验（Kruskal-Wallis 之后的两两比较）
   * @returns {Array} [{i,j,z,p}]
   */
  function dunnTest(groups) {
    var g = groups.filter(function (a) { return a && a.length; });
    var N = 0, i;
    g.forEach(function (a) { N += a.length; });
    var all = [];
    g.forEach(function (a) { a.forEach(function (v) { all.push(v); }); });
    var ties = {}, tieSum = 0;
    all.forEach(function (v) { ties[v] = (ties[v] || 0) + 1; });
    Object.keys(ties).forEach(function (k) { var t = ties[k]; tieSum += t * t * t - t; });
    var tieCorr = 1 - tieSum / (N * N * N - N);
    var rk = rank(all), off = 0, meanRank = [];
    g.forEach(function (a) {
      var s = 0;
      for (i = 0; i < a.length; i++) s += rk[off + i];
      off += a.length;
      meanRank.push(s / a.length);
    });
    var out = [];
    for (i = 0; i < g.length; i++) {
      for (var j = i + 1; j < g.length; j++) {
        var n1 = g[i].length, n2 = g[j].length;
        var se = Math.sqrt((N * (N + 1) / 12 - tieSum / (12 * (N - 1))) * (1 / n1 + 1 / n2));
        if (tieCorr > 0) se = Math.sqrt(Math.max(1e-12, (N * (N + 1) / 12) * (1 / n1 + 1 / n2)));
        var z = se > 0 ? (meanRank[i] - meanRank[j]) / se : 0;
        out.push({ i: i, j: j, z: z, p: 2 * (1 - pnorm(Math.abs(z))) });
      }
    }
    return out;
  }

  /**
   * 学生化极差分布上尾概率 P(Q ≥ q)（Tukey HSD 用）
   * Q = (max X_i − min X_i) / S，S = sqrt(χ²_df/df)
   * P(Q ≥ q) = 1 − k·∫∫ φ(x)[Φ(x)−Φ(x−q·s)]^(k−1) f_S(s) dx ds
   */
  function studentizedRangeSf(q, k, df) {
    if (!isFinite(q) || q <= 0 || k < 2) return 1;
    /* 内积分：给定 S = s 时的条件概率 P(range ≤ q·s | s)
       = k·∫ φ(x)·[Φ(x) − Φ(x − q·s)]^(k−1) dx */
    function inner(s) {
      var n = 400, a = -12, b = 12, h = (b - a) / n, sum = 0;
      function f(x) {
        var d = pnorm(x) - pnorm(x - q * s);
        if (d <= 0) return 0;
        return Math.exp(-x * x / 2) * Math.pow(d, k - 1);
      }
      sum = f(a) + f(b);
      for (var i = 1; i < n; i++) sum += f(a + i * h) * (i % 2 ? 4 : 2);
      return k * sum * h / 3 / Math.sqrt(2 * Math.PI);
    }
    /* σ 已知（df → ∞）的极限情形：S ≡ 1 */
    if (df > 1e6) return Math.max(0, Math.min(1, 1 - inner(1)));
    /* S = sqrt(χ²_df/df) 的密度：由 c = df·s²，c ~ χ²_df 变换得到 */
    function chiS(s) {
      var c = df * s * s;
      return Math.exp(Math.LN2 + (df / 2) * Math.log(df) + (df - 1) * Math.log(s)
        - df * s * s / 2 - (df / 2) * Math.LN2 - gammaln(df / 2)) * 1;
    }
    var sLo = Math.max(1e-4, 1 - 10 / Math.sqrt(df));
    var sHi = 1 + 10 / Math.sqrt(df) + 1e-9;
    function outer(s) { return inner(s) * chiS(s); }
    var m = 200, hh = (sHi - sLo) / m, tot = outer(sLo) + outer(sHi);
    for (var i = 1; i < m; i++) tot += outer(sLo + i * hh) * (i % 2 ? 4 : 2);
    var cdf = Math.max(0, Math.min(1, tot * hh / 3));
    return Math.max(0, Math.min(1, 1 - cdf));
  }

  /** 学生化极差分位数 q_{α}(k, df)（上尾 α） */
  function qTukey(alpha, k, df) {
    var lo = 0, hi = 40;
    for (var i = 0; i < 90; i++) {
      var mid = (lo + hi) / 2;
      if (studentizedRangeSf(mid, k, df) > alpha) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /**
   * Tukey HSD 事后检验（假定方差齐性，使用 ANOVA 的合并均方）
   * @returns {Array} [{i,j,diff,q,p,ciLow,ciHigh}]
   */
  function tukeyHSD(groups, alpha) {
    alpha = alpha || 0.05;
    var g = groups.filter(function (a) { return a && a.length >= 2; });
    var an = oneWayAnova(g);
    var out = [], i, j;
    if (!isFinite(an.df2) || an.df2 <= 0) return out;
    var qt = qTukey(alpha, g.length, an.df2);
    for (i = 0; i < g.length; i++) {
      for (j = i + 1; j < g.length; j++) {
        var di = mean(g[i]) - mean(g[j]);
        var se = Math.sqrt((an.ssw / an.df2) * (1 / (2)) * (1 / g[i].length + 1 / g[j].length));
        if (se <= 0) continue;
        var q = Math.abs(di) / se;
        out.push({
          i: i, j: j, diff: di, q: q,
          p: studentizedRangeSf(q, g.length, an.df2),
          ciLow: di - qt * se / Math.SQRT2, ciHigh: di + qt * se / Math.SQRT2
        });
      }
    }
    return out;
  }

  /**
   * 列联表卡方独立性检验
   * @param {number[][]} table 观测频数矩阵（不含行列合计）
   * @param {boolean} yates 2×2 时是否做 Yates 连续性校正
   */
  function chiSquareIndependence(table, yates) {
    var R = table.length, C = table[0].length, r, c;
    var rowSum = new Array(R).fill(0), colSum = new Array(C).fill(0), N = 0;
    for (r = 0; r < R; r++) {
      for (c = 0; c < C; c++) {
        rowSum[r] += table[r][c]; colSum[c] += table[r][c]; N += table[r][c];
      }
    }
    if (!N) return { chi2: NaN, p: NaN, df: (R - 1) * (C - 1) };
    var chi2 = 0, minExp = Infinity;
    for (r = 0; r < R; r++) {
      for (c = 0; c < C; c++) {
        var e = rowSum[r] * colSum[c] / N;
        if (e < minExp) minExp = e;
        var d = Math.abs(table[r][c] - e);
        if (yates && R === 2 && C === 2) d = Math.max(0, d - 0.5);
        chi2 += e > 0 ? d * d / e : 0;
      }
    }
    var dfv = (R - 1) * (C - 1);
    return { chi2: chi2, p: chi2Sf(chi2, dfv), df: dfv, expected: minExp, n: N, minExpected: minExp };
  }

  /** Fisher 精确检验（2×2，双侧 / 单侧） */
  function fisherExact(a11, a12, a21, a22, alt) {
    var n1 = a11 + a12, n2 = a21 + a22, c1 = a11 + a21, N = n1 + n2;
    if (!N) return { p: NaN };
    /* 超几何：总体 N 中第一类占 n1（成功），抽 c1 个，观察到 a11 个成功 */
    var hg = hypergeomTest(a11, n1, n2, c1, alt === 'less' ? 'less' : (alt === 'greater' ? 'greater' : 'two.sided'));
    var expected = [[c1 * n1 / N, c1 * n2 / N], [(N - c1) * n1 / N, (N - c1) * n2 / N]];
    var minExp = Math.min(expected[0][0], expected[0][1], expected[1][0], expected[1][1]);
    return { p: hg.p, oddsRatio: hg.oddsRatio, minExpected: minExp, expected: expected };
  }

  WB.stats = {
    gammaln: gammaln, logChoose: logChoose, choose: choose, betai: betai, pnorm: pnorm, erf: erf,
    gammaP: gammaP, chi2Sf: chi2Sf, fTestP: fTestP,
    dhyper: dhyper, hypergeomSf: hypergeomSf, hypergeomTest: hypergeomTest, tTestP: tTestP,
    wilcoxonRankSum: wilcoxonRankSum, welchTTest: welchTTest, studentTTest: studentTTest,
    oneWayAnova: oneWayAnova, kruskalWallis: kruskalWallis,
    kaplanMeier: kaplanMeier, logRankTest: logRankTest, invertMatrix: invertMatrix,
    /* --- 扩展检验 --- */
    invTDist: invTDist, invNorm: invNorm, linearRegression: linearRegression,
    oneSampleTTest: oneSampleTTest, pairedTTest: pairedTTest, wilcoxonSignedRank: wilcoxonSignedRank,
    shapiroWilk: shapiroWilk, dagostinoPearson: dagostinoPearson,
    leveneTest: leveneTest, bartlettTest: bartlettTest,
    rmAnova: rmAnova, friedmanTest: friedmanTest,
    dunnTest: dunnTest, tukeyHSD: tukeyHSD, studentizedRangeSf: studentizedRangeSf, qTukey: qTukey,
    chiSquareIndependence: chiSquareIndependence, fisherExact: fisherExact,
    pAdjust: pAdjust,
    sum: sum, mean: mean, variance: variance, stdev: stdev, median: median, quantile: quantile,
    min: min, max: max, range: range, rank: rank,
    pearson: pearson, spearman: spearman, kendallTauB: kendallTauB,
    corrMatrix: corrMatrix, CORR_METHODS: CORR_METHODS,
    matT: matT, matMul: matMul, identity: identity, jacobiEigen: jacobiEigen, pca: pca,
    METRICS: METRICS, hclust: hclust, leafOrder: leafOrder
  };
})(window);
