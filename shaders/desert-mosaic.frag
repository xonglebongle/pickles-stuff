// Name: Desert Mosaic
// Author: MustardOS
// Version: 1
//
// Ornamental tessellation and beadwork geometry. The scene is reorganised
// into bright patterned cells with decorative outlines and desert-jewel tone.
//
// Texture fetches: 2
// Derivatives: none
// Feedback/history: none

#pragma parameter mosaic   "Mosaic Strength"    0.78 0.00 1.00 0.01
#pragma parameter cells    "Cell Density"       26.0 8.0 48.0 1.0
#pragma parameter outlines "Decorative Outlines"0.72 0.00 1.00 0.01
#pragma parameter colour   "Desert Colour"      0.62 0.00 1.00 0.01
#pragma parameter shimmer  "Tile Shimmer"       0.42 0.00 1.00 0.01
#pragma parameter drift    "Drift Speed"        0.36 0.00 2.00 0.05
#pragma parameter clarity  "Content Clarity"    0.40 0.00 1.00 0.01

uniform float mosaic;
uniform float cells;
uniform float outlines;
uniform float colour;
uniform float shimmer;
uniform float drift;
uniform float clarity;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float hash21(vec2 p) {
    p = fract(p * vec2(231.3, 91.7));
    p += dot(p, p + 54.3);
    return fract(p.x * p.y);
}

void main() {
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    float t = u_time * 0.020 * drift;

    vec2 p = vec2(v_uv.x * aspect, v_uv.y) * cells;
    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;

    // Offset every other row for beadwork-like staggering.
    float row = mod(id.y, 2.0);
    vec2 cell_centre = id + vec2(row * 0.5, 0.0) + 0.5;
    vec2 uv_cell = vec2(cell_centre.x / cells / aspect, cell_centre.y / cells);
    uv_cell = clamp(uv_cell, 0.0, 1.0);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 tile = texture2D(u_tex, uv_cell).rgb;

    float edge = max(abs(f.x), abs(f.y));
    float outline = smoothstep(0.34, 0.48, edge) * outlines;
    float seed = hash21(id);
    float bead = 0.5 + 0.5 * sin(seed * 6.28318 + t * 1.6);

    float lum = dot(tile, LUMA);
    vec3 warm = vec3(1.10, 0.88, 0.46);
    vec3 jewel = vec3(0.86, 0.58, 1.14);
    vec3 tint = mix(warm, jewel, bead);

    vec3 patterned = mix(tile, vec3(lum), 0.14);
    patterned *= mix(vec3(1.0), tint, colour * 0.42);
    patterned += vec3((0.5 - edge) * 0.08 * shimmer);
    patterned = mix(patterned, vec3(0.08, 0.06, 0.03), outline * 0.65);

    float mix_amt = mosaic * (1.0 - 0.5 * clarity);
    vec3 col = mix(base, patterned, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
