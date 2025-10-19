/**
 * Task 4: Chest Pain Types and Heart Disease
 * Which chest pain types are most commonly associated with heart disease?
 */

const Task4 = (() => {
  const CONTAINER = "#task4-chart";
  const STATS_CONTAINER = "#statistics-task4";
  const INSIGHTS_CONTAINER = "#insights-task4";
  const DATA_PATH = "../data/cleveland.csv";

  // Column names from dataset
  const COLUMNS = {
    chestPain: "cp",
    target: "target",
  };

  const CONFIG = {
    margin: { top: 70, right: 48, bottom: 80, left: 140 },
    containerHeight: 420,
    cellCorner: 12,
  };

  const COLORS = {
    healthy: "#2ecc71",
    diseased: "#e74c3c",
    axis: "#1a1a1a",
  };

  const CHEST_PAIN_LABELS = {
    0: "Typical angina",
    1: "Atypical angina",
    2: "Non-anginal pain",
    3: "Asymptomatic",
  };

  let data = [];
  let tooltip = null;
  let resizeListenerAttached = false;

  /**
   * Initialize visualization
   */
  async function init() {
    console.log("Initializing Task 4: Chest Pain Types");

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      COLUMNS.chestPain,
      COLUMNS.target,
    ]);
    const cleanData = removeNullRecords(parsedData, [
      COLUMNS.chestPain,
      COLUMNS.target,
    ]);

    console.log(`Task 4: ${cleanData.length} records ready for visualization`);

    data = cleanData;
    tooltip = createTooltip();

    render(data);
    setupInteractions(data);
  }

  /**
   * Render chest pain heatmap
   */
  function render(chartData = data) {
    if (!chartData || chartData.length === 0) return;

    const container = document.querySelector(CONTAINER);
    if (!container) {
      console.error("Container not found:", CONTAINER);
      return;
    }

    container.innerHTML = "";

    const width = Math.max(container.clientWidth, 360);
    const height = CONFIG.containerHeight;
    const innerDims = getInnerDimensions(width, height, CONFIG.margin);

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "heatmap-chart");

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${CONFIG.margin.left},${CONFIG.margin.top})`
      );

    const summary = summarizeChestPain(chartData);
    const statuses = [
      { key: "healthy", label: "No disease" },
      { key: "diseased", label: "Disease present" },
    ];

    const matrixData = [];
    summary.forEach((cp) => {
      statuses.forEach((status) => {
        matrixData.push({
          cp: cp.cp,
          label: cp.label,
          status: status.label,
          key: status.key,
          count: status.key === "healthy" ? cp.healthy : cp.diseased,
          total: cp.total,
          rate:
            status.key === "healthy"
              ? cp.total
                ? cp.healthy / cp.total
                : 0
              : cp.total
              ? cp.diseased / cp.total
              : 0,
        });
      });
    });

    const xScale = d3
      .scaleBand()
      .domain(summary.map((d) => d.label))
      .range([0, innerDims.width])
      .padding(0.1);

    const yScale = d3
      .scaleBand()
      .domain(statuses.map((d) => d.label))
      .range([0, innerDims.height])
      .padding(0.25);

    const healthyColor = d3
      .scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateGreens);
    const diseasedColor = d3
      .scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateReds);

    // Cells
    const cells = g
      .selectAll(".heatmap-cell")
      .data(matrixData)
      .enter()
      .append("g")
      .attr("class", "heatmap-cell")
      .attr(
        "transform",
        (d) => `translate(${xScale(d.label)}, ${yScale(d.status)})`
      );

    const cellWidth = xScale.bandwidth();
    const cellHeight = yScale.bandwidth();

    cells
      .append("rect")
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("rx", CONFIG.cellCorner)
      .attr("ry", CONFIG.cellCorner)
      .attr("fill", (d) =>
        d.key === "healthy" ? healthyColor(d.rate) : diseasedColor(d.rate)
      )
      .attr("stroke", "rgba(0,0,0,0.05)")
      .attr("stroke-width", 1.5)
      .on("mouseenter", (event, d) => {
        const prevalence = d.total ? ((d.count / d.total) * 100).toFixed(1) : 0;
        showTooltip(
          tooltip,
          `<strong>${d.label}</strong><br>${d.status}<br>${d.count} patients (${prevalence}%)`,
          event.pageX,
          event.pageY
        );
      })
      .on("mousemove", (event) => {
        if (!tooltip) return;
        tooltip.style.left = `${event.pageX + 12}px`;
        tooltip.style.top = `${event.pageY + 12}px`;
      })
      .on("mouseleave", () => hideTooltip(tooltip));

    cells
      .append("text")
      .attr("class", "cell-count")
      .attr("x", cellWidth / 2)
      .attr("y", cellHeight / 2 - 2)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => (d.key === "healthy" ? "#155724" : "#7d1b1b"))
      .style("font-weight", 600)
      .text((d) => d.count);

    cells
      .append("text")
      .attr("class", "cell-percent")
      .attr("x", cellWidth / 2)
      .attr("y", cellHeight / 2 + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#3a3a3a")
      .style("font-size", "12px")
      .text((d) => `${(d.rate * 100).toFixed(1)}%`);

    // Axes labels
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerDims.height})`)
      .call(xAxis)
      .selectAll("text")
      .call(wrapAxisLabels, xScale.bandwidth());

    g.select(".x-axis")
      .append("text")
      .attr("x", innerDims.width / 2)
      .attr("y", 60)
      .attr("fill", COLORS.axis)
      .style("font-weight", 600)
      .style("font-size", "13px")
      .text("Chest pain classification");

    g.append("g").attr("class", "y-axis").call(yAxis);

    g.select(".y-axis")
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerDims.height / 2)
      .attr("y", -CONFIG.margin.left + 20)
      .attr("fill", COLORS.axis)
      .style("font-weight", 600)
      .style("font-size", "13px")
      .text("Outcome");

    // Legend
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${innerDims.width + 24}, 0)`);

    const legendItems = [
      { label: "Higher proportion healthy", gradient: d3.interpolateGreens },
      { label: "Higher proportion disease", gradient: d3.interpolateReds },
    ];

    const defs = svg.append("defs");

    legendItems.forEach((item, idx) => {
      const legendGroup = legend
        .append("g")
        .attr("transform", `translate(0, ${idx * 70})`);

      const gradientId = `cp-legend-${idx}`;
      const gradient = defs
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

      [0, 1].forEach((stop) => {
        gradient
          .append("stop")
          .attr("offset", `${stop * 100}%`)
          .attr("stop-color", item.gradient(stop));
      });

      legendGroup
        .append("rect")
        .attr("width", 120)
        .attr("height", 16)
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("fill", `url(#${gradientId})`)
        .attr("stroke", "rgba(0,0,0,0.05)");

      legendGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 32)
        .attr("fill", "#555")
        .style("font-size", "12px")
        .text(item.label);
    });
  }

  /**
   * Populate stats, insights, and responsiveness
   */
  function setupInteractions(chartData) {
    if (!chartData || chartData.length === 0) return;

    const statsPanel = d3.select(STATS_CONTAINER);
    const insightsPanel = d3.select(INSIGHTS_CONTAINER);
    const summary = summarizeChestPain(chartData);

    const mostCommon = d3.max(summary, (d) => d.total);
    const highestPrevalence = d3.max(summary, (d) => d.diseaseRate);
    const lowestPrevalence = d3.min(summary, (d) => d.diseaseRate);

    const mostCommonType = summary.find((d) => d.total === mostCommon);
    const highestPrevType = summary.find(
      (d) => d.diseaseRate === highestPrevalence
    );
    const lowestPrevType = summary.find(
      (d) => d.diseaseRate === lowestPrevalence
    );

    if (!statsPanel.empty()) {
      const stats = [
        {
          label: "Total patients",
          value: chartData.length,
        },
        {
          label: "Most common chest pain",
          value: mostCommonType
            ? `${mostCommonType.label} (${mostCommonType.total} patients)`
            : "N/A",
        },
        {
          label: "Highest disease prevalence",
          value: highestPrevType
            ? `${highestPrevType.label} (${(
                highestPrevType.diseaseRate * 100
              ).toFixed(1)}%)`
            : "N/A",
        },
        {
          label: "Lowest disease prevalence",
          value: lowestPrevType
            ? `${lowestPrevType.label} (${(
                lowestPrevType.diseaseRate * 100
              ).toFixed(1)}%)`
            : "N/A",
        },
        {
          label: "Asymptomatic cases",
          value: (() => {
            const asym = summary.find((d) => d.cp === 3);
            return asym
              ? `${asym.diseased} with disease (${(
                  asym.diseaseRate * 100
                ).toFixed(1)}%)`
              : "N/A";
          })(),
        },
        {
          label: "Typical angina prevalence",
          value: (() => {
            const typical = summary.find((d) => d.cp === 0);
            return typical
              ? `${(typical.diseaseRate * 100).toFixed(1)}%`
              : "N/A";
          })(),
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
    }

    if (!insightsPanel.empty()) {
      const asymType = summary.find((d) => d.cp === 3);
      const stableType = summary.find((d) => d.cp === 0);

      insightsPanel.html(`
        <p><strong>Dominant presentation:</strong> ${
          mostCommonType
            ? `${mostCommonType.label} accounts for ${(
                (mostCommonType.total / chartData.length) *
                100
              ).toFixed(1)}% of visits.`
            : "Chest pain types are evenly distributed."
        }</p>
        <p><strong>Hidden risk:</strong> ${
          asymType
            ? `Asymptomatic patients show a ${(
                asymType.diseaseRate * 100
              ).toFixed(
                1
              )}% disease prevalence, underscoring the danger of silent ischemia.`
            : "Asymptomatic category not present in this cohort."
        }</p>
        <p><strong>Clinical takeaway:</strong> ${
          stableType && asymType
            ? `While ${stableType.label.toLowerCase()} remains a frequent presentation, asymptomatic cases exhibit nearly ${(
                (asymType.diseaseRate - stableType.diseaseRate) *
                100
              ).toFixed(1)} percentage points higher prevalence.`
            : "Prioritize follow-up diagnostics for chest pain categories associated with higher prevalence."
        }
        </p>
      `);
    }

    if (!resizeListenerAttached) {
      window.addEventListener("resize", () => render(data));
      resizeListenerAttached = true;
    }
  }

  function summarizeChestPain(dataset) {
    const groups = d3.group(dataset, (d) => d[COLUMNS.chestPain]);
    return Array.from(groups, ([cp, records]) => {
      const healthy = records.filter((d) => d[COLUMNS.target] === 0).length;
      const diseased = records.length - healthy;
      const total = records.length;

      return {
        cp,
        label: CHEST_PAIN_LABELS[cp] || `Type ${cp}`,
        healthy,
        diseased,
        total,
        diseaseRate: total ? diseased / total : 0,
      };
    }).sort((a, b) => a.cp - b.cp);
  }

  function wrapAxisLabels(selection, width) {
    selection.each(function () {
      const text = d3.select(this);
      const words = text.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1;
      const y = text.attr("y");
      const dy = parseFloat(text.attr("dy")) || 0;

      let tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", `${dy}em`);

      while (words.length) {
        word = words.pop();
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", `${++lineNumber * lineHeight + dy}em`)
            .text(word);
        }
      }
    });
  }

  return {
    init,
    render,
    setupInteractions,
  };
})();
