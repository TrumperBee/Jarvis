let rafId = null;
let clockId = null;
let _items = null;
let _clock = null;
let _pingEl = null;

function setupHeader(container) {
  destroy();
  container.innerHTML = '';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:16px;width:100%';

  const brand = document.createElement('span');
  brand.className = 'aegis-brand';
  brand.textContent = 'AEGIS';
  row.appendChild(brand);

  const badge = document.createElement('span');
  badge.className = 'status-badge';
  badge.textContent = 'PROTOCOL 7';
  row.appendChild(badge);

  // Modes Switcher
  const modes = document.createElement('div');
  modes.id = 'modes-switcher';
  row.appendChild(modes);

  const clock = document.createElement('span');
  clock.className = 'clock';
  row.appendChild(clock);
  _clock = clock;

  const metrics = document.createElement('span');
  metrics.className = 'mini-metrics';

  const defs = [
    { cls: 'cyan', range: [3, 25], v: 10 },
    { cls: 'green', range: [25, 60], v: 40 },
    { cls: 'purple', range: [8, 28], v: 15 }
  ];

  _items = defs.map(d => {
    const val = document.createElement('span');
    val.className = 'metric-value';
    const track = document.createElement('div');
    track.className = 'bar-track-mini';
    const fill = document.createElement('div');
    fill.className = 'bar-fill-mini ' + d.cls;
    track.appendChild(fill);
    metrics.append(val, track);
    return { ...d, valEl: val, fillEl: fill };
  });

  const ping = document.createElement('span');
  ping.className = 'metric-value';
  metrics.appendChild(ping);
  _pingEl = ping;

  row.appendChild(metrics);
  container.appendChild(row);

  updateClock();
  clockId = setInterval(updateClock, 50);
  rafId = requestAnimationFrame(tick);
}

function updateClock() {
  const now = new Date();
  _clock.textContent =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0') + '.' +
    String(now.getMilliseconds()).padStart(3, '0');
}

function tick() {
  for (const d of _items) {
    const v = d.v + (Math.random() - 0.5) * 4;
    d.v = Math.min(d.range[1], Math.max(d.range[0], v));
    d.valEl.textContent = d.v.toFixed(1) + '%';
    d.fillEl.style.width = d.v + '%';
  }
  _pingEl.textContent = Math.floor(Math.random() * 16 + 8) + 'ms';
  rafId = requestAnimationFrame(tick);
}

function destroy() {
  if (clockId) clearInterval(clockId);
  if (rafId) cancelAnimationFrame(rafId);
  clockId = rafId = null;
  _items = _clock = _pingEl = null;
}

const init = setupHeader;

export { setupHeader, init, destroy };
