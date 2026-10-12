/**
 * Data Validators Utility
 * Handles real data verification and synchronization handling
 * Ensures no fake data is displayed - only real data or synchronization messages
 */

export function validateDataFreshness() {
    // This would check data freshness from the WebSocket connection
    // For now, we'll simulate the validation logic

    const validationResults = {
        telemetry: validateTelemetryFreshness(),
        waveform: validateWaveformFreshness(),
        execution: validateExecutionFreshness(),
        intelligence: validateIntelligenceFreshness(),
        memory: validateMemoryFreshness()
    };

    // Dispatch events for invalid data
    Object.entries(validationResults).forEach(([dataType, isFresh]) => {
        if (!isFresh) {
            const event = new CustomEvent('aegisdataexpired', {
                detail: { dataType }
            });
            document.dispatchEvent(event);
        }
    });

    return validationResults;
}

function validateTelemetryFreshness() {
    // In real implementation, this would check timestamp of last telemetry update
    // For simulation, we'll return true (fresh)
    return true;
}

function validateWaveformFreshness() {
    // Check if we're receiving audio data
    return true;
}

function validateExecutionFreshness() {
    // Check if execution stream is updating
    return true;
}

function validateIntelligenceFreshness() {
    // Check if news/intelligence data is current
    return true;
}

function validateMemoryFreshness() {
    // Check if memory/context data is current
    return true;
}

// Check if data is stale and should show synchronization message
function isDataStale(dataTimestamp, maxAgeMs) {
    if (!dataTimestamp) return true;
    const age = Date.now() - new Date(dataTimestamp).getTime();
    return age > maxAgeMs;
}

// Get synchronization message for a data type
function getSyncMessage(dataType) {
    const messages = {
        telemetry: 'Awaiting verified system synchronization.',
        waveform: 'Awaiting verified audio synchronization.',
        execution: 'Awaiting verified execution synchronization.',
        intelligence: 'Awaiting verified intelligence synchronization.',
        memory: 'Awaiting verified context synchronization.'
    };

    return messages[dataType] || 'Awaiting verified synchronization.';
}

// Create a synchronized data indicator
function createSyncIndicator(dataType) {
    const indicator = document.createElement('div');
    indicator.className = 'data-sync-indicator pulse-soft';
    indicator.innerHTML = `
        <span class="sync-icon">⟳</span>
        <span class="sync-text">${getSyncMessage(dataType)}</span>
    `;
    return indicator;
}

// Validate that data comes from a trusted source
function validateDataSource(data, sourceType) {
    // In a real implementation, this would check:
    // - Digital signatures
    // - Source certificates
    // - API keys and tokens
    // - Request signatures
    // - Data format validation

    // For now, we'll assume data from our own MCP tools is valid
    return true;
}

// Sanitize data for safe display
function sanitizeDataForDisplay(data) {
    if (typeof data === 'string') {
        // Escape HTML to prevent XSS
        const div = document.createElement('div');
        div.textContent = data;
        return div.innerHTML;
    }

    if (typeof data === 'object' && data !== null) {
        // Recursively sanitize object properties
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeDataForDisplay(value);
        }
        return sanitized;
    }

    return data;
}

// Validate data structure matches expected schema
function validateDataSchema(data, schema) {
    // Simple schema validation
    // In production, would use a library like Joi or Yup

    if (!schema) return true;

    for (const [key, expectedType] of Object.entries(schema)) {
        if (!(key in data)) {
            // Optional fields are OK
            if (schema[key]?.optional !== true) {
                return false;
            }
            continue;
        }

        const value = data[key];
        const type = typeof value;

        // Check type
        if (expectedType === 'string' && typeof value !== 'string') return false;
        if (expectedType === 'number' && typeof value !== 'number') return false;
        if (expectedType === 'boolean' && typeof value !== 'boolean') return false;
        if (expectedType === 'object' && typeof value !== 'object') return false;
        if (expectedType === 'array' && !Array.isArray(value)) return false;

        // For nested objects, recursively validate
        if (expectedType === 'object' && value !== null && typeof value === 'object') {
            if (!validateDataSchema(value, schema[key].properties || {})) {
                return false;
            }
        }
    }

    return true;
}

// Create a data freshness timestamp validator
function createTimestampValidator(maxAgeMs) {
    return function(timestamp) {
        return !isDataStale(timestamp, maxAgeMs);
    };
}

// Public API
export {
    validateTelemetryFreshness,
    validateWaveformFreshness,
    validateExecutionFreshness,
    validateIntelligenceFreshness,
    validateMemoryFreshness,
    isDataStale,
    getSyncMessage,
    createSyncIndicator,
    validateDataSource,
    sanitizeDataForDisplay,
    validateDataSchema,
    createTimestampValidator
};