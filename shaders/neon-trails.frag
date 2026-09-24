// Name: Neon Trails
// Author: MustardOS
// Version: 1
//
// Multi-exposure tracer effect with chromatic drift and visual persistence.
// Strongly readable, but moving edges feel like they are dragging colour and
// leaving a neon residue behind them.
//
// Texture fetches: 4
// Derivatives: none
// Feedback/history: none

#pragma parameter trails    "Trail Strength"    0.82 0.00 1.00 0.01
#pragma parameter spread    "Trail Spread"      2.60 0.00 6.00 0.10
#pragma parameter chroma    "Chromatic Drift"   0.72 0.00 1.00 0.01
#pragma parameter neon      "Neon Lift"         0.54 0.00 1.00 0.01
#pragma parameter skew      "Direction Skew"    0.60 0.00 1.00 0.01
#pragma parameter drift     "Phase Speed"       0.56 0.00 2.00 0.05
#pragma parameter clarity   "Content Clarity"   0.40 0.00 1.00 0.01

uniform float trails;
uniform float spread;
uniform float chroma;
uniform float neon;
uniform float skew;
uniform float drift;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float t = u_time * 0.032 * drift;

    vec2 dir = normalize(vec2(0.75 + 0.50 * sin(t * 1.3), 0.35 + 0.60 * cos(t * 0.8 + 1.0)));
    dir = normalize(mix(dir, vec2(-dir.y, dir.x), skew * 0.35));

    vec2 o1 = dir * px * spread * (1.0 + 1.8 * trails);
    vec2 o2 = dir * px * spread * (2.4 + 2.8 * trails);
    vec2 o3 = dir * px * spread * (4.0 + 4.0 * trails);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 a = texture2D(u_tex, clamp(v_uv - o1, 0.0, 1.0)).rgb;
    vec3 b = texture2D(u_tex, clamp(v_uv - o2, 0.0, 1.0)).rgb;
    vec3 c = texture2D(u_tex, clamp(v_uv + o3 * 0.6, 0.0, 1.0)).rgb;

    vec3 trace = base * 0.48 + a * 0.26 + b * 0.16 + c * 0.10;
    vec3 chroma_col = vec3(a.r, trace.g, b.b);
    vec3 neon_col = mix(trace, chroma_col, chroma * 0.60);

    float lum = dot(neon_col, LUMA);
    neon_col += vec3(lum * lum) * (0.08 + 0.18 * neon);

    float mix_amt = trails * (1.0 - 0.5 * clarity);
    vec3 col = mix(base, neon_col, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
