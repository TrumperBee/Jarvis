/**
 * Notification System Component
 * Handles global notifications for AEGIS OS
 */

export function setupNotificationSystem(container) {
    // Notification elements
    const notificationElements = {
        container: container,
        notifications: [],
        maxNotifications: 5,
        animationFrame: null,
        showDuration: 5000, // 5 seconds
        fadeDuration: 500,  // 0.5 seconds
        queue: []
    };

    // Initialize notification system
    function init() {
        // Set up event listeners for notifications
        setupNotificationListeners();

        return notificationElements;
    }

    // Set up notification listeners
    function setupNotificationListeners() {
        // Listen for custom notification events
        document.addEventListener('aegisnotification', showNotification);
    }

    // Show a notification
    function showNotification(event) {
        const { title, message, type, timeout } = event.detail;
        addNotification({
            id: Date.now() + Math.random(),
            title: title || 'Notification',
            message: message || '',
            type: type || 'info',
            timeout: timeout || notificationElements.showDuration,
            timestamp: new Date()
        });
    }

    // Add notification to queue
    function addNotification(notification) {
        notificationElements.queue.push(notification);
        processNotificationQueue();
    }

    // Process notification queue
    function processNotificationQueue() {
        // Don't show too many notifications at once
        if (notificationElements.notifications.length >= notificationElements.maxNotifications) {
            return; // Wait for some to expire
        }

        if (notificationElements.queue.length === 0) {
            return; // Nothing to show
        }

        // Show next notification
        const notification = notificationElements.queue.shift();
        showNotificationElement(notification);
    }

    // Show notification element
    function showNotificationElement(notification) {
        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${notification.type}`;
        notificationEl.dataset.id = notification.id;
        notificationEl.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${escapeHtml(notification.title)}</div>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-body">${escapeHtml(notification.message)}</div>
            <div class="notification-progress">
                <div class="notification-bar"></div>
            </div>
        `;

        // Add to container
        notificationElements.container.appendChild(notificationEl);
        notificationElements.notifications.push({
            element: notificationEl,
            notification: notification,
            startTime: Date.now()
        });

        // Set up close button
        const closeBtn = notificationEl.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            removeNotification(notificationEl);
        });

        // Animate in
        notificationEl.style.opacity = '0';
        notificationEl.style.transform = 'translateY(-20px)';
        requestAnimationFrame(() => {
            notificationEl.style.transition = 'all 0.3s ease';
            notificationEl.style.opacity = '1';
            notificationEl.style.transform = 'translateY(0)';
        });

        // Start progress bar
        startProgressBar(notificationEl, notification.timeout);

        // Set up auto-removal
        setTimeout(() => {
            removeNotification(notificationEl);
        }, notification.timeout + notificationElements.fadeDuration);
    }

    // Start progress bar animation
    function startProgressBar(notificationEl, duration) {
        const progressBar = notificationEl.querySelector('.notification-bar');
        if (!progressBar) return;

        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => {
            progressBar.style.width = '0%';
        });
    }

    // Remove notification
    function removeNotification(notificationEl) {
        // Find notification
        const index = notificationElements.notifications.findIndex(n => n.element === notificationEl);
        if (index === -1) return;

        const notificationInfo = notificationElements.notifications[index];

        // Animate out
        notificationEl.style.transition = 'all 0.3s ease';
        notificationEl.style.opacity = '0';
        notificationEl.style.transform = 'translateY(-20px)';

        // Remove from DOM after animation
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.parentNode.removeChild(notificationEl);
            }
            notificationElements.notifications.splice(index, 1);
            // Process next in queue
            processNotificationQueue();
        }, notificationElements.fadeDuration);
    }

    // Remove all notifications
    function removeAllNotifications() {
        notificationElements.notifications.slice().forEach(n => {
            removeNotification(n.element);
        });
        notificationElements.queue = [];
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    return {
        init,
        showNotification: (options) => {
            showNotification({ detail: options });
        },
        removeAllNotifications,
        destroy: () => {
            // Remove event listener
            document.removeEventListener('aegisnotification', showNotification);
            // Remove all notifications
            removeAllNotifications();
            // Cancel animation frame
            if (notificationElements.animationFrame) {
                cancelAnimationFrame(notificationElements.animationFrame);
            }
        }
    };
}

// Add CSS for notification system
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    #notification-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: var(--z-modal);
        max-width: 300px;
        pointer-events: auto;
    }

    .notification {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        margin-bottom: var(--spacing-sm);
        overflow: hidden;
        font-size: var(--font-size-xs);
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(10px);
    }

    .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
    }

    .notification-title {
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
    }

    .notification-close {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: var(--font-size-sm);
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-close:hover {
        color: var(--text-primary);
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
    }

    .notification-body {
        padding: var(--spacing-sm);
        line-height: 1.5;
        color: var(--text-muted);
    }

    .notification-progress {
        height: 3px;
        background-color: var(--border-color);
        overflow: hidden;
    }

    .notification-bar {
        height: 100%;
        background: var(--accent-primary);
        transition: width linear;
    }

    /* Notification types */
    .notification-info {
        border-left: 3px solid var(--accent-primary);
    }

    .notification-success {
        border-left: 3px solid var(--accent-success);
    }

    .notification-warning {
        border-left: 3px solid var(--accent-secondary);
    }

    .notification-error {
        border-left: 3px solid var(--accent-alert);
    }

    /* Animations */
    @keyframes notificationSlideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes notificationSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;

document.head.appendChild(notificationStyle);