export function setupThreatFeed(container) {
    const el = { container, interval: null, count: 0 };

    const threats = [
        ['RANSOMWARE', 'United States — East Coast financial sector'],
        ['DDoS', 'European cloud infrastructure providers'],
        ['PHISHING', 'Asia-Pacific government email systems'],
        ['MALWARE', 'South American energy grid control nodes'],
        ['DATA BREACH', 'North American healthcare databases'],
        ['SQL INJECTION', 'E-commerce platforms — EU region'],
        ['ZERO-DAY', 'Critical infrastructure — ICS/SCADA systems'],
        ['CREDENTIAL STUFFING', 'Social media platforms — global'],
        ['DNS TUNNELING', 'Corporate VPN endpoints detected'],
        ['MAN-IN-THE-MIDDLE', 'Wireless carrier backbone — APAC'],
    ];

    function init() {
        container.innerHTML = '';
        container.style.cssText = 'overflow:hidden;';
        for (let i = 0; i < 4; i++) addThreat();
        el.interval = setInterval(addThreat, 3500);
    }

    function addThreat() {
        const t = threats[el.count % threats.length];
        el.count++;
        const div = c('div');
        div.className = 'threat-event';
        div.innerHTML = `
            <span class="threat-type">${t[0]}</span>
            <span class="threat-target">${t[1]}</span>
            <span class="threat-time">${Math.floor(Math.random() * 3 + 1)}s ago</span>
        `;
        container.appendChild(div);
        while (container.children.length > 8) {
            container.removeChild(container.firstChild);
        }
    }

    function c(tag) { return document.createElement(tag); }

    return {
        init,
        destroy: () => { if (el.interval) clearInterval(el.interval); }
    };
}
