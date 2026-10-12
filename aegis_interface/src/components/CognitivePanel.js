export function setupCognitivePanel() {
    const el = { animFrame: null, voiceLevel: 0, phase: 0, themeColor: [0, 255, 255] };

    function setThemeColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        el.themeColor = [r, g, b];
    }

    function init() {
        const canvas = document.getElementById('cognitive-wave');
        const status = document.getElementById('cognitive-status');
        if (!canvas || !status) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width - 14;
        canvas.height = rect.height - 50;

        document.addEventListener('aegisvoicelevel', e => {
            el.voiceLevel = e.detail?.value || 0;
            if (el.voiceLevel > 0.05) {
                document.body.classList.add('voice-active');
            } else {
                document.body.classList.remove('voice-active');
            }
        });

        document.addEventListener('aegisthemecolor', e => {
            if (e.detail?.color) setThemeColor(e.detail.color);
        });

        const statuses = [
            '[AEGIS::STANDBY]',
            '[AEGIS::PROCESSING]',
            '[AEGIS::MONITOR]',
            '[AEGIS::ANALYZE]',
            '[AEGIS::SYNC]',
        ];
        let si = 0;
        setInterval(() => { si = (si + 1) % statuses.length; status.textContent = statuses[si]; }, 4000);

        function resize() {
            const r = canvas.parentElement.getBoundingClientRect();
            canvas.width = r.width - 14;
            canvas.height = r.height - 50;
        }
        window.addEventListener('resize', resize);

        function draw(ts) {
            el.animFrame = requestAnimationFrame(draw);
            el.phase += 0.03;
            const w = canvas.width, h = canvas.height;
            if (w < 10 || h < 10) return;
            ctx.clearRect(0, 0, w, h);

            const [tr, tg, tb] = el.themeColor;
            const bars = 72;
            const barW = w / bars;

            const glowIntensity = 0.3 + el.voiceLevel * 0.5;

            for (let i = 0; i < bars; i++) {
                const phase = i * 0.12;
                const amp = Math.sin(el.phase * 2 + phase) * 6
                    + Math.sin(el.phase * 1.3 + phase * 1.5) * 4
                    + Math.sin(el.phase * 0.7 + phase * 0.8) * 3
                    + el.voiceLevel * 14
                    + 4;
                const bh = Math.max(1, Math.min(h, amp));

                const t = i / bars;
                const r = Math.min(255, Math.floor(tr * (0.3 + 0.7 * Math.sin(el.phase * 0.5 + t * 2))));
                const g = Math.min(255, Math.floor(tg * (0.3 + 0.7 * Math.sin(el.phase * 0.5 + t * 2))));
                const b = Math.min(255, Math.floor(tb * (0.3 + 0.7 * Math.sin(el.phase * 0.5 + t * 2))));
                const alpha = glowIntensity * (0.3 + (bh / h) * 0.7);

                ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.5})`;
                ctx.shadowBlur = 4 + el.voiceLevel * 8;
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.fillRect(i * barW, h - bh, barW - 1, bh);
            }
            ctx.shadowBlur = 0;
        }
        draw();

        return () => window.removeEventListener('resize', resize);
    }

    return {
        init,
        setThemeColor,
        destroy: () => { if (el.animFrame) cancelAnimationFrame(el.animFrame); }
    };
}
