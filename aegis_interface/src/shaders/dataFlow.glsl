//// Data Flow shader for AEGIS OS
//// Animated neon particle flows connecting telemetry panels to globe core
//// Moves particles along target UV path lines with dynamic intensity

precision highp float;

varying vec2 vUv;
uniform float time;
uniform float intensity;
uniform vec2 source;
uniform vec2 target;
uniform vec3 flowColor;
uniform float particleCount;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float flowPath(vec2 uv, vec2 src, vec2 tgt, float t) {
    vec2 dir = tgt - src;
    float len = length(dir);
    vec2 ndir = dir / max(len, 0.001);
    vec2 perp = vec2(-ndir.y, ndir.x);
    vec2 rel = uv - src;
    float proj = dot(rel, ndir);
    float dist = dot(rel, perp);
    float progress = (proj / len) * 0.5 + 0.5;
    float pulse = fract(progress - t * 0.3);
    float beam = exp(-pow(dist * 8.0, 2.0)) * smoothstep(0.0, 0.1, progress) * smoothstep(1.0, 0.9, progress);
    float particle = exp(-pow(dist * 40.0, 2.0)) * exp(-pow(fract(pulse * 2.0 - t * 0.5) * 4.0, 2.0));
    return beam * 0.6 + particle * 0.4;
}

void main() {
    vec2 uv = vUv;
    vec3 color = vec3(0.0);
    float alpha = 0.0;

    vec3 baseColor = length(flowColor) > 0.0 ? flowColor : vec3(0.0, 0.94, 1.0);

    float flow = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 srcOff = vec2(
            hash(vec2(fi, 0.0)) * 0.02 - 0.01,
            hash(vec2(fi, 1.0)) * 0.02 - 0.01
        );
        vec2 tgtOff = vec2(
            hash(vec2(fi, 2.0)) * 0.02 - 0.01,
            hash(vec2(fi, 3.0)) * 0.02 - 0.01
        );
        float t = time * (0.8 + fi * 0.2);
        flow += flowPath(uv, source + srcOff, target + tgtOff, t);
    }
    flow /= 3.0;

    float glow = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 gp = vec2(
            fract(hash(vec2(fi, 4.0)) + time * 0.02 * (0.5 + fi * 0.15)),
            fract(hash(vec2(fi, 5.0)) + time * 0.015 * (0.3 + fi * 0.2))
        );
        float gd = length(uv - gp);
        glow += exp(-gd * 20.0) * (0.3 + 0.7 * sin(time * 2.0 + fi));
    }

    float scan = sin(uv.y * 200.0 + time) * 0.5 + 0.5;
    scan = smoothstep(0.48, 0.52, scan) * 0.15;

    color = baseColor * (flow * intensity + glow * 0.3 * intensity + scan);
    alpha = flow * intensity * 0.5 + glow * 0.15 * intensity + scan;

    float edgeDist = min(uv.x, min(1.0 - uv.x, min(uv.y, 1.0 - uv.y)));
    float vignette = smoothstep(0.0, 0.1, edgeDist);

    color *= vignette;
    alpha *= vignette;

    float seed = hash(uv + time);
    float sparkle = step(0.998, seed) * intensity;
    color += baseColor * sparkle * 0.5;
    alpha += sparkle * 0.4;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
