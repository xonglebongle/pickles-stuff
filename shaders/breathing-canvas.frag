// Name: Breathing Canvas
// Author: MustardOS
// Version: 1
//
// Organic breathing and surface aliveness. The frame gently expands, relaxes
// and undulates while colours become a touch richer and edges feel alive.
//
// Texture fetches: 3
// Derivatives: none
// Feedback/history: none

#pragma parameter breathe    "Breathing"         0.78 0.00 1.00 0.01
#pragma parameter wobble     "Organic Wobble"    0.58 0.00 1.00 0.01
#pragma parameter saturation "Colour Bloom"      0.44 0.00 1.00 0.01
#pragma parameter softness   "Living Softness"   0.24 0.00 1.00 0.01
#pragma parameter ripple     "Surface Ripple"    0.46 0.00 1.00 0.01
#pragma parameter drift      "Drift Speed"       0.50 0.00 2.00 0.05
#pragma parameter stability  "Content Stability" 0.40 0.00 1.00 0.01

uniform float breathe;
uniform float wobble;
uniform float saturation;
uniform float softness;
uniform float ripple;
uniform float drift;
uniform float stability;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    float t = u_time * 0.025 * drift;

    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= aspect;
    float r = length(p);

    float breath = sin(t * 1.1) * breathe;
    float ring = sin(r * 14.0 - t * 2.0) * ripple;
    float bulge = (0.060 * breath + 0.030 * ring) * (1.0 - min(r, 1.0));

    vec2 wave = vec2(
        sin(v_uv.y * 12.0 + t * 1.7),
        cos(v_uv.x * 10.0 - t * 1.3)
    ) * px * (2.0 + 6.0 * wobble);

    vec2 uv_warp = clamp(v_uv + p * bulge + wave, 0.0, 1.0);
    vec2 uv_soft = clamp(v_uv + wave * 0.5 + p * bulge * 0.6, 0.0, 1.0);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 warped = texture2D(u_tex, uv_warp).rgb;
    vec3 soft = texture2D(u_tex, uv_soft + px * vec2(softness, -softness)).rgb;

    vec3 alive = mix(warped, soft, softness * 0.55);
    float lum = dot(alive, LUMA);
    vec3 sat = mix(vec3(lum), alive, 1.0 + saturation * 0.85);
    sat += vec3(0.015 * ripple * (0.5 + 0.5 * sin(t * 1.7 + r * 12.0)));

    float mix_amt = breathe * (1.0 - 0.5 * stability);
    vec3 col = mix(base, sat, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
