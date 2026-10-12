//// Holographic material shader for AEGIS OS panels
//// Creates a shimmering, transparent holographic effect

varying vec2 vUv;
uniform float time;
uniform float intensity;

void main() {
    // Base holographic color (cyan/purple shift)
    vec3 color = mix(
        vec3(0.0, 1.0, 1.0), // Cyan
        vec3(0.54, 0.0, 0.54), // Purple
        sin(time * 0.5 + vUv.x * 10.0) * 0.5 + 0.5
    );

    // Add scan lines
    float scanLine = sin(vUv.y * 100.0) * 0.5 + 0.5;
    scanLine = smoothstep(0.45, 0.55, scanLine);

    // Add noise for texture
    float noise = fract(sin(dot(vUv * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    noise = noise * 0.2 + 0.8; // Range 0.8-1.0

    // Combine effects
    color *= scanLine * noise * intensity;

    // Add outer glow
    float glow = pow(0.5 - abs(vUv.x - 0.5), 2.0) * pow(0.5 - abs(vUv.y - 0.5), 2.0);
    glow = pow(glow, 0.2) * 2.0; // Increase contrast
    glow = clamp(glow, 0.0, 1.0);

    vec3 finalColor = color + vec3(0.2, 0.6, 0.8) * glow * intensity;

    gl_FragColor = vec4(finalColor, intensity * 0.3); // Semi-transparent
}