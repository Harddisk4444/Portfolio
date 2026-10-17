/**
 * GLSL ES 3.00 shaders for the Spirit Ring scene.
 * Everything is procedural: no textures, no model files.
 */

const HEADER = /* glsl */ `#version 300 es
precision highp float;
const float TAU = 6.28318530718;
`;

/** Hash-driven rune glyphs: a 3×4 grid of strokes, each lit or dark. */
const RUNES = /* glsl */ `
float hash11(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
float rune(vec2 g, float seed) {
  vec2 cell = floor(g * vec2(3.0, 4.0));
  vec2 f = fract(g * vec2(3.0, 4.0));
  float id = cell.x + cell.y * 3.0;
  float on = step(0.42, hash11(seed * 17.0 + id));
  float horiz = step(0.5, hash11(seed * 5.0 + id * 2.3));
  float bar = mix(smoothstep(0.36, 0.16, abs(f.x - 0.5)), smoothstep(0.36, 0.16, abs(f.y - 0.5)), horiz);
  float inside = step(0.0, g.x) * step(g.x, 1.0) * step(0.0, g.y) * step(g.y, 1.0);
  return on * bar * inside;
}
`;

// ── Spirit Rings (instanced torus bands; the same program draws the glow halos) ──
export const RING_VS = HEADER + /* glsl */ `
layout(location = 0) in vec2 a_uv;
layout(location = 1) in vec4 i_shape;   // radius, height, half-width, half-thickness
layout(location = 2) in vec4 i_motion;  // tiltX, tiltZ, spin, phase
layout(location = 3) in vec4 i_colA;    // rgb, mode (0 bright, 1 dark, 2 dual)
layout(location = 4) in vec4 i_colB;    // rgb, tier index
uniform mat4 u_viewProj;
uniform vec2 u_offset;
uniform float u_time;
uniform float u_spread;
uniform float u_halo;
out vec3 v_normal;
out vec3 v_world;
out float v_u;
out float v_across;
flat out vec4 v_colA;
flat out vec4 v_colB;
void main() {
  float a = a_uv.x * TAU;
  float t = a_uv.y * TAU;
  float hw = i_shape.z * mix(1.0, 2.6, u_halo);
  float hh = i_shape.w * mix(1.0, 6.5, u_halo);
  float r = i_shape.x + hw * cos(t);
  vec3 p = vec3(cos(a) * r, hh * sin(t), sin(a) * r);
  vec3 n = normalize(vec3(cos(a) * cos(t) / hw, sin(t) / hh, sin(a) * cos(t) / hw));
  float wob = sin(u_time * 0.5 + i_motion.w) * 0.035;
  float cx = cos(i_motion.x + wob), sx = sin(i_motion.x + wob);
  float cz = cos(i_motion.y), sz = sin(i_motion.y);
  mat3 rot = mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0) * mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  p = rot * p;
  n = rot * n;
  p.y += i_shape.y * u_spread + sin(u_time * 0.9 + i_motion.w * 2.0) * 0.04;
  v_normal = n;
  v_world = p;
  v_u = a_uv.x + u_time * i_motion.z;
  v_across = cos(t);
  v_colA = i_colA;
  v_colB = i_colB;
  vec4 clip = u_viewProj * vec4(p, 1.0);
  clip.xy += u_offset * clip.w;
  gl_Position = clip;
}
`;

export const RING_FS = HEADER + RUNES + /* glsl */ `
in vec3 v_normal;
in vec3 v_world;
in float v_u;
in float v_across;
flat in vec4 v_colA;
flat in vec4 v_colB;
uniform vec3 u_eye;
uniform float u_time;
uniform float u_pulse;
uniform float u_halo;
uniform float u_intensity;
out vec4 outColor;
void main() {
  vec3 n = normalize(v_normal);
  if (!gl_FrontFacing) n = -n;
  vec3 vdir = normalize(u_eye - v_world);
  float facing = clamp(abs(dot(n, vdir)), 0.0, 1.0);
  float rim = pow(1.0 - facing, 2.5);
  float tier = v_colB.w;
  float mode = v_colA.w;
  float since = u_pulse - tier * 0.12;
  float flash = since > 0.0 ? exp(-since * 3.2) : 0.0;
  bool dark = mode > 0.5 && mode < 1.5;
  vec3 base = v_colA.rgb;
  if (mode > 1.5) base = mix(v_colA.rgb, v_colB.rgb, 0.5 + 0.5 * sin(v_u * 12.566 + u_time * 0.8));

  if (u_halo > 0.5) {
    vec3 hc = dark ? v_colB.rgb : base;
    // The dark ring keeps a thin crimson aura so its black body still reads as black.
    float g = pow(facing, 2.6) * (0.3 + flash * 0.9) * (dark ? 0.35 : 1.0);
    outColor = vec4(hc * g * u_intensity, 0.0);
    return;
  }

  float cf = v_u * 40.0;
  float cell = mod(floor(cf), 40.0);
  vec2 g = vec2((fract(cf) - 0.18) / 0.64, (v_across * 0.5 + 0.5 - 0.22) / 0.56);
  float r = rune(g, cell + tier * 37.0);
  float wave = pow(0.5 + 0.5 * sin(v_u * 12.566 - u_time * 1.7 + tier), 6.0);
  vec3 col;
  if (dark) {
    float edge = pow(1.0 - facing, 7.0);
    col = vec3(0.01, 0.008, 0.014) * (0.6 + facing) + v_colB.rgb * (edge * 2.4 + r * 0.7 + wave * 0.1 + flash * 0.9);
  } else {
    col = base * (0.42 + 0.5 * facing) + base * r * 0.85 + mix(base, vec3(1.0), 0.3) * wave * 0.45
        + base * rim * 0.8 + vec3(1.0) * flash * 0.7;
  }
  outColor = vec4(col * u_intensity, u_intensity);
}
`;

// ── Martial Soul aura (camera-facing billboard: spirit flame, light column, core) ──
export const AURA_VS = HEADER + /* glsl */ `
layout(location = 0) in vec2 a_pos;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec2 u_offset;
uniform vec3 u_center;
uniform vec2 u_size;
out vec2 v_uv;
void main() {
  vec4 vc = u_view * vec4(u_center, 1.0);
  vc.xy += a_pos * u_size;
  vec4 clip = u_proj * vc;
  clip.xy += u_offset * clip.w;
  v_uv = a_pos;
  gl_Position = clip;
}
`;

const NOISE = /* glsl */ `
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
`;

export const AURA_FS = HEADER + NOISE + /* glsl */ `
in vec2 v_uv;
uniform float u_time;
uniform float u_pulse;
uniform float u_intensity;
out vec4 outColor;
void main() {
  vec2 uv = v_uv;
  float n = fbm(vec2(uv.x * 2.2, uv.y * 1.6 - u_time * 0.7));
  float n2 = fbm(vec2(uv.x * 4.0 + 3.0, uv.y * 3.0 - u_time * 1.2));
  float body = smoothstep(1.0, 0.1, length(vec2(uv.x * (1.5 + 0.6 * (uv.y + 1.0)), uv.y * 0.95)));
  float flame = body * smoothstep(0.3, 0.9, n + n2 * 0.4 + (0.2 - abs(uv.x)) * 0.8);
  float column = exp(-abs(uv.x) * 11.0) * smoothstep(1.0, 0.0, abs(uv.y)) * (0.55 + 0.45 * n2);
  float core = exp(-length((uv - vec2(0.0, 0.08)) * vec2(1.0, 0.75)) * 5.5);
  float flash = exp(-max(u_pulse, 0.0) * 2.2);
  vec3 jade = vec3(0.02, 0.71, 0.83);
  vec3 gold = vec3(0.98, 0.70, 0.18);
  vec3 tint = mix(jade, gold, smoothstep(-0.4, 0.9, uv.y + n * 0.3));
  vec3 c = tint * flame * 0.5 + mix(jade, vec3(1.0), 0.5) * column * 0.5 + mix(gold, vec3(1.0), 0.45) * core * (0.5 + flash * 1.2);
  outColor = vec4(c * u_intensity, 0.0);
}
`;

// ── Soul formation under the rings (ground rune circle) ──
export const ARRAY_VS = HEADER + /* glsl */ `
layout(location = 0) in vec2 a_pos;
uniform mat4 u_viewProj;
uniform vec2 u_offset;
uniform float u_y;
uniform float u_radius;
out vec2 v_p;
void main() {
  v_p = a_pos;
  vec4 clip = u_viewProj * vec4(a_pos.x * u_radius, u_y, a_pos.y * u_radius, 1.0);
  clip.xy += u_offset * clip.w;
  gl_Position = clip;
}
`;

export const ARRAY_FS = HEADER + RUNES + /* glsl */ `
in vec2 v_p;
uniform float u_time;
uniform float u_pulse;
uniform float u_intensity;
out vec4 outColor;
float line(float d, float w) {
  float aa = fwidth(d) * 1.5;
  return 1.0 - smoothstep(w, w + aa, abs(d));
}
void main() {
  float r = length(v_p);
  if (r > 1.0) discard;
  float u = atan(v_p.y, v_p.x) / TAU + 0.5;
  float circles = line(r - 0.97, 0.004) + line(r - 0.86, 0.003) + line(r - 0.6, 0.003) + line(r - 0.5, 0.0025);
  float u1 = u + u_time * 0.02;
  float c1 = floor(u1 * 48.0);
  float runes1 = rune(vec2((fract(u1 * 48.0) - 0.15) / 0.7, (r - 0.875) / 0.08), mod(c1, 48.0));
  float u2 = u - u_time * 0.035;
  float c2 = floor(u2 * 28.0);
  float runes2 = rune(vec2((fract(u2 * 28.0) - 0.15) / 0.7, (r - 0.512) / 0.076), mod(c2, 28.0) + 91.0);
  float star = 0.0;
  for (int k = 0; k < 6; k++) {
    float ang = float(k) * TAU / 6.0 + u_time * 0.05;
    star += line(dot(v_p, vec2(cos(ang), sin(ang))) - 0.25, 0.0025);
  }
  star *= step(r, 0.5);
  float shock = u_pulse < 1.6 ? line(r - u_pulse * 0.75, 0.02) * (1.0 - u_pulse / 1.6) : 0.0;
  vec3 gold = vec3(0.98, 0.72, 0.2);
  vec3 jade = vec3(0.1, 0.8, 0.9);
  vec3 col = gold * (circles * 0.8 + star * 0.5) + jade * (runes1 * 0.7 + runes2 * 0.55) + vec3(1.0, 0.9, 0.6) * shock * 1.2;
  col += jade * 0.07 * (1.0 - r);
  outColor = vec4(col * smoothstep(1.0, 0.9, r) * u_intensity * 0.85, 0.0);
}
`;

// ── Qi particles (one draw call; motion is computed entirely on the GPU) ──
export const QI_VS = HEADER + /* glsl */ `
layout(location = 0) in vec4 a_seed;
uniform mat4 u_viewProj;
uniform vec2 u_offset;
uniform float u_time;
uniform float u_pulse;
uniform vec2 u_mouse;
uniform float u_pxScale;
uniform vec2 u_field;
uniform float u_spread;
out vec3 v_color;
out float v_alpha;
void main() {
  float H = u_field.y * 2.2;
  float speed = 0.10 + a_seed.y * 0.32;
  float life = fract(a_seed.w + u_time * speed / H);
  float y = (life - 0.5) * H;
  float dir = a_seed.z > 0.5 ? 1.0 : -1.0;
  float ang = a_seed.x * TAU + u_time * (0.10 + a_seed.y * 0.22) * dir + y * 0.35;
  float spread = mix(0.2, 1.0, pow(fract(a_seed.z * 7.13), 0.8));
  float rad = 0.3 + spread * u_field.x * 1.1;
  float burst = u_pulse < 4.0 ? (1.0 - exp(-u_pulse * 9.0)) * exp(-u_pulse * 1.4) : 0.0;
  rad *= 1.0 + burst * 0.6;
  vec3 p = vec3(cos(ang) * rad, y * u_spread * 0.9, sin(ang) * rad * 0.7);
  vec4 clip = u_viewProj * vec4(p, 1.0);
  clip.xy += u_offset * clip.w;
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - u_mouse;
  float l = length(d);
  ndc += d / max(l, 1e-4) * 0.07 * exp(-l * 6.0);
  clip.xy = ndc * clip.w;
  gl_Position = clip;
  v_alpha = smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.72, life) * (0.45 + 0.55 * a_seed.y);
  gl_PointSize = clamp((0.018 + a_seed.y * a_seed.y * 0.05) * u_pxScale / max(clip.w, 0.1), 1.0, 22.0);
  float hue = fract(a_seed.x * 3.7);
  v_color = hue < 0.55 ? vec3(0.35, 0.9, 1.0) : (hue < 0.85 ? vec3(1.0, 0.78, 0.32) : vec3(0.82, 0.58, 1.0));
}
`;

export const QI_FS = HEADER + /* glsl */ `
in vec3 v_color;
in float v_alpha;
uniform float u_intensity;
out vec4 outColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  outColor = vec4(v_color * a * a * v_alpha * u_intensity, 0.0);
}
`;
