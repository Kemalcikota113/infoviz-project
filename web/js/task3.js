/**
 * Task 3: Gender Patterns in Heart Disease
 * Do men and women show different patterns of heart disease prevalence?
 */

const Task3 = (() => {
  const CONTAINER = "#visualization-task3";
  const DATA_PATH = "../data/cleveland.csv";

  // Column names from dataset
  const COLUMNS = {
    sex: "sex",
    target: "target",
  };

  /**
   * Initialize visualization
   */
  async function init() {
    console.log("Initializing Task 3: Gender Patterns");

    // Load and prepare data
    const rawData = await loadData(DATA_PATH);
    if (rawData.length === 0) return;

    const data = parseNumericColumns(rawData, [COLUMNS.sex, COLUMNS.target]);
    const cleanData = removeNullRecords(data, [COLUMNS.sex, COLUMNS.target]);

    console.log(`Task 3: ${cleanData.length} records ready for visualization`);

    // TODO: Implement actual visualization
    renderPlaceholder(cleanData);
  }

  /**
   * Render placeholder content
   */
  function renderPlaceholder(data) {
    const container = document.querySelector(CONTAINER);

    // Aggregate by gender and disease status
    const byGender = {};
    data.forEach((d) => {
      const gender = d[COLUMNS.sex] === 1 ? "Male" : "Female";
      const hasDisease = d[COLUMNS.target] > 0 ? "Diseased" : "Healthy";
      const key = `${gender}-${hasDisease}`;
      byGender[key] = (byGender[key] || 0) + 1;
    });

    const males = data.filter((d) => d[COLUMNS.sex] === 1).length;
    const females = data.filter((d) => d[COLUMNS.sex] === 0).length;

    container.innerHTML = `
            <div style="text-align: center; color: #999;">
                <p style="font-size: 18px; margin-bottom: 16px;">Bar Chart Placeholder</p>
                <p style="color: #ccc; font-size: 14px;">
                    Total records: ${data.length}<br>
                    Males: ${males} | Females: ${females}<br>
                    Ready for disease prevalence comparison visualization
                </p>
            </div>
        `;
  }

  /**
   * TODO: Main render function for visualization
   * - Create bar chart grouped by gender
   * - Show disease presence vs absence
   * - Use semantic colors (green for healthy, red for diseased)
   * - Add hover interactions
   */
  function render(data) {
    // Implementation goes here
  }

  /**
   * TODO: Add interactive features
   */
  function setupInteractions() {
    // Implementation goes here
  }

  return {
    init,
    render,
    setupInteractions,
  };
})();

// Auto-initialize when document is ready
document.addEventListener("DOMContentLoaded", () => {
  Task3.init();
});
