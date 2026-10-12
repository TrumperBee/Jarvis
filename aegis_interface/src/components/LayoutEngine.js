/**
 * Layout Engine Component
 * Manages floating panels with depth layers, holographic atmosphere, and reactive layouts
 */

export function setupLayoutEngine(container) {
    // Layout engine elements
    const layoutElements = {
        container: container,
        panels: {},
        layers: {
            background: null,
            content: null,
            floating: null,
            overlay: null
        },
        depthLayers: [], // Array of panels with their depth values
        animationFrame: null,
        resizeObserver: null,
        isDragging: false,
        draggedPanel: null,
        dragOffset: { x: 0, y: 0 }
    };

    // Initialize layout engine
    function init() {
        // Create layout layers
        createLayoutLayers();

        // Set up resize observer
        setupResizeObserver();

        // Set up drag and drop for panels
        setupPanelDragDrop();

        // Apply initial layout
        applyInitialLayout();

        return layoutElements;
    }

    // Create layout layers for depth
    function createLayoutLayers() {
        // Background layer (for animated backgrounds)
        layoutElements.layers.background = document.createElement('div');
        layoutElements.layers.background.className = 'layout-layer background';
        layoutElements.layers.background.style.position = 'absolute';
        layoutElements.layers.background.style.top = '0';
        layoutElements.layers.background.style.left = '0';
        layoutElements.layers.background.style.width = '100%';
        layoutElements.layers.background.style.height = '100%';
        layoutElements.layers.background.style.zIndex = -1;
        layoutElements.layers.background.style.pointerEvents = 'none';
        container.appendChild(layoutElements.layers.background);

        // Content layer (for main panels that stay in place)
        layoutElements.layers.content = document.createElement('div');
        layoutElements.layers.content.className = 'layout-layer content';
        layoutElements.layers.content.style.position = 'relative';
        layoutElements.layers.content.style.zIndex = 'var(--z-content)';
        layoutElements.layers.content.style.pointerEvents = 'auto';
        container.appendChild(layoutElements.layers.content);

        // Floating layer (for panels that can be moved)
        layoutElements.layers.floating = document.createElement('div');
        layoutElements.layers.floating.className = 'layout-layer floating';
        layoutElements.layers.floating.style.position = 'absolute';
        layoutElements.layers.floating.style.top = '0';
        layoutElements.layers.floating.style.left = '0';
        layoutElements.layers.floating.style.width = '100%';
        layoutElements.layers.floating.style.height = '100%';
        layoutElements.layers.floating.style.zIndex = 'var(--z-floating)';
        layoutElements.layers.floating.style.pointerEvents = 'auto';
        container.appendChild(layoutElements.layers.floating);

        // Overlay layer (for modals, notifications, etc.)
        layoutElements.layers.overlay = document.createElement('div');
        layoutElements.layers.overlay.className = 'layout-layer overlay';
        layoutElements.layers.overlay.style.position = 'absolute';
        layoutElements.layers.overlay.style.top = '0';
        layoutElements.layers.overlay.style.left = '0';
        layoutElements.layers.overlay.style.width = '100%';
        layoutElements.layers.overlay.style.height = '100%';
        layoutElements.layers.overlay.style.zIndex = 'var(--z-overlay)';
        layoutElements.layers.overlay.style.pointerEvents = 'auto';
        container.appendChild(layoutElements.layers.overlay);
    }

    // Set up resize observer
    function setupResizeObserver() {
        layoutElements.resizeObserver = new ResizeObserver(handleResize);
        layoutElements.resizeObserver.observe(container);
    }

    // Handle resize events
    function handleResize(entries) {
        for (let entry of entries) {
            if (entry.contentBoxSize) {
                // Firefox implements contentBoxSize
                const { inlineSize, blockSize } = entry.contentBoxSize[0];
                layoutElements.width = inlineSize;
                layoutElements.height = blockSize;
            } else {
                // Safari and Chrome
                layoutElements.width = entry.contentRect.width;
                layoutElements.height = entry.contentRect.height;
            }

            // Update layout based on new size
            updateLayout();
        }
    }

    // Set up panel drag and drop
    function setupPanelDragDrop() {
        // Make panels draggable
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Handle mouse down for dragging
    function handleMouseDown(event) {
        // Check if clicking on a panel header
        const panelHeader = event.target.closest('.panel-header');
        if (!panelHeader) return;

        const panel = panelHeader.closest('.holographic-panel');
        if (!panel) return;

        // Start dragging
        layoutElements.isDragging = true;
        layoutElements.draggedPanel = panel;

        // Calculate drag offset
        const rect = panel.getBoundingClientRect();
        layoutElements.dragOffset.x = event.clientX - rect.left;
        layoutElements.dragOffset.y = event.clientY - rect.top;

        // Add dragging class
        panel.classList.add('dragging');

        // Bring to front
        panel.style.zIndex = 'var(--z-overlay)';

        event.preventDefault();
    }

    // Handle mouse move for dragging
    function handleMouseMove(event) {
        if (!layoutElements.isDragging || !layoutElements.draggedPanel) return;

        // Move panel
        const x = event.clientX - layoutElements.dragOffset.x;
        const y = event.clientY - layoutElements.dragOffset.y;

        // Constrain to container bounds
        const constrainedX = Math.max(0, Math.min(x, layoutElements.width - layoutElements.draggedPanel.offsetWidth));
        const constrainedY = Math.max(0, Math.min(y, layoutElements.height - layoutElements.draggedPanel.offsetHeight));

        layoutElements.draggedPanel.style.left = `${constrainedX}px`;
        layoutElements.draggedPanel.style.top = `${constrainedY}px`;

        event.preventDefault();
    }

    // Handle mouse up for dropping
    function handleMouseUp(event) {
        if (!layoutElements.isDragging || !layoutElements.draggedPanel) return;

        // Stop dragging
        layoutElements.isDragging = false;
        const panel = layoutElements.draggedPanel;
        layoutElements.draggedPanel = null;

        // Remove dragging class
        panel.classList.remove('dragging');

        // Apply layout rules (snap to grid, etc.)
        applyLayoutRules(panel);

        // Return to normal z-index based on depth
        updatePanelZIndex(panel);

        event.preventDefault();
    }

    // Handle touch start
    function handleTouchStart(event) {
        if (event.touches.length !== 1) return;
        handleMouseDown(event.touches[0]);
    }

    // Handle touch move
    function handleTouchMove(event) {
        if (event.touches.length !== 1) return;
        handleMouseMove(event.touches[0]);
        event.preventDefault(); // Prevent scrolling
    }

    // Handle touch end
    function handleTouchEnd(event) {
        handleMouseUp(event.changedTouches[0]);
    }

    // Apply layout rules (snap to grid, align with other panels, etc.)
    function applyLayoutRules(panel) {
        // Snap to grid (e.g., 20px grid)
        const gridSize = 20;
        const left = parseInt(panel.style.left) || 0;
        const top = parseInt(panel.style.top) || 0;

        const snappedLeft = Math.round(left / gridSize) * gridSize;
        const snappedTop = Math.round(top / gridSize) * gridSize;

        panel.style.left = `${snappedLeft}px`;
        panel.style.top = `${snappedTop}px`;

        // Check for alignment with other panels
        alignWithNearbyPanels(panel, snappedLeft, snappedTop);
    }

    // Align panel with nearby panels
    function alignWithNearbyPanels(panel, x, y) {
        const threshold = 10; // pixels
        const panelRect = panel.getBoundingClientRect();

        // Check against all other panels
        Object.values(layoutElements.panels).forEach(otherPanel => {
            if (otherPanel === panel) return;

            const otherRect = otherPanel.getBoundingClientRect();

            // Check horizontal alignment (same top/bottom)
            if (Math.abs(panelRect.top - otherRect.top) < threshold) {
                // Align left edges
                panel.style.left = `${otherRect.left}px`;
            }
            if (Math.abs(panelRect.bottom - otherRect.bottom) < threshold) {
                // Align left edges
                panel.style.left = `${otherRect.left}px`;
            }

            // Check vertical alignment (same left/right)
            if (Math.abs(panelRect.left - otherRect.left) < threshold) {
                // Align top edges
                panel.style.top = `${otherRect.top}px`;
            }
            if (Math.abs(panelRect.right - otherRect.right) < threshold) {
                // Align top edges
                panel.style.top = `${otherRect.top}px`;
            }
        });
    }

    // Apply initial layout based on mode and panel priorities
    function applyInitialLayout() {
        // Get current mode and its panel priorities
        // In a real implementation, this would get from mode manager
        const mode = 'intelligence'; // Default
        const priorities = getModePanelPriorities(mode);

        // Arrange panels based on priorities
        arrangePanelsByPriority(priorities);
    }

    // Get panel priorities for a mode
    function getModePanelPriorities(modeId) {
        // This would normally come from mode manager
        // For now, return default priorities
        return [
            { id: 'globe', weight: 3, x: 0.25, y: 0.25 },
            { id: 'terminal', weight: 3, x: 0.5, y: 0.8 },
            { id: 'execution', weight: 2, x: 0.75, y: 0.3 },
            { id: 'memory', weight: 3, x: 0.5, y: 0.5 },
            { id: 'telemetry', weight: 2, x: 0.05, y: 0.25 },
            { id: 'intelligence', weight: 3, x: 0.75, y: 0.6 }
        ];
    }

    // Arrange panels by priority
    function arrangePanelsByPriority(priorities) {
        priorities.forEach(priority => {
            const panelId = priority.id;
            const panel = document.querySelector(`[data-panel-id="${panelId}"]`);
            if (panel) {
                // Set initial position based on priority coordinates
                const x = Math.max(0, Math.min(priority.x, 1)) * (layoutElements.width - panel.offsetWidth);
                const y = Math.max(0, Math.min(priority.y, 1)) * (layoutElements.height - panel.offsetHeight);

                panel.style.position = 'absolute';
                panel.style.left = `${x}px`;
                panel.style.top = `${y}px`;

                // Store panel reference
                layoutElements.panels[panelId] = panel;

                // Apply depth layer based on weight
                applyDepthLayer(panel, priority.weight);
            }
        });
    }

    // Apply depth layer to a panel
    function applyDepthLayer(panel, weight) {
        // Normalize weight to depth value (0-1)
        const maxWeight = 3; // Assuming max weight is 3
        const depth = Math.min(weight / maxWeight, 1);

        // Apply depth-based styling
        panel.style.setProperty('--panel-depth', depth);
        panel.style.setProperty('--panel-elevation', `${depth * 20}px`);

        // Apply depth-based box shadow for elevation
        const shadowIntensity = depth * 0.5;
        panel.style.boxShadow = `
            0 ${depth * 5}px ${depth * 15}px rgba(0, 0, 0, ${shadowIntensity}),
            0 ${depth * 2}px ${depth * 6}px rgba(0, 0, 0, ${shadowIntensity * 0.5})
        `;

        // Apply depth-based opacity for atmospheric effect
        const opacity = 0.8 + depth * 0.2; // 0.8 to 1.0
        panel.style.opacity = opacity;

        // Apply depth-based blur for atmospheric effect
        const blurAmount = (1 - depth) * 5; // More blur for background panels
        panel.style.filter = `blur(${blurAmount}px)`;

        // Store depth in layout elements
        layoutElements.depthLayers.push({
            panel: panel,
            depth: depth,
            weight: weight
        });

        // Sort depth layers by depth (back to front)
        layoutElements.depthLayers.sort((a, b) => a.depth - b.depth);

        // Apply z-index based on depth
        updatePanelZIndex(panel);
    }

    // Update panel z-index based on depth
    function updatePanelZIndex(panel) {
        // Find the panel's depth
        const depthInfo = layoutElements.depthLayers.find(d => d.panel === panel);
        if (!depthInfo) return;

        // Calculate z-index based on depth and position in sorted array
        const depthIndex = layoutElements.depthLayers.indexOf(depthInfo);
        const baseZIndex = 100; // Base z-index for content layer
        const zIndex = baseZIndex + depthIndex;

        panel.style.zIndex = zIndex.toString();
    }

    // Update layout (called on resize)
    function updateLayout() {
        // Update all panel positions based on layout rules
        Object.values(layoutElements.panels).forEach(panel => {
            applyLayoutRules(panel);
        });
    }

    // Add a panel to the layout engine
    function addPanel(panelId, panelElement) {
        if (!panelElement) return false;

        // Add to panels collection
        layoutElements.panels[panelId] = panelElement;

        // Add to appropriate layer
        if (panelElement.dataset.layer === 'floating') {
            layoutElements.layers.floating.appendChild(panelElement);
        } else {
            layoutElements.layers.content.appendChild(panelElement);
        }

        // Apply default depth layer (will be updated by mode manager)
        applyDepthLayer(panelElement, 2); // Default medium depth

        return true;
    }

    // Remove a panel from the layout engine
    function removePanel(panelId) {
        const panel = layoutElements.panels[panelId];
        if (!panel) return false;

        // Remove from panels collection
        delete layoutElements.panels[panelId];

        // Remove from depth layers
        layoutElements.depthLayers = layoutElements.depthLayers.filter(d => d.panel !== panel);

        // Remove from DOM
        if (panel.parentNode) {
            panel.parentNode.removeChild(panel);
        }

        return true;
    }

    // Get a panel by ID
    function getPanel(panelId) {
        return layoutElements.panels[panelId];
    }

    // Set panel layer (background, content, floating, overlay)
    function setPanelLayer(panelId, layer) {
        const panel = layoutElements.panels[panelId];
        if (!panel) return false;

        // Remove from current layer
        if (panel.parentNode) {
            panel.parentNode.removeChild(panel);
        }

        // Add to new layer
        let targetLayer;
        switch (layer) {
            case 'background':
                targetLayer = layoutElements.layers.background;
                break;
            case 'content':
                targetLayer = layoutElements.layers.content;
                break;
            case 'floating':
                targetLayer = layoutElements.layers.floating;
                break;
            case 'overlay':
                targetLayer = layoutElements.layers.overlay;
                break;
            default:
                targetLayer = layoutElements.layers.content;
        }

        targetLayer.appendChild(panel);
        panel.dataset.layer = layer;

        return true;
    }

    // Public API
    return {
        init,
        onWindowResize: updateLayout,
        addPanel,
        removePanel,
        getPanel,
        setPanelLayer,
        updateLayout,
        destroy: () => {
            if (layoutElements.resizeObserver) {
                layoutElements.resizeObserver.disconnect();
            }
            if (layoutElements.animationFrame) {
                cancelAnimationFrame(layoutElements.animationFrame);
            }
            // Remove event listeners
            document.removeEventListener('mousedown', handleMouseDown, true);
            document.removeEventListener('mousemove', handleMouseMove, true);
            document.removeEventListener('mouseup', handleMouseUp, true);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        }
    };
}

// Add CSS for layout engine
const layoutStyle = document.createElement('style');
layoutStyle.textContent = `
    .layout-layer {
        position: absolute;
        overflow: hidden;
    }

    .layout-layer.background {
        /* For animated backgrounds like neural grids, holographic effects */
    }

    .layout-layer.content {
        /* Main content area */
    }

    .layout-layer.floating {
        /* For draggable/floating panels */
    }

    .layout-layer.overlay {
        /* For modals, notifications, fullscreen overlays */
        pointer-events: none; /* Will be enabled when needed */
    }

    .holographic-panel {
        position: absolute;
        /* Other styles come from component CSS */
        will-change: transform, opacity;
        /* Enable GPU acceleration for better performance */
        transform: translateZ(0);
        backface-visibility: hidden;
    }

    .holographic-panel.dragging {
        /* Styles for when panel is being dragged */
        opacity: 0.9;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        transition: none;
    }

    /* Depth-based styling */
    .holographic-panel {
        /* Base styles */
        transition: all var(--transition-normal) ease;
    }

    /* These will be set dynamically by JavaScript */
    /* --panel-depth: 0.5;
       --panel-elevation: 10px;
    */

    /* Panel snap animation */
    .holographic-panel {
        transition: left 0.3s ease, top 0.3s ease;
    }

    /* Resize animation */
    @media (prefers-reduced-motion: no-preference) {
        .holographic-panel {
            transition: left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease;
        }
    }
`;

document.head.appendChild(layoutStyle);