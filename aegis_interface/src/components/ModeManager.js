/**
 * Mode Manager Component
 * Manages dynamic mode system for AEGIS OS
 * Modes: Intelligence Mode, Engineering Mode, Focus Mode, Passive Monitoring, Command Mode
 */

export function setupModeManager() {
    // Mode manager elements
    const modeElements = {
        currentMode: 'intelligence',
        modeSelectors: {},
        modeConfigs: {
            intelligence: {
                name: 'Intelligence Mode',
                description: 'Prioritize news feeds, memory context, globe visualizations',
                panelPriorities: [
                    { id: 'globe', weight: 3 },
                    { id: 'memory', weight: 3 },
                    { id: 'intelligence', weight: 3 },
                    { id: 'execution', weight: 2 },
                    { id: 'telemetry', weight: 1 },
                    { id: 'terminal', weight: 1 }
                ],
                updateFrequencies: {
                    telemetry: 2000,   // ms
                    intelligence: 5000,
                    execution: 1000,
                    memory: 5000,
                    terminal: 1000
                },
                visualIntensity: 0.8,
                audioSensitivity: 0.6
            },
            engineering: {
                name: 'Engineering Mode',
                description: 'Emphasize terminal, execution stream, telemetry, detailed logs',
                panelPriorities: [
                    { id: 'terminal', weight: 3 },
                    { id: 'execution', weight: 3 },
                    { id: 'telemetry', weight: 3 },
                    { id: 'globe', weight: 1 },
                    { id: 'memory', weight: 1 },
                    { id: 'intelligence', weight: 1 }
                ],
                updateFrequencies: {
                    telemetry: 500,    // ms
                    intelligence: 15000,
                    execution: 500,
                    memory: 15000,
                    terminal: 200
                },
                visualIntensity: 0.6,
                audioSensitivity: 0.4
            },
            focus: {
                name: 'Focus Mode',
                description: 'Minimize distractions, center on active task/project, reduce feed updates',
                panelPriorities: [
                    { id: 'memory', weight: 3 }, // Focus on current task/project
                    { id: 'terminal', weight: 2 },
                    { id: 'execution', weight: 2 },
                    { id: 'globe', weight: 1 },
                    { id: 'intelligence', weight: 0.5 },
                    { id: 'telemetry', weight: 1 }
                ],
                updateFrequencies: {
                    telemetry: 5000,
                    intelligence: 30000, // Reduce news updates
                    execution: 2000,
                    memory: 2000,
                    terminal: 1000
                },
                visualIntensity: 0.5,
                audioSensitivity: 0.3
            },
            passive: {
                name: 'Passive Monitoring',
                description: 'Minimal interface, globe slow rotation, basic telemetry only',
                panelPriorities: [
                    { id: 'globe', weight: 3 },
                    { id: 'telemetry', weight: 2 },
                    { id: 'terminal', weight: 0.5 },
                    { id: 'execution', weight: 0.5 },
                    { id: 'memory', weight: 1 },
                    { id: 'intelligence', weight: 1 }
                ],
                updateFrequencies: {
                    telemetry: 5000,
                    intelligence: 60000, // Minimal news
                    execution: 10000,
                    memory: 10000,
                    terminal: 5000
                },
                visualIntensity: 0.3,
                audioSensitivity: 0.2
            },
            command: {
                name: 'Command Mode',
                description: 'Optimize for command input/output, terminal prominence, quick access',
                panelPriorities: [
                    { id: 'terminal', weight: 4 },
                    { id: 'execution', weight: 2 },
                    { id: 'telemetry', weight: 2 },
                    { id: 'globe', weight: 1 },
                    { id: 'memory', weight: 1 },
                    { id: 'intelligence', weight: 1 }
                ],
                updateFrequencies: {
                    telemetry: 1000,
                    intelligence: 10000,
                    execution: 1000,
                    memory: 5000,
                    terminal: 100
                },
                visualIntensity: 0.7,
                audioSensitivity: 0.5
            }
        },
        animationFrame: null,
        transitionInProgress: false
    };

    // Initialize mode manager
    function init() {
        // Create mode selector UI
        createModeSelector();

        // Set initial mode
        setMode(modeElements.currentMode);

        // Start listening for mode change events
        setupModeChangeListeners();

        return modeElements;
    }

    // Create mode selector UI (usually in header)
    function createModeSelector() {
        const modeSelector = document.createElement('div');
        modeSelector.className = 'mode-selector';
        modeSelector.innerHTML = `
            <div class="mode-label">Mode:</div>
            <div class="mode-buttons">
                ${Object.keys(modeElements.modeConfigs).map(modeId => {
                    const config = modeElements.modeConfigs[modeId];
                    return `
                        <button class="mode-btn" data-mode="${modeId}" title="${config.description}">
                            ${modeId.charAt(0).toUpperCase() + modeId.slice(1)}
                        </button>
                    `;
                }).join('')}
            </div>
        `;
        document.body.appendChild(modeSelector);
        modeSelector.style.position = 'fixed';
        modeSelector.style.top = '1rem';
        modeSelector.style.left = '50%';
        modeSelector.style.transform = 'translateX(-50%)';
        modeSelector.style.zIndex = '1000';
        modeSelector.style.display = 'flex';
        modeSelector.style.gap = 'var(--spacing-xs)';
        modeSelector.style.alignItems = 'center';

        // Add event listeners to mode buttons
        modeSelector.querySelectorAll('.mode-btn').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                setMode(mode);
            });
        });

        modeElements.modeSelectors.container = modeSelector;
        modeElements.modeSelectors.buttons = {};
        Object.keys(modeElements.modeConfigs).forEach(modeId => {
            modeElements.modeSelectors.buttons[modeId] = modeSelector.querySelector(`.mode-btn[data-mode="${modeId}"]`);
        });
    }

    // Set the current mode
    function setMode(modeId) {
        if (!modeElements.modeConfigs[modeId]) {
            console.warn(`Unknown mode: ${modeId}`);
            return false;
        }

        // Prevent rapid mode changes
        if (modeElements.transitionInProgress) {
            return false;
        }

        const oldMode = modeElements.currentMode;
        modeElements.currentMode = modeId;
        modeElements.transitionInProgress = true;

        // Update mode selector UI
        Object.keys(modeElements.modeSelectors.buttons || {}).forEach(id => {
            const btn = modeElements.modeSelectors.buttons[id];
            if (btn) {
                btn.classList.toggle('active', id === modeId);
            }
        });

        // Apply mode configuration
        applyModeConfiguration(modeId, oldMode);

        // Trigger mode change event
        const modeChangeEvent = new CustomEvent('aegismodechange', {
            detail: {
                mode: modeId,
                previousMode: oldMode,
                config: modeElements.modeConfigs[modeId]
            }
        });
        document.dispatchEvent(modeChangeEvent);

        // End transition after delay
        setTimeout(() => {
            modeElements.transitionInProgress = false;
        }, 500);

        return true;
    }

    // Apply mode configuration
    function applyModeConfiguration(newMode, oldMode) {
        const config = modeElements.modeConfigs[newMode];
        const oldConfig = modeElements.modeConfigs[oldMode];

        // Update panel priorities and layouts
        updatePanelPriorities(config.panelPriorities);

        // Update update frequencies
        updateUpdateFrequencies(config.updateFrequencies);

        // Apply visual intensity
        applyVisualIntensity(config.visualIntensity);

        // Apply audio sensitivity
        applyAudioSensitivity(config.audioSensitivity);

        // Apply mode-specific styles
        applyModeStyles(newMode);
    }

    // Update panel priorities (would communicate with layout engine)
    function updatePanelPriorities(priorities) {
        // In a real implementation, this would send a message to the layout engine
        // to rearrange panels based on priority weights
        const event = new CustomEvent('aegispanelprioritiesupdate', {
            detail: { priorities }
        });
        document.dispatchEvent(event);
    }

    // Update update frequencies for data sources
    function updateUpdateFrequencies(frequencies) {
        // In a real implementation, this would update the WebSocket update intervals
        // or notify data sources to change their update rates
        const event = new CustomEvent('aegisupdatefrequenciesupdate', {
            detail: { frequencies }
        });
        document.dispatchEvent(event);
    }

    // Apply visual intensity to effects
    function applyVisualIntensity(intensity) {
        // Adjust globe effects, particle densities, etc.
        const event = new CustomEvent('aegisvisualintensityupdate', {
            detail: { intensity }
        });
        document.dispatchEvent(event);
    }

    // Apply audio sensitivity
    function applyAudioSensitivity(sensitivity) {
        // Adjust how strongly audio affects visuals
        const event = new CustomEvent('aegisaudiosensitivityupdate', {
            detail: { sensitivity }
        });
        document.dispatchEvent(event);
    }

    // Apply mode-specific CSS styles
    function applyModeStyles(modeId) {
        // Remove all mode-specific classes
        document.body.classList.remove(
            'mode-intelligence',
            'mode-engineering',
            'mode-focus',
            'mode-passive',
            'mode-command'
        );

        // Add the new mode class
        document.body.classList.add(`mode-${modeId}`);

        // Update mode indicator in header if it exists
        const modeIndicator = document.querySelector('.header-mode-indicator');
        if (modeIndicator) {
            modeIndicator.textContent = modeElements.modeConfigs[modeId].name;
        }
    }

    // Setup listeners for external mode changes
    function setupModeChangeListeners() {
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', handleModeShortcuts);

        // Listen for voice commands (would come from voice sync component)
        document.addEventListener('aegisvoicecommand', handleVoiceCommand);
    }

    // Handle keyboard shortcuts for mode switching
    function handleModeShortcuts(event) {
        // Prevent shortcuts when input fields are focused
        if (event.target.tagName === 'INPUT' ||
            event.target.tagName === 'TEXTAREA' ||
            event.target.isContentEditable) {
            return;
        }

        // Ctrl+Alt+1-5 for mode switching
        if (event.ctrlKey && event.altKey) {
            event.preventDefault();
            switch (event.key) {
                case '1':
                    setMode('intelligence');
                    break;
                case '2':
                    setMode('engineering');
                    break;
                case '3':
                    setMode('focus');
                    break;
                case '4':
                    setMode('passive');
                    break;
                case '5':
                    setMode('command');
                    break;
            }
        }
    }

    // Handle voice commands for mode switching
    function handleVoiceCommand(event) {
        const command = event.detail.command.toLowerCase().trim();
        const modeMap = {
            'intelligence': ['intelligence', 'news', 'info'],
            'engineering': ['engineering', 'dev', 'code'],
            'focus': ['focus', 'concentration', 'deep work'],
            'passive': ['passive', 'monitor', 'watch'],
            'command': ['command', 'terminal', 'shell', 'cmd']
        };

        for (const [modeId, triggers] of Object.entries(modeMap)) {
            if (triggers.some(trigger => command.includes(trigger))) {
                setMode(modeId);
                break;
            }
        }
    }

    // Get current mode
    function getCurrentMode() {
        return modeElements.currentMode;
    }

    // Get mode configuration
    function getModeConfig(modeId) {
        return modeElements.modeConfigs[modeId] || null;
    }

    // Public API
    return {
        init,
        setMode,
        getCurrentMode,
        getModeConfig,
        destroy: () => {
            if (modeElements.animationFrame) {
                cancelAnimationFrame(modeElements.animationFrame);
            }
            // Remove event listeners
            document.removeEventListener('keydown', handleModeShortcuts);
            document.removeEventListener('aegisvoicecommand', handleVoiceCommand);
            // Remove mode selector UI
            if (modeElements.modeSelectors.container &&
                modeElements.modeSelectors.container.parentNode) {
                modeElements.modeSelectors.container.parentNode.removeChild(
                    modeElements.modeSelectors.container
                );
            }
        }
    };
}

// Add CSS for mode manager
const modeStyle = document.createElement('style');
modeStyle.textContent = `
    .mode-selector {
        display: flex;
        align-items: center;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-xs) var(--spacing-sm);
        box-shadow: var(--shadow-sm);
    }

    .mode-label {
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        margin-right: var(--spacing-xs);
    }

    .mode-buttons {
        display: flex;
        gap: var(--spacing-xs);
    }

    .mode-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: var(--font-size-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        position: relative;
        overflow: hidden;
    }

    .mode-btn:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
        transform: translateY(-1px);
    }

    .mode-btn.active {
        background: var(--bg-primary);
        color: var(--accent-primary);
        font-weight: 600;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }

    .mode-btn.active::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(
            90deg,
            transparent,
            var(--accent-primary),
            var(--accent-secondary),
            var(--accent-primary),
            transparent
        );
        animation: holographicSweep 2s linear infinite;
    }

    /* Mode-specific styles */
    body.mode-intelligence {
        --accent-glow-intensity: 0.8;
        --panel-opacity: 0.9;
    }

    body.mode-engineering {
        --accent-glow-intensity: 0.6;
        --panel-opacity: 0.85;
    }

    body.mode-focus {
        --accent-glow-intensity: 0.5;
        --panel-opacity: 0.8;
        --background-darkness: 0.95;
    }

    body.mode-passive {
        --accent-glow-intensity: 0.3;
        --panel-opacity: 0.7;
        --background-darkness: 0.98;
        --globe-rotation-speed: 0.3;
    }

    body.mode-command {
        --accent-glow-intensity: 0.7;
        --panel-opacity: 0.85;
        --terminal-prominence: 1.2;
    }

    /* Transition styles */
    .transitioning {
        transition: all var(--transition-slow) ease;
    }
`;

document.head.appendChild(modeStyle);