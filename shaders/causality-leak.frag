// Name: Causality Leak
// Author: MustardOS
// Version: 3
//
// A non-Euclidean quasicrystal post-process. Five irrationally related
// directional waves partition the image into regions which disagree about
// what coordinate system the source texture occupies. At the boundaries,
// colour channels shear apart and the image briefly becomes its own negative.
//
// Texture fetches: 4
// Derivatives:     none
// Feedback/history: none

#pragma parameter fracture "Reality Fracture" 0.78 0.00 1.00 0.01
#pragma parameter scale "Impossible Scale" 9.50 2.00 24.00 0.25
#pragma parameter drift "Causality Drift" 0.55 0.00 2.00 0.05
#pragma parameter spectral "Spectral Shear" 1.40 0.00 5.00 0.10
#pragma parameter seams "Reality Seams" 0.70 0.00 1.50 0.05
#pragma parameter paradox "Paradox" 0.35 0.00 1.00 0.01

uniform float fracture;
uniform float scale;
uniform float drift;
uniform float spectral;
uniform float seams;
uniform float paradox;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec2 native_res() {
    return max(u_native_resolution, vec2(1.0));
}

float quasicrystal(vec2 p, float t) {
    // Five equally spaced directions create a non-periodic, Penrose-like
    // interference field without a texture lookup or loop.
    const vec2 d0 = vec2( 1.000000000,  0.000000000);
    const vec2 d1 = vec2( 0.309016994,  0.951056516);
    const vec2 d2 = vec2(-0.809016994,  0.587785252);
    const vec2 d3 = vec2(-0.809016994, -0.587785252);
    const vec2 d4 = vec2( 0.309016994, -0.951056516);

    float s = sin(dot(p, d0) + t * 0.71);
    s += sin(dot(p, d1) + t * 0.93 + 1.1);
    s += sin(dot(p, d2) + t * 1.17 + 2.3);
    s += sin(dot(p, d3) + t * 0.81 + 3.7);
    s += sin(dot(p, d4) + t * 1.07 + 5.2);

    return s * 0.20;
}

vec2 rotate2(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec2(c * p.x - s * p.y,
                s * p.x + c * p.y);
}

vec2 five_fold(vec2 p, float turn) {
    float r = length(p);
    float a = atan(p.y, p.x) + turn;
    float sector = TAU * 0.20;

    // Reflect every angular sector into a single impossible wedge.
    a = abs(mod(a + sector * 0.5, sector) - sector * 0.5);
    return vec2(cos(a), sin(a)) * r;
}

vec2 to_uv(vec2 p, float aspect) {
    p.x /= aspect;
    return p * 0.5 + 0.5;
}

void main() {
    vec2 native = native_res();
    vec2 px = 1.0 / native;

    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= aspect;

    // The image itself biases the topology. Bright and dark source regions
    // therefore fracture differently even when the geometry is unchanged.
    vec3 source = texture2D(u_tex, v_uv).rgb;
    float lum = dot(source, LUMA);

    float t = u_time * 0.08 * drift;
    float q = quasicrystal(p * scale, t);
    float topology = q + (lum - 0.5) * 0.36;
    float gate = smoothstep(-0.18, 0.18, topology);

    // Coordinate system A: a slowly rotating five-fold reflection.
    vec2 folded = five_fold(p, t * 0.23);
    folded = rotate2(folded, q * 0.55 * fracture);

    // Coordinate system B: reciprocal space. The soft denominator deliberately
    // avoids a singularity while preserving the inside-out inversion.
    float r2 = dot(p, p);
    vec2 reciprocal = p * (0.52 / (r2 + 0.20));
    reciprocal = rotate2(reciprocal, -q * 0.85 + t * 0.11);

    // The quasicrystal continuously switches which geometry is locally true.
    vec2 normal_side = mix(p, folded, fracture * 0.72);
    vec2 impossible_side = mix(p, reciprocal, fracture);
    vec2 warped_p = mix(normal_side, impossible_side, gate);

    // A second low-amplitude quasicrystal perturbation prevents the boundary
    // from reading like a conventional geometric wipe.
    float q2 = quasicrystal((warped_p.yx + vec2(1.7, -0.9)) * scale * 0.63,
                            -t * 0.77);
    warped_p += vec2(q2, -q2) * 0.035 * fracture;

    // Space outside the screen does not disappear; it wraps back through the
    // opposite edge, producing portal-like continuity instead of black borders.
    vec2 warped = fract(to_uv(warped_p, aspect));

    // The seam is where the two coordinate systems are least able to agree.
    float seam = 1.0 - smoothstep(0.025, 0.19, abs(topology));
    seam *= seams;

    // Spectral displacement is native-pixel based so it remains visually
    // stable across output resolutions.
    float phase = q * 4.5 + q2 * 2.0 + t * 0.9;
    vec2 dir = vec2(cos(phase), sin(phase));
    vec2 chroma = dir * px * spectral * (0.35 + seam * 1.65);

    float r = texture2D(u_tex, fract(warped + chroma)).r;
    float g = texture2D(u_tex, warped).g;
    float b = texture2D(u_tex, fract(warped - chroma)).b;
    vec3 col = vec3(r, g, b);

    // At the strongest boundaries, reality briefly changes sign rather than
    // merely glowing. The B/R swap makes the event perceptually stranger than
    // a conventional RGB negative.
    vec3 anti = vec3(1.0) - col.bgr;
    float contradiction = clamp(seam * paradox, 0.0, 1.0);
    col = mix(col, anti, contradiction * 0.72);

    // Thin pale/black alternating seam filaments expose the quasicrystal
    // structure without requiring derivatives or additional texture samples.
    float filament = 0.5 + 0.5 * sin((q - q2) * 42.0 + t * 2.1);
    float seam_light = seam * (filament - 0.5) * 0.32;
    col += seam_light;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
