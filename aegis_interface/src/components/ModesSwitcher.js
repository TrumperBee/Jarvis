const MODES = [
  { id: 'tactical',   label: 'TACTICAL',  icon: '◇', theme: '#00ffff' },
  { id: 'analysis',   label: 'ANALYSIS',  icon: '◆', theme: '#10b981' },
  { id: 'oracle',     label: 'ORACLE',    icon: '◇', theme: '#a855f7' },
  { id: 'combat',     label: 'COMBAT',    icon: '◆', theme: '#ff3355' },
];

let currentMode = 'tactical';
let modeStyleEl = null;

function applyMode(modeId) {
  currentMode = modeId;
  const mode = MODES.find(m => m.id === modeId);
  if (!mode) return;

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('mode-btn--active', btn.dataset.mode === modeId);
  });

  document.body.className = `theme-mode-${modeId}`;

  document.dispatchEvent(new CustomEvent('aegismodechange', {
    detail: { mode: modeId, color: mode.theme, label: mode.label }
  }));

  document.dispatchEvent(new CustomEvent('aegisthemecolor', {
    detail: { color: mode.theme }
  }));

  if (modeStyleEl) modeStyleEl.remove();
  modeStyleEl = document.createElement('style');
  modeStyleEl.textContent = `
    body.theme-mode-${modeId} { --primary-accent: ${mode.theme}; --theme-glow: ${mode.theme}33; }
    body.theme-mode-${modeId} .panel::before, body.theme-mode-${modeId} .panel::after,
    body.theme-mode-${modeId} #core-container::before, body.theme-mode-${modeId} #core-container::after {
      filter: drop-shadow(0 0 8px ${mode.theme});
    }
    body.theme-mode-${modeId} .panel:hover {
      box-shadow: inset 0 0 24px ${mode.theme}22;
      border-color: ${mode.theme}44;
    }
    body.theme-mode-${modeId} .section-header { color: ${mode.theme}; }
    body.theme-mode-${modeId} .gateway__title { background: linear-gradient(90deg, ${mode.theme}, ${mode.theme}88, ${mode.theme}); background-size: 300% 100%; }
  `;
  document.head.appendChild(modeStyleEl);
}

export function setupModesSwitcher() {
  const container = document.getElementById('modes-switcher');
  if (!container) return;

  container.innerHTML = MODES.map(m => `
    <button class="mode-btn ${m.id === 'tactical' ? 'mode-btn--active' : ''}"
            data-mode="${m.id}" data-color="${m.theme}">
      <span class="mode-btn__icon">${m.icon}</span>
      <span class="mode-btn__label">${m.label}</span>
    </button>
  `).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.mode-btn');
    if (btn) applyMode(btn.dataset.mode);
  });

  applyMode('tactical');

  return {
    applyMode,
    getCurrentMode: () => currentMode
  };
}
