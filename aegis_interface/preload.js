// Preload scripts for secure IPC communication between main and renderer processes
// Context isolation is enabled for security

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected IPC methods to the renderer
contextBridge.exposeInMainWorld('api', {
  // Send message to main process
  send: (channel, data) => {
    // Validate channel names for security
    const validChannels = [
      'ping',
      'show-window',
      'hide-window',
      'toggle-fullscreen',
      'get-system-info',
      'get-web-server-status'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive message from main process
  receive: (channel, func) => {
    const validChannels = [
      'pong',
      'web-server-started',
      'system-info-update',
      'telemetry-update',
      'waveform-data',
      'execution-stream-update',
      'memory-context-update',
      'intelligence-feeds-update',
      'globe-events'
    ];
    if (validChannels.includes(channel)) {
      // Remove listener when component unmounts
      const subscription = (...args) => func(...args);
      ipcRenderer.on(channel, subscription);

      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },

  // Invoke method (for request/response pattern)
  invoke: async (channel, data) => {
    const validChannels = [
      'get-system-info',
      'get-web-server-status'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Channel ${channel} not supported for invoke`);
  }
});

// Expose limited Node.js functionality for development
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('node', {
    // Only expose safe Node.js functions
    platform: require('process').platform,
    version: require('process').version,
    arch: require('process').arch,
    cwd: () => require('process').cwd(),
    homedir: () => require('os').homedir(),
    tmpdir: () => require('os').tmpdir(),
    uptime: () => require('process').uptime(),
    memoryUsage: () => require('process').memoryUsage()
  });
}