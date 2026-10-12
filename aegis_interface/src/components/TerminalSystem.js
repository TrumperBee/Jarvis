import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

let thoughtStreamInterval = null;

export function setupTerminalSystem() {
    const el = { terminal: null, fitAddon: null, logInterval: null, idx: 0 };

    const sampleLogs = [
        '\x1b[35m[SEC]\x1b[0m  Firewall ACLs verified — 0 threats detected',
        '\x1b[36m[EXEC]\x1b[0m Process scheduler: 3 threads running',
        '\x1b[2m[SYS]\x1b[0m  Memory pool optimized: 1.2GB reclaimed',
        '\x1b[36m[NET]\x1b[0m  WebSocket heartbeat: 23ms latency',
        '\x1b[2m[AI]\x1b[0m   Inference engine idle — awaiting input',
        '\x1b[32m[PROC]\x1b[0m Background thread: synapse analysis running',
        '\x1b[31m[CRIT]\x1b[0m CPU temp: 64°C — within nominal range',
        '\x1b[35m[SEC]\x1b[0m  Encryption handshake verified',
        '\x1b[36m[GLOBE]\x1b[0m Particle ring synchronization active',
        '\x1b[2m[MEM]\x1b[0m  Memory pressure: LOW — 6.2GB available',
    ];

    const thoughtStreamLines = [
        '\x1b[36m[AEGIS]\x1b[0m analyzing request...',
        '\x1b[36m[AEGIS]\x1b[0m  → scanning tournament database',
        '\x1b[36m[AEGIS]\x1b[0m  → detecting performance patterns',
        '\x1b[36m[AEGIS]\x1b[0m  → correlating player statistics',
        '\x1b[36m[AEGIS]\x1b[0m  → generating optimized response',
        '\x1b[32m[READY]\x1b[0m Response compiled',
    ];
    let thoughtIdx = 0;
    let isThoughtStream = false;

    function scrollToBottom() {
        if (el.terminal && el.terminal.element) {
            const vp = el.terminal.element.querySelector('.xterm-viewport');
            if (vp) vp.scrollTop = vp.scrollHeight;
        }
    }

    function writelnWithScroll(text) {
        if (!el.terminal) return;
        el.terminal.writeln(text);
        scrollToBottom();
    }

    function init() {
        const container = document.getElementById('terminal-system');
        if (!container) return;
        container.innerHTML = '';

        const termContainer = document.createElement('div');
        termContainer.className = 'terminal-container-xterm';
        termContainer.style.cssText = 'flex:1;padding:6px;';
        container.appendChild(termContainer);

        el.terminal = new Terminal({
            cursorBlink: true,
            cursorStyle: 'bar',
            cursorInactiveStyle: 'none',
            fontSize: 18,
            fontFamily: "'JetBrains Mono', 'Share Tech Mono', monospace",
            lineHeight: 1.6,
            letterSpacing: 0.4,
            theme: {
                background: 'rgba(0,0,0,0.35)',
                foreground: '#c8d6e5',
                cursor: '#00ffff',
                cursorAccent: '#000000',
                selectionBackground: 'rgba(0,255,255,0.15)',
                black: '#000000',
                red: '#ff3355',
                green: '#00ff88',
                yellow: '#ffaa00',
                blue: '#4488ff',
                magenta: '#8a2be2',
                cyan: '#00ffff',
                white: '#c8d6e5',
                brightBlack: '#333333',
                brightRed: '#ff5577',
                brightGreen: '#33ff99',
                brightYellow: '#ffbb33',
                brightBlue: '#6699ff',
                brightMagenta: '#aa44ff',
                brightCyan: '#33ffff',
                brightWhite: '#e8f0ff',
            },
            allowTransparency: true,
            rows: 10,
            cols: 80,
        });

        el.fitAddon = new FitAddon();
        el.terminal.loadAddon(el.fitAddon);
        el.terminal.open(termContainer);

        setTimeout(() => {
            try { el.fitAddon.fit(); } catch(e) {}
        }, 100);

        const welcome = [
            '',
            '\x1b[36m╔══ AEGIS OS v2.0 — Neural Command Nexus ══╗\x1b[0m',
            '\x1b[36m║  Advanced Engineering & General Intelligence  ║\x1b[0m',
            '\x1b[36m╚══════════════════════════════════════════╝\x1b[0m',
            '',
            '\x1b[2m[System ready — all nodes operational]\x1b[0m',
            '',
        ];
        welcome.forEach(l => writelnWithScroll(l));

        el.idx = 0;
        el.logInterval = setInterval(() => {
            if (isThoughtStream) return;
            const msg = sampleLogs[el.idx % sampleLogs.length];
            writelnWithScroll(msg);
            el.idx++;
        }, 3000);

        window.addEventListener('resize', handleResize);

        document.addEventListener('aegisstatechange', e => {
            const { state } = e.detail;
            if (state === 'EXECUTION') {
                writelnWithScroll('\x1b[32m[EXEC]\x1b[0m State: EXECUTION — panel reactions active');
                setTimeout(() => {
                    const lines = [
                        '\x1b[36m[AEGIS]\x1b[0m  → scanning databases',
                        '\x1b[36m[AEGIS]\x1b[0m  → correlating intelligence feeds',
                        '\x1b[36m[AEGIS]\x1b[0m  → generating response vector',
                        '\x1b[32m[READY]\x1b[0m  Response compiled',
                    ];
                    lines.forEach((l, i) => {
                        setTimeout(() => writelnWithScroll(l), 400 * (i + 1));
                    });
                }, 300);
            }
            if (state === 'ACTIVE') {
                writelnWithScroll('\x1b[36m[SYSTEM]\x1b[0m State: ACTIVE — system at full readiness');
            }
            if (state === 'NEURAL_SYNC') {
                writelnWithScroll('\x1b[35m[SEC]\x1b[0m  Neural sync initiated — consciousness activation sequence');
            }
        });

        document.addEventListener('aegisagentresponse', e => {
            const data = e.detail;
            if (!data) return;
            if (data.intent_type === 'SEARCH' || data.intent_type === 'TEXT_STREAM') {
                writelnWithScroll(`\x1b[36m[AGENT]\x1b[0m ${data.intent_type} event received`);
            }
        });
    }

    function startThoughtStream() {
        isThoughtStream = true;
        thoughtIdx = 0;
        if (thoughtStreamInterval) clearInterval(thoughtStreamInterval);
        thoughtStreamInterval = setInterval(() => {
            if (thoughtIdx >= thoughtStreamLines.length) {
                clearInterval(thoughtStreamInterval);
                thoughtStreamInterval = null;
                isThoughtStream = false;
                return;
            }
            writelnWithScroll(thoughtStreamLines[thoughtIdx]);
            thoughtIdx++;
        }, 600);
    }

    function appendLog(text) {
        writelnWithScroll(text);
    }

    function handleResize() {
        if (el.fitAddon) {
            try { el.fitAddon.fit(); } catch(e) {}
        }
    }

    return {
        init,
        appendLog,
        startThoughtStream,
        destroy: () => {
            if (el.logInterval) clearInterval(el.logInterval);
            if (thoughtStreamInterval) clearInterval(thoughtStreamInterval);
            if (el.terminal) el.terminal.dispose();
            window.removeEventListener('resize', handleResize);
        }
    };
}
