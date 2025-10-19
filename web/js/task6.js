/**
 * Task 6: Interactive Selection Techniques
 * Demonstrates core D3.js interaction patterns:
 * - Lasso Selection (freeform path)
 * - Marquee Selection (rectangular brush)
 * - Axis-Drag Selection (1D filter along axis)
 */

const Task6 = (() => {
  const SCATTER_CONTAINER = "#task6-scatter";
  const HISTOGRAM_CONTAINER = "#task6-histogram";
  const CONTROLS_CONTAINER = "#interaction-controls-task6";
  const STATS_CONTAINER = "#statistics-task6";
  const DATA_PATH = "../data/cleveland.csv";

  // Chart configuration
  const CONFIG = {
    margin: { top: 40, right: 40, bottom: 60, left: 70 },
    scatterHeight: 500,
    histogramHeight: 300,
  };

  // Color scheme
  const COLORS = {
    normal: "#3498db", // Blue for unselected
    selected: "#e74c3c", // Red for selected
    healthy: "#2ecc71", // Green
    diseased: "#f39c12", // Orange
    axis: "#1a1a1a",
    lasso: "#9b59b6",
  };

  // Interaction modes
  const MODES = {
    LASSO: "lasso",
    MARQUEE: "marquee",
    AXIS_DRAG: "axis-drag",
  };

  let data = [];
  let selectedData = [];
  let currentMode = MODES.LASSO;
  let tooltip = null;

  // SVG elements for scatter plot
  let scatterSvg = null;
  let scatterG = null;
  let xScale = null;
  let yScale = null;

  // Lasso path tracker
  let lassoPath = [];
  let isDrawing = false;

  /**
   * Initialize visualization
   */
  async function init() {
    console.log("Initializing Task 6: Interactive Selection Techniques");

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      "age",
      "chol",
      "target",
      "trestbps",
    ]);
    data = removeNullRecords(parsedData, ["age", "chol"]);

    console.log(`Task 6: ${data.length} records ready for visualization`);

    // Create tooltip
    tooltip = createTooltip();

    // Render controls
    renderControls();

    // Render visualizations
    renderScatterPlot();
    renderHistogram(data); // Start with all data

    // Render initial statistics
    updateStatistics(data);
  }

  /**
   * Render interaction mode controls
   */
  function renderControls() {
    const container = d3.select(CONTROLS_CONTAINER);
    container.html("");

    const controlsDiv = container
      .append("div")
      .style("display", "flex")
      .style("gap", "16px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center");

    // Mode buttons
    const modes = [
      {
        id: MODES.LASSO,
        label: "Lasso Selection",
        description: "Draw freeform shapes",
      },
      {
        id: MODES.MARQUEE,
        label: "Marquee Selection",
        description: "Rectangular brush",
      },
      {
        id: MODES.AXIS_DRAG,
        label: "Axis-Drag Selection",
        description: "Filter along X or Y axis",
      },
    ];

    modes.forEach((mode) => {
      const button = controlsDiv
        .append("button")
        .attr("class", `mode-button ${currentMode === mode.id ? "active" : ""}`)
        .style("padding", "12px 24px")
        .style("border", "2px solid #3498db")
        .style("background", currentMode === mode.id ? "#3498db" : "white")
        .style("color", currentMode === mode.id ? "white" : "#3498db")
        .style("border-radius", "8px")
        .style("cursor", "pointer")
        .style("font-weight", "600")
        .style("transition", "all 0.3s")
        .on("click", () => switchMode(mode.id))
        .on("mouseover", function () {
          if (currentMode !== mode.id) {
            d3.select(this).style("background", "#ecf0f1");
          }
        })
        .on("mouseout", function () {
          if (currentMode !== mode.id) {
            d3.select(this).style("background", "white");
          }
        });

      button.append("div").style("font-size", "14px").text(mode.label);

      button
        .append("div")
        .style("font-size", "11px")
        .style("font-weight", "normal")
        .style("opacity", "0.8")
        .text(mode.description);
    });

    // Reset button
    controlsDiv
      .append("button")
      .style("padding", "12px 24px")
      .style("border", "2px solid #95a5a6")
      .style("background", "white")
      .style("color", "#7f8c8d")
      .style("border-radius", "8px")
      .style("cursor", "pointer")
      .style("font-weight", "600")
      .style("margin-left", "auto")
      .text("Clear Selection")
      .on("click", clearSelection)
      .on("mouseover", function () {
        d3.select(this).style("background", "#ecf0f1");
      })
      .on("mouseout", function () {
        d3.select(this).style("background", "white");
      });
  }

  /**
   * Switch interaction mode
   */
  function switchMode(mode) {
    currentMode = mode;
    clearSelection();
    renderControls();
    setupInteractions();
  }

  /**
   * Render scatter plot
   */
  function renderScatterPlot() {
    const container = document.querySelector(SCATTER_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = CONFIG.scatterHeight;
    const margin = CONFIG.margin;

    // Create SVG
    scatterSvg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    scatterG = scatterSvg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    xScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.age) - 2, d3.max(data, (d) => d.age) + 2])
      .range([0, innerWidth])
      .nice();

    yScale = d3
      .scaleLinear()
      .domain([
        d3.min(data, (d) => d.chol) - 20,
        d3.max(data, (d) => d.chol) + 20,
      ])
      .range([innerHeight, 0])
      .nice();

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    scatterG
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "12px");

    scatterG
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px");

    // Add axis labels
    scatterG
      .append("text")
      .attr("class", "axis-label")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Age (years)");

    scatterG
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Cholesterol (mg/dL)");

    // Add data points
    scatterG
      .selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", (d) => xScale(d.age))
      .attr("cy", (d) => yScale(d.chol))
      .attr("r", 5)
      .attr("fill", COLORS.normal)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 7).attr("opacity", 1);

        tooltip
          .style("opacity", 1)
          .html(
            `
            <strong>Patient Data</strong><br/>
            Age: ${d.age} years<br/>
            Cholesterol: ${d.chol} mg/dL<br/>
            BP: ${d.trestbps} mmHg<br/>
            Status: ${d.target > 0 ? "Disease" : "Healthy"}
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function (event, d) {
        const isSelected = selectedData.includes(d);
        d3.select(this)
          .attr("r", 5)
          .attr("opacity", isSelected ? 1 : 0.7);

        tooltip.style("opacity", 0);
      });

    // Setup interactions
    setupInteractions();
  }

  /**
   * Setup interaction behaviors based on current mode
   */
  function setupInteractions() {
    // Remove existing interaction layers
    scatterG.selectAll(".interaction-layer").remove();
    scatterG.selectAll(".lasso-path").remove();
    scatterG.selectAll(".brush").remove();

    if (currentMode === MODES.LASSO) {
      setupLassoSelection();
    } else if (currentMode === MODES.MARQUEE) {
      setupMarqueeSelection();
    } else if (currentMode === MODES.AXIS_DRAG) {
      setupAxisDragSelection();
    }
  }

  /**
   * Setup Lasso Selection
   */
  function setupLassoSelection() {
    const innerWidth =
      scatterSvg.attr("width") - CONFIG.margin.left - CONFIG.margin.right;
    const innerHeight =
      scatterSvg.attr("height") - CONFIG.margin.top - CONFIG.margin.bottom;

    // Add interaction layer
    const interactionLayer = scatterG
      .append("rect")
      .attr("class", "interaction-layer")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    // Lasso path element
    const lassoPathElement = scatterG
      .append("path")
      .attr("class", "lasso-path")
      .attr("fill", COLORS.lasso)
      .attr("fill-opacity", 0.1)
      .attr("stroke", COLORS.lasso)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Mouse events for lasso
    interactionLayer
      .on("mousedown", function (event) {
        lassoPath = [
          [
            event.offsetX - CONFIG.margin.left,
            event.offsetY - CONFIG.margin.top,
          ],
        ];
        isDrawing = true;
        lassoPathElement.attr("d", null);
      })
      .on("mousemove", function (event) {
        if (!isDrawing) return;

        lassoPath.push([
          event.offsetX - CONFIG.margin.left,
          event.offsetY - CONFIG.margin.top,
        ]);

        const pathData = "M" + lassoPath.map((p) => p.join(",")).join("L");

        lassoPathElement.attr("d", pathData);
      })
      .on("mouseup", function (event) {
        if (!isDrawing) return;

        isDrawing = false;

        // Close the path
        lassoPath.push(lassoPath[0]);

        // Find points inside lasso
        const selected = data.filter((d) => {
          const x = xScale(d.age);
          const y = yScale(d.chol);
          return isPointInPolygon([x, y], lassoPath);
        });

        selectedData = selected;
        updateSelection();

        // Clear lasso path after a short delay
        setTimeout(() => {
          lassoPathElement.attr("d", null);
          lassoPath = [];
        }, 200);
      });
  }

  /**
   * Setup Marquee (Rectangular Brush) Selection
   */
  function setupMarqueeSelection() {
    const innerWidth =
      scatterSvg.attr("width") - CONFIG.margin.left - CONFIG.margin.right;
    const innerHeight =
      scatterSvg.attr("height") - CONFIG.margin.top - CONFIG.margin.bottom;

    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("end", brushed);

    scatterG.append("g").attr("class", "brush").call(brush);

    function brushed(event) {
      const selection = event.selection;

      if (!selection) {
        clearSelection();
        return;
      }

      const [[x0, y0], [x1, y1]] = selection;

      // Find points within brush area
      const selected = data.filter((d) => {
        const x = xScale(d.age);
        const y = yScale(d.chol);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
      });

      selectedData = selected;
      updateSelection();
    }
  }

  /**
   * Setup Axis-Drag Selection (1D brush on x-axis and y-axis)
   */
  function setupAxisDragSelection() {
    const innerWidth =
      scatterSvg.attr("width") - CONFIG.margin.left - CONFIG.margin.right;
    const innerHeight =
      scatterSvg.attr("height") - CONFIG.margin.top - CONFIG.margin.bottom;

    // X-axis brush (horizontal)
    const brushX = d3
      .brushX()
      .extent([
        [0, innerHeight + 10],
        [innerWidth, innerHeight + 40],
      ])
      .on("end", brushedX);

    const brushXGroup = scatterG
      .append("g")
      .attr("class", "brush brush-x")
      .call(brushX);

    // Y-axis brush (vertical)
    const brushY = d3
      .brushY()
      .extent([
        [-40, 0],
        [-10, innerHeight],
      ])
      .on("end", brushedY);

    const brushYGroup = scatterG
      .append("g")
      .attr("class", "brush brush-y")
      .call(brushY);

    // Track active selections
    let xSelection = null;
    let ySelection = null;

    function brushedX(event) {
      xSelection = event.selection;
      updateAxisSelection();
    }

    function brushedY(event) {
      ySelection = event.selection;
      updateAxisSelection();
    }

    function updateAxisSelection() {
      if (!xSelection && !ySelection) {
        clearSelection();
        return;
      }

      let selected = data;

      // Filter by X-axis (age) if selected
      if (xSelection) {
        const [x0, x1] = xSelection;
        const ageMin = xScale.invert(x0);
        const ageMax = xScale.invert(x1);
        selected = selected.filter((d) => d.age >= ageMin && d.age <= ageMax);
      }

      // Filter by Y-axis (cholesterol) if selected
      if (ySelection) {
        const [y1, y0] = ySelection; // Note: y-axis is inverted
        const cholMin = yScale.invert(y0);
        const cholMax = yScale.invert(y1);
        selected = selected.filter(
          (d) => d.chol >= cholMin && d.chol <= cholMax
        );
      }

      selectedData = selected;
      updateSelection();
    }
  }

  /**
   * Update visual selection state
   */
  function updateSelection() {
    // Update scatter plot points
    scatterG
      .selectAll(".data-point")
      .attr("fill", (d) =>
        selectedData.includes(d) ? COLORS.selected : COLORS.normal
      )
      .attr("opacity", (d) => (selectedData.includes(d) ? 1 : 0.3))
      .attr("r", (d) => (selectedData.includes(d) ? 6 : 5));

    // Update histogram with selected data
    const displayData = selectedData.length > 0 ? selectedData : data;
    renderHistogram(displayData);

    // Update statistics
    updateStatistics(displayData);
  }

  /**
   * Clear selection
   */
  function clearSelection() {
    selectedData = [];

    // Reset all points
    scatterG
      .selectAll(".data-point")
      .attr("fill", COLORS.normal)
      .attr("opacity", 0.7)
      .attr("r", 5);

    // Remove any brush
    scatterG.selectAll(".brush").remove();

    // Reset histogram to all data
    renderHistogram(data);

    // Reset statistics
    updateStatistics(data);

    // Re-setup interactions
    setupInteractions();
  }

  /**
   * Render linked histogram
   */
  function renderHistogram(chartData) {
    const container = document.querySelector(HISTOGRAM_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = CONFIG.histogramHeight;
    const margin = CONFIG.margin;

    // Create SVG
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create histogram bins
    const histogram = d3
      .bin()
      .domain([100, 400])
      .thresholds(20)
      .value((d) => d.chol);

    const bins = histogram(chartData);

    // Create scales
    const xScale = d3.scaleLinear().domain([100, 400]).range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)])
      .range([innerHeight, 0])
      .nice();

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "12px");

    g.append("g").call(yAxis).selectAll("text").style("font-size", "12px");

    // Add axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Cholesterol (mg/dL)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .text("Count");

    // Add bars
    g.selectAll(".bar")
      .data(bins)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.x0))
      .attr("y", (d) => yScale(d.length))
      .attr("width", (d) => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr("height", (d) => innerHeight - yScale(d.length))
      .attr("fill", selectedData.length > 0 ? COLORS.selected : COLORS.normal)
      .attr("opacity", 0.7)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1);

        tooltip
          .style("opacity", 1)
          .html(
            `
            <strong>Bin</strong><br/>
            Range: ${Math.round(d.x0)} - ${Math.round(d.x1)} mg/dL<br/>
            Count: ${d.length} patients
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.7);
        tooltip.style("opacity", 0);
      });

    // Add selection indicator text
    const selectionText =
      selectedData.length > 0
        ? `${selectedData.length} patients selected`
        : `All ${chartData.length} patients`;

    g.append("text")
      .attr("x", innerWidth - 10)
      .attr("y", -10)
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", selectedData.length > 0 ? COLORS.selected : COLORS.normal)
      .text(selectionText);
  }

  /**
   * Update statistics panel
   */
  function updateStatistics(chartData) {
    const container = d3.select(STATS_CONTAINER);
    container.html("");

    const stats = [
      {
        label: "Patients Selected",
        value: chartData.length,
        format: (v) => v.toLocaleString(),
      },
      {
        label: "Avg Age",
        value: d3.mean(chartData, (d) => d.age),
        format: (v) => v.toFixed(1) + " years",
      },
      {
        label: "Avg Cholesterol",
        value: d3.mean(chartData, (d) => d.chol),
        format: (v) => v.toFixed(1) + " mg/dL",
      },
      {
        label: "Disease Rate",
        value:
          (chartData.filter((d) => d.target > 0).length / chartData.length) *
          100,
        format: (v) => v.toFixed(1) + "%",
      },
      {
        label: "Chol Range",
        value: [
          d3.min(chartData, (d) => d.chol),
          d3.max(chartData, (d) => d.chol),
        ],
        format: (v) => `${Math.round(v[0])} - ${Math.round(v[1])} mg/dL`,
      },
      {
        label: "Age Range",
        value: [
          d3.min(chartData, (d) => d.age),
          d3.max(chartData, (d) => d.age),
        ],
        format: (v) => `${Math.round(v[0])} - ${Math.round(v[1])} years`,
      },
    ];

    stats.forEach((stat) => {
      const statCard = container
        .append("div")
        .attr("class", "stat-card")
        .style("background", "white")
        .style("padding", "20px")
        .style("border-radius", "8px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)");

      statCard
        .append("div")
        .style("font-size", "12px")
        .style("color", "#7f8c8d")
        .style("font-weight", "600")
        .style("text-transform", "uppercase")
        .style("margin-bottom", "8px")
        .text(stat.label);

      statCard
        .append("div")
        .style("font-size", "24px")
        .style("font-weight", "700")
        .style("color", "#2c3e50")
        .text(stat.format(stat.value));
    });
  }

  /**
   * Check if point is inside polygon (for lasso selection)
   * Using ray casting algorithm
   */
  function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  return {
    init,
  };
})();
