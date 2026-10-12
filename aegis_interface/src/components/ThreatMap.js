export function setupThreatMap(canvas) {
    const el = { canvas, ctx: null, animFrame: null, w: 0, h: 0, lines: [], clock: 0 };

    const nodes = [
        { x: 0.22, y: 0.35, label: 'NA' },
        { x: 0.50, y: 0.42, label: 'EU' },
        { x: 0.70, y: 0.50, label: 'AS' },
        { x: 0.40, y: 0.65, label: 'AF' },
        { x: 0.25, y: 0.75, label: 'SA' },
        { x: 0.85, y: 0.70, label: 'OC' },
    ];

    const connections = [
        [0,1],[0,2],[0,4],[1,2],[1,3],[2,3],[2,5],[3,4],[0,5]
    ];

    function init() {
        resize();
        for (let i = 0; i < 12; i++) {
            const c = connections[Math.floor(Math.random() * connections.length)];
            const a = nodes[c[0]], b = nodes[c[1]];
            el.lines.push({
                x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                progress: Math.random(), speed: 0.002 + Math.random() * 0.004,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        start();
    }

    function resize() {
        const parent = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        el.w = parent.clientWidth * dpr;
        el.h = parent.clientHeight * dpr;
        canvas.width = el.w;
        canvas.height = el.h;
        canvas.style.width = parent.clientWidth + 'px';
        canvas.style.height = parent.clientHeight + 'px';
        if (!el.ctx) el.ctx = canvas.getContext('2d');
    }

    function start() {
        function frame() {
            el.clock++;
            draw();
            el.animFrame = requestAnimationFrame(frame);
        }
        el.animFrame = requestAnimationFrame(frame);
    }

    function draw() {
        const ctx = el.ctx;
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, el.w, el.h);

        const sx = el.w, sy = el.h;

        // Grid
        ctx.strokeStyle = 'rgba(0,255,255,0.04)';
        ctx.lineWidth = 0.5 / dpr;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * sx;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, sy); ctx.stroke();
        }
        for (let i = 0; i <= 6; i++) {
            const y = (i / 6) * sy;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(sx, y); ctx.stroke();
        }

        // Continent blobs
        const blobs = [
            { cx: 0.22*sx, cy: 0.35*sy, rx: 0.08*sx, ry: 0.12*sy },  // NA
            { cx: 0.50*sx, cy: 0.40*sy, rx: 0.05*sx, ry: 0.08*sy },  // EU
            { cx: 0.68*sx, cy: 0.48*sy, rx: 0.09*sx, ry: 0.14*sy },  // AS
            { cx: 0.42*sx, cy: 0.62*sy, rx: 0.06*sx, ry: 0.10*sy },  // AF
            { cx: 0.28*sx, cy: 0.72*sy, rx: 0.05*sx, ry: 0.08*sy },  // SA
            { cx: 0.84*sx, cy: 0.68*sy, rx: 0.06*sx, ry: 0.06*sy },  // OC
        ];

        blobs.forEach((b, i) => {
            ctx.fillStyle = 'rgba(0,255,255,0.04)';
            ctx.strokeStyle = 'rgba(0,255,255,0.08)';
            ctx.lineWidth = 0.5 / dpr;
            ctx.beginPath();
            ctx.ellipse(b.cx, b.cy, b.rx, b.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Node dot
            ctx.fillStyle = 'rgba(0,255,255,0.3)';
            ctx.beginPath();
            ctx.arc(b.cx, b.cy, 2 / dpr, 0, Math.PI * 2);
            ctx.fill();
        });

        // Threat lines
        el.lines.forEach((line, idx) => {
            line.progress += line.speed;
            if (line.progress > 1) {
                line.progress = 0;
                const c = connections[Math.floor(Math.random() * connections.length)];
                const a = nodes[c[0]], b = nodes[c[1]];
                line.x1 = a.x; line.y1 = a.y;
                line.x2 = b.x; line.y2 = b.y;
            }

            const px1 = line.x1 * sx, py1 = line.y1 * sy;
            const px2 = line.x2 * sx, py2 = line.y2 * sy;
            const pulse = Math.sin(el.clock * 0.05 + line.pulsePhase) * 0.3 + 0.7;

            // Path glow
            ctx.strokeStyle = `rgba(255,34,0,${0.04 * pulse})`;
            ctx.lineWidth = 3 / dpr;
            ctx.beginPath();
            ctx.moveTo(px1, py1);
            ctx.lineTo(px2, py2);
            ctx.stroke();

            // Dot at progress
            const cx = px1 + (px2 - px1) * line.progress;
            const cy = py1 + (py2 - py1) * line.progress;
            const size = (1.5 + pulse * 2) / dpr;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 3);
            grad.addColorStop(0, `rgba(255,34,0,${0.8 * pulse})`);
            grad.addColorStop(0.5, `rgba(255,34,0,${0.3 * pulse})`);
            grad.addColorStop(1, 'rgba(255,34,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, size * 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Labels
        ctx.fillStyle = 'rgba(0,255,255,0.2)';
        ctx.font = `${9 / dpr}px "JetBrains Mono",monospace`;
        nodes.forEach(n => {
            ctx.fillText(n.label, n.x * sx + 4, n.y * sy - 2);
        });
    }

    return {
        init,
        onResize: resize,
        destroy: () => { if (el.animFrame) cancelAnimationFrame(el.animFrame); }
    };
}
