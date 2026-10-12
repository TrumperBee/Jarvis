import * as THREE from 'three';

export class ThreeBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.starField = null;
        this.nebula = null;
        this.clock = new THREE.Clock();
        this.voiceLevel = 0;
        this.animId = null;
        this._mouseX = 0;
        this._mouseY = 0;
    }

    init() {
        const canvas = document.createElement('canvas');
        canvas.id = 'three-bg';
        document.body.prepend(canvas);

        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: false,
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.onResize();
        window.addEventListener('resize', () => this.onResize());

        this.buildStarfield();
        this.buildNebula();
        this._mouseX = 0;
        this._mouseY = 0;
        window.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.animate();
    }

    onResize() {
        if (!this.renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
    }

    buildStarfield() {
        const count = 1500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.08,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        this.starField = new THREE.Points(geo, mat);
        this.scene.add(this.starField);
    }

    buildNebula() {
        const size = 256;
        const data = new Uint8Array(size * size);
        for (let i = 0; i < size * size; i++) {
            data[i] = Math.floor(Math.random() * 200 + 55);
        }
        const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat);
        tex.needsUpdate = true;

        const geo = new THREE.PlaneGeometry(40, 40);
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uTime: { value: 0 },
                uVoice: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                uniform float uTime;
                uniform float uVoice;
                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    float n = texture2D(uTexture, uv + vec2(uTime * 0.003, 0.0)).r;
                    n += texture2D(uTexture, uv + vec2(0.0, uTime * 0.001)).r * 0.5;
                    n = n * 0.75;

                    vec3 col1 = vec3(0.0, 0.3, 0.5);
                    vec3 col2 = vec3(0.3, 0.0, 0.4);
                    vec3 col3 = vec3(0.0, 0.5, 0.3);

                    float t = sin(uTime * 0.02 + n * 2.0) * 0.5 + 0.5;
                    vec3 color = mix(col1, col2, t);
                    color = mix(color, col3, n * 0.3);

                    float alpha = n * 0.08 + uVoice * 0.03;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.nebulaMat = mat;
        this.nebula = new THREE.Mesh(geo, mat);
        this.nebula.position.z = -5;
        this.scene.add(this.nebula);
    }

    setVoiceLevel(level) {
        this.voiceLevel = level;
    }

    animate() {
        this.animId = requestAnimationFrame(() => this.animate());
        const dt = this.clock.getElapsedTime();

        if (this.starField) {
            this.starField.rotation.y += 0.0005;
            // Parallax: gentle follow mouse
            const mx = (this._mouseX || 0) * 0.0001;
            const my = (this._mouseY || 0) * 0.00005;
            this.starField.position.x += (mx - this.starField.position.x) * 0.01;
            this.starField.position.y += (my - this.starField.position.y) * 0.01;
        }
        if (this.nebulaMat) {
            this.nebulaMat.uniforms.uTime.value = dt;
            this.nebulaMat.uniforms.uVoice.value = this.voiceLevel;
        }
        this.renderer.render(this.scene, this.camera);
    }

    _onMouseMove(e) {
        this._mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this._mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }

    destroy() {
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.renderer) {
            this.renderer.dispose();
            const canvas = document.getElementById('three-bg');
            if (canvas) canvas.remove();
        }
    }
}
