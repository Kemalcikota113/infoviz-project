/**
 * Task 4: Chest Pain Types and Heart Disease
 * Which chest pain types are most commonly associated with heart disease?
 */

const Task4 = (() => {
    const CONTAINER = '#visualization-task4';
    const DATA_PATH = '../data/cleveland.csv';
    
    // Column names from dataset
    const COLUMNS = {
        chestPain: 'cp',
        target: 'target'
    };

    /**
     * Initialize visualization
     */
    async function init() {
        console.log('Initializing Task 4: Chest Pain Types');
        
        // Load and prepare data
        const rawData = await loadData(DATA_PATH);
        if (rawData.length === 0) return;
        
        const data = parseNumericColumns(rawData, [COLUMNS.chestPain, COLUMNS.target]);
        const cleanData = removeNullRecords(data, [COLUMNS.chestPain, COLUMNS.target]);
        
        console.log(`Task 4: ${cleanData.length} records ready for visualization`);
        
        // TODO: Implement actual visualization
        renderPlaceholder(cleanData);
    }

    /**
     * Render placeholder content
     */
    function renderPlaceholder(data) {
        const container = document.querySelector(CONTAINER);
        
        // Count chest pain types
        const cpCounts = countByColumn(data, COLUMNS.chestPain);
        const diseaseByCP = {};
        
        data.forEach(d => {
            const cp = d[COLUMNS.chestPain];
            const hasDisease = d[COLUMNS.target] > 0 ? 1 : 0;
            if (!diseaseByCP[cp]) {
                diseaseByCP[cp] = { total: 0, diseased: 0 };
            }
            diseaseByCP[cp].total++;
            diseaseByCP[cp].diseased += hasDisease;
        });
        
        container.innerHTML = `
            <div style="text-align: center; color: #999;">
                <p style="font-size: 18px; margin-bottom: 16px;">Heatmap Placeholder</p>
                <p style="color: #ccc; font-size: 14px;">
                    Total records: ${data.length}<br>
                    Chest pain types found: ${cpCounts.length}<br>
                    Ready for disease outcome heatmap visualization
                </p>
            </div>
        `;
    }

    /**
     * TODO: Main render function for visualization
     * - Create heatmap with chest pain types
     * - Color intensity represents disease prevalence
     * - X-axis: Chest pain type (0-3)
     * - Y-axis: Disease presence
     * - Use color gradient from light (low prevalence) to dark (high prevalence)
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
    Task4.init();
});
