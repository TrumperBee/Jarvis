/**
 * WebSocket Manager Utility
 * Handles real-time data connections to the AEGIS OS local server
 */

export function initializeWebSocketConnections() {
    // WebSocket connections
    const wsConnections = {
        telemetry: null,
        waveform: null,
        execution: null,
        intelligence: null,
        memory: null,
        globeEvents: null,
        terminal: null,
        courier: null,
        agentSync: null
    };

    const connectionStatus = {
        telemetry: false,
        waveform: false,
        execution: false,
        intelligence: false,
        memory: false,
        globeEvents: false,
        terminal: false,
        courier: false,
        agentSync: false
    };

    // Reconnection settings
    const reconnectSettings = {
        maxAttempts: 10,
        baseDelay: 1000, // 1 second
        maxDelay: 30000  // 30 seconds
    };

    // Connect to agent-sync WebSocket
    function connectAgentSync() {
        const ws = new WebSocket(`ws://localhost:8080/ws/agent-sync`);
        wsConnections.agentSync = ws;

        ws.onopen = () => {
            connectionStatus.agentSync = true;
            console.log('Agent-sync WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.intent_type) {
                    const evt = new CustomEvent('aegisagentresponse', { detail: data });
                    document.dispatchEvent(evt);
                }
            } catch (err) {
                console.error('Error parsing agent-sync message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.agentSync = false;
            console.log('Agent-sync WebSocket disconnected');
            scheduleReconnect('agentSync', connectAgentSync);
        };

        ws.onerror = (error) => {
            console.error('Agent-sync WebSocket error:', error);
        };
    }

    // Initialize all WebSocket connections
    function init() {
        connectTelemetry();
        connectWaveform();
        connectExecution();
        connectIntelligence();
        connectMemory();
        connectGlobeEvents();
        connectTerminal();
        connectCourier();
        connectAgentSync();

        // Set up offline detection
        setupOfflineDetection();

        return wsConnections;
    }

    // Connect to telemetry WebSocket
    function connectTelemetry() {
        const ws = new WebSocket(`ws://localhost:8080/ws/telemetry`);
        wsConnections.telemetry = ws;

        ws.onopen = () => {
            connectionStatus.telemetry = true;
            console.log('Telemetry WebSocket connected');
            // Send initial data request if needed
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'telemetry_update') {
                    // Dispatch event for telemetry update
                    const telemetryEvent = new CustomEvent('aegistelemetryupdate', {
                        detail: { data: data.data }
                    });
                    document.dispatchEvent(telemetryEvent);
                }
            } catch (err) {
                console.error('Error parsing telemetry WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.telemetry = false;
            console.log('Telemetry WebSocket disconnected');
            // Attempt reconnection
            scheduleReconnect('telemetry', connectTelemetry);
        };

        ws.onerror = (error) => {
            console.error('Telemetry WebSocket error:', error);
        };
    }

    // Connect to waveform WebSocket
    function connectWaveform() {
        const ws = new WebSocket(`ws://localhost:8080/ws/waveform`);
        wsConnections.waveform = ws;

        ws.onopen = () => {
            connectionStatus.waveform = true;
            console.log('Waveform WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'waveform_update') {
                    // Dispatch event for waveform update
                    const waveformEvent = new CustomEvent('aegiswaveformupdate', {
                        detail: { data: data.data }
                    });
                    document.dispatchEvent(waveformEvent);
                }
            } catch (err) {
                console.error('Error parsing waveform WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.waveform = false;
            console.log('Waveform WebSocket disconnected');
            scheduleReconnect('waveform', connectWaveform);
        };

        ws.onerror = (error) => {
            console.error('Waveform WebSocket error:', error);
        };
    }

    // Connect to execution WebSocket
    function connectExecution() {
        const ws = new WebSocket(`ws://localhost:8080/ws/execution`);
        wsConnections.execution = ws;

        ws.onopen = () => {
            connectionStatus.execution = true;
            console.log('Execution WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'execution_update') {
                    // Dispatch event for execution update
                    const executionEvent = new CustomEvent('aegisexecutionupdate', {
                        detail: { data: data.data }
                    });
                    document.dispatchEvent(executionEvent);
                }
            } catch (err) {
                console.error('Error parsing execution WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.execution = false;
            console.log('Execution WebSocket disconnected');
            scheduleReconnect('execution', connectExecution);
        };

        ws.onerror = (error) => {
            console.error('Execution WebSocket error:', error);
        };
    }

    // Connect to intelligence WebSocket
    function connectIntelligence() {
        const ws = new WebSocket(`ws://localhost:8080/ws/intelligence`);
        wsConnections.intelligence = ws;

        ws.onopen = () => {
            connectionStatus.intelligence = true;
            console.log('Intelligence WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'news_update' || data.type === 'intelligence_update') {
                    // Dispatch event for intelligence update
                    const intelligenceEvent = new CustomEvent('aegisintelligenceupdate', {
                        detail: { data: data.data }
                    });
                    document.dispatchEvent(intelligenceEvent);
                }
            } catch (err) {
                console.error('Error parsing intelligence WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.intelligence = false;
            console.log('Intelligence WebSocket disconnected');
            scheduleReconnect('intelligence', connectIntelligence);
        };

        ws.onerror = (error) => {
            console.error('Intelligence WebSocket error:', error);
        };
    }

    // Connect to memory WebSocket
    function connectMemory() {
        const ws = new WebSocket(`ws://localhost:8080/ws/memory`);
        wsConnections.memory = ws;

        ws.onopen = () => {
            connectionStatus.memory = true;
            console.log('Memory WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'memory_update') {
                    // Dispatch event for memory update
                    const memoryEvent = new CustomEvent('aegismemoryupdate', {
                        detail: { data: data.data }
                    });
                    document.dispatchEvent(memoryEvent);
                }
            } catch (err) {
                console.error('Error parsing memory WebSocket message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.memory = false;
            console.log('Memory WebSocket disconnected');
            scheduleReconnect('memory', connectMemory);
        };

        ws.onerror = (error) => {
            console.error('Memory WebSocket error:', error);
        };
    }

    // Connect to globe events WebSocket
    function connectGlobeEvents() {
        const ws = new WebSocket(`ws://localhost:8080/ws/globe-events`);
        wsConnections.globeEvents = ws;

        ws.onopen = () => {
            connectionStatus.globeEvents = true;
            console.log('Globe events WebSocket connected');
        };

        ws.onmessage = (event) => {
            // Globe events WebSocket is mainly for keeping connection alive
            // Actual data comes from other streams that the globe listens to
        };

        ws.onclose = () => {
            connectionStatus.globeEvents = false;
            console.log('Globe events WebSocket disconnected');
            scheduleReconnect('globeEvents', connectGlobeEvents);
        };

        ws.onerror = (error) => {
            console.error('Globe events WebSocket error:', error);
        };
    }

    // Connect to terminal WebSocket
    function connectTerminal() {
        const ws = new WebSocket(`ws://localhost:8080/ws/terminal`);
        wsConnections.terminal = ws;

        ws.onopen = () => {
            connectionStatus.terminal = true;
            console.log('Terminal WebSocket connected');
        };

        ws.onmessage = (event) => {
        };

        ws.onclose = () => {
            connectionStatus.terminal = false;
            console.log('Terminal WebSocket disconnected');
            scheduleReconnect('terminal', connectTerminal);
        };

        ws.onerror = (error) => {
            console.error('Terminal WebSocket error:', error);
        };
    }

    // Connect to execution courier WebSocket
    function connectCourier() {
        const ws = new WebSocket(`ws://localhost:8080/ws/courier`);
        wsConnections.courier = ws;

        ws.onopen = () => {
            connectionStatus.courier = true;
            console.log('Execution courier WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'tool_execution') {
                    const evt = new CustomEvent('aegiscourierevent', { detail: data });
                    document.dispatchEvent(evt);
                    const flash = document.querySelector('.hud-alert-flash');
                    if (!flash) {
                        document.querySelectorAll('.holographic-panel').forEach(p => {
                            p.classList.add('hud-alert-flash');
                            setTimeout(() => p.classList.remove('hud-alert-flash'), 3000);
                        });
                    }
                }
            } catch (err) {
                console.error('Error parsing courier message:', err);
            }
        };

        ws.onclose = () => {
            connectionStatus.courier = false;
            console.log('Courier WebSocket disconnected');
            scheduleReconnect('courier', connectCourier);
        };

        ws.onerror = (err) => {
            console.error('Courier WebSocket error:', err);
        };
    }

    // Schedule reconnection with exponential backoff
    function scheduleReconnect(connectionType, connectFunction) {
        // In a real implementation, we would track reconnect attempts
        // For simplicity, we'll just try to reconnect after a delay
        setTimeout(() => {
            if (!wsConnections[connectionType] || wsConnections[connectionType].readyState === WebSocket.CLOSED) {
                connectFunction();
            }
        }, reconnectSettings.baseDelay);
    }

    // Set up offline detection
    function setupOfflineDetection() {
        // Listen for online/offline events
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
    }

    function handleOffline() {
        // Mark all connections as offline
        Object.keys(connectionStatus).forEach(key => {
            connectionStatus[key] = false;
        });
        console.log('Browser is offline');
    }

    function handleOnline() {
        // Attempt to reconnect all services
        Object.keys(wsConnections).forEach(key => {
            const ws = wsConnections[key];
            if (!ws || ws.readyState === WebSocket.CLOSED) {
                // Reconnect based on type
                switch (key) {
                    case 'telemetry': connectTelemetry(); break;
                    case 'waveform': connectWaveform(); break;
                    case 'execution': connectExecution(); break;
                    case 'intelligence': connectIntelligence(); break;
                    case 'memory': connectMemory(); break;
                    case 'globeEvents': connectGlobeEvents(); break;
                    case 'terminal': connectTerminal(); break;
                    case 'courier': connectCourier(); break;
                    case 'agentSync': connectAgentSync(); break;
                }
            }
        });
        console.log('Browser is online');
    }

    // Get connection status
    function getConnectionStatus() {
        return { ...connectionStatus };
    }

    // Check if a specific connection is active
    function isConnected(connectionType) {
        return connectionStatus[connectionType] || false;
    }

    // Send data through a WebSocket connection
    function sendData(connectionType, data) {
        const ws = wsConnections[connectionType];
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    // Public API
    return {
        init,
        getConnectionStatus,
        isConnected,
        sendData,
        destroy: () => {
            // Close all WebSocket connections
            Object.values(wsConnections).forEach(ws => {
                if (ws && ws.close) {
                    ws.close();
                }
            });

            // Remove event listeners
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        }
    };
}