/**
 * Task 1: Age vs Heart Disease
 * How does the likelihood of heart disease vary across different age groups?
 */

const Task1 = (() => {
    const CONTAINER = '#visualization-task1';
    const DATA_PATH = '../data/cleveland.csv';
    
    // Column names from dataset
    const COLUMNS = {
        age: 'age',
        target: 'target'
    };

    /**
     * Initialize visualization
     */
    async function init() {
        console.log('Initializing Task 1: Age vs Heart Disease');
        
        // Load and prepare data
        const rawData = await loadData(DATA_PATH);
        if (rawData.length === 0) return;
        
        const data = parseNumericColumns(rawData, [COLUMNS.age, COLUMNS.target]);
        const cleanData = removeNullRecords(data, [COLUMNS.age, COLUMNS.target]);
        
        console.log(`Task 1: ${cleanData.length} records ready for visualization`);
        
        // TODO: Implement actual visualization
        renderPlaceholder(cleanData);
    }

    /**
     * Render placeholder content
     */
    function renderPlaceholder(data) {
        const container = document.querySelector(CONTAINER);
        container.innerHTML = `
            <div style="text-align: center; color: #999;">
                <p style="font-size: 18px; margin-bottom: 16px;">Scatter Plot Placeholder</p>
                <p style="color: #ccc; font-size: 14px;">
                    Data loaded: ${data.length} records<br>
                    Age range: ${Math.min(...data.map(d => d[COLUMNS.age]))} - 
                    ${Math.max(...data.map(d => d[COLUMNS.age]))} years<br>
                    Disease present: ${data.filter(d => d[COLUMNS.target] > 0).length} cases
                </p>
            </div>
        `;
    }

    /**
     * TODO: Main render function for visualization
     * - Create scatter plot with age on x-axis
     * - Color points by disease presence
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
        setupInteractions
    };
})();

// Auto-initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    Task1.init();
});
