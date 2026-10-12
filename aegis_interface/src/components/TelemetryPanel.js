export function setupTelemetryPanel() {
    const el = { animFrame: null, clock: 0, logLines: [] };

    function init() {
        const sysContainer = document.getElementById('telemetry-system');
        const autoContainer = document.getElementById('automation-logs');
        if (!sysContainer || !autoContainer) return;

        buildSystemCore(sysContainer);
        buildAutomationLogs(autoContainer);
        startAnimating();
    }

    function buildSystemCore(container) {
        container.innerHTML = `
            <div class="section-header">SYSTEM CORE</div>
            <div class="core-metrics">
                <div class="core-metric">
                    <div class="core-metric__label">CPU</div>
                    <div class="core-metric__bar-track">
                        <div class="core-metric__bar-fill cpu-fill" style="width:62%"></div>
                    </div>
                    <span class="core-metric__value cpu-val">62%</span>
                </div>
                <div class="core-metric">
                    <div class="core-metric__label">RAM</div>
                    <div class="core-metric__bar-track">
                        <div class="core-metric__bar-fill ram-fill" style="width:44%"></div>
                    </div>
                    <span class="core-metric__value ram-val">6.2 / 16 GB</span>
                </div>
                <div class="core-metric">
                    <div class="core-metric__label">GPU</div>
                    <div class="core-metric__bar-track">
                        <div class="core-metric__bar-fill gpu-fill" style="width:43%"></div>
                    </div>
                    <span class="core-metric__value gpu-val">43%</span>
                </div>
                <div class="core-metric">
                    <div class="core-metric__label">NET</div>
                    <div class="core-metric__bar-track">
                        <div class="core-metric__bar-fill net-fill" style="width:34%"></div>
                    </div>
                    <span class="core-metric__value net-val">2.4 Gbps</span>
                </div>
            </div>
            <div class="core-meta">
                <div class="metric-row">
                    <span class="label">THREADS</span>
                    <span class="value thread-count">134</span>
                </div>
                <div class="metric-row">
                    <span class="label">CORE TEMP</span>
                    <span class="value cyan temp-value">62°C</span>
                </div>
                <div class="metric-row">
                    <span class="label">UPTIME</span>
                    <span class="value uptime-val">00:00:00</span>
                </div>
            </div>
        `;
    }

    function buildAutomationLogs(container) {
        container.innerHTML = `
            <div class="section-header">SUBSYSTEM LOGS</div>
            <div class="automation-scroll" id="auto-scroll"></div>
        `;
        const scroll = document.getElementById('auto-scroll');
        const sampleLogs = [
            '[MEM]  Cache purge: 340MB reclaimed',
            '[PROC] Process scheduler: 3 threads running',
            '[NET]  WebSocket heartbeat: 23ms',
            '[AI]   Inference engine idle',
            '[GPU]  Memory compaction: 128MB freed',
            '[SYS]  CPU temp: 64°C nominal',
            '[SEC]  Firewall status: all clear',
            '[STR]  Storage flush: 512MB written',
            '[MEM]  Memory pool rebalancing...',
            '[NET]  DNS resolution: 12ms',
        ];
        let idx = 0;
        el.logInterval = setInterval(() => {
            if (!scroll) return;
            const line = document.createElement('div');
            line.className = 'auto-line';
            const ts = new Date().toLocaleTimeString();
            const typeClass = ['info','exec','sec','alert'][Math.floor(Math.random()*4)];
            line.innerHTML = `<span class="ts">[${ts}]</span> <span class="${typeClass}">${sampleLogs[idx % sampleLogs.length]}</span>`;
            scroll.appendChild(line);
            scroll.scrollTop = scroll.scrollHeight;
            idx++;
        }, 2000);
    }

    function startAnimating() {
        let start = performance.now();
        function frame(ts) {
            el.clock = (ts - start) / 1000;

            const uptimeEl = document.querySelector('.uptime-val');
            if (uptimeEl) {
                const h = String(Math.floor(el.clock / 3600)).padStart(2,'0');
                const m = String(Math.floor((el.clock % 3600) / 60)).padStart(2,'0');
                const s = String(Math.floor(el.clock % 60)).padStart(2,'0');
                uptimeEl.textContent = `${h}:${m}:${s}`;
            }

            const cpuVal = document.querySelector('.cpu-val');
            const cpuFill = document.querySelector('.cpu-fill');
            if (cpuVal && cpuFill) {
                const v = Math.round(55 + Math.sin(el.clock * 0.08) * 12 + Math.random() * 3);
                cpuVal.textContent = v + '%';
                cpuFill.style.width = v + '%';
            }

            const ramVal = document.querySelector('.ram-val');
            const ramFill = document.querySelector('.ram-fill');
            if (ramVal && ramFill) {
                const used = 5.2 + Math.sin(el.clock * 0.04) * 1.5;
                const pct = (used / 16) * 100;
                ramVal.textContent = used.toFixed(1) + ' / 16 GB';
                ramFill.style.width = pct + '%';
            }

            const gpuVal = document.querySelector('.gpu-val');
            const gpuFill = document.querySelector('.gpu-fill');
            if (gpuVal && gpuFill) {
                const v = Math.round(35 + Math.sin(el.clock * 0.07) * 12 + Math.random() * 3);
                gpuVal.textContent = v + '%';
                gpuFill.style.width = v + '%';
            }

            const netVal = document.querySelector('.net-val');
            const netFill = document.querySelector('.net-fill');
            if (netVal && netFill) {
                const gbps = (2.0 + Math.sin(el.clock * 0.06) * 0.8 + Math.random() * 0.2);
                const pct = (gbps / 5) * 100;
                netVal.textContent = gbps.toFixed(1) + ' Gbps';
                netFill.style.width = Math.min(100, pct) + '%';
            }

            const tempEl = document.querySelector('.temp-value');
            if (tempEl) {
                const t = 58 + Math.sin(el.clock * 0.1) * 4 + Math.random() * 0.5;
                tempEl.textContent = Math.round(t) + '°C';
            }

            const threadEl = document.querySelector('.thread-count');
            if (threadEl) threadEl.textContent = Math.round(120 + Math.sin(el.clock * 0.05) * 15 + Math.random() * 5);

            el.animFrame = requestAnimationFrame(frame);
        }
        el.animFrame = requestAnimationFrame(frame);
    }

    return {
        init,
        destroy: () => {
            if (el.animFrame) cancelAnimationFrame(el.animFrame);
            if (el.logInterval) clearInterval(el.logInterval);
        }
    };
}
