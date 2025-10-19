/**
 * Task 2: Cholesterol & Resting Blood Pressure vs Heart Disease
 * Is there a relationship between cholesterol level and resting blood pressure,
 * and does this relationship differ between patients with and without heart disease?
 */

const Task2 = (() => {
  const CONTAINER = "#task2-chart";
  const STATS_CONTAINER = "#statistics-task2";
  const INSIGHTS_CONTAINER = "#insights-task2";
  const DATA_PATH = "../data/cleveland.csv";

  // Column names from dataset
  const COLUMNS = {
    cholesterol: "chol",
    restingBP: "trestbps",
    target: "target",
  };

  const CONFIG = {
    margin: { top: 48, right: 48, bottom: 72, left: 72 },
    containerHeight: 520,
    pointRadius: 6,
  };

  const COLORS = {
    healthy: "#2ecc71",
    diseased: "#e74c3c",
    axis: "#1a1a1a",
    threshold: "#7f8c8d",
    quadrant: "#f7b7a3",
  };

  const THRESHOLDS = {
    cholesterol: 200, // mg/dL (borderline high)
    restingBP: 140, // mmHg (stage 2 hypertension)
  };

  let data = [];
  let tooltip = null;
  let resizeListenerAttached = false;

  /**
   * Initialize visualization
   */
  async function init() {
    console.log(
      "Initializing Task 2: Cholesterol & Resting BP vs Heart Disease"
    );

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      COLUMNS.cholesterol,
      COLUMNS.restingBP,
      COLUMNS.target,
    ]);
    const cleanData = removeNullRecords(parsedData, [
      COLUMNS.cholesterol,
      COLUMNS.restingBP,
      COLUMNS.target,
    ]);
    console.log(`Task 2: ${cleanData.length} records ready for visualization`);

    data = cleanData;
    tooltip = createTooltip();

    render(data);
    setupInteractions(data);
  }

  /**
   * Main render function for visualization
   */
  function render(chartData = data) {
    if (!chartData || chartData.length === 0) return;

    const container = document.querySelector(CONTAINER);
    if (!container) {
      console.error("Container not found:", CONTAINER);
      return;
    }

    container.innerHTML = "";

    const width = Math.max(container.clientWidth, 320);
    const height = CONFIG.containerHeight;
    const innerDims = getInnerDimensions(width, height, CONFIG.margin);

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "scatter-plot");

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.margin.left},${CONFIG.margin.top})`
      );

    // Scales
    const xDomain = d3.extent(chartData, (d) => d[COLUMNS.cholesterol]);
    const yDomain = d3.extent(chartData, (d) => d[COLUMNS.restingBP]);

    const xPadding = (xDomain[1] - xDomain[0]) * 0.08;
    const yPadding = (yDomain[1] - yDomain[0]) * 0.08;

    const xScale = d3
      .scaleLinear()
      .domain([xDomain[0] - xPadding, xDomain[1] + xPadding])
      .range([0, innerDims.width]);

    const yScale = d3
      .scaleLinear()
      .domain([yDomain[0] - yPadding, yDomain[1] + yPadding])
      .range([innerDims.height, 0]);

    const axisBottom = d3
      .axisBottom(xScale)
      .ticks(8)
      .tickFormat((d) => `${Math.round(d)}`);

    const axisLeft = d3
      .axisLeft(yScale)
      .ticks(8)
      .tickFormat((d) => `${Math.round(d)}`);

    // Gridlines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("opacity", 0.12)
      .call(d3.axisLeft(yScale).tickSize(-innerDims.width).tickFormat(""));

    g.append("g")
      .attr("class", "grid-lines")
      .attr("opacity", 0.12)
      .attr("transform", `translate(0, ${innerDims.height})`)
      .call(d3.axisBottom(xScale).tickSize(-innerDims.height).tickFormat(""));

    // Quadrant shading (high cholesterol & high BP)
    const highCholX = xScale(THRESHOLDS.cholesterol);
    const highBpY = yScale(THRESHOLDS.restingBP);
    if (
      isFinite(highCholX) &&
      isFinite(highBpY) &&
      highCholX < innerDims.width &&
      highBpY > 0
    ) {
      g.append("rect")
        .attr("class", "quadrant-risk")
        .attr("x", Math.max(highCholX, 0))
        .attr("y", 0)
        .attr("width", innerDims.width - Math.max(highCholX, 0))
        .attr("height", Math.max(highBpY, 0))
        .attr("fill", COLORS.quadrant)
        .attr("opacity", 0.12);
    }

    // Threshold reference lines
    g.append("line")
      .attr("class", "threshold-line")
      .attr("x1", xScale(THRESHOLDS.cholesterol))
      .attr("x2", xScale(THRESHOLDS.cholesterol))
      .attr("y1", 0)
      .attr("y2", innerDims.height)
      .attr("stroke", COLORS.threshold)
      .attr("stroke-dasharray", "6 6")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9);

    g.append("line")
      .attr("class", "threshold-line")
      .attr("x1", 0)
      .attr("x2", innerDims.width)
      .attr("y1", yScale(THRESHOLDS.restingBP))
      .attr("y2", yScale(THRESHOLDS.restingBP))
      .attr("stroke", COLORS.threshold)
      .attr("stroke-dasharray", "6 6")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.9);

    // Threshold labels
    g.append("text")
      .attr("class", "threshold-label")
      .attr("x", xScale(THRESHOLDS.cholesterol) + 6)
      .attr("y", 16)
      .attr("fill", COLORS.threshold)
      .style("font-size", "12px")
      .text(`Cholesterol ${THRESHOLDS.cholesterol} mg/dL`);

    g.append("text")
      .attr("class", "threshold-label")
      .attr("x", innerDims.width - 180)
      .attr("y", yScale(THRESHOLDS.restingBP) - 8)
      .attr("fill", COLORS.threshold)
      .style("font-size", "12px")
      .text(`Resting BP ${THRESHOLDS.restingBP} mmHg`);

    // Points
    g.selectAll(".patient-point")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "patient-point")
      .attr("cx", (d) => xScale(d[COLUMNS.cholesterol]))
      .attr("cy", (d) => yScale(d[COLUMNS.restingBP]))
      .attr("r", CONFIG.pointRadius)
      .attr("fill", (d) =>
        d[COLUMNS.target] === 0 ? COLORS.healthy : COLORS.diseased
      )
      .attr("fill-opacity", 0.75)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.2)
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr(
            "stroke",
            d[COLUMNS.target] === 0 ? COLORS.healthy : COLORS.diseased
          )
          .attr("stroke-width", 2);
        showTooltip(
          tooltip,
          `<strong>Patient Profile</strong><br>
           Cholesterol: ${d[COLUMNS.cholesterol]} mg/dL<br>
           Resting BP: ${d[COLUMNS.restingBP]} mmHg<br>
           Status: ${d[COLUMNS.target] === 0 ? "No disease" : "Heart disease"}`,
          event.pageX,
          event.pageY
        );
      })
      .on("mousemove", (event) => {
        if (tooltip) {
          const { pageX, pageY } = event;
          tooltip.style.left = `${pageX + 12}px`;
          tooltip.style.top = `${pageY + 12}px`;
        }
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke", "#ffffff").attr("stroke-width", 1.2);
        hideTooltip(tooltip);
      });

    // Axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerDims.height})`)
      .call(axisBottom)
      .call((axis) =>
        axis
          .append("text")
          .attr("x", innerDims.width / 2)
          .attr("y", 56)
          .attr("fill", COLORS.axis)
          .style("font-size", "13px")
          .style("font-weight", 600)
          .text("Cholesterol (mg/dL)")
      );

    g.append("g")
      .attr("class", "y-axis")
      .call(axisLeft)
      .call((axis) =>
        axis
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerDims.height / 2)
          .attr("y", -CONFIG.margin.left + 18)
          .attr("fill", COLORS.axis)
          .style("font-size", "13px")
          .style("font-weight", 600)
          .text("Resting Blood Pressure (mmHg)")
      );

    // Regression lines per cohort
    const healthyPatients = chartData.filter((d) => d[COLUMNS.target] === 0);
    const diseasedPatients = chartData.filter((d) => d[COLUMNS.target] > 0);

    drawRegressionLine(g, healthyPatients, xScale, yScale, COLORS.healthy);
    drawRegressionLine(g, diseasedPatients, xScale, yScale, COLORS.diseased);

    // Legend
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerDims.width - 180}, ${16})`);

    const legendItems = [
      { label: "No disease", color: COLORS.healthy },
      { label: "Heart disease", color: COLORS.diseased },
    ];

    legendItems.forEach((item, index) => {
      const group = legend
        .append("g")
        .attr("transform", `translate(0, ${index * 22})`);

      group
        .append("circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", item.color)
        .attr("opacity", 0.85)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1);

      group
        .append("text")
        .attr("x", 14)
        .attr("y", 4)
        .attr("fill", "#555")
        .style("font-size", "12px")
        .text(item.label);
    });

    // Quadrant annotations
    g.append("text")
      .attr("class", "quadrant-label")
      .attr("x", innerDims.width - 8)
      .attr("y", 16)
      .attr("text-anchor", "end")
      .attr("fill", "#b33939")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .text("High cholesterol & high BP");
  }

  /**
   * Add interactive features (statistics, insights, responsiveness)
   */
  function setupInteractions(chartData) {
    if (!chartData || chartData.length === 0) return;

    const statsPanel = d3.select(STATS_CONTAINER);
    const insightsPanel = d3.select(INSIGHTS_CONTAINER);

    const healthy = chartData.filter((d) => d[COLUMNS.target] === 0);
    const diseased = chartData.filter((d) => d[COLUMNS.target] > 0);

    const cholesterolStats = getColumnStats(chartData, COLUMNS.cholesterol);
    const bpStats = getColumnStats(chartData, COLUMNS.restingBP);
    const correlation = calculateCorrelation(
      chartData,
      COLUMNS.cholesterol,
      COLUMNS.restingBP
    );

    const quadrantSummary = summarizeQuadrants(chartData);

    if (!statsPanel.empty()) {
      const stats = [
        {
          label: "Total Patients",
          value: chartData.length,
        },
        {
          label: "Avg Cholesterol (No Disease)",
          value: `${d3
            .mean(healthy, (d) => d[COLUMNS.cholesterol])
            .toFixed(1)} mg/dL`,
        },
        {
          label: "Avg Cholesterol (Heart Disease)",
          value: `${d3
            .mean(diseased, (d) => d[COLUMNS.cholesterol])
            .toFixed(1)} mg/dL`,
        },
        {
          label: "Avg Resting BP (No Disease)",
          value: `${d3
            .mean(healthy, (d) => d[COLUMNS.restingBP])
            .toFixed(1)} mmHg`,
        },
        {
          label: "Avg Resting BP (Heart Disease)",
          value: `${d3
            .mean(diseased, (d) => d[COLUMNS.restingBP])
            .toFixed(1)} mmHg`,
        },
        {
          label: "Pearson Correlation",
          value: correlation !== null ? correlation.toFixed(2) : "N/A",
          subtext: "Between cholesterol and resting BP",
        },
        {
          label: "Cholesterol Range",
          value: `${cholesterolStats.min} – ${cholesterolStats.max} mg/dL`,
        },
        {
          label: "Resting BP Range",
          value: `${bpStats.min} – ${bpStats.max} mmHg`,
        },
      ];

      statsPanel.selectAll(".stat-card").remove();
      const cards = statsPanel
        .selectAll(".stat-card")
        .data(stats)
        .enter()
        .append("div")
        .attr("class", "stat-card");

      cards
        .append("div")
        .attr("class", "stat-label")
        .text((d) => d.label);

      cards
        .append("div")
        .attr("class", "stat-value")
        .text((d) => d.value);

      cards
        .filter((d) => d.subtext)
        .append("div")
        .attr("class", "stat-subtext")
        .text((d) => d.subtext);
    }

    if (!insightsPanel.empty()) {
      const highRiskCount = quadrantSummary.totals.highRisk;
      const highRiskDiseasePct =
        highRiskCount === 0
          ? 0
          : (quadrantSummary.diseaseCounts.highRisk / highRiskCount) * 100;
      const overallDiseasePct = (diseased.length / chartData.length) * 100;

      const cholOnlyDiseasePct =
        quadrantSummary.totals.cholOnly === 0
          ? 0
          : (quadrantSummary.diseaseCounts.cholOnly /
              quadrantSummary.totals.cholOnly) *
            100;

      const bpOnlyDiseasePct =
        quadrantSummary.totals.bpOnly === 0
          ? 0
          : (quadrantSummary.diseaseCounts.bpOnly /
              quadrantSummary.totals.bpOnly) *
            100;

      insightsPanel.html(`
        <p><strong>Risk Concentration:</strong> Patients exceeding both thresholds account for ${highRiskCount} cases (${(
        (highRiskCount / chartData.length) *
        100
      ).toFixed(
        1
      )}% of the cohort). Within this quadrant, ${highRiskDiseasePct.toFixed(
        1
      )}% have diagnosed heart disease (overall prevalence: ${overallDiseasePct.toFixed(
        1
      )}%).</p>
        <p><strong>Single-factor Risk:</strong> Elevated cholesterol alone corresponds to a ${cholOnlyDiseasePct.toFixed(
          1
        )}% disease rate, while elevated blood pressure alone corresponds to ${bpOnlyDiseasePct.toFixed(
        1
      )}%.</p>
        <p><strong>Combined Signal:</strong> The positive correlation (r = ${
          correlation !== null ? correlation.toFixed(2) : "N/A"
        }) indicates that cholesterol and resting blood pressure frequently rise together, reinforcing the need for dual management.</p>
      `);
    }

    if (!resizeListenerAttached) {
      window.addEventListener("resize", () => render(data));
      resizeListenerAttached = true;
    }
  }

  function drawRegressionLine(group, dataset, xScale, yScale, color) {
    if (!dataset || dataset.length < 2) return;

    const regression = calculateLinearRegression(
      dataset,
      COLUMNS.cholesterol,
      COLUMNS.restingBP
    );

    if (!regression) return;

    const [xMin, xMax] = xScale.domain();
    const linePoints = [xMin, xMax].map((x) => ({
      x,
      y: regression.slope * x + regression.intercept,
    }));

    group
      .append("path")
      .datum(linePoints)
      .attr("class", "regression-line")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8 6")
      .attr("opacity", 0.9)
      .attr(
        "d",
        d3
          .line()
          .x((d) => xScale(d.x))
          .y((d) => yScale(d.y))
      );
  }

  function calculateLinearRegression(dataset, xKey, yKey) {
    const n = dataset.length;
    if (n < 2) return null;

    const sumX = d3.sum(dataset, (d) => d[xKey]);
    const sumY = d3.sum(dataset, (d) => d[yKey]);
    const sumXY = d3.sum(dataset, (d) => d[xKey] * d[yKey]);
    const sumX2 = d3.sum(dataset, (d) => d[xKey] * d[xKey]);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = sumY / n - (slope * sumX) / n;

    return { slope, intercept };
  }

  function calculateCorrelation(dataset, xKey, yKey) {
    const valid = dataset.filter((d) => isFinite(d[xKey]) && isFinite(d[yKey]));
    const n = valid.length;
    if (n < 2) return null;

    const meanX = d3.mean(valid, (d) => d[xKey]);
    const meanY = d3.mean(valid, (d) => d[yKey]);

    const numerator = d3.sum(
      valid,
      (d) => (d[xKey] - meanX) * (d[yKey] - meanY)
    );
    const denom = Math.sqrt(
      d3.sum(valid, (d) => Math.pow(d[xKey] - meanX, 2)) *
        d3.sum(valid, (d) => Math.pow(d[yKey] - meanY, 2))
    );

    if (denom === 0) return 0;
    return numerator / denom;
  }

  function summarizeQuadrants(dataset) {
    const summary = {
      totals: { highRisk: 0, cholOnly: 0, bpOnly: 0, optimal: 0 },
      diseaseCounts: { highRisk: 0, cholOnly: 0, bpOnly: 0, optimal: 0 },
    };

    dataset.forEach((d) => {
      const highChol = d[COLUMNS.cholesterol] >= THRESHOLDS.cholesterol;
      const highBp = d[COLUMNS.restingBP] >= THRESHOLDS.restingBP;
      let key = "optimal";

      if (highChol && highBp) key = "highRisk";
      else if (highChol) key = "cholOnly";
      else if (highBp) key = "bpOnly";

      summary.totals[key] += 1;
      if (d[COLUMNS.target] > 0) summary.diseaseCounts[key] += 1;
    });

    return summary;
  }

  return {
    init,
    render,
    setupInteractions,
  };
})();
