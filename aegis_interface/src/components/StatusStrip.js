export function setupStatusStrip() {
  const strip = document.getElementById('status-strip');
  if (!strip) return;

  let start = performance.now();

  function tick() {
    const elapsed = (performance.now() - start) / 1000;
    const uptimeH = Math.floor(elapsed / 3600);
    const uptimeM = Math.floor((elapsed % 3600) / 60);
    const uptimeS = Math.floor(elapsed % 60);

    const latencies = [12, 23, 8, 34, 15, 7];
    const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length + Math.sin(elapsed * 0.01) * 2);

    const fpsTarget = 60;
    const fps = Math.round(fpsTarget - Math.random() * 2);

    const memPct = 42 + Math.sin(elapsed * 0.005) * 8;

    strip.innerHTML = `
      <span class="status-item">
        <span class="status-dot online"></span>
        AEGIS CORE · ONLINE
      </span>
      <span class="status-item">
        <span class="status-dot online"></span>
        WS: ${avgLatency}ms
      </span>
      <span class="status-item">
        <span class="status-dot online"></span>
        ${fps} FPS
      </span>
      <span class="status-item">
        <span class="status-dot online"></span>
        MEM: ${memPct.toFixed(0)}%
      </span>
      <span class="status-item">
        UPTIME: ${String(uptimeH).padStart(2, '0')}:${String(uptimeM).padStart(2, '0')}:${String(uptimeS).padStart(2, '0')}
      </span>
      <span class="status-item status-item--right">
        AEGIS OS v2.0 · Neural Command Nexus
      </span>
    `;
  }

  tick();
  setInterval(tick, 1000);
}
