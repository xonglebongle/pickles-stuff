// Name: Chrysanthemum
// Author: MustardOS
// Version: 1
//
// Radial jewel geometry inspired by the commonly reported chrysanthemum /
// hyperpattern stage. Kaleidoscopic petals, inner recursion and prismatic
// colour breathing while keeping the content recognisable.
//
// Texture fetches: 3
// Derivatives: none
// Feedback/history: none

#pragma parameter blossom   "Petal Bloom"       0.84 0.00 1.00 0.01
#pragma parameter sectors   "Petal Count"       10.0 4.0 20.0 1.0
#pragma parameter shimmer   "Hyper Shimmer"     0.68 0.00 1.00 0.01
#pragma parameter jewel     "Jewel Colour"      0.72 0.00 1.00 0.01
#pragma parameter recursion "Inner Recursion"   0.56 0.00 1.00 0.01
#pragma parameter pulse     "Breathing Pulse"   0.62 0.00 1.00 0.01
#pragma parameter clarity   "Content Clarity"   0.60 0.00 1.00 0.01

uniform float blossom;
uniform float sectors;
uniform float shimmer;
uniform float jewel;
uniform float recursion;
uniform float pulse;
uniform float clarity;

const float TAU = 6.28318530718;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec2 to_uv(vec2 p, float aspect) {
    p.x /= aspect;
    return clamp(p * 0.5 + 0.5, 0.0, 1.0);
}

void main() {
    vec2 native = max(u_native_resolution, vec2(1.0));
    vec2 px = 1.0 / native;
    float aspect = max(u_resolution.x / max(u_resolution.y, 1.0), 0.001);
    float t = u_time * 0.0016;

    vec2 p = v_uv * 2.0 - 1.0;
    p.x *= aspect;

    float r = length(p);
    float a = atan(p.y, p.x);
    float sector = TAU / max(sectors, 1.0);
    float ka = abs(mod(a + sector * 0.5, sector) - sector * 0.5);

    float petal = sin(ka * sectors * 2.0 + t * 0.9 + r * 8.0);
    float breathe = 1.0 + sin(t * 1.3 + r * 5.0) * 0.08 * pulse;

    vec2 fold = vec2(cos(ka), sin(ka)) * r;
    fold.x += petal * 0.18 * blossom * (1.0 - min(r, 1.0));
    fold *= breathe;

    vec2 uv_fold = to_uv(fold, aspect);
    vec2 uv_inner = to_uv(fold * (0.62 + 0.20 * recursion) + vec2(sin(t * 0.7), cos(t * 0.9)) * 0.04 * recursion, aspect);

    vec3 base = texture2D(u_tex, v_uv).rgb;
    vec3 petalled = texture2D(u_tex, uv_fold).rgb;
    vec3 inner = texture2D(u_tex, uv_inner).rgb;

    float lum = dot(petalled, LUMA);
    float prism = 0.5 + 0.5 * sin(r * 18.0 - ka * 8.0 + t * 2.1);
    vec3 tint_a = vec3(1.10, 0.56, 1.18);
    vec3 tint_b = vec3(0.40, 1.12, 0.96);
    vec3 tint = mix(tint_a, tint_b, prism);

    vec3 hyper = mix(petalled, inner, 0.20 + 0.44 * recursion);
    hyper *= mix(vec3(1.0), tint, jewel * (0.18 + 0.42 * prism));
    hyper += vec3(prism * lum) * (0.05 + 0.12 * shimmer);

    float mix_amt = 0.30 + 0.52 * blossom;
    mix_amt = mix(mix_amt, 0.42, clarity);
    vec3 col = mix(base, hyper, mix_amt);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
