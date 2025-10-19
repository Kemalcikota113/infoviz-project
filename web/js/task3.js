/**
 * Task 3: Gender Patterns in Heart Disease
 * Do men and women show different patterns of heart disease prevalence?
 */

const Task3 = (() => {
  const CONTAINER = "#task3-chart";
  const STATS_CONTAINER = "#statistics-task3";
  const INSIGHTS_CONTAINER = "#insights-task3";
  const DATA_PATH = "../data/cleveland.csv";

  // Column names from dataset
  const COLUMNS = {
    sex: "sex",
    target: "target",
  };

  const CONFIG = {
    margin: { top: 48, right: 48, bottom: 64, left: 72 },
    containerHeight: 460,
    barRadius: 8,
  };

  const COLORS = {
    healthy: "#2ecc71",
    diseased: "#e74c3c",
    female: "#9b59b6",
    male: "#3498db",
    axis: "#1a1a1a",
  };

  const GENDER_LABELS = {
    0: "Female",
    1: "Male",
  };

  let data = [];
  let tooltip = null;
  let resizeListenerAttached = false;

  /**
   * Initialize visualization
   */
  async function init() {
    console.log("Initializing Task 3: Gender Patterns");

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      COLUMNS.sex,
      COLUMNS.target,
    ]);
    const cleanData = removeNullRecords(parsedData, [
      COLUMNS.sex,
      COLUMNS.target,
    ]);

    console.log(`Task 3: ${cleanData.length} records ready for visualization`);

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
      .attr("class", "stacked-bar-chart");

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.margin.left},${CONFIG.margin.top})`
      );

    const summary = summarizeByGender(chartData);
    const totals = summary.map((d) => d.total);

    const xScale = d3
      .scaleBand()
      .domain(summary.map((d) => d.label))
      .range([0, innerDims.width])
      .padding(0.35);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(totals) || 1])
      .nice()
      .range([innerDims.height, 0]);

    // Gridlines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("opacity", 0.12)
      .call(d3.axisLeft(yScale).tickSize(-innerDims.width).tickFormat(""));

    const groups = g
      .selectAll(".gender-group")
      .data(summary)
      .enter()
      .append("g")
      .attr("class", "gender-group")
      .attr("transform", (d) => `translate(${xScale(d.label)}, 0)`);

    const bandwidth = xScale.bandwidth();

    // Healthy segment (base)
    groups
      .append("rect")
      .attr("class", "bar-segment healthy")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.healthy))
      .attr("width", bandwidth)
      .attr("height", (d) => yScale(0) - yScale(d.healthy))
      .attr("fill", COLORS.healthy)
      .attr("rx", CONFIG.barRadius)
      .attr("ry", CONFIG.barRadius)
      .on("mouseenter", (event, d) =>
        showTooltip(
          tooltip,
          `<strong>${d.label}</strong><br>Healthy: ${d.healthy} patients<br>${(
            (d.healthy / d.total) * 100 || 0
          ).toFixed(1)}% of gender cohort`,
          event.pageX,
          event.pageY
        )
      )
      .on("mouseleave", () => hideTooltip(tooltip));

    // Diseased segment (stacked on top)
    groups
      .append("rect")
      .attr("class", "bar-segment diseased")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.total))
      .attr("width", bandwidth)
      .attr("height", (d) => Math.max(yScale(d.healthy) - yScale(d.total), 0))
      .attr("fill", COLORS.diseased)
      .attr("rx", CONFIG.barRadius)
      .attr("ry", CONFIG.barRadius)
      .on("mouseenter", (event, d) =>
        showTooltip(
          tooltip,
          `<strong>${d.label}</strong><br>Disease cases: ${
            d.diseased
          }<br>Prevalence: ${(d.diseaseRate * 100).toFixed(1)}%`,
          event.pageX,
          event.pageY
        )
      )
      .on("mouseleave", () => hideTooltip(tooltip));

    // Annotation labels (percent)
    groups
      .append("text")
      .attr("class", "bar-label")
      .attr("x", bandwidth / 2)
      .attr("y", (d) => yScale(d.total) - 8)
      .attr("text-anchor", "middle")
      .attr("fill", COLORS.axis)
      .style("font-weight", 600)
      .text((d) => `${(d.diseaseRate * 100).toFixed(1)}%`);

    // Sample size labels
    groups
      .append("text")
      .attr("class", "sample-label")
      .attr("x", bandwidth / 2)
      .attr("y", yScale(0) + 32)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging")
      .attr("fill", (d) => (d.sex === 0 ? COLORS.female : COLORS.male))
      .style("font-size", "12px")
      .text((d) => `${d.total} patients`);

    // Axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerDims.height})`)
      .call(d3.axisBottom(xScale))
      .call((axis) =>
        axis
          .append("text")
          .attr("x", innerDims.width / 2)
          .attr("y", 48)
          .attr("fill", COLORS.axis)
          .style("font-size", "13px")
          .style("font-weight", 600)
          .text("Gender")
      );

    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale))
      .call((axis) =>
        axis
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerDims.height / 2)
          .attr("y", -CONFIG.margin.left + 18)
          .attr("fill", COLORS.axis)
          .style("font-size", "13px")
          .style("font-weight", 600)
          .text("Patient Count")
      );

    // Legend
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerDims.width - 150}, 0)`);

    [
      { label: "Healthy", color: COLORS.healthy },
      { label: "Heart disease", color: COLORS.diseased },
    ].forEach((item, idx) => {
      const itemGroup = legend
        .append("g")
        .attr("transform", `translate(0, ${idx * 22})`);

      itemGroup
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", item.color)
        .attr("opacity", 0.85);

      itemGroup
        .append("text")
        .attr("x", 20)
        .attr("y", 11)
        .attr("fill", "#555")
        .style("font-size", "12px")
        .text(item.label);
    });
  }

  /**
   * Add statistics, insights, and responsive behaviour
   */
  function setupInteractions(chartData) {
    if (!chartData || chartData.length === 0) return;

    const statsPanel = d3.select(STATS_CONTAINER);
    const insightsPanel = d3.select(INSIGHTS_CONTAINER);

    const summary = summarizeByGender(chartData);
    const male = summary.find((d) => d.sex === 1);
    const female = summary.find((d) => d.sex === 0);

    if (!statsPanel.empty()) {
      const stats = [
        {
          label: "Female patients",
          value: female ? female.total : 0,
          subtext: female
            ? `${(female.diseaseRate * 100).toFixed(1)}% prevalence`
            : "No data",
        },
        {
          label: "Male patients",
          value: male ? male.total : 0,
          subtext: male
            ? `${(male.diseaseRate * 100).toFixed(1)}% prevalence`
            : "No data",
        },
        {
          label: "Risk gap (Male vs Female)",
          value:
            male && female
              ? `${((male.diseaseRate - female.diseaseRate) * 100).toFixed(
                  1
                )} percentage points`
              : "N/A",
          subtext: "Positive = higher male prevalence",
        },
        {
          label: "Overall disease prevalence",
          value: `${(
            (chartData.filter((d) => d[COLUMNS.target] > 0).length /
              chartData.length) *
            100
          ).toFixed(1)}%`,
        },
        {
          label: "Female healthy ratio",
          value: female
            ? `${female.healthy} / ${female.total} (${(
                (female.healthy / female.total) * 100 || 0
              ).toFixed(1)}%)`
            : "N/A",
        },
        {
          label: "Male healthy ratio",
          value: male
            ? `${male.healthy} / ${male.total} (${(
                (male.healthy / male.total) * 100 || 0
              ).toFixed(1)}%)`
            : "N/A",
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
      const riskGap =
        male && female ? (male.diseaseRate - female.diseaseRate) * 100 : 0;
      const higherRisk = riskGap > 0 ? "men" : "women";
      const absGap = Math.abs(riskGap).toFixed(1);

      insightsPanel.html(`
        <p><strong>Who is most at risk?</strong> ${
          absGap === "0.0"
            ? "Both genders show comparable heart disease prevalence in this cohort."
            : `Heart disease is ${absGap} percentage points more common among ${higherRisk}.`
        }</p>
        <p><strong>Protective signal:</strong> ${
          female && female.diseaseRate < male?.diseaseRate
            ? "Female patients exhibit a lower disease prevalence despite representing a sizable portion of the cohort."
            : "Male and female cohorts display similar protective patterns."
        }</p>
        <p><strong>Actionable takeaway:</strong> Regular cardiovascular screening should remain a priority for both genders, with tailored communication for the group demonstrating higher prevalence.</p>
      `);
    }

    if (!resizeListenerAttached) {
      window.addEventListener("resize", () => render(data));
      resizeListenerAttached = true;
    }
  }

  function summarizeByGender(dataset) {
    const genders = [0, 1];
    return genders
      .map((sex) => {
        const subset = dataset.filter((d) => d[COLUMNS.sex] === sex);
        const label = GENDER_LABELS[sex] || `Sex ${sex}`;
        const healthy = subset.filter((d) => d[COLUMNS.target] === 0).length;
        const diseased = subset.filter((d) => d[COLUMNS.target] > 0).length;
        const total = subset.length;

        return {
          sex,
          label,
          total,
          healthy,
          diseased,
          diseaseRate: total ? diseased / total : 0,
        };
      })
      .filter((d) => d.total > 0);
  }

  return {
    init,
    render,
    setupInteractions,
  };
})();
