// Name: Lopsided Sway
// Author: MustardOS
// Version: 1
//
// Dreamy intoxicated stagger with lopsided wobble, soft body-load smear and
// red-white pulse cues. More fairy-tale and unstable than psychedelic.
//
// Texture fetches: 3
// Derivatives: none
// Feedback/history: none

#pragma parameter stagger   "Stagger"           0.78 0.00 1.00 0.01
#pragma parameter wobble    "Lopsided Wobble"   0.72 0.00 1.00 0.01
#pragma parameter doublev   "Double Vision"     0.46 0.00 1.00 0.01
#pragma parameter capred    "Red Pulse"         0.58 0.00 1.00 0.01
#pragma parameter softness  "Dream Softness"    0.42 0.00 1.00 0.01
#pragma parameter drift     "Drift Speed"       0.54 0.00 2.00 0.05
#pragma parameter clarity   "Content Clarity"   0.40 0.00 1.00 0.01

uniform float stagger;
uniform float wobble;
uniform float doublev;
uniform float capred;
uniform float softness;
uniform float drift;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float t = u_time * 0.027 * drift;

    float sway = sin(t * 1.0) + 0.5 * sin(t * 2.3 + 1.2);
    vec2 wob = vec2(
        sin(v_uv.y * 8.0 + t * 1.7),
        cos(v_uv.x * 6.5 - t * 1.2)
    ) * px * (2.0 + 8.0 * wobble);
    vec2 lean = vec2(sway * 0.035 * stagger, sin(t * 0.8) * 0.020 * stagger);

    vec2 uv_a = clamp(v_uv + wob + lean, 0.0, 1.0);
    vec2 uv_b = clamp(v_uv - wob * 0.6 - lean * 0.5 + vec2(px.x, -px.y) * (2.0 + 6.0 * doublev), 0.0, 1.0);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 a = texture2D(u_tex, uv_a).rgb;
    vec3 b = texture2D(u_tex, uv_b).rgb;

    vec3 dreamy = mix(a, b, 0.34 + 0.32 * doublev);
    float lum = dot(dreamy, LUMA);
    vec3 soft = mix(dreamy, vec3(lum), softness * 0.18);

    float red_phase = 0.5 + 0.5 * sin(t * 2.0 + v_uv.y * 8.0);
    vec3 red_tint = vec3(1.08, 0.94, 0.92);
    soft *= mix(vec3(1.0), red_tint, capred * 0.30 * red_phase);
    soft += vec3(red_phase * 0.035 * capred, 0.0, 0.0);

    float mix_amt = stagger * (1.0 - 0.5 * clarity);
    vec3 col = mix(base, soft, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
