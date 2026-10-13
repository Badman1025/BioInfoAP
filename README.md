# Bioinformatics Studio

<p align="center"><img src="assets/img/logo-mark.png" alt="Bioinformatics Studio" width="120"></p>

A suite of commonly used bioinformatics analysis tools (12 modules), implemented as a pure front-end application with **zero external dependencies and full offline capability**. All computation is performed within the browser, and all data are processed locally.

## Usage

**Open `index.html` directly** (no installation, no server, and no network connection required).
Copying the entire folder to a USB drive or to any other computer is sufficient to run the application.

## Modules and Input Formats

Each module page displays an **input format specification** at the top and provides "Download template", "Load example data", and "Copy example" buttons; data may also be pasted directly from Excel.

| Module | Input Format | Output |
|---|---|---|
| **Venn Diagram** | ① Long table `Set ⇥ Element`; ② Wide 0/1 matrix; ③ Column-wise format (one set per column); ④ Multiple files (one file per set) | Venn diagrams for 2–4 sets, set sizes, intersection detail tables (with per-region gene export), and pairwise intersection matrices |
| **UpSet Plot** | As above | Intersection size bar chart with membership dot matrix; supports sorting by size or by number of sets, Top-N selection, and minimum intersection size filtering |
| **Enrichment Analysis / ORA** | ① Single-column gene list; ② Multi-list format `list_name: gene1, gene2…`. Gene set sources: local GMT upload / built-in example library / Enrichr online library | Over-representation analysis with hypergeometric test and BH/Bonferroni/Holm correction; bubble plot, bar plot, multi-list comparison dot plot, and result table |
| **Correlation Analysis** | ① Wide table (samples × variables); ② Long table (sample/variable/value) | Pearson / Spearman / Kendall coefficients, P values, FDR; clustered heatmap, scatter plot with regression, correlation network, and pairwise result table |
| **PCA** | Sample × feature matrix (optional grouping column) | Scree plot, PC1–PC2 score plot (95% confidence ellipses by group, loading arrows), and loading table |
| **Volcano Plot** | `gene ⇥ log2FC ⇥ pvalue(/padj)` | Volcano plot (adjustable thresholds, labeling of top genes) and differentially expressed gene table |
| **Clustered Heatmap** | Gene × sample matrix (optional sample group annotation) | Z-score standardization, hierarchical clustering of rows and columns with dendrograms, group color bars, and export of the clustered matrix |
| **Differential Expression Analysis** | Expression matrix (genes × samples) plus sample group annotation (entered separately) | Two groups: Welch's t-test / Wilcoxon rank-sum test; multiple groups: one-way ANOVA / Kruskal–Wallis test. Reports log2FC, test statistics, P values, FDR, group boxplots with significance markers, and a result table |
| **Survival Analysis** | Row-wise samples: follow-up time, event status, and group (column names are auto-detected; in the absence of a grouping variable, a continuous variable may be dichotomized at the median) | Kaplan–Meier step curves (95% CI, censoring marks), log-rank test, median survival summary, and risk table |
| **ROC Curve and AUC** | A true-label column plus one or more score columns | ROC curves for multiple markers, AUC (trapezoidal integration), Hanley–McNeil 95% CI, Youden optimal cutoff, sensitivity/specificity/PPV/NPV/accuracy/F1, confusion matrix, and threshold detail table |
| **Sequence and Protein Tools** | FASTA or plain sequence text (nucleic acid / protein is auto-detected) | Nucleic acids: reverse complement, GC content, base composition chart, six-frame translation, ORF search, codon usage table, and Tm estimation; proteins: molecular weight, isoelectric point (pI), amino acid composition, GRAVY, aromaticity, and hydrophobicity sliding window |
| **Deduplication / Uniquification** | Any tabular file (gene list or annotated multi-column table) | Four modes: removal of fully duplicated rows / deduplication by key column(s) (keeping first or last occurrence) / aggregation by key column(s) (mean, max, min, sum, count, etc.) / extraction of a unique value list |

All figures can be exported as **SVG** (vector format, suitable for manuscript preparation) and **PNG** (2× resolution); all tables can be exported as **TSV / CSV**.

## Bilingual Interface (Chinese / English)

The "Interface language" selector in the lower-left corner switches directly between **中文 / English**. The entire page (navigation, titles, buttons, parameters, descriptions, and result cards) and all in-figure text (axis labels, legends, annotations, and tooltips) switch **in synchrony**.
Input data are preserved across the switch, and results are automatically recomputed once under the new language. The selected language is retained in browser local storage. Text originating from the data (gene names, sample names, group names, and pathway names) is not translated.

## Algorithmic Specifications

- **Enrichment analysis**: over-representation analysis (ORA) using the upper tail of the hypergeometric distribution, `P(X ≥ k)`, equivalent to the one-sided Fisher exact test;
  enrichment fold = (k/n)/(K/N); Rich factor = k/K; Gene ratio = k/n; Benjamini–Hochberg correction is applied by default.
- **Correlation**: Pearson and Spearman use the t-approximation (df = n−2); Kendall's tau-b includes tie correction and a normal-approximation P value; missing values are handled by pairwise deletion.
- **PCA**: centering (with optional z-score standardization) followed by eigendecomposition of the covariance matrix (Jacobi rotation).
- **Hierarchical clustering**: Lance–Williams update, supporting single / complete / average (UPGMA) / Ward.D2 linkage;
  distances supported are Euclidean, Manhattan, maximum, cosine, and 1 − correlation coefficient.
- **Differential expression**: for two groups, Welch's t-test (Welch–Satterthwaite degrees of freedom) or the Wilcoxon rank-sum test (normal approximation with tie and continuity corrections);
  for multiple groups, one-way ANOVA (upper tail of F) or Kruskal–Wallis (H statistic, χ² approximation); log2FC is computed as a direct subtraction on the log scale, with raw intensities first log2-transformed.
- **Survival analysis**: Kaplan–Meier product-limit estimation; confidence intervals use the Greenwood variance with a linear approximation (±1.96·SE);
  the log-rank test is in the Mantel–Haenszel form `χ² = (O−E)′V⁻¹(O−E)`, consistent with R `survdiff`.
- **ROC / AUC**: AUC = trapezoidal integration, equivalent to Mann–Whitney U / (n₁n₂); the 95% CI uses the Hanley–McNeil approximation;
  the optimal cutoff is taken at the maximum Youden index (sensitivity + specificity − 1); the discrimination direction can be determined automatically (by group means) or specified manually.
- **Sequence analysis**: translation uses the standard or mitochondrial codon table; for Tm, the Wallace rule applies to ≤ 14 nt and a GC-based approximation to > 14 nt (a coarse estimate);
  protein molecular weight = sum of average residue masses + 18.0153 Da; pI is obtained by binary search for the zero net charge over pH 0–14 using a pKa table.

The statistical kernel (t / F / χ² distributions, Welch's t-test, Wilcoxon, ANOVA, Kruskal–Wallis, Kaplan–Meier, log-rank, etc.)
has been validated item by item against R reference values (see `selftest.html`).

## Directory Structure

```
index.html              Entry page
selftest.html           Automated self-test (statistical kernel / parsing / end-to-end tests for the home page and all 12 modules + residual Chinese-text scan in the English interface)
assets/css/style.css    Styles
assets/js/core/         Core layer: utils, i18n (bilingual), stats, parse, plot, ui
assets/js/data/demo.js  Example data (real gene symbols with a fixed random seed)
assets/js/tools/        The 12 analysis modules
assets/js/main.js       Navigation and routing
```

## Notes

- **The built-in example gene sets are intended only for functional illustration** (16 small example pathways). For formal analyses, upload the official MSigDB / GO / KEGG GMT files,
  or use "Retrieve Enrichr gene set library online" (requires a network connection; results are cached in the browser after the first retrieval).
- The **background gene set** for enrichment analysis defaults to all genes in the gene set library. If only a subset of genes was assayed (e.g., a targeted panel or microarray), the true background must be specified.
- Recommendations for large datasets: number of UpSet sets ≤ 8; number of heatmap rows ≤ 500; number of correlation variables ≤ 60; single file < 20 MB.
- Survival analysis requires that **censoring and the event of interest be independent**; median survival is defined only when the survival probability falls below 50% within the follow-up period.
- The Youden optimal cutoff for ROC is provided for reference only; in practice, the threshold should be determined by weighing clinical or experimental considerations. The DeLong test should be considered when comparing AUC values across multiple markers.
- Tm estimates are approximate; for accurate quantification, a nearest-neighbor thermodynamic model incorporating salt concentration and Mg²⁺ should be used.
- Statistical significance does not imply biological significance; effect size and experimental design should be considered in combination.
