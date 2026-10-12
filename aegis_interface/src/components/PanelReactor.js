import AEGISState from '../utils/AEGISState.js';

/**
 * PanelReactor — drives visual responses across all panels based on system state
 * 
 * IDLE:        all panels soft, low glow
 * ACTIVE:      brightness up, panels slightly expand, waveform active
 * NEURAL_SYNC: full-screen hex flash, all panels pulse
 * EXECUTION:   right panel highlights, terminal glows, core ripple wave
 */

let _terminalGlowInterval = null;
let _originalPanelBorders = new WeakMap();

function getPanels() {
  return document.querySelectorAll('.panel');
}

function setPanelGlow(intensity) {
  getPanels().forEach(p => {
    const alpha = 0.15 + intensity * 0.25;
    p.style.borderColor = `rgba(0,255,255,${alpha})`;
    const shadow = intensity > 0.5
      ? `inset 0 0 ${12 + intensity * 20}px rgba(0,255,255,${intensity * 0.08})`
      : 'var(--glass-shadow)';
    p.style.boxShadow = shadow;
  });
}

function resetPanelGlow() {
  getPanels().forEach(p => {
    p.style.borderColor = '';
    p.style.boxShadow = '';
  });
}

function highlightPanel(selector, duration = 2000) {
  const panel = document.querySelector(selector);
  if (!panel) return;
  panel.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
  panel.style.borderColor = 'rgba(0,255,255,0.5)';
  panel.style.boxShadow = 'inset 0 0 30px rgba(0,255,255,0.12), 0 0 20px rgba(0,255,255,0.06)';
  setTimeout(() => {
    panel.style.borderColor = '';
    panel.style.boxShadow = '';
  }, duration);
}

function rippleCore() {
  const core = document.getElementById('core-container');
  if (!core) return;
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position:absolute;inset:0;pointer-events:none;z-index:5;
    border:2px solid rgba(0,255,255,0.4);
    border-radius:8px;
    animation:coreRipple 0.8s ease-out forwards;
  `;
  core.appendChild(ripple);
  setTimeout(() => ripple.remove(), 900);
}

function terminalPulse(duration = 1500) {
  const term = document.getElementById('terminal-system');
  if (!term) return;
  term.style.transition = 'border-color 0.15s ease, box-shadow 0.15s ease';
  term.style.borderColor = 'rgba(0,255,255,0.5)';
  term.style.boxShadow = 'inset 0 0 30px rgba(0,255,255,0.1)';
  setTimeout(() => {
    term.style.borderColor = '';
    term.style.boxShadow = '';
  }, duration);
}

function dimPanel(selector, duration = 2000) {
  const panel = document.querySelector(selector);
  if (!panel) return;
  panel.style.transition = 'opacity 0.4s ease';
  panel.style.opacity = '0.55';
  setTimeout(() => {
    panel.style.opacity = '';
  }, duration);
}

export function setupPanelReactor() {
  const unsub = AEGISState.onChange((state, prevState, data) => {
    switch (state) {
      case AEGISState.STATES.IDLE:
        resetPanelGlow();
        document.body.style.setProperty('--ui-intensity', '0.3');
        break;

      case AEGISState.STATES.ACTIVE:
        setPanelGlow(0.6);
        document.body.style.setProperty('--ui-intensity', '0.8');
        break;

      case AEGISState.STATES.NEURAL_SYNC:
        setPanelGlow(1.0);
        rippleCore();
        document.body.style.setProperty('--ui-intensity', '1.0');
        setTimeout(() => {
          if (AEGISState.getState() === AEGISState.STATES.NEURAL_SYNC) {
            AEGISState.enter(AEGISState.STATES.ACTIVE);
          }
        }, 3000);
        break;

      case AEGISState.STATES.EXECUTION:
        highlightPanel('#right-panel', 2500);
        terminalPulse(1500);
        rippleCore();
        dimPanel('#left-panel', 2000);
        document.body.style.setProperty('--ui-intensity', '0.9');
        setTimeout(() => {
          if (AEGISState.getState() === AEGISState.STATES.EXECUTION) {
            AEGISState.enter(AEGISState.STATES.ACTIVE);
          }
        }, 3000);
        break;
    }
  });

  // Magnetic hover effect
  const magPanels = document.querySelectorAll('.panel');
  magPanels.forEach(p => {
    p.addEventListener('mousemove', e => {
      const rect = p.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const strength = 2;
      p.style.setProperty('--mag-x', `${x * strength}px`);
      p.style.setProperty('--mag-y', `${y * strength}px`);
      p.style.transform = `translate(${x * strength}px, ${y * strength}px) scale(1.008)`;
    });
    p.addEventListener('mouseleave', () => {
      p.style.transform = '';
      p.style.setProperty('--mag-x', '0px');
      p.style.setProperty('--mag-y', '0px');
    });
  });

  // Wire voice events to state
  document.addEventListener('aegisvoicelevel', e => {
    const level = e.detail?.value || 0;
    if (level > 0.1 && AEGISState.isIdle()) {
      AEGISState.enter(AEGISState.STATES.ACTIVE);
    }
  });

  // Wire agent responses to EXECUTION state
  document.addEventListener('aegisagentresponse', e => {
    const data = e.detail;
    if (data && (data.intent_type === 'SEARCH' || data.intent_type === 'TEXT_STREAM')) {
      AEGISState.enter(AEGISState.STATES.EXECUTION, { type: data.intent_type });
    }
    if (data && data.intent_type === 'WAKE') {
      AEGISState.enter(AEGISState.STATES.NEURAL_SYNC, { type: 'WAKE' });
    }
  });

  // Wire mode changes
  document.addEventListener('aegismodechange', () => {
    if (AEGISState.isIdle()) {
      AEGISState.enter(AEGISState.STATES.ACTIVE);
    }
  });

  return {
    highlightPanel,
    rippleCore,
    terminalPulse,
    dimPanel,
    destroy: unsub,
  };
}
