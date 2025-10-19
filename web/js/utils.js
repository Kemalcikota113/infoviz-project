/**
 * Utility functions for D3 visualizations
 */

// ============================================
// DATA LOADING & PARSING
// ============================================

/**
 * Load CSV data from file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Array of data objects
 */
async function loadData(filePath) {
  try {
    const data = await d3.csv(filePath);
    console.log(`Loaded ${data.length} records from ${filePath}`);
    return data;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

/**
 * Convert numeric string to number, handling NaN
 * @param {string|number} value - Value to convert
 * @returns {number|null} - Converted number or null
 */
function parseNumeric(value) {
  const num = +value;
  return isNaN(num) ? null : num;
}

/**
 * Parse all numeric columns in dataset
 * @param {Array<Object>} data - Raw data array
 * @param {Array<string>} numericColumns - Column names to parse as numbers
 * @returns {Array<Object>} - Data with parsed columns
 */
function parseNumericColumns(data, numericColumns) {
  return data.map((d) => {
    const row = { ...d };
    numericColumns.forEach((col) => {
      if (col in row) {
        row[col] = parseNumeric(row[col]);
      }
    });
    return row;
  });
}

/**
 * Filter out records with null/NaN values in specified columns
 * @param {Array<Object>} data - Input data
 * @param {Array<string>} columns - Columns to check for null values
 * @returns {Array<Object>} - Filtered data
 */
function removeNullRecords(data, columns) {
  return data.filter((d) => columns.every((col) => d[col] != null));
}

// ============================================
// D3 SCALES & AXES
// ============================================

/**
 * Create a linear scale
 * @param {Array<number>} domain - [min, max] values
 * @param {Array<number>} range - [min, max] pixel values
 * @returns {d3.ScaleLinear}
 */
function createLinearScale(domain, range) {
  return d3.scaleLinear().domain(domain).range(range);
}

/**
 * Create a band scale for categorical data
 * @param {Array<string>} domain - Category names
 * @param {Array<number>} range - [min, max] pixel values
 * @returns {d3.ScaleBand}
 */
function createBandScale(domain, range) {
  return d3.scaleBand().domain(domain).range(range).padding(0.1);
}

/**
 * Create an ordinal color scale
 * @param {Array<string>} domain - Category names
 * @param {Array<string>} colors - Color values
 * @returns {d3.ScaleOrdinal}
 */
function createColorScale(domain, colors) {
  return d3.scaleOrdinal().domain(domain).range(colors);
}

/**
 * Create a quantile color scale for continuous data
 * @param {Array<number>} data - Data values
 * @param {Array<string>} colors - Color values
 * @returns {d3.ScaleQuantile}
 */
function createQuantileColorScale(data, colors) {
  return d3.scaleQuantile().domain(data).range(colors);
}

/**
 * Create bottom axis
 * @param {d3.ScaleLinear|d3.ScaleBand} scale - D3 scale
 * @param {string} label - Axis label (optional)
 * @returns {d3.Axis}
 */
function createBottomAxis(scale, label) {
  return d3.axisBottom(scale);
}

/**
 * Create left axis
 * @param {d3.ScaleLinear|d3.ScaleBand} scale - D3 scale
 * @param {string} label - Axis label (optional)
 * @returns {d3.Axis}
 */
function createLeftAxis(scale, label) {
  return d3.axisLeft(scale);
}

// ============================================
// DIMENSIONS & MARGINS
// ============================================

const DEFAULT_MARGINS = {
  top: 40,
  right: 40,
  bottom: 60,
  left: 60,
};

/**
 * Calculate inner dimensions based on container and margins
 * @param {number} containerWidth - Width of container
 * @param {number} containerHeight - Height of container
 * @param {Object} margins - {top, right, bottom, left}
 * @returns {Object} - {width, height}
 */
function getInnerDimensions(
  containerWidth,
  containerHeight,
  margins = DEFAULT_MARGINS
) {
  return {
    width: containerWidth - margins.left - margins.right,
    height: containerHeight - margins.top - margins.bottom,
  };
}

/**
 * Get container dimensions
 * @param {string} selector - CSS selector of container
 * @returns {Object} - {width, height}
 */
function getContainerDimensions(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Container ${selector} not found`);
    return { width: 800, height: 600 };
  }
  return {
    width: element.clientWidth,
    height: element.clientHeight,
  };
}

// ============================================
// SVG UTILITIES
// ============================================

/**
 * Create an SVG element with proper setup
 * @param {string} selector - Container selector
 * @param {number} width - Total width
 * @param {number} height - Total height
 * @returns {Object} - {svg, g} - SVG element and main group
 */
function createSvg(selector, width, height, margins = DEFAULT_MARGINS) {
  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "visualization-svg");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margins.left},${margins.top})`);

  return { svg, g, margins, width, height };
}

/**
 * Clear a container
 * @param {string} selector - Container selector
 */
function clearContainer(selector) {
  d3.select(selector).selectAll("*").remove();
}

/**
 * Add axis label to SVG
 * @param {Object} g - D3 selection (group element)
 * @param {string} label - Label text
 * @param {string} position - 'bottom', 'left', 'top', or 'right'
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function addAxisLabel(g, label, position, x, y) {
  g.append("text")
    .attr("class", "axis-label")
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", position === "bottom" ? "middle" : "start")
    .style("fill", "#1a1a1a")
    .text(label);
}

// ============================================
// INTERACTIONS & TOOLTIPS
// ============================================

/**
 * Create a tooltip element
 * @returns {Object} - Tooltip D3 selection
 */
function createTooltip() {
  return d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px 16px")
    .style("background-color", "#1a1a1a")
    .style("color", "#ffffff")
    .style("border-radius", "2px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", "0")
    .style("z-index", "1000");
}

/**
 * Show tooltip
 * @param {Object} tooltip - Tooltip D3 selection
 * @param {string} text - Tooltip text
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function showTooltip(tooltip, text, x, y) {
  tooltip
    .style("opacity", "1")
    .html(text)
    .style("left", x + 10 + "px")
    .style("top", y - 28 + "px");
}

/**
 * Hide tooltip
 * @param {Object} tooltip - Tooltip D3 selection
 */
function hideTooltip(tooltip) {
  tooltip.style("opacity", "0");
}

// ============================================
// DATA AGGREGATION
// ============================================

/**
 * Count occurrences of values in a column
 * @param {Array<Object>} data - Input data
 * @param {string} column - Column name to count
 * @returns {Array<Object>} - [{key, value}, ...]
 */
function countByColumn(data, column) {
  const counts = {};
  data.forEach((d) => {
    const key = d[column];
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([key, value]) => ({ key, value }));
}

/**
 * Group data by column
 * @param {Array<Object>} data - Input data
 * @param {string} column - Column name to group by
 * @returns {Object} - Grouped data object
 */
function groupByColumn(data, column) {
  return d3.group(data, (d) => d[column]);
}

/**
 * Calculate statistics for numeric column
 * @param {Array<Object>} data - Input data
 * @param {string} column - Column name
 * @returns {Object} - {min, max, mean, median, std}
 */
function getColumnStats(data, column) {
  const values = data
    .map((d) => d[column])
    .filter((v) => v != null)
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const min = d3.min(values);
  const max = d3.max(values);
  const mean = d3.mean(values);
  const median = d3.median(values);
  const std = d3.deviation(values);

  return { min, max, mean, median, std };
}

// ============================================
// COLOR SCHEMES
// ============================================

const COLOR_SCHEMES = {
  // Semantic colors for disease status
  disease: {
    present: "#e74c3c", // Red
    absent: "#2ecc71", // Green
  },
  // Gender colors
  gender: {
    male: "#0066cc", // Blue
    female: "#ff8c00", // Orange
  },
  // Quantitative scales
  sequential: ["#f0f0f0", "#cccccc", "#666666", "#1a1a1a"],
  diverging: ["#2ecc71", "#e6f0ff", "#e74c3c"],
  categorical: [
    "#0066cc",
    "#ff8c00",
    "#2ecc71",
    "#e74c3c",
    "#9b59b6",
    "#f39c12",
  ],
};

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format number with specified decimal places
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string}
 */
function formatNumber(value, decimals = 2) {
  return parseFloat(value).toFixed(decimals);
}

/**
 * Format percentage
 * @param {number} value - Value (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether input is decimal (0-1)
 * @returns {string}
 */
function formatPercent(value, isDecimal = true) {
  const percent = isDecimal ? value * 100 : value;
  return percent.toFixed(1) + "%";
}

/**
 * Format large numbers with K/M/B suffixes
 * @param {number} value - Value to format
 * @returns {string}
 */
function formatCompact(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (value >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return value.toFixed(0);
}
