# Bioinformatics Studio

<p align="center"><img src="assets/img/logo-mark.png" alt="Bioinformatics Studio" width="120"></p>

A suite of commonly used bioinformatics analysis tools (18 modules), implemented as a pure front-end application with **zero external dependencies and full offline capability**. All computation is performed within the browser, and all data are processed locally.

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
| **Network Plot** | ① Edge list (`Source ⇥ Target ⇥ Weight ⇥ Type`); ② square adjacency matrix (undirected, upper triangle); ③ expression matrix (pairwise correlation network with \|r\| cutoff and FDR filter) | Deterministic force-directed layout (plus grouped / circular / grid layouts), node size mapped to degree or weighted degree, node colour mapped to group, edge width mapped to \|weight\| with positive/negative colouring, in-figure title and legends, node and edge tables; SVG and 4× PNG export |
| **Violin Plot** | Wide table; the first column is the sample ID and each other column is one variable / group | Gaussian kernel density violins (Silverman bandwidth × factor) with embedded box-and-whisker elements, jittered sample points, pairwise Welch t-tests with BH-adjusted significance brackets, and a pairwise comparison table |
| **Pie / Doughnut / Sunburst** | ① Two columns (category + value); ② one category column (auto-counted); ③ three columns (level-1 + level-2 + value) for the sunburst | Percentage composition figures with leader lines for small slices, an in-figure legend, and a composition detail table |
| **Line Chart** | ① Wide table: first column = x, each other column = one series (repeated x rows are replicates); ② long table (series + x + value) | Mean lines with SD / SEM / 95% CI error bands, optional curve smoothing, per-subject lines, per-point Welch t-tests with BH correction, per-position summary table, and a curve summary table (peak and trapezoid AUC) |
| **3D Scatter Plot** | ① `ID ⇥ X ⇥ Y ⇥ Z` (an additional text column is used as the grouping variable); ② three numeric columns | Yaw / pitch projection with painter's-algorithm depth sorting, 95% confidence ellipsoids from the eigendecomposition of the covariance matrix, floor grid and drop lines, drag-to-rotate and scroll-to-zoom, preset views, and export of the current view as vector graphics |
| **Statistical Tests** | ① Wide table: subject ID + one column per group; ② long table (subject + group + value); ③ contingency table for chi-square / Fisher | Shapiro–Wilk normality and Levene / Bartlett variance checks with an automatic test recommendation; one-sample t, Student / Welch t, Mann–Whitney U, paired t, paired Wilcoxon, one-way ANOVA, Kruskal–Wallis, repeated-measures ANOVA, Friedman, chi-square (with Yates) and Fisher's exact test; Tukey HSD / Dunn / pairwise t / pairwise Wilcoxon post-hoc comparisons; effect sizes (Cohen's d, η², ε², Kendall's W, Cramér's V, odds ratio); box plot with significance brackets or a standardised-residual plot for contingency tables |
| **Differential Expression Analysis** | Expression matrix (genes × samples) plus sample group annotation (entered separately); data scale may be log2 values, raw intensities, or RNA-seq raw counts (auto-detected) | Compares the **two selected groups** (control vs treated) with Welch's t-test / Wilcoxon rank-sum test; log2FC, test statistics, P values, FDR, boxplots of the two selected groups, and a result table |
| **Survival Analysis** | Row-wise samples: follow-up time, event status, and group (column names are auto-detected; in the absence of a grouping variable, a continuous variable may be dichotomized at the median) | Kaplan–Meier step curves (95% CI, censoring marks), log-rank test, median survival summary, and risk table |
| **ROC Curve and AUC** | A true-label column plus one or more score columns | ROC curves for multiple markers, AUC (trapezoidal integration), Hanley–McNeil 95% CI, Youden optimal cutoff, sensitivity/specificity/PPV/NPV/accuracy/F1, confusion matrix, and threshold detail table |
| **Sequence and Protein Tools** | FASTA or plain sequence text (nucleic acid / protein is auto-detected) | Nucleic acids: reverse complement, GC content, base composition chart, six-frame translation, ORF search, codon usage table, and Tm estimation; proteins: molecular weight, isoelectric point (pI), amino acid composition, GRAVY, aromaticity, and hydrophobicity sliding window |
| **Deduplication / Uniquification** | Any tabular file (gene list or annotated multi-column table) | Four modes: removal of fully duplicated rows / deduplication by key column(s) (keeping first or last occurrence) / aggregation by key column(s) (mean, max, min, sum, count, etc.) / extraction of a unique value list |

All figures can be exported as **SVG** (vector format, suitable for manuscript preparation) and **PNG** (2× resolution; the network plot additionally supports 4× for 300-dpi output); all tables can be exported as **TSV / CSV**.

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
- **Differential expression**: each run compares the two selected groups with Welch's t-test (Welch–Satterthwaite degrees of freedom) or the Wilcoxon rank-sum test (normal approximation with tie and continuity corrections);
  samples of unselected groups are excluded, and this module deliberately performs no omnibus multi-group test.
  Data scales: log2 values (used as is), raw intensities (log2(x+1) per value), and RNA-seq raw counts (CPM normalisation per library, then log2(CPM+1); a limma-trend-like approximation — for exact negative-binomial inference use DESeq2 / edgeR).
- **Violin plot**: Gaussian kernel with bandwidth 0.9·σ·n^(−1/5) (Silverman's rule of thumb) multiplied by the bandwidth factor, where σ is the smaller of the standard deviation and IQR/1.349;
  the embedded box spans Q1–Q3 with 1.5×IQR whiskers; pairwise Welch t-tests are corrected together by BH.
- **Line chart**: lines connect the means at each position; the error band is the mean ± SD / ± SEM / 95% CI (mean ± t(0.975, n−1) × SEM);
  per-point significance compares each series with the first one by Welch's t-test with a single BH correction; the area under the curve uses the trapezoid rule.
- **3D scatter plot**: the data are rotated about the vertical axis (yaw) and then tilted (pitch), then painted far-to-near; the view is fitted automatically to the projected bounding box of the unit cube.
  The 95% confidence ellipsoid uses semi-axes √eigenvalue × √7.815 (the chi-square critical value with 3 degrees of freedom).
- **Statistical tests**: assumption checks use Shapiro–Wilk and Levene (median) / Bartlett; the test is chosen from the number of groups, the design and the assumption outcomes;
  Tukey HSD inverts the studentised-range distribution by numerical integration, and pairwise t / pairwise Wilcoxon comparisons are corrected by BH. Effect sizes are Cohen's d (and d_z), η², ε², Kendall's W, Cramér's V and the odds ratio.
- **Network plot**: input may be an edge list, an adjacency matrix (undirected; upper triangle only), or an expression matrix (pairwise Pearson / Spearman correlation with |r| cutoff and optional BH FDR filter on edges);
  the layout is a deterministic Fruchterman–Reingold force-directed algorithm (identical input yields an identical figure), with grouped, circular and grid alternatives.
- **Survival analysis**: Kaplan–Meier product-limit estimation; confidence intervals use the Greenwood variance with a linear approximation (±1.96·SE);
  the log-rank test is in the Mantel–Haenszel form `χ² = (O−E)′V⁻¹(O−E)`, consistent with R `survdiff`.
- **ROC / AUC**: AUC = trapezoidal integration, equivalent to Mann–Whitney U / (n₁n₂); the 95% CI uses the Hanley–McNeil approximation;
  the optimal cutoff is taken at the maximum Youden index (sensitivity + specificity − 1); the discrimination direction can be determined automatically (by group means) or specified manually.
- **Sequence analysis**: translation uses the standard or mitochondrial codon table; for Tm, the Wallace rule applies to ≤ 14 nt and a GC-based approximation to > 14 nt (a coarse estimate);
  protein molecular weight = sum of average residue masses + 18.0153 Da; pI is obtained by binary search for the zero net charge over pH 0–14 using a pKa table.

The statistical kernel (t / F / χ² distributions, Welch's t-test, Wilcoxon, ANOVA, Kruskal–Wallis, Tukey HSD, chi-square, Fisher's exact test, Kaplan–Meier, log-rank, etc.)
has been validated item by item against R reference values (see `selftest.html`).

## Directory Structure

```
index.html              Entry page
selftest.html           Automated self-test (statistical kernel / parsing / end-to-end tests for the home page and all 18 modules + residual Chinese-text scan in the English interface)
assets/css/style.css    Styles
assets/js/core/         Core layer: utils, i18n (bilingual), stats, parse, plot, ui
assets/js/data/demo.js  Example data (real gene symbols with a fixed random seed)
assets/js/tools/        The 18 analysis modules
assets/js/main.js       Navigation and routing
```

## Notes

- **The built-in example gene sets are intended only for functional illustration** (16 small example pathways). For formal analyses, upload the official MSigDB / GO / KEGG GMT files,
  or use "Retrieve Enrichr gene set library online" (requires a network connection; results are cached in the browser after the first retrieval).
- With the Enrichr source, the workflow is: enter the genes in the input box → choose the species and the annotation library → click "Run enrichment analysis". The selected library is downloaded automatically when the analysis starts, so no manual download step is required.
- The **background gene set** for enrichment analysis defaults to all genes in the gene set library. If only a subset of genes was assayed (e.g., a targeted panel or microarray), the true background must be specified.
- Recommendations for large datasets: number of UpSet sets ≤ 8; number of heatmap rows ≤ 500; number of correlation variables ≤ 60; violin plot variables ≤ 12; line-chart x positions ≤ 60; 3D scatter points ≤ 600; statistical-test groups ≤ 12; single file < 20 MB.
- **Differential expression compares two groups per run**; for experiments with more than two groups, select each pair and run separately (correcting across pairs), or use the one-way / repeated-measures ANOVA path in **Statistical tests**.
- The 3D scatter plot is a **projection**: on-screen distances change with the viewpoint and are not sample-to-sample distances, so quantitative comparisons should read the coordinates themselves.
- Survival analysis requires that **censoring and the event of interest be independent**; median survival is defined only when the survival probability falls below 50% within the follow-up period.
- The Youden optimal cutoff for ROC is provided for reference only; in practice, the threshold should be determined by weighing clinical or experimental considerations. The DeLong test should be considered when comparing AUC values across multiple markers.
- Tm estimates are approximate; for accurate quantification, a nearest-neighbor thermodynamic model incorporating salt concentration and Mg²⁺ should be used.
- Statistical significance does not imply biological significance; effect size and experimental design should be considered in combination.
