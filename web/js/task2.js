/**
 * Task 2: Cholesterol & Resting Blood Pressure vs Heart Disease
 * Is there a relationship between cholesterol level and resting blood pressure,
 * and does this relationship differ between patients with and without heart disease?
 */

const Task2 = (() => {
  const CONTAINER = "#visualization-task2";
  const DATA_PATH = "../data/cleveland.csv";

  // Column names from dataset
  const COLUMNS = {
    cholesterol: "chol",
    restingBP: "trestbps",
    target: "target",
  };

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

    const data = parseNumericColumns(rawData, [
      COLUMNS.cholesterol,
      COLUMNS.restingBP,
      COLUMNS.target,
    ]);
    const cleanData = removeNullRecords(data, [
      COLUMNS.cholesterol,
      COLUMNS.restingBP,
      COLUMNS.target,
    ]);

    console.log(`Task 2: ${cleanData.length} records ready for visualization`);

    // TODO: Implement actual visualization
    renderPlaceholder(cleanData);
  }

  /**
   * Render placeholder content
   */
  function renderPlaceholder(data) {
    const container = document.querySelector(CONTAINER);
    const cholStats = getColumnStats(data, COLUMNS.cholesterol);
    const bpStats = getColumnStats(data, COLUMNS.restingBP);
    const healthy = data.filter((d) => d[COLUMNS.target] === 0).length;
    const diseased = data.filter((d) => d[COLUMNS.target] > 0).length;

    container.innerHTML = `
            <div style="text-align: center; color: #999;">
                <p style="font-size: 18px; margin-bottom: 16px;">2D Scatter Plot Placeholder</p>
                <p style="color: #ccc; font-size: 14px;">
                    Data loaded: ${data.length} records<br>
                    Cholesterol range: ${cholStats.min} - ${cholStats.max} mg/dL<br>
                    Resting BP range: ${bpStats.min} - ${bpStats.max} mmHg<br>
                    Healthy: ${healthy} | Diseased: ${diseased}
                </p>
            </div>
        `;
  }

  /**
   * TODO: Main render function for visualization
   * - Create scatter plot with cholesterol on x-axis
   * - Resting BP on y-axis
   * - Color by disease presence
   * - Add hover interactions and tooltips
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
  Task2.init();
});
