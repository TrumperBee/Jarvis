const COMMAND_HISTORY = [
  { cmd: 'boot --agent aegis-core', ts: '14:32:01', result: 'AEGIS::CORE online' },
  { cmd: 'search "tournament brackets 2025"', ts: '14:28:44', result: '6 results found' },
  { cmd: 'analyze --match FRA_vs_ENG', ts: '14:22:10', result: 'France 2-1 England' },
  { cmd: 'deploy --env production', ts: '14:15:33', result: 'Deploy successful' },
  { cmd: 'status --all', ts: '14:12:07', result: 'All systems nominal' },
  { cmd: 'sync --cache --force', ts: '14:08:55', result: 'Cache synchronized' },
  { cmd: 'search "eFootball leaderboard"', ts: '14:05:22', result: 'Top 10 players' },
  { cmd: 'pipeline --run tournament-stats', ts: '13:58:17', result: 'Pipeline complete' },
  { cmd: 'globe --focus kenya', ts: '13:52:30', result: 'Focus set: Nairobi' },
  { cmd: 'terminal --clear', ts: '13:48:44', result: 'Terminal cleared' },
];

export function setupMemoryCore() {
  let isOpen = false;
  let searchTerm = '';

  const overlay = document.createElement('div');
  overlay.id = 'memory-core-overlay';
  overlay.className = 'memory-core';
  overlay.style.display = 'none';
  overlay.innerHTML = `
    <div class="memory-core__backdrop"></div>
    <div class="memory-core__panel">
      <div class="memory-core__header">
        <span class="memory-core__title">AEGIS MEMORY CORE</span>
        <span class="memory-core__hint">Type to search history · ESC to close</span>
      </div>
      <div class="memory-core__search-wrap">
        <svg class="memory-core__search-icon" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="#00ffff" stroke-width="1.2"/>
          <line x1="10" y1="10" x2="14" y2="14" stroke="#00ffff" stroke-width="1.2"/>
        </svg>
        <input type="text" class="memory-core__input" placeholder="Search commands, tournaments, actions..." spellcheck="false" autofocus>
      </div>
      <div class="memory-core__results"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.memory-core__input');
  const resultsEl = overlay.querySelector('.memory-core__results');

  function filterResults(q) {
    if (!q.trim()) return COMMAND_HISTORY.slice(0, 6);
    const lower = q.toLowerCase();
    return COMMAND_HISTORY.filter(item =>
      item.cmd.toLowerCase().includes(lower) ||
      item.result.toLowerCase().includes(lower)
    ).slice(0, 10);
  }

  function renderResults(items) {
    if (items.length === 0) {
      resultsEl.innerHTML = `<div class="memory-core__empty">No matching commands found</div>`;
      return;
    }
    resultsEl.innerHTML = items.map((item, i) => `
      <div class="memory-core__item" data-idx="${i}" style="animation:threatSlide 0.2s ease-out ${i * 0.04}s both;">
        <div class="memory-core__item-cmd">
          <span class="memory-core__item-prompt">$</span>
          <span class="memory-core__item-text">${item.cmd}</span>
        </div>
        <div class="memory-core__item-meta">
          <span class="memory-core__item-result">${item.result}</span>
          <span class="memory-core__item-ts">${item.ts}</span>
        </div>
      </div>
    `).join('');
  }

  function open() {
    isOpen = true;
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.classList.add('memory-core--open');
      input.focus();
    }, 10);
    renderResults(filterResults(''));
  }

  function close() {
    overlay.classList.remove('memory-core--open');
    setTimeout(() => {
      overlay.style.display = 'none';
      isOpen = false;
    }, 300);
  }

  input.addEventListener('input', () => {
    searchTerm = input.value;
    renderResults(filterResults(searchTerm));
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const first = resultsEl.querySelector('.memory-core__item');
      if (first) {
        const text = first.querySelector('.memory-core__item-text')?.textContent;
        if (text) {
          close();
          document.dispatchEvent(new CustomEvent('aegismemorycommand', { detail: { command: text } }));
        }
      }
    }
  });

  overlay.querySelector('.memory-core__backdrop').addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (isOpen) close();
      else open();
    }
  });

  return { open, close, isOpen: () => isOpen };
}
