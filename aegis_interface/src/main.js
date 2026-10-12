import { setupHeader } from './components/Header.js';
import { setupTelemetryPanel } from './components/TelemetryPanel.js';
import { setupGlobe } from './components/GlobeVisualization.js';
import { setupRightPanel } from './components/IntelligenceFeeds.js';
import { setupTerminalSystem } from './components/TerminalSystem.js';
import { setupCognitivePanel } from './components/CognitivePanel.js';
import { setupVoiceSync } from './components/VoiceSync.js';
import { setupViewportStage } from './components/ViewportStage.js';
import { setupBootSequence } from './components/BootSequence.js';
import { initializeWebSocketConnections } from './utils/websocketManager.js';
import { BootSync } from './components/bootSync.js';
import { ThreeBackground } from './components/threeBackground.js';
import { setupModesSwitcher } from './components/ModesSwitcher.js';
import { setupMemoryCore } from './components/MemoryCore.js';
import { setupTournamentCenter } from './components/TournamentCenter.js';
import { setupStatusStrip } from './components/StatusStrip.js';
import { AEGISState } from './utils/AEGISState.js';
import { setupPanelReactor } from './components/PanelReactor.js';

let terminalInstance = null;
let memoryCore = null;

function waitForPageLoad() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
    });
}

function waitForGatewayClick() {
    return new Promise(resolve => {
        const btn = document.getElementById('gateway-btn');
        if (!btn) { resolve(); return; }
        btn.addEventListener('click', () => {
            try {
                const ac = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ac.currentTime + 0.05);
                osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.2);
                gain.gain.setValueAtTime(0.08, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
                osc.start(ac.currentTime);
                osc.stop(ac.currentTime + 0.5);
            } catch(e) {}
            document.getElementById('gateway').classList.add('gateway--dissolve');
            setTimeout(() => {
                const gw = document.getElementById('gateway');
                if (gw) gw.style.display = 'none';
                resolve();
            }, 800);
        }, { once: true });
    });
}

const AGENT_LOG = {
    1: '\x1b[36m[AEGIS::CORE]\x1b[0m Sub-agent checked in — system baseline established',
    2: '\x1b[32m[FRIDAY::INTEL]\x1b[0m Sub-agent checked in — intelligence feeds live',
    3: '\x1b[35m[ORACLE::SENTINEL]\x1b[0m Sub-agent checked in — defenses operational',
};

async function boot() {
    await waitForPageLoad();

    const bg = new ThreeBackground();
    const sync = new BootSync();

    // Start in IDLE state
    AEGISState.enter(AEGISState.STATES.IDLE);

    const wakeBtn = document.getElementById('gateway-btn');
    const wakeHandler = (e) => {
        if (e.detail && e.detail.intent_type === 'WAKE') {
            document.removeEventListener('aegisagentresponse', wakeHandler);
            AEGISState.enter(AEGISState.STATES.NEURAL_SYNC, { type: 'WAKE', source: 'voice' });
            if (wakeBtn) wakeBtn.click();
        }
    };
    document.addEventListener('aegisagentresponse', wakeHandler);

    await waitForGatewayClick();
    AEGISState.enter(AEGISState.STATES.NEURAL_SYNC, { type: 'BOOT' });

    const bootContainer = document.createElement('div');
    bootContainer.id = 'boot-sequence-container';
    document.body.appendChild(bootContainer);

    const bootSeq = setupBootSequence(bootContainer, {
        onAgentCheckIn: (agentIndex, color) => {
            const themeClass = agentIndex === 1 ? 'theme-mode-tactical' :
                               agentIndex === 2 ? 'theme-mode-analysis' : 'theme-mode-oracle';
            document.body.className = themeClass;
            document.dispatchEvent(new CustomEvent('aegisthemecolor', { detail: { color } }));
            if (terminalInstance && terminalInstance.appendLog) {
                terminalInstance.appendLog(AGENT_LOG[agentIndex]);
            }
        },
        onComplete: () => {
            document.body.className = 'theme-mode-tactical';
            bg.init();
            bg.setVoiceLevel(0);

            // Initialize panel reactor (state-driven visual system)
            const reactor = setupPanelReactor();

            sync.play().then(() => {
                document.addEventListener('aegisvoicelevel', e => {
                    bg.setVoiceLevel(e.detail?.value || 0);
                });

                // Transition to ACTIVE once components are ready
                AEGISState.enter(AEGISState.STATES.ACTIVE, { type: 'BOOT_COMPLETE' });

                initializeWebSocketConnections();

                const components = [
                    { name: 'Header', fn: () => setupHeader(document.getElementById('operational-header')) },
                    { name: 'TelemetryPanel', fn: setupTelemetryPanel },
                    { name: 'Globe', fn: () => setupGlobe(document.getElementById('globe-container')) },
                    { name: 'CognitivePanel', fn: setupCognitivePanel },
                    { name: 'IntelligenceFeeds', fn: setupRightPanel },
                    { name: 'TerminalSystem', fn: () => { terminalInstance = setupTerminalSystem(); return terminalInstance; } },
                    { name: 'VoiceSync', fn: setupVoiceSync },
                    { name: 'ViewportStage', fn: setupViewportStage },
                    { name: 'ModesSwitcher', fn: setupModesSwitcher },
                    { name: 'MemoryCore', fn: () => { memoryCore = setupMemoryCore(); return memoryCore; } },
                    { name: 'TournamentCenter', fn: setupTournamentCenter },
                    { name: 'StatusStrip', fn: setupStatusStrip },
                ];

                const instances = {};
                components.forEach(({ name, fn }) => {
                    try {
                        const inst = fn();
                        instances[name] = inst;
                        if (inst && inst.init) { inst.init(); console.log(`  ✓ ${name}`); }
                        else if (inst && typeof inst === 'function') { inst(); console.log(`  ✓ ${name}`); }
                        else console.warn(`  ⚠ ${name} — no init()`);
                    } catch (err) {
                        console.error(`  ✗ ${name} failed:`, err);
                    }
                });
                window.aegisOS = instances;
                window.aegisOS.isBootComplete = true;

                if (terminalInstance && terminalInstance.appendLog) {
                    terminalInstance.appendLog('\x1b[36m[SYSTEM]\x1b[0m AEGIS OS fully deployed — all agents nominal');
                }
            });
        }
    });
    bootSeq.start();
}

boot().catch(err => {
    console.error('AEGIS OS boot failed:', err);
    const g = document.getElementById('gateway');
    if (g) g.style.display = 'none';
    const m = document.getElementById('main-content');
    if (m) m.classList.remove('hidden');
});

window.addEventListener('resize', () => {
    const g = window.aegisOS?.Globe;
    if (g && g.onResize) g.onResize();
});
