/**
 * Main application controller
 * Handles tab navigation and view switching
 */

const App = (() => {
    const TABS = {
        task1: Task1,
        task2: Task2,
        task3: Task3,
        task4: Task4,
        task5: Task5
    };

    let currentTask = 'task1';

    /**
     * Initialize the application
     */
    function init() {
        console.log('Initializing Heart Disease Visualization App');
        setupTabNavigation();
        switchToTask('task1');
    }

    /**
     * Setup tab navigation event listeners
     */
    function setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = button.getAttribute('data-task');
                switchToTask(taskId);
            });
        });
    }

    /**
     * Switch to a specific task
     * @param {string} taskId - Task identifier (task1, task2, etc.)
     */
    function switchToTask(taskId) {
        if (!(taskId in TABS)) {
            console.error(`Unknown task: ${taskId}`);
            return;
        }

        // Update current task
        currentTask = taskId;

        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-task="${taskId}"]`).classList.add('active');

        // Update active panel
        document.querySelectorAll('.task-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(taskId).classList.add('active');

        console.log(`Switched to ${taskId}`);
    }

    /**
     * Get current task ID
     * @returns {string} Current task identifier
     */
    function getCurrentTask() {
        return currentTask;
    }

    return {
        init,
        switchToTask,
        getCurrentTask
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
