// Name: Bright Flashback
// Author: MustardOS
// Version: 1
//
// Bright compression, breathy pulsing and white-edge flash. The frame blooms
// and narrows rhythmically as if repeatedly peaking into a euphoric flash.
//
// Texture fetches: 3
// Derivatives: none
// Feedback/history: none

#pragma parameter flash    "Flash Strength"     0.82 0.00 1.00 0.01
#pragma parameter bloom    "Bloom Lift"         0.72 0.00 1.00 0.01
#pragma parameter pulse    "Pulse"              0.76 0.00 1.00 0.01
#pragma parameter tunnel   "Compression"        0.56 0.00 1.00 0.01
#pragma parameter bands    "Breath Bands"       0.48 0.00 1.00 0.01
#pragma parameter drift    "Cycle Speed"        0.60 0.00 2.00 0.05
#pragma parameter clarity  "Content Clarity"    0.40 0.00 1.00 0.01

uniform float flash;
uniform float bloom;
uniform float pulse;
uniform float tunnel;
uniform float bands;
uniform float drift;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float t = u_time * 0.033 * drift;

    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= aspect;
    float r = length(p);

    float pulse_v = 0.5 + 0.5 * sin(t * 2.2);
    float compress = 1.0 - tunnel * (0.12 + 0.30 * pulse_v) * (1.0 - min(r, 1.0));
    vec2 uv_tunnel = p * compress;
    uv_tunnel.x /= aspect;
    uv_tunnel = clamp(uv_tunnel * 0.5 + 0.5, 0.0, 1.0);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 pulled = texture2D(u_tex, uv_tunnel).rgb;
    vec3 halo = texture2D(u_tex, clamp(uv_tunnel + px * vec2(1.4, -1.4) * bloom, 0.0, 1.0)).rgb;

    float lum = dot(pulled, LUMA);
    float band = 0.5 + 0.5 * sin(v_uv.y * 24.0 - t * 4.0);
    vec3 flash_col = mix(pulled, halo, 0.22 + 0.28 * bloom);
    flash_col += vec3(lum * lum) * (0.10 + 0.28 * flash) * (0.55 + 0.45 * pulse_v);
    flash_col += vec3((band - 0.5) * 0.25 * bands * pulse);

    float mix_amt = flash * (1.0 - 0.5 * clarity);
    vec3 col = mix(base, flash_col, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
