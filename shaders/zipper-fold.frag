// Name: Zipper Fold
// Author: MustardOS
// Version: 1
//
// A lightweight dissociative spatial-fold effect inspired by commonly
// reported salvia-like visual motifs: folding planes, zipper motion,
// repeating strips, perspective compression and scene recursion.
//
// Texture fetches: 3
// Derivatives: none
// Feedback/history: none
// Loops: none

#pragma parameter strength   "Fold Strength"      0.72 0.00 1.00 0.01
#pragma parameter repeats    "Reality Repeats"    5.00 1.00 10.00 1.00
#pragma parameter zipper     "Zipper Motion"      0.58 0.00 1.00 0.01
#pragma parameter bend       "Plane Bend"         0.62 0.00 1.00 0.01
#pragma parameter recursion  "Scene Recursion"    0.42 0.00 1.00 0.01
#pragma parameter drift      "Drift Speed"        0.45 0.00 2.00 0.05
#pragma parameter clarity    "Content Clarity"    0.70 0.00 1.00 0.01

uniform float strength;
uniform float repeats;
uniform float zipper;
uniform float bend;
uniform float recursion;
uniform float drift;
uniform float clarity;

void main() {
    vec2 uv = v_uv;
    vec2 p = uv * 2.0 - 1.0;
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    p.x *= aspect;

    float t = u_time * 0.0015 * drift;

    // Rotating spatial frame: makes the fold direction feel like it belongs
    // to the scene rather than the screen.
    float a = sin(t * 0.61) * 0.55;
    float ca = cos(a);
    float sa = sin(a);
    vec2 q = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);

    // Repeating strips with phase drift. This creates the characteristic
    // zipper / conveyor feel without procedural noise.
    float stripe = q.x * repeats + sin(q.y * 3.0 + t * 1.7) * bend;
    float cell = fract(stripe * 0.5 + 0.5);
    float signed_cell = cell * 2.0 - 1.0;

    // Fold each strip around its centre, alternating direction every band.
    float band_id = floor(stripe * 0.5 + 0.5);
    float flip = mod(band_id, 2.0) * 2.0 - 1.0;
    float fold = abs(signed_cell);

    float phase = sin(q.y * 5.0 - t * 2.3 + band_id * 1.7);
    float z = fold * fold;

    vec2 warped = q;
    warped.x += flip * (1.0 - fold) * strength * 0.26;
    warped.y += phase * (1.0 - fold) * bend * 0.10;

    // Perspective compression: outer fold areas appear to turn away from the
    // viewer, as though the framebuffer is being bent into a mechanical fan.
    float compress = 1.0 - strength * 0.28 * z;
    warped.y *= compress;

    // Zipper motion along the band axis.
    warped.y += flip * sin(t * 3.1 + band_id * 0.9) * zipper * 0.045;

    // Undo frame rotation.
    vec2 r = vec2(ca * warped.x + sa * warped.y,
                 -sa * warped.x + ca * warped.y);
    r.x /= aspect;
    vec2 uv_warp = clamp(r * 0.5 + 0.5, 0.0, 1.0);

    // Main warped scene.
    vec3 base = texture2D(u_tex, uv).rgb;
    vec3 folded = texture2D(u_tex, uv_warp).rgb;

    // Cheap recursive echo: pull a second copy toward the screen centre.
    vec2 recur_uv = mix(uv_warp, vec2(0.5), recursion * 0.18);
    recur_uv += vec2(flip * 0.012, phase * 0.010) * recursion;
    vec3 recur = texture2D(u_tex, clamp(recur_uv, 0.0, 1.0)).rgb;

    // Keep the image recognisable at baseline while letting the impossible
    // geometry dominate enough to be immediately visible.
    float fold_mix = strength * mix(0.82, 0.46, clarity);
    vec3 col = mix(base, folded, fold_mix);
    col = mix(col, recur, recursion * strength * 0.28);

    // Slight luminance pumping at fold edges helps the strips read spatially.
    float ridge = 1.0 - smoothstep(0.0, 0.23, abs(signed_cell));
    col *= 1.0 + ridge * strength * 0.10;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
