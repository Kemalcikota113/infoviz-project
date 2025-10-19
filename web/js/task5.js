/**
 * Task 5: Exercise Indicators and Heart Disease
 * How does exercise-induced angina and maximum heart rate relate to heart disease likelihood?
 */

const Task5 = (() => {
    const CONTAINER = '#visualization-task5';
    const DATA_PATH = '../data/cleveland.csv';
    
    // Column names from dataset
    const COLUMNS = {
        maxHeartRate: 'thalach',
        age: 'age',
        exerciseAngina: 'exang',
        target: 'target'
    };

    /**
     * Initialize visualization
     */
    async function init() {
        console.log('Initializing Task 5: Exercise Indicators');
        
        // Load and prepare data
        const rawData = await loadData(DATA_PATH);
        if (rawData.length === 0) return;
        
        const data = parseNumericColumns(rawData, [
            COLUMNS.maxHeartRate,
            COLUMNS.age,
            COLUMNS.exerciseAngina,
            COLUMNS.target
        ]);
        const cleanData = removeNullRecords(data, [
            COLUMNS.maxHeartRate,
            COLUMNS.age,
            COLUMNS.exerciseAngina,
            COLUMNS.target
        ]);
        
        console.log(`Task 5: ${cleanData.length} records ready for visualization`);
        
        // TODO: Implement actual visualization
        renderPlaceholder(cleanData);
    }

    /**
     * Render placeholder content
     */
    function renderPlaceholder(data) {
        const container = document.querySelector(CONTAINER);
        const hrStats = getColumnStats(data, COLUMNS.maxHeartRate);
        const ageStats = getColumnStats(data, COLUMNS.age);
        const withAngina = data.filter(d => d[COLUMNS.exerciseAngina] > 0).length;
        const withoutAngina = data.filter(d => d[COLUMNS.exerciseAngina] === 0).length;
        
        container.innerHTML = `
            <div style="text-align: center; color: #999;">
                <p style="font-size: 18px; margin-bottom: 16px;">Multi-dimensional Scatter Plot Placeholder</p>
                <p style="color: #ccc; font-size: 14px;">
                    Total records: ${data.length}<br>
                    Max Heart Rate range: ${hrStats.min} - ${hrStats.max} bpm<br>
                    Age range: ${ageStats.min} - ${ageStats.max} years<br>
                    With exercise angina: ${withAngina} | Without: ${withoutAngina}
                </p>
            </div>
        `;
    }

    /**
     * TODO: Main render function for visualization
     * - Create scatter plot with max heart rate vs age
     * - Color by exercise-induced angina (binary)
     * - Size or shape by disease presence
     * - Add hover interactions and detailed tooltips
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
    Task5.init();
});
