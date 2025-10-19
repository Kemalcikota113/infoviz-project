/**
 * Task 1: Age vs Heart Disease
 * How does the likelihood of heart disease vary across different age groups?
 *
 * This visualization uses D3.js to create:
 * 1. Scatter plot with jitter showing individual records
 * 2. Histogram showing age distribution with disease breakdown
 */

const Task1 = (() => {
  const CONTAINER = "#scatter-chart";
  const STATS_CONTAINER = "#statistics-task1";
  const INSIGHTS_CONTAINER = "#insights-task1";
  const DATA_PATH = "../data/cleveland.csv";

  // Column names from dataset
  const COLUMNS = {
    age: "age",
    target: "target",
  };

  // Chart configuration
  const CONFIG = {
    margin: { top: 40, right: 40, bottom: 60, left: 70 },
    containerHeight: 600,
  };

  // Color scheme for disease status
  const COLORS = {
    healthy: "#2ecc71", // Green
    diseased: "#e74c3c", // Red
    axis: "#1a1a1a",
  };

  let data = [];
  let tooltip = null;

  /**
   * Initialize visualization
   */
  async function init() {
    console.log("Initializing Task 1: Age vs Heart Disease");

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      COLUMNS.age,
      COLUMNS.target,
    ]);
    data = removeNullRecords(parsedData, [COLUMNS.age, COLUMNS.target]);

    console.log(`Task 1: ${data.length} records ready for visualization`);

    // Create tooltip
    tooltip = createTooltip();

    // Render visualizations
    render(data);
    setupInteractions();
  }

  /**
   * Main render function for visualization
   */
  function render(chartData) {
    const container = document.querySelector(CONTAINER);
    if (!container) {
      console.error("Container not found:", CONTAINER);
      return;
    }

    // Clear existing content
    container.innerHTML = "";

    // Get container dimensions
    const containerWidth = container.clientWidth;

    // Create two-column layout for scatter plot and histogram
    const wrapper = d3
      .select(container)
      .append("div")
      .style("display", "flex")
      .style("gap", "24px")
      .style("width", "100%");

    // Render scatter plot on the left
    renderScatterPlot(chartData, wrapper, (containerWidth - 24) / 2);

    // Render histogram on the right
    renderHistogram(chartData, wrapper, (containerWidth - 24) / 2);
  }

  /**
   * Render density plot showing age distribution by disease status
   */
  function renderScatterPlot(chartData, wrapper, width) {
    const height = CONFIG.containerHeight;
    const innerDims = getInnerDimensions(width, height, CONFIG.margin);

    // Create container
    const scatterContainer = wrapper
      .append("div")
      .style("flex", "1")
      .style("display", "flex")
      .style("flex-direction", "column");

    // Create SVG
    const svg = d3
      .select(scatterContainer.node())
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid #e8e8e8");

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.margin.left},${CONFIG.margin.top})`
      );

    // Separate data by disease status
    const healthyAges = chartData
      .filter((d) => d[COLUMNS.target] === 0)
      .map((d) => d[COLUMNS.age]);
    const diseasedAges = chartData
      .filter((d) => d[COLUMNS.target] > 0)
      .map((d) => d[COLUMNS.age]);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([
        d3.min(chartData, (d) => d[COLUMNS.age]) - 2,
        d3.max(chartData, (d) => d[COLUMNS.age]) + 2,
      ])
      .range([0, innerDims.width]);

    // Create kernel density estimation function
    const kde = (kernel, thresholds) => (data) => {
      return thresholds.map((t) => [t, d3.mean(data, (d) => kernel(t - d))]);
    };

    // Epanechnikov kernel
    const kernel = (v) => {
      return Math.abs((v /= 4.5)) <= 1 ? (0.75 * (1 - v * v)) / 4.5 : 0;
    };

    // Create thresholds for density estimation
    const thresholds = d3.range(
      d3.min(chartData, (d) => d[COLUMNS.age]) - 2,
      d3.max(chartData, (d) => d[COLUMNS.age]) + 2,
      0.5
    );
    const kdeFunc = kde(kernel, thresholds);

    // Calculate density curves
    const healthyDensity = kdeFunc(healthyAges);
    const diseasedDensity = kdeFunc(diseasedAges);

    // Y scale for density
    const maxDensity = Math.max(
      d3.max(healthyDensity, (d) => d[1]),
      d3.max(diseasedDensity, (d) => d[1])
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, maxDensity])
      .range([innerDims.height, 0]);

    // Add gridlines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(yScale).tickSize(-innerDims.width).tickFormat(""));

    // Create line generator
    const line = d3
      .line()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]));

    // Draw healthy density curve
    g.append("path")
      .datum(healthyDensity)
      .attr("fill", COLORS.healthy)
      .attr("fill-opacity", 0.3)
      .attr("stroke", COLORS.healthy)
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Draw diseased density curve
    g.append("path")
      .datum(diseasedDensity)
      .attr("fill", COLORS.diseased)
      .attr("fill-opacity", 0.3)
      .attr("stroke", COLORS.diseased)
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerDims.height})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .append("text")
      .attr("class", "axis-label")
      .attr("x", innerDims.width / 2)
      .attr("y", 45)
      .attr("fill", COLORS.axis)
      .style("font-size", "13px")
      .style("font-weight", "500")
      .text("Age (years)");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - CONFIG.margin.left + 15)
      .attr("x", 0 - innerDims.height / 2)
      .attr("dy", "1em")
      .attr("fill", COLORS.axis)
      .style("font-size", "13px")
      .style("font-weight", "500")
      .text("Density");

    // Add legend
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerDims.width - 150}, -25)`);

    const legendItems = [
      { label: "No Disease", color: COLORS.healthy },
      { label: "Disease Present", color: COLORS.diseased },
    ];

    legendItems.forEach((item, i) => {
      const item_g = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      item_g
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", item.color)
        .attr("opacity", 0.6);

      item_g
        .append("text")
        .attr("x", 16)
        .attr("y", 9)
        .attr("fill", "#666")
        .style("font-size", "12px")
        .text(item.label);
    });
  }

  /**
   * Render histogram with disease breakdown
   */
  function renderHistogram(chartData, wrapper, width) {
    const height = CONFIG.containerHeight;
    const innerDims = getInnerDimensions(width, height, CONFIG.margin);

    // Create container
    const histContainer = wrapper
      .append("div")
      .style("flex", "1")
      .style("display", "flex")
      .style("flex-direction", "column");

    // Create SVG
    const svg = d3
      .select(histContainer.node())
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid #e8e8e8");

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.margin.left},${CONFIG.margin.top})`
      );

    // Create histogram bins
    const bins = d3
      .histogram()
      .domain([
        d3.min(chartData, (d) => d[COLUMNS.age]),
        d3.max(chartData, (d) => d[COLUMNS.age]),
      ])
      .thresholds(12)(chartData.map((d) => d[COLUMNS.age]));

    // Process bins to show disease breakdown
    const binnedData = bins
      .map((bin) => {
        const diseased = bin.filter((age) => {
          const record = chartData.find((d) => d[COLUMNS.age] === age);
          return record && record[COLUMNS.target] > 0;
        }).length;
        return {
          x0: bin.x0,
          x1: bin.x1,
          total: bin.length,
          diseased,
          healthy: bin.length - diseased,
        };
      })
      .filter((d) => d.total > 0);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([
        d3.min(chartData, (d) => d[COLUMNS.age]) - 2,
        d3.max(chartData, (d) => d[COLUMNS.age]) + 2,
      ])
      .range([0, innerDims.width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(binnedData, (d) => d.total)])
      .range([innerDims.height, 0]);

    // Add gridlines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(yScale).tickSize(-innerDims.width).tickFormat(""));

    // Draw stacked bars
    const barWidth = innerDims.width / binnedData.length - 1;

    // Healthy bars (bottom)
    g.selectAll(".bar-healthy")
      .data(binnedData)
      .enter()
      .append("rect")
      .attr("class", "bar-healthy")
      .attr("x", (d) => xScale(d.x0) + 0.5)
      .attr("y", (d) => yScale(d.total))
      .attr("width", Math.max(barWidth, 1))
      .attr("height", (d) => yScale(0) - yScale(d.healthy))
      .attr("fill", COLORS.healthy)
      .attr("opacity", 0.8)
      .on("mouseenter", function (event, d) {
        showTooltip(
          tooltip,
          `Age: ${Math.round(d.x0)}-${Math.round(d.x1)}<br>Healthy: ${
            d.healthy
          }<br>Total: ${d.total}`,
          event.pageX,
          event.pageY
        );
      })
      .on("mouseleave", () => hideTooltip(tooltip));

    // Diseased bars (top, stacked)
    g.selectAll(".bar-diseased")
      .data(binnedData)
      .enter()
      .append("rect")
      .attr("class", "bar-diseased")
      .attr("x", (d) => xScale(d.x0) + 0.5)
      .attr("y", (d) => yScale(d.diseased))
      .attr("width", Math.max(barWidth, 1))
      .attr("height", (d) => yScale(0) - yScale(d.diseased))
      .attr("fill", COLORS.diseased)
      .attr("opacity", 0.8)
      .on("mouseenter", function (event, d) {
        showTooltip(
          tooltip,
          `Age: ${Math.round(d.x0)}-${Math.round(d.x1)}<br>Diseased: ${
            d.diseased
          }<br>Total: ${d.total}`,
          event.pageX,
          event.pageY
        );
      })
      .on("mouseleave", () => hideTooltip(tooltip));

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerDims.height})`)
      .call(d3.axisBottom(xScale).ticks(8))
      .append("text")
      .attr("class", "axis-label")
      .attr("x", innerDims.width / 2)
      .attr("y", 45)
      .attr("fill", COLORS.axis)
      .style("font-size", "13px")
      .style("font-weight", "500")
      .text("Age (years)");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - CONFIG.margin.left + 15)
      .attr("x", 0 - innerDims.height / 2)
      .attr("dy", "1em")
      .attr("fill", COLORS.axis)
      .style("font-size", "13px")
      .style("font-weight", "500")
      .text("Patient Count");

    // Add legend
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerDims.width - 150}, -25)`);

    const legendItems = [
      { label: "No Disease", color: COLORS.healthy },
      { label: "Disease Present", color: COLORS.diseased },
    ];

    legendItems.forEach((item, i) => {
      const item_g = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      item_g
        .append("rect")
        .attr("width", 8)
        .attr("height", 8)
        .attr("fill", item.color)
        .attr("opacity", 0.8);

      item_g
        .append("text")
        .attr("x", 12)
        .attr("y", 8)
        .attr("fill", "#666")
        .style("font-size", "12px")
        .text(item.label);
    });
  }

  /**
   * Setup interactive features and statistics
   */
  function setupInteractions() {
    // Calculate and display statistics
    const healthy = data.filter((d) => d[COLUMNS.target] === 0);
    const diseased = data.filter((d) => d[COLUMNS.target] > 0);

    const stats = [
      {
        label: "Total Patients",
        value: data.length,
      },
      {
        label: "No Disease",
        value: healthy.length,
        percent: ((healthy.length / data.length) * 100).toFixed(1) + "%",
      },
      {
        label: "Disease Present",
        value: diseased.length,
        percent: ((diseased.length / data.length) * 100).toFixed(1) + "%",
      },
      {
        label: "Healthy Avg Age",
        value: d3.mean(healthy, (d) => d[COLUMNS.age]).toFixed(1) + " yrs",
      },
      {
        label: "Diseased Avg Age",
        value: d3.mean(diseased, (d) => d[COLUMNS.age]).toFixed(1) + " yrs",
      },
      {
        label: "Age Range",
        value: `${Math.round(d3.min(data, (d) => d[COLUMNS.age]))}-${Math.round(
          d3.max(data, (d) => d[COLUMNS.age])
        )} yrs`,
      },
    ];

    // Render stats
    const statsPanel = d3.select(STATS_CONTAINER);
    if (!statsPanel.empty()) {
      statsPanel.selectAll(".stat-card").remove();
      stats.forEach((stat) => {
        const statDiv = statsPanel.append("div").attr("class", "stat-card");

        statDiv.append("div").attr("class", "stat-label").text(stat.label);

        statDiv.append("div").attr("class", "stat-value").text(stat.value);

        if (stat.percent) {
          statDiv
            .append("div")
            .attr("class", "stat-subtext")
            .text(stat.percent);
        }
      });
    }

    // Add insights
    const insights = d3.select(INSIGHTS_CONTAINER);
    if (!insights.empty()) {
      const ageGap = (
        d3.mean(diseased, (d) => d[COLUMNS.age]) -
        d3.mean(healthy, (d) => d[COLUMNS.age])
      ).toFixed(1);
      const healthyPct = ((healthy.length / data.length) * 100).toFixed(1);

      insights.html(`
        <p><strong>Average Age Difference:</strong> Diseased patients are ${Math.abs(
          ageGap
        )} years ${
        ageGap > 0 ? "older" : "younger"
      } on average compared to healthy patients.</p>
        <p><strong>Disease Prevalence:</strong> ${healthyPct}% of the cohort shows no signs of heart disease, while ${(
        100 - healthyPct
      ).toFixed(1)}% have varying degrees of disease presence.</p>
        <p><strong>Clinical Relevance:</strong> Age is a significant factor in heart disease risk, supporting the importance of age-stratified screening and prevention programs.</p>
      `);
    }
  }

  return {
    init,
    render,
    setupInteractions,
  };
})();
