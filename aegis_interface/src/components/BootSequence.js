export function setupBootSequence(container, options = {}) {
    const { onAgentCheckIn = () => {}, onComplete = () => {}, duration = 5500 } = options;
    const state = {
        container, startTime: null, rafId: null, complete: false,
        stage: 0, el: {}, agentLines: {}
    };

    const AGENTS = [
        {
            id: 1, name: 'AEGIS::CORE', color: '#00ffff', label: 'AGENT 01',
            lines: [
                '\x1b[36m[AEGIS::CORE]\x1b[0m Calibrating system telemetry arrays... \x1b[32mOK\x1b[0m',
                '\x1b[36m[AEGIS::CORE]\x1b[0m Stabilizing port 8080 WebSocket pipes... \x1b[32mOK\x1b[0m',
                '\x1b[36m[AEGIS::CORE]\x1b[0m Mapping asymmetric 3-column layout grid... \x1b[32mOK\x1b[0m',
                '\x1b[36m[AEGIS::CORE]\x1b[0m Core hardware calibration \u2014 \x1b[32mCOMPLETE\x1b[0m',
            ]
        },
        {
            id: 2, name: 'FRIDAY::INTEL', color: '#10b981', label: 'AGENT 02',
            lines: [
                '\x1b[32m[FRIDAY::INTEL]\x1b[0m Connecting data science pipelines... \x1b[32mONLINE\x1b[0m',
                '\x1b[32m[FRIDAY::INTEL]\x1b[0m Initializing web search modules... \x1b[32mONLINE\x1b[0m',
                '\x1b[32m[FRIDAY::INTEL]\x1b[0m Populating global intelligence feeds... \x1b[32mONLINE\x1b[0m',
                '\x1b[32m[FRIDAY::INTEL]\x1b[0m Synchronizing cognitive channels \u2014 \x1b[32mONLINE\x1b[0m',
            ]
        },
        {
            id: 3, name: 'ORACLE::SENTINEL', color: '#a855f7', label: 'AGENT 03',
            lines: [
                '\x1b[35m[ORACLE::SENTINEL]\x1b[0m Scanning local directory trees... \x1b[32mMAPPED\x1b[0m',
                '\x1b[35m[ORACLE::SENTINEL]\x1b[0m Memory pool compaction... \x1b[32mCOMPACTED\x1b[0m',
                '\x1b[35m[ORACLE::SENTINEL]\x1b[0m Initializing firewall logging... \x1b[32mARMED\x1b[0m',
                '\x1b[35m[ORACLE::SENTINEL]\x1b[0m Sentinel defense grid \u2014 \x1b[32mACTIVE\x1b[0m',
            ]
        }
    ];

    function init() {
        container.innerHTML = '';
        container.style.cssText = 'position:fixed;inset:0;z-index:1000;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center;';

        const c = S('div');
        c.textContent = '_';
        Object.assign(c.style, {
            position:'absolute', color:'#fff', fontSize:'4rem',
            fontFamily:'monospace', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)', zIndex:'30',
            opacity:'1', animation:'bootBlink 0.6s step-end infinite'
        });
        container.appendChild(c);
        state.el.cursor = c;

        const hc = S('canvas');
        Object.assign(hc.style, {
            position:'absolute', inset:'0', width:'100%', height:'100%',
            zIndex:'20', opacity:'0'
        });
        hc.width = window.innerWidth * window.devicePixelRatio;
        hc.height = window.innerHeight * window.devicePixelRatio;
        container.appendChild(hc);
        state.el.hexCanvas = hc;

        const bt = S('div');
        Object.assign(bt.style, {
            position:'absolute', bottom:'0', left:'0', right:'0',
            height:'30%', background:'rgba(0,0,0,0.9)',
            borderTop:'1px solid rgba(255,255,255,0.1)',
            padding:'10px 16px', overflow:'hidden',
            fontFamily:'"JetBrains Mono",monospace', fontSize:'0.8rem',
            color:'#fff', zIndex:'25', opacity:'0',
            display:'flex', flexDirection:'column', gap:'1px'
        });
        container.appendChild(bt);
        state.el.bootTerminal = bt;

        const pc = S('canvas');
        Object.assign(pc.style, {
            position:'absolute', left:'25%', top:'0',
            width:'50%', height:'60%', zIndex:'21', opacity:'0'
        });
        pc.width = window.innerWidth * 0.5 * window.devicePixelRatio;
        pc.height = window.innerHeight * 0.6 * window.devicePixelRatio;
        container.appendChild(pc);
        state.el.pointCloud = pc;
        state.particles = [];

        injectBootCSS();
        drawHexagon(hc, 0, AGENTS[0].color);
    }

    function start() {
        init();
        state.startTime = performance.now();
        animate(state.startTime);
    }

    function getPhase(t) {
        if (t < 1500) return 0;
        if (t < 3000) return 1;
        if (t < 4500) return 2;
        return 3;
    }

    function animate(ts) {
        if (state.complete) return;
        if (!state.startTime) state.startTime = ts;
        const t = ts - state.startTime;
        const phase = getPhase(t);

        if (phase !== state.stage && phase < 3) {
            state.stage = phase;
            const agent = AGENTS[phase];
            onAgentCheckIn(phase + 1, agent.color);
            state.el.hexCanvas.style.transition = 'filter 0.5s';
        }

        if (t < 1500) {
            const prog = Math.min(1, t / 1500);
            state.el.cursor.style.opacity = Math.max(0, 1 - prog);
            state.el.hexCanvas.style.opacity = Math.min(1, t / 400);
            drawHexagon(state.el.hexCanvas, Math.min(1, t / 400), AGENTS[0].color);

            if (t > 400 && t < 1500) {
                const agent = AGENTS[0];
                const lineIdx = Math.floor((t - 400) / 275);
                printAgentLine(lineIdx, agent, state.el.bootTerminal);
            }
        }

        if (t >= 1500 && t < 3000) {
            const prog = (t - 1500) / 1500;
            state.el.hexCanvas.style.opacity = '1';
            state.el.bootTerminal.style.opacity = '1';
            drawHexagon(state.el.hexCanvas, 1, AGENTS[1].color);

            state.el.pointCloud.style.opacity = Math.min(1, prog);
            drawPointCloud(state.el.pointCloud, prog, state, AGENTS[1].color);

            const agent = AGENTS[1];
            const lineIdx = Math.floor((t - 1500) / 275);
            printAgentLine(lineIdx, agent, state.el.bootTerminal);
        }

        if (t >= 3000 && t < 4500) {
            const prog = (t - 3000) / 1500;
            state.el.hexCanvas.style.opacity = '1';
            state.el.bootTerminal.style.opacity = '1';
            drawHexagon(state.el.hexCanvas, 1, AGENTS[2].color);

            state.el.pointCloud.style.opacity = '1';
            drawPointCloud(state.el.pointCloud, 1 + prog * 0.3, state, AGENTS[2].color);

            if (!state.el.globeGlow) {
                const gg = S('div');
                Object.assign(gg.style, {
                    position:'absolute', left:'25%', top:'0',
                    width:'50%', height:'60%', zIndex:'22',
                    background:'radial-gradient(circle at center, rgba(168,85,247,0.08) 0%, transparent 70%)',
                    opacity:'0', pointerEvents:'none',
                    animation:'bootGlowIn 0.6s ease forwards'
                });
                container.appendChild(gg);
                state.el.globeGlow = gg;
            }
            if (state.el.globeGlow) {
                state.el.globeGlow.style.opacity = Math.min(1, (t - 3000) / 600);
            }

            const agent = AGENTS[2];
            const lineIdx = Math.floor((t - 3000) / 275);
            printAgentLine(lineIdx, agent, state.el.bootTerminal);
        }

        if (t >= 4500) {
            const prog = (t - 4500) / 1000;
            state.el.hexCanvas.style.opacity = Math.max(0, 1 - prog * 2);
            state.el.pointCloud.style.opacity = Math.max(0, 1 - prog);

            const lines = state.el.bootTerminal.children;
            for (let i = 0; i < lines.length; i++) {
                lines[i].style.color = `rgba(0,255,255,${1 - prog})`;
            }

            if (!state.el.pulseOverlay) {
                const po = S('div');
                Object.assign(po.style, {
                    position:'absolute', inset:'0', zIndex:'28',
                    border:'2px solid rgba(0,255,255,0.3)',
                    opacity:'0', pointerEvents:'none',
                    animation:'bootPulse 0.8s ease-out forwards'
                });
                container.appendChild(po);
                state.el.pulseOverlay = po;
            }

            if (t >= duration && !state.complete) {
                completeSequence();
            }
        }

        if (t < duration) {
            state.rafId = requestAnimationFrame(animate);
        }
    }

    function printAgentLine(lineIdx, agent, bt) {
        if (lineIdx >= 0 && lineIdx < agent.lines.length && bt.childElementCount <= lineIdx) {
            const line = S('div');
            line.innerHTML = '> ' + agent.lines[lineIdx];
            line.style.cssText = 'white-space:nowrap;opacity:0;animation:bootLineIn 0.3s ease forwards;';
            bt.appendChild(line);
        }
    }

    function completeSequence() {
        state.complete = true;
        container.style.transition = 'opacity 0.5s ease';
        container.style.opacity = '0';
        setTimeout(() => {
            if (state.rafId) cancelAnimationFrame(state.rafId);
            container.innerHTML = '';
            container.style.cssText = '';
            onComplete();
        }, 600);
    }

    function drawHexagon(canvas, scale, color) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);

        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.15 * scale;
        const verts = [];
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 2;
            verts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }

        ctx.strokeStyle = color || 'rgba(0,255,255,0.8)';
        ctx.lineWidth = 1.5 / dpr;
        ctx.shadowColor = (color || '#00ffff') + '66';
        ctx.shadowBlur = 10 / dpr;

        ctx.beginPath();
        verts.forEach((v, i) => i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y));
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = (color || 'rgba(0,255,255,0.3)').replace(')', ',0.3)').replace('rgb', 'rgba');
        ctx.lineWidth = 0.8 / dpr;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 2) {
            const j = (i + 2) % 6;
            ctx.moveTo(verts[i].x, verts[i].y);
            ctx.lineTo(verts[j].x, verts[j].y);
        }
        ctx.stroke();

        ctx.fillStyle = (color || '#00ffff') + '99';
        ctx.shadowBlur = 15 / dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5 / dpr, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = (color || '#00ffff') + '26';
        ctx.lineWidth = 0.5 / dpr;
        verts.forEach(v => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(v.x, v.y);
            ctx.stroke();
        });

        ctx.restore();
    }

    function drawPointCloud(canvas, progress, st, color) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);

        const cx = w / 2;
        const cy = h / 2;
        const rad = Math.min(w, h) * 0.3;

        if (!st.particles || st.particles.length === 0) {
            st.particles = [];
            const count = 600;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * rad * 4;
                const scatterAngle = Math.random() * Math.PI * 2;
                const scatterDist = Math.random() * rad * 3;
                st.particles.push({
                    x0: cx + Math.cos(scatterAngle) * scatterDist,
                    y0: cy + Math.sin(scatterAngle) * scatterDist,
                    x1: cx + Math.cos(angle) * rad * (0.3 + Math.random() * 0.7),
                    y1: cy + Math.sin(angle) * rad * (0.3 + Math.random() * 0.7),
                    size: 0.5 + Math.random() * 2,
                    alpha: 0.3 + Math.random() * 0.7,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        const p = Math.min(1, progress);
        const col = color || '#00ffff';
        st.particles.forEach(pt => {
            const x = pt.x0 + (pt.x1 - pt.x0) * p;
            const y = pt.y0 + (pt.y1 - pt.y0) * p;
            const alpha = pt.alpha * p;
            const size = pt.size * (1 + (1 - p) * 1.5) / dpr;

            ctx.fillStyle = col + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.shadowColor = col + '4D';
            ctx.shadowBlur = 4 / dpr;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    function injectBootCSS() {
        if (document.getElementById('boot-style')) return;
        const s = S('style');
        s.id = 'boot-style';
        s.textContent = `
            @keyframes bootBlink { 0%,100%{opacity:1} 50%{opacity:0} }
            @keyframes bootLineIn { 0%{opacity:0;transform:translateX(-10px)} 100%{opacity:1;transform:translateX(0)} }
            @keyframes bootGlowIn { 0%{opacity:0} 100%{opacity:1} }
            @keyframes bootPulse { 0%{opacity:0.8;transform:scale(0.98)} 100%{opacity:0;transform:scale(1)} }
        `;
        document.head.appendChild(s);
    }

    function S(tag) { return document.createElement(tag); }

    return {
        init,
        start,
        isComplete: () => state.complete
    };
}
