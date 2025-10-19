/**
 * Task 5: Exercise Indicators and Heart Disease
 * How does exercise-induced angina and maximum heart rate relate to heart disease likelihood?
 */

const Task5 = (() => {
  const CONTAINER = "#task5-chart";
  const STATS_CONTAINER = "#statistics-task5";
  const INSIGHTS_CONTAINER = "#insights-task5";
  const DATA_PATH = "../data/cleveland.csv";

  const COLUMNS = {
    maxHeartRate: "thalach",
    age: "age",
    exerciseAngina: "exang",
    target: "target",
  };

  const CONFIG = {
    margin: { top: 48, right: 64, bottom: 72, left: 72 },
    containerHeight: 460,
    pointRadius: { min: 4, max: 13 },
    colors: {
      axis: "#1a1a1a",
      grid: "#d9e2ec",
      noAngina: "#2ecc71",
      angina: "#f39c12",
      healthyStroke: "#16a085",
      diseasedStroke: "#c0392b",
      referenceLine: "#2980b9",
    },
  };

  const ANGINA_LABELS = {
    0: "No exercise-induced angina",
    1: "Exercise-induced angina",
  };

  let data = [];
  let tooltip = null;
  let resizeListenerAttached = false;

  async function init() {
    console.log("Initializing Task 5: Exercise Indicators");

    const rawData = await loadData(DATA_PATH);
    if (!rawData || rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      COLUMNS.maxHeartRate,
      COLUMNS.age,
      COLUMNS.exerciseAngina,
      COLUMNS.target,
    ]);
    const cleanData = removeNullRecords(parsedData, [
      COLUMNS.maxHeartRate,
      COLUMNS.age,
      COLUMNS.exerciseAngina,
      COLUMNS.target,
    ]);

    if (cleanData.length === 0) {
      console.warn("Task 5: No valid exercise records after cleaning");
      return;
    }

    console.log(`Task 5: ${cleanData.length} records ready for visualization`);

    data = cleanData;
    if (!tooltip) {
      tooltip = createTooltip();
    }

    render(data);
    setupInteractions(data);

    if (!resizeListenerAttached) {
      window.addEventListener("resize", () => render(data));
      resizeListenerAttached = true;
    }
  }

  function render(chartData = data) {
    if (!chartData || chartData.length === 0) return;

    const container = document.querySelector(CONTAINER);
    if (!container) {
      console.error("Task 5 container not found:", CONTAINER);
      return;
    }

    container.innerHTML = "";

    const fallbackWidth =
      container.parentElement?.clientWidth ||
      container.parentElement?.parentElement?.clientWidth ||
      360;
    const width = Math.max(container.clientWidth || fallbackWidth, 360);
    const height = CONFIG.containerHeight;
    const innerDims = getInnerDimensions(width, height, CONFIG.margin);

    if (innerDims.width <= 0 || innerDims.height <= 0) {
      console.warn("Task 5: Container has zero dimensions, skipping render");
      return;
    }

    if (tooltip) {
      hideTooltip(tooltip);
    }

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

    let xExtent = d3.extent(chartData, (d) => d[COLUMNS.age]);
    let yExtent = d3.extent(chartData, (d) => d[COLUMNS.maxHeartRate]);

    if (!xExtent || !yExtent) return;

    let [xMin, xMax] = xExtent;
    if (xMin === xMax) {
      xMin -= 1;
      xMax += 1;
    }

    let [yMin, yMax] = yExtent;
    if (yMin === yMax) {
      yMin -= 5;
      yMax += 5;
    }

    xMin = Math.floor(xMin);
    xMax = Math.ceil(xMax);

    const theoreticalLineData = d3.range(xMin, xMax + 1).map((age) => ({
      age,
      predicted: Math.max(0, 220 - age),
    }));

    const predictedMax = d3.max(theoreticalLineData, (d) => d.predicted) || 0;
    const predictedMin = d3.min(theoreticalLineData, (d) => d.predicted) || 0;

    yMin = Math.max(0, Math.floor(Math.min(yMin, predictedMin)) - 5);
    yMax = Math.ceil(Math.max(yMax, predictedMax)) + 5;

    const xScale = d3
      .scaleLinear()
      .domain([xMin, xMax])
      .range([0, innerDims.width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([innerDims.height, 0])
      .nice();

    const severityExtent = d3.extent(chartData, (d) => d[COLUMNS.target]);
    const severityMax = Math.max(severityExtent?.[1] || 1, 1);
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, severityMax])
      .range([CONFIG.pointRadius.min, CONFIG.pointRadius.max]);

    const colorScale = d3
      .scaleOrdinal()
      .domain([0, 1])
      .range([CONFIG.colors.noAngina, CONFIG.colors.angina]);

    const gridY = g
      .append("g")
      .attr("class", "grid grid-y")
      .attr("opacity", 0.18)
      .call(d3.axisLeft(yScale).tickSize(-innerDims.width).tickFormat(""));

    const gridX = g
      .append("g")
      .attr("class", "grid grid-x")
      .attr("opacity", 0.12)
      .attr("transform", `translate(0, ${innerDims.height})`)
      .call(d3.axisBottom(xScale).tickSize(-innerDims.height).tickFormat(""));

    gridX.selectAll("line").attr("stroke-dasharray", "4 4");
    g.selectAll(".grid line").attr("stroke", CONFIG.colors.grid);

    g.append("path")
      .datum(theoreticalLineData)
      .attr("class", "reference-line")
      .attr("fill", "none")
      .attr("stroke", CONFIG.colors.referenceLine)
      .attr("stroke-width", 1.6)
      .attr("stroke-dasharray", "6 4")
      .attr(
        "d",
        d3
          .line()
          .x((d) => xScale(d.age))
          .y((d) => yScale(d.predicted))
      );

    const labelPoint =
      theoreticalLineData[Math.floor(theoreticalLineData.length / 3)];
    if (labelPoint) {
      g.append("text")
        .attr("class", "reference-label")
        .attr("x", xScale(labelPoint.age))
        .attr("y", yScale(labelPoint.predicted) - 10)
        .attr("text-anchor", "start")
        .attr("fill", CONFIG.colors.referenceLine)
        .style("font-size", "11px")
        .style("font-weight", 500)
        .text("Predicted max (220 − age)");
    }

    const pointsGroup = g.append("g").attr("class", "points");

    pointsGroup
      .selectAll("circle")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("class", "patient-point")
      .attr("cx", (d) => xScale(d[COLUMNS.age]))
      .attr("cy", (d) => yScale(d[COLUMNS.maxHeartRate]))
      .attr("r", (d) => radiusScale(Math.max(0, d[COLUMNS.target] || 0)))
      .attr("fill", (d) => colorScale(getAnginaValue(d)))
      .attr("fill-opacity", 0.75)
      .attr("stroke", (d) =>
        d[COLUMNS.target] > 0
          ? CONFIG.colors.diseasedStroke
          : CONFIG.colors.healthyStroke
      )
      .attr("stroke-width", 1.5)
      .on("mouseenter", function (event, d) {
        const { predictedMax, performance } = computePerformance(d);

        d3.select(this).attr("stroke-width", 2.4).attr("fill-opacity", 1);

        showTooltip(
          tooltip,
          `
            <div class="tooltip-title">Exercise stress profile</div>
            <div><strong>Age:</strong> ${d[COLUMNS.age]} yrs</div>
            <div><strong>Max heart rate:</strong> ${Math.round(
              d[COLUMNS.maxHeartRate]
            )} bpm</div>
            <div><strong>Exercise angina:</strong> ${
              getAnginaValue(d) ? "Yes" : "No"
            }</div>
            <div><strong>Disease severity:</strong> ${
              d[COLUMNS.target] > 0
                ? `Level ${d[COLUMNS.target]}`
                : "No disease"
            }</div>
            <div><strong>Predicted max:</strong> ${Math.round(
              predictedMax
            )} bpm</div>
            <div><strong>Performance:</strong> ${(performance * 100).toFixed(
              0
            )}%</div>
          `,
          event.pageX,
          event.pageY
        );
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 1.5).attr("fill-opacity", 0.75);
        hideTooltip(tooltip);
      });

    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${innerDims.height})`)
      .call(d3.axisBottom(xScale))
      .call((axis) =>
        axis
          .append("text")
          .attr("x", innerDims.width / 2)
          .attr("y", 50)
          .attr("fill", CONFIG.colors.axis)
          .style("font-size", "13px")
          .style("font-weight", 600)
          .text("Age (years)")
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
          .attr("fill", CONFIG.colors.axis)
          .style("font-size", "13px")
          .style("font-weight", 600)
          .text("Max heart rate achieved (bpm)")
      );

    const legendX =
      CONFIG.margin.left +
      Math.max(innerDims.width - 260, innerDims.width * 0.3);
    const legendY = CONFIG.margin.top - 30;

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    const legendAngina = legend.append("g").attr("class", "legend-angina");

    legendAngina
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", CONFIG.colors.axis)
      .style("font-size", "12px")
      .style("font-weight", 600)
      .text("Exercise-induced angina");

    [0, 1].forEach((value, idx) => {
      const row = legendAngina
        .append("g")
        .attr("transform", `translate(0, ${16 + idx * 18})`);

      row
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", colorScale(value))
        .attr("fill-opacity", 0.85);

      row
        .append("text")
        .attr("x", 20)
        .attr("y", 11)
        .attr("fill", "#555")
        .style("font-size", "11px")
        .text(ANGINA_LABELS[value]);
    });

    const severityLegend = legend
      .append("g")
      .attr("class", "legend-severity")
      .attr("transform", "translate(170, 0)");

    severityLegend
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", CONFIG.colors.axis)
      .style("font-size", "12px")
      .style("font-weight", 600)
      .text("Disease severity");

    const severityValues =
      severityMax <= 2
        ? [0, severityMax]
        : [0, Math.ceil(severityMax / 2), severityMax];

    severityValues
      .filter((value, idx, arr) => arr.indexOf(value) === idx)
      .forEach((value, idx) => {
        const row = severityLegend
          .append("g")
          .attr("transform", `translate(0, ${16 + idx * 26})`);

        row
          .append("circle")
          .attr("cx", 12)
          .attr("cy", 10)
          .attr("r", radiusScale(value))
          .attr("fill", colorScale(value > 0 ? 1 : 0))
          .attr("fill-opacity", 0.7)
          .attr(
            "stroke",
            value > 0
              ? CONFIG.colors.diseasedStroke
              : CONFIG.colors.healthyStroke
          )
          .attr("stroke-width", 1.5);

        row
          .append("text")
          .attr("x", 30)
          .attr("y", 14)
          .attr("fill", "#555")
          .style("font-size", "11px")
          .text(value === 0 ? "No disease" : `Level ${value}`);
      });

    const strokeLegend = legend
      .append("g")
      .attr("class", "legend-stroke")
      .attr("transform", "translate(0, 64)");

    [
      {
        label: "Stroke = confirmed disease",
        color: CONFIG.colors.diseasedStroke,
      },
      {
        label: "Stroke = no disease",
        color: CONFIG.colors.healthyStroke,
      },
    ].forEach((item, idx) => {
      const row = strokeLegend
        .append("g")
        .attr("transform", `translate(0, ${idx * 18})`);

      row
        .append("line")
        .attr("x1", 0)
        .attr("x2", 22)
        .attr("y1", 10)
        .attr("y2", 10)
        .attr("stroke", item.color)
        .attr("stroke-width", 2);

      row
        .append("text")
        .attr("x", 28)
        .attr("y", 14)
        .attr("fill", "#555")
        .style("font-size", "11px")
        .text(item.label);
    });
  }

  function setupInteractions(chartData = data) {
    if (!chartData || chartData.length === 0) return;

    const statsPanel = d3.select(STATS_CONTAINER);
    const insightsPanel = d3.select(INSIGHTS_CONTAINER);

    const summary = summarizeByAngina(chartData);
    const withoutAngina = summary.find((d) => d.angina === 0) || summary[0];
    const withAngina = summary.find((d) => d.angina === 1) || summary[1];
    const totalPatients = chartData.length;
    const diseasedPatients = chartData.filter((d) => d[COLUMNS.target] > 0);
    const riskGap =
      withAngina && withoutAngina
        ? withAngina.diseaseRate - withoutAngina.diseaseRate
        : 0;

    const highRiskLowPerformance = diseasedPatients.filter((d) => {
      const { performance } = computePerformance(d);
      return getAnginaValue(d) === 1 && performance < 0.85;
    });

    const highRiskShare = diseasedPatients.length
      ? highRiskLowPerformance.length / diseasedPatients.length
      : 0;

    const ageHeartRateCorrelation = computePearsonCorrelation(
      chartData,
      (d) => d[COLUMNS.age],
      (d) => d[COLUMNS.maxHeartRate]
    );

    if (!statsPanel.empty()) {
      statsPanel.selectAll(".stat-card").remove();

      const stats = [
        {
          label: "Patients without exercise angina",
          value: withoutAngina?.count || 0,
          subtext: `${formatPercentLocal(withoutAngina?.share)} of cohort`,
        },
        {
          label: "Patients with exercise angina",
          value: withAngina?.count || 0,
          subtext: `${formatPercentLocal(withAngina?.share)} of cohort`,
        },
        {
          label: "Avg max heart rate (no angina)",
          value: formatBpm(withoutAngina?.avgMaxHeartRate),
          subtext: `Avg age ${formatNumberLocal(withoutAngina?.avgAge, 1)} yrs`,
        },
        {
          label: "Avg max heart rate (with angina)",
          value: formatBpm(withAngina?.avgMaxHeartRate),
          subtext: `Avg age ${formatNumberLocal(withAngina?.avgAge, 1)} yrs`,
        },
        {
          label: "Disease prevalence gap",
          value:
            withAngina && withoutAngina
              ? `${formatNumberLocal(riskGap * 100, 1)} percentage points`
              : "N/A",
          subtext:
            withAngina && withoutAngina
              ? `${formatPercentLocal(
                  withAngina.diseaseRate
                )} with angina vs ${formatPercentLocal(
                  withoutAngina.diseaseRate
                )} without`
              : "",
        },
        {
          label: "High performers (≥85% predicted max)",
          value: `${formatPercentLocal(
            withoutAngina?.highAchieverShare
          )} without angina`,
          subtext: `${formatPercentLocal(
            withAngina?.highAchieverShare
          )} with angina`,
        },
      ];

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
      insightsPanel.html(`
        <p><strong>Exercise angina is a clear risk amplifier.</strong> ${
          withAngina && withoutAngina
            ? `${formatPercentLocal(
                withAngina.diseaseRate
              )} of patients with exercise angina show heart disease compared with ${formatPercentLocal(
                withoutAngina.diseaseRate
              )} without angina — a ${formatNumberLocal(
                riskGap * 100,
                1
              )} point gap.`
            : "Very few patients presented with exercise-induced angina in this cohort."
        }</p>
        <p><strong>Heart-rate capacity declines as patients age.</strong> ${
          Number.isFinite(ageHeartRateCorrelation)
            ? `The age vs. max heart-rate correlation is ${formatNumberLocal(
                ageHeartRateCorrelation,
                2
              )}, reflecting the expected inverse relationship.`
            : "Max heart rate closely tracks age-predicted norms in this sample."
        }</p>
        <p><strong>Prioritize follow-up for low-performing angina patients.</strong> ${
          diseasedPatients.length
            ? `${formatPercentLocal(
                highRiskShare
              )} of confirmed disease cases both report exercise-induced angina and fail to reach 85% of their predicted maximum — ideal candidates for closer monitoring.`
            : "No confirmed disease cases were recorded in this cohort."
        }</p>
      `);
    }
  }

  function summarizeByAngina(dataset) {
    if (!dataset || dataset.length === 0) return [];

    return [0, 1].map((value) => {
      const subset = dataset.filter((d) => getAnginaValue(d) === value);
      const count = subset.length;

      if (count === 0) {
        return {
          angina: value,
          label: ANGINA_LABELS[value],
          count: 0,
          share: 0,
          avgMaxHeartRate: null,
          avgAge: null,
          avgSeverity: null,
          diseasedCount: 0,
          diseaseRate: 0,
          avgPerformance: null,
          highAchieverShare: 0,
        };
      }

      let sumMaxHr = 0;
      let sumAge = 0;
      let sumSeverity = 0;
      let sumPerformance = 0;
      let diseasedCount = 0;
      let highAchievers = 0;

      subset.forEach((row) => {
        sumMaxHr += row[COLUMNS.maxHeartRate];
        sumAge += row[COLUMNS.age];
        sumSeverity += row[COLUMNS.target];
        if (row[COLUMNS.target] > 0) {
          diseasedCount += 1;
        }

        const { performance } = computePerformance(row);
        sumPerformance += performance;
        if (performance >= 0.85) {
          highAchievers += 1;
        }
      });

      return {
        angina: value,
        label: ANGINA_LABELS[value],
        count,
        share: count / dataset.length,
        avgMaxHeartRate: sumMaxHr / count,
        avgAge: sumAge / count,
        avgSeverity: sumSeverity / count,
        diseasedCount,
        diseaseRate: diseasedCount / count,
        avgPerformance: sumPerformance / count,
        highAchieverShare: highAchievers / count,
      };
    });
  }

  function computePerformance(row) {
    const age = row[COLUMNS.age];
    const maxHeartRate = row[COLUMNS.maxHeartRate];
    const predictedMax = Math.max(0, 220 - age);
    const performance = predictedMax > 0 ? maxHeartRate / predictedMax : 0;

    return {
      age,
      maxHeartRate,
      predictedMax,
      performance,
    };
  }

  function computePearsonCorrelation(dataset, xAccessor, yAccessor) {
    if (!dataset || dataset.length === 0) return NaN;

    const xValues = dataset.map(xAccessor);
    const yValues = dataset.map(yAccessor);

    const xMean = d3.mean(xValues);
    const yMean = d3.mean(yValues);

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < dataset.length; i += 1) {
      const dx = xValues[i] - xMean;
      const dy = yValues[i] - yMean;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (!denominator) return NaN;

    return numerator / denominator;
  }

  function formatPercentLocal(value) {
    return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "N/A";
  }

  function formatBpm(value) {
    return Number.isFinite(value) ? `${Math.round(value)} bpm` : "N/A";
  }

  function formatNumberLocal(value, decimals = 1) {
    return Number.isFinite(value) ? value.toFixed(decimals) : "N/A";
  }

  function getAnginaValue(row) {
    return row[COLUMNS.exerciseAngina] > 0 ? 1 : 0;
  }

  return {
    init,
    render,
    setupInteractions,
  };
})();
