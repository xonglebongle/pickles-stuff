// Name: Shadow Figures
// Author: MustardOS
// Version: 1
//
// Peripheral shadow-form suggestions inspired by deliriant visual confusion.
// Dark silhouettes, false movement and edge-born forms gather in the corners
// while the actual centre content stays readable.
//
// Texture fetches: 5
// Derivatives: none
// Feedback/history: none

#pragma parameter figures   "Figure Strength"   0.80 0.00 1.00 0.01
#pragma parameter offset    "Peripheral Offset" 2.80 0.00 6.00 0.10
#pragma parameter shadow    "Shadow Weight"     0.74 0.00 1.00 0.01
#pragma parameter glance    "False Motion"      0.60 0.00 1.00 0.01
#pragma parameter periphery "Periphery Bias"    0.82 0.00 1.00 0.01
#pragma parameter drift     "Drift Speed"       0.48 0.00 2.00 0.05
#pragma parameter clarity   "Content Clarity"   0.40 0.00 1.00 0.01

uniform float figures;
uniform float offset;
uniform float shadow;
uniform float glance;
uniform float periphery;
uniform float drift;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.0);
    return fract(p.x * p.y);
}

void main() {
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    float t = u_time * 0.022 * drift;

    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= aspect;
    float r = clamp(length(p), 0.0, 1.4);
    float peripheral = smoothstep(0.24, 0.96, r) * periphery;

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 n = texture2D(u_tex, clamp(v_uv + vec2(0.0, -px.y), 0.0, 1.0)).rgb;
    vec3 s = texture2D(u_tex, clamp(v_uv + vec2(0.0,  px.y), 0.0, 1.0)).rgb;
    vec3 e = texture2D(u_tex, clamp(v_uv + vec2( px.x, 0.0), 0.0, 1.0)).rgb;
    vec3 w = texture2D(u_tex, clamp(v_uv + vec2(-px.x, 0.0), 0.0, 1.0)).rgb;

    float edge = abs(dot(e - w, LUMA)) + abs(dot(s - n, LUMA));

    vec2 drift_dir = normalize(vec2(sin(t * 1.7 + p.y * 2.0), cos(t * 1.1 - p.x * 1.6)) + vec2(1e-4, 0.0));
    vec2 far_off = drift_dir * px * offset * (1.0 + 2.0 * peripheral + 1.5 * glance);
    vec3 far = texture2D(u_tex, clamp(v_uv + far_off, 0.0, 1.0)).rgb;

    float base_l = dot(base, LUMA);
    float far_l = dot(far, LUMA);
    float phantom = smoothstep(0.04, 0.28, abs(far_l - base_l) + edge * 0.45) * peripheral;

    float corner_seed = hash21(floor((v_uv + vec2(t * 0.03, -t * 0.02)) * 8.0));
    float corner_wave = smoothstep(0.72, 0.98, corner_seed) * peripheral * glance;

    vec3 shadow_col = mix(base, vec3(base_l * 0.25), shadow * phantom);
    shadow_col -= vec3(corner_wave * 0.35 * figures);

    float mix_amt = figures * (1.0 - 0.5 * clarity);
    vec3 col = mix(base, shadow_col, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
