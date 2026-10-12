/**
 * Memory & Context Layer Component
 * Displays recent commands, ongoing tasks, active project,
 * persistent workflow context, recent conversations, pinned objectives
 */

export function setupMemoryContext(container) {
    // Create panel elements
    const panelElements = {
        container: container,
        title: null,
        content: null,
        animationFrame: null,
        updateInterval: null,
        tabs: {},
        activeTab: 'recent',
        data: {
            recentCommands: [],
            ongoingTasks: [],
            activeProject: null,
            workflowContext: {},
            recentConversations: [],
            pinnedObjectives: []
        }
    };

    // Initialize the memory context panel
    function init() {
        // Clear container
        container.innerHTML = '';
        container.className = 'memory-context-panel holographic-panel';

        // Create panel structure
        createHeader();
        createTabHeader();
        createContentArea();

        // Load initial data
        loadInitialData();

        // Start updating
        startUpdates();
    }

    // Create panel header
    function createHeader() {
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.innerHTML = '<h3>MEMORY & CONTEXT</h3>';
        container.appendChild(header);
    }

    // Create tab header for different views
    function createTabHeader() {
        const tabContainer = document.createElement('div');
        tabContainer.className = 'tab-container';
        container.appendChild(tabContainer);

        const tabs = [
            { id: 'recent', label: 'Recent', icon: '⏰' },
            { id: 'tasks', label: 'Tasks', icon: '📋' },
            { id: 'project', label: 'Project', icon: '📁' },
            { id: 'workflow', label: 'Workflow', icon: '🔄' },
            { id: 'conversations', label: 'Conversations', icon: '💬' },
            { id: 'objectives', label: 'Objectives', icon: '🎯' }
        ];

        tabs.forEach(tabConfig => {
            const tabButton = document.createElement('button');
            tabButton.className = 'tab-button';
            tabButton.dataset.tabId = tabConfig.id;
            tabButton.innerHTML = `
                <span class="tab-icon">${tabConfig.icon}</span>
                <span class="tab-label">${tabConfig.label}</span>
            `;
            tabContainer.appendChild(tabButton);

            panelElements.tabs[tabConfig.id] = tabButton;

            tabButton.addEventListener('click', () => {
                setActiveTab(tabConfig.id);
            });
        });

        // Set first tab as active by default
        setActiveTab('recent');
    }

    // Create content area
    function createContentArea() {
        const content = document.createElement('div');
        content.className = 'panel-content';
        content.setAttribute('aria-live', 'polite');
        container.appendChild(content);

        panelElements.content = content;
    }

    // Set active tab
    function setActiveTab(tabId) {
        // Deactivate all tabs
        Object.values(panelElements.tabs).forEach(tab => {
            tab.classList.remove('active');
        });

        // Activate selected tab
        if (panelElements.tabs[tabId]) {
            panelElements.tabs[tabId].classList.add('active');
            panelElements.activeTab = tabId;
            renderTabContent();
        }
    }

    // Load initial data (in real implementation would come from WebSocket)
    function loadInitialData() {
        panelElements.data = {
            recentCommands: [
                {
                    id: 'cmd-1',
                    command: 'ls -la',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    duration: 0.2,
                    success: true,
                    outputLines: 12
                },
                {
                    id: 'cmd-2',
                    command: 'git status',
                    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
                    duration: 0.5,
                    success: true,
                    outputLines: 3
                },
                {
                    id: 'cmd-3',
                    command: 'python analyze_data.py',
                    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                    duration: 4.2,
                    success: true,
                    outputLines: 45
                }
            ],
            ongoingTasks: [
                {
                    id: 'task-1',
                    title: 'Implement AEGIS OS interface',
                    description: 'Creating the visual operating environment with Three.js globe and terminal system',
                    progress: 65,
                    priority: 'high',
                    started: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                    tags: ['development', 'frontend', 'visualization']
                },
                {
                    id: 'task-2',
                    title: 'Integrate voice synchronization',
                    description: 'Make the UI react to voice input with visual feedback',
                    progress: 30,
                    priority: 'medium',
                    started: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    tags: ['voice', 'audio', 'visualization']
                }
            ],
            activeProject: {
                name: 'AEGIS OS Interface',
                path: 'C:\\Projects\\friday-tony-stark-demo-main\\aegis_interface',
                gitBranch: 'main',
                lastCommit: {
                    hash: 'a1b2c3d4e5f6',
                    message: 'Initial commit for AEGIS OS interface',
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    author: 'Victor'
                },
                fileCount: 24,
                size: '4.2 MB',
                languageStats: {
                    JavaScript: '45%',
                    Python: '30%',
                    CSS: '15%',
                    HTML: '10%'
                }
            },
            workflowContext: {
                currentPhase: 'implementation',
                activeModules: ['globe-visualization', 'terminal-system', 'telemetry-panel', 'execution-stream'],
                pendingReview: ['voice-sync', 'data-validation', 'performance-optimization'],
                dependencies: ['three.js', 'xterm.js', 'monaco-editor'],
                environment: {
                    nodeVersion: 'v18.17.0',
                    pythonVersion: '3.11.0',
                    chromeVersion: '114.0.5735.199'
                }
            },
            recentConversations: [
                {
                    id: 'conv-1',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    summary: 'User requested AEGIS OS interface implementation',
                    participants: ['user', 'assistant'],
                    duration: '3:24',
                    topics: ['interface design', 'visualization', 'terminal']
                },
                {
                    id: 'conv-2',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    summary: 'Discussed voice synchronization requirements',
                    participants: ['user', 'assistant'],
                    duration: '1:45',
                    topics: ['voice activation', 'audio visualization', 'globe reaction']
                }
            ],
            pinnedObjectives: [
                {
                    id: 'obj-1',
                    title: 'Create immersive AI operating environment',
                    description: 'Build a system that feels like interacting with a machine intelligence',
                    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
                    progress: 65,
                    completed: false,
                    priority: 'high',
                    tags: ['immersion', 'ui/ux', 'experience']
                },
                {
                    id: 'obj-2',
                    title: 'Implement real-time data integration',
                    description: 'Connect all panels to live data sources with zero fake data',
                    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
                    progress: 40,
                    completed: false,
                    priority: 'high',
                    tags: ['data', 'integration', 'reliability']
                }
            ]
        };
    }

    // Start updating data
    function startUpdates() {
        // Update clock times periodically
        panelElements.updateInterval = setInterval(updateRelativeTimes, 30000); // Every 30 seconds

        // Add simulated updates occasionally
        setInterval(addSimulatedUpdate, 15000); // Every 15 seconds

        // Render initial content
        renderTabContent();
    }

    // Update relative times (e.g., "5 minutes ago")
    function updateRelativeTimes() {
        // Re-render the current tab to update time displays
        renderTabContent();
    }

    // Add simulated data update
    function addSimulatedUpdate() {
        // Add a random recent command
        const newCommand = {
            id: 'cmd-' + Date.now(),
            command: ['ls', 'git status', 'python test.py', 'npm start'][Math.floor(Math.random() * 4)],
            timestamp: new Date().toISOString(),
            duration: Math.random() * 2 + 0.1,
            success: Math.random() > 0.1,
            outputLines: Math.floor(Math.random() * 20) + 1
        };

        panelElements.data.recentCommands.unshift(newCommand);
        if (panelElements.data.recentCommands.length > 20) {
            panelElements.data.recentCommands.pop();
        }

        // Update progress on a random task
        if (panelElements.data.ongoingTasks.length > 0) {
            const taskIndex = Math.floor(Math.random() * panelElements.data.ongoingTasks.length);
            const task = panelElements.data.ongoingTasks[taskIndex];
            task.progress = Math.min(100, task.progress + Math.random() * 5);
        }

        // Re-render current tab
        renderTabContent();
    }

    // Render content based on active tab
    function renderTabContent() {
        if (!panelElements.content) return;

        // Clear content
        panelElements.content.innerHTML = '';

        switch (panelElements.activeTab) {
            case 'recent':
                renderRecentCommands();
                break;
            case 'tasks':
                renderOngoingTasks();
                break;
            case 'project':
                renderActiveProject();
                break;
            case 'workflow':
                renderWorkflowContext();
                break;
            case 'conversations':
                renderRecentConversations();
                break;
            case 'objectives':
                renderPinnedObjectives();
                break;
        }
    }

    // Render recent commands
    function renderRecentCommands() {
        const commands = panelElements.data.recentCommands;

        if (commands.length === 0) {
            panelElements.content.innerHTML = '<div class="empty-state">No recent commands</div>';
            return;
        }

        const commandsContainer = document.createElement('div');
        commandsContainer.className = 'commands-list';

        commands.forEach(cmd => {
            const commandElement = document.createElement('div');
            commandElement.className = 'command-item';
            commandElement.innerHTML = `
                <div class="command-header">
                    <span class="command-text">${escapeHtml(cmd.command)}</span>
                    <span class="command-meta">
                        <span class="duration">${formatDuration(cmd.duration)}</span>
                        <span class="status ${cmd.success ? 'success' : 'error'}">
                            ${cmd.success ? '✓' : '✗'}
                        </span>
                    </span>
                </div>
                <div class="command-footer">
                    <span class="timestamp">${formatTimeAgo(cmd.timestamp)}</span>
                    ${cmd.outputLines > 0 ? `<span class="output-lines">${cmd.outputLines} lines</span>` : ''}
                </div>
            `;
            commandsContainer.appendChild(commandElement);
        });

        panelElements.content.appendChild(commandsContainer);
    }

    // Render ongoing tasks
    function renderOngoingTasks() {
        const tasks = panelElements.data.ongoingTasks;

        if (tasks.length === 0) {
            panelElements.content.innerHTML = '<div class="empty-state">No ongoing tasks</div>';
            return;
        }

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'tasks-list';

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <div class="task-header">
                    <h4 class="task-title">${escapeHtml(task.title)}</h4>
                    <div class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</div>
                </div>
                <div class="task-description">${escapeHtml(task.description)}</div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.progress}%"></div>
                    </div>
                    <div class="progress-text">${task.progress}%</div>
                </div>
                <div class="task-meta">
                    <span class="meta-item">
                        <span class="meta-label">Started:</span>
                        <span class="meta-value">${formatTimeAgo(task.started)}</span>
                    </span>
                    <span class="meta-item">
                        <span class="meta-label">ETA:</span>
                        <span class="meta-value">${formatTimeAgo(task.estimatedCompletion)}</span>
                    </span>
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            tasksContainer.appendChild(taskElement);
        });

        panelElements.content.appendChild(tasksContainer);
    }

    // Render active project
    function renderActiveProject() {
        const project = panelElements.data.activeProject;

        if (!project) {
            panelElements.content.innerHTML = '<div class="empty-state">No active project</div>';
            return;
        }

        const projectContainer = document.createElement('div');
        projectContainer.className = 'project-info';

        projectContainer.innerHTML = `
            <div class="project-header">
                <h3 class="project-name">${escapeHtml(project.name)}</h3>
                <div class="project-branch">branch: ${escapeHtml(project.gitBranch)}</div>
            </div>
            <div class="project-path">${escapeHtml(project.path)}</div>
            <div class="project-stats">
                <div class="stat-item">
                    <span class="stat-label">Files:</span>
                    <span class="stat-value">${project.fileCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Size:</span>
                    <span class="stat-value">${project.size}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Last Commit:</span>
                    <span class="stat-value">${escapeHtml(project.lastCommit.message)}</span>
                </div>
            </div>
            <div class="project-language-stats">
                <h4>Language Distribution</h4>
                <div class="language-stats">
                    ${Object.entries(project.languageStats || {})
                        .map(([lang, pct]) => `
                            <div class="language-item">
                                <span class="language-name">${escapeHtml(lang)}</span>
                                <span class="language-percentage">${pct}</span>
                                <div class="language-bar">
                                    <div class="language-fill" style="width: ${pct}"></div>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        panelElements.content.appendChild(projectContainer);
    }

    // Render workflow context
    function renderWorkflowContext() {
        const context = panelElements.data.workflowContext;

        const contextContainer = document.createElement('div');
        contextContainer.className = 'workflow-info';

        contextContainer.innerHTML = `
            <div class="workflow-phase">
                <h4>Current Phase</h4>
                <p class="phase-value">${escapeHtml(context.currentPhase || 'Unknown')}</p>
            </div>
            <div class="workflow-modules">
                <h4>Active Modules</h4>
                <div class="modules-list">
                    ${(context.activeModules || []).map(module => `
                        <span class="module-tag">${escapeHtml(module)}</span>
                    `).join('')}
                </div>
            </div>
            <div class="workflow-pending">
                <h4>Pending Review</h4>
                <div class="pending-list">
                    ${(context.pendingReview || []).map(item => `
                        <span class="pending-item">${escapeHtml(item)}</span>
                    `).join('')}
                </div>
            </div>
            <div class="workflow-dependencies">
                <h4>Dependencies</h4>
                <div class="dependencies-list">
                    ${(context.dependencies || []).map(dep => `
                        <span class="dependency-tag">${escapeHtml(dep)}</span>
                    `).join('')}
                </div>
            </div>
            <div class="workflow-environment">
                <h4>Environment</h4>
                <div class="environment-vars">
                    ${Object.entries(context.environment || {})
                        .map(([key, value]) => `
                            <div class="env-item">
                                <span class="env-label">${escapeHtml(key)}:</span>
                                <span class="env-value">${escapeHtml(value)}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        panelElements.content.appendChild(contextContainer);
    }

    // Render recent conversations
    function renderRecentConversations() {
        const conversations = panelElements.data.recentConversations;

        if (conversations.length === 0) {
            panelElements.content.innerHTML = '<div class="empty-state">No recent conversations</div>';
            return;
        }

        const conversationsContainer = document.createElement('div');
        conversationsContainer.className = 'conversations-list';

        conversations.forEach(conv => {
            const convElement = document.createElement('div');
            convElement.className = 'conversation-item';
            convElement.innerHTML = `
                <div class="conversation-header">
                    <div class="conversation-summary">${escapeHtml(conv.summary)}</span>
                    <span class="conversation-duration">${conv.duration}</span>
                </div>
                <div class="conversation-participants">
                    <span class="participants-label">Participants:</span>
                    <span class="participants-value">
                        ${conv.participants.map(p => escapeHtml(p)).join(', ')}
                    </span>
                </div>
                <div class="conversation-timestamp">
                    <span class="timestamp-label">Time:</span>
                    <span class="timestamp-value">${formatTimeAgo(conv.timestamp)}</span>
                </div>
                ${conv.topics && conv.topics.length > 0 ? `
                    <div class="conversation-topics">
                        <span class="topics-label">Topics:</span>
                        ${conv.topics.map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
            `;
            conversationsContainer.appendChild(convElement);
        });

        panelElements.content.appendChild(conversationsContainer);
    }

    // Render pinned objectives
    function renderPinnedObjectives() {
        const objectives = panelElements.data.pinnedObjectives;

        if (objectives.length === 0) {
            panelElements.content.innerHTML = '<div class="empty-state">No pinned objectives</div>';
            return;
        }

        const objectivesContainer = document.createElement('div');
        objectivesContainer.className = 'objectives-list';

        objectives.forEach(obj => {
            const objElement = document.createElement('div');
            objElement.className = 'objective-item';
            objElement.innerHTML = `
                <div class="objective-header">
                    <h4 class="objective-title">${escapeHtml(obj.title)}</h4>
                    <div class="objective-priority priority-${obj.priority.toLowerCase()}">${obj.priority}</div>
                </div>
                <div class="objective-description">${escapeHtml(obj.description)}</div>
                <div class="objective-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${obj.progress}%"></div>
                    </div>
                    <div class="progress-text">${obj.progress}%</div>
                </div>
                <div class="objective-meta">
                    <span class="meta-item">
                        <span class="meta-label">Target:</span>
                        <span class="meta-value">${formatDate(obj.targetDate)}</span>
                    </span>
                    <span class="meta-item">
                        <span class="meta-label">Status:</span>
                        <span class="status ${obj.completed ? 'success' : 'pending'}">
                            ${obj.completed ? 'Completed' : 'In Progress'}
                        </span>
                    </span>
                    ${obj.tags && obj.tags.length > 0 ? `
                        <div class="objective-tags">
                            ${obj.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            objectivesContainer.appendChild(objElement);
        });

        panelElements.content.appendChild(objectivesContainer);
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to format duration
    function formatDuration(seconds) {
        if (seconds < 1) {
            return `${(seconds * 1000).toFixed(0)}ms`;
        } else if (seconds < 60) {
            return `${seconds.toFixed(1)}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}m ${secs.toFixed(0)}s`;
        }
    }

    // Helper function to format time ago
    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.round(diffMs / 1000);
        const diffMins = Math.round(diffSecs / 60);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffSecs < 5) return 'just now';
        if (diffSecs < 60) return `${diffSecs}s ago`;
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // Update with real data (would be called from WebSocket)
    function updateWithData(data) {
        // Merge new data with existing
        panelElements.data = {
            ...panelElements.data,
            ...data
        };
        renderTabContent();
    }

    // Public API
    return {
        init,
        updateWithData,
        setActiveTab,
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

// Add CSS for memory context panel
const memoryStyle = document.createElement('style');
memoryStyle.textContent = `
    .memory-context-panel {
        position: fixed;
        top: 4rem;
        left: 24%;
        right: 26%;
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
        content: '⧖';
        color: var(--accent-secondary);
        font-size: var(--font-size-xs);
    }

    .tab-container {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        padding: var(--spacing-xs) var(--spacing-sm);
    }

    .tab-button {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: var(--font-size-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        position: relative;
        overflow: visible;
        white-space: nowrap;
    }

    .tab-button:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
    }

    .tab-button.active {
        background: var(--bg-primary);
        color: var(--accent-primary);
        font-weight: 600;
    }

    .tab-button .tab-icon {
        font-size: var(--font-size-sm);
    }

    .tab-button .tab-label {
        font-size: var(--font-size-xs);
        font-weight: 500;
    }

    .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-sm);
        background: var(--bg-primary);
    }

    .empty-state {
        text-align: center;
        padding: var(--spacing-lg);
        color: var(--text-muted);
        font-style: italic;
    }

    /* Recent commands styles */
    .commands-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .command-item {
        display: flex;
        flex-direction: column;
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm);
        border-left: 3px solid var(--accent-primary);
    }

    .command-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-xs);
    }

    .command-text {
        font-family: var(--font-mono);
        font-size: var(--font-size-sm);
        color: var(--text-primary);
    }

    .command-meta {
        display: flex;
        gap: var(--spacing-sm);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .duration {
        font-family: var(--font-mono);
    }

    .status {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        font-size: var(--font-size-xs);
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .status.success {
        background-color: var(--accent-success);
        color: white;
    }

    .status.error {
        background-color: var(--accent-alert);
        color: white;
    }

    .command-footer {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    /* Ongoing tasks styles */
    .tasks-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .task-item {
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm);
        border-left: 3px solid var(--accent-secondary);
    }

    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-xs);
    }

    .task-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .task-priority {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xs);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
    }

    .priority-high {
        background-color: var(--accent-alert);
        color: white;
    }

    .priority-medium {
        background-color: var(--accent-secondary);
        color: white;
    }

    .priority-low {
        background-color: var(--text-muted);
        color: white;
    }

    .task-description {
        color: var(--text-muted);
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-xs);
    }

    .task-progress {
        margin-bottom: var(--spacing-sm);
    }

    .progress-bar {
        width: 100%;
        height: 6px;
        background-color: var(--border-color);
        border-radius: var(--radius-sm);
        overflow: hidden;
        margin-bottom: var(--spacing-xs);
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(
            to right,
            var(--accent-primary),
            var(--accent-secondary)
        );
        transition: width var(--transition-fast);
    }

    .progress-text {
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        color: var(--text-primary);
        text-align: right;
        min-width: 30px;
    }

    .task-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .meta-item {
        display: flex;
        flex-direction: column;
    }

    .meta-label {
        font-weight: 500;
    }

    .task-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-sm);
    }

    .tag {
        background-color: var(--bg-secondary);
        color: var(--text-muted);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xs);
        font-size: var(--font-size-xs);
    }

    /* Project info styles */
    .project-info {
        padding: var(--spacing-sm);
    }

    .project-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }

    .project-name {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .project-branch {
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
    }

    .project-path {
        font-family: var(--font-mono);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-bottom: var(--spacing-sm);
        word-break: break-all;
    }

    .project-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
    }

    .stat-item {
        display: flex;
        flex-direction: column;
    }

    .stat-label {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }

    .stat-value {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--text-primary);
    }

    .project-language-stats {
        margin-top: var(--spacing-sm);
    }

    .language-stats {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .language-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .language-name {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .language-percentage {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--text-primary);
    }

    .language-bar {
        width: 100%;
        height: 6px;
        background-color: var(--border-color);
        border-radius: var(--radius-sm);
        overflow: hidden;
        margin-top: var(--spacing-xs);
    }

    .language-fill {
        height: 100%;
        background: linear-gradient(
            to right,
            var(--accent-primary),
            var(--accent-secondary)
        );
        transition: width var(--transition-fast);
    }

    /* Workflow context styles */
    .workflow-info {
        padding: var(--spacing-sm);
    }

    .workflow-phase, .workflow-modules, .workflow-pending, .workflow-dependencies, .workflow-environment {
        margin-bottom: var(--spacing-sm);
    }

    .workflow-phase h4, .workflow-modules h4, .workflow-pending h4, .workflow-dependencies h4, .workflow-environment h4 {
        color: var(--accent-primary);
        font-size: var(--font-size-sm);
        font-weight: 600;
        margin: 0 0 var(--spacing-xs) 0;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .workflow-phase h4::before { content: '🎯'; }
    .workflow-modules h4::before { content: '🧩'; }
    .workflow-pending h4::before { content: '⏳'; }
    .workflow-dependencies h4::before { content: '📦'; }
    .workflow-environment h4::before { content: '⚙️'; }

    .phase-value {
        font-family: var(--font-mono);
        background-color: var(--bg-secondary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        display: inline-block;
    }

    .modules-list, .pending-list, .dependencies-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
    }

    .module-tag, .pending-item, .dependency-tag {
        background-color: var(--bg-secondary);
        color: var(--text-muted);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xs);
        font-size: var(--font-size-xs);
    }

    .environment-vars {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }

    .env-item {
        display: flex;
        justify-content: space-between;
    }

    .env-label {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }

    .env-value {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--text-primary);
    }

    /* Recent conversations styles */
    .conversations-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .conversation-item {
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm);
        border-left: 3px solid var(--accent-success);
    }

    .conversation-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
    }

    .conversation-summary {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        line-height: 1.4;
    }

    .conversation-duration {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xs);
        font-size: var(--font-size-xs);
        font-weight: 600;
    }

    .conversation-participants {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
    }

    .participants-label,
    .timestamp-label {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }

    .participants-value,
    .timestamp-value {
        font-family: var(--font-mono);
        font-weight: 600;
        color: var(--text-primary);
    }

    .conversation-topics {
        margin-top: var(--spacing-sm);
    }

    .topics-label {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }

    .topic-tag {
        background-color: var(--bg-secondary);
        color: var(--text-muted);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xs);
        font-size: var(--font-size-xs);
    }

    /* Pinned objectives styles */
    .objectives-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .objective-item {
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm);
        border-left: 3px solid var(--accent-success);
    }

    .objective-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-xs);
    }

    .objective-title {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .objective-priority {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xs);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
    }

    .objective-description {
        color: var(--text-muted);
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-xs);
    }

    .objective-progress {
        margin-bottom: var(--spacing-sm);
    }

    .objective-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        font-size: var(--font-size-xs);
        color: var(--text-muted);
    }

    .objective-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-sm);
    }

    /* Holographic panel effect */
    .memory-context-panel.holographic-panel {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-md);
        backdrop-filter: blur(10px);
    }

    .memory-context-panel.holographic-panel::before {
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

document.head.appendChild(memoryStyle);