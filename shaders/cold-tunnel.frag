// Name: Cold Tunnel
// Author: MustardOS
// Version: 1
//
// Cold dissociative tunnel compression. The scene feels detached and pulled
// into a distant centre while colour drains toward a sterile blue-grey plane.
//
// Texture fetches: 2
// Derivatives: none
// Feedback/history: none

#pragma parameter tunnel    "Tunnel Depth"      0.82 0.00 1.00 0.01
#pragma parameter detach    "Detachment"        0.68 0.00 1.00 0.01
#pragma parameter cold      "Cold Tone"         0.74 0.00 1.00 0.01
#pragma parameter planes    "Planar Offset"     0.42 0.00 1.00 0.01
#pragma parameter pulse     "Dissociative Pulse"0.38 0.00 1.00 0.01
#pragma parameter drift     "Drift Speed"       0.44 0.00 2.00 0.05
#pragma parameter clarity   "Content Clarity"   0.40 0.00 1.00 0.01

uniform float tunnel;
uniform float detach;
uniform float cold;
uniform float planes;
uniform float pulse;
uniform float drift;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

void main() {
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    float t = u_time * 0.023 * drift;

    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= aspect;
    float r = length(p);

    float breathe = 1.0 - (0.16 + 0.28 * tunnel) * (1.0 - exp(-r * 2.3));
    breathe += sin(t * 1.2) * 0.07 * pulse;
    vec2 uv_tunnel = p * breathe;
    uv_tunnel.x /= aspect;
    uv_tunnel = clamp(uv_tunnel * 0.5 + 0.5, 0.0, 1.0);

    vec2 uv_plane = clamp(mix(v_uv, uv_tunnel, 0.55 + 0.45 * planes) + vec2(0.012 * sin(t), -0.012 * cos(t * 0.9)) * detach, 0.0, 1.0);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 pulled = texture2D(u_tex, uv_plane).rgb;

    float lum = dot(pulled, LUMA);
    vec3 mono = vec3(lum);
    vec3 steel = vec3(lum * 0.88, lum * 0.95, lum * 1.06);
    vec3 dissoc = mix(pulled, mix(mono, steel, cold), 0.42 + 0.42 * detach);

    float vignette = clamp(1.15 - r * (0.30 + 0.42 * tunnel), 0.0, 1.0);
    dissoc *= 0.78 + 0.22 * vignette;

    float mix_amt = tunnel * (1.0 - 0.5 * clarity);
    vec3 col = mix(base, dissoc, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
