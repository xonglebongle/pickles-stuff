// Name: False Memory
// Author: MustardOS
// Version: 5
//
// The frame remains readable, but its colours and edges seem to remember a
// slightly different version of themselves. A displaced soft recollection is
// mixed behind the exact source, with changing warm/cool mnemonic bias.
//
// Texture fetches: 9
// Derivatives: none
// Feedback/history: none

#pragma parameter recall    "Recall Strength"   0.82 0.00 1.00 0.01
#pragma parameter drift     "Dream Drift"       0.78 0.00 2.00 0.05
#pragma parameter glow      "Memory Glow"       0.74 0.00 1.00 0.01
#pragma parameter echo      "Echo Trace"        0.72 0.00 1.00 0.01
#pragma parameter tint      "Nostalgia Tint"    0.54 0.00 1.00 0.01
#pragma parameter softness  "Soft Focus"        0.48 0.00 1.00 0.01
#pragma parameter stability "Content Stability" 0.40 0.00 1.00 0.01

uniform float recall;
uniform float drift;
uniform float glow;
uniform float echo;
uniform float tint;
uniform float softness;
uniform float stability;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float hash21(vec2 p) {
    p = fract(p * vec2(234.56, 345.67));
    p += dot(p, p + 34.345);
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

    float t = u_time * 0.013 * drift;
    vec2 p = vec2(v_uv.x * aspect, v_uv.y) * 6.25;
    float n0 = value_noise(p * 0.52 + vec2(t * 0.20, -t * 0.14));
    float n1 = value_noise(p * 0.97 + vec2(-t * 0.11, t * 0.18) + 17.0);

    vec3 north = texture2D(u_tex, clamp(v_uv + vec2(0.0, -px.y), 0.0, 1.0)).rgb;
    vec3 south = texture2D(u_tex, clamp(v_uv + vec2(0.0,  px.y), 0.0, 1.0)).rgb;
    vec3 east  = texture2D(u_tex, clamp(v_uv + vec2( px.x, 0.0), 0.0, 1.0)).rgb;
    vec3 west  = texture2D(u_tex, clamp(v_uv + vec2(-px.x, 0.0), 0.0, 1.0)).rgb;
    vec3 blur = (north + south + east + west) * 0.25;

    float angle = n0 * 6.2831853 + sin(t * 0.43 + n1 * 2.0) * 1.0;
    vec2 dir = vec2(cos(angle), sin(angle));
    float distance = (2.2 + n1 * 4.8) * (0.45 + 0.75 * echo);
    vec2 off = dir * px * distance;

    vec3 echo_a = texture2D(u_tex, clamp(v_uv + off, 0.0, 1.0)).rgb;
    vec3 echo_b = texture2D(u_tex, clamp(v_uv - off * 0.72, 0.0, 1.0)).rgb;
    vec3 remembered = mix(blur, 0.64 * echo_a + 0.36 * echo_b, 0.76);

    vec2 glow_off = dir * px * (5.5 + 5.5 * glow);
    vec3 far_a = texture2D(u_tex, clamp(v_uv + glow_off, 0.0, 1.0)).rgb;
    vec3 far_b = texture2D(u_tex, clamp(v_uv - glow_off, 0.0, 1.0)).rgb;
    vec3 halo = 0.5 * (far_a + far_b);

    float highlight = smoothstep(0.32, 0.88, lum);
    float mid = 1.0 - abs(lum * 2.0 - 1.0);

    vec3 warm = vec3(1.12, 1.00, 0.84);
    vec3 cool = vec3(0.86, 0.97, 1.12);
    float memory_phase = 0.5 + 0.5 * sin(p.x * 0.73 + p.y * 0.91 + t * 0.31 + n0 * 3.2);
    vec3 memory_tint = mix(cool, warm, memory_phase);

    vec3 recalled = mix(base, remembered, 0.34 + 0.44 * softness);
    recalled = mix(recalled, halo, highlight * glow * 0.38);
    recalled *= mix(vec3(1.0), memory_tint, tint * 0.46);
    recalled = recalled * (0.90 + 0.16 * mid) + vec3(0.040 * recall);

    float memory_mix = recall * mix(0.72, 0.34, stability);
    vec3 col = mix(base, recalled, memory_mix);

    vec3 echo_delta = echo_a - echo_b;
    col.r += echo_delta.r * echo * recall * 0.24;
    col.g += (echo_delta.g) * echo * recall * 0.05;
    col.b -= echo_delta.b * echo * recall * 0.20;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
