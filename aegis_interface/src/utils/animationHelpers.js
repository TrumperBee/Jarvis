/**
 * Animation Helpers Utility
 * Provides cinematic transitions and effects for AEGIS OS
 */

export function createCinematicFadeIn(duration = 500, delay = 0) {
    return `
        opacity: 0;
        transform: translateY(20px);
        transition: opacity ${duration}ms ease ${delay}ms,
                   transform ${duration}ms ease ${delay}ms;
    `;
}

export function createCinematicFadeOut(duration = 300) {
    return `
        transition: opacity ${duration}ms ease;
    `;
}

export function createHolographicSweepAnimation(duration = 3000, delay = 0) {
    return `
        background-position: 0% 0%;
        transition: background-position ${duration}ms linear ${delay}ms;
    `;
}

export function createPulseAnimation(duration = 2000, intensity = 0.3) {
    return `
        animation: pulse ${duration}ms ease-in-out infinite;
        animation-delay: ${Math.random() * 1000}ms;
    `;
}

export function createFloatAnimation(duration = 3000, height = 10) {
    return `
        animation: float ${duration}ms ease-in-out infinite;
    `;
}

export function createRotateAnimation(duration = 20000, speed = 1) {
    return `
        animation: rotate ${duration}ms linear infinite;
        animation-delay: ${Math.random() * duration}ms;
    `;
}

export function createShimmerAnimation(duration = 2000, width = 100) {
    return `
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
        );
        background-size: ${width}% 100%;
        animation: shimmer ${duration}ms linear infinite;
    `;
}

export function createScanLineAnimation(duration = 1500, count = 3) {
    return `
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 1px,
            rgba(0, 255, 255, 0.1) 1px,
            rgba(0, 255, 255, 0.1) 2px
        );
        background-size: 100% ${100 / count}%;
        animation: scan ${duration}ms linear infinite;
    `;
}

export function createNeuralPulseAnimation(duration = 1500) {
    return `
        animation: neuralPulse ${duration}ms ease-in-out infinite;
    `;
}

export function createDataFlowAnimation(duration = 3000) {
    return `
        animation: dataFlow ${duration}ms linear infinite;
    `;
}

export function createGlobePulseAnimation(duration = 2000) {
    return `
        animation: globePulse ${duration}ms ease-in-out infinite;
    `;
}

export function createTerminalCursorBlink(duration = 1000) {
    return `
        animation: cursorBlink ${duration}ms ease-in-out infinite;
    `;
}

// Keyframe animations
export const keyframes = `
    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes shimmer {
        0% { background-position: -100% 0; }
        100% { background-position: 100% 0; }
    }

    @keyframes scan {
        0% { background-position: 0 0; }
        100% { background-position: 0 100%; }
    }

    @keyframes neuralPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }

    @keyframes dataFlow {
        0% { background-position: 0 0; }
        100% { background-position: 100% 0; }
    }

    @keyframes globePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }

    @keyframes cursorBlink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
    }
`;

// Insert keyframes into document
export function insertKeyframes() {
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
}

// Create a delayed animation function
export function delayAnimation(callback, delay) {
    return setTimeout(callback, delay);
}

// Create an animation frame loop
export function animationFrameLoop(callback) {
    let running = true;
    let animationFrame = null;

    function loop() {
        if (!running) return;
        callback();
        animationFrame = requestAnimationFrame(loop);
    }

    animationFrame = requestAnimationFrame(loop);

    return {
        stop: () => {
            running = false;
            cancelAnimationFrame(animationFrame);
        }
    };
}

// Create a staggered animation function
export function staggerAnimation(elements, callback, staggerDelay = 100) {
    elements.forEach((element, index) => {
        setTimeout(() => {
            callback(element, index);
        }, index * staggerDelay);
    });
}

// Create a spring animation function
export function springAnimation(target, velocity = 0, stiffness = 0.15, damping = 0.8) {
    let position = 0;
    let prevTime = performance.now();

    function update() {
        const now = performance.now();
        const dt = (now - prevTime) / 1000; // Convert to seconds
        prevTime = now;

        // Spring physics
        const force = -stiffness * position;
        const acceleration = force - damping * velocity;
        velocity += acceleration * dt;
        position += velocity * dt;

        // Update target
        target(position, velocity);

        // Continue if not settled
        if (Math.abs(position) > 0.001 || Math.abs(velocity) > 0.001) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);

    return {
        stop: () => {
            // Animation will naturally stop
        }
    };
}

// Public API
export {
    createCinematicFadeIn,
    createCinematicFadeOut,
    createHolographicSweepAnimation,
    createPulseAnimation,
    createFloatAnimation,
    createRotateAnimation,
    createShimmerAnimation,
    createScanLineAnimation,
    createNeuralPulseAnimation,
    createDataFlowAnimation,
    createGlobePulseAnimation,
    createTerminalCursorBlink,
    keyframes,
    insertKeyframes,
    delayAnimation,
    animationFrameLoop,
    staggerAnimation,
    springAnimation
};

// Insert keyframes when module is loaded
if (typeof document !== 'undefined') {
    insertKeyframes();
}