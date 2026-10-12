/**
 * ExecutionStream Panel Component
 * Dedicated panel showing real operational visibility
 * Displays executed commands, automation events, opened applications,
 * filesystem actions, server startups, Python execution, Git operations
 */

export function setupExecutionStream(container) {
    // Create panel elements
    const panelElements = {
        container: container,
        title: null,
        content: null,
        events: [],
        maxEvents: 100,
        animationFrame: null,
        updateInterval: null,
        isPaused: false,
        filter: 'all' // all, commands, automation, filesystem, server, python, git
    };

    // Initialize the execution stream panel
    function init() {
        // Clear container
        container.innerHTML = '';
        container.className = 'execution-stream-panel holographic-panel';

        // Create panel structure
        createHeader();
        createContent();
        createControls();

        // Start updating
        startUpdates();
    }

    // Create panel header
    function createHeader() {
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = `
            <h3>EXECUTION STREAM</h3>
            <div class="header-controls">
                <button class="btn-toggle-pause" title="Pause/Resume Stream">⏸</button>
                <button class="btn-filter" title="Filter Events">🔍</button>
                <button class="btn-clear" title="Clear Stream">🗑</button>
                <button class="btn-settings" title="Settings">⚙</button>
            </div>
        `;
        container.appendChild(header);

        // Add event listeners to header buttons
        header.querySelector('.btn-toggle-pause').addEventListener('click', togglePause);
        header.querySelector('.btn-clear').addEventListener('click', clearEvents);
        header.querySelector('.btn-filter').addEventListener('click', showFilterMenu);
    }

    // Create panel content
    function createContent() {
        const content = document.createElement('div');
        content.className = 'panel-content';
        content.setAttribute('aria-live', 'polite');
        container.appendChild(content);

        panelElements.content = content;
    }

    // Create panel controls
    function createControls() {
        const controls = document.createElement('div');
        controls.className = 'panel-controls';
        controls.innerHTML = `
            <div class="stream-status">
                <span class="status-label">Stream:</span>
                <span class="status-value">Active</span>
            </div>
            <div class="event-count">
                <span class="label">Events:</span>
                <span class="value">0</span>
            </div>
        `;
        container.appendChild(controls);
    }

    // Start updating the stream
    function startUpdates() {
        // Simulate adding events periodically
        panelElements.updateInterval = setInterval(addSimulatedEvent, 3000);

        // Start animation loop
        panelElements.animationFrame = requestAnimationFrame(animate);
    }

    // Add a simulated event (for demo)
    function addSimulatedEvent() {
        if (panelElements.isPaused) return;

        const eventTypes = [
            { type: 'command', title: 'Command Executed', icon: '>', color: 'var(--accent-primary)' },
            { type: 'automation', title: 'Automation Triggered', icon: '⚡', color: 'var(--accent-secondary)' },
            { type: 'application', title: 'Application Launched', icon: '🚀', color: 'var(--accent-success)' },
            { type: 'filesystem', title: 'Filesystem Action', icon: '📁', color: 'var(--text-muted)' },
            { type: 'server', title: 'Server Started', icon: '🖥', color: 'var(--accent-primary)' },
            { type: 'python', title: 'Python Execution', icon: '🐍', color: 'var(--accent-success)' },
            { type: 'git', title: 'Git Operation', icon: '🌿', color: 'var(--accent-secondary)' }
        ];

        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});

        const event = {
            id: Date.now() + Math.random(),
            type: eventType.type,
            title: eventType.title,
            icon: eventType.icon,
            color: eventType.color,
            timestamp: timestamp,
            description: getRandomDescription(eventType.type),
            details: getRandomDetails(eventType.type)
        };

        addEvent(event);
    }

    // Get random description based on event type
    function getRandomDescription(type) {
        const descriptions = {
            command: [
                'ls -la', 'dir', 'cd /projects', 'git status', 'python script.py',
                'npm start', 'code .', 'mkdir new_folder', 'del temp.txt',
                'pip install requests', 'node server.js'
            ],
            automation: [
                'Workflow triggered: Daily backup',
                'Automation started: Code formatting',
                'Scheduled task executed: Report generation',
                'Event-based automation: File watcher activated',
                'Voice command processed: Open browser'
            ],
            application: [
                'Launched: Visual Studio Code',
                'Started: Google Chrome',
                'Opened: Windows Terminal',
                'Started: Python IDE',
                'Launched: Docker Desktop'
            ],
            filesystem: [
                'Created: README.md',
                'Modified: config.py',
                'Deleted: temp.log',
                'Moved: project.zip to archive/',
                'Copied: backup.sql to backup/',
                'Renamed: old_name.txt to new_name.txt'
            ],
            server: [
                'Started: Web server on port 8080',
                'Launched: Database service',
                'Started: API gateway',
                'Launched: WebSocket server',
                'Started: Message queue service'
            ],
            python: [
                'Executed: data_analysis.py',
                'Ran: machine_learning_model.py',
                'Started: web_scraper.py',
                'Executed: api_client.py',
                'Ran: test_suite.py'
            ],
            git: [
                'Committed: Fix authentication bug',
                'Pushed: Feature branch to origin',
                'Pulled: Latest changes from upstream',
                'Branched: New feature development',
                'Merged: Release candidate into main'
            ]
        };

        const list = descriptions[type] || ['Unknown action'];
        return list[Math.floor(Math.random() * list.length)];
    }

    // Get random details based on event type
    function getRandomDetails(type) {
        const details = {
            command: [
                { path: 'C:\\Projects\\AEGIS-OS', duration: '0.3s' },
                { path: 'C:\\Users\\Victor\\Documents', duration: '1.2s' },
                { path: '/home/victor/projects', duration: '0.8s' }
            ],
            automation: [
                { trigger: 'Time-based (02:00 AM)', success: true },
                { trigger: 'File change detected', success: true },
                { trigger: 'Voice command: "Hey AEGIS"', success: true }
            ],
            application: [
                { app: 'Code.exe', pid: '4523', mem: '245 MB' },
                { app: 'Chrome.exe', pid: '3891', mem: '1.2 GB' },
                { app: 'wt.exe', pid: '2109', mem: '89 MB' }
            ],
            filesystem: [
                { size: '2.4 KB', attr: 'Normal' },
                { size: '1.2 MB', attr: 'Archive' },
                { size: '0 bytes', attr: 'Temporary' }
            ],
            server: [
                { port: '8080', protocol: 'HTTP', status: 'Running' },
                { port: '5432', protocol: 'PostgreSQL', status: 'Connected' },
                { port: '3000', protocol: 'WebSocket', status: 'Listening' }
            ],
            python: [
                { script: 'analyze_data.py', args: '--verbose --output=report.pdf' },
                { module: 'tensorflow', version: '2.13.0' },
                { package: 'requests', action: 'installed' }
            ],
            git: [
                { repo: 'AEGIS-OS', branch: 'main', files: '3 changed' },
                { remote: 'origin', action: 'push', status: 'success' },
                { tag: 'v1.2.0', message: 'Release version' }
            ]
        };

        const list = details[type] || [{ info: 'No details available' }];
        return list[Math.floor(Math.random() * list.length)];
    }

    // Add event to the stream
    function addEvent(event) {
        // Add to beginning of events list
        panelElements.events.unshift(event);

        // Keep only the most recent events
        if (panelElements.events.length > panelElements.maxEvents) {
            panelElements.events.pop();
        }

        // Update display if not paused
        if (!panelElements.isPaused) {
            renderEvents();
        }

        // Update event count
        updateEventCount();
    }

    // Render events to the panel
    function renderEvents() {
        if (!panelElements.content) return;

        // Clear content
        panelElements.content.innerHTML = '';

        // Filter events based on current filter
        const filteredEvents = panelElements.events.filter(event => {
            if (panelElements.filter === 'all') return true;
            return event.type === panelElements.filter;
        });

        // Add each event to the display
        filteredEvents.forEach(event => {
            const eventElement = createEventElement(event);
            panelElements.content.appendChild(eventElement);
        });

        // Scroll to bottom to show latest events
        panelElements.content.scrollTop = panelElements.content.scrollHeight;
    }

    // Create an event element
    function createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        eventDiv.dataset.eventId = event.id;
        eventDiv.dataset.eventType = event.type;

        // Create event content
        eventDiv.innerHTML = `
            <div class="event-timestamp">${event.timestamp}</div>
            <div class="event-content">
                <div class="event-icon" style="color: ${event.color}">${event.icon}</div>
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-description">${event.description}</div>
                    ${event.details ? `<div class="event-meta">${formatDetails(event.details)}</div>` : ''}
                </div>
            </div>
            <div class="event-indicator"></div>
        `;

        return eventDiv;
    }

    // Format details for display
    function formatDetails(details) {
        if (typeof details === 'string') return details;
        if (typeof details === 'object') {
            return Object.entries(details)
                .map(([key, value]) => `<span class="meta-item"><span class="meta-label">${key}:</span> <span class="meta-value">${value}</span></span>`)
                .join(' ');
        }
        return String(details);
    }

    // Toggle pause/resume
    function togglePause() {
        panelElements.isPaused = !panelElements.isPaused;
        const btn = panelElements.container.querySelector('.btn-toggle-pause');
        if (panelElements.isPaused) {
            btn.textContent = '▶';
            btn.title = 'Resume Stream';
        } else {
            btn.textContent = '⏸';
            btn.title = 'Pause Stream';
            // Render events when resuming
            renderEvents();
        }

        // Update status indicator
        const statusValue = panelElements.container.querySelector('.status-value');
        if (statusValue) {
            statusValue.textContent = panelElements.isPaused ? 'Paused' : 'Active';
            statusValue.style.color = panelElements.isPaused ? 'var(--accent-alert)' : 'var(--accent-success)';
        }
    }

    // Clear all events
    function clearEvents() {
        panelElements.events = [];
        renderEvents();
        updateEventCount();
    }

    // Show filter menu (simplified)
    function showFilterMenu() {
        // In a real implementation, this would show a dropdown menu
        // For now, we'll just cycle through filters
        const filters = ['all', 'command', 'automation', 'application', 'filesystem', 'server', 'python', 'git'];
        const currentIndex = filters.indexOf(panelElements.filter);
        const nextIndex = (currentIndex + 1) % filters.length;
        panelElements.filter = filters[nextIndex];

        // Update button text
        const btn = panelElements.container.querySelector('.btn-filter');
        btn.title = `Filter: ${panelElements.filter.charAt(0).toUpperCase() + panelElements.filter.slice(1)}`;

        // Render events with new filter
        if (!panelElements.isPaused) {
            renderEvents();
        }
    }

    // Update event count display
    function updateEventCount() {
        const countElement = panelElements.container.querySelector('.event-count .value');
        if (countElement) {
            countElement.textContent = panelElements.events.length.toString();
        }
    }

    // Animation loop
    function animate() {
        panelElements.animationFrame = requestAnimationFrame(animate);

        // Add subtle animation to event indicators
        const eventItems = panelElements.content.querySelectorAll('.event-item');
        eventItems.forEach((item, index) => {
            // Only animate visible items
            if (item.offsetParent !== null) {
                const delay = index * 50; // Staggered animation
                const pulse = Math.sin((performance.now() - delay) * 0.003) * 0.2 + 0.8;
                const indicator = item.querySelector('.event-indicator');
                if (indicator) {
                    indicator.style.opacity = pulse.toString();
                    indicator.style.backgroundColor =
                        `var(--accent-${['primary', 'secondary', 'success', 'muted'][index % 4]})`;
                }
            }
        });
    }

    // Update with real event data (would be called from WebSocket)
    function updateWithEvent(event) {
        addEvent(event);
    }

    // Set filter
    function setFilter(filterType) {
        panelElements.filter = filterType;
        if (!panelElements.isPaused) {
            renderEvents();
        }
        updateEventCount();
    }

    // Public API
    return {
        init,
        updateWithEvent,
        setFilter,
        togglePause,
        clearEvents,
        destroy: () => {
            if (panelElements.updateInterval) {
                clearInterval(panelElements.updateInterval);
            }
            if (panelElements.animationFrame) {
                cancelAnimationFrame(panelElements.animationFrame);
            }
        }
    };
}

// Add CSS for execution stream panel
const executionStyle = document.createElement('style');
executionStyle.textContent = `
    .execution-stream-panel {
        position: fixed;
        top: 4rem;
        right: 0;
        width: 26%;
        min-width: 250px;
        bottom: 0;
        display: flex;
        flex-direction: column;
        margin: var(--spacing-lg);
        z-index: var(--z-content);
        overflow: hidden;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-md);
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
    }

    .panel-header h3 {
        color: var(--accent-primary);
        font-size: var(--font-size-lg);
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .panel-header h3::before {
        content: '⚡';
        color: var(--accent-secondary);
        font-size: var(--font-size-xs);
    }

    .header-controls {
        display: flex;
        gap: var(--spacing-xs);
    }

    .header-controls button {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: var(--font-size-sm);
        padding: var(--spacing-xs);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
    }

    .header-controls button:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
        transform: translateY(-1px);
    }

    .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-sm);
        background: var(--bg-primary);
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }

    .event-item {
        display: flex;
        padding: var(--spacing-sm) var(--spacing-md);
        border-bottom: 1px solid rgba(34, 34, 34, 0.3);
        transition: background-color var(--transition-fast);
        position: relative;
        overflow: hidden;
    }

    .event-item:hover {
        background-color: var(--bg-secondary);
        transform: translateX(2px);
    }

    .event-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--accent-primary);
        opacity: 0;
        transition: opacity var(--transition-fast);
    }

    .event-item:hover::before {
        opacity: 0.7;
    }

    .event-timestamp {
        flex: 0 0 auto;
        width: 60px;
        text-align: center;
        color: var(--text-muted);
        font-size: var(--font-size-xs);
        font-family: var(--font-mono);
    }

    .event-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        padding: var(--spacing-xs) 0;
    }

    .event-icon {
        flex: 0 0 auto;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-sm);
    }

    .event-details {
        display: flex;
        flex-direction: column;
    }

    .event-title {
        font-weight: 600;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
    }

    .event-description {
        color: var(--text-muted);
        font-size: var(--font-size-xs);
    }

    .event-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .meta-item {
        display: flex;
    }

    .meta-label {
        font-weight: 500;
    }

    .meta-value {
        opacity: 0.8;
    }

    .event-indicator {
        flex: 0 0 auto;
        width: 4px;
        background-color: var(--accent-primary);
    }

    .panel-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        border-top: 1px solid var(--border-color);
        background: var(--bg-secondary);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .status-label, .label {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-value, .value {
        font-family: var(--font-mono);
        font-weight: 600;
    }

    /* Holographic panel effect */
    .execution-stream-panel.holographic-panel {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-md);
        backdrop-filter: blur(10px);
    }

    .execution-stream-panel.holographic-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            var(--accent-primary),
            var(--accent-secondary),
            var(--accent-primary),
            transparent
        );
        animation: holographicSweep 3s linear infinite;
    }

    @keyframes holographicSweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;

document.head.appendChild(executionStyle);