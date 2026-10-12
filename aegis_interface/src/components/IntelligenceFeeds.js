const NEWS_ITEMS = [
  { source: 'Reuters',   headline: 'Fed holds rates steady amid inflation concerns',      time: '12m', category: 'finance' },
  { source: 'Bloomberg', headline: 'Global AI infrastructure spending hits record $320B',  time: '8m',  category: 'tech' },
  { source: 'AP',        headline: 'Quantum computing breakthrough in error correction',   time: '23m', category: 'tech' },
  { source: 'CNBC',      headline: 'Tech stocks rally on earnings beat',                   time: '5m',  category: 'finance' },
  { source: 'BBC',       headline: 'Major cyberattack targets European energy grid',       time: '2m',  category: 'security' },
  { source: 'ESPN',      headline: 'eFootball World Cup 2025 — Quarter Finals set',        time: '7m',  category: 'sports' },
  { source: 'TechCrunch', headline: 'Neural interface startup raises $200M Series C',      time: '15m', category: 'tech' },
];

const SPORTS_UPDATES = [
  { league: 'eFootball CL', match: 'France vs England', score: '2 - 1', status: 'FT' },
  { league: 'eFootball CL', match: 'Germany vs Spain',  score: '1 - 1 (4-3)', status: 'FT' },
  { league: 'Premier',      match: 'Manchester City vs Arsenal', score: '3 - 2', status: '80\'' },
  { league: 'eFootball CL', match: 'Brazil vs Portugal', score: '3 - 0', status: 'FT' },
];

export function setupRightPanel() {
    const el = { interval: null, nocInterval: null, sportsInterval: null };

    function init() {
        const newsEl = document.getElementById('news-feed');
        const nocEl = document.getElementById('network-noc');
        const engEl = document.getElementById('engineering-context');

        if (newsEl) buildNewsFeed(newsEl);
        if (nocEl) buildNetworkNOC(nocEl);
        if (engEl) buildEngineeringContext(engEl);

        el.interval = setInterval(rotateNews, 6000);
        el.nocInterval = setInterval(updateNOC, 2000);
        el.sportsInterval = setInterval(rotateSports, 4000);
    }

    function buildNewsFeed(container) {
        container.innerHTML = `
            <div class="section-header">GLOBAL INTELLIGENCE</div>
            <div id="news-items" class="global-intel-cards"></div>
            <div class="section-header" style="margin-top:8px;border-top:1px solid rgba(0,255,255,0.06);padding-top:6px;">SPORTS · eFOOTBALL</div>
            <div id="sports-items" class="global-intel-cards"></div>
        `;
        renderNews();
        renderSports();
    }

    function renderNews() {
        const items = document.getElementById('news-items');
        if (!items) return;
        items.innerHTML = NEWS_ITEMS.map((n, i) => `
            <div class="intel-card" style="animation:threatSlide 0.3s ease-out ${i*0.06}s both;">
                <div class="intel-card__head">
                    <span class="intel-card__source">${n.source}</span>
                    <span class="intel-card__time">${n.time}</span>
                    <span class="intel-card__tag ${n.category}">${n.category}</span>
                </div>
                <div class="intel-card__body">${n.headline}</div>
                <div class="intel-card__bar"></div>
            </div>
        `).join('');
    }

    function renderSports() {
        const items = document.getElementById('sports-items');
        if (!items) return;
        items.innerHTML = SPORTS_UPDATES.map((s, i) => `
            <div class="intel-card intel-card--sport" style="animation:threatSlide 0.3s ease-out ${i*0.06}s both;">
                <div class="intel-card__head">
                    <span class="intel-card__source">${s.league}</span>
                    <span class="intel-card__tag sport">${s.status}</span>
                </div>
                <div class="intel-card__body">
                    <span class="intel-card__match">${s.match}</span>
                    <span class="intel-card__score">${s.score}</span>
                </div>
                <div class="intel-card__bar"></div>
            </div>
        `).join('');
    }

    function buildNetworkNOC(container) {
        const services = [
            { name: 'WebSocket', status: 'online', latency: '12ms' },
            { name: 'AI Core',   status: 'online', latency: '34ms' },
            { name: 'Database',  status: 'online', latency: '3ms' },
            { name: 'API Gateway', status: 'online', latency: '8ms' },
        ];
        container.innerHTML = `
            <div class="section-header">NETWORK OPERATIONS CENTER</div>
            <div id="noc-services" class="noc-grid">
                ${services.map(s => `
                    <div class="noc-indicator">
                        <span class="noc-dot ${s.status}"></span>
                        <span class="noc-name">${s.name}</span>
                        <span class="noc-latency">${s.latency}</span>
                    </div>
                `).join('')}
            </div>
            <div class="noc-stats">
                <div class="metric-row">
                    <span class="label">ACTIVE CONNS</span>
                    <span class="value cyan noc-conns">47</span>
                </div>
                <div class="metric-row">
                    <span class="label">THROUGHPUT</span>
                    <span class="value noc-throughput">2.4 Gbps</span>
                </div>
                <div class="metric-row">
                    <span class="label">PACKET LOSS</span>
                    <span class="value" style="color:var(--tertiary-accent)">0.02%</span>
                </div>
                <div class="metric-row">
                    <span class="label">UPTIME</span>
                    <span class="value noc-uptime">99.97%</span>
                </div>
            </div>
        `;
    }

    function buildEngineeringContext(container) {
        const projects = [
            { name: 'NaVi (Nairobi Navigator)', files: 47, branch: 'feat/route-optimizer', status: 'ACTIVE' },
            { name: 'eFootball TM',             files: 23, branch: 'main',                status: 'STABLE' },
            { name: 'Tournament App Maker',     files: 89, branch: 'dev/bracket-engine',  status: 'ACTIVE' },
        ];
        container.innerHTML = `
            <div class="section-header">ENGINEERING & PROJECT CONTEXT</div>
            ${projects.map(p => `
                <div class="proj-card">
                    <div class="proj-card__name">${p.name}</div>
                    <div class="proj-card__stats">
                        <span class="proj-stat"><span class="label">files</span> ${p.files}</span>
                        <span class="proj-stat"><span class="label">branch</span> ${p.branch}</span>
                    </div>
                    <div class="proj-card__status" style="color:${p.status === 'ACTIVE' ? '#00ff88' : 'var(--primary-accent)'}">${p.status}</div>
                    <div class="proj-card__bar"></div>
                </div>
            `).join('')}
        `;
    }

    function rotateNews() {
        renderNews();
    }

    function rotateSports() {
        renderSports();
    }

    function updateNOC() {
        const conns = document.querySelector('.noc-conns');
        if (conns) conns.textContent = Math.round(40 + Math.random() * 25);
        const tp = document.querySelector('.noc-throughput');
        if (tp) tp.textContent = (2.0 + Math.random() * 1.2).toFixed(1) + ' Gbps';
        const uptime = document.querySelector('.noc-uptime');
        if (uptime) uptime.textContent = (99.9 + Math.random() * 0.08).toFixed(2) + '%';
        const dots = document.querySelectorAll('.noc-dot');
        dots.forEach(d => {
            const flip = Math.random() > 0.95;
            d.className = 'noc-dot ' + (flip ? 'warning' : 'online');
            setTimeout(() => { if (d) d.className = 'noc-dot online'; }, 3000);
        });
    }

    return {
        init,
        destroy: () => {
            if (el.interval) clearInterval(el.interval);
            if (el.nocInterval) clearInterval(el.nocInterval);
            if (el.sportsInterval) clearInterval(el.sportsInterval);
        }
    };
}
