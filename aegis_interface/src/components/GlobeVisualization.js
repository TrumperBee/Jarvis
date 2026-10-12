import * as THREE from 'three';

export function setupGlobe(container) {
    if (!container) return { init: () => {}, onResize: () => {}, destroy: () => {}, setVoiceLevel: () => {} };

    let scene, camera, renderer;
    let globe, rings = [], starField;
    let animId = null, clock = null;
    let voiceLevel = 0;

    const RING_COLORS = [0x00ffff, 0xff00ff, 0x00ff88, 0xa855f7, 0x00ccff];

    function init() {
        const w = container.clientWidth, h = container.clientHeight;
        if (w === 0 || h === 0) { requestAnimationFrame(init); return; }

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.set(0, 1.2, 4.2);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        buildGlobe();
        buildRings();
        buildStars();
        buildGlow();

        clock = new THREE.Clock();
        window.addEventListener('aegisvoicelevel', onVoice);
        animate();
    }

    function buildGlobe() {
        const geo = new THREE.IcosahedronGeometry(1.2, 1);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            emissive: 0x004488,
            emissiveIntensity: 0.4,
            shininess: 50,
            flatShading: true,
            transparent: true,
            opacity: 0.85,
        });
        globe = new THREE.Mesh(geo, mat);
        scene.add(globe);

        const wireGeo = new THREE.IcosahedronGeometry(1.25, 1);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.12,
        });
        const wireframe = new THREE.Mesh(wireGeo, wireMat);
        globe.add(wireframe);

        const light = new THREE.DirectionalLight(0xffffff, 1.0);
        light.position.set(5, 5, 5);
        scene.add(light);
        const ambient = new THREE.AmbientLight(0x222244);
        ambient.intensity = 0.6;
        scene.add(ambient);
    }

    function buildRings() {
        const radii = [1.6, 2.0, 2.5, 3.0, 3.5];
        radii.forEach((r, i) => {
            const count = 140 + i * 20;
            const positions = new Float32Array(count * 3);
            for (let j = 0; j < count; j++) {
                const theta = (j / count) * Math.PI * 2;
                const tiltOffset = Math.sin(theta * 3) * 0.08;
                positions[j * 3] = r * Math.cos(theta);
                positions[j * 3 + 1] = tiltOffset;
                positions[j * 3 + 2] = r * Math.sin(theta);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                color: RING_COLORS[i % RING_COLORS.length],
                size: 0.07,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                sizeAttenuation: true,
            });
            const ring = new THREE.Points(geo, mat);
            ring.userData = {
                baseRadius: r,
                speed: 0.08 + i * 0.04,
                tilt: i * 0.25 + 0.1,
                baseOpacity: 0.6,
            };
            ring.rotation.x = ring.userData.tilt;
            ring.rotation.z = i * 0.1;
            scene.add(ring);
            rings.push(ring);
        });
    }

    function buildStars() {
        const count = 1200;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 80;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff, size: 0.05,
            transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
            sizeAttenuation: true,
        });
        starField = new THREE.Points(geo, mat);
        starField.position.z = -8;
        scene.add(starField);
    }

    function buildGlow() {
        const glowGeo = new THREE.SphereGeometry(1.4, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.name = 'neural-glow';
        globe.add(glow);
    }

    function onVoice(e) {
        if (typeof e.detail?.value === 'number') {
            voiceLevel = Math.max(0, Math.min(1, e.detail.value));
        }
    }

    function setVoiceLevel(level) {
        voiceLevel = Math.max(0, Math.min(1, level));
    }

    function animate() {
        animId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const t = clock.getElapsedTime();

        if (globe) {
            globe.rotation.y += delta * 0.12;
            globe.rotation.x += delta * 0.03;
            const pulseScale = 1 + voiceLevel * 0.06 * (0.5 + 0.5 * Math.sin(t * 1.5));
            globe.scale.set(pulseScale, pulseScale, pulseScale);
            const glowMesh = globe.getObjectByName('neural-glow');
            if (glowMesh) {
                glowMesh.material.opacity = 0.04 + voiceLevel * 0.08;
                glowMesh.scale.set(1 + voiceLevel * 0.2, 1 + voiceLevel * 0.2, 1 + voiceLevel * 0.2);
            }
        }
        if (starField) {
            starField.rotation.y += delta * 0.015;
            starField.rotation.x += delta * 0.005;
        }

        rings.forEach((ring, i) => {
            ring.rotation.y += delta * ring.userData.speed * (1 + voiceLevel * 0.5);
            ring.rotation.z = ring.userData.tilt + Math.sin(t * 0.3 + i) * 0.05;
            const pulse = 1 + voiceLevel * 0.3 * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.7));
            ring.scale.set(pulse, pulse, pulse);
            ring.material.opacity = ring.userData.baseOpacity * (0.4 + voiceLevel * 0.6);
            ring.material.size = 0.07 * (1 + voiceLevel * 0.8);
        });

        renderer.render(scene, camera);
    }

    function onResize() {
        if (!renderer || !camera) return;
        const w = container.clientWidth, h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function destroy() {
        window.removeEventListener('aegisvoicelevel', onVoice);
        if (animId) cancelAnimationFrame(animId);
        if (clock) clock.stop();
        [globe, starField, ...rings].forEach(obj => {
            if (obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
                if (scene) scene.remove(obj);
            }
        });
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        scene = null; camera = null; renderer = null; globe = null; rings = [];
    }

    return { init, onResize, destroy, setVoiceLevel };
}
