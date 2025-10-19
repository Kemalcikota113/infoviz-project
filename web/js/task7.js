/**
 * Task 7: Multiple Coordinated Views Dashboard
 * Demonstrates five coordination strategies:
 * 1. Juxtaposition - Side-by-side views
 * 2. Integrated - Combined multi-encoding chart
 * 3. Superimpose - Overlaid data layers
 * 4. Brushing & Linking - Cross-view selection
 * 5. Dynamic Queries - Dropdown filters
 */

const Task7 = (() => {
  // Container IDs
  const SCATTER_CONTAINER = "#task7-scatter";
  const AGE_HIST_CONTAINER = "#task7-age-hist";
  const INTEGRATED_CONTAINER = "#task7-integrated";
  const SUPERIMPOSE_CONTAINER = "#task7-superimpose";
  const QUERY_CONTROLS_CONTAINER = "#query-controls-task7";
  const STATS_CONTAINER = "#statistics-task7";
  const DATA_PATH = "../data/cleveland.csv";

  // Chart configuration
  const CONFIG = {
    margin: { top: 40, right: 40, bottom: 60, left: 70 },
    scatterHeight: 400,
    histogramHeight: 400,
    integratedHeight: 450,
    superimposeHeight: 400,
  };

  // Color scheme
  const COLORS = {
    healthy: "#2ecc71",
    diseased: "#e74c3c",
    selected: "#f39c12",
    male: "#3498db",
    female: "#e91e63",
    normal: "#95a5a6",
    highlight: "#f39c12",
  };

  // Data and state
  let allData = [];
  let filteredData = [];
  let selectedData = [];
  let tooltip = null;

  // Filter state
  let currentFilters = {
    gender: "all", // all, male, female
    chestPain: "all", // all, 1, 2, 3, 4
    diseaseStatus: "all", // all, healthy, diseased
  };

  /**
   * Initialize visualization
   */
  async function init() {
    console.log("Initializing Task 7: Multiple Coordinated Views Dashboard");

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const parsedData = parseNumericColumns(rawData, [
      "age",
      "sex",
      "cp",
      "trestbps",
      "chol",
      "fbs",
      "thalach",
      "exang",
      "target",
    ]);
    allData = removeNullRecords(parsedData, ["age", "chol", "sex", "target"]);
    filteredData = [...allData];

    console.log(`Task 7: ${allData.length} records ready for visualization`);

    // Create tooltip
    tooltip = createTooltip();

    // Render all components
    renderQueryControls();
    renderAllViews();
    updateStatistics();
  }

  /**
   * Render dynamic query controls (Dynamic Queries strategy)
   */
  function renderQueryControls() {
    const container = d3.select(QUERY_CONTROLS_CONTAINER);
    container.html("");

    const controlsDiv = container
      .append("div")
      .style("display", "flex")
      .style("gap", "20px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center");

    // Gender filter
    const genderDiv = controlsDiv
      .append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "8px");

    genderDiv
      .append("label")
      .style("font-weight", "600")
      .style("font-size", "14px")
      .style("color", "#2c3e50")
      .text("Gender:");

    genderDiv
      .append("select")
      .style("padding", "8px 12px")
      .style("border", "2px solid #bdc3c7")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("cursor", "pointer")
      .on("change", function () {
        currentFilters.gender = this.value;
        applyFilters();
      })
      .selectAll("option")
      .data([
        { value: "all", label: "All" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
      ])
      .enter()
      .append("option")
      .attr("value", (d) => d.value)
      .text((d) => d.label);

    // Chest Pain filter
    const cpDiv = controlsDiv
      .append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "8px");

    cpDiv
      .append("label")
      .style("font-weight", "600")
      .style("font-size", "14px")
      .style("color", "#2c3e50")
      .text("Chest Pain Type:");

    cpDiv
      .append("select")
      .style("padding", "8px 12px")
      .style("border", "2px solid #bdc3c7")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("cursor", "pointer")
      .on("change", function () {
        currentFilters.chestPain = this.value;
        applyFilters();
      })
      .selectAll("option")
      .data([
        { value: "all", label: "All Types" },
        { value: "1", label: "Type 1: Typical Angina" },
        { value: "2", label: "Type 2: Atypical Angina" },
        { value: "3", label: "Type 3: Non-anginal" },
        { value: "4", label: "Type 4: Asymptomatic" },
      ])
      .enter()
      .append("option")
      .attr("value", (d) => d.value)
      .text((d) => d.label);

    // Disease Status filter
    const diseaseDiv = controlsDiv
      .append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("gap", "8px");

    diseaseDiv
      .append("label")
      .style("font-weight", "600")
      .style("font-size", "14px")
      .style("color", "#2c3e50")
      .text("Disease Status:");

    diseaseDiv
      .append("select")
      .style("padding", "8px 12px")
      .style("border", "2px solid #bdc3c7")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("cursor", "pointer")
      .on("change", function () {
        currentFilters.diseaseStatus = this.value;
        applyFilters();
      })
      .selectAll("option")
      .data([
        { value: "all", label: "All" },
        { value: "healthy", label: "Healthy" },
        { value: "diseased", label: "Diseased" },
      ])
      .enter()
      .append("option")
      .attr("value", (d) => d.value)
      .text((d) => d.label);

    // Reset button
    controlsDiv
      .append("button")
      .style("padding", "10px 20px")
      .style("border", "2px solid #95a5a6")
      .style("background", "white")
      .style("color", "#7f8c8d")
      .style("border-radius", "6px")
      .style("cursor", "pointer")
      .style("font-weight", "600")
      .style("margin-top", "24px")
      .style("align-self", "flex-end")
      .text("Reset Filters")
      .on("click", resetFilters)
      .on("mouseover", function () {
        d3.select(this).style("background", "#ecf0f1");
      })
      .on("mouseout", function () {
        d3.select(this).style("background", "white");
      });
  }

  /**
   * Apply filters to data (Dynamic Queries)
   */
  function applyFilters() {
    filteredData = allData.filter((d) => {
      // Gender filter
      if (currentFilters.gender !== "all") {
        const isMale = d.sex === 1;
        if (
          (currentFilters.gender === "male" && !isMale) ||
          (currentFilters.gender === "female" && isMale)
        ) {
          return false;
        }
      }

      // Chest pain filter
      if (currentFilters.chestPain !== "all") {
        if (d.cp !== parseInt(currentFilters.chestPain)) {
          return false;
        }
      }

      // Disease status filter
      if (currentFilters.diseaseStatus !== "all") {
        const isDiseased = d.target > 0;
        if (
          (currentFilters.diseaseStatus === "healthy" && isDiseased) ||
          (currentFilters.diseaseStatus === "diseased" && !isDiseased)
        ) {
          return false;
        }
      }

      return true;
    });

    // Clear selection when filters change
    selectedData = [];

    // Re-render all views
    renderAllViews();
    updateStatistics();
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    currentFilters = {
      gender: "all",
      chestPain: "all",
      diseaseStatus: "all",
    };

    // Reset dropdowns
    d3.select(QUERY_CONTROLS_CONTAINER)
      .selectAll("select")
      .property("value", "all");

    applyFilters();
  }

  /**
   * Render all views
   */
  function renderAllViews() {
    renderScatterPlot();
    renderAgeHistogram();
    renderIntegratedView();
    renderSuperimposeView();
  }

  /**
   * Render scatter plot with brushing (Juxtaposition + Brushing & Linking)
   */
  function renderScatterPlot() {
    const container = document.querySelector(SCATTER_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = CONFIG.scatterHeight;
    const margin = CONFIG.margin;

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

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.age))
      .range([0, innerWidth])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.chol))
      .range([innerHeight, 0])
      .nice();

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "11px");

    // Axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Age (years)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Cholesterol (mg/dL)");

    // Points
    const circles = g
      .selectAll(".data-point")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", (d) => xScale(d.age))
      .attr("cy", (d) => yScale(d.chol))
      .attr("r", 5)
      .attr("fill", (d) =>
        selectedData.includes(d)
          ? COLORS.selected
          : d.target > 0
          ? COLORS.diseased
          : COLORS.healthy
      )
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", (d) =>
        selectedData.length === 0 || selectedData.includes(d) ? 0.7 : 0.2
      )
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 7).attr("opacity", 1);

        tooltip
          .style("opacity", 1)
          .html(
            `
            <strong>Patient Data</strong><br/>
            Age: ${d.age} years<br/>
            Cholesterol: ${d.chol} mg/dL<br/>
            Sex: ${d.sex === 1 ? "Male" : "Female"}<br/>
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
          .attr("opacity", selectedData.length === 0 || isSelected ? 0.7 : 0.2);

        tooltip.style("opacity", 0);
      });

    // Brushing & Linking
    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("end", brushed);

    g.append("g").attr("class", "brush").call(brush);

    function brushed(event) {
      const selection = event.selection;

      if (!selection) {
        selectedData = [];
      } else {
        const [[x0, y0], [x1, y1]] = selection;
        selectedData = filteredData.filter((d) => {
          const x = xScale(d.age);
          const y = yScale(d.chol);
          return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });
      }

      // Update all views
      updateLinkedViews();
    }
  }

  /**
   * Render age histogram (Juxtaposition)
   */
  function renderAgeHistogram() {
    const container = document.querySelector(AGE_HIST_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = CONFIG.histogramHeight;
    const margin = CONFIG.margin;

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

    // Create histogram
    const histogram = d3
      .bin()
      .domain(d3.extent(allData, (d) => d.age))
      .thresholds(15)
      .value((d) => d.age);

    const bins = histogram(filteredData);
    const selectedBins = selectedData.length > 0 ? histogram(selectedData) : [];

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.age))
      .range([0, innerWidth])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)])
      .range([innerHeight, 0])
      .nice();

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "11px");

    // Axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Age (years)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Count");

    // Bars for all filtered data
    g.selectAll(".bar-all")
      .data(bins)
      .enter()
      .append("rect")
      .attr("class", "bar-all")
      .attr("x", (d) => xScale(d.x0))
      .attr("y", (d) => yScale(d.length))
      .attr("width", (d) => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr("height", (d) => innerHeight - yScale(d.length))
      .attr("fill", COLORS.normal)
      .attr("opacity", 0.5);

    // Bars for selected data (Brushing & Linking highlight)
    if (selectedData.length > 0) {
      g.selectAll(".bar-selected")
        .data(selectedBins)
        .enter()
        .append("rect")
        .attr("class", "bar-selected")
        .attr("x", (d) => xScale(d.x0))
        .attr("y", (d) => yScale(d.length))
        .attr("width", (d) => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("height", (d) => innerHeight - yScale(d.length))
        .attr("fill", COLORS.selected)
        .attr("opacity", 0.8);
    }
  }

  /**
   * Render integrated view (Integrated strategy)
   * Combines multiple data dimensions in one chart
   */
  function renderIntegratedView() {
    const container = document.querySelector(INTEGRATED_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = CONFIG.integratedHeight;
    const margin = CONFIG.margin;

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

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.age))
      .range([0, innerWidth])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(allData, (d) => d.thalach))
      .range([innerHeight, 0])
      .nice();

    const sizeScale = d3
      .scaleSqrt()
      .domain(d3.extent(allData, (d) => d.chol))
      .range([3, 15]);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "11px");

    // Axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Age (years)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Max Heart Rate (bpm)");

    // Title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -15)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text("Age vs Max Heart Rate (size = cholesterol, color = gender)");

    // Points with multiple encodings
    g.selectAll(".integrated-point")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("class", "integrated-point")
      .attr("cx", (d) => xScale(d.age))
      .attr("cy", (d) => yScale(d.thalach))
      .attr("r", (d) => sizeScale(d.chol))
      .attr("fill", (d) =>
        selectedData.length > 0
          ? selectedData.includes(d)
            ? COLORS.selected
            : d.sex === 1
            ? COLORS.male
            : COLORS.female
          : d.sex === 1
          ? COLORS.male
          : COLORS.female
      )
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", (d) =>
        selectedData.length === 0 || selectedData.includes(d) ? 0.6 : 0.15
      )
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke-width", 2.5);

        tooltip
          .style("opacity", 1)
          .html(
            `
            <strong>Integrated View</strong><br/>
            Age: ${d.age} years<br/>
            Max HR: ${d.thalach} bpm<br/>
            Cholesterol: ${d.chol} mg/dL<br/>
            Gender: ${d.sex === 1 ? "Male" : "Female"}<br/>
            Status: ${d.target > 0 ? "Disease" : "Healthy"}
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function (event, d) {
        const isSelected = selectedData.includes(d);
        d3.select(this)
          .attr("opacity", selectedData.length === 0 || isSelected ? 0.6 : 0.15)
          .attr("stroke-width", 1.5);

        tooltip.style("opacity", 0);
      });

    // Legend
    const legend = g
      .append("g")
      .attr("transform", `translate(${innerWidth - 120}, 10)`);

    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 6)
      .attr("fill", COLORS.male);

    legend
      .append("text")
      .attr("x", 12)
      .attr("y", 5)
      .style("font-size", "12px")
      .text("Male");

    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 20)
      .attr("r", 6)
      .attr("fill", COLORS.female);

    legend
      .append("text")
      .attr("x", 12)
      .attr("y", 25)
      .style("font-size", "12px")
      .text("Female");
  }

  /**
   * Render superimpose view (Superimpose strategy)
   * Multiple data layers overlaid
   */
  function renderSuperimposeView() {
    const container = document.querySelector(SUPERIMPOSE_CONTAINER);
    if (!container) return;

    container.innerHTML = "";

    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = CONFIG.superimposeHeight;
    const margin = CONFIG.margin;

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

    // Group data by disease status
    const healthyData = filteredData.filter((d) => d.target === 0);
    const diseasedData = filteredData.filter((d) => d.target > 0);

    // Create density data for each group
    const ageExtent = d3.extent(allData, (d) => d.age);
    const ages = d3.range(ageExtent[0], ageExtent[1], 1);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(ageExtent)
      .range([0, innerWidth])
      .nice();

    // Calculate density for both groups
    const healthyDensity = calculateDensity(healthyData, ages);
    const diseasedDensity = calculateDensity(diseasedData, ages);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max([
          ...healthyDensity.map((d) => d.density),
          ...diseasedDensity.map((d) => d.density),
        ]),
      ])
      .range([innerHeight, 0])
      .nice();

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "11px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "11px");

    // Axis labels
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Age (years)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -50)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .text("Density");

    // Title
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -15)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .text("Overlaid Age Distributions: Healthy vs Diseased");

    // Line generator
    const line = d3
      .line()
      .x((d) => xScale(d.age))
      .y((d) => yScale(d.density))
      .curve(d3.curveBasis);

    // Area generator for filled regions
    const area = d3
      .area()
      .x((d) => xScale(d.age))
      .y0(innerHeight)
      .y1((d) => yScale(d.density))
      .curve(d3.curveBasis);

    // Draw healthy distribution (layer 1)
    g.append("path")
      .datum(healthyDensity)
      .attr("class", "area-healthy")
      .attr("d", area)
      .attr("fill", COLORS.healthy)
      .attr("opacity", 0.3);

    g.append("path")
      .datum(healthyDensity)
      .attr("class", "line-healthy")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", COLORS.healthy)
      .attr("stroke-width", 3);

    // Draw diseased distribution (layer 2, overlaid)
    g.append("path")
      .datum(diseasedDensity)
      .attr("class", "area-diseased")
      .attr("d", area)
      .attr("fill", COLORS.diseased)
      .attr("opacity", 0.3);

    g.append("path")
      .datum(diseasedDensity)
      .attr("class", "line-diseased")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", COLORS.diseased)
      .attr("stroke-width", 3);

    // Legend
    const legend = g
      .append("g")
      .attr("transform", `translate(${innerWidth - 120}, 10)`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 30)
      .attr("height", 3)
      .attr("fill", COLORS.healthy);

    legend
      .append("text")
      .attr("x", 35)
      .attr("y", 5)
      .style("font-size", "12px")
      .text("Healthy");

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 20)
      .attr("width", 30)
      .attr("height", 3)
      .attr("fill", COLORS.diseased);

    legend
      .append("text")
      .attr("x", 35)
      .attr("y", 25)
      .style("font-size", "12px")
      .text("Diseased");
  }

  /**
   * Calculate density for age distribution
   */
  function calculateDensity(data, ages) {
    const bandwidth = 3;
    return ages.map((age) => {
      const density = data.reduce((sum, d) => {
        const distance = Math.abs(d.age - age);
        return sum + (distance <= bandwidth ? 1 : 0);
      }, 0);
      return { age, density: density / data.length };
    });
  }

  /**
   * Update linked views (Brushing & Linking)
   */
  function updateLinkedViews() {
    // Update scatter plot
    d3.select(SCATTER_CONTAINER)
      .selectAll(".data-point")
      .attr("fill", (d) =>
        selectedData.includes(d)
          ? COLORS.selected
          : d.target > 0
          ? COLORS.diseased
          : COLORS.healthy
      )
      .attr("opacity", (d) =>
        selectedData.length === 0 || selectedData.includes(d) ? 0.7 : 0.2
      );

    // Re-render histogram with selection
    renderAgeHistogram();

    // Update integrated view
    d3.select(INTEGRATED_CONTAINER)
      .selectAll(".integrated-point")
      .attr("fill", (d) =>
        selectedData.length > 0
          ? selectedData.includes(d)
            ? COLORS.selected
            : d.sex === 1
            ? COLORS.male
            : COLORS.female
          : d.sex === 1
          ? COLORS.male
          : COLORS.female
      )
      .attr("opacity", (d) =>
        selectedData.length === 0 || selectedData.includes(d) ? 0.6 : 0.15
      );

    // Update statistics
    updateStatistics();
  }

  /**
   * Update statistics panel
   */
  function updateStatistics() {
    const displayData = selectedData.length > 0 ? selectedData : filteredData;

    const container = d3.select(STATS_CONTAINER);
    container.html("");

    const stats = [
      {
        label: "Total Patients",
        value: displayData.length,
        format: (v) => v.toLocaleString(),
      },
      {
        label: "Avg Age",
        value: d3.mean(displayData, (d) => d.age),
        format: (v) => v.toFixed(1) + " years",
      },
      {
        label: "Avg Cholesterol",
        value: d3.mean(displayData, (d) => d.chol),
        format: (v) => v.toFixed(1) + " mg/dL",
      },
      {
        label: "Avg Max HR",
        value: d3.mean(displayData, (d) => d.thalach),
        format: (v) => v.toFixed(1) + " bpm",
      },
      {
        label: "Disease Rate",
        value:
          (displayData.filter((d) => d.target > 0).length /
            displayData.length) *
          100,
        format: (v) => v.toFixed(1) + "%",
      },
      {
        label: "Male %",
        value:
          (displayData.filter((d) => d.sex === 1).length / displayData.length) *
          100,
        format: (v) => v.toFixed(1) + "%",
      },
    ];

    stats.forEach((stat) => {
      const statCard = container
        .append("div")
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

  return {
    init,
  };
})();
