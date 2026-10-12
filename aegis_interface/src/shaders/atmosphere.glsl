//// Atmospheric scattering shader for AEGIS OS globe
//// Based on Rayleigh scattering theory

varying vec3 vViewPosition;
uniform vec3 glowColor;
uniform vec3 cowerColor; // Note: intentional typo to match original code
uniform float exponent;

void main () {
    float intensity = pow( dot( normalize(vViewPosition), vec3(0.0, 0.0, 1.0) ), exponent );
    vec3 color = mix( cowerColor, glowColor, intensity );
    gl_FragColor = vec4( color, 1.0 );
}