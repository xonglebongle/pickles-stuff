// Name: Pareidolia Veil
// Author: MustardOS
// Version: 5
//
// A perceptual overlay rather than a conventional distortion. The source
// remains geometrically untouched while drifting light/shadow edge pairs make
// the brain infer depth, figures and contours that are not actually present.
//
// Texture fetches: 7
// Derivatives: none
// Feedback/history: none

#pragma parameter suggestion "Suggestion Strength" 0.84 0.00 1.00 0.01
#pragma parameter field      "Suggestion Field"    8.50 2.00 18.00 0.25
#pragma parameter drift      "Field Drift"         0.62 0.00 2.00 0.05
#pragma parameter depth      "Phantom Depth"       3.40 0.00 6.00 0.10
#pragma parameter aura       "Peripheral Aura"     0.74 0.00 1.00 0.01
#pragma parameter contour    "Imagined Contours"   0.82 0.00 1.00 0.01
#pragma parameter clarity    "Content Clarity"     0.45 0.00 1.00 0.01

uniform float suggestion;
uniform float field;
uniform float drift;
uniform float depth;
uniform float aura;
uniform float contour;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float value_noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    float lum = dot(base, LUMA);

    float t = u_time * 0.014 * drift;
    vec2 p = vec2(v_uv.x * aspect, v_uv.y) * field;

    float n0 = value_noise(p * 0.55 + vec2(t * 0.31, -t * 0.23));
    float n1 = value_noise(p * 0.91 + vec2(-t * 0.17, t * 0.29) + 13.7);

    float angle = (n0 - 0.5) * 4.0 + sin(t * 0.47 + n1 * 2.6) * 1.45;
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 off = dir * px * depth;

    vec3 ahead = texture2D(u_tex, clamp(v_uv + off, 0.0, 1.0)).rgb;
    vec3 behind = texture2D(u_tex, clamp(v_uv - off, 0.0, 1.0)).rgb;
    float la = dot(ahead, LUMA);
    float lb = dot(behind, LUMA);

    float relief = la - lb;
    float edge = abs(relief);

    vec2 wide = vec2(-dir.y, dir.x) * px * (depth * 2.25 + 0.8);
    vec3 side_a = texture2D(u_tex, clamp(v_uv + wide, 0.0, 1.0)).rgb;
    vec3 side_b = texture2D(u_tex, clamp(v_uv - wide, 0.0, 1.0)).rgb;
    float side_relief = dot(side_a - side_b, LUMA);

    float lx = dot(texture2D(u_tex, clamp(v_uv + vec2(px.x, 0.0), 0.0, 1.0)).rgb, LUMA)
             - dot(texture2D(u_tex, clamp(v_uv - vec2(px.x, 0.0), 0.0, 1.0)).rgb, LUMA);
    float edge_mask = smoothstep(0.012, 0.24, abs(lx) + edge);

    float mid = 1.0 - abs(lum * 2.0 - 1.0);
    float field_wave = sin((p.x * 0.83 + p.y * 1.17) + n0 * 4.4 + t * 0.63);
    field_wave += cos((p.x * 1.41 - p.y * 0.67) - n1 * 3.4 - t * 0.51);
    field_wave *= 0.5;

    float phantom = (relief * 0.92 + side_relief * 0.64) * contour;
    phantom *= 0.55 + 0.45 * mid;

    vec3 warm = vec3(1.00, 0.66, 0.34);
    vec3 cool = vec3(0.28, 0.63, 1.00);
    vec3 tint = mix(cool, warm, smoothstep(-0.18, 0.18, phantom));
    vec3 coloured_relief = tint * abs(phantom) * (0.34 + 0.52 * suggestion);

    float apparition = field_wave * (0.12 + 0.19 * aura) * (0.35 + 0.65 * mid);
    apparition *= 0.55 + 0.45 * (1.0 - edge_mask);

    vec3 effect = base;
    effect += coloured_relief * (0.92 + 0.32 * suggestion);
    effect += vec3(phantom) * (0.18 + 0.16 * suggestion);
    effect += vec3(apparition) * (1.05 + 0.25 * suggestion);

    float effect_mix = mix(0.96, 0.50, clarity);
    vec3 col = mix(base, effect, effect_mix + 0.26 * suggestion);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
